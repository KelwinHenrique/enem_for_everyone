import google.generativeai as genai
import os
import json
import re
from google.adk.agents import Agent
from google.adk.runners import Runner
from google.adk.sessions import InMemorySessionService
from google.adk.tools import google_search
from google.genai import types
from google.genai import Client
from app.config import GEMINI_API_KEY
from app.models.research import Research
from app.models.flashcard import Flashcard

# Configure the Gemini API
genai.configure(api_key=GEMINI_API_KEY)

# Configure the Google ADK with API key
genai_client = Client(api_key=GEMINI_API_KEY)

os.environ["GOOGLE_API_KEY"] = GEMINI_API_KEY

class ResearchService:
    """Service for creating research content using Gemini agents"""
    
    @staticmethod
    def _call_agent(agent, message_text, user_id, session_id):
        """Helper function to call an agent and get the response"""
        # Create a session service in memory
        session_service = InMemorySessionService()
        # Create a new session
        session = session_service.create_session(app_name=agent.name, user_id=user_id, session_id=session_id)
        # Create a Runner for the agent with the API key
        runner = Runner(
            agent=agent, 
            app_name=agent.name, 
            session_service=session_service
        )
        # Create the content of the input message
        content = types.Content(role="user", parts=[types.Part(text=message_text)])

        final_response = ""
        # Iterate asynchronously through the events returned during agent execution
        for event in runner.run(user_id=user_id, session_id=session_id, new_message=content):
            if event.is_final_response():
                for part in event.content.parts:
                    if part.text is not None:
                        final_response += part.text
                        final_response += "\n"
        return final_response
    
    @classmethod
    def search_agent(cls, topic, user_id):
        """Agent that searches for information about the topic"""
        search_agent = Agent(
            name="search_agent",
            model="gemini-2.0-flash",
            instruction="""
            Você é um Assistente de Pesquisa especializado em encontrar informações precisas e relevantes.
            Sua tarefa é pesquisar informações sobre o tópico fornecido e fornecer um resumo abrangente
            dos fatos, conceitos e detalhes mais importantes e relevantes.
            
            Siga estas diretrizes:
            1. Pesquise as informações mais atualizadas e precisas sobre o tópico
            2. Concentre-se em fontes confiáveis como artigos acadêmicos, sites educacionais e publicações respeitáveis
            3. Organize as informações em uma estrutura lógica
            4. Forneça uma visão abrangente que cubra diferentes aspectos do tópico
            5. Inclua fatos-chave, definições, conceitos e exemplos
            6. Cite suas fontes ao fornecer informações específicas
            
            Sua saída deve ser um resumo detalhado de suas descobertas que será usado para criar
            conteúdo educacional. Seja completo, mas conciso.
            """,
            description="Agent that searches for information about a topic",
            tools=[google_search]
        )
        
        search_prompt = f"Pesquise o seguinte tópico detalhadamente: {topic}"
        
        search_results = cls._call_agent(search_agent, search_prompt, user_id=user_id, session_id=f"{user_id}_search_{topic}")
        
        return search_results
    
    @classmethod
    def content_creation_agent(cls, topic, search_results, user_id):
        """Agent that creates educational content based on search results"""
        content_agent = Agent(
            name="content_creation_agent",
            model="gemini-2.0-flash",
            instruction="""
            Você é um Criador de Conteúdo Educacional especializado em criar materiais educacionais
            abrangentes, envolventes e bem estruturados.
            
            Sua tarefa é criar um recurso educacional completo sobre o tópico fornecido
            com base na pesquisa fornecida. Este conteúdo será exibido diretamente aos estudantes
            como um guia de estudo.
            
            Siga estas diretrizes:
            1. Crie um conteúdo educacional bem estruturado com seções e subseções claras
            2. Comece com uma introdução que explique a importância e relevância do tópico
            3. Inclua todos os conceitos importantes, definições, exemplos e aplicações
            4. Use formatação HTML para melhorar a legibilidade e o engajamento:
               - Use tags <h1>, <h2>, <h3> para títulos e subtítulos
               - Use tags <p> para parágrafos
               - Use tags <strong> ou <b> para termos ou conceitos importantes
               - Use tags <ul>, <ol> e <li> para listas
               - Use tags <table>, <tr>, <th> e <td> para informações tabulares
               - Use <blockquote> para citações ou destaques importantes
               - Use <code> para trechos de código, se relevante
               - Use <hr> para separar seções principais
            5. Inclua descrições visuais ou diagramas quando útil (descritos em texto)
            6. Termine com um resumo ou conclusão que reforce as principais lições
            
            Sua saída deve ser um recurso educacional completo formatado em HTML que seja
            informativo, envolvente e visualmente estruturado.
            """,
            description="Agent that creates educational content"
        )
        
        content_prompt = f"""
        Tópico: {topic}
        
        Informações da Pesquisa:
        {search_results}
        
        Crie um recurso educacional abrangente sobre este tópico usando formatação HTML
        para estrutura e ênfase. Torne-o envolvente, informativo e bem organizado.
        """
        
        content = cls._call_agent(content_agent, content_prompt, user_id=user_id, session_id=f"{user_id}_content_{topic}")
        return content
    
    @classmethod
    def flashcard_creation_agent(cls, topic, content, user_id):
        """Agent that creates flashcards based on the educational content"""
        flashcard_agent = Agent(
            name="flashcard_creation_agent",
            model="gemini-2.0-flash",
            instruction="""
            Você é um Especialista em Criação de Flashcards que se destaca em transformar informações complexas
            em flashcards de estudo eficazes.
            
            Sua tarefa é criar um conjunto de 5-10 flashcards de alta qualidade com base no conteúdo
            educacional fornecido. Cada flashcard deve ter uma frente (pergunta/prompt) e um verso (resposta/explicação).
            
            Siga estas diretrizes:
            1. Crie flashcards que cubram os conceitos, definições e fatos mais importantes
            2. Garanta que os flashcards testem a compreensão, não apenas a memorização
            3. Faça o lado da frente claro e conciso
            4. Faça o lado do verso abrangente, mas não excessivamente longo
            5. Inclua uma mistura de diferentes tipos de flashcards:
               - Cartões de definição (termo → definição)
               - Cartões de explicação de conceitos (conceito → explicação)
               - Cartões de aplicação (cenário → solução)
               - Cartões de comparação (semelhanças/diferenças)
            
            Formate sua resposta como um array JSON de objetos de flashcard com propriedades "front" e "back".
            Exemplo de saída, exatamente nessa estrutura:
            [
              {
                "front": "O que é fotossíntese?",
                "back": "O processo pelo qual plantas verdes e alguns outros organismos usam a luz solar para sintetizar alimentos com dióxido de carbono e água, gerando oxigênio como subproduto."
              },
              {
                "front": "Liste os principais componentes da membrana celular.",
                "back": "Bicamada fosfolipídica, proteínas (integrais e periféricas), colesterol, carboidratos e glicolipídios."
              }
            ]
            """,
            description="Agent that creates flashcards from educational content"
        )
        
        flashcard_prompt = f"""
        Tópico: {topic}
        
        Conteúdo Educacional:
        {content}
        
        Crie 5-10 flashcards de alta qualidade com base neste conteúdo educacional.
        Formate sua resposta como um array JSON de objetos de flashcard com propriedades "front" e "back".
        """
        
        flashcards_json = cls._call_agent(flashcard_agent, flashcard_prompt, user_id=user_id, session_id=f"{user_id}_flashcards_{topic}")
        return flashcards_json
    
    @staticmethod
    def string_to_json(json_string):
        try:
            # Parse JSON string into a Python dictionary
            parsed_json = json.loads(json_string)
            return parsed_json
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON: {e}")
        return None

    @classmethod
    def create_research(cls, user_id, topic):
        """Create a complete research with content and flashcards"""
        # Step 1: Search for information about the topic
        search_results = cls.search_agent(topic, user_id)
        
        # Step 2: Create educational content based on search results
        content = cls.content_creation_agent(topic, search_results, user_id)
        
        # Step 3: Create flashcards based on the content
        flashcards = cls.flashcard_creation_agent(topic, content, user_id)
        json_match = re.search(r'```json\s*([\s\S]*?)\s*```', flashcards)
        flashcards_json = cls.string_to_json(json_match.group(1))
        # Step 4: Create and save the research
        research = Research(
            user_id=user_id,
            topic=topic,
            content=content,
            flashcards=flashcards_json
        )
        
        # Save to Firestore
        research.save()
        
        return research
    
    @classmethod
    def get_research_by_id(cls, research_id):
        """Get a research by ID"""
        return Research.get_by_id(research_id)
    
    @classmethod
    def get_researches_by_user_id(cls, user_id, limit=50):
        """Get all researches for a user"""
        return Research.get_by_user_id(user_id, limit)
