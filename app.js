// LumiVisuals — guest-only. Your profile lives in this browser (localStorage)
// and persists across refreshes and restarts. No login, no servers.
(function(){
  const $ = s => document.querySelector(s);
  const store = {
    get(k,d){ try{ const v = localStorage.getItem('lumi_'+k); return v==null?d:JSON.parse(v);}catch{return d;} },
    set(k,v){ localStorage.setItem('lumi_'+k, JSON.stringify(v)); }
  };
  function makeGuest(){
    return { uid:'guest-'+Math.random().toString(36).slice(2,10),
      name:'Guest'+Math.floor(1000+Math.random()*9000),
      avatar:'assets/logo.png', hours:store.get('hours',0),
      version:store.get('version','minimal'),
      accent:store.get('accent','white'), ram:store.get('ram',4) };
  }
  const state = { user: store.get('user', null) };
  if(!state.user){ state.user = makeGuest(); persistLocal(); }

  function persistLocal(){
    if(!state.user) return;
    store.set('user',state.user); store.set('name',state.user.name);
    store.set('avatar',state.user.avatar); store.set('hours',state.user.hours);
    store.set('version',state.user.version); store.set('accent',state.user.accent);
    store.set('ram',state.user.ram);
  }

  // tabs
  document.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{
    document.querySelectorAll('[data-tab]').forEach(x=>x.classList.remove('active'));
    b.classList.add('active');
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
    $('#tab-'+b.dataset.tab).classList.add('active');
  });
  document.querySelectorAll('[data-goto]').forEach(b=>b.onclick=()=>{
    document.querySelector(`[data-tab="${b.dataset.goto}"]`).click();
    window.scrollTo({top:0,behavior:'smooth'});
  });

  $('#saveProfile').onclick=async()=>{
    if(!state.user) return;
    state.user.name=($('#profileName').value||'Player').slice(0,16);
    const f=$('#avatarFile').files[0];
    if(f) state.user.avatar=await fileToDataURL(f);
    persistLocal(); render();
    $('#profSaved').classList.remove('hidden'); setTimeout(()=>$('#profSaved').classList.add('hidden'),1500);
  };
  function fileToDataURL(f){ return new Promise(res=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.readAsDataURL(f); }); }

  $('#saveVersion').onclick=()=>{
    const v=document.querySelector('input[name=ver]:checked').value;
    store.set('version',v);
    state.user.version=v; persistLocal();
    $('#verSaved').classList.remove('hidden'); setTimeout(()=>$('#verSaved').classList.add('hidden'),1500);
    render();
  };

  $('#saveSettings').onclick=()=>{
    const accent=$('#accentSel').value, ram=parseInt($('#ramInput').value||'4');
    store.set('accent',accent); store.set('ram',ram);
    store.set('mods',{sodium:$('#optSodium').checked,lithium:$('#optLithium').checked,ferrite:$('#optFerrite').checked,shortcut:$('#optShortcut').checked});
    state.user.accent=accent; state.user.ram=ram; persistLocal();
    applyAccent(accent);
    $('#setSaved').classList.remove('hidden'); setTimeout(()=>$('#setSaved').classList.add('hidden'),1500);
  };
  function applyAccent(a){ document.body.dataset.accent=a; }

  // launcher download card reflects chosen version (the <a> href does the real download)
  document.querySelectorAll('input[name=ver]').forEach(r=>r.addEventListener('change',()=>{
    const v=document.querySelector('input[name=ver]:checked').value;
    $('#launcherDlSub').textContent='Windows · single .exe · '+v.toUpperCase()+' selected — menu key '+(v==='minimal'?'Right Shift':'0');
  }));

  setInterval(()=>{ if(state.user){ state.user.hours=+(state.user.hours+1/3600).toFixed(3); persistLocal(); } },10000);

  function render(){
    const u=state.user;
    applyAccent(u.accent);
    $('#accentSel').value=u.accent;
    $('#userChip').classList.remove('hidden');
    $('#chipName').textContent=u.name; $('#chipHours').textContent=(+u.hours).toFixed(1)+'h';
    $('#chipAvatar').src=u.avatar;
    $('#profileLocked').classList.add('hidden'); $('#profileOpen').classList.remove('hidden');
    $('#profileName').value=u.name; $('#avatarPreview').src=u.avatar;
    $('#statHours').textContent=(+u.hours).toFixed(1); $('#statVersion').textContent=u.version; $('#statUser').textContent=u.name;
    const rv=document.querySelector(`input[name=ver][value="${u.version}"]`); if(rv) rv.checked=true;
  }
  window.LumiProfile = { get:()=>state.user };
  render();
})();
