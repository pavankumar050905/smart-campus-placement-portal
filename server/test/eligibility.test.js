import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateEligibility } from '../src/services/eligibility.js';

const baseStudent = { cgpa: 8, backlogs: 0, branch: 'CSE', graduationYear: 2027 };
const baseJob = { minCgpa: 7, maxBacklogs: 0, eligibleBranches: ['CSE'], graduationYears: [2027], status: 'published', deadline: new Date(Date.now()+86400000) };

test('eligible student passes', () => assert.equal(evaluateEligibility(baseStudent, baseJob).eligible, true));
test('low CGPA is rejected', () => assert.equal(evaluateEligibility({ ...baseStudent, cgpa: 6 }, baseJob).eligible, false));
test('branch mismatch is rejected', () => assert.equal(evaluateEligibility({ ...baseStudent, branch: 'ME' }, baseJob).eligible, false));
test('expired deadline is rejected', () => assert.equal(evaluateEligibility(baseStudent, { ...baseJob, deadline: new Date(Date.now()-1000) }).eligible, false));
