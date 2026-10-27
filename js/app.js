// ========================================
// CONFIGURAÇÃO
// ========================================

const API_URL = "https://localhost:7063";

let paginaAtual = 1;


// ========================================
// ELEMENTOS DA PÁGINA
// ========================================

const formulario = document.getElementById("formulario");
const formLembrete = document.getElementById("formLembrete");

const lembreteId = document.getElementById("lembreteId");
const descricao = document.getElementById("descricao");

const listaLembretes = document.getElementById("listaLembretes");
const mensagemVazia = document.getElementById("mensagemVazia");

const filtroDescricao = document.getElementById("filtroDescricao");
const tamanhoPagina = document.getElementById("tamanhoPagina");

const totalRegistros = document.getElementById("totalRegistros");
const paginaAtualElemento = document.getElementById("paginaAtual");

const btnImprimir = document.getElementById("btnImprimir");
const btnNovo = document.getElementById("btnNovo");
const btnCancelar = document.getElementById("btnCancelar");
const btnFiltrar = document.getElementById("btnFiltrar");

const btnAnterior = document.getElementById("btnAnterior");
const btnProximo = document.getElementById("btnProximo");

const tituloFormulario = document.getElementById("tituloFormulario");


// ========================================
// INICIALIZAÇÃO
// ========================================

document.addEventListener("DOMContentLoaded", () => {
    filtrarLembretes();
});

// ========================================
// GET /lembretes/filtro
// ========================================
async function filtrarLembretes() {
    try {
        const dataAtual = new Date();
        const dataFormatada = dataAtual.getFullYear() + "-" +
            String(dataAtual.getMonth() + 1).padStart(2, "0") + "-" +
            String(dataAtual.getDate()).padStart(2, "0");

        const params = new URLSearchParams();

        params.append("NumeroPagina", paginaAtual);
        params.append("TamanhoPagina", tamanhoPagina.value);
        params.append("Descricao", filtroDescricao.value);

        /*TODO: implementar todos os filtros no html*/
        params.append("Ordem", "DataCadastro");
        params.append("Direcao", "DESC");
        params.append("DataCadastroInicial", dataFormatada);
        params.append("DataCadastroFinal", dataFormatada);
        params.append("DataAtualizacaoInicial", dataFormatada);
        params.append("DataAtualizacaoFinal", dataFormatada);
        
        console.log('filtro-> params', params);

        const response = await fetch(
            `${API_URL}/lembretes/filtro?${params}`
        );

        if (!response.ok) {
            throw new Error("Erro ao filtrar lembretes.");
        }

        const resultado = await response.json();

        renderizarLembretes(resultado.lembretes);

        totalRegistros.textContent =
            `${resultado.total} registros`;

        paginaAtualElemento.textContent =
            `Página ${resultado.numeroPagina}`;

        btnAnterior.disabled =
            paginaAtual <= 1;

        btnProximo.disabled =
            paginaAtual * resultado.tamanhoPagina >= resultado.total;

    } catch (error) {

        console.error(error);

        mostrarToast(
            "Erro ao realizar o filtro."
        );
    }
}

// ========================================
// GET /lembretes/imprimir
// ========================================
async function imprimirLembretes() {
    try {
        const dataAtual = new Date();
        const dataFormatada = dataAtual.getFullYear() + "-" +
            String(dataAtual.getMonth() + 1).padStart(2, "0") + "-" +
            String(dataAtual.getDate()).padStart(2, "0");

        const params = new URLSearchParams();

        params.append("NumeroPagina", paginaAtual);
        params.append("TamanhoPagina", tamanhoPagina.value);
        params.append("Descricao", filtroDescricao.value);

        /*TODO: implementar todos os filtros no html*/
        params.append("Ordem", "DataCadastro");
        params.append("Direcao", "DESC");
        params.append("DataCadastroInicial", dataFormatada);
        params.append("DataCadastroFinal", dataFormatada);
        params.append("DataAtualizacaoInicial", dataFormatada);
        params.append("DataAtualizacaoFinal", dataFormatada);

        const response = await fetch(
            `${API_URL}/lembretes/imprimir?${params}`
        );

        if (!response.ok) {
            throw new Error("Erro ao filtrar lembretes.");
        }
        
        console.log("teste");

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "relatorio-lembretes.pdf";

        document.body.appendChild(a)
        a.click();
        a.remove();

        setTimeout(() => URL.revokeObjectURL(url), 10000)

    } catch (error) {

        console.error(error);

        mostrarToast(
            "Erro ao realizar o filtro."
        );
    }
}

// ========================================
// POST /lembretes
// ========================================

async function criarLembrete() {
    try {

        const dados = { 
            descricao: descricao.value
        };

        const response = await fetch(
            `${API_URL}/lembretes`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dados)
            }
        );

        if (!response.ok) {
            throw new Error("Erro ao criar lembrete.");
        }

        mostrarToast("Lembrete criado com sucesso!");

        fecharFormulario();

        await filtrarLembretes();

    } catch (error) {

        console.error(error);

        mostrarToast("Não foi possível criar o lembrete.");
    }
}


// ========================================
// GET /lembretes/{id}
// ========================================
async function buscarLembrete(id) {

    try {

        const response = await fetch(
            `${API_URL}/lembretes/${id}`
        );

        if (!response.ok) {
            throw new Error("Lembrete não encontrado.");
        }

        const lembrete = await response.json();

        lembreteId.value = lembrete.id;
        descricao.value = lembrete.descricao;

        tituloFormulario.textContent = "Editar lembrete";

        formulario.classList.remove("hidden");

    } catch (error) {

        console.error(error);

        mostrarToast(
            "Não foi possível buscar o lembrete."
        );
    }
}


// ========================================
// PUT /lembretes/{id}
// ========================================

async function atualizarLembrete() {

    try {

        const dados = {
            descricao: descricao.value
        };

        const response = await fetch(
            `${API_URL}/lembretes/${lembreteId.value}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(dados)
            }
        );

        if (!response.ok) {
            throw new Error("Erro ao atualizar.");
        }

        mostrarToast(
            "Lembrete atualizado com sucesso!"
        );

        fecharFormulario();

        await filtrarLembretes();

    } catch (error) {

        console.error(error);

        mostrarToast(
            "Não foi possível atualizar o lembrete."
        );
    }
}


// ========================================
// DELETE /lembretes/{id}
// ========================================
async function excluirLembrete(id) {

    const confirmou = confirm(
        "Deseja realmente excluir este lembrete?"
    );

    if (!confirmou) {
        return;
    }

    try {

        const response = await fetch(
            `${API_URL}/lembretes/${id}`,
            {
                method: "DELETE"
            }
        );

        if (!response.ok) {
            throw new Error("Erro ao excluir.");
        }

        mostrarToast(
            "Lembrete excluído com sucesso!"
        );

        await filtrarLembretes();

    } catch (error) {

        console.error(error);

        mostrarToast(
            "Não foi possível excluir o lembrete."
        );
    }
}


// ========================================
// RENDERIZAÇÃO
// ========================================
function renderizarLembretes(lembretes) {
    listaLembretes.innerHTML = "";

    if (!lembretes || lembretes.length === 0) {
        mensagemVazia.classList.remove("hidden");

        return;
    }

    mensagemVazia.classList.add("hidden");

    lembretes.forEach(lembrete => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>
                ${lembrete.descricao}
            </td>

            <td>
                ${formatarData(lembrete.dataCadastro)}
            </td>

            <td>
                ${formatarData(lembrete.dataAtualizacao)}
            </td>

            <td>
                <span class="status ${
                    lembrete.isAtivo
                        ? "status-ativo"
                        : "status-inativo"
                }">
                    ${
                        lembrete.isAtivo
                            ? "Ativo"
                            : "Inativo"
                    }
                </span>
            </td>

            <td>
                <div class="actions">

                    <button
                        class="btn btn-edit"
                        onclick="buscarLembrete('${lembrete.id}')">
                        Editar
                    </button>

                    <button
                        class="btn btn-danger"
                        onclick="excluirLembrete('${lembrete.id}')">
                        Excluir
                    </button>

                </div>
            </td>
        `;

        listaLembretes.appendChild(tr);
    });
}


// ========================================
// FORMULÁRIO
// ========================================
btnImprimir.addEventListener("click", () => {
    console.log('click-> imprimir lembretes');
    imprimirLembretes();
});

btnNovo.addEventListener("click", () => {
    abrirFormularioNovo();
});


btnCancelar.addEventListener("click", () => {
    fecharFormulario();
});

formLembrete.addEventListener("submit", async (event) => {
    event.preventDefault();

    if (!descricao.value.trim()) {
        mostrarToast("Informe uma descrição.");

        return;
    }

    if (lembreteId.value) {
        await atualizarLembrete();
    } else {
        await criarLembrete();
    }
});


function abrirFormularioNovo() {
    lembreteId.value = "";
    descricao.value = "";

    tituloFormulario.textContent = "Novo lembrete";

    formulario.classList.remove("hidden");
    descricao.focus();
}

function fecharFormulario() {
    formulario.classList.add("hidden");
    formLembrete.reset();
    lembreteId.value = "";
}

// ========================================
// FILTRO
// ========================================
btnFiltrar.addEventListener("click", () => {
    paginaAtual = 1;
    filtrarLembretes();
});

filtroDescricao.addEventListener("keyup", event => {
    if (event.key === "Enter") {
        paginaAtual = 1;
        filtrarLembretes();
    }
});

// ========================================
// PAGINAÇÃO
// ========================================
btnAnterior.addEventListener("click", () => {
    if (paginaAtual > 1) {
        paginaAtual--;
        filtrarLembretes();
    }
});

btnProximo.addEventListener("click", () => {
    paginaAtual++;
    filtrarLembretes();
});


// ========================================
// UTILITÁRIOS
// ========================================
function formatarData(data) {

    if (!data) {
        return "-";
    }

    return new Date(data).toLocaleString(
        "pt-BR"
    );
}


function mostrarToast(mensagem) {
    const toast = document.getElementById("toast");

    toast.textContent = mensagem;

    toast.classList.remove("hidden");

    setTimeout(() => { toast.classList.add("hidden"); }, 3000);
}