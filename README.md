# 📝 FormBuilder – Customizable Form-Based Web App

This project is a full-stack form creation and submission platform, similar to tools like Google Forms or Typeform. Users can build customizable templates (quizzes, surveys, polls), share them, collect responses, and analyze data — all within a modern, responsive, and multilingual UI.

---

## 🌐 Project Structure

/ ├── backend/ # Express + Prisma API server  
 └── frontend/ # React + Tailwind client app

---

## 🔧 Technologies Used

### 🖥 Frontend (React + Vite)

- **React 19**, **Vite 6** – Fast and modern SPA framework
- **TailwindCSS 4**, **Radix UI**, **shadcn/ui** – Accessible, flexible, and beautiful component design
- **React Hook Form + Zod** – Type-safe form building and validation
- **React Router DOM v7** – Modern routing
- **i18next** – Multilingual support
- **Zustand** – Global state management
- **Framer Motion** – Smooth animations
- **DND Kit** – Drag-and-drop reordering
- **Recharts** – Data visualization
- **ImageKit** – Optimized media delivery

### 🛠 Backend (Node.js + Express)

- **Express 4** – Robust and minimal web server
- **Prisma ORM** – PostgreSQL data modeling with ease
- **Clerk** – Authentication and user management
- **Zod** – API request validation
- **Vitest** – Lightweight testing
- **WS (WebSocket)** – Real-time features
- **Node-Cache** – In-memory caching
- **Rate-limiting**, **Helmet**, **CORS**, **Compression** – Security and performance

---

## 🧠 Features

- ✅ **Template Builder** with drag-and-drop reordering
- 🧠 **Role-based Access Control** (creator, responder, admin)
- 📈 **Submission Statistics**, charts, and metadata
- 🔍 **Full-Text Search**, filter by tags, topics
- 🌐 **Multilingual UI** (supports EN + RU)
- 🎨 **Dark/Light Theme Toggle**, synced across Clerk + localStorage
- 📤 **Image Uploads via ImageKit**
- 🔁 **Live Editing & Real-time Collaboration (WebSockets planned)**
- 🔒 **Authentication & Authorization via Clerk**
- 🔄 **Efficient caching for popular templates and tag clouds**

---

## ⚙️ Development

### 📦 Backend

```bash
cd backend
npm install
npm run dev       # Starts the backend server with tsx + nodemon

```

**Other useful backend scripts:**

- npm run build – Build with tsup

- npm run prisma:migrate – Run migrations

- npm run prisma:seed – Seed database

- npm run test:dev – Run backend tests in watch mode

### 💻 Frontend

```bash
cd frontend
npm install
npm run dev       # Starts the Vite dev server

```

**Build and preview:**

npm run build – Build frontend

npm run preview – Preview production build locally

### 🧩 Challenges Faced

- 🔗 WebSocket-based real-time collaboration
- ⚙️ Syncing preferences across Clerk, Zustand, and frontend (language + theme)

- 📊 Dynamic table rendering based on question metadata (showInTable)

- 🧮 PostgreSQL views integration with Prisma to simplify data aggregation and avoid overfetching

- ⚡ Caching layer for analytics-heavy endpoints with node-cache

- 🌐 Multilingual interface with runtime language detection and persistence

- 🧱 Complex drag-and-drop logic with nested sortable components

- 🚀 Performance optimization for large-scale form submissions

## 🔮 Future Improvements

- 📊 Advanced analytics dashboards

- 📱 PWA support and mobile-first improvements

- 🔒 Admin moderation features

- 🧠 AI-powered suggestions for form generation

## 📄 License

This project is licensed under the MIT License.  
See the [LICENSE](./LICENSE) file for details.

Let me know if you'd like to add sections for environment setup, contributing, or deployment instructions.
