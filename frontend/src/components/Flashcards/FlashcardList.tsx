import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useNotification } from '../../contexts/NotificationContext';
import flashcardService, { Flashcard } from '../../services/flashcardService';
import './FlashcardList.css';

const FlashcardList: React.FC = () => {
  const { currentUser } = useAuth();
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [filteredFlashcards, setFilteredFlashcards] = useState<Flashcard[]>([]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  
  useEffect(() => {
    const fetchFlashcards = async () => {
      try {
        setLoading(true);
        const response = await flashcardService.listFlashcards();
        setFlashcards(response.flashcards);
        setFilteredFlashcards(response.flashcards);
        
        // Extract unique tags
        const allTags = response.flashcards.reduce((acc: string[], flashcard: Flashcard) => {
          flashcard.tags.forEach(tag => {
            if (!acc.includes(tag)) {
              acc.push(tag);
            }
          });
          return acc;
        }, []);
        
        setTags(allTags);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching flashcards:', error);
        showNotification('error', 'Erro ao carregar flashcards');
        setLoading(false);
      }
    };
    
    fetchFlashcards();
  }, [showNotification]);
  
  useEffect(() => {
    filterFlashcards();
  }, [searchTerm, selectedTag, flashcards]);
  
  const filterFlashcards = () => {
    let filtered = [...flashcards];
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(flashcard => 
        flashcard.front.toLowerCase().includes(term) || 
        flashcard.back.toLowerCase().includes(term)
      );
    }
    
    if (selectedTag) {
      filtered = filtered.filter(flashcard => 
        flashcard.tags.includes(selectedTag)
      );
    }
    
    setFilteredFlashcards(filtered);
  };
  
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };
  
  const handleTagSelect = (tag: string) => {
    setSelectedTag(tag === selectedTag ? '' : tag);
  };
  
  const handleDelete = async (flashcardId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este flashcard?')) {
      try {
        await flashcardService.deleteFlashcard(flashcardId);
        showNotification('success', 'Flashcard excluído com sucesso!');
        
        // Update state to remove the deleted flashcard
        setFlashcards(flashcards.filter(f => f.id !== flashcardId));
      } catch (error) {
        console.error('Error deleting flashcard:', error);
        showNotification('error', 'Erro ao excluir flashcard');
      }
    }
  };
  
  const handleEdit = (flashcardId: string) => {
    navigate(`/flashcards/edit/${flashcardId}`);
  };
  
  const handleCreateFlashcard = () => {
    navigate('/flashcards/create');
  };
  
  return (
    <div className="flashcard-list-container">
      <header className="flashcard-list-header">
        <h1>Todos os Flashcards</h1>
        <p>Gerencie sua coleção de flashcards</p>
      </header>
      
      <div className="flashcard-list-actions">
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar flashcards..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
          <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        
        <button className="create-button" onClick={handleCreateFlashcard}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Criar Flashcard
        </button>
      </div>
      
      {tags.length > 0 && (
        <div className="tags-filter">
          <span className="tags-label">Filtrar por tag:</span>
          <div className="tags-list">
            {tags.map((tag, index) => (
              <span
                key={index}
                className={`tag-filter ${selectedTag === tag ? 'active' : ''}`}
                onClick={() => handleTagSelect(tag)}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando flashcards...</p>
        </div>
      ) : (
        <>
          {filteredFlashcards.length > 0 ? (
            <div className="flashcards-grid">
              {filteredFlashcards.map((flashcard) => (
                <div key={flashcard.id} className="flashcard-item">
                  <div className="flashcard-content">
                    <div className="flashcard-front-preview">{flashcard.front}</div>
                    <div className="flashcard-back-preview">
                      <strong>Resposta:</strong> {flashcard.back}
                    </div>
                    <div className="flashcard-tags">
                      {flashcard.tags.map((tag, index) => (
                        <span key={index} className="flashcard-tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flashcard-footer">
                    <span className="next-review">
                      Próxima revisão: {new Date(flashcard.nextReview).toLocaleDateString()}
                    </span>
                    <div className="flashcard-actions">
                      <button
                        className="edit-button"
                        onClick={() => handleEdit(flashcard.id)}
                        title="Editar"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button
                        className="delete-button"
                        onClick={() => handleDelete(flashcard.id)}
                        title="Excluir"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="#6c5ce7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="6" width="20" height="12" rx="2" />
                  <path d="M12 12h.01" />
                </svg>
              </div>
              <h3>Nenhum flashcard encontrado</h3>
              <p>
                {searchTerm || selectedTag
                  ? 'Nenhum flashcard corresponde aos critérios de busca.'
                  : 'Você ainda não criou nenhum flashcard. Comece criando seu primeiro flashcard agora!'}
              </p>
              <button className="primary-button" onClick={handleCreateFlashcard}>
                Criar Flashcard
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FlashcardList;
