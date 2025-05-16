import React, { useState } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faTrophy, 
  faCheck, 
  faTimes,
  faPlus,
  faLightbulb
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import { Question } from '../../services/examService';
import flashcardService from '../../services/flashcardService';
import './ExamResult.css';

interface ExamResultProps {}

interface ResultState {
  examId: string;
  result: {
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    timeSpent: number;
  };
  answers: { questionId: string; selectedOption: string }[];
  questions: Question[];
}

const ExamResult: React.FC<ExamResultProps> = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [creatingFlashcard, setCreatingFlashcard] = useState<string | null>(null);
  const [createdFlashcards, setCreatedFlashcards] = useState<{[questionId: string]: any}>({});
  
  // If there's no authenticated user, redirect to login page
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  // Check if we have result data in the location state
  const state = location.state as ResultState;
  if (!state || !state.result) {
    return (
      <div className="exam-result-container error">
        <h2>Resultado não encontrado</h2>
        <p>Não foi possível encontrar os resultados do simulado.</p>
        <button 
          className="back-button"
          onClick={() => navigate('/exams/configuration')}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          Voltar para Configuração
        </button>
      </div>
    );
  }
  
  const { result, answers, questions } = state;
  const { score, totalQuestions, correctAnswers, incorrectAnswers, timeSpent } = result;
  
  // Calculate percentage
  const percentage = (correctAnswers / totalQuestions) * 100;
  
  // Determine performance level
  let performanceLevel = '';
  let performanceColor = '';
  
  if (percentage >= 90) {
    performanceLevel = 'Excelente';
    performanceColor = '#4CAF50';
  } else if (percentage >= 70) {
    performanceLevel = 'Bom';
    performanceColor = '#2196F3';
  } else if (percentage >= 50) {
    performanceLevel = 'Regular';
    performanceColor = '#FF9800';
  } else {
    performanceLevel = 'Precisa melhorar';
    performanceColor = '#F44336';
  }
  
  // Get answer for a specific question
  const getAnswerForQuestion = (questionId: string) => {
    return answers.find(a => a.questionId === questionId)?.selectedOption || null;
  };
  
  // Check if answer is correct
  const isAnswerCorrect = (question: Question) => {
    const userAnswer = getAnswerForQuestion(question.id);
    return userAnswer === question.correctAnswer;
  };
  
  return (
    <div className="exam-result-container">
      <div className="result-header">
        <button 
          className="back-button"
          onClick={() => navigate('/dashboard')}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Voltar para Dashboard</span>
        </button>
        
        <h1>Resultado do Simulado</h1>
      </div>
      
      <div className="result-content">
        <div className="result-summary">
          <div className="score-card">
            <div className="score-header">
              <FontAwesomeIcon icon={faTrophy} className="trophy-icon" />
              <h2>Pontuação Final</h2>
            </div>
            
            <div className="score-value" style={{ color: performanceColor }}>
              {score.toFixed(1)}
            </div>
            
            <div className="score-details">
              <div className="performance-level" style={{ color: performanceColor }}>
                {performanceLevel}
              </div>
              
              <div className="score-metrics">
                <div className="metric">
                  <span className="metric-label">Acertos:</span>
                  <span className="metric-value correct">{correctAnswers}</span>
                </div>
                
                <div className="metric">
                  <span className="metric-label">Erros:</span>
                  <span className="metric-value incorrect">{incorrectAnswers}</span>
                </div>
                
                <div className="metric">
                  <span className="metric-label">Tempo:</span>
                  <span className="metric-value">{timeSpent} min</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="result-actions">
            <button 
              className="action-button review-button"
              onClick={() => {
                // Scroll to questions section
                document.getElementById('questions-review')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Revisar Questões
            </button>
            
            <button 
              className="action-button new-exam-button"
              onClick={() => navigate('/exams/configuration')}
            >
              Novo Simulado
            </button>
          </div>
        </div>
        
        <div id="questions-review" className="questions-review">
          <h2>Revisão das Questões</h2>
          
          {questions.map((question, index) => {
            const userAnswer = getAnswerForQuestion(question.id);
            const isCorrect = isAnswerCorrect(question);
            
            return (
              <div 
                key={question.id} 
                className={`question-review ${isCorrect ? 'correct' : 'incorrect'}`}
              >
                <div className="question-review-header">
                  <div className="question-number">
                    Questão {index + 1}
                  </div>
                  
                  <div className={`question-status ${isCorrect ? 'correct' : 'incorrect'}`}>
                    {isCorrect ? (
                      <>
                        <FontAwesomeIcon icon={faCheck} />
                        <span>Correta</span>
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faTimes} />
                        <span>Incorreta</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="question-text">
                  {question.text}
                </div>
                
                <div className="options-review">
                  {question.options.map(option => (
                    <div 
                      key={option.id}
                      className={`
                        option-review 
                        ${userAnswer === option.id ? 'selected' : ''} 
                        ${question.correctAnswer === option.id ? 'correct' : ''}
                      `}
                    >
                      <div className="option-marker">
                        <span className="option-letter">{option.id.toUpperCase()}</span>
                      </div>
                      <div className="option-text">{option.text}</div>
                    </div>
                  ))}
                </div>
                
                <div className="explanation">
                  <h4>Explicação:</h4>
                  <p>{question.explanation}</p>
                </div>
                
                <div className="question-actions">
                  {createdFlashcards[question.id] ? (
                    <div className="created-flashcard">
                      <div className="flashcard-content">
                        <div className="flashcard-side">
                          <h5>Frente:</h5>
                          <p>{createdFlashcards[question.id].front}</p>
                        </div>
                        <div className="flashcard-side">
                          <h5>Verso:</h5>
                          <p>{createdFlashcards[question.id].back}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button 
                      className="create-flashcard-button"
                      onClick={async () => {
                        try {
                          setCreatingFlashcard(question.id);
                          const response = await flashcardService.createFlashcardFromQuestion(question.id);
                          if (response.success) {
                            setCreatedFlashcards(prev => ({
                              ...prev,
                              [question.id]: response.flashcard
                            }));
                          } else {
                            alert('Erro ao criar flashcard: ' + response.message);
                          }
                        } catch (error) {
                          console.error('Erro ao criar flashcard:', error);
                          alert('Erro ao criar flashcard. Tente novamente mais tarde.');
                        } finally {
                          setCreatingFlashcard(null);
                        }
                      }}
                      disabled={creatingFlashcard === question.id}
                    >
                      {creatingFlashcard === question.id ? (
                        <>
                          <div className="button-spinner"></div>
                          <span>Criando Flashcard...</span>
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faLightbulb} />
                          <span>Criar Flashcard</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ExamResult;
