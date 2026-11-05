
import 'dotenv/config';
import mongoose from 'mongoose';

import { connectDB } from './config/db.js';
import {
  Branch,
  Student,
  User,
  Assessment
} from './models/index.js';

import { generateAssessmentQuestions } from './services/assessment.js';

const QUESTION_COUNT = 25;
const BATCH_SIZE = 5;
const MAX_RETRIES = 3;

const wait = ms => new Promise(resolve => setTimeout(resolve, ms));

function isRateLimitError(error) {
  const original = error.cause || error;

  return (
    original.status === 429 ||
    original.statusCode === 429 ||
    original.code === 'rate_limit_exceeded' ||
    original.message?.includes('rate_limit_exceeded') ||
    original.message?.includes('Rate limit reached')
  );
}

async function generateBatch(branch, batchNumber, batchSize) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(
        `${branch.name}: batch ${batchNumber}, attempt ${attempt}`
      );

      const result = await generateAssessmentQuestions({
        student: null,
        skills: [],
        targetRole: `${branch.name} engineering branch`,
        count: batchSize,
        difficulty: 'mixed',
        mode: 'university'
      });

      if (
        result.generationSource !== 'groq' ||
        result.questions.length !== batchSize
      ) {
        throw new Error('Incomplete question batch.');
      }

      return result.questions;
    } catch (error) {
      if (isRateLimitError(error)) {
        console.error('Groq rate limit reached. Stopping generation.');
        throw error;
      }

      console.error(`Batch failed: ${error.message}`);

      if (attempt === MAX_RETRIES) throw error;

      console.log('Waiting 5 seconds before retrying...');
      await wait(5000);
    }
  }
}

async function generateBranchQuestions(branch) {
  const questions = [];
  let batchNumber = 1;

  while (questions.length < QUESTION_COUNT) {
    const remaining = QUESTION_COUNT - questions.length;
    const batchSize = Math.min(BATCH_SIZE, remaining);

    const batchQuestions = await generateBatch(
      branch,
      batchNumber,
      batchSize
    );

    questions.push(...batchQuestions);

    console.log(
      `${branch.name}: ${questions.length}/${QUESTION_COUNT} questions ready`
    );

    batchNumber++;
    await wait(15000);
  }

  return questions;
}

async function refreshDemoAssessments() {
  try {
    await connectDB();

    if (!process.env.GROQ_API_KEY) {
      throw new Error('GROQ_API_KEY is missing.');
    }

    const branches = await Branch.find({ active: true }).sort({ code: 1 });

    if (branches.length !== 30) {
      throw new Error(`Expected 30 branches, found ${branches.length}.`);
    }

    const admin = await User.findOne({
      email: 'admin@campus.demo'
    });

    if (!admin) {
      throw new Error('Demo administrator not found.');
    }

    console.log(`Processing ${branches.length} branches...`);

    for (const branch of branches) {
      const title = `Demo Branch Assessment - ${branch.code}`;

      console.log(`\nProcessing: ${branch.name}`);

     const existing = await Assessment.findOne({
  title,
  isDemo: true
}).select('+questions');

      let questions;

      if (
        existing &&
        Array.isArray(existing.questions) &&
        existing.questions.length === QUESTION_COUNT
      ) {
        questions = existing.questions;
        console.log(`Reusing saved assessment for ${branch.name}.`);
      } else {
        questions = await generateBranchQuestions(branch);
      }

      const students = await Student.find({
        branch: branch.name
      }).select('_id');

      await Assessment.updateOne(
        { title, isDemo: true },
        {
          $set: {
            title,
            description: `Branch-specific assessment for ${branch.name}.`,
            scope: 'university',
            createdBy: admin._id,
            assignedStudents: students.map(student => student._id),
            targetBranch: branch.name,
            targetRole: branch.name,
            skills: [],
            difficulty: 'mixed',
            durationMinutes: 30,
            questionCount: QUESTION_COUNT,
            questions,
            active: true,
            isDemo: true
          }
        },
        { upsert: true }
      );

      console.log(
        `Saved ${branch.name}: ${questions.length} questions, ${students.length} students.`
      );

      await wait(2000);
    }

    // Verify all 30 branch assessments and their actual question counts.
    const savedAssessments = await Assessment.find({
  isDemo: true,
  title: /^Demo Branch Assessment - /,
  active: true
}).select('title questionCount +questions');

    const completeAssessments = savedAssessments.filter(
      assessment =>
        assessment.questionCount === QUESTION_COUNT &&
        Array.isArray(assessment.questions) &&
        assessment.questions.length === QUESTION_COUNT
    );

    const uniqueTitles = new Set(
      completeAssessments.map(assessment => assessment.title)
    );

    if (uniqueTitles.size !== 30) {
      throw new Error(
        `Only ${uniqueTitles.size} complete branch assessments are saved. Old assessments were not deactivated.`
      );
    }

    // Deactivate old generic assessments only after successful verification.
    // Preserve existing attempts and all other records.
    await Assessment.updateMany(
      {
        isDemo: true,
        title: /^Demo Placement Assessment \d{2}$/
      },
      {
        $set: { active: false }
      }
    );

    console.log('\nSUCCESS!');
    console.log('All 30 branch assessments have been saved.');
    console.log('750 questions are available.');
    console.log('Old generic demo assessments have been deactivated.');
    console.log('Existing student, recruiter, job, application and attempt records were preserved.');
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
}

refreshDemoAssessments().catch(error => {
  console.error('\nAssessment refresh failed:', error.message);
  process.exitCode = 1;
});
