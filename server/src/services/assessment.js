import Groq from 'groq-sdk';

const cleanList = value => Array.isArray(value) ? value.filter(x => typeof x === 'string' && x.trim()).map(x => x.trim()) : [];

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

function validateQuestions(input, count, difficulty) {
  if (!Array.isArray(input)) return [];
  return input.slice(0, count).filter(q =>
    q && typeof q.prompt === 'string' && q.prompt.trim().length >= 8 &&
    Array.isArray(q.options) && q.options.length === 4 &&
    q.options.every(o => typeof o === 'string' && o.trim()) &&
    Number.isInteger(Number(q.correctOption)) && Number(q.correctOption) >= 0 && Number(q.correctOption) <= 3
  ).map(q => ({
    prompt: q.prompt.trim().slice(0, 1200),
    type: ['conceptual','debugging','scenario','output','coding'].includes(q.type) ? q.type : 'conceptual',
    options: q.options.map(o => String(o).trim().slice(0, 500)),
    correctOption: Number(q.correctOption),
    explanation: String(q.explanation || '').slice(0, 1000),
    topic: String(q.topic || 'General').slice(0, 100),
    difficulty: ['easy','medium','hard'].includes(q.difficulty) ? q.difficulty : (difficulty === 'mixed' ? 'medium' : difficulty),
    points: 1
  }));
}

function fallbackQuestions({ skills, count, difficulty }) {
  const requested = cleanList(skills);
  const ordered = [...fallbackBank].sort((a,b) => {
    const score = item => requested.some(s => item.topic.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(item.topic.toLowerCase())) ? 1 : 0;
    return score(b)-score(a);
  });
  const result = [];
  for (let i=0; i<count; i++) {
    const q = ordered[i % ordered.length];
    result.push({ ...q, options:[...q.options], difficulty: difficulty === 'mixed' ? ['easy','medium','hard'][i%3] : difficulty });
  }
  return result;
}

export async function generateAssessmentQuestions({ student, skills = [], targetRole = '', count = 10, difficulty = 'mixed', mode = 'self' }) {
  const requestedSkills = cleanList(skills.length ? skills : student?.skills);
  const profile = {
    branch: student?.branch || 'Engineering',
    skills: requestedSkills,
    projects: (student?.projects || []).map(p => ({ title:p.title, technologies:p.technologies || [] })),
    certifications: (student?.certifications || []).map(c => c.name).filter(Boolean),
    targetRole: String(targetRole || '').slice(0,120)
  };

  if (process.env.GROQ_API_KEY) {
    try {
      const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
      const response = await groq.chat.completions.create({
        model: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
        temperature: 0.35,
        max_completion_tokens: Math.min(7000, 1800 + count * 100),
        messages: [
          { role:'system', content:`Create an original university-level engineering placement assessment. Return ONLY valid JSON: {"questions":[{"prompt":"...","type":"conceptual|debugging|scenario|output|coding","options":["A","B","C","D"],"correctOption":0,"explanation":"...","topic":"...","difficulty":"easy|medium|hard"}]}. Exactly ${count} questions. Use a balanced mix of conceptual, debugging, code-output and practical scenario MCQs. Every question must have exactly four plausible options and exactly one defensible correct answer. Do not make trick or ambiguous questions. Do not include markdown. Questions must be tailored to the student's branch, skills, projects and target role. Distribute difficulty as requested: ${difficulty}.` },
          { role:'user', content:JSON.stringify({ profile, requestedSkills, count, difficulty, mode }) }
        ]
      });
      const raw = response.choices?.[0]?.message?.content || '';
      const parsed = JSON.parse(raw.replace(/^```(?:json)?\s*/i,'').replace(/\s*```$/,''));
      const valid = validateQuestions(parsed.questions, count, difficulty);
      if (valid.length === count) return { questions: valid, generationSource:'groq' };
    } catch (error) {
      console.warn('AI question generation unavailable; using validated local question bank:', error.message);
    }
  }
  return { questions: fallbackQuestions({ skills:requestedSkills, count, difficulty }), generationSource:'local-question-bank' };
}

export function publicAssessment(assessment) {
  const obj = assessment.toObject ? assessment.toObject() : { ...assessment };
  delete obj.questions;
  return obj;
}
