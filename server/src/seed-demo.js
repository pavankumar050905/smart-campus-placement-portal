import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { connectDB } from './config/db.js';
import {
  User, Student, Recruiter, Job, Application, Branch, Assessment, Attempt, Notification
} from './models/index.js';
import { fallbackBank } from './services/assessment.js';

const firstNames = ['Aarav','Aditi','Arjun','Ananya','Ishaan','Diya','Kabir','Meera','Rohan','Sara','Vivaan','Ira','Advik','Kiara','Reyansh','Tara','Nikhil','Pooja','Karthik','Sneha'];
const lastNames = ['Sharma','Reddy','Kumar','Patel','Iyer','Nair','Gupta','Rao','Das','Joshi','Menon','Singh','Verma','Shetty','Mishra'];
const companies = ['Nexora Technologies','BluePeak Systems','CloudBridge Labs','Aster Digital','Vertex Innovations','Orbit Software','DataSpring','BrightLayer','QuantumWorks','CodeHarbor'];
const roles = ['Graduate Software Engineer','Full Stack Developer','Java Developer','Python Developer','Data Analyst','Cloud Engineer','AI Engineer','QA Automation Engineer','Cybersecurity Analyst','Frontend Developer'];
const skillsByRole = [
  ['Java','DSA','SQL','OOP'],['React','Node.js','JavaScript','MongoDB'],['Java','Spring Boot','SQL','REST APIs'],
  ['Python','FastAPI','SQL','Pandas'],['Python','SQL','Excel','Power BI'],['AWS','Linux','Docker','Networking'],
  ['Python','Machine Learning','Statistics','TensorFlow'],['JavaScript','Selenium','Testing','API Testing'],
  ['Networking','Linux','Security','Python'],['React','JavaScript','HTML','CSS']
];
const branchFallback = [
  ['CSE','Computer Science and Engineering'],['AIML','Artificial Intelligence and Machine Learning'],['AIDS','Artificial Intelligence and Data Science'],
  ['IT','Information Technology'],['ECE','Electronics and Communication Engineering'],['EEE','Electrical and Electronics Engineering'],
  ['ME','Mechanical Engineering'],['CE','Civil Engineering'],['ISE','Information Science and Engineering'],['CY','Cyber Security'],
  ['DS','Data Science'],['CSBS','Computer Science and Business Systems'],['IOT','Internet of Things'],['CS','Computer Science'],
  ['CSE-AI','CSE - Artificial Intelligence'],['CSE-DS','CSE - Data Science'],['CSE-CY','CSE - Cyber Security'],
  ['CSE-IOT','CSE - Internet of Things'],['VLSI','VLSI Design'],['ETE','Electronics and Telecommunication Engineering'],
  ['EIE','Electronics and Instrumentation Engineering'],['AE','Aerospace Engineering'],['AUTO','Automobile Engineering'],
  ['CHE','Chemical Engineering'],['BIO','Biotechnology'],['BT','Bioinformatics'],['ARCH','Architecture'],
  ['MCA','Computer Applications'],['ROBOTICS','Robotics and Automation'],['OTHER','Other Engineering Branch']
];

await connectDB();
for (const [code,name] of branchFallback) {
  await Branch.updateOne({code},{$set:{code,name,active:true}},{upsert:true});
}
const branches = await Branch.find({active:true}).sort({code:1});
const passwordHash = await bcrypt.hash('DemoPass123!',12);
await User.updateOne({email:'admin@campus.demo'},{$set:{name:'Demo Administrator',email:'admin@campus.demo',role:'admin',active:true,isDemo:true},$setOnInsert:{passwordHash}},{upsert:true});
const adminUser=await User.findOne({email:'admin@campus.demo'});
const studentDocs=[];
const recruiterDocs=[];

for(let i=1;i<=500;i++){
  const n=i-1;
  const name=`${firstNames[n%firstNames.length]} ${lastNames[Math.floor(n/firstNames.length)%lastNames.length]}`;
  const email=`demo.student${String(i).padStart(3,'0')}@campus.demo`;
  const branch=branches[n%branches.length]?.name || 'Computer Science and Engineering';
  const skills=skillsByRole[n%skillsByRole.length];
  await User.updateOne({email},{$set:{name,email,role:'student',active:true,isDemo:true},$setOnInsert:{passwordHash}},{upsert:true});
  const user=await User.findOne({email});
  await Student.updateOne({user:user._id},{$set:{
    user:user._id,studentId:`DEMO${String(i).padStart(4,'0')}`,branch,
    graduationYear:2026+(n%3),cgpa:Number((6.5+(n%35)/10).toFixed(2)),
    backlogs:n%17===0?1:0,skills,
    certifications:[{name:`${skills[0]} Foundations`,issuer:'CampusPath Demo Academy',year:2025}],
    projects:[{title:`${skills[0]} Student Project ${i}`,description:'Synthetic demonstration project record.',technologies:skills.slice(0,3)}],
    bio:'Synthetic demo student profile.',isDemo:true
  }},{upsert:true});
  studentDocs.push(await Student.findOne({user:user._id}));
}
for(let i=1;i<=50;i++){
  const email=`demo.recruiter${String(i).padStart(2,'0')}@campus.demo`;
  const company=companies[(i-1)%companies.length]+(i>10?` ${Math.ceil(i/10)}`:'');
  await User.updateOne({email},{$set:{name:`Recruiter ${i}`,email,role:'recruiter',active:true,isDemo:true},$setOnInsert:{passwordHash}},{upsert:true});
  const user=await User.findOne({email});
  await Recruiter.updateOne({user:user._id},{$set:{user:user._id,companyName:company,industry:'Technology',verified:true,isDemo:true}},{upsert:true});
  recruiterDocs.push(await Recruiter.findOne({user:user._id}));
}
const jobDocs=[];
for(let i=0;i<150;i++){
  const recruiter=recruiterDocs[i%recruiterDocs.length];
  const roleIndex=i%roles.length;
  const title=roles[roleIndex];
  const jobTitle=`${title} - Graduate ${String(Math.floor(i/10)+1).padStart(2,'0')}`;
  const input={
    recruiter:recruiter._id,title:jobTitle,
    description:`Synthetic demo vacancy for ${title}. Candidates should demonstrate ${skillsByRole[roleIndex].join(', ')} and problem-solving ability.`,
    location:['Bengaluru','Hyderabad','Pune','Chennai','Remote'][i%5],
    jobType:i%4===0?'Internship':'Full-time',
    requiredSkills:skillsByRole[roleIndex],
    eligibleBranches:branches.filter((b,j)=>j%3===i%3).map(b=>b.name),
    minCgpa:6+(i%4)*0.5,maxBacklogs:i%5===0?1:0,
    graduationYears:[2026,2027,2028],deadline:new Date(Date.now()+90*86400000),
    status:'published',isDemo:true
  };
  await Job.updateOne({recruiter:recruiter._id,title:jobTitle},{$set:input},{upsert:true});
  jobDocs.push(await Job.findOne({recruiter:recruiter._id,title:jobTitle}));
}
for(let i=0;i<1000;i++){
  const student=studentDocs[(i*13)%studentDocs.length];
  const job=jobDocs[(i*7)%jobDocs.length];
  await Application.updateOne({student:student._id,job:job._id},{$setOnInsert:{
    student:student._id,job:job._id,status:['applied','shortlisted','assessment','interview'][i%4],
    eligibilitySnapshot:{eligible:true,reasons:[]},isDemo:true
  }},{upsert:true});
}
const demoQuestions = [];

for (let i = 0; i < 25; i++) {
  const q = fallbackBank[i % fallbackBank.length];

  demoQuestions.push({
    prompt: q.prompt,
    type: q.type,
    options: q.options,
    correctOption: q.correctOption,
    explanation: q.explanation,
    topic: q.topic,
    difficulty: ['easy', 'medium', 'hard'][i % 3],
    points: 1
  });
}
const assessments=[];
for(let i=0;i<20;i++){
  const title=`Demo Placement Assessment ${String(i+1).padStart(2,'0')}`;
  const targetBranch=i%2?branches[i%branches.length].name:'';
  const assigned=targetBranch?studentDocs.filter(s=>s.branch===targetBranch):studentDocs;
  const input={
    title,description:'Synthetic demonstration assessment. Not an official university examination.',
    scope:'university',createdBy:adminUser._id,
    assignedStudents:assigned.map(s=>s._id),targetBranch,
    targetRole:roles[i%roles.length],skills:skillsByRole[i%skillsByRole.length],
    difficulty:'mixed',durationMinutes:30,questionCount:25,questions:demoQuestions,active:true,isDemo:true
  };
  await Assessment.updateOne({title,isDemo:true},{$set:input},{upsert:true});
  assessments.push(await Assessment.findOne({title,isDemo:true}).select('+questions'));
}
await Attempt.deleteMany({isDemo:true});
for(let i=0;i<300;i++){
  const assessment=assessments[i%assessments.length];
  const student=studentDocs[(i*11)%studentDocs.length];
  const maxScore=assessment.questions.length;
  const score=10+(i%16);
  await Attempt.create({
    assessment:assessment._id,student:student._id,
    answers:[],status:'submitted',score,maxScore,percentage:Math.round(score/maxScore*100),
    topicBreakdown:[{topic:'Programming fundamentals',correct:score,total:maxScore,percentage:Math.round(score/maxScore*100)}],
    recommendations:score<18?['Review the topics with lower scores and attempt practice questions.']:[],
    startedAt:new Date(Date.now()-(i%30)*86400000-3600000),
    expiresAt:new Date(Date.now()-(i%30)*86400000-1800000),
    submittedAt:new Date(Date.now()-(i%30)*86400000-1800000),
    durationSeconds:1800,isDemo:true
  });
}
for(let i=0;i<500;i++){
  const student=studentDocs[i];
  await Notification.updateOne({user:student.user,title:'CampusPath demo notification'},{$set:{
    user:student.user,title:'CampusPath demo notification',
    message:'This is a synthetic notification used to demonstrate the placement portal.',
    channel:'in-app',isDemo:true
  }},{upsert:true});
}
console.log('Synthetic demo dataset ready: 500 students, 50 recruiters, 150 jobs, 1,000 applications, 20 assessments with 25 MCQs each (500 MCQ records), 300 attempts, and 500 notifications.');
console.log('Synthetic demo login pattern: demo.student001@campus.demo through demo.student500@campus.demo; demo.recruiter01@campus.demo through demo.recruiter50@campus.demo; password: DemoPass123!');
process.exit(0);
