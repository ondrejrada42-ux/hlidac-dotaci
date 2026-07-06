import { el } from '../utils/dom.js';
import { Navbar } from '../components/navbar.js';
import { requestPasswordReset } from '../state.js';

export function ForgotPasswordPage({ user } = {}) {
  const wrap = el('<div></div>');
  wrap.appendChild(Navbar(user));

  const main = el(`
    <main class="max-w-md mx-auto px-6 py-16">
      <h1 class="text-2xl font-bold text-primary-900 mb-1">Zapomenuté heslo</h1>
      <p class="text-primary-500 mb-8 text-sm">Zadejte e-mail a pošleme vám odkaz na nastavení nového hesla.</p>

      <form id="forgot-form" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div id="forgot-error" class="hidden text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2"></div>
        <div id="forgot-success" class="hidden text-sm text-accent-700 bg-accent-50 rounded-lg px-3 py-2"></div>
        <div>
          <label class="block text-sm font-medium text-primary-700 mb-1">E-mail</label>
          <input required type="email" name="email" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-400" placeholder="vy@firma.cz" />
        </div>
        <button type="submit" class="w-full bg-primary-600 text-white font-semibold rounded-lg py-2.5 hover:bg-primary-700">Odeslat odkaz na reset hesla</button>
        <p class="text-xs text-primary-400 text-center"><a href="#/prihlaseni" class="text-accent-600 font-semibold">Zpět na přihlášení</a></p>
      </form>
    </main>
  `);

  const form = main.querySelector('#forgot-form');
  const errorBox = main.querySelector('#forgot-error');
  const successBox = main.querySelector('#forgot-success');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorBox.classList.add('hidden');
    successBox.classList.add('hidden');
    const data = new FormData(form);
    const result = await requestPasswordReset(data.get('email').trim());
    if (!result.ok) {
      errorBox.textContent = result.error;
      errorBox.classList.remove('hidden');
      return;
    }
    successBox.textContent = 'Pokud účet s tímto e-mailem existuje, poslali jsme na něj odkaz na nastavení nového hesla.';
    successBox.classList.remove('hidden');
    form.querySelector('button[type=submit]').disabled = true;
  });

  wrap.appendChild(main);
  return wrap;
}
