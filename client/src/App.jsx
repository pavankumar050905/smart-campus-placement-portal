import React from 'react';

import { useEffect, useState } from 'react';

import { Link, Navigate, Route, Routes, useNavigate } from 'react-router-dom';

import { useDispatch, useSelector } from 'react-redux';

import {

  BriefcaseBusiness,

  GraduationCap,

  LayoutDashboard,

  LogOut,

  Sparkles,

  Users,

  Bell,

  Search,

  Plus,


  Building2,


  Eye,
  ClipboardCheck,

} from 'lucide-react';

import api from './api';
import Assessments from './Assessments';

import { clearSession, setSession } from './store';



function AuthPage() {

  const dispatch = useDispatch();

  const navigate = useNavigate();

  const [mode, setMode] = useState('login');

  const [form, setForm] = useState({

    name: '',

    email: 'student@campus.demo',

    password: 'ChangeMe123!',

    role: 'student',

    branch: 'Computer Science and Engineering',

    companyName: '',

  });

  const [error, setError] = useState('');



  const submit = async (e) => {

    e.preventDefault();

    setError('');

    try {

      const { data } = await api.post(`/auth/${mode}`, form);

      dispatch(setSession(data));

      navigate('/dashboard');

    } catch (err) {

      setError(

        err.response?.data?.message ||

          'Unable to connect to the API. Is the server running?'

      );

    }

  };



  return (

    <div className="auth-wrap">

      <form className="auth-card" onSubmit={submit}>

        <div className="brand-mark">
  <img
    src="/alliance-university-logo.png"
    alt="Alliance University logo"
  />
</div>

        <p className="eyebrow">ALLIANCE UNIVERSITY · CAREER SERVICES</p>

        <h1>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h1>

        <p className="muted">

          One portal for placements, opportunities and career growth.

        </p>



        {mode === 'register' && (

          <label>

            Full name

            <input

              required

              value={form.name}

              onChange={(e) => setForm({ ...form, name: e.target.value })}

            />

          </label>

        )}



        <label>

          Email

          <input

            type="email"

            required

            value={form.email}

            onChange={(e) => setForm({ ...form, email: e.target.value })}

          />

        </label>



        <label>

          Password

          <input

            type="password"

            required

            minLength="8"

            value={form.password}

            onChange={(e) => setForm({ ...form, password: e.target.value })}

          />

        </label>



        {mode === 'register' && (

          <>

            <label>

              Account type

              <select

                value={form.role}

                onChange={(e) => setForm({ ...form, role: e.target.value })}

              >

                <option value="student">Student</option>

                <option value="recruiter">Recruiter</option>

              </select>

            </label>



            {form.role === 'student' ? (

              <label>

                Branch

                <input

                  required

                  value={form.branch}

                  onChange={(e) => setForm({ ...form, branch: e.target.value })}

                />

              </label>

            ) : (

              <label>

                Company name

                <input

                  required

                  value={form.companyName}

                  onChange={(e) =>

                    setForm({ ...form, companyName: e.target.value })

                  }

                />

              </label>

            )}

          </>

        )}



        {error && <div className="error">{error}</div>}



        <button className="primary">

          {mode === 'login' ? 'Sign in' : 'Create account'}

        </button>



        <button

          type="button"

          className="text-button"

          onClick={() => {

            setMode(mode === 'login' ? 'register' : 'login');

            setError('');

          }}

        >

          {mode === 'login'

            ? 'New here? Create an account'

            : 'Already registered? Sign in'}

        </button>

        <p className="tiny">Demo credentials are listed in the project README.</p>

      </form>

    </div>

  );

}



function AppShell({ children }) {

  const user = useSelector((s) => s.auth.user);

  const dispatch = useDispatch();

  const navigate = useNavigate();





const links =

  user?.role === 'recruiter'

    ? [

        [LayoutDashboard, 'Overview', '/dashboard'],

        [BriefcaseBusiness, 'Manage jobs', '/recruiter'],
        [ClipboardCheck, 'Assessments', '/assessments'],
        [Bell, 'Notifications', '/notifications'],

      ]

    : [

        [LayoutDashboard, 'Overview', '/dashboard'],

        [BriefcaseBusiness, 'Opportunities', '/jobs'],

        [GraduationCap, 'My profile', '/profile'],

        [Sparkles, 'AI career guide', '/career'],
        [ClipboardCheck, 'Assessments', '/assessments'],
        [Bell, 'Notifications', '/notifications'],

      ];





  return (

    <div className="app-layout">

      <aside className="sidebar">

        <Link to="/dashboard" className="logo">

          <img
  src="/alliance-university-logo.png"
  alt="Alliance University logo"
  className="sidebar-university-logo"
/>

          <span>

            Campus<span className="logo-light">Path</span>

            <small>PLACEMENT PORTAL</small>

          </span>

        </Link>



        <div className="nav-caption">WORKSPACE</div>

        {links.map(([Icon, label, to]) => (

          <Link key={to} className="nav-link" to={to}>

            <Icon size={18} />

            {label}

          </Link>

        ))}
{user?.role === 'student' && (
  <Link className="nav-link" to="/applications">
    <ClipboardCheck size={18} />
    My Applications
  </Link>
)}


        {['admin', 'officer'].includes(user?.role) && (

          <>

            <div className="nav-caption">MANAGEMENT</div>

            <Link className="nav-link" to="/admin">

              <Users size={18} />

              Administration

            </Link>
            <Link className="nav-link" to="/assessments">
              <ClipboardCheck size={18} />
              Assessments
            </Link>

          </>

        )}



        <div className="sidebar-bottom">

          <div className="avatar">{user?.name?.slice(0, 1) || 'U'}</div>

          <div className="user-meta">

            <b>{user?.name}</b>

            <small>{user?.role}</small>

          </div>

          <button

            className="icon-button"

            title="Sign out"

            onClick={() => {

              dispatch(clearSession());

              navigate('/');

            }}

          >

            <LogOut size={17} />

          </button>

        </div>

      </aside>



      <main className="main-area">

        <header className="topbar">

          <div>

            <span className="muted">Alliance University</span>

            <span className="crumb"> / Career services</span>

          </div>

          <div className="top-actions">

            <span className="status-dot" />

            <span className="tiny">Academic portal</span>

          </div>

        </header>

        <div className="page-content">{children}</div>

      </main>

    </div>

  );

}



function Dashboard() {

  const user = useSelector((s) => s.auth.user);

  const [stats, setStats] = useState(null);

  const [jobs, setJobs] = useState([]);

  const [apps, setApps] = useState([]);



  useEffect(() => {

    api.get('/jobs').then((r) => setJobs(r.data.slice(0, 4))).catch(() => {});



    if (['admin', 'officer'].includes(user?.role)) {

      api.get('/dashboard/summary').then((r) => setStats(r.data)).catch(() => {});

    }



    if (user?.role === 'student') {

      api.get('/applications/me').then((r) => setApps(r.data)).catch(() => {});

    }

  }, [user]);



  return (

    <>

      <div className="welcome-row">

        <div>

          <p className="eyebrow">YOUR CAREER WORKSPACE</p>

          <h1>

            Good to see you, {user?.name?.split(' ')[0] || 'there'} <span>✦</span>

          </h1>

          <p className="muted">Discover opportunities and take your next career step.</p>

        </div>

        <Link className="primary link-button" to="/jobs">

          <Search size={17} /> Explore jobs

        </Link>

      </div>



      {stats ? (

        <div className="stats-grid">

          {[

            ['Students', stats.students],

            ['Recruiters', stats.recruiters],

            ['Jobs', stats.jobs],

            ['Applications', stats.applications],

          ].map(([k, v]) => (

            <div className="stat-card" key={k}>

              <span>{k}</span>

              <strong>{v}</strong>

              <small>Live database count</small>

            </div>

          ))}

        </div>

      ) : (

        <div className="stats-grid">

          {[
  ['Applications', apps.length],
  ['Open opportunities', jobs.length],
  ['Profile status', 'Build'],
  ['Career plan', 'Ready'],
].map(([k, v]) => (
  k === 'Applications' ? (
    <Link className="stat-card" key={k} to="/applications">
      <span>{k}</span>
      <strong>{v}</strong>
      <small>View your application history</small>
    </Link>
  ) : (
    <div className="stat-card" key={k}>
      <span>{k}</span>
      <strong>{v}</strong>
      <small>
        {k === 'Profile status'
          ? 'Complete your profile'
          : 'Explore your workspace'}
      </small>
    </div>
  )
))}

        </div>

      )}



      <div className="section-heading">

        <div>

          <h2>Recommended opportunities</h2>

          <p className="muted">Roles currently published on the portal</p>

        </div>

        <Link to="/jobs" className="inline-link">View all →</Link>

      </div>



      <div className="job-grid">

        {jobs.map((job) => (

          <article className="job-card" key={job._id}>

            <div className="company-avatar"><BriefcaseBusiness /></div>

            <span className="pill">{job.jobType}</span>

            <h3>{job.title}</h3>

            <p className="muted">

              {job.recruiter?.companyName ||

                job.recruiter?.user?.name ||

                'Recruiting company'} · {job.location}

            </p>

            <div className="tag-row">

              {(job.requiredSkills || []).slice(0, 3).map((skill) => (

                <span className="tag" key={skill}>{skill}</span>

              ))}

            </div>

            <div className="job-bottom">

              <span className="tiny">Minimum CGPA: {job.minCgpa}</span>

              <Link to="/jobs" className="inline-link">View role ↗</Link>

            </div>

          </article>

        ))}

      </div>



      <div className="info-banner">

        <div className="ai-icon"><Sparkles /></div>

        <div>

          <b>Make your next move with AI career guidance</b>

          <p className="muted">

            Get personalized skill-gap insights based on your profile and available roles.

          </p>

        </div>

        <Link className="secondary-button" to="/career">Get guidance</Link>

      </div>

    </>

  );

}



function Jobs() {

  const user = useSelector((s) => s.auth.user);
  const [jobs, setJobs] = useState([]);

  const [search, setSearch] = useState('');

  const [notice, setNotice] = useState('');



  const load = () =>

    api.get('/jobs', { params: { search } })

      .then((r) => setJobs(r.data))

      .catch(() => setNotice('Unable to load jobs. Check server connection.'));



  useEffect(() => {

    load();

  }, []);

  const apply = async (id) => {
   try {
     await api.post(`/jobs/${id}/apply`);
     setNotice('Application submitted successfully.');
   } catch (e) {
     const data = e.response?.data;
     const reasons = data?.eligibility?.reasons;

     if (Array.isArray(reasons) && reasons.length > 0) {
      setNotice(reasons.join(' '));
     } else {
       setNotice(data?.message || 'Could not apply.');
     }
   }
  };




  return (

    <>

      <div className="page-title">

        <p className="eyebrow">OPPORTUNITY BOARD</p>

        <h1>Find your next opportunity</h1>

        <p className="muted">Explore roles and check eligibility before applying.</p>

      </div>



      <div className="search-bar">

        <Search />

        <input

          placeholder="Search job titles..."

          value={search}

          onChange={(e) => setSearch(e.target.value)}

          onKeyDown={(e) => e.key === 'Enter' && load()}

        />

        <button className="primary" onClick={load}>Search</button>

      </div>



      {notice && <div className="notice">{notice}</div>}



      <div className="job-list">

        {jobs.map((job) => (

          <article className="job-row" key={job._id}>

            <div className="company-avatar"><BriefcaseBusiness /></div>

            <div className="job-main">

              <h3>{job.title}</h3>

              <p className="muted">

                {job.recruiter?.companyName || 'Recruiter'} · {job.location || 'Location flexible'}

              </p>

              <div className="tag-row">

                {(job.requiredSkills || []).map((skill) => (

                  <span className="tag" key={skill}>{skill}</span>

                ))}

              </div>

              <small className="muted">CGPA {job.minCgpa}+ · {job.jobType}</small>

            </div>

            {user?.role === 'student' && <button className="primary" onClick={() => apply(job._id)}>Apply</button>}

          </article>

        ))}

      </div>

    </>

  );

}



function Profile() {

  const [profile, setProfile] = useState({

    branch: '',

    cgpa: 0,

    backlogs: 0,

    graduationYear: 2027,

    skills: [],

    bio: '',

    certifications: [],

    projects: [],

  });

  const [skills, setSkills] = useState('');

  const [msg, setMsg] = useState('');



  useEffect(() => {

    api.get('/students/me')

      .then((r) => {

        setProfile({

          ...r.data,

          certifications: r.data.certifications || [],

          projects: r.data.projects || [],

        });

        setSkills((r.data.skills || []).join(', '));

      })

      .catch((e) => {

        setMsg(e.response?.data?.message || 'Unable to load student profile.');

      });

  }, []);



  const updateItem = (type, index, field, value) => {

    setProfile((prev) => ({

      ...prev,

      [type]: prev[type].map((item, i) =>

        i === index ? { ...item, [field]: value } : item

      ),

    }));

  };



  const addItem = (type) => {

    const item = type === 'certifications'

      ? { name: '', issuer: '', year: new Date().getFullYear(), url: '' }

      : { title: '', description: '', technologies: [], url: '' };



    setProfile((prev) => ({

      ...prev,

      [type]: [...prev[type], item],

    }));

  };



  const removeItem = (type, index) => {

    setProfile((prev) => ({

      ...prev,

      [type]: prev[type].filter((_, i) => i !== index),

    }));

  };



  const save = async (e) => {

    e.preventDefault();

    setMsg('');



    try {

      const { data } = await api.patch('/students/me', {

        ...profile,

        cgpa: Number(profile.cgpa),

        backlogs: Number(profile.backlogs),

        graduationYear: Number(profile.graduationYear),

        skills: skills.split(',').map((s) => s.trim()).filter(Boolean),

        certifications: profile.certifications

          .filter((cert) => cert.name?.trim())

          .map((cert) => ({

            name: cert.name.trim(),

            issuer: cert.issuer || '',

            year: cert.year ? Number(cert.year) : undefined,

            url: cert.url || '',

          })),

        projects: profile.projects

          .filter((project) => project.title?.trim())

          .map((project) => ({

            title: project.title.trim(),

            description: project.description || '',

            technologies: project.technologies || [],

            url: project.url || '',

          })),

      });



      setProfile({

        ...data,

        certifications: data.certifications || [],

        projects: data.projects || [],

      });

      setSkills((data.skills || []).join(', '));

      setMsg('Profile saved successfully.');

    } catch (e) {

      setMsg(e.response?.data?.message || 'Unable to save profile.');

    }

  };



  return (

    <>

      <div className="page-title">

        <p className="eyebrow">STUDENT PROFILE</p>

        <h1>Your career profile</h1>

        <p className="muted">

          Keep your academic and professional information up to date.

        </p>

      </div>



      <form className="panel profile-form" onSubmit={save}>

        <h2>Academic information</h2>

        <div className="form-grid">

          <label>

            Branch

            <input

              required

              value={profile.branch || ''}

              onChange={(e) => setProfile({ ...profile, branch: e.target.value })}

            />

          </label>

          <label>

            Graduation year

            <input

              type="number"

              value={profile.graduationYear || ''}

              onChange={(e) => setProfile({ ...profile, graduationYear: e.target.value })}

            />

          </label>

          <label>

            CGPA (out of 10)

            <input

              type="number"

              min="0"

              max="10"

              step="0.01"

              value={profile.cgpa ?? 0}

              onChange={(e) => setProfile({ ...profile, cgpa: e.target.value })}

            />

          </label>

          <label>

            Active backlogs

            <input

              type="number"

              min="0"

              value={profile.backlogs ?? 0}

              onChange={(e) => setProfile({ ...profile, backlogs: e.target.value })}

            />

          </label>

          <label className="wide">

            Skills (comma separated)

            <input

              value={skills}

              onChange={(e) => setSkills(e.target.value)}

              placeholder="React, Java, SQL, Communication"

            />

          </label>

          <label className="wide">

            Career summary

            <textarea

              rows="4"

              value={profile.bio || ''}

              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}

            />

          </label>

        </div>



        <hr />

        <h2>Certifications</h2>

        <p className="muted">Add certificates and completed courses.</p>



        {profile.certifications.map((cert, i) => (

          <div className="panel" key={`cert-${i}`}>

            <div className="form-grid">

              <label>

                Certificate name

                <input

                  value={cert.name || ''}

                  onChange={(e) => updateItem('certifications', i, 'name', e.target.value)}

                  placeholder="e.g. Introduction to AI"

                />

              </label>

              <label>

                Issuing organization

                <input

                  value={cert.issuer || ''}

                  onChange={(e) => updateItem('certifications', i, 'issuer', e.target.value)}

                  placeholder="e.g. NPTEL"

                />

              </label>

              <label>

                Year

                <input

                  type="number"

                  value={cert.year || ''}

                  onChange={(e) => updateItem('certifications', i, 'year', e.target.value)}

                />

              </label>

              <label>

                Certificate URL

                <input

                  type="url"

                  value={cert.url || ''}

                  placeholder="https\://..."

                  onChange={(e) => updateItem('certifications', i, 'url', e.target.value)}

                />

              </label>

            </div>

            <button

              type="button"

              className="secondary-button"

              onClick={() => removeItem('certifications', i)}

            >

              Remove certification

            </button>

          </div>

        ))}



        <button

          type="button"

          className="secondary-button"

          onClick={() => addItem('certifications')}

        >

          + Add certification

        </button>



        <hr />

        <h2>Projects</h2>

        <p className="muted">Showcase your academic and personal projects.</p>



        {profile.projects.map((project, i) => (

          <div className="panel" key={`project-${i}`}>

            <div className="form-grid">

              <label>

                Project title

                <input

                  value={project.title || ''}

                  onChange={(e) => updateItem('projects', i, 'title', e.target.value)}

                  placeholder="e.g. Smart Campus Placement Portal"

                />

              </label>

              <label className="wide">

                Description

                <textarea

                  rows="3"

                  value={project.description || ''}

                  onChange={(e) => updateItem('projects', i, 'description', e.target.value)}

                />

              </label>

              <label className="wide">

                Technologies (comma separated)

                <input

                  value={(project.technologies || []).join(', ')}

                  placeholder="Java, MySQL, React"

                  onChange={(e) => updateItem(

                    'projects',

                    i,

                    'technologies',

                    e.target.value.split(',').map((s) => s.trim()).filter(Boolean)

                  )}

                />

              </label>

              <label className="wide">

                GitHub or demo URL

                <input

                  type="url"

                  value={project.url || ''}

                  placeholder="https\://..."

                  onChange={(e) => updateItem('projects', i, 'url', e.target.value)}

                />

              </label>

            </div>

            <button

              type="button"

              className="secondary-button"

              onClick={() => removeItem('projects', i)}

            >

              Remove project

            </button>

          </div>

        ))}



        <button

          type="button"

          className="secondary-button"

          onClick={() => addItem('projects')}

        >

          + Add project

        </button>



        {msg && <p className="notice">{msg}</p>}

        <button type="submit" className="primary">Save profile</button>

      </form>

    </>

  );

}




function Career() {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    setBusy(true);
    setError('');

    try {
      const response = await api.get('/ai/career-advice');
      setData(response.data);
    } catch (e) {
      setError(
        e.response?.data?.message ||
          'Career guidance could not be generated. Check your backend and AI API configuration.'
      );
    } finally {
      setBusy(false);
    }
  };

  const renderSkillList = (skills, emptyMessage) => {
    if (!Array.isArray(skills) || skills.length === 0) {
      return <p className="muted">{emptyMessage}</p>;
    }

    return (
      <div className="tag-row">
        {skills.map((skill, index) => (
          <span className="tag" key={`${skill}-${index}`}>
            {skill}
          </span>
        ))}
      </div>
    );
  };

  const gapAnalysis = data?.skillGapAnalysis;

  return (
    <>
      <div className="page-title">
        <p className="eyebrow">AI-POWERED CAREER DEVELOPMENT</p>
        <h1>Your personal career guide</h1>
        <p className="muted">
          Discover suitable career paths, identify skill gaps and follow a
          personalised learning roadmap based on your profile and available roles.
        </p>
      </div>

      <div className="info-banner large">
        <div className="ai-icon">
          <Sparkles />
        </div>

        <div>
          <b>AI career recommendations and skill-gap analysis</b>
          <p className="muted">
            Understand your existing skills, identify areas to improve and
            get a practical plan for career development. Formal job eligibility
            is determined separately.
          </p>

          <button
            type="button"
            className="primary"
            disabled={busy}
            onClick={run}
          >
            {busy ? 'Generating insights...' : 'Generate my recommendations'}
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {data && (
        <>
          <div className="panel advice">
            <p className="eyebrow">YOUR CAREER PROFILE</p>
            <h2>Career summary</h2>
            <p>{data.summary || 'No career summary was provided.'}</p>
          </div>

          <div className="section-heading">
            <div>
              <h2>Recommended roles</h2>
              <p className="muted">
                Compare your current skills with the requirements of available roles.
              </p>
            </div>
          </div>

          {(data.recommendations || []).length === 0 ? (
            <div className="panel">
              <p className="muted">
                No role recommendations were returned. Try again after checking
                your profile and available jobs.
              </p>
            </div>
          ) : (
            <div className="job-grid">
              {data.recommendations.map((role, index) => (
                <article className="job-card" key={role.jobId || index}>
                  <div className="company-avatar">
                    <BriefcaseBusiness />
                  </div>

                 
                  <span className="pill">
  {role.recommendationType === 'branch-related'
    ? 'Branch-related'
    : 'Interdisciplinary'}
</span>
                  <h3>{role.jobTitle || 'Career opportunity'}</h3>
                  <p className="muted">{role.matchReason}</p>

                  {typeof role.skillMatchPercentage === 'number' && (
                    <div>
                      <div className="section-heading">
                        <b>Skill match</b>
                        <strong>
                          {Math.round(role.skillMatchPercentage)}%
                        </strong>
                      </div>

                      <div
                        style={{
                          height: '8px',
                          background: 'var(--border, #e5e7eb)',
                          borderRadius: '999px',
                          overflow: 'hidden',
                          margin: '8px 0 16px'
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(0, role.skillMatchPercentage)
                            )}%`,
                            height: '100%',
                            background: 'var(--primary, #2563eb)',
                            borderRadius: '999px'
                          }}
                        />
                      </div>
                      <small className="muted">
                        This is a skill match estimate, not a hiring probability
                        or formal eligibility result.
                      </small>
                    </div>
                  )}

                  <h4>Skills you have</h4>
                  {renderSkillList(
                    role.matchedSkills,
                    'Matched skills were not provided.'
                  )}

                  <h4>Skills to develop</h4>
                  {renderSkillList(
                    role.missingSkills,
                    'No missing skills were identified by the AI.'
                  )}

                  {Array.isArray(role.unverifiedSkills) &&
                    role.unverifiedSkills.length > 0 && (
                      <>
                        <h4>Skills to verify</h4>
                        {renderSkillList(
                          role.unverifiedSkills,
                          'No unverified skills.'
                        )}
                        <p className="muted">
                          Add projects, certificates or experience to your
                          profile to help demonstrate these skills.
                        </p>
                      </>
                    )}

                  {Array.isArray(role.skillGaps) &&
                    role.skillGaps.length > 0 && (
                      <>
                        <h4>Skill-gap details</h4>

                        {role.skillGaps.map((gap, gapIndex) => (
                          <div
                            className="notification"
                            key={`${gap.skill || 'skill'}-${gapIndex}`}
                          >
                            <b>{gap.skill || 'Skill'}</b>

                            <p>
                              <span className="pill">
                                {gap.priority || 'Recommended'}
                              </span>
                              {' '}
                              {gap.status || 'Needs review'}
                            </p>

                            {gap.reason && <p>{gap.reason}</p>}
                            {gap.action && (
                              <p>
                                <b>Action:</b> {gap.action}
                              </p>
                            )}
                          </div>
                        ))}
                      </>
                    )}

                  {Array.isArray(role.nextSteps) &&
                    role.nextSteps.length > 0 && (
                      <>
                        <h4>Recommended next steps</h4>
                        <ul>
                          {role.nextSteps.map((step, stepIndex) => (
                            <li key={stepIndex}>{step}</li>
                          ))}
                        </ul>
                      </>
                    )}
                </article>
              ))}
            </div>
          )}

          {gapAnalysis && (
            <div className="panel advice">
              <p className="eyebrow">PERSONALISED SKILL ASSESSMENT</p>
              <h2>Skill Gap Analysis</h2>

              <p>
                {gapAnalysis.overallSummary ||
                  'Review the skill gaps identified for your career goals.'}
              </p>

              <h3>Priority skills to learn</h3>

              {!Array.isArray(gapAnalysis.prioritySkills) ||
              gapAnalysis.prioritySkills.length === 0 ? (
                <p className="muted">
                  No priority skills were returned. Review the role-specific
                  skill gaps above.
                </p>
              ) : (
                gapAnalysis.prioritySkills.map((item, index) => {
                  const skill =
                    typeof item === 'string' ? item : item.skill || 'Skill';

                  return (
                    <div className="notification" key={`${skill}-${index}`}>
                      <b>{skill}</b>

                      {typeof item === 'object' && item !== null && (
                        <>
                          {item.priority && (
                            <p>
                              <span className="pill">{item.priority}</span>
                            </p>
                          )}
                          {item.reason && <p>{item.reason}</p>}
                          {item.action && (
                            <p>
                              <b>Suggested action:</b> {item.action}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  );
                })
              )}

              <h3>Learning roadmap</h3>
              <p className="muted">
                Follow this roadmap in order, adapting the pace to your schedule.
              </p>

              {!Array.isArray(gapAnalysis.learningRoadmap) ||
              gapAnalysis.learningRoadmap.length === 0 ? (
                <p className="muted">
                  No weekly roadmap was returned. Use the priority skills
                  above to plan your learning.
                </p>
              ) : (
                gapAnalysis.learningRoadmap.map((week, index) => (
                  <div className="notification" key={index}>
                    <h3>
                      {week.week
                        ? `Week ${week.week}`
                        : `Learning stage ${index + 1}`}
                    </h3>

                    {week.focus && (
                      <p>
                        <b>Focus:</b> {week.focus}
                      </p>
                    )}

                    {Array.isArray(week.tasks) && week.tasks.length > 0 && (
                      <>
                        <b>Tasks</b>
                        <ul>
                          {week.tasks.map((task, taskIndex) => (
                            <li key={taskIndex}>{task}</li>
                          ))}
                        </ul>
                      </>
                    )}

                    {week.deliverable && (
                      <p>
                        <b>Expected outcome:</b> {week.deliverable}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          <div className="panel advice">
            <h2>Suggested skill plan</h2>

            {(data.skillPlan || []).length > 0 ? (
              <ul>
                {data.skillPlan.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="muted">
                No additional skill-plan items were returned.
              </p>
            )}
          </div>
        </>
      )}
    </>
  );
}



function MyApplications() {
  const [applications, setApplications] = useState([]);
  const [expandedApplication, setExpandedApplication] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/applications/me')
      .then((response) => {
        setApplications(response.data);
      })
      .catch((err) => {
        setError(
          err.response?.data?.message ||
          'Unable to load your applications.'
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const formatStatus = (status) => {
    const labels = {
      applied: 'Applied',
      shortlisted: 'Shortlisted',
      assessment: 'Assessment',
      interview: 'Interview',
      offered: 'Offered',
      rejected: 'Rejected'
    };

    return labels[status] || status || 'Applied';
  };

  return (
    <>
      <div className="page-title">
        <p className="eyebrow">PLACEMENT TRACKER</p>
        <h1>My Applications</h1>
        <p className="muted">
          Track your applications and recruiter updates.
        </p>
      </div>

      {loading && <p>Loading applications...</p>}

      {error && <div className="error">{error}</div>}

      {!loading && !error && applications.length === 0 && (
        <div className="panel">
          <h3>No applications yet</h3>
          <p className="muted">
            Explore opportunities and apply for jobs to see them here.
          </p>
        </div>
      )}

      <div className="job-list">
        {applications.map((app) => (
          <article className="job-row" key={app._id}>
            <div className="job-main">
              <h3>{app.job?.title || 'Job opportunity'}</h3>

              <p className="muted">
                {app.job?.location || 'Location not specified'}
                {' · '}
                {app.job?.jobType || 'Job'}
              </p>
<button
  type="button"
  className="secondary-button"
  onClick={() =>
    setExpandedApplication(
      expandedApplication === app._id ? '' : app._id
    )
  }
>
  <Eye size={16} />
  {expandedApplication === app._id
    ? 'Hide application details'
    : 'View application details'}
</button>
{expandedApplication === app._id && app.job && (
  <div className="application-details panel">
    <h3>Application Details</h3>

    <h4>Company Information</h4>
    <p>
      <strong>Company:</strong>{' '}
      {app.job.recruiter?.companyName ||
        app.job.recruiter?.user?.name ||
        'Company information unavailable'}
    </p>

    <p>
      <strong>Location:</strong> {app.job.location || 'Not specified'}
    </p>

    <p>
      <strong>Job Type:</strong> {app.job.jobType || 'Not specified'}
    </p>

    <h4>Job Description</h4>
    <p>{app.job.description || 'Description unavailable'}</p>

    <h4>Eligibility Criteria</h4>
    <p><strong>Minimum CGPA:</strong> {app.job.minCgpa ?? 'Not specified'}</p>
    <p>
      <strong>Eligible Branches:</strong>{' '}
      {(app.job.eligibleBranches || []).join(', ') || 'All branches / Not specified'}
    </p>
    <p>
      <strong>Maximum Backlogs:</strong>{' '}
      {app.job.maxBacklogs ?? 'Not specified'}
    </p>
    <p>
      <strong>Graduation Years:</strong>{' '}
      {(app.job.graduationYears || []).join(', ') || 'Not specified'}
    </p>

    <h4>Required Skills</h4>
    <p>
      {(app.job.requiredSkills || []).join(', ') || 'Not specified'}
    </p>

    <h4>Application Information</h4>
    <p><strong>Status:</strong> {formatStatus(app.status)}</p>
    <p>
      <strong>Applied Date:</strong>{' '}
      {app.createdAt
        ? new Date(app.createdAt).toLocaleDateString()
        : 'Date unavailable'}
    </p>
  </div>
)}
              <p>
  Application status: <strong>{formatStatus(app.status)}</strong>
</p>

{app.status === 'rejected' ? (
  <div className="application-timeline rejected">
    <strong>Application Rejected</strong>
    <p className="muted">This application will not proceed further.</p>
  </div>
) : (
  <div className="application-timeline">
    {[
      'applied',
      'shortlisted',
      'assessment',
      'interview',
      'offered'
    ].map((status, index, stages) => {
      const currentIndex = stages.indexOf(app.status || 'applied');

      return (
        <div
          key={status}
          className={`timeline-step ${
            index <= currentIndex ? 'completed' : ''
          }`}
        >
          <span className="timeline-dot"></span>
          <small>{formatStatus(status)}</small>
        </div>
      );
    })}
  </div>
)}

              <small className="muted">
                Applied on:{' '}
                {app.createdAt
                  ? new Date(app.createdAt).toLocaleDateString()
                  : 'Date unavailable'}
              </small>
            </div>

            <span className="pill">
              {formatStatus(app.status)}
            </span>
          </article>
        ))}
      </div>
    </>
  );
}


function Notifications() {

  const [items, setItems] = useState([]);



  useEffect(() => {

    api.get('/notifications/me').then((r) => setItems(r.data)).catch(() => {});

  }, []);



  return (

    <>

      <div className="page-title">

        <p className="eyebrow">UPDATES</p>

        <h1>Notifications</h1>

        <p className="muted">Application updates and portal messages.</p>

      </div>

      <div className="panel">

        {items.length ? items.map((n) => (

          <div className="notification" key={n._id}>

            <b>{n.title}</b>

            <p>{n.message}</p>

            <small className="muted">{new Date(n.createdAt).toLocaleString()}</small>

          </div>

        )) : <p className="muted">No notifications yet.</p>}

      </div>

    </>

  );

}




function RecruiterDashboard() {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState({});
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedJob, setSelectedJob] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const emptyForm = {
    title: '',
    description: '',
    location: '',
    jobType: 'Full-time',
    salaryMin: '',
    salaryMax: '',
    requiredSkills: '',
    eligibleBranches: '',
    minCgpa: '',
    maxBacklogs: '0',
    graduationYears: '',
    deadline: '',
  };
  const [form, setForm] = useState(emptyForm);

  const loadJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/recruiter/jobs');
      const jobList = Array.isArray(data) ? data : [];
      setJobs(jobList);

      const entries = await Promise.all(
        jobList.map(async (job) => {
          try {
            const response = await api.get(`/recruiter/jobs/${job._id}/applications`);
            return [job._id, Array.isArray(response.data) ? response.data : []];
          } catch {
            return [job._id, []];
          }
        })
      );
      setApplications(Object.fromEntries(entries));
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to load your jobs. Check that the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const updateForm = (key, value) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  const splitList = (value) =>
    value.split(',').map((item) => item.trim()).filter(Boolean);

  const postJob = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    setError('');

    try {
      const payload = {
        title: form.title.trim(),
        description: form.description.trim(),
        location: form.location.trim(),
        jobType: form.jobType,
        requiredSkills: splitList(form.requiredSkills),
        eligibleBranches: splitList(form.eligibleBranches),
        maxBacklogs: Number(form.maxBacklogs || 0),
      };

      if (form.salaryMin !== '') payload.salaryMin = Number(form.salaryMin);
      if (form.salaryMax !== '') payload.salaryMax = Number(form.salaryMax);
      if (form.minCgpa !== '') payload.minCgpa = Number(form.minCgpa);
      if (form.graduationYears.trim()) {
        payload.graduationYears = splitList(form.graduationYears)
          .map(Number)
          .filter(Number.isInteger);
      }
      if (form.deadline) payload.deadline = form.deadline;

      await api.post('/jobs', payload);
      setMessage('Job submitted. An admin or placement officer must approve it before students can see it.');
      setForm(emptyForm);
      setFormOpen(false);
      await loadJobs();
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to post this job. Check the fields and try again.');
    } finally {
      setBusy(false);
    }
  };

  const changeStatus = async (applicationId, status) => {
    setMessage('');
    setError('');
    try {
      await api.patch(`/applications/${applicationId}/status`, { status });
      setMessage(`Application status updated to ${status}.`);
      await loadJobs();
    } catch (e) {
      setError(e.response?.data?.message || 'Unable to update the application status.');
    }
  };

  const allApplications = Object.values(applications).flat();
  const publishedCount = jobs.filter((job) => job.status === 'published').length;
  const pendingCount = jobs.filter((job) => job.status === 'pending').length;
  const shortlistedCount = allApplications.filter((app) => app.status === 'shortlisted').length;

  return (
    <>
      <div className="welcome-row">
        <div>
          <p className="eyebrow">RECRUITER WORKSPACE</p>
          <h1>Recruiter dashboard ✦</h1>
          <p className="muted">Post opportunities, review applicants and build your team.</p>
        </div>
        <button className="primary" onClick={() => setFormOpen((open) => !open)}>
          <Plus size={17} /> {formOpen ? 'Close form' : 'Post a job'}
        </button>
      </div>

      {message && <div className="notice">{message}</div>}
      {error && <div className="error">{error}</div>}

      <div className="stats-grid">
        {[
          ['My jobs', jobs.length],
          ['Published jobs', publishedCount],
          ['Pending approval', pendingCount],
          ['Total applicants', allApplications.length],
          ['Shortlisted', shortlistedCount],
        ].map(([label, value]) => (
          <div className="stat-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>Recruiter account</small>
          </div>
        ))}
      </div>

      {formOpen && (
        <form className="panel profile-form" onSubmit={postJob}>
          <h2>Post a new job</h2>
          <p className="muted">Complete the details below. Your job will be submitted for approval.</p>

          <div className="form-grid">
            <label>
              Job title
              <input required minLength={3} maxLength={150} value={form.title}
                onChange={(e) => updateForm('title', e.target.value)} placeholder="Software Engineer" />
            </label>
            <label>
              Location
              <input maxLength={200} value={form.location}
                onChange={(e) => updateForm('location', e.target.value)} placeholder="Bengaluru / Remote" />
            </label>
            <label>
              Job type
              <select value={form.jobType} onChange={(e) => updateForm('jobType', e.target.value)}>
                <option>Full-time</option>
                <option>Internship</option>
                <option>Contract</option>
              </select>
            </label>
            <label>
              Minimum salary
              <input type="number" min="0" value={form.salaryMin}
                onChange={(e) => updateForm('salaryMin', e.target.value)} />
            </label>
            <label>
              Maximum salary
              <input type="number" min="0" value={form.salaryMax}
                onChange={(e) => updateForm('salaryMax', e.target.value)} />
            </label>
            <label>
              Minimum CGPA
              <input type="number" min="0" max="10" step="0.01" value={form.minCgpa}
                onChange={(e) => updateForm('minCgpa', e.target.value)} />
            </label>
            <label>
              Maximum active backlogs
              <input type="number" min="0" max="20" value={form.maxBacklogs}
                onChange={(e) => updateForm('maxBacklogs', e.target.value)} />
            </label>
            <label>
              Application deadline
              <input type="date" value={form.deadline}
                onChange={(e) => updateForm('deadline', e.target.value)} />
            </label>
            <label className="wide">
              Eligible graduation years (comma separated)
              <input value={form.graduationYears}
                onChange={(e) => updateForm('graduationYears', e.target.value)}
                placeholder="2027, 2028" />
            </label>
            <label className="wide">
              Required skills (comma separated)
              <input value={form.requiredSkills}
                onChange={(e) => updateForm('requiredSkills', e.target.value)}
                placeholder="Java, SQL, React" />
            </label>
            <label className="wide">
              Eligible branches (comma separated)
              <input value={form.eligibleBranches}
                onChange={(e) => updateForm('eligibleBranches', e.target.value)}
                placeholder="Computer Science and Engineering, Information Technology" />
            </label>
            <label className="wide">
              Job description
              <textarea required minLength={10} maxLength={12000} rows={5}
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                placeholder="Describe responsibilities, qualifications and expectations..." />
            </label>
          </div>

          <button className="primary" type="submit" disabled={busy}>
            {busy ? 'Submitting...' : 'Submit job for approval'}
          </button>
          <button className="secondary-button" type="button" onClick={() => setFormOpen(false)}>
            Cancel
          </button>
        </form>
      )}

      <div className="section-heading">
        <div>
          <h2>My job postings</h2>
          <p className="muted">Check publication status and review applications.</p>
        </div>
        <button className="secondary-button" onClick={loadJobs}>Refresh</button>
      </div>

      {loading ? (
        <div className="panel">Loading your jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="panel">
          <h3>No jobs posted yet</h3>
          <p className="muted">Choose “Post a job” to create your first opportunity.</p>
        </div>
      ) : (
        <div className="job-list">
          {jobs.map((job) => (
            <article className="job-row" key={job._id}>
              <div className="company-avatar"><Building2 /></div>
              <div className="job-main">
                <h3>{job.title}</h3>
                <p className="muted">{job.location || 'Location flexible'} · {job.jobType || 'Not specified'}</p>
                <p>Status: <span className="pill">{job.status || 'pending'}</span></p>
                <small className="muted">{(applications[job._id] || []).length} applicants</small>
              </div>
              <button className="secondary-button" onClick={() => setSelectedJob(selectedJob === job._id ? '' : job._id)}>
                <Eye size={16} /> {selectedJob === job._id ? 'Hide applicants' : 'View applicants'}
              </button>
            </article>
          ))}
        </div>
      )}

      {selectedJob && (
        <div className="panel">
          <h2>Applicants</h2>
          {(applications[selectedJob] || []).length === 0 ? (
            <p className="muted">No applications for this job yet.</p>
          ) : (
            (applications[selectedJob] || []).map((application) => {
              const student = application.student || {};
              const studentUser = student.user || {};
              return (
                <div className="notification" key={application._id}>
  <b>{studentUser.name || 'Student'}</b>
  <p>{studentUser.email || 'Email unavailable'}</p>

  <p className="muted">
    Branch: {student.branch || 'Not provided'} ·
    CGPA: {student.cgpa ?? 'Not provided'}
  </p>

  <p>
    Current status: <span className="pill">
      {application.status || 'applied'}
    </span>
  </p>

  <button
    type="button"
    className="secondary-button"
    onClick={() =>
      setSelectedStudent(
        selectedStudent === application._id ? '' : application._id
      )
    }
  >
    <Eye size={16} />
    {selectedStudent === application._id ? 'Hide profile' : 'View full profile'}
  </button>

  {selectedStudent === application._id && (
    <div className="student-profile-details">
      <h3>Complete Student Profile</h3>

      <p><strong>Name:</strong> {studentUser.name || 'Not provided'}</p>
      <p><strong>Email:</strong> {studentUser.email || 'Not provided'}</p>
      <p><strong>Student ID:</strong> {student.studentId || 'Not provided'}</p>
      <p><strong>Branch:</strong> {student.branch || 'Not provided'}</p>
      <p><strong>CGPA:</strong> {student.cgpa ?? 'Not provided'}</p>
      <p><strong>Graduation Year:</strong> {student.graduationYear || 'Not provided'}</p>
      <p><strong>Backlogs:</strong> {student.backlogs ?? 'Not provided'}</p>
      <p><strong>Phone:</strong> {student.phone || 'Not provided'}</p>
      <p><strong>Bio:</strong> {student.bio || 'Not provided'}</p>

      <h4>Skills</h4>
      <p>{(student.skills || []).join(', ') || 'No skills added'}</p>

      <h4>Certifications</h4>
      {(student.certifications || []).length > 0
        ? student.certifications.map((cert, index) => (
            <p key={index}>
              {cert.name} — {cert.issuer || 'Issuer not provided'}
              {' '}({cert.year || 'Year not provided'})
            </p>
          ))
        : <p>No certifications added</p>}

      <h4>Projects</h4>
      {(student.projects || []).length > 0
        ? student.projects.map((project, index) => (
            <div key={index}>
              <strong>{project.title}</strong>
              <p>{project.description || 'No description provided'}</p>
              <p>Technologies: {(project.technologies || []).join(', ')}</p>
              {project.url && (
                <a href={project.url} target="_blank" rel="noreferrer">
                  View project
                </a>
              )}
            </div>
          ))
        : <p>No projects added</p>}

      <h4>Resume</h4>
      {student.resumeUrl ? (
        <a href={student.resumeUrl} target="_blank" rel="noreferrer">
          View resume
        </a>
      ) : (
        <p>No resume uploaded</p>
      )}
    </div>
  )}

  <label>
    Update application status
    <select
      value={application.status || 'applied'}
      onChange={(e) => changeStatus(application._id, e.target.value)}
    >
      <option value="applied" disabled>Applied</option>
      <option value="shortlisted">Shortlisted</option>
      <option value="assessment">Assessment</option>
      <option value="interview">Interview</option>
      <option value="offered">Offered</option>
      <option value="rejected">Rejected</option>
    </select>
  </label>
</div>
              );
            })
          )}
        </div>
      )}
    </>
  );
}



function Admin() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [busyJob, setBusyJob] = useState('');

  const loadData = async () => {
    try {
      const [statsRes, usersRes, jobsRes] = await Promise.all([
        api.get('/dashboard/summary'),
        api.get('/admin/users'),
        api.get('/admin/jobs?status=pending')
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data);
      setJobs(jobsRes.data);
      setError('');
    } catch (e) {
      setError(
        e.response?.data?.message || 'Unable to load administration data.'
      );
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const approveJob = async (jobId) => {
    setBusyJob(jobId);
    setMsg('');
    setError('');

    try {
      await api.patch(`/jobs/${jobId}/publish`);
      setMsg('Job approved and published successfully.');
      await loadData();
    } catch (e) {
      setError(
        e.response?.data?.message || 'Unable to approve this job.'
      );
    } finally {
      setBusyJob('');
    }
  };

  return (
    <>
      <div className="page-title">
        <p className="eyebrow">ADMINISTRATION</p>
        <h1>Placement operations</h1>
        <p className="muted">
          Monitor system usage and placement activity.
        </p>
      </div>

      {msg && <div className="notice">{msg}</div>}
      {error && <div className="error">{error}</div>}

      {stats && (
        <div className="stats-grid">
          {[
            ['Students', stats.students],
            ['Recruiters', stats.recruiters],
            ['Jobs', stats.jobs],
            ['Applications', stats.applications],
            ['Offers', stats.offers],
          ].map(([label, value]) => (
            <div className="stat-card" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </div>
      )}

      <div className="panel">
        <h2>Pending job approvals ({jobs.length})</h2>
        <p className="muted">
          Review recruiter submissions before publishing them to students.
        </p>

        <button type="button" onClick={loadData}>
          Refresh
        </button>

        {jobs.length === 0 ? (
          <p>No pending jobs to approve.</p>
        ) : (
          jobs.map((job) => (
            <div className="user-row" key={job._id}>
              <div className="avatar">
                {(job.title || 'J').slice(0, 1)}
              </div>

              <div>
                <b>{job.title}</b>
                <small>
                  {job.recruiter?.companyName ||
                    job.recruiter?.user?.name ||
                    'Recruiter'}{' '}
                  · {job.location || 'Location not specified'}
                </small>
                <small>
                  Type: {job.jobType || 'Not specified'} · Status: {job.status}
                </small>
              </div>

              <button
                type="button"
                className="primary"
                disabled={busyJob === job._id}
                onClick={() => approveJob(job._id)}
              >
                {busyJob === job._id ? 'Approving...' : 'Approve'}
              </button>
            </div>
          ))
        )}
      </div>

      <div className="panel">
        <h2>Registered accounts</h2>

        {users.map((u) => (
          <div className="user-row" key={u._id}>
            <div className="avatar">
              {(u.name || 'U').slice(0, 1)}
            </div>
            <div>
              <b>{u.name}</b>
              <small>{u.email}</small>
            </div>
            <span className="pill">{u.role}</span>
          </div>
        ))}
      </div>
    </>
  );
}




export default function App() {

  const token = useSelector((s) => s.auth.token);

  const user = useSelector((s) => s.auth.user);



  return (

    <Routes>

      <Route path="/" element={token ? <Navigate to="/dashboard" /> : <AuthPage />} />

      <Route

        path="*"

        element={

          !token ? <Navigate to="/" /> : (

            <AppShell>

              <Routes>

                <Route
                  path="/dashboard"
                  element={user?.role === 'recruiter' ? <RecruiterDashboard /> : <Dashboard />}
                />
                <Route
                  path="/recruiter"
                  element={user?.role === 'recruiter' ? <RecruiterDashboard /> : <Navigate to="/dashboard" />}
                />

                <Route path="/jobs" element={<Jobs />} />
                <Route
  path="/applications"
  element={
    user?.role === 'student'
      ? <MyApplications />
      : <Navigate to="/dashboard" />
  }
/>

                <Route

                  path="/profile"

                  element={

                    user?.role === 'student'

                      ? <Profile />

                      : (

                        <div className="panel">

                          <h2>Profile</h2>

                          <p>Student profile editing is available to student accounts.</p>

                        </div>

                      )

                  }

                />

                <Route
                  path="/career"
                  element={user?.role === 'student' ? <Career /> : <Navigate to="/dashboard" />}
                />

                <Route path="/notifications" element={<Notifications />} />
                <Route path="/assessments" element={<Assessments user={user} />} />

                <Route

                  path="/admin"

                  element={['admin', 'officer'].includes(user?.role) ? <Admin /> : <Navigate to="/dashboard" />}

                />

                <Route path="*" element={<Navigate to="/dashboard" />} />

              </Routes>

            </AppShell>

          )

        }

      />

    </Routes>

  );

}
