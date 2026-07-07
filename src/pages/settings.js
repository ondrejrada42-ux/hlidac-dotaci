import { el } from '../utils/dom.js';
import { Navbar } from '../components/navbar.js';
import { Footer } from '../components/footer.js';
import { db } from '../db.js';
import { POSKYTOVATELE, PLANY, CZ_NACE, KRAJE, VELIKOSTI } from '../config.js';
import { toast } from '../utils/dom.js';

const FREQ_OPTIONS = [
  { value: 'okamzite', label: 'Okamžitě', desc: 'E-mail ihned po objevení nové relevantní výzvy.', proOnly: true },
  { value: 'denni', label: 'Denní souhrn', desc: 'Jeden e-mail denně se všemi novými výzvami.', proOnly: true },
  { value: 'tydenni', label: 'Týdenní souhrn', desc: 'Jeden e-mail týdně s přehledem výzev.', proOnly: false },
];

export async function SettingsPage({ user }) {
  const wrap = el('<div></div>');
  wrap.appendChild(Navbar(user));
  const isFree = user.plan === 'FREE';
  const isFirma = user.plan === 'FIRMA';

  const main = el(`
    <main class="max-w-2xl mx-auto px-6 py-10">
      <h1 class="text-2xl font-bold text-primary-900 mb-1">Nastavení notifikací</h1>
      <p class="text-primary-500 text-sm mb-8">Vyberte, jak často a o jakých výzvách chcete dostávat e-maily.</p>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 class="font-semibold text-primary-800 mb-4">Frekvence e-mailů</h2>
        <div class="space-y-3" id="freq-options"></div>
        ${isFree ? '<p class="text-xs text-primary-400 mt-3">Okamžité a denní notifikace jsou dostupné od plánu <a href="#/cenik" class="text-accent-600 font-semibold">PRO</a>.</p>' : ''}
      </div>

      <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
        <h2 class="font-semibold text-primary-800 mb-4">Poskytovatelé, o které mám zájem</h2>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3" id="provider-toggles"></div>
      </div>

      <button id="btn-save-settings" class="bg-primary-600 text-white font-semibold rounded-lg px-6 py-2.5 hover:bg-primary-700">Uložit nastavení</button>

      <div class="mt-10 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div class="flex items-center justify-between mb-1">
          <h2 class="font-semibold text-primary-800">Firemní profily</h2>
          ${isFirma ? '<button id="btn-add-profile" class="text-sm font-semibold text-accent-600 hover:text-accent-700">+ Přidat profil</button>' : ''}
        </div>
        <p class="text-xs text-primary-400 mb-4">
          ${
            isFirma
              ? 'Spravujte více firemních profilů (např. pobočky s jiným oborem/krajem). Výzvy se hledají pro každý profil zvlášť.'
              : 'Více firemních profilů je dostupné od plánu <a href="#/cenik" class="text-accent-600 font-semibold">FIRMA</a>.'
          }
        </p>
        <div id="profiles-list" class="space-y-3"></div>
      </div>
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

  const profilesList = main.querySelector('#profiles-list');

  async function renderProfiles() {
    profilesList.innerHTML = '<p class="text-sm text-primary-400">Načítám…</p>';
    const primaryCard = `
      <div class="border border-gray-200 rounded-lg p-4">
        <div class="flex items-center justify-between">
          <span class="font-semibold text-primary-800">Primární profil</span>
          <span class="text-xs bg-primary-50 text-primary-600 px-2 py-0.5 rounded-full">z registrace</span>
        </div>
        <p class="text-sm text-primary-500 mt-1">${user.obory.join(', ')} · ${user.kraj} · ${user.velikost_firmy}</p>
      </div>
    `;

    if (!isFirma) {
      profilesList.innerHTML = primaryCard;
      return;
    }

    const profiles = await db.getCompanyProfiles(user.id);
    profilesList.innerHTML =
      primaryCard +
      profiles
        .map(
          (p) => `
        <div class="border border-gray-200 rounded-lg p-4" data-profile-id="${p.id}">
          <div class="flex items-center justify-between">
            <span class="font-semibold text-primary-800">${p.nazev}</span>
            <div class="flex gap-3">
              <button data-edit-profile="${p.id}" class="text-sm text-primary-600 font-semibold hover:text-accent-600">Upravit</button>
              <button data-delete-profile="${p.id}" class="text-sm text-red-500 font-semibold hover:text-red-700">Smazat</button>
            </div>
          </div>
          <p class="text-sm text-primary-500 mt-1">${p.obory.join(', ')} · ${p.kraj} · ${p.velikost_firmy}</p>
        </div>
      `
        )
        .join('');

    profilesList.querySelectorAll('[data-edit-profile]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const profile = profiles.find((p) => p.id === btn.dataset.editProfile);
        openProfileModal(profile);
      });
    });
    profilesList.querySelectorAll('[data-delete-profile]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!confirm('Opravdu smazat tento firemní profil?')) return;
        await db.deleteCompanyProfile(btn.dataset.deleteProfile);
        toast('Profil byl smazán.', 'info');
        renderProfiles();
      });
    });
  }

  function openProfileModal(profile) {
    const isEdit = !!profile;
    const answers = {
      nazev: profile?.nazev ?? '',
      obory: profile?.obory ? [...profile.obory] : [],
      kraj: profile?.kraj ?? null,
      velikost_firmy: profile?.velikost_firmy ?? null,
    };

    const overlay = el(`
      <div class="fixed inset-0 bg-black/40 z-50 flex items-center justify-center px-4 py-8 overflow-y-auto">
        <div class="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 my-auto">
          <h3 class="font-bold text-primary-900 mb-4">${isEdit ? 'Upravit profil' : 'Nový firemní profil'}</h3>
          <div class="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
            <div>
              <label class="block text-xs font-semibold text-primary-600 mb-1">Název profilu</label>
              <input id="pm-nazev" required value="${answers.nazev}" placeholder="např. Pobočka Brno" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-primary-600 mb-1">Obory</label>
              <div class="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto" id="pm-obory">
                ${CZ_NACE.map(
                  (o) => `<button type="button" data-value="${o}" class="text-left text-xs px-2 py-1.5 rounded border ${answers.obory.includes(o) ? 'border-accent-500 bg-accent-50 text-accent-700 font-semibold' : 'border-gray-200'}">${answers.obory.includes(o) ? '✓ ' : ''}${o}</button>`
                ).join('')}
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold text-primary-600 mb-1">Kraj</label>
              <select id="pm-kraj" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Vyberte kraj</option>
                ${KRAJE.map((k) => `<option value="${k}" ${answers.kraj === k ? 'selected' : ''}>${k}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-xs font-semibold text-primary-600 mb-1">Velikost firmy</label>
              <select id="pm-velikost" class="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                <option value="">Vyberte velikost</option>
                ${VELIKOSTI.map((v) => `<option value="${v}" ${answers.velikost_firmy === v ? 'selected' : ''}>${v}</option>`).join('')}
              </select>
            </div>
          </div>
          <div class="flex gap-3 pt-4">
            <button type="button" id="pm-cancel" class="flex-1 border border-gray-300 rounded-lg py-2 font-semibold text-primary-600 hover:bg-gray-50">Zrušit</button>
            <button type="button" id="pm-save" class="flex-1 bg-primary-600 text-white rounded-lg py-2 font-semibold hover:bg-primary-700">${isEdit ? 'Uložit změny' : 'Vytvořit profil'}</button>
          </div>
        </div>
      </div>
    `);

    overlay.querySelector('#pm-obory').querySelectorAll('button').forEach((btn) => {
      btn.addEventListener('click', () => {
        const value = btn.dataset.value;
        if (answers.obory.includes(value)) {
          answers.obory = answers.obory.filter((o) => o !== value);
        } else {
          answers.obory.push(value);
        }
        const isSelected = answers.obory.includes(value);
        btn.classList.toggle('border-accent-500', isSelected);
        btn.classList.toggle('bg-accent-50', isSelected);
        btn.classList.toggle('text-accent-700', isSelected);
        btn.classList.toggle('font-semibold', isSelected);
        btn.classList.toggle('border-gray-200', !isSelected);
        btn.textContent = (isSelected ? '✓ ' : '') + value;
      });
    });

    overlay.querySelector('#pm-cancel').addEventListener('click', () => overlay.remove());
    overlay.querySelector('#pm-save').addEventListener('click', async () => {
      answers.nazev = overlay.querySelector('#pm-nazev').value.trim();
      answers.kraj = overlay.querySelector('#pm-kraj').value;
      answers.velikost_firmy = overlay.querySelector('#pm-velikost').value;

      if (!answers.nazev || answers.obory.length === 0 || !answers.kraj || !answers.velikost_firmy) {
        toast('Vyplňte prosím všechna pole a vyberte alespoň jeden obor.', 'error');
        return;
      }

      if (isEdit) {
        await db.updateCompanyProfile(profile.id, answers);
        toast('Profil byl upraven.');
      } else {
        await db.createCompanyProfile(user.id, answers);
        toast('Profil byl vytvořen.');
      }
      overlay.remove();
      renderProfiles();
    });

    document.body.appendChild(overlay);
  }

  main.querySelector('#btn-add-profile')?.addEventListener('click', () => openProfileModal(null));

  renderFreq();
  await renderProfiles();
  wrap.appendChild(main);
  wrap.appendChild(Footer());
  return wrap;
}
