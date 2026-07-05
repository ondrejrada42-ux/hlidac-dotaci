import { el } from '../utils/dom.js';
import { Navbar } from '../components/navbar.js';
import { Footer } from '../components/footer.js';
import { db } from '../db.js';
import { POSKYTOVATELE, PLANY } from '../config.js';
import { toast } from '../utils/dom.js';

const FREQ_OPTIONS = [
  { value: 'okamzite', label: 'Okamžitě', desc: 'E-mail ihned po objevení nové relevantní výzvy.', proOnly: true },
  { value: 'denni', label: 'Denní souhrn', desc: 'Jeden e-mail denně se všemi novými výzvami.', proOnly: true },
  { value: 'tydenni', label: 'Týdenní souhrn', desc: 'Jeden e-mail týdně s přehledem výzev.', proOnly: false },
];

export function SettingsPage({ user }) {
  const wrap = el('<div></div>');
  wrap.appendChild(Navbar(user));
  const isFree = user.plan === 'FREE';

  const main = el(`
    <main class="max-w-2xl mx-auto px-6 py-10">
      <h1 class="text-2xl font-bold text-primary-900 mb-1">Nastavení notifikací</h1>
      <p class="text-primary-500 text-sm mb-8">Vyberte, jak často a o jakých výzvách chcete dostávat e-maily.</p>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 class="font-semibold text-primary-800 mb-4">Frekvence e-mailů</h2>
        <div class="space-y-3" id="freq-options"></div>
        ${isFree ? '<p class="text-xs text-primary-400 mt-3">Okamžité a denní notifikace jsou dostupné od plánu <a href="#/cenik" class="text-accent-600 font-semibold">PRO</a>.</p>' : ''}
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 class="font-semibold text-primary-800 mb-4">Poskytovatelé, o které mám zájem</h2>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3" id="provider-toggles"></div>
      </div>

      <button id="btn-save-settings" class="mt-6 bg-primary-600 text-white font-semibold rounded-lg px-6 py-2.5 hover:bg-primary-700">Uložit nastavení</button>
    </main>
  `);

  const freqBox = main.querySelector('#freq-options');
  let selectedFreq = user.notification_prefs.frequency;
  const providerState = { ...user.notification_prefs.poskytovatele };

  function renderFreq() {
    freqBox.innerHTML = FREQ_OPTIONS.map((opt) => {
      const disabled = opt.proOnly && isFree;
      const checked = selectedFreq === opt.value;
      return `
        <label class="flex items-start gap-3 p-3 rounded-lg border ${checked ? 'border-accent-500 bg-accent-50' : 'border-gray-200'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}">
          <input type="radio" name="freq" value="${opt.value}" ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''} class="mt-1" />
          <span>
            <span class="block font-semibold text-primary-800">${opt.label}${disabled ? ' (PRO)' : ''}</span>
            <span class="block text-xs text-primary-500">${opt.desc}</span>
          </span>
        </label>
      `;
    }).join('');
    freqBox.querySelectorAll('input[name="freq"]').forEach((input) => {
      input.addEventListener('change', () => {
        selectedFreq = input.value;
      });
    });
  }

  const providerBox = main.querySelector('#provider-toggles');
  providerBox.innerHTML = POSKYTOVATELE.map(
    (p) => `
      <label class="flex items-center gap-2 text-sm p-2 rounded-lg border border-gray-200 cursor-pointer">
        <input type="checkbox" data-provider="${p}" ${providerState[p] ? 'checked' : ''} />
        ${p}
      </label>
    `
  ).join('');
  providerBox.querySelectorAll('input[data-provider]').forEach((input) => {
    input.addEventListener('change', () => {
      providerState[input.dataset.provider] = input.checked;
    });
  });

  main.querySelector('#btn-save-settings').addEventListener('click', async () => {
    await db.updateUser(user.id, { notification_prefs: { frequency: selectedFreq, poskytovatele: providerState } });
    toast('Nastavení notifikací bylo uloženo.');
  });

  renderFreq();
  wrap.appendChild(main);
  wrap.appendChild(Footer());
  return wrap;
}
