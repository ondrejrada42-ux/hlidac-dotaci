import { el } from '../utils/dom.js';
import { Navbar } from '../components/navbar.js';
import { CZ_NACE, KRAJE, VELIKOSTI } from '../config.js';
import { db } from '../db.js';
import { navigate } from '../router.js';
import { toast } from '../utils/dom.js';

export function OnboardingPage({ user }) {
  const wrap = el('<div></div>');
  wrap.appendChild(Navbar(user));

  const answers = { obory: user.obory && user.obory.length ? [...user.obory] : [], kraj: user.kraj || null, velikost_firmy: user.velikost_firmy || null };
  let step = 1;

  const main = el(`
    <main class="max-w-2xl mx-auto px-6 py-16">
      <div class="mb-8">
        <div class="flex items-center gap-2 mb-2" id="progress-dots"></div>
        <p class="text-sm text-primary-400" id="step-label"></p>
      </div>
      <div id="step-content" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 min-h-[320px]"></div>
      <div class="flex justify-between mt-6">
        <button id="btn-back" class="text-primary-500 font-semibold px-4 py-2 hover:text-primary-700">Zpět</button>
        <button id="btn-next" class="bg-primary-600 text-white font-semibold rounded-lg px-6 py-2.5 hover:bg-primary-700">Pokračovat</button>
      </div>
    </main>
  `);

  const dots = main.querySelector('#progress-dots');
  const stepLabel = main.querySelector('#step-label');
  const content = main.querySelector('#step-content');
  const btnBack = main.querySelector('#btn-back');
  const btnNext = main.querySelector('#btn-next');

  function renderDots() {
    dots.innerHTML = [1, 2, 3]
      .map((n) => `<div class="h-2 flex-1 rounded-full ${n <= step ? 'bg-accent-500' : 'bg-gray-200'}"></div>`)
      .join('');
    stepLabel.textContent = `Krok ${step} ze 3`;
  }

  function renderStep() {
    renderDots();
    btnBack.classList.toggle('invisible', step === 1);
    btnNext.textContent = step === 3 ? 'Dokončit a zobrazit dashboard' : 'Pokračovat';

    if (step === 1) {
      content.innerHTML = `
        <h2 class="font-bold text-lg text-primary-900 mb-1">V jakých oborech podnikáte?</h2>
        <p class="text-sm text-primary-500 mb-4">Můžete vybrat víc oborů najednou. Podle oboru vybíráme nejrelevantnější výzvy (váha 50 % skóre shody).</p>
        <div class="grid grid-cols-2 gap-2" id="obor-grid">
          ${CZ_NACE.map(
            (o) => `
            <button type="button" data-value="${o}" class="text-left text-sm px-3 py-2.5 rounded-lg border ${answers.obory.includes(o) ? 'border-accent-500 bg-accent-50 text-accent-700 font-semibold' : 'border-gray-200 hover:border-gray-300'}">
              ${answers.obory.includes(o) ? '✓ ' : ''}${o}
            </button>
          `
          ).join('')}
        </div>
      `;
      content.querySelectorAll('#obor-grid button').forEach((btn) => {
        btn.addEventListener('click', () => {
          const value = btn.dataset.value;
          if (answers.obory.includes(value)) {
            answers.obory = answers.obory.filter((o) => o !== value);
          } else {
            answers.obory.push(value);
          }
          renderStep();
        });
      });
    }

    if (step === 2) {
      content.innerHTML = `
        <h2 class="font-bold text-lg text-primary-900 mb-1">Ve kterém kraji podnikáte?</h2>
        <p class="text-sm text-primary-500 mb-4">Kraj se podílí na skóre shody z 30 %.</p>
        <div class="grid grid-cols-2 gap-2" id="kraj-grid">
          ${KRAJE.map(
            (k) => `
            <button type="button" data-value="${k}" class="text-left text-sm px-3 py-2.5 rounded-lg border ${answers.kraj === k ? 'border-accent-500 bg-accent-50 text-accent-700 font-semibold' : 'border-gray-200 hover:border-gray-300'}">${k}</button>
          `
          ).join('')}
        </div>
      `;
      content.querySelectorAll('#kraj-grid button').forEach((btn) => {
        btn.addEventListener('click', () => {
          answers.kraj = btn.dataset.value;
          renderStep();
        });
      });
    }

    if (step === 3) {
      content.innerHTML = `
        <h2 class="font-bold text-lg text-primary-900 mb-1">Jak velká je vaše firma?</h2>
        <p class="text-sm text-primary-500 mb-4">Velikost firmy tvoří zbývajících 20 % skóre shody.</p>
        <div class="grid grid-cols-2 gap-3" id="velikost-grid">
          ${VELIKOSTI.map(
            (v) => `
            <button type="button" data-value="${v}" class="text-left text-sm px-4 py-4 rounded-lg border ${answers.velikost_firmy === v ? 'border-accent-500 bg-accent-50 text-accent-700 font-semibold' : 'border-gray-200 hover:border-gray-300'}">${v}</button>
          `
          ).join('')}
        </div>
      `;
      content.querySelectorAll('#velikost-grid button').forEach((btn) => {
        btn.addEventListener('click', () => {
          answers.velikost_firmy = btn.dataset.value;
          renderStep();
        });
      });
    }
  }

  btnBack.addEventListener('click', () => {
    if (step > 1) {
      step -= 1;
      renderStep();
    }
  });

  btnNext.addEventListener('click', async () => {
    if (step === 1 && answers.obory.length === 0) return toast('Vyberte prosím alespoň jeden obor podnikání.', 'error');
    if (step === 2 && !answers.kraj) return toast('Vyberte prosím kraj.', 'error');
    if (step === 3 && !answers.velikost_firmy) return toast('Vyberte prosím velikost firmy.', 'error');

    if (step < 3) {
      step += 1;
      renderStep();
    } else {
      await db.updateUser(user.id, { ...answers, onboarding_complete: true });
      toast('Profil je nastaven. Vítejte v Hlídači dotací!');
      navigate('/dashboard');
    }
  });

  renderStep();
  wrap.appendChild(main);
  return wrap;
}
