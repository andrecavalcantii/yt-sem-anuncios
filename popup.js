const estado = document.getElementById("estado");
const botao = document.getElementById("alternar");

function mostrar(ligado) {
  estado.textContent = ligado ? "Bloqueando anúncios." : "Desligado. Anúncios aparecem normalmente.";
  botao.textContent = ligado ? "Desligar" : "Ligar";
  botao.classList.toggle("desligado", !ligado);
}

chrome.storage.local.get({ ligado: true }).then(({ ligado }) => mostrar(ligado));

// Esconder Shorts é só CSS: o content.js escuta chrome.storage e aplica na hora, sem recarregar.
const shorts = document.getElementById("shorts");
chrome.storage.local.get({ esconderShorts: true }).then(({ esconderShorts }) => (shorts.checked = esconderShorts));
shorts.addEventListener("change", () => chrome.storage.local.set({ esconderShorts: shorts.checked }));

botao.addEventListener("click", async () => {
  const { ligado } = await chrome.storage.local.get({ ligado: true });
  const novo = !ligado;

  await chrome.storage.local.set({ ligado: novo });
  await chrome.declarativeNetRequest.updateEnabledRulesets(
    novo ? { enableRulesetIds: ["anuncios"] } : { disableRulesetIds: ["anuncios"] }
  );
  mostrar(novo);

  // A limpeza do player só vale a partir do próximo carregamento, então recarrega a aba do YouTube.
  const [aba] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (aba?.url && /^https?:\/\/([^/]+\.)?youtube\.com\//.test(aba.url)) {
    chrome.tabs.sendMessage(aba.id, { tipo: "aplicar-e-recarregar", ligado: novo }).catch(() => {
      chrome.tabs.reload(aba.id);
    });
  }
});
