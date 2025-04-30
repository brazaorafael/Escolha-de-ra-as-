/* ------------------------------------------------------------------
   Guia Inteligente de Raças – Lógica principal
   (versão 2025‑04‑29) – Fallback com Promise.any e placeholder
------------------------------------------------------------------ */
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

fetch("breeds.json")
  .then(r=>r.json())
  .then(j=>{ BREEDS=j; btn.disabled=false; })
  .catch(e=>{ console.error(e); btn.textContent="Erro no catálogo"; });

form.addEventListener("submit", async ev=>{
  ev.preventDefault();
  const ans = Object.fromEntries(new FormData(form).entries());
  CRITERIOS.forEach(c=> ans[c]=Number(ans[c])||3);

  const grupo = ans.objetivo<=2?"companhia":ans.objetivo>=4?"guarda":"esporte";
  const MAX = CRITERIOS.reduce((s,c)=>s+PESOS_CRITERIOS[c]*4,0);
  const porteOk = s=> ans.tamanho>=4? s>=4 : ans.tamanho<=2? s<=2 : true;

  const ranked = BREEDS
    .filter(r=> porteOk(r.pesos.tamanho||3) )
    .map(r=>{
      const diff = CRITERIOS.reduce((s,c)=>
        s+PESOS_CRITERIOS[c]*Math.abs((r.pesos[c]||3)-ans[c]),0);
      return {...r,
        compat: Math.round(100-(diff/MAX)*100),
        grupo: r.grupo || (r.pesos.objetivo<=2?"companhia":r.pesos.objetivo>=4?"guarda":"esporte")
      };
    })
    .sort((a,b)=>b.compat-a.compat);

  const selecionadas = ranked.filter(r=> r.grupo===grupo).slice(0,3);
  await render(selecionadas.length?selecionadas:ranked.slice(0,3));
});

async function render(list){
  output.innerHTML="";
  for(const r of list) output.appendChild(card(r));
  output.hidden=false;
}

function card(r){
  const placeholder = `https://via.placeholder.com/600x400?text=${encodeURIComponent(r.nome)}`;
  const candidates = [
    ... (r.images || []),
    `https://dog.ceo/api/breed/${(r.slug||r.nome).split("/").pop().toLowerCase()}/images/random`,
    `https://source.unsplash.com/600x400/?${encodeURIComponent(r.nome)}+dog`,
    placeholder
  ];

  const container = document.createElement("div");
  container.className="card";

  const imgEl = document.createElement("img");
  imgEl.loading = "lazy";
  imgEl.alt = r.nome;
  imgEl.src = placeholder; // show placeholder immediately
  container.append(imgEl);

  const loadImage = url => new Promise((res, rej) => {
    if (url.includes("dog.ceo/api")) {
      fetch(url)
        .then(resp => resp.json())
        .then(js => js.status==="success" ? res(js.message) : rej())
        .catch(() => rej());
    } else {
      const testImg = new Image();
      testImg.src = url;
      testImg.onload = () => res(url);
      testImg.onerror = () => rej();
    }
  });

  Promise.any(candidates.map(loadImage))
    .then(validUrl => { imgEl.src = validUrl; })
    .catch(() => { /* should not occur, placeholder included */ });

  container.innerHTML += `
    <h3>${r.nome}</h3>
    <p>${r.texto||"(descrição em breve)"}</p>
    <div class="barra-externa">
      <div class="barra-interna" style="width:${r.compat}%">
        ${r.compat}%
      </div>
    </div>
    <small>Grupo: <strong>${r.grupo}</strong> • Criador: <strong>${r.criador||"(...)"}</strong></small>
  `;
  return container;
}
