# OBE360 Frontend (Client)

This is the React frontend application for the **OBE360** educational platform, a system designed to streamline Outcome-Based Education (OBE) management.

## 🌟 Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Components**: Shadcn UI & Radix UI Primitives
- **State Management**: Zustand
- **Routing**: React Router DOM v6
- **Animations**: GSAP
- **Data Visualization**: Recharts
- **PDF Export**: jsPDF, jsPDF-Autotable, html2canvas

---

## 🚀 Getting Started

To run the frontend client locally, follow these steps.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)

### 1. Installation

Clone the repository and navigate to the `client` directory:
```bash
cd client
npm install
```

### 2. Environment Variables

Create a new file named `.env` in the root of the `client` directory.

Add your Supabase project credentials. These are necessary to authenticate users against the live database.
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Running the Development Server

Start the Vite development server:
```bash
npm run dev
```

The application will be accessible at [http://localhost:5173](http://localhost:5173). Any changes made to the React code will automatically hot-reload in the browser.

---

## 📦 Building for Production

When you are ready to deploy the frontend, build the optimized static assets:
```bash
npm run build
```

This will generate a `dist/` directory containing the minified and bundled application, ready to be hosted on Vercel, Netlify, or any static file server.

## 🤝 Key Project Structure

- `/src/pages`: Contains all the main route views (e.g., `Landing.jsx`, `AdminDashboard.jsx`, `TeacherPages.jsx`).
- `/src/components/ui`: Houses the reusable Shadcn UI components.
- `/src/store`: Zustand state management stores (e.g., `authStore.js`).
- `/src/utils`: Helper functions and shared logic.

## ⚠️ Notes
Make sure the **OBE360 Backend Server** is running concurrently on port `5000` to handle API requests securely.
