import webview
from database import Transacao, GerenciadorBD

ALTURA = 600
LARGURA = 1200

class Api:
    def __init__(self):
        # O GerenciadorBD é inicializado ao criar a API
        self.db_manager = GerenciadorBD()

    # CREATE: Adiciona transação (chamada pelo JS ao salvar)
    def adicionar_transacao_js(self, dados_transacao):
        try:
            # 1. Converte e limpa o Valor (garantindo que vírgulas funcionem)
            valor = float(str(dados_transacao['valor']).replace(',', '.')) 
            
            # 2. Cria o objeto Transacao
            nova_transacao = Transacao(
                usuario=dados_transacao['usuario'],
                conta=dados_transacao['conta'], 
                descricao=dados_transacao['descricao'],
                valor=valor,
                data=dados_transacao['data']
            )
            
            self.db_manager.adicionar_transacao(nova_transacao)
            
            return {'status': 'sucesso', 'mensagem': 'Transação adicionada.'}
        except Exception as e:
            return {'status': 'erro', 'mensagem': f'Erro ao adicionar: {e}'}

    # READ: Obtém todas as transações (chamada pelo JS para popular a tabela)
    def obter_transacoes_js(self):
        transacoes = self.db_manager.obter_transacoes()
        # Já retorna uma lista de dicionários, pronta para o JS
        return transacoes

    # READ: Obtém uma única transação (chamada pelo JS ao editar)
    def obter_transacao_por_id_js(self, transacao_id):
        return self.db_manager.obter_transacoes(transacao_id)

    # DELETE: Deleta transação
    def deletar_transacao_js(self, transacao_id):
        try:
            self.db_manager.deletar_transacao(transacao_id)
            return {'status': 'sucesso', 'mensagem': f'Transação {transacao_id} deletada.'}
        except Exception as e:
            return {'status': 'erro', 'mensagem': f'Erro ao deletar: {e}'}

    # UPDATE: Atualiza transação (chamada pelo JS ao salvar após edição)
    def atualizar_transacao_js(self, dados_transacao):
        try:
            # ID é crucial para UPDATE
            transacao_id = int(dados_transacao['id']) 
            valor = float(str(dados_transacao['valor']).replace(',', '.'))
            
            transacao_atualizada = Transacao(
                id=transacao_id,
                usuario=dados_transacao['usuario'],
                conta=dados_transacao['conta'], 
                descricao=dados_transacao['descricao'],
                valor=valor,
                data=dados_transacao['data']
            )
            
            self.db_manager.atualizar_transacao(transacao_atualizada)
            
            return {'status': 'sucesso', 'mensagem': f'Transação {transacao_id} atualizada.'}
        except Exception as e:
            return {'status': 'erro', 'mensagem': f'Erro ao atualizar: {e}'}

    

if __name__ == "__main__":
    api = Api()
    janela = webview.create_window("Controle Financeiro Pessoal", "index.html", js_api=api, width=LARGURA, height= ALTURA)
    webview.start()