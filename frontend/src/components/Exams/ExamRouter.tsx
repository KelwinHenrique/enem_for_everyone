import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import examService from '../../services/examService';
import ExamSimulation from './ExamSimulation';
import InteractiveExamTest from '../ExamTest/InteractiveExamTest';

const ExamRouter: React.FC = () => {
  const { examId } = useParams<{ examId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [examType, setExamType] = useState<string | null>(null);
  
  // Fetch exam data to determine the type
  useEffect(() => {
    const fetchExamType = async () => {
      if (!examId) {
        setError('ID do simulado não fornecido');
        setLoading(false);
        return;
      }
      
      try {
        const examData = await examService.getExam(examId);
        setExamType(examData.config.type);
      } catch (error) {
        console.error('Error fetching exam:', error);
        setError('Erro ao carregar o simulado. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchExamType();
  }, [examId]);

  // If there's no authenticated user, redirect to login page
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  if (loading) {
    return (
      <div className="exam-simulation-container loading">
        <FontAwesomeIcon icon={faSpinner} className="spinner" spin />
        <p>Carregando simulado...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="exam-simulation-container error">
        <h2>Erro</h2>
        <p>{error}</p>
        <button 
          className="back-button"
          onClick={() => navigate('/exams/configuration')}
        >
          Voltar para Configuração
        </button>
      </div>
    );
  }
  
  // Render the appropriate exam component based on the type
  if (examType === 'interactive') {
    return <InteractiveExamTest examId={examId} onComplete={() => navigate('/dashboard')} />;
  } else {
    return <ExamSimulation />;
  }
};

export default ExamRouter;
