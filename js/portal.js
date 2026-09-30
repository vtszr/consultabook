// Портал за наставнике: приказ термина, блокирање датума, коментари

// ── LOGIN───────────────────────────────────────────────────────
function doLogin(){
  var email=document.getElementById('l-user').value.trim();
  var pass=document.getElementById('l-pass').value;
  var err=document.getElementById('login-err');
  err.classList.remove('on');
  pendingProfLogin=true;
  markSession();
  var pcb=document.getElementById('remember-prof'),keep=!!(pcb&&pcb.checked);
  try{localStorage.setItem('vtszr_remember_prof',keep?'1':'0');}catch(e){}
  setKeep(keep);
  var P=firebase.auth.Auth.Persistence;
  auth.setPersistence(keep?P.LOCAL:P.SESSION).then(function(){
    return auth.signInWithEmailAndPassword(email,pass);
  }).catch(function(e){
    var code=e&&e.code;
    pendingProfLogin=false;
    err.textContent=code==='auth/network-request-failed'?'Нема интернет везе.':
                    code==='auth/too-many-requests'?'Превише покушаја. Покушајте касније.':
                    'Погрешан мејл или лозинка.';
    err.classList.add('on');document.getElementById('l-pass').value='';
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
  renderBlockedList(p.id);
  document.getElementById('auth-btn').style.display='none'; // наставник се одјављује дугметом у порталу
  var btn=document.getElementById('block-btn');
  if(btn&&!btn._wired){
    btn._wired=true;
    fillTimeSelect('block-from','Од');fillTimeSelect('block-to','До');
    var bd=document.getElementById('block-date');
    bd.addEventListener('click',function(){try{bd.showPicker();}catch(e){}});
    btn.addEventListener('click',function(){
      var d=document.getElementById('block-date').value;
      var from=document.getElementById('block-from').value;
      var to=document.getElementById('block-to').value;
      if(!d){ showToast('err','Одабери датум',''); return; }
      if(!from!==!to){ showToast('err','Унеси оба времена','Попуни и „од“ и „до“, или оба остави празна за цео дан.'); return; }
      if(from&&from>=to){ showToast('err','Погрешно време','Време „до“ мора бити после времена „од“.'); return; }
      blockDate(loggedProf.id,d,from,to);
    });
  }
}
// Падајућа листа времена (24 сата, корак 30 мин)
function fillTimeSelect(id,placeholder){
  var s=document.getElementById(id),h='<option value="">'+placeholder+'</option>';
  for(var m=7*60;m<=21*60;m+=30)h+='<option value="'+pad(Math.floor(m/60))+':'+pad(m%60)+'">'+pad(Math.floor(m/60))+':'+pad(m%60)+'</option>';
  s.innerHTML=h;
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
// Брисање прошлих термина (и њихових резервација слота) за пријављеног наставника
function purgePast(){
  if(!loggedProf)return;
  var today=fmtK(new Date());
  var old=appts.filter(function(a){return a.pid===loggedProf.id&&a.date<today;});
  if(!old.length){showToast('err','Нема прошлих термина','');return;}
  if(!confirm('Трајно обрисати '+old.length+' прошлих термина?'))return;
  var upd={};
  old.forEach(function(a){
    upd[DB_REF+'/'+String(a.id)]=null;
    if(a.lock)upd['consultabook/slots/'+a.lock]=null;
  });
  db.ref().update(upd).then(function(){
    showToast('ok','Прошли термини обрисани','Обрисано: '+old.length);
  }).catch(function(e){showToast('err','Брисање није успело',e.code||'');});
}
function ptab(t,btn){
  ptab_=t;
  document.getElementById('purge-row').style.display=t==='proslo'?'':'none';
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
    var dstr=fmtDShort(d);
    var badge=today?'<span class="abg bg-t">Данас</span>':past?'<span class="abg bg-p">Прошло</span>':'<span class="abg bg-u">Предстојеће</span>';
    var expBadge=past?'<span class="exp-badge">истекло</span>':'';
    return '<div class="acard" style="'+(past?'opacity:.65;':'')+'">'
      +'<div class="at"><div class="tm">'+esc((a.label||a.time).split('–')[0].split('-')[0].trim())+'</div><div class="dt">'+dstr+'</div></div>'
      +'<div class="adv"></div>'
      +'<div class="ai"><div class="ai-n">'+esc(a.name)+' <span style="color:var(--text3);font-weight:400;font-size:.68rem;">'+esc(a.idx)+'</span>'+(a.email?' <span style="font-size:.65rem;color:var(--accent);">✉ '+esc(a.email)+'</span>':'')+'</div>'
      +'<div class="ai-t">'+esc(a.topic)+(a.year?' · '+esc(a.year):'')+expBadge+'</div></div>'
      +badge
      +'<button class="delbtn" data-aid="'+Number(a.id)+'">'
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
  addCommentBoxes();
}

// Напомена наставника уз сваки термин
function addCommentBoxes(){
  var L = document.getElementById('alist');
  if(!L) return;
  L.querySelectorAll('.acard').forEach(function(card, i){
    var aid = card.querySelector('.delbtn') ? parseInt(card.querySelector('.delbtn').dataset.aid) : null;
    if(!aid) return;
    var appt = appts.find(function(a){ return a.id === aid; });
    if(!appt) return;
    // Add comment div
    var existing = card.querySelector('.comment-area');
    if(existing) return;
    var commentDiv = document.createElement('div');
    commentDiv.style.cssText = 'width:100%;padding-top:.5rem;border-top:1px solid var(--border);margin-top:.5rem;';
    commentDiv.innerHTML =
      '<div class="appt-comment' + (appt.comment ? ' has' : '') + '" data-aid="' + aid + '" style="cursor:pointer;font-size:.72rem;">' +
        (appt.comment ? '💬 ' + esc(appt.comment) : '+ Додај коментар') +
      '</div>' +
      '<div class="comment-area" id="ca-' + aid + '">' +
        '<textarea class="comment-input" rows="2" placeholder="Напомена за студента...">' + esc(appt.comment || '') + '</textarea>' +
        '<button class="comment-save" data-aid="' + aid + '">Сачувај</button>' +
      '</div>';
    card.style.flexWrap = 'wrap';
    card.appendChild(commentDiv);
    // Toggle
    commentDiv.querySelector('.appt-comment').addEventListener('click', function(){
      var ca = document.getElementById('ca-' + aid);
      ca.classList.toggle('open');
    });
    // Save
    commentDiv.querySelector('.comment-save').addEventListener('click', function(){
      var txt = commentDiv.querySelector('.comment-input').value.trim();
      saveComment(aid, txt);
      var lbl = commentDiv.querySelector('.appt-comment');
      lbl.textContent = txt ? '💬 ' + txt : '+ Додај коментар';
      lbl.classList.toggle('has', !!txt);
      document.getElementById('ca-' + aid).classList.remove('open');
    });
  });
}

// ── CONFIRM MODAL ─────────────────────────────────────────────────────────────
function showConfirm(id, studentName, label){
  pendingDeleteId = id;
  document.getElementById('confirm-msg').innerHTML = 'Откажи термин за <strong>'+esc(studentName)+'</strong><br><span style="color:var(--accent);font-size:.8rem;">'+esc(label)+'</span>';
  document.getElementById('confirm-modal').classList.add('show');
}
function hideConfirm(){
  pendingDeleteId = null;
  document.getElementById('confirm-modal').classList.remove('show');
}

// ── БЛОКИРАНИ ДАТУМИ ──────────────────────────────────────────────────────────
// blockedDates се пуни из Firebase слушаоца (firebase.js)
// Запис: 'ГГГГ-ММ-ДД' (цео дан) или 'ГГГГ-ММ-ДД|ЧЧ:ММ-ЧЧ:ММ' (само део дана)
function blockDate(profId, date, from, to){
  var entry = from ? date + '|' + from + '-' + to : date;
  if(!blockedDates[profId]) blockedDates[profId] = [];
  if(blockedDates[profId].indexOf(entry) >= 0){ showToast('err','Већ блокирано',''); return; }
  blockedDates[profId].push(entry);
  db.ref(DB_BLOCKED + '/' + profId).set(blockedDates[profId]);
  renderBlockedList(profId);
  renderAppts(profId, ptab_);
  var n=appts.filter(function(a){
    return a.pid===profId&&a.date===date&&(!from||(a.time>=from&&a.time<to));
  }).length;
  showToast('ok', from?'Време блокирано':'Датум блокиран', n?('Већ заказано термина: '+n+'. Откажите их ручно.'):(from?from+' – '+to:date));
}

function unblockDate(profId, date){
  if(!blockedDates[profId]) return;
  blockedDates[profId] = blockedDates[profId].filter(function(d){ return d !== date; });
  db.ref(DB_BLOCKED + '/' + profId).set(blockedDates[profId].length ? blockedDates[profId] : null);
  renderBlockedList(profId);
  showToast('ok','Блокада уклоњена', date);
}

// цео дан блокиран
function isDateBlocked(profId, dateKey){
  return blockedDates[profId] && blockedDates[profId].indexOf(dateKey) >= 0;
}
// термин [start,end) се преклапа са блокираним временом тог дана
function isSlotBlocked(profId, dateKey, start, end){
  var list = blockedDates[profId] || [];
  return list.some(function(e){
    var p = e.split('|');
    if(p[0] !== dateKey || !p[1]) return false;
    var r = p[1].split('-');
    return start < r[1] && end > r[0];
  });
}

function renderBlockedList(profId){
  var L = document.getElementById('blocked-list');
  if(!L) return;
  var dates = blockedDates[profId] || [];
  if(!dates.length){ L.innerHTML = '<p style="font-size:.75rem;color:var(--text3);">Нема блокираних датума.</p>'; return; }
  dates.sort();
  L.innerHTML = dates.map(function(d){
    var parts = d.split('|');
    var dobj = new Date(parts[0] + 'T00:00:00');
    var dstr = fmtDShort(dobj,true);
    var when = parts[1] ? ' · ' + esc(parts[1].replace('-',' – ')) : ' · цео дан';
    return '<div class="blocked-item"><span><strong>' + dstr + '</strong>' + when + '</span><button class="unblock-btn" data-date="' + esc(d) + '">Уклони ✕</button></div>';
  }).join('');
  L.querySelectorAll('.unblock-btn').forEach(function(b){
    b.addEventListener('click', function(){ unblockDate(profId, b.dataset.date); });
  });
}

// ── КОМЕНТАРИ ─────────────────────────────────────────────────────────────────
function saveComment(apptId, text){
  var appt = appts.find(function(a){ return a.id === apptId; });
  if(!appt) return;
  appt.comment = text;
  db.ref(DB_REF + '/' + String(apptId) + '/comment').set(text);
  showToast('ok', 'Коментар сачуван', '');
}
