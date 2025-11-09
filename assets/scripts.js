// frontend/scripts.js (SEM DATATABLES E COM PAGINAÇÃO MANUAL)

// Variáveis de estado global para Paginação
let transacoesAtuais = []; // Armazena todos os registros do backend
let paginaAtual = 1;
const limitePorPagina = 5; // O valor fixo que você deseja
let totalPaginas = 1;

// Referências de elementos
const infoPagina = document.getElementById('infoPagina');
const btnAnterior = document.getElementById('btnAnterior');
const btnProximo = document.getElementById('btnProximo');


/* ======================================= */
/* FUNÇÕES CRUD (Básicas) */
/* ======================================= */

async function salvarOuAtualizar() {
    const transacaoId = document.getElementById('transacaoId').value;
    const dados = {
        usuario: document.getElementById('usuario').value,
        conta: document.getElementById('conta').value,
        descricao: document.getElementById('descricao').value,
        valor: document.getElementById('valor').value,
        data: document.getElementById('data').value
    };

    // Validação básica
    if (!dados.usuario || !dados.descricao || !dados.valor || !dados.data) {
        alert("Por favor, preencha todos os campos obrigatórios.");
        return;
    }

    let resultado;
    
    if (transacaoId) {
        dados.id = parseInt(transacaoId);
        resultado = await pywebview.api.atualizar_transacao_js(dados);
    } else {
        resultado = await pywebview.api.adicionar_transacao_js(dados);
    }

    if (resultado.status === 'sucesso') {
        alert('Operação realizada com sucesso! ' + resultado.mensagem);
        limparFormulario();
        carregarTransacoes(); 
    } else {
        alert('Erro: ' + resultado.mensagem);
    }
}


async function carregarParaEdicao(id) {
    const transacao = await pywebview.api.obter_transacao_por_id_js(id);
    
    if (transacao) {
        document.getElementById('formTitulo').textContent = 'Edição de Transação';
        document.getElementById('btnSalvar').textContent = 'Atualizar';
        
        document.getElementById('transacaoId').value = transacao.id;
        document.getElementById('usuario').value = transacao.usuario;
        document.getElementById('conta').value = transacao.conta;
        document.getElementById('descricao').value = transacao.descricao;
        document.getElementById('valor').value = transacao.valor;
        document.getElementById('data').value = transacao.data;
        
        window.scrollTo(0, 0); 
    } else {
        alert('Transação não encontrada.');
    }
}


function limparFormulario() {
    document.getElementById('transacaoForm').reset();
    document.getElementById('transacaoId').value = ''; 
    document.getElementById('formTitulo').textContent = 'Cadastro';
    document.getElementById('btnSalvar').textContent = 'Salvar';
}


async function apagarTransacao(id) {
    if (confirm(`Tem certeza que deseja APAGAR a transação ID ${id}?`)) {
        const resultado = await pywebview.api.deletar_transacao_js(id);
        if (resultado.status === 'sucesso') {
            alert(resultado.mensagem);
            carregarTransacoes(); 
        } else {
            alert('Erro ao apagar: ' + resultado.mensagem);
        }
    }
}


/* ======================================= */
/* FUNÇÕES DE PAGINAÇÃO E RENDERIZAÇÃO */
/* ======================================= */

// Função principal que busca os dados e inicializa a paginação
async function carregarTransacoes() {
    // 1. Obter todos os dados do Python
    transacoesAtuais = await pywebview.api.obter_transacoes_js();

    // 2. Calcular o total de páginas
    totalPaginas = Math.ceil(transacoesAtuais.length / limitePorPagina);
    
    // 3. Garantir que a página atual seja válida
    if (paginaAtual > totalPaginas && totalPaginas > 0) {
        paginaAtual = totalPaginas;
    } else if (totalPaginas === 0) {
        paginaAtual = 1;
    }

    // 4. Renderizar a página atual
    renderizarPagina();
}

// Função que renderiza os registros da página atual
function renderizarPagina() {
    const tbody = document.getElementById('corpoTabelaTransacoes');
    tbody.innerHTML = ''; // Limpa a tabela
    
    // Calcula os índices de início e fim da lista de transações
    const indiceInicio = (paginaAtual - 1) * limitePorPagina;
    const indiceFim = indiceInicio + limitePorPagina;
    
    // Filtra apenas os itens da página atual
    const transacoesDaPagina = transacoesAtuais.slice(indiceInicio, indiceFim);

    // Se a página atual não tiver dados (ex: última página vazia após exclusão)
    if (transacoesDaPagina.length === 0 && transacoesAtuais.length > 0) {
        if (paginaAtual > 1) {
            paginaAtual--;
            renderizarPagina();
        }
        return;
    }
    
    // Preenche a tabela com os dados da página
    transacoesDaPagina.forEach(t => {
        const row = tbody.insertRow();
        
        const valorFloat = parseFloat(t.valor);
        
        const valorFormatado = valorFloat.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        if (valorFloat < 0) {
            row.style.color = 'red';
        } else if (valorFloat > 0) {
            row.style.color = 'green';
        }
        
        row.insertCell().textContent = t.id;
        row.insertCell().textContent = t.usuario;
        row.insertCell().textContent = t.conta; 
        row.insertCell().textContent = t.descricao;
        row.insertCell().textContent = valorFormatado;
        row.insertCell().textContent = t.data;
        
        const acoesCell = row.insertCell();
        acoesCell.innerHTML = `
            <button onclick="carregarParaEdicao(${t.id})">Editar</button>
            <button onclick="apagarTransacao(${t.id})" class="btn-apagar">Apagar</button>
        `;
    });
    
    // Atualiza o saldo total
    const saldoTotalGeral = transacoesAtuais.reduce((soma, t) => soma + parseFloat(t.valor), 0);
    document.getElementById('saldoTotal').textContent = 
        `Saldo Total: ${saldoTotalGeral.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;

    // Atualiza o estado dos controles de paginação
    atualizarControlesPaginacao();
}

// Função para avançar/voltar a página
function mudarPagina(passo) {
    const novaPagina = paginaAtual + passo;
    if (novaPagina >= 1 && novaPagina <= totalPaginas) {
        paginaAtual = novaPagina;
        renderizarPagina();
    }
}

// Função que gerencia a exibição dos botões Anterior/Próximo
function atualizarControlesPaginacao() {
    infoPagina.textContent = `Página ${paginaAtual} de ${totalPaginas}`;
    
    btnAnterior.disabled = (paginaAtual === 1);
    btnProximo.disabled = (paginaAtual === totalPaginas || totalPaginas === 0);
}


// Iniciar o carregamento da tabela quando a API Python estiver pronta
window.addEventListener('pywebviewready', () => {
    carregarTransacoes(); 
});