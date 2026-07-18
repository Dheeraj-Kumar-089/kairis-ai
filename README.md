# Kairis AI 🤖✨

Kairis AI is a premium, state-of-the-art AI assistant application powered by modern LLMs (Gemini, Mistral, and Llama 3), Retrieval-Augmented Generation (RAG) using Pinecone, and real-time communication via Socket.io. It supports standard email authentication (with verification flow) as well as seamless Google OAuth login.

---

## 🚀 Tech Stack

### Frontend
* **Core**: [React](https://react.dev/) + [Vite](https://vite.dev/)
* **State Management**: [Redux Toolkit](https://redux-toolkit.js.org/)
* **Routing**: [React Router](https://reactrouter.com/)
* **Icons**: [Lucide React](https://lucide.dev/)
* **Realtime**: [Socket.io Client](https://socket.io/docs/v4/client-api/)
* **Animations**: [Framer Motion](https://www.framer.com/motion/)

### Backend
* **Runtime**: [Node.js](https://nodejs.org/) (ES Modules)
* **Framework**: [Express](https://expressjs.com/)
* **Database**: [MongoDB](https://www.mongodb.com/) (using [Mongoose](https://mongoosejs.com/))
* **Realtime Server**: [Socket.io](https://socket.io/)
* **Authentication**: [Passport.js](https://www.passportjs.org/) (Google OAuth 2.0 Strategy) & JWT (JSON Web Tokens)
* **Cloud Storage**: [ImageKit.io](https://imagekit.io/) (for user & chat-structured file hosting)

### AI & Vector Databases (RAG)
* **Orchestration**: [LangChain](https://js.langchain.com/)
* **LLM Providers**: Google Gemini GenAI, Mistral AI, and Llama 3 (via Groq/fallback endpoints)
* **Vector Store**: [Pinecone Vector DB](https://www.pinecone.io/) (for context-aware document queries)
* **Search Tool**: [Tavily Search API](https://tavily.com/) (for real-time web search capabilities)

---

## 🌟 Key Features

### 1. Secure & Versatile Auth Flow
* Traditional email/password signup with automatic verification emails.
* Single-click **Google OAuth Login** with automatic user provisioning.
* Secure HTTP-only cookies designed to work cross-site in production.

### 2. Multi-Model Routing & Daily Limits
* **Daily Message Routing**: Automatically routes user messages between Gemini (Google's best models), Mistral AI, and Llama 3 based on daily usage thresholds.
* **Limit Enforcement**: Displays a friendly "limit reached for today" block if all limits are exhausted.

### 3. Thread Length Constraints & Summarization
* **Intelligent Summarization**: Automatically condenses core topics and decisions of the chat history after a set threshold of messages, passing only the summary alongside subsequent messages to minimize token waste.
* **Thread Life Warning**: Warns users when the active chat thread grows too long, recommending switching to a new chat, and disables messaging options once the thread limit is reached.

### 4. Advanced Multi-File Upload & Lightbox Preview
* **Staged Attachments**: Stage multiple image or PDF files in a compact preview row before sending.
* **Upload Limits**: Restricts individual and total upload size as well as file count per prompt.
* **Send Lock**: Automatically disables the send button until all staged uploads are finished.
* **Fullscreen Lightbox**: Click any attachment thumbnail to open a fullscreen lightbox overlay rendered outside viewport constraints via **React Portals** (`createPortal`).

### 5. Structured Storage & Context-Aware RAG (Vector DB)
* **Structured Hosting**: Files are organized under `kairis-ai/<userId>/<chatId>/` paths in ImageKit.
* **Context-Aware Routing**: Pinecone search queries are strictly matched against the `userId`, `chatId`, and the specific files attached in the **latest asked prompt** to prevent crosstalk.
* **History Queries**: Automatically detects if the user is explicitly asking about older files (e.g. *"compare with the previous PDF"*) and expands the RAG search to all files in the current chat session.
* **Score-Filtered Matching**: Employs similarity score thresholds to strip out irrelevant search noise.

### 6. Voice Prompting
* Integrated fast voice prompt input utilizing the **Web Speech API** for hands-free queries.

### 7. Premium Responsive UI
* Theme toggle with smooth, customizable transition animations.
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

# ImageKit (Cloud Storage)
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint

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
