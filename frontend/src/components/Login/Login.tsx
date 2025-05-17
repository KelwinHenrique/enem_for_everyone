import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import './Login.css';

const Login: React.FC = () => {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-logo">
          <h1 className="logo-text">Enem Para Todos</h1>
        </div>
        <div className="login-heading">
          <h2>Prepare-se para o ENEM de forma <span className="highlight">inteligente e personalizada</span> com a ajuda do <span className="highlight">Lumos</span>, nosso tutor virtual!</h2>
          <p>O Enem Para Todos utiliza inteligência artificial avançada para criar uma experiência de estudo adaptativa, focada nas suas necessidades específicas.</p>
        </div>
        <div className="login-content">
          <button 
            className="google-login-button" 
            onClick={signInWithGoogle}
          >
            <svg 
              className="google-icon" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 48 48" 
              width="24px" 
              height="24px"
            >
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
            </svg>
            Entrar com Google
          </button>
        </div>
      </div>
      
      <div className="login-right">
        <h2 className="resources-title">Recursos poderosos para maximizar seu aprendizado</h2>
        <p className="resources-subtitle">Nossa plataforma combina tecnologia de ponta com metodologias pedagógicas eficientes para oferecer a melhor experiência de estudo.</p>
        
        <div className="features-container">
          <div className="feature-item">
            <div className="feature-icon feature-icon-purple">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 2v7.31" />
                <path d="M14 9.3V2" />
                <path d="M8.5 2h7" />
                <path d="M14 9.3a6.5 6.5 0 1 1-4 0" />
              </svg>
            </div>
            <h3>Simulados Adaptativos</h3>
            <p>Simulados que se adaptam ao seu nível de conhecimento, focando nas áreas que você mais precisa melhorar.</p>
          </div>
          
          <div className="feature-item">
            <div className="feature-icon feature-icon-blue">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4" />
                <path d="M12 8h.01" />
              </svg>
            </div>
            <h3>Explicações Interativas com IA</h3>
            <p>Tire suas dúvidas em tempo real com nossa IA, que explica conceitos complexos de forma simples e personalizada.</p>
          </div>
          
          <div className="feature-item">
            <div className="feature-icon feature-icon-green">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4" />
                <path d="M12 18v4" />
                <path d="m4.93 4.93 2.83 2.83" />
                <path d="m16.24 16.24 2.83 2.83" />
                <path d="M2 12h4" />
                <path d="M18 12h4" />
                <path d="m4.93 19.07 2.83-2.83" />
                <path d="m16.24 7.76 2.83-2.83" />
              </svg>
            </div>
            <h3>Flashcards Inteligentes</h3>
            <p>Flashcards gerados automaticamente a partir das suas dificuldades, otimizando seu tempo de estudo.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
