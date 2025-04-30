// script.js

const PESOS_CRITERIOS = {
  espaco:    1,
  tempo:     2,
  energia:   3,
  criancas:  3,
  pelos:     1,
  orcamento: 1,
  tamanho:   5,
  alergia:   3,
  clima:     1,
  experiencia: 2,
  objetivo:    5,
  ausencia:    2
};
const CRITERIOS = Object.keys(PESOS_CRITERIOS);

const form   = document.getElementById("quiz");
const btn    = document.getElementById("btn");
const output = document.getElementById("resultados");
let   BREEDS = [];

// 1) Carrega o catálogo validado
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

// 2) Quando o formulário for enviado
form.addEventListener("submit", ev => {
  ev.preventDefault();

  // Lê respostas e garante número de 1 a 5
  const ans = Object.fromEntries(new FormData(form).entries());
  CRITERIOS.forEach(c => ans[c] = Math.min(5, Math.max(1, Number(ans[c]) || 3)));

  // Define grupo alvo
  const grupo = ans.objetivo <= 2 ? "companhia"
              : ans.objetivo >= 4 ? "guarda"
              : "esporte";

  // Pontuação máxima (diferença absoluta 4 em cada critério)
  const MAX = CRITERIOS.reduce((sum, c) => sum + PESOS_CRITERIOS[c] * 4, 0);

  // Função para filtrar porte
  const porteOk = tamanhoBreed =>
    ans.tamanho >= 4 ? tamanhoBreed >= 4
    : ans.tamanho <= 2 ? tamanhoBreed <= 2
    : true;

  // Calcula compatibilidade e ordena
  const ranked = BREEDS
    .filter(r => porteOk(r.pesos.tamanho || 3))
    .map(r => {
      const diff = CRITERIOS.reduce((sum, c) =>
        sum + PESOS_CRITERIOS[c] * Math.abs((r.pesos[c] || 3) - ans[c])
      , 0);
      return { ...r, compat: Math.round(100 - (diff / MAX) * 100) };
    })
    .sort((a, b) => b.compat - a.compat);

  // Pega top-3 do mesmo grupo ou, se não tiver, top-3 geral
  const top = ranked.filter(r => r.grupo === grupo).slice(0, 3);
  render(top.length ? top : ranked.slice(0, 3));
});

// 3) Renderiza as cards
function render(list) {
  output.innerHTML = "";
  list.forEach(r => output.appendChild(card(r)));
  output.hidden = false;
}

// 4) Gera o elemento de cada card, com fallback de imagens
function card(r) {
  // slug para Dog CEO
  const slug = r.slug?.split("/").pop().toLowerCase();

  // fontes: valid_images → images → Unsplash → Dog CEO → placeholder
  const fontes = [
    ...(r.valid_images || []),
    ...(r.images       || []),
    `https://source.unsplash.com/600x400/?${encodeURIComponent(r.nome)}+dog`,
    `dogCEO://${slug}`,
    `https://via.placeholder.com/600x400?text=${encodeURIComponent(r.nome)}`
  ];

  const img = document.createElement("img");
  img.loading     = "lazy";
  img.alt         = r.nome;
  img.dataset.idx = "0";
  img.src         = fontes[0];

  img.onerror = async () => {
    let idx = parseInt(img.dataset.idx, 10) + 1;
    if (idx >= fontes.length) return;

    const url = fontes[idx];
    if (url.startsWith("dogCEO://")) {
      // tenta Dog CEO API
      const breed = url.replace("dogCEO://", "");
      try {
        const res = await fetch(`https://dog.ceo/api/breed/${breed}/images/random`);
        const js  = await res.json();
        img.src = js.status === "success" ? js.message : fontes[idx + 1] || img.src;
      } catch {
        img.src = fontes[idx + 1] || img.src;
      }
    } else {
      img.src = url;
    }
    img.dataset.idx = idx.toString();
  };

  // monta o card
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
