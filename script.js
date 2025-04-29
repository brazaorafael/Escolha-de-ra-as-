
/* ------------------------------------------------------------------
   Guia Inteligente de Raças – Lógica principal
   (versão 2025‑04‑29) – imagens simplificadas
------------------------------------------------------------------ */
const PESOS_CRITERIOS = {
  espaco:1, tempo:2, energia:3, criancas:3, pelos:1, orcamento:1,
  tamanho:5, alergia:3, clima:1, experiencia:2, objetivo:5, ausencia:2
};
const CRITERIOS = Object.keys(PESOS_CRITERIOS);

const form   = document.getElementById("quiz");
const btn    = document.getElementById("btn");
const output = document.getElementById("resultados");
let   BREEDS = [];

fetch("breeds.json")
  .then(r=>r.json())
  .then(j=>{ BREEDS=j; btn.disabled=false; })
  .catch(e=>{ console.error(e); btn.textContent="Erro ao carregar catálogo"; });

form.addEventListener("submit", async ev=>{
  ev.preventDefault();
  const ans = Object.fromEntries(new FormData(form).entries());
  for(const c of CRITERIOS) ans[c]=Number(ans[c])||3;

  const grupoDesejado = ans.objetivo<=2?"companhia":ans.objetivo>=4?"guarda":"esporte";
  const MAX=CRITERIOS.reduce((s,c)=>s+PESOS_CRITERIOS[c]*4,0);

  const porteOk = s=> ans.tamanho>=4? s>=4 : ans.tamanho<=2? s<=2 : true;

  const ranked = BREEDS
    .filter(r=>porteOk(r.pesos.tamanho??3))
    .map(r=>{
       const diff=CRITERIOS.reduce((s,c)=>s+PESOS_CRITERIOS[c]*Math.abs((r.pesos[c]??3)-ans[c]),0);
       const compat=Math.round(100-(diff/MAX)*100);
       return {...r,compat};
    })
    .sort((a,b)=>b.compat-a.compat);

  const escolhidas = ranked.filter(r=>r.grupo===grupoDesejado).slice(0,3);
  await render(escolhidas.length?escolhidas:ranked.slice(0,3));
});

async function render(list){
  output.innerHTML="";
  for(const r of list) output.appendChild(card(r));
  output.hidden=false;
}

function card(r){
  let img = (r.images&&r.images.length)? r.images[0] : null;
  if(!img) img = `https://source.unsplash.com/600x400/?${encodeURIComponent(r.nome)}+dog`;

  const d=document.createElement("div");
  d.className="card";
  d.innerHTML=`
    <img src="${img}" alt="${r.nome}" loading="lazy"
         onerror="this.onerror=null;this.src='https://via.placeholder.com/600x400?text=${encodeURIComponent(r.nome)}'">
    <h3>${r.nome}</h3>
    <p>${r.texto||"(descrição em breve)"}<\/p>
    <div class="barra-externa"><div class="barra-interna" style="width:${r.compat}%;">${r.compat}%<\/div><\/div>
    <small>Grupo: <strong>${r.grupo}</strong> • Criador: <strong>${r.criador||"(em validação)"}<\/strong><\/small>
  `;
  return d;
}
