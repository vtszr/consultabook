// Firebase: конфигурација, база (термини, слотови) и аутентификација

// ── FIREBASE ──────────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBpxn-ZD5Nx-BlplGuBeuQXSXWbVmOvCQg",
  authDomain: "consultabook-vtszr.firebaseapp.com",
  databaseURL: "https://consultabook-vtszr-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "consultabook-vtszr",
  storageBucket: "consultabook-vtszr.firebasestorage.app",
  messagingSenderId: "822701282685",
  appId: "1:822701282685:web:88b2f03db4843d9ce7e814",
  measurementId: "G-BP866LFXZQ"
};

function initFirebase(){
  firebase.initializeApp(firebaseConfig);
  db = firebase.database();
  attachAppts=function(q){
  if(apptRef)apptRef.off();
  apptRef=q;
  q.on('value',function(snapshot){
    var data=snapshot.val();
    appts=[];
    if(data){
      Object.keys(data).forEach(function(key){
        if(data[key] && data[key].id) appts.push(data[key]);
      });
    }
    if(loggedProf){ renderStats(loggedProf.id); renderAppts(loggedProf.id,ptab_); }
    if(document.getElementById('pg-m').classList.contains('on')) searchMyAppts();
  },function(e){console.error('appointments:',e.message);});
  };
  db.ref('consultabook/slots').on('value',function(snap){
    takenSlots=snap.val()||{};
    if(sp&&document.getElementById('vbook').classList.contains('on')){renderCal();renderSlots();}
  });
  // Блокирани датуми — потребни и студентима (календар), не само наставнику
  db.ref(DB_BLOCKED).on('value',function(snap){
    var v=snap.val()||{};
    blockedDates={};
    Object.keys(v).forEach(function(pid){blockedDates[pid]=Object.values(v[pid]||{});});
    if(sp&&document.getElementById('vbook').classList.contains('on')){renderCal();renderSlots();}
    if(loggedProf)renderBlockedList(loggedProf.id);
  },function(e){console.error('blocked:',e.message);});
  auth=firebase.auth();
  // подразумевано пријава важи само док је таб отворен; "Запамти ме" је чува и после затварања
  setRemember(getKeep());
  var pcb=document.getElementById('remember-prof');
  if(pcb){
    try{pcb.checked=localStorage.getItem('vtszr_remember_prof')==='1';}catch(e){}
  }
  var cb=document.getElementById('remember-cb');
  if(cb){
    cb.checked=getRemember();
    cb.addEventListener('change',function(){
      try{localStorage.setItem('vtszr_remember',cb.checked?'1':'0');}catch(e){}
      setRemember(cb.checked);
    });
  }
  auth.onAuthStateChanged(onAuth);
  // Connection status
  firebase.database().ref('.info/connected').on('value',function(snap){
    var dot=document.getElementById('fb-dot'),label=document.getElementById('fb-label');
    if(!dot||!label)return;
    if(snap.val()===true){
      dot.style.background='var(--success)';label.textContent='Онлајн';label.style.color='var(--success)';
      hideLoader();
      document.getElementById('offline-bar').classList.remove('show');
    } else {
      dot.style.background='var(--danger)';label.textContent='Офлајн';label.style.color='var(--danger)';
      document.getElementById('offline-bar').classList.add('show');
    }
  });
}

function getRemember(){try{return localStorage.getItem('vtszr_remember')==='1';}catch(e){return false;}}
// "Запамти ме" за последњу пријаву (студент или наставник)
function getKeep(){try{return localStorage.getItem('vtszr_keep')==='1';}catch(e){return false;}}
function setKeep(on){try{localStorage.setItem('vtszr_keep',on?'1':'0');}catch(e){}}
function setRemember(on){
  var P=firebase.auth.Auth.Persistence;
  return auth.setPersistence(on?P.LOCAL:P.SESSION).catch(function(e){console.error('persistence:',e.code);});
}

function saveApptToFirebase(appt){
  db.ref(DB_REF+'/'+String(appt.id)).set(appt);
}
function deleteApptFromFirebase(id){
  var r=db.ref(DB_REF+'/'+String(id));
  r.once('value',function(snap){
    var a=snap.val();
    var upd={};
    upd[DB_REF+'/'+String(id)]=null;
    if(a&&a.lock) upd['consultabook/slots/'+a.lock]=null;
    db.ref().update(upd);
  });
}

// ── AUTH ───────────────────────────────────────────────────
function prefillFromAccount(){
  var u=auth&&auth.currentUser;if(!u)return;
  var fn=document.getElementById('fn'),fe=document.getElementById('fe');
  if(fn&&!fn.value&&u.displayName)fn.value=u.displayName;
  if(fe&&u.email){fe.value=u.email;fe.readOnly=true;}
  chk();
}
// Сесија таба: означава да је пријава направљена у овом табу (sessionStorage нестаје затварањем таба)
function markSession(){try{sessionStorage.setItem('vtszr_active','1');}catch(e){}}
function hasSession(){try{return sessionStorage.getItem('vtszr_active')==='1';}catch(e){return true;}}
function onAuth(user){
  // без "Запамти ме": ако пријава потиче из ранијег таба, одјави корисника
  if(user&&!getKeep()&&!hasSession()){auth.signOut();return;}
  var btn=document.getElementById('auth-btn');
  btn.style.display='';
  var rw=document.getElementById('remember-wrap');if(rw)rw.style.display=user?'none':'';
  if(apptRef){apptRef.off();apptRef=null;}
  appts=[];loggedProf=null;
  document.getElementById('p-portal').style.display='none';
  document.getElementById('p-login').style.display='flex';
  if(!user){
    btn.textContent='Пријава (Google)';
    var fe0=document.getElementById('fe'),fn0=document.getElementById('fn');
    if(fe0){fe0.readOnly=false;fe0.value='';}
    if(fn0)fn0.value='';
    if(document.getElementById('pg-m').classList.contains('on'))searchMyAppts();
    return;
  }
  btn.textContent='Одјава · '+(user.displayName||user.email);
  var asStudent=function(){
    if(pendingProfLogin){pendingProfLogin=false;showToast('err','Нисте наставник','Овај налог нема приступ порталу за наставнике.');auth.signOut();return;}
    prefillFromAccount();
    attachAppts(db.ref(DB_REF).orderByChild('uid').equalTo(user.uid));
  };
  db.ref('consultabook/profs/'+user.uid).once('value',function(snap){
    var pid=snap.val();
    var prof=pid===null?null:professors.find(function(p){return p.id===pid;});
    if(!prof){asStudent();return;}
    pendingProfLogin=false;loggedProf=prof;
    attachAppts(db.ref(DB_REF).orderByChild('pid').equalTo(pid));
    showPortal();
  },asStudent);
}
document.addEventListener('DOMContentLoaded',function(){
  document.getElementById('auth-btn').addEventListener('click',function(){
    if(auth.currentUser){auth.signOut();return;}
    if(signingIn)return;
    signingIn=true;
    markSession();
    var scb=document.getElementById('remember-cb');
    setKeep(!!(scb&&scb.checked));
    auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(function(e){
      // затварање прозора и двоструки клик нису праве грешке
      if(e.code==='auth/popup-closed-by-user'||e.code==='auth/cancelled-popup-request')return;
      showToast('err','Пријава није успела',e.code||'');
    }).then(function(){signingIn=false;});
  });
});
