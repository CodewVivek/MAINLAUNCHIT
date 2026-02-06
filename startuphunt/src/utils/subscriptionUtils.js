/**
 * True if the project has current paid access (active/trialing and period not ended).
 * Time is the source of truth: do not rely only on subscription_status.
 */
export function isPaidAccess(project) {
  if (!project) return false;
  const status = project.subscription_status;
  if (status !== 'active' && status !== 'trialing') return false;
  const end = project.current_period_end;
  if (!end) return false;
  const endDate = new Date(end);
  if (Number.isNaN(endDate.getTime())) return false;
  return endDate > new Date();
}
