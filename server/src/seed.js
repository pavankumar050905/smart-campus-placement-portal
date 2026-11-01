import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import { User, Student, Recruiter, Branch, Job } from './models/index.js';

const branches = [
 ['CSE','Computer Science and Engineering'],['AIML','Artificial Intelligence and Machine Learning'],
 ['AIDS','Artificial Intelligence and Data Science'],['IT','Information Technology'],
 ['ECE','Electronics and Communication Engineering'],['EEE','Electrical and Electronics Engineering'],
 ['ME','Mechanical Engineering'],['CE','Civil Engineering'],['ISE','Information Science and Engineering'],
 ['CY','Cyber Security'],['DS','Data Science'],['CSBS','Computer Science and Business Systems'],
 ['IOT','Internet of Things'],['CS','Computer Science'],['CSE-AI','CSE - Artificial Intelligence'],
 ['CSE-DS','CSE - Data Science'],['CSE-CY','CSE - Cyber Security'],['CSE-IOT','CSE - Internet of Things'],
 ['VLSI','VLSI Design'],['ETE','Electronics and Telecommunication Engineering'],
 ['EIE','Electronics and Instrumentation Engineering'],['AE','Aerospace Engineering'],
 ['AUTO','Automobile Engineering'],['CHE','Chemical Engineering'],['BIO','Biotechnology'],
 ['BT','Bioinformatics'],['ARCH','Architecture'],['MCA','Computer Applications'],
 ['ROBOTICS','Robotics and Automation'],['OTHER','Other Engineering Branch']
];

await connectDB();
for (const [code, name] of branches) await Branch.updateOne({ code }, { $set: { code, name, active: true } }, { upsert: true });

const passwordHash = await bcrypt.hash('ChangeMe123!', 12);
async function ensureUser(email, name, role) {
  let user = await User.findOne({ email });
  if (!user) user = await User.create({ email, name, role, passwordHash });
  return user;
}
const admin = await ensureUser('admin@campus.demo', 'Demo Administrator', 'admin');
const studentUser = await ensureUser('student@campus.demo', 'Demo Student', 'student');
const recruiterUser = await ensureUser('recruiter@campus.demo', 'Demo Recruiter', 'recruiter');
await Student.updateOne({ user: studentUser._id }, {
  $setOnInsert: { user: studentUser._id, studentId: 'DEMO001', branch: 'Computer Science and Engineering', graduationYear: 2027, cgpa: 8.4, backlogs: 0, skills: ['JavaScript','React','Node.js','SQL'], certifications: [{ name: 'Elements of AI', issuer: 'University course' }], projects: [{ title: 'Smart Campus Portal', technologies: ['React','Node.js','MongoDB'] }] }
}, { upsert: true });
const recruiter = await Recruiter.findOneAndUpdate({ user: recruiterUser._id }, { $setOnInsert: { user: recruiterUser._id, companyName: 'Demo Technologies', industry: 'Software' } }, { upsert: true, new: true });
await Job.updateOne({ title: 'Graduate Software Developer', recruiter: recruiter._id }, {
  $setOnInsert: { recruiter: recruiter._id, title: 'Graduate Software Developer', description: 'Entry-level software role for students interested in full-stack development.', location: 'Bengaluru / Hybrid', jobType: 'Full-time', requiredSkills: ['JavaScript','React','Node.js'], eligibleBranches: ['Computer Science and Engineering','Information Technology','Artificial Intelligence and Machine Learning'], minCgpa: 7, maxBacklogs: 0, graduationYears: [2026,2027], deadline: new Date(Date.now() + 30*24*60*60*1000), status: 'published' }
}, { upsert: true });

console.log('Seed complete. Demo accounts: admin@campus.demo, student@campus.demo, recruiter@campus.demo — password ChangeMe123!');
process.exit(0);
