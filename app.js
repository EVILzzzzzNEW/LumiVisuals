// LumiVisuals web app — accounts, profiles and playtime sync.
(function(){
  const $ = s => document.querySelector(s);
  const store = {
    get(k,d){ try{ const v = localStorage.getItem('lumi_'+k); return v==null?d:JSON.parse(v);}catch{return d;} },
    set(k,v){ localStorage.setItem('lumi_'+k, JSON.stringify(v)); }
  };
  const state = { user: store.get('user', null), useCloud: false, sb: null };

  try{
    const cfg = window.LUMI_SUPABASE;
    if (cfg && cfg.url && !cfg.url.includes('PASTE') && window.supabase) {
      state.sb = window.supabase.createClient(cfg.url, cfg.anonKey);
      state.useCloud = true;
      state.sb.auth.onAuthStateChange(async (ev, session)=>{
        const u = session && session.user;
        if(u){ await pullProfile(u.id, u.email); } else { state.user=null; render(); }
      });
      state.sb.auth.getSession().then(async ({data})=>{
        const u = data.session && data.session.user;
        if(u) await pullProfile(u.id, u.email);
      });
    }
  }catch(e){ console.warn('cloud init failed, using this-device storage', e); }

  async function pullProfile(uid,email){
    let d = {};
    if(state.useCloud){
      try{
        const { data } = await state.sb.from('profiles').select('*').eq('uid',uid).single();
        if(data) d = data;
      }catch{}
    }
    state.user = {
      uid, email,
      name: d.name || store.get('name','Player'),
      avatar: d.avatar || store.get('avatar','public/logo.png'),
      hours: +(d.hours || store.get('hours',0)),
      version: d.version || store.get('version','minimal'),
      accent: d.accent || store.get('accent','white'),
      ram: d.ram || store.get('ram',4)
    };
    persistLocal(); render();
  }
  function persistLocal(){
    if(!state.user) return;
    store.set('user',state.user); store.set('name',state.user.name);
    store.set('avatar',state.user.avatar); store.set('hours',state.user.hours);
    store.set('version',state.user.version); store.set('accent',state.user.accent);
    store.set('ram',state.user.ram);
  }
  async function pushProfile(){
    persistLocal();
    if(state.useCloud && state.user){
      try{
        await state.sb.from('profiles').upsert({
          uid: state.user.uid, email: state.user.email, name: state.user.name,
          avatar: state.user.avatar, hours: state.user.hours, version: state.user.version,
          accent: state.user.accent, ram: state.user.ram, updated: new Date().toISOString()
        }, { onConflict: 'uid' });
      }catch(e){ console.warn(e); }
    }
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

  const qs = new URLSearchParams(location.search);
  if(qs.get('launcher')==='1' || qs.get('mode')==='launcher'){
    openAuth();
    $('#launcherApproveBox').classList.remove('hidden');
    $('#launcherApproveRow').classList.remove('hidden');
  }

  function openAuth(){ $('#authModal').classList.remove('hidden'); }
  function closeAuth(){ $('#authModal').classList.add('hidden'); $('#authErr').textContent=''; }
  $('#authBtn').onclick=openAuth; $('#authClose').onclick=closeAuth;
  const pb = $('#profileLoginBtn'); if(pb) pb.onclick=openAuth;

  async function login(){
    const email=$('#authEmail').value.trim(), pass=$('#authPass').value;
    if(!email||!pass){ $('#authErr').textContent='Enter email + password.'; return; }
    if(state.useCloud){
      const { data, error } = await state.sb.auth.signInWithPassword({ email, password: pass });
      if(error){ $('#authErr').textContent=error.message; return; }
      await pullProfile(data.user.id, data.user.email); closeAuth();
    } else {
      const users = store.get('demo_users',{});
      if(!users[email] || users[email]!==pass){ $('#authErr').textContent='No account found — press Register first.'; return; }
      state.user={uid:'demo-'+btoa(email),email,name:store.get('name','Player'),avatar:store.get('avatar','public/logo.png'),hours:store.get('hours',0),version:store.get('version','minimal'),accent:store.get('accent','white'),ram:store.get('ram',4)};
      persistLocal(); closeAuth(); render();
    }
  }
  async function register(){
    const email=$('#authEmail').value.trim(), pass=$('#authPass').value;
    if(!email||pass.length<6){ $('#authErr').textContent='Password min 6 chars.'; return; }
    if(state.useCloud){
      const { data, error } = await state.sb.auth.signUp({ email, password: pass });
      if(error){ $('#authErr').textContent=error.message; return; }
      const u = data.user || (await state.sb.auth.getUser()).data.user;
      state.user={uid:u.id,email:u.email,name:email.split('@')[0].slice(0,16),avatar:'public/logo.png',hours:0,version:'minimal',accent:'white',ram:4};
      await pushProfile(); closeAuth(); render();
    } else {
      const users=store.get('demo_users',{});
      if(users[email]){ $('#authErr').textContent='Exists — press Login.'; return; }
      users[email]=pass; store.set('demo_users',users);
      state.user={uid:'demo-'+btoa(email),email,name:email.split('@')[0].slice(0,16),avatar:'public/logo.png',hours:0,version:'minimal',accent:'white',ram:4};
      persistLocal(); closeAuth(); render();
    }
  }
  $('#loginGo').onclick=login; $('#regGo').onclick=register;
  $('#logoutBtn').onclick=async()=>{
    if(state.useCloud) await state.sb.auth.signOut();
    state.user=null; localStorage.removeItem('lumi_user'); render();
  };

  $('#approveLauncher').onclick=async()=>{
    if(!state.user){ $('#authErr').textContent='Login first.'; return; }
    const code = 'LUMI-'+Math.random().toString(36).slice(2,8).toUpperCase();
    store.set('launcher_code',{code, name:state.user.name, avatar:state.user.avatar, uid:state.user.uid, ts:Date.now()});
    if(state.useCloud){
      try{ await state.sb.from('launcher_codes').insert({ code, uid: state.user.uid, name: state.user.name, avatar: state.user.avatar }); }catch(e){ console.warn(e); }
    }
    $('#authErr').textContent='';
    prompt('Enter this code in the LumiVisuals launcher:', code);
    closeAuth();
  };

  $('#saveProfile').onclick=async()=>{
    if(!state.user) return;
    state.user.name=($('#profileName').value||'Player').slice(0,16);
    const f=$('#avatarFile').files[0];
    if(f){
      if(state.useCloud){
        try{
          const path = state.user.uid + '/' + Date.now() + '_' + f.name;
          const { error } = await state.sb.storage.from('avatars').upload(path, f, { upsert: true });
          if(error) throw error;
          const { data } = state.sb.storage.from('avatars').getPublicUrl(path);
          state.user.avatar = data.publicUrl;
        }catch(e){ console.warn(e); state.user.avatar=await fileToDataURL(f); }
      } else state.user.avatar=await fileToDataURL(f);
    }
    await pushProfile(); render();
    $('#profSaved').classList.remove('hidden'); setTimeout(()=>$('#profSaved').classList.add('hidden'),1500);
  };
  function fileToDataURL(f){ return new Promise(res=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.readAsDataURL(f); }); }

  $('#saveVersion').onclick=async()=>{
    const v=document.querySelector('input[name=ver]:checked').value;
    store.set('version',v);
    if(state.user){ state.user.version=v; await pushProfile(); }
    $('#verSaved').classList.remove('hidden'); setTimeout(()=>$('#verSaved').classList.add('hidden'),1500);
    render();
  };

  $('#saveSettings').onclick=async()=>{
    const accent=$('#accentSel').value, ram=parseInt($('#ramInput').value||'4');
    store.set('accent',accent); store.set('ram',ram);
    store.set('mods',{sodium:$('#optSodium').checked,lithium:$('#optLithium').checked,ferrite:$('#optFerrite').checked,shortcut:$('#optShortcut').checked});
    if(state.user){ state.user.accent=accent; state.user.ram=ram; await pushProfile(); }
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
    applyAccent((u&&u.accent)||store.get('accent','white'));
    $('#accentSel').value=(u&&u.accent)||store.get('accent','white');
    if(u){
      $('#authBtn').classList.add('hidden'); $('#userChip').classList.remove('hidden');
      $('#chipName').textContent=u.name; $('#chipHours').textContent=(+u.hours).toFixed(1)+'h';
      $('#chipAvatar').src=u.avatar;
      $('#profileLocked').classList.add('hidden'); $('#profileOpen').classList.remove('hidden');
      $('#profileName').value=u.name; $('#avatarPreview').src=u.avatar;
      $('#statHours').textContent=(+u.hours).toFixed(1); $('#statVersion').textContent=u.version; $('#statUser').textContent=u.email;
      const rv=document.querySelector(`input[name=ver][value="${u.version}"]`); if(rv) rv.checked=true;
    } else {
      $('#authBtn').classList.remove('hidden'); $('#userChip').classList.add('hidden');
      $('#profileLocked').classList.remove('hidden'); $('#profileOpen').classList.add('hidden');
    }
  }
  window.LumiProfile = { get:()=>state.user };
  render();
})();
