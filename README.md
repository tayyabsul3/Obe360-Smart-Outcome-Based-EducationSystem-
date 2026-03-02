# OBE360 - Smart Outcome Based Education System

![OBE360 Illustration](./client/public/obe360_hero_banner.png)

## 📖 What is OBE360?

**OBE360** is a comprehensive, modern, and intelligent educational platform designed to streamline and automate Outcome-Based Education (OBE) management for universities and educational institutions. 

Traditional education systems often focus purely on grades (GPA). Outcome-Based Education shifts this paradigm by focusing on **what students can actually do** after they are taught (Outcomes). OBE360 tracks these outcomes by mapping course assessments to specific Course Learning Outcomes (CLOs) and broader Program Learning Outcomes (PLOs).

The platform features a secure, scalable architecture separating the **frontend (React)** and **backend (Node.js/Express)**, integrated with **Supabase** for robust authentication, data management, and Row-Level Security (RLS).

---

## ✨ Key Features

- **🔐 Secure Authentication & RBAC**: Integrated with Supabase Auth, offering strict Role-Based Access Control distinguishing between **Admins** and **Teachers**.
- **📩 Teacher Onboarding System**: 
  - Admin-controlled secure invitation flow via email (Nodemailer/SMTP).
  - Forces newly invited teachers to change their password upon their very first login.
- **📊 Advanced OBE Analytics & Dashboards**:
  - **Comprehensive Course Dashboards**: View overall class performance, GPA distributions, and detailed CLO attainment matrices.
  - **Consolidated PLO Reports**: Automatically calculates and connects CLO achievements to high-level PLOs to visualize program-wide mastery.
  - **Smart PDF Exports**: Professionally paginated reports using `jsPDF-autotable` and `html2canvas`.
- **🏫 Academic Management**:
  - Manage Programs, Courses, Classes, and Semesters.
  - Define and map PLOs and CLOs dynamically.
  - Bulk-import data (Assignments, Programs, Students) via CSV.
- **🎨 Modern UI/UX**:
  - Built with **React**, **Vite**, and **Tailwind CSS**.
  - Beautiful, highly accessible components using **Shadcn UI**.
  - Smooth micro-interactions and transitions with **GSAP**.

---

## 🛠️ Technology Stack

### Frontend (Client)
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI, Radix UI
- **State Management**: Zustand
- **Charting & Visuals**: Recharts
- **PDF Generation**: jsPDF, html2canvas
- **Animations**: GSAP

### Backend (Server)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database & Auth**: Supabase (PostgreSQL)
- **Email Delivery**: Nodemailer (SMTP)
- **Security**: Helmet, CORS
- **File Parsing**: Multer, xlsx

---

## 🚀 Getting Started & Installation

OBE360 is built as a **Monorepo** consisting of two main directories: `/client` and `/server`. You will need to spin up both concurrently.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [Git](https://git-scm.com/)
- A [Supabase](https://supabase.com/) account for the database and authentication.
- An SMTP provider (like Gmail App Passwords, SendGrid, etc.) for emails.

### 1. Database Setup (Supabase)
Create a new project in Supabase. You will need to extract your:
1. **Supabase URL**
2. **Supabase Anon Key**
3. **Supabase Service Role Key** (Keep this secure!)

*(Note: The database schemas and RLS policies must be configured in your Supabase SQL editor for the application to function securely.)*

### 2. Backend Setup (Server)
Navigate to the `server` directory to configure and start the Express REST API.

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory and configure the following variables:
```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SMTP_HOST=smtp.gmail.com  
SMTP_PORT=465             
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
SMTP_SECURE=true          
SMTP_FROM_EMAIL="OBE360 Admin <your_email@gmail.com>"
```

Start the backend server:
```bash
npm run dev
```
*The server will typically run on `http://localhost:5000`.*

### 3. Frontend Setup (Client)
Open a new terminal window and navigate to the `client` directory to configure the React application.

```bash
cd client
npm install
```

Create a `.env` file in the `client` directory and configure the following variables:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Start the frontend development server:
```bash
npm run dev
```
*The client will typically run on `http://localhost:5173`.*

---

## 👨‍💻 Development & Contribution

- **Admin Access**: When first registering your Super Admin account, ensure the backend logic or Supabase dashboard assigns the role `admin` to your `users` table record.
- **Troubleshooting**: If you experience "Row Level Security Violation" errors during API requests, verify that the `server/.env` contains the correct `SUPABASE_SERVICE_ROLE_KEY` and restart the backend `nodemon` process.

### Acknowledgments
Developed by **Tayyab Sultan**.
