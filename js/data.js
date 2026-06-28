/* =====================================================================
   DADOS DA COPA 2026  —  grupos, jogos e seleções
   Edite GROUPS livremente se algum confronto/seleção mudar.
   (Confira sempre a tabela oficial da FIFA antes do torneio.)
   ===================================================================== */

const GROUPS = {
  A: { date:"11–24 jun", teams:[["México","🇲🇽"],["Coreia do Sul","🇰🇷"],["África do Sul","🇿🇦"],["Repúplica Tcheca","🇨🇿"]] },
  B: { date:"12–24 jun", teams:[["Canadá","🇨🇦"],["Suíça","🇨🇭"],["Catar","🇶🇦"],["Bósnia e Herz.","🇧🇦"]] },
  C: { date:"13–24 jun", teams:[["Brasil","🇧🇷"],["Marrocos","🇲🇦"],["Escócia","🏴󠁧󠁢󠁳󠁣󠁴󠁿"],["Haiti","🇭🇹"]] },
  D: { date:"12–25 jun", teams:[["Estados Unidos","🇺🇸"],["Paraguai","🇵🇾"],["Turquia","🇹🇷"],["Austrália","🇦🇺"]] },
  E: { date:"14–25 jun", teams:[["Alemanha","🇩🇪"],["Equador","🇪🇨"],["Costa do Marfim","🇨🇮"],["Curaçao","🇨🇼"]] },
  F: { date:"14–25 jun", teams:[["Holanda","🇳🇱"],["Japão","🇯🇵"],["Suécia","🇸🇪"],["Tunísia","🇹🇳"]] },
  G: { date:"15–27 jun", teams:[["Bélgica","🇧🇪"],["Egito","🇪🇬"],["Irã","🇮🇷"],["Nova Zelândia","🇳🇿"]] },
  H: { date:"15–26 jun", teams:[["Espanha","🇪🇸"],["Uruguai","🇺🇾"],["Arábia Saudita","🇸🇦"],["Cabo Verde","🇨🇻"]] },
  I: { date:"16–26 jun", teams:[["França","🇫🇷"],["Senegal","🇸🇳"],["Noruega","🇳🇴"],["Iraque","🇮🇶"]] },
  J: { date:"16–27 jun", teams:[["Argentina","🇦🇷"],["Áustria","🇦🇹"],["Argélia","🇩🇿"],["Jordânia","🇯🇴"]] },
  K: { date:"17–27 jun", teams:[["Portugal","🇵🇹"],["Colômbia","🇨🇴"],["Uzbequistão","🇺🇿"],["RD Congo","🇨🇩"]] },
  L: { date:"17–27 jun", teams:[["Inglaterra","🏴󠁧󠁢󠁥󠁮󠁧󠁿"],["Croácia","🇭🇷"],["Gana","🇬🇭"],["Panamá","🇵🇦"]] }
};

/* =====================================================================
   CONJUNTOS DE CONFRONTOS OFICIAIS (GERADO AUTOMATICAMENTE)
   ===================================================================== */

const MATCHES = [
  { id: "A-02", group: "A", round: 1, home: GROUPS.A.teams[0], away: GROUPS.A.teams[2], kickoff: new Date("2026-06-11T16:00:00-03:00").getTime() },
  { id: "A-31", group: "A", round: 1, home: GROUPS.A.teams[1], away: GROUPS.A.teams[3], kickoff: new Date("2026-06-11T23:00:00-03:00").getTime() },
  { id: "A-23", group: "A", round: 2, home: GROUPS.A.teams[3], away: GROUPS.A.teams[2], kickoff: new Date("2026-06-18T13:00:00-03:00").getTime() },
  { id: "A-01", group: "A", round: 2, home: GROUPS.A.teams[0], away: GROUPS.A.teams[1], kickoff: new Date("2026-06-18T22:00:00-03:00").getTime() },
  { id: "A-03", group: "A", round: 3, home: GROUPS.A.teams[3], away: GROUPS.A.teams[0], kickoff: new Date("2026-06-24T22:00:00-03:00").getTime() },
  { id: "A-12", group: "A", round: 3, home: GROUPS.A.teams[2], away: GROUPS.A.teams[1], kickoff: new Date("2026-06-24T22:00:00-03:00").getTime() },
  { id: "B-03", group: "B", round: 1, home: GROUPS.B.teams[0], away: GROUPS.B.teams[3], kickoff: new Date("2026-06-12T16:00:00-03:00").getTime() },
  { id: "B-12", group: "B", round: 1, home: GROUPS.B.teams[2], away: GROUPS.B.teams[1], kickoff: new Date("2026-06-13T16:00:00-03:00").getTime() },
  { id: "B-31", group: "B", round: 2, home: GROUPS.B.teams[1], away: GROUPS.B.teams[3], kickoff: new Date("2026-06-18T16:00:00-03:00").getTime() },
  { id: "B-02", group: "B", round: 2, home: GROUPS.B.teams[0], away: GROUPS.B.teams[2], kickoff: new Date("2026-06-18T19:00:00-03:00").getTime() },
  { id: "B-01", group: "B", round: 3, home: GROUPS.B.teams[1], away: GROUPS.B.teams[0], kickoff: new Date("2026-06-24T16:00:00-03:00").getTime() },
  { id: "B-23", group: "B", round: 3, home: GROUPS.B.teams[3], away: GROUPS.B.teams[2], kickoff: new Date("2026-06-24T16:00:00-03:00").getTime() },
  { id: "C-01", group: "C", round: 1, home: GROUPS.C.teams[0], away: GROUPS.C.teams[1], kickoff: new Date("2026-06-13T19:00:00-03:00").getTime() },
  { id: "C-23", group: "C", round: 1, home: GROUPS.C.teams[3], away: GROUPS.C.teams[2], kickoff: new Date("2026-06-13T22:00:00-03:00").getTime() },
  { id: "C-12", group: "C", round: 2, home: GROUPS.C.teams[2], away: GROUPS.C.teams[1], kickoff: new Date("2026-06-19T19:00:00-03:00").getTime() },
  { id: "C-03", group: "C", round: 2, home: GROUPS.C.teams[0], away: GROUPS.C.teams[3], kickoff: new Date("2026-06-19T21:30:00-03:00").getTime() },
  { id: "C-02", group: "C", round: 3, home: GROUPS.C.teams[2], away: GROUPS.C.teams[0], kickoff: new Date("2026-06-24T19:00:00-03:00").getTime() },
  { id: "C-31", group: "C", round: 3, home: GROUPS.C.teams[1], away: GROUPS.C.teams[3], kickoff: new Date("2026-06-24T19:00:00-03:00").getTime() },
  { id: "D-01", group: "D", round: 1, home: GROUPS.D.teams[0], away: GROUPS.D.teams[1], kickoff: new Date("2026-06-12T22:00:00-03:00").getTime() },
  { id: "D-23", group: "D", round: 1, home: GROUPS.D.teams[3], away: GROUPS.D.teams[2], kickoff: new Date("2026-06-14T01:00:00-03:00").getTime() },
  { id: "D-03", group: "D", round: 2, home: GROUPS.D.teams[0], away: GROUPS.D.teams[3], kickoff: new Date("2026-06-19T16:00:00-03:00").getTime() },
  { id: "D-12", group: "D", round: 2, home: GROUPS.D.teams[2], away: GROUPS.D.teams[1], kickoff: new Date("2026-06-20T00:00:00-03:00").getTime() },
  { id: "D-02", group: "D", round: 3, home: GROUPS.D.teams[2], away: GROUPS.D.teams[0], kickoff: new Date("2026-06-25T23:00:00-03:00").getTime() },
  { id: "D-31", group: "D", round: 3, home: GROUPS.D.teams[1], away: GROUPS.D.teams[3], kickoff: new Date("2026-06-25T23:00:00-03:00").getTime() },
  { id: "E-03", group: "E", round: 1, home: GROUPS.E.teams[0], away: GROUPS.E.teams[3], kickoff: new Date("2026-06-14T14:00:00-03:00").getTime() },
  { id: "E-12", group: "E", round: 1, home: GROUPS.E.teams[2], away: GROUPS.E.teams[1], kickoff: new Date("2026-06-14T20:00:00-03:00").getTime() },
  { id: "E-02", group: "E", round: 2, home: GROUPS.E.teams[0], away: GROUPS.E.teams[2], kickoff: new Date("2026-06-20T17:00:00-03:00").getTime() },
  { id: "E-31", group: "E", round: 2, home: GROUPS.E.teams[1], away: GROUPS.E.teams[3], kickoff: new Date("2026-06-20T21:00:00-03:00").getTime() },
  { id: "E-23", group: "E", round: 3, home: GROUPS.E.teams[3], away: GROUPS.E.teams[2], kickoff: new Date("2026-06-25T17:00:00-03:00").getTime() },
  { id: "E-01", group: "E", round: 3, home: GROUPS.E.teams[1], away: GROUPS.E.teams[0], kickoff: new Date("2026-06-25T17:00:00-03:00").getTime() },
  { id: "F-01", group: "F", round: 1, home: GROUPS.F.teams[0], away: GROUPS.F.teams[1], kickoff: new Date("2026-06-14T17:00:00-03:00").getTime() },
  { id: "F-23", group: "F", round: 1, home: GROUPS.F.teams[2], away: GROUPS.F.teams[3], kickoff: new Date("2026-06-14T23:00:00-03:00").getTime() },
  { id: "F-02", group: "F", round: 2, home: GROUPS.F.teams[0], away: GROUPS.F.teams[2], kickoff: new Date("2026-06-20T14:00:00-03:00").getTime() },
  { id: "F-31", group: "F", round: 2, home: GROUPS.F.teams[3], away: GROUPS.F.teams[1], kickoff: new Date("2026-06-21T01:00:00-03:00").getTime() },
  { id: "F-12", group: "F", round: 3, home: GROUPS.F.teams[1], away: GROUPS.F.teams[2], kickoff: new Date("2026-06-25T20:00:00-03:00").getTime() },
  { id: "F-03", group: "F", round: 3, home: GROUPS.F.teams[3], away: GROUPS.F.teams[0], kickoff: new Date("2026-06-25T20:00:00-03:00").getTime() },
  { id: "G-01", group: "G", round: 1, home: GROUPS.G.teams[0], away: GROUPS.G.teams[1], kickoff: new Date("2026-06-15T16:00:00-03:00").getTime() },
  { id: "G-23", group: "G", round: 1, home: GROUPS.G.teams[2], away: GROUPS.G.teams[3], kickoff: new Date("2026-06-15T22:00:00-03:00").getTime() },
  { id: "G-02", group: "G", round: 2, home: GROUPS.G.teams[0], away: GROUPS.G.teams[2], kickoff: new Date("2026-06-21T16:00:00-03:00").getTime() },
  { id: "G-31", group: "G", round: 2, home: GROUPS.G.teams[3], away: GROUPS.G.teams[1], kickoff: new Date("2026-06-21T22:00:00-03:00").getTime() },
  { id: "G-12", group: "G", round: 3, home: GROUPS.G.teams[1], away: GROUPS.G.teams[2], kickoff: new Date("2026-06-27T00:00:00-03:00").getTime() },
  { id: "G-03", group: "G", round: 3, home: GROUPS.G.teams[3], away: GROUPS.G.teams[0], kickoff: new Date("2026-06-27T00:00:00-03:00").getTime() },
  { id: "H-03", group: "H", round: 1, home: GROUPS.H.teams[0], away: GROUPS.H.teams[3], kickoff: new Date("2026-06-15T13:00:00-03:00").getTime() },
  { id: "H-12", group: "H", round: 1, home: GROUPS.H.teams[2], away: GROUPS.H.teams[1], kickoff: new Date("2026-06-15T19:00:00-03:00").getTime() },
  { id: "H-02", group: "H", round: 2, home: GROUPS.H.teams[0], away: GROUPS.H.teams[2], kickoff: new Date("2026-06-21T13:00:00-03:00").getTime() },
  { id: "H-31", group: "H", round: 2, home: GROUPS.H.teams[1], away: GROUPS.H.teams[3], kickoff: new Date("2026-06-21T19:00:00-03:00").getTime() },
  { id: "H-23", group: "H", round: 3, home: GROUPS.H.teams[3], away: GROUPS.H.teams[2], kickoff: new Date("2026-06-26T21:00:00-03:00").getTime() },
  { id: "H-01", group: "H", round: 3, home: GROUPS.H.teams[1], away: GROUPS.H.teams[0], kickoff: new Date("2026-06-26T21:00:00-03:00").getTime() },
  { id: "I-01", group: "I", round: 1, home: GROUPS.I.teams[0], away: GROUPS.I.teams[1], kickoff: new Date("2026-06-16T16:00:00-03:00").getTime() },
  { id: "I-23", group: "I", round: 1, home: GROUPS.I.teams[3], away: GROUPS.I.teams[2], kickoff: new Date("2026-06-16T19:00:00-03:00").getTime() },
  { id: "I-03", group: "I", round: 2, home: GROUPS.I.teams[0], away: GROUPS.I.teams[3], kickoff: new Date("2026-06-22T18:00:00-03:00").getTime() },
  { id: "I-12", group: "I", round: 2, home: GROUPS.I.teams[2], away: GROUPS.I.teams[1], kickoff: new Date("2026-06-22T21:00:00-03:00").getTime() },
  { id: "I-02", group: "I", round: 3, home: GROUPS.I.teams[2], away: GROUPS.I.teams[0], kickoff: new Date("2026-06-26T16:00:00-03:00").getTime() },
  { id: "I-31", group: "I", round: 3, home: GROUPS.I.teams[1], away: GROUPS.I.teams[3], kickoff: new Date("2026-06-26T16:00:00-03:00").getTime() },
  { id: "J-02", group: "J", round: 1, home: GROUPS.J.teams[0], away: GROUPS.J.teams[2], kickoff: new Date("2026-06-16T22:00:00-03:00").getTime() },
  { id: "J-31", group: "J", round: 1, home: GROUPS.J.teams[1], away: GROUPS.J.teams[3], kickoff: new Date("2026-06-17T01:00:00-03:00").getTime() },
  { id: "J-01", group: "J", round: 2, home: GROUPS.J.teams[0], away: GROUPS.J.teams[1], kickoff: new Date("2026-06-22T14:00:00-03:00").getTime() },
  { id: "J-23", group: "J", round: 2, home: GROUPS.J.teams[3], away: GROUPS.J.teams[2], kickoff: new Date("2026-06-23T00:00:00-03:00").getTime() },
  { id: "J-12", group: "J", round: 3, home: GROUPS.J.teams[2], away: GROUPS.J.teams[1], kickoff: new Date("2026-06-27T23:00:00-03:00").getTime() },
  { id: "J-03", group: "J", round: 3, home: GROUPS.J.teams[3], away: GROUPS.J.teams[0], kickoff: new Date("2026-06-27T23:00:00-03:00").getTime() },
  { id: "K-03", group: "K", round: 1, home: GROUPS.K.teams[0], away: GROUPS.K.teams[3], kickoff: new Date("2026-06-17T14:00:00-03:00").getTime() },
  { id: "K-12", group: "K", round: 1, home: GROUPS.K.teams[2], away: GROUPS.K.teams[1], kickoff: new Date("2026-06-17T23:00:00-03:00").getTime() },
  { id: "K-02", group: "K", round: 2, home: GROUPS.K.teams[0], away: GROUPS.K.teams[2], kickoff: new Date("2026-06-23T14:00:00-03:00").getTime() },
  { id: "K-31", group: "K", round: 2, home: GROUPS.K.teams[1], away: GROUPS.K.teams[3], kickoff: new Date("2026-06-23T23:00:00-03:00").getTime() },
  { id: "K-01", group: "K", round: 3, home: GROUPS.K.teams[1], away: GROUPS.K.teams[0], kickoff: new Date("2026-06-27T20:30:00-03:00").getTime() },
  { id: "K-23", group: "K", round: 3, home: GROUPS.K.teams[3], away: GROUPS.K.teams[2], kickoff: new Date("2026-06-27T20:30:00-03:00").getTime() },
  { id: "L-01", group: "L", round: 1, home: GROUPS.L.teams[0], away: GROUPS.L.teams[1], kickoff: new Date("2026-06-17T17:00:00-03:00").getTime() },
  { id: "L-23", group: "L", round: 1, home: GROUPS.L.teams[2], away: GROUPS.L.teams[3], kickoff: new Date("2026-06-17T20:00:00-03:00").getTime() },
  { id: "L-02", group: "L", round: 2, home: GROUPS.L.teams[0], away: GROUPS.L.teams[2], kickoff: new Date("2026-06-23T17:00:00-03:00").getTime() },
  { id: "L-31", group: "L", round: 2, home: GROUPS.L.teams[3], away: GROUPS.L.teams[1], kickoff: new Date("2026-06-23T20:00:00-03:00").getTime() },
  { id: "L-03", group: "L", round: 3, home: GROUPS.L.teams[3], away: GROUPS.L.teams[0], kickoff: new Date("2026-06-27T18:00:00-03:00").getTime() },
  { id: "L-12", group: "L", round: 3, home: GROUPS.L.teams[1], away: GROUPS.L.teams[2], kickoff: new Date("2026-06-27T18:00:00-03:00").getTime() },
];

const KO_MATCHES = [
  // Round of 32 (16 avos de final)
  { id: "KO-73", round: "R32", label: "16 avos (Jogo 73)", home: ["África do Sul", "🇿🇦"], away: ["Canadá", "🇨🇦"], kickoff: new Date("2026-06-28T16:00:00-03:00").getTime(), nextMatchId: "KO-90", nextMatchPosition: "home" },
  { id: "KO-74", round: "R32", label: "16 avos (Jogo 74)", home: ["Alemanha", "🇩🇪"], away: ["Paraguai", "🇵🇾"], kickoff: new Date("2026-06-29T17:30:00-03:00").getTime(), nextMatchId: "KO-89", nextMatchPosition: "home" },
  { id: "KO-75", round: "R32", label: "16 avos (Jogo 75)", home: ["Holanda", "🇳🇱"], away: ["Marrocos", "🇲🇦"], kickoff: new Date("2026-06-29T22:00:00-03:00").getTime(), nextMatchId: "KO-90", nextMatchPosition: "away" },
  { id: "KO-76", round: "R32", label: "16 avos (Jogo 76)", home: ["Brasil", "🇧🇷"], away: ["Japão", "🇯🇵"], kickoff: new Date("2026-06-29T14:00:00-03:00").getTime(), nextMatchId: "KO-91", nextMatchPosition: "home" },
  { id: "KO-77", round: "R32", label: "16 avos (Jogo 77)", home: ["França", "🇫🇷"], away: ["Suécia", "🇸🇪"], kickoff: new Date("2026-06-30T18:00:00-03:00").getTime(), nextMatchId: "KO-89", nextMatchPosition: "away" },
  { id: "KO-78", round: "R32", label: "16 avos (Jogo 78)", home: ["Costa do Marfim", "🇨🇮"], away: ["Noruega", "🇳🇴"], kickoff: new Date("2026-06-30T14:00:00-03:00").getTime(), nextMatchId: "KO-91", nextMatchPosition: "away" },
  { id: "KO-79", round: "R32", label: "16 avos (Jogo 79)", home: ["México", "🇲🇽"], away: ["Equador", "🇪🇨"], kickoff: new Date("2026-06-30T22:00:00-03:00").getTime(), nextMatchId: "KO-92", nextMatchPosition: "home" },
  { id: "KO-80", round: "R32", label: "16 avos (Jogo 80)", home: ["Inglaterra", "🏴󠁧󠁢󠁥󠁮󠁧󠁿"], away: ["RD Congo", "🇨🇩"], kickoff: new Date("2026-07-01T13:00:00-03:00").getTime(), nextMatchId: "KO-92", nextMatchPosition: "away" },
  { id: "KO-81", round: "R32", label: "16 avos (Jogo 81)", home: ["Estados Unidos", "🇺🇸"], away: ["Bósnia e Herz.", "🇧🇦"], kickoff: new Date("2026-07-01T21:00:00-03:00").getTime(), nextMatchId: "KO-94", nextMatchPosition: "home" },
  { id: "KO-82", round: "R32", label: "16 avos (Jogo 82)", home: ["Bélgica", "🇧🇪"], away: ["Senegal", "🇸🇳"], kickoff: new Date("2026-07-01T17:00:00-03:00").getTime(), nextMatchId: "KO-94", nextMatchPosition: "away" },
  { id: "KO-83", round: "R32", label: "16 avos (Jogo 83)", home: ["Portugal", "🇵🇹"], away: ["Croácia", "🇭🇷"], kickoff: new Date("2026-07-02T20:00:00-03:00").getTime(), nextMatchId: "KO-93", nextMatchPosition: "home" },
  { id: "KO-84", round: "R32", label: "16 avos (Jogo 84)", home: ["Espanha", "🇪🇸"], away: ["Áustria", "🇦🇹"], kickoff: new Date("2026-07-02T16:00:00-03:00").getTime(), nextMatchId: "KO-93", nextMatchPosition: "away" },
  { id: "KO-85", round: "R32", label: "16 avos (Jogo 85)", home: ["Suíça", "🇨🇭"], away: ["Argélia", "🇩🇿"], kickoff: new Date("2026-07-03T00:00:00-03:00").getTime(), nextMatchId: "KO-96", nextMatchPosition: "home" },
  { id: "KO-86", round: "R32", label: "16 avos (Jogo 86)", home: ["Argentina", "🇦🇷"], away: ["Cabo Verde", "🇨🇻"], kickoff: new Date("2026-07-03T19:00:00-03:00").getTime(), nextMatchId: "KO-95", nextMatchPosition: "home" },
  { id: "KO-87", round: "R32", label: "16 avos (Jogo 87)", home: ["Colômbia", "🇨🇴"], away: ["Gana", "🇬🇭"], kickoff: new Date("2026-07-03T22:30:00-03:00").getTime(), nextMatchId: "KO-96", nextMatchPosition: "away" },
  { id: "KO-88", round: "R32", label: "16 avos (Jogo 88)", home: ["Austrália", "🇦🇺"], away: ["Egito", "🇪🇬"], kickoff: new Date("2026-07-03T15:00:00-03:00").getTime(), nextMatchId: "KO-95", nextMatchPosition: "away" },

  // Round of 16 (Oitavas de final)
  { id: "KO-89", round: "R16", label: "Oitavas (Jogo 89)", home: null, away: null, kickoff: new Date("2026-07-04T16:00:00-03:00").getTime(), nextMatchId: "KO-97", nextMatchPosition: "home" },
  { id: "KO-90", round: "R16", label: "Oitavas (Jogo 90)", home: null, away: null, kickoff: new Date("2026-07-04T20:00:00-03:00").getTime(), nextMatchId: "KO-97", nextMatchPosition: "away" },
  { id: "KO-91", round: "R16", label: "Oitavas (Jogo 91)", home: null, away: null, kickoff: new Date("2026-07-05T16:00:00-03:00").getTime(), nextMatchId: "KO-99", nextMatchPosition: "home" },
  { id: "KO-92", round: "R16", label: "Oitavas (Jogo 92)", home: null, away: null, kickoff: new Date("2026-07-05T20:00:00-03:00").getTime(), nextMatchId: "KO-99", nextMatchPosition: "away" },
  { id: "KO-93", round: "R16", label: "Oitavas (Jogo 93)", home: null, away: null, kickoff: new Date("2026-07-06T16:00:00-03:00").getTime(), nextMatchId: "KO-98", nextMatchPosition: "home" },
  { id: "KO-94", round: "R16", label: "Oitavas (Jogo 94)", home: null, away: null, kickoff: new Date("2026-07-06T20:00:00-03:00").getTime(), nextMatchId: "KO-98", nextMatchPosition: "away" },
  { id: "KO-95", round: "R16", label: "Oitavas (Jogo 95)", home: null, away: null, kickoff: new Date("2026-07-07T16:00:00-03:00").getTime(), nextMatchId: "KO-100", nextMatchPosition: "home" },
  { id: "KO-96", round: "R16", label: "Oitavas (Jogo 96)", home: null, away: null, kickoff: new Date("2026-07-07T20:00:00-03:00").getTime(), nextMatchId: "KO-100", nextMatchPosition: "away" },

  // Quarterfinals (Quartas de final)
  { id: "KO-97", round: "QF", label: "Quartas (Jogo 97)", home: null, away: null, kickoff: new Date("2026-07-09T18:00:00-03:00").getTime(), nextMatchId: "KO-101", nextMatchPosition: "home" },
  { id: "KO-98", round: "QF", label: "Quartas (Jogo 98)", home: null, away: null, kickoff: new Date("2026-07-10T18:00:00-03:00").getTime(), nextMatchId: "KO-101", nextMatchPosition: "away" },
  { id: "KO-99", round: "QF", label: "Quartas (Jogo 99)", home: null, away: null, kickoff: new Date("2026-07-11T16:00:00-03:00").getTime(), nextMatchId: "KO-102", nextMatchPosition: "home" },
  { id: "KO-100", round: "QF", label: "Quartas (Jogo 100)", home: null, away: null, kickoff: new Date("2026-07-11T20:00:00-03:00").getTime(), nextMatchId: "KO-102", nextMatchPosition: "away" },

  // Semifinals (Semifinais)
  { id: "KO-101", round: "SF", label: "Semifinal (Jogo 101)", home: null, away: null, kickoff: new Date("2026-07-15T20:00:00-03:00").getTime(), nextMatchId: "KO-104", nextMatchPosition: "home", loserMatchId: "KO-103", loserMatchPosition: "home" },
  { id: "KO-102", round: "SF", label: "Semifinal (Jogo 102)", home: null, away: null, kickoff: new Date("2026-07-16T20:00:00-03:00").getTime(), nextMatchId: "KO-104", nextMatchPosition: "away", loserMatchId: "KO-103", loserMatchPosition: "away" },

  // Third Place (Disputa de 3º lugar)
  { id: "KO-103", round: "3RD", label: "Disputa de 3º Lugar", home: null, away: null, kickoff: new Date("2026-07-18T17:00:00-03:00").getTime() },

  // Final
  { id: "KO-104", round: "FIN", label: "Grande Final 🏆", home: null, away: null, kickoff: new Date("2026-07-19T16:00:00-03:00").getTime() }
];

/* Lista de seleções (para os dropdowns de bônus), em ordem alfabética. */
const TEAMS = [];
for(const g of Object.keys(GROUPS)) for(const t of GROUPS[g].teams) TEAMS.push(t);
TEAMS.sort((a,b)=>a[0].localeCompare(b[0],'pt'));

