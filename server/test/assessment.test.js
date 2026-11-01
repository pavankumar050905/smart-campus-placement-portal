import test from 'node:test';
import assert from 'node:assert/strict';
import { generateAssessmentQuestions } from '../src/services/assessment.js';

test('assessment generator returns requested number of four-option MCQs without Groq', async () => {
  const previousKey = process.env.GROQ_API_KEY;
  delete process.env.GROQ_API_KEY;
  try {
    const result = await generateAssessmentQuestions({
      student:{branch:'Computer Science and Engineering',skills:['Java','SQL']},
      count:10,difficulty:'mixed',mode:'self'
    });
    assert.equal(result.questions.length,10);
    assert.equal(result.generationSource,'local-question-bank');
    for (const question of result.questions) {
      assert.equal(question.options.length,4);
      assert.ok(question.correctOption>=0 && question.correctOption<=3);
      assert.ok(question.prompt.length>8);
    }
  } finally {
    if (previousKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY=previousKey;
  }
});

test('assessment generator supports maximum 50-question practice sets', async () => {
  const previousKey = process.env.GROQ_API_KEY;
  delete process.env.GROQ_API_KEY;
  try {
    const result = await generateAssessmentQuestions({
      student:{branch:'Electronics and Communication Engineering',skills:['Networking']},
      count:50,difficulty:'hard',mode:'self'
    });
    assert.equal(result.questions.length,50);
    assert.ok(result.questions.every(q=>q.difficulty==='hard'));
  } finally {
    if (previousKey === undefined) delete process.env.GROQ_API_KEY;
    else process.env.GROQ_API_KEY=previousKey;
  }
});
