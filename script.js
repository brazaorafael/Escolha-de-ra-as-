const form = document.getElementById("quiz");
const btn = document.getElementById("btn");
const output = document.getElementById("resultados");

const CRITERIOS = ["espaco","tempo","energia","criancas","pelos","orcamento","tamanho","alergia","clima","experiencia","objetivo","ausencia"];
let BREEDS = [];

fetch("breeds.json")
  .then(r => r.json())
  .then(j => { BREEDS = j; btn.disabled = false; })
  .catch(e => { btn.textContent = "Erro ao carregar catálogo"; });

form.addEventListener("submit", async ev => {
  ev.preventDefault();

  const ans = Object.fromEntries(new FormData(form).entries());
  for (const c of CRITERIOS) ans[c] = Number(ans[c]) || 3;

  const ranked = BREEDS
    .map(r => {
      const score = CRITERIOS.reduce((s,c)=>s+Math.abs((r.pesos[c]??3)-ans[c]),0);
      const compatibilidade = Math.max(0, 100 - (score * 3));
      return { ...r, score, compatibilidade };
    })
    .sort((a,b)=>a.score-b.score);

  const escolhidas = [];
  const cats = new Set();
  for (const r of ranked) {
    if (escolhidas.length < 3) {
      if (!cats.has(r.categoria) || escolhidas.length === 2) {
        escolhidas.push(r);
        cats.add(r.categoria);
      }
    }
  }

  await render(escolhidas);
});

async function render(list){
  output.innerHTML="";
  for (const r of list) output.appendChild(await card(r));
  output.appendChild(leadForm());
  output.hidden=false;
}

async function card(r){
  let img = r.images && r.images.length > 0 ? r.images[0] : r.foto;

  if (!img) img = `https://via.placeholder.com/600x400?text=${encodeURIComponent(r.nome)}`;

  const div = document.createElement("div");
  div.className = "card";
  div.innerHTML = `
    <img src="${img}" alt="${r.nome}">
    <h3>${r.nome}</h3>
    <p>${r.texto || "(descrição em breve)"}</p>
    <p><strong>Compatibilidade: ${r.compatibilidade}%</strong></p>
    <small>Criador recomendado: <strong>${r.criador || "(em validação)"}</strong></small>`;
  return div;
}

function leadForm(){
  const f = document.createElement("form");
  f.className = "form-lead";
  f.innerHTML = `
    <h2>Receba contatos de criadores e ONGs</h2>
    <input type="email" name="email" placeholder="E-mail" required>
    <input type="tel" name="whatsapp" placeholder="WhatsApp" required>
    <button type="submit">Quero receber</button>`;
  f.addEventListener("submit", e => {
    e.preventDefault();
    f.innerHTML = "<p>Obrigado! Em breve entraremos em contato!</p>";
  });
  return f;
}