const listaImoveis = document.querySelector("#lista-imoveis");
const quantidadeImoveis = document.querySelector("#quantidade-imoveis");
const mensagemVazia = document.querySelector("#mensagem-vazia");

const imoveis = [];

function atualizarCatalogo() {
    listaImoveis.innerHTML = "";

    quantidadeImoveis.textContent = imoveis.length;

    if (imoveis.length === 0) {
        mensagemVazia.hidden = false;
        return;
    }

    mensagemVazia.hidden = true;

    imoveis.forEach((imovel) => {
        const card = document.createElement("article");

        card.classList.add("card-imovel");

        card.innerHTML = `
            <h2>${imovel.titulo}</h2>

            <p>${imovel.cidade}</p>

            <strong>
                R$ ${imovel.preco}
            </strong>
        `;

        listaImoveis.appendChild(card);
    });
}

atualizarCatalogo();