import { el } from '../utils/dom.js';
import { Navbar } from '../components/navbar.js';
import { Footer } from '../components/footer.js';
import { PLANY } from '../config.js';

const FAQ = [
  {
    q: 'Jak Hlídač dotací pozná, které výzvy jsou pro mě relevantní?',
    a: 'Při registraci vyplníte obor podnikání, kraj a velikost firmy. Podle shody s parametry každé výzvy spočítáme skóre relevance 0–100 % a zobrazujeme jen výzvy nad 30 %.',
  },
  {
    q: 'Odkud se berou informace o dotacích?',
    a: 'Sledujeme výzvy z evropských operačních programů (OP TAK, OP Zaměstnanost+, OP JAK), ministerstev (MPO, MMR, MZe, MPSV), krajů a dalších poskytovatelů jako SFŽP nebo ČMZRB.',
  },
  {
    q: 'Můžu zrušit předplatné kdykoliv?',
    a: 'Ano, předplatné PRO i FIRMA můžete kdykoliv zrušit v nastavení účtu, bez výpovědní lhůty.',
  },
  {
    q: 'Je FREE varianta opravdu zdarma?',
    a: 'Ano. Na FREE plánu dostanete týdenní souhrn až 3 nejrelevantnějších výzev měsíčně, bez nutnosti platební karty.',
  },
];

function BenefitCard(icon, title, text) {
  return `
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div class="text-3xl mb-3">${icon}</div>
      <h3 class="font-bold text-primary-800 mb-2">${title}</h3>
      <p class="text-sm text-primary-500 leading-relaxed">${text}</p>
    </div>
  `;
}

function PricingPreviewCard(plan, highlight = false) {
  return `
    <div class="rounded-xl border ${highlight ? 'border-accent-500 shadow-lg scale-105' : 'border-gray-200'} bg-white p-6 flex flex-col">
      ${highlight ? '<span class="text-xs font-bold text-accent-600 mb-2">NEJOBLÍBENĚJŠÍ</span>' : ''}
      <h3 class="text-lg font-bold text-primary-800">${plan.nazev}</h3>
      <div class="my-3">
        <span class="text-3xl font-extrabold text-primary-900">${plan.cena === 0 ? 'Zdarma' : plan.cena + ' Kč'}</span>
        ${plan.cena > 0 ? '<span class="text-primary-400 text-sm">/měsíc</span>' : ''}
      </div>
      <a href="#/registrace" class="mt-auto text-center font-semibold rounded-lg px-4 py-2 ${highlight ? 'bg-accent-500 text-white hover:bg-accent-600' : 'bg-primary-50 text-primary-700 hover:bg-primary-100'}">Vybrat plán</a>
    </div>
  `;
}

export function LandingPage({ user } = {}) {
  const wrap = el('<div></div>');
  wrap.appendChild(Navbar(user));

  const main = el(`
    <main>
      <section class="bg-gradient-to-b from-primary-50 to-white">
        <div class="max-w-5xl mx-auto px-6 pt-20 pb-24 text-center">
          <span class="inline-block bg-accent-50 text-accent-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-6">Pro firmy a živnostníky v ČR</span>
          <h1 class="text-4xl sm:text-5xl font-extrabold text-primary-900 leading-tight mb-6">
            Už nikdy nepropásnete<br /><span class="text-accent-500">dotaci</span>
          </h1>
          <p class="text-lg text-primary-500 max-w-2xl mx-auto mb-10">
            Hlídač dotací automaticky sleduje dotační výzvy a granty z EU, ministerstev i krajů
            a posílá vám jen ty, které se skutečně týkají vaší firmy. Vy nemusíte nic hledat.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="#/registrace" class="bg-primary-600 text-white font-semibold rounded-lg px-8 py-3.5 hover:bg-primary-700 shadow-lg shadow-primary-600/20">Zaregistrovat se zdarma</a>
            <button id="btn-scroll-faq" class="border border-gray-300 text-primary-700 font-semibold rounded-lg px-8 py-3.5 hover:bg-gray-50">Jak to funguje</button>
          </div>
        </div>
      </section>

      <section class="max-w-6xl mx-auto px-6 py-20">
        <div class="grid sm:grid-cols-3 gap-6">
          ${BenefitCard('🎯', 'Automatický monitoring', 'Sledujeme desítky zdrojů dotací za vás – žádné ruční hledání na úřadech a portálech.')}
          ${BenefitCard('📊', 'Skóre relevance', 'Každá výzva má skóre shody 0–100 % podle vašeho oboru, kraje a velikosti firmy.')}
          ${BenefitCard('🔔', 'Notifikace na míru', 'Vyberte si okamžité upozornění, denní nebo týdenní souhrn – podle toho, jak pracujete.')}
        </div>
      </section>

      <section class="bg-primary-50/50 py-20">
        <div class="max-w-5xl mx-auto px-6">
          <h2 class="text-2xl font-bold text-center text-primary-900 mb-10">Jednoduchý a transparentní ceník</h2>
          <div class="grid sm:grid-cols-3 gap-6">
            ${PricingPreviewCard(PLANY.FREE)}
            ${PricingPreviewCard(PLANY.PRO, true)}
            ${PricingPreviewCard(PLANY.FIRMA)}
          </div>
          <div class="text-center mt-6">
            <a href="#/cenik" class="text-primary-600 font-semibold hover:text-accent-600">Zobrazit detailní srovnání plánů →</a>
          </div>
        </div>
      </section>

      <section id="faq" class="max-w-3xl mx-auto px-6 py-20">
        <h2 class="text-2xl font-bold text-center text-primary-900 mb-10">Časté dotazy</h2>
        <div class="space-y-3" id="faq-list"></div>
      </section>

      <section class="max-w-4xl mx-auto px-6 pb-24 text-center">
        <div class="bg-primary-600 rounded-2xl px-8 py-14 text-white">
          <h2 class="text-2xl sm:text-3xl font-extrabold mb-4">Přestaňte hledat, začněte dostávat</h2>
          <p class="text-primary-100 mb-8 max-w-xl mx-auto">Registrace zabere 2 minuty. Nastavíte si profil firmy a od první chvíle uvidíte relevantní výzvy.</p>
          <a href="#/registrace" class="inline-block bg-white text-primary-700 font-bold rounded-lg px-8 py-3.5 hover:bg-gray-100">Založit účet zdarma</a>
        </div>
      </section>
    </main>
  `);

  const faqList = main.querySelector('#faq-list');
  FAQ.forEach(({ q, a }, i) => {
    const item = el(`
      <div class="bg-white rounded-lg border border-gray-100 shadow-sm">
        <button class="w-full text-left px-5 py-4 flex items-center justify-between font-semibold text-primary-800" data-faq="${i}">
          <span>${q}</span>
          <span class="text-primary-400">+</span>
        </button>
        <div class="px-5 pb-4 text-sm text-primary-500 leading-relaxed hidden" data-faq-body="${i}">${a}</div>
      </div>
    `);
    item.querySelector('button').addEventListener('click', () => {
      item.querySelector(`[data-faq-body="${i}"]`).classList.toggle('hidden');
    });
    faqList.appendChild(item);
  });

  main.querySelector('#btn-scroll-faq').addEventListener('click', () => {
    main.querySelector('#faq').scrollIntoView({ behavior: 'smooth' });
  });

  const hashQuery = window.location.hash.split('?')[1];
  if (hashQuery && new URLSearchParams(hashQuery).get('scrollTo') === 'faq') {
    setTimeout(() => main.querySelector('#faq').scrollIntoView({ behavior: 'smooth' }), 50);
  }

  wrap.appendChild(main);
  wrap.appendChild(Footer());
  return wrap;
}
