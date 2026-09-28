const PAGE_IDS = {
  student: 'pg-s',
  professor: 'pg-p',
  reservations: 'pg-m'
};

const NAV_BUTTONS = {
  student: 'btn-student',
  professor: 'btn-professor',
  reservations: 'btn-student2'
};

function getElement(id) {
  return document.getElementById(id);
}

function setActivePage(pageName) {
  const selectedPageId = PAGE_IDS[pageName];

  if (!selectedPageId) {
    return;
  }

  Object.entries(PAGE_IDS).forEach(([name, pageId]) => {
    const page = getElement(pageId);

    if (!page) {
      return;
    }

    const isActive = pageId === selectedPageId;
    page.classList.toggle('on', isActive);
    page.hidden = !isActive;
    page.setAttribute('aria-hidden', String(!isActive));
  });

  Object.entries(NAV_BUTTONS).forEach(([name, buttonId]) => {
    const button = getElement(buttonId);

    if (!button) {
      return;
    }

    const isActive = name === pageName;
    button.classList.toggle('on', isActive);
    button.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}

function setupNavigation() {
  Object.entries(NAV_BUTTONS).forEach(([pageName, buttonId]) => {
    const button = getElement(buttonId);

    if (!button) {
      return;
    }

    button.type = 'button';
    button.addEventListener('click', () => setActivePage(pageName));
  });

  setActivePage('student');
}

function setupThemeToggle() {
  const themeButton = getElement('theme-btn');

  if (!themeButton) {
    return;
  }

  const savedTheme = window.localStorage.getItem('consultabook-theme');
  const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)').matches;
  const initialTheme = savedTheme || (prefersLight ? 'light' : 'dark');

  document.body.classList.toggle('light', initialTheme === 'light');
  themeButton.type = 'button';
  themeButton.setAttribute('aria-pressed', String(initialTheme === 'light'));

  themeButton.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light');
    window.localStorage.setItem('consultabook-theme', isLight ? 'light' : 'dark');
    themeButton.setAttribute('aria-pressed', String(isLight));
  });
}

function setupConnectionStatus() {
  const offlineBar = getElement('offline-bar');

  if (!offlineBar) {
    return;
  }

  const updateStatus = () => {
    const isOffline = !navigator.onLine;
    offlineBar.hidden = !isOffline;
    offlineBar.setAttribute('aria-hidden', String(!isOffline));
  };

  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);
  updateStatus();
}

function setupSearchClearButton() {
  const searchInput = getElement('sq');
  const clearButton = getElement('clr-btn');

  if (!searchInput || !clearButton) {
    return;
  }

  const updateClearButton = () => {
    clearButton.classList.toggle('show', searchInput.value.length > 0);
  };

  searchInput.addEventListener('input', updateClearButton);
  clearButton.addEventListener('click', () => {
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    searchInput.focus();
  });

  updateClearButton();
}

document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupThemeToggle();
  setupConnectionStatus();
  setupSearchClearButton();
});
