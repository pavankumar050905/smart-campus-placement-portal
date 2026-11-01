
import Groq from 'groq-sdk';

const normalize = value =>
  String(value || '').trim().toLowerCase().replace(/[^a-z0-9+#.]/g, '');

function getStudentProfile(student) {
  return {
    branch: student.branch || '',
    cgpa: student.cgpa ?? null,
    graduationYear: student.graduationYear ?? null,
    skills: student.skills || [],
    certifications: (student.certifications || [])
      .map(c => c.name)
      .filter(Boolean),
    projects: (student.projects || []).map(p => ({
      title: p.title,
      technologies: p.technologies || []
    }))
  };
}

function classifyJob(student, job) {
  const studentBranch = normalize(student.branch);

  const eligibleBranches = Array.isArray(job.eligibleBranches)
    ? job.eligibleBranches
    : [];

  if (eligibleBranches.length === 0) {
    return 'interdisciplinary';
  }

  const branchMatches = eligibleBranches.some(
    branch => normalize(branch) === studentBranch
  );

  return branchMatches ? 'branch-related' : null;
}

function rankJobs(student, jobs) {
  const profileSkills = new Set([
    ...(student.skills || []),
    ...(student.certifications || []).map(c => c.name),
    ...(student.projects || []).flatMap(p => p.technologies || [])
  ].map(normalize));

  return [...jobs]
    .map(job => {
      const category = classifyJob(student, job);

      if (!category) return null;

      const required = [...new Set(
        (job.requiredSkills || []).map(normalize)
      )];

      const matched = required.filter(skill =>
        profileSkills.has(skill)
      ).length;

      return {
        job,
        category,
        relevance: matched / Math.max(required.length, 1),
        priority: category === 'branch-related' ? 0 : 1
      };
    })
    .filter(Boolean)
    .sort((a, b) =>
      a.priority - b.priority ||
      b.relevance - a.relevance
    )
    .slice(0, 8)
    .map(item => item.job);
}

function buildLocalRecommendations(student, jobs) {
  const profileSkills = new Set([
    ...(student.skills || []),
    ...(student.certifications || []).map(c => c.name),
    ...(student.projects || []).flatMap(p => p.technologies || [])
  ].map(normalize));

  const recommendations = jobs.map(job => {
    const requiredSkills = job.requiredSkills || [];
    const matchedSkills = requiredSkills.filter(skill =>
      profileSkills.has(normalize(skill))
    );
    const missingSkills = requiredSkills.filter(skill =>
      !profileSkills.has(normalize(skill))
    );

    const percentage = requiredSkills.length
      ? Math.round(matchedSkills.length / requiredSkills.length * 100)
      : null;

    const skillGaps = missingSkills.map(skill => ({
      skill,
      status: 'Missing',
      priority: 'Medium',
      reason: `${skill} is listed as a requirement for ${job.title}.`,
      action: `Study ${skill} and complete a practical project demonstrating it.`
    }));

    return {
  jobId: String(job._id),
  jobTitle: job.title,

  recommendationType: classifyJob(student, job),

  matchReason: matchedSkills.length
    ? `${
        classifyJob(student, job) === 'branch-related'
          ? 'This role is relevant to your engineering branch.'
          : 'This is an interdisciplinary opportunity matching your skills.'
      } Your profile demonstrates ${matchedSkills.join(', ')}.`
    : 'Review the required skills and develop the missing skills for this opportunity.',

  requiredSkills,
  matchedSkills,
  missingSkills,
  unverifiedSkills: [],
  skillMatchPercentage: percentage,
  skillGaps,

  nextSteps: missingSkills.slice(0, 3).map(
    skill => `Learn ${skill} and practise it in a project.`
  )
};
  });

  const prioritySkills = [
    ...new Set(recommendations.flatMap(r => r.missingSkills))
  ].slice(0, 8);

  return {
    summary: jobs.length
      ? `Based on your ${student.branch || 'engineering'} profile, these recommendations compare your recorded skills with available job requirements.`
      : 'There are currently no available jobs to compare with your profile.',
    recommendations,
    skillGapAnalysis: {
      overallSummary: prioritySkills.length
        ? `Focus on developing these skills: ${prioritySkills.join(', ')}.`
        : 'Your recorded skills match the requirements of the available jobs. Continue practising and building projects.',
      prioritySkills,
      learningRoadmap: [
        {
          week: 1,
          focus: 'Review your existing skills',
          tasks: ['Review your core programming concepts', 'Identify your strongest and weakest topics'],
          deliverable: 'A personal skill assessment checklist'
        },
        {
          week: 2,
          focus: 'Develop priority skills',
          tasks: prioritySkills.slice(0, 3).map(skill => `Study and practise ${skill}`),
          deliverable: 'Practice exercises for priority skills'
        },
        {
          week: 3,
          focus: 'Build a practical project',
          tasks: ['Choose a project related to your target role', 'Implement and test its main features'],
          deliverable: 'A working project demonstrating your skills'
        },
        {
          week: 4,
          focus: 'Prepare for placement',
          tasks: ['Practise technical interview questions', 'Update your resume and project documentation'],
          deliverable: 'An updated placement-ready portfolio'
        }
      ]
    },
    skillPlan: prioritySkills.length
      ? prioritySkills.map(skill => `Learn ${skill} through practice and a small project.`)
      : ['Continue practising your existing skills.', 'Build projects and prepare for technical interviews.']
  };
}

function validateResult(result, jobs, student) {
  result.summary = result.summary || '';

  result.recommendations = Array.isArray(result.recommendations)
    ? result.recommendations
    : [];

  result.skillPlan = Array.isArray(result.skillPlan)
    ? result.skillPlan
    : [];

  result.recommendations = result.recommendations.map(rec => {
    const job = jobs.find(j =>
      String(j._id) === String(rec.jobId) ||
      normalize(j.title) === normalize(rec.jobTitle)
    );

    if (!job) return null;

    const requiredSkills = job.requiredSkills || [];
    const matchedSkills = Array.isArray(rec.matchedSkills)
      ? rec.matchedSkills
      : [];

    const matchedCount = requiredSkills.filter(required =>
      matchedSkills.some(
        matched => normalize(matched) === normalize(required)
      )
    ).length;

    return {
      ...rec,
      jobId: String(job._id),
      jobTitle: job.title,
      recommendationType: classifyJob(student, job),
      requiredSkills,
      matchedSkills,
      missingSkills: Array.isArray(rec.missingSkills)
        ? rec.missingSkills
        : [],
      unverifiedSkills: Array.isArray(rec.unverifiedSkills)
        ? rec.unverifiedSkills
        : [],
      skillMatchPercentage: requiredSkills.length
        ? Math.round(matchedCount / requiredSkills.length * 100)
        : null,
      skillGaps: Array.isArray(rec.skillGaps)
        ? rec.skillGaps
        : [],
      nextSteps: Array.isArray(rec.nextSteps)
        ? rec.nextSteps
        : []
    };
  }).filter(Boolean);

  result.skillGapAnalysis = result.skillGapAnalysis || {};

  result.skillGapAnalysis.overallSummary =
    result.skillGapAnalysis.overallSummary || '';

  result.skillGapAnalysis.prioritySkills =
    Array.isArray(result.skillGapAnalysis.prioritySkills)
      ? result.skillGapAnalysis.prioritySkills
      : [];

  result.skillGapAnalysis.learningRoadmap =
    Array.isArray(result.skillGapAnalysis.learningRoadmap)
      ? result.skillGapAnalysis.learningRoadmap
      : [];

  return result;
}

export async function generateCareerAdvice({ student, jobs }) {
  const localJobs = rankJobs(student, jobs || []);

  // Always provide useful recommendations if no API key is configured.
  if (!process.env.GROQ_API_KEY) {
    return buildLocalRecommendations(student, localJobs);
  }

  const studentProfile = getStudentProfile(student);

  // Send only the information needed for career guidance.
  const availableJobs = localJobs.map(job => ({
  id: String(job._id),
  title: job.title,
  description: job.description?.slice(0, 250) || '',
  requiredSkills: (job.requiredSkills || []).slice(0, 10),
  eligibleBranches: job.eligibleBranches || []
}));

  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
  });

  try {
    const response = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
      messages: [
        {
          role: 'system',
          content: `You are a concise university career guidance assistant.
Return valid JSON only, without Markdown.

Use this structure:
{
  "summary": "Career summary",
  "recommendations": [
    {
  "jobId": "Exact supplied job ID",
  "jobTitle": "Job title",
  "recommendationType": "branch-related",
  "matchReason": "Evidence-based explanation",
  "requiredSkills": [],
      "matchedSkills": [],
      "missingSkills": [],
      "unverifiedSkills": [],
      "skillMatchPercentage": null,
      "skillGaps": [
        {
          "skill": "Skill",
          "status": "Missing",
          "priority": "High",
          "reason": "Why it matters",
          "action": "Practical learning action"
        }
      ],
      "nextSteps": []
    }
  ],
  "skillGapAnalysis": {
    "overallSummary": "Summary",
    "prioritySkills": [],
    "learningRoadmap": [
      {
        "week": 1,
        "focus": "Focus",
        "tasks": [],
        "deliverable": "Outcome"
      }
    ]
  },
  "skillPlan": []
}

Rules:
- Analyse only the supplied jobs and their actual requiredSkills.
- Match skills case-insensitively.
- Use only evidence in the student profile.
- Never invent qualifications, projects or experience.
- Do not make formal hiring eligibility decisions.
- Keep the response concise.
- Provide a practical four-week roadmap.
- Use only "Missing" or "Needs verification" for skill-gap status.
- Return empty recommendations if no jobs are supplied.

JOB RECOMMENDATION PRIORITY:
- Prioritise branch-related jobs before interdisciplinary jobs.
- A branch-related job has the student's branch in eligibleBranches.
- An interdisciplinary job has an empty eligibleBranches list.
- Never recommend a job that explicitly excludes the student's branch.
- Recommend only jobs supplied in availableJobs.
- Include recommendationType in every recommendation:
  "branch-related" or "interdisciplinary".
`
        },
        {
          role: 'user',
          content: JSON.stringify({
            student: studentProfile,
            availableJobs
          })
        }
      ],
      temperature: 0.2,
      max_completion_tokens: 1500
    });

const raw = response.choices?.[0]?.message?.content || '';

const cleaned = raw
  .trim()
  .replace(/^```json\s*/i, '')
  .replace(/^```\s*/, '')
  .replace(/\s*```$/, '');

    const result = JSON.parse(cleaned);
    return validateResult(result, localJobs, student);

  } catch (error) {
    const status = error.status || error.statusCode;

    if (status === 429 || status >= 500 || !status) {
      console.warn(
        'Groq temporarily unavailable. Using local career recommendations:',
        error.message
      );

      return buildLocalRecommendations(student, localJobs);
    }

    console.error('Groq career guidance error:', error.message);
    throw error;
  }
}
