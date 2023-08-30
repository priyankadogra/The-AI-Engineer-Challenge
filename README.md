# 🧑‍💻 What is [AI Engineering](https://maven.com/aimakerspace/ai-eng-bootcamp)?

AI Engineering refers to the industry-relevant skills that data science and engineering teams need to successfully **build, deploy, operate, and improve Large Language Model (LLM) applications in production environments**.  

In practice, as of the Fall of 2025, this requires understanding both prototyping and production deployments in the following ways.

During the *prototyping* phase, Prompt Engineering, Retrieval Augmented Generation (RAG), Agents, and Fine-Tuning are all necessary tools to be able to understand and leverage. Prototyping includes:
1. Building RAG Applications
2. Building with Agent and Multi-Agent Frameworks
3. Deploying LLM Prototype Applications to Users

When *productionizing* LLM application prototypes, there are many important aspects ensuring helpful, harmless, honest, reliable, and scalable solutions for your customers or stakeholders. Productionizing includes:
1. Evaluating RAG and Agent Applications
2. Improving Search and Retrieval Pipelines for Production
3. Improving Agent and Multi-Agent Applications
4. Monitoring Production KPIs for LLM Applications
5. Setting up Production Endpoints for Open-Source LLMs and Embedding Models
6. Building LLM Applications with Scalable, Production-Grade Components
7. Understanding and Building with Agent Protocols

[The AI Engineering Bootcamp](https://aimakerspace.io/the-ai-engineering-bootcamp/) is an ever-evolving course that keeps pace with the industry.

If you're serious about becoming an AI-Assisted developer, you're in the right place.

With that, it's time to jump in and [🛣️ Get Started](https://www.notion.so/The-AI-Engineering-Bootcamp-Cohort-8-Home-Page-263cd547af3d80fc9986f25582348429?source=copy_link#263cd547af3d8115bfacfaba1915befa).


# 🏆 **Grading and Certification**

To become **[AI-Makerspace Certified](https://aimakerspace.io/certification/)**, which will open you up to additional opportunities for full and part-time work within our community and network, you must:

1. Complete all required project assignments, including weekly videos (Weeks 1-5, 7-8)
2. Complete the Certification Challenge, including a Demo video (Week 6)
3. Compete with other cohort members with a live pitch and Demd of your project during Demo Day Semifinals (November 11, 2025)
4. If you are selected for Demo Day by your peers, you must present live on November 13, 2025. Otherwise, you will be required to submit your own YouTube-worthy Demo video
5. Receive at least an 85% total grade in the course.

If you do not complete the above requirements or maintain a high-quality standard of work, you may still be eligible for a *certificate of completion* if you miss no more than 2 live sessions.

# 📚 About

This GitHub repository is your gateway to mastering the art of AI Engineering.  ***All assignments for the course will be released here for your building, shipping, and sharing adventures!***

# 🙏 Contributions

We believe in the power of collaboration. Contributions, ideas, and feedback are highly encouraged! Let's build the ultimate resource for AI Engineering together.

Please to reach out with any questions or suggestions. 

Happy coding! 🚀🚀🚀

# Beyond-ChatGPT

Chainlit App using Python streaming for Level 0 MLOps

LLM Application with Chainlit, Docker, and Huggingface Spaces
In this guide, we'll walk you through the steps to create a Language Learning Model (LLM) application using Chainlit, then containerize it using Docker, and finally deploy it on Huggingface Spaces.

Prerequisites
A GitHub account
Docker installed on your local machine
A Huggingface Spaces account


### Building our App
Clone [this](https://github.com/AI-Maker-Space/Beyond-ChatGPT/tree/main) repo.

``` bash
git clone https://github.com/AI-Maker-Space/Beyond-ChatGPT.git
```

Navigate inside this repo
```
cd Beyond-ChatGPT
```

Install the packages required for this python envirnoment in `requirements.txt`.
```
pip install -r requirements.txt
```

Open your `.env` file. Replace the `###` in your `.env` file with your OpenAI Key and save the file.
```
OPENAI_API_KEY=sk-###
```

Let's try deploying it locally. Make sure you're in the python environment where you installed Chainlit and OpenAI.

Run the app using Chainlit

```
chainlit run app.py -w
```

Great work! Let's see if we can interact with our chatbot.

Time to throw it into a docker container a prepare it for shipping

Build the Docker image. We'll tag our image as `llm-app` using the `-t` parameter. The `.` at the end means we want all of the files in our current directory to be added to our image.
``` bash
docker build -t llm-app .
```

Run and test the Docker image locally using the `run` command. The `-p`parameter connects our **host port #** to the left of the `:` to our **container port #** on the right.
``` bash
docker run -p 7860:7860 llm-app
```

Visit http://localhost:7860 in your browser to see if the app runs correctly.

Great! Time to ship!

### Deploy to Huggingface Spaces

Make sure you're logged into Huggingface Spaces CLI

``` bash
huggingface-cli login
```

Follow the prompts to authenticate.


Deploy to Huggingface Spaces


Create a new Huggingface Space

- Owner: Your username
- Space Name: `llm-app`
- License: `Openrail`
- Select the Space SDK: `Docker`
- Docker Template: `Blank`
- Space Hardware: `CPU basic - 2 vCPU - 16 GB - Free`
- Repo type: `Public`



Deploying on Huggingface Spaces using a custom Docker image involves using their web interface. Go to Huggingface Spaces and create a new space, then set it up to use your Docker image from the Huggingface Container Registry.

Access the Application

Once deployed, access your app at:

ruby
Copy code
https://huggingface.co/spaces/your-username/llm-app
Conclusion
You've successfully created an LLM application with Chainlit, containerized it with Docker, and deployed it on Huggingface Spaces. Visit the link to interact with your deployed application.

Please refer to the [LLMOps Dev Environment](https://github.com/AI-Maker-Space/LLMOps-Dev-101/)https://github.com/AI-Maker-Space/LLMOps-Dev-101/ for instructions.
