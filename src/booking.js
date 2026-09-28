import { professors } from './professors.js';

const bookingPanel = document.getElementById('booking-panel');
const bookingBody = document.getElementById('booking-body');
const bookingClose = document.getElementById('booking-close');

let selectedProfessor = null;

function renderSlotButtons(professor) {
  const slots = professor.sessions.map((session) => `
    <button
      type="button"
      class="booking-slot"
      data-session='${JSON.stringify(session)}'
      style="margin:6px 6px 0 0;"
    >
      ${session.day} • ${session.start} - ${session.end}
    </button>
  `).join('');

  return `
    <div class="booking-card">
      <div class="booking-header">
        <div class="booking-avatar" style="background:${professor.bg};">
          ${professor.name.split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase()}
        </div>
        <div>
          <h3>${professor.name}</h3>
          <p>${professor.subject}</p>
        </div>
      </div>

      <div class="booking-days">
        ${slots}
      </div>

      <div class="booking-actions">
        <button type="button" class="booking-secondary" id="booking-close-inline">Назад</button>
      </div>
    </div>
  `;
}

function showReservationForm(selectedSession) {
  if (!selectedProfessor || !bookingBody) return;

  bookingBody.innerHTML = `
    <div class="booking-card">
      <div class="booking-header">
        <div class="booking-avatar" style="background:${selectedProfessor.bg};">
          ${selectedProfessor.name.split(/\s+/).slice(0, 2).map((part) => part[0] || '').join('').toUpperCase()}
        </div>
        <div>
          <h3>${selectedProfessor.name}</h3>
          <p>${selectedProfessor.subject}</p>
        </div>
      </div>

      <p><strong>Изабран термин:</strong> ${selectedSession.day} • ${selectedSession.start} - ${selectedSession.end}</p>

      <form id="booking-form">
        <label>
          Име и презиме
          <input type="text" name="studentName" required />
        </label>

        <label>
          Група / индекс
          <input type="text" name="studentGroup" required />
        </label>

        <label>
          Напомена
          <textarea name="note" rows="3"></textarea>
        </label>

        <button type="submit" class="booking-primary">Потврди резервацију</button>
      </form>
    </div>
  `;

  const form = document.getElementById('booking-form');
  if (!form) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const payload = {
      professorId: selectedProfessor.id,
      professorName: selectedProfessor.name,
      session: selectedSession,
      studentName: data.get('studentName'),
      studentGroup: data.get('studentGroup'),
      note: data.get('note')
    };

    console.log('Reservation payload:', payload);
    alert('Резервација је снимљена локално.');
  });
}

function openBookingPanel(professorId) {
  const professor = professors.find((entry) => entry.id === professorId);

  if (!professor || !bookingPanel || !bookingBody) {
    return;
  }

  selectedProfessor = professor;
  bookingBody.innerHTML = renderSlotButtons(professor);

  const inlineClose = document.getElementById('booking-close-inline');
  if (inlineClose) {
    inlineClose.addEventListener('click', closeBookingPanel);
  }

  bookingBody.querySelectorAll('.booking-slot').forEach((button) => {
    button.addEventListener('click', () => {
      const session = JSON.parse(button.dataset.session);
      showReservationForm(session);
    });
  });

  bookingPanel.hidden = false;
  bookingPanel.classList.add('on');
  bookingPanel.setAttribute('aria-hidden', 'false');
}

function closeBookingPanel() {
  if (!bookingPanel) return;
  bookingPanel.hidden = true;
  bookingPanel.classList.remove('on');
  bookingPanel.setAttribute('aria-hidden', 'true');
}

export function setupBookingPanel() {
  if (!bookingPanel || !bookingClose || !bookingBody) return;

  bookingClose.addEventListener('click', closeBookingPanel);

  window.addEventListener('consultabook:open-professor', (event) => {
    const professorId = Number(event.detail);
    openBookingPanel(professorId);
  });

  closeBookingPanel();
}
