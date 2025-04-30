
/* ------------------------------------------------------------------
   Guia Inteligente de Raças – Lógica principal (Versão v4)
   Inclui DOMContentLoaded e ativação correta do botão
------------------------------------------------------------------ */

document.addEventListener("DOMContentLoaded", () => {
  const PESOS_CRITERIOS = {
    espaco:1, tempo:2, energia:3, criancas:3, pelos:1,
    orcamento:1, tamanho:5, alergia:3, clima:1,
    experiencia:2, objetivo:5, ausencia:2
  };
  const CRITERIOS = Object.keys(PESOS_CRITERIOS);

  const form = document.getElementById("quiz");
  const btn = document.getElementById("btn");
  const output = document.getElementById("resultados");
  let BREEDS = [];

  // Desabilita o botão até o catálogo estar pronto
  btn.disabled = true;
  btn.textContent = "Carregando raças...";

  // Função com timeout para carregar imagens externas
  function loadExternalImage(url) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject("Timeout"), 5000);
      if (url.includes("dog.ceo/api")) {
        fetch(url).then(r => r.json())
          .then(js => {
            clearTimeout(timeout);
            js.status==="success" ? resolve(js.message) : reject();
          })
          .catch(err => { clearTimeout(timeout); reject(err); });
      } else {
        const img = new Image();
        img.onload = () => { clearTimeout(timeout); resolve(url); };
        img.onerror = () => { clearTimeout(timeout); reject(`Erro: ${url}`); };
        img.src = url;
      }
    });
  }

  // Carrega o catálogo de raças
  fetch("breeds.json")
    .then(r => r.json())
    .then(j => {
      BREEDS = j;
      btn.disabled = false;
      btn.textContent = "Buscar raças";
    })
    .catch(e => {
      console.error("Erro ao carregar breeds.json:", e);
      btn.textContent = "Erro no catálogo";
    });

  form.addEventListener("submit", ev => {
    ev.preventDefault();
    btn.disabled = true;
    btn.textContent = "Carregando raças...";
    const ans = Object.fromEntries(new FormData(form).entries());
    CRITERIOS.forEach(c => ans[c] = Number(ans[c]) || 3);

    const grupo = ans.objetivo <= 2 ? "companhia" : ans.objetivo >= 4 ? "guarda" : "esporte";
    const MAX = CRITERIOS.reduce((s, c) => s + PESOS_CRITERIOS[c] * 4, 0);
    const porteOk = s => ans.tamanho >= 4 ? s >= 4 : ans.tamanho <= 2 ? s <= 2 : true;

    const ranked = BREEDS
      .filter(r => porteOk(r.pesos?.tamanho || 3))
      .map(r => {
        const diff = CRITERIOS.reduce((sum, c) =>
          sum + PESOS_CRITERIOS[c] * Math.abs((r.pesos?.[c] || 3) - ans[c]), 0);
        return {
          ...r,
          compat: Math.round(100 - (diff / MAX) * 100),
          grupo: r.grupo ||
            (r.pesos?.objetivo <= 2 ? "companhia" :
             r.pesos?.objetivo >= 4 ? "guarda" : "esporte")
        };
      })
      .sort((a, b) => b.compat - a.compat);

    const selecionadas = ranked.filter(r => r.grupo === grupo).slice(0, 3);
    render(selecionadas.length ? selecionadas : ranked.slice(0, 3));
    btn.disabled = false;
    btn.textContent = "Buscar raças";
  });

  function render(list) {
    output.innerHTML = "";
    output.hidden = false;
    list.forEach(item => output.appendChild(card(item)));
  }

  function card(breed) {
    const container = document.createElement("div");
    container.className = "card";
    const imgEl = document.createElement("img");
    imgEl.loading = "lazy";
    imgEl.alt = breed.nome;
    // placeholder inicial
    imgEl.src = `https://via.placeholder.com/600x400?text=${encodeURIComponent(breed.nome)}`;
    container.append(imgEl);

    const candidates = [
      ...(breed.images || []),
      `https://source.unsplash.com/600x400/?${encodeURIComponent(breed.nome + " dog")}`,
      `https://dog.ceo/api/breed/${breed.slug.split("/").pop().toLowerCase()}/images/random`
    ];

    let idx = 0;
    (function tryNext() {
      if (idx >= candidates.length) return;
      loadExternalImage(candidates[idx])
        .then(src => { imgEl.src = src; })
        .catch(() => { idx++; tryNext(); });
    })();

    const info = document.createElement("div");
    info.innerHTML = `
      <h3>${breed.nome}</h3>
      <p>${breed.texto || "(descrição em breve)"}</p>
      <div class="barra-externa">
        <div class="barra-interna" style="width:${breed.compat}%">
          ${breed.compat}%
        </div>
      </div>
      <small>Grupo: <strong>${breed.grupo}</strong> • Criador: <strong>${breed.criador || "(...)"}</strong></small>
    `;
    container.append(info);
    return container;
  }
});
