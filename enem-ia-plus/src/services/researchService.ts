import { getAuth } from 'firebase/auth';

export interface ResearchContent {
  id: string;
  topic: string;
  content: string;
  createdAt: string;
  userId: string;
  flashcards: Flashcard[];
}

export interface Flashcard {
  front: string;
  back: string;
}

const API_URL = 'http://127.0.0.1:5000/v1';

const researchService = {
  async getAllResearch(): Promise<{ success: boolean; research: ResearchContent[] }> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      const token = await user.getIdToken();
      
      const response = await fetch(`${API_URL}/research`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Falha ao buscar conteúdos');
      }
      
      const data = await response.json();
      return { success: true, research: data };
    } catch (error) {
      console.error('Erro ao buscar conteúdos:', error);
      return { success: false, research: [] };
    }
  },
  
  async getResearchById(id: string): Promise<{ success: boolean; research: ResearchContent | null }> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      const token = await user.getIdToken();
      
      const response = await fetch(`${API_URL}/research/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Falha ao buscar conteúdo');
      }
      
      const data = await response.json();
      return { success: true, research: data };
    } catch (error) {
      console.error('Erro ao buscar conteúdo:', error);
      return { success: false, research: null };
    }
  },
  
  async createResearch(topic: string): Promise<{ success: boolean; research: ResearchContent | null }> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }
      
      const token = await user.getIdToken();
      
      const response = await fetch(`${API_URL}/research/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ topic })
      });
      
      if (!response.ok) {
        throw new Error('Falha ao criar conteúdo');
      }
      
      const data = await response.json();
      return { success: true, research: data };
    } catch (error) {
      console.error('Erro ao criar conteúdo:', error);
      return { success: false, research: null };
    }
  }
};

export default researchService;
