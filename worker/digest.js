import { getActiveUsers, getActiveCalls, getCompanyProfilesByUser } from './supabase.js';
import { matchedCallsForUser } from './matching.js';
import { sendEmailsSequentially, digestEmailHtml } from './resend.js';

const PLAN_LIMITS = { FREE: 3, PRO: Infinity, FIRMA: Infinity };

export async function runDigestJob(event, env) {
  const now = new Date(event.scheduledTime ?? Date.now());
  const isMonday = now.getUTCDay() === 1;

  const [users, calls] = await Promise.all([getActiveUsers(env), getActiveCalls(env)]);
  const dashboardUrl = `${env.SITE_URL}/#/dashboard`;

  const jobs = [];

  for (const user of users) {
    const frequency = user.notification_prefs?.frequency;
    const isDaily = frequency === 'denni';
    const isWeekly = frequency === 'tydenni' && isMonday;
    if (!isDaily && !isWeekly) continue;

    const extraProfiles = user.plan === 'FIRMA' ? await getCompanyProfilesByUser(env, user.id) : [];
    const matches = matchedCallsForUser(user, calls, extraProfiles).slice(0, PLAN_LIMITS[user.plan] ?? 3);
    if (matches.length === 0) continue;

    jobs.push({
      to: user.email,
      subject: isWeekly ? 'Váš týdenní souhrn dotačních výzev' : 'Váš denní souhrn dotačních výzev',
      html: digestEmailHtml({
        heading: isWeekly ? 'Týdenní souhrn relevantních výzev' : 'Denní souhrn relevantních výzev',
        intro: `Našli jsme ${matches.length} výzev odpovídajících vašemu profilu.`,
        matches,
        dashboardUrl,
      }),
    });
  }

  await sendEmailsSequentially(env, jobs);
}
