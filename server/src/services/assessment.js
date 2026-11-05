import Groq from 'groq-sdk';

if (process.env.NODE_ENV !== 'production') {
  console.info('[assessment] Groq-only assessment service loaded:', import.meta.url);
}

const cleanList = value => Array.isArray(value)
  ? value
      .filter(item => typeof item === 'string' && item.trim())
      .map(item => item.trim())
  : [];

// Kept for synthetic demo-data seeding only. This bank is never used to
// generate a student's role-specific self-assessment.
export const fallbackBank = [
  { topic:'Programming fundamentals', type:'conceptual', prompt:'Which principle helps hide internal object state and expose controlled operations?', options:['Encapsulation','Compilation','Recursion','Normalization'], correctOption:0, explanation:'Encapsulation bundles state and methods while controlling access.' },
  { topic:'Data structures', type:'conceptual', prompt:'Which data structure follows the LIFO order?', options:['Queue','Stack','Graph','Heap'], correctOption:1, explanation:'A stack removes the most recently inserted item first.' },
  { topic:'Algorithms', type:'output', prompt:'What is the time complexity of binary search on a sorted array?', options:['O(n)','O(log n)','O(n log n)','O(1)'], correctOption:1, explanation:'The search interval is halved after each comparison.' },
  { topic:'Databases', type:'conceptual', prompt:'Which SQL clause filters groups after aggregation?', options:['WHERE','ORDER BY','HAVING','LIMIT'], correctOption:2, explanation:'HAVING filters grouped rows after aggregate calculations.' },
  { topic:'Web development', type:'scenario', prompt:'A browser must send a JSON payload to an API to create a record. Which HTTP method is most appropriate?', options:['GET','POST','TRACE','HEAD'], correctOption:1, explanation:'POST is commonly used to submit data that creates a resource.' },
  { topic:'Operating systems', type:'conceptual', prompt:'Which scheduling algorithm gives each ready process a fixed time slice?', options:['FCFS','Round Robin','Shortest Job First','Priority only'], correctOption:1, explanation:'Round Robin cycles through processes using a time quantum.' },
  { topic:'Networking', type:'conceptual', prompt:'Which protocol securely encrypts web traffic in transit?', options:['HTTP','FTP','TLS','ARP'], correctOption:2, explanation:'TLS provides encryption and integrity for HTTPS connections.' },
  { topic:'Python', type:'output', prompt:'What is the value of len({1, 1, 2, 3}) in Python?', options:['4','3','2','An error'], correctOption:1, explanation:'A set stores unique values, so the set has three elements.' },
  { topic:'Java', type:'debugging', prompt:'In Java, which keyword prevents a method from being overridden?', options:['static','final','private protected','volatile'], correctOption:1, explanation:'A final method cannot be overridden by a subclass.' },
  { topic:'Machine learning', type:'conceptual', prompt:'What is the main purpose of a validation dataset?', options:['Train model weights','Tune model choices and estimate generalisation','Replace the test set','Increase feature count'], correctOption:1, explanation:'Validation data supports model selection without fitting weights.' },
  { topic:'Security', type:'scenario', prompt:'A website stores passwords. Which approach is safest?', options:['Plain text','Reversible encryption with a shared key','Salted slow password hashing','Base64 encoding'], correctOption:2, explanation:'Use a dedicated password hashing algorithm with a unique salt.' },
  { topic:'Software engineering', type:'scenario', prompt:'A change breaks an existing feature. Which practice is most likely to catch this before release?', options:['Regression testing','Minification','Code formatting','Renaming variables'], correctOption:0, explanation:'Regression tests check that previously working behaviour remains correct.' },
  { topic:'Data structures', type:'conceptual', prompt:'Which traversal of a binary search tree returns keys in sorted order?', options:['Preorder','Postorder','Inorder','Level order'], correctOption:2, explanation:'Inorder traversal visits left subtree, node, then right subtree.' },
  { topic:'Databases', type:'conceptual', prompt:'What does a foreign key primarily enforce?', options:['Unique usernames','Referential integrity','Faster sorting','Password hashing'], correctOption:1, explanation:'A foreign key links records and enforces valid references.' },
  { topic:'Cloud computing', type:'scenario', prompt:'Which cloud model gives a customer managed application runtime while the provider manages the underlying platform?', options:['IaaS','PaaS','On-premises','Colocation'], correctOption:1, explanation:'PaaS abstracts infrastructure and provides a managed application platform.' },
  { topic:'Algorithms', type:'conceptual', prompt:'Which algorithm design technique solves a problem by combining solutions to smaller subproblems?', options:['Greedy only','Divide and conquer','Linear probing','Backtracking only'], correctOption:1, explanation:'Divide and conquer splits, solves, and combines subproblems.' },
  { topic:'JavaScript', type:'output', prompt:'Which array method creates a new array containing elements that pass a test?', options:['map','filter','reduce','push'], correctOption:1, explanation:'filter returns a new array containing elements that satisfy the predicate.' },
  { topic:'APIs', type:'debugging', prompt:'An API returns HTTP 401. What should the client check first?', options:['Authentication credentials or token','CSS stylesheet','Database index order','Image dimensions'], correctOption:0, explanation:'401 indicates missing or invalid authentication credentials.' },
  { topic:'System design', type:'scenario', prompt:'A service must absorb sudden traffic spikes. Which design choice helps most directly?', options:['A single larger hard-coded client timeout','Horizontal scaling behind a load balancer','Disable monitoring','Store sessions in local process memory only'], correctOption:1, explanation:'Horizontal replicas and load balancing distribute demand.' },
  { topic:'Testing', type:'conceptual', prompt:'What does a unit test usually verify?', options:['A small isolated unit of behaviour','The entire production network','Only user satisfaction','The speed of internet access'], correctOption:0, explanation:'Unit tests validate a small component in isolation.' },
  { topic:'Cloud computing', type:'conceptual', prompt:'Which service model gives users ready-to-use software over the internet?', options:['IaaS','PaaS','SaaS','Bare metal'], correctOption:2, explanation:'SaaS provides complete applications managed by the provider.' },
  { topic:'Cybersecurity', type:'scenario', prompt:'A user receives an unexpected login approval request. What is the safest action?', options:['Approve it quickly','Deny it and report the unexpected request','Share the one-time code','Disable account alerts'], correctOption:1, explanation:'Unexpected MFA prompts may indicate an attempted account compromise.' },
  { topic:'Data science', type:'conceptual', prompt:'Which measure is less sensitive to extreme outliers?', options:['Mean','Median','Range','Variance'], correctOption:1, explanation:'The median depends on the middle ordered value and is robust to outliers.' },
  { topic:'C programming', type:'debugging', prompt:'Which issue can occur when a C program accesses an array beyond its bounds?', options:['Guaranteed automatic resizing','Undefined behaviour','Automatic sorting','Compile-time optimisation'], correctOption:1, explanation:'Out-of-bounds access in C causes undefined behaviour.' },
  { topic:'Software engineering', type:'scenario', prompt:'A team wants to merge small changes frequently and run automated checks. Which practice supports this?', options:['Continuous integration','Big-bang integration','Manual deployment only','Code freeze forever'], correctOption:0, explanation:'Continuous integration frequently merges changes and validates them with automated builds and tests.' }
];

export function validateQuestions(input, count, difficulty = 'mixed') {
  if (!Array.isArray(input)) return [];

  const seenPrompts = new Set();
  const valid = [];

  for (const question of input) {
    if (
      !question ||
      typeof question.prompt !== 'string' ||
      question.prompt.trim().length < 8 ||
      !Array.isArray(question.options) ||
      question.options.length !== 4 ||
      !question.options.every(option => typeof option === 'string' && option.trim()) ||
      new Set(question.options.map(option => option.trim().toLowerCase())).size !== 4 ||
      !Number.isInteger(question.correctOption) ||
      question.correctOption < 0 ||
      question.correctOption > 3
    ) {
      continue;
    }

    const prompt = question.prompt.trim();
    const promptKey = prompt.toLowerCase().replace(/\s+/g, ' ');
    if (seenPrompts.has(promptKey)) continue;
    seenPrompts.add(promptKey);

    const requestedDifficulty = ['easy', 'medium', 'hard'].includes(difficulty)
      ? difficulty
      : null;
    const questionDifficulty = ['easy', 'medium', 'hard'].includes(question.difficulty)
      ? question.difficulty
      : (requestedDifficulty || ['easy', 'medium', 'hard'][valid.length % 3]);

    valid.push({
      prompt: prompt.slice(0, 1200),
      type: ['conceptual', 'debugging', 'scenario', 'output', 'coding'].includes(question.type)
        ? question.type
        : 'conceptual',
      options: question.options.map(option => option.trim().slice(0, 500)),
      correctOption: question.correctOption,
      explanation: String(question.explanation || '').trim().slice(0, 1000),
      topic: String(question.topic || 'Role-specific technical skills').trim().slice(0, 100),
      difficulty: requestedDifficulty || questionDifficulty,
      points: 1
    });

    if (valid.length === count) break;
  }

  return valid;
}

function buildStudentContext(student) {
  return {
    branch: student?.branch || 'Not specified',
    profileSkills: cleanList(student?.skills),
    projects: (Array.isArray(student?.projects) ? student.projects : []).slice(0, 10).map(project => ({
      title: String(project?.title || '').slice(0, 120),
      description: String(project?.description || '').slice(0, 500),
      technologies: cleanList(project?.technologies).slice(0, 20)
    }))
  };
}

export async function generateAssessmentQuestions({
  student,
  skills = [],
  targetRole = '',
  count = 10,
  difficulty = 'mixed',
  mode = 'self'
}) {
  const role = String(targetRole || '').trim();
  const selectedFocusSkills = cleanList(skills);
  const studentContext = mode === 'self' ? buildStudentContext(student) : null;

  if (role.length < 2) {
    const error = new Error('Please enter a valid target role.');
    error.status = 400;
    throw error;
  }

  if (!Number.isInteger(count) || count < 1 || count > 50) {
    const error = new Error('Question count must be between 1 and 50.');
    error.status = 400;
    throw error;
  }

  if (!process.env.GROQ_API_KEY) {
    const error = new Error(
      'Groq is not configured. Add GROQ_API_KEY to server/.env to generate AI assessments.'
    );
    error.status = 503;
    throw error;
  }

  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
      timeout: 90000,
      maxRetries: 1
    });

    const response = await groq.chat.completions.create({
      model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
      temperature: 0.2,
      max_completion_tokens: Math.min(7000, 2000 + count * 100),
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `
You create accurate, role-specific technical multiple-choice assessments.

ASSESSMENT MODE: ${mode}
TARGET ROLE OR BRANCH: ${role}
REQUESTED QUESTION COUNT: ${count}
REQUESTED DIFFICULTY: ${difficulty}

${mode === 'self' ? `
STUDENT SELF-ASSESSMENT RULES:
1. The target job role "${role}" is the primary requirement. Every question must assess knowledge or practical judgement genuinely relevant to this role.
2. Prioritise the student's selected focus skills listed in the user context. Cover those skills across the assessment; do not replace them with generic computer-science topics.
3. Use academic branch, profile skills and project experience only as supporting context. They must not override the target role or selected focus skills.
4. If selected focus skills are provided, make the majority of questions directly assess those skills in the context of "${role}".
5. If selected focus skills are empty, derive the role's core technical competencies and assess those.
6. Do not include unrelated generic programming, aptitude, operating-system, networking or database questions unless they are directly relevant to the target role or selected skills.
7. Use practical engineering scenarios and applied questions where appropriate.
` : `
BRANCH ASSESSMENT RULES:
1. Generate questions exclusively about the engineering branch "${role}".
2. Cover its core subjects, technical concepts, tools and practical applications.
3. Do not include unrelated CSE, programming or aptitude questions.
`}

Generate exactly ${count} distinct questions. Do not repeat prompts or test the same fact with trivial rewording.

Each question must contain:
- A clear, technically accurate prompt.
- Exactly four distinct, plausible options.
- Exactly one correct answer, represented by correctOption as a zero-based integer (0, 1, 2 or 3).
- A concise explanation.
- A specific technical topic.
- Difficulty matching "${difficulty}". For mixed difficulty, include a reasonable mix of easy, medium and hard questions.

Return only valid JSON with this structure:
{
  "questions": [
    {
      "prompt": "Question text",
      "type": "conceptual",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctOption": 0,
      "explanation": "Why this answer is correct",
      "topic": "Specific technical topic",
      "difficulty": "medium"
    }
  ]
}
Do not include markdown, comments or additional text.
`
        },
        {
          role: 'user',
          content: JSON.stringify({
            targetRole: role,
            selectedFocusSkills,
            studentContext,
            questionCount: count,
            difficulty,
            mode
          })
        }
      ]
    });

    const raw = response.choices?.[0]?.message?.content;
    if (typeof raw !== 'string' || !raw.trim()) {
      throw new Error('Groq returned an empty assessment response.');
    }

    const parsed = JSON.parse(
      raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
    );

    const questions = validateQuestions(parsed.questions, count, difficulty);

    if (questions.length !== count) {
      console.error('[assessment] Groq returned an incomplete or invalid question set', {
        requested: count,
        received: Array.isArray(parsed.questions) ? parsed.questions.length : 'missing',
        valid: questions.length
      });
      throw new Error(`Groq returned ${questions.length} valid questions; ${count} are required.`);
    }

    return {
      questions,
      generationSource: 'groq'
    };
  } catch (error) {
    console.error('[assessment] Groq generation failed:', {
      message: error.message,
      status: error.status || error.statusCode || null,
      code: error.code || null
    });

    const failure = new Error(
      `Unable to generate a role-specific assessment for "${role}". ${error.status === 429 || error.statusCode === 429
        ? 'Groq rate limit reached; please try again shortly.'
        : 'Please verify the Groq configuration and try again.'}`
    );
    failure.status = error.status || error.statusCode || 503;
    failure.code = error.code;
    failure.cause = error;
    throw failure;
  }
}

export function publicAssessment(assessment) {
  const obj = assessment.toObject ? assessment.toObject() : { ...assessment };
  delete obj.questions;
  return obj;
}
