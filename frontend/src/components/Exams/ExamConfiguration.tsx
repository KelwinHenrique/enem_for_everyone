import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, 
  faSpinner, 
  faBookOpen, 
  faLanguage, 
  faGlobeAmericas, 
  faFlask 
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import examService from '../../services/examService';
import './ExamConfiguration.css';

interface ExamType {
  id: string;
  title: string;
  questions: number;
  time: number;
  description?: string;
}

interface Subject {
  id: string;
  name: string;
  icon: React.ReactNode;
  subtopics?: string[];
  availableQuestions?: number;
}

const ExamConfiguration: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { currentUser, logout } = useAuth();
  const [selectedType, setSelectedType] = useState<string>('custom');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [estimatedTime, setEstimatedTime] = useState<number>(10);
  const [customTopic, setCustomTopic] = useState<string>('');
  const [useCustomTopic, setUseCustomTopic] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // If there's no authenticated user, redirect to login page
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  const examTypes: ExamType[] = [
    { id: 'complete', title: 'Simulado Completo', questions: 30, time: 60, description: '30 questões • 60 min' },
    { id: 'quick', title: 'Simulado Rápido', questions: 10, time: 20, description: '10 questões • 20 min' },
    { id: 'custom', title: 'Simulado Personalizado', questions: 5, time: 10, description: 'Escolha o número de questões' },
    { id: 'interactive', title: 'Simulado Interativo', questions: 5, time: 0, description: 'Com respostas imediatas e chat' },
  ];

  const subjects: Subject[] = [
    { 
      id: 'all', 
      name: 'Todas as Matérias',
      icon: <FontAwesomeIcon icon={faBookOpen} />
    },
    { 
      id: 'mathematics', 
      name: 'Matemática',
      icon: <FontAwesomeIcon icon={faBookOpen} />,
      subtopics: ['Geometria', 'Álgebra', 'Estatística'],
      availableQuestions: 50
    },
    { 
      id: 'languages', 
      name: 'Linguagens',
      icon: <FontAwesomeIcon icon={faLanguage} />
    },
    { 
      id: 'human_sciences', 
      name: 'Ciências Humanas',
      icon: <FontAwesomeIcon icon={faGlobeAmericas} />,
      subtopics: ['História', 'Geografia', 'Filosofia'],
      availableQuestions: 40
    },
    { 
      id: 'natural_sciences', 
      name: 'Ciências da Natureza',
      icon: <FontAwesomeIcon icon={faFlask} />,
      subtopics: ['Física', 'Química', 'Biologia'],
      availableQuestions: 45
    }
  ];

  const handleTypeChange = (id: string) => {
    // Allow custom and interactive types to be selected
    if (id === 'custom' || id === 'interactive') {
      setSelectedType(id);
      const type = examTypes.find(t => t.id === id);
      if (type) {
        setEstimatedTime(type.time);
        setQuestionCount(type.questions);
      }
    } else {
      showNotification('info', 'Apenas os simulados Personalizado e Interativo estão disponíveis no momento.');
    }
  };

  const handleQuestionCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const count = parseInt(e.target.value);
    setQuestionCount(count);
    // Update estimated time (2 minutes per question)
    setEstimatedTime(count * 2);
  };

  const handleTabChange = (useCustom: boolean) => {
    setUseCustomTopic(useCustom);
    if (useCustomTopic) {
      setSelectedSubject('');
    } else {
      setCustomTopic('');
    }
  };

  const handleSubjectChange = (id: string) => {
    setSelectedSubject(id);
  };

  const handleGenerateExam = async () => {
    // Check if all required fields are filled
    if (selectedType === 'custom' || selectedType === 'interactive') {
      if ((useCustomTopic && !customTopic.trim()) || (!useCustomTopic && !selectedSubject)) {
        showNotification('error', 'Por favor, selecione uma matéria ou digite um tópico específico');
        return;
      }
    }
    
    setIsLoading(true);
    
    try {
      // Prepare the request data
      const examData = {
        examType: selectedType as 'complete' | 'quick' | 'custom' | 'interactive',
        questionCount: questionCount,
        estimatedTime: selectedType === 'interactive' ? 0 : estimatedTime,
        contentSelection: {
          method: useCustomTopic ? 'topic' as const : 'subject' as const,
          subject: useCustomTopic ? undefined : selectedSubject,
          customTopic: useCustomTopic ? customTopic : undefined
        },
        userId: currentUser?.uid || 'anonymous'
      };
      
      // Call the API
      const response = await examService.createExam(examData);
      
      if (response.success) {
        showNotification('success', 'Simulado gerado com sucesso! Redirecionando...');
        // Redirect to the exam page
        navigate(`/exams/simulation/${response.exam.id}`);
      } else {
        showNotification('error', 'Erro ao gerar o simulado. Tente novamente.');
      }
    } catch (error) {
      console.error('Error generating exam:', error);
      showNotification('error', 'Erro ao gerar o simulado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackClick = () => {
    navigate('/dashboard');
  };

  return (
    <div className="exam-configuration-container">
      <header className="dashboard-header">
        <div className="logo">
          <h1 className="logo-text">Enem Para Todos</h1>
        </div>
        
        <div className="user-info">
          <div className="user-avatar">
            {currentUser.photoURL ? (
              <img src={currentUser.photoURL} alt="Avatar do usuário" />
            ) : (
              <div className="avatar-placeholder">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="#6c5ce7">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                </svg>
              </div>
            )}
          </div>
          <div className="user-details">
            <p className="user-name">{currentUser.displayName || 'Usuário'}</p>
            <button className="logout-button" onClick={logout}>
              Sair
            </button>
          </div>
        </div>
      </header>
      
      <main className="exam-configuration-content">
        <div className="configuration-card">
          <h1>Configuração do Simulado</h1>
          
          <div className="exam-types">
            <h2>Tipo de Simulado</h2>
            <div className="exam-types-grid">
              {examTypes.map(type => (
                <div 
                  key={type.id}
                  className={`exam-type-card ${selectedType === type.id ? 'selected' : ''} ${(type.id !== 'custom' && type.id !== 'interactive') ? 'disabled' : ''}`}
                  onClick={() => handleTypeChange(type.id)}
                >
                  <h3>{type.title}</h3>
                  <p className="description">{type.description}</p>
                  
                  {type.id !== 'custom' && type.id !== 'interactive' && (
                    <span className="unavailable-text">Em breve</span>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          {(selectedType === 'custom' || selectedType === 'interactive') && (
            <div className="custom-options">
              <div className="question-count-selector">
                <label>Número de Questões: {questionCount}</label>
                <div className="range-container">
                  <input 
                    type="range" 
                    min="3" 
                    max="10" 
                    value={questionCount}
                    onChange={handleQuestionCountChange}
                  />
                  <span className="range-value">{questionCount}</span>
                </div>
              </div>
              
              <div className="content-selection">
                <h3>Conteúdo do Simulado</h3>
                
                <div className="content-selection-tabs">
                  <button 
                    className={`tab-button ${!useCustomTopic ? 'active' : ''}`}
                    onClick={() => handleTabChange(false)}
                  >
                    Selecionar Matéria
                  </button>
                  <button 
                    className={`tab-button ${useCustomTopic ? 'active' : ''}`}
                    onClick={() => handleTabChange(true)}
                  >
                    Digitar Tema/Tópico
                  </button>
                </div>
                
                {!useCustomTopic ? (
                  <div className="subject-selection">
                    <div className="subjects-grid">
                      {subjects.map(subject => (
                        <div 
                          key={subject.id}
                          className={`subject-card ${selectedSubject === subject.id ? 'selected' : ''}`}
                          onClick={() => handleSubjectChange(subject.id)}
                        >
                          <div className="subject-icon">
                            {subject.icon}
                          </div>
                          <h4>{subject.name}</h4>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="custom-topic-input">
                    <label>Digite um tema ou tópico específico:</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Revolução Industrial, Funções do 2º Grau, etc."
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="exam-footer">
            <div className="estimated-time">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              Tempo estimado: {estimatedTime} minutos
            </div>
            
            <button 
              className="generate-exam-button" 
              onClick={handleGenerateExam}
              disabled={!selectedType || isLoading}
            >
              {isLoading ? (
                <>
                  <div className="btn-spinner"></div>
                  Gerando Simulado...
                </>
              ) : (
                'Gerar Simulado'
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ExamConfiguration;
