import React, { useState, useEffect } from 'react';
import examService, { Exam, ChatMessage, setAuthToken } from '../../../services/examService';
import { useAuth } from '../../../contexts/AuthContext';
import '../ExamTest.css';
import QuestionChat from './QuestionChat';

interface InteractiveExamTestProps {
  examId?: string;
  onComplete?: () => void;
}

const InteractiveExamTest: React.FC<InteractiveExamTestProps> = ({ examId, onComplete }) => {
  const { currentUser, getToken } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [showAnswer, setShowAnswer] = useState<boolean>(false);
  // Store chat history for each question
  const [questionChats, setQuestionChats] = useState<{[questionId: string]: {chatId: string, messages: ChatMessage[]}}>({}); 

  // Set up auth token for all API requests
  useEffect(() => {
    const setupAuthToken = async () => {
      const token = await getToken();
      if (token) {
        setAuthToken(token);
      }
    };
    
    setupAuthToken();
  }, [getToken]);

  // Fetch exam data if examId is provided
  useEffect(() => {
    if (examId) {
      getExam(examId);
    }
  }, [examId]);



  const getExam = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      setAuthToken(token);
      
      const examData = await examService.getExam(id);
      console.log('Exam details:', examData);
      setExam(examData);
      
      // Start the exam if it's not already in progress
      if (examData.status === 'ready') {
        await startExam(id);
      }
    } catch (err: any) {
      console.error('Error getting exam:', err);
      setError(err.message || 'Erro ao obter simulado');
    } finally {
      setLoading(false);
    }
  };

  const startExam = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      setAuthToken(token);
      
      const startData = await examService.startExam(id);
      console.log('Exam started:', startData);
      
      // Refresh exam data after starting
      const examData = await examService.getExam(id);
      setExam(examData);
    } catch (err: any) {
      console.error('Error starting exam:', err);
      setError(err.message || 'Erro ao iniciar simulado');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, option: string) => {
    if (showAnswer) return; // Prevent changing answer after submission
    
    setAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
  };

  const submitAnswer = async () => {
    if (!exam || !exam.questions || exam.questions.length === 0) {
      setError('Nenhuma questão disponível');
      return;
    }

    const currentQuestion = exam.questions[currentQuestionIndex];
    if (!currentQuestion) {
      setError('Questão não encontrada');
      return;
    }

    const selectedOption = answers[currentQuestion.id];
    if (!selectedOption) {
      setError('Selecione uma alternativa');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // In a real implementation, you would submit this answer to the backend
      // For now, we'll just show the answer immediately
      setShowAnswer(true);
    } catch (err: any) {
      console.error('Error submitting answer:', err);
      setError(err.message || 'Erro ao enviar resposta');
    } finally {
      setLoading(false);
    }
  };

  const nextQuestion = () => {
    if (!exam || !exam.questions) return;
    
    const isLastQuestion = currentQuestionIndex === exam.questions.length - 1;
    
    if (isLastQuestion) {
      // Handle exam completion
      if (onComplete) {
        onComplete();
      }
    } else {
      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1);
      setShowAnswer(false);
      // Chat history is now handled by the useEffect that watches currentQuestionIndex
    }
  };

  // Handle chat updates from the QuestionChat component
  const handleChatUpdate = (questionId: string, chatId: string, messages: ChatMessage[]) => {
    setQuestionChats(prev => ({
      ...prev,
      [questionId]: {
        chatId,
        messages
      }
    }));
  };

  if (loading && !exam) {
    return <div className="loading">Carregando simulado...</div>;
  }

  if (error && !exam) {
    return <div className="error">{error}</div>;
  }

  if (!exam || !exam.questions || exam.questions.length === 0) {
    return <div className="error">Simulado não disponível ou sem questões</div>;
  }

  const currentQuestion = exam.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === exam.questions.length - 1;
  const isCorrect = showAnswer && answers[currentQuestion.id] === currentQuestion.correctAnswer;

  return (
    <div className="interactive-exam-container">
      <div className="exam-header">
        <h2>{exam.title}</h2>
        <div className="exam-progress">
          Questão {currentQuestionIndex + 1} de {exam.questions.length}
        </div>
      </div>

      <div className="question-container">
        <div className="question-text">
          <h3>Questão {currentQuestionIndex + 1}</h3>
          <p>{currentQuestion.text}</p>
        </div>

        <div className="options">
          {currentQuestion.options.map(option => (
            <div 
              key={option.id} 
              className={`option ${showAnswer && option.id === currentQuestion.correctAnswer ? 'correct' : ''} 
                         ${showAnswer && answers[currentQuestion.id] === option.id && 
                           option.id !== currentQuestion.correctAnswer ? 'incorrect' : ''}
                         ${answers[currentQuestion.id] === option.id ? 'selected' : ''}`}
            >
              <input
                type="radio"
                id={`${currentQuestion.id}_${option.id}`}
                name={currentQuestion.id}
                value={option.id}
                checked={answers[currentQuestion.id] === option.id}
                onChange={() => handleAnswerChange(currentQuestion.id, option.id)}
                disabled={showAnswer}
              />
              <label htmlFor={`${currentQuestion.id}_${option.id}`}>
                {option.id.toUpperCase()}) {option.text}
              </label>
            </div>
          ))}
        </div>

        {!showAnswer ? (
          <button 
            className="submit-button" 
            onClick={submitAnswer}
            disabled={!answers[currentQuestion.id]}
          >
            Responder
          </button>
        ) : (
          <div className="answer-explanation">
            <div className={`result-badge ${isCorrect ? 'correct' : 'incorrect'}`}>
              {isCorrect ? 'Correto!' : 'Incorreto!'}
            </div>
            <h4>Explicação:</h4>
            <p>{currentQuestion.explanation}</p>
            
            <div className="simple-navigation">
              <button 
                className="nav-button prev-button" 
                onClick={() => {
                  if (currentQuestionIndex > 0) {
                    setCurrentQuestionIndex(prev => prev - 1);
                    setShowAnswer(false);
                  }
                }}
                disabled={currentQuestionIndex === 0}
              >
                <span className="nav-icon">←</span>
                <span className="nav-text">Anterior</span>
              </button>
              
              <button 
                className="nav-button next-button" 
                onClick={nextQuestion}
              >
                <span className="nav-text">{isLastQuestion ? 'Finalizar Simulado' : 'Próxima Questão'}</span>
                <span className="nav-icon">→</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {showAnswer && (
        <QuestionChat 
          questionId={currentQuestion.id}
          possibleQuestions={currentQuestion.possibleQuestions || []}
          initialChatId={questionChats[currentQuestion.id]?.chatId || null}
          initialMessages={questionChats[currentQuestion.id]?.messages || []}
          onChatUpdate={(chatId, messages) => handleChatUpdate(currentQuestion.id, chatId, messages)}
        />
      )}


    </div>
  );
};

export default InteractiveExamTest;
