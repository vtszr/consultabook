import { professors, dayNames, initialsFromName } from './professors.js';

function buildProfessorCards(list) {
  const grid = document.getElementById('pgrid');
  const count = document.getElementById('pcount');

  if (!grid || !count) {
    return;
  }

  if (!list.length) {
    grid.innerHTML = '<p style="color:var(--text3); font-size:.85rem;">Нема пронађених наставника.</p>';
    count.textContent = 'Нема резултата';
    return;
  }

  const cards = list.map((professor) => {
    const displaySubject = professor.subject.split(' · ')[0];
    const dayChips = professor.sessions
      .slice(0, 3)
      .map((session) => `<span class="day-chip has">${dayNames[session.day].substring(0, 3)}</span>`)
      .join('');

    return `
      <article class="pcard" data-id="${professor.id}" tabindex="0" style="cursor:pointer;">
        <div class="pav" style="background:${professor.bg};">${initialsFromName(professor.name)}</div>
        <div class="pname">${professor.name}</div>
        <div class="psubj">${displaySubject}</div>
        <div class="psched-mini">${dayChips}</div>
      </article>
    `;
  }).join('');

  grid.innerHTML = cards;
  count.textContent = `Приказано ${list.length} од ${professors.length} наставника`;

  grid.querySelectorAll('.pcard').forEach((card) => {
    const professorId = Number(card.dataset.id);

    const openProfessor = () => {
  window.dispatchEvent(new CustomEvent('consultabook:open-professor', {
    detail: professorId
  }));
};

    card.addEventListener('click', openProfessor);
    card.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openProfessor();
      }
    });
  });
}

function updateProfessorList() {
  const searchInput = document.getElementById('sq');

  if (!searchInput) {
    return;
  }

  const query = searchInput.value.trim().toLowerCase();
  const filtered = professors.filter((professor) => {
    const haystack = `${professor.name} ${professor.subject}`.toLowerCase();
    return haystack.includes(query);
  });

  buildProfessorCards(filtered);
}

function setupProfessorList() {
  const searchInput = document.getElementById('sq');
  if (!searchInput) {
    return;
  }

  searchInput.addEventListener('input', updateProfessorList);
  updateProfessorList();
}

export { setupProfessorList, updateProfessorList };
