document.addEventListener("DOMContentLoaded", async () => {
  const btn = document.getElementById("btn")
  const form = document.getElementById("quiz")
  const resultados = document.getElementById("resultados")

  try {
    // Carrega o JSON
    const res = await fetch("breeds_valid.json")
    if (!res.ok) {
      throw new Error("Falha ao carregar o arquivo de raças")
    }
    const breeds = await res.json()

    // Habilita o botão
    btn.textContent = "Ver recomendações"
    btn.disabled = false

    // Função para calcular score de aderência (0 a 100)
    function calculateScore(breed, formData) {
      if (!breed.pesos) return 0

      // Campos do formulário e seus pesos
      const fields = [
        "espaco",
        "tempo",
        "energia",
        "criancas",
        "pelos",
        "orcamento",
        "tamanho",
        "alergia",
        "clima",
        "experiencia",
        "objetivo",
        "ausencia",
      ]

      let totalScore = 0
      let maxPossibleScore = 0

      // Para cada campo, calcule a diferença entre a preferência do usuário e o valor da raça
      fields.forEach((field) => {
        if (breed.pesos[field] !== undefined) {
          const userValue = Number.parseInt(formData.get(field), 10)
          const breedValue = breed.pesos[field]

          // Quanto menor a diferença, melhor a correspondência
          // Diferença máxima possível é 4 (entre 1 e 5)
          const difference = Math.abs(userValue - breedValue)
          const fieldScore = 4 - difference // Converte diferença para pontuação (0-4)

          totalScore += fieldScore
          maxPossibleScore += 4 // Pontuação máxima por campo
        }
      })

      // Converte para porcentagem
      return Math.round((totalScore / maxPossibleScore) * 100)
    }

    form.addEventListener("submit", (event) => {
      event.preventDefault()
      resultados.innerHTML = ""
      resultados.hidden = false

      const formData = new FormData(form)

      // Aplica cálculo de score a cada raça
      const scoredBreeds = breeds.map((r) => {
        const score = calculateScore(r, formData)
        return { ...r, score }
      })

      // Seleciona as top 3 raças (maior score)
      const topBreeds = scoredBreeds.sort((a, b) => b.score - a.score).slice(0, 3)

      topBreeds.forEach((r) => {
        const card = document.createElement("div")
        card.classList.add("card")

        // Cria <img> com sistema de fallback melhorado
        const img = document.createElement("img")
        img.alt = r.nome

        // Lista de possíveis fontes de imagem
        const fontes = [
          r.foto,
          ...(r.valid_images || []),
          ...(r.images || []),
          `https://source.unsplash.com/600x400/?${encodeURIComponent(r.nome)}+dog`,
          `https://via.placeholder.com/600x400?text=${encodeURIComponent(r.nome)}`,
        ]

        // Função para tentar a próxima fonte
        let fonteAtual = 0

        function tentarProximaFonte() {
          if (fonteAtual < fontes.length) {
            const src = fontes[fonteAtual]
            if (src) {
              img.src = src
              fonteAtual++
            } else {
              fonteAtual++
              tentarProximaFonte()
            }
          }
        }

        // Configura o evento de erro para tentar a próxima fonte
        img.onerror = tentarProximaFonte

        // Inicia o processo tentando a primeira fonte
        tentarProximaFonte()

        card.appendChild(img)

        // Nome e % de aderência
        const h3 = document.createElement("h3")
        h3.textContent = r.nome
        card.appendChild(h3)

        const aderenciaEl = document.createElement("p")
        aderenciaEl.innerHTML = `<strong>${Math.round(r.score)}%</strong> de aderência`
        card.appendChild(aderenciaEl)

        // Descrição
        if (r.texto) {
          const descEl = document.createElement("p")
          descEl.textContent = r.texto
          card.appendChild(descEl)
        }

        // Indicação do criador
        if (r.criador) {
          const creatorEl = document.createElement("p")
          creatorEl.innerHTML = `<small>Indicação do criador: ${r.criador}</small>`
          card.appendChild(creatorEl)
        }

        // Adiciona informações adicionais
        const infoEl = document.createElement("div")
        infoEl.classList.add("info")

        // Adiciona porte
        if (r.porte) {
          const porteEl = document.createElement("span")
          porteEl.classList.add("tag")
          porteEl.textContent = `Porte: ${r.porte}`
          infoEl.appendChild(porteEl)
        }

        // Adiciona nível de energia
        if (r.energia) {
          const energiaEl = document.createElement("span")
          energiaEl.classList.add("tag")
          energiaEl.textContent = `Energia: ${r.energia}/5`
          infoEl.appendChild(energiaEl)
        }

        // Adiciona grupo
        if (r.grupo) {
          const grupoEl = document.createElement("span")
          grupoEl.classList.add("tag")
          grupoEl.textContent = `Grupo: ${r.grupo}`
          infoEl.appendChild(grupoEl)
        }

        card.appendChild(infoEl)

        resultados.appendChild(card)
      })
    })
  } catch (err) {
    console.error("Erro ao carregar as raças:", err)
    btn.textContent = "Erro ao carregar"
    // Exibe mensagem de erro para o usuário
    const errorMsg = document.createElement("p")
    errorMsg.textContent = `Erro ao carregar dados: ${err.message}`
    errorMsg.style.color = "red"
    form.appendChild(errorMsg)
  }
})
