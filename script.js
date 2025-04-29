
/* ------------------------------------------------------------------
   Guia Inteligente de Raças – Lógica principal
   (versão 2025‑04‑29) – com fallback robusto de imagens
------------------------------------------------------------------ */
// PESOS_CRITERIOS define a relevância de cada pergunta na compatibilidade.
const PESOS_CRITERIOS = {
  espaco:      1,
  tempo:       2,
  energia:     3,
  criancas:    3,
  pelos:       1,
  orcamento:   1,
  tamanho:     5, // porte decisivo
  alergia:     3,
  clima:       1,
  experiencia: 2,
  objetivo:    5, // grupo desejado
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
   Carrega catálogo
------------------------------------------------------------------ */
fetch("breeds.json")
  .then(r => r.json())
  .then(j => {
    BREEDS = j;
    btn.disabled = false;
    console.log(`📚 Catálogo carregado: ${BREEDS.length} raças`);
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

  // 1) Coleta respostas (default 3)
  const ans = Object.fromEntries(new FormData(form).entries());
  for (const c of CRITERIOS) ans[c] = Number(ans[c]) || 3;

  // 2) Grupo desejado
  const grupoDesejado = ans.objetivo <= 2 ? "companhia"
                       : ans.objetivo >= 4 ? "guarda"
                       : "esporte";

  // 3) Compatibilidade
  const MAX_SCORE = CRITERIOS.reduce((s,c)=> s + PESOS_CRITERIOS[c]*4, 0);

  const tamanhoAceito = size => {
    if (ans.tamanho >= 4) return size >= 4;
    if (ans.tamanho <= 2) return size <= 2;
    return true;
  };

  const ranked = BREEDS
    .filter(r => tamanhoAceito(r.pesos.tamanho ?? 3))
    .map(r=>{
      const diff = CRITERIOS.reduce(
        (s,c)=> s + PESOS_CRITERIOS[c]*Math.abs((r.pesos[c]??3) - ans[c]), 0);
      const compat = Math.round(100 - (diff / MAX_SCORE)*100);
      const grupo  = r.grupo || (r.pesos.objetivo<=2?"companhia":r.pesos.objetivo>=4?"guarda":"esporte");
      return {...r, compat, grupo};
    })
    .sort((a,b)=> b.compat - a.compat);

  const escolhidas = ranked.filter(r=>r.grupo===grupoDesejado).slice(0,3);
  if (!escolhidas.length) {
    output.innerHTML = "<p>Nenhuma raça nesse grupo disponível.</p>";
    output.hidden=false;
    return;
  }
  await render(escolhidas);
});

/* ------------------------------------------------------------------
   Funções de imagem
------------------------------------------------------------------ */
// Testa rapidamente se uma URL existe (HEAD)
// Alguns servidores não permitem HEAD; se falhar, assume false.
async function testURL(url){
  try{
    const r = await fetch(url, {method:"HEAD", mode:"no-cors"});
    return r.ok;
  }catch(_){
    return false;
  }
}

// Obtém melhor imagem possível para uma raça
async function imageFor(r){
  // 1. tenta URLs do catálogo
  if (r.images && r.images.length){
    for(const u of r.images){
      if (await testURL(u)) return u;
    }
  }
  // 2. Dog CEO (se suportar)
  try{
    const slug = r.slug.split("/").pop().toLowerCase();
    const j = await fetch(`https://dog.ceo/api/breed/${slug}/images/random`).then(x=>x.json());
    if(j.status==="success" && await testURL(j.message)) return j.message;
  }catch(_){}
  // 3. Unsplash genérico (sempre retorna algo)
  return `https://source.unsplash.com/600x400/?${encodeURIComponent(r.nome)}+dog`;
}

/* ------------------------------------------------------------------
   Renderização
------------------------------------------------------------------ */
async function render(list){
  output.innerHTML="";
  for (const r of list) output.appendChild(await card(r));
  output.appendChild(leadForm());
  output.hidden=false;
}

/* Card individual --------------------------------------------------*/
async function card(r){
  const img = await imageFor(r);

  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML = `
    <img src="${img}" alt="${r.nome}" loading="lazy"
         onerror="this.onerror=null;this.src='https://via.placeholder.com/600x400?text=${encodeURIComponent(r.nome)}'">
    <h3>${r.nome}</h3>
    <p>${r.texto || "(descrição em breve)"}<\/p>

    <div class="barra-externa">
      <div class="barra-interna" style="width:${r.compat}%;">${r.compat}%<\/div>
    <\/div>

    <small>Grupo: <strong>${r.grupo}</strong> • Criador: <strong>${r.criador || "(em validação)"}<\/strong><\/small>
  `;
  return div;
}

/* Formulário de lead ----------------------------------------------*/
function leadForm(){
  const f=document.createElement("form");
  f.className="form-lead";
  f.innerHTML=`
    <h2>Receba contatos de criadores e ONGs<\/h2>
    <input type="email" name="email" placeholder="E-mail" required>
    <input type="tel"   name="whatsapp" placeholder="WhatsApp" required>
    <button type="submit">Quero receber<\/button>`;
  f.addEventListener("submit",e=>{
    e.preventDefault();
    f.innerHTML="<p>Obrigado! Em breve entraremos em contato 😊<\/p>";
  });
  return f;
}