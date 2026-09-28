import { professors } from './professors.js';

const bookingPanel = document.getElementById('booking-panel');
const bookingBody = document.getElementById('booking-body');
const bookingClose = document.getElementById('booking-close');

let selectedProfessor = null;

function closeBookingPanel() {
  if (!bookingPanel) {
    return;
  }

  bookingPanel.hidden = true;
  bookingPanel.classList.remove('on');
  bookingPanel.setAttribute('aria-hidden', 'true');
}

function renderSlotButtons(professor) {
  return `
    <div class="booking-card">
      <div class="booking-header">
        <div class="booking-avatar" style="background:${professor.bg};">
          ${professor.name
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0] || '')
            .join('')
            .toUpperCase()}
        </div>
        <div>
          <h3>${professor.name}</h3>
          <p>${professor.subject}</p>
        </div>
      </div>

      <div class="booking-days">
        ${professor.sessions
          .map(
            (session, index) => `
              <button
                type="button"
                class="booking-slot"
                data-index="${index}"
                style="
                  background: var(--bg3);
                  border: 1px solid var(--border);
                  border-radius: 10px;
                  color: var(--text);
                  padding: .75rem;
                  cursor: pointer;
                  text-align: left;
                  font: inherit;
                "
              >
                <strong>${session.day}</strong><br>
                <span>${session.start} - ${session.end}</span>
              </button>
            `
          )
          .join('')}
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
        <div class="booking-avatar" style="background:${selectedProfessor.bg};">
          ${selectedProfessor.name
            .split(/\s+/)
            .slice(0, 2)
            .map((part) => part[0] || '')
            .join('')
            .toUpperCase()}
        </div>
        <div>
          <h3>${selectedProfessor.name}</h3>
          <p>${selectedProfessor.subject}</p>
        </div>
      </div>

      <p><strong>Изабран термин:</strong> ${session.day} • ${session.start} - ${session.end}</p>

      <form id="booking-form">
        <div style="display:grid; gap:.75rem;">
          <label style="display:grid; gap:.35rem;">
            <span>Име и презиме</span>
            <input type="text" name="studentName" required style="padding:.65rem .75rem; border-radius:10px; border:1px solid var(--border); background: var(--bg); color:var(--text);" />
          </label>

          <label style="display:grid; gap:.35rem;">
            <span>Група / индекс</span>
            <input type="text" name="studentGroup" required style="padding:.65rem .75rem; border-radius:10px; border:1px solid var(--border); background: var(--bg); color:var(--text);" />
          </label>

          <label style="display:grid; gap:.35rem;">
            <span>Напомена</span>
            <textarea name="note" rows="3" style="padding:.65rem .75rem; border-radius:10px; border:1px solid var(--border); background: var(--bg); color:var(--text); resize:vertical;"></textarea>
          </label>
        </div>

        <div class="booking-actions" style="margin-top:1rem;">
          <button type="submit" class="booking-primary">Потврди резервацију</button>
          <button type="button" class="booking-secondary" id="booking-back-to-slots">Назад</button>
        </div>
      </form>
    </div>
  `;

  const form = document.getElementById('booking-form');
  if (form) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();

      const data = new FormData(form);
      const payload = {
        professorId: selectedProfessor.id,
        professorName: selectedProfessor.name,
        session,
        studentName: data.get('studentName'),
        studentGroup: data.get('studentGroup'),
        note: data.get('note')
      };

      console.log('Reservation payload:', payload);
      alert('Резервација је снимљена локално.');
    });
  }

  const backButton = document.getElementById('booking-back-to-slots');
  if (backButton) {
    backButton.addEventListener('click', () => {
      bookingBody.innerHTML = renderSlotButtons(selectedProfessor);

      const inlineClose = document.getElementById('booking-close-inline');
      if (inlineClose) {
        inlineClose.addEventListener('click', closeBookingPanel);
      }

      bookingBody.querySelectorAll('.booking-slot').forEach((button) => {
        button.addEventListener('click', () => {
          const index = Number(button.dataset.index);
          const selectedSession = selectedProfessor.sessions[index];
          if (selectedSession) {
            renderReservationForm(selectedSession);
          }
        });
      });
    });
  }
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
      const index = Number(button.dataset.index);
      const selectedSession = professor.sessions[index];

      if (selectedSession) {
        renderReservationForm(selectedSession);
      }
    });
  });

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
    const professorId = Number(event.detail);
    openBookingPanel(professorId);
  });

  closeBookingPanel();
}
