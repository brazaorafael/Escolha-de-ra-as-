/* ------------------------------------------------------------------
   Guia Inteligente de Raças – Lógica principal
   (versão 2025-04-29) – Fallback cíclico de imagens
------------------------------------------------------------------ */

const PESOS_CRITERIOS = {
  espaco:  1,
  tempo:   2,
  energia: 3,
  criancas:3,
  pelos:   1,
  orcamento:1,
  tamanho: 5,
  alergia: 3,
  clima:   1,
  experiencia:2,
  objetivo:  5,
  ausencia:  2
};
const CRITERIOS = Object.keys(PESOS_CRITERIOS);

const form   = document.getElementById("quiz");
const btn    = document.getElementById("btn");
const output = document.getElementById("resultados");
let   BREEDS = [];

// 1) Carrega o JSON validado
fetch("/breeds_valid.json")
  .then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  })
  .then(json => {
    BREEDS = json;
    btn.disabled = false;
  })
  .catch(err => {
    console.error("Não carregou o catálogo:", err);
    btn.textContent = "Erro no catálogo";
  });

// 2) Ao submeter o formulário, calcula compatibilidade e exibe resultados
form.addEventListener("submit", async ev => {
  ev.preventDefault();
  // lê todas as respostas, garantindo valores numéricos
  const ans = Object.fromEntries(new FormData(form).entries());
  CRITERIOS.forEach(c => ans[c] = Number(ans[c]) || 3);

  // define grupo-alvo (companhia / guarda / esporte)
  const grupo = ans.objetivo <= 2
    ? "companhia"
    : ans.objetivo >= 4
      ? "guarda"
      : "esporte";

  // cálculo de distância e pontuação
  const MAX = CRITERIOS.reduce((s,c) => s + PESOS_CRITERIOS[c]*4, 0);
  const porteOk = tam => ans.tamanho >= 4
    ? tam >= 4
    : ans.tamanho <= 2
      ? tam <= 2
      : true;

  const ranked = BREEDS
    .filter(r => porteOk(r.pesos.tamanho || 3))
    .map(r => {
      const diff = CRITERIOS.reduce((s,c) =>
        s + PESOS_CRITERIOS[c] * Math.abs((r.pesos[c]||3) - ans[c])
      , 0);
      return {
        ...r,
        compat: Math.round(100 - (diff/MAX)*100),
        grupo: r.grupo || (
          r.pesos.objetivo <= 2 ? "companhia" :
          r.pesos.objetivo >= 4 ? "guarda" : "esporte"
        )
      };
    })
    .sort((a,b) => b.compat - a.compat);

  // pega top 3 do grupo, ou top 3 gerais se nenhum couber
  const selecionadas = ranked.filter(r => r.grupo === grupo).slice(0,3);
  await render(selecionadas.length ? selecionadas : ranked.slice(0,3));
});

// 3) Função que gera e injeta os cards no DOM
async function render(list) {
  output.innerHTML = "";
  for (const r of list) {
    output.appendChild(card(r));
  }
  output.hidden = false;
}

// helper que cria um <div class="card"> para cada raça
function card(r) {
  const candidates = [...(r.images||[])];

  // fallback 1: Dog CEO API
  const slug = r.slug.split("/").pop().toLowerCase();
  candidates.push(`https://dog.ceo/api/breed/${slug}/images/random`);

  // fallback 2: Unsplash genérico
  candidates.push(`https://source.unsplash.com/600x400/?${encodeURIComponent(r.nome)}+dog`);

  // placeholder final
  const placeholder = `https://via.placeholder.com/600x400?text=${encodeURIComponent(r.nome)}`;

  // monta o <img> com tentativa cíclica de URLs
  const img = document.createElement("img");
  img.loading = "lazy";
  img.alt     = r.nome;
  img.dataset.idx = "0";
  img.src     = candidates[0];
  img.onerror = async function() {
    let idx = parseInt(this.dataset.idx,10) + 1;
    if (idx < candidates.length) {
      const url = candidates[idx];
      if (url.includes("dog.ceo/api")) {
        // pega JSON do Dog CEO
        try {
          const res = await fetch(url);
          const js = await res.json();
          this.src = js.status === "success" ? js.message : placeholder;
        } catch {
          this.src = placeholder;
        }
      } else {
        this.src = url;
      }
      this.dataset.idx = idx.toString();
    } else {
      this.src = placeholder;
    }
  };

  // monta o card completo
  const div = document.createElement("div");
  div.className = "card";
  div.append(img);
  div.innerHTML += `
    <h3>${r.nome}</h3>
    <p>${r.texto || "(descrição em breve)"}</p>
    <div class="barra-externa">
      <div class="barra-interna" style="width:${r.compat}%">
        ${r.compat}%
      </div>
    </div>
    <small>
      Grupo: <strong>${r.grupo}</strong>
      • Criador: <strong>${r.criador || "—"}</strong>
    </small>
  `;
  return div;
}
