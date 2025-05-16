import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../contexts/NotificationContext';
import flashcardService, { Flashcard, MediaAttachment } from '../../services/flashcardService';
import './FlashcardCreate.css'; // Reusing the same styles as FlashcardCreate

const FlashcardEdit: React.FC = () => {
  const { flashcardId } = useParams<{ flashcardId: string }>();
  const { currentUser } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [front, setFront] = useState<string>('');
  const [back, setBack] = useState<string>('');
  const [tags, setTags] = useState<string>('');
  const [userNotes, setUserNotes] = useState<string>('');
  const [mediaAttachments, setMediaAttachments] = useState<MediaAttachment[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  
  useEffect(() => {
    const fetchFlashcard = async () => {
      if (!flashcardId) return;
      
      try {
        setLoading(true);
        const response = await flashcardService.getFlashcard(flashcardId);
        const flashcard = response.flashcard;
        
        setFront(flashcard.front);
        setBack(flashcard.back);
        setTags(flashcard.tags.join(', '));
        setUserNotes(flashcard.userNotes || '');
        setMediaAttachments(flashcard.mediaAttachments || []);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching flashcard:', error);
        showNotification('error', 'Erro ao carregar flashcard');
        navigate('/flashcards');
      }
    };
    
    fetchFlashcard();
  }, [flashcardId, navigate, showNotification]);
  
  const handleAddMediaAttachment = () => {
    // This would typically open a file picker or URL input dialog
    // For now, we'll just add a placeholder
    showNotification('info', 'Funcionalidade de anexos será implementada em breve!');
  };
  
  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTags(e.target.value);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!flashcardId) return;
    
    if (!front || !back) {
      showNotification('error', 'Os campos frente e verso são obrigatórios!');
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      const updateData = {
        front,
        back,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag !== ''),
        userNotes,
        mediaAttachments
      };
      
      const response = await flashcardService.updateFlashcard(flashcardId, updateData);
      
      showNotification('success', 'Flashcard atualizado com sucesso!');
      navigate('/flashcards/all');
    } catch (error) {
      console.error('Error updating flashcard:', error);
      showNotification('error', 'Erro ao atualizar flashcard. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };
  
  if (loading) {
    return (
      <div className="flashcard-create-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando flashcard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flashcard-create-container">
      <header className="flashcard-create-header">
        <h1>Editar Flashcard</h1>
        <p>Atualize as informações do seu flashcard</p>
      </header>
      
      <div className="flashcard-create-content">
        <div className="flashcard-preview-container">
          <div className={`flashcard-preview-card ${isFlipped ? 'flipped' : ''}`}>
            <div className="flashcard-preview-front">
              <h3>Frente</h3>
              <div className="flashcard-preview-content">
                {front || 'Digite o conteúdo da frente do flashcard...'}
              </div>
              <button className="flip-button" onClick={handleFlip}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 1l4 4-4 4" />
                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <path d="M7 23l-4-4 4-4" />
                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
                Virar
              </button>
            </div>
            <div className="flashcard-preview-back">
              <h3>Verso</h3>
              <div className="flashcard-preview-content">
                {back || 'Digite o conteúdo do verso do flashcard...'}
              </div>
              <button className="flip-button" onClick={handleFlip}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 1l4 4-4 4" />
                  <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                  <path d="M7 23l-4-4 4-4" />
                  <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                </svg>
                Virar
              </button>
            </div>
          </div>
        </div>
        
        <form className="flashcard-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="front">Frente (obrigatório)</label>
            <textarea
              id="front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="Digite a pergunta ou conceito..."
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="back">Verso (obrigatório)</label>
            <textarea
              id="back"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              placeholder="Digite a resposta ou explicação..."
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="tags">Tags (separadas por vírgula)</label>
            <input
              type="text"
              id="tags"
              value={tags}
              onChange={handleTagsChange}
              placeholder="Ex: história, brasil, república..."
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="userNotes">Notas Adicionais</label>
            <textarea
              id="userNotes"
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="Notas adicionais para ajudar nos seus estudos..."
            />
          </div>
          
          <div className="form-group">
            <label>Anexos</label>
            <div className="media-attachments">
              {mediaAttachments.length > 0 ? (
                <div className="attachment-list">
                  {mediaAttachments.map((attachment, index) => (
                    <div key={index} className="attachment-item">
                      <span>{attachment.type}: {attachment.url}</span>
                      <button
                        type="button"
                        className="remove-attachment"
                        onClick={() => setMediaAttachments(mediaAttachments.filter((_, i) => i !== index))}
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-attachments">Nenhum anexo adicionado</p>
              )}
              <button
                type="button"
                className="add-attachment-button"
                onClick={handleAddMediaAttachment}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Adicionar Anexo
              </button>
            </div>
          </div>
          
          <div className="form-actions">
            <button
              type="button"
              className="cancel-button"
              onClick={() => navigate('/flashcards/all')}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="submit-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FlashcardEdit;
