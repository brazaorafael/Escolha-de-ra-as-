
/* ------------------------------------------------------------------
   Guia Inteligente de Raças – Lógica principal (Versão corrigida)
------------------------------------------------------------------ */
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

// Função com timeout para carregar imagens externas
function loadExternalImage(url) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject("Timeout"), 5000); // 5s timeout
    
    if (url.includes("dog.ceo/api")) {
      fetch(url)
        .then(r => {
          clearTimeout(timeout);
          return r.json();
        })
        .then(js => js.status === "success" ? resolve(js.message) : reject())
        .catch(reject);
    } else {
      const img = new Image();
      img.onload = () => {
        clearTimeout(timeout);
        resolve(url);
      };
      img.onerror = () => {
        clearTimeout(timeout);
        reject(`Falha em: ${url}`);
      };
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
  })
  .catch(e => { 
    console.error("Erro ao carregar breeds.json:", e);
    btn.textContent = "Erro no catálogo";
  });

form.addEventListener("submit", async ev => {
  ev.preventDefault();
  const ans = Object.fromEntries(new FormData(form).entries());
  CRITERIOS.forEach(c => ans[c] = Number(ans[c]) || 3);

  const grupo = ans.objetivo <= 2 ? "companhia" : ans.objetivo >= 4 ? "guarda" : "esporte";
  const MAX = CRITERIOS.reduce((s, c) => s + PESOS_CRITERIOS[c] * 4, 0);
  const porteOk = s => ans.tamanho >= 4 ? s >= 4 : ans.tamanho <= 2 ? s <= 2 : true;

  const ranked = BREEDS
    .filter(r => porteOk(r.pesos?.tamanho || 3))
    .map(r => {
      const diff = CRITERIOS.reduce((s, c) =>
        s + PESOS_CRITERIOS[c] * Math.abs((r.pesos?.[c] || 3) - ans[c]), 0);
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
});

function render(list) {
  output.innerHTML = "";
  output.hidden = false;
  list.forEach(r => output.appendChild(card(r)));
}

function card(breed) {
  const container = document.createElement("div");
  container.className = "card";

  const imgEl = document.createElement("img");
  imgEl.loading = "lazy";
  imgEl.alt = breed.nome;
  
  // Placeholder inicial
  const placeholder = `https://via.placeholder.com/600x400?text=${encodeURIComponent(breed.nome)}`;
  imgEl.src = placeholder;

  container.append(imgEl);

  // Lista de fontes de imagem em ordem de prioridade
  const candidates = [
    ...(breed.images || []),
    `https://source.unsplash.com/600x400/?${encodeURIComponent(`${breed.nome} dog`)}`,
    `https://dog.ceo/api/breed/${breed.slug.split("/").pop().toLowerCase()}/images/random`
  ];

  // Tenta carregar cada imagem até encontrar uma válida
  const imagePromises = candidates.map(url => () => loadExternalImage(url));

  // Tenta carregar imagens em sequência
  let index = 0;
  const tryNext = () => {
    if (index >= imagePromises.length) return;
    
    imagePromises[index]()
      .then(src => {
        imgEl.src = src;
        console.log(`✅ Imagem carregada: ${src}`);
      })
      .catch(err => {
        console.warn(err);
        index++;
        tryNext();
      });
  };

  tryNext();

  // Conteúdo textual do card
  const info = document.createElement("div");
  info.innerHTML = `
    <h3>${breed.nome}</h3>
    <p>${breed.texto || "(descrição em breve)"}</p>
    <div class="barra-externa">
      <div class="barra-interna" style="width:${breed.compat}%">${breed.compat}%</div>
    </div>
    <small>Grupo: <strong>${breed.grupo}</strong> • Criador: <strong>${breed.criador || "(...)"}</strong></small>
  `;
  
  container.append(info);
  return container;
}
