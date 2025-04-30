/* ------------------------------------------------------------------
   Guia Inteligente de Raças – Lógica principal
   (versão atualizada) – Fallback melhorado de imagens
------------------------------------------------------------------ */
const PESOS_CRITERIOS = {
  espaco: 1, tempo: 2, energia: 3, criancas: 3, pelos: 1,
  orcamento: 1, tamanho: 5, alergia: 3, clima: 1,
  experiencia: 2, objetivo: 5, ausencia: 2
};
const CRITERIOS = Object.keys(PESOS_CRITERIOS);

const form   = document.getElementById("quiz");
const btn    = document.getElementById("btn");
const output = document.getElementById("resultados");
let BREEDS = [];

fetch("breeds.json")
  .then(r => r.json())
  .then(j => { BREEDS = j; btn.disabled = false; })
  .catch(e => { console.error(e); btn.textContent = "Erro no catálogo"; });

form.addEventListener("submit", ev => {
  ev.preventDefault();
  const ans = Object.fromEntries(new FormData(form).entries());
  CRITERIOS.forEach(c => ans[c] = Number(ans[c]) || 3);

  const grupo = ans.objetivo <= 2 ? "companhia" :
                ans.objetivo >= 4 ? "guarda" : "esporte";

  const MAX = CRITERIOS.reduce((s, c) => s + PESOS_CRITERIOS[c] * 4, 0);
  const porteOk = r => {
    const t = r.pesos.tamanho || 3;
    return ans.tamanho >= 4 ? t >= 4 :
           ans.tamanho <= 2 ? t <= 2 : true;
  };

  const ranked = BREEDS
    .filter(porteOk)
    .map(r => {
      const diff = CRITERIOS.reduce((s, c) =>
        s + PESOS_CRITERIOS[c] * Math.abs((r.pesos[c] || 3) - ans[c]), 0);
      return {
        ...r,
        compat: Math.round(100 - (diff / MAX) * 100),
        grupo: r.grupo || (r.pesos.objetivo <= 2 ? "companhia" : r.pesos.objetivo >= 4 ? "guarda" : "esporte")
      };
    })
    .sort((a, b) => b.compat - a.compat);

  const selecionadas = ranked.filter(r => r.grupo === grupo).slice(0, 3);
  render(selecionadas.length ? selecionadas : ranked.slice(0, 3));
});

function render(list) {
  output.innerHTML = "";
  list.forEach(r => output.appendChild(card(r)));
  output.hidden = false;
}

function card(r) {
  // Prepare fallback image candidates
  const candidates = [
    ...(r.images || []),
    `https://source.unsplash.com/600x400/?${encodeURIComponent(r.nome + ' dog')}`,
    `https://source.unsplash.com/600x400/?dog`,
    `https://via.placeholder.com/600x400?text=${encodeURIComponent(r.nome)}`
  ];

  const img = document.createElement("img");
  img.loading = "lazy";
  img.alt = r.nome;
  img.dataset.idx = "0";
  img.src = candidates[0];
  img.onerror = function() {
    let idx = parseInt(this.dataset.idx, 10) + 1;
    if (idx < candidates.length) {
      this.src = candidates[idx];
      this.dataset.idx = idx.toString();
    }
  };

  const div = document.createElement("div");
  div.className = "card";
  div.appendChild(img);
  const info = `
    <h3>${r.nome}</h3>
    <p>${r.texto || "(descrição em breve)"}</p>
    <div class="barra-externa">
      <div class="barra-interna" style="width:${r.compat}%">
        ${r.compat}%
      </div>
    </div>
    <small>Grupo: <strong>${r.grupo}</strong> • Criador: <strong>${r.criador || "(...)"}</strong></small>
  `;
  div.innerHTML += info;
  return div;
}