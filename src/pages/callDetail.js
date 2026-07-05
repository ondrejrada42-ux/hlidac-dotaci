import { el } from '../utils/dom.js';
import { Navbar } from '../components/navbar.js';
import { Footer } from '../components/footer.js';
import { db } from '../db.js';
import { computeScore } from '../matching.js';
import { formatCastkaRozsah, formatDate } from '../utils/format.js';
import { navigate } from '../router.js';
import { toast } from '../utils/dom.js';

export async function CallDetailPage({ params, user }) {
  const call = await db.getCallById(params.id);
  const wrap = el('<div></div>');
  wrap.appendChild(Navbar(user));

  if (!call) {
    const main = el('<main class="max-w-3xl mx-auto px-6 py-16 text-center text-primary-400">Výzva nebyla nalezena.</main>');
    wrap.appendChild(main);
    return wrap;
  }

  const excluded = await db.getExcludedByUser(user.id);
  const score = computeScore(user, call, excluded);
  const saved = await db.isSaved(user.id, call.id);

  const main = el(`
    <main class="max-w-3xl mx-auto px-6 py-10">
      <a href="#/dashboard" class="text-sm text-primary-500 hover:text-accent-600">&larr; Zpět na dashboard</a>
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8 mt-4">
        <div class="flex items-center justify-between mb-3">
          <span class="text-xs font-semibold px-2 py-1 rounded-full bg-primary-50 text-primary-700">${call.poskytovatel}</span>
          <span class="text-sm font-bold text-primary-500">${score}% shoda s vaším profilem</span>
        </div>
        <h1 class="text-2xl font-bold text-primary-900 mb-3">${call.nazev}</h1>
        <div class="grid sm:grid-cols-2 gap-4 mb-6 text-sm">
          <div class="bg-gray-50 rounded-lg p-3">
            <div class="text-primary-400">Výše dotace</div>
            <div class="font-semibold text-accent-600">${formatCastkaRozsah(call.min_castka, call.max_castka)}</div>
          </div>
          <div class="bg-gray-50 rounded-lg p-3">
            <div class="text-primary-400">Uzávěrka</div>
            <div class="font-semibold text-primary-800">${formatDate(call.deadline)}</div>
          </div>
          <div class="bg-gray-50 rounded-lg p-3">
            <div class="text-primary-400">Obory</div>
            <div class="font-semibold text-primary-800">${call.obory.join(', ')}</div>
          </div>
          <div class="bg-gray-50 rounded-lg p-3">
            <div class="text-primary-400">Kraje</div>
            <div class="font-semibold text-primary-800">${call.kraje.join(', ')}</div>
          </div>
        </div>
        <h2 class="font-semibold text-primary-800 mb-2">Popis výzvy</h2>
        <p class="text-primary-600 leading-relaxed mb-4">${call.popis}</p>
        <p class="text-sm text-primary-500 mb-6">Pro koho je určena: firmy velikosti ${call.velikosti.join(', ')}.</p>
        <a href="${call.url}" target="_blank" rel="noopener" class="text-primary-600 font-semibold hover:text-accent-600 text-sm">Zdroj výzvy →</a>

        <div class="flex gap-3 mt-8 border-t border-gray-100 pt-6">
          <button id="btn-save" class="flex-1 font-semibold rounded-lg py-2.5 ${saved ? 'bg-accent-50 text-accent-700' : 'bg-accent-500 text-white hover:bg-accent-600'}">
            ${saved ? '✓ Uloženo' : 'Uložit výzvu'}
          </button>
          <button id="btn-dismiss" class="flex-1 border border-gray-300 text-primary-600 font-semibold rounded-lg py-2.5 hover:bg-gray-50">Nezajímá mě</button>
        </div>
      </div>
    </main>
  `);

  const saveBtn = main.querySelector('#btn-save');
  saveBtn.addEventListener('click', async () => {
    if (await db.isSaved(user.id, call.id)) return;
    await db.saveCall(user.id, call.id);
    saveBtn.textContent = '✓ Uloženo';
    saveBtn.classList.remove('bg-accent-500', 'text-white', 'hover:bg-accent-600');
    saveBtn.classList.add('bg-accent-50', 'text-accent-700');
    toast('Výzva byla uložena.');
  });

  main.querySelector('#btn-dismiss').addEventListener('click', async () => {
    await db.addExcluded(user.id, call);
    toast('Díky za zpětnou vazbu, přizpůsobíme vám budoucí doporučení.', 'info');
    navigate('/dashboard');
  });

  wrap.appendChild(main);
  wrap.appendChild(Footer());
  return wrap;
}
