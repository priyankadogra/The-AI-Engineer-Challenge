frontend - 
cd /Users/priyankadogra/workspace/aimakerspace/code/The-AI-Engineer-Challenge
cd frontend
npm run dev

backend
cd /Users/priyankadogra/workspace/aimakerspace/code/The-AI-Engineer-Challenge
cd api
source ../venv/bin/activate
python3 -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload

stop- 
# Kill all running processes
pkill -f uvicorn
pkill -f "npm run dev"

troubleshooting -
🔧 Troubleshooting:
If ports are busy: lsof -ti:3000,8000 | xargs kill -9
If Python not found: Use python3 instead of python
If npm issues: Run npm install in the frontend folder first
Your emotion-aware AI chat app is now ready to use! 🎉🤖


shell script
#!/bin/bash
cd /Users/priyankadogra/workspace/aimakerspace/code/The-AI-Engineer-Challenge

echo "Starting backend..."
cd api && source ../venv/bin/activate && python3 -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload &

echo "Starting frontend..."
cd ../frontend && npm run dev &

echo "Services starting... Visit http://localhost:3000 in your browser!"