export function evaluateEligibility(student, job) {
  const reasons = [];
  if (Number(student.cgpa || 0) < Number(job.minCgpa || 0)) {
    reasons.push(`CGPA ${student.cgpa ?? 0} is below the required ${job.minCgpa}.`);
  }
  if (Number(student.backlogs || 0) > Number(job.maxBacklogs ?? 0)) {
    reasons.push(`Backlogs ${student.backlogs ?? 0} exceed the allowed ${job.maxBacklogs ?? 0}.`);
  }
  if (Array.isArray(job.eligibleBranches) && job.eligibleBranches.length &&
      !job.eligibleBranches.includes(student.branch)) {
    reasons.push(`Branch ${student.branch} is not included in the eligible branches.`);
  }
  if (Array.isArray(job.graduationYears) && job.graduationYears.length &&
      !job.graduationYears.includes(Number(student.graduationYear))) {
    reasons.push('Graduation year does not match this job.');
  }
  if (job.deadline && new Date(job.deadline) < new Date()) reasons.push('Application deadline has passed.');
  if (job.status !== 'published') reasons.push('This job is not currently accepting applications.');
  return { eligible: reasons.length === 0, reasons };
}
