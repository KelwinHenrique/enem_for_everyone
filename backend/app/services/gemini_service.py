import google.generativeai as genai
import json
from app.config import GEMINI_API_KEY
from app.models.question import Question

# Configure the Gemini API
genai.configure(api_key=GEMINI_API_KEY)

class GeminiService:
    """Service for interacting with Google Gemini API to generate questions"""
    
    @staticmethod
    def _get_model():
        """Get the Gemini model"""
        return genai.GenerativeModel('gemini-2.0-flash')
    
    @staticmethod
    def _create_prompt_by_subject(subject, question_count):
        """Create a prompt for generating questions by subject"""
        subject_names = {
            "mathematics": "Matemática",
            "languages": "Linguagens e suas Tecnologias",
            "human_sciences": "Ciências Humanas e suas Tecnologias",
            "natural_sciences": "Ciências da Natureza e suas Tecnologias",
            "all": "todas as áreas do conhecimento (Matemática, Linguagens, Ciências Humanas e Ciências da Natureza)"
        }
        
        subject_name = subject_names.get(subject, subject)
        
        return f"""Você é um especialista em educação e elaboração de questões no estilo do ENEM. Siga estas instruções:. Crie {question_count} questões sobre {subject_name} no formato do ENEM.
 Seu perfil:
- Doutor em Educação, especializado em Metodologias de Avaliação e Pedagogia.
- Experiência em elaboração de questões para avaliações nacionais e internacionais, incluindo o ENEM.
- Profundo conhecimento das diretrizes curriculares do ENEM.
- Habilidade em criar questões interdisciplinares, contextualizadas e de diferentes níveis de dificuldade.
- Experiência em Matemática, Ciências Humanas, Ciências da Natureza e Linguagens, com ênfase em temas transversais e atualidades.

Para cada questão:
1. Crie um enunciado contextualizado
2. Gere 5 alternativas (a, b, c, d, e)
3. Indique qual é a alternativa correta
4. Forneça uma explicação detalhada sobre por que a resposta está correta
5. Inclua 3-5 possíveis dúvidas que um estudante poderia ter sobre esta questão

Responda no seguinte formato JSON:
[
  {{
    "text": "Enunciado da questão",
    "options": [
      {{"id": "a", "text": "Texto da opção A"}},
      {{"id": "b", "text": "Texto da opção B"}},
      {{"id": "c", "text": "Texto da opção C"}},
      {{"id": "d", "text": "Texto da opção D"}},
      {{"id": "e", "text": "Texto da opção E"}}
    ],
    "correctAnswer": "letra da opção correta",
    "explanation": "Explicação detalhada",
    "subject": "nome da matéria em inglês",
    "topic": "tópico específico",
    "difficulty": "easy/medium/hard",
    "possibleQuestions": ["Possível dúvida 1?", "Possível dúvida 2?", "Possível dúvida 3?"]
  }}
]"""
    
    @staticmethod
    def _create_prompt_by_topic(topic, question_count):
        """Create a prompt for generating questions by topic"""
        return f"""Você é um especialista em educação e elaboração de questões no estilo do ENEM. Crie {question_count} questões sobre o tópico específico "{topic}" no formato do ENEM.
Seu perfil:
- Doutor em Educação, especializado em Metodologias de Avaliação e Pedagogia.
- Experiência em elaboração de questões para avaliações nacionais e internacionais, incluindo o ENEM.
- Profundo conhecimento das diretrizes curriculares do ENEM.
- Habilidade em criar questões interdisciplinares, contextualizadas e de diferentes níveis de dificuldade.
- Experiência em Matemática, Ciências Humanas, Ciências da Natureza e Linguagens, com ênfase em temas transversais e atualidades.

Para cada questão:
1. Crie um enunciado contextualizado
2. Gere 5 alternativas (a, b, c, d, e)
3. Indique qual é a alternativa correta
4. Forneça uma explicação detalhada sobre por que a resposta está correta
5. Inclua 3-5 possíveis dúvidas que um estudante poderia ter sobre esta questão

Responda no seguinte formato JSON:
[
  {{
    "text": "Enunciado da questão",
    "options": [
      {{"id": "a", "text": "Texto da opção A"}},
      {{"id": "b", "text": "Texto da opção B"}},
      {{"id": "c", "text": "Texto da opção C"}},
      {{"id": "d", "text": "Texto da opção D"}},
      {{"id": "e", "text": "Texto da opção E"}}
    ],
    "correctAnswer": "letra da opção correta",
    "explanation": "Explicação detalhada",
    "subject": "nome da matéria em inglês",
    "topic": "{topic}",
    "difficulty": "easy/medium/hard",
    "possibleQuestions": ["Possível dúvida 1?", "Possível dúvida 2?", "Possível dúvida 3?"]
  }}
]"""
    
    @classmethod
    def generate_questions(cls, content_selection, question_count, user_id):
        """Generate questions using Gemini API based on content selection"""
        model = cls._get_model()
        
        # Create prompt based on content selection method
        if content_selection.get("method") == "subject":
            subject = content_selection.get("subject", "all")
            prompt = cls._create_prompt_by_subject(subject, question_count)
        elif content_selection.get("method") == "topic":
            topic = content_selection.get("customTopic", "")
            prompt = cls._create_prompt_by_topic(topic, question_count)
        else:
            raise ValueError("Invalid content selection method")
        
        # Generate content with Gemini
        response = model.generate_content(prompt)
        
        # Extract and parse JSON from response
        try:
            response_text = response.text
            # Find JSON array in the response
            start_idx = response_text.find('[')
            end_idx = response_text.rfind(']') + 1
            
            if start_idx == -1 or end_idx == 0:
                raise ValueError("Could not find JSON array in response")
                
            json_str = response_text[start_idx:end_idx]
            questions_data = json.loads(json_str)
            
            # Convert to Question objects
            questions = []
            for q_data in questions_data:
                # Map subject names if needed
                subject_mapping = {
                    "matemática": "mathematics",
                    "linguagens": "languages",
                    "ciências humanas": "human_sciences",
                    "ciências da natureza": "natural_sciences"
                }
                
                subject = q_data.get("subject", "").lower()
                if subject in subject_mapping:
                    subject = subject_mapping[subject]
                
                question = Question(
                    text=q_data.get("text"),
                    options=q_data.get("options"),
                    correct_answer=q_data.get("correctAnswer"),
                    explanation=q_data.get("explanation"),
                    subject=subject,
                    user_id=user_id,
                    topic=q_data.get("topic"),
                    difficulty=q_data.get("difficulty"),
                    possible_questions=q_data.get("possibleQuestions", [])
                )
                questions.append(question)
            
            return questions
        except Exception as e:
            print(f"Error parsing Gemini response: {e}")
            print(f"Response text: {response.text}")
            raise ValueError(f"Failed to parse questions from Gemini response: {e}")
    
    @classmethod
    def generate_questions_with_cache(cls, content_selection, question_count, user_id, cache=None):
        """Generate questions with optional caching"""
        # If cache is provided, check for cached questions
        if cache:
            cache_key = cls._get_cache_key(content_selection, question_count)
            cached_questions = cache.get(cache_key)
            if cached_questions:
                return cached_questions
        
        # Generate new questions
        questions = cls.generate_questions(content_selection, question_count, user_id)
        
        # Cache the questions if cache is provided
        if cache and questions:
            cache_key = cls._get_cache_key(content_selection, question_count)
            cache.set(cache_key, questions)
        
        return questions
    
    @staticmethod
    def _get_cache_key(content_selection, question_count):
        """Generate a cache key based on content selection and question count"""
        method = content_selection.get("method")
        if method == "subject":
            return f"subject:{content_selection.get('subject')}:count:{question_count}"
        elif method == "topic":
            return f"topic:{content_selection.get('customTopic')}:count:{question_count}"
        return f"method:{method}:count:{question_count}"
        
    @classmethod
    def start_question_chat(cls, question_id, user_query):
        """Start a chat about a specific question"""
        from app.models.question import Question
        
        # Get the question from Firestore
        question = Question.get_by_id(question_id)
        if not question:
            raise ValueError("Question not found")
            
        # Create the initial prompt for the chat
        prompt = f"""Você é um tutor educacional especializado em ajudar estudantes a compreender questões do ENEM.
        
Detalhes da questão:

Enunciado: {question.text}

Alternativas:
{', '.join([f"{opt['id']}) {opt['text']}" for opt in question.options])}

Resposta correta: {question.correct_answer}

Explicação: {question.explanation}

O estudante tem a seguinte dúvida sobre esta questão:
"{user_query}"

Por favor, ajude o estudante a entender melhor esta questão. Forneça uma explicação clara, didática e detalhada que aborde especificamente a dúvida do estudante. Use uma linguagem acessível e exemplos adicionais se necessário. Não apenas repita a explicação original da questão, mas ofereça novos insights e abordagens para ajudar o estudante a compreender o conceito.

Sua resposta deve ser estruturada, começando com uma saudação amigável, seguida pela explicação, e terminando com uma pergunta para verificar se o estudante compreendeu ou se precisa de mais esclarecimentos. Use formatação HTML para melhorar a legibilidade e o engajamento:
               - Use tags <h1>, <h2>, <h3> para títulos e subtítulos
               - Use tags <p> para parágrafos
               - Use tags <strong> ou <b> para termos ou conceitos importantes
               - Use tags <ul>, <ol> e <li> para listas
               - Use tags <table>, <tr>, <th> e <td> para informações tabulares
               - Use <blockquote> para citações ou destaques importantes
               - Use <code> para trechos de código, se relevante
               - Use <hr> para separar seções principais"""
        
        # Generate response with Gemini
        model = cls._get_model()
        response = model.generate_content(prompt)
        
        return {
            "question": question.to_response_dict(),
            "userQuery": user_query,
            "response": response.text
        }
        
    @classmethod
    def continue_question_chat(cls, question_id, chat_history, user_query):
        """Continue a chat about a specific question"""
        from app.models.question import Question
        
        # Get the question from Firestore
        question = Question.get_by_id(question_id)
        if not question:
            raise ValueError("Question not found")
            
        # Format the chat history
        formatted_history = ""
        for message in chat_history:
            role = "Estudante" if message.get("isUser", False) else "Tutor"
            formatted_history += f"{role}: {message.get('content')}\n\n"
            
        # Create the prompt for continuing the chat
        prompt = f"""Você é um tutor educacional especializado em ajudar estudantes a compreender questões do ENEM.
        
Detalhes da questão:

Enunciado: {question.text}

Alternativas:
{', '.join([f"{opt['id']}) {opt['text']}" for opt in question.options])}

Resposta correta: {question.correct_answer}

Explicação: {question.explanation}

Histórico da conversa:
{formatted_history}

Nova mensagem do estudante:
"{user_query}"

Por favor, continue a conversa de forma natural e didática, respondendo à nova dúvida do estudante. Mantenha um tom amigável e educativo. Se o estudante estiver satisfeito ou agradecer, conclua a conversa de forma positiva."""
        
        # Generate response with Gemini
        model = cls._get_model()
        response = model.generate_content(prompt)
        
        return {
            "response": response.text
        }
