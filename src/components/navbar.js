import { el } from '../utils/dom.js';
import { logout } from '../state.js';
import { navigate } from '../router.js';

export function Navbar(user) {
  const wrap = el(`
    <header class="sticky top-0 z-40 bg-white border-b border-gray-200">
      <nav class="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <a href="#/" class="flex items-center gap-2 font-extrabold text-lg text-primary-600">
          <span class="text-xl">🔎</span> Hlídač dotací
        </a>
        <div class="hidden md:flex items-center gap-6 text-sm font-medium text-primary-600" id="nav-links"></div>
        <div class="hidden md:flex items-center gap-3" id="nav-actions"></div>
        <button id="btn-menu-toggle" class="md:hidden text-primary-600 p-2" aria-label="Otevřít menu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16"/></svg>
        </button>
      </nav>
      <div class="hidden md:hidden flex-col gap-1 px-4 pb-4 border-t border-gray-100" id="mobile-menu"></div>
    </header>
  `);

  const links = wrap.querySelector('#nav-links');
  const actions = wrap.querySelector('#nav-actions');
  const mobileMenu = wrap.querySelector('#mobile-menu');
  const menuToggle = wrap.querySelector('#btn-menu-toggle');

  menuToggle.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
    mobileMenu.classList.toggle('flex');
  });

  function handleLogout(e) {
    e.preventDefault();
    logout().then(() => navigate('/'));
  }

  if (user) {
    const linksHtml = `
      <a href="#/dashboard" class="hover:text-accent-600">Dashboard</a>
      <a href="#/ulozene" class="hover:text-accent-600">Uložené</a>
      <a href="#/nastaveni" class="hover:text-accent-600">Nastavení</a>
      <a href="#/cenik" class="hover:text-accent-600">Ceník</a>
      ${user.role === 'admin' ? '<a href="#/admin" class="hover:text-accent-600">Admin</a>' : ''}
    `;
    links.innerHTML = linksHtml;
    actions.innerHTML = `
      <span class="hidden sm:inline text-sm text-primary-400">${user.email}</span>
      <button id="btn-logout" class="text-sm font-semibold text-primary-600 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50">Odhlásit se</button>
    `;
    actions.querySelector('#btn-logout').addEventListener('click', handleLogout);

    mobileMenu.innerHTML = `
      <div class="flex flex-col gap-3 py-2 text-sm font-medium text-primary-600">${linksHtml}</div>
      <div class="text-sm text-primary-400 pb-1">${user.email}</div>
      <button id="btn-logout-mobile" class="text-sm font-semibold text-primary-600 border border-gray-300 rounded-lg px-3 py-1.5 hover:bg-gray-50 w-fit">Odhlásit se</button>
    `;
    mobileMenu.querySelector('#btn-logout-mobile').addEventListener('click', handleLogout);
  } else {
    const linksHtml = `
      <a href="#/cenik" class="hover:text-accent-600">Ceník</a>
      <a href="#/#faq" class="hover:text-accent-600">FAQ</a>
    `;
    links.innerHTML = linksHtml;
    actions.innerHTML = `
      <a href="#/prihlaseni" class="text-sm font-semibold text-primary-600 px-3 py-1.5 hover:text-accent-600">Přihlásit se</a>
      <a href="#/registrace" class="text-sm font-semibold text-white bg-primary-600 rounded-lg px-4 py-2 hover:bg-primary-700">Zaregistrovat se zdarma</a>
    `;
    mobileMenu.innerHTML = `
      <div class="flex flex-col gap-3 py-2 text-sm font-medium text-primary-600">${linksHtml}</div>
      <a href="#/prihlaseni" class="text-sm font-semibold text-primary-600 py-1.5">Přihlásit se</a>
      <a href="#/registrace" class="text-sm font-semibold text-white bg-primary-600 rounded-lg px-4 py-2 hover:bg-primary-700 text-center">Zaregistrovat se zdarma</a>
    `;
  }

  mobileMenu.querySelectorAll('a').forEach((a) => {
    a.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
      mobileMenu.classList.remove('flex');
    });
  });

  return wrap;
}
