import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../../contexts/NotificationContext';
import researchService from '../../services/researchService';

const ResearchCreate: React.FC = () => {
  const [topic, setTopic] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const { showNotification } = useNotification();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!topic.trim()) {
      showNotification('error', 'Por favor, insira um tópico para pesquisar');
      return;
    }
    
    try {
      setLoading(true);
      const response = await researchService.createResearch(topic);
      
      if (response.success && response.research) {
        showNotification('success', 'Conteúdo gerado com sucesso!');
        navigate(`/research/detail/${response.research.id}`);
      } else {
        showNotification('error', 'Não foi possível gerar o conteúdo');
      }
    } catch (error) {
      console.error('Erro ao gerar conteúdo:', error);
      showNotification('error', 'Erro ao gerar conteúdo');
    } finally {
      setLoading(false);
    }
  };

  const handleBackClick = () => {
    navigate('/research');
  };

  return (
    <div className="research-create-container">
      <div className="research-create-header">
        <h1>Gerar Novo Conteúdo</h1>
        <button className="research-back-button" onClick={handleBackClick}>
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Voltar
        </button>
      </div>
      
      <form className="research-form" onSubmit={handleSubmit}>
        <div className="research-form-group">
          <label htmlFor="topic">Tópico de Pesquisa</label>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ex: Revolução Francesa, Equações do 2º Grau, Mitocôndria..."
            disabled={loading}
          />
        </div>
        
        {loading ? (
          <div className="research-loading">
            <div className="research-loading-spinner"></div>
            <p>Gerando conteúdo... Isso pode levar alguns segundos.</p>
          </div>
        ) : (
          <button 
            type="submit" 
            className="research-submit-button"
            disabled={!topic.trim() || loading}
          >
            Gerar Conteúdo
          </button>
        )}
      </form>
    </div>
  );
};

export default ResearchCreate;
