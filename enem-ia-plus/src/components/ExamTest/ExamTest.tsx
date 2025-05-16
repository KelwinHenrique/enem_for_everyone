import React, { useState, useEffect } from 'react';
import examService, { CreateExamRequest, Exam, setAuthToken } from '../../services/examService';
import { useAuth } from '../../contexts/AuthContext';
import InteractiveExamTest from './InteractiveExamTest';
import './ExamTest.css';

const ExamTest: React.FC = () => {
  const { currentUser, getToken } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [examId, setExamId] = useState<string | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [startInfo, setStartInfo] = useState<any>(null);
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [result, setResult] = useState<any>(null);
  const [examHistory, setExamHistory] = useState<any>(null);
  const [examType, setExamType] = useState<'custom' | 'interactive'>('custom');
  const [showInteractiveExam, setShowInteractiveExam] = useState<boolean>(false);
  
  // Set up auth token for all API requests
  useEffect(() => {
    const setupAuthToken = async () => {
      const token = await getToken();
      if (token) {
        // Set the token for all examService API calls
        setAuthToken(token);
      }
    };
    
    setupAuthToken();
    
    // Clean up function not needed as we're not creating interceptors anymore
  }, [getToken]);

  const createExam = async () => {
    setLoading(true);
    setError(null);
    try {
      // Ensure we have the latest token before making the request
      const token = await getToken();
      setAuthToken(token);
      
      const examData: CreateExamRequest = {
        examType: examType,
        questionCount: 3,
        estimatedTime: 10,
        contentSelection: {
          method: 'topic',
          customTopic: 'tiradentes'
        },
        userId: currentUser?.uid || '' // Use the actual user ID from auth context
      };

      const response = await examService.createExam(examData);
      console.log('Exam created:', response);
      setExamId(response.exam.id);
      setExam(response.exam);
      
      // If it's an interactive exam, show the interactive exam component
      if (examType === 'interactive') {
        setShowInteractiveExam(true);
      }
    } catch (err: any) {
      console.error('Error creating exam:', err);
      setError(err.message || 'Erro ao criar simulado');
    } finally {
      setLoading(false);
    }
  };

  const getExam = async () => {
    if (!examId) {
      setError('Nenhum simulado criado ainda');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Ensure we have the latest token before making the request
      const token = await getToken();
      setAuthToken(token);
      
      const examData = await examService.getExam(examId);
      console.log('Exam details:', examData);
      setExam(examData);
    } catch (err: any) {
      console.error('Error getting exam:', err);
      setError(err.message || 'Erro ao obter simulado');
    } finally {
      setLoading(false);
    }
  };

  const startExam = async () => {
    if (!examId) {
      setError('Nenhum simulado criado ainda');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Ensure we have the latest token before making the request
      const token = await getToken();
      setAuthToken(token);
      
      const startData = await examService.startExam(examId);
      console.log('Exam started:', startData);
      setStartInfo(startData);
    } catch (err: any) {
      console.error('Error starting exam:', err);
      setError(err.message || 'Erro ao iniciar simulado');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, option: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: option
    }));
  };

  const submitExam = async () => {
    if (!examId) {
      setError('Nenhum simulado criado ainda');
      return;
    }

    if (!exam || !exam.questions || exam.questions.length === 0) {
      setError('Nenhuma questão disponível');
      return;
    }

    // Check if all questions have answers
    const answeredQuestions = Object.keys(answers).length;
    if (answeredQuestions < exam.questions.length) {
      setError(`Responda todas as questões (${answeredQuestions}/${exam.questions.length})`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Ensure we have the latest token before making the request
      const token = await getToken();
      setAuthToken(token);
      
      const formattedAnswers = Object.entries(answers).map(([questionId, selectedOption]) => ({
        questionId,
        selectedOption
      }));

      const resultData = await examService.submitExam(examId, formattedAnswers);
      console.log('Exam submitted:', resultData);
      setResult(resultData);
    } catch (err: any) {
      console.error('Error submitting exam:', err);
      setError(err.message || 'Erro ao enviar respostas');
    } finally {
      setLoading(false);
    }
  };

  const getExamHistory = async () => {
    setLoading(true);
    setError(null);
    try {
      // Ensure we have the latest token before making the request
      const token = await getToken();
      setAuthToken(token);
      
      const historyData = await examService.getUserExamHistory();
      console.log('Exam history:', historyData);
      setExamHistory(historyData);
    } catch (err: any) {
      console.error('Error getting exam history:', err);
      setError(err.message || 'Erro ao obter histórico de simulados');
    } finally {
      setLoading(false);
    }
  };

  const handleExamComplete = () => {
    setShowInteractiveExam(false);
    getExamHistory();
  };

  return (
    <div className="exam-test-container">
      <h1>Teste de Integração da API de Simulados</h1>
      
      {showInteractiveExam && examId ? (
        <InteractiveExamTest examId={examId} onComplete={handleExamComplete} />
      ) : (
        <>
          <div className="exam-type-selector">
            <h3>Selecione o tipo de simulado:</h3>
            <div className="exam-type-options">
              <label className={examType === 'custom' ? 'selected' : ''}>
                <input 
                  type="radio" 
                  name="examType" 
                  value="custom" 
                  checked={examType === 'custom'} 
                  onChange={() => setExamType('custom')}
                />
                <span>Simulado Personalizado (com tempo)</span>
              </label>
              <label className={examType === 'interactive' ? 'selected' : ''}>
                <input 
                  type="radio" 
                  name="examType" 
                  value="interactive" 
                  checked={examType === 'interactive'} 
                  onChange={() => setExamType('interactive')}
                />
                <span>Simulado Interativo (com chat)</span>
              </label>
            </div>
          </div>
          
          <div className="action-buttons">
            <button onClick={createExam} disabled={loading}>Criar Simulado {examType === 'interactive' ? 'Interativo' : 'Personalizado'}</button>
            <button onClick={getExam} disabled={loading || !examId}>Obter Simulado</button>
            <button onClick={startExam} disabled={loading || !examId}>Iniciar Simulado</button>
            <button onClick={submitExam} disabled={loading || !examId}>Enviar Respostas</button>
            <button onClick={getExamHistory} disabled={loading}>Obter Histórico</button>
          </div>
        </>
      )}

      {loading && <div className="loading">Carregando...</div>}
      {error && <div className="error">{error}</div>}

      {exam && (
        <div className="exam-details">
          <h2>Detalhes do Simulado</h2>
          <p><strong>ID:</strong> {exam.id}</p>
          <p><strong>Título:</strong> {exam.title}</p>
          <p><strong>Status:</strong> {exam.status}</p>
          <p><strong>Criado em:</strong> {new Date(exam.createdAt).toLocaleString()}</p>
          <p><strong>Expira em:</strong> {new Date(exam.expiresAt).toLocaleString()}</p>
          
          <h3>Questões ({exam.questions?.length || 0})</h3>
          {exam.questions && exam.questions.map((question, index) => (
            <div key={question.id} className="question-card">
              <h4>Questão {index + 1}</h4>
              <p>{question.text}</p>
              
              <div className="options">
                {question.options.map(option => (
                  <div key={option.id} className="option">
                    <input
                      type="radio"
                      id={`${question.id}_${option.id}`}
                      name={question.id}
                      value={option.id}
                      checked={answers[question.id] === option.id}
                      onChange={() => handleAnswerChange(question.id, option.id)}
                    />
                    <label htmlFor={`${question.id}_${option.id}`}>
                      {option.id.toUpperCase()}) {option.text}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {startInfo && (
        <div className="start-info">
          <h2>Informações de Início</h2>
          <p><strong>Mensagem:</strong> {startInfo.message}</p>
          <p><strong>Iniciado em:</strong> {new Date(startInfo.startTime).toLocaleString()}</p>
          <p><strong>Termina em:</strong> {new Date(startInfo.endTime).toLocaleString()}</p>
        </div>
      )}

      {result && (
        <div className="result-info">
          <h2>Resultado do Simulado</h2>
          <p><strong>Mensagem:</strong> {result.message}</p>
          {result.result && (
            <>
              <p><strong>Pontuação:</strong> {result.result.score}</p>
              <p><strong>Questões Corretas:</strong> {result.result.correctAnswers}/{result.result.totalQuestions}</p>
              <p><strong>Tempo Gasto:</strong> {result.result.timeSpent} minutos</p>
            </>
          )}
        </div>
      )}

      {examHistory && (
        <div className="history-info">
          <h2>Histórico de Simulados</h2>
          {examHistory.exams && examHistory.exams.length > 0 ? (
            <ul>
              {examHistory.exams.map((historyExam: any) => (
                <li key={historyExam.id}>
                  <strong>{historyExam.title}</strong> - Status: {historyExam.status}, 
                  Criado em: {new Date(historyExam.createdAt).toLocaleDateString()}
                </li>
              ))}
            </ul>
          ) : (
            <p>Nenhum simulado encontrado no histórico.</p>
          )}
          <p><strong>Total:</strong> {examHistory.pagination?.total || 0}</p>
        </div>
      )}
    </div>
  );
};

export default ExamTest;
