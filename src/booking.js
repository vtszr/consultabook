import { professors } from './professors.js';

const bookingPanel = document.getElementById('booking-panel');
const bookingBody = document.getElementById('booking-body');
const bookingClose = document.getElementById('booking-close');

function openBookingPanel(professorId) {
  const professor = professors.find((entry) => entry.id === professorId);

  if (!professor || !bookingPanel || !bookingBody) {
    return;
  }

  const initials = professor.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || '')
    .join('')
    .toUpperCase();

  const days = professor.sessions
    .map((session) => `
      <div class="booking-slot-day">
        <strong>${session.day}</strong>
        <span>${session.start} - ${session.end}</span>
      </div>
    `)
    .join('');

  bookingBody.innerHTML = `
    <div class="booking-card">
      <div class="booking-header">
        <div class="booking-avatar" style="background:${professor.bg};">${initials}</div>
        <div>
          <h3>${professor.name}</h3>
          <p>${professor.subject}</p>
        </div>
      </div>

      <div class="booking-days">${days}</div>

      <div class="booking-actions">
        <button type="button" class="booking-primary">Изабери термин</button>
        <button type="button" class="booking-secondary" id="booking-close-inline">Назад</button>
      </div>
    </div>
  `;

  const inlineClose = document.getElementById('booking-close-inline');
  if (inlineClose) {
    inlineClose.addEventListener('click', closeBookingPanel);
  }

  bookingPanel.hidden = false;
  bookingPanel.classList.add('on');
  bookingPanel.setAttribute('aria-hidden', 'false');
}

function closeBookingPanel() {
  if (!bookingPanel) {
    return;
  }

  bookingPanel.hidden = true;
  bookingPanel.classList.remove('on');
  bookingPanel.setAttribute('aria-hidden', 'true');
}

export function setupBookingPanel() {
  if (!bookingPanel || !bookingClose || !bookingBody) {
    return;
  }

  bookingClose.addEventListener('click', closeBookingPanel);

  window.addEventListener('consultabook:open-professor', (event) => {
    const professorId = Number(event.detail);
    openBookingPanel(professorId);
  });

  closeBookingPanel();
}
