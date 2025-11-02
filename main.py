import webview

ALTURA = 600
LARGURA = 1200

class Api:
    pass

if __name__ == "__main__":
    api = Api()
    janela = webview.create_window("Controle Financeiro Pessoal", "index.html", js_api=api, width=LARGURA, height= ALTURA)
    webview.start()