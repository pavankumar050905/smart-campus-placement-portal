# Implementation and acceptance checklist

## Implemented in this local project
- [x] JWT authentication and role-based authorisation
- [x] Student profile, 30-branch catalogue, jobs and applications
- [x] Server-side academic/job eligibility checks
- [x] Recruiter job creation and applicant status updates
- [x] Admin job approvals and placement summary
- [x] Groq career guidance and skill-gap analysis
- [x] Student self-generated personalised MCQ assessments
- [x] Admin/officer university-wide assessment creation
- [x] Recruiter applicant-specific assessment assignment for owned jobs
- [x] 10/20/30/50 question options and easy/medium/hard/mixed difficulty
- [x] Timed attempts with server-side expiry and grading
- [x] Post-submission answer review, topic breakdown and recommendations
- [x] Student attempt history and manager analytics
- [x] Synthetic demo data seeder with explicit isDemo labels

## Important safeguards
1. Correct options and explanations are selected out of assessment documents and are not returned to the browser before submission.
2. The server calculates the score; client-submitted score values are ignored.
3. Students can only start assessments that are university-wide or assigned to their student profile.
4. Recruiters can only assign tests to applicants for their own jobs and view analytics for their own assessments.
5. AI-generated questions are structurally validated. Review question quality before using the feature for formal graded examinations.
6. Synthetic records are not real university records and must not be represented as such.

## Local acceptance test
1. Start MongoDB.
2. Copy `.env.example` to `.env`, set `MONGODB_URI` and a random `JWT_SECRET`.
3. Run `npm run seed` and `npm run seed:demo` in `server/`.
4. Start backend and frontend.
5. Sign in as a synthetic student, generate a 10-question assessment, answer and submit it, then inspect the result and history.
6. Sign in as admin and create a university assessment.
7. Sign in as a synthetic recruiter, select one of its jobs and one applicant, and assign a company assessment.
8. Confirm students only see assessments assigned to them or university-wide assessments.
9. Run `npm test` and `npm run build`.

## Not included in this local delivery
Production email/SMS delivery, resume upload storage, proctoring/anti-cheating, calendar integrations, live Socket.IO notifications, and cloud deployment need separate infrastructure and security review.
