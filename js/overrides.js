// Проширења која допуњују раније функције (учитава се последњи)

// ── PATCH showPortal ───────────────────────────────────────────────────────────
var _origShowPortal = showPortal;
showPortal = function(){
  _origShowPortal();
  var p = loggedProf;
  if(!p) return;
  // Load blocked dates
  loadBlocked(p.id, function(){
    renderBlockedList(p.id);
  });
  // Wire block button
  var btn = document.getElementById('block-btn');
  if(btn && !btn._wired){
    btn._wired = true;
    btn.addEventListener('click', function(){
      var d = document.getElementById('block-date').value;
      if(!d){ showToast('err','Одабери датум',''); return; }
      blockDate(loggedProf.id, d);
    });
  }
};

// ── PATCH renderAppts — додај коментар ────────────────────────────────────────
var _origRenderAppts = renderAppts;
renderAppts = function(id, f){
  _origRenderAppts(id, f);
  // Add comment sections to each appt card
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
        (appt.comment ? '💬 ' + appt.comment : '+ Додај коментар') +
      '</div>' +
      '<div class="comment-area" id="ca-' + aid + '">' +
        '<textarea class="comment-input" rows="2" placeholder="Напомена за студента...">' + (appt.comment || '') + '</textarea>' +
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
};

// ── PATCH getSlots — блокирај датуме ─────────────────────────────────────────
var _origGetSlots = getSlots;
getSlots = function(date){
  var slots = _origGetSlots(date);
  if(!sp) return slots;
  var m = date.getMonth();
  if(m===6||m===7||isHoliday(date)){
    return slots.map(function(s){ return Object.assign({}, s, {booked:true}); });
  }
  var key = fmtK(date);
  if(isDateBlocked(sp.id, key)){
    return slots.map(function(s){ return Object.assign({}, s, {booked:true}); });
  }
  return slots;
};

var _origHasAvail = hasAvail;
hasAvail = function(date){
  if(!sp) return _origHasAvail(date);
  var m = date.getMonth();
  if(m===6||m===7) return false; // јул и август затворени
  if(isHoliday(date)) return false; // државни празник
  var key = fmtK(date);
  if(isDateBlocked(sp.id, key)) return false;
  return _origHasAvail(date);
};
