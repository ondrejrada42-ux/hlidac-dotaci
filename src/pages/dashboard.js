import { el } from '../utils/dom.js';
import { Navbar } from '../components/navbar.js';
import { Footer } from '../components/footer.js';
import { CallCard } from '../components/callCard.js';
import { getMatchedCalls } from '../matching.js';
import { PLANY } from '../config.js';

export async function DashboardPage({ user }) {
  const wrap = el('<div></div>');
  wrap.appendChild(Navbar(user));

  const matches = await getMatchedCalls(user);
  const plan = PLANY[user.plan];
  const visibleCount = Number.isFinite(plan.limitVyzevMesicne) ? plan.limitVyzevMesicne : matches.length;
  const visible = matches.slice(0, visibleCount);
  const locked = matches.slice(visibleCount);

  const main = el(`
    <main class="max-w-6xl mx-auto px-6 py-10">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
        <div>
          <h1 class="text-2xl font-bold text-primary-900">Vaše relevantní výzvy</h1>
          <p class="text-primary-500 text-sm mt-1">
            Obor <strong>${user.obor}</strong> · Kraj <strong>${user.kraj}</strong> · ${user.velikost_firmy}
            &nbsp;·&nbsp;<a href="#/onboarding" class="text-accent-600 font-semibold">upravit profil</a>
          </p>
        </div>
        <span class="text-sm font-semibold text-primary-500 bg-primary-50 rounded-full px-3 py-1.5 w-fit">
          Plán ${plan.nazev} · ${matches.length} nalezených výzev
        </span>
      </div>

      ${
        matches.length === 0
          ? `<div class="bg-white rounded-xl border border-gray-100 p-10 text-center text-primary-400">
              Zatím jsme nenašli výzvy odpovídající vašemu profilu (skóre shody alespoň 30 %). Zkontrolujte nastavení profilu.
             </div>`
          : ''
      }

      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" id="call-grid"></div>

      ${
        locked.length > 0
          ? `<div class="mt-8 bg-primary-50 border border-primary-100 rounded-xl p-6 text-center">
              <p class="font-semibold text-primary-800 mb-1">Ve FREE plánu vidíte jen ${visibleCount} nejrelevantnější výzvy měsíčně.</p>
              <p class="text-sm text-primary-500 mb-4">Ještě máme ${locked.length} dalších výzev odpovídajících vašemu profilu. Přejděte na PRO pro neomezený přístup a okamžité notifikace.</p>
              <a href="#/cenik" class="inline-block bg-accent-500 text-white font-semibold rounded-lg px-6 py-2.5 hover:bg-accent-600">Přejít na PRO</a>
             </div>`
          : ''
      }
    </main>
  `);

  const grid = main.querySelector('#call-grid');
  visible.forEach(({ call, score }) => grid.appendChild(CallCard({ call, score })));
  locked.forEach(({ call, score }) => grid.appendChild(CallCard({ call, score, locked: true })));

  wrap.appendChild(main);
  wrap.appendChild(Footer());
  return wrap;
}
