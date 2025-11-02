// frontend/scripts.js

// Função principal que decide se salva (cria) ou atualiza
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
        // Se houver ID no campo escondido, é uma atualização
        dados.id = parseInt(transacaoId);
        resultado = await pywebview.api.atualizar_transacao_js(dados);
    } else {
        // Se não houver ID, é uma nova transação
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


// Função para carregar dados do Python e popular a tabela (READ)
async function carregarTransacoes() {
    const tbody = document.getElementById('corpoTabelaTransacoes');
    tbody.innerHTML = '<tr><td colspan="7">Carregando dados...</td></tr>';

    const transacoes = await pywebview.api.obter_transacoes_js();
    
    tbody.innerHTML = ''; 
    let saldoTotal = 0;

    transacoes.forEach(t => {
        const row = tbody.insertRow();
        
        // Converte o valor para float e calcula o saldo
        const valorFloat = parseFloat(t.valor);
        saldoTotal += valorFloat;
        
        // Formata o valor para exibição em moeda brasileira
        const valorFormatado = valorFloat.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        
        // Define a cor da linha com base no valor (simples)
        if (valorFloat < 0) {
            row.style.color = 'red';
        } else if (valorFloat > 0) {
            row.style.color = 'green';
        }
        
        // Insere as células na ordem da sua tabela
        row.insertCell().textContent = t.id;
        row.insertCell().textContent = t.usuario;
        row.insertCell().textContent = t.conta; 
        row.insertCell().textContent = t.descricao;
        row.insertCell().textContent = valorFormatado;
        row.insertCell().textContent = t.data;
        
        // Célula de Ações
        const acoesCell = row.insertCell();
        acoesCell.innerHTML = `
            <button onclick="carregarParaEdicao(${t.id})">Editar</button>
            <button onclick="apagarTransacao(${t.id})" class="btn-apagar">Apagar</button>
        `;
    });
    
    // Atualiza o rodapé com o saldo total
    document.getElementById('saldoTotal').textContent = 
        `Saldo Total: ${saldoTotal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
}


// Função para carregar dados de uma transação no formulário (UPDATE - Passo 1)
async function carregarParaEdicao(id) {
    const transacao = await pywebview.api.obter_transacao_por_id_js(id);
    
    if (transacao) {
        document.getElementById('formTitulo').textContent = 'Edição de Transação';
        document.getElementById('btnSalvar').textContent = 'Atualizar';
        
        // Preenche o formulário
        document.getElementById('transacaoId').value = transacao.id;
        document.getElementById('usuario').value = transacao.usuario;
        document.getElementById('conta').value = transacao.conta;
        document.getElementById('descricao').value = transacao.descricao;
        document.getElementById('valor').value = transacao.valor;
        document.getElementById('data').value = transacao.data;
        
        // Rola a página para o topo, para ver o formulário
        window.scrollTo(0, 0); 
    } else {
        alert('Transação não encontrada.');
    }
}


// Função para limpar o formulário e resetar o modo de edição/cadastro
function limparFormulario() {
    document.getElementById('transacaoForm').reset();
    document.getElementById('transacaoId').value = ''; // Limpa o ID escondido
    document.getElementById('formTitulo').textContent = 'Cadastro';
    document.getElementById('btnSalvar').textContent = 'Salvar';
}


// Função para apagar uma transação (DELETE)
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


// Iniciar o carregamento da tabela quando a API Python estiver pronta
window.addEventListener('pywebviewready', carregarTransacoes);