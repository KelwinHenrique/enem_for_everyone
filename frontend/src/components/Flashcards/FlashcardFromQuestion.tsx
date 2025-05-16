import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../contexts/NotificationContext';
import flashcardService from '../../services/flashcardService';
import examService, { Question } from '../../services/examService';
import './FlashcardFromQuestion.css';

const FlashcardFromQuestion: React.FC = () => {
  const { questionId } = useParams<{ questionId: string }>();
  const { currentUser } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [question, setQuestion] = useState<Question | null>(null);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [isCreated, setIsCreated] = useState<boolean>(false);
  
  useEffect(() => {
    const fetchQuestion = async () => {
      if (!questionId) {
        showNotification('error', 'ID da questão não fornecido');
        navigate('/exams');
        return;
      }
      
      try {
        setLoading(true);
        // This is a placeholder - you would need to implement a method to get a question by ID in examService
        // For now, we'll simulate it with a timeout
        setTimeout(() => {
          // Simulated question data
          const mockQuestion: Question = {
            id: questionId,
            text: 'Por que Tiradentes foi transformado em herói nacional após a Proclamação da República?',
            options: [
              { id: 'a', text: 'Porque ele era o único participante da Inconfidência Mineira.' },
              { id: 'b', text: 'Para legitimar o novo regime republicano, utilizando a figura de um "mártir" da liberdade.' },
              { id: 'c', text: 'Porque ele era o mais rico dos inconfidentes.' },
              { id: 'd', text: 'Por ser um militar de alta patente no exército português.' },
              { id: 'e', text: 'Por ter sido o único a confessar o crime de traição.' }
            ],
            correctAnswer: 'b',
            explanation: 'Tiradentes foi transformado em herói nacional após a Proclamação da República como parte de um esforço para legitimar o novo regime. A figura de Tiradentes como um "mártir" da liberdade contra a Coroa Portuguesa ajudou a unificar a nação em torno dos ideais republicanos.',
            subject: 'human_sciences',
            userId: 'user_123',
            topic: 'História do Brasil'
          };
          
          setQuestion(mockQuestion);
          setLoading(false);
        }, 1000);
      } catch (error) {
        console.error('Error fetching question:', error);
        showNotification('error', 'Erro ao carregar a questão');
        navigate('/exams');
      }
    };
    
    fetchQuestion();
  }, [questionId, navigate, showNotification]);
  
  const handleCreateFlashcard = async () => {
    if (!question) return;
    
    try {
      setIsCreating(true);
      const response = await flashcardService.createFlashcardFromQuestion(question.id);
      
      if (response.success) {
        showNotification('success', 'Flashcard criado com sucesso!');
        setIsCreated(true);
      } else {
        showNotification('error', 'Erro ao criar flashcard');
      }
    } catch (error) {
      console.error('Error creating flashcard:', error);
      showNotification('error', 'Erro ao criar flashcard');
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleViewFlashcards = () => {
    navigate('/flashcards');
  };
  
  const handleBackToExams = () => {
    navigate('/exams');
  };
  
  if (loading) {
    return (
      <div className="flashcard-from-question-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando questão...</p>
        </div>
      </div>
    );
  }
  
  if (isCreated) {
    return (
      <div className="flashcard-from-question-container">
        <div className="success-container">
          <div className="success-icon">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="#6c5ce7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <h2>Flashcard Criado!</h2>
          <p>Seu flashcard foi criado com sucesso a partir da questão selecionada.</p>
          <div className="action-buttons">
            <button className="secondary-button" onClick={handleBackToExams}>
              Voltar para Simulados
            </button>
            <button className="primary-button" onClick={handleViewFlashcards}>
              Ver Meus Flashcards
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flashcard-from-question-container">
      <header className="flashcard-from-question-header">
        <h1>Criar Flashcard a partir de Questão</h1>
        <p>Transforme esta questão em um flashcard para revisão espaçada</p>
      </header>
      
      <div className="question-preview">
        <div className="question-content">
          <h3>Questão</h3>
          <p className="question-text">{question?.text}</p>
          
          <div className="options-list">
            {question?.options.map((option) => (
              <div 
                key={option.id} 
                className={`option-item ${option.id === question.correctAnswer ? 'correct' : ''}`}
              >
                <span className="option-letter">{option.id.toUpperCase()}</span>
                <span className="option-text">{option.text}</span>
                {option.id === question.correctAnswer && (
                  <span className="correct-badge">Correta</span>
                )}
              </div>
            ))}
          </div>
          
          <div className="explanation-box">
            <h4>Explicação</h4>
            <p>{question?.explanation}</p>
          </div>
          
          <div className="question-metadata">
            <div className="metadata-item">
              <span className="metadata-label">Disciplina:</span>
              <span className="metadata-value">{question?.subject === 'human_sciences' ? 'Ciências Humanas' : question?.subject}</span>
            </div>
            {question?.topic && (
              <div className="metadata-item">
                <span className="metadata-label">Tópico:</span>
                <span className="metadata-value">{question.topic}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="flashcard-preview-info">
          <h3>Flashcard a ser criado</h3>
          <div className="flashcard-preview-box">
            <div className="preview-front">
              <h4>Frente</h4>
              <p>{question?.text}</p>
            </div>
            <div className="preview-back">
              <h4>Verso</h4>
              <p>{question?.options.find(opt => opt.id === question.correctAnswer)?.text}</p>
              <p className="preview-explanation">{question?.explanation}</p>
            </div>
          </div>
          <p className="preview-note">
            O flashcard será criado com tags automáticas baseadas no conteúdo da questão.
          </p>
        </div>
      </div>
      
      <div className="action-buttons">
        <button 
          className="secondary-button" 
          onClick={handleBackToExams}
        >
          Cancelar
        </button>
        <button 
          className="primary-button" 
          onClick={handleCreateFlashcard}
          disabled={isCreating}
        >
          {isCreating ? 'Criando...' : 'Criar Flashcard'}
        </button>
      </div>
    </div>
  );
};

export default FlashcardFromQuestion;
