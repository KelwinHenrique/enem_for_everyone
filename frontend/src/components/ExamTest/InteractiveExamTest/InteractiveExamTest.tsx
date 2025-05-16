import React, { useState, useEffect, useRef } from 'react';
import examService, { Exam, Question, ChatMessage, setAuthToken } from '../../../services/examService';
import { useAuth } from '../../../contexts/AuthContext';
import '../ExamTest.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faUser, faCommentDots } from '@fortawesome/free-solid-svg-icons';

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
  const [chatId, setChatId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [userQuery, setUserQuery] = useState<string>('');
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  // Store chat history for each question
  const [questionChats, setQuestionChats] = useState<{[questionId: string]: {chatId: string, messages: ChatMessage[]}}>({}); 
  const chatEndRef = useRef<HTMLDivElement>(null);

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

  // Scroll to bottom of chat when new messages are added
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);
  
  // Load chat history for the current question if available
  useEffect(() => {
    if (exam && exam.questions && exam.questions.length > currentQuestionIndex) {
      const currentQuestion = exam.questions[currentQuestionIndex];
      if (currentQuestion && questionChats[currentQuestion.id]) {
        setChatId(questionChats[currentQuestion.id].chatId);
        setChatMessages(questionChats[currentQuestion.id].messages);
      } else {
        setChatId(null);
        setChatMessages([]);
      }
    }
  }, [currentQuestionIndex, exam, questionChats]);

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

  const startChat = async (initialQuery: string) => {
    if (!exam || !exam.questions) return;
    
    const currentQuestion = exam.questions[currentQuestionIndex];
    if (!currentQuestion) return;
    
    setChatLoading(true);
    setError(null);
    try {
      const token = await getToken();
      setAuthToken(token);
      
      const response = await examService.startQuestionChat(currentQuestion.id, initialQuery);
      console.log('Chat started:', response);
      
      // Fix: Access the chat data directly from the response structure
      if (response.success && response.chat) {
        const newChatId = response.chat.id;
        const newMessages = response.chat.messages;
        
        // Update current chat state
        setChatId(newChatId);
        setChatMessages(newMessages);
        
        // Store in question chats history
        setQuestionChats(prev => ({
          ...prev,
          [currentQuestion.id]: {
            chatId: newChatId,
            messages: newMessages
          }
        }));
      }
    } catch (err: any) {
      console.error('Error starting chat:', err);
      setError(err.message || 'Erro ao iniciar chat');
    } finally {
      setChatLoading(false);
      setUserQuery('');
    }
  };

  const continueChat = async () => {
    if (!chatId || !userQuery.trim()) return;
    
    if (!exam || !exam.questions) return;
    const currentQuestion = exam.questions[currentQuestionIndex];
    if (!currentQuestion) return;
    
    setChatLoading(true);
    setError(null);
    try {
      const token = await getToken();
      setAuthToken(token);
      
      // Add user message to UI immediately for better UX
      const updatedMessages = [...chatMessages, { content: userQuery, isUser: true }];
      setChatMessages(updatedMessages);
      
      // Also update in our question chats history
      setQuestionChats(prev => ({
        ...prev,
        [currentQuestion.id]: {
          chatId: chatId,
          messages: updatedMessages
        }
      }));
      
      const response = await examService.continueQuestionChat(chatId, userQuery);
      console.log('Chat continued:', response);
      
      // Fix: Access the chat data directly from the response structure
      if (response.success && response.chat) {
        // Update with the full message list from the server
        const newMessages = response.chat.messages;
        setChatMessages(newMessages);
        
        // Update in question chats history
        setQuestionChats(prev => ({
          ...prev,
          [currentQuestion.id]: {
            chatId: chatId,
            messages: newMessages
          }
        }));
      }
    } catch (err: any) {
      console.error('Error continuing chat:', err);
      setError(err.message || 'Erro ao continuar chat');
      
      // Remove the temporary user message if there was an error
      const revertedMessages = chatMessages.filter((_, index) => index !== chatMessages.length - 1);
      setChatMessages(revertedMessages);
      
      // Also revert in question chats history
      setQuestionChats(prev => ({
        ...prev,
        [currentQuestion.id]: {
          chatId: chatId,
          messages: revertedMessages
        }
      }));
    } finally {
      setChatLoading(false);
      setUserQuery('');
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim()) return;
    
    if (!chatId) {
      startChat(userQuery);
    } else {
      continueChat();
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    setUserQuery(question);
    if (!chatId) {
      startChat(question);
    } else {
      // Set the query and wait for user to submit
      // This gives users a chance to edit the suggested question
    }
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
                    setChatId(null);
                    setChatMessages([]);
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
        <div className="chat-section">
          <div className="chat-header">
            <FontAwesomeIcon icon={faCommentDots} className="chat-icon" />
            <h3>Tire suas dúvidas com o assistente</h3>
          </div>
          
          {chatMessages.length > 0 ? (
            <div className="chat-messages">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`chat-message ${msg.isUser ? 'user' : 'assistant'}`}>
                  <div className="message-avatar">
                    {msg.isUser ? <FontAwesomeIcon icon={faUser} /> : <img src="/ai-assistant.svg" alt="AI" className="ai-avatar" />}
                  </div>
                  <div className="message-bubble">
                    <div className="message-content">{msg.content}</div>
                    {msg.timestamp && <div className="message-time">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
              {chatLoading && (
                <div className="chat-loading">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="suggested-questions">
              <p>Perguntas sugeridas:</p>
              <div className="question-chips">
                {currentQuestion.possibleQuestions?.map((question, index) => (
                  <button 
                    key={index} 
                    className="question-chip"
                    onClick={() => handleSuggestedQuestion(question)}
                    disabled={chatLoading}
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleChatSubmit} className="chat-input">
            <input
              type="text"
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Digite sua pergunta sobre esta questão..."
              disabled={chatLoading}
              className="chat-input-field"
            />
            <button 
              type="submit" 
              disabled={!userQuery.trim() || chatLoading}
              className="chat-send-button"
            >
              {chatLoading ? 'Enviando...' : <FontAwesomeIcon icon={faPaperPlane} />}
            </button>
          </form>
        </div>
      )}


    </div>
  );
};

export default InteractiveExamTest;
