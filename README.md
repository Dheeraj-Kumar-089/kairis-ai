# Kairis AI 

Kairis AI is a premium, state-of-the-art AI assistant application powered by modern LLMs (Gemini, Mistral, and Llama 3), Retrieval-Augmented Generation (RAG) using Pinecone, and real-time communication via Socket.io. It supports standard email authentication (with verification flow) as well as seamless Google OAuth login.

---

## 🚀 Tech Stack

### Frontend
* **Core**: [React](https://react.dev/) + [Vite](https://vite.dev/)
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
* **Cloud Storage**: [ImageKit.io](https://imagekit.io/)

### AI & Vector Databases (RAG)
* **Orchestration**: [LangChain](https://js.langchain.com/)
* **LLM Providers**: Google Gemini GenAI, Mistral AI, and Llama 3 (via Groq/fallback endpoints)
* **Vector Store**: [Pinecone Vector DB](https://www.pinecone.io/) (for context-aware document queries)
* **Search Tool**: [Tavily Search API](https://tavily.com/) (for real-time web search capabilities)

---

## 🌟 Key Features

### 1. Secure & Versatile Auth Flow
* Traditional email/password signup with automatic verification emails
* Seamless **production email verification redirect** returning users directly to the frontend with custom UI status banners (`verified=true` / error messaging).
* Single-click **Google OAuth Login** with automatic user provisioning.
* Secure HTTP-only cookies designed to work cross-site in production.

### 2. Advanced Multi-File Upload & Lightbox Preview
* **Staged Attachments**: Stage up to 5 images or PDFs in single prompt.
* **Upload Limits**: Limits uploads to a maximum of 5 MB per file and 15 MB in total per prompt.
* **Fullscreen Lightbox**: Click any attachment thumbnail to open a fullscreen lightbox overlay rendered outside viewport constraints via **React Portals** (`createPortal`).

### 3. Context-Aware RAG (Vector DB)
* **Real-time Web Search Integration**: Uses Tavily Search API for up-to-date web answers when context requires it.

### 4. Voice Prompting
* Integrated fast voice prompt input utilizing the **Web Speech API** for hands-free queries.

### 5. Premium Responsive UI & Production Stability
* Fully compliant with React Rules of Hooks to prevent unexpected runtime errors across state transitions.
* Fully mobile-responsive layouts with collapsable sidebars.

---

## 📁 Project Structure

```
kairis-ai/
├── Backend/                # Express backend application
│   ├── src/
│   │   ├── config/         # DB config, app config
│   │   ├── controllers/    # Route controllers (Auth, Chat)
│   │   ├── middlewares/    # Authentication, Validation, Rate Limiter
│   │   ├── models/         # MongoDB Schemas (User, Chat, Message)
│   │   ├── routes/         # Express router endpoints
│   │   ├── services/       # Mailjet, Email Templates, AI/RAG services
│   │   └── sockets/        # Socket.io configurations
│   ├── server.js           # Server startup script
│   └── package.json
│
├── Frontend/               # Vite-React frontend application
│   ├── public/             # Static assets (Favicon, SEO Verification)
│   ├── src/
│   │   ├── app/            # Redux store configurations
│   │   ├── components/     # UI elements & custom loaders
│   │   ├── features/       # Feature domains (Auth, Chat, Landing)
│   │   ├── main.jsx        # App entrypoint
│   │   └── index.css       # Core stylesheet
│   ├── index.html          # HTML Shell
│   ├── vercel.json         # Vercel deployment configurations
│   └── package.json
└── README.md
```

