# YT Sem Anúncios

Extensão (Manifest V3) que tira anúncios do YouTube. Funciona no Chrome/Edge/Brave e no Firefox 128+.

## Como funciona

| Arquivo | O que faz |
|---|---|
| `inject.js` | Roda dentro da página antes do YouTube e apaga `adPlacements`, `adSlots`, `playerAds` do JSON do player (via `JSON.parse`, `Response.json` e `ytInitialPlayerResponse`). Sem esses campos o player não agenda anúncio. |
| `rules.json` | Bloqueia requisições de anúncio/rastreamento (doubleclick, pagead, ptracking…). |
| `content.js` | Plano B: se o player entrar em modo anúncio, muta, acelera pra 16x, pula pro fim e clica em "Pular". Também remove o aviso anti-bloqueador. |
| `styles.css` | Esconde anúncios do feed, da busca e da barra lateral. |
| `popup.html` / `popup.js` | Botão de ligar/desligar no ícone da extensão. Guarda o estado em `chrome.storage`, liga/desliga as regras de rede e recarrega a aba do YouTube. |

O `inject.js` roda dentro da página e não acessa `chrome.storage`, então o `content.js` espelha o estado em `localStorage["ytsa-desligado"]` e no atributo `data-ytsa-desligado` do `<html>` (usado pelo CSS).

## Instalar

**Baixar**: botão verde **Code → Download ZIP** nesta página, depois extraia numa pasta fixa (o navegador lê dela, não apague).
Ou: `git clone https://github.com/andrecavalcantii/yt-sem-anuncios.git` (e `git pull` pra atualizar).

**Chrome / Edge / Brave**
1. Abra `chrome://extensions` (Edge: `edge://extensions`, Brave: `brave://extensions`)
2. Ligue **Modo do desenvolvedor**
3. **Carregar sem compactação** → escolha a pasta que tem o `manifest.json`
   (o ZIP do GitHub extrai como `yt-sem-anuncios-main`; se o Windows criar uma pasta dentro da outra, escolha a de dentro)

**Firefox**
1. Abra `about:debugging#/runtime/this-firefox`
2. **Carregar extensão temporária** → escolha `manifest.json`
   (some ao fechar o navegador; pra deixar fixo precisa assinar no addons.mozilla.org)

Depois de mexer no código: recarregue a extensão e dê F5 no YouTube.

## Quando parar de funcionar

O YouTube muda nomes de campos e classes com frequência. Os pontos que costumam quebrar:
- nomes dos campos em `CAMPOS_DE_ANUNCIO` (`inject.js`)
- seletores em `styles.css` e `BOTOES_PULAR` (`content.js`)
- classe `ad-showing` do player

Pra investigar: abra o DevTools, aba Network, filtre por `player`, e procure campos com "ad" no JSON da resposta.
