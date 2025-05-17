import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import researchService, { ResearchContent } from '../../services/researchService';

const ResearchList: React.FC = () => {
  const [researchList, setResearchList] = useState<ResearchContent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  useEffect(() => {
    fetchResearchList();
  }, []);

  const fetchResearchList = async () => {
    try {
      setLoading(true);
      const response = await researchService.getAllResearch();
      if (response.success) {
        setResearchList(response.research);
      } else {
        showNotification('error', 'Não foi possível carregar os conteúdos');
      }
    } catch (error) {
      console.error('Erro ao buscar conteúdos:', error);
      showNotification('error', 'Erro ao buscar conteúdos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResearch = () => {
    navigate('/research/create');
  };

  const handleResearchClick = (id: string) => {
    navigate(`/research/detail/${id}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getContentPreview = (htmlContent: string) => {
    const textContent = htmlContent.replace(/<[^>]*>/g, '').replace('```html', '');
    return textContent.substring(0, 150) + (textContent.length > 150 ? '...' : '');
  };

  return (
    <div className="research-list-container">
      <div className="research-list-header">
        <h1>Meus Materiais</h1>
        <button className="research-create-button" onClick={handleCreateResearch}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Gerar Novo Material
        </button>
      </div>

      {loading ? (
        <div className="research-loading">
          <div className="research-loading-spinner"></div>
          <p>Carregando materiais...</p>
        </div>
      ) : researchList.length === 0 ? (
        <div className="research-empty-state">
          <h3>Nenhum material encontrado</h3>
          <p>Você ainda não gerou nenhum material. Clique no botão acima para criar seu primeiro material!</p>
          <button className="research-create-button" onClick={handleCreateResearch}>
            Gerar Primeiro Material
          </button>
        </div>
      ) : (
        <div className="research-grid">
          {researchList.map((research) => (
            <div 
              key={research.id} 
              className="research-card" 
              onClick={() => handleResearchClick(research.id)}
            >
              <div className="research-card-header">
                <div className="research-card-badge">ENEM</div>
                <div className="research-card-date">
                  {formatDate(research.createdAt)}
                </div>
              </div>
              <h3 className="research-card-title">{research.topic}</h3>
              <p className="research-card-preview">
                {getContentPreview(research.content)}
              </p>
              <div className="research-card-footer">
                <button className="research-card-button">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                    <polyline points="15 3 21 3 21 9"></polyline>
                    <line x1="10" y1="14" x2="21" y2="3"></line>
                  </svg>
                  Ver Material
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResearchList;
