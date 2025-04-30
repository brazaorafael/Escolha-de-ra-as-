// script.js
const PESOS_CRITERIOS = {
  espaco: 1, tempo: 2, energia: 3, criancas: 3, pelos: 1,
  orcamento: 1, tamanho: 5, alergia: 3, clima: 1,
  experiencia: 2, objetivo: 5, ausencia: 2
};
const CRITERIOS = Object.keys(PESOS_CRITERIOS);

const form   = document.getElementById("quiz");
const btn    = document.getElementById("btn");
const output = document.getElementById("resultados");
let   BREEDS = [];

// 1) Carrega o arquivo breeds_valid.json
fetch("breeds_valid.json")
  .then(res => {
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json();
  })
  .then(json => {
    BREEDS = json;
    btn.disabled = false;
  })
  .catch(err => {
    console.error("❌ Não carregou breeds_valid.json:", err);
    btn.textContent = "Erro no catálogo";
  });

form.addEventListener("submit", ev => {
  ev.preventDefault();
  const ans = Object.fromEntries(new FormData(form).entries());
  CRITERIOS.forEach(c => ans[c] = Number(ans[c]) || 3);

  const grupo = ans.objetivo <= 2
    ? "companhia"
    : ans.objetivo >= 4
      ? "guarda"
      : "esporte";

  const MAX = CRITERIOS.reduce((s, c) => s + PESOS_CRITERIOS[c] * 4, 0);
  const porteOk = tamanho => ans.tamanho >= 4
    ? tamanho >= 4
    : ans.tamanho <= 2
      ? tamanho <= 2
      : true;

  const ranked = BREEDS
    .filter(r => porteOk(r.pesos.tamanho || 3))
    .map(r => {
      const diff = CRITERIOS.reduce((s, c) =>
        s + PESOS_CRITERIOS[c] * Math.abs((r.pesos[c] || 3) - ans[c]), 0);
      return {
        ...r,
        compat: Math.round(100 - (diff / MAX) * 100)
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
  // Tenta carregar todas as fontes antes de cair no placeholder
  const fontes = [
    ...(r.valid_images || []),
    ...(r.images       || []),
    `https://via.placeholder.com/600x400?text=${encodeURIComponent(r.nome)}`
  ];

  const img = document.createElement("img");
  img.loading = "lazy";
  img.alt     = r.nome;
  img.dataset.idx = "0";
  img.src     = fontes[0];

  img.onerror = () => {
    let idx = parseInt(img.dataset.idx, 10) + 1;
    if (idx < fontes.length) {
      img.src = fontes[idx];
      img.dataset.idx = idx.toString();
    }
  };

  const div = document.createElement("div");
  div.className = "card";
  div.append(img);
  div.innerHTML += `
    <h3>${r.nome}</h3>
    <p>${r.texto || "(sem descrição)"}</p>
    <div class="barra-externa">
      <div class="barra-interna" style="width:${r.compat}%">
        ${r.compat}%
      </div>
    </div>
    <small>Grupo: <strong>${r.grupo}</strong> • Criador: <strong>${r.criador || "—"}</strong></small>
  `;
  return div;
}
