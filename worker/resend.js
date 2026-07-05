export async function sendEmail(env, { to, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.RESEND_FROM_ADDRESS || 'Hlídač dotací <onboarding@resend.dev>',
      to: [to],
      subject,
      html,
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend selhal: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

export function callRow({ call, score }) {
  return `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #e5e7eb;">
        <div style="font-size:12px;color:#1e3a5f;font-weight:600;">${call.poskytovatel} · ${score}% shoda</div>
        <div style="font-size:15px;font-weight:700;color:#0b1728;margin:4px 0;">${call.nazev}</div>
        <div style="font-size:13px;color:#1f9d5a;font-weight:600;">${new Intl.NumberFormat('cs-CZ').format(call.min_castka)}–${new Intl.NumberFormat('cs-CZ').format(call.max_castka)} Kč</div>
        <div style="font-size:12px;color:#6b7280;margin-top:2px;">Uzávěrka: ${new Date(call.deadline).toLocaleDateString('cs-CZ')}</div>
      </td>
    </tr>
  `;
}

export function digestEmailHtml({ heading, intro, matches, dashboardUrl }) {
  return `
    <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;">
      <h1 style="color:#1e3a5f;font-size:20px;">${heading}</h1>
      <p style="color:#374151;font-size:14px;">${intro}</p>
      <table style="width:100%;border-collapse:collapse;">
        ${matches.map(callRow).join('')}
      </table>
      <p style="margin-top:20px;">
        <a href="${dashboardUrl}" style="background:#1e3a5f;color:#fff;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:14px;">Zobrazit v Hlídači dotací</a>
      </p>
    </div>
  `;
}
