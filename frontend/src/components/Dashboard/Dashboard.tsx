import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Navigate, useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import flashcardService, { FlashcardStats } from '../../services/flashcardService';
import './Dashboard.css';

const Dashboard: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [flashcardStats, setFlashcardStats] = useState<FlashcardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Se não houver usuário autenticado, redireciona para a página de login
  

  useEffect(() => {
    const fetchFlashcardStats = async () => {
      try {
        setLoading(true);
        const response = await flashcardService.getFlashcardStats();
        if (response.success) {
          setFlashcardStats(response.stats);
        }
      } catch (error) {
        console.error('Erro ao buscar estatísticas dos flashcards:', error);
        showNotification('error', 'Não foi possível carregar as estatísticas dos flashcards');
      } finally {
        setLoading(false);
      }
    };

    fetchFlashcardStats();
  }, [showNotification]);

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  const handleFeatureClick = (feature: string) => {
    if (feature === 'Simulados') {
      navigate('/exams/configuration');
    } else if (feature === 'Flashcards') {
      // Se tiver flashcards para revisar, vai direto para a tela de revisão
      if (flashcardStats && flashcardStats.dueToday > 0) {
        navigate('/flashcards/review');
      } else {
        // Se não tiver, vai para a tela de gerenciamento de flashcards
        navigate('/flashcards');
      }
    } else if (feature === 'Conteúdos IA') {
      navigate('/research');
    } else {
      showNotification('info', `A funcionalidade de ${feature} estará disponível em breve!`);
    }
  };

  const handleStartFlashcardReview = () => {
    if (flashcardStats && flashcardStats.dueToday > 0) {
      navigate('/flashcards/review');
    } else {
      showNotification('info', 'Não há flashcards para revisar no momento!');
    }
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="logo">
          <h1 className="logo-text">Enem Para Todos</h1>
        </div>
        
        <div className="user-info">
          <div className="user-avatar">
            {currentUser.photoURL ? (
              <img src={currentUser.photoURL} alt="Avatar do usuário" />
            ) : (
              <div className="avatar-placeholder">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="#6c5ce7">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
              </div>
            )}
          </div>
          <div className="user-details">
            <p className="user-name">{currentUser.displayName || 'Usuário'}</p>
            <button className="logout-button" onClick={logout}>
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-content">
        <div className="welcome-section">
          <h2>Bem-vindo ao Enem Para Todos, {currentUser.displayName?.split(' ')[0] || 'Estudante'}!</h2>
          <p>Escolha uma das opções abaixo para começar seus estudos</p>
        </div>

        <div className="main-options">
          <div className="option-card simulados-card" onClick={() => handleFeatureClick('Simulados')}>
            <div className="option-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10 2v7.31" />
                <path d="M14 9.3V2" />
                <path d="M8.5 2h7" />
                <path d="M14 9.3a6 6 0 1 1-4 0" />
                <path d="M4 13h3" />
                <path d="M17 13h3" />
                <path d="M12 20v-3" />
              </svg>
            </div>
            <h3>Simulados Adaptativos</h3>
            <p>Simulados personalizados com base no seu desempenho, focando nas suas áreas de melhoria.</p>
            <div className="option-button">Iniciar Simulado</div>
          </div>
          
          <div className="option-card content-ia-card" onClick={() => handleFeatureClick('Conteúdos IA')}>
            <div className="option-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v1a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
                <path d="M19 9h1a2 2 0 0 1 0 4h-1" />
                <path d="M5 9H4a2 2 0 0 0 0 4h1" />
                <path d="M12 19v-4" />
                <path d="M7 17l2 2 6-6" />
              </svg>
            </div>
            <h3>Materiais de Estudo</h3>
            <p>Gere ou acesse materiais de estudo personalizados sobre qualquer tópico com nosso Agente de IA.</p>
            <div className="option-button">Acessar/ Gerar Conteúdo</div>
          </div>
          
          <div className="option-card flashcards-card" onClick={() => handleFeatureClick('Flashcards')}>
            <div className="option-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
                <path d="M12 8v8" />
                <path d="M8 12h8" />
              </svg>
            </div>
            <h3>Flashcards Inteligentes</h3>
            <p>Flashcards gerados automaticamente a partir das suas dificuldades, otimizando seu tempo de estudo.</p>
            
            {loading ? (
              <div className="flashcard-stats-loading">Carregando estatísticas...</div>
            ) : flashcardStats ? (
              <div className="flashcard-stats">
                <div className="flashcard-stat">
                  <span className="stat-number">{flashcardStats.dueToday}</span>
                  <span className="stat-label">Para hoje</span>
                </div>
                <div className="flashcard-stat">
                  <span className="stat-number">{flashcardStats.newCards}</span>
                  <span className="stat-label">Novos</span>
                </div>
                <div className="flashcard-stat">
                  <span className="stat-number">{flashcardStats.reviewCards}</span>
                  <span className="stat-label">Revisão</span>
                </div>
                <div className="flashcard-stat">
                  <span className="stat-number">{flashcardStats.totalFlashcards}</span>
                  <span className="stat-label">Total</span>
                </div>
              </div>
            ) : (
              <div className="flashcard-stats-error">Não foi possível carregar as estatísticas</div>
            )}
            
            {loading ? (
              <div className="option-button disabled">Carregando...</div>
            ) : flashcardStats && flashcardStats.dueToday > 0 ? (
              <div className="option-button" onClick={handleStartFlashcardReview}>Praticar com Flashcards</div>
            ) : (
              <div className="no-flashcards-message">Nenhum flashcard para revisar hoje</div>
            )}
          </div>
        </div>

        {/* <div className="metrics-section">
          <h2>Suas Métricas</h2>
          <div className="metrics-container">
            <div className="metric-card">
              <h3>Progresso Geral</h3>
              <div className="progress-bar">
                <div className="progress" style={{ width: '35%' }}></div>
              </div>
              <p>35% concluído</p>
            </div>
            
            <div className="metric-card">
              <h3>Questões Respondidas</h3>
              <div className="questions-stats">
                <div className="stat">
                  <span className="stat-number correct">42</span>
                  <span className="stat-label">Corretas</span>
                </div>
                <div className="stat">
                  <span className="stat-number incorrect">18</span>
                  <span className="stat-label">Incorretas</span>
                </div>
              </div>
            </div>
            
            <div className="metric-card">
              <h3>Pontos Fortes</h3>
              <ul className="strengths-list">
                <li>Matemática: Geometria</li>
                <li>Português: Interpretação</li>
              </ul>
            </div>
            
            <div className="metric-card">
              <h3>Precisa Melhorar</h3>
              <ul className="weaknesses-list">
                <li>Física: Mecânica</li>
                <li>Química: Orgânica</li>
              </ul>
            </div>
          </div>
        </div> */}
      </main>
    </div>
  );
};

export default Dashboard;
