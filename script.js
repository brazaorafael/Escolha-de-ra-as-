
/* ------------------------------------------------------------------
   Guia Inteligente de Raças – Lógica principal
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
let   BREEDS = [];

// Carrega o catálogo de raças
fetch("breeds.json")
  .then(r => {
    if (!r.ok) throw new Error("Falha ao carregar catálogo");
    return r.json();
  })
  .then(j => {
    BREEDS = j;
    btn.disabled = false;
    btn.textContent = "Buscar raças";
  })
  .catch(e => {
    console.error(e);
    btn.textContent = "Erro no catálogo";
  });

form.addEventListener("submit", ev => {
  ev.preventDefault();
  const answers = Object.fromEntries(new FormData(form).entries());
  // Converte respostas para número e define padrão 3
  CRITERIOS.forEach(c => {
    answers[c] = Number(answers[c]) || 3;
  });
  // Define grupo pelo objetivo
  const grupo = answers.objetivo <= 2 
    ? "companhia" 
    : answers.objetivo >= 4 
      ? "guarda" 
      : "esporte";

  // Calcula score máximo possível
  const MAX = CRITERIOS.reduce((sum, c) => 
    sum + PESOS_CRITERIOS[c] * 4, 0);

  // Função de filtro por porte
  const porteOk = pesoTamanho => {
    if (answers.tamanho >= 4) return pesoTamanho >= 4;
    if (answers.tamanho <= 2) return pesoTamanho <= 2;
    return true;
  };

  // Compara e rankeia
  const ranked = BREEDS
    .filter(r => porteOk(r.pesos.tamanho || 3))
    .map(r => {
      const diff = CRITERIOS.reduce((sum, c) => 
        sum + PESOS_CRITERIOS[c] * 
          Math.abs((r.pesos[c] || 3) - answers[c]), 0);
      return {
        ...r,
        compat: Math.round(100 - (diff / MAX) * 100),
        grupo: r.grupo || (
          r.pesos.objetivo <= 2 ? "companhia" :
          r.pesos.objetivo >= 4 ? "guarda" :
          "esporte"
        )
      };
    })
    .sort((a, b) => b.compat - a.compat);

  // Seleciona as top 3 do mesmo grupo ou geral
  const selecionadas = ranked
    .filter(r => r.grupo === grupo)
    .slice(0, 3);
  
  render(selecionadas.length ? selecionadas : ranked.slice(0, 3));
});

// Renderiza as cards
function render(list) {
  output.innerHTML = "";
  list.forEach(r => output.appendChild(card(r)));
  output.hidden = false;
}

// Cria elemento de card de raça
function card(r) {
  const candidates = [...(r.images || [])];
  // API Dog CEO
  const slug = r.slug.split("/").pop().toLowerCase();
  candidates.push(
    `https://dog.ceo/api/breed/${slug}/images/random`
  );
  // Unsplash generic
  candidates.push(
    `https://source.unsplash.com/600x400/?${encodeURIComponent(r.nome)}+dog`
  );
  // Placeholder final
  const placeholder = 
    `https://via.placeholder.com/600x400?text=${encodeURIComponent(r.nome)}`;

  const img = document.createElement("img");
  img.loading = "lazy";
  img.alt = r.nome;
  img.dataset.idx = "0";
  img.src = candidates[0];
  img.onerror = async function() {
    let idx = parseInt(this.dataset.idx, 10) + 1;
    if (idx < candidates.length) {
      const url = candidates[idx];
      if (url.includes("dog.ceo/api")) {
        try {
          const res = await fetch(url);
          const js = await res.json();
          this.src = js.status === "success" 
            ? js.message 
            : placeholder;
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
      Grupo: <strong>${r.grupo}</strong> &bull; 
      Criador: <strong>${r.criador || "(...)"}</strong>
    </small>
  `;
  return div;
}
