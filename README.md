# 🏆 Bolão da Copa 2026

Landing page (HTML/CSS/JS puro) para um bolão da fase de grupos da Copa do Mundo 2026,
com ranking ao vivo via **Firebase Realtime Database**, QR Code e compartilhamento no WhatsApp.

## ✨ Funcionalidades

- **72 jogos** da fase de grupos (12 grupos × 6 jogos), agrupados por grupo e rodada.
- **Pontuação dos jogos:** 3 pts por acertar o resultado (vitória/empate/derrota) e
  +2 pts por cravar o placar exato (**total 5**). *Cumulativo.*
- **Palpites de bônus do torneio:** campeão (18), vice (15), 3º (12), artilheiro (12),
  maior assistente (12), MVP (12), melhor goleiro (12) e melhor defesa (10).
- **Prazo dos bônus:** travam automaticamente no início das oitavas (**4/jul/2026**).
- **Ranking ao vivo** (jogos + bônus) atualizando em tempo real para todos.
- **Painel Admin** protegido por senha para lançar os resultados oficiais.
- **QR Code** e botão de **WhatsApp** para divulgar o link.
- Anti-trapaça simples: o palpite de um jogo trava quando o resultado oficial é lançado.

## 📁 Estrutura

```
bolao-copa-2026/
├─ index.html          # marcação da página
├─ css/styles.css      # estilos
└─ js/
   ├─ config.js        # 👈 EDITE AQUI: Firebase, senha, pontuação, prazos, bônus
   ├─ data.js          # grupos, times e geração dos 72 jogos
   └─ app.js           # lógica (pontuação, Firebase, render, UI)
```

## 🔧 Configurar o Firebase (5 min)

1. Acesse <https://console.firebase.google.com> e **crie um projeto**.
2. Menu lateral: **Build → Realtime Database → Criar banco de dados** → escolha um local e
   inicie em **modo de teste** (ajuste as regras depois, veja abaixo).
3. Em **⚙️ Configurações do projeto → Seus apps**, clique em **Web (`</>`)** e registre o app.
4. Copie o objeto `firebaseConfig` e cole em **`js/config.js`** (substituindo o que está lá).
5. Ainda em `js/config.js`, troque **`ADMIN_PASSWORD`** por uma senha sua.
6. Abra o `index.html` no navegador. Pronto. ✅

> A `apiKey` do app Web **não é secreta** — é um identificador público do projeto.
> A proteção real vem das **regras do Realtime Database**.

### 🔒 Regras sugeridas do Realtime Database

O modo de teste expira e deixa tudo aberto. Para um bolão entre amigos, uma regra simples
que permite ler/escrever (sem login) é suficiente para começar:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

Quer um pouco mais de proteção (impedir que apaguem dados de terceiros e limitar tamanho)?
Use algo como:

```json
{
  "rules": {
    "players":       { ".read": true, "$pid": { ".write": true } },
    "results":       { ".read": true, ".write": true },
    "bonusResults":  { ".read": true, ".write": true }
  }
}
```

> Observação: a senha de admin é uma barreira **no front-end** (não impede alguém técnico de
> escrever direto no banco). Para um bolão de amigos é o suficiente. Se quiser segurança real,
> o próximo passo seria habilitar **Firebase Authentication** e restringir `results`/`bonusResults`
> a um UID específico.

## ✏️ Personalizar

Tudo o que você normalmente vai querer mexer está em **`js/config.js`**:

| O quê | Variável |
|---|---|
| Conexão com o Firebase | `firebaseConfig` |
| Senha do organizador | `ADMIN_PASSWORD` |
| Pontos por resultado / placar exato | `PTS_RESULT`, `PTS_EXACT_BONUS` |
| Prazo dos palpites de bônus | `BONUS_DEADLINE` |
| Lista e pontuação dos bônus | `BONUS` |

Os **grupos, seleções e jogos** ficam em **`js/data.js`** (objeto `GROUPS`).
Confira a tabela oficial da FIFA antes do torneio e ajuste se algum confronto mudar.

## 🚀 Publicar (escolha uma)

- **GitHub Pages:** suba a pasta num repositório → Settings → Pages → branch `main` → `/root`.
- **Netlify / Vercel:** arraste a pasta na interface (deploy em segundos).
- O QR Code e o botão do WhatsApp apontam **sozinhos** para a URL onde o site estiver.

## 🧮 Como os pontos são calculados

**Jogos** (por partida):

| Situação | Pontos |
|---|---|
| Cravou o placar exato | 5 (3 + 2) |
| Acertou só o resultado (vencedor/empate) | 3 |
| Errou | 0 |

**Bônus** (uma vez, no fim): cada palpite certo soma os pontos da tabela. Campos de jogador
(artilheiro, MVP, etc.) comparam o texto **ignorando acentos e maiúsculas** — combine com a
galera um padrão (ex.: usar o sobrenome) para evitar divergência.

---

Feito para a Copa do Mundo FIFA 2026 🇺🇸🇲🇽🇨🇦 — bons palpites!
