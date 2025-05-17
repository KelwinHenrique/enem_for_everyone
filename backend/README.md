# ENEM IA+ Backend

Backend em Python usando Flask para uma aplicação de simulados ENEM que utiliza IA (Google Gemini) para gerar questões personalizadas e Firebase para armazenamento de dados.

## Tecnologias Utilizadas

- Python 3.12+
- Flask como framework web
- Firebase para autenticação e armazenamento de dados
- Google Gemini API para geração de questões usando IA
- Flask-CORS para lidar com CORS
- PyJWT para autenticação via token

## Estrutura do Projeto

```
/app
  /routes - Rotas da API
  /models - Modelos de dados
  /services - Serviços (Firebase, Gemini, etc.)
  /utils - Funções utilitárias
  /middleware - Middleware para autenticação
  config.py - Configurações do app
  __init__.py - Arquivo de inicialização do Flask
```

## Configuração do Ambiente

### Pré-requisitos

- Python 3.12 ou superior
- Conta no Firebase com Firestore habilitado
- Chave de API do Google Gemini

### Instalação

1. Clone o repositório:
```bash
git clone <url-do-repositorio>
cd alura_project
```

2. Crie e ative um ambiente virtual:
```bash
conda create -n enemiaplus python=3.12
conda activate enemiaplus
```

3. Instale as dependências:
```bash
pip install -r requirements.txt
```

4. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

5. Edite o arquivo `.env` com suas credenciais:
```
DEBUG=True
SECRET_KEY=sua-chave-secreta
PORT=5000
FIREBASE_CREDENTIALS=caminho-para-suas-credenciais-firebase.json
GEMINI_API_KEY=sua-chave-api-gemini
```

### Configuração do Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Ative o Firestore Database
3. Ative a Autenticação (pelo menos com email/senha)
4. Vá em Configurações do Projeto > Contas de serviço
5. Gere uma nova chave privada (isso baixará um arquivo JSON)
6. Salve o arquivo JSON no diretório do projeto e atualize o caminho no arquivo `.env`

### Configuração do Google Gemini

1. Acesse o [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Crie uma chave de API
3. Adicione a chave ao arquivo `.env`

## Executando o Servidor

```bash
python run.py
```

O servidor estará disponível em `http://localhost:5000`.


