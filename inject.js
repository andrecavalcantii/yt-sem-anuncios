// Roda no contexto da própria página (world: MAIN), antes dos scripts do YouTube.
// Apaga os campos de anúncio do JSON do player antes que o player os leia.
(() => {
  // Este script não enxerga chrome.storage; o content.js espelha o botão liga/desliga no localStorage.
  try {
    if (localStorage.getItem("ytsa-desligado") === "1") return;
  } catch {}

  const CAMPOS_DE_ANUNCIO = ["adPlacements", "adSlots", "playerAds", "adBreakHeartbeatParams"];

  function limpar(obj) {
    if (!obj || typeof obj !== "object") return obj;
    for (const alvo of [obj, obj.playerResponse]) {
      if (!alvo || typeof alvo !== "object") continue;
      for (const campo of CAMPOS_DE_ANUNCIO) {
        if (campo in alvo) delete alvo[campo];
      }
    }
    // Respostas de /next e /browse às vezes trazem uma lista com vários playerResponse.
    if (Array.isArray(obj)) obj.forEach(limpar);
    return obj;
  }

  // 1) JSON.parse: cobre as respostas que o YouTube parseia na mão.
  const parseOriginal = JSON.parse;
  JSON.parse = function (...args) {
    return limpar(parseOriginal.apply(this, args));
  };

  // 2) Response.json(): cobre as chamadas fetch para /youtubei/v1/player e afins.
  const jsonOriginal = Response.prototype.json;
  Response.prototype.json = function (...args) {
    return jsonOriginal.apply(this, args).then(limpar);
  };

  // 3) Variáveis globais que vêm embutidas no HTML do primeiro carregamento.
  for (const nome of ["ytInitialPlayerResponse", "ytInitialData"]) {
    let valor;
    try {
      Object.defineProperty(window, nome, {
        configurable: true,
        get: () => valor,
        set: (novo) => { valor = limpar(novo); },
      });
    } catch {}
  }
})();
