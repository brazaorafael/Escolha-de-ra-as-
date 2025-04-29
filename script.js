/* ------------------------------------------------------------------
   Guia Inteligente de Raças – Lógica principal
   2025‑04‑29
------------------------------------------------------------------ */
// PESOS_CRITERIOS define a relevância de cada pergunta na compatibilidade.
const PESOS_CRITERIOS = {
  espaco:      1,
  tempo:       2,
  energia:     3,
  criancas:    3,
  pelos:       1,
  orcamento:   1,
  tamanho:     2,
  alergia:     3,
  clima:       1,
  experiencia: 2,
  objetivo:    5, // maior peso → garante foco no tipo de cão
  ausencia:    2
};
const CRITERIOS = Object.keys(PESOS_CRITERIOS);

/* ------------------------------------------------------------------
   Elementos de interface
------------------------------------------------------------------ */
const form   = document.getElementById("quiz");
const btn    = document.getElementById("btn");
const output = document.getElementById("resultados");
let   BREEDS = [];

/* ------------------------------------------------------------------
   Carrega catálogo de raças
------------------------------------------------------------------ */
fetch("breeds.json")
  .then(r => r.json())
  .then(j => {
    BREEDS = j;
    btn.disabled = false;
  })
  .catch(e => {
    console.error("Erro ao carregar catálogo:", e);
    btn.textContent = "Erro ao carregar catálogo";
  });

/* ------------------------------------------------------------------
   Submete respostas e gera recomendações
------------------------------------------------------------------ */
form.addEventListener("submit", async ev => {
  ev.preventDefault();

  // 1. Coleta respostas (default 3)
  const ans = Object.fromEntries(new FormData(form).entries());
  for (const c of CRITERIOS) ans[c] = Number(ans[c]) || 3;

  // 2. Traduz objetivo → grupo desejado
  const grupoDesejado = ans.objetivo <= 2 ? "companhia" : ans.objetivo >= 4 ? "guarda" : "esporte";

  // 3. Score máximo possível (diferença 4 em todos)
  const MAX_SCORE = CRITERIOS.reduce((s,c)=> s + PESOS_CRITERIOS[c]*4, 0);

  // 4. Compatibilidade para cada raça
  const ranked = BREEDS.map(r=>{
      const score = CRITERIOS.reduce(
        (s,c)=> s + PESOS_CRITERIOS[c]*Math.abs((r.pesos[c]??3) - ans[c]),
        0
      );
      const compat = Math.round(100 - (score / MAX_SCORE)*100);
      const grupo = r.grupo || (r.pesos.objetivo<=2 ? "companhia" : r.pesos.objetivo>=4 ? "guarda" : "esporte");
      return { ...r, compat, grupo };
    })
    .sort((a,b)=> b.compat - a.compat);

  // 5. Seleciona até 3 somente do grupo desejado
  const escolhidas = ranked.filter(r=> r.grupo === grupoDesejado).slice(0,3);

  // Se não há nenhuma nesse grupo, mostra as 3 melhores gerais (fallback)
  if (escolhidas.length === 0) escolhidas.push(...ranked.slice(0,3));

  await render(escolhidas);
});

/* ------------------------------------------------------------------
   Renderização
------------------------------------------------------------------ */
async function render(list){
  output.innerHTML="";
  for (const r of list) output.appendChild(await card(r));
  output.appendChild(leadForm());
  output.hidden = false;
}

/* Card individual */
async function card(r){
  let img = (r.images && r.images.length) ? r.images[0] : null;
  if (!img){
    try{
      const slug = r.slug.split("/").pop();
      const j = await fetch(`https://dog.ceo/api/breed/${slug}/images/random`).then(x=>x.json());
      if (j.status === "success") img = j.message;
    }catch(_){}
  }
  if (!img) img = `https://via.placeholder.com/600x400?text=${encodeURIComponent(r.nome)}`;

  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML = `
    <img src="${img}" alt="${r.nome}">
    <h3>${r.nome}</h3>
    <p>${r.texto || "(descrição em breve)"}</p>
    <div class="barra-externa">
      <div class="barra-interna" style="width:${r.compat}%">${r.compat}%</div>
    </div>
    <small>Grupo: <strong>${r.grupo}</strong> • Criador: <strong>${r.criador || "(em validação)"}</strong></small>
  `;
  return div;
}

/* Formulário de lead */
function leadForm(){
  const f = document.createElement("form");
  f.className = "form-lead";
  f.innerHTML = `
    <h2>Receba contatos de criadores e ONGs</h2>
    <input type="email" name="email" placeholder="E-mail" required>
    <input type="tel" name="whatsapp" placeholder="WhatsApp" required>
    <button type="submit">Quero receber</button>`;
  f.addEventListener("submit",e=>{
    e.preventDefault();
    f.innerHTML = "<p>Obrigado! Em breve entraremos em contato 😊</p>";
  });
  return f;
}
