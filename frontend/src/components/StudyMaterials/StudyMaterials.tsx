import React, { useState } from 'react';
import './StudyMaterials.css';

interface Material {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
}

const MOCK_MATERIALS: Material[] = [
  {
    id: '1',
    title: 'Matemática Básica',
    description: 'Revisão de conceitos fundamentais de matemática para o ENEM',
    category: 'Matemática',
    imageUrl: 'https://via.placeholder.com/150/3a7bd5/FFFFFF?text=Matemática'
  },
  {
    id: '2',
    title: 'Física Moderna',
    description: 'Estudo sobre os principais tópicos de física moderna cobrados no ENEM',
    category: 'Física',
    imageUrl: 'https://via.placeholder.com/150/00d2ff/FFFFFF?text=Física'
  },
  {
    id: '3',
    title: 'Literatura Brasileira',
    description: 'Obras literárias mais importantes para o ENEM',
    category: 'Linguagens',
    imageUrl: 'https://via.placeholder.com/150/3a7bd5/FFFFFF?text=Literatura'
  },
  {
    id: '4',
    title: 'Química Orgânica',
    description: 'Conceitos essenciais de química orgânica para o ENEM',
    category: 'Química',
    imageUrl: 'https://via.placeholder.com/150/00d2ff/FFFFFF?text=Química'
  },
  {
    id: '5',
    title: 'História do Brasil',
    description: 'Principais eventos históricos do Brasil cobrados no ENEM',
    category: 'História',
    imageUrl: 'https://via.placeholder.com/150/3a7bd5/FFFFFF?text=História'
  },
  {
    id: '6',
    title: 'Geografia Mundial',
    description: 'Geopolítica e geografia física para o ENEM',
    category: 'Geografia',
    imageUrl: 'https://via.placeholder.com/150/00d2ff/FFFFFF?text=Geografia'
  }
];

const CATEGORIES = ['Todos', 'Matemática', 'Física', 'Química', 'Biologia', 'História', 'Geografia', 'Linguagens'];

const StudyMaterials: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMaterials = MOCK_MATERIALS.filter(material => {
    const matchesCategory = selectedCategory === 'Todos' || material.category === selectedCategory;
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         material.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="study-materials">
      <div className="study-materials-header">
        <h2>Materiais de Estudo</h2>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Buscar materiais..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="categories-filter">
        {CATEGORIES.map(category => (
          <button
            key={category}
            className={`category-button ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="materials-grid">
        {filteredMaterials.length > 0 ? (
          filteredMaterials.map(material => (
            <div className="material-card" key={material.id}>
              <div className="material-image">
                <img src={material.imageUrl} alt={material.title} />
              </div>
              <div className="material-content">
                <h3>{material.title}</h3>
                <span className="material-category">{material.category}</span>
                <p>{material.description}</p>
                <button className="material-button">Acessar</button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-materials">
            <p>Nenhum material encontrado para a busca atual.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyMaterials;
