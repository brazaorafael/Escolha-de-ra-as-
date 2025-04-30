// script.js
const PESOS_CRITERIOS = {
  espaco:1, tempo:2, energia:3, criancas:3, pelos:1,
  orcamento:1, tamanho:5, alergia:3, clima:1,
  experiencia:2, objetivo:5, ausencia:2
};
const CRITERIOS = Object.keys(PESOS_CRITERIOS);

const form   = document.getElementById("quiz");
const btn    = document.getElementById("btn");
const output = document.getElementById("resultados");
let   BREEDS = [];

// Carrega o JSON validado
fetch("breeds_valid.json")
  .then(res => res.json())
  .then(json => {
    BREEDS = json;
    btn.disabled = false; // habilita botão após carregar
  })
  .catch(err => {
    console.error("Erro ao carregar breeds_valid.json:", err);
    btn.textContent = "Erro no catálogo";
  });

form.addEventListener("submit", ev => {
  ev.preventDefault();

  // pega respostas do quiz
  const ans = Object.fromEntries(new FormData(form).entries());
  CRITERIOS.forEach(c => ans[c] = Number(ans[c]) || 3);

  // define grupo
  const grupo = ans.objetivo <= 2
    ? "companhia"
    : ans.objetivo >= 4
      ? "guarda"
      : "esporte";

  const MAX = CRITERIOS.reduce((sum, c) => sum + PESOS_CRITERIOS[c] * 4, 0);
  const porteOk = size => ans.tamanho >= 4
    ? size >= 4
    : ans.tamanho <= 2
      ? size <= 2
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

  // pega top 3 do grupo
  const recomendadas = ranked.filter(r => r.grupo === grupo).slice(0, 3);
  render(recomendadas.length ? recomendadas : ranked.slice(0, 3));
});

function render(list) {
  output.innerHTML = "";
  list.forEach(r => output.appendChild(createCard(r)));
  output.hidden = false;
}

function createCard(r) {
  // **monta o array de tentativas de URL, na ordem:**
  const sources = [
    ...(r.valid_images  || []),
    ...(r.images        || []),
    // se quiser, pode reativar estes dois:
    // `https://dog.ceo/api/breed/${r.slug.split("/").pop()}/images/random`,
    // `https://source.unsplash.com/600x400/?${encodeURIComponent(r.nome)}+dog`,
    `https://via.placeholder.com/600x400?text=${encodeURIComponent(r.nome)}`
  ];

  const img = document.createElement("img");
  img.loading = "lazy";
  img.alt = r.nome;
  img.dataset.idx = "0";
  img.src = sources[0];

  img.onerror = () => {
    let idx = parseInt(img.dataset.idx, 10) + 1;
    if (idx < sources.length) {
      img.src = sources[idx];
      img.dataset.idx = idx.toString();
    }
  };

  const card = document.createElement("div");
  card.className = "card";
  card.append(img);
  card.innerHTML += `
    <h3>${r.nome}</h3>
    <p>${r.texto || "(sem descrição)"}</p>
    <div class="barra-externa">
      <div class="barra-interna" style="width:${r.compat}%">
        ${r.compat}%
      </div>
    </div>
    <small>Grupo: <strong>${r.grupo}</strong> • Criador: <strong>${r.criador || "—"}</strong></small>
  `;
  return card;
}
