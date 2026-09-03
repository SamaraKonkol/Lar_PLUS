const estadoEdicao = document.getElementById("estado-edicao");
const formularioEdicao = document.getElementById("form-editar-imovel");
const botaoSalvar = document.getElementById("salvar-edicao");
const paramsEdicao = new URLSearchParams(window.location.search);
const imovelId = paramsEdicao.get("id");

function campo(id) {
    return document.getElementById(id);
}

function definirValor(id, valor) {
    const elemento = campo(id);

    if (elemento) {
        elemento.value = valor ?? "";
    }
}

function definirCheck(id, valor) {
    const elemento = campo(id);

    if (elemento) {
        elemento.checked = Boolean(valor);
    }
}

function normalizarData(valor) {
    if (!valor) {
        return "";
    }

    return String(valor).slice(0, 10);
}

function preencherFormulario(imovel) {
    definirValor("titulo", imovel.titulo);
    definirValor("descricao", imovel.descricao);
    definirValor("tipo", imovel.tipo);
    definirValor("finalidade", imovel.finalidade);
    definirValor("valor", imovel.valor);
    definirValor("cep", imovel.cep);
    definirValor("estado", imovel.estado);
    definirValor("cidade", imovel.cidade);
    definirValor("bairro", imovel.bairro);
    definirValor("endereco", imovel.endereco);
    definirValor("numero", imovel.numero);
    definirValor("complemento", imovel.complemento);
    definirValor("quartos", imovel.quartos);
    definirValor("suites", imovel.suites);
    definirValor("banheiros", imovel.banheiros);
    definirValor("vagas", imovel.vagas);
    definirValor("area", imovel.area);
    definirValor("area_construida", imovel.area_construida);
    definirValor("condominio", imovel.condominio);
    definirValor("iptu", imovel.iptu);
    definirValor("seguro", imovel.seguro);
    definirValor("financiamento", imovel.financiamento);
    definirValor("reserva_percentual", imovel.reserva_percentual);
    definirValor("disponibilidade", normalizarData(imovel.disponibilidade));
    definirValor("contrato_minimo", imovel.contrato_minimo);
    definirValor("regras_adicionais", imovel.regras_adicionais);
    definirCheck("ocultar_numero", imovel.ocultar_numero);
    definirCheck("aceita_animais", imovel.aceita_animais);
    definirCheck("aceita_criancas", imovel.aceita_criancas);
    definirCheck("permite_fumar", imovel.permite_fumar);
    definirCheck("entrada_imediata", imovel.entrada_imediata);

    const selecionadas = new Set(imovel.comodidades || []);

    document.querySelectorAll('[name="comodidade"]').forEach(input => {
        input.checked = selecionadas.has(input.value);
    });
}

function valor(id) {
    return campo(id)?.value?.trim() || "";
}

function marcado(id) {
    return Boolean(campo(id)?.checked);
}

function montarPayload() {
    return {
        titulo: valor("titulo"),
        descricao: valor("descricao"),
        tipo: valor("tipo"),
        finalidade: valor("finalidade"),
        valor: valor("valor"),
        cep: valor("cep"),
        estado: valor("estado"),
        cidade: valor("cidade"),
        bairro: valor("bairro"),
        endereco: valor("endereco"),
        numero: valor("numero"),
        complemento: valor("complemento"),
        ocultar_numero: marcado("ocultar_numero"),
        quartos: valor("quartos") || 0,
        suites: valor("suites") || 0,
        banheiros: valor("banheiros") || 0,
        vagas: valor("vagas") || 0,
        area: valor("area"),
        area_construida: valor("area_construida"),
        condominio: valor("condominio") || 0,
        iptu: valor("iptu") || 0,
        seguro: valor("seguro") || 0,
        financiamento: valor("financiamento") || 0,
        reserva_percentual: valor("reserva_percentual") || 10,
        disponibilidade: valor("disponibilidade"),
        contrato_minimo: valor("contrato_minimo") || 12,
        regras_adicionais: valor("regras_adicionais"),
        aceita_animais: marcado("aceita_animais"),
        aceita_criancas: marcado("aceita_criancas"),
        permite_fumar: marcado("permite_fumar"),
        entrada_imediata: marcado("entrada_imediata"),
        comodidades: Array.from(document.querySelectorAll('[name="comodidade"]:checked')).map(input => input.value)
    };
}

async function carregarImovel() {
    const usuario = await protegerPagina();

    if (!usuario) {
        return;
    }

    if (!imovelId) {
        estadoEdicao.textContent = "Imóvel não informado.";
        estadoEdicao.classList.add("erro");
        return;
    }

    try {
        const resposta = await fetch(`${API_URL}/api/imoveis/${imovelId}/edicao`, {
            headers: {
                Authorization: `Bearer ${obterToken()}`
            }
        });

        const dados = await resposta.json();

        if (resposta.status === 401 || resposta.status === 403) {
            removerToken();
            window.location.href = "login.html";
            return;
        }

        if (!resposta.ok) {
            throw new Error(dados.erro || "Não foi possível carregar o imóvel.");
        }

        preencherFormulario(dados.imovel);
        estadoEdicao.hidden = true;
        formularioEdicao.hidden = false;
    } catch (erro) {
        estadoEdicao.textContent = erro.message;
        estadoEdicao.classList.add("erro");
    }
}

async function salvarEdicao(event) {
    event.preventDefault();

    if (!formularioEdicao.reportValidity()) {
        return;
    }

    const textoOriginal = botaoSalvar.textContent;

    try {
        botaoSalvar.disabled = true;
        botaoSalvar.textContent = "Salvando...";

        const resposta = await fetch(`${API_URL}/api/imoveis/${imovelId}`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${obterToken()}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(montarPayload())
        });

        const dados = await resposta.json();

        if (resposta.status === 401 || resposta.status === 403) {
            removerToken();
            window.location.href = "login.html";
            return;
        }

        if (!resposta.ok) {
            throw new Error(dados.erro || "Não foi possível salvar as alterações.");
        }

        if (typeof mostrarAvisoInterface === "function") {
            mostrarAvisoInterface("Imóvel atualizado", "As alterações foram salvas com sucesso.");
        }

        setTimeout(() => {
            window.location.href = "dashboard.html";
        }, 900);
    } catch (erro) {
        if (typeof mostrarAvisoInterface === "function") {
            mostrarAvisoInterface("Não foi possível salvar", erro.message, "erro");
        } else {
            window.alert(erro.message);
        }
    } finally {
        botaoSalvar.disabled = false;
        botaoSalvar.textContent = textoOriginal;
    }
}

formularioEdicao?.addEventListener("submit", salvarEdicao);
document.addEventListener("DOMContentLoaded", carregarImovel);
