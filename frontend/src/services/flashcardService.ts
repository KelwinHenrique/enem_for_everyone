import axios from 'axios';
import { API_URL } from './examService';

// Create a custom axios instance for our API calls
const apiClient = axios.create({
  baseURL: API_URL
});

// Função para configurar o token de autenticação em todas as requisições
const setAuthToken = (token: string | null) => {
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

export interface MediaAttachment {
  type: string;
  url: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  tags: string[];
  mediaAttachments: MediaAttachment[];
  userNotes: string;
  createdAt: string;
  easeFactor: number;
  interval: number;
  repetitions: number;
  lastReview: string | null;
  nextReview: string;
  questionId?: string;
  userId: string;
}

export interface FlashcardStats {
  totalFlashcards: number;
  dueToday: number;
  newCards: number;
  learningCards: number;
  reviewCards: number;
}

export interface CreateFlashcardRequest {
  front: string;
  back: string;
  tags?: string[];
  mediaAttachments?: MediaAttachment[];
  userNotes?: string;
}

export interface ReviewFlashcardRequest {
  quality: number; // 0-5 rating
}

const flashcardService = {
  // Create flashcard from question
  createFlashcardFromQuestion: async (questionId: string): Promise<{ success: boolean; message: string; flashcard: Flashcard }> => {
    try {
      const response = await apiClient.post(`/flashcards/from-question/${questionId}`);
      return response.data;
    } catch (error) {
      console.error('Error creating flashcard from question:', error);
      throw error;
    }
  },

  // Create flashcard manually
  createFlashcard: async (flashcardData: CreateFlashcardRequest): Promise<{ success: boolean; message: string; flashcard: Flashcard }> => {
    try {
      const response = await apiClient.post('/flashcards', flashcardData);
      return response.data;
    } catch (error) {
      console.error('Error creating flashcard:', error);
      throw error;
    }
  },

  // Get flashcard by ID
  getFlashcard: async (flashcardId: string): Promise<{ success: boolean; flashcard: Flashcard }> => {
    try {
      const response = await apiClient.get(`/flashcards/${flashcardId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting flashcard:', error);
      throw error;
    }
  },

  // Update flashcard
  updateFlashcard: async (flashcardId: string, updateData: Partial<CreateFlashcardRequest>): Promise<{ success: boolean; message: string; flashcard: Flashcard }> => {
    try {
      const response = await apiClient.put(`/flashcards/${flashcardId}`, updateData);
      return response.data;
    } catch (error) {
      console.error('Error updating flashcard:', error);
      throw error;
    }
  },

  // Delete flashcard
  deleteFlashcard: async (flashcardId: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.delete(`/flashcards/${flashcardId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting flashcard:', error);
      throw error;
    }
  },

  // Review flashcard
  reviewFlashcard: async (flashcardId: string, reviewData: ReviewFlashcardRequest): Promise<{ success: boolean; message: string; flashcard: Flashcard }> => {
    try {
      const response = await apiClient.post(`/flashcards/${flashcardId}/review`, reviewData);
      return response.data;
    } catch (error) {
      console.error('Error reviewing flashcard:', error);
      throw error;
    }
  },

  // List all flashcards
  listFlashcards: async (filter?: string, limit: number = 50): Promise<{ success: boolean; flashcards: Flashcard[]; total: number }> => {
    try {
      const params = new URLSearchParams();
      if (filter) params.append('filter', filter);
      if (limit) params.append('limit', limit.toString());
      
      const response = await apiClient.get(`/flashcards?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error listing flashcards:', error);
      throw error;
    }
  },

  // List flashcards due for review
  listDueFlashcards: async (): Promise<{ success: boolean; flashcards: Flashcard[]; total: number }> => {
    try {
      const response = await apiClient.get('/flashcards/due');
      return response.data;
    } catch (error) {
      console.error('Error listing due flashcards:', error);
      throw error;
    }
  },

  // Get flashcard statistics
  getFlashcardStats: async (): Promise<{ success: boolean; stats: FlashcardStats }> => {
    try {
      const response = await apiClient.get('/flashcards/stats');
      return response.data;
    } catch (error) {
      console.error('Error getting flashcard stats:', error);
      throw error;
    }
  }
};

export default flashcardService;
