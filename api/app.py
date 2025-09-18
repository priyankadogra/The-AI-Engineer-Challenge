# Import required FastAPI components for building the API
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
# Import Pydantic for data validation and settings management
from pydantic import BaseModel
# Import OpenAI client for interacting with OpenAI's API
from openai import OpenAI
import os
import asyncio
import io
from typing import Optional, List, Dict
# Import PDF processing libraries
import PyPDF2
import tempfile
import sys
import json

# Add the parent directory to the Python path to import aimakerspace
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Import aimakerspace modules
from aimakerspace.vectordatabase import VectorDatabase
from aimakerspace.text_utils import CharacterTextSplitter
from aimakerspace.openai_utils.embedding import EmbeddingModel

# Initialize FastAPI application with a title
app = FastAPI(title="OpenAI Chat API")

# Global vector database instance for RAG
vector_db: Optional[VectorDatabase] = None
text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

# Store PDF metadata
pdf_metadata: Dict[str, Dict] = {}

# Configure CORS (Cross-Origin Resource Sharing) middleware
# This allows the API to be accessed from different domains/origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows requests from any origin
    allow_credentials=True,  # Allows cookies to be included in requests
    allow_methods=["*"],  # Allows all HTTP methods (GET, POST, etc.)
    allow_headers=["*"],  # Allows all headers in requests
)

# Define the data model for chat requests using Pydantic
# This ensures incoming request data is properly validated
class ChatRequest(BaseModel):
    developer_message: str  # Message from the developer/system
    user_message: str      # Message from the user
    model: Optional[str] = "gpt-4.1-mini"  # Optional model selection with default
    api_key: str          # OpenAI API key for authentication
    pdf_content: Optional[str] = None  # Optional PDF content for context

# Define the data model for PDF upload response
class PDFUploadResponse(BaseModel):
    success: bool
    message: str
    content: Optional[str] = None
    filename: Optional[str] = None
    chunks_indexed: Optional[int] = None

# Define the data model for RAG search results
class RAGSearchResult(BaseModel):
    chunk_text: str
    similarity_score: float

class RAGResponse(BaseModel):
    success: bool
    message: str
    results: List[RAGSearchResult] = []
    query: Optional[str] = None

# Define the data model for RAG search requests
class RAGSearchRequest(BaseModel):
    query: str
    k: int = 5
    api_key: str = ""

# Define the main chat endpoint that handles POST requests
@app.post("/api/chat")
async def chat(request: ChatRequest):
    try:
        # Check if we should use mock responses (for testing without API key)
        use_mock = request.api_key == "test" or request.api_key == ""
        
        if use_mock:
            # Create a mock streaming response for testing
            async def generate_mock():
                mock_responses = [
                    "Hello! I'm a mock AI assistant. ",
                    "I can see you're testing the application. ",
                    "This is a simulated response that streams word by word. ",
                    "The frontend is working correctly! ",
                    "You can replace this with a real OpenAI API key to get actual AI responses. ",
                    "Thanks for testing the AI Engineer Challenge! 🚀"
                ]
                
                for response in mock_responses:
                    # Simulate streaming by yielding words one by one
                    words = response.split()
                    for word in words:
                        yield word + " "
                        await asyncio.sleep(0.1)  # Small delay to simulate streaming
                    yield "\n\n"
                
            return StreamingResponse(generate_mock(), media_type="text/plain")
        
        # Initialize OpenAI client with the provided API key
        client = OpenAI(api_key=request.api_key)
        
        # Create an async generator function for streaming responses
        async def generate():
            global vector_db
            
            # Prepare messages with optional RAG context
            messages = [
                {"role": "developer", "content": request.developer_message}
            ]
            
            # If we have a vector database, perform RAG search
            if vector_db:
                try:
                    # Ensure API key is set for embedding model
                    if request.api_key and request.api_key != "test":
                        os.environ['OPENAI_API_KEY'] = request.api_key
                    
                    # Search for relevant chunks using the user's message
                    search_results = vector_db.search_by_text(request.user_message, k=3)
                    
                    if search_results:
                        # Combine the most relevant chunks
                        relevant_chunks = [result[0] for result in search_results]
                        context = "\n\n".join(relevant_chunks)
                        
                        rag_context = f"""Based on the following relevant information from the uploaded document:

{context}

Please answer the user's question. If the information is not sufficient to answer the question, say so clearly."""
                        
                        messages.append({"role": "system", "content": rag_context})
                except Exception as rag_error:
                    print(f"RAG search error: {rag_error}")
                    # Continue without RAG if there's an error
            elif request.pdf_content:
                # Fallback to old method if RAG is not available
                pdf_context = f"Here is the content from the uploaded PDF document:\n\n{request.pdf_content}\n\nBased on this document, please answer the following question:"
                messages.append({"role": "system", "content": pdf_context})
            
            messages.append({"role": "user", "content": request.user_message})
            
            # Create a streaming chat completion request
            stream = client.chat.completions.create(
                model=request.model,
                messages=messages,
                stream=True  # Enable streaming response
            )
            
            # Yield each chunk of the response as it becomes available
            for chunk in stream:
                if chunk.choices[0].delta.content is not None:
                    yield chunk.choices[0].delta.content

        # Return a streaming response to the client
        return StreamingResponse(generate(), media_type="text/plain")
    
    except Exception as e:
        # Handle any errors that occur during processing
        raise HTTPException(status_code=500, detail=str(e))

# Define PDF upload endpoint with RAG indexing
@app.post("/api/upload-pdf", response_model=PDFUploadResponse)
async def upload_pdf(file: UploadFile = File(...), api_key: str = Form("")):
    global vector_db, pdf_metadata
    
    try:
        # Validate file type
        if not file.filename.lower().endswith('.pdf'):
            return PDFUploadResponse(
                success=False,
                message="Please upload a PDF file only",
                filename=file.filename
            )
        
        # Read the uploaded file
        file_content = await file.read()
        
        # Create a temporary file to process the PDF
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as tmp_file:
            tmp_file.write(file_content)
            tmp_file_path = tmp_file.name
        
        try:
            # Extract text from PDF using PyPDF2
            pdf_text = ""
            with open(tmp_file_path, 'rb') as pdf_file:
                pdf_reader = PyPDF2.PdfReader(pdf_file)
                
                # Extract text from all pages
                for page_num in range(len(pdf_reader.pages)):
                    page = pdf_reader.pages[page_num]
                    pdf_text += page.extract_text() + "\n"
            
            # Clean up temporary file
            os.unlink(tmp_file_path)
            
            # Check if we extracted any text
            if not pdf_text.strip():
                return PDFUploadResponse(
                    success=False,
                    message="Could not extract text from the PDF. The file might be image-based or corrupted.",
                    filename=file.filename
                )
            
            # Split the PDF text into chunks for vector indexing
            chunks = text_splitter.split(pdf_text)
            
            # Filter out very short chunks
            chunks = [chunk.strip() for chunk in chunks if len(chunk.strip()) > 50]
            
            if not chunks:
                return PDFUploadResponse(
                    success=False,
                    message="PDF content could not be processed into meaningful chunks.",
                    filename=file.filename
                )
            
            # Initialize vector database with embedding model
            try:
                # Use provided API key or try to get from environment
                if not api_key or api_key.strip() == "" or api_key == "test":
                    return PDFUploadResponse(
                        success=False,
                        message="Please provide a valid OpenAI API key to index the PDF.",
                        filename=file.filename
                    )
                
                # Set the API key in environment for the embedding model
                os.environ['OPENAI_API_KEY'] = api_key
                
                # Initialize or reuse existing vector database
                if vector_db is None:
                    embedding_model = EmbeddingModel()
                    vector_db = VectorDatabase(embedding_model=embedding_model)
                
                # Add filename prefix to chunks to identify source
                prefixed_chunks = [f"[{file.filename}] {chunk}" for chunk in chunks]
                
                # Index the PDF chunks asynchronously (adds to existing database)
                embeddings = await vector_db.embedding_model.async_get_embeddings(prefixed_chunks)
                for chunk, embedding in zip(prefixed_chunks, embeddings):
                    vector_db.insert(chunk, embedding)
                
                # Store PDF metadata
                pdf_metadata[file.filename] = {
                    "chunks_count": len(chunks),
                    "total_length": len(pdf_text),
                    "indexed_at": asyncio.get_event_loop().time()
                }
                
                return PDFUploadResponse(
                    success=True,
                    message=f"Successfully indexed PDF: {file.filename} with {len(chunks)} chunks",
                    content=pdf_text[:1000] + "..." if len(pdf_text) > 1000 else pdf_text,
                    filename=file.filename,
                    chunks_indexed=len(chunks)
                )
                
            except Exception as embedding_error:
                return PDFUploadResponse(
                    success=False,
                    message=f"Error creating embeddings: {str(embedding_error)}. Please check your API key.",
                    filename=file.filename
                )
            
        except Exception as pdf_error:
            # Clean up temporary file in case of error
            if os.path.exists(tmp_file_path):
                os.unlink(tmp_file_path)
            
            return PDFUploadResponse(
                success=False,
                message=f"Error processing PDF: {str(pdf_error)}",
                filename=file.filename
            )
    
    except Exception as e:
        return PDFUploadResponse(
            success=False,
            message=f"Error uploading file: {str(e)}",
            filename=file.filename if file else None
        )

# Define RAG search endpoint
@app.post("/api/search", response_model=RAGResponse)
async def search_documents(request: RAGSearchRequest):
    global vector_db
    
    try:
        if not vector_db:
            return RAGResponse(
                success=False,
                message="No documents have been indexed yet. Please upload a PDF first.",
                query=request.query
            )
        
        # Use provided API key if available
        if request.api_key and request.api_key != "test":
            os.environ['OPENAI_API_KEY'] = request.api_key
        
        # Perform semantic search
        search_results = vector_db.search_by_text(request.query, k=request.k)
        
        # Convert results to response format
        rag_results = [
            RAGSearchResult(
                chunk_text=result[0],
                similarity_score=result[1]
            )
            for result in search_results
        ]
        
        return RAGResponse(
            success=True,
            message=f"Found {len(rag_results)} relevant chunks",
            results=rag_results,
            query=request.query
        )
        
    except Exception as e:
        return RAGResponse(
            success=False,
            message=f"Search error: {str(e)}",
            query=request.query
        )

# Define endpoint to get indexed PDFs info
@app.get("/api/indexed-pdfs")
async def get_indexed_pdfs():
    global pdf_metadata, vector_db
    
    total_chunks = sum(metadata["chunks_count"] for metadata in pdf_metadata.values())
    
    return {
        "indexed_pdfs": list(pdf_metadata.keys()),
        "pdf_details": pdf_metadata,
        "total_chunks": total_chunks,
        "vector_db_active": vector_db is not None
    }

# Define a health check endpoint to verify API status
@app.get("/api/health")
async def health_check():
    return {"status": "ok"}

# Entry point for running the application directly
if __name__ == "__main__":
    import uvicorn
    # Start the server on all network interfaces (0.0.0.0) on port 8000
    uvicorn.run(app, host="0.0.0.0", port=8000)
