'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Settings, Sparkles, Upload, FileText, X } from 'lucide-react'

interface Message {
  id: string
  role: 'user' | 'ai'
  content: string
  timestamp: Date
}

type Emotion = 'neutral' | 'happy' | 'sad' | 'angry'

interface PDFUpload {
  filename: string
  content: string
}

interface IndexedPDFsResponse {
  indexed_pdfs: string[]
  pdf_details: Record<string, { chunks_count: number; total_length: number; indexed_at: number }>
  total_chunks: number
  vector_db_active: boolean
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [developerMessage, setDeveloperMessage] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [selectedEmotion, setSelectedEmotion] = useState<Emotion>('neutral')
  const [isLoading, setIsLoading] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [uploadedPDF, setUploadedPDF] = useState<PDFUpload | null>(null)
  const [indexedPDFs, setIndexedPDFs] = useState<IndexedPDFsResponse | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Load indexed PDFs on component mount
    fetchIndexedPDFs()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!inputMessage.trim() || !apiKey.trim()) {
      alert('Please enter both a message and your OpenAI API key')
      return
    }

    // Create emotion-prefixed message
    const emotionPrefix = selectedEmotion !== 'neutral' ? `[${selectedEmotion.toUpperCase()}] ` : ''
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: `${emotionPrefix}${inputMessage}`,
      timestamp: new Date()
    }

    // Create emotion-aware system prompt
    const getEmotionSystemPrompt = (emotion: Emotion, basePrompt: string) => {
      const emotionInstructions = {
        happy: "Respond in a cheerful, upbeat, and positive manner. Use enthusiastic language and emojis when appropriate. Match the user's happy mood.",
        sad: "Respond with sadness. Don't be too wordy. Could be a bit grumbly.",
        angry: "Response could be a little bit harsh but not to the extent it would be indecent or hurt feelings. Talk like how a child would talk when it's angry.",
        neutral: "Respond in a balanced, professional, and helpful manner."
      }
      
      const emotionInstruction = emotionInstructions[emotion]
      return `${basePrompt}\n\nIMPORTANT: The user's message includes an emotion tag [${emotion.toUpperCase()}]. ${emotionInstruction}`
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = inputMessage
    setInputMessage('')
    setIsLoading(true)

    try {
      const emotionAwarePrompt = getEmotionSystemPrompt(selectedEmotion, developerMessage || 'You are a helpful AI assistant.')
      console.log('Sending request to /api/chat with:', {
        developer_message: emotionAwarePrompt,
        user_message: `${emotionPrefix}${currentInput}`,
        api_key: apiKey ? '***' : 'MISSING',
        model: 'gpt-4.1-mini',
        emotion: selectedEmotion
      })

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          developer_message: getEmotionSystemPrompt(selectedEmotion, developerMessage || 'You are a helpful AI assistant.'),
          user_message: `${emotionPrefix}${currentInput}`,
          api_key: apiKey,
          model: 'gpt-4.1-mini',
          pdf_content: uploadedPDF?.content || null
        }),
      })

      console.log('Response status:', response.status)
      console.log('Response headers:', response.headers)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      let aiResponse = ''
      const aiMessageId = `ai-${Date.now()}`
      const aiMessage: Message = {
        id: aiMessageId,
        role: 'ai',
        content: '',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = new TextDecoder().decode(value)
        aiResponse += chunk
        console.log('Received chunk:', chunk)
        console.log('Current AI response:', aiResponse)

        setMessages(prev => 
          prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, content: aiResponse }
              : msg
          )
        )
      }

    } catch (error) {
      console.error('Error:', error)
      const errorMessage: Message = {
        id: `error-${Date.now()}`,
        role: 'ai',
        content: 'Sorry, I encountered an error. Please check your API key and try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      alert('Please upload a PDF file only')
      return
    }

    if (!apiKey || apiKey.trim() === '' || apiKey === 'test') {
      alert('Please enter a valid OpenAI API key in the settings before uploading a PDF')
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('api_key', apiKey || 'test')

      const response = await fetch('/api/upload-pdf', {
        method: 'POST',
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        setUploadedPDF({
          filename: result.filename,
          content: result.content
        })
        const chunksMessage = result.chunks_indexed ? ` (${result.chunks_indexed} chunks indexed)` : ''
        alert(`Successfully uploaded: ${result.filename}${chunksMessage}`)
        
        // Fetch updated list of indexed PDFs
        await fetchIndexedPDFs()
      } else {
        alert(`Upload failed: ${result.message}`)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload PDF. Please try again.')
    } finally {
      setIsUploading(false)
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const fetchIndexedPDFs = async () => {
    try {
      const response = await fetch('/api/indexed-pdfs')
      if (response.ok) {
        const data = await response.json()
        setIndexedPDFs(data)
      }
    } catch (error) {
      console.error('Error fetching indexed PDFs:', error)
    }
  }

  const removePDF = () => {
    setUploadedPDF(null)
    setIndexedPDFs(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">AI Engineer Challenge</h1>
              <p className="text-sm text-slate-600">LLM Chat Application</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* PDF Upload Button */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".pdf"
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title={apiKey && apiKey !== 'test' ? "Upload PDF for RAG indexing" : "Upload PDF (API key required)"}
            >
              <Upload className={`w-5 h-5 ${isUploading ? 'text-blue-500 animate-spin' : apiKey && apiKey !== 'test' ? 'text-slate-600' : 'text-slate-400'}`} />
            </button>
            
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5 text-slate-600" />
            </button>
            <button
              onClick={clearChat}
              className="btn-secondary text-sm"
            >
              Clear Chat
            </button>
          </div>
        </div>
      </header>

      {/* PDF Status Panel */}
      {indexedPDFs && indexedPDFs.indexed_pdfs.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-200 p-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  📚 RAG-Indexed: {indexedPDFs.indexed_pdfs.length} PDF{indexedPDFs.indexed_pdfs.length !== 1 ? 's' : ''}
                </p>
                <p className="text-xs text-blue-700">
                  {indexedPDFs.total_chunks} chunks ready for semantic search
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Files: {indexedPDFs.indexed_pdfs.join(', ')}
                </p>
              </div>
            </div>
            <button
              onClick={removePDF}
              className="p-1 hover:bg-blue-200 rounded-lg transition-colors"
              title="Clear all PDFs"
            >
              <X className="w-4 h-4 text-blue-600" />
            </button>
          </div>
        </div>
      )}

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-white border-b border-slate-200 p-4">
          <div className="max-w-6xl mx-auto space-y-4">
            <h3 className="font-semibold text-slate-900">Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Developer Message (System Prompt)
                </label>
                <input
                  type="text"
                  value={developerMessage}
                  onChange={(e) => setDeveloperMessage(e.target.value)}
                  placeholder="You are a helpful AI assistant..."
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Emotion
                </label>
                <select
                  value={selectedEmotion}
                  onChange={(e) => setSelectedEmotion(e.target.value as Emotion)}
                  className="input-field"
                >
                  <option value="neutral">😐 Neutral</option>
                  <option value="happy">😊 Happy</option>
                  <option value="sad">😢 Sad</option>
                  <option value="angry">😠 Angry</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Area */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 h-[600px] flex flex-col">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-primary-100 to-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bot className="w-8 h-8 text-primary-600" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Welcome to AI Engineer Challenge! 🚀
                </h3>
                <p className="text-slate-600 max-w-md mx-auto">
                  Start a conversation with the AI by typing a message below. 
                  Make sure to configure your OpenAI API key in the settings first.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'ai' && (
                    <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <div className={`chat-bubble ${
                    message.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-ai'
                  }`}>
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs opacity-70 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  
                  {message.role === 'user' && (
                    <div className="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              ))
            )}
            
            {isLoading && (
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="chat-bubble chat-bubble-ai">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <div className="border-t border-slate-200 p-6">
            <div className="flex items-center space-x-3 mb-3">
              <span className="text-sm text-slate-600">Current emotion:</span>
              <span className="text-lg">
                {selectedEmotion === 'neutral' && '😐'}
                {selectedEmotion === 'happy' && '😊'}
                {selectedEmotion === 'sad' && '😢'}
                {selectedEmotion === 'angry' && '😠'}
              </span>
              <span className="text-sm font-medium text-slate-700 capitalize">
                {selectedEmotion}
              </span>
              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className="text-xs text-blue-600 hover:text-blue-800 underline"
              >
                Change
              </button>
            </div>
            <form onSubmit={handleSubmit} className="flex space-x-4">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Type your message here..."
                className="input-field flex-1"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputMessage.trim()}
                className="btn-primary flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  )
}
