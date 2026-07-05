import { getCurrentUser } from './state.js';

const routes = [];

export function route(pattern, handler, opts = {}) {
  const paramNames = [];
  const regex = new RegExp(
    '^' +
      pattern
        .split('/')
        .map((seg) => {
          if (seg.startsWith(':')) {
            paramNames.push(seg.slice(1));
            return '([^/]+)';
          }
          return seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        })
        .join('/') +
      '$'
  );
  routes.push({ regex, paramNames, handler, opts });
}

export function navigate(path) {
  window.location.hash = path;
}

function currentPath() {
  const hash = window.location.hash.slice(1);
  return hash || '/';
}

export function startRouter(rootEl) {
  let renderToken = 0;

  async function render() {
    const token = ++renderToken;
    const path = currentPath().split('?')[0];

    rootEl.innerHTML = '<div class="flex justify-center py-24"><div class="h-8 w-8 rounded-full border-2 border-primary-200 border-t-primary-600 animate-spin"></div></div>';

    let user;
    try {
      user = await getCurrentUser();
    } catch {
      user = null;
    }
    if (token !== renderToken) return;

    for (const r of routes) {
      const match = path.match(r.regex);
      if (!match) continue;

      if (r.opts.auth && !user) {
        navigate('/prihlaseni');
        return;
      }
      if (r.opts.admin && (!user || user.role !== 'admin')) {
        navigate('/dashboard');
        return;
      }
      if (r.opts.onboarded && user && !user.onboarding_complete) {
        navigate('/onboarding');
        return;
      }

      const params = {};
      r.paramNames.forEach((name, i) => {
        params[name] = decodeURIComponent(match[i + 1]);
      });

      const view = await r.handler({ params, user });
      if (token !== renderToken) return;

      rootEl.innerHTML = '';
      if (view instanceof Node) {
        rootEl.appendChild(view);
      }
      window.scrollTo(0, 0);
      return;
    }

    rootEl.innerHTML = '<div class="p-10 text-center text-primary-500">Stránka nenalezena.</div>';
  }

  window.addEventListener('hashchange', render);
  render();
  return render;
}
