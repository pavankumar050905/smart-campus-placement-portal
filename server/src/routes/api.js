import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import {
  User, Student, Recruiter, Job, Application, Branch, Notification,
  Assessment, Attempt, Interview, Offer, PlacementDrive, AuditLog
} from '../models/index.js';
import { authenticate, allowRoles } from '../middleware/auth.js';
import { evaluateEligibility } from '../services/eligibility.js';
import { generateCareerAdvice } from '../services/gemini.js';
import { generateAssessmentQuestions } from '../services/assessment.js';

const router = Router();
const registerSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email().transform(v => v.toLowerCase()),
  password: z.string().min(8).max(100),
  role: z.enum(['student', 'recruiter']),
  branch: z.string().trim().optional(),
  companyName: z.string().trim().optional()
});

router.get('/health', (_req, res) => res.json({ status: 'ok', service: 'smart-campus-placement-api' }));

router.post('/auth/register', async (req, res, next) => {
  try {
    const input = registerSchema.parse(req.body);
    if (await User.exists({ email: input.email })) return res.status(409).json({ message: 'Email already registered' });
    if (input.role === 'student' && !input.branch) return res.status(400).json({ message: 'Branch is required for students' });
    if (input.role === 'recruiter' && !input.companyName) return res.status(400).json({ message: 'Company name is required for recruiters' });
    const user = await User.create({
      name: input.name, email: input.email, passwordHash: await bcrypt.hash(input.password, 12), role: input.role
    });
    if (input.role === 'student') await Student.create({ user: user._id, branch: input.branch });
    else await Recruiter.create({ user: user._id, companyName: input.companyName });
    const token = jwt.sign({ sub: String(user._id), role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) { next(e); }
});

router.post('/auth/login', async (req, res, next) => {
  try {
    const email = String(req.body.email || '').toLowerCase().trim();
    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user || !user.active || !(await bcrypt.compare(String(req.body.password || ''), user.passwordHash))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const token = jwt.sign({ sub: String(user._id), role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (e) { next(e); }
});

router.get('/auth/me', authenticate, async (req, res) => res.json({ user: req.user }));

router.get('/branches', async (_req, res, next) => {
  try { res.json(await Branch.find({ active: true }).sort({ name: 1 }).select('code name')); } catch (e) { next(e); }
});

router.get('/students/me', authenticate, allowRoles('student'), async (req, res, next) => {
  try { res.json(await Student.findOne({ user: req.user._id }).populate('user', 'name email')); } catch (e) { next(e); }
});

router.patch('/students/me', authenticate, allowRoles('student'), async (req, res, next) => {
  try {
    const allowed = ['studentId','branch','graduationYear','cgpa','backlogs','skills','certifications','projects','resumeUrl','phone','bio'];
    const update = {};
    for (const key of allowed) if (req.body[key] !== undefined) update[key] = req.body[key];
    const student = await Student.findOneAndUpdate({ user: req.user._id }, { $set: update }, { new: true, runValidators: true });
    res.json(student);
  } catch (e) { next(e); }
});

router.get('/jobs', async (req, res, next) => {
  try {
    const query = { status: 'published' };
    if (req.query.search) query.title = { $regex: String(req.query.search).slice(0, 80), $options: 'i' };
    const jobs = await Job.find(query).sort({ createdAt: -1 }).limit(100).populate({ path: 'recruiter', populate: { path: 'user', select: 'name' } });
    res.json(jobs);
  } catch (e) { next(e); }
});

router.post('/jobs', authenticate, allowRoles('recruiter'), async (req, res, next) => {
  try {
    const recruiter = await Recruiter.findOne({ user: req.user._id });
    if (!recruiter) return res.status(400).json({ message: 'Recruiter profile missing' });
    const input = z.object({
      title: z.string().min(3).max(150), description: z.string().min(10).max(12000),
      location: z.string().max(200).optional(), jobType: z.enum(['Full-time','Internship','Contract']).optional(),
      salaryMin: z.number().min(0).optional(), salaryMax: z.number().min(0).optional(),
      requiredSkills: z.array(z.string().max(80)).max(50).optional(),
      eligibleBranches: z.array(z.string().max(100)).max(30).optional(),
      minCgpa: z.number().min(0).max(10).optional(), maxBacklogs: z.number().int().min(0).max(20).optional(),
      graduationYears: z.array(z.number().int()).max(10).optional(), deadline: z.string().optional()
    }).parse(req.body);
    const job = await Job.create({ ...input, recruiter: recruiter._id, status: 'pending' });
    res.status(201).json(job);
  } catch (e) { next(e); }
});

router.patch('/jobs/:id/publish', authenticate, allowRoles('admin','officer'), async (req, res, next) => {
  try {
    const job = await Job.findByIdAndUpdate(req.params.id, { status: 'published' }, { new: true, runValidators: true });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    res.json(job);
  } catch (e) { next(e); }
});

router.post('/jobs/:id/apply', authenticate, allowRoles('student'), async (req, res, next) => {
  try {
    const [student, job] = await Promise.all([
      Student.findOne({ user: req.user._id }), Job.findById(req.params.id)
    ]);
    if (!student) return res.status(400).json({ message: 'Student profile missing' });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    const result = evaluateEligibility(student, job);
    if (!result.eligible) return res.status(400).json({ message: 'Not eligible to apply', eligibility: result });
    const application = await Application.create({ student: student._id, job: job._id, eligibilitySnapshot: result });
    await Notification.create({ user: req.user._id, title: 'Application submitted', message: `Your application for ${job.title} was submitted.` });
    res.status(201).json(application);
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'You have already applied for this job' });
    next(e);
  }
});

router.get('/applications/me', authenticate, allowRoles('student'), async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    res.json(await Application.find({ student: student?._id }).sort({ createdAt: -1 }).populate('job'));
  } catch (e) { next(e); }
});

router.get('/recruiter/jobs', authenticate, allowRoles('recruiter'), async (req, res, next) => {
  try {
    const recruiter = await Recruiter.findOne({ user: req.user._id });
    res.json(await Job.find({ recruiter: recruiter?._id }).sort({ createdAt: -1 }));
  } catch (e) { next(e); }
});

router.get('/recruiter/jobs/:id/applications', authenticate, allowRoles('recruiter'), async (req, res, next) => {
  try {
    const recruiter = await Recruiter.findOne({ user: req.user._id });
    const job = await Job.findOne({ _id: req.params.id, recruiter: recruiter?._id });
    if (!job) return res.status(404).json({ message: 'Job not found' });
    const apps = await Application.find({ job: job._id })
  .populate({
    path: 'student',
    select: 'studentId branch graduationYear cgpa backlogs skills certifications projects resumeUrl phone bio',
    populate: {
      path: 'user',
      select: 'name email'
    }
  });
    res.json(apps);
  } catch (e) { next(e); }
});

router.patch('/applications/:id/status', authenticate, allowRoles('recruiter','officer','admin'), async (req, res, next) => {
  try {
    const statusSchema = z.object({
      status: z.enum(['shortlisted','assessment','interview','offered','rejected'])
    });

    const { status } = statusSchema.parse(req.body);

    const app = await Application.findById(req.params.id)
      .populate('job')
      .populate('student');

    if (!app) {
      return res.status(404).json({ message: 'Application not found' });
    }

    if (req.user.role === 'recruiter') {
      const recruiter = await Recruiter.findOne({ user: req.user._id });

      if (String(app.job.recruiter) !== String(recruiter?._id)) {
        return res.status(403).json({ message: 'Not your job application' });
      }
    }

    const previousStatus = app.status;

    app.status = status;
    await app.save();

    // Notify the student about the application status change
    if (previousStatus !== status && app.student?.user) {
      const statusMessages = {
        shortlisted: 'Your application has been shortlisted!',
        assessment: 'Your application has moved to the assessment stage.',
        interview: 'You have been selected for the interview stage.',
        offered: 'Congratulations! You have received an offer.',
        rejected: 'Your application status has been updated to rejected.'
      };

      await Notification.create({
        user: app.student.user,
        title: `Application ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your application for ${app.job.title} has been updated. ${statusMessages[status]}`
      });
    }

    res.json(app);

  } catch (e) {
    next(e);
  }
});

router.get('/dashboard/summary', authenticate, allowRoles('officer','admin'), async (_req, res, next) => {
  try {
    const [students, recruiters, jobs, applications, offers, byStatus] = await Promise.all([
      Student.countDocuments(), Recruiter.countDocuments(), Job.countDocuments(),
      Application.countDocuments(), Offer.countDocuments(),
      Application.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }])
    ]);
    res.json({ students, recruiters, jobs, applications, offers, byStatus });
  } catch (e) { next(e); }
});

router.get('/ai/career-advice', authenticate, allowRoles('student'), async (req, res, next) => {
  try {
    const student = await Student.findOne({ user: req.user._id });
    if (!student) return res.status(400).json({ message: 'Complete your student profile first' });
    const jobs = await Job.find({ status: 'published' }).limit(40);
    const advice = await generateCareerAdvice({ student, jobs });
    res.json(advice);
  } catch (e) { next(e); }
});


// ---------------- AI assessment workflow ----------------
const assessmentRequestSchema = z.object({
  title: z.string().trim().min(3).max(160).optional(),
  targetRole: z.string().trim().max(120).optional(),
  skills: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
  questionCount: z.union([z.literal(10),z.literal(20),z.literal(30),z.literal(50)]).default(10),
  difficulty: z.enum(['easy','medium','hard','mixed']).default('mixed'),
  durationMinutes: z.number().int().min(5).max(240).default(30)
});

function questionPayload(question, index) {
  return {
    index, prompt: question.prompt, type: question.type, options: question.options,
    topic: question.topic, difficulty: question.difficulty, points: question.points
  };
}

async function studentCanAccessAssessment(assessment, student) {
  if (!assessment.active) return false;
  if (assessment.scope === 'university') return !assessment.targetBranch || assessment.targetBranch === student.branch;
  return assessment.assignedStudents.some(id => String(id) === String(student._id));
}

router.get('/assessments', authenticate, async (req, res, next) => {
  try {
    let query = { active: true };
    let currentStudent = null;
    if (req.user.role === 'student') {
      currentStudent = await Student.findOne({ user: req.user._id });
      if (!currentStudent) return res.status(400).json({ message:'Student profile missing' });
      query = { ...query, $or:[{ scope:'university', $or:[{targetBranch:''},{targetBranch:currentStudent.branch}] }, { assignedStudents:currentStudent._id }] };
    } else if (req.user.role === 'recruiter') {
      const recruiter = await Recruiter.findOne({ user:req.user._id });
      if (!recruiter) return res.status(400).json({message:'Recruiter profile missing'});
      query = { ...query, recruiter:recruiter._id, scope:'company' };
    } else if (!['admin','officer'].includes(req.user.role)) {
      return res.status(403).json({ message:'Not authorised' });
    }
    const assessments = await Assessment.find(query).sort({ createdAt:-1 }).populate('job','title').populate('createdBy','name');
    const rows = await Promise.all(assessments.map(async a => {
      const attempts = req.user.role === 'student'
        ? await Attempt.find({ assessment:a._id, student:currentStudent._id, status:'submitted' }).select('percentage submittedAt').sort({createdAt:-1}).limit(1)
        : [];
      const data = a.toObject();
      return { ...data, latestAttempt:attempts[0] || null };
    }));
    res.json(rows);
  } catch(e) { next(e); }
});

router.post('/assessments/generate', authenticate, allowRoles('student'), async (req,res,next) => {
  try {
    const input = assessmentRequestSchema.parse(req.body);
    const student = await Student.findOne({ user:req.user._id });
    if (!student) return res.status(400).json({ message:'Complete your student profile first.' });
    const skills = input.skills?.length ? input.skills : (student.skills || []);
    const generated = await generateAssessmentQuestions({
      student, skills, targetRole:input.targetRole, count:input.questionCount,
      difficulty:input.difficulty, mode:'self'
    });
    const assessment = await Assessment.create({
      title:input.title || `${input.targetRole || student.branch} personalised practice`,
      description:`Personalised ${input.difficulty} assessment generated for ${student.branch}.`,
      scope:'self', createdBy:req.user._id, assignedStudents:[student._id],
      targetBranch:student.branch, targetRole:input.targetRole || '',
      skills, difficulty:input.difficulty, durationMinutes:input.durationMinutes,
      questionCount:generated.questions.length, questions:generated.questions, active:true
    });
    res.status(201).json({ assessment:{...assessment.toObject(), questions:undefined}, generationSource:generated.generationSource });
  } catch(e) { next(e); }
});

router.post('/assessments/university', authenticate, allowRoles('admin','officer'), async (req,res,next) => {
  try {
    const input = assessmentRequestSchema.extend({
      targetBranch:z.string().trim().max(120).optional(),
      description:z.string().max(2000).optional()
    }).parse(req.body);
    const branchFilter = input.targetBranch ? { branch:input.targetBranch } : {};
    const students = await Student.find(branchFilter).populate('user','_id').limit(500);
    const generated = await generateAssessmentQuestions({
      student:{ branch:input.targetBranch || 'All engineering branches', skills:input.skills || [] },
      skills:input.skills || [], targetRole:input.targetRole, count:input.questionCount,
      difficulty:input.difficulty, mode:'university'
    });
    const assessment = await Assessment.create({
      title:input.title || 'University placement assessment',
      description:input.description || 'University-wide assessment for placement readiness.',
      scope:'university', createdBy:req.user._id, assignedStudents:students.map(s=>s._id),
      targetBranch:input.targetBranch || '', targetRole:input.targetRole || '',
      skills:input.skills || [], difficulty:input.difficulty,
      durationMinutes:input.durationMinutes, questionCount:generated.questions.length,
      questions:generated.questions, active:true
    });
    if (students.length) {
      await Notification.insertMany(students.filter(s=>s.user?._id).map(s=>({
        user:s.user._id, title:'University assessment available',
        message:`${assessment.title} is now available in your Assessments workspace.`
      })));
    }
    res.status(201).json({ assessment:{...assessment.toObject(),questions:undefined}, generationSource:generated.generationSource, assignedCount:students.length });
  } catch(e) { next(e); }
});

router.post('/assessments/assign', authenticate, allowRoles('admin','officer','recruiter'), async (req,res,next) => {
  try {
    const input = assessmentRequestSchema.extend({
      applicationId:z.string().min(1),
      description:z.string().max(2000).optional()
    }).parse(req.body);
    const application = await Application.findById(input.applicationId).populate('job');
    if (!application || !application.job) return res.status(404).json({message:'Application or associated job not found'});
    let recruiter = null;
    if (req.user.role === 'recruiter') {
      recruiter = await Recruiter.findOne({user:req.user._id});
      if (!recruiter || String(application.job.recruiter) !== String(recruiter._id)) return res.status(403).json({message:'You can only assign assessments to applicants for your own jobs.'});
    }
    const student = await Student.findById(application.student);
    if (!student) return res.status(404).json({message:'Applicant student profile not found'});
    const generated = await generateAssessmentQuestions({
      student, skills:input.skills?.length ? input.skills : (application.job.requiredSkills || []),
      targetRole:input.targetRole || application.job.title, count:input.questionCount,
      difficulty:input.difficulty, mode:'company'
    });
    const assessment = await Assessment.create({
      title:input.title || `${application.job.title} screening assessment`,
      description:input.description || `Assessment assigned for ${application.job.title}.`,
      scope:'company', createdBy:req.user._id, recruiter:recruiter?._id || application.job.recruiter,
      job:application.job._id, application:application._id, assignedStudents:[student._id],
      targetBranch:student.branch, targetRole:application.job.title,
      skills:input.skills?.length ? input.skills : application.job.requiredSkills,
      difficulty:input.difficulty, durationMinutes:input.durationMinutes,
      questionCount:generated.questions.length, questions:generated.questions, active:true
    });
    await Notification.create({ user:(await User.findById(student.user))._id, title:'Assessment assigned', message:`${assessment.title} has been assigned to you.` });
    res.status(201).json({ assessment:{...assessment.toObject(),questions:undefined}, generationSource:generated.generationSource });
  } catch(e) { next(e); }
});

router.post('/assessments/:id/start', authenticate, allowRoles('student'), async (req,res,next) => {
  try {
    const student = await Student.findOne({user:req.user._id});
    const assessment = await Assessment.findById(req.params.id).select('+questions');
    if (!student || !assessment || !(await studentCanAccessAssessment(assessment,student))) return res.status(404).json({message:'Assessment not found or not assigned to you.'});
    if (!assessment.questions?.length) return res.status(400).json({message:'This assessment has no questions.'});
    const existing = await Attempt.findOne({assessment:assessment._id,student:student._id,status:'in-progress'});
    if (existing && existing.expiresAt > new Date()) {
      return res.json({attemptId:existing._id,expiresAt:existing.expiresAt,assessment:{_id:assessment._id,title:assessment.title,durationMinutes:assessment.durationMinutes,questions:assessment.questions.map(questionPayload)}});
    }
    if (existing) { existing.status='expired'; await existing.save(); }
    const attempt = await Attempt.create({
      assessment:assessment._id,student:student._id,status:'in-progress',
      maxScore:assessment.questions.reduce((sum,q)=>sum+(q.points||1),0),
      expiresAt:new Date(Date.now()+assessment.durationMinutes*60*1000)
    });
    res.json({attemptId:attempt._id,expiresAt:attempt.expiresAt,assessment:{_id:assessment._id,title:assessment.title,durationMinutes:assessment.durationMinutes,questions:assessment.questions.map(questionPayload)}});
  } catch(e) { next(e); }
});

router.post('/assessments/:id/submit', authenticate, allowRoles('student'), async (req,res,next) => {
  try {
    const student = await Student.findOne({user:req.user._id});
    const attempt = await Attempt.findOne({_id:req.body.attemptId,assessment:req.params.id,student:student?._id});
    if (!attempt) return res.status(404).json({message:'Assessment attempt not found.'});
    if (attempt.status !== 'in-progress') return res.status(409).json({message:'This attempt has already been submitted or expired.'});
    const assessment = await Assessment.findById(req.params.id).select('+questions');
    if (!assessment || !(await studentCanAccessAssessment(assessment,student))) return res.status(404).json({message:'Assessment not found.'});
    if (new Date() > attempt.expiresAt) attempt.status='expired';
    const submitted = Array.isArray(req.body.answers) ? req.body.answers : [];
    const answerMap = new Map(submitted.map(a=>[Number(a.questionIndex),Number(a.selectedOption)]));
    let score=0, maxScore=0;
    const topics = new Map();
    assessment.questions.forEach((q,index)=>{
      const topic=q.topic || 'General';
      const row=topics.get(topic)||{topic,correct:0,total:0,percentage:0};
      const points=Number(q.points||1); maxScore+=points; row.total+=1;
      if (answerMap.get(index) === Number(q.correctOption)) { score+=points; row.correct+=1; }
      topics.set(topic,row);
    });
    for (const row of topics.values()) row.percentage=Math.round(row.correct/row.total*100);
    attempt.answers=submitted.filter(a=>Number.isInteger(Number(a.questionIndex)) && Number.isInteger(Number(a.selectedOption))).map(a=>({questionIndex:Number(a.questionIndex),selectedOption:Number(a.selectedOption)}));
    attempt.score=score; attempt.maxScore=maxScore; attempt.percentage=maxScore?Math.round(score/maxScore*100):0;
    attempt.topicBreakdown=[...topics.values()];
    attempt.recommendations=[...topics.values()].filter(t=>t.percentage<70).sort((a,b)=>a.percentage-b.percentage).map(t=>`Revise ${t.topic}: your score was ${t.percentage}%. Practise related concepts and questions.`);
    attempt.status=attempt.status==='expired'?'expired':'submitted';
    attempt.submittedAt=new Date(); attempt.durationSeconds=Math.max(0,Math.round((attempt.submittedAt-attempt.startedAt)/1000));
    await attempt.save();
    const review=assessment.questions.map((q,index)=>({
      ...questionPayload(q,index), selectedOption:answerMap.has(index)?answerMap.get(index):null,
      correctOption:q.correctOption, explanation:q.explanation
    }));
    res.json({attemptId:attempt._id,status:attempt.status,score,maxScore,percentage:attempt.percentage,topicBreakdown:attempt.topicBreakdown,recommendations:attempt.recommendations,review});
  } catch(e) { next(e); }
});

router.get('/assessments/attempts/me', authenticate, allowRoles('student'), async (req,res,next) => {
  try {
    const student=await Student.findOne({user:req.user._id});
    const attempts=await Attempt.find({student:student?._id}).sort({createdAt:-1}).limit(100).populate('assessment','title scope targetRole');
    res.json(attempts);
  } catch(e) { next(e); }
});

router.get('/assessments/:id/analytics', authenticate, allowRoles('admin','officer','recruiter'), async (req,res,next) => {
  try {
    const assessment=await Assessment.findById(req.params.id);
    if (!assessment) return res.status(404).json({message:'Assessment not found'});
    if (req.user.role==='recruiter') {
      const recruiter=await Recruiter.findOne({user:req.user._id});
      if (!recruiter || String(assessment.recruiter)!==String(recruiter._id)) return res.status(403).json({message:'Not your assessment'});
    }
    const attempts=await Attempt.find({assessment:assessment._id,status:{$in:['submitted','expired']}}).populate('student','studentId branch');
    const average=attempts.length?Math.round(attempts.reduce((s,a)=>s+a.percentage,0)/attempts.length):0;
    res.json({assessment:{id:assessment._id,title:assessment.title},attempts:attempts.length,averagePercentage:average,results:attempts.map(a=>({student:a.student,score:a.score,maxScore:a.maxScore,percentage:a.percentage,submittedAt:a.submittedAt,topicBreakdown:a.topicBreakdown}))});
  } catch(e) { next(e); }
});

router.get('/notifications/me', authenticate, async (req, res, next) => {
  try { res.json(await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100)); } catch (e) { next(e); }
});

router.get('/admin/jobs', authenticate, allowRoles('admin', 'officer'), async (req, res, next) => {
  try {
    const status = String(req.query.status || 'pending');

    const jobs = await Job.find({ status })
      .sort({ createdAt: -1 })
      .populate({
        path: 'recruiter',
        populate: {
          path: 'user',
          select: 'name email'
        }
      });

    res.json(jobs);
  } catch (e) {
    next(e);
  }
});

router.get('/admin/users', authenticate, allowRoles('admin','officer'), async (_req, res, next) => {
  try { res.json(await User.find().select('name email role active createdAt').sort({ createdAt: -1 }).limit(500)); } catch (e) { next(e); }
});

router.get('/admin/audit-logs', authenticate, allowRoles('admin'), async (_req, res, next) => {
  try { res.json(await AuditLog.find().sort({ createdAt: -1 }).limit(200)); } catch (e) { next(e); }
});

export default router;
