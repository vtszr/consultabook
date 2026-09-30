// Улаз: избор улоге и повезивање догађаја (DOMContentLoaded)

// ── ROLE ──────────────────────────────────────────────────────────────────────
function role(r){
  document.querySelectorAll('.rbtn').forEach(function(b,i){b.classList.toggle('on',i===(r==='student'?0:1));});
  document.querySelectorAll('.pg').forEach(function(p){p.classList.remove('on');});
  document.getElementById('pg-'+r[0]).classList.add('on');
}

// ── INIT ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded',function(){
  try{initFirebase();}catch(e){console.error('firebase init:',e);}
  var n=new Date();cy=n.getFullYear();cm_=n.getMonth();
  renderG(professors);
  initTheme();

  document.getElementById('btn-student').addEventListener('click',function(){role('student');});
  document.getElementById('btn-professor').addEventListener('click',function(){role('professor');});
  document.getElementById('back-btn').addEventListener('click',backList);
  document.getElementById('sq').addEventListener('input',filt);
  document.getElementById('clr-btn').addEventListener('click',clearSearch);
  document.querySelectorAll('.fbtn').forEach(function(b){b.addEventListener('click',function(){sf(b.dataset.day,b);});});
  document.getElementById('view-card').addEventListener('click',function(){setView('card');});
  document.getElementById('view-dept').addEventListener('click',function(){setView('dept');});
  document.getElementById('cal-prev').addEventListener('click',function(){cm(-1);});
  document.getElementById('cal-next').addEventListener('click',function(){cm(1);});
  ['fn','fi','fd','fy','ft'].forEach(function(id){var el=document.getElementById(id);if(el)el.addEventListener('input',chk);});
  document.getElementById('fn').addEventListener('input',function(){document.getElementById('dup-warn').classList.remove('on');});
  document.getElementById('cbtn').addEventListener('click',confirmBook);
  document.getElementById('login-btn').addEventListener('click',doLogin);
  document.getElementById('l-pass').addEventListener('keydown',function(e){if(e.key==='Enter')doLogin();});
  document.getElementById('logout-btn').addEventListener('click',doLogout);
  var pb=document.getElementById('purge-btn');if(pb)pb.addEventListener('click',purgePast);
  document.querySelectorAll('.tpill').forEach(function(b){b.addEventListener('click',function(){ptab(b.dataset.tab,b);});});
  document.getElementById('confirm-yes').addEventListener('click',function(){
    if(pendingDeleteId!==null&&!fbOnline){
      showToast('err','Нема везе са базом','Проверите интернет и покушајте поново.');
    } else if(pendingDeleteId!==null){
      var delId=pendingDeleteId,fromMyr=pendingMyrIdx;
      pendingMyrIdx=null;
      deleteApptFromFirebase(delId).then(function(){
        appts=appts.filter(function(a){return a.id!==delId;});
        showToast('ok','Термин је отказан','');
        if(loggedProf){renderStats(loggedProf.id);renderAppts(loggedProf.id,ptab_);}
        if(fromMyr){searchMyAppts();}
      },function(){
        showToast('err','Отказивање није успело','Проверите интернет везу.');
      });
    }
    hideConfirm();
  });
  document.getElementById('confirm-no').addEventListener('click',hideConfirm);
  document.getElementById('confirm-modal').addEventListener('click',function(e){if(e.target===this)hideConfirm();});

  // Моје резервације
  document.getElementById('btn-student2').addEventListener('click',function(){
    document.querySelectorAll('.rbtn').forEach(function(b){b.classList.remove('on');});
    this.classList.add('on');
    document.querySelectorAll('.pg').forEach(function(p){p.classList.remove('on');});
    document.getElementById('pg-m').classList.add('on');
    searchMyAppts();
  });

  // Restore session
  // сесију води Firebase Auth
});
