import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ResearchList from './ResearchList';
import ResearchDetail from './ResearchDetail';
import ResearchCreate from './ResearchCreate';
import './Research.css';

const Research: React.FC = () => {
  return (
    <div className="research-container">
      <Routes>
        <Route path="/" element={<ResearchList />} />
        <Route path="/create" element={<ResearchCreate />} />
        <Route path="/detail/:id" element={<ResearchDetail />} />
        <Route path="*" element={<Navigate to="/research" />} />
      </Routes>
    </div>
  );
};

export default Research;
