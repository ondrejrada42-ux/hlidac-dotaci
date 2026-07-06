import { el } from '../utils/dom.js';
import { Navbar } from '../components/navbar.js';
import { register } from '../state.js';
import { navigate } from '../router.js';
import { toast } from '../utils/dom.js';

export function RegisterPage({ user } = {}) {
  const wrap = el('<div></div>');
  wrap.appendChild(Navbar(user));

  const main = el(`
    <main class="max-w-md mx-auto px-6 py-16">
      <h1 class="text-2xl font-bold text-primary-900 mb-1">Vytvořit účet</h1>
      <p class="text-primary-500 mb-8 text-sm">Za 2 minuty nastavíte profil firmy a uvidíte první relevantní výzvy.</p>

      <form id="register-form" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div id="register-error" class="hidden text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2"></div>
        <div>
          <label class="block text-sm font-medium text-primary-700 mb-1">E-mail</label>
          <input required type="email" name="email" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-400" placeholder="vy@firma.cz" />
        </div>
        <div>
          <label class="block text-sm font-medium text-primary-700 mb-1">Heslo</label>
          <input required type="password" name="password" minlength="6" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-400" placeholder="alespoň 6 znaků" />
        </div>
        <label class="flex items-start gap-2 text-xs text-primary-500">
          <input required type="checkbox" class="mt-0.5" />
          Souhlasím se <a href="#/zasady-zpracovani-udaju" class="text-accent-600 font-semibold" target="_blank">zpracováním osobních údajů</a> a <a href="#/obchodni-podminky" class="text-accent-600 font-semibold" target="_blank">obchodními podmínkami</a>.
        </label>
        <button type="submit" class="w-full bg-primary-600 text-white font-semibold rounded-lg py-2.5 hover:bg-primary-700">Pokračovat na nastavení profilu</button>
        <p class="text-xs text-primary-400 text-center">Už máte účet? <a href="#/prihlaseni" class="text-accent-600 font-semibold">Přihlaste se</a></p>
      </form>
    </main>
  `);

  const form = main.querySelector('#register-form');
  const errorBox = main.querySelector('#register-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const result = await register(data.get('email').trim(), data.get('password'));
    if (!result.ok) {
      errorBox.textContent = result.error;
      errorBox.classList.remove('hidden');
      return;
    }
    if (result.needsConfirmation) {
      toast('Účet vytvořen. Zkontrolujte e-mail a potvrďte registraci, pak se přihlaste.', 'info');
      navigate('/prihlaseni');
      return;
    }
    toast('Účet byl vytvořen. Pojďme nastavit váš profil.');
    navigate('/onboarding');
  });

  wrap.appendChild(main);
  return wrap;
}
