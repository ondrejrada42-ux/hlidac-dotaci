import { el } from '../utils/dom.js';
import { Navbar } from '../components/navbar.js';
import { updatePassword } from '../state.js';
import { navigate } from '../router.js';
import { toast } from '../utils/dom.js';

export function ResetPasswordPage({ user } = {}) {
  const wrap = el('<div></div>');
  wrap.appendChild(Navbar(user));

  if (!user) {
    const main = el(`
      <main class="max-w-md mx-auto px-6 py-16 text-center">
        <h1 class="text-2xl font-bold text-primary-900 mb-2">Odkaz je neplatný nebo vypršel</h1>
        <p class="text-primary-500 mb-6 text-sm">Zkuste si vyžádat nový odkaz na reset hesla.</p>
        <a href="#/zapomenute-heslo" class="text-accent-600 font-semibold">Zapomenuté heslo</a>
      </main>
    `);
    wrap.appendChild(main);
    return wrap;
  }

  const main = el(`
    <main class="max-w-md mx-auto px-6 py-16">
      <h1 class="text-2xl font-bold text-primary-900 mb-1">Nastavit nové heslo</h1>
      <p class="text-primary-500 mb-8 text-sm">Zadejte nové heslo pro účet ${user.email}.</p>

      <form id="reset-form" class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div id="reset-error" class="hidden text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2"></div>
        <div>
          <label class="block text-sm font-medium text-primary-700 mb-1">Nové heslo</label>
          <input required type="password" name="password" minlength="6" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-400" placeholder="alespoň 6 znaků" />
        </div>
        <div>
          <label class="block text-sm font-medium text-primary-700 mb-1">Nové heslo znovu</label>
          <input required type="password" name="password2" minlength="6" class="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-accent-400" placeholder="zopakujte heslo" />
        </div>
        <button type="submit" class="w-full bg-primary-600 text-white font-semibold rounded-lg py-2.5 hover:bg-primary-700">Uložit nové heslo</button>
      </form>
    </main>
  `);

  const form = main.querySelector('#reset-form');
  const errorBox = main.querySelector('#reset-error');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = new FormData(form);
    const password = data.get('password');
    const password2 = data.get('password2');
    if (password !== password2) {
      errorBox.textContent = 'Hesla se neshodují.';
      errorBox.classList.remove('hidden');
      return;
    }
    const result = await updatePassword(password);
    if (!result.ok) {
      errorBox.textContent = result.error;
      errorBox.classList.remove('hidden');
      return;
    }
    toast('Heslo bylo změněno. Jste přihlášeni.');
    navigate('/dashboard');
  });

  wrap.appendChild(main);
  return wrap;
}
