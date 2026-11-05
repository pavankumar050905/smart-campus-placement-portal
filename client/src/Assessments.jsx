import React, { useEffect, useMemo, useState } from 'react';
import { Clock3, ClipboardCheck, Sparkles, History, ShieldCheck } from 'lucide-react';
import api from './api';

const SELF_COUNTS = [10, 15, 20, 30, 40, 50];
const RECRUITER_COUNTS = [10, 15];

export default function Assessments({ user }) {
  const [items,setItems]=useState([]);
  const [history,setHistory]=useState([]);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [active,setActive]=useState(null);
  const [attemptId,setAttemptId]=useState('');
  const [answers,setAnswers]=useState({});
  const [remaining,setRemaining]=useState(0);
  const [result,setResult]=useState(null);
  const [skills,setSkills]=useState('');
  const [targetRole,setTargetRole]=useState('');
  const [title,setTitle]=useState('');
  const [count,setCount]=useState(10);
  const [difficulty,setDifficulty]=useState('mixed');
  const [duration,setDuration]=useState(30);
  const [branch,setBranch]=useState('');
  const [branches,setBranches]=useState([]);
  const [jobOptions,setJobOptions]=useState([]);
  const [selectedJob,setSelectedJob]=useState('');
  const [applications,setApplications]=useState([]);
  const isStudent=user?.role==='student';
  const isManager=['admin','officer'].includes(user?.role);
  const isRecruiter=user?.role==='recruiter';

  const load=async()=>{
    setError('');
    try {
      const [a,h]=await Promise.all([
        api.get('/assessments'),
        isStudent ? api.get('/assessments/attempts/me') : Promise.resolve({data:[]})
      ]);
      setItems(a.data||[]); setHistory(h.data||[]);
    } catch(e){setError(e.response?.data?.message||'Could not load assessments.');}
  };
  useEffect(()=>{load();},[]);
  useEffect(()=>{
    if(!isRecruiter) return;
    api.get('/recruiter/jobs').then(r=>setJobOptions(r.data||[])).catch(()=>{});
  },[isRecruiter]);
  useEffect(()=>{
  if(!isManager) return;

  api.get('/branches')
    .then(r=>setBranches(r.data||[]))
    .catch(e=>setError(
      e.response?.data?.message || 'Could not load engineering branches.'
    ));
},[isManager]);
  useEffect(()=>{
    if(!selectedJob || !isRecruiter) {setApplications([]);return;}
    api.get(`/recruiter/jobs/${selectedJob}/applications`).then(r=>setApplications(r.data||[])).catch(()=>setApplications([]));
  },[selectedJob,isRecruiter]);
  useEffect(()=>{
    if(!active || result) return;
    const timer=setInterval(()=>{
      setRemaining(prev=>{
        if(prev<=1){clearInterval(timer);return 0;}
        return prev-1;
      });
    },1000);
    return ()=>clearInterval(timer);
  },[active,result]);
  useEffect(()=>{
    if(active && remaining===0 && !result) submitAttempt(true);
  },[remaining,active,result]);

  const formatTime=seconds=>`${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`;
  const start=async id=>{
    setBusy(true);setError('');setResult(null);
    try{
      const {data}=await api.post(`/assessments/${id}/start`);
      setActive(data.assessment);setAttemptId(data.attemptId);setAnswers({});
      const end=new Date(data.expiresAt).getTime();
      setRemaining(Math.max(0,Math.floor((end-Date.now())/1000)));
    }catch(e){setError(e.response?.data?.message||'Unable to start assessment.');}
    finally{setBusy(false);}
  };
  const submitAttempt=async automatic=>{
    if(!active || !attemptId || busy) return;
    setBusy(true);
    try{
      const payload=Object.entries(answers).map(([questionIndex,selectedOption])=>({questionIndex:Number(questionIndex),selectedOption:Number(selectedOption)}));
      const {data}=await api.post(`/assessments/${active._id}/submit`,{attemptId,answers:payload});
      setResult(data);setActive(null);setMessage(automatic?'Time ended. Your answers were submitted automatically.':'Assessment submitted successfully.');
      await load();
    }catch(e){setError(e.response?.data?.message||'Unable to submit assessment.');}
    finally{setBusy(false);}
  };
  const generate=async e=>{
    e.preventDefault();setBusy(true);setError('');setMessage('');
    try{
      const {data}=await api.post('/assessments/generate',{
        title:title||undefined,targetRole:targetRole||undefined,
        skills:skills.split(',').map(s=>s.trim()).filter(Boolean),
        questionCount:Number(count),difficulty,durationMinutes:Number(duration)
      });
      if(data.generationSource !== 'groq') {
        throw new Error('The AI generator did not return a Groq assessment. Please restart the backend and try again.');
      }
      setMessage('Your role-specific AI assessment is ready.');
      setTitle('');await load();
      if(data.assessment?._id) await start(data.assessment._id);
    }catch(e){setError(e.response?.data?.message||'Could not generate assessment.');}
    finally{setBusy(false);}
  };
  const createUniversity=async e=>{
    e.preventDefault();setBusy(true);setError('');setMessage('');
    try{
      const {data}=await api.post('/assessments/university',{
  title:title||'University placement readiness assessment',
  targetRole:targetRole||undefined,
  targetBranch:branch,
  durationMinutes:Number(duration)
});
      setMessage(`University assessment created and assigned to ${data.assignedCount} students.`);
      setTitle('');await load();
    }catch(e){setError(e.response?.data?.message||'Could not create university assessment.');}
    finally{setBusy(false);}
  };
  const assignCompany=async e=>{
    e.preventDefault();setBusy(true);setError('');setMessage('');
    try{
      const {data}=await api.post('/assessments/assign',{
        applicationId:selectedApplication,targetRole:jobOptions.find(j=>j._id===selectedJob)?.title,
        title:title||undefined,skills:skills.split(',').map(s=>s.trim()).filter(Boolean),
        questionCount:Number(count),difficulty,durationMinutes:Number(duration)
      });
      setMessage(`Assessment assigned successfully using ${data.assessment?.questionCount || count} questions from the applicant's branch question bank.`);
      setTitle('');await load();
    }catch(e){setError(e.response?.data?.message||'Could not assign assessment.');}
    finally{setBusy(false);}
  };
  const [selectedApplication,setSelectedApplication]=useState('');
  const totalQuestions=active?.questions?.length||0;
  const answered=Object.keys(answers).length;

  if(active) return <div className="assessment-page">
    <div className="assessment-top panel">
      <div><p className="eyebrow">LIVE ASSESSMENT</p><h1>{active.title}</h1><p className="muted">{totalQuestions} questions · {active.durationMinutes} minutes</p></div>
      <div className={`timer ${remaining<60?'timer-warning':''}`}><Clock3 size={18}/><strong>{formatTime(remaining)}</strong></div>
    </div>
    <div className="assessment-progress"><span style={{width:`${totalQuestions?answered/totalQuestions*100:0}%`}}/></div>
    {active.questions.map((q,i)=><section className="panel question-card" key={i}>
      <div className="question-meta"><span>Question {i+1} of {totalQuestions}</span><span>{q.topic} · {q.difficulty}</span></div>
      <h3>{q.prompt}</h3>
      <div className="answer-options">{q.options.map((option,j)=><label className={`answer-option ${answers[i]===j?'selected':''}`} key={j}>
        <input type="radio" name={`q-${i}`} checked={answers[i]===j} onChange={()=>setAnswers(prev=>({...prev,[i]:j}))}/>
        <span>{String.fromCharCode(65+j)}.</span>{option}
      </label>)}</div>
    </section>)}
    <div className="assessment-submit"><span className="muted">{answered}/{totalQuestions} answered</span><button className="primary" disabled={busy} onClick={()=>submitAttempt(false)}>{busy?'Submitting...':'Submit assessment'}</button></div>
  </div>;

  if(result) return <div className="assessment-page">
    <div className="panel result-panel">
      <p className="eyebrow">ASSESSMENT RESULT</p><h1>{result.percentage}%</h1>
      <p className="muted">You scored {result.score} out of {result.maxScore} points.</p>
      <div className="result-topics">{(result.topicBreakdown||[]).map(t=><div className="topic-result" key={t.topic}><span>{t.topic}</span><strong>{t.percentage}%</strong><small>{t.correct}/{t.total} correct</small></div>)}</div>
      <h2>Recommended improvement areas</h2>
      {(result.recommendations||[]).length?result.recommendations.map((r,i)=><p key={i}>• {r}</p>):<p className="muted">Great work. No major topic gaps were identified in this attempt.</p>}
      <button className="primary" onClick={()=>{setResult(null);setMessage('');load();}}>Back to assessments</button>
    </div>
    <h2>Answer review</h2>
    {(result.review||[]).map(q=><div className="panel question-review" key={q.index}><b>{q.index+1}. {q.prompt}</b><p>Your answer: {q.selectedOption===null?'Not answered':q.options[q.selectedOption]}</p><p className="correct-answer">Correct answer: {q.options[q.correctOption]}</p><small>{q.explanation}</small></div>)}
  </div>;

  return <div className="assessment-page">
    <div className="page-title"><p className="eyebrow">SKILLS & PLACEMENT READINESS</p><h1>AI assessments</h1><p className="muted">Practice with personalised questions, take assigned tests, and review your performance by topic.</p></div>
    {message&&<div className="notice">{message}</div>}{error&&<div className="error">{error}</div>}
    {isStudent&&<form className="panel assessment-form" onSubmit={generate}>
      <div className="section-heading"><div><h2><Sparkles size={19}/> Generate your own assessment</h2><p className="muted">Questions adapt to your branch, profile skills, projects and target role.</p></div></div>
      <div className="form-grid">
        <label>Assessment title<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="e.g. Full Stack Developer Readiness"/></label>
<label>
  Target role
  <input
    required
    value={targetRole}
    onChange={e=>setTargetRole(e.target.value)}
    placeholder="e.g. Java Developer"
  />
</label>        <label className="wide">Focus skills (comma separated)<input value={skills} onChange={e=>setSkills(e.target.value)} placeholder="Leave blank to use your profile skills"/></label>
<label>
  Number of questions
  <select value={count} onChange={e=>setCount(Number(e.target.value))}>
    {SELF_COUNTS.map(n=><option key={n} value={n}>{n}</option>)}
  </select>
</label>        <label>Difficulty<select value={difficulty} onChange={e=>setDifficulty(e.target.value)}><option value="mixed">Mixed</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
        <label>Duration (minutes)<input type="number" min="5" max="240" value={duration} onChange={e=>setDuration(e.target.value)}/></label>
      </div>
      <button className="primary" disabled={busy}>{busy?'Generating...':'Generate and start assessment'}</button>
    </form>}
    {isManager&&<form className="panel assessment-form" onSubmit={createUniversity}>
      <h2><ShieldCheck size={19}/> Create university assessment</h2><p className="muted">
  Create a fixed 25-question assessment using the selected branch's saved question bank.
</p>
      <div className="form-grid">
        <label>Title<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="University placement readiness test"/></label>
<label>
  Target branch
  <select
    required
    value={branch}
    onChange={e=>setBranch(e.target.value)}
  >
    <option value="">Select engineering branch</option>
    {branches.map(b=>(
      <option key={b._id || b.code} value={b.name}>
        {b.code} - {b.name}
      </option>
    ))}
  </select>
</label>        <label>Target role<input value={targetRole} onChange={e=>setTargetRole(e.target.value)} placeholder="Software Engineer"/></label>
<label>
  Questions
  <input type="text" value="25 (Fixed)" readOnly />
</label>        
        <label>Duration (minutes)<input type="number" min="5" max="240" value={duration} onChange={e=>setDuration(e.target.value)}/></label>
      </div><button className="primary" disabled={busy}>{busy?'Creating...':'Create and assign'}</button>
    </form>}
    {isRecruiter&&<form className="panel assessment-form" onSubmit={assignCompany}>
      <h2><ClipboardCheck size={19}/> Assign a company assessment</h2><p className="muted">
  Choose one of your jobs and an applicant. Questions are randomly selected
  from the applicant's branch-specific question bank.
</p>
      <div className="form-grid">
        <label>Job<select required value={selectedJob} onChange={e=>{setSelectedJob(e.target.value);setSelectedApplication('');}}><option value="">Select job</option>{jobOptions.map(j=><option key={j._id} value={j._id}>{j.title}</option>)}</select></label>
        <label>Applicant<select required value={selectedApplication} onChange={e=>setSelectedApplication(e.target.value)}><option value="">Select applicant</option>{applications.map(a=><option key={a._id} value={a._id}>{a.student?.user?.name||a.student?.studentId||'Student'} · {a.status}</option>)}</select></label>
        <label>Assessment title<input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Technical screening"/></label>
        <label>Focus skills<input value={skills} onChange={e=>setSkills(e.target.value)} placeholder="Leave blank to use job requirements"/></label>
<label>
  Questions
  <select value={count} onChange={e=>setCount(Number(e.target.value))}>
    {RECRUITER_COUNTS.map(n=><option key={n} value={n}>{n}</option>)}
  </select>
</label>        <label>Difficulty<select value={difficulty} onChange={e=>setDifficulty(e.target.value)}><option value="mixed">Mixed</option><option value="easy">Easy</option><option value="medium">Medium</option><option value="hard">Hard</option></select></label>
        <label>Duration (minutes)<input type="number" min="5" max="240" value={duration} onChange={e=>setDuration(e.target.value)}/></label>
      </div><button className="primary" disabled={busy||!selectedApplication}>{busy?'Assigning...':'Generate and assign assessment'}</button>
    </form>}
    <div className="section-heading"><div><h2>Available assessments</h2><p className="muted">University assessments and tests assigned to your account.</p></div><button className="secondary-button" onClick={load}>Refresh</button></div>
    <div className="assessment-list">
      {items.length===0?<div className="panel"><p className="muted">No assessments available yet. Generate one above or wait for an administrator/recruiter to assign one.</p></div>:items.map(a=><article className="panel assessment-item" key={a._id}>
        <div><span className="pill">{a.scope}</span><h3>{a.title}</h3><p className="muted">{a.targetRole||a.job?.title||a.targetBranch||'Placement readiness'} · {a.questionCount} questions · {a.durationMinutes} min · {a.difficulty}</p></div>
        {isStudent?<button className="primary" disabled={busy} onClick={()=>start(a._id)}>Start / Resume</button>:<button className="secondary-button" onClick={()=>api.get(`/assessments/${a._id}/analytics`).then(r=>setMessage(`${r.data.attempts} attempts · average ${r.data.averagePercentage}%`)).catch(e=>setError(e.response?.data?.message||'Analytics unavailable'))}>View analytics</button>}
      </article>)}
    </div>
    {isStudent&&<><div className="section-heading"><div><h2><History size={19}/> Your assessment history</h2><p className="muted">Previous attempts and scores.</p></div></div><div className="panel">
      {history.length===0?<p className="muted">Your completed assessments will appear here.</p>:history.map(a=><div className="user-row" key={a._id}><div><b>{a.assessment?.title||'Assessment'}</b><small>{a.status} · {a.submittedAt?new Date(a.submittedAt).toLocaleString():'Not submitted'}</small></div><strong>{a.percentage||0}%</strong></div>)}
    </div></>}
  </div>;
}
