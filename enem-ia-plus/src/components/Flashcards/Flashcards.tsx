import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../contexts/NotificationContext';
import flashcardService, { Flashcard, FlashcardStats } from '../../services/flashcardService';
import './Flashcards.css';

const Flashcards: React.FC = () => {
  const { currentUser } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [stats, setStats] = useState<FlashcardStats | null>(null);
  const [dueFlashcards, setDueFlashcards] = useState<Flashcard[]>([]);
  const [allFlashcards, setAllFlashcards] = useState<Flashcard[]>([]);
  const [activeTab, setActiveTab] = useState<'review' | 'all'>('review');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch flashcard statistics
        const statsResponse = await flashcardService.getFlashcardStats();
        setStats(statsResponse.stats);
        
        // Fetch due flashcards
        const dueResponse = await flashcardService.listDueFlashcards();
        setDueFlashcards(dueResponse.flashcards);
        
        // Fetch all flashcards
        const allResponse = await flashcardService.listFlashcards();
        setAllFlashcards(allResponse.flashcards);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching flashcard data:', error);
        showNotification('error', 'Não foi possível carregar os dados dos flashcards');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [showNotification]);
  
  const handleStartReview = () => {
    if (dueFlashcards.length > 0) {
      navigate('/flashcards/review');
    } else {
      showNotification('info', 'Não há flashcards para revisar no momento!');
    }
  };
  
  // Create flashcard option is disabled as requested
  const handleCreateFlashcard = () => {
    showNotification('info', 'A criação de flashcards está temporariamente desabilitada');
  };
  
  const handleViewAllFlashcards = () => {
    navigate('/flashcards/all');
  };
  
  return (
    <div className="flashcards-container">
      <header className="flashcards-header">
        <h1>Flashcards Inteligentes</h1>
        <p>Revise conceitos importantes com nosso sistema de repetição espaçada</p>
      </header>
      
      <div className="flashcards-tabs">
        <button 
          className={`tab-button ${activeTab === 'review' ? 'active' : ''}`}
          onClick={() => setActiveTab('review')}
        >
          Para Revisar
        </button>
        <button 
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          Todos os Flashcards
        </button>
      </div>
      
      <div className="flashcards-content">
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Carregando flashcards...</p>
          </div>
        ) : (
          <>
            {activeTab === 'review' && (
              <div className="review-section">
                <div className="stats-overview">
                  <div className="stat-card">
                    <h3>Para revisar hoje</h3>
                    <p className="stat-number">{stats?.dueToday || 0}</p>
                  </div>
                  <div className="stat-card">
                    <h3>Total de flashcards</h3>
                    <p className="stat-number">{stats?.totalFlashcards || 0}</p>
                  </div>
                  <div className="stat-card">
                    <h3>Novos cards</h3>
                    <p className="stat-number">{stats?.newCards || 0}</p>
                  </div>
                </div>
                
                {dueFlashcards.length > 0 ? (
                  <div className="due-flashcards">
                    <h2>Flashcards para revisar hoje</h2>
                    <div className="flashcards-preview">
                      {dueFlashcards.slice(0, 3).map((flashcard) => (
                        <div key={flashcard.id} className="flashcard-preview">
                          <div className="flashcard-front">{flashcard.front}</div>
                          <div className="flashcard-tags">
                            {flashcard.tags.slice(0, 2).map((tag, index) => (
                              <span key={index} className="flashcard-tag">{tag}</span>
                            ))}
                            {flashcard.tags.length > 2 && <span className="flashcard-tag">+{flashcard.tags.length - 2}</span>}
                          </div>
                        </div>
                      ))}
                      {dueFlashcards.length > 3 && (
                        <div className="more-flashcards">
                          <p>+{dueFlashcards.length - 3} flashcards</p>
                        </div>
                      )}
                    </div>
                    <button className="primary-button" onClick={handleStartReview}>
                      Iniciar Revisão
                    </button>
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="#6c5ce7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="4" width="20" height="16" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </div>
                    <h3>Nenhum flashcard para revisar agora</h3>
                    <p>Todos os seus flashcards estão em dia! Volte mais tarde ou crie novos flashcards.</p>
                    <button className="secondary-button" onClick={handleCreateFlashcard}>
                      Criar Novo Flashcard
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'all' && (
              <div className="all-flashcards-section">
                <div className="flashcards-actions">
                  <button className="primary-button" onClick={handleViewAllFlashcards}>
                    Ver Todos os Flashcards
                  </button>
                </div>
                
                <div className="flashcards-grid">
                  {allFlashcards.slice(0, 6).map((flashcard) => (
                    <div key={flashcard.id} className="flashcard-item">
                      <div className="flashcard-content">
                        <p className="flashcard-front-preview">{flashcard.front}</p>
                        <div className="flashcard-tags">
                          {flashcard.tags.slice(0, 2).map((tag, index) => (
                            <span key={index} className="flashcard-tag">{tag}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flashcard-footer">
                        <span className="next-review">
                          Próxima revisão: {new Date(flashcard.nextReview).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                
                {allFlashcards.length > 6 && (
                  <div className="view-more">
                    <button className="secondary-button" onClick={handleViewAllFlashcards}>
                      Ver mais ({allFlashcards.length - 6})
                    </button>
                  </div>
                )}
                
                {allFlashcards.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="#6c5ce7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="6" width="20" height="12" rx="2" />
                        <path d="M12 12h.01" />
                      </svg>
                    </div>
                    <h3>Nenhum flashcard encontrado</h3>
                    <p>Você ainda não criou nenhum flashcard. Comece criando seu primeiro flashcard agora!</p>
                    <button className="primary-button" onClick={handleStartReview}>
                    Começar a Estudar
                  </button>
                  </div>
                )}
              </div>
            )}
            

          </>
        )}
      </div>
    </div>
  );
};

export default Flashcards;
