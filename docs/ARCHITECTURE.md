# Architecture and Security

## Components
- `client/`: React + Vite UI, React Router, Redux Toolkit, Axios and assessment workspace.
- `server/`: Express REST API, Mongoose models, JWT auth, eligibility rules, Groq career guidance and assessment question generation.
- MongoDB: persistent user, student, recruiter, job, application, assessment and attempt records.
- Groq API: server-only career guidance and optional personalised MCQ generation. A validated local question bank is used when AI generation is unavailable.

## Trust boundaries
The browser is untrusted. Every privileged operation is authorised in Express. Eligibility and assessment grading are computed on the server. Correct MCQ options and explanations are withheld until an attempt is submitted. AI output is validated before it is stored. AI output does not determine formal eligibility or hiring outcomes.

## Key security controls
- Password hashing with bcrypt.
- JWT verification and role-based access middleware.
- Recruiters can manage only their own jobs and assessments.
- Students can start only university-wide assessments or assessments assigned to their profile.
- Helmet, CORS allow-list, rate limiting, request validation and Mongoose validation.
- Secrets loaded from environment variables and excluded from the delivery ZIP.
- Generic production errors; no stack traces returned to clients.

## Data model overview
Users have 1:1 Student or Recruiter profiles. Jobs reference Recruiters. Applications reference Students and Jobs. Assessments have a scope (`self`, `university`, or `company`), creator, optional job/application, assigned students and server-only question bank. Attempts reference an Assessment and Student and store answers, score, expiry, topic breakdown and recommendations. Notifications reference Users. Interviews, Offers, PlacementDrive and AuditLog remain in the existing model layer.
