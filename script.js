document.addEventListener('DOMContentLoaded', async () => {
  const btn = document.getElementById('btn');
  const form = document.getElementById('quiz');
  const resultados = document.getElementById('resultados');

  try {
    // Carrega o JSON (renomeie para breeds_valid.json)
    const res = await fetch('breeds_valid.json');
    const breeds = await res.json();

    // Habilita o botão
    btn.textContent = 'Ver recomendações';
    btn.disabled = false;

    // Função para calcular score de aderência (0 a 100)
    function calculateScore(breed, formData) {
      // TODO: implemente sua lógica de cálculo de aderência
      // Exemplo:
      // let score = 0;
      // if (formData.get('criancas') <= breed.pesos.criancas) score += 10;
      // ...
      // return score;
      return 0; // Placeholder
    }

    form.addEventListener('submit', event => {
      event.preventDefault();
      resultados.innerHTML = '';
      resultados.hidden = false;

      const formData = new FormData(form);

      // Aplica cálculo de score a cada raça
      const scoredBreeds = breeds.map(r => {
        const score = calculateScore(r, formData);
        return { ...r, score };
      });

      // Seleciona as top 3 raças (maior score)
      const topBreeds = scoredBreeds
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);

      topBreeds.forEach(r => {
        const card = document.createElement('div');
        card.classList.add('card');

        // Cria <img> com fallbacks
        const img = document.createElement('img');
        img.alt = r.nome;
        const fontes = [
          r.foto,
          ...(r.valid_images || []),
          ...(r.images       || []),
          `https://source.unsplash.com/600x400/?${encodeURIComponent(r.nome)}+dog`,
          `https://via.placeholder.com/600x400?text=${encodeURIComponent(r.nome)}`
        ];
        let carregou = false;
        fontes.forEach(src => {
          if (!carregou) {
            img.src = src;
            img.onerror = () => console.warn('Falha ao carregar:', src);
            img.onload = () => { carregou = true; };
          }
        });
        card.appendChild(img);

        // Nome e % de aderência
        const h3 = document.createElement('h3');
        h3.textContent = r.nome;
        card.appendChild(h3);

        const aderenciaEl = document.createElement('p');
        aderenciaEl.innerHTML = `<strong>${Math.round(r.score)}%</strong> de aderência`;
        card.appendChild(aderenciaEl);

        // Descrição
        if (r.texto) {
          const descEl = document.createElement('p');
          descEl.textContent = r.texto;
          card.appendChild(descEl);
        }

        // Indicação do criador
        if (r.criador) {
          const creatorEl = document.createElement('p');
          creatorEl.innerHTML = `<small>Indicação do criador: ${r.criador}</small>`;
          card.appendChild(creatorEl);
        }

        resultados.appendChild(card);
      });
    });
  } catch (err) {
    console.error('Erro ao carregar as raças:', err);
    btn.textContent = 'Erro ao carregar';
  }
});