import React from 'react';
import './Loading.css';

const Loading: React.FC = () => {
  return (
    <div className="loading-container">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <h2>Enem Para Todos</h2>
        <p>Carregando...</p>
      </div>
    </div>
  );
};

export default Loading;
