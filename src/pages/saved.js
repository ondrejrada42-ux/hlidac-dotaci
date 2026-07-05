import { el } from '../utils/dom.js';
import { Navbar } from '../components/navbar.js';
import { Footer } from '../components/footer.js';
import { db } from '../db.js';
import { formatCastkaRozsah, formatDate } from '../utils/format.js';
import { daysUntil } from '../matching.js';
import { toast } from '../utils/dom.js';

export async function SavedPage({ user }) {
  const wrap = el('<div></div>');
  wrap.appendChild(Navbar(user));

  const entries = await db.getSavedCallsByUser(user.id);
  const savedEntries = (
    await Promise.all(entries.map(async (entry) => ({ entry, call: await db.getCallById(entry.call_id) })))
  )
    .filter((x) => x.call)
    .sort((a, b) => new Date(a.call.deadline) - new Date(b.call.deadline));

  const main = el(`
    <main class="max-w-4xl mx-auto px-6 py-10">
      <h1 class="text-2xl font-bold text-primary-900 mb-1">Uložené výzvy</h1>
      <p class="text-primary-500 text-sm mb-8">Výzvy, které jste si uložili k pozdějšímu zpracování.</p>
      <div class="space-y-4" id="saved-list"></div>
      ${savedEntries.length === 0 ? '<div class="bg-white rounded-xl border border-gray-100 p-10 text-center text-primary-400">Zatím nemáte žádné uložené výzvy. <a href="#/dashboard" class="text-accent-600 font-semibold">Projít dashboard</a></div>' : ''}
    </main>
  `);

  const list = main.querySelector('#saved-list');

  savedEntries.forEach(({ entry, call }) => {
    const days = daysUntil(call.deadline);
    const item = el(`
      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div class="flex items-start justify-between gap-4">
          <div>
            <a href="#/vyzva/${call.id}" class="font-bold text-primary-900 hover:text-accent-600">${call.nazev}</a>
            <div class="text-sm text-primary-500 mt-1">${formatCastkaRozsah(call.min_castka, call.max_castka)} · Uzávěrka ${formatDate(call.deadline)} (${days >= 0 ? `za ${days} dní` : 'po termínu'})</div>
          </div>
          <button data-remove class="text-sm text-red-500 hover:text-red-700 font-semibold whitespace-nowrap">Odebrat</button>
        </div>
        <textarea data-note placeholder="Poznámka k výzvě…" class="mt-3 w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-400" rows="2">${entry.poznamka || ''}</textarea>
      </div>
    `);

    item.querySelector('[data-remove]').addEventListener('click', async () => {
      await db.removeSavedCall(entry.id);
      item.remove();
      toast('Výzva byla odebrána z uložených.', 'info');
    });

    item.querySelector('[data-note]').addEventListener('blur', async (e) => {
      await db.updateSavedNote(entry.id, e.target.value);
      toast('Poznámka uložena.', 'info');
    });

    list.appendChild(item);
  });

  wrap.appendChild(main);
  wrap.appendChild(Footer());
  return wrap;
}
