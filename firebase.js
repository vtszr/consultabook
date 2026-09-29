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
    nid=appts.length?Math.max.apply(null,appts.map(function(a){return a.id||0;}))+1:1;
    if(loggedProf){ renderStats(loggedProf.id); renderAppts(loggedProf.id,ptab_); }
    if(currentView==='week') renderWeek();
  },function(e){console.error('appointments:',e.message);});
  };
  db.ref('consultabook/slots').on('value',function(snap){
    takenSlots=snap.val()||{};
    if(sp&&document.getElementById('vbook').classList.contains('on')){renderCal();renderSlots();}
    if(currentView==='week')renderWeek();
  });
  auth=firebase.auth();
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

function saveApptToFirebase(appt){
  db.ref(DB_REF+'/'+String(appt.id)).set(appt);
}
function deleteApptFromFirebase(id){
  var r=db.ref(DB_REF+'/'+String(id));
  r.once('value',function(snap){
    var a=snap.val();
    if(a&&a.lock) db.ref('consultabook/slots/'+a.lock).remove();
    r.remove();
  });
}

// ── AUTH ───────────────────────────────────────────────────
function onAuth(user){
  var btn=document.getElementById('auth-btn');
  if(apptRef){apptRef.off();apptRef=null;}
  appts=[];loggedProf=null;
  document.getElementById('p-portal').style.display='none';
  document.getElementById('p-login').style.display='flex';
  if(!user){btn.textContent='Пријава (Google)';return;}
  btn.textContent='Одјава · '+(user.displayName||user.email);
  var asStudent=function(){
    if(pendingProfLogin){pendingProfLogin=false;showToast('err','Нисте наставник','Овај налог нема приступ порталу за наставнике.');auth.signOut();return;}
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
    auth.signInWithPopup(new firebase.auth.GoogleAuthProvider()).catch(function(e){showToast('err','Пријава није успела',e.code||'');});
  });
});
