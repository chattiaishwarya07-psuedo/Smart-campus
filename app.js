// Adaptive CampusHub (vanilla JS) - supports desktop sidebar + mobile collapsible sidebar
const KEY = 'campushub_adaptive';
const DEFAULT = {
  users: [
    { id: 'u_admin', name: 'Campus Admin', role: 'admin', dept: 'All' },
    { id: 'u_club1', name: 'Photography Club', role: 'club', dept: 'Arts' },
    { id: 'u_student1', name: 'Asha Patel', role: 'student', dept: 'CS' },
    { id: 'u_student2', name: 'Rohan Mehta', role: 'student', dept: 'CS' }
  ],
  events: [
    { id: 'e1', title: 'Freshers Orientation', desc: 'Welcome to new students!', club: null, dept: 'All', type: 'General', date: '2025-11-10', createdAt: new Date().toISOString(), capacity: 200, attendees: [], xp: 20, ratings: [] },
    { id: 'e2', title: 'Art Workshop', desc: 'Watercolor session', club: 'Photography Club', dept: 'Arts', type: 'Workshop', date: '2025-11-12', createdAt: new Date().toISOString(), capacity: 30, attendees: [], xp: 15, ratings: [] },
  ],
  announcements: [
    { id: 'a1', title: 'Library Timings', body: 'Library extended till 9pm during exams', createdAt: new Date().toISOString(), author: 'u_admin', tags: ['library'] },
  ],
  lostFound: [
    { id: 'l1', title: 'Lost: Black Backpack', desc: 'Lost near cafeteria', contact: 'asha@campus.edu', found: false, createdAt: new Date().toISOString(), author: 'u_student1' },
  ],
  timetable: [
    { id: 't1', day: 'Mon', slot: '09:00 - 10:00', course: 'Algorithms', teacher: 'Dr. Rao', room: 'C-201', dept: 'CS' },
    { id: 't2', day: 'Wed', slot: '11:00 - 12:00', course: 'System Design', teacher: 'Prof. Sen', room: 'C-205', dept: 'CS' },
  ],
  xp: { 'u_student1': 20, 'u_student2': 10 }
};

function load(){ try{ return JSON.parse(localStorage.getItem(KEY)) || DEFAULT; } catch(e){ return DEFAULT; } }
function save(s){ localStorage.setItem(KEY, JSON.stringify(s)); }

let store = load();
let currentUserId = localStorage.getItem('campushub_user') || 'u_student1';
let route = 'dashboard';

const sidebar = document.getElementById('sidebar');
const menuToggle = document.getElementById('menuToggle');
const roleSwitch = document.getElementById('roleSwitch');
const aiBtn = document.getElementById('aiBtn');
const modal = document.getElementById('modal');
const content = document.getElementById('content');
const search = document.getElementById('search');
const filterDept = document.getElementById('filterDept');
const filterClub = document.getElementById('filterClub');
const filterType = document.getElementById('filterType');

menuToggle.addEventListener('click', ()=> sidebar.classList.toggle('open'));
roleSwitch.addEventListener('change', ()=> { const role = roleSwitch.value; const u = store.users.find(x=>x.role===role) || store.users[0]; currentUserId = u.id; localStorage.setItem('campushub_user', currentUserId); updateProfile(); render(); });
aiBtn.addEventListener('click', ()=> alert(aiSummary()));
search.addEventListener('input', render);
filterDept.addEventListener('change', render);
filterClub.addEventListener('change', render);
filterType.addEventListener('change', render);

function uid(){ return Math.random().toString(36).slice(2,9); }
function now(){ return new Date().toISOString(); }
function currentUser(){ return store.users.find(u=>u.id===currentUserId) || store.users[0]; }

function aiSummary(){
  const upcoming = store.events.filter(e=>{ const d=new Date(e.date); const now=new Date(); const diff=(d-now)/(1000*60*60*24); return diff>=0 && diff<=7; });
  const ann = store.announcements.slice(0,2).map(a=>a.title).join('; ');
  let res = upcoming.length ? `You have ${upcoming.length} upcoming event(s) this week. ` : '';
  if(ann) res += `Recent: ${ann}.`;
  if(!res) res='No urgent updates.';
  return res;
}

function updateProfile(){
  const u = currentUser();
  document.getElementById('avatar').textContent = (u.name||'U').split(' ').map(p=>p[0]).slice(0,2).join('');
  document.getElementById('username').textContent = u.name;
  document.getElementById('userrole').textContent = `${u.role} • ${u.dept}`;
  roleSwitch.value = u.role;
}

function setRoute(r){ route=r; document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active', b.dataset.route===r)); render(); if(window.innerWidth<=980) sidebar.classList.remove('open'); }

document.querySelectorAll('.nav button').forEach(b=> b.addEventListener('click', ()=> setRoute(b.dataset.route)));

function render(){
  updateProfile();
  const q = search.value.toLowerCase();
  if(route==='dashboard') return renderDashboard({q});
  if(route==='events') return renderEvents({q});
  if(route==='announcements') return renderAnnouncements({q});
  if(route==='noticeboard') return renderNoticeboard();
  if(route==='timetable') return renderTimetable();
  if(route==='leaderboard') return renderLeaderboard();
  if(route==='lostfound') return renderLostFound();
  if(route==='profile') return renderProfile();
  renderDashboard({q});
}

// --- Renderers ---
function clear(){ content.innerHTML=''; }

function renderDashboard({q}){
  clear();
  const u = currentUser();
  const card = el('div','card'); card.innerHTML = `<div class="row" style="justify-content:space-between"><div><h2>Welcome, ${u.name}</h2><div class="muted">Role: ${u.role} • Dept: ${u.dept}</div></div><div><button id="newEvent" class="btn">Create Event</button></div></div><p class="muted" style="margin-top:8px">${aiSummary()}</p>`;
  content.appendChild(card);
  document.getElementById('newEvent').addEventListener('click', ()=> openEventModal());

  const eventsCard = el('div','card'); eventsCard.innerHTML = '<h3>Upcoming Events</h3>';
  const list = el('div');
  const filtered = store.events.filter(e=>{ if(q && !e.title.toLowerCase().includes(q) && !e.desc.toLowerCase().includes(q)) return false; if(filterDept.value!=='All' && e.dept!==filterDept.value) return false; if(filterClub.value!=='All' && e.club!==filterClub.value) return false; if(filterType.value!=='All' && e.type!==filterType.value) return false; return true; }).sort((a,b)=>new Date(a.date)-new Date(b.date));
  filtered.slice(0,8).forEach(e=>{
    const item = el('div','event');
    item.innerHTML = `<div><strong>${e.title}</strong><div class="meta">${e.date} • ${e.type} • Dept: ${e.dept} • Club: ${e.club||'—'}</div></div><div class="row"><button class="small btn" data-id="${e.id}">View</button></div>`;
    list.appendChild(item);
    item.querySelector('button').addEventListener('click', ()=> openEventDetail(e.id));
  });
  eventsCard.appendChild(list); content.appendChild(eventsCard);

  const annCard = el('div','card'); annCard.innerHTML = '<h3>Announcements</h3>';
  store.announcements.slice(0,4).forEach(a=>{ const d = el('div'); d.className='row'; d.style.justifyContent='space-between'; d.innerHTML = `<div><strong>${a.title}</strong><div class="meta">${a.createdAt.split('T')[0]}</div></div><div><button class="small btn ghost" data-id="${a.id}">Open</button></div>`; annCard.appendChild(d); d.querySelector('button').addEventListener('click', ()=> openAnnouncement(a.id)); });
  content.appendChild(annCard);
}

function renderEvents(q){
  clear();
  const top = el('div','card row'); top.innerHTML = `<div style="flex:1"><h3>Events</h3><div class="muted">Create, edit, RSVP and rate events.</div></div><div><button class="btn" id="newEv">New Event</button></div>`; content.appendChild(top);
  document.getElementById('newEv').addEventListener('click', ()=> openEventModal());
  store.events.forEach(e=>{
    const card = el('div','card');
    card.innerHTML = `<div class="row" style="justify-content:space-between"><div style="flex:1"><strong>${e.title}</strong><div class="meta">${e.date} • ${e.type} • Dept: ${e.dept}</div><div style="margin-top:8px">${e.desc}</div></div><div style="display:flex;flex-direction:column;gap:8px"><button class="btn small" data-id="${e.id}">View</button><button class="small btn ghost" data-edit="${e.id}">Edit</button><button class="small" data-del="${e.id}">Delete</button></div></div>`;
    content.appendChild(card);
    card.querySelector('[data-id]').addEventListener('click', ()=> openEventDetail(e.id));
    card.querySelector('[data-edit]').addEventListener('click', ()=> openEventModal(e.id));
    card.querySelector('[data-del]').addEventListener('click', ()=>{ if(confirm('Delete event?')){ store.events = store.events.filter(x=>x.id!==e.id); save(store); render(); } });
  });
}

function renderAnnouncements(){
  clear();
  const top = el('div','card row'); top.innerHTML = `<div style="flex:1"><h3>Announcements</h3><div class="muted">Post important messages</div></div><div><button class="btn" id="newAnn">New</button></div>`; content.appendChild(top);
  document.getElementById('newAnn').addEventListener('click', ()=> openAnnouncementModal());
  store.announcements.forEach(a=>{ const c = el('div','card'); c.innerHTML = `<strong>${a.title}</strong><div class="meta">${a.createdAt.split('T')[0]}</div><p style="margin-top:8px">${a.body}</p><div style="margin-top:8px"><button class="small" data-del="${a.id}">Delete</button></div>`; content.appendChild(c); c.querySelector('[data-del]').addEventListener('click', ()=>{ if(confirm('Remove announcement?')){ store.announcements = store.announcements.filter(x=>x.id!==a.id); save(store); render(); } }); });
}

function renderNoticeboard(){ clear(); const c = el('div','card'); c.innerHTML = '<h3>Noticeboard</h3><div class="muted">Combined stream of notices & lost items.</div>'; content.appendChild(c); const feed = el('div'); store.announcements.concat(store.lostFound).slice(0,20).forEach(item=>{ const it = el('div','card'); it.innerHTML = `<strong>${item.title}</strong><div class="meta">${item.createdAt?item.createdAt.split('T')[0]:''}</div><p style="margin-top:8px">${item.body||item.desc||''}</p>`; feed.appendChild(it); }); content.appendChild(feed); }

function renderTimetable(){ clear(); const c = el('div','card'); c.innerHTML = '<h3>Timetable</h3><div class="muted">Your class schedule</div>'; content.appendChild(c); store.timetable.forEach(t=>{ const r = el('div','card'); r.innerHTML = `<strong>${t.course}</strong><div class="meta">${t.day} • ${t.slot} • ${t.room} • ${t.teacher}</div>`; content.appendChild(r); }); }

function renderLeaderboard(){ clear(); const c = el('div','card'); c.innerHTML = '<h3>Leaderboard</h3><div class="muted">Top participants by XP</div>'; content.appendChild(c); const list = el('div'); Object.entries(store.xp).sort((a,b)=>b[1]-a[1]).forEach(([uid,xp],i)=>{ const u = store.users.find(x=>x.id===uid)||{name:uid}; const it = el('div','card row'); it.innerHTML = `<div style="flex:1"><strong>${i+1}. ${u.name}</strong><div class="meta">XP: ${xp}</div></div>`; list.appendChild(it); }); content.appendChild(list); }

function renderLostFound(){ clear(); const top = el('div','card row'); top.innerHTML = `<div style="flex:1"><h3>Lost & Found</h3><div class="muted">Report or claim items</div></div><div><button class="btn" id="newLF">Report</button></div>`; content.appendChild(top); document.getElementById('newLF').addEventListener('click', ()=> openLostFound()); store.lostFound.forEach(l=>{ const it = el('div','card'); it.innerHTML = `<div class="row" style="justify-content:space-between"><div style="flex:1"><strong>${l.title}</strong><div class="meta">${l.createdAt.split('T')[0]}</div><div style="margin-top:8px">${l.desc}</div></div><div><button class="small" data-toggle="${l.id}">${l.found?'Found':'Claim'}</button></div></div>`; content.appendChild(it); it.querySelector('[data-toggle]').addEventListener('click', ()=>{ l.found = !l.found; save(store); render(); }); }); }

function renderProfile(){ clear(); const u = currentUser(); const c = el('div','card'); c.innerHTML = `<h3>Profile</h3><div class="muted">Name: ${u.name} • Role: ${u.role} • Dept: ${u.dept}</div><div style="margin-top:12px"><button class="btn" id="editPf">Edit</button></div>`; content.appendChild(c); document.getElementById('editPf').addEventListener('click', ()=> openProfile(u.id)); }

// --- Modals & interactions ---
function openModal(html){ modal.innerHTML = `<div class="dialog">${html}</div>`; modal.classList.remove('hidden'); modal.addEventListener('click', (e)=>{ if(e.target===modal) closeModal(); }); }
function closeModal(){ modal.classList.add('hidden'); modal.innerHTML=''; }

function openEventModal(id){ const e = store.events.find(x=>x.id===id) || {title:'',desc:'',club:'',dept:'All',type:'General',date:new Date().toISOString().slice(0,10),capacity:50,xp:10}; openModal(`<h3>${id?'Edit Event':'New Event'}</h3><label>Title<input id="ev_title" value="${e.title}" /></label><label>Description<textarea id="ev_desc">${e.desc||''}</textarea></label><label>Club<input id="ev_club" value="${e.club||''}" /></label><label>Dept<select id="ev_dept"><option>All</option><option>CS</option><option>Arts</option></select></label><label>Type<select id="ev_type"><option>General</option><option>Workshop</option><option>Seminar</option></select></label><label>Date<input id="ev_date" type="date" value="${e.date}" /></label><label>XP<input id="ev_xp" type="number" value="${e.xp||10}" /></label><div style="margin-top:12px"><button class="btn" id="saveEv">${id?'Save':'Create'}</button> <button class="small" id="cancelEv">Cancel</button></div>`); document.getElementById('cancelEv').addEventListener('click', closeModal); document.getElementById('saveEv').addEventListener('click', ()=>{ const title=document.getElementById('ev_title').value; if(!title) return alert('Title required'); const desc=document.getElementById('ev_desc').value; const club=document.getElementById('ev_club').value||null; const dept=document.getElementById('ev_dept').value; const type=document.getElementById('ev_type').value; const date=document.getElementById('ev_date').value; const xp=parseInt(document.getElementById('ev_xp').value)||10; if(id){ store.events = store.events.map(x=>x.id===id?{...x,title,desc,club,dept,type,date,xp}:x); } else { store.events.unshift({id:uid(),title,desc,club,dept,type,date,createdAt:now(),capacity:50,attendees:[],ratings:[],xp}); } save(store); closeModal(); render(); }); }

function openEventDetail(id){ const e = store.events.find(x=>x.id===id); if(!e) return alert('Event not found'); openModal(`<h3>${e.title}</h3><div class="muted">${e.date} • ${e.type} • Dept: ${e.dept}</div><p style="margin-top:8px">${e.desc}</p><div style="display:flex;gap:8px;margin-top:12px"><button class="btn" id="rsvpBtn">${e.attendees.includes(currentUserId)?'Cancel RSVP':'RSVP'}</button><button class="small" id="rateBtn">Rate</button><button class="small" id="closeEv">Close</button></div><div style="margin-top:12px"><strong>Attendees (${e.attendees.length}/${e.capacity}):</strong><div id="attList">${e.attendees.map(a=> (store.users.find(u=>u.id===a)||{name:a}).name).join(', ')||'—'}</div></div>`); document.getElementById('closeEv').addEventListener('click', closeModal); document.getElementById('rsvpBtn').addEventListener('click', ()=>{ if(e.attendees.includes(currentUserId)){ e.attendees=e.attendees.filter(x=>x!==currentUserId); store.xp[currentUserId]=Math.max(0,(store.xp[currentUserId]||0)-(e.xp||10)); } else { e.attendees.push(currentUserId); if(!store.xp[currentUserId]) store.xp[currentUserId]=0; store.xp[currentUserId]+=(e.xp||10); } store.events=store.events.map(x=>x.id===id?e:x); save(store); render(); openEventDetail(id); }); document.getElementById('rateBtn').addEventListener('click', ()=>{ const r=prompt('Rate like: 4 Great event')||''; const parts=r.split(' '); const score=Math.min(5,Math.max(1,parseInt(parts[0])||0)); const comment=parts.slice(1).join(' '); if(score>0){ e.ratings=e.ratings||[]; e.ratings.push({user:currentUserId,score,comment,at:now()}); save(store); alert('Thanks!'); } }); }

function openAnnouncementModal(){ openModal(`<h3>New Announcement</h3><label>Title<input id="ann_title" /></label><label>Body<textarea id="ann_body"></textarea></label><div style="margin-top:8px"><button class="btn" id="postAnn">Post</button> <button class="small" id="cancelAnn">Cancel</button></div>`); document.getElementById('cancelAnn').addEventListener('click', closeModal); document.getElementById('postAnn').addEventListener('click', ()=>{ const title=document.getElementById('ann_title').value; const body=document.getElementById('ann_body').value; if(!title) return alert('Title required'); store.announcements.unshift({id:uid(),title,body,author:currentUserId,createdAt:now(),tags:[]}); save(store); closeModal(); render(); }); }

function openAnnouncement(id){ const a=store.announcements.find(x=>x.id===id); if(!a) return; openModal(`<h3>${a.title}</h3><div class="meta">${a.createdAt.split('T')[0]}</div><p style="margin-top:8px">${a.body}</p><div style="margin-top:12px"><button class="small" id="closeA">Close</button></div>`); document.getElementById('closeA').addEventListener('click', closeModal); }

function openLostFound(){ openModal(`<h3>Report Lost Item</h3><label>Title<input id="lf_title" /></label><label>Description<textarea id="lf_desc"></textarea></label><label>Contact<input id="lf_contact" /></label><div style="margin-top:8px"><button class="btn" id="postLF">Post</button> <button class="small" id="cancelLF">Cancel</button></div>`); document.getElementById('cancelLF').addEventListener('click', closeModal); document.getElementById('postLF').addEventListener('click', ()=>{ const title=document.getElementById('lf_title').value; const desc=document.getElementById('lf_desc').value; const contact=document.getElementById('lf_contact').value; if(!title) return alert('Title required'); store.lostFound.unshift({id:uid(),title,desc,contact,found:false,createdAt:now(),author:currentUserId}); save(store); closeModal(); render(); }); }

function openProfile(id){ const u=store.users.find(x=>x.id===id); openModal(`<h3>Edit Profile</h3><label>Name<input id="pf_name" value="${u.name}" /></label><label>Dept<input id="pf_dept" value="${u.dept}" /></label><div style="margin-top:8px"><button class="btn" id="savePf">Save</button> <button class="small" id="cancelPf">Cancel</button></div>`); document.getElementById('cancelPf').addEventListener('click', closeModal); document.getElementById('savePf').addEventListener('click', ()=>{ u.name=document.getElementById('pf_name').value; u.dept=document.getElementById('pf_dept').value; save(store); closeModal(); render(); updateProfile(); }); }

function el(tag,cls){ const e=document.createElement(tag); if(cls) e.className=cls; return e; }

// init
function init(){ // populate filters
  const depts = Array.from(new Set(store.users.map(u=>u.dept).concat(store.events.map(e=>e.dept)).filter(Boolean)));
  depts.forEach(d=>{ if(!Array.from(filterDept.options).some(o=>o.value===d)) filterDept.add(new Option(d)); });
  const clubs = Array.from(new Set(store.events.map(e=>e.club).filter(Boolean)));
  clubs.forEach(c=>{ if(!Array.from(filterClub.options).some(o=>o.value===c)) filterClub.add(new Option(c)); });
  updateProfile();
  render();
}

init();
