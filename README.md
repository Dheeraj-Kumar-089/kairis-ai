# Kairis AI 

Kairis AI is a premium, state-of-the-art, context-aware AI assistant application powered by modern LLMs (Gemini, Mistral, and Llama 3), Retrieval-Augmented Generation (RAG) using Pinecone, and real-time communication via Socket.io. It supports standard email authentication (with verification flow) as well as seamless Google OAuth login. Beyond chat, it can ingest and reason over any content you give it — documents, images (via OCR), and entire GitHub repositories.

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
* **Authentication**: [Passport.js](https://www.passportjs.org/) (Google OAuth 2.0 Strategy), a custom **GitHub OAuth** flow (per-user, for repo access), & JWT (JSON Web Tokens)
* **Cloud Storage**
* **Source Integration**: [GitHub REST API](https://docs.github.com/en/rest) (repo tree + raw file fetch, public or private via per-user token)

### AI & Vector Databases (RAG)
* **Orchestration**: [LangChain](https://js.langchain.com/)
* **LLM Providers**: Google Gemini GenAI, Mistral AI, and Llama 3 (via Groq/fallback endpoints)
* **Vector Store**: [Pinecone Vector DB](https://www.pinecone.io/) (for context-aware document, image, and codebase queries)
* **Search Tool**: [Tavily Search API](https://tavily.com/) (for real-time web search capabilities)

---

## 🌟 Key Features

### 1. Secure & Versatile Auth Flow
* Traditional email/password signup with automatic verification emails
* Seamless **production email verification redirect** returning users directly to the frontend with custom UI status banners (`verified=true` / error messaging).
* Single-click **Google OAuth Login** with automatic user provisioning.
* Separate, optional **"Connect GitHub"** OAuth flow (per-user, `repo` scope) so each user can chat with their own private repositories without sharing a server-wide token.
* Secure HTTP-only cookies designed to work cross-site in production.

### 2. Advanced Multi-File Upload & Lightbox Preview
* **Staged Attachments**: Stage up to 5 images or PDFs in a single prompt.
* **Paste to Upload**: Paste an image or PDF directly from the clipboard into the chat box.
* **Upload Limits**: Limits uploads to a maximum of 5 MB per file and 15 MB in total per prompt.
* **Fullscreen Lightbox**: Click any attachment thumbnail to open a fullscreen lightbox overlay rendered outside viewport constraints via **React Portals** (`createPortal`).

### 3. Context-Aware RAG (Vector DB)
* **Document & Image Q&A**: Upload PDFs or images (OCR'd via Gemini Vision), chunked and embedded into Pinecone, then ask questions about them in chat.
* **GitHub Repo Chat**: Paste a GitHub repo URL to index its code files into the same Pinecone-backed pipeline, then chat directly with the codebase — works with public repos out of the box, or private repos once GitHub is connected.
* **Real-time Web Search Integration**: Uses Tavily Search API for up-to-date web answers when context requires it.
* **Clean Deletes**: Deleting a chat removes its messages and any associated Pinecone vector data (uploaded docs/images/repo chunks), so no orphaned embeddings are left behind.

### 4. Voice Prompting
* Integrated fast voice prompt input utilizing the **Web Speech API** for hands-free queries.

### 5. Premium Responsive UI & Production Stability
* Fully compliant with React Rules of Hooks to prevent unexpected runtime errors across state transitions.
* Fully mobile-responsive layouts with collapsable sidebars.

### 6. Industry-Standard Architecture
* **Backend — MVC Pattern**: Clean separation of `models` (Mongoose schemas), `controllers` (request/response + business logic), `routes` (Express routers), and `services` (AI/RAG, GitHub, ImageKit, email — reusable logic decoupled from controllers).
* **Frontend — 4-Layer Feature Architecture**: Each feature (`chat`, `auth`, `landing`) is self-contained with its own `pages` (screens), `components` (reusable presentational UI), `hooks` (state orchestration + business logic), and `services` (API calls) — the same layered structure used in production-grade React codebases, keeping features isolated and independently maintainable.

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
│   │   ├── services/       # Mailjet, Email Templates, AI/RAG, GitHub, ImageKit storage services
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

