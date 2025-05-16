import axios from 'axios';

export const API_URL = 'http://127.0.0.1:5000/v1';

// Create a custom axios instance for our API calls
const apiClient = axios.create({
  baseURL: API_URL
});

// Function to set the auth token for all requests
export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

// Configurar interceptor para incluir o token em todas as requisições
apiClient.interceptors.request.use(
  async (config) => {
    // Obter o token mais recente do localStorage antes de cada requisição
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

interface ContentSelection {
  method: 'subject' | 'topic';
  subject?: string;
  customTopic?: string;
}

export interface CreateExamRequest {
  examType: 'complete' | 'quick' | 'custom' | 'interactive';
  questionCount: number;
  estimatedTime: number;
  contentSelection: ContentSelection;
  userId: string;
}

export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  text: string;
  options: Option[];
  correctAnswer: string;
  explanation: string;
  subject: 'mathematics' | 'languages' | 'human_sciences' | 'natural_sciences' | 'mixed';
  userId: string;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  possibleQuestions?: string[];
}

export interface ExamConfig {
  type: 'complete' | 'quick' | 'custom' | 'interactive';
  questionCount: number;
  timeLimit: number;
  contentType?: 'subject' | 'topic';
  subject?: string;
  customTopic?: string;
}

export interface Exam {
  id: string;
  title: string;
  createdAt: string;
  expiresAt: string;
  status: 'generating' | 'ready' | 'in-progress' | 'completed' | 'expired';
  config: ExamConfig;
  questions: Question[];
  redirectUrl?: string;
}

export interface CreateExamResponse {
  success: boolean;
  message: string;
  exam: Exam;
}

// Chat interfaces for question-related chat
export interface ChatMessage {
  content: string;
  isUser: boolean;
  timestamp?: string;
}

export interface QuestionChat {
  id: string;
  questionId: string;
  questionText: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

const examService = {
  createExam: async (examData: CreateExamRequest): Promise<CreateExamResponse> => {
    try {
      // Make the actual API call to create an exam using our apiClient
      const response = await apiClient.post(`/exams/create`, examData);
      return response.data;
    } catch (error) {
      console.error('Error creating exam:', error);
      throw error;
    }
  },
  
  getExam: async (examId: string): Promise<Exam> => {
    try {
      // Make the actual API call to get an exam using our apiClient
      const response = await apiClient.get(`/exams/${examId}`);
      return response.data.exam;
    } catch (error) {
      console.error('Error getting exam:', error);
      throw error;
    }
  },
  
  startExam: async (examId: string): Promise<{ success: boolean, message: string, startTime: string, endTime: string }> => {
    try {
      // Make the actual API call to start an exam using our apiClient
      const response = await apiClient.post(`/exams/${examId}/start`);
      return response.data;
    } catch (error) {
      console.error('Error starting exam:', error);
      throw error;
    }
  },
  
  submitExam: async (examId: string, answers: { questionId: string, selectedOption: string }[]): Promise<any> => {
    try {
      // Make the actual API call to submit exam answers using our apiClient
      const response = await apiClient.post(`/exams/${examId}/submit`, { answers });
      return response.data;
    } catch (error) {
      console.error('Error submitting exam:', error);
      throw error;
    }
  },
  
  getUserExamHistory: async (page: number = 1, limit: number = 10, status?: string): Promise<any> => {
    try {
      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (status) {
        params.append('status', status);
      }
      
      // Make the actual API call to get user's exam history using our apiClient
      const response = await apiClient.get(`/exams/user/history?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error getting exam history:', error);
      throw error;
    }
  },
  
  // Chat related functions
  startQuestionChat: async (questionId: string, query: string): Promise<any> => {
    try {
      const response = await apiClient.post(`/questions/${questionId}/chat/start`, { query });
      return response.data;
    } catch (error) {
      console.error('Error starting question chat:', error);
      throw error;
    }
  },

  continueQuestionChat: async (chatId: string, query: string): Promise<any> => {
    try {
      const response = await apiClient.post(`/questions/chat/${chatId}/continue`, { query });
      return response.data;
    } catch (error) {
      console.error('Error continuing question chat:', error);
      throw error;
    }
  },

  getQuestionChatHistory: async (limit: number = 10): Promise<any> => {
    try {
      const response = await apiClient.get(`/questions/chat/history?limit=${limit}`);
      return response.data;
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  },

  getQuestionChat: async (chatId: string): Promise<any> => {
    try {
      const response = await apiClient.get(`/questions/chat/${chatId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting chat details:', error);
      throw error;
    }
  }
};

// Função auxiliar para gerar questões simuladas
function generateMockQuestions(count: number, subject?: string, topic?: string): Question[] {
  const subjects = ['mathematics', 'languages', 'human_sciences', 'natural_sciences', 'mixed'] as const;
  const questions: Question[] = [];
  
  for (let i = 0; i < count; i++) {
    const subjectType = subject === 'all' || !subject ? 
      subjects[Math.floor(Math.random() * subjects.length)] : 
      (subject === 'mathematics' ? 'mathematics' : 
       subject === 'languages' ? 'languages' : 
       subject === 'human_sciences' ? 'human_sciences' : 
       subject === 'natural_sciences' ? 'natural_sciences' : 'mixed');
    
    const questionText = topic ? 
      `Questão sobre ${topic} (${i + 1}/${count})` : 
      `Questão de ${getSubjectName(subjectType)} (${i + 1}/${count})`;
    
    questions.push({
      id: `q_${i + 1}`,
      text: questionText,
      options: [
        { id: 'a', text: 'Alternativa A - Lorem ipsum dolor sit amet, consectetur adipiscing elit.' },
        { id: 'b', text: 'Alternativa B - Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.' },
        { id: 'c', text: 'Alternativa C - Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.' },
        { id: 'd', text: 'Alternativa D - Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.' },
        { id: 'e', text: 'Alternativa E - Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.' }
      ],
      correctAnswer: ['a', 'b', 'c', 'd', 'e'][Math.floor(Math.random() * 5)],
      explanation: 'Explicação detalhada sobre a resposta correta. Esta explicação inclui conceitos teóricos e aplicações práticas.',
      subject: subjectType,
      userId: 'user_789456',
      topic: topic || getRandomTopic(subjectType),
      difficulty: ['easy', 'medium', 'hard'][Math.floor(Math.random() * 3)] as 'easy' | 'medium' | 'hard',
      possibleQuestions: [
        'Por que esta alternativa está correta?',
        'Qual o conceito principal abordado nesta questão?',
        'Como aplicar este conhecimento em outras situações?',
        'Quais são as principais dificuldades relacionadas a este tema?',
        'Pode me dar mais exemplos sobre este assunto?'
      ]
    });
  }
  
  return questions;
}

function getSubjectName(subject: string): string {
  switch (subject) {
    case 'mathematics': return 'Matemática';
    case 'languages': return 'Linguagens';
    case 'human_sciences': return 'Ciências Humanas';
    case 'natural_sciences': return 'Ciências da Natureza';
    case 'mixed': return 'Conhecimentos Gerais';
    default: return 'Desconhecido';
  }
}

function getRandomTopic(subject: string): string {
  const topics = {
    mathematics: ['Álgebra', 'Geometria', 'Estatística', 'Funções', 'Trigonometria'],
    languages: ['Interpretação de Texto', 'Gramática', 'Literatura', 'Redação', 'Linguística'],
    human_sciences: ['História do Brasil', 'Geografia Política', 'Sociologia', 'Filosofia', 'Atualidades'],
    natural_sciences: ['Física Mecânica', 'Química Orgânica', 'Biologia Celular', 'Ecologia', 'Genética'],
    mixed: ['Conhecimentos Gerais', 'Atualidades', 'Interdisciplinar', 'Cultura Geral', 'Tecnologia']
  };
  
  const subjectTopics = topics[subject as keyof typeof topics] || topics.mixed;
  return subjectTopics[Math.floor(Math.random() * subjectTopics.length)];
}



export default examService;
