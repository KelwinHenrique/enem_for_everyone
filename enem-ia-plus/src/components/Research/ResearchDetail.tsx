import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import researchService, { ResearchContent, Flashcard } from '../../services/researchService';
import flashcardService from '../../services/flashcardService';

const ResearchDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [research, setResearch] = useState<ResearchContent | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [flippedCards, setFlippedCards] = useState<{ [key: number]: boolean }>({});
  const [savingFlashcard, setSavingFlashcard] = useState<{ [key: number]: boolean }>({});
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchResearchDetail(id);
    }
  }, [id]);

  const fetchResearchDetail = async (researchId: string) => {
    try {
      setLoading(true);
      const response = await researchService.getResearchById(researchId);
      if (response.success && response.research) {
        setResearch(response.research);
      } else {
        showNotification('error', 'Não foi possível carregar o conteúdo');
        navigate('/research');
      }
    } catch (error) {
      console.error('Erro ao buscar conteúdo:', error);
      showNotification('error', 'Erro ao buscar conteúdo');
      navigate('/research');
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    navigate('/research');
  };

  const toggleFlashcard = (index: number) => {
    setFlippedCards(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const saveFlashcardToUser = async (flashcard: Flashcard, index: number) => {
    try {
      setSavingFlashcard(prev => ({ ...prev, [index]: true }));
      const response = await flashcardService.createFlashcard({
        front: flashcard.front,
        back: flashcard.back,
        tags: research?.topic ? [research.topic] : []
      });
      
      if (response.success) {
        showNotification('success', 'Flashcard salvo com sucesso!');
      } else {
        showNotification('error', 'Erro ao salvar flashcard');
      }
    } catch (error) {
      console.error('Erro ao salvar flashcard:', error);
      showNotification('error', 'Erro ao salvar flashcard');
    } finally {
      setSavingFlashcard(prev => ({ ...prev, [index]: false }));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Function to render HTML content safely
  const renderHtmlContent = (htmlContent: string) => {
    // Remove the markdown code block markers if they exist
    const cleanedContent = htmlContent.replace(/^\`\`\`html\n|\`\`\`$/g, '');
    return { __html: cleanedContent };
  };

  return (
    <div className="research-detail-container">
      {loading ? (
        <div className="research-loading">
          <div className="research-loading-spinner"></div>
          <p>Carregando conteúdo...</p>
        </div>
      ) : research ? (
        <>
          <div className="research-detail-header">
            <h1>{research.topic}</h1>
            <button className="research-back-button" onClick={handleBackClick}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
              Voltar
            </button>
          </div>
          
          <div className="research-detail-meta">
            <div className="research-detail-date">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="16" y1="2" x2="16" y2="6"></line>
                <line x1="8" y1="2" x2="8" y2="6"></line>
                <line x1="3" y1="10" x2="21" y2="10"></line>
              </svg>
              Criado em {formatDate(research.createdAt)}
            </div>
          </div>
          
          <div className="research-content-wrapper">
            <div 
              className="research-content"
              dangerouslySetInnerHTML={renderHtmlContent(research.content)}
            />
          </div>
          
          {research.flashcards && research.flashcards.length > 0 && (
            <div className="research-flashcards">
              <h2>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                  <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                </svg>
                Flashcards
              </h2>
              <div className="flashcards-list">
                {research.flashcards.map((flashcard: Flashcard, index: number) => (
                  <div key={index} className="flashcard-container">
                    <div 
                      className={`flashcard-item ${flippedCards[index] ? 'flipped' : ''}`}
                    >
                      <div className="flashcard-inner">
                        <div className="flashcard-front" onClick={() => toggleFlashcard(index)}>
                          <div className="flashcard-content">{flashcard.front}</div>
                          <div className="flashcard-hint">Clique para ver a resposta</div>
                        </div>
                        <div className="flashcard-back" onClick={() => toggleFlashcard(index)}>
                          <div className="flashcard-content">{flashcard.back}</div>
                          <div className="flashcard-hint">Clique para ver a pergunta</div>
                        </div>
                      </div>
                    </div>
                    <button 
                      className="flashcard-save-button" 
                      onClick={(e) => {
                        e.stopPropagation();
                        saveFlashcardToUser(flashcard, index);
                      }}
                      disabled={savingFlashcard[index]}
                    >
                      {savingFlashcard[index] ? (
                        <span className="flashcard-saving">Salvando...</span>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                            <polyline points="17 21 17 13 7 13 7 21"></polyline>
                            <polyline points="7 3 7 8 15 8"></polyline>
                          </svg>
                          Salvar em meus flashcards
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="research-empty-state">
          <h3>Conteúdo não encontrado</h3>
          <p>O conteúdo que você está procurando não existe ou foi removido.</p>
          <button className="research-back-button" onClick={handleBackClick}>
            Voltar para a lista
          </button>
        </div>
      )}
    </div>
  );
};

export default ResearchDetail;
