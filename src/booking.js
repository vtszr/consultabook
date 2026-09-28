import { professors } from './professors.js';

const bookingPanel = document.getElementById('booking-panel');
const bookingBody = document.getElementById('booking-body');
const bookingClose = document.getElementById('booking-close');
const RESERVATIONS_KEY = 'consultabook_reservations';

let selectedProfessor = null;

function readReservations() {
  try {
    const saved = window.localStorage.getItem(RESERVATIONS_KEY);
    const reservations = saved ? JSON.parse(saved) : [];
    return Array.isArray(reservations) ? reservations : [];
  } catch (error) {
    return [];
  }
}

function saveReservation(reservation) {
  try {
    const reservations = readReservations();
    reservations.push(reservation);
    window.localStorage.setItem(RESERVATIONS_KEY, JSON.stringify(reservations));
    window.dispatchEvent(new CustomEvent('consultabook:reservation-saved', {
      detail: reservation
    }));
    return true;
  } catch (error) {
    return false;
  }
}

function getInitials(name) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || '')
    .join('')
    .toUpperCase();
}

function closeBookingPanel() {
  if (!bookingPanel) {
    return;
  }

  bookingPanel.hidden = true;
  bookingPanel.classList.remove('on');
  bookingPanel.setAttribute('aria-hidden', 'true');
}

function bindSlotButtons() {
  const inlineClose = document.getElementById('booking-close-inline');
  if (inlineClose) {
    inlineClose.addEventListener('click', closeBookingPanel);
  }

  bookingBody.querySelectorAll('.booking-slot').forEach((button) => {
    button.addEventListener('click', () => {
      const index = Number(button.dataset.index);
      const session = selectedProfessor?.sessions[index];
      if (session) {
        renderReservationForm(session);
      }
    });
  });
}

function renderSlotButtons(professor) {
  return `
    <div class="booking-card">
      <div class="booking-header">
        <div class="booking-avatar" style="background:${professor.bg};">${getInitials(professor.name)}</div>
        <div>
          <h3>${professor.name}</h3>
          <p>${professor.subject}</p>
        </div>
      </div>

      <p>Изаберите доступан термин:</p>
      <div class="booking-days">
        ${professor.sessions.map((session, index) => `
          <button type="button" class="booking-slot" data-index="${index}">
            <strong>Дан ${session.day}</strong>
            <span>${session.start} – ${session.end}</span>
          </button>
        `).join('')}
      </div>

      <div class="booking-actions">
        <button type="button" class="booking-secondary" id="booking-close-inline">Назад</button>
      </div>
    </div>
  `;
}

function renderReservationForm(session) {
  if (!selectedProfessor || !bookingBody) {
    return;
  }

  bookingBody.innerHTML = `
    <div class="booking-card">
      <div class="booking-header">
        <div class="booking-avatar" style="background:${selectedProfessor.bg};">${getInitials(selectedProfessor.name)}</div>
        <div>
          <h3>${selectedProfessor.name}</h3>
          <p>${selectedProfessor.subject}</p>
        </div>
      </div>

      <p><strong>Изабран термин:</strong> Дан ${session.day} · ${session.start} – ${session.end}</p>

      <form id="booking-form">
        <label class="booking-field">
          <span>Име и презиме</span>
          <input type="text" name="studentName" autocomplete="name" required>
        </label>
        <label class="booking-field">
          <span>Група / индекс</span>
          <input type="text" name="studentGroup" required>
        </label>
        <label class="booking-field">
          <span>Напомена</span>
          <textarea name="note" rows="3"></textarea>
        </label>
        <div class="booking-actions">
          <button type="submit" class="booking-primary">Потврди резервацију</button>
          <button type="button" class="booking-secondary" id="booking-back-to-slots">Назад</button>
        </div>
      </form>
    </div>
  `;

  const form = document.getElementById('booking-form');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const saved = saveReservation({
      id: `${Date.now()}-${selectedProfessor.id}`,
      professorId: selectedProfessor.id,
      professorName: selectedProfessor.name,
      session,
      studentName: String(data.get('studentName') || '').trim(),
      studentGroup: String(data.get('studentGroup') || '').trim(),
      note: String(data.get('note') || '').trim(),
      createdAt: new Date().toISOString()
    });

    if (saved) {
      alert('Резервација је сачувана локално.');
      closeBookingPanel();
    } else {
      alert('Резервација није могла да се сачува.');
    }
  });

  document.getElementById('booking-back-to-slots')?.addEventListener('click', () => {
    bookingBody.innerHTML = renderSlotButtons(selectedProfessor);
    bindSlotButtons();
  });
}

function openBookingPanel(professorId) {
  const professor = professors.find((entry) => entry.id === professorId);
  if (!professor || !bookingPanel || !bookingBody) {
    return;
  }

  selectedProfessor = professor;
  bookingBody.innerHTML = renderSlotButtons(professor);
  bindSlotButtons();
  bookingPanel.hidden = false;
  bookingPanel.classList.add('on');
  bookingPanel.setAttribute('aria-hidden', 'false');
}

export function setupBookingPanel() {
  if (!bookingPanel || !bookingClose || !bookingBody) {
    return;
  }

  bookingClose.addEventListener('click', closeBookingPanel);
  window.addEventListener('consultabook:open-professor', (event) => {
    openBookingPanel(Number(event.detail));
  });
  closeBookingPanel();
}
