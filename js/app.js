/* =====================================================================
   APP  —  lógica do bolão (pontuação, Firebase, render e UI)
   Depende de: config.js e data.js (carregados antes deste arquivo).
   ===================================================================== */

/* ----------------------- AUXILIAR: BANDEIRAS ----------------------- */
function getTeamFlagEmoji(teamName) {
  const found = TEAMS.find(t => t[0] === teamName);
  return found ? found[1] : '';
}

function getFlagHtml(emoji, name) {
  if (!emoji) return '';
  let code = '';
  if (emoji === '🏴󠁧󠁢󠁳󠁣󠁴󠁿') code = 'gb-sct';
  else if (emoji === '🏴󠁧󠁢󠁥󠁮󠁧󠁿') code = 'gb-eng';
  else {
    const pts = Array.from(emoji);
    if (pts.length >= 2) {
      const cp1 = pts[0].codePointAt(0);
      const cp2 = pts[1].codePointAt(0);
      if (cp1 >= 0x1F1E6 && cp1 <= 0x1F1FF && cp2 >= 0x1F1E6 && cp2 <= 0x1F1FF) {
        const c1 = String.fromCharCode(cp1 - 0x1F1E6 + 97);
        const c2 = String.fromCharCode(cp2 - 0x1F1E6 + 97);
        code = c1 + c2;
      }
    }
  }
  if (code) {
    return `<img class="fl-img" src="https://flagcdn.com/w40/${code}.png" alt="${name || ''}" />`;
  }
  return `<span class="fl-emoji">${emoji}</span>`;
}

function formatKickoff(ts) {
  const d = new Date(ts);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month} às ${hours}:${minutes}`;
}

/* ----------------------- PONTUAÇÃO ----------------------- */
function sign(h,a){ return h>a ? 1 : (h<a ? -1 : 0); }

function pointsFor(pick, res){            // pontos de UM jogo
  if(!pick || !res) return null;
  if(pick.h==null || pick.a==null || res.h==null || res.a==null) return null;
  if(sign(pick.h,pick.a)!==sign(res.h,res.a)) return 0;        // errou o resultado
  let p = PTS_RESULT;                                          // acertou resultado
  if(pick.h===res.h && pick.a===res.a) p += PTS_EXACT_BONUS;   // + placar exato
  return p;
}
function norm(s){ return (s||'').toString().trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); }
function bonusTotal(myb){                  // pontos de TODOS os bônus do jogador
  let total=0;
  for(const b of BONUS){
    const mine=myb?.[b.id], real=BONUS_RESULTS?.[b.id];
    if(mine!=null && real!=null && norm(mine)===norm(real)) total+=b.pts;
  }
  return total;
}
function bonusHit(id, myVal){              // este palpite de bônus acertou?
  const real=BONUS_RESULTS?.[id];
  return real!=null && myVal!=null && norm(myVal)===norm(real);
}

/* ----------------------- ESTADO + FIREBASE ----------------------- */
let db=null, FB_OK=false;
let pid = localStorage.getItem('bolao_pid');
if(!pid){ pid = 'p_'+Math.random().toString(36).slice(2,10); localStorage.setItem('bolao_pid', pid); }
let myName = localStorage.getItem('bolao_name') || '';
let isAdmin = false;
let RESULTS = {};        // {matchId:{h,a}}
let BONUS_RESULTS = {};  // {bonusId:value}
let PLAYERS = {};        // {pid:{name,picks,bonus}}
let myPicks = {};
let myBonus = {};

const $ = s=>document.querySelector(s);
const el = (t,c)=>{const e=document.createElement(t); if(c)e.className=c; return e;};
function bonusClosed(){ return Date.now() >= BONUS_DEADLINE; }
function configOk(){ return !firebaseConfig.apiKey.startsWith("COLE_"); }

function initFirebase(){
  if(!configOk()) return false;
  try{
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    FB_OK = true;
    db.ref('results').on('value', s=>{ RESULTS = s.val()||{}; renderMatches(); renderAdmin(); renderRank(); });
    db.ref('bonusResults').on('value', s=>{ BONUS_RESULTS = s.val()||{}; renderBonus(); renderAdmin(); renderRank(); });
    db.ref('players').on('value', s=>{ PLAYERS = s.val()||{}; renderRank(); });
    return true;
  }catch(e){ console.error(e); return false; }
}

/* ----------------------- RENDER: JOGOS ----------------------- */
function renderMatches(){
  const box = $('#matchesList'); if(!box || !myName) return;
  box.innerHTML='';
  let curGroup=null, curRound=null;
  for(const m of MATCHES){
    if(m.group!==curGroup){
      curGroup=m.group; curRound=null;
      const t=el('div','group-title'); t.innerHTML = `Grupo ${m.group} <small>· ${GROUPS[m.group].date}</small>`;
      box.appendChild(t);
    }
    if(m.round!==curRound){
      curRound=m.round;
      const r=el('div','round-label'); r.textContent=`${m.round}ª rodada`; box.appendChild(r);
    }
    const res = RESULTS[m.id];
    const locked = !!res || Date.now() >= m.kickoff;
    const pick = myPicks[m.id]||{};
    const row=el('div','match-row'+(locked?' locked':''));
    row.innerHTML = `
      <div class="team home"><span class="nm">${m.home[0]}</span><span class="fl">${getFlagHtml(m.home[1], m.home[0])}</span></div>
      <div class="score-area">
        <input class="score-input" type="number" min="0" max="99" inputmode="numeric" data-id="${m.id}" data-side="h" value="${pick.h??''}" ${locked?'disabled':''}/>
        <span class="x">×</span>
        <input class="score-input" type="number" min="0" max="99" inputmode="numeric" data-id="${m.id}" data-side="a" value="${pick.a??''}" ${locked?'disabled':''}/>
      </div>
      <div class="team away"><span class="fl">${getFlagHtml(m.away[1], m.away[0])}</span><span class="nm">${m.away[0]}</span></div>
      <div class="match-details">
        <span class="kickoff-time">📅 ${formatKickoff(m.kickoff)}</span>
        ${ (locked && !res) ? ' <span class="lock-badge">🔒 Bloqueado (Jogo iniciado)</span>' : '' }
      </div>
      ${ res ? `<div class="official-result">Oficial: ${getFlagHtml(m.home[1], m.home[0])} ${res.h} × ${res.a} ${getFlagHtml(m.away[1], m.away[0])} ${ptsTag(pick,res)}</div>`:'' }`;
    box.appendChild(row);
  }
  box.querySelectorAll('input[type=number]').forEach(inp=> inp.addEventListener('input', onPickInput));
}
function ptsTag(pick,res){
  const p = pointsFor(pick,res); if(p===null) return '';
  const cls = p>=5?'pts-5':(p===3?'pts-3':'pts-0');
  return `<span class="pts-tag ${cls}">+${p} pts</span>`;
}
let saveTimer=null;
function onPickInput(e){
  const id=e.target.dataset.id, side=e.target.dataset.side;
  const match = MATCHES.find(m => m.id === id);
  if (match && Date.now() >= match.kickoff) {
    showToast('Palpite bloqueado: o jogo já começou! ❌');
    renderMatches();
    return;
  }
  let v=e.target.value===''?null:Math.max(0,Math.min(99,parseInt(e.target.value,10)));
  if(!myPicks[id]) myPicks[id]={h:null,a:null};
  myPicks[id][side]=v;
  setSave('⏳ Salvando…'); clearTimeout(saveTimer); saveTimer=setTimeout(savePlayer,600);
}

/* ----------------------- RENDER: BÔNUS ----------------------- */
function renderBonus(){
  if(!myName){ return; }
  $('#bonusGate').style.display='none';
  $('#bonusArea').style.display='block';
  const banner=$('#deadlineBanner');
  if(bonusClosed()){
    banner.className='banner danger center';
    banner.innerHTML='🔒 Palpites de bônus <b>encerrados</b> (prazo era 4 de julho de 2026). Eles agora valem só para conferência.';
  }else{
    const days=Math.ceil((BONUS_DEADLINE-Date.now())/86400000);
    banner.className='banner success center';
    banner.innerHTML=`⏳ Você pode editar os palpites de bônus até <b>4 de julho de 2026</b> (início das oitavas). Faltam <b>${days} dia(s)</b>.`;
  }
  const closed=bonusClosed();
  const box=$('#bonusList'); box.innerHTML='';
  const teamOpts = ['<option value="">— selecione a seleção —</option>']
      .concat(TEAMS.map(t=>`<option value="${t[0]}">${t[1]} ${t[0]}</option>`)).join('');
  for(const b of BONUS){
    const mine = myBonus[b.id] ?? '';
    const hit = bonusHit(b.id, mine);
    const row=el('div','bonus-row'+(hit?' correct':''));
    let field;
    if(b.type==='team'){
      const flagHtml = mine ? getFlagHtml(getTeamFlagEmoji(mine), mine) : '';
      field=`<div class="bonus-select-wrapper">${flagHtml}<select data-bid="${b.id}" ${closed?'disabled':''}>${teamOpts}</select></div>`;
    }else{
      field=`<input type="text" data-bid="${b.id}" placeholder="Nome do jogador" value="${mine?String(mine).replace(/"/g,'&quot;'):''}" ${closed?'disabled':''}/>`;
    }
    const realTxt = BONUS_RESULTS[b.id]!=null
      ? `<div class="bonus-official">Oficial: <b>${BONUS_RESULTS[b.id]}</b> ${hit?`✅ +${b.pts} pts`:'❌ 0 pts'}</div>` : '';
    row.innerHTML = `<div class="lbl">${b.label} <small>${b.pts} pts</small></div>${field}${realTxt}`;
    box.appendChild(row);
    if(b.type==='team'){ const sel=row.querySelector('select'); if(mine) sel.value=mine; }
  }
  box.querySelectorAll('[data-bid]').forEach(inp=> inp.addEventListener('input', onBonusInput));
}
let bonusTimer=null;
function onBonusInput(e){
  if(bonusClosed()) return;
  const id=e.target.dataset.bid;
  const v=e.target.value.trim();
  myBonus[id]= v===''? null : v;

  const wrapper = e.target.closest('.bonus-select-wrapper');
  if (wrapper) {
    const existingImg = wrapper.querySelector('.fl-img');
    if (existingImg) existingImg.remove();
    if (v) {
      const flagHtml = getFlagHtml(getTeamFlagEmoji(v), v);
      wrapper.insertAdjacentHTML('afterbegin', flagHtml);
    }
  }

  setSave('⏳ Salvando…'); clearTimeout(bonusTimer); bonusTimer=setTimeout(savePlayer,600);
}

function savePlayer(){
  if(!FB_OK){ setSave('⚠️ Firebase não configurado'); return; }
  const clean={}; for(const k in myBonus){ if(myBonus[k]!=null) clean[k]=myBonus[k]; }
  db.ref('players/'+pid).set({ name:myName, picks:myPicks, bonus:clean, updatedAt:Date.now() })
    .then(()=>setSave('☁️ Tudo salvo')).catch(()=>setSave('⚠️ Erro ao salvar'));
}
function setSave(t){ const b=$('#saveBar'),i=$('#saveInfo'); if(b){b.style.display='flex'; i.textContent=t;} }

/* ----------------------- RENDER: RANKING ----------------------- */
function totalFor(p){
  let total=0, exact=0, hit=0;
  for(const m of MATCHES){
    const pt = pointsFor(p.picks?.[m.id], RESULTS[m.id]);
    if(pt>=5){total+=pt;exact++;} else if(pt===3){total+=3;hit++;}
  }
  const bp = bonusTotal(p.bonus);
  return {total:total+bp, exact, hit, bonus:bp};
}
function renderRank(){
  const box=$('#rankList'); if(!box) return;
  const arr = Object.entries(PLAYERS).map(([id,p])=>({ id, name:p.name||'Sem nome', ...totalFor(p) }));
  if(myName && !PLAYERS[pid]) arr.push({id:pid,name:myName,...totalFor({picks:myPicks,bonus:myBonus})});
  arr.sort((a,b)=> b.total-a.total || b.exact-a.exact);
  if(arr.length===0){ box.innerHTML='<p class="text-muted center">Ninguém palpitou ainda. Seja o primeiro! ⚽</p>'; return; }
  box.innerHTML='';
  arr.forEach((p,idx)=>{
    const row=el('div','rank-row'+(p.id===pid?' me':''));
    const medal = idx<3?` medal${idx+1}`:'';
    const icon = idx===0?'🥇':idx===1?'🥈':idx===2?'🥉':(idx+1);
    row.innerHTML=`
      <div class="pos${medal}">${icon}</div>
      <div>
        <div class="name">${p.name}${p.id===pid?' <span style="font-weight:400; font-size:0.8em">(você)</span>':''}</div>
        <div class="stats">🎯 ${p.exact} exatos · ✅ ${p.hit} resultados · 🏆 ${p.bonus} bônus</div>
      </div>
      <div class="pts">${p.total} pts</div>`;
    box.appendChild(row);
  });
}

/* ----------------------- RENDER: ADMIN ----------------------- */
function renderAdmin(){
  if(!isAdmin) return;
  const bb=$('#adminBonus'); bb.innerHTML='';
  const teamOpts = ['<option value="">— selecione —</option>']
      .concat(TEAMS.map(t=>`<option value="${t[0]}">${t[1]} ${t[0]}</option>`)).join('');
  for(const b of BONUS){
    const real = BONUS_RESULTS[b.id] ?? '';
    const row=el('div','bonus-row');
    let field;
    if(b.type==='team'){
      const flagHtml = real ? getFlagHtml(getTeamFlagEmoji(real), real) : '';
      field=`<div class="bonus-select-wrapper">${flagHtml}<select data-abid="${b.id}">${teamOpts}</select></div>`;
    }else{
      field=`<input type="text" data-abid="${b.id}" placeholder="Nome oficial" value="${real?String(real).replace(/"/g,'&quot;'):''}"/>`;
    }
    row.innerHTML=`<div class="lbl">${b.label} <small>${b.pts} pts</small></div>${field}`;
    bb.appendChild(row);
    if(b.type==='team'){ const sel=row.querySelector('select'); if(real) sel.value=real; }
  }
  bb.querySelectorAll('[data-abid]').forEach(inp=> inp.addEventListener('input', onAdminBonus));

  const box=$('#adminMatches'); box.innerHTML='';
  let curGroup=null;
  for(const m of MATCHES){
    if(m.group!==curGroup){ curGroup=m.group; const t=el('div','group-title'); t.innerHTML=`Grupo ${m.group}`; box.appendChild(t); }
    const res=RESULTS[m.id]||{};
    const row=el('div','match-row');
    row.innerHTML=`
      <div class="team home"><span class="nm">${m.home[0]}</span><span class="fl">${getFlagHtml(m.home[1], m.home[0])}</span></div>
      <div class="score-area">
        <input class="score-input" type="number" min="0" max="99" data-id="${m.id}" data-side="h" value="${res.h??''}"/>
        <span class="x">×</span>
        <input class="score-input" type="number" min="0" max="99" data-id="${m.id}" data-side="a" value="${res.a??''}"/>
      </div>
      <div class="team away"><span class="fl">${getFlagHtml(m.away[1], m.away[0])}</span><span class="nm">${m.away[0]}</span></div>`;
    box.appendChild(row);
  }
  box.querySelectorAll('input').forEach(inp=> inp.addEventListener('input', onAdminInput));
}
let adminTimer=null;
function onAdminInput(e){
  const id=e.target.dataset.id, wrap=e.target.closest('.score-area');
  const h=wrap.querySelector('[data-side=h]').value, a=wrap.querySelector('[data-side=a]').value;
  clearTimeout(adminTimer);
  adminTimer=setTimeout(()=>{
    if(h===''||a==='') db.ref('results/'+id).remove();
    else db.ref('results/'+id).set({h:parseInt(h,10),a:parseInt(a,10)});
    showToast('Resultado salvo ✓');
  },500);
}
let adminBTimer=null;
function onAdminBonus(e){
  const id=e.target.dataset.abid, v=e.target.value.trim();

  const wrapper = e.target.closest('.bonus-select-wrapper');
  if (wrapper) {
    const existingImg = wrapper.querySelector('.fl-img');
    if (existingImg) existingImg.remove();
    if (v) {
      const flagHtml = getFlagHtml(getTeamFlagEmoji(v), v);
      wrapper.insertAdjacentHTML('afterbegin', flagHtml);
    }
  }

  clearTimeout(adminBTimer);
  adminBTimer=setTimeout(()=>{
    if(v==='') db.ref('bonusResults/'+id).remove();
    else db.ref('bonusResults/'+id).set(v);
    showToast('Bônus oficial salvo ✓');
  },500);
}

/* ----------------------- UI: tabs, identidade, admin, share ----------------------- */
document.querySelectorAll('nav.tabs-nav button').forEach(b=>{
  b.addEventListener('click',()=>{
    document.querySelectorAll('nav.tabs-nav button').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('section').forEach(x=>x.classList.remove('active'));
    b.classList.add('active'); $('#'+b.dataset.tab).classList.add('active');
  });
});
$('#saveNameBtn').addEventListener('click', enterName);
$('#playerName').addEventListener('keydown',e=>{ if(e.key==='Enter') enterName(); });
function enterName(){
  const v=$('#playerName').value.trim();
  if(!v){ showToast('Digite seu nome 🙂'); return; }
  myName=v; localStorage.setItem('bolao_name', v);
  $('#identityCard').innerHTML=`<h2 class="card-title">👤 Olá, ${myName}!</h2><p class="text-muted">Bons palpites! Seus chutes salvam automaticamente. Para trocar o nome, limpe os dados do navegador.</p>`;
  $('#matchesArea').style.display='block';
  if(FB_OK){
    db.ref('players/'+pid).once('value').then(s=>{
      const d=s.val();
      if(d){ if(d.picks) myPicks=d.picks; if(d.bonus) myBonus=d.bonus; }
      renderMatches(); renderBonus(); savePlayer();
    });
  } else { renderMatches(); renderBonus(); }
  renderRank();
}
async function sha256(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.prototype.map.call(new Uint8Array(buf), x=>(('00'+x.toString(16)).slice(-2))).join('');
}

$('#adminBtn').addEventListener('click', async ()=>{
  const inputHash = await sha256($('#adminPass').value);
  if(inputHash === ADMIN_PASSWORD_HASH){
    isAdmin=true; $('#adminLogin').style.display='none'; $('#adminArea').style.display='block';
    renderAdmin(); showToast('Bem-vindo, organizador 🔐');
  } else showToast('Senha incorreta ❌');
});
$('#adminLogout').addEventListener('click',()=>{ isAdmin=false; $('#adminLogin').style.display='flex'; $('#adminArea').style.display='none'; $('#adminPass').value=''; });

const shareLink = window.location.href.split('#')[0];
$('#shareUrl').textContent = shareLink;
new QRCode($('#qrcode'), { text:shareLink, width:200, height:200, colorDark:'#0b132b', colorLight:'#ffffff' });
$('#waBtn').addEventListener('click',()=>{
  const msg=`🏆 Bora pro Bolão da Copa 2026! Faça seus palpites e dispute o ranking com a gente:\n${shareLink}`;
  window.open('https://wa.me/?text='+encodeURIComponent(msg),'_blank');
});
$('#copyBtn').addEventListener('click',()=>{ navigator.clipboard.writeText(shareLink).then(()=>showToast('Link copiado 📋')); });
function showToast(t){ const e=$('#toast'); e.textContent=t; e.classList.add('show'); setTimeout(()=>e.classList.remove('show'),2200); }

/* ----------------------- BOOT ----------------------- */
(function boot(){
  const ok = initFirebase();
  if(!ok){
    $('#connWarn').innerHTML = `<div class="banner danger">⚠️ <b>Firebase ainda não configurado.</b> A página funciona, mas os palpites <u>não serão salvos online</u> nem haverá ranking compartilhado até você preencher o <code>firebaseConfig</code> em <code>js/config.js</code>. Veja o passo a passo na aba <b>🔐 Admin</b> ou no README.</div>`;
  }
  if(myName){ $('#playerName').value=myName; enterName(); }
  renderRank();
})();
