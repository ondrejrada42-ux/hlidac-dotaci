import { el } from '../utils/dom.js';
import { Navbar } from '../components/navbar.js';
import { Footer } from '../components/footer.js';
import { PLANY, STRIPE_PUBLISHABLE_KEY } from '../config.js';
import { db } from '../db.js';
import { navigate } from '../router.js';
import { toast } from '../utils/dom.js';

const FEATURES = {
  FREE: ['3 výzvy měsíčně', 'Týdenní souhrn e-mailem', 'Skóre relevance', '1 firemní profil'],
  PRO: ['Neomezený počet výzev', 'Okamžité notifikace', 'Pokročilé filtry', '1 firemní profil'],
  FIRMA: ['Vše z plánu PRO', 'Více firemních profilů', 'Export výzev do CSV', 'Přístup přes API'],
};

function PlanCard(plan, highlight) {
  return `
    <div class="rounded-xl border ${highlight ? 'border-accent-500 shadow-lg sm:scale-105' : 'border-gray-200'} bg-white p-6 flex flex-col">
      ${highlight ? '<span class="text-xs font-bold text-accent-600 mb-2">NEJOBLÍBENĚJŠÍ</span>' : ''}
      <h3 class="text-lg font-bold text-primary-800">${plan.nazev}</h3>
      <div class="my-3">
        <span class="text-3xl font-extrabold text-primary-900">${plan.cena === 0 ? 'Zdarma' : plan.cena + ' Kč'}</span>
        ${plan.cena > 0 ? '<span class="text-primary-400 text-sm">/měsíc</span>' : ''}
      </div>
      <ul class="space-y-2 text-sm text-primary-600 mb-6 flex-1">
        ${FEATURES[plan.id].map((f) => `<li class="flex gap-2"><span class="text-accent-500">✓</span>${f}</li>`).join('')}
      </ul>
      <button data-plan="${plan.id}" class="mt-auto font-semibold rounded-lg px-4 py-2.5 ${highlight ? 'bg-accent-500 text-white hover:bg-accent-600' : 'bg-primary-50 text-primary-700 hover:bg-primary-100'}">
        ${plan.cena === 0 ? 'Vybrat FREE' : 'Předplatit'}
      </button>
    </div>
  `;
}

export function PricingPage({ user } = {}) {
  const wrap = el('<div></div>');
  wrap.appendChild(Navbar(user));

  const main = el(`
    <main class="max-w-5xl mx-auto px-6 py-14">
      <h1 class="text-3xl font-extrabold text-primary-900 text-center mb-2">Ceník</h1>
      <p class="text-primary-500 text-center mb-10">Vyberte plán podle toho, kolik výzev a jak rychle chcete vidět. Bez skrytých poplatků.</p>
      <div class="grid sm:grid-cols-3 gap-6" id="plan-grid">
        ${PlanCard(PLANY.FREE, false)}
        ${PlanCard(PLANY.PRO, true)}
        ${PlanCard(PLANY.FIRMA, false)}
      </div>
      <p class="text-center text-xs text-primary-400 mt-8">Ceny jsou uvedeny bez DPH. Předplatné lze kdykoliv zrušit v nastavení účtu.</p>
    </main>
  `);

  main.querySelectorAll('[data-plan]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const planId = btn.dataset.plan;

      if (!user) {
        navigate('/registrace');
        return;
      }

      if (planId === 'FREE') {
        await db.updateUser(user.id, { plan: 'FREE' });
        toast('Plán byl nastaven na FREE.');
        return;
      }

      if (STRIPE_PUBLISHABLE_KEY) {
        btn.disabled = true;
        btn.textContent = 'Přesměrovávám…';
        try {
          const res = await fetch('/api/create-checkout-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, userEmail: user.email, plan: planId }),
          });
          const data = await res.json();
          if (!res.ok || !data.url) throw new Error(data.error || 'Platbu se nepodařilo zahájit.');
          window.location.href = data.url;
        } catch (err) {
          toast(err.message, 'error');
          btn.disabled = false;
          btn.textContent = 'Předplatit';
        }
        return;
      }

      openDemoCheckoutModal(planId, user);
    });
  });

  wrap.appendChild(main);
  wrap.appendChild(Footer());
  return wrap;
}

function openDemoCheckoutModal(planId, user) {
  const plan = PLANY[planId];
  const overlay = el(`
    <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4">
      <div class="bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
        <h3 class="font-bold text-primary-900 mb-2">Demo režim platby</h3>
        <p class="text-sm text-primary-500 mb-4">
          Stripe není v tomto demu napojen na reálný platební účet. Kliknutím níže simulujeme úspěšnou platbu
          a rovnou vám nastavíme plán <strong>${plan.nazev}</strong> (${plan.cena} Kč/měsíc).
        </p>
        <div class="flex gap-3">
          <button id="modal-cancel" class="flex-1 border border-gray-300 rounded-lg py-2 font-semibold text-primary-600 hover:bg-gray-50">Zrušit</button>
          <button id="modal-confirm" class="flex-1 bg-accent-500 text-white rounded-lg py-2 font-semibold hover:bg-accent-600">Simulovat platbu</button>
        </div>
      </div>
    </div>
  `);
  overlay.querySelector('#modal-cancel').addEventListener('click', () => overlay.remove());
  overlay.querySelector('#modal-confirm').addEventListener('click', async () => {
    await db.updateUser(user.id, { plan: planId });
    overlay.remove();
    toast(`Plán byl upgradován na ${plan.nazev}.`);
    navigate('/dashboard');
  });
  document.body.appendChild(overlay);
}
