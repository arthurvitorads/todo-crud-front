"use strict";
const API_URL = "https://localhost:7063";
const $ = (id) => document.getElementById(id);
const fields = [
  "Descricao",
  "DataCadastroInicial",
  "DataCadastroFinal",
  "DataAtualizacaoInicial",
  "DataAtualizacaoFinal",
];
const controls = {
  Descricao: $("filtroDescricao"),
  DataCadastroInicial: $("dataCadastroInicial"),
  DataCadastroFinal: $("dataCadastroFinal"),
  DataAtualizacaoInicial: $("dataAtualizacaoInicial"),
  DataAtualizacaoFinal: $("dataAtualizacaoFinal"),
};
let paginaAtual = 1;
let ordem = "DataCadastro";
let direcao = "DESC";
let totalAtual = 0;
let toastTimer;
let requisicaoAtual = 0;
const lista = $("listaLembretes");
const form = $("formLembrete");

function toast(mensagem, tipo = "success") {
  const el = $("toast");
  clearTimeout(toastTimer);
  el.textContent = mensagem;
  el.className = `toast ${tipo === "error" ? "error" : ""}`;
  toastTimer = setTimeout(() => el.classList.add("hidden"), 4200);
}
function validarDatas() {
  for (const [inicio, fim] of [
    ["DataCadastroInicial", "DataCadastroFinal"],
    ["DataAtualizacaoInicial", "DataAtualizacaoFinal"],
  ]) {
    if (
      controls[inicio].value &&
      controls[fim].value &&
      controls[inicio].value > controls[fim].value
    ) {
      toast("A data inicial não pode ser posterior à data final.", "error");
      controls[fim].focus();
      return false;
    }
  }
  return true;
}
function parametros() {
  const p = new URLSearchParams({
    NumeroPagina: String(paginaAtual),
    TamanhoPagina: $("tamanhoPagina").value,
    Ordem: ordem,
    Direcao: direcao,
  });
  for (const campo of fields) {
    const valor = controls[campo].value.trim();
    if (valor) p.set(campo, valor);
  }
  return p;
}
async function requisitar(path, options) {
  let response;

  try {
    response = await fetch(`${API_URL}${path}`, options);
  } catch {
    throw new Error("Não foi possível conectar à API.");
  }

  if (!response.ok) {
    const detalhe = await response.text();

    console.error("Erro na API:", {
      status: response.status,
      url: response.url,
      resposta: detalhe,
    });

    throw new Error(
      detalhe || `Erro HTTP ${response.status} ao acessar a API.`
    );
  }

  return response;
}
function dataFormatada(data) {
  if (!data) return "—";
  const d = new Date(data);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleString("pt-BR");
}
function atualizarOrdenacaoVisual() {
  document.querySelectorAll(".sort-button").forEach((botao) => {
    const ativo = botao.dataset.ordem === ordem;
    botao.classList.toggle("active", ativo);
    botao.querySelector(".sort-indicator").textContent = ativo
      ? direcao === "ASC"
        ? "↑"
        : "↓"
      : "↕";
    botao.setAttribute(
      "aria-label",
      `Ordenar por ${botao.dataset.ordem}${ativo ? `, ${direcao}` : ""}`
    );
  });
}
function renderizar(lembretes) {
  lista.replaceChildren();
  $("mensagemVazia").classList.toggle("hidden", lembretes.length !== 0);
  for (const lembrete of lembretes) {
    const tr = document.createElement("tr");
    const descricao = document.createElement("td");
    descricao.textContent = lembrete.descricao ?? "";
    const cadastro = document.createElement("td");
    cadastro.textContent = dataFormatada(lembrete.dataCadastro);
    const atualizacao = document.createElement("td");
    atualizacao.textContent = dataFormatada(lembrete.dataAtualizacao);
    const status = document.createElement("td");
    const span = document.createElement("span");
    span.className = `status ${
      lembrete.isAtivo ? "status-ativo" : "status-inativo"
    }`;
    span.textContent = lembrete.isAtivo ? "Ativo" : "Inativo";
    status.append(span);
    const acoes = document.createElement("td");
    acoes.className = "actions";
    const editar = document.createElement("button");
    editar.type = "button";
    editar.className = "action-btn";
    editar.textContent = "Editar";
    editar.addEventListener("click", () => buscarLembrete(lembrete.id));
    const excluir = document.createElement("button");
    excluir.type = "button";
    excluir.className = "action-btn delete";
    excluir.textContent = "Excluir";
    excluir.addEventListener("click", () => excluirLembrete(lembrete.id));
    acoes.append(editar, excluir);
    tr.append(descricao, cadastro, atualizacao, status, acoes);
    lista.append(tr);
  }
}
async function filtrarLembretes() {
  if (!validarDatas()) return;
  const numeroRequisicao = ++requisicaoAtual;
  $("estadoConexao").textContent = "Carregando...";
  $("estadoConexao").classList.remove("error");
  $("btnFiltrar").disabled = true;
  try {
    const response = await requisitar(`/lembretes/filtro?${parametros()}`);
    const resultado = await response.json();
    if (numeroRequisicao !== requisicaoAtual) return;
    const registros = Array.isArray(resultado.lembretes)
      ? resultado.lembretes
      : [];
    const total = Number(resultado.total) || 0;
    const tamanho = Math.max(
      1,
      Number(resultado.tamanhoPagina) || Number($("tamanhoPagina").value)
    );
    const paginas = Math.max(1, Math.ceil(total / tamanho));
    if (paginaAtual > paginas) {
      paginaAtual = paginas;
      return await filtrarLembretes();
    }
    totalAtual = total;
    renderizar(registros);
    $("totalRegistros").textContent = `${total} registro${
      total === 1 ? "" : "s"
    }`;
    $("statTotal").textContent = total.toLocaleString("pt-BR");
    $("statPagina").textContent = String(paginaAtual);
    $("paginaAtual").textContent = `Página ${paginaAtual} de ${paginas}`;
    $("btnAnterior").disabled = paginaAtual <= 1;
    $("btnProximo").disabled = paginaAtual >= paginas;
    $("estadoConexao").textContent = "API conectada";
    atualizarOrdenacaoVisual();
  } catch (erro) {
    if (numeroRequisicao !== requisicaoAtual) return;
    console.error(erro);
    $("estadoConexao").textContent = "API indisponível";
    $("estadoConexao").classList.add("error");
    lista.replaceChildren();
    $("mensagemVazia").classList.remove("hidden");
    $("totalRegistros").textContent = "— registros";
    $("statTotal").textContent = "—";
    $("btnAnterior").disabled = $("btnProximo").disabled = true;
    toast(erro.message, "error");
  } finally {
    if (numeroRequisicao === requisicaoAtual) $("btnFiltrar").disabled = false;
  }
}
function abrirNovo() {
  form.reset();
  $("lembreteId").value = "";
  $("tituloFormulario").textContent = "Novo lembrete";
  $("formulario").classList.remove("hidden");
  $("descricao").focus();
}
function fecharFormulario() {
  form.reset();
  $("lembreteId").value = "";
  $("formulario").classList.add("hidden");
}
async function buscarLembrete(id) {
  try {
    const response = await requisitar(`/lembretes/${encodeURIComponent(id)}`);
    const item = await response.json();
    $("lembreteId").value = item.id;
    $("descricao").value = item.descricao || "";
    $("tituloFormulario").textContent = "Editar lembrete";
    $("formulario").classList.remove("hidden");
    $("formulario").scrollIntoView({ behavior: "smooth", block: "center" });
    $("descricao").focus();
  } catch (erro) {
    toast(erro.message, "error");
  }
}
async function salvarLembrete(event) {
  event.preventDefault();
  const texto = $("descricao").value.trim();
  if (!texto) {
    toast("Informe a descrição do lembrete.", "error");
    $("descricao").focus();
    return;
  }
  const id = $("lembreteId").value;
  const botao = $("btnSalvar");
  botao.disabled = true;
  try {
    await requisitar(
      id ? `/lembretes/${encodeURIComponent(id)}` : "/lembretes",
      {
        method: id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descricao: texto }),
      }
    );
    toast(
      id
        ? "Lembrete atualizado com sucesso!"
        : "Lembrete cadastrado com sucesso!"
    );
    fecharFormulario();
    paginaAtual = 1;
    await filtrarLembretes();
  } catch (erro) {
    console.error(erro);
    toast(erro.message, "error");
  } finally {
    botao.disabled = false;
  }
}
async function excluirLembrete(id) {
  if (!confirm("Deseja realmente excluir este lembrete?")) return;
  try {
    await requisitar(`/lembretes/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    toast("Lembrete excluído com sucesso!");
    await filtrarLembretes();
  } catch (erro) {
    console.error(erro);
    toast(erro.message, "error");
  }
}
async function imprimirLembretes() {
  if (!validarDatas()) return;
  const botao = $("btnImprimir");
  botao.disabled = true;
  try {
    const response = await requisitar(`/lembretes/imprimir?${parametros()}`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "relatorio-lembretes.pdf";
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
    toast("Relatório gerado com sucesso!");
  } catch (erro) {
    toast(erro.message, "error");
  } finally {
    botao.disabled = false;
  }
}
$("btnNovo").addEventListener("click", abrirNovo);
$("btnCancelar").addEventListener("click", fecharFormulario);
$("btnImprimir").addEventListener("click", imprimirLembretes);
form.addEventListener("submit", salvarLembrete);
$("formFiltros").addEventListener("submit", (e) => {
  e.preventDefault();
  paginaAtual = 1;
  filtrarLembretes();
});
$("btnLimpar").addEventListener("click", () => {
  $("formFiltros").reset();
  paginaAtual = 1;
  filtrarLembretes();
});
$("tamanhoPagina").addEventListener("change", () => {
  paginaAtual = 1;
  filtrarLembretes();
});
$("btnAnterior").addEventListener("click", () => {
  if (paginaAtual > 1) {
    paginaAtual--;
    filtrarLembretes();
  }
});
$("btnProximo").addEventListener("click", () => {
  if (paginaAtual * Number($("tamanhoPagina").value) < totalAtual) {
    paginaAtual++;
    filtrarLembretes();
  }
});
document.querySelectorAll(".sort-button").forEach((botao) =>
  botao.addEventListener("click", () => {
    const campo = botao.dataset.ordem;
    if (ordem === campo) direcao = direcao === "ASC" ? "DESC" : "ASC";
    else {
      ordem = campo;
      direcao = "ASC";
    }
    paginaAtual = 1;
    filtrarLembretes();
  })
);
atualizarOrdenacaoVisual();
filtrarLembretes();
