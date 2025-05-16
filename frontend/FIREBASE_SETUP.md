# Configuração do Firebase para o Enem Para Todos

Este documento explica como configurar o Firebase para autenticação com Google no projeto Enem Para Todos.

## Passo 1: Criar um projeto no Firebase

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Clique em "Adicionar projeto"
3. Dê um nome ao projeto (ex: "Enem Para Todos")
4. Siga as instruções para criar o projeto

## Passo 2: Adicionar um aplicativo Web

1. Na página inicial do seu projeto Firebase, clique no ícone da web (</>) para adicionar um aplicativo web
2. Dê um nome ao aplicativo (ex: "Enem Para Todos Web")
3. Opcionalmente, marque a opção para configurar o Firebase Hosting
4. Clique em "Registrar aplicativo"

## Passo 3: Copiar as credenciais do Firebase

Após registrar o aplicativo, você verá um bloco de código com a configuração do Firebase. Copie as informações de configuração:

```javascript
const firebaseConfig = {
  apiKey: "sua-api-key",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "seu-messaging-sender-id",
  appId: "seu-app-id",
  measurementId: "seu-measurement-id"
};
```

## Passo 4: Configurar o arquivo .env

1. Crie um arquivo `.env` na raiz do projeto baseado no `.env.example`
2. Preencha as variáveis de ambiente com as credenciais do Firebase:

```
REACT_APP_FIREBASE_API_KEY=sua-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=seu-projeto
REACT_APP_FIREBASE_STORAGE_BUCKET=seu-projeto.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=seu-messaging-sender-id
REACT_APP_FIREBASE_APP_ID=seu-app-id
REACT_APP_FIREBASE_MEASUREMENT_ID=seu-measurement-id
```

## Passo 5: Habilitar a autenticação com Google

1. No Firebase Console, vá para "Authentication" no menu lateral
2. Clique na aba "Sign-in method"
3. Clique em "Google" na lista de provedores
4. Ative o provedor Google e configure um email de suporte
5. Clique em "Salvar"

## Passo 6: Configurar o domínio autorizado (para produção)

Se você estiver implantando o aplicativo em produção:

1. No Firebase Console, vá para "Authentication" > "Settings" > "Authorized domains"
2. Adicione o domínio onde seu aplicativo estará hospedado

## Passo 7: Reiniciar o aplicativo

Após configurar o Firebase e o arquivo .env, reinicie o servidor de desenvolvimento:

```
npm start
```

Agora você deve ser capaz de fazer login com o Google no aplicativo Enem Para Todos.
