import React, { useState, useEffect, useRef } from 'react';
import DOMPurify from 'dompurify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faUser, faCommentDots } from '@fortawesome/free-solid-svg-icons';
import examService, { ChatMessage, setAuthToken } from '../../../services/examService';
import { useAuth } from '../../../contexts/AuthContext';
import '../ExamTest.css';

interface QuestionChatProps {
  questionId: string;
  possibleQuestions?: string[];
  initialChatId?: string | null;
  initialMessages?: ChatMessage[];
  onChatUpdate?: (chatId: string, messages: ChatMessage[]) => void;
}

const QuestionChat: React.FC<QuestionChatProps> = ({ 
  questionId, 
  possibleQuestions = [], 
  initialChatId = null, 
  initialMessages = [],
  onChatUpdate
}) => {
  const { getToken } = useAuth();
  const [chatId, setChatId] = useState<string | null>(initialChatId);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialMessages);
  const [userQuery, setUserQuery] = useState<string>('');
  const [chatLoading, setChatLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat when new messages are added
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const startChat = async (initialQuery: string) => {
    if (!questionId || !initialQuery.trim()) return;
    
    setError(null);
    try {
      const token = await getToken();
      setAuthToken(token);
      
      const response = await examService.startQuestionChat(questionId, initialQuery);
      console.log('Chat started:', response);
      
      if (response.success && response.chat) {
        const newChatId = response.chat.id;
        const newMessages = response.chat.messages;
        
        // Update current chat state
        setChatId(newChatId);
        setChatMessages(newMessages);
        
        // Notify parent component
        if (onChatUpdate) {
          onChatUpdate(newChatId, newMessages);
        }
      }
    } catch (err: any) {
      console.error('Error starting chat:', err);
      setError(err.message || 'Erro ao iniciar chat');
      
      // Remove the temporary user message if there was an error
      setChatMessages(chatMessages.filter(msg => !msg.isUser || msg.content !== initialQuery));
    } finally {
      setChatLoading(false);
      setUserQuery('');
    }
  };

  const continueChat = async () => {
    if (!chatId || !userQuery.trim() || !questionId) return;
    
    setError(null);
    try {
      const token = await getToken();
      setAuthToken(token);
      
      // User message is already added in handleChatSubmit
      // Notify parent component about the immediate update
      if (onChatUpdate) {
        onChatUpdate(chatId, chatMessages);
      }
      
      const response = await examService.continueQuestionChat(chatId, userQuery);
      console.log('Chat continued:', response);
      
      if (response.success && response.chat) {
        // Update with the full message list from the server
        const newMessages = response.chat.messages;
        setChatMessages(newMessages);
        
        // Notify parent component
        if (onChatUpdate) {
          onChatUpdate(chatId, newMessages);
        }
      }
    } catch (err: any) {
      console.error('Error continuing chat:', err);
      setError(err.message || 'Erro ao continuar chat');
      
      // Remove the temporary user message if there was an error
      const revertedMessages = chatMessages.filter((_, index) => index !== chatMessages.length - 1);
      setChatMessages(revertedMessages);
      
      // Notify parent component about the reversion
      if (onChatUpdate) {
        onChatUpdate(chatId, revertedMessages);
      }
    } finally {
      setChatLoading(false);
      setUserQuery('');
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim() || chatLoading) return;
    
    // Show user message immediately for better UX
    const userMessage = { content: userQuery, isUser: true };
    const updatedMessages = [...chatMessages, userMessage];
    setChatMessages(updatedMessages);
    
    // Set loading state
    setChatLoading(true);
    
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
    }
    // If chatId exists, just set the query and wait for user to submit
    // This gives users a chance to edit the suggested question
  };

  return (
    <div className="chat-section">
      <div className="chat-header">
        <FontAwesomeIcon icon={faCommentDots} className="chat-icon" />
        <h3>Tire suas dúvidas com o Lumos, nosso tutor virtual</h3>
      </div>
      
      {chatMessages.length > 0 ? (
        <div className="chat-messages">
          {chatMessages.map((msg, index) => (
            <div key={index} className={`chat-message ${msg.isUser ? 'user' : 'assistant'}`}>
              <div className="message-avatar">
                {msg.isUser ? <FontAwesomeIcon icon={faUser} /> : <img src="/ai-assistant.svg" alt="AI" className="ai-avatar" />}
              </div>
              <div className="message-bubble">
                {msg.isUser ? (
                  <div className="message-content">{msg.content}</div>
                ) : (
                  <div 
                    className="message-content ai-content" 
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.content) }}
                  />
                )}
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
            {possibleQuestions.map((question, index) => (
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
          {chatLoading ? <span className="sending-text">Enviando...</span> : <FontAwesomeIcon icon={faPaperPlane} />}
        </button>
      </form>
      
      {error && <div className="chat-error">{error}</div>}
    </div>
  );
};

export default QuestionChat;
