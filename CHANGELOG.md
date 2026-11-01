# Changelog - Local completion package

## Added
- AI-personalised self-assessment generation for students.
- Admin/officer university-wide assessments with optional branch targeting.
- Recruiter assessment assignment restricted to applicants for the recruiter's own jobs.
- Timed attempts, server-side answer evaluation, topic breakdown, review and history.
- Manager analytics for assessment attempts.
- Groq question generation with a validated local MCQ bank fallback.
- Synthetic dataset seeder: 500 students, 50 recruiters, 150 jobs, 1,000 applications, 20 assessments / 500 MCQ instances, 300 attempts and 500 notifications.
- Assessment navigation, creation, test-taking and result UI.
- Local setup guide and Windows launcher.

## Validation performed
- Backend automated tests: 6 passed.
- Backend JavaScript syntax checks: passed.
- Frontend JSX parser checks: passed.
- A full Vite production build was not run in this Linux workspace because the uploaded `node_modules` were Windows-specific; install dependencies locally with `npm install` in both `server` and `client`, then run `npm run build` in `client`.

## Security
- The uploaded `server/.env` was excluded from this delivery package.
