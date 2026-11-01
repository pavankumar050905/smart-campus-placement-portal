import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['student', 'recruiter', 'officer', 'admin'], required: true },
  active: { type: Boolean, default: true },
  isDemo: { type: Boolean, default: false }
}, { timestamps: true });

const studentSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  studentId: { type: String, trim: true },
  branch: { type: String, required: true, trim: true },
  graduationYear: { type: Number, min: 2020, max: 2040 },
  cgpa: { type: Number, min: 0, max: 10, default: 0 },
  backlogs: { type: Number, min: 0, default: 0 },
  skills: [{ type: String, trim: true }],
  certifications: [{ name: String, issuer: String, year: Number, url: String }],
  projects: [{ title: String, description: String, technologies: [String], url: String }],
  resumeUrl: String,
  phone: String,
  bio: { type: String, maxlength: 2000 },
  isDemo: { type: Boolean, default: false }
}, { timestamps: true });

const recruiterSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  companyName: { type: String, required: true, trim: true },
  website: String,
  industry: String,
  verified: { type: Boolean, default: false },
  isDemo: { type: Boolean, default: false }
}, { timestamps: true });

const jobSchema = new Schema({
  recruiter: { type: Schema.Types.ObjectId, ref: 'Recruiter', required: true },
  title: { type: String, required: true, trim: true, maxlength: 150 },
  description: { type: String, required: true, maxlength: 12000 },
  location: { type: String, default: 'Not specified' },
  jobType: { type: String, enum: ['Full-time', 'Internship', 'Contract'], default: 'Full-time' },
  salaryMin: { type: Number, min: 0 },
  salaryMax: { type: Number, min: 0 },
  requiredSkills: [{ type: String, trim: true }],
  eligibleBranches: [{ type: String, trim: true }],
  minCgpa: { type: Number, min: 0, max: 10, default: 0 },
  maxBacklogs: { type: Number, min: 0, default: 0 },
  graduationYears: [Number],
  deadline: Date,
  status: { type: String, enum: ['draft', 'pending', 'published', 'closed'], default: 'pending' },
  isDemo: { type: Boolean, default: false }
}, { timestamps: true });
jobSchema.index({ status: 1, deadline: 1, createdAt: -1 });

const applicationSchema = new Schema({
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
  status: { type: String, enum: ['applied', 'shortlisted', 'assessment', 'interview', 'offered', 'rejected', 'withdrawn'], default: 'applied' },
  eligibilitySnapshot: { eligible: Boolean, reasons: [String] },
  recruiterNote: { type: String, maxlength: 2000 },
  appliedAt: { type: Date, default: Date.now },
  isDemo: { type: Boolean, default: false }
}, { timestamps: true });
applicationSchema.index({ student: 1, job: 1 }, { unique: true });

const branchSchema = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  name: { type: String, required: true, unique: true, trim: true },
  active: { type: Boolean, default: true }
}, { timestamps: true });

const notificationSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true, maxlength: 2000 },
  readAt: Date,
  channel: { type: String, enum: ['in-app', 'email', 'sms'], default: 'in-app' },
  isDemo: { type: Boolean, default: false }
}, { timestamps: true });


const assessmentQuestionSchema = new Schema({
  prompt: { type: String, required: true },
  type: { type: String, enum: ['conceptual','debugging','scenario','output','coding'], default: 'conceptual' },
  options: { type: [{ type: String, required: true }], validate: v => v.length === 4 },
  correctOption: { type: Number, required: true, min: 0, max: 3 },
  explanation: { type: String, default: '' },
  topic: { type: String, default: 'General' },
  difficulty: { type: String, enum: ['easy','medium','hard'], default: 'medium' },
  points: { type: Number, default: 1, min: 1, max: 10 }
}, { _id: false });

const assessmentSchema = new Schema({
  title: { type: String, required: true, maxlength: 160 },
  description: { type: String, default: '', maxlength: 2000 },
  scope: { type: String, enum: ['self','university','company'], default: 'self' },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  recruiter: { type: Schema.Types.ObjectId, ref: 'Recruiter' },
  job: { type: Schema.Types.ObjectId, ref: 'Job' },
  application: { type: Schema.Types.ObjectId, ref: 'Application' },
  assignedStudents: [{ type: Schema.Types.ObjectId, ref: 'Student' }],
  targetBranch: { type: String, default: '' },
  targetRole: { type: String, default: '' },
  skills: [{ type: String }],
  difficulty: { type: String, enum: ['easy','medium','hard','mixed'], default: 'mixed' },
  durationMinutes: { type: Number, min: 1, max: 240, default: 30 },
  questionCount: { type: Number, min: 1, max: 50, default: 10 },
  questions: { type: [assessmentQuestionSchema], select: false },
  active: { type: Boolean, default: true },
  isDemo: { type: Boolean, default: false }
}, { timestamps: true });
assessmentSchema.index({ scope: 1, active: 1, createdAt: -1 });
assessmentSchema.index({ assignedStudents: 1, active: 1 });

const attemptSchema = new Schema({
  assessment: { type: Schema.Types.ObjectId, ref: 'Assessment', required: true },
  student: { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  answers: [{ questionIndex: Number, selectedOption: Number }],
  status: { type: String, enum: ['in-progress','submitted','expired'], default: 'in-progress' },
  score: { type: Number, min: 0, default: 0 },
  maxScore: { type: Number, min: 0, default: 0 },
  percentage: { type: Number, min: 0, max: 100, default: 0 },
  topicBreakdown: [{ topic: String, correct: Number, total: Number, percentage: Number }],
  recommendations: [String],
  startedAt: { type: Date, default: Date.now },
  expiresAt: Date,
  submittedAt: Date,
  durationSeconds: { type: Number, default: 0 },
  isDemo: { type: Boolean, default: false }
}, { timestamps: true });
attemptSchema.index({ student: 1, assessment: 1, createdAt: -1 });

const interviewSchema = new Schema({
  application: { type: Schema.Types.ObjectId, ref: 'Application', required: true },
  roundName: { type: String, required: true },
  scheduledAt: { type: Date, required: true },
  mode: { type: String, enum: ['online', 'in-person'], default: 'online' },
  locationOrLink: String,
  feedback: { type: String, maxlength: 3000 },
  outcome: { type: String, enum: ['pending', 'pass', 'fail'], default: 'pending' }
}, { timestamps: true });

const offerSchema = new Schema({
  application: { type: Schema.Types.ObjectId, ref: 'Application', required: true, unique: true },
  type: { type: String, enum: ['placement', 'internship'], required: true },
  title: String,
  compensation: String,
  issuedAt: { type: Date, default: Date.now },
  response: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' }
}, { timestamps: true });

const driveSchema = new Schema({
  title: { type: String, required: true },
  date: { type: Date, required: true },
  location: String,
  jobs: [{ type: Schema.Types.ObjectId, ref: 'Job' }],
  status: { type: String, enum: ['planned', 'active', 'completed', 'cancelled'], default: 'planned' }
}, { timestamps: true });

const auditSchema = new Schema({
  actor: { type: Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  entityType: String,
  entityId: String,
  metadata: Schema.Types.Mixed,
  ip: String
}, { timestamps: true });

export const User = model('User', userSchema);
export const Student = model('Student', studentSchema);
export const Recruiter = model('Recruiter', recruiterSchema);
export const Job = model('Job', jobSchema);
export const Application = model('Application', applicationSchema);
export const Branch = model('Branch', branchSchema);
export const Notification = model('Notification', notificationSchema);
export const Assessment = model('Assessment', assessmentSchema);
export const Attempt = model('Attempt', attemptSchema);
export const Interview = model('Interview', interviewSchema);
export const Offer = model('Offer', offerSchema);
export const PlacementDrive = model('PlacementDrive', driveSchema);
export const AuditLog = model('AuditLog', auditSchema);
