export const professors = [
  {
    id: 1,
    name: 'Борјановић др Ирис',
    subject: 'Физика · Електрична мерења физичких величина',
    bg: '#20d9a0',
    sessions: [
      { day: 1, start: '09:00', end: '10:30' },
      { day: 3, start: '09:00', end: '10:30' },
      { day: 5, start: '09:00', end: '10:30' }
    ]
  },
  {
    id: 2,
    name: 'Милановић Јелена',
    subject: 'Математика · Анализа · Линеарна алгебра',
    bg: '#60a5fa',
    sessions: [
      { day: 2, start: '11:00', end: '12:30' },
      { day: 4, start: '11:00', end: '12:30' }
    ]
  },
  {
    id: 3,
    name: 'Петровић Владимир',
    subject: 'Програмирање · Web разработка · Базе података',
    bg: '#f59e0b',
    sessions: [
      { day: 1, start: '12:00', end: '13:30' },
      { day: 4, start: '12:00', end: '13:30' }
    ]
  },
  {
    id: 4,
    name: 'Ђукић Драгана',
    subject: 'Електротехника · Сигнали и системе',
    bg: '#a78bfa',
    sessions: [
      { day: 1, start: '15:00', end: '16:30' },
      { day: 3, start: '15:00', end: '16:30' }
    ]
  },
  {
    id: 5,
    name: 'Станковић Александар',
    subject: 'Машинско инжењерство · Технологија материјала',
    bg: '#fb7185',
    sessions: [
      { day: 2, start: '08:30', end: '10:00' },
      { day: 5, start: '08:30', end: '10:00' }
    ]
  },
  {
    id: 6,
    name: 'Тодоровић Марија',
    subject: 'Хемија · Аналитичка хемија',
    bg: '#34d399',
    sessions: [
      { day: 3, start: '10:30', end: '12:00' },
      { day: 4, start: '10:30', end: '12:00' }
    ]
  }
];

export const dayNames = ['','Понедељак','Уторак','Среда','Четвртак','Петак'];

export function initialsFromName(name) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] || '')
    .join('')
    .toUpperCase();
}
