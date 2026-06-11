/* =====================================================================
   DADOS DA COPA 2026  —  grupos, jogos e seleções
   Edite GROUPS livremente se algum confronto/seleção mudar.
   (Confira sempre a tabela oficial da FIFA antes do torneio.)
   ===================================================================== */

const GROUPS = {
  A: { date:"11–24 jun", teams:[["México","🇲🇽"],["Coreia do Sul","🇰🇷"],["África do Sul","🇿🇦"],["Repúplica Tcheca","🇨🇿"]] },
  B: { date:"13–24 jun", teams:[["Canadá","🇨🇦"],["Suíça","🇨🇭"],["Catar","🇶🇦"],["Bósnia e Herz.","🇧🇦"]] },
  C: { date:"14–24 jun", teams:[["Brasil","🇧🇷"],["Marrocos","🇲🇦"],["Escócia","🏴󠁧󠁢󠁳󠁣󠁴󠁿"],["Haiti","🇭🇹"]] },
  D: { date:"12–24 jun", teams:[["Estados Unidos","🇺🇸"],["Paraguai","🇵🇾"],["Turquia","🇹🇷"],["Austrália","🇦🇺"]] },
  E: { date:"13–25 jun", teams:[["Alemanha","🇩🇪"],["Equador","🇪🇨"],["Costa do Marfim","🇨🇮"],["Curaçao","🇨🇼"]] },
  F: { date:"14–25 jun", teams:[["Holanda","🇳🇱"],["Japão","🇯🇵"],["Suécia","🇸🇪"],["Tunísia","🇹🇳"]] },
  G: { date:"15–26 jun", teams:[["Bélgica","🇧🇪"],["Egito","🇪🇬"],["Irã","🇮🇷"],["Nova Zelândia","🇳🇿"]] },
  H: { date:"15–26 jun", teams:[["Espanha","🇪🇸"],["Uruguai","🇺🇾"],["Arábia Saudita","🇸🇦"],["Cabo Verde","🇨🇻"]] },
  I: { date:"16–26 jun", teams:[["França","🇫🇷"],["Senegal","🇸🇳"],["Noruega","🇳🇴"],["Iraque","🇮🇶"]] },
  J: { date:"16–27 jun", teams:[["Argentina","🇦🇷"],["Áustria","🇦🇹"],["Argélia","🇩🇿"],["Jordânia","🇯🇴"]] },
  K: { date:"17–27 jun", teams:[["Portugal","🇵🇹"],["Colômbia","🇨🇴"],["Uzbequistão","🇺🇿"],["RD Congo","🇨🇩"]] },
  L: { date:"17–27 jun", teams:[["Inglaterra","🏴󠁧󠁢󠁥󠁮󠁧󠁿"],["Croácia","🇭🇷"],["Gana","🇬🇭"],["Panamá","🇵🇦"]] }
};

/* Esquema round-robin: cada grupo de 4 vira 6 jogos (todas as combinações). */
const RR = [
  { round:1, pairs:[[0,1],[2,3]] },
  { round:2, pairs:[[0,2],[3,1]] },
  { round:3, pairs:[[0,3],[1,2]] }
];

/* Gera os 72 jogos com um id estável (ex.: "C-01"). */
const MATCHES = [];
for(const g of Object.keys(GROUPS)){
  for(const r of RR){
    for(const [i,j] of r.pairs){
      MATCHES.push({
        id:`${g}-${i}${j}`, group:g, round:r.round,
        home:GROUPS[g].teams[i], away:GROUPS[g].teams[j]
      });
    }
  }
}

/* Lista de seleções (para os dropdowns de bônus), em ordem alfabética. */
const TEAMS = [];
for(const g of Object.keys(GROUPS)) for(const t of GROUPS[g].teams) TEAMS.push(t);
TEAMS.sort((a,b)=>a[0].localeCompare(b[0],'pt'));
