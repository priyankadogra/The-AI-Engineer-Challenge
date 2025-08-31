# AI Engineer Challenge - Frontend

A modern, responsive chat interface built with Next.js and Tailwind CSS that integrates with the FastAPI backend for LLM-powered conversations.

## 🚀 Features

- **Modern Chat Interface**: Clean, intuitive design with real-time streaming responses
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Streaming Responses**: See AI responses appear in real-time as they're generated
- **Customizable System Prompts**: Configure the AI's behavior through developer messages
- **Secure API Key Input**: Password-style input for sensitive information
- **Beautiful UI**: Gradient backgrounds, smooth animations, and modern styling

## 🛠️ Tech Stack

- **Next.js 14**: React framework with app directory
- **TypeScript**: Type-safe development
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful, customizable icons
- **FastAPI Integration**: Seamless backend communication

## 📋 Prerequisites

Before running this frontend, make sure you have:

1. **Node.js 18+** installed on your machine
2. **FastAPI Backend** running on `http://localhost:8000`
3. **OpenAI API Key** for GPT-4.1-mini access

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Start the Development Server

```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

### 3. Configure Your API Key

1. Click the **Settings** button (gear icon) in the top-right corner
2. Enter your **OpenAI API Key** in the password field
3. Optionally customize the **Developer Message** (system prompt)
4. Click outside the settings panel to save

### 4. Start Chatting!

Type your message in the input field and press Enter or click Send to start a conversation with the AI.

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Project Structure

```
frontend/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles and Tailwind
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Main chat interface
├── package.json           # Dependencies and scripts
├── tailwind.config.js     # Tailwind CSS configuration
├── tsconfig.json          # TypeScript configuration
└── next.config.js         # Next.js configuration
```

## 🌐 Deployment

### Deploy to Vercel

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy**:
   ```bash
   vercel
   ```

3. **Follow the prompts** to connect your GitHub repository and deploy

### Environment Variables

For production deployment, you may want to set environment variables:

- `NEXT_PUBLIC_API_URL`: Your FastAPI backend URL (if different from localhost)

## 🔗 Backend Integration

This frontend is designed to work with the FastAPI backend in the `/api` directory. The backend provides:

- **Chat Endpoint**: `/api/chat` for LLM conversations
- **Health Check**: `/api/health` for service status
- **CORS Support**: Configured to allow frontend requests

## 🎨 Customization

### Colors and Themes

The application uses a custom color palette defined in `tailwind.config.js`:

- **Primary Colors**: Blue tones for main UI elements
- **Secondary Colors**: Purple tones for accents
- **Neutral Colors**: Slate tones for text and backgrounds

### Styling

Custom CSS classes are defined in `globals.css`:

- `.chat-bubble` - Chat message styling
- `.input-field` - Form input styling
- `.btn-primary` - Primary button styling
- `.btn-secondary` - Secondary button styling

## 🐛 Troubleshooting

### Common Issues

1. **Backend Connection Error**: Ensure your FastAPI backend is running on port 8000
2. **API Key Issues**: Verify your OpenAI API key is valid and has sufficient credits
3. **CORS Errors**: Check that the backend CORS middleware is properly configured

### Getting Help

If you encounter issues:

1. Check the browser console for error messages
2. Verify your backend is running and accessible
3. Ensure all dependencies are properly installed

## 📱 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 Contributing

This is part of the AI Engineer Challenge. Feel free to:

- Improve the UI/UX
- Add new features
- Optimize performance
- Fix bugs

## 📄 License

This project is part of the AI Engineer Challenge by AI Maker Space.