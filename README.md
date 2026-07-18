# Kairis AI 🤖✨

Kairis AI is a premium, state-of-the-art AI assistant application powered by modern LLMs (Gemini & Mistral), Retrieval-Augmented Generation (RAG) using Pinecone, and real-time communication via Socket.io. It supports standard email authentication (with verification flow) as well as seamless Google OAuth login.

---

## 🚀 Tech Stack

### Frontend
* **Core**: [React](https://react.dev/) + [Vite](https://vite.dev/)
* **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
* **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/)
* **Routing**: [React Router](https://reactrouter.com/)
* **Icons**: [Lucide React](https://lucide.dev/)
* **Realtime**: [Socket.io Client](https://socket.io/docs/v4/client-api/)

### Backend
* **Runtime**: [Node.js](https://nodejs.org/) (ES Modules)
* **Framework**: [Express](https://expressjs.com/)
* **Database**: [MongoDB](https://www.mongodb.com/) (using [Mongoose](https://mongoosejs.com/))
* **Realtime Server**: [Socket.io](https://socket.io/)
* **Authentication**: [Passport.js](https://www.passportjs.org/) (Google OAuth 2.0 Strategy) & JWT (JSON Web Tokens)

### AI & Vector Databases (RAG)
* **Orchestration**: [LangChain](https://js.langchain.com/)
* **LLM Providers**: [Google Gemini GenAI](https://deepmind.google/technologies/gemini/) & [Mistral AI](https://mistral.ai/)
* **Vector Store**: [Pinecone Vector DB](https://www.pinecone.io/) (for context-aware document queries)
* **Search Tool**: [Tavily Search API](https://tavily.com/) (for real-time web search capabilities)

---

## 🌟 Key Features

1. **Secure & Versatile Auth Flow**:
   * Traditional email/password signup with automatic verification emails.
   * Single-click **Google OAuth Login** with automatic user provisioning.
   * Secure HTTP-only cookies designed to work cross-site in production.

2. **Real-time AI Chat**:
   * Interactive chat threads with instant replies.
   * Real-time updates and streaming powered by WebSocket protocols (Socket.io).
   * Fully customizable thread options (create, rename, delete).

3. **Smart Document Q&A (RAG)**:
   * Upload PDF documents up to 10MB.
   * Automatically split and index document chunks into Pinecone Vector Database using LangChain embeddings.
   * Ask questions directly about your uploaded documents.

4. **Premium Responsive UI**:
   * Gorgeous dark/light mode toggle with QR-scan-style theme transition animation.
   * Fully mobile-responsive sidebar, chat bubbles, and code block formatting.

---

## 📁 Project Structure

```
kairis-ai/
├── Backend/                # Express backend application
│   ├── src/
│   │   ├── config/         # DB config, app config
│   │   ├── controllers/    # Route controllers (Auth, Chat)
│   │   ├── middlewares/    # Authentication, Validation
│   │   ├── models/         # MongoDB Schemas (User, Chat, Message)
│   │   ├── routes/         # Express router endpoints
│   │   ├── services/       # Mailjet, Email Templates, AI services
│   │   └── sockets/        # Socket.io configurations
│   ├── server.js           # Server startup script
│   └── package.json
│
├── Frontend/               # Vite-React frontend application
│   ├── public/             # Static assets (Favicon, SEO Verification)
│   ├── src/
│   │   ├── app/            # Redux store configurations
│   │   ├── components/     # UI elements & custom loaders
│   │   ├── features/       # Feature domains (Auth, Chat)
│   │   ├── main.jsx        # App entrypoint
│   │   └── index.css       # Core stylesheet
│   ├── index.html          # HTML Shell
│   ├── vercel.json         # Vercel deployment configurations
│   └── package.json
└── README.md
```

---

## ⚙️ Configuration & Environment Variables

Create your environment files in their respective folders:

### Backend (`Backend/.env`)
```env
PORT=8000
NODE_ENV=development
MONGO_URI=your_mongodb_connection_uri
JWT_SECRET=your_jwt_signing_secret

# URL Configs
FRONTEND_URL=http://localhost:5173
SERVER_URL=http://localhost:8000

# Google OAuth
GOOGLE_OAUTH_CLIENT_ID=your_google_oauth_client_id
GOOGLE_OAUTH_CLIENT_SECRET=your_google_oauth_client_secret
GOOGLE_CALLBACK_URL=http://localhost:8000/api/auth/google/callback

# Mailjet
MAILJET_API_KEY=your_mailjet_api_key
MAILJET_API_SECRET=your_mailjet_api_secret
MAILJET_SENDER_EMAIL=your_verified_sender_email

# AI & Vector DB keys
GEMINI_API_KEY=your_google_gemini_api_key
MISTRAL_API_KEY=your_mistral_api_key
TAVILY_API_KEY=your_tavily_api_key
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX=kairisa-ai-rag
```

### Frontend (`Frontend/.env`)
```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## 🛠️ How to Run Locally

### 1. Clone & Set Up Backend
```bash
cd Backend
npm install
# Set up your .env file
npm run dev
```

### 2. Set Up Frontend
```bash
cd ../Frontend
npm install
# Set up your .env file
npm run dev
```

The frontend will run at `http://localhost:5173` and communicate with the backend running at `http://localhost:8000`.

---

## 🚀 Deployed Environments
* **Frontend Hosting**: Vercel (e.g. `https://kairis-ai.vercel.app`)
* **Backend Hosting**: Render (e.g. `https://kairis-ai.onrender.com`)
