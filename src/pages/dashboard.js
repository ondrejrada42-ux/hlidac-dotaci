import { el } from '../utils/dom.js';
import { Navbar } from '../components/navbar.js';
import { Footer } from '../components/footer.js';
import { CallCard } from '../components/callCard.js';
import { getMatchedCalls } from '../matching.js';
import { PLANY } from '../config.js';
import { db } from '../db.js';
import { navigate } from '../router.js';

function exportToCsv(matches) {
  const header = ['Název', 'Poskytovatel', 'Min. částka', 'Max. částka', 'Deadline', 'Shoda %', 'URL'];
  const rows = matches.map(({ call, score }) => [
    call.nazev,
    call.poskytovatel,
    call.min_castka,
    call.max_castka,
    call.deadline,
    score,
    call.url,
  ]);
  const csv = [header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\r\n');
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `hlidac-dotaci-vyzvy-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function getRequestedProfileId() {
  const query = window.location.hash.split('?')[1];
  if (!query) return null;
  return new URLSearchParams(query).get('profile');
}

export async function DashboardPage({ user }) {
  const wrap = el('<div></div>');
  wrap.appendChild(Navbar(user));

  const isFirma = user.plan === 'FIRMA';
  const companyProfiles = isFirma ? await db.getCompanyProfiles(user.id) : [];
  const requestedId = getRequestedProfileId();
  const activeProfile = requestedId ? companyProfiles.find((p) => p.id === requestedId) : null;

  const activeUser = activeProfile
    ? { ...user, obory: activeProfile.obory, kraj: activeProfile.kraj, velikost_firmy: activeProfile.velikost_firmy }
    : user;
  const activeLabel = activeProfile ? activeProfile.nazev : 'Primární profil';

  const matches = await getMatchedCalls(activeUser);
  const plan = PLANY[user.plan];
  const visibleCount = Number.isFinite(plan.limitVyzevMesicne) ? plan.limitVyzevMesicne : matches.length;
  const visible = matches.slice(0, visibleCount);
  const locked = matches.slice(visibleCount);

  const main = el(`
    <main class="max-w-6xl mx-auto px-6 py-10">
      <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-4">
        <div>
          <h1 class="text-2xl font-bold text-primary-900">Vaše relevantní výzvy</h1>
          <p class="text-primary-500 text-sm mt-1">
            Obory <strong>${activeUser.obory.join(', ')}</strong> · Kraj <strong>${activeUser.kraj}</strong> · ${activeUser.velikost_firmy}
            &nbsp;·&nbsp;<a href="#/onboarding" class="text-accent-600 font-semibold">upravit profil</a>
          </p>
        </div>
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold text-primary-500 bg-primary-50 rounded-full px-3 py-1.5 w-fit">
            Plán ${plan.nazev} · ${matches.length} nalezených výzev
          </span>
          ${
            isFirma
              ? '<button id="btn-export-csv" class="text-sm font-semibold text-primary-600 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50">Export do CSV</button>'
              : ''
          }
        </div>
      </div>

      ${
        isFirma && companyProfiles.length > 0
          ? `<div class="mb-8">
              <label class="text-xs font-semibold text-primary-500 mr-2">Firemní profil:</label>
              <select id="profile-select" class="text-sm border border-gray-300 rounded-lg px-3 py-1.5">
                <option value="">Primární profil</option>
                ${companyProfiles.map((p) => `<option value="${p.id}" ${activeProfile?.id === p.id ? 'selected' : ''}>${p.nazev}</option>`).join('')}
              </select>
             </div>`
          : ''
      }

      ${
        matches.length === 0
          ? `<div class="bg-white rounded-xl border border-gray-100 p-10 text-center text-primary-400">
              Zatím jsme nenašli výzvy odpovídající profilu "${activeLabel}" (skóre shody alespoň 30 %). Zkontrolujte nastavení profilu.
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

  main.querySelector('#btn-export-csv')?.addEventListener('click', () => exportToCsv(matches));
  main.querySelector('#profile-select')?.addEventListener('change', (e) => {
    navigate(e.target.value ? `/dashboard?profile=${e.target.value}` : '/dashboard');
  });

  wrap.appendChild(main);
  wrap.appendChild(Footer());
  return wrap;
}
