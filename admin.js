const SUPABASE_URL = 'https://komhdriknaqunyxblvsw.supabase.co';
const SUPABASE_KEY = 'sb_publishable_JyZ9yIDLmlMUqogq7UjhHw_Sv-XOpqI';
const BUCKET = 'portfolio-images';

const sb = window.supabase ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY) : null;

const loginScreen = document.getElementById('loginScreen');
const app = document.getElementById('app');
const loginForm = document.getElementById('loginForm');
const loginButton = loginForm.querySelector('button[type="submit"]');
const loginError = document.getElementById('loginErr');

let currentUser = null;
let editingBlogId = null;
let editingProjectId = null;
let editingQualId = null;
const pendingFiles = {};

const IMAGE_SLOTS = [
  { key:'hero',    title:'Hero Section', textKey:'hero_tag',    hint:'Hero section ka main paragraph (ek line).' },
  { key:'about',   title:'About Me',     textKey:'about_body',  hint:'About Me ke paragraphs — har paragraph alag line me.' },
  { key:'journey', title:'My Journey',   textKey:'journey_body',hint:'Har line ek journey item. Title aur description ke beech | lagao, jaise: Getting Started | HTML, CSS seekha.' }
];

function esc(value){
  const d = document.createElement('div');
  d.textContent = (value == null ? '' : String(value));
  return d.innerHTML;
}
function safeUrl(value){
  if(!value) return '';
  try{
    const url = new URL(value);
    return ['http:','https:'].includes(url.protocol) ? url.href : '';
  }catch(err){ return ''; }
}
function toast(message, type){
  const box = document.createElement('div');
  box.className = 'toast ' + (type === 'err' ? 'err' : 'ok');
  box.textContent = message;
  document.getElementById('toasts').appendChild(box);
  setTimeout(() => { box.style.opacity = '0'; setTimeout(() => box.remove(), 300); }, 4000);
}
function withTimeout(promise, ms, message){
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms))
  ]);
}
function busy(btn, on, label){
  if(!btn) return;
  if(on){
    btn.dataset.label = btn.dataset.label || btn.textContent;
    btn.textContent = label || 'Working…';
    btn.classList.add('busy');
    btn.disabled = true;
  }else{
    btn.textContent = btn.dataset.label || btn.textContent;
    btn.classList.remove('busy');
    btn.disabled = false;
  }
}
function setStatus(id, text, ok){
  const el = document.getElementById(id);
  if(!el) return;
  el.textContent = text;
  el.className = 'status ' + (ok ? 'ok' : 'err');
}
function isAdmin(user){ return Boolean(user && user.app_metadata && user.app_metadata.role === 'admin'); }
function closeModal(id){ document.getElementById(id).classList.remove('open'); }
function openModal(id){ document.getElementById(id).classList.add('open'); }

document.getElementById('tabs').addEventListener('click', function(e){
  const tab = e.target.closest('.tab');
  if(!tab) return;
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  tab.classList.add('active');
  document.getElementById('panel-' + tab.dataset.panel).classList.add('active');
  window.scrollTo({ top:0, behavior:'smooth' });
});

function showLogin(message){
  currentUser = null;
  loginScreen.style.display = 'flex';
  app.style.display = 'none';
  document.getElementById('loginPass').value = '';
  loginError.textContent = message || '';
}
function showApp(user){
  if(!isAdmin(user)) return;
  currentUser = user;
  document.getElementById('adminEmail').textContent = user.email || '';
  loginScreen.style.display = 'none';
  app.style.display = 'block';
  document.getElementById('fpEmail2').value = user.email || '';
  loadAll();
}

loginForm.addEventListener('submit', async function(e){
  e.preventDefault();
  if(!sb) return;
  busy(loginButton, true, 'Logging in…');
  loginError.textContent = '';
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPass').value;
  try{
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if(error) throw error;
    if(!isAdmin(data.user)){
      loginError.textContent = 'Is account me admin role nahi hai.';
      await sb.auth.signOut();
      return;
    }
    showApp(data.user);
    toast('Login successful', 'ok');
  }catch(err){
    loginError.textContent = err.message || 'Login nahi ho paya.';
  }finally{
    busy(loginButton, false);
  }
});

document.getElementById('logoutBtn').addEventListener('click', async function(){
  if(sb) await sb.auth.signOut();
  showLogin();
  toast('Logout ho gaye', 'ok');
});

async function initAuth(){
  if(!sb){
    loginButton.disabled = true;
    loginError.textContent = 'Supabase library load nahi hui. Internet check karke refresh karo.';
    return;
  }
  const { data } = await sb.auth.getSession();
  if(data.session && isAdmin(data.session.user)) showApp(data.session.user);
  else showLogin();
  sb.auth.onAuthStateChange(function(event, session){
    if(event === 'SIGNED_OUT'){ showLogin(); return; }
    if(event === 'PASSWORD_RECOVERY'){
      openForgotAtStep(3);
    }
    if(session && isAdmin(session.user) && loginScreen.style.display !== 'none'){
      showApp(session.user);
    }
  });
}

/* ---------------- DATA ---------------- */
const state = { messages:[], projects:[], blogs:[], tools:[], quals:[], content:{}, images:{} };

async function loadAll(){
  await Promise.all([loadMessages(), loadProjects(), loadBlogs(), loadTools(), loadQuals(), loadContent(), loadImages()]);
}

async function loadMessages(){
  const list = document.getElementById('messagesList');
  setStatus('msgStatus', 'Loading messages...', true);
  list.innerHTML = '<div class="loading">Loading…</div>';
  const { data, error } = await sb.from('messages').select('*').order('created_at', { ascending:false });
  if(error){ setStatus('msgStatus', 'Load failed: ' + error.message, false); list.innerHTML = ''; return; }
  state.messages = data || [];
  document.getElementById('statMessages').textContent = state.messages.length;
  setStatus('msgStatus', state.messages.length + ' message(s)', true);
  list.innerHTML = state.messages.length ? state.messages.map(m => `
    <div class="card">
      <div class="msg-meta">
        <span class="msg-chip">${esc(m.name || 'Visitor')}</span>
        <span class="msg-chip">${esc(m.email || '')}</span>
        <span class="msg-date">${m.created_at ? new Date(m.created_at).toLocaleString('en-IN') : ''}</span>
      </div>
      <div class="msg-body">${esc(m.message || '')}</div>
    </div>`).join('')
    : '<div class="empty"><span class="big">📭</span>Abhi koi message nahi aaya.</div>';
}

async function loadProjects(){
  const list = document.getElementById('projectsList');
  setStatus('projStatus', 'Loading projects...', true);
  list.innerHTML = '<div class="loading">Loading…</div>';
  const { data, error } = await sb.from('projects').select('*').order('created_at', { ascending:false });
  if(error){ setStatus('projStatus', 'Load failed: ' + error.message, false); list.innerHTML = ''; return; }
  state.projects = data || [];
  document.getElementById('statProjects').textContent = state.projects.length;
  setStatus('projStatus', state.projects.length + ' project(s)', true);
  list.innerHTML = state.projects.length ? state.projects.map(p => `
    <div class="card">
      <div class="card-top">
        <div>
          <h3>${p.emoji ? p.emoji + ' ' : ''}${esc(p.title)}</h3>
          <div class="sub">${esc(p.tag || '')}</div>
        </div>
      </div>
      <div class="msg-body" style="margin-top:8px;">${esc(p.description || '')}</div>
      ${p.tech_stack ? '<div class="stack-pills">' + String(p.tech_stack).split(',').map(t => `<span>${esc(t.trim())}</span>`).join('') + '</div>' : ''}
      ${safeUrl(p.live_link) ? `<a class="live" href="${esc(safeUrl(p.live_link))}" target="_blank" rel="noopener">Open project ↗</a>` : ''}
      <div class="card-actions" style="margin-top:14px;">
        <button class="btn edit" data-edit-project="${p.id}">Edit</button>
        <button class="btn danger" data-del-project="${p.id}">Delete</button>
      </div>
    </div>`).join('')
    : '<div class="empty"><span class="big">🚀</span>Abhi koi project nahi. Left side se add karo.</div>';
}

async function loadBlogs(){
  const list = document.getElementById('blogsList');
  setStatus('blogStatus', 'Loading blogs...', true);
  list.innerHTML = '<div class="loading">Loading…</div>';
  const { data, error } = await sb.from('blogs').select('*').order('created_at', { ascending:false });
  if(error){ setStatus('blogStatus', 'Load failed: ' + error.message, false); list.innerHTML = ''; return; }
  state.blogs = data || [];
  document.getElementById('statBlogs').textContent = state.blogs.length;
  setStatus('blogStatus', state.blogs.length + ' blog(s)', true);
  list.innerHTML = state.blogs.length ? state.blogs.map(b => `
    <div class="card">
      <div class="card-top">
        <div>
          <h3>${b.emoji ? b.emoji + ' ' : ''}${esc(b.title)}</h3>
          <div class="sub">${esc(b.category || 'General')} · ${b.created_at ? new Date(b.created_at).toLocaleDateString('en-IN') : ''}</div>
        </div>
      </div>
      <div class="msg-body" style="margin-top:8px;">${esc((b.content || '').slice(0, 220))}${(b.content || '').length > 220 ? '…' : ''}</div>
      <div class="card-actions" style="margin-top:14px;">
        <button class="btn edit" data-edit-blog="${b.id}">Edit</button>
        <button class="btn danger" data-del-blog="${b.id}">Delete</button>
      </div>
    </div>`).join('')
    : '<div class="empty"><span class="big">📝</span>Abhi koi blog post nahi.</div>';
}

async function loadTools(){
  const wrap = document.getElementById('toolsChips');
  setStatus('toolStatus', 'Loading tools...', true);
  wrap.innerHTML = '<div class="loading">Loading…</div>';
  const { data, error } = await sb.from('capabilities').select('*').order('sort_order', { ascending:true });
  if(error){ setStatus('toolStatus', 'Load failed: ' + error.message, false); wrap.innerHTML = ''; return; }
  state.tools = data || [];
  document.getElementById('statTools').textContent = state.tools.length;
  setStatus('toolStatus', state.tools.length + ' tool(s)', true);
  wrap.innerHTML = state.tools.length ? state.tools.map(t => `
    <span class="chip"><em>${esc(t.icon || '⚡')}</em>${esc(t.name)}<button data-del-tool="${t.id}" title="Remove">×</button></span>`).join('')
    : '<div class="empty" style="width:100%;"><span class="big">🧰</span>Abhi koi tool nahi. Upar se add karo.</div>';
}

async function loadQuals(){
  const list = document.getElementById('qualsList');
  setStatus('qualStatus', 'Loading qualifications...', true);
  list.innerHTML = '<div class="loading">Loading…</div>';
  const { data, error } = await sb.from('qualifications').select('*').order('sort_order', { ascending:true });
  if(error){ setStatus('qualStatus', 'Load failed: ' + error.message, false); list.innerHTML = ''; return; }
  state.quals = data || [];
  setStatus('qualStatus', state.quals.length + ' qualification(s)', true);
  list.innerHTML = state.quals.length ? state.quals.map(q => `
    <div class="card" data-qual-card="${q.id}">
      <div class="card-top">
        <div>
          <h3>${esc(q.degree)}</h3>
          <div class="sub">${esc(q.institute || '')}${q.year ? ' · ' + esc(q.year) : ''}${q.score ? ' · ' + esc(q.score) : ''}</div>
        </div>
      </div>
      <div class="card-actions" style="margin-top:14px;">
        <button class="btn edit" data-edit-qual="${q.id}">Edit Text</button>
        <button class="btn danger" data-del-qual="${q.id}">Delete</button>
      </div>
      <div class="edit-row hidden" data-qual-edit="${q.id}">
        <input type="text" data-q-degree="${q.id}" value="${esc(q.degree)}" placeholder="Degree">
        <input type="text" data-q-institute="${q.id}" value="${esc(q.institute)}" placeholder="Institute">
        <input type="text" data-q-year="${q.id}" value="${esc(q.year)}" placeholder="Year">
        <input type="text" data-q-score="${q.id}" value="${esc(q.score)}" placeholder="Score">
        <button class="btn primary" data-save-qual="${q.id}">Save</button>
        <button class="btn" data-cancel-qual="${q.id}">Cancel</button>
      </div>
    </div>`).join('')
    : '<div class="empty"><span class="big">🎓</span>Abhi koi qualification nahi. Left side se add karo.</div>';
}

async function loadContent(){
  const { data, error } = await sb.from('site_content').select('*');
  if(error) return;
  state.content = {};
  (data || []).forEach(row => { state.content[row.key] = row.value || ''; });
  IMAGE_SLOTS.forEach(slot => {
    const area = document.querySelector('[data-text="' + slot.textKey + '"]');
    if(area) area.value = state.content[slot.textKey] || '';
  });
  const vision = document.getElementById('visionText');
  vision.value = state.content.vision_body || '';
  syncVisionButtons();
}

async function loadImages(){
  const { data, error } = await sb.from('site_images').select('*');
  if(error) return;
  state.images = {};
  (data || []).forEach(row => { state.images[row.key] = row.url || ''; });
  IMAGE_SLOTS.forEach(slot => paintImage(slot.key));
}

/* ---------------- IMAGE PANEL ---------------- */
function renderImageCards(){
  const wrap = document.getElementById('imagesWrap');
  wrap.innerHTML = IMAGE_SLOTS.map(slot => `
    <div class="img-card" data-slot="${slot.key}">
      <div class="img-head">
        <h3>${slot.title}</h3>
        <span class="pill" data-pill="${slot.key}">Checking…</span>
      </div>
      <div class="preview" data-preview="${slot.key}">No image set</div>
      <div class="row-btns">
        <button class="btn ghost" data-pick="${slot.key}">Edit Image</button>
        <button class="btn primary" data-save-image="${slot.key}" disabled>Save Image</button>
        <button class="btn danger" data-del-image="${slot.key}">Delete Image</button>
      </div>
      <input type="file" accept="image/*" class="hidden" data-file="${slot.key}">
      <div class="text-edit">
        <div class="row-btns">
          <button class="btn ghost" data-toggle-text="${slot.textKey}">Add Text</button>
          <button class="btn primary" data-save-text="${slot.textKey}" disabled>Save Text</button>
        </div>
        <div class="field" style="margin-top:12px;">
          <textarea data-text="${slot.textKey}" placeholder="${esc(slot.hint)}"></textarea>
        </div>
        <p class="hint">${slot.hint}</p>
      </div>
    </div>`).join('');
  IMAGE_SLOTS.forEach(slot => {
    const area = wrap.querySelector('[data-text="' + slot.textKey + '"]');
    area.addEventListener('input', function(){
      wrap.querySelector('[data-save-text="' + slot.textKey + '"]').disabled = false;
    });
  });
}

function paintImage(key){
  const preview = document.querySelector('[data-preview="' + key + '"]');
  const pill = document.querySelector('[data-pill="' + key + '"]');
  const saveBtn = document.querySelector('[data-save-image="' + key + '"]');
  const delBtn = document.querySelector('[data-del-image="' + key + '"]');
  const url = state.images[key] || '';
  if(pendingFiles[key]){
    preview.style.backgroundImage = 'url(' + pendingFiles[key].preview + ')';
    preview.textContent = '';
    pill.textContent = 'Preview ready — save karein';
    saveBtn.disabled = false;
    delBtn.disabled = false;
    return;
  }
  if(url){
    preview.style.backgroundImage = 'url("' + url + '")';
    preview.textContent = '';
    pill.textContent = 'Image set';
  }else{
    preview.style.backgroundImage = '';
    preview.textContent = 'No image set';
    pill.textContent = 'Empty';
  }
  saveBtn.disabled = true;
  delBtn.disabled = !url;
}

document.getElementById('imagesWrap').addEventListener('click', async function(e){
  const pick = e.target.closest('[data-pick]');
  const saveImg = e.target.closest('[data-save-image]');
  const delImg = e.target.closest('[data-del-image]');
  const toggle = e.target.closest('[data-toggle-text]');
  const saveText = e.target.closest('[data-save-text]');

  if(pick){
    document.querySelector('[data-file="' + pick.dataset.pick + '"]').click();
    return;
  }
  if(saveImg){
    const key = saveImg.dataset.saveImage;
    const file = pendingFiles[key];
    if(!file){ toast('Pehle "Edit Image" se file choose karo', 'err'); return; }
    busy(saveImg, true, 'Uploading…');
    const path = key + '/' + Date.now() + '-' + file.name.replace(/[^\w.\-]+/g, '_');
    const { error } = await withTimeout(
      sb.storage.from(BUCKET).upload(path, file, { cacheControl:'3600', upsert:false }),
      60000,
      'Upload 60 second me complete nahi hua'
    );
    if(error){
      busy(saveImg, false);
      toast('Upload fail: ' + error.message, 'err');
      return;
    }
    const { data } = sb.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = data.publicUrl;
    const { error: dbErr } = await sb.from('site_images').upsert({ key, url: publicUrl, updated_at:new Date().toISOString() });
    if(dbErr){
      busy(saveImg, false);
      toast('Save fail: ' + dbErr.message, 'err');
      return;
    }
    state.images[key] = publicUrl;
    delete pendingFiles[key];
    await removeOldFiles(key, path);
    busy(saveImg, false);
    toast('Image save ho gayi — portfolio me live hai', 'ok');
    paintImage(key);
    return;
  }
  if(delImg){
    const key = delImg.dataset.delImage;
    if(!confirm('Ye image delete karni hai?')) return;
    busy(delImg, true, 'Deleting…');
    await removeOldFiles(key, null);
    const { error } = await sb.from('site_images').upsert({ key, url:'', updated_at:new Date().toISOString() });
    busy(delImg, false);
    if(error){ toast('Delete fail: ' + error.message, 'err'); return; }
    state.images[key] = '';
    delete pendingFiles[key];
    toast('Image delete ho gayi', 'ok');
    paintImage(key);
    return;
  }
  if(toggle){
    const area = document.querySelector('[data-text="' + toggle.dataset.toggleText + '"]');
    toggle.textContent = area.value.trim() ? 'Edit Text' : 'Add Text';
    document.querySelector('[data-save-text="' + toggle.dataset.toggleText + '"]').disabled = !area.value.trim();
    area.focus();
    return;
  }
  if(saveText){
    const key = saveText.dataset.saveText;
    const area = document.querySelector('[data-text="' + key + '"]');
    busy(saveText, true, 'Saving…');
    const { error } = await sb.from('site_content').upsert({ key, value:area.value, updated_at:new Date().toISOString() });
    busy(saveText, false);
    if(error){ toast('Save fail: ' + error.message, 'err'); return; }
    state.content[key] = area.value;
    toast('Text save ho gaya — portfolio me live hai', 'ok');
  }
});

document.getElementById('imagesWrap').addEventListener('change', function(e){
  const input = e.target.closest('[data-file]');
  if(!input || !input.files || !input.files[0]) return;
  const key = input.dataset.file;
  const file = input.files[0];
  if(file.size > 6 * 1024 * 1024){ toast('Image 6 MB se choti honi chahiye', 'err'); input.value = ''; return; }
  pendingFiles[key] = { file, preview:URL.createObjectURL(file) };
  paintImage(key);
  toast('Preview ready. Ab "Save Image" dabao.', 'ok');
});

async function removeOldFiles(key, keepPath){
  try{
    const { data } = await sb.storage.from(BUCKET).list(key);
    const files = (data || []).map(f => key + '/' + f.name).filter(p => p !== keepPath);
    if(files.length) await sb.storage.from(BUCKET).remove(files);
  }catch(err){ /* storage cleanup optional */ }
}

/* ---------------- PROJECTS ---------------- */
document.getElementById('projectForm').addEventListener('submit', async function(e){
  e.preventDefault();
  const btn = document.getElementById('projectSubmit');
  const payload = {
    title: document.getElementById('pTitle').value.trim(),
    description: document.getElementById('pDesc').value.trim(),
    live_link: document.getElementById('pLink').value.trim(),
    tech_stack: document.getElementById('pTech').value.trim(),
    emoji: document.getElementById('pEmoji').value.trim() || '🚀'
  };
  if(!payload.title){ toast('Title likhna zaroori hai', 'err'); return; }
  const wasEditing = Boolean(editingProjectId);
  busy(btn, true, 'Saving…');
  let error;
  if(wasEditing){
    ({ error } = await sb.from('projects').update(payload).eq('id', editingProjectId));
  }else{
    ({ error } = await sb.from('projects').insert(payload));
  }
  busy(btn, false);
  if(error){ toast('Save fail: ' + error.message, 'err'); return; }
  this.reset();
  editingProjectId = null;
  btn.textContent = 'Save Project';
  toast(wasEditing ? 'Project update ho gaya' : 'Project add ho gaya', 'ok');
  loadProjects();
});

document.getElementById('projectsList').addEventListener('click', async function(e){
  const edit = e.target.closest('[data-edit-project]');
  const del = e.target.closest('[data-del-project]');
  if(edit){
    const p = state.projects.find(x => x.id === edit.dataset.editProject);
    if(!p) return;
    editingProjectId = p.id;
    document.getElementById('pTitle').value = p.title || '';
    document.getElementById('pDesc').value = p.description || '';
    document.getElementById('pLink').value = p.live_link || '';
    document.getElementById('pTech').value = p.tech_stack || '';
    document.getElementById('pEmoji').value = p.emoji || '';
    const btn = document.getElementById('projectSubmit');
    btn.textContent = 'Update Project';
    window.scrollTo({ top:0, behavior:'smooth' });
    toast('Edit karo aur "Update Project" dabao', 'ok');
  }
  if(del){
    if(!confirm('Ye project delete karna hai?')) return;
    busy(del, true, 'Deleting…');
    const { error } = await sb.from('projects').delete().eq('id', del.dataset.delProject);
    busy(del, false);
    if(error){ toast('Delete fail: ' + error.message, 'err'); return; }
    toast('Project delete ho gaya', 'ok');
    loadProjects();
  }
});

/* ---------------- QUALIFICATIONS ---------------- */
document.getElementById('qualForm').addEventListener('submit', async function(e){
  e.preventDefault();
  const btn = document.getElementById('qualSubmit');
  const degree = document.getElementById('qDegree').value.trim();
  if(!degree){ toast('Degree likhna zaroori hai', 'err'); return; }
  busy(btn, true, 'Saving…');
  const { error } = await sb.from('qualifications').insert({
    degree,
    institute: document.getElementById('qInstitute').value.trim(),
    year: document.getElementById('qYear').value.trim(),
    score: document.getElementById('qScore').value.trim(),
    sort_order: state.quals.length + 1
  });
  busy(btn, false);
  if(error){ toast('Save fail: ' + error.message, 'err'); return; }
  this.reset();
  toast('Qualification add ho gayi', 'ok');
  loadQuals();
});

document.getElementById('qualsList').addEventListener('click', async function(e){
  const edit = e.target.closest('[data-edit-qual]');
  const del = e.target.closest('[data-del-qual]');
  const save = e.target.closest('[data-save-qual]');
  const cancel = e.target.closest('[data-cancel-qual]');
  if(edit){
    document.querySelector('[data-qual-edit="' + edit.dataset.editQual + '"]').classList.remove('hidden');
    return;
  }
  if(cancel){
    document.querySelector('[data-qual-edit="' + cancel.dataset.cancelQual + '"]').classList.add('hidden');
    return;
  }
  if(save){
    const id = save.dataset.saveQual;
    busy(save, true, 'Saving…');
    const { error } = await sb.from('qualifications').update({
      degree: document.querySelector('[data-q-degree="' + id + '"]').value.trim(),
      institute: document.querySelector('[data-q-institute="' + id + '"]').value.trim(),
      year: document.querySelector('[data-q-year="' + id + '"]').value.trim(),
      score: document.querySelector('[data-q-score="' + id + '"]').value.trim()
    }).eq('id', id);
    busy(save, false);
    if(error){ toast('Save fail: ' + error.message, 'err'); return; }
    document.querySelector('[data-qual-edit="' + id + '"]').classList.add('hidden');
    toast('Qualification update ho gayi', 'ok');
    loadQuals();
    return;
  }
  if(del){
    if(!confirm('Ye qualification delete karni hai?')) return;
    busy(del, true, 'Deleting…');
    const { error } = await sb.from('qualifications').delete().eq('id', del.dataset.delQual);
    busy(del, false);
    if(error){ toast('Delete fail: ' + error.message, 'err'); return; }
    toast('Qualification delete ho gayi', 'ok');
    loadQuals();
  }
});

/* ---------------- CAPABILITIES ---------------- */
document.getElementById('toolForm').addEventListener('submit', async function(e){
  e.preventDefault();
  const btn = document.getElementById('toolSubmit');
  const name = document.getElementById('tName').value.trim();
  if(!name){ toast('Tool ka naam likho', 'err'); return; }
  busy(btn, true, 'Adding…');
  const { error } = await sb.from('capabilities').insert({
    name,
    icon: document.getElementById('tIcon').value.trim() || '⚡',
    sort_order: state.tools.length + 1
  });
  busy(btn, false);
  if(error){ toast('Add fail: ' + error.message, 'err'); return; }
  this.reset();
  toast('Tool add ho gaya', 'ok');
  loadTools();
});

document.getElementById('toolsChips').addEventListener('click', async function(e){
  const del = e.target.closest('[data-del-tool]');
  if(!del) return;
  if(!confirm('Ye tool hatana hai?')) return;
  const { error } = await sb.from('capabilities').delete().eq('id', del.dataset.delTool);
  if(error){ toast('Delete fail: ' + error.message, 'err'); return; }
  toast('Tool hata diya', 'ok');
  loadTools();
});

/* ---------------- VISION ---------------- */
function syncVisionButtons(){
  const area = document.getElementById('visionText');
  const editBtn = document.getElementById('visionEdit');
  const saveBtn = document.getElementById('visionSave');
  const hasText = Boolean(area.value.trim());
  editBtn.textContent = hasText ? 'Edit Text' : 'Add Text';
  saveBtn.disabled = !hasText;
}
document.getElementById('visionEdit').addEventListener('click', function(){
  document.getElementById('visionText').focus();
  document.getElementById('visionSave').disabled = !document.getElementById('visionText').value.trim();
});
document.getElementById('visionText').addEventListener('input', function(){
  document.getElementById('visionSave').disabled = !this.value.trim();
});
document.getElementById('visionSave').addEventListener('click', async function(){
  const btn = this;
  const value = document.getElementById('visionText').value;
  busy(btn, true, 'Saving…');
  const { error } = await sb.from('site_content').upsert({ key:'vision_body', value, updated_at:new Date().toISOString() });
  busy(btn, false);
  if(error){ toast('Save fail: ' + error.message, 'err'); return; }
  toast('Vision save ho gaya — portfolio me live hai', 'ok');
  syncVisionButtons();
});

/* ---------------- BLOGS ---------------- */
document.getElementById('addBlogBtn').addEventListener('click', function(){ openBlogModal(); });
function openBlogModal(){
  editingBlogId = null;
  document.getElementById('blogModalTitle').textContent = 'Add Blog';
  document.getElementById('blogForm').reset();
  openModal('blogModal');
}
document.getElementById('blogsList').addEventListener('click', function(e){
  const edit = e.target.closest('[data-edit-blog]');
  const del = e.target.closest('[data-del-blog]');
  if(edit){
    const b = state.blogs.find(x => x.id === edit.dataset.editBlog);
    if(!b) return;
    editingBlogId = b.id;
    document.getElementById('blogModalTitle').textContent = 'Edit Blog';
    document.getElementById('bTitle').value = b.title || '';
    document.getElementById('bContent').value = b.content || '';
    document.getElementById('bCat').value = b.category || '';
    document.getElementById('bImage').value = b.cover_image || '';
    document.getElementById('bEmoji').value = b.emoji || '';
    openModal('blogModal');
    return;
  }
  if(del){
    if(!confirm('Ye blog delete karna hai?')) return;
    busy(del, true, 'Deleting…');
    sb.from('blogs').delete().eq('id', del.dataset.delBlog).then(({ error }) => {
      busy(del, false);
      if(error){ toast('Delete fail: ' + error.message, 'err'); return; }
      toast('Blog delete ho gaya', 'ok');
      loadBlogs();
    });
  }
});
document.getElementById('blogForm').addEventListener('submit', async function(e){
  e.preventDefault();
  const btn = document.getElementById('blogSubmit');
  const payload = {
    title: document.getElementById('bTitle').value.trim(),
    content: document.getElementById('bContent').value.trim(),
    category: document.getElementById('bCat').value.trim() || 'General',
    cover_image: document.getElementById('bImage').value.trim(),
    emoji: document.getElementById('bEmoji').value.trim() || '📝'
  };
  busy(btn, true, 'Saving…');
  let error;
  if(editingBlogId){ ({ error } = await sb.from('blogs').update(payload).eq('id', editingBlogId)); }
  else { ({ error } = await sb.from('blogs').insert(payload)); }
  busy(btn, false);
  if(error){ toast('Save fail: ' + error.message, 'err'); return; }
  closeModal('blogModal');
  toast('Blog save ho gaya', 'ok');
  loadBlogs();
});

/* ---------------- PASSWORD ---------------- */
document.getElementById('pwForm').addEventListener('submit', async function(e){
  e.preventDefault();
  const btn = document.getElementById('pwSubmit');
  const current = document.getElementById('pwCurrent').value;
  const next = document.getElementById('pwNew').value;
  const confirm = document.getElementById('pwConfirm').value;
  if(!currentUser){ setStatus('pwStatus', 'Pehle login karo', false); return; }
  if(next.length < 6){ setStatus('pwStatus', 'New password kam se kam 6 characters ka hona chahiye', false); return; }
  if(next !== confirm){ setStatus('pwStatus', 'New password aur confirm password match nahi kar rahe', false); return; }
  busy(btn, true, 'Updating…');
  setStatus('pwStatus', 'Checking current password...', true);
  const { error: authErr } = await sb.auth.signInWithPassword({ email:currentUser.email, password:current });
  if(authErr){
    busy(btn, false);
    setStatus('pwStatus', 'Current password galat hai', false);
    return;
  }
  const { error } = await sb.auth.updateUser({ password:next });
  busy(btn, false);
  if(error){ setStatus('pwStatus', 'Update fail: ' + error.message, false); return; }
  e.target.reset();
  setStatus('pwStatus', 'Password update ho gaya', true);
  toast('Password update ho gaya', 'ok');
});

/* ---------------- FORGOT PASSWORD ---------------- */
const forgotModal = document.getElementById('forgotModal');
const forgotErr = document.getElementById('forgotErr');
let forgotEmail = '';
let forgotStep = 1;

function openForgotAtStep(step){
  forgotStep = step;
  document.getElementById('forgotStep1').classList.toggle('hidden', step !== 1);
  document.getElementById('forgotStep2').classList.toggle('hidden', step !== 2);
  document.getElementById('forgotStep3').classList.toggle('hidden', step !== 3);
  ['fs1','fs2','fs3'].forEach((id, i) => document.getElementById(id).classList.toggle('active', i === step - 1));
  const next = document.getElementById('forgotNext');
  next.textContent = step === 1 ? 'Send reset code' : step === 2 ? 'Verify code' : 'Set new password';
  if(currentUser) document.getElementById('fpEmail').value = currentUser.email;
  openModal('forgotModal');
}

document.getElementById('forgotLink').addEventListener('click', function(){
  forgotErr.textContent = '';
  document.getElementById('fpCode').value = '';
  document.getElementById('fpNew').value = '';
  document.getElementById('fpConfirm').value = '';
  openForgotAtStep(1);
});

document.getElementById('fpSend').addEventListener('click', function(){
  const email = document.getElementById('fpEmail2').value.trim();
  if(!email){ setStatus('fpStatus', 'Email daalo', false); return; }
  busy(this, true, 'Sending…');
  sb.auth.resetPasswordForEmail(email, { redirectTo:location.origin + '/admin' }).then(({ error }) => {
    busy(this, false);
    if(error){ setStatus('fpStatus', 'Send fail: ' + error.message, false); return; }
    setStatus('fpStatus', 'Reset code bhej diya — email check karo', true);
    toast('Reset code bhej diya gaya', 'ok');
    document.getElementById('fpEmail').value = email;
    openForgotAtStep(2);
  });
});

document.getElementById('forgotNext').addEventListener('click', async function(){
  const btn = this;
  forgotErr.textContent = '';
  if(forgotStep === 1){
    const email = document.getElementById('fpEmail').value.trim();
    if(!email){ forgotErr.textContent = 'Email daalo'; return; }
    forgotEmail = email;
    busy(btn, true, 'Sending…');
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo:location.origin + '/admin' });
    busy(btn, false);
    if(error){ forgotErr.textContent = 'Send fail: ' + error.message; return; }
    openForgotAtStep(2);
    return;
  }
  if(forgotStep === 2){
    const code = document.getElementById('fpCode').value.trim();
    if(!code){ forgotErr.textContent = 'Code daalo'; return; }
    busy(btn, true, 'Verifying…');
    const { error } = await sb.auth.verifyOtp({ email:forgotEmail, token:code, type:'recovery' });
    busy(btn, false);
    if(error){ forgotErr.textContent = 'Code galat ya expire ho gaya: ' + error.message; return; }
    openForgotAtStep(3);
    return;
  }
  const next = document.getElementById('fpNew').value;
  const confirmPw = document.getElementById('fpConfirm').value;
  if(next.length < 6){ forgotErr.textContent = 'Password kam se kam 6 characters ka ho'; return; }
  if(next !== confirmPw){ forgotErr.textContent = 'New password aur confirm match nahi kar rahe'; return; }
  busy(btn, true, 'Saving…');
  const { error } = await sb.auth.updateUser({ password:next });
  busy(btn, false);
  if(error){ forgotErr.textContent = 'Reset fail: ' + error.message; return; }
  closeModal('forgotModal');
  toast('Password reset ho gaya — naye password se login karo', 'ok');
  await sb.auth.signOut();
  showLogin('Password reset ho gaya. Naye password se login karo.');
});

renderImageCards();
initAuth();