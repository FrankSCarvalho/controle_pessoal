import sqlite3

class Transacao:
    """Representa uma única transação usando os campos do formulário:
       Usuário, Conta, Descrição, Valor, Data."""
    
    def __init__(self, usuario, conta, descricao, valor, data, id=None):
        self.id = id           
        self.usuario = usuario
        self.conta = conta
        self.descricao = descricao
        self.valor = valor
        self.data = data       # Formato 'AAAA-MM-DD'

    def to_tuple(self):
        """Retorna os atributos como uma tupla na ordem para inserção/atualização no BD."""
        return (self.usuario, self.conta, self.descricao, self.valor, self.data)
    
    def __repr__(self):
        return f"Transacao(ID={self.id}, Usuário='{self.usuario}', Valor={self.valor:.2f})"


class GerenciadorBD:
    """Gerencia a conexão e as operações CRUD com o banco de dados SQLite."""

    def __init__(self, db_name='gastos.db'):
        self.db_name = db_name
        self._conectar()
        self._criar_tabela()
        self._desconectar()

    def _conectar(self):
        """Estabelece a conexão com o banco de dados."""
        self.conn = sqlite3.connect(self.db_name)
        # Permite acessar colunas por nome
        self.conn.row_factory = sqlite3.Row 
        self.cursor = self.conn.cursor()

    def _desconectar(self):
        """Fecha a conexão com o banco de dados."""
        if self.conn:
            self.conn.close()
            self.conn = None
            self.cursor = None

    def _criar_tabela(self):
        """Cria a tabela 'transacoes' com os campos do formulário se ela não existir."""
        self._conectar()
        self.cursor.execute('''
            CREATE TABLE IF NOT EXISTS transacoes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario TEXT NOT NULL,
                conta TEXT,
                descricao TEXT,
                valor REAL NOT NULL,
                data TEXT NOT NULL
            )
        ''')
        self.conn.commit()
        self._desconectar()
        
    # --- Métodos CRUD ---

    def adicionar_transacao(self, transacao: Transacao):
        """CREATE: Insere uma nova transação no BD."""
        self._conectar()
        query = '''INSERT INTO transacoes (usuario, conta, descricao, valor, data) 
                   VALUES (?, ?, ?, ?, ?)'''
        self.cursor.execute(query, transacao.to_tuple())
        self.conn.commit()
        transacao.id = self.cursor.lastrowid # Retorna o ID gerado
        self._desconectar()
        return transacao

    def obter_transacoes(self, transacao_id=None):
        """READ: Retorna todas as transações ou uma específica pelo ID."""
        self._conectar()
        if transacao_id:
            query = "SELECT * FROM transacoes WHERE id = ?"
            self.cursor.execute(query, (transacao_id,))
            registro = self.cursor.fetchone()
            self._desconectar()
            return dict(registro) if registro else None
        else:
            query = "SELECT * FROM transacoes ORDER BY data DESC, id DESC"
            self.cursor.execute(query)
            registros = self.cursor.fetchall()
            self._desconectar()
            # Retorna uma lista de objetos Row, que se comporta como dicionário
            return [dict(row) for row in registros] 

    def deletar_transacao(self, transacao_id):
        """DELETE: Remove uma transação pelo ID."""
        self._conectar()
        query = "DELETE FROM transacoes WHERE id = ?"
        self.cursor.execute(query, (transacao_id,))
        self.conn.commit()
        self._desconectar()

    def atualizar_transacao(self, transacao: Transacao):
        """UPDATE: Atualiza uma transação existente pelo ID."""
        if transacao.id is None:
            raise ValueError("ID da transação é necessário para atualização.")
            
        self._conectar()
        query = '''
            UPDATE transacoes SET 
                usuario = ?, 
                conta = ?, 
                descricao = ?, 
                valor = ?, 
                data = ?
            WHERE id = ?
        '''
        # Combina os campos da transação com o ID no final
        dados = transacao.to_tuple() + (transacao.id,) 
        self.cursor.execute(query, dados)
        self.conn.commit()
        self._desconectar()