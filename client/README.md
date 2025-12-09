# OBE360 Client

This is the frontend application for the OBE360 platform, built with React, Vite, Tailwind CSS, and Shadcn UI.

## Prerequisites

- Node.js (v18 or higher recommended)
- npm

## Setup & Installation

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    - Rename `.env.example` to `.env` (or create a new `.env` file).
    - Add your Supabase credentials:
        ```env
        VITE_SUPABASE_URL=your_supabase_project_url
        VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
        ```

## Running the Application

To start the development server:

```bash
npm run dev
```

The application will typically run on [http://localhost:5173](http://localhost:5173).

## Build for Production

To build the application for production:

```bash
npm run build
```
