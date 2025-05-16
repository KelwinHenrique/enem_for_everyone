import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faSpinner, 
  faClock, 
  faCheck, 
  faChevronLeft, 
  faChevronRight 
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import examService, { Exam, Question } from '../../services/examService';
import './ExamSimulation.css';

interface UserAnswer {
  questionId: string;
  selectedOption: string;
}

const ExamSimulation: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { currentUser } = useAuth();
  
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [examStarted, setExamStarted] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  
  // Fetch exam data
  useEffect(() => {
    const fetchExam = async () => {
      if (!examId) {
        setError('ID do simulado não fornecido');
        setLoading(false);
        return;
      }
      
      try {
        const examData = await examService.getExam(examId);
        setExam(examData);
        setTimeRemaining(examData.config.timeLimit * 60); // Convert minutes to seconds
      } catch (error) {
        console.error('Error fetching exam:', error);
        setError('Erro ao carregar o simulado. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchExam();
  }, [examId]);
  
  // Timer effect
  useEffect(() => {
    if (!examStarted || timeRemaining <= 0) return;
    
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [examStarted, timeRemaining]);

  // If there's no authenticated user, redirect to login page
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  const handleStartExam = async () => {
    try {
      if (!examId) return;
      
      const response = await examService.startExam(examId);
      if (response.success) {
        setExamStarted(true);
        showNotification('success', 'Simulado iniciado com sucesso!');
      } else {
        showNotification('error', 'Erro ao iniciar o simulado');
      }
    } catch (error) {
      console.error('Error starting exam:', error);
      showNotification('error', 'Erro ao iniciar o simulado');
    }
  };
  
  const handleOptionSelect = (questionId: string, optionId: string) => {
    const updatedAnswers = [...userAnswers];
    const existingAnswerIndex = updatedAnswers.findIndex(a => a.questionId === questionId);
    
    if (existingAnswerIndex !== -1) {
      updatedAnswers[existingAnswerIndex].selectedOption = optionId;
    } else {
      updatedAnswers.push({ questionId, selectedOption: optionId });
    }
    
    setUserAnswers(updatedAnswers);
  };
  
  const handleNextQuestion = () => {
    if (!exam) return;
    if (currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };
  
  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };
  
  const handleSubmitExam = async () => {
    if (!exam || !examId) return;
    
    setSubmitting(true);
    
    try {
      const response = await examService.submitExam(examId, userAnswers);
      
      if (response.success) {
        showNotification('success', 'Simulado enviado com sucesso!');
        navigate('/exams/result', { 
          state: { 
            examId, 
            result: response.result,
            answers: userAnswers,
            questions: exam.questions
          } 
        });
      } else {
        showNotification('error', 'Erro ao enviar o simulado');
        setSubmitting(false);
      }
    } catch (error) {
      console.error('Error submitting exam:', error);
      showNotification('error', 'Erro ao enviar o simulado');
      setSubmitting(false);
    }
  };
  
  const getCurrentQuestion = (): Question | null => {
    if (!exam || !exam.questions || exam.questions.length === 0) return null;
    return exam.questions[currentQuestionIndex];
  };
  
  const getCurrentAnswer = (): string | null => {
    if (!exam) return null;
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return null;
    
    const answer = userAnswers.find(a => a.questionId === currentQuestion.id);
    return answer ? answer.selectedOption : null;
  };
  
  const getAnsweredQuestionsCount = (): number => {
    return userAnswers.length;
  };
  
  const renderExamHeader = () => (
    <div className="exam-header">
      <div className="exam-header-left">
        <button 
          className="back-button"
          onClick={() => {
            if (window.confirm('Tem certeza que deseja sair do simulado? Seu progresso será perdido.')) {
              navigate('/exams/configuration');
            }
          }}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Voltar</span>
        </button>
      </div>
      
      <div className="exam-header-center">
        <h1>{exam?.title || 'Simulado'}</h1>
      </div>
      
      <div className="exam-header-right">
        {examStarted && (
          <div className="timer">
            <FontAwesomeIcon icon={faClock} />
            <span>{formatTime(timeRemaining)}</span>
          </div>
        )}
      </div>
    </div>
  );
  
  const renderExamInfo = () => (
    <div className="exam-info">
      <h2>Informações do Simulado</h2>
      <div className="exam-details">
        <div className="exam-detail-item">
          <span className="detail-label">Tipo:</span>
          <span className="detail-value">
            {exam?.config.type === 'custom' ? 'Personalizado' : 
             exam?.config.type === 'quick' ? 'Rápido' : 'Completo'}
          </span>
        </div>
        <div className="exam-detail-item">
          <span className="detail-label">Questões:</span>
          <span className="detail-value">{exam?.config.questionCount || 0}</span>
        </div>
        <div className="exam-detail-item">
          <span className="detail-label">Tempo:</span>
          <span className="detail-value">{exam?.config.timeLimit || 0} minutos</span>
        </div>
        {exam?.config.contentType === 'subject' && exam.config.subject && (
          <div className="exam-detail-item">
            <span className="detail-label">Matéria:</span>
            <span className="detail-value">
              {exam.config.subject === 'all' ? 'Todas as Matérias' : 
               exam.config.subject === 'mathematics' ? 'Matemática' : 
               exam.config.subject === 'languages' ? 'Linguagens' : 
               exam.config.subject === 'human_sciences' ? 'Ciências Humanas' : 
               exam.config.subject === 'natural_sciences' ? 'Ciências da Natureza' : 
               exam.config.subject}
            </span>
          </div>
        )}
        {exam?.config.contentType === 'topic' && exam.config.customTopic && (
          <div className="exam-detail-item">
            <span className="detail-label">Tema:</span>
            <span className="detail-value">{exam.config.customTopic}</span>
          </div>
        )}
      </div>
      
      <div className="start-exam-container">
        <p>
          Você está prestes a iniciar um simulado com {exam?.config.questionCount || 0} questões.
          O tempo total para realização é de {exam?.config.timeLimit || 0} minutos.
        </p>
        <p>
          Quando estiver pronto, clique no botão abaixo para começar.
        </p>
        <button 
          className="start-exam-button"
          onClick={handleStartExam}
        >
          Iniciar Simulado
        </button>
      </div>
    </div>
  );
  
  const renderQuestion = (question: Question) => (
    <div className="question-container">
      <div className="question-header">
        <span className="question-number">
          Questão {currentQuestionIndex + 1} de {exam?.questions.length || 0}
        </span>
        <span className="question-subject">
          {question.subject === 'mathematics' ? 'Matemática' : 
           question.subject === 'languages' ? 'Linguagens' : 
           question.subject === 'human_sciences' ? 'Ciências Humanas' : 
           question.subject === 'natural_sciences' ? 'Ciências da Natureza' : 
           'Conhecimentos Gerais'}
        </span>
      </div>
      
      <div className="question-text">
        {question.text}
      </div>
      
      <div className="options-container">
        {question.options.map(option => (
          <div 
            key={option.id}
            className={`option ${getCurrentAnswer() === option.id ? 'selected' : ''}`}
            onClick={() => handleOptionSelect(question.id, option.id)}
          >
            <div className="option-marker">
              <span className="option-letter">{option.id.toUpperCase()}</span>
              {getCurrentAnswer() === option.id && <FontAwesomeIcon icon={faCheck} className="option-check" />}
            </div>
            <div className="option-text">{option.text}</div>
          </div>
        ))}
      </div>
    </div>
  );
  
  const renderNavigation = () => (
    <div className="exam-navigation">
      <button 
        className="nav-button prev-button"
        onClick={handlePreviousQuestion}
        disabled={currentQuestionIndex === 0}
      >
        <FontAwesomeIcon icon={faChevronLeft} />
        Anterior
      </button>
      
      <div className="question-progress">
        <span>{getAnsweredQuestionsCount()} de {exam?.questions.length || 0} respondidas</span>
      </div>
      
      {currentQuestionIndex < (exam?.questions.length || 0) - 1 ? (
        <button 
          className="nav-button next-button"
          onClick={handleNextQuestion}
        >
          Próxima
          <FontAwesomeIcon icon={faChevronRight} />
        </button>
      ) : (
        <button 
          className="nav-button submit-button"
          onClick={handleSubmitExam}
          disabled={submitting}
        >
          {submitting ? (
            <>
              <FontAwesomeIcon icon={faSpinner} className="spinner" spin />
              Enviando...
            </>
          ) : (
            'Finalizar Simulado'
          )}
        </button>
      )}
    </div>
  );
  
  if (loading) {
    return (
      <div className="exam-simulation-container loading">
        <FontAwesomeIcon icon={faSpinner} className="spinner" spin />
        <p>Carregando simulado...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="exam-simulation-container error">
        <h2>Erro</h2>
        <p>{error}</p>
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
  
  if (!exam) {
    return (
      <div className="exam-simulation-container error">
        <h2>Simulado não encontrado</h2>
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
  
  const currentQuestion = getCurrentQuestion();
  
  return (
    <div className="exam-simulation-container">
      {renderExamHeader()}
      
      <div className="exam-content">
        {!examStarted ? (
          renderExamInfo()
        ) : (
          <>
            {currentQuestion && renderQuestion(currentQuestion)}
            {renderNavigation()}
          </>
        )}
      </div>
    </div>
  );
};

export default ExamSimulation;
