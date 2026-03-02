# OBE360 Backend (Server)

This is the Express.js REST API backend for the **OBE360** educational platform. It handles secure data routing, teacher invitations, SMTP email delivery, and interacts natively with the Supabase database.

## 🌟 Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database / Auth Client**: Supabase JavaScript Client (`@supabase/supabase-js`)
- **Email Delivery**: Nodemailer
- **Security**: Helmet, CORS
- **File Parsing**: Multer (file uploads), XLSX (Excel parsing), Papaparse (CSV)

---

## 🚀 Getting Started

To run the backend API server locally, follow these instructions.

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)
- An active Supabase Project
- SMTP Credentials (e.g., a Gmail App Password) for sending invitations.

### 1. Installation

Navigate to the `server` directory:
```bash
cd server
npm install
```

### 2. Environment Variables

Create a new file named `.env` in the root of the `server` directory.

Add your absolute credentials:
```env
# Supabase Configuration
# IMPORTANT: Use the SERVICE_ROLE_KEY to bypass Row Level Security on admin operations.
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Nodemailer SMTP Configuration
SMTP_HOST=smtp.gmail.com  
SMTP_PORT=465             
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_gmail_app_password
SMTP_SECURE=true          
SMTP_FROM_EMAIL="OBE360 Admin <your_email@gmail.com>"
```

### 3. Running the Development Server

To start the server with `nodemon` (which automatically restarts the server when you save changes to the code):
```bash
npm run dev
```

If you wish to start it normally without hot-reloading:
```bash
node index.js
```

The server should successfully boot and log: `Server running on port 5000`. 

*(The frontend React application natively proxys requests to `localhost:5000/api`)*

---

## 🤝 Key Project Structure

- `index.js`: The main Express application entry point configuring middleware and routes.
- `/routes`: Defines all the API endpoints (e.g., `/api/programs`, `/api/auth`).
- `/controllers`: Contains the core business logic (e.g., `programController.js`, `authController.js`) where DB logic & SMTP sending occurs.
- `/config/supabase.js`: Initializes the Supabase Admin client with the Service Role Key.

## ⚠️ Troubleshooting

- **Operation Failed / Row-Level Security errors:** Ensure you are using the `SUPABASE_SERVICE_ROLE_KEY` inside your `.env`, *not* the `anon` key. If you recently added the key, restart the terminal process to ensure the `.env` changes are ingested.
- **Email Invitation Failure:** Ensure your SMTP Provider allows App Passwords (if using Google, ensure 2-Step Verification is ON and you generated an App Password specifically for OBE360).
