import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../contexts/NotificationContext';
import flashcardService, { Flashcard } from '../../services/flashcardService';
import './FlashcardReview.css';

const FlashcardReview: React.FC = () => {
  const { currentUser } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [reviewCompleted, setReviewCompleted] = useState<boolean>(false);
  const [reviewStats, setReviewStats] = useState({
    total: 0,
    reviewed: 0,
    easy: 0,
    medium: 0,
    hard: 0
  });
  
  useEffect(() => {
    const fetchFlashcards = async () => {
      try {
        setLoading(true);
        const response = await flashcardService.listDueFlashcards();
        
        if (response.flashcards.length === 0) {
          showNotification('info', 'Não há flashcards para revisar no momento!');
          navigate('/flashcards');
          return;
        }
        
        setFlashcards(response.flashcards);
        setReviewStats(prev => ({
          ...prev,
          total: response.flashcards.length
        }));
        setLoading(false);
      } catch (error) {
        console.error('Error fetching flashcards:', error);
        showNotification('error', 'Erro ao carregar flashcards para revisão');
        navigate('/flashcards');
      }
    };
    
    fetchFlashcards();
  }, [navigate, showNotification]);
  
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    if (!isFlipped) {
      setIsRevealed(true);
    }
  };
  
  const handleRating = async (quality: number) => {
    try {
      const currentFlashcard = flashcards[currentIndex];
      await flashcardService.reviewFlashcard(currentFlashcard.id, { quality });
      
      // Update stats based on rating
      setReviewStats(prev => {
        const newStats = { ...prev, reviewed: prev.reviewed + 1 };
        if (quality <= 2) newStats.hard++;
        else if (quality <= 4) newStats.medium++;
        else newStats.easy++;
        return newStats;
      });
      
      // Move to next card or complete review
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
        setIsRevealed(false);
      } else {
        setReviewCompleted(true);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      showNotification('error', 'Erro ao salvar revisão');
    }
  };
  
  const handleFinishReview = () => {
    navigate('/flashcards');
  };
  
  if (loading) {
    return (
      <div className="flashcard-review-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando flashcards...</p>
        </div>
      </div>
    );
  }
  
  if (reviewCompleted) {
    return (
      <div className="flashcard-review-container">
        <div className="review-completed">
          <div className="completed-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="#6c5ce7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2>Revisão Concluída!</h2>
          <div className="review-stats">
            <div className="stat-item">
              <span className="stat-label">Total de Flashcards</span>
              <span className="stat-value">{reviewStats.total}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Fácil</span>
              <span className="stat-value easy">{reviewStats.easy}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Médio</span>
              <span className="stat-value medium">{reviewStats.medium}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Difícil</span>
              <span className="stat-value hard">{reviewStats.hard}</span>
            </div>
          </div>
          <button className="primary-button" onClick={handleFinishReview}>
            Voltar para Flashcards
          </button>
        </div>
      </div>
    );
  }
  
  const currentFlashcard = flashcards[currentIndex];
  
  return (
    <div className="flashcard-review-container">
      <header className="flashcard-review-header">
        <h1>Revisão de Flashcards</h1>
        <div className="review-progress">
          <div className="progress-text">
            {currentIndex + 1} de {flashcards.length}
          </div>
          <div className="progress-bar">
            <div 
              className="progress" 
              style={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </header>
      
      <div className="flashcard-review-content">
        <div className="flashcard-container">
          <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={handleFlip}>
            <div className="flashcard-front">
              <div className="flashcard-content">
                {currentFlashcard.front}
              </div>
              <div className="flashcard-instruction">
                Clique para ver a resposta
              </div>
            </div>
            <div className="flashcard-back">
              <div className="flashcard-content">
                {currentFlashcard.back}
              </div>
              <div className="flashcard-instruction">
                Clique para ver a pergunta
              </div>
            </div>
          </div>
        </div>
        
        {isRevealed && (
          <div className="rating-container">
            <p className="rating-instruction">Quão bem você se lembrou deste conteúdo?</p>
            <div className="rating-buttons">
              <button 
                className="rating-button hard" 
                onClick={() => handleRating(1)}
                title="Não lembrei"
              >
                1 - Difícil
              </button>
              <button 
                className="rating-button medium" 
                onClick={() => handleRating(3)}
                title="Lembrei com dificuldade"
              >
                3 - Médio
              </button>
              <button 
                className="rating-button easy" 
                onClick={() => handleRating(5)}
                title="Lembrei facilmente"
              >
                5 - Fácil
              </button>
            </div>
          </div>
        )}
        
        {currentFlashcard.tags && currentFlashcard.tags.length > 0 && (
          <div className="flashcard-tags">
            {currentFlashcard.tags.map((tag, index) => (
              <span key={index} className="flashcard-tag">{tag}</span>
            ))}
          </div>
        )}
        
        {currentFlashcard.userNotes && (
          <div className="flashcard-notes">
            <h3>Suas Anotações:</h3>
            <p>{currentFlashcard.userNotes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlashcardReview;
