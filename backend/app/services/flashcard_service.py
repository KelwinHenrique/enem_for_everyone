import google.generativeai as genai
from app.config import GEMINI_API_KEY
from app.models.question import Question
from app.models.flashcard import Flashcard

# Configure the Gemini API
genai.configure(api_key=GEMINI_API_KEY)

class FlashcardService:
    """Service for generating flashcards from questions using Gemini API"""
    
    @staticmethod
    def _get_model():
        """Get the Gemini model"""
        return genai.GenerativeModel('gemini-2.0-flash')
    
    @classmethod
    def create_flashcard_from_question(cls, question_id, user_id):
        """Create a flashcard from a question using Gemini API"""
        # Get the question from Firestore
        question = Question.get_by_id(question_id)
        print("question", question)
        if not question:
            raise ValueError("Question not found")
        
        # Check if the question has the expected structure
        if not hasattr(question, 'text') or not hasattr(question, 'explanation'):
            raise ValueError("Question doesn't have the expected structure")
            
        # Safely get options
        options_text = ""
        try:
            if hasattr(question, 'options') and question.options:
                options_text = ', '.join([f"{opt['id']}) {opt['text']}" for opt in question.options])
        except Exception as e:
            print(f"Error formatting options: {e}")
            options_text = "[Erro ao formatar opções]"
            
        # Create prompt for Gemini
        prompt = f"""Crie um flashcard educacional baseado na seguinte questão:

Enunciado: {question.text}

Resposta correta: {getattr(question, 'correct_answer', 'N/A')}

Explicação: {question.explanation}

Sua tarefa é criar um flashcard conciso que capture o conceito principal testado nesta questão.

O flashcard deve ter:
1. Frente (front): Uma pergunta clara e direta sobre o conceito principal
2. Verso (back): Uma resposta concisa que explica o conceito
3. Tags: 2-4 palavras-chave relacionadas ao assunto da questão

Mantenha o flashcard curto e focado no conceito-chave.

RESPONDA APENAS COM O OBJETO JSON PURO no seguinte formato:
{{
  "front": "Pergunta concisa sobre o conceito",
  "back": "Resposta explicativa concisa",
  "tags": ["tag1", "tag2", "tag3"]
}}

NÃO INCLUA NENHUM TEXTO ADICIONAL, EXPLICAÇÃO OU FORMATAÇÃO MARKDOWN."""
        
        print("Prompt:", prompt)
        
        # Generate flashcard content with Gemini
        model = cls._get_model()
        response = model.generate_content(prompt)
        
        try:
            # Print response for debugging
            print("Gemini response:", response.text)
            
            # Extract JSON using a similar approach to GeminiService
            import json
            response_text = response.text
            
            # First try to find a JSON object with curly braces
            start_idx = response_text.find('{')
            end_idx = response_text.rfind('}') + 1
            
            if start_idx == -1 or end_idx == 0:
                # If not found, try to extract from code blocks
                import re
                json_match = re.search(r'```(?:json)?\s*({.*?})\s*```', response_text, re.DOTALL)
                if json_match:
                    json_text = json_match.group(1)
                else:
                    raise ValueError("Could not find JSON object in response")
            else:
                json_text = response_text[start_idx:end_idx]
            
            print("Extracted JSON:", json_text)
            
            # Parse the JSON response
            flashcard_content = json.loads(json_text)
            
            # Create and save the flashcard
            flashcard = Flashcard(
                user_id=user_id,
                front=flashcard_content.get("front"),
                back=flashcard_content.get("back"),
                tags=flashcard_content.get("tags", []),
                question_id=question_id
            )
            
            # Save to Firestore
            flashcard.save()
            
            return flashcard
            
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            # Fallback: create a simple flashcard if JSON parsing fails
            subject = question.subject if hasattr(question, 'subject') else ''
            topic = question.topic if hasattr(question, 'topic') else ''
            
            # Create a basic flashcard from the question
            flashcard = Flashcard(
                user_id=user_id,
                front=f"O que é o conceito principal abordado nesta questão: '{question.text[:100]}...'?",
                back=f"Explicação: {question.explanation[:200]}...",
                tags=[subject, topic] if subject or topic else [],
                question_id=question_id
            )
            
            # Save to Firestore
            flashcard.save()
            
            return flashcard
            
        except Exception as e:
            print(f"Error creating flashcard: {e}")
            raise ValueError(f"Failed to create flashcard: {e}")
