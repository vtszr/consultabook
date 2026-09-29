// Портал за наставнике: приказ термина, блокирање датума, коментари

// ── LOGIN───────────────────────────────────────────────────────
function doLogin(){
  var email=document.getElementById('l-user').value.trim();
  var pass=document.getElementById('l-pass').value;
  var err=document.getElementById('login-err');
  err.classList.remove('on');
  pendingProfLogin=true;
  auth.signInWithEmailAndPassword(email,pass).catch(function(){
    pendingProfLogin=false;err.classList.add('on');document.getElementById('l-pass').value='';
  });
}
function doLogout(){
  auth.signOut();ptab_='sve';
  document.getElementById('l-user').value='';document.getElementById('l-pass').value='';
}
function showPortal(){
  document.getElementById('p-login').style.display='none';
  document.getElementById('p-portal').style.display='block';
  var p=loggedProf;
  var av=document.getElementById('portal-av');av.textContent=ini(p.name);av.style.background=p.bg;
  document.getElementById('portal-name').textContent=p.name;
  var shortSubj = p.subject==='—' ? '' : p.subject.split(' · ')[0];
  document.getElementById('portal-subj').textContent = shortSubj + (shortSubj ? ' · ' : '') + p.office;
  renderStats(p.id);renderAppts(p.id,ptab_);
}
function renderStats(id){
  var all=appts.filter(function(a){return a.pid===id;}),
      tod=all.filter(function(a){return isT(new Date(a.date+'T00:00:00'));}),
      upc=all.filter(function(a){var d=new Date(a.date+'T00:00:00');return !isP(d)&&!isT(d);}),
      pas=all.filter(function(a){var d=new Date(a.date+'T00:00:00');return isP(d)&&!isT(d);});
  document.getElementById('srow').innerHTML=
    '<div class="sc"><div class="sc-l">Укупно</div><div class="sc-v">'+all.length+'</div></div>'+
    '<div class="sc"><div class="sc-l">Данас</div><div class="sc-v">'+tod.length+'</div></div>'+
    '<div class="sc"><div class="sc-l">Предстојеће</div><div class="sc-v">'+upc.length+'</div></div>'+
    '<div class="sc"><div class="sc-l">Прошли</div><div class="sc-v">'+pas.length+'</div></div>';
}
function ptab(t,btn){
  ptab_=t;
  document.querySelectorAll('.tpill').forEach(function(b){b.classList.remove('on');});
  btn.classList.add('on');
  if(loggedProf)renderAppts(loggedProf.id,ptab_);
}

// ── RENDER APPOINTMENTS ───────────────────────────────────────────────────────
function renderAppts(id,f){
  var L=document.getElementById('alist');
  var all=appts.filter(function(a){return a.pid===id;});
  if(f==='danas')all=all.filter(function(a){return isT(new Date(a.date+'T00:00:00'));});
  else if(f==='predst')all=all.filter(function(a){var d=new Date(a.date+'T00:00:00');return !isP(d)&&!isT(d);});
  else if(f==='proslo')all=all.filter(function(a){var d=new Date(a.date+'T00:00:00');return isP(d)&&!isT(d);});
  all.sort(function(a,b){return (a.date+a.time).localeCompare(b.date+b.time);});
  if(!all.length){
    L.innerHTML='<div class="est" style="padding:1.5rem;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="34" height="34" style="margin:0 auto .5rem;opacity:.2;display:block;"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><p>Нема заказаних термина.</p></div>';
    return;
  }
  L.innerHTML=all.map(function(a){
    var d=new Date(a.date+'T00:00:00'),today=isT(d),past=isP(d)&&!today;
    var dstr=d.toLocaleDateString('sr-Latn-RS',{weekday:'short',day:'numeric',month:'short'});
    var badge=today?'<span class="abg bg-t">Данас</span>':past?'<span class="abg bg-p">Прошло</span>':'<span class="abg bg-u">Предстојеће</span>';
    var expBadge=past?'<span class="exp-badge">истекло</span>':'';
    return '<div class="acard" style="'+(past?'opacity:.65;':'')+'">'
      +'<div class="at"><div class="tm">'+a.label.split('–')[0].split('-')[0].trim()+'</div><div class="dt">'+dstr+'</div></div>'
      +'<div class="adv"></div>'
      +'<div class="ai"><div class="ai-n">'+a.name+' <span style="color:var(--text3);font-weight:400;font-size:.68rem;">'+a.idx+'</span>'+(a.email?' <span style="font-size:.65rem;color:var(--accent);">✉ '+a.email+'</span>':'')+'</div>'
      +'<div class="ai-t">'+a.topic+(a.year?' · '+a.year:'')+expBadge+'</div></div>'
      +badge
      +'<button class="delbtn" data-aid="'+a.id+'">'
      +'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6M9 6V4h6v2"/></svg>'
      +'</button></div>';
  }).join('');
  // Wire delbtn with confirm
  L.querySelectorAll('.delbtn').forEach(function(b){
    b.addEventListener('click',function(){
      var aid = parseInt(b.dataset.aid);
      var a = appts.find(function(x){ return x.id === aid; });
      if(a) showConfirm(aid, a.name, a.label);
    });
  });
}

// ── CONFIRM MODAL ─────────────────────────────────────────────────────────────
function showConfirm(id, studentName, label){
  pendingDeleteId = id;
  document.getElementById('confirm-msg').innerHTML = 'Откажи термин за <strong>'+studentName+'</strong><br><span style="color:var(--accent);font-size:.8rem;">'+label+'</span>';
  document.getElementById('confirm-modal').classList.add('show');
}
function hideConfirm(){
  pendingDeleteId = null;
  document.getElementById('confirm-modal').classList.remove('show');
}

// ── БЛОКИРАНИ ДАТУМИ ──────────────────────────────────────────────────────────
var blockedDates = {}; // { profId: ['2025-06-04', ...] }
var DB_BLOCKED = 'consultabook/blocked';

function loadBlocked(profId, cb){
  db.ref(DB_BLOCKED + '/' + profId).once('value', function(snap){
    blockedDates[profId] = snap.val() ? Object.values(snap.val()) : [];
    if(cb) cb();
  });
}

function blockDate(profId, date){
  if(!blockedDates[profId]) blockedDates[profId] = [];
  if(blockedDates[profId].indexOf(date) >= 0){ showToast('err','Датум већ блокиран',''); return; }
  blockedDates[profId].push(date);
  db.ref(DB_BLOCKED + '/' + profId).set(blockedDates[profId]);
  renderBlockedList(profId);
  renderAppts(profId, ptab_);
  showToast('ok','Датум блокиран', date);
}

function unblockDate(profId, date){
  if(!blockedDates[profId]) return;
  blockedDates[profId] = blockedDates[profId].filter(function(d){ return d !== date; });
  db.ref(DB_BLOCKED + '/' + profId).set(blockedDates[profId].length ? blockedDates[profId] : null);
  renderBlockedList(profId);
  showToast('ok','Блокада уклоњена', date);
}

function isDateBlocked(profId, dateKey){
  return blockedDates[profId] && blockedDates[profId].indexOf(dateKey) >= 0;
}

function renderBlockedList(profId){
  var L = document.getElementById('blocked-list');
  if(!L) return;
  var dates = blockedDates[profId] || [];
  if(!dates.length){ L.innerHTML = '<p style="font-size:.75rem;color:var(--text3);">Нема блокираних датума.</p>'; return; }
  dates.sort();
  L.innerHTML = dates.map(function(d){
    var dobj = new Date(d + 'T00:00:00');
    var dstr = dobj.toLocaleDateString('sr-Latn-RS',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
    return '<div class="blocked-item"><span><strong>' + dstr + '</strong></span><button class="unblock-btn" data-date="' + d + '">Уклони ✕</button></div>';
  }).join('');
  L.querySelectorAll('.unblock-btn').forEach(function(b){
    b.addEventListener('click', function(){ unblockDate(profId, b.dataset.date); });
  });
}

// ── КОМЕНТАРИ ─────────────────────────────────────────────────────────────────
function saveComment(apptId, text){
  var appt = appts.find(function(a){ return a.id === apptId; });
  if(!appt) return;
  text = esc(text);
  appt.comment = text;
  db.ref('consultabook/appointments/' + String(apptId) + '/comment').set(text);
  showToast('ok', 'Коментар сачуван', '');
}
