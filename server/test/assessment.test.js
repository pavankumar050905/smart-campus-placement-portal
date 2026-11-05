import test from 'node:test';
import assert from 'node:assert/strict';
import { validateQuestions, generateAssessmentQuestions } from '../src/services/assessment.js';

function makeQuestions(count, difficulty = 'medium') {
  return Array.from({ length: count }, (_, index) => ({
    prompt: `Role-specific technical question number ${index + 1}?`,
    type: 'scenario',
    options: [`Option A ${index}`, `Option B ${index}`, `Option C ${index}`, `Option D ${index}`],
    correctOption: index % 4,
    explanation: 'This option is correct for the described technical scenario.',
    topic: 'Role-specific engineering',
    difficulty
  }));
}

test('question validator accepts a complete 50-question set', () => {
  const questions = validateQuestions(makeQuestions(50, 'hard'), 50, 'hard');
  assert.equal(questions.length, 50);
  assert.ok(questions.every(question => question.difficulty === 'hard'));
  assert.ok(questions.every(question => question.options.length === 4));
});

test('question validator rejects invalid answer indexes and duplicate prompts', () => {
  const questions = makeQuestions(2);
  questions[0].correctOption = '0';
  questions[1].prompt = questions[0].prompt;
  assert.equal(validateQuestions(questions, 2, 'medium').length, 0);
});

test('student self-assessment fails safely when Groq is not configured', async () => {
  const previousKey = process.env.GROQ_API_KEY;
  delete process.env.GROQ_API_KEY;

  try {
    await assert.rejects(
      generateAssessmentQuestions({
        student: {
          branch: 'Aerospace Engineering',
          skills: ['Aerodynamics'],
          projects: []
        },
        skills: ['Aerodynamics', 'Flight Mechanics'],
        targetRole: 'Aerospace Engineer',
        count: 10,
        difficulty: 'medium',
        mode: 'self'
      }),
      error => error.status === 503 && /GROQ_API_KEY/.test(error.message)
    );
  } finally {
    if (previousKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY = previousKey;
  }
});
