from flask import Blueprint, request, jsonify
from firebase_admin import firestore
from datetime import datetime

from app.middleware.auth import token_required, get_user_id
from app.models.question import Question
from app.services.gemini_service import GeminiService
from app.utils.response import success_response, error_response

# Create blueprint
chat_bp = Blueprint('chats', __name__)

@chat_bp.route('/questions/<question_id>/chat/start', methods=['POST'])
@token_required
def start_question_chat(question_id):
    """Start a chat about a specific question"""
    try:
        # Get user ID from token
        user_id = get_user_id()
        
        # Get request data
        data = request.get_json()
        
        # Validate required fields
        if 'query' not in data:
            return error_response("Campo obrigatório ausente: query", "MISSING_FIELD")
        
        user_query = data.get('query')
        
        # Start a chat with Gemini
        try:
            chat_response = GeminiService.start_question_chat(question_id, user_query)
            
            # Save chat to Firestore
            db = firestore.client()
            chat_id = f"chat_{question_id}_{user_id}"
            
            chat_data = {
                "id": chat_id,
                "question_id": question_id,
                "user_id": user_id,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow(),
                "messages": [
                    {
                        "content": user_query,
                        "timestamp": datetime.utcnow(),
                        "isUser": True
                    },
                    {
                        "content": chat_response["response"],
                        "timestamp": datetime.utcnow(),
                        "isUser": False
                    }
                ]
            }
            
            db.collection("question_chats").document(chat_id).set(chat_data)
            
            # Return response
            return success_response({
                "chat": {
                    "id": chat_id,
                    "question": chat_response["question"],
                    "messages": [
                        {
                            "content": user_query,
                            "isUser": True
                        },
                        {
                            "content": chat_response["response"],
                            "isUser": False
                        }
                    ]
                }
            })
        except ValueError as e:
            return error_response(str(e), "QUESTION_NOT_FOUND", 404)
            
    except Exception as e:
        print(f"Error starting question chat: {e}")
        return error_response(
            "Erro ao iniciar chat sobre a questão.",
            "INTERNAL_SERVER_ERROR",
            500
        )

@chat_bp.route('/questions/chat/<chat_id>/continue', methods=['POST'])
@token_required
def continue_question_chat(chat_id):
    """Continue a chat about a specific question"""
    try:
        # Get user ID from token
        user_id = get_user_id()
        
        # Get request data
        data = request.get_json()
        
        # Validate required fields
        if 'query' not in data:
            return error_response("Campo obrigatório ausente: query", "MISSING_FIELD")
        
        user_query = data.get('query')
        
        # Get chat from Firestore
        db = firestore.client()
        chat_doc = db.collection("question_chats").document(chat_id).get()
        
        if not chat_doc.exists:
            return error_response("Chat não encontrado.", "CHAT_NOT_FOUND", 404)
            
        chat_data = chat_doc.to_dict()
        
        # Check if the chat belongs to the user
        if chat_data.get("user_id") != user_id:
            return error_response("Acesso não autorizado a este chat.", "UNAUTHORIZED", 403)
            
        # Get question ID and messages
        question_id = chat_data.get("question_id")
        messages = chat_data.get("messages", [])
        
        # Continue chat with Gemini
        try:
            chat_response = GeminiService.continue_question_chat(question_id, messages, user_query)
            
            # Add new messages to chat
            messages.append({
                "content": user_query,
                "timestamp": datetime.utcnow(),
                "isUser": True
            })
            
            messages.append({
                "content": chat_response["response"],
                "timestamp": datetime.utcnow(),
                "isUser": False
            })
            
            # Update chat in Firestore
            db.collection("question_chats").document(chat_id).update({
                "messages": messages,
                "updated_at": datetime.utcnow()
            })
            
            # Return response
            return success_response({
                "chat": {
                    "id": chat_id,
                    "messages": [
                        {
                            "content": user_query,
                            "isUser": True
                        },
                        {
                            "content": chat_response["response"],
                            "isUser": False
                        }
                    ]
                }
            })
        except ValueError as e:
            return error_response(str(e), "QUESTION_NOT_FOUND", 404)
            
    except Exception as e:
        print(f"Error continuing question chat: {e}")
        return error_response(
            "Erro ao continuar chat sobre a questão.",
            "INTERNAL_SERVER_ERROR",
            500
        )

@chat_bp.route('/questions/chat/history', methods=['GET'])
@token_required
def get_chat_history():
    """Get chat history for the authenticated user"""
    try:
        # Get user ID from token
        user_id = get_user_id()
        
        # Get query parameters
        limit = int(request.args.get('limit', 10))
        
        # Validate limit
        if limit < 1 or limit > 50:
            limit = 10
        
        # Get chats from Firestore
        db = firestore.client()
        query = db.collection("question_chats").where("user_id", "==", user_id)
        query = query.order_by("updated_at", direction=firestore.Query.DESCENDING)
        query = query.limit(limit)
        
        # Execute query
        results = query.stream()
        chats = []
        
        for doc in results:
            chat_data = doc.to_dict()
            
            # Get question details
            question_id = chat_data.get("question_id")
            question = Question.get_by_id(question_id)
            
            if question:
                # Format chat data for response
                chat = {
                    "id": chat_data.get("id"),
                    "questionId": question_id,
                    "questionText": question.text[:100] + "..." if len(question.text) > 100 else question.text,
                    "updatedAt": chat_data.get("updated_at").isoformat() + "Z" if "updated_at" in chat_data else None,
                    "messageCount": len(chat_data.get("messages", []))
                }
                
                chats.append(chat)
        
        # Return response
        return success_response({
            "chats": chats,
            "total": len(chats)
        })
    except Exception as e:
        print(f"Error getting chat history: {e}")
        return error_response(
            "Erro ao obter histórico de chats.",
            "INTERNAL_SERVER_ERROR",
            500
        )

@chat_bp.route('/questions/chat/<chat_id>', methods=['GET'])
@token_required
def get_chat(chat_id):
    """Get a specific chat"""
    try:
        # Get user ID from token
        user_id = get_user_id()
        
        # Get chat from Firestore
        db = firestore.client()
        chat_doc = db.collection("question_chats").document(chat_id).get()
        
        if not chat_doc.exists:
            return error_response("Chat não encontrado.", "CHAT_NOT_FOUND", 404)
            
        chat_data = chat_doc.to_dict()
        
        # Check if the chat belongs to the user
        if chat_data.get("user_id") != user_id:
            return error_response("Acesso não autorizado a este chat.", "UNAUTHORIZED", 403)
            
        # Get question details
        question_id = chat_data.get("question_id")
        question = Question.get_by_id(question_id)
        
        if not question:
            return error_response("Questão não encontrada.", "QUESTION_NOT_FOUND", 404)
            
        # Format messages for response
        messages = []
        for msg in chat_data.get("messages", []):
            messages.append({
                "content": msg.get("content"),
                "isUser": msg.get("isUser", False)
            })
            
        # Return response
        return success_response({
            "chat": {
                "id": chat_id,
                "question": question.to_response_dict(),
                "messages": messages,
                "createdAt": chat_data.get("created_at").isoformat() + "Z" if "created_at" in chat_data else None,
                "updatedAt": chat_data.get("updated_at").isoformat() + "Z" if "updated_at" in chat_data else None
            }
        })
    except Exception as e:
        print(f"Error getting chat: {e}")
        return error_response(
            "Erro ao obter chat.",
            "INTERNAL_SERVER_ERROR",
            500
        )
