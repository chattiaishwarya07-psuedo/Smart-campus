// CampusHub Modern - frontend-only (vanilla JS)
// Data persisted to localStorage under 'campushub_modern'.
// Features: multi-role mock auth, events/announcements CRUD, RSVP, ratings, XP leaderboard, noticeboard, timetable, lost & found, AI summary.

const KEY = 'campushub_modern';
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
function save(data){ localStorage.setItem(KEY, JSON.stringify(data)); }

let store = load();
let currentUserId = localStorage.getItem('campushub_user') || 'u_student1';
let route = 'dashboard';

const content = document.getElementById('content');
const modal = document.getElementById('modal');
const roleSwitch = document.getElementById('roleSwitch');
const notifBtn = document.getElementById('notifBtn');
const searchInput = document.getElementById('searchInput');
const filterDept = document.getElementById('filterDept');
const filterClub = document.getElementById('filterClub');
const filterType = document.getElementById('filterType');
const profileName = document.getElementById('profileName');
const profileRole = document.getElementById('profileRole');
const profileAvatar = document.getElementById('profileAvatar');
const userBadge = document.getElementById('userBadge');

function uid(){ return Math.random().toString(36).slice(2,9); }
function nowISO(){ return new Date().toISOString(); }
function currentUser(){ return store.users.find(u=>u.id===currentUserId) || store.users[0]; }

function setRoute(r){ route = r; document.querySelectorAll('.nav button').forEach(b=>b.classList.toggle('active', b.dataset.route===r)); render(); }

document.querySelectorAll('.nav button').forEach(b=>{
  b.addEventListener('click', ()=> setRoute(b.dataset.route));
});

roleSwitch.value = currentUser().role;
roleSwitch.addEventListener('change', ()=>{
  const role = roleSwitch.value;
  const u = store.users.find(x=>x.role===role) || store.users[0];
  currentUserId = u.id;
  localStorage.setItem('campushub_user', currentUserId);
  updateProfileHeader();
  render();
});

notifBtn.addEventListener('click', ()=> alert(aiSummary()));
searchInput.addEventListener('input', render);
filterDept.addEventListener('change', render);
filterClub.addEventListener('change', render);
filterType.addEventListener('change', render);

function aiSummary(){
  const upcoming = store.events.filter(e=>{
    const d = new Date(e.date);
    const now = new Date();
    const diff = (d - now)/(1000*60*60*24);
    return diff >=0 && diff <= 7;
  });
  let msg = '';
  if(upcoming.length) msg += `You have ${upcoming.length} upcoming event(s) within 7 days. `;
  if(store.announcements.length) msg += `Latest announcement: ${store.announcements[0].title}. `;
  const tomorrowDay = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][(new Date().getDay()+1)%7];
  const soonClass = store.timetable.find(t=>t.day===tomorrowDay && (currentUser().dept==='All' || t.dept===currentUser().dept));
  if(soonClass) msg += `Reminder: ${soonClass.course} on ${soonClass.day}.`;
  if(!msg) msg = 'No urgent updates.';
  return msg;
}

function updateProfileHeader(){
  const u = currentUser();
  profileName.textContent = u.name;
  profileRole.textContent = `${capitalize(u.role)} • ${u.dept}`;
  profileAvatar.textContent = (u.name||'U').split(' ').map(p=>p[0]).slice(0,2).join('');
  userBadge.textContent = profileAvatar.textContent;
}

function capitalize(s){ return s.charAt(0).toUpperCase()+s.slice(1); }

// Views
function render(){
  updateProfileHeader();
  const q = searchInput.value.toLowerCase();
  if(route==='dashboard') return renderDashboard({q});
  if(route==='events') return renderEvents({q});
  if(route==='announcements') return renderAnnouncements();
  if(route==='noticeboard') return renderNoticeboard();
  if(route==='timetable') return renderTimetable();
  if(route==='leaderboard') return renderLeaderboard();
  if(route==='lostfound') return renderLostFound();
  if(route==='profile') return renderProfile();
  renderDashboard({q});
}

function clear(){ content.innerHTML=''; }

function renderDashboard(filters){
  clear();
  const u = currentUser();
  const card = elt('div','card');
  card.innerHTML = `<div class="row" style="justify-content:space-between;align-items:center"><div><h2>Welcome, ${u.name}</h2><div class="muted">Role: ${u.role} • Dept: ${u.dept}</div></div>
    <div><button id="createEventBtn" class="btn">Create Event</button></div></div><p style="margin-top:10px" class="muted">${aiSummary()}</p>`;
  content.appendChild(card);
  document.getElementById('createEventBtn').addEventListener('click', ()=> openEventModal());

  const eventsCard = elt('div','card');
  eventsCard.innerHTML = '<h3>Upcoming Events</h3>';
  const list = elt('div');
  const filtered = store.events.filter(e=>{
    if(filters.q && filters.q.length && !(e.title.toLowerCase().includes(filters.q) || e.desc.toLowerCase().includes(filters.q))) return false;
    if(filterDept.value && filterDept.value!=='All' && e.dept!==filterDept.value) return false;
    if(filterClub.value && filterClub.value!=='All' && e.club!==filterClub.value) return false;
    if(filterType.value && filterType.value!=='All' && e.type!==filterType.value) return false;
    return true;
  }).sort((a,b)=> new Date(a.date)-new Date(b.date));
  filtered.slice(0,8).forEach(e=>{
    const div = elt('div','event');
    div.innerHTML = `<div><strong>${e.title}</strong><div class="meta">${e.date} • ${e.type} • Dept: ${e.dept} • Club: ${e.club||'—'}</div></div>
      <div class="row"><button class="small btn" data-id="${e.id}">View</button></div>`;
    list.appendChild(div);
    div.querySelector('button').addEventListener('click', ()=> openEventDetail(e.id));
  });
  eventsCard.appendChild(list);
  content.appendChild(eventsCard);

  const annCard = elt('div','card');
  annCard.innerHTML = '<h3>Latest Announcements</h3>';
  store.announcements.slice(0,4).forEach(a=>{
    const d = elt('div'); d.className='row'; d.style.justifyContent='space-between';
    d.innerHTML = `<div><strong>${a.title}</strong><div class="meta">${a.createdAt.split('T')[0]}</div></div>
      <div><button class="small btn ghost" data-id="${a.id}">Open</button></div>`;
    annCard.appendChild(d);
    d.querySelector('button').addEventListener('click', ()=> openAnnouncementDetail(a.id));
  });
  content.appendChild(annCard);
}

function renderEvents(){
  clear();
  const top = elt('div','card row');
  top.innerHTML = `<div style="flex:1"><h3>Events</h3><div class="muted">Create, edit, RSVP and rate events.</div></div>
    <div><button class="btn" id="newEventBtn">New Event</button></div>`;
  content.appendChild(top);
  document.getElementById('newEventBtn').addEventListener('click', ()=> openEventModal());

  const list = elt('div');
  store.events.forEach(e=>{
    const el = elt('div','card');
    el.innerHTML = `<div class="row"><div style="flex:1"><strong>${e.title}</strong><div class="meta">${e.date} • ${e.type} • Dept: ${e.dept} • Club: ${e.club||'—'}</div><div style="margin-top:8px">${e.desc}</div></div>
      <div style="display:flex;flex-direction:column;gap:8px">
        <button class="btn small" data-id="${e.id}">View</button>
        <button class="btn small ghost" data-edit="${e.id}">Edit</button>
        <button class="small" data-delete="${e.id}">Delete</button>
      </div></div>`;
    list.appendChild(el);
    el.querySelector('[data-id]').addEventListener('click', ()=> openEventDetail(e.id));
    el.querySelector('[data-edit]').addEventListener('click', ()=> openEventModal(e.id));
    el.querySelector('[data-delete]').addEventListener('click', ()=>{
      if(confirm('Delete this event?')){ store.events = store.events.filter(x=>x.id!==e.id); save(store); render(); }
    });
  });
  content.appendChild(list);
}

function renderAnnouncements(){
  clear();
  const top = elt('div','card row');
  top.innerHTML = `<div style="flex:1"><h3>Announcements</h3><div class="muted">Post important campus-wide messages.</div></div>
    <div><button class="btn" id="newAnnBtn">New</button></div>`;
  content.appendChild(top);
  document.getElementById('newAnnBtn').addEventListener('click', ()=> openAnnouncementModal());

  store.announcements.forEach(a=>{
    const el = elt('div','card');
    el.innerHTML = `<div class="row"><div style="flex:1"><strong>${a.title}</strong><div class="meta">${a.createdAt.split('T')[0]}</div><div style="margin-top:8px">${a.body}</div></div>
      <div><button class="small" data-delete="${a.id}">Delete</button></div></div>`;
    content.appendChild(el);
    el.querySelector('[data-delete]').addEventListener('click', ()=>{ if(confirm('Remove announcement?')){ store.announcements = store.announcements.filter(x=>x.id!==a.id); save(store); render(); }});
  });
}

function renderNoticeboard(){
  clear();
  const card = elt('div','card');
  card.innerHTML = '<h3>Noticeboard</h3><div class="muted">A public board for quick notes and shared items.</div>';
  content.appendChild(card);
  const board = elt('div');
  store.announcements.concat(store.lostFound).slice(0,20).forEach(item=>{
    const el = elt('div','card');
    el.innerHTML = `<strong>${item.title}</strong><div class="meta">${item.createdAt ? item.createdAt.split('T')[0] : ''}</div><div style="margin-top:6px">${item.body||item.desc||''}</div>`;
    board.appendChild(el);
  });
  content.appendChild(board);
}

function renderTimetable(){
  clear();
  const card = elt('div','card');
  card.innerHTML = '<h3>Timetable</h3><div class="muted">Integrated class timetable view.</div>';
  content.appendChild(card);
  const table = elt('div');
  store.timetable.forEach(t=>{
    const r = elt('div','card');
    r.innerHTML = `<strong>${t.course}</strong><div class="meta">${t.day} • ${t.slot} • ${t.room} • ${t.teacher}</div>`;
    table.appendChild(r);
  });
  content.appendChild(table);
}

function renderLeaderboard(){
  clear();
  const card = elt('div','card');
  card.innerHTML = '<h3>Leaderboard (XP)</h3><div class="muted">Top participants by XP</div>';
  content.appendChild(card);
  const list = elt('div');
  const entries = Object.entries(store.xp || {}).sort((a,b)=>b[1]-a[1]);
  entries.forEach(([uid,xp], idx)=>{
    const user = store.users.find(u=>u.id===uid) || {name:uid};
    const el = elt('div','card row');
    el.innerHTML = `<div style="flex:1"><strong>${idx+1}. ${user.name}</strong><div class="meta">XP: ${xp}</div></div>`;
    list.appendChild(el);
  });
  content.appendChild(list);
}

function renderLostFound(){
  clear();
  const top = elt('div','card row');
  top.innerHTML = `<div style="flex:1"><h3>Lost & Found</h3><div class="muted">Report or claim lost items.</div></div><div><button class="btn" id="newLF">Report</button></div>`;
  content.appendChild(top);
  document.getElementById('newLF').addEventListener('click', ()=> openLostFoundModal());

  store.lostFound.forEach(l=>{
    const el = elt('div','card');
    el.innerHTML = `<div class="row"><div style="flex:1"><strong>${l.title}</strong><div class="meta">${l.createdAt.split('T')[0]} • ${l.contact||''}</div><div style="margin-top:8px">${l.desc}</div></div>
      <div><button class="small" data-claim="${l.id}">${l.found ? 'Found' : 'Claim'}</button></div></div>`;
    content.appendChild(el);
    el.querySelector('[data-claim]').addEventListener('click', ()=>{
      l.found = !l.found; save(store); render();
    });
  });
}

function renderProfile(){
  clear();
  const user = currentUser();
  const card = elt('div','card');
  card.innerHTML = `<h3>Profile</h3><div class="muted">Name: ${user.name} • Role: ${user.role} • Dept: ${user.dept}</div>
    <div style="margin-top:12px"><button class="btn" id="editProfile">Edit</button></div>`;
  content.appendChild(card);
  document.getElementById('editProfile').addEventListener('click', ()=> openProfileModal(user.id));
}

// Helpers to create elements
function elt(tag, cls){ const e = document.createElement(tag); if(cls) e.className = cls; return e; }

// Modal functions
function openModal(html){ modal.innerHTML = `<div class="dialog">${html}</div>`; modal.classList.remove('hidden'); modal.addEventListener('click', (e)=>{ if(e.target===modal) closeModal(); }); }
function closeModal(){ modal.classList.add('hidden'); modal.innerHTML=''; }

function openEventModal(id){
  const ev = store.events.find(x=>x.id===id) || {title:'',desc:'',club:'',dept:'All',type:'General',date:new Date().toISOString().slice(0,10),capacity:50, xp:10};
  openModal(`<h3>${id? 'Edit Event':'New Event'}</h3>
    <label>Title<input id="ev_title" value="${ev.title}" /></label>
    <label>Description<textarea id="ev_desc">${ev.desc||''}</textarea></label>
    <label>Club<input id="ev_club" value="${ev.club||''}" /></label>
    <label>Department<select id="ev_dept"><option>All</option><option>CS</option><option>Arts</option></select></label>
    <label>Type<select id="ev_type"><option>General</option><option>Workshop</option><option>Seminar</option></select></label>
    <label>Date<input id="ev_date" type="date" value="${ev.date}" /></label>
    <label>XP Points<input id="ev_xp" type="number" value="${ev.xp||10}" /></label>
    <div style="margin-top:12px"><button class="btn" id="saveEv">${id? 'Save':'Create'}</button> <button class="small" id="cancelEv">Cancel</button></div>`);
  document.getElementById('cancelEv').addEventListener('click', closeModal);
  document.getElementById('saveEv').addEventListener('click', ()=>{
    const title = document.getElementById('ev_title').value;
    const desc = document.getElementById('ev_desc').value;
    const club = document.getElementById('ev_club').value || null;
    const dept = document.getElementById('ev_dept').value;
    const type = document.getElementById('ev_type').value;
    const date = document.getElementById('ev_date').value;
    const xp = parseInt(document.getElementById('ev_xp').value)||10;
    if(!title) return alert('Title required');
    if(id){
      store.events = store.events.map(x=> x.id===id ? {...x, title, desc, club, dept, type, date, xp} : x);
    } else {
      store.events.unshift({ id: uid(), title, desc, club, dept, type, date, createdAt: nowISO(), capacity:50, attendees:[], ratings:[], xp });
    }
    save(store);
    closeModal();
    render();
  });
}

function openEventDetail(id){
  const e = store.events.find(x=>x.id===id);
  if(!e) return alert('Event not found');
  openModal(`<h3>${e.title}</h3><div class="muted">${e.date} • ${e.type} • Dept: ${e.dept}</div><p style="margin-top:8px">${e.desc}</p>
    <div style="display:flex;gap:8px;margin-top:12px"><button class="btn" id="rsvpBtn">${e.attendees.includes(currentUserId)? 'Cancel RSVP':'RSVP'}</button><button class="small" id="rateBtn">Rate</button><button class="small" id="closeEv">Close</button></div>
    <div style="margin-top:12px"><strong>Attendees (${e.attendees.length}/${e.capacity}):</strong><div id="attList">${e.attendees.map(a=> (store.users.find(u=>u.id===a)||{name:a}).name).join(', ') || '—'}</div></div>`);
  document.getElementById('closeEv').addEventListener('click', closeModal);
  document.getElementById('rsvpBtn').addEventListener('click', ()=>{
    if(e.attendees.includes(currentUserId)){
      e.attendees = e.attendees.filter(x=>x!==currentUserId);
      store.xp[currentUserId] = Math.max(0, (store.xp[currentUserId]||0) - (e.xp||10));
    } else {
      e.attendees.push(currentUserId);
      if(!store.xp[currentUserId]) store.xp[currentUserId]=0;
      store.xp[currentUserId] += (e.xp||10);
    }
    store.events = store.events.map(x=> x.id===id ? e : x);
    save(store); render(); openEventDetail(id);
  });
  document.getElementById('rateBtn').addEventListener('click', ()=> {
    const r = prompt('Rate 1-5 stars (optionally add a comment like: 4 Great event)') || '';
    const parts = r.split(' ');
    const score = Math.min(5, Math.max(1, parseInt(parts[0])||0));
    const comment = parts.slice(1).join(' ');
    if(score>0){ e.ratings = e.ratings || []; e.ratings.push({ user: currentUserId, score, comment, at: nowISO() }); save(store); alert('Thanks for rating!'); }
  });
}

function openAnnouncementModal(){
  openModal(`<h3>New Announcement</h3><label>Title<input id="ann_title" /></label><label>Body<textarea id="ann_body"></textarea></label>
    <div style="margin-top:8px"><button class="btn" id="postAnn">Post</button> <button class="small" id="cancelAnn">Cancel</button></div>`);
  document.getElementById('cancelAnn').addEventListener('click', closeModal);
  document.getElementById('postAnn').addEventListener('click', ()=>{
    const title = document.getElementById('ann_title').value;
    const body = document.getElementById('ann_body').value;
    if(!title) return alert('Title required');
    store.announcements.unshift({ id: uid(), title, body, author: currentUserId, createdAt: nowISO(), tags: [] });
    save(store); closeModal(); render();
  });
}

function openAnnouncementDetail(id){
  const a = store.announcements.find(x=>x.id===id);
  if(!a) return;
  openModal(`<h3>${a.title}</h3><div class="muted">${a.createdAt.split('T')[0]}</div><p style="margin-top:8px">${a.body}</p><div style="margin-top:12px"><button class="small" id="closeA">Close</button></div>`);
  document.getElementById('closeA').addEventListener('click', closeModal);
}

function openLostFoundModal(){
  openModal(`<h3>Report Lost Item</h3><label>Title<input id="lf_title" /></label><label>Description<textarea id="lf_desc"></textarea></label><label>Contact<input id="lf_contact" /></label>
    <div style="margin-top:8px"><button class="btn" id="postLF">Post</button> <button class="small" id="cancelLF">Cancel</button></div>`);
  document.getElementById('cancelLF').addEventListener('click', closeModal);
  document.getElementById('postLF').addEventListener('click', ()=>{
    const title = document.getElementById('lf_title').value;
    const desc = document.getElementById('lf_desc').value;
    const contact = document.getElementById('lf_contact').value;
    if(!title) return alert('Title required');
    store.lostFound.unshift({ id: uid(), title, desc, contact, found:false, createdAt: nowISO(), author: currentUserId });
    save(store); closeModal(); render();
  });
}

function openProfileModal(uidv){
  const u = store.users.find(x=>x.id===uidv);
  openModal(`<h3>Edit Profile</h3><label>Name<input id="pf_name" value="${u.name}" /></label><label>Department<input id="pf_dept" value="${u.dept}" /></label>
    <div style="margin-top:8px"><button class="btn" id="savePf">Save</button> <button class="small" id="cancelPf">Cancel</button></div>`);
  document.getElementById('cancelPf').addEventListener('click', closeModal);
  document.getElementById('savePf').addEventListener('click', ()=>{
    u.name = document.getElementById('pf_name').value;
    u.dept = document.getElementById('pf_dept').value;
    save(store); closeModal(); render(); updateProfileHeader();
  });
}

// initialize UI options
function init(){
  const depts = Array.from(new Set(store.users.map(u=>u.dept).concat(store.events.map(e=>e.dept)).filter(Boolean)));
  depts.forEach(d=>{ if(!Array.from(filterDept.options).some(o=>o.value===d)) filterDept.add(new Option(d)); });
  const clubs = Array.from(new Set(store.events.map(e=>e.club).filter(Boolean)));
  clubs.forEach(c=>{ if(!Array.from(filterClub.options).some(o=>o.value===c)) filterClub.add(new Option(c)); });

  roleSwitch.value = currentUser().role;
  updateProfileHeader();
  render();
}

init();
