// Студентски део: термини, погледи, календар, резервација, моје резервације

function genSlots(s,e){
  var r=[],h=parseInt(s),m=parseInt(s.split(':')[1]),eh=parseInt(e),em=parseInt(e.split(':')[1]),eT=eh*60+em;
  while(h*60+m<eT){
    var s0=pad(h)+':'+pad(m),nh=h,nm=m+30;
    if(nm>=60){nh++;nm-=60;}
    var nT=nh*60+nm,s1=nT>=eT?e:pad(nh)+':'+pad(nm);
    r.push({time:s0,label:s0+' – '+s1});
    if(nT>=eT)break; h=nh; m=nm;
  }
  return r;
}
function getSlots(date){
  if(!sp)return[];
  var dow=date.getDay(),key=fmtK(date);
  var sess=sp.sessions.filter(function(s){return s.day===dow;});
  if(!sess.length)return[];
  var bk=Object.keys(takenSlots).filter(function(k){return k.indexOf(sp.id+'_'+key+'_')===0;}).map(function(k){var t=k.split('_')[2];return t.substr(0,2)+':'+t.substr(2);});
  var all=[];
  sess.forEach(function(s){all=all.concat(genSlots(s.start,s.end));});
  var m=date.getMonth();
  var closed=(m===6||m===7||isHoliday(date)||isDateBlocked(sp.id,key)); // распуст, празник, блокиран датум
  var now=new Date();
  return all.map(function(s){
    var isPastSlot=false;
    if(isT(date)){
      // Блокирај прошле термине данас
      var parts=s.time.split(':');
      var slotTime=new Date();
      slotTime.setHours(parseInt(parts[0]),parseInt(parts[1]),0,0);
      isPastSlot=slotTime<=now;
    }
    return {time:s.time,label:s.label,booked:closed||bk.indexOf(s.time)>=0||isPastSlot};
  });
}
function hasAvail(date){ return getSlots(date).some(function(s){return !s.booked;}); }
function isProfDay(date){ return sp&&sp.sessions.some(function(s){return s.day===date.getDay();}); }

function weekOcc(prof){
  var today=new Date(),mon=new Date(today);
  mon.setDate(today.getDate()-((today.getDay()+6)%7));mon.setHours(0,0,0,0);
  return prof.sessions.map(function(sess){
    var all=genSlots(sess.start,sess.end),d=new Date(mon);
    d.setDate(mon.getDate()+(sess.day-1+7)%7);
    var bk=appts.filter(function(a){return a.pid===prof.id&&a.date===fmtK(d);}).length;
    return {day:sess.day,booked:bk,total:all.length,start:sess.start,end:sess.end};
  });
}

// ── VIEW TOGGLE ───────────────────────────────────────────────────────────────
function setView(v){
  currentView=v;
  ['card','week','dept'].forEach(function(id){var b=document.getElementById('view-'+id);if(b)b.classList.toggle('on',id===v);});
  document.getElementById('pgrid').style.display=v==='card'?'':'none';
  document.getElementById('week-view').style.display=v==='week'?'':'none';
  document.getElementById('dept-view').style.display=v==='dept'?'':'none';
  if(v==='week')renderWeek();
  if(v==='dept'){
    var q=document.getElementById('sq').value.toLowerCase().trim();
    renderDept(professors.filter(function(p){
      return(fday===''||p.sessions.some(function(s){return DSR[s.day]===fday;}))&&
             (q===''||p.name.toLowerCase().indexOf(q)>=0||p.subject.toLowerCase().indexOf(q)>=0);
    }));
  }
}

// ── FILTERS ───────────────────────────────────────────────────────────────────
function sf(day,btn){
  fday=day;
  document.querySelectorAll('.fbtn').forEach(function(b){b.classList.remove('on');});
  btn.classList.add('on');
  filt();
}
function filt(){
  var raw=document.getElementById('sq').value.toLowerCase().trim();
  document.getElementById('clr-btn').classList.toggle('show',raw.length>0);
  var q=raw;
  var qcyr=toCyr(raw); // конвертуј латиницу у ћирилицу
  var list=professors.filter(function(p){
    var matchDay=fday===''||p.sessions.some(function(s){return DSR[s.day]===fday;});
    var pname=p.name.toLowerCase(), psubj=p.subject.toLowerCase();
    var matchQ=q===''||
               pname.indexOf(q)>=0||psubj.indexOf(q)>=0||
               pname.indexOf(qcyr)>=0||psubj.indexOf(qcyr)>=0;
    return matchDay && matchQ;
  });
  renderG(list);
  if(currentView==='week')renderWeek();
  if(currentView==='dept')renderDept(list);
}
function clearSearch(){document.getElementById('sq').value='';filt();}

// ── PROF GRID ─────────────────────────────────────────────────────────────────
function renderG(list){
  var g=document.getElementById('pgrid');
  document.getElementById('pcount').textContent='Приказано '+list.length+' од '+professors.length+' наставника';
  if(!list.length){g.innerHTML='<p style="color:var(--text3);font-size:.85rem;">Нема пронађених наставника.</p>';return;}
  var q=document.getElementById('sq').value.toLowerCase().trim();
  var qcyr=toCyr(q);
  g.innerHTML=list.map(function(p){
    // Show matched subject if searching, otherwise show first
    var subj='Наставник ВТШ';
    if(p.subject!=='—'){
      var parts=p.subject.split(' · ');
      if(q){
        var matched=parts.find(function(s){var sl=s.toLowerCase();return sl.indexOf(q)>=0||sl.indexOf(qcyr)>=0;});
        subj=matched||parts[0];
      } else {
        subj=parts[0];
      }
    }
    if(subj.length>32)subj=subj.substring(0,30)+'…';
    var chips=p.sessions.map(function(s){return '<span class="day-chip has">'+DSR[s.day].substring(0,3)+'</span>';}).join('');
    return '<div class="pcard" data-pid="'+p.id+'"><div class="pav" style="background:'+p.bg+';">'+ini(p.name)+'</div><div class="pname">'+p.name+'</div><div class="psubj">'+subj+'</div><div class="psched-mini">'+chips+'</div></div>';
  }).join('');
  g.querySelectorAll('.pcard').forEach(function(c){c.addEventListener('click',function(){openB(parseInt(c.dataset.pid));});});
}

// ── DEPT VIEW ─────────────────────────────────────────────────────────────────
function renderDept(list){
  var wrap=document.getElementById('dept-view');if(!wrap)return;
  var q=document.getElementById('sq').value.toLowerCase().trim();
  var qcyr=toCyr(q);
  var html='';
  DEPTS.forEach(function(dept){
    var profs=list.filter(function(p){return PROF_DEPT[p.id]===dept.key;});
    if(!profs.length)return;
    html+='<div class="dept-section"><div class="dept-header"><div class="dept-dot" style="background:'+dept.color+'"></div><div class="dept-title">'+dept.label+'</div><div class="dept-count">'+profs.length+' наставника</div></div><div class="dept-grid">';
    profs.forEach(function(p){
      var parts2=p.subject==='—'?['ВТШ']:p.subject.split(' · ');
      var matched2=q?parts2.find(function(s){var sl=s.toLowerCase();return sl.indexOf(q)>=0||sl.indexOf(qcyr)>=0;}):null;
      var subj=matched2||parts2[0];
      if(subj.length>32)subj=subj.substring(0,30)+'…';
      var chips=p.sessions.map(function(s){return '<span class="day-chip has" style="border-color:'+dept.color+'44;color:'+dept.color+';">'+DSR[s.day].substring(0,3)+'</span>';}).join('');
      html+='<div class="pcard" data-pid="'+p.id+'" style="border-top:2px solid '+dept.color+'44;"><div class="pav" style="background:'+p.bg+';">'+ini(p.name)+'</div><div class="pname">'+p.name+'</div><div class="psubj" style="color:'+dept.color+';">'+subj+'</div><div class="psched-mini">'+chips+'</div></div>';
    });
    html+='</div></div>';
  });
  wrap.innerHTML=html;
  wrap.querySelectorAll('.pcard').forEach(function(c){c.addEventListener('click',function(){openB(parseInt(c.dataset.pid));});});
}

// ── WEEKLY VIEW ───────────────────────────────────────────────────────────────
function renderWeek(){
  var wrap=document.getElementById('week-view');
  var times={};
  professors.forEach(function(p){p.sessions.forEach(function(s){genSlots(s.start,s.end).forEach(function(sl){times[sl.time]=true;});});});
  var timeKeys=Object.keys(times).sort();
  var today=new Date();today.setHours(0,0,0,0);
  var mon=new Date(today);mon.setDate(today.getDate()-((today.getDay()+6)%7));
  var weekDates={};
  [1,2,3,4,5].forEach(function(d){var date=new Date(mon);date.setDate(mon.getDate()+(d-1));weekDates[d]=date;});
  var html='<div class="week-wrap"><table class="week-table"><thead><tr><th>Време</th>';
  [1,2,3,4,5].forEach(function(d){html+='<th>'+DSR[d]+'</th>';});
  html+='</tr></thead><tbody>';
  timeKeys.forEach(function(time){
    html+='<tr><td>'+time+'</td>';
    [1,2,3,4,5].forEach(function(day){
      html+='<td>';
      professors.forEach(function(p){
        var hasSess=p.sessions.some(function(s){if(s.day!==day)return false;return genSlots(s.start,s.end).some(function(sl){return sl.time===time;});});
        if(!hasSess)return;
        var date=weekDates[day],key=fmtK(date);
        var isBooked=!!takenSlots[p.id+'_'+key+'_'+time.replace(':','')];
        var isPast=isP(date)&&!isT(date);
        if(isBooked||isPast){
          html+='<div class="week-slot taken"><span class="ws-name">'+ini(p.name)+'</span></div>';
        } else {
          html+='<div class="week-slot free" data-pid="'+p.id+'" data-day="'+day+'" data-time="'+time+'" data-date="'+key+'"><span class="ws-name">'+ini(p.name)+'</span><div style="font-size:.6rem;color:var(--text2);margin-top:1px;">'+p.name.split(' ').slice(-1)[0]+'</div></div>';
        }
      });
      html+='</td>';
    });
    html+='</tr>';
  });
  html+='</tbody></table><div class="week-legend"><span><div class="wl-dot" style="background:rgba(32,217,160,0.3);border:1px solid rgba(32,217,160,0.4);"></div>Слободан</span><span><div class="wl-dot" style="background:rgba(244,63,94,0.15);border:1px solid rgba(244,63,94,0.2);"></div>Заузет</span></div></div>';
  wrap.innerHTML=html;
  wrap.querySelectorAll('.week-slot.free').forEach(function(el){
    el.addEventListener('click',function(){openBWeek(parseInt(el.dataset.pid),new Date(el.dataset.date+'T00:00:00'),el.dataset.time);});
  });
}

// ── BOOKING ───────────────────────────────────────────────────────────────────
function openB(id){
  sp=professors.find(function(p){return p.id===id;});sd=null;st=null;
  document.getElementById('vlist').style.display='none';
  document.getElementById('vbook').classList.add('on');
  document.getElementById('gcalw').style.display='none';
  document.getElementById('ccard').classList.remove('on');
  document.getElementById('dup-warn').classList.remove('on');
  var subj=sp.subject==='—'?'Наставник ВТШ Зрењанин':sp.subject;
  document.getElementById('bph').innerHTML='<div class="bph"><div class="bph-av" style="background:'+sp.bg+';">'+ini(sp.name)+'</div><div><div class="bph-name">'+sp.name+'</div><div class="bph-sub">'+subj+'</div><div class="bph-off">ВТШСС · '+sp.office+'</div></div></div>';
  var n=new Date();cy=n.getFullYear();cm_=n.getMonth();
  updSum();chk();
  setTimeout(function(){renderCal();},10);
  document.getElementById('scont').innerHTML='<p class="no-slot">Прво изаберите датум.</p>';
  ['fn','fi','fe','ft'].forEach(function(i){var el=document.getElementById(i);if(el)el.value='';});
  prefillFromAccount(); 
  ['fd','fy'].forEach(function(i){document.getElementById(i).value='';});
}

function openBWeek(pid,date,time){
  openB(pid);
  sd=date;st=time;
  setTimeout(function(){renderCal();renderSlots();updSum();chk();},20);
}

function backList(){
  sp=null;sd=null;st=null;
  document.getElementById('vbook').classList.remove('on');
  document.getElementById('vlist').style.display='';
  renderG(professors);
  if(currentView==='week')renderWeek();
}

// ── CALENDAR ─────────────────────────────────────────────────────────────────
function renderCal(){
  var cmlEl=document.getElementById('cml'),g=document.getElementById('cgrid');
  if(!cmlEl||!g){setTimeout(renderCal,50);return;}
  cmlEl.textContent=MONTHS[cm_]+' '+cy;
  var h=DOWS.map(function(d){return '<div class="cdow">'+d+'</div>';}).join('');
  var first=new Date(cy,cm_,1),off=first.getDay()-1;if(off<0)off=6;
  h+=Array(off).fill('<div class="cday"></div>').join('');
  var days=new Date(cy,cm_+1,0).getDate();
  for(var d=1;d<=days;d++){
    var date=new Date(cy,cm_,d),past=isP(date),pd=isProfDay(date),sel=sameD(date,sd),tod=isT(date);
    var month=date.getMonth();
    var isSummer = month===6||month===7;
    var isHol = isHoliday(date);
    var avail=!past&&pd&&!isSummer&&!isHol&&hasAvail(date);
    var cls='cday';if(sel)cls+=' sel';else if(avail)cls+=' av has';else cls+=' dis';
    if(isHol&&!sel)cls+=' dis';
    if(tod&&!sel)cls+=' tod';
    h+='<div class="'+cls+'"'+(avail?' data-ts="'+date.getTime()+'"':'')+'>'+d+'</div>';
  }
  g.innerHTML=h;
  g.querySelectorAll('.cday.av').forEach(function(el){el.addEventListener('click',function(){pickD(new Date(parseInt(el.dataset.ts)));});});
}
function pickD(date){sd=date;st=null;renderCal();renderSlots();updSum();chk();}
function cm(dir){cm_+=dir;if(cm_<0){cm_=11;cy--;}if(cm_>11){cm_=0;cy++;}renderCal();}

// ── SLOTS ─────────────────────────────────────────────────────────────────────
function renderSlots(){
  var c=document.getElementById('scont');
  if(!sd){c.innerHTML='<p class="no-slot">Прво изаберите датум.</p>';return;}
  var slots=getSlots(sd);
  if(!slots.length){c.innerHTML='<p class="no-slot">Нема термина за овај дан.</p>';return;}
  var free=slots.filter(function(s){return !s.booked;}).length;
  var h='<div class="slots-wrap"><div class="slots-hdr"><span>Термини — '+DSR[sd.getDay()]+'</span><strong>'+free+'/'+slots.length+' слободно</strong></div><div class="sgrid">';
  slots.forEach(function(s){
    var cls='sbtn'+(s.booked?' bkd':'')+(st===s.time&&!s.booked?' sel':'');
    var attrs=s.booked?' disabled':' data-time="'+s.time+'"';
    h+='<button class="'+cls+'"'+attrs+'>'+s.label+'</button>';
  });
  h+='</div></div>';c.innerHTML=h;
  c.querySelectorAll('.sbtn:not(.bkd)').forEach(function(b){b.addEventListener('click',function(){st=b.dataset.time;renderSlots();updSum();chk();});});
}

function updSum(){
  var el=document.getElementById('ssum');
  if(!sd&&!st){el.innerHTML='<span class="sem">Изаберите датум и термин испод.</span>';return;}
  var h='';
  if(sd)h+='<div class="ssi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="12" height="12"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg><strong>'+DSR[sd.getDay()]+', '+fmtD(sd)+'</strong></div>';
  if(st){var sl=getSlots(sd).find(function(s){return s.time===st;});h+='<div class="ssi"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="12" height="12"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><strong>'+(sl?sl.label:st)+'</strong></div>';}
  el.innerHTML=h||'<span class="sem">Изаберите датум и термин испод.</span>';
}

function chk(){
  var n=document.getElementById('fn').value.trim(),i=document.getElementById('fi').value.trim();
  document.getElementById('cbtn').disabled=!(sd&&st&&n&&i);
}

function apptStart(a){ return new Date(a.date+'T'+a.time+':00'); }
function hasDuplicate(name,idx,profId){
  return appts.some(function(a){return a.pid===profId&&a.date>=fmtK(new Date())&&(a.idx===idx||a.name.toLowerCase()===name.toLowerCase());});
}

// ── CONFIRM BOOKING ───────────────────────────────────────────────────────────
function confirmBook(){
  if(!auth||!auth.currentUser){showToast('err','Потребна пријава','Пријавите се Google налогом (горе десно).');return;}
  var _act=appts.filter(function(a){return a.uid===auth.currentUser.uid&&apptStart(a)>new Date();}).length;
  if(_act>=MAX_ACTIVE){showToast('err','Достигнут лимит','Можете имати највише '+MAX_ACTIVE+' активна термина. Откажите неки да бисте резервисали нови.');return;}
  var name=document.getElementById('fn').value.trim();
  var idx=document.getElementById('fi').value.trim();
  var dept=document.getElementById('fd').value;
  var year=document.getElementById('fy').value;
  var topic=document.getElementById('ft').value.trim();
  name=esc(name);idx=esc(idx);topic=esc(topic);
  var dupWarn=document.getElementById('dup-warn');
  if(!name||!idx||!sd||!st){showToast('err','Недостају подаци','Попуните обавезна поља.');return;}
  if(hasDuplicate(name,idx,sp.id)){dupWarn.textContent='Студент '+name+' ('+idx+') већ има резервисан термин код овог наставника!';dupWarn.classList.add('on');return;}
  dupWarn.classList.remove('on');
  var slots=getSlots(sd),sl=slots.find(function(s){return s.time===st;});
  if(!sl||sl.booked){showToast('err','Термин заузет','Изаберите другачији термин.');renderSlots();return;}
  var email=document.getElementById('fe')?document.getElementById('fe').value.trim():'';email=esc(email);
  var appt={id:Date.now(),pid:sp.id,name:name,idx:idx,email:email,dept:dept,year:year,topic:topic||'Општа консултација',date:fmtK(sd),time:st,label:sl.label};
  var lockKey=sp.id+'_'+fmtK(sd)+'_'+st.replace(':','');
  appt.lock=lockKey;
  appt.uid=auth.currentUser.uid;
  var finish=function(){
  appts.push(appt);
  saveApptToFirebase(appt);
  var start=new Date(appt.date+'T'+sl.time+':00');
  var es=sl.label.split('–')[1].trim().split(':').map(Number);
  var end=new Date(appt.date+'T'+pad(es[0])+':'+pad(es[1]||0)+':00');
  var fmt=function(d){return d.toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';};
  document.getElementById('gcal').href='https://www.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent('Консултације — '+sp.name)+'&dates='+fmt(start)+'/'+fmt(end)+'&details='+encodeURIComponent('Студент: '+name+'\nИндекс: '+idx+'\nТема: '+(topic||'Општа консултација'))+'&location='+encodeURIComponent('ВТШСС у Зрењанину, '+sp.office);
  document.getElementById('gcalw').style.display='block';

  document.getElementById('ccard-body').innerHTML=
    '<div class="conf-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="11" height="11"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg><span><strong>'+name+'</strong> ('+idx+')</span></div>'+
    '<div class="conf-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="11" height="11"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg><span>Наставник: <strong>'+sp.name+'</strong></span></div>'+
    '<div class="conf-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="11" height="11"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span>Термин: <strong>'+sl.label+'</strong></span></div>'+
    '<div class="conf-row"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" width="11" height="11"><rect x="3" y="4" width="18" height="18" rx="2"/></svg><span><strong>'+DSR[sd.getDay()]+', '+fmtD(sd)+'</strong></span></div>';
  document.getElementById('ccard').classList.add('on');
  launchConfetti();
  showToast('ok','Термин је резервисан!',sl.label+' — '+DSR[sd.getDay()]+', '+sd.getDate()+'. '+MONTHS[sd.getMonth()]);
  sd=null;st=null;renderCal();
  document.getElementById('scont').innerHTML='<p class="no-slot">Изаберите нови датум.</p>';
  updSum();document.getElementById('cbtn').disabled=true;
  ['fn','fi','ft'].forEach(function(i){document.getElementById(i).value='';});
  prefillFromAccount();
  ['fd','fy'].forEach(function(i){document.getElementById(i).value='';});
  if(loggedProf&&loggedProf.id===sp.id){renderStats(loggedProf.id);renderAppts(loggedProf.id,ptab_);}
  };
  document.getElementById('cbtn').disabled=true;
  db.ref('consultabook/slots/'+lockKey).transaction(function(cur){return cur===null?auth.currentUser.uid:undefined;},function(err,ok){
    if(err||!ok){showToast('err','Термин заузет','Неко је управо резервисао овај термин.');renderSlots();chk();return;}
    finish();
  });
}


// ── МОЈЕ РЕЗЕРВАЦИЈЕ ──────────────────────────────────────────────────────────
function searchMyAppts(){
  if(!auth||!auth.currentUser){document.getElementById('myr-results').innerHTML='<div class="myr-empty">Пријавите се (дугме горе десно) да видите своје резервације.</div>';return;}
  var res = document.getElementById('myr-results');
  

  var mine = appts.filter(function(a){ return a.uid===auth.currentUser.uid; });
  mine.sort(function(a,b){ return (a.date+a.time).localeCompare(b.date+b.time); });

  if(!mine.length){
    res.innerHTML='<div class="myr-empty">Немате заказаних термина.</div>';
    return;
  }

  var upcoming = mine.filter(function(a){ var d=new Date(a.date+'T00:00:00'); return !isP(d)||isT(d); });
  var past = mine.filter(function(a){ var d=new Date(a.date+'T00:00:00'); return isP(d)&&!isT(d); });

  res.innerHTML = '<div class="myr-count">Пронађено: <strong>'+mine.length+'</strong> резервација ('+upcoming.length+' предстојећих, '+past.length+' прошлих)</div>' +
    mine.map(function(a){
      var d = new Date(a.date+'T00:00:00');
      var prof = professors.find(function(p){ return p.id===a.pid; });
      var isPast = isP(d)&&!isT(d);
      var dstr = d.toLocaleDateString('sr-Latn-RS',{weekday:'short',day:'numeric',month:'short',year:'numeric'});
      var timePart = a.label ? a.label.split('–')[0].trim() : a.time;
      return '<div class="myr-card'+(isPast?' past':'')+'">'+
        '<div class="myr-time"><div class="t">'+timePart+'</div><div class="d">'+dstr+'</div></div>'+
        '<div class="myr-div"></div>'+
        '<div class="myr-info">'+
          '<div class="myr-prof">'+(prof?prof.name:'Професор')+'</div>'+
          '<div class="myr-subj">'+(prof?prof.office:'')+'</div>'+
          '<div class="myr-topic">'+a.topic+(a.dept?' · '+a.dept:'')+'</div>'+
          (a.comment?'<div class="myr-topic" style="color:var(--accent);">💬 '+a.comment+'</div>':'')+
        '</div>'+
        (isPast?
          '<span style="font-size:.68rem;color:var(--text3);flex-shrink:0;">Прошло</span>':
          '<button class="myr-cancel" data-aid="'+a.id+'" data-idx="1">Откажи</button>'
        )+
      '</div>';
    }).join('');

  // Wire cancel buttons
  res.querySelectorAll('.myr-cancel').forEach(function(b){
    b.addEventListener('click',function(){
      var aid = parseInt(b.dataset.aid);
      var bidx = b.dataset.idx;
      showMyrConfirm(aid, bidx);
    });
  });
}

function showMyrConfirm(id, idx){
  var a = appts.find(function(x){ return x.id===id; });
  if(!a) return;
  if(apptStart(a)-new Date() < CANCEL_HOURS*3600000){showToast('err','Отказивање није могуће','Термин се може отказати најкасније '+CANCEL_HOURS+' сата пре почетка.');return;}
  var prof = professors.find(function(p){ return p.id===a.pid; });
  document.getElementById('confirm-msg').innerHTML =
    'Откажи термин код <strong>'+(prof?prof.name:'наставника')+'</strong>?<br>'+
    '<span style="color:var(--accent);font-size:.8rem;">'+(a.label||a.time)+'</span>';
  pendingDeleteId = id;
  pendingMyrIdx = idx;
  document.getElementById('confirm-modal').classList.add('show');
}
var pendingMyrIdx = null;
