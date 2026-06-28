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

function pointsFor(pick, res){            // pontos de UM jogo da fase de grupos
  if(!pick || !res) return null;
  if(pick.h==null || pick.a==null || res.h==null || res.a==null) return null;
  if(sign(pick.h,pick.a)!==sign(res.h,res.a)) return 0;        // errou o resultado
  let p = PTS_RESULT;                                          // acertou resultado
  if(pick.h===res.h && pick.a===res.a) p += PTS_EXACT_BONUS;   // + placar exato
  return p;
}

function pointsForKo(pick, res) {         // pontos de UM jogo do mata-mata
  if(!pick || !res) return null;
  if(pick.h==null || pick.a==null || res.h==null || res.a==null) return null;

  // 1. Decidido no tempo normal
  if (res.h !== res.a) {
    if (sign(pick.h, pick.a) !== sign(res.h, res.a)) return 0;
    let p = PTS_RESULT;
    if (pick.h === res.h && pick.a === res.a) p += PTS_EXACT_BONUS;
    return p;
  }

  // 2. Empate em 90 minutos
  if (pick.h !== pick.a) return 0; // Palpitou vitória de alguém, mas deu empate

  const mode = pick.mode || 'standard';
  if (mode === 'standard') {
    let p = PTS_RESULT;
    if (pick.h === res.h && pick.a === res.a) p += PTS_EXACT_BONUS;
    if (pick.w && pick.w === res.w) p += 3; // Bônus por acertar o classificado
    return p;
  } else if (mode === 'risk') {
    if (pick.dec === res.dec && pick.w === res.w) {
      return 15; // Pontos triplicados do placar exato (5 * 3 = 15)
    }
    return 0; // Se errar o momento ou o vencedor, perde tudo
  }
  return 0;
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
let activeStatusFilter = 'all'; // 'all', 'upcoming', 'finished'

// Variáveis para o salvamento em lote do admin
let tempAdminResults = {};
let tempAdminBonusResults = {};
let adminHasUnsavedChanges = false;

// Ordenar MATCHES cronologicamente: dia-hora-grupo
MATCHES.sort((a, b) => a.kickoff - b.kickoff || a.group.localeCompare(b.group) || a.id.localeCompare(b.id));

const $ = s=>document.querySelector(s);
const el = (t,c)=>{const e=document.createElement(t); if(c)e.className=c; return e;};
const WEEKDAYS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
function getDayHeader(ts) {
  const d = new Date(ts);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const weekday = WEEKDAYS[d.getDay()];
  return `${day}/${month} - ${weekday}`;
}

function bonusClosed(){ return Date.now() >= BONUS_DEADLINE; }
function configOk(){ return !firebaseConfig.apiKey.startsWith("COLE_"); }

let isInitialLoadResults = true;
let isInitialLoadBonus = true;
let previousResultsJson = "";
let previousBonusJson = "";

function initFirebase(){
  if(!configOk()) return false;
  try{
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    FB_OK = true;
    
    db.ref('results').on('value', s=>{ 
      const newVal = s.val()||{};
      RESULTS = newVal; 
      renderMatches(); 
      renderKoMatches();
      renderStandings(); 
      if (!adminHasUnsavedChanges) {
        tempAdminResults = JSON.parse(JSON.stringify(newVal));
        renderAdmin(); 
      }
      renderRank(); 
      
      const newValJson = JSON.stringify(newVal);
      if (!isInitialLoadResults && previousResultsJson && previousResultsJson !== newValJson) {
        triggerAdminUpdateNotification();
      }
      previousResultsJson = newValJson;
      isInitialLoadResults = false;
    });
    
    db.ref('bonusResults').on('value', s=>{ 
      const newVal = s.val()||{};
      BONUS_RESULTS = newVal; 
      renderBonus(); 
      if (!adminHasUnsavedChanges) {
        tempAdminBonusResults = JSON.parse(JSON.stringify(newVal));
        renderAdmin(); 
      }
      renderRank(); 
      
      const newValJson = JSON.stringify(newVal);
      if (!isInitialLoadBonus && previousBonusJson && previousBonusJson !== newValJson) {
        triggerAdminUpdateNotification();
      }
      previousBonusJson = newValJson;
      isInitialLoadBonus = false;
    });
    
    db.ref('players').on('value', s=>{ 
      PLAYERS = s.val()||{}; 
      renderRank(); 
      scheduleMatchReminders();
    });
    return true;
  }catch(e){ console.error(e); return false; }
}

/* ----------------------- RENDER: JOGOS ----------------------- */
function renderMatches(){
  const box = $('#matchesList'); if(!box || !myName) return;
  box.innerHTML='';
  let curDay=null;
  for(const m of MATCHES){
    const res = RESULTS[m.id];
    
    // Filtro de status
    if (activeStatusFilter === 'upcoming' && res) continue;
    if (activeStatusFilter === 'finished' && !res) continue;

    const dayStr = getDayHeader(m.kickoff);
    if(dayStr!==curDay){
      curDay=dayStr;
      const t=el('div','group-title'); t.innerHTML = `📅 ${dayStr}`;
      box.appendChild(t);
    }
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
        <span class="kickoff-time">⏰ ${formatKickoff(m.kickoff)}</span>
        <span style="background:var(--surface-inset); padding:2px 6px; border-radius:4px; font-weight:700; font-size:0.8em; color:var(--text-muted);">Grupo ${m.group} · ${m.round}ª rodada</span>
        ${ (locked && !res) ? ' <span class="lock-badge">🔒 Bloqueado</span>' : '' }
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
  scheduleMatchReminders();
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
  let total=0, exact=0, hit=0, riskHits=0;
  for(const m of MATCHES){
    const pt = pointsFor(p.picks?.[m.id], RESULTS[m.id]);
    if(pt>=5){total+=pt;exact++;} else if(pt===3){total+=3;hit++;}
  }
  for(const m of KO_MATCHES){
    const pt = pointsForKo(p.picks?.[m.id], RESULTS[m.id]);
    if(pt !== null) {
      total += pt;
      if (pt >= 15 || pt === 5 || pt === 8) {
        exact++;
      } else if (pt === 3 || pt === 6) {
        hit++;
      }
      const pick = p.picks?.[m.id];
      if (pick && pick.mode === 'risk' && pt === 15) {
        riskHits++;
      }
    }
  }
  const bp = bonusTotal(p.bonus);
  return {total:total+bp, exact, hit, bonus:bp, riskHits};
}
function renderRank(){
  const box=$('#rankList'); if(!box) return;
  const arr = Object.entries(PLAYERS).map(([id,p])=>({ 
    id, 
    name:p.name||'Sem nome', 
    updatedAt: p.updatedAt || Date.now(),
    ...totalFor(p) 
  }));
  if(myName && !PLAYERS[pid]) {
    arr.push({
      id:pid,
      name:myName,
      updatedAt: Date.now(),
      ...totalFor({picks:myPicks,bonus:myBonus})
    });
  }
  arr.sort((a,b)=> {
    if(b.total !== a.total) return b.total - a.total;
    if(b.exact !== a.exact) return b.exact - a.exact;
    if(b.hit !== a.hit) return b.hit - a.hit;
    if(b.bonus !== a.bonus) return b.bonus - a.bonus;
    return a.updatedAt - b.updatedAt; // Quem salvou primeiro leva vantagem
  });
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
        <div class="stats">🎯 ${p.exact} exatos · ✅ ${p.hit} resultados · 🏆 ${p.bonus} bônus${p.riskHits > 0 ? ` · 🔥 ${p.riskHits} risco` : ''}</div>
      </div>
      <div class="pts">${p.total} pts</div>`;
    box.appendChild(row);
  });
}

/* ----------------------- CLASSIFICAÇÃO DOS GRUPOS ----------------------- */
function getHeadToHead(teamA, teamB, groupName) {
  const match = MATCHES.find(m => 
    m.group === groupName && 
    ((m.home[0] === teamA && m.away[0] === teamB) || (m.home[0] === teamB && m.away[0] === teamA))
  );
  
  const res = match ? RESULTS[match.id] : null;
  if (!res || res.h === null || res.a === null) {
    return { pointsDiff: 0, gdDiff: 0, gfDiff: 0 };
  }
  
  let ptsA = 0, ptsB = 0;
  let gfA = 0, gfB = 0;
  let gaA = 0, gaB = 0;
  
  if (match.home[0] === teamA) {
    gfA = res.h;
    gaA = res.a;
    gfB = res.a;
    gaB = res.h;
  } else {
    gfA = res.a;
    gaA = res.h;
    gfB = res.h;
    gaB = res.a;
  }
  
  if (gfA > gaA) ptsA = 3;
  else if (gfA < gaA) ptsB = 3;
  else { ptsA = 1; ptsB = 1; }
  
  return {
    pointsDiff: ptsB - ptsA, // so that high points for A returns negative (comes first)
    gdDiff: (gfB - gaB) - (gfA - gaA),
    gfDiff: gfB - gfA
  };
}

function sortGroupTeams(teamsList, groupName) {
  return teamsList.sort((a, b) => {
    // 1. Pontos
    if (b.points !== a.points) return b.points - a.points;
    // 2. Saldo de gols
    if (b.gd !== a.gd) return b.gd - a.gd;
    // 3. Gols pró
    if (b.gf !== a.gf) return b.gf - a.gf;
    
    // 4. Confronto direto
    const h2h = getHeadToHead(a.name, b.name, groupName);
    if (h2h.pointsDiff !== 0) return h2h.pointsDiff;
    if (h2h.gdDiff !== 0) return h2h.gdDiff;
    if (h2h.gfDiff !== 0) return h2h.gfDiff;
    
    // 5. Ordem Alfabética (Sorteio)
    return a.name.localeCompare(b.name);
  });
}

function calculateStandings() {
  const standings = {};
  
  // Inicializa os grupos e seleções
  for (const [groupName, groupData] of Object.entries(GROUPS)) {
    standings[groupName] = {};
    for (const teamInfo of groupData.teams) {
      const teamName = teamInfo[0];
      const teamEmoji = teamInfo[1];
      standings[groupName][teamName] = {
        name: teamName,
        emoji: teamEmoji,
        points: 0,
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        gf: 0,
        ga: 0,
        gd: 0
      };
    }
  }
  
  // Processa todos os jogos que possuem resultado cadastrado
  for (const m of MATCHES) {
    const res = RESULTS[m.id];
    if (res && res.h !== null && res.a !== null) {
      const g = m.group;
      const homeTeam = m.home[0];
      const awayTeam = m.away[0];
      
      const homeData = standings[g][homeTeam];
      const awayData = standings[g][awayTeam];
      
      if (homeData && awayData) {
        homeData.played++;
        awayData.played++;
        homeData.gf += res.h;
        homeData.ga += res.a;
        awayData.gf += res.a;
        awayData.ga += res.h;
        
        if (res.h > res.a) {
          homeData.points += 3;
          homeData.wins++;
          awayData.losses++;
        } else if (res.h < res.a) {
          awayData.points += 3;
          awayData.wins++;
          homeData.losses++;
        } else {
          homeData.points += 1;
          awayData.points += 1;
          homeData.draws++;
          awayData.draws++;
        }
        
        homeData.gd = homeData.gf - homeData.ga;
        awayData.gd = awayData.gf - awayData.ga;
      }
    }
  }
  
  // Ordena cada grupo
  const sortedStandings = {};
  for (const [groupName, teamsObj] of Object.entries(standings)) {
    const teamsList = Object.values(teamsObj);
    sortedStandings[groupName] = sortGroupTeams(teamsList, groupName);
  }
  
  return sortedStandings;
}

function renderStandings() {
  const area = $('#standingsArea'); if(!area) return;
  area.innerHTML = '';
  
  const standings = calculateStandings();
  
  for (const groupName of Object.keys(GROUPS).sort()) {
    const teams = standings[groupName];
    const card = el('div', 'group-card');
    
    let rowsHtml = '';
    teams.forEach((t, index) => {
      const isZone = index < 2; // G1 e G2 avançam
      const zoneClass = isZone ? 'zone-advance' : '';
      const flagHtml = getFlagHtml(t.emoji, t.name);
      
      rowsHtml += `
        <tr class="${zoneClass}">
          <td class="pos-col"><span class="pos-badge">${index + 1}</span></td>
          <td class="team-col">
            <div class="team-name-cell">
              ${flagHtml}
              <span>${t.name}</span>
            </div>
          </td>
          <td class="pts-col">${t.points}</td>
          <td>${t.played}</td>
          <td>${t.wins}</td>
          <td>${t.draws}</td>
          <td>${t.losses}</td>
          <td>${t.gd > 0 ? '+' + t.gd : t.gd}</td>
        </tr>
      `;
    });
    
    card.innerHTML = `
      <div class="group-card-title">
        <span>Grupo ${groupName}</span>
        <small style="font-size:0.75rem; font-weight:600; color:var(--text-muted);">Copa 2026</small>
      </div>
      <table class="standings-table">
        <thead>
          <tr>
            <th style="width: 30px;">#</th>
            <th class="team-col">Seleção</th>
            <th style="width: 35px;">P</th>
            <th style="width: 25px;">J</th>
            <th style="width: 25px;">V</th>
            <th style="width: 25px;">E</th>
            <th style="width: 25px;">D</th>
            <th style="width: 30px;">SG</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
    `;
    area.appendChild(card);
  }
}


/* ----------------------- LÓGICA DO MATA-MATA (RESOLUÇÃO & RENDER) ----------------------- */
let activeKoRoundFilter = 'all';

function getResolvedKoMatches(picksOrResults) {
  const resolved = JSON.parse(JSON.stringify(KO_MATCHES));
  const findMatch = id => resolved.find(m => m.id === id);
  
  const getWinnerOf = (m) => {
    if (!m.home || !m.away) return null;
    const res = picksOrResults[m.id];
    if (!res || res.h === null || res.a === null) return null;
    if (res.h > res.a) return m.home;
    if (res.a > res.h) return m.away;
    if (res.w === 'h') return m.home;
    if (res.w === 'a') return m.away;
    return null;
  };

  const getLoserOf = (m) => {
    if (!m.home || !m.away) return null;
    const res = picksOrResults[m.id];
    if (!res || res.h === null || res.a === null) return null;
    if (res.h > res.a) return m.away;
    if (res.a > res.h) return m.home;
    if (res.w === 'h') return m.away;
    if (res.w === 'a') return m.home;
    return null;
  };
  
  for (const m of resolved) {
    const winner = getWinnerOf(m);
    if (winner && m.nextMatchId) {
      const nextMatch = findMatch(m.nextMatchId);
      if (nextMatch) {
        if (m.nextMatchPosition === 'home') {
          nextMatch.home = winner;
        } else if (m.nextMatchPosition === 'away') {
          nextMatch.away = winner;
        }
      }
    }
    
    if (m.round === 'SF' && m.loserMatchId) {
      const loser = getLoserOf(m);
      if (loser) {
        const loserMatch = findMatch(m.loserMatchId);
        if (loserMatch) {
          if (m.loserMatchPosition === 'home') {
            loserMatch.home = loser;
          } else if (m.loserMatchPosition === 'away') {
            loserMatch.away = loser;
          }
        }
      }
    }
  }
  
  return resolved;
}

function renderKoMatches(){
  const box = $('#matamataList'); if(!box || !myName) return;
  
  // Guardar altura anterior para evitar pulo de página (scroll jump)
  const oldHeight = box.offsetHeight;
  if (oldHeight > 0) {
    box.style.minHeight = oldHeight + 'px';
  }
  
  // Guardar elemento que tinha o foco atual
  const activeEl = document.activeElement;
  const activeId = activeEl ? activeEl.dataset.id : null;
  const activeSide = activeEl ? activeEl.dataset.side : null;
  
  box.innerHTML='';
  
  const resolved = getResolvedKoMatches(myPicks);
  let curRound = null;
  const ROUND_LABELS = {
    'R32': '16 Avos de Final',
    'R16': 'Oitavas de Final',
    'QF': 'Quartas de Final',
    'SF': 'Semifinais',
    '3RD': 'Disputa de 3º Lugar',
    'FIN': 'Grande Final 🏆'
  };

  for(const m of resolved){
    if (activeKoRoundFilter !== 'all') {
      if (activeKoRoundFilter === 'SF' && (m.round !== 'SF' && m.round !== '3RD' && m.round !== 'FIN')) continue;
      if (activeKoRoundFilter !== 'SF' && m.round !== activeKoRoundFilter) continue;
    }

    if(m.round !== curRound){
      curRound = m.round;
      const t = el('div', 'group-title');
      t.innerHTML = `🏁 ${ROUND_LABELS[m.round] || m.round}`;
      box.appendChild(t);
    }

    const res = RESULTS[m.id];
    const locked = !!res || Date.now() >= m.kickoff;
    const pick = myPicks[m.id] || {};
    
    const homeTeam = m.home || ["A definir", "❓"];
    const awayTeam = m.away || ["A definir", "❓"];
    
    const row = el('div', 'match-row ko-match' + (locked ? ' locked' : ''));
    
    const homeFlagHtml = homeTeam[0] !== 'A definir' ? getFlagHtml(homeTeam[1], homeTeam[0]) : `<span class="fl-emoji">${homeTeam[1]}</span>`;
    const awayFlagHtml = awayTeam[0] !== 'A definir' ? getFlagHtml(awayTeam[1], awayTeam[0]) : `<span class="fl-emoji">${awayTeam[1]}</span>`;
    
    let matchHtml = `
      <div class="team home"><span class="nm">${homeTeam[0]}</span><span class="fl">${homeFlagHtml}</span></div>
      <div class="score-area">
        <input class="score-input ko-score-input" type="number" min="0" max="99" inputmode="numeric" data-id="${m.id}" data-side="h" value="${pick.h??''}" ${locked || !m.home || !m.away ? 'disabled' : ''}/>
        <span class="x">×</span>
        <input class="score-input ko-score-input" type="number" min="0" max="99" inputmode="numeric" data-id="${m.id}" data-side="a" value="${pick.a??''}" ${locked || !m.home || !m.away ? 'disabled' : ''}/>
      </div>
      <div class="team away"><span class="fl">${awayFlagHtml}</span><span class="nm">${awayTeam[0]}</span></div>
      <div class="match-details">
        <span class="kickoff-time">⏰ ${formatKickoff(m.kickoff)}</span>
        <span style="background:var(--surface-inset); padding:2px 6px; border-radius:4px; font-weight:700; font-size:0.8em; color:var(--text-muted);">${m.label}</span>
        ${ (locked && !res) ? ' <span class="lock-badge">🔒 Bloqueado</span>' : '' }
      </div>
    `;

    if (res) {
      let officialText = `Oficial: ${getFlagHtml(getTeamFlagEmoji(homeTeam[0]), homeTeam[0])} ${res.h} × ${res.a} ${getFlagHtml(getTeamFlagEmoji(awayTeam[0]), awayTeam[0])}`;
      if (res.h === res.a) {
        const decLabel = res.dec === 'prorrogacao' ? 'Prorrogacão' : 'Pênaltis';
        const winTeam = res.w === 'h' ? homeTeam[0] : awayTeam[0];
        officialText += ` (Decidido na ${decLabel} - Vencedor: ${winTeam})`;
      }
      matchHtml += `<div class="official-result">${officialText} ${ptsTagKo(pick, res)}</div>`;
    }

    if (typeof pick.h === 'number' && typeof pick.a === 'number' && pick.h === pick.a && m.home && m.away) {
      const mode = pick.mode || 'standard';
      const winner = pick.w || '';
      const dec = pick.dec || '';
      const needsSelection = !winner || (mode === 'risk' && !dec);

      let tiebreakerHtml = `
        <div class="ko-tiebreaker-box${needsSelection ? ' pending-selection' : ''}">
          <div class="ko-tiebreaker-title">
            <span>⚖️ Decisão do Empate</span>
            ${needsSelection 
              ? `<span style="font-size: 0.8rem; color: var(--danger); font-weight:800; animation: blink 1.5s infinite;">⚠️ Seleção Pendente!</span>`
              : `<span style="font-size: 0.75rem; color: var(--text-muted);">Como este jogo será decidido?</span>`
            }
          </div>
          <div class="ko-mode-selector">
            <button class="ko-mode-btn ${mode === 'standard' ? 'active' : ''}" data-id="${m.id}" data-mode="standard" ${locked?'disabled':''}>Padrão (Seguro)</button>
            <button class="ko-mode-btn ${mode === 'risk' ? 'active' : ''}" data-id="${m.id}" data-mode="risk" ${locked?'disabled':''}>Risco/Recompensa</button>
          </div>
          <div class="ko-choice-row">
      `;

      if (mode === 'standard') {
        tiebreakerHtml += `
          <button class="ko-choice-btn ${winner === 'h' ? 'active' : ''}" data-id="${m.id}" data-winner="h" ${locked?'disabled':''}>
            ${getFlagHtml(homeTeam[1], homeTeam[0])} ${homeTeam[0]} avança
          </button>
          <button class="ko-choice-btn ${winner === 'a' ? 'active' : ''}" data-id="${m.id}" data-winner="a" ${locked?'disabled':''}>
            ${getFlagHtml(awayTeam[1], awayTeam[0])} ${awayTeam[0]} avança
          </button>
        `;
      } else {
        tiebreakerHtml += `
          <button class="ko-choice-btn risk ${winner === 'h' && dec === 'prorrogacao' ? 'active' : ''}" data-id="${m.id}" data-winner="h" data-dec="prorrogacao" ${locked?'disabled':''}>
            ${getFlagHtml(homeTeam[1], homeTeam[0])} ${homeTeam[0]} na Prorrogação
          </button>
          <button class="ko-choice-btn risk ${winner === 'h' && dec === 'penaltis' ? 'active' : ''}" data-id="${m.id}" data-winner="h" data-dec="penaltis" ${locked?'disabled':''}>
            ${getFlagHtml(homeTeam[1], homeTeam[0])} ${homeTeam[0]} nos Pênaltis
          </button>
          <button class="ko-choice-btn risk ${winner === 'a' && dec === 'prorrogacao' ? 'active' : ''}" data-id="${m.id}" data-winner="a" data-dec="prorrogacao" ${locked?'disabled':''}>
            ${getFlagHtml(awayTeam[1], awayTeam[0])} ${awayTeam[0]} na Prorrogação
          </button>
          <button class="ko-choice-btn risk ${winner === 'a' && dec === 'penaltis' ? 'active' : ''}" data-id="${m.id}" data-winner="a" data-dec="penaltis" ${locked?'disabled':''}>
            ${getFlagHtml(awayTeam[1], awayTeam[0])} ${awayTeam[0]} nos Pênaltis
          </button>
        `;
      }

      tiebreakerHtml += `</div></div>`;
      matchHtml += tiebreakerHtml;
    }

    row.innerHTML = matchHtml;
    box.appendChild(row);
  }

  box.querySelectorAll('.ko-score-input').forEach(inp => inp.addEventListener('input', onKoPickInput));
  box.querySelectorAll('.ko-mode-btn').forEach(btn => btn.addEventListener('click', onKoModeClick));
  box.querySelectorAll('.ko-choice-btn').forEach(btn => btn.addEventListener('click', onKoChoiceClick));

  // Restaurar foco do campo que estava ativo para não quebrar a digitação
  if (activeId) {
    const targetInput = box.querySelector(`input[data-id="${activeId}"][data-side="${activeSide}"]`);
    if (targetInput) {
      targetInput.focus();
    }
  }

  // Resetar min-height após o render completo
  requestAnimationFrame(() => {
    box.style.minHeight = '';
  });
}

function ptsTagKo(pick, res) {
  const p = pointsForKo(pick, res); if (p === null) return '';
  const cls = p >= 15 ? 'pts-5' : (p >= 5 ? 'pts-5' : (p >= 3 ? 'pts-3' : 'pts-0'));
  return `<span class="pts-tag ${cls}">+${p} pts</span>`;
}

function onKoPickInput(e) {
  const id = e.target.dataset.id, side = e.target.dataset.side;
  const resolved = getResolvedKoMatches(myPicks);
  const match = resolved.find(m => m.id === id);
  if (match && Date.now() >= match.kickoff) {
    showToast('Palpite bloqueado: o jogo já começou! ❌');
    renderKoMatches();
    return;
  }
  let v = e.target.value === '' ? null : Math.max(0, Math.min(99, parseInt(e.target.value, 10)));
  
  if (!myPicks[id]) myPicks[id] = { h: null, a: null, mode: 'standard', w: null, dec: null };
  myPicks[id][side] = v;

  if (myPicks[id].h !== null && myPicks[id].a !== null && myPicks[id].h !== myPicks[id].a) {
    myPicks[id].w = null;
    myPicks[id].dec = null;
  }

  setSave('⏳ Salvando…'); clearTimeout(saveTimer); saveTimer = setTimeout(savePlayer, 600);
  renderKoMatches();
  scheduleMatchReminders();
}

function onKoModeClick(e) {
  const id = e.currentTarget.dataset.id;
  const mode = e.currentTarget.dataset.mode;
  if (!myPicks[id]) return;
  
  myPicks[id].mode = mode;
  myPicks[id].w = null; 
  myPicks[id].dec = null;

  setSave('⏳ Salvando…'); clearTimeout(saveTimer); saveTimer = setTimeout(savePlayer, 600);
  renderKoMatches();
}

function onKoChoiceClick(e) {
  const id = e.currentTarget.dataset.id;
  const winner = e.currentTarget.dataset.winner;
  const dec = e.currentTarget.dataset.dec || null;
  if (!myPicks[id]) return;
  
  myPicks[id].w = winner;
  myPicks[id].dec = dec;

  setSave('⏳ Salvando…'); clearTimeout(saveTimer); saveTimer = setTimeout(savePlayer, 600);
  renderKoMatches();
}

function onAdminKoInput(e) {
  const id = e.target.dataset.id;
  const wrap = e.target.closest('.score-area');
  const hVal = wrap.querySelector('[data-side=h]').value;
  const aVal = wrap.querySelector('[data-side=a]').value;
  
  if (hVal === '' || aVal === '') {
    delete tempAdminResults[id];
  } else {
    const h = parseInt(hVal, 10);
    const a = parseInt(aVal, 10);
    
    if (!tempAdminResults[id]) {
      tempAdminResults[id] = { h, a, dec: 'normal', w: null };
    } else {
      tempAdminResults[id].h = h;
      tempAdminResults[id].a = a;
    }
    
    if (h !== a) {
      tempAdminResults[id].dec = 'normal';
      tempAdminResults[id].w = null;
    } else {
      tempAdminResults[id].dec = tempAdminResults[id].dec === 'normal' ? 'prorrogacao' : tempAdminResults[id].dec;
    }
  }
  
  updateAdminSaveButtonState(true);
  renderAdmin();
}

function onAdminKoChoiceClick(e) {
  const id = e.currentTarget.dataset.id;
  const winner = e.currentTarget.dataset.winner;
  const dec = e.currentTarget.dataset.dec;
  
  if (tempAdminResults[id]) {
    tempAdminResults[id].w = winner;
    tempAdminResults[id].dec = dec;
    updateAdminSaveButtonState(true);
    renderAdmin();
  }
}

/* ----------------------- RENDER: ADMIN ----------------------- */
function renderAdmin(){
  if(!isAdmin) return;
  const bb=$('#adminBonus'); bb.innerHTML='';
  const teamOpts = ['<option value="">— selecione —</option>']
      .concat(TEAMS.map(t=>`<option value="${t[0]}">${t[1]} ${t[0]}</option>`)).join('');
  for(const b of BONUS){
    const real = tempAdminBonusResults[b.id] ?? '';
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
  let curDay=null;
  for(const m of MATCHES){
    const dayStr = getDayHeader(m.kickoff);
    if(dayStr!==curDay){ curDay=dayStr; const t=el('div','group-title'); t.innerHTML=`📅 ${dayStr}`; box.appendChild(t); }
    const res=tempAdminResults[m.id]||{};
    const row=el('div','match-row');
    row.innerHTML=`
      <div class="team home"><span class="nm">${m.home[0]}</span><span class="fl">${getFlagHtml(m.home[1], m.home[0])}</span></div>
      <div class="score-area">
        <input class="score-input" type="number" min="0" max="99" data-id="${m.id}" data-side="h" value="${res.h??''}"/>
        <span class="x">×</span>
        <input class="score-input" type="number" min="0" max="99" data-id="${m.id}" data-side="a" value="${res.a??''}"/>
      </div>
      <div class="team away"><span class="fl">${getFlagHtml(m.away[1], m.away[0])}</span><span class="nm">${m.away[0]}</span></div>
      <div class="match-details">
        <span class="kickoff-time">⏰ ${formatKickoff(m.kickoff)}</span>
        <span style="background:var(--surface-inset); padding:2px 6px; border-radius:4px; font-weight:700; font-size:0.8em; color:var(--text-muted);">Grupo ${m.group} · ${m.round}ª rodada</span>
      </div>`;
    box.appendChild(row);
  }
  box.querySelectorAll('input').forEach(inp=> inp.addEventListener('input', onAdminInput));

  const koBox = $('#adminKoMatches'); if(!koBox) return;
  koBox.innerHTML = '';
  const resolved = getResolvedKoMatches(tempAdminResults);
  let curRound = null;
  const ROUND_LABELS = {
    'R32': '16 Avos de Final',
    'R16': 'Oitavas de Final',
    'QF': 'Quartas de Final',
    'SF': 'Semifinais',
    '3RD': 'Disputa de 3º Lugar',
    'FIN': 'Grande Final 🏆'
  };

  for(const m of resolved){
    if(m.round !== curRound){
      curRound = m.round;
      const t = el('div', 'group-title');
      t.innerHTML = `🏁 ${ROUND_LABELS[m.round] || m.round}`;
      koBox.appendChild(t);
    }
    
    const res = tempAdminResults[m.id] || { h: null, a: null, dec: 'normal', w: null };
    const homeTeam = m.home || ["A definir", "❓"];
    const awayTeam = m.away || ["A definir", "❓"];
    
    const row = el('div', 'match-row');
    let matchHtml = `
      <div class="team home"><span class="nm">${homeTeam[0]}</span><span class="fl">${homeTeam[0] !== 'A definir' ? getFlagHtml(homeTeam[1], homeTeam[0]) : `<span class="fl-emoji">${homeTeam[1]}</span>`}</span></div>
      <div class="score-area">
        <input class="score-input admin-ko-score-input" type="number" min="0" max="99" data-id="${m.id}" data-side="h" value="${res.h??''}" ${!m.home || !m.away ? 'disabled' : ''}/>
        <span class="x">×</span>
        <input class="score-input admin-ko-score-input" type="number" min="0" max="99" data-id="${m.id}" data-side="a" value="${res.a??''}" ${!m.home || !m.away ? 'disabled' : ''}/>
      </div>
      <div class="team away"><span class="fl">${awayTeam[0] !== 'A definir' ? getFlagHtml(awayTeam[1], awayTeam[0]) : `<span class="fl-emoji">${awayTeam[1]}</span>`}</span><span class="nm">${awayTeam[0]}</span></div>
      <div class="match-details">
        <span class="kickoff-time">⏰ ${formatKickoff(m.kickoff)}</span>
        <span style="background:var(--surface-inset); padding:2px 6px; border-radius:4px; font-weight:700; font-size:0.8em; color:var(--text-muted);">${m.label}</span>
      </div>
    `;

    if (typeof res.h === 'number' && typeof res.a === 'number' && res.h === res.a && m.home && m.away) {
      const dec = res.dec || '';
      const winner = res.w || '';
      const adminNeedsSelection = !winner || dec === 'normal';
      matchHtml += `
        <div class="ko-tiebreaker-box${adminNeedsSelection ? ' pending-selection' : ''}" style="grid-column: 1 / -1;">
          <div class="ko-tiebreaker-title">
            <span>⚖️ Decisão do Empate (Oficial)</span>
            ${adminNeedsSelection 
              ? `<span style="font-size: 0.8rem; color: var(--danger); font-weight:800; animation: blink 1.5s infinite;">⚠️ Seleção Pendente!</span>`
              : ''
            }
          </div>
          <div class="ko-choice-row">
            <button class="ko-choice-btn admin-ko-choice-btn ${winner === 'h' && dec === 'prorrogacao' ? 'active' : ''}" data-id="${m.id}" data-winner="h" data-dec="prorrogacao">
              ${getFlagHtml(homeTeam[1], homeTeam[0])} ${homeTeam[0]} na Prorrogação
            </button>
            <button class="ko-choice-btn admin-ko-choice-btn ${winner === 'h' && dec === 'penaltis' ? 'active' : ''}" data-id="${m.id}" data-winner="h" data-dec="penaltis">
              ${getFlagHtml(homeTeam[1], homeTeam[0])} ${homeTeam[0]} nos Pênaltis
            </button>
            <button class="ko-choice-btn admin-ko-choice-btn ${winner === 'a' && dec === 'prorrogacao' ? 'active' : ''}" data-id="${m.id}" data-winner="a" data-dec="prorrogacao">
              ${getFlagHtml(awayTeam[1], awayTeam[0])} ${awayTeam[0]} na Prorrogação
            </button>
            <button class="ko-choice-btn admin-ko-choice-btn ${winner === 'a' && dec === 'penaltis' ? 'active' : ''}" data-id="${m.id}" data-winner="a" data-dec="penaltis">
              ${getFlagHtml(awayTeam[1], awayTeam[0])} ${awayTeam[0]} nos Pênaltis
            </button>
          </div>
        </div>
      `;
    }

    row.innerHTML = matchHtml;
    koBox.appendChild(row);
  }

  koBox.querySelectorAll('.admin-ko-score-input').forEach(inp => inp.addEventListener('input', onAdminKoInput));
  koBox.querySelectorAll('.admin-ko-choice-btn').forEach(btn => btn.addEventListener('click', onAdminKoChoiceClick));
}

function updateAdminSaveButtonState(hasChanges) {
  adminHasUnsavedChanges = hasChanges;
  const btn = $('#adminSaveAllBtn');
  const status = $('#adminSaveStatus');
  if (btn && status) {
    btn.disabled = !hasChanges;
    if (hasChanges) {
      btn.textContent = '💾 Salvar Alterações';
      status.textContent = '⚠️ Há alterações não salvas!';
      status.style.color = 'var(--danger)';
    } else {
      btn.textContent = '💾 Salvar Todos os Resultados';
      status.textContent = 'Nenhuma alteração pendente';
      status.style.color = 'var(--text-muted)';
    }
  }
}

function onAdminInput(e){
  const id=e.target.dataset.id, wrap=e.target.closest('.score-area');
  const h=wrap.querySelector('[data-side=h]').value, a=wrap.querySelector('[data-side=a]').value;
  
  if (h === '' || a === '') {
    delete tempAdminResults[id];
  } else {
    tempAdminResults[id] = { h: parseInt(h, 10), a: parseInt(a, 10) };
  }
  updateAdminSaveButtonState(true);
}

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

  if (v === '') {
    delete tempAdminBonusResults[id];
  } else {
    tempAdminBonusResults[id] = v;
  }
  updateAdminSaveButtonState(true);
}

function saveAllAdminChanges() {
  if (!FB_OK) {
    showToast("⚠️ Firebase não configurado");
    return;
  }
  const btn = $('#adminSaveAllBtn');
  btn.disabled = true;
  btn.textContent = '⏳ Salvando…';
  
  Promise.all([
    db.ref('results').set(tempAdminResults),
    db.ref('bonusResults').set(tempAdminBonusResults)
  ]).then(() => {
    showToast("Resultados oficiais salvos! ✓");
    updateAdminSaveButtonState(false);
  }).catch(e => {
    console.error(e);
    showToast("❌ Erro ao salvar");
    updateAdminSaveButtonState(true);
  });
}

/* ----------------------- NOTIFICAÇÕES ----------------------- */
function showNotificationSafely(title, options) {
  if (!("Notification" in window) || Notification.permission !== "granted") return Promise.resolve(null);
  
  if ('serviceWorker' in navigator) {
    return navigator.serviceWorker.ready.then(reg => {
      return reg.showNotification(title, options);
    }).catch(err => {
      console.error('Erro ao mostrar notificação via ServiceWorker:', err);
      try {
        return new Notification(title, options);
      } catch (e) {
        console.error('Erro ao mostrar notificação via Construtor:', e);
      }
    });
  } else {
    try {
      return Promise.resolve(new Notification(title, options));
    } catch (e) {
      console.error('Erro ao mostrar notificação via Construtor:', e);
      return Promise.resolve(null);
    }
  }
}

let scheduledReminders = {};
async function scheduleMatchReminders() {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const now = Date.now();
  let missingMatches = [];
  
  let reg = null;
  if ('serviceWorker' in navigator) {
    try {
      reg = await navigator.serviceWorker.ready;
    } catch (e) {
      console.error('ServiceWorker ready error:', e);
    }
  }
  
  const supportsTriggers = ('showTrigger' in Notification.prototype) && (typeof TimestampTrigger !== 'undefined');
  
  for (const m of MATCHES) {
    const timeToKickoff = m.kickoff - now;
    const hasBet = myPicks[m.id] && myPicks[m.id].h !== null && myPicks[m.id].a !== null;
    const tag = `match-reminder-${m.id}`;
    
    if (timeToKickoff > 0 && timeToKickoff <= 24 * 60 * 60 * 1000 && !hasBet) {
      missingMatches.push(m);
      const notifyTime = timeToKickoff - 10 * 60 * 1000;
      if (notifyTime > 0) {
        if (supportsTriggers && reg) {
          try {
            // Cancelar trigger existente se houver
            const activeNotifications = await reg.getNotifications({ tag: tag, includeTriggered: true });
            activeNotifications.forEach(n => n.close());
            
            // Agendar novo trigger
            await reg.showNotification("⚽ Partida iniciando em breve!", {
              body: `O jogo ${m.home[0]} x ${m.away[0]} começa em 10 minutos e você ainda não palpitou!`,
              icon: "https://img.icons8.com/color/96/000000/world-cup.png",
              tag: tag,
              showTrigger: new TimestampTrigger(now + notifyTime)
            });
          } catch (e) {
            console.error('Erro ao agendar via TimestampTrigger:', e);
          }
        } else {
          // Fallback para setTimeout (iOS e navegadores sem suporte a triggers)
          if (scheduledReminders[m.id]) clearTimeout(scheduledReminders[m.id]);
          scheduledReminders[m.id] = setTimeout(() => {
            showNotificationSafely("⚽ Partida iniciando em breve!", {
              body: `O jogo ${m.home[0]} x ${m.away[0]} começa em 10 minutos e você ainda não palpitou!`,
              icon: "https://img.icons8.com/color/96/000000/world-cup.png",
              tag: tag
            });
          }, notifyTime);
        }
      }
    } else {
      // Se já passou, falta mais de 24h ou já tem palpite, cancela a notificação agendada
      if (supportsTriggers && reg) {
        try {
          const activeNotifications = await reg.getNotifications({ tag: tag, includeTriggered: true });
          activeNotifications.forEach(n => n.close());
        } catch (e) {
          console.error('Erro ao cancelar notificação agendada:', e);
        }
      } else {
        if (scheduledReminders[m.id]) {
          clearTimeout(scheduledReminders[m.id]);
          delete scheduledReminders[m.id];
        }
      }
    }
  }
  
  const matchesArea = $('#matchesArea');
  if (matchesArea) {
    let warningBanner = $('#upcomingWarningBanner');
    if (missingMatches.length > 0) {
      if (!warningBanner) {
        warningBanner = el('div', 'banner danger');
        warningBanner.id = 'upcomingWarningBanner';
        warningBanner.style.textAlign = 'center';
        warningBanner.style.marginBottom = '16px';
        matchesArea.insertBefore(warningBanner, matchesArea.firstChild);
      }
      warningBanner.innerHTML = `⚠️ Você tem <b>${missingMatches.length} jogo(s) nas próximas 24h</b> sem palpites! Não esqueça de preenchê-los.`;
    } else if (warningBanner) {
      warningBanner.remove();
    }
  }
}

let adminNotificationTimer = null;
function triggerAdminUpdateNotification() {
  clearTimeout(adminNotificationTimer);
  adminNotificationTimer = setTimeout(() => {
    showToast("📣 Resultados oficiais atualizados! Ranking recalculado.");
    showNotificationSafely("🏆 Bolão Copa 2026", {
      body: "O organizador lançou novos resultados oficiais! Confira o ranking atualizado.",
      icon: "https://img.icons8.com/color/96/000000/world-cup.png",
      tag: "admin-update"
    });
  }, 1000);
}

function checkNotificationSupport() {
  if (!("Notification" in window)) return;
  const card = $('#notificationCard');
  const inst = $('#pwaInstructions');
  if (!card) return;
  
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  
  if (Notification.permission === "default") {
    card.style.display = 'block';
    if (isIOS && !isStandalone) {
      inst.style.display = 'block';
      $('#enableNotificationsBtn').style.display = 'none';
    } else {
      inst.style.display = 'none';
      $('#enableNotificationsBtn').style.display = 'inline-block';
    }
  } else if (Notification.permission === "granted") {
    card.style.display = 'none';
    scheduleMatchReminders();
  } else if (Notification.permission === "denied") {
    card.style.display = 'block';
    card.innerHTML = `
      <h2 class="card-title">🔔 Notificações Bloqueadas</h2>
      <p class="text-muted">Você bloqueou as notificações para este site. Para receber avisos sobre os palpites e o ranking, ative a permissão nas configurações do seu navegador.</p>
    `;
  }
}

/* ----------------------- SINCRONIZAÇÃO ----------------------- */
function checkImportPid() {
  const urlParams = new URLSearchParams(window.location.search);
  const importPid = urlParams.get('import_pid') || urlParams.get('pid');
  if (importPid && importPid.startsWith('p_') && importPid !== localStorage.getItem('bolao_pid')) {
    if (FB_OK) {
      db.ref('players/' + importPid).once('value').then(s => {
        const d = s.val();
        const name = d ? d.name : 'Sem Nome';
        if (confirm(`Deseja sincronizar a conta de "${name}"? Seus palpites atuais neste dispositivo serão substituídos.`)) {
          localStorage.setItem('bolao_pid', importPid);
          if (d && d.name) localStorage.setItem('bolao_name', d.name);
          const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
          location.reload();
        } else {
          const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
          window.history.replaceState({}, document.title, cleanUrl);
        }
      });
    } else {
      if (confirm('Deseja carregar a conta deste link de sincronização?')) {
        localStorage.setItem('bolao_pid', importPid);
        const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        location.reload();
      }
    }
  }
}

function renderSyncSection() {
  const syncUrl = window.location.href.split('?')[0].split('#')[0] + '?import_pid=' + pid;
  $('#syncUrl').textContent = syncUrl;
  
  const syncQrContainer = $('#syncQrcode');
  if (syncQrContainer) {
    syncQrContainer.innerHTML = '';
    new QRCode(syncQrContainer, { text: syncUrl, width: 180, height: 180, colorDark: '#2563eb', colorLight: '#ffffff' });
  }
}

/* ----------------------- UI: tabs, identidade, admin, share ----------------------- */
document.querySelectorAll('nav.tabs-nav button').forEach(b=>{
  b.addEventListener('click',()=>{
    document.querySelectorAll('nav.tabs-nav button').forEach(x=>x.classList.remove('active'));
    document.querySelectorAll('section').forEach(x=>x.classList.remove('active'));
    b.classList.add('active'); $('#'+b.dataset.tab).classList.add('active');
    if (b.dataset.tab === 'tabelas') {
      renderStandings();
    }
    if (b.dataset.tab === 'matamata') {
      renderKoMatches();
    }
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
  if($('#matamataGate')) $('#matamataGate').style.display='none';
  if($('#matamataArea')) $('#matamataArea').style.display='block';
  if(FB_OK){
    db.ref('players/'+pid).once('value').then(s=>{
      const d=s.val();
      if(d){ if(d.picks) myPicks=d.picks; if(d.bonus) myBonus=d.bonus; }
      renderMatches(); renderKoMatches(); renderBonus(); savePlayer();
      checkNotificationSupport();
    });
  } else { renderMatches(); renderKoMatches(); renderBonus(); }
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
$('#adminLogout').addEventListener('click',()=>{ 
  isAdmin=false; 
  adminHasUnsavedChanges = false;
  $('#adminLogin').style.display='flex'; 
  $('#adminArea').style.display='none'; 
  $('#adminPass').value=''; 
});

$('#adminSaveAllBtn').addEventListener('click', saveAllAdminChanges);

const shareLink = window.location.href.split('?')[0].split('#')[0];
$('#shareUrl').textContent = shareLink;
new QRCode($('#qrcode'), { text:shareLink, width:200, height:200, colorDark:'#0b132b', colorLight:'#ffffff' });
$('#waBtn').addEventListener('click',()=>{
  const msg=`🏆 Bora pro Bolão da Copa 2026! Faça seus palpites e dispute o ranking com a gente:\n${shareLink}`;
  window.open('https://wa.me/?text='+encodeURIComponent(msg),'_blank');
});
$('#copyBtn').addEventListener('click',()=>{ navigator.clipboard.writeText(shareLink).then(()=>showToast('Link copiado 📋')); });

// Sync Buttons Listeners
$('#syncCopyBtn').addEventListener('click', () => {
  const syncUrl = $('#syncUrl').textContent;
  navigator.clipboard.writeText(syncUrl).then(() => showToast('Link de sincronização copiado! 📋'));
});
$('#syncWaBtn').addEventListener('click', () => {
  const syncUrl = $('#syncUrl').textContent;
  const msg = `💻 Link de Sincronização do meu Bolão:\nUse este link para abrir seus palpites em outro aparelho:\n${syncUrl}`;
  window.open('https://wa.me/?text=' + encodeURIComponent(msg), '_blank');
});
$('#syncImportBtn').addEventListener('click', () => {
  const importCode = $('#syncImportCode').value.trim();
  if (!importCode.startsWith('p_')) {
    showToast('Código de acesso inválido! ❌');
    return;
  }
  if (!FB_OK) {
    showToast('Firebase não configurado ⚠️');
    return;
  }
  db.ref('players/' + importCode).once('value').then(s => {
    const d = s.val();
    if (!d) {
      showToast('Código não encontrado! ❌');
      return;
    }
    if (confirm(`Deseja importar a conta e palpites de "${d.name || 'Sem nome'}"?`)) {
      localStorage.setItem('bolao_pid', importCode);
      if (d.name) localStorage.setItem('bolao_name', d.name);
      location.reload();
    }
  });
});

$('#enableNotificationsBtn').addEventListener('click', () => {
  if (!("Notification" in window)) return;
  Notification.requestPermission().then(permission => {
    if (permission === "granted") {
      showToast("Notificações ativadas! 🔔");
      checkNotificationSupport();
      scheduleMatchReminders();
    } else {
      showToast("Notificações não ativadas ❌");
      checkNotificationSupport();
    }
  });
});

function showToast(t){ const e=$('#toast'); e.textContent=t; e.classList.add('show'); setTimeout(()=>e.classList.remove('show'),2200); }

/* ----------------------- BOOT ----------------------- */
(function boot(){
  const ok = initFirebase();
  if(!ok){
    $('#connWarn').innerHTML = `<div class="banner danger">⚠️ <b>Firebase ainda não configurado.</b> A página funciona, mas os palpites <u>não serão salvos online</u> nem haverá ranking compartilhado até você preencher o <code>firebaseConfig</code> em <code>js/config.js</code>. Veja o passo a passo na aba <b>🔐 Admin</b> ou no README.</div>`;
  }
  
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('PWA registrado:', reg.scope))
      .catch(err => console.error('Erro no PWA sw:', err));
  }
  
  checkImportPid();
  renderSyncSection();
  
  // Listeners dos filtros de status de jogos
  document.querySelectorAll('#matchesStatusFilter .filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#matchesStatusFilter .filter-pill').forEach(x => x.classList.remove('active'));
      btn.classList.add('active');
      activeStatusFilter = btn.dataset.status;
      renderMatches();
    });
  });

  document.querySelectorAll('#matamataRoundFilter .filter-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#matamataRoundFilter .filter-pill').forEach(x => x.classList.remove('active'));
      btn.classList.add('active');
      activeKoRoundFilter = btn.dataset.round;
      renderKoMatches();
    });
  });
  
  if(myName){ $('#playerName').value=myName; enterName(); }
  renderRank();
  checkNotificationSupport();
})();
