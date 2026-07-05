import { el } from '../utils/dom.js';
import { Navbar } from '../components/navbar.js';
import { login } from '../state.js';
import { navigate } from '../router.js';
import { toast } from '../utils/dom.js';
import { DEMO_MODE } from '../config.js';

export function LoginPage({ user } = {}) {
  const wrap = el('<div></div>');
  wrap.appendChild(Navbar(user));

  const main = el(`
    <main class="max-w-md mx-auto px-6 py-16">
      <h1 class="text-2xl font-bold text-primary-900 mb-1">Přihlášení</h1>
      <p class="text-primary-500 mb-8 text-sm">Přihlaste se ke svému účtu Hlídače dotací.</p>

      <form id="login-form" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div id="login-error" class="hidden text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2"></div>
        <div>
          <label class="block text-sm font-medium text-primary-700 mb-1">E-mail</label>
          <input required type="email" name="email" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-400" placeholder="vy@firma.cz" />
        </div>
        <div>
          <label class="block text-sm font-medium text-primary-700 mb-1">Heslo</label>
          <input required type="password" name="password" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-400" placeholder="••••••••" />
        </div>
        <button type="submit" class="w-full bg-primary-600 text-white font-semibold rounded-lg py-2.5 hover:bg-primary-700">Přihlásit se</button>
        <p class="text-xs text-primary-400 text-center">Nemáte účet? <a href="#/registrace" class="text-accent-600 font-semibold">Zaregistrujte se</a></p>
        ${
          DEMO_MODE
            ? `<div class="text-xs text-primary-400 bg-primary-50 rounded-lg p-3 mt-2">
                <strong>Demo přístup:</strong><br />
                Uživatel: demo@firma.cz / demo123<br />
                Admin: admin@hlidacdotaci.cz / admin123
               </div>`
            : ''
        }
      </form>
    </main>
  `);

  const form = main.querySelector('#login-form');
  const errorBox = main.querySelector('#login-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const result = await login(data.get('email').trim(), data.get('password'));
    if (!result.ok) {
      errorBox.textContent = result.error;
      errorBox.classList.remove('hidden');
      return;
    }
    toast(`Vítejte zpět, ${result.user.email}!`);
    navigate(result.user.role === 'admin' ? '/admin' : result.user.onboarding_complete ? '/dashboard' : '/onboarding');
  });

  wrap.appendChild(main);
  return wrap;
}
