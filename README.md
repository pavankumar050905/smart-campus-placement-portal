# Smart Campus Placement and Career Guidance System

A local MERN placement portal with role-based student, recruiter and administrator workspaces, Groq-powered career guidance, personalised MCQ assessments and clearly labelled synthetic demo data.

## Requirements
- Node.js 20+ and npm
- MongoDB Community running locally, or a MongoDB Atlas connection string
- Groq API key for AI-generated student self-assessments and career guidance

## Windows quick start
1. Extract the ZIP and open the inner `smart-campus-placement-portal` folder in VS Code.
2. Copy `server/.env.example` to `server/.env`.
3. Set `MONGODB_URI`, a long random `JWT_SECRET`, `CLIENT_URL`, and `GROQ_API_KEY` in `server/.env`.
4. Backend terminal:
   ```powershell
   cd server
   npm install
   npm run seed
   npm run seed:demo
   # Only for a new database that does not yet contain the 30 saved branch banks:
   npm run refresh:assessments
   npm run dev
   ```
5. Frontend terminal:
   ```powershell
   cd client
   npm install
   npm run dev
   ```
6. Open http://localhost:5173.

If you already have a populated database, take a backup before running the synthetic demo seed. The seed script upserts its demo records and does not delete ordinary user records.

## Demo accounts
Base seed accounts (`npm run seed`):
- Admin: `admin@campus.demo` / `ChangeMe123!`
- Student: `student@campus.demo` / `ChangeMe123!`
- Recruiter: `recruiter@campus.demo` / `ChangeMe123!`

Synthetic dataset accounts (`npm run seed:demo`):
- Students: `demo.student001@campus.demo` through `demo.student500@campus.demo`
- Recruiters: `demo.recruiter01@campus.demo` through `demo.recruiter50@campus.demo`
- Password for synthetic student and recruiter accounts: `DemoPass123!`

All synthetic accounts, vacancies, applications, assessments, attempts and notifications are demonstration data, not actual Alliance University records. Change demo passwords before sharing the application with others.

## AI configuration
The backend reads:
```env
GROQ_API_KEY=your_private_key
GROQ_MODEL=openai/gpt-oss-20b
```
Keep the key in `server/.env` only. Do not place it in `client/.env`, commit `.env` files, or paste secrets into chat. Student self-assessments require a working Groq key and fail safely if it is missing or returns invalid questions; they never silently substitute generic questions. University and recruiter assessments use the saved branch-specific MongoDB question banks and do not call Groq. The career guidance endpoint also requires a working Groq key.

## Assessment capabilities
- Students can generate self-practice assessments whenever they want.
- University administrators/officers can create university-wide assessments, optionally targeting one branch.
- Recruiters can create applicant-specific company assessments for applications to their own jobs.
- Student self-assessment counts: 10, 15, 20, 30, 40 or 50. University assessments use 25 fixed branch-bank questions. Recruiter assessments use 10 or 15 randomly selected branch-bank questions.
- Configurable timed sessions; the backend controls expiry and evaluates answers.
- Correct options and explanations are not sent to the browser during the test. They are returned only after submission.
- Results include score, percentage, topic-level breakdown, answer review and recommended improvement areas.
- Students can review assessment history. Admins/recruiters can view aggregate assessment analytics.
- Groq-generated questions are structurally validated. The built-in bank is a fallback, not a substitute for faculty review of formal examinations.

## Synthetic demo dataset
`npm run seed:demo` creates/upserts:
- 500 synthetic student accounts
- 50 synthetic recruiter accounts
- 150 synthetic job postings
- 1,000 synthetic applications
- 20 synthetic assessments with 25 questions each (500 stored MCQ instances)
- 300 synthetic assessment attempts
- 500 synthetic in-app notifications
- 30 configurable engineering branch entries

The generated data is intended for local demonstrations and testing only. It is not a real student/recruiter directory, and its assessment results are not evidence of actual student performance.

## Main project modules
- JWT authentication and role-based access control
- Student profile, configurable branch catalogue, jobs and applications
- Server-side eligibility evaluation
- Recruiter job creation and application status management
- Admin job approvals and placement statistics
- Groq career advice and skill-gap guidance
- Personalised, university-wide and recruiter-assigned assessment workflow
- Timed attempts, server-side grading, review, history and analytics
- Synthetic data seeding and API tests

## Commands
Backend (`server/`):
- `npm run dev` — start API in watch mode
- `npm run seed` — create the base demo accounts and branch catalogue
- `npm run seed:demo` — create synthetic dataset
- `npm run refresh:assessments` — create/reuse the 30 saved branch question banks (only when missing; requires Groq for generation)
- `npm test` — run backend tests

Frontend (`client/`):
- `npm run dev` — start Vite
- `npm run build` — create production frontend build

## Security and limitations
- Use a unique random JWT secret and private API keys.
- Use HTTPS, restrict CORS, enable MongoDB authentication and backups before any shared deployment.
- Demo passwords are public examples and must never be used for real accounts.
- Assessment results are practice/selection-support signals, not standalone hiring decisions.
- This is a local development delivery. Production email/SMS, resume file storage, anti-cheating/proctoring, live event delivery, and external cloud deployment need separately configured providers and further security review.
