import { sendEmail } from './resend.js';
import { getRecentRuns } from './scraper.js';

const ADMIN_EMAIL = 'ondrejrada42@gmail.com';

export async function sendAdminDailyReport(env, scrapeResult) {
  const recentRuns = await getRecentRuns(env, 3);
  const last3Empty = recentRuns.length === 3 && recentRuns.every((r) => r.parsed_count === 0 && !r.error);
  const hasError = !!scrapeResult.error;

  let statusLine;
  if (hasError) {
    statusLine = `<p style="color:#a32d2d;font-weight:600;">⚠️ Scraper dnes selhal s chybou: ${scrapeResult.error}</p>`;
  } else if (scrapeResult.parsed === 0) {
    statusLine = `<p style="color:#a32d2d;font-weight:600;">⚠️ Scraper dnes nenašel žádné výzvy na DotaceEU.cz.${
      last3Empty ? ' Toto se opakuje 3. den po sobě – web pravděpodobně změnil strukturu, zkontrolujte prosím ručně.' : ''
    }</p>`;
  } else {
    statusLine = `<p>Scraper zpracoval ${scrapeResult.parsed} otevřených výzev z DotaceEU.cz, z toho <strong>${scrapeResult.added} nových</strong> přidáno do databáze${
      scrapeResult.expired ? `, ${scrapeResult.expired} po termínu ukončeno` : ''
    }.</p>`;
  }

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
      <h1 style="color:#1e3a5f;font-size:20px;">Denní report Hlídače dotací</h1>
      ${statusLine}
      <p style="background:#eef2f8;border-radius:8px;padding:12px 16px;color:#1e3a5f;">
        <strong>Připomínka:</strong> krajské výzvy, MPSV a ČMZRB nemají veřejně strojově čitelný zdroj dat.
        Zkontrolujte prosím ručně jejich weby a případné nové výzvy přidejte přes admin panel appky.
      </p>
    </div>
  `;

  await sendEmail(env, {
    to: ADMIN_EMAIL,
    subject: hasError || scrapeResult.parsed === 0 ? 'Hlídač dotací – POZOR, scraper má problém' : 'Hlídač dotací – denní report',
    html,
  }).catch(() => null);
}
