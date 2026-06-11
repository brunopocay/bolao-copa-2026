# 🚀 Subir no GitHub Pages — passo a passo

> ⚠️ **Antes de tudo:** existe uma pasta `.git` quebrada aqui (criada por um ambiente
> que não tem permissão total nesta pasta do OneDrive). **Apague-a primeiro.**

## 0) Apagar o `.git` quebrado

**PowerShell** (na pasta do projeto):
```powershell
Remove-Item -Recurse -Force .git
```
Ou simplesmente delete a pasta `.git` pelo Explorador de Arquivos
(ative "Itens ocultos" para vê-la).

## 1) Inicializar o repositório

```bash
git init
git add .
git commit -m "Bolão da Copa 2026"
git branch -M main
```

## 2) Criar o repositório no GitHub

### Opção A — com GitHub CLI (mais rápido)
```bash
gh repo create bolao-copa-2026 --public --source=. --remote=origin --push
```

### Opção B — pela web
1. Crie um repositório vazio em <https://github.com/new> (ex.: `bolao-copa-2026`), **sem** README.
2. Conecte e envie:
```bash
git remote add origin https://github.com/SEU_USUARIO/bolao-copa-2026.git
git push -u origin main
```

## 3) Ativar o GitHub Pages

No repositório: **Settings → Pages → Build and deployment**
- **Source:** `Deploy from a branch`
- **Branch:** `main` / pasta `/ (root)` → **Save**

Em ~1 minuto o site fica no ar em:
```
https://SEU_USUARIO.github.io/bolao-copa-2026/
```

## 4) Conferir

- Abra a URL acima, configure o Firebase em `js/config.js` (se ainda não fez) e
  faça `git commit` + `git push` para publicar a alteração.
- O **QR Code** e o botão de **WhatsApp** já vão apontar sozinhos para essa URL.

---

### 💡 Dica sobre OneDrive + Git
Versionar uma pasta dentro do OneDrive funciona, mas o OneDrive fica tentando
sincronizar os arquivos internos do `.git`, o que às vezes gera conflitos.
Se quiser evitar isso, mova o projeto para fora do OneDrive
(ex.: `C:\Users\brunopocay\dev\bolao-copa-2026`) antes do `git init`.
