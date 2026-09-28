import { setupProfessorList } from './student-list.js';
import { setupBookingPanel } from './booking.js';

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

const THEME_STORAGE_KEY = 'vtszr_theme';

function getElement(id) {
  return document.getElementById(id);
}

function readStorage(key) {
  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    // Storage may be unavailable in restricted contexts.
  }
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
    button.setAttribute('aria-controls', PAGE_IDS[pageName]);
    button.addEventListener('click', () => setActivePage(pageName));
  });

  setActivePage('student');
}

function setupThemeToggle() {
  const themeButton = getElement('theme-btn');

  if (!themeButton) {
    return;
  }

  const savedTheme = readStorage(THEME_STORAGE_KEY);
  const prefersLight = window.matchMedia?.('(prefers-color-scheme: light)').matches;
  const initialTheme = savedTheme || (prefersLight ? 'light' : 'dark');

  document.body.classList.toggle('light', initialTheme === 'light');
  themeButton.type = 'button';
  themeButton.setAttribute('aria-label', 'Промени тему');
  themeButton.setAttribute('aria-pressed', String(initialTheme === 'light'));

  themeButton.addEventListener('click', () => {
    const isLight = document.body.classList.toggle('light');
    writeStorage(THEME_STORAGE_KEY, isLight ? 'light' : 'dark');
    themeButton.setAttribute('aria-pressed', String(isLight));
  });
}

function setupConnectionStatus() {
  const offlineBar = getElement('offline-bar');

  if (!offlineBar) {
    return;
  }

  offlineBar.setAttribute('role', 'status');
  offlineBar.setAttribute('aria-live', 'polite');

  const updateStatus = () => {
    const isOffline = !navigator.onLine;
    offlineBar.hidden = !isOffline;
    offlineBar.setAttribute('aria-hidden', String(!isOffline));
    offlineBar.classList.toggle('show', isOffline);
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

  searchInput.setAttribute('aria-label', 'Претражи наставнике или предмете');
  clearButton.type = 'button';

  const updateClearButton = () => {
    const hasValue = searchInput.value.length > 0;
    clearButton.classList.toggle('show', hasValue);
    clearButton.hidden = !hasValue;
  };

  searchInput.addEventListener('input', updateClearButton);
  clearButton.addEventListener('click', () => {
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    searchInput.focus();
  });

  updateClearButton();
}

function setupReducedMotion() {
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  if (!reducedMotion) {
    return;
  }

  const style = document.createElement('style');
  style.textContent = `
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      scroll-behavior: auto !important;
      transition-duration: 0.01ms !important;
    }
  `;
  document.head.append(style);
}

document.addEventListener('DOMContentLoaded', () => {
  setupNavigation();
  setupThemeToggle();
  setupConnectionStatus();
  setupSearchClearButton();
  setupReducedMotion();
  setupProfessorList();
  setupBookingPanel();
});
