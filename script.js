/* ------------------------------------------------------------------
   Guia Inteligente de Raças – Lógica principal
   (versão 2025‑04‑29)
------------------------------------------------------------------ */
// PESOS_CRITERIOS define a relevância de cada pergunta na compatibilidade.
const PESOS_CRITERIOS = {
  espaco:      1,
  tempo:       2,
  energia:     3,
  criancas:    3,
  pelos:       1,
  orcamento:   1,
  tamanho:     5, // peso elevado → reflete forte preferência por porte
  alergia:     3,
  clima:       1,
  experiencia: 2,
  objetivo:    5, // mesma importância de objetivo
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

  /* 1) Coleta respostas do usuário */
  const ans = Object.fromEntries(new FormData(form).entries());
  for (const c of CRITERIOS) ans[c] = Number(ans[c]) || 3; // default neutro

  /* 2) Determina grupo desejado a partir de `objetivo` */
  const grupoDesejado = ans.objetivo <= 2 ? "companhia" : ans.objetivo >= 4 ? "guarda" : "esporte";
  console.log("🎯 Grupo desejado:", grupoDesejado);

  /* 3) Calcula compatibilidade (0–100%) para cada raça */
  const MAX_SCORE = CRITERIOS.reduce((s,c)=> s + PESOS_CRITERIOS[c]*4, 0);

  // Função de porte compatível
  const tamanhoAceito = rSize => {
    if (ans.tamanho >= 4) return rSize >= 4;      // Usuário quer grande/gigante
    if (ans.tamanho <= 2) return rSize <= 2;      // Usuário quer pequeno
    return true;                                  // Médio: aceita qualquer
  };

  // Calcula compatibilidade apenas para raças com porte compatível
  const ranked = BREEDS
    .filter(r => tamanhoAceito(r.pesos.tamanho ?? 3))
    .map(r=>{
      const diff = CRITERIOS.reduce(
        (s,c)=> s + PESOS_CRITERIOS[c]*Math.abs((r.pesos[c]??3) - ans[c]), 0);
      const compat = Math.round(100 - (diff / MAX_SCORE)*100);
      const grupo  = r.grupo || (r.pesos.objetivo<=2?"companhia":r.pesos.objetivo>=4?"guarda":"esporte");
      return{...r,compat,grupo};
    })
    .sort((a,b)=> b.compat - a.compat);

  /* 4) Seleciona até 3 raças SOMENTE do grupo desejado */
  const escolhidas = ranked.filter(r=>r.grupo===grupoDesejado).slice(0,3);

  // Caso não exista nenhuma (catálogo incompleto), mostra aviso.
  if (!escolhidas.length) {
    output.innerHTML = `<p>Nenhuma raça disponível para o grupo <strong>${grupoDesejado}</strong>.`+
      ` Verifique o catálogo ou ajuste suas respostas.</p>`;
    output.hidden = false;
    return;
  }

  await render(escolhidas);
});

/* ------------------------------------------------------------------
   Renderiza cards
------------------------------------------------------------------ */
async function render(list){
  output.innerHTML="";
  for (const r of list) output.appendChild(await card(r));
  output.appendChild(leadForm());
  output.hidden=false;
}

/* ------------------------------------------------------------------
   Card individual
------------------------------------------------------------------ */
async function card(r) {
  let img = (r.images && r.images.length) ? r.images[0] : null;

  // Fallback 1: Dog CEO (melhor padrão slug simplificado)
  if (!img) {
    try {
      const slug = r.slug.split("/").pop().toLowerCase();
      const res  = await fetch(`https://dog.ceo/api/breed/${slug}/images/random`);
      const j    = await res.json();
      if (j.status === "success") img = j.message;
    } catch (_) {}
  }

  // Fallback 2: busca rápida no Unsplash (anônimo) se ainda falhar
  if (!img) {
    img = `https://source.unsplash.com/600x400/?${encodeURIComponent(r.nome)}+dog`;
  }

  // Último recurso: placeholder estático
  if (!img) {
    img = `https://via.placeholder.com/600x400?text=${encodeURIComponent(r.nome)}`;
  }

  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML = `
    <img src="${img}" alt="${r.nome}" onerror="this.onerror=null;this.src='https://via.placeholder.com/600x400?text=${encodeURIComponent(r.nome)}'">
    <h3>${r.nome}</h3>
    <p>${r.texto || "(descrição em breve)"}<\/p>

    <div class="barra-externa">
      <div class="barra-interna" style="width:${r.compat}%">${r.compat}%<\/div>
    <\/div>

    <small>Grupo: <strong>${r.grupo}</strong> • Criador: <strong>${r.criador || "(em validação)"}<\/strong><\/small>
  `;
  return div;
}

/* ------------------------------------------------------------------
   Formulário para leads
------------------------------------------------------------------ */
function leadForm(){
  const f = document.createElement("form");
  f.className = "form-lead";
  f.innerHTML = `
    <h2>Receba contatos de criadores e ONGs<\/h2>
    <input type="email" name="email" placeholder="E-mail" required>
    <input type="tel" name="whatsapp" placeholder="WhatsApp" required>
    <button type="submit">Quero receber<\/button>`;
  f.addEventListener("submit", e=>{
    e.preventDefault();
    f.innerHTML = "<p>Obrigado! Em breve entraremos em contato 😊<\/p>";
  });
  return f;
}