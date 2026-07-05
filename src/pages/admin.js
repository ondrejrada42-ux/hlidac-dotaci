import { el } from '../utils/dom.js';
import { Navbar } from '../components/navbar.js';
import { Footer } from '../components/footer.js';
import { db } from '../db.js';
import { CZ_NACE, KRAJE, VELIKOSTI, POSKYTOVATELE, PLANY } from '../config.js';
import { formatCastkaRozsah, formatDate } from '../utils/format.js';
import { toast } from '../utils/dom.js';

export async function AdminPage({ user } = {}) {
  const wrap = el('<div></div>');
  wrap.appendChild(Navbar(user));

  const main = el(`
    <main class="max-w-6xl mx-auto px-6 py-10">
      <h1 class="text-2xl font-bold text-primary-900 mb-1">Admin panel</h1>
      <p class="text-primary-500 text-sm mb-6">Správa výzev, uživatelů a přehled klíčových metrik.</p>
      <div class="flex gap-2 border-b border-gray-200 mb-6" id="admin-tabs">
        <button data-tab="vyzvy" class="px-4 py-2 font-semibold text-sm border-b-2">Výzvy</button>
        <button data-tab="uzivatele" class="px-4 py-2 font-semibold text-sm border-b-2">Uživatelé</button>
        <button data-tab="statistiky" class="px-4 py-2 font-semibold text-sm border-b-2">Statistiky</button>
      </div>
      <div id="admin-content"></div>
    </main>
  `);

  const content = main.querySelector('#admin-content');
  const tabs = main.querySelectorAll('#admin-tabs button');
  let activeTab = 'vyzvy';

  async function setActiveTab(tab) {
    activeTab = tab;
    tabs.forEach((t) => {
      const isActive = t.dataset.tab === tab;
      t.classList.toggle('border-accent-500', isActive);
      t.classList.toggle('text-accent-600', isActive);
      t.classList.toggle('border-transparent', !isActive);
      t.classList.toggle('text-primary-400', !isActive);
    });
    content.innerHTML = '<div class="flex justify-center py-16"><div class="h-6 w-6 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin"></div></div>';
    if (tab === 'vyzvy') await renderCallsTab();
    if (tab === 'uzivatele') await renderUsersTab();
    if (tab === 'statistiky') await renderStatsTab();
  }

  tabs.forEach((t) => t.addEventListener('click', () => setActiveTab(t.dataset.tab)));

  async function renderCallsTab() {
    const calls = (await db.getCalls()).slice().sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    content.innerHTML = `
      <div class="flex justify-end mb-4">
        <button id="btn-new-call" class="bg-primary-600 text-white font-semibold rounded-lg px-4 py-2 text-sm hover:bg-primary-700">+ Nová výzva</button>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-primary-500 text-left">
            <tr>
              <th class="px-4 py-3">Název</th>
              <th class="px-4 py-3">Poskytovatel</th>
              <th class="px-4 py-3">Částka</th>
              <th class="px-4 py-3">Deadline</th>
              <th class="px-4 py-3">Stav</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody id="calls-tbody"></tbody>
        </table>
      </div>
    `;
    const tbody = content.querySelector('#calls-tbody');
    calls.forEach((call) => {
      const row = el(`
        <tr class="border-t border-gray-100">
          <td class="px-4 py-3 font-medium text-primary-800">${call.nazev}</td>
          <td class="px-4 py-3">${call.poskytovatel}</td>
          <td class="px-4 py-3">${formatCastkaRozsah(call.min_castka, call.max_castka)}</td>
          <td class="px-4 py-3">${formatDate(call.deadline)}</td>
          <td class="px-4 py-3"><span class="text-xs font-semibold px-2 py-0.5 rounded-full ${call.stav === 'aktivni' ? 'bg-accent-50 text-accent-700' : 'bg-gray-100 text-gray-500'}">${call.stav === 'aktivni' ? 'Aktivní' : 'Ukončena'}</span></td>
          <td class="px-4 py-3 text-right whitespace-nowrap">
            <button data-edit="${call.id}" class="text-primary-600 font-semibold hover:text-accent-600 mr-3">Upravit</button>
            <button data-delete="${call.id}" class="text-red-500 font-semibold hover:text-red-700">Smazat</button>
          </td>
        </tr>
      `);
      row.querySelector('[data-edit]').addEventListener('click', () => openCallModal(call));
      row.querySelector('[data-delete]').addEventListener('click', async () => {
        if (confirm(`Opravdu smazat výzvu "${call.nazev}"?`)) {
          await db.deleteCall(call.id);
          toast('Výzva byla smazána.', 'info');
          renderCallsTab();
        }
      });
      tbody.appendChild(row);
    });

    content.querySelector('#btn-new-call').addEventListener('click', () => openCallModal(null));
  }

  function openCallModal(call) {
    const isEdit = !!call;
    const overlay = el(`
      <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4 py-8 overflow-y-auto">
        <div class="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 my-auto">
          <h3 class="font-bold text-primary-900 mb-4">${isEdit ? 'Upravit výzvu' : 'Nová výzva'}</h3>
          <form id="call-form" class="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <label class="block text-xs font-semibold text-primary-600 mb-1">Název</label>
              <input required name="nazev" value="${call?.nazev ?? ''}" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-primary-600 mb-1">Poskytovatel</label>
                <select name="poskytovatel" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  ${POSKYTOVATELE.map((p) => `<option value="${p}" ${call?.poskytovatel === p ? 'selected' : ''}>${p}</option>`).join('')}
                </select>
              </div>
              <div>
                <label class="block text-xs font-semibold text-primary-600 mb-1">Stav</label>
                <select name="stav" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                  <option value="aktivni" ${call?.stav === 'aktivni' ? 'selected' : ''}>Aktivní</option>
                  <option value="ukoncena" ${call?.stav === 'ukoncena' ? 'selected' : ''}>Ukončena</option>
                </select>
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold text-primary-600 mb-1">Obory (Ctrl/Cmd+klik pro více)</label>
              <select multiple name="obory" size="5" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                ${CZ_NACE.map((o) => `<option value="${o}" ${call?.obory?.includes(o) ? 'selected' : ''}>${o}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-primary-600 mb-1">Kraje</label>
              <select multiple name="kraje" size="4" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="Celá ČR" ${call?.kraje?.includes('Celá ČR') ? 'selected' : ''}>Celá ČR</option>
                ${KRAJE.map((k) => `<option value="${k}" ${call?.kraje?.includes(k) ? 'selected' : ''}>${k}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-primary-600 mb-1">Velikost firmy</label>
              <select multiple name="velikosti" size="4" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                ${VELIKOSTI.map((v) => `<option value="${v}" ${call?.velikosti?.includes(v) ? 'selected' : ''}>${v}</option>`).join('')}
              </select>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-semibold text-primary-600 mb-1">Min. částka (Kč)</label>
                <input required type="number" name="min_castka" value="${call?.min_castka ?? 0}" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-primary-600 mb-1">Max. částka (Kč)</label>
                <input required type="number" name="max_castka" value="${call?.max_castka ?? 0}" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold text-primary-600 mb-1">Deadline</label>
              <input required type="date" name="deadline" value="${call?.deadline ?? ''}" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-primary-600 mb-1">Popis</label>
              <textarea required name="popis" rows="3" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">${call?.popis ?? ''}</textarea>
            </div>
            <div>
              <label class="block text-xs font-semibold text-primary-600 mb-1">URL zdroje</label>
              <input required type="url" name="url" value="${call?.url ?? ''}" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div class="flex gap-3 pt-2">
              <button type="button" id="modal-cancel" class="flex-1 border border-gray-300 rounded-lg py-2 font-semibold text-primary-600 hover:bg-gray-50">Zrušit</button>
              <button type="submit" class="flex-1 bg-primary-600 text-white rounded-lg py-2 font-semibold hover:bg-primary-700">${isEdit ? 'Uložit změny' : 'Vytvořit výzvu'}</button>
            </div>
          </form>
        </div>
      </div>
    `);

    overlay.querySelector('#modal-cancel').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#call-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = new FormData(e.target);
      const payload = {
        nazev: data.get('nazev'),
        poskytovatel: data.get('poskytovatel'),
        stav: data.get('stav'),
        obory: data.getAll('obory'),
        kraje: data.getAll('kraje'),
        velikosti: data.getAll('velikosti'),
        min_castka: Number(data.get('min_castka')),
        max_castka: Number(data.get('max_castka')),
        deadline: data.get('deadline'),
        popis: data.get('popis'),
        url: data.get('url'),
      };
      if (isEdit) {
        await db.updateCall(call.id, payload);
        toast('Výzva byla upravena.');
      } else {
        await db.createCall(payload);
        toast('Výzva byla vytvořena.');
      }
      overlay.remove();
      renderCallsTab();
    });

    document.body.appendChild(overlay);
  }

  async function renderUsersTab() {
    const users = await db.getUsers();
    content.innerHTML = `
      <div class="bg-white rounded-xl border border-gray-100 overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 text-primary-500 text-left">
            <tr>
              <th class="px-4 py-3">E-mail</th>
              <th class="px-4 py-3">Role</th>
              <th class="px-4 py-3">Plán</th>
              <th class="px-4 py-3">Obor</th>
              <th class="px-4 py-3">Kraj</th>
              <th class="px-4 py-3">Registrace</th>
            </tr>
          </thead>
          <tbody>
            ${users
              .map(
                (u) => `
              <tr class="border-t border-gray-100">
                <td class="px-4 py-3 font-medium text-primary-800">${u.email}</td>
                <td class="px-4 py-3">${u.role === 'admin' ? 'Admin' : 'Uživatel'}</td>
                <td class="px-4 py-3"><span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700">${u.plan}</span></td>
                <td class="px-4 py-3">${u.obory?.length ? u.obory.join(', ') : '—'}</td>
                <td class="px-4 py-3">${u.kraj ?? '—'}</td>
                <td class="px-4 py-3">${formatDate(u.created_at)}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  async function renderStatsTab() {
    const allUsers = await db.getUsers();
    const users = allUsers.filter((u) => u.role !== 'admin');
    const proCount = users.filter((u) => u.plan === 'PRO').length;
    const firmaCount = users.filter((u) => u.plan === 'FIRMA').length;
    const freeCount = users.filter((u) => u.plan === 'FREE').length;
    const mrr = proCount * PLANY.PRO.cena + firmaCount * PLANY.FIRMA.cena;
    const calls = await db.getCalls();

    content.innerHTML = `
      <div class="grid sm:grid-cols-4 gap-4 mb-8">
        <div class="bg-white rounded-xl border border-gray-100 p-5">
          <div class="text-primary-400 text-xs font-semibold mb-1">MRR</div>
          <div class="text-2xl font-extrabold text-accent-600">${new Intl.NumberFormat('cs-CZ').format(mrr)} Kč</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 p-5">
          <div class="text-primary-400 text-xs font-semibold mb-1">Celkem uživatelů</div>
          <div class="text-2xl font-extrabold text-primary-900">${users.length}</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 p-5">
          <div class="text-primary-400 text-xs font-semibold mb-1">Placení uživatelé</div>
          <div class="text-2xl font-extrabold text-primary-900">${proCount + firmaCount}</div>
        </div>
        <div class="bg-white rounded-xl border border-gray-100 p-5">
          <div class="text-primary-400 text-xs font-semibold mb-1">Aktivní výzvy</div>
          <div class="text-2xl font-extrabold text-primary-900">${calls.filter((c) => c.stav === 'aktivni').length}</div>
        </div>
      </div>
      <div class="bg-white rounded-xl border border-gray-100 p-5">
        <h3 class="font-semibold text-primary-800 mb-3">Rozložení plánů</h3>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between"><span>FREE</span><span class="font-semibold">${freeCount}</span></div>
          <div class="flex justify-between"><span>PRO</span><span class="font-semibold">${proCount}</span></div>
          <div class="flex justify-between"><span>FIRMA</span><span class="font-semibold">${firmaCount}</span></div>
        </div>
      </div>
    `;
  }

  await setActiveTab('vyzvy');
  wrap.appendChild(main);
  wrap.appendChild(Footer());
  return wrap;
}
