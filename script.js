document.addEventListener('DOMContentLoaded', async () => {
  const btn        = document.getElementById('btn');
  const form       = document.getElementById('quiz');
  const resultados = document.getElementById('resultados');

  try {
    // Ajuste: nome do arquivo JSON sem .txt
    const res    = await fetch('breeds_valid.json');
    const breeds = await res.json();

    // Habilita botão de submissão
    btn.textContent = 'Ver recomendações';
    btn.disabled    = false;

    form.addEventListener('submit', event => {
      event.preventDefault();
      resultados.innerHTML = '';
      resultados.hidden     = false;

      // Exemplo de seleção das 5 raças com maior score
      const topBreeds = breeds
        .map(r => ({ ...r, score: Math.random() }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      topBreeds.forEach(r => {
        const card = document.createElement('div');
        card.classList.add('card');

        const img = document.createElement('img');
        img.alt = r.nome;

        // Fontes de imagem: principal + fallbacks
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
            img.onload  = () => { carregou = true; };
          }
        });

        card.appendChild(img);
        const h3 = document.createElement('h3');
        h3.textContent = `${r.nome} (${r.aderencia}%)`;
        card.appendChild(h3);

        resultados.appendChild(card);
      });
    });
  } catch (err) {
    console.error('Erro ao carregar as raças:', err);
    btn.textContent = 'Erro ao carregar';
  }
});
