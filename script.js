/* ------------------------------------------------------------------
   Configurações de Pontuação
------------------------------------------------------------------ */
// Peso (importância) de cada critério – 1 = pouca influência, 5 = muita.
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
  objetivo:    3,
  ausencia:    2
};

const CRITERIOS = Object.keys(PESOS_CRITERIOS);

const form   = document.getElementById("quiz");
const btn    = document.getElementById("btn");
const output = document.getElementById("resultados");

let BREEDS = [];

/* ------------------------------------------------------------------
   Carrega catálogo
------------------------------------------------------------------ */
fetch("breeds.json")
  .then(r => {
    console.log("Status do fetch:", r.status);
    return r.json();
  })
  .then(j => {
    BREEDS = j;
    console.log("Raças carregadas:", BREEDS.length);
    btn.disabled = false;
  })
  .catch(e => {
    console.error("Erro ao carregar catálogo:", e);
    btn.textContent = "Erro ao carregar catálogo";
  });

/* ------------------------------------------------------------------
   Processa respostas
------------------------------------------------------------------ */
form.addEventListener("submit", async ev => {
  ev.preventDefault();

  // 1. Coleta das respostas do usuário
  const ans = Object.fromEntries(new FormData(form).entries());
  for (const c of CRITERIOS) ans[c] = Number(ans[c]) || 3; // default médio

  // 2. Calcula pontuação para cada raça
  const maxScore = CRITERIOS.reduce((s, c) => s + PESOS_CRITERIOS[c] * 4, 0); // diferença máxima =4
  const ranked = BREEDS.map(r => {
      const diff = CRITERIOS.reduce(
        (s, c) => s + PESOS_CRITERIOS[c] * Math.abs((r.pesos[c] ?? 3) - ans[c]),
        0
      );
      const compatibilidade = Math.round(100 - (diff / maxScore) * 100);
      return { ...r, diff, compatibilidade };
    })
    .sort((a, b) => b.compatibilidade - a.compatibilidade);

  // 3. Seleciona as 3 melhores, priorizando diversidade de categoria
  const escolhidas = [];
  const cats = new Set();
  for (const r of ranked) {
    if (escolhidas.length === 3) break;
    if (!cats.has(r.categoria) || ranked.indexOf(r) < 5) {
      escolhidas.push(r);
      cats.add(r.categoria);
    }
  }

  await render(escolhidas);
});

/* ------------------------------------------------------------------
   Renderiza cards
------------------------------------------------------------------ */
async function render(list) {
  output.innerHTML = "";
  for (const r of list) output.appendChild(await card(r));
  output.appendChild(leadForm());
  output.hidden = false;
}

/* Card individual --------------------------------------------------*/
async function card(r) {
  // Primeira imagem válida
  let img = r.images && r.images.length ? r.images[0] : null;

  // Fallback: Dog CEO API
  if (!img) {
    try {
      const mainSlug = r.slug.split("/").pop(); // usa último segmento
      const f = await fetch(`https://dog.ceo/api/breed/${mainSlug}/images/random`);
      const j = await f.json();
      if (j.status === "success") img = j.message;
    } catch (_) {}
  }
  if (!img)
    img = `https://via.placeholder.com/600x400?text=${encodeURIComponent(r.nome)}`;

  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML = `
    <img src="${img}" alt="${r.nome}">
    <h3>${r.nome}</h3>
    <p>${r.texto || "(descrição em breve)"}</p>

    <div class="barra-externa">
      <div class="barra-interna" style="width:${r.compatibilidade}%;">
        ${r.compatibilidade}%
      </div>
    </div>

    <small>Criador recomendado: <strong>${r.criador || "(em validação)"}</strong></small>
  `;
  return div;
}

/* Formulário de lead ----------------------------------------------*/
function leadForm() {
  const f = document.createElement("form");
  f.className = "form-lead";
  f.innerHTML = `
    <h2>Receba contatos de criadores e ONGs</h2>
    <input type="email" name="email" placeholder="E-mail" required>
    <input type="tel" name="whatsapp" placeholder="WhatsApp" required>
    <button type="submit">Quero receber</button>`;
  f.addEventListener("submit", e => {
    e.preventDefault();
    f.innerHTML = "<p>Obrigado! Em breve entraremos em contato 😊</p>";
  });
  return f;
}
