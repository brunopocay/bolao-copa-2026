/* =====================================================================
   CONFIGURAÇÃO DO BOLÃO  —  edite só este arquivo para personalizar
   ===================================================================== */

/* 1) FIREBASE ---------------------------------------------------------
   Cole aqui o objeto que o Firebase te dá em:
   Configurações do projeto → Seus apps → Web (</>).
   Obs.: a apiKey do app Web NÃO é secreta (é um identificador público),
   então pode versionar normalmente. A segurança fica nas regras do
   Realtime Database (veja o README).
--------------------------------------------------------------------- */
const firebaseConfig = {
  apiKey: "AIzaSyBuy3VJGUNCeAV_mgpr5ngYAeEeJ2aGkWM",
  authDomain: "copadomundo2026-3bee6.firebaseapp.com",
  databaseURL: "https://copadomundo2026-3bee6-default-rtdb.firebaseio.com",
  projectId: "copadomundo2026-3bee6",
  storageBucket: "copadomundo2026-3bee6.firebasestorage.app",
  messagingSenderId: "53131250579",
  appId: "1:53131250579:web:979a1252c933e0a77cf666",
  measurementId: "G-04FNBPKM0Y"
};

/* 2) SENHA DO ORGANIZADOR --------------------------------------------
   Usada para abrir o painel Admin e lançar os resultados oficiais.
   Armazenada como Hash SHA-256 para evitar exposição no GitHub.
--------------------------------------------------------------------- */
const ADMIN_PASSWORD_HASH = "6bf5086020f645d33f22ebabccd32aa32dc82d21ababef2574158fd388850176";

/* 3) REGRAS DE PONTUAÇÃO DOS JOGOS -----------------------------------
   Acertou o resultado (vencedor ou empate) ......... PTS_RESULT
   Cravou também o placar exato ..................... PTS_RESULT + PTS_EXACT_BONUS
--------------------------------------------------------------------- */
const PTS_RESULT      = 3;  // acertou vencedor OU empate
const PTS_EXACT_BONUS = 2;  // bônus extra por cravar o placar exato (total 5)

/* 4) PRAZO DOS PALPITES DE BÔNUS -------------------------------------
   Campeão, vice, 3º, artilheiro, etc. travam nesta data/hora.
   Padrão: início das oitavas de final (4 de julho de 2026, hora de Brasília).
--------------------------------------------------------------------- */
const BONUS_DEADLINE = new Date("2026-07-04T00:00:00-03:00").getTime();

/* 5) PALPITES DE BÔNUS DO TORNEIO ------------------------------------
   type: 'team'   -> dropdown com as 48 seleções
   type: 'player' -> campo de texto (compara ignorando acento/maiúsculas)
   pts:  pontos por acerto
--------------------------------------------------------------------- */
const BONUS = [
  { id:'champion', label:'🥇 Campeão',                 type:'team',   pts:18 },
  { id:'runnerup', label:'🥈 Vice-campeão',            type:'team',   pts:15 },
  { id:'third',    label:'🥉 Terceiro colocado',       type:'team',   pts:12 },
  { id:'scorer',   label:'⚽ Artilheiro',               type:'player', pts:12 },
  { id:'assist',   label:'🅰️ Maior assistente',         type:'player', pts:12 },
  { id:'mvp',      label:'⭐ Jogador mais valioso',      type:'player', pts:12 },
  { id:'keeper',   label:'🧤 Melhor goleiro',           type:'player', pts:12 },
  { id:'defense',  label:'🛡️ Melhor defesa (seleção)',  type:'team',   pts:10 }
];

/* 6) SOBRESCRITA DE HORÁRIOS DE JOGOS ---------------------------------
   Não é mais necessário usar overrides pois todos os jogos oficiais estão
   definidos de forma estática no arquivo js/data.js.
--------------------------------------------------------------------- */
const MATCH_KICKOFF_OVERRIDES = {};
