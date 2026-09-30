// Помоћне функције: датуми, ескејпинг, тема, лоадер, обавештења, ћирилица, конфети

// ── HELPERS ───────────────────────────────────────────────────────────────────
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function pad(n){ return String(n).padStart(2,'0'); }
function ini(n){ return n.replace(/др |мр /g,'').trim().split(/\s+/).slice(0,2).map(function(w){return w[0];}).join('').toUpperCase(); }
function isT(d){ var t=new Date(); return d.getFullYear()===t.getFullYear()&&d.getMonth()===t.getMonth()&&d.getDate()===t.getDate(); }
function isP(d){ var t=new Date(); t.setHours(0,0,0,0); return d<t; }
function sameD(a,b){ return a&&b&&a.getFullYear()===b.getFullYear()&&a.getMonth()===b.getMonth()&&a.getDate()===b.getDate(); }
function fmtDate(d,opts){ return d.toLocaleDateString('sr-Cyrl-RS',opts); }
function fmtD(d){ return fmtDate(d,{weekday:'long',day:'numeric',month:'long',year:'numeric'}); }
function fmtDShort(d,withYear){ var o={weekday:'short',day:'numeric',month:'short'}; if(withYear)o.year='numeric'; return fmtDate(d,o); }
function fmtK(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }

// ── LOADER ────────────────────────────────────────────────────────────────────
function hideLoader(){
  var l=document.getElementById('loader');if(!l)return;
  l.classList.add('hide');setTimeout(function(){l.style.display='none';},500);
}
setTimeout(hideLoader,5000);

// ── THEME ─────────────────────────────────────────────────────────────────────
var SUN='<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
var MOON='<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
function initTheme(){
  applyTheme(localStorage.getItem('vtszr_theme')||'dark');
  document.getElementById('theme-btn').addEventListener('click',function(){
    applyTheme(document.body.classList.contains('light')?'dark':'light');
  });
}
function applyTheme(t){
  document.body.classList.toggle('light',t==='light');
  var ic=document.getElementById('theme-icon');if(ic)ic.innerHTML=t==='light'?MOON:SUN;
  try{localStorage.setItem('vtszr_theme',t);}catch(e){}
}

// ── TOAST ─────────────────────────────────────────────────────────────────────
function showToast(type,title,sub){
  var c=document.getElementById('tc'),el=document.createElement('div');
  el.className='toast '+type;
  var icon=type==='ok'?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
  el.innerHTML='<div class="ti">'+icon+'</div><div><div class="tt"></div><div class="ts"></div></div>';
  el.querySelector('.tt').textContent=title;
  el.querySelector('.ts').textContent=sub;
  c.appendChild(el);setTimeout(function(){el.remove();},4000);
}

// ── ЛАТИНИЦА → ЋИРИЛИЦА (за претрагу) ────────────────────────────────────────
var LAT_CYR = {
  'lj':'љ','nj':'њ','dj':'ђ','dž':'џ','ch':'ч','sh':'ш','zh':'ж',
  'a':'а','b':'б','v':'в','g':'г','d':'д','đ':'ђ','e':'е','ž':'ж',
  'z':'з','i':'и','j':'ј','k':'к','l':'л','m':'м','n':'н','o':'о',
  'p':'п','r':'р','s':'с','t':'т','ć':'ћ','c':'ц','u':'у','f':'ф',
  'h':'х','c':'ц','č':'ч','š':'ш'
};

function toCyr(str){
  var s = str.toLowerCase();
  var res = '';
  var i = 0;
  while(i < s.length){
    // Try 2-char combos first
    var two = s.substring(i,i+2);
    if(LAT_CYR[two]){
      res += LAT_CYR[two];
      i += 2;
    } else {
      var one = s[i];
      res += LAT_CYR[one] || one;
      i++;
    }
  }
  return res;
}


// ── CONFETTI ──────────────────────────────────────────────────────────────────
function launchConfetti(){
  var wrap = document.createElement('div');
  wrap.className = 'confetti-wrap';
  document.body.appendChild(wrap);
  var colors = ['#f5b900','#20d9a0','#60a5fa','#f43f5e','#a78bfa','#fb923c'];
  for(var i=0;i<60;i++){
    (function(i){
      setTimeout(function(){
        var p = document.createElement('div');
        p.className = 'confetti-piece';
        p.style.left = Math.random()*100+'%';
        p.style.background = colors[Math.floor(Math.random()*colors.length)];
        p.style.borderRadius = Math.random()>0.5?'50%':'0';
        p.style.width = (Math.random()*8+4)+'px';
        p.style.height = (Math.random()*8+4)+'px';
        p.style.animationDuration = (Math.random()*1.2+1)+'s';
        p.style.animationDelay = (Math.random()*0.5)+'s';
        wrap.appendChild(p);
      }, i*18);
    })(i);
  }
  setTimeout(function(){ wrap.remove(); }, 3500);
}
