
import 'dotenv/config';
import mongoose from 'mongoose';

import { connectDB } from './config/db.js';
import {
  Branch,
  User,
  Student,
  Recruiter,
  Job,
  Application,
  Assessment,
  Attempt
} from './models/index.js';

async function checkDatabase() {
  try {
    await connectDB();

    const results = {
      activeBranches: await Branch.countDocuments({ active: true }),
      users: await User.countDocuments(),
      students: await Student.countDocuments(),
      recruiters: await Recruiter.countDocuments(),
      jobs: await Job.countDocuments(),
      applications: await Application.countDocuments(),
      assessments: await Assessment.countDocuments(),
      attempts: await Attempt.countDocuments()
    };

    const branchAssessments = await Assessment.find({
      isDemo: true,
      title: /^Demo Branch Assessment - /
    }).select('title questionCount active +questions');

    console.log('\nDATABASE VERIFICATION');
    console.log(JSON.stringify(results, null, 2));

    console.log('\nBRANCH ASSESSMENTS');
    console.log('Total:', branchAssessments.length);

    for (const assessment of branchAssessments) {
      console.log({
        title: assessment.title,
        questionCount: assessment.questions?.length || 0,
        active: assessment.active
      });
    }

    console.log('\nREAD-ONLY CHECK COMPLETED');
  } catch (error) {
    console.error('Database check failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

checkDatabase();
