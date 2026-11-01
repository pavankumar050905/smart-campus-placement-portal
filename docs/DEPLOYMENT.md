# Deployment Guide

This delivery is configured for local development. No cloud resources are created.

## Local Windows setup
1. Install Node.js 20+ and MongoDB Community Server.
2. Copy `server/.env.example` to `server/.env`.
3. Configure `MONGODB_URI`, a random `JWT_SECRET`, `CLIENT_URL`, and optional `GROQ_API_KEY` / `GROQ_MODEL`.
4. Run `npm install`, `npm run seed`, `npm run seed:demo` and `npm run dev` in `server/`.
5. Run `npm install` and `npm run dev` in `client/`.
6. Open `http://localhost:5173`.

## If deploying later
1. Create a managed MongoDB database with a least-privilege database user.
2. Deploy the Express API to a Node-compatible host and set `NODE_ENV`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, `GROQ_API_KEY`, and `GROQ_MODEL` as platform secrets.
3. Build the React client with `npm run build`; host `client/dist` on a static host.
4. Set `VITE_API_URL` to the deployed API base URL before building the client.
5. Configure CORS to allow only the deployed frontend origin.
6. Enable HTTPS, request/body limits, rate limits, database backups, monitoring and log redaction.
7. Use managed secret storage; never upload `.env` files.
8. Verify health, login, role restrictions, job application, assessment access, grading, analytics and database connectivity.

Review current pricing before creating cloud resources. Production email/SMS, resume storage, proctoring and live notification providers need separate integration and security review.
