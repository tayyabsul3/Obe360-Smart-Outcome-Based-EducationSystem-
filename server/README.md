# OBE360 Server

This is the backend API for the OBE360 platform, built with Node.js and Express. It handles teacher invitations, authentication management via Supabase Admin, and email delivery.

## Prerequisites

- Node.js (v18+ recommended)
- npm

## Setup & Installation

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Environment Variables**:
    - Rename `.env.example` to `.env` (or create a new `.env` file).
    - Configure the following keys:
        - `SUPABASE_URL`: Your Supabase Project URL.
        - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase **Service Role** Key (NOT the Anon key).
        - `SMTP_*`: Your SMTP email provider details (e.g., Gmail App Password).

## Running the Server

To start the server in development mode (with hot-reloading via nodemon):

```bash
npm run dev
```

To start normally:

```bash
node index.js
```

The server usually runs on port `5000`.
