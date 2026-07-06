import { el } from '../utils/dom.js';

export function Footer() {
  return el(`
    <footer class="bg-primary-800 text-primary-100 mt-24">
      <div class="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-8">
        <div>
          <div class="flex items-center gap-2 font-extrabold text-lg text-white mb-2">🔎 Hlídač dotací</div>
          <p class="text-sm text-primary-300">Automatický monitoring dotačních výzev a grantů pro české firmy a živnostníky.</p>
        </div>
        <div>
          <h4 class="font-semibold text-white mb-2">Produkt</h4>
          <ul class="space-y-1 text-sm text-primary-300">
            <li><a href="#/cenik" class="hover:text-white">Ceník</a></li>
            <li><a href="#/registrace" class="hover:text-white">Registrace</a></li>
            <li><a href="#/?scrollTo=faq" class="hover:text-white">Časté dotazy</a></li>
          </ul>
        </div>
        <div>
          <h4 class="font-semibold text-white mb-2">Informace</h4>
          <ul class="space-y-1 text-sm text-primary-300">
            <li><a href="#/zasady-zpracovani-udaju" class="hover:text-white">Zásady zpracování osobních údajů</a></li>
            <li><a href="#/obchodni-podminky" class="hover:text-white">Obchodní podmínky</a></li>
            <li>ondrejrada42@gmail.com</li>
          </ul>
        </div>
      </div>
      <div class="border-t border-primary-700 text-center text-xs text-primary-400 py-4">
        © 2026 Hlídač dotací. Všechna práva vyhrazena.
      </div>
    </footer>
  `);
}
