/* script.js — small app logic using localStorage for demo persistence */
const DB_KEY = 'cg_db_v2';

function dbLoad(){
  let db = JSON.parse(localStorage.getItem(DB_KEY) || 'null');
  if(!db){
    db = {
      stats:{totalTonnes:25000,totalTrees:150000,totalGifts:10000},
      users:{ guest:{name:'Guest', credits:0, history:[], retired:[] } },
      currentUser:'guest'
    };
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }
  return db;
}
function dbSave(db){ localStorage.setItem(DB_KEY, JSON.stringify(db)); }
function qs(id){ return document.getElementById(id); }

document.addEventListener('DOMContentLoaded',()=>{
  const db = dbLoad();

  // Home: simulator + stats
  const simBtn = qs('simulateBtn');
  if(simBtn){
    simBtn.addEventListener('click', ()=>{
      const a = Number(qs('simAmount').value) || 1;
      qs('simMessage').innerText = `Your tree is growing with ${a} credits! 🌱`;
    });
    if(qs('totalTonnes')) qs('totalTonnes').innerText = db.stats.totalTonnes.toLocaleString();
    if(qs('totalTrees')) qs('totalTrees').innerText = db.stats.totalTrees.toLocaleString();
    if(qs('totalGifts')) qs('totalGifts').innerText = db.stats.totalGifts.toLocaleString();
  }

  // Transaction page: create transaction and update DB
  const completeBtn = qs('completeBtn');
  if(completeBtn){
    completeBtn.addEventListener('click', ()=>{
      const db = dbLoad();
      const giver = qs('giverName').value || 'Anonymous';
      const recipient = qs('recipientName').value || 'Recipient';
      const credits = Math.max(1, Number(qs('credits').value) || 1);
      const msg = qs('message').value || '';
      const project = qs('projectSelect').value || 'trees';
      const userKey = db.currentUser || 'guest';
      const user = db.users[userKey] || db.users['guest'];
      const tx = {date:new Date().toISOString(), project, credits, giver, recipient, msg};
      user.history.unshift(tx);
      user.credits = (user.credits||0) + credits;
      db.stats.totalGifts += 1;
      if(project==='trees') db.stats.totalTrees += credits;
      db.stats.totalTonnes += credits/1000;
      dbSave(db);
      qs('confirmBox').style.display='block';
      qs('confirmBox').innerText = `Transaction complete! ${credits} credits gifted to ${recipient}. Redirecting to portfolio...`;
      setTimeout(()=> location.href = 'portfolio.html', 900);
    });
  }

  // Login handling
  const loginBtn = qs('loginBtn');
  if(loginBtn){
    loginBtn.addEventListener('click', ()=>{
      const email = qs('email').value || 'guest';
      const uname = email.split('@')[0] || 'user';
      const db = dbLoad();
      if(!db.users[uname]) db.users[uname] = {name:uname, credits:0, history:[], retired:[]};
      db.currentUser = uname;
      dbSave(db);
      qs('loginMsg').innerText = 'Logged in as ' + uname;
      setTimeout(()=> location.href = 'portfolio.html', 700);
    });
    const guestBtn = qs('guestBtn');
    if(guestBtn) guestBtn.addEventListener('click', ()=>{ const db = dbLoad(); db.currentUser='guest'; dbSave(db); location.href='portfolio.html'; });
  }

  // Portfolio rendering
  if(qs('historyTable')){
    const db = dbLoad(); const user = db.users[db.currentUser] || db.users.guest;
    qs('userName').innerText = user.name || db.currentUser;
    qs('userCredits').innerText = user.credits || 0;
    qs('userCO2').innerText = ((user.credits||0) * 0.001).toFixed(2) + ' tonnes'; // sample conv
    const tbody = document.querySelector('#historyTable tbody');
    tbody.innerHTML = '';
    (user.history||[]).forEach(tx=>{
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${new Date(tx.date).toLocaleString()}</td><td>${tx.project}</td><td>${tx.credits}</td><td>${tx.recipient || ''}</td>`;
      tbody.appendChild(tr);
    });
    const retiredList = qs('retiredList');
    retiredList.innerText = (user.retired && user.retired.length) ? user.retired.map(r=>`${r.count} (${new Date(r.date).toLocaleDateString()})`).join(', ') : 'No retired credits yet.';
  }

  // Retire page
  if(qs('ownedCredits')){
    const db = dbLoad(); const user = db.users[db.currentUser] || db.users.guest;
    const owned = user.credits || 0;
    const sel = qs('ownedCredits');
    sel.innerHTML = `<option value="all">All owned (${owned})</option>`;
    qs('retireNow').addEventListener('click', ()=>{
      const retireCount = Math.min(owned, Math.max(1, Number(qs('retireCount').value)||1));
      if(retireCount<=0){ qs('retireMsg').style.display='block'; qs('retireMsg').innerText='No credits to retire.'; return; }
      user.credits -= retireCount;
      user.retired = user.retired || []; user.retired.push({count:retireCount,date:new Date().toISOString()});
      dbSave(db);
      qs('retireMsg').style.display='block'; qs('retireMsg').innerText = `Retired ${retireCount} credits. Certificate generated.`;
      qs('certificate').style.display='block';
      qs('certText').innerText = `This certifies that ${retireCount} credits were retired by ${user.name} on ${new Date().toLocaleDateString()}.`;
      setTimeout(()=> location.href='portfolio.html', 1200);
    });
  }

  // Quick deep-link prefill: transaction.html?project=solar
  if(window.location.search && qs('projectSelect')){
    const params = new URLSearchParams(window.location.search);
    if(params.get('project')) qs('projectSelect').value = params.get('project');
  }
});
