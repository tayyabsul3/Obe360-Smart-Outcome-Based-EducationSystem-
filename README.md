# OBE360 - Smart Outcome Based Education System

![OBE360 Illustration](./client/public/obe360_hero_banner.png)

## Overview

**OBE360** is a comprehensive educational platform designed to streamline Outcome-Based Education (OBE) management. It features a secure and modern architecture separating the frontend and backend to ensure scalability and performance.

This repository contains the full source code for both the **Client** (React) and **Server** (Node.js) applications.

## Key Features

-   **🔐 Secure Authentication**: Integrated with Supabase Auth including Role-Based Access Control (RBAC) for Admins and Teachers.
-   **📩 Teacher Onboarding System**:
    -   Admin-controlled invitation flow.
    -   Secure email delivery via SMTP (Nodemailer).
    -   **Forced Password Change**: Enhanced security requiring new teachers to reset credentials on first login.
-   **🎨 Modern UI/UX**:
    -   Built with **React**, **Vite**, and **Tailwind CSS**.
    -   Beautiful components using **Shadcn UI**.
    -   Smooth animations with **GSAP**.
    -   Interactive Data Tables and Badges.
-   **🛡️ Robust Backend**:
    -   **Express.js** API with security middleware (`helmet`, `cors`, `morgan`).
    -   Supabase Admin API integration for user management.

## 🚀 Getting Started

This project is set up as a monorepo. You will need to set up both the Client and Server separately.

### 1. Backend Setup (Server)

Navigate to the `server` directory to set up the API.

> 📄 **See detailed instructions**: [Server README](./server/README.md)

```bash
cd server
npm install
# Configure your .env file
npm run dev
```

### 2. Frontend Setup (Client)

Navigate to the `client` directory to launch the UI.

> 📄 **See detailed instructions**: [Client README](./client/README.md)

```bash
cd client
npm install
# Configure your .env file
npm run dev
```

## 🛠️ Technology Stack

### Frontend
-   **Framework**: React 18 + Vite
-   **Styling**: Tailwind CSS, Shadcn UI
-   **State Management**: Zustand
-   **Icons**: Lucide React
-   **Animations**: GSAP

### Backend
-   **Runtime**: Node.js
-   **Framework**: Express.js
-   **Database**: Supabase (PostgreSQL)
-   **Email**: Nodemailer (SMTP)
-   **Security**: Helmet, CORS

---

### Acknowledgments

Developed by **Tayyab Sultan**.
