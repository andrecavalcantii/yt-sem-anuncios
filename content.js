// Plano B: se algum anúncio em vídeo escapar da limpeza, pula ou acelera até o fim.
(() => {
  const BOTOES_PULAR = [
    ".ytp-skip-ad-button",
    ".ytp-ad-skip-button",
    ".ytp-ad-skip-button-modern",
    ".ytp-ad-overlay-close-button",
  ].join(",");

  let anunciosPulados = 0;
  let ligado = true;

  // O localStorage é lido pelo inject.js (que não acessa chrome.storage) e o atributo no <html>
  // liga ou desliga as regras do styles.css.
  function aplicarEstado(novo) {
    ligado = novo;
    try {
      if (ligado) localStorage.removeItem("ytsa-desligado");
      else localStorage.setItem("ytsa-desligado", "1");
    } catch {}
    document.documentElement?.toggleAttribute("data-ytsa-desligado", !ligado);
  }

  try {
    aplicarEstado(localStorage.getItem("ytsa-desligado") !== "1");
  } catch {}
  chrome.storage.local.get({ ligado: true }).then((s) => aplicarEstado(s.ligado));

  chrome.storage.onChanged.addListener((mudancas, area) => {
    if (area === "local" && "ligado" in mudancas) aplicarEstado(mudancas.ligado.newValue);
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.tipo !== "aplicar-e-recarregar") return;
    aplicarEstado(msg.ligado);
    // Só o frame principal recarrega; os iframes vêm junto.
    if (window === window.top) location.reload();
  });

  function tratarAnuncio() {
    if (!ligado) return;
    const player = document.querySelector(".html5-video-player");
    if (!player) return;

    if (player.classList.contains("ad-showing") || player.classList.contains("ad-interrupting")) {
      const video = player.querySelector("video");
      if (video) {
        video.muted = true;
        video.playbackRate = 16;
        if (Number.isFinite(video.duration) && video.duration > 0) {
          video.currentTime = video.duration;
        }
      }
      document.querySelectorAll(BOTOES_PULAR).forEach((b) => b.click());
      anunciosPulados++;
    }

    // Aviso de "bloqueadores de anúncios não são permitidos": some com ele e volta a tocar.
    const aviso = document.querySelector("ytd-enforcement-message-view-model");
    if (aviso) {
      aviso.closest("tp-yt-paper-dialog")?.remove();
      aviso.remove();
      document.querySelector("tp-yt-iron-overlay-backdrop")?.remove();
      const video = document.querySelector("video");
      if (video?.paused) video.play().catch(() => {});
    }
  }

  const observador = new MutationObserver(tratarAnuncio);

  function iniciar() {
    observador.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["class"],
    });
    tratarAnuncio();
  }

  if (document.documentElement) iniciar();
  else document.addEventListener("DOMContentLoaded", iniciar);

  // Só pra depurar: digite __ytAnunciosPulados() no console da aba.
  window.__ytAnunciosPulados = () => anunciosPulados;
})();
