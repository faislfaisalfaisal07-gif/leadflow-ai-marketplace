const STORAGE_KEY = 'leadflow_leads_v1';
const THEME_KEY = 'leadflow_theme_v1';
const statuses = ['New','Contacted','Qualified','Proposal','Won','Lost'];
const templates = [
  {title:'First contact',tag:'INTRODUCTION',body:'Hi {{name}},\n\nThanks for your interest. I’d love to learn a little more about what you’re looking for and see how we can help. Would you be available for a quick conversation this week?\n\nBest,\n{{your_name}}'},
  {title:'Friendly follow-up',tag:'FOLLOW-UP',body:'Hi {{name}},\n\nJust following up on my previous message in case it got buried. I’d be happy to answer any questions or share more details.\n\nWould it be helpful if I sent over a few options?\n\nBest,\n{{your_name}}'},
  {title:'Proposal check-in',tag:'PROPOSAL',body:'Hi {{name}},\n\nI wanted to check whether you had a chance to review the proposal. I’m happy to walk through the details and adjust anything that would make it a better fit.\n\nWhat would be a convenient time to connect?\n\nBest,\n{{your_name}}'},
  {title:'Thank you',tag:'RELATIONSHIP',body:'Hi {{name}},\n\nThank you for choosing to work with us. We really appreciate your trust and look forward to helping you get great results. Please reach out anytime if you need anything.\n\nBest,\n{{your_name}}'}
];
let leads = loadLeads();
let currentView = 'overview';
let supabaseClient = null;
let activeUser = null;
let authMode = 'signin';
let cloudMode = false;
let toastTimer;
function loadLeads(){try{const raw=localStorage.getItem(STORAGE_KEY);return raw?JSON.parse(raw):[];}catch(e){return []}}
function saveLeads(){
  localStorage.setItem(STORAGE_KEY,JSON.stringify(leads));
  renderAll();
  if(cloudMode && activeUser){
    const rows=leads.map(l=>({id:l.id,user_id:activeUser.id,name:l.name,company:l.company||'',email:l.email||'',phone:l.phone||'',status:String(l.status||'New').toLowerCase(),source:l.source||'Other',value:Number(l.value)||0,followup:l.followup||null,
followup_done:Boolean(l.followupDone),
followup_result:l.followupResult||'',
notes:l.notes||'',created_at:l.createdAt,updated_at:l.updatedAt}));
    if(rows.length) supabaseClient.from('leads').upsert(rows,{onConflict:'id'}).then(({error})=>{if(error)showToast('Cloud save failed: '+error.message)});
  }
}
function isSupabaseConfigured(){const c=window.LEADFLOW_CONFIG||{};return Boolean(c.supabaseUrl&&c.supabaseAnonKey&&!c.supabaseUrl.includes('YOUR-PROJECT')&&!c.supabaseAnonKey.includes('YOUR_'))}
function setAuthMode(mode){authMode=mode;document.getElementById('authTitle').textContent=mode==='signin'?'Welcome back.':'Create your workspace.';document.getElementById('authDescription').textContent=mode==='signin'?'Sign in to securely access your leads from any device.':'Create a secure account to keep your leads synced across devices.';document.getElementById('authSubmit').textContent=mode==='signin'?'Sign in':'Create account';document.getElementById('authSwitch').textContent=mode==='signin'?'New here? Create an account':'Already have an account? Sign in';document.getElementById('authPassword').autocomplete=mode==='signin'?'current-password':'new-password';document.getElementById('authError').textContent=''}
function showAuth(){document.getElementById('authGate').classList.remove('hidden')}
function hideAuth(){document.getElementById('authGate').classList.add('hidden')}
async function loadCloudLeads(){const {data,error}=await supabaseClient.from('leads').select('*').order('created_at',{ascending:false});if(error)throw error;leads=(data||[]).map(r=>({id:r.id,name:r.name,company:r.company,email:r.email,phone:r.phone,status:(r.status||'new').charAt(0).toUpperCase()+(r.status||'new').slice(1),source:r.source,value:Number(r.value)||0,followup:r.followup||'',
followupDone:Boolean(r.followup_done),
followupResult:r.followup_result||'',
notes:r.notes,createdAt:r.created_at,updatedAt:r.updated_at}));localStorage.setItem(STORAGE_KEY,JSON.stringify(leads));renderAll()}

async function initCloud(){
  if(!isSupabaseConfigured()){
    showToast('Supabase configuration is missing');
    return;
  }

  if(!window.supabase?.createClient){
    document.getElementById('accountBtn').textContent='Library error';
    return;
  }

  cloudMode=true;
  const c=window.LEADFLOW_CONFIG;

  supabaseClient=window.supabase.createClient(
    c.supabaseUrl,
    c.supabaseAnonKey
  );

  const {data:{session},error}=await supabaseClient.auth.getSession();

  if(error) throw error;

  if(session){
    activeUser=session.user;
    document.getElementById('accountBtn').textContent='Sign out';
    await loadCloudLeads();
  }else{
    activeUser=null;
    leads=[];
    renderAll();
    setAuthMode('signin');
    showAuth();
    document.getElementById('accountBtn').textContent='Sign in';
  }

  supabaseClient.auth.onAuthStateChange(async(_event,session)=>{
    activeUser=session?.user||null;

    if(activeUser){
      document.getElementById('accountBtn').textContent='Sign out';
      hideAuth();

      try{
        await loadCloudLeads();
      }catch(err){
        showToast('Could not load cloud leads: '+err.message);
      }
    }else{
      leads=[];
      renderAll();
      document.getElementById('accountBtn').textContent='Sign in';
      setAuthMode('signin');
      showAuth();
    }
  });
}

function esc(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function initials(name='?'){return name.trim().split(/\s+/).slice(0,2).map(x=>x[0]||'').join('').toUpperCase()||'?'}
function dateOnly(value){if(!value)return null;const [y,m,d]=value.split('-').map(Number);return new Date(y,m-1,d)}
function localISO(date=new Date()){const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');return `${y}-${m}-${d}`}
function fmtDate(value){const d=dateOnly(value);return d?d.toLocaleDateString(undefined,{month:'short',day:'numeric',year:'numeric'}):'—'}
function isDue(lead){return lead.followup&&lead.followup<=localISO()&&!['Won','Lost'].includes(lead.status)}
function showToast(message){const el=document.getElementById('toast');el.textContent=message;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),2400)}
function setView(view){currentView=view;document.querySelectorAll('.view').forEach(el=>el.classList.remove('active-view'));document.getElementById(view+'View').classList.add('active-view');document.querySelectorAll('.nav-item[data-view]').forEach(el=>el.classList.toggle('active',el.dataset.view===view));document.getElementById('breadcrumbCurrent').textContent={overview:'Overview',leads:'All leads',followups:'Follow-ups',templates:'Message templates'}[view];document.getElementById('sidebar').classList.remove('open');if(view==='leads')renderLeads();if(view==='followups')renderFollowups()}
function renderStats(){const now=new Date();const monthStart=new Date(now.getFullYear(),now.getMonth(),1);document.getElementById('statTotal').textContent=leads.length;document.getElementById('statNew').textContent=leads.filter(l=>new Date(l.createdAt)>=monthStart).length;document.getElementById('statProgress').textContent=leads.filter(l=>['Contacted','Qualified','Proposal'].includes(l.status)).length;document.getElementById('statWon').textContent=leads.filter(l=>l.status==='Won').length;document.getElementById('navLeadCount').textContent=leads.length;document.getElementById('navFollowCount').textContent=leads.filter(isDue).length;}
function statusHTML(status){return `<span class="status-pill status-${esc(status)}">${esc(status)}</span>`}
function contactHTML(lead){return `<div class="contact-cell"><span class="contact-avatar">${esc(initials(lead.name))}</span><span><strong>${esc(lead.name)}</strong><small>${esc(lead.email||lead.phone||'No contact details')}</small></span></div>`}
function renderPipeline(){const counts=statuses.map(s=>({status:s,count:leads.filter(l=>l.status===s).length}));const max=Math.max(1,...counts.map(x=>x.count));document.getElementById('pipelineBars').innerHTML=counts.map(x=>`<div class="bar-row"><span>${x.status}</span><div class="bar-track"><div class="bar-fill" style="width:${x.count/max*100}%"></div></div><span class="bar-count">${x.count}</span></div>`).join('')}
function renderOverview(){renderStats();renderPipeline();const sorted=[...leads].sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));document.getElementById('recentTable').innerHTML=sorted.slice(0,5).map(l=>`<tr><td>${contactHTML(l)}</td><td>${esc(l.company||'—')}</td><td>${statusHTML(l.status)}</td><td>${fmtDate(l.createdAt.slice(0,10))}</td><td><button class="small-action" data-edit="${l.id}">Edit</button></td></tr>`).join('')||`<tr><td colspan="5"><div class="empty-note">No leads yet. Add your first contact to get started.</div></td></tr>`;const due=leads.filter(isDue).sort((a,b)=>a.followup.localeCompare(b.followup)).slice(0,4);document.getElementById('overviewFollowups').innerHTML=due.map(l=>`<div class="mini-item"><span class="mini-avatar">${esc(initials(l.name))}</span><span class="mini-info"><strong>${esc(l.name)}</strong><small>${esc(l.company||'No company')}</small></span><span class="mini-date">${l.followup<localISO()?'Overdue': 'Today'}</span></div>`).join('')||'<div class="empty-note">You’re all caught up. No follow-ups due.</div>'}
function filteredLeads(){const q=document.getElementById('searchInput').value.toLowerCase().trim(),s=document.getElementById('statusFilter').value,src=document.getElementById('sourceFilter').value;return [...leads].filter(l=>(!q||[l.name,l.company,l.email,l.phone].join(' ').toLowerCase().includes(q))&&(s==='all'||l.status===s)&&(src==='all'||l.source===src)).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))}
function renderLeads(){const rows=filteredLeads();document.getElementById('leadsTable').innerHTML=rows.map(l=>`<tr><td>${contactHTML(l)}</td><td>${esc(l.company||'—')}</td><td>${esc(l.source)}</td><td>${statusHTML(l.status)}</td><td>${fmtDate(l.followup)}</td><td><div class="row-actions"><button class="small-action" data-edit="${l.id}">Edit</button><button class="small-action" data-delete="${l.id}" aria-label="Delete ${esc(l.name)}">×</button></div></td></tr>`).join('');document.getElementById('leadsEmpty').classList.toggle('hidden',rows.length!==0);document.getElementById('tableFooter').textContent=`Showing ${rows.length} of ${leads.length} lead${leads.length===1?'':'s'}`}

function followCard(l){
  const d=dateOnly(l.followup);
  const due=isDue(l);
  const completed=Boolean(l.followupDone);

  return `<div class="followup-card">
    <div class="followup-date">
      <strong>${d?d.getDate():'—'}</strong>
      ${d?d.toLocaleDateString(undefined,{month:'short'}):''}
    </div>
    <div class="followup-detail">
      <strong>${esc(l.name)}</strong>
      <small>${esc(l.company||'No company')} · ${completed?'Completed':due?(l.followup<localISO()?'Overdue':'Due today'):'Upcoming'}</small>
      ${completed&&l.followupResult?`<small>Result: ${esc(l.followupResult)}</small>`:''}
    </div>
    ${completed?'':`<button class="small-action" data-complete="${esc(l.id)}">Mark done</button>`}
    <button class="small-action" data-edit="${esc(l.id)}">Open</button>
  </div>`;
}


function renderFollowups(){
  const withDate=leads.filter(l=>l.followup);
  const active=withDate.filter(l=>!l.followupDone&&!['Won','Lost'].includes(l.status));

  const due=active.filter(isDue)
    .sort((a,b)=>a.followup.localeCompare(b.followup));

  const upcoming=active.filter(l=>l.followup>localISO())
    .sort((a,b)=>a.followup.localeCompare(b.followup));

  const completed=withDate.filter(l=>l.followupDone)
    .sort((a,b)=>b.followup.localeCompare(a.followup));

  document.getElementById('dueCount').textContent=due.length;
  document.getElementById('completedCount').textContent=completed.length;

  document.getElementById('dueList').innerHTML=
    due.map(followCard).join('')||
    '<div class="empty-note">Nothing due right now. Nice work!</div>';

  document.getElementById('upcomingList').innerHTML=
    upcoming.map(followCard).join('')||
    '<div class="empty-note">No upcoming follow-ups scheduled.</div>';

  document.getElementById('completedList').innerHTML=
    completed.map(followCard).join('')||
    '<div class="empty-note">No completed follow-ups yet.</div>';
}

function renderTemplates(){document.getElementById('templateGrid').innerHTML=templates.map((t,i)=>`<article class="template-card"><h3>${esc(t.title)}</h3><p>${esc(t.body)}</p><div class="template-actions"><span class="template-tag">${esc(t.tag)}</span><button class="copy-btn" data-copy-template="${i}">Copy message ↗</button></div></article>`).join('')}
function renderAll(){renderStats();renderOverview();if(currentView==='leads')renderLeads();if(currentView==='followups')renderFollowups()}
function openModal(id=null){const form=document.getElementById('leadForm');form.reset();document.getElementById('leadId').value='';document.getElementById('modalTitle').textContent=id?'Edit lead':'Add a new lead';document.getElementById('formError').textContent='';if(id){const l=leads.find(x=>x.id===id);if(!l)return;for(const [field,key] of [['leadName','name'],['leadCompany','company'],['leadEmail','email'],['leadPhone','phone'],['leadStatus','status'],['leadSource','source'],['leadValue','value'],['leadFollowup','followup'],['leadNotes','notes']])document.getElementById(field).value=l[key]??'';document.getElementById('leadId').value=id;}document.getElementById('leadModal').classList.remove('hidden');document.getElementById('leadName').focus()}
function closeModal(){document.getElementById('leadModal').classList.add('hidden')}
document.getElementById('leadForm').addEventListener('submit',e=>{e.preventDefault();const id=document.getElementById('leadId').value;const name=document.getElementById('leadName').value.trim();const email=document.getElementById('leadEmail').value.trim();if(!name){document.getElementById('formError').textContent='Please enter a contact name.';return}if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){document.getElementById('formError').textContent='Please enter a valid email address.';return}const old=leads.find(l=>l.id===id);const lead={id:id||crypto.randomUUID(),name,company:document.getElementById('leadCompany').value.trim(),email,phone:document.getElementById('leadPhone').value.trim(),status:document.getElementById('leadStatus').value,source:document.getElementById('leadSource').value,value:Number(document.getElementById('leadValue').value)||0,followup:document.getElementById('leadFollowup').value,
followupDone:old && old.followup===document.getElementById('leadFollowup').value ? Boolean(old.followupDone) : false,
followupResult:old && old.followup===document.getElementById('leadFollowup').value ? (old.followupResult||'') : '',
notes:document.getElementById('leadNotes').value.trim(),createdAt:old?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};if(old)leads=leads.map(l=>l.id===id?lead:l);else leads.unshift(lead);closeModal();saveLeads();showToast(old?'Lead updated successfully':'Lead added successfully')});

document.addEventListener('click',e=>{
  const complete=e.target.closest('[data-complete]');
  if(complete){
    const lead=leads.find(x=>x.id===complete.dataset.complete);
    if(lead){
      const result=prompt('What was the result of this follow-up? (Optional)');
      if(result===null)return;

      lead.followupDone=true;
      lead.followupResult=result.trim();

      saveLeads();
      showToast('Follow-up marked as completed');
    }
    return;
  }

  const edit=e.target.closest('[data-edit]');
  if(edit){openModal(edit.dataset.edit);return}

  const del=e.target.closest('[data-delete]');
  if(del){
    const l=leads.find(x=>x.id===del.dataset.delete);
    if(l&&confirm(`Delete ${l.name}? This cannot be undone.`)){
      leads=leads.filter(x=>x.id!==l.id);
      if(cloudMode&&activeUser)supabaseClient.from('leads').delete().eq('id',l.id).then(({error})=>{if(error)showToast('Cloud delete failed: '+error.message)});
      saveLeads();
      showToast('Lead deleted');
    }
    return;
  }

  const go=e.target.closest('[data-go]');
  if(go){setView(go.dataset.go);return}

  const copy=e.target.closest('[data-copy-template]');
  if(copy){
    const t=templates[Number(copy.dataset.copyTemplate)];
    navigator.clipboard?.writeText(t.body).then(()=>showToast('Template copied to clipboard')).catch(()=>showToast('Clipboard access unavailable'));
  }
});

function exportCSV(){const cols=['name','company','email','phone','status','source','value','followup','notes','createdAt'];const lines=[cols.join(','),...leads.map(l=>cols.map(k=>'"'+String(l[k]??'').replace(/"/g,'""')+'"').join(','))];const blob=new Blob(['\ufeff'+lines.join('\r\n')],{type:'text/csv;charset=utf-8;'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`leadflow-leads-${localISO()}.csv`;a.click();URL.revokeObjectURL(url);showToast('CSV export prepared')}
['topAddBtn','leadsAddBtn','followAddBtn','emptyAddBtn'].forEach(id=>document.getElementById(id).addEventListener('click',()=>openModal()));['closeModal','cancelModal'].forEach(id=>document.getElementById(id).addEventListener('click',closeModal));document.getElementById('leadModal').addEventListener('click',e=>{if(e.target.id==='leadModal')closeModal()});document.getElementById('exportBtn').addEventListener('click',exportCSV);document.getElementById('overviewExport').addEventListener('click',exportCSV);['searchInput','statusFilter','sourceFilter'].forEach(id=>document.getElementById(id).addEventListener(id==='searchInput'?'input':'change',renderLeads));document.querySelectorAll('.nav-item[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));document.getElementById('mobileMenu').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));document.getElementById('themeToggle').addEventListener('click',()=>{document.body.classList.toggle('dark');localStorage.setItem(THEME_KEY,document.body.classList.contains('dark')?'dark':'light')});
if(localStorage.getItem(THEME_KEY)==='dark')document.body.classList.add('dark');document.getElementById('todayLabel').textContent=new Date().toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});renderTemplates();renderAll();

// Account controls: local demo mode works without credentials; configured mode uses Supabase Auth + RLS.
document.getElementById('authSwitch').addEventListener('click',()=>setAuthMode(authMode==='signin'?'signup':'signin'));
document.getElementById('authForm').addEventListener('submit',async e=>{e.preventDefault();if(!supabaseClient){
  document.getElementById('authError').textContent =
  'Supabase is not connected. Check config.js and reload.';
  return;
}const email=document.getElementById('authEmail').value.trim();const password=document.getElementById('authPassword').value;const btn=document.getElementById('authSubmit');btn.disabled=true;btn.textContent='Please wait…';document.getElementById('authError').textContent='';try{const result=authMode==='signin'?await supabaseClient.auth.signInWithPassword({email,password}):await supabaseClient.auth.signUp({email,password});if(result.error)throw result.error;if(authMode==='signup'&&!result.data.session)document.getElementById('authError').textContent='Check your email to confirm your account, then sign in.';else showToast(authMode==='signin'?'Signed in successfully':'Account created')}catch(err){document.getElementById('authError').textContent=err.message||'Authentication failed'}finally{btn.disabled=false;btn.textContent=authMode==='signin'?'Sign in':'Create account'}});
document.getElementById('accountBtn').addEventListener('click',async()=>{if(!cloudMode){showToast('Demo mode: configure Supabase to enable cloud accounts');return}if(activeUser){await supabaseClient.auth.signOut()}else{setAuthMode('signin');showAuth()}});
initCloud().catch(err=>{console.error(err);showToast('Cloud setup error: '+err.message)});
