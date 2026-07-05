export function el(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
}

export function fragmentFromHtml(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content;
}

export function toast(message, type = 'success') {
  const existing = document.getElementById('toast-root');
  const colors = {
    success: 'bg-accent-500',
    error: 'bg-red-600',
    info: 'bg-primary-500',
  };
  const node = el(`
    <div class="${colors[type]} text-white px-4 py-3 rounded-lg shadow-lg fade-in mb-2 text-sm font-medium">
      ${message}
    </div>
  `);
  let root = existing;
  if (!root) {
    root = el('<div id="toast-root" class="fixed top-4 right-4 z-50 flex flex-col items-end"></div>');
    document.body.appendChild(root);
  }
  root.appendChild(node);
  setTimeout(() => node.remove(), 3200);
}
