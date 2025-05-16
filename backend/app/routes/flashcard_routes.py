from flask import Blueprint, request, jsonify
from datetime import datetime, timezone

from app.middleware.auth import token_required, get_user_id
from app.models.flashcard import Flashcard
from app.services.flashcard_service import FlashcardService
from app.utils.response import success_response, error_response

# Create blueprint
flashcard_bp = Blueprint('flashcards', __name__)

@flashcard_bp.route('/flashcards/from-question/<question_id>', methods=['POST'])
@token_required
def create_flashcard_from_question(question_id):
    """Create a flashcard from a question using Gemini"""
    try:
        # Get user ID from token
        user_id = get_user_id()
        
        # Create flashcard using FlashcardService
        flashcard = FlashcardService.create_flashcard_from_question(question_id, user_id)
        
        # Return success response
        return success_response(
            {"flashcard": flashcard.to_response_dict()},
            "Flashcard criado com sucesso."
        )
    except ValueError as e:
        return error_response(
            str(e),
            "INVALID_REQUEST",
            400
        )
    except Exception as e:
        print(f"Error creating flashcard: {e}")
        return error_response(
            "Erro ao criar flashcard.",
            "INTERNAL_SERVER_ERROR",
            500
        )

@flashcard_bp.route('/flashcards', methods=['POST'])
@token_required
def create_flashcard():
    """Create a new flashcard manually"""
    try:
        # Get user ID from token
        user_id = get_user_id()
        
        # Get request data
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['front', 'back']
        for field in required_fields:
            if field not in data:
                return error_response(f"Campo obrigatório ausente: {field}", "MISSING_FIELD")
        
        # Create flashcard
        flashcard = Flashcard(
            user_id=user_id,
            front=data.get('front'),
            back=data.get('back'),
            tags=data.get('tags', []),
            media_attachments=data.get('mediaAttachments', []),
            user_notes=data.get('userNotes', '')
        )
        
        # Save to Firestore
        flashcard.save()
        
        # Return success response
        return success_response(
            {"flashcard": flashcard.to_response_dict()},
            "Flashcard criado com sucesso."
        )
    except Exception as e:
        print(f"Error creating flashcard: {e}")
        return error_response(
            "Erro ao criar flashcard.",
            "INTERNAL_SERVER_ERROR",
            500
        )

@flashcard_bp.route('/flashcards/<flashcard_id>', methods=['GET'])
@token_required
def get_flashcard(flashcard_id):
    """Get a flashcard by ID"""
    try:
        # Get user ID from token
        user_id = get_user_id()
        
        # Get flashcard from Firestore
        flashcard = Flashcard.get_by_id(flashcard_id)
        
        if not flashcard:
            return error_response("Flashcard não encontrado.", "FLASHCARD_NOT_FOUND", 404)
        
        # Check if user owns this flashcard
        if flashcard.user_id != user_id:
            return error_response("Acesso não autorizado.", "UNAUTHORIZED", 403)
        
        # Return success response
        return success_response(
            {"flashcard": flashcard.to_response_dict()}
        )
    except Exception as e:
        print(f"Error getting flashcard: {e}")
        return error_response(
            "Erro ao obter flashcard.",
            "INTERNAL_SERVER_ERROR",
            500
        )

@flashcard_bp.route('/flashcards/<flashcard_id>', methods=['PUT'])
@token_required
def update_flashcard(flashcard_id):
    """Update a flashcard"""
    try:
        # Get user ID from token
        user_id = get_user_id()
        
        # Get flashcard from Firestore
        flashcard = Flashcard.get_by_id(flashcard_id)
        
        if not flashcard:
            return error_response("Flashcard não encontrado.", "FLASHCARD_NOT_FOUND", 404)
        
        # Check if user owns this flashcard
        if flashcard.user_id != user_id:
            return error_response("Acesso não autorizado.", "UNAUTHORIZED", 403)
        
        # Get request data
        data = request.get_json()
        
        # Update flashcard fields
        if 'front' in data:
            flashcard.front = data['front']
        if 'back' in data:
            flashcard.back = data['back']
        if 'tags' in data:
            flashcard.tags = data['tags']
        if 'mediaAttachments' in data:
            flashcard.media_attachments = data['mediaAttachments']
        if 'userNotes' in data:
            flashcard.user_notes = data['userNotes']
        
        # Save changes
        flashcard.save()
        
        # Return success response
        return success_response(
            {"flashcard": flashcard.to_response_dict()},
            "Flashcard atualizado com sucesso."
        )
    except Exception as e:
        print(f"Error updating flashcard: {e}")
        return error_response(
            "Erro ao atualizar flashcard.",
            "INTERNAL_SERVER_ERROR",
            500
        )

@flashcard_bp.route('/flashcards/<flashcard_id>', methods=['DELETE'])
@token_required
def delete_flashcard(flashcard_id):
    """Delete a flashcard"""
    try:
        # Get user ID from token
        user_id = get_user_id()
        
        # Get flashcard from Firestore
        flashcard = Flashcard.get_by_id(flashcard_id)
        
        if not flashcard:
            return error_response("Flashcard não encontrado.", "FLASHCARD_NOT_FOUND", 404)
        
        # Check if user owns this flashcard
        if flashcard.user_id != user_id:
            return error_response("Acesso não autorizado.", "UNAUTHORIZED", 403)
        
        # Delete flashcard
        Flashcard.delete(flashcard_id)
        
        # Return success response
        return success_response(
            message="Flashcard excluído com sucesso."
        )
    except Exception as e:
        print(f"Error deleting flashcard: {e}")
        return error_response(
            "Erro ao excluir flashcard.",
            "INTERNAL_SERVER_ERROR",
            500
        )

@flashcard_bp.route('/flashcards/<flashcard_id>/review', methods=['POST'])
@token_required
def review_flashcard(flashcard_id):
    """Review a flashcard and update spaced repetition algorithm"""
    try:
        # Get user ID from token
        user_id = get_user_id()
        
        # Get request data
        data = request.get_json()
        
        # Validate required fields
        if 'quality' not in data:
            return error_response("Campo obrigatório ausente: quality", "MISSING_FIELD")
        
        quality = data.get('quality')
        
        # Validate quality
        if not isinstance(quality, int) or quality < 0 or quality > 5:
            return error_response(
                "Qualidade inválida. Deve ser um número entre 0 e 5.",
                "INVALID_QUALITY"
            )
        
        # Get flashcard from Firestore
        flashcard = Flashcard.get_by_id(flashcard_id)
        
        if not flashcard:
            return error_response("Flashcard não encontrado.", "FLASHCARD_NOT_FOUND", 404)
        
        # Check if user owns this flashcard
        if flashcard.user_id != user_id:
            return error_response("Acesso não autorizado.", "UNAUTHORIZED", 403)
        
        # Update spaced repetition algorithm
        flashcard.update_spaced_repetition(quality)
        
        # Return success response
        return success_response(
            {"flashcard": flashcard.to_response_dict()},
            "Revisão registrada com sucesso."
        )
    except Exception as e:
        print(f"Error reviewing flashcard: {e}")
        return error_response(
            "Erro ao revisar flashcard.",
            "INTERNAL_SERVER_ERROR",
            500
        )

@flashcard_bp.route('/flashcards', methods=['GET'])
@token_required
def get_flashcards():
    """Get flashcards for the current user"""
    try:
        # Get user ID from token
        user_id = get_user_id()
        
        # Get query parameters
        filter_type = request.args.get('filter', None)
        limit = int(request.args.get('limit', 50))
        
        # Validate limit
        if limit < 1 or limit > 100:
            limit = 50
        
        # Get flashcards from Firestore
        flashcards = Flashcard.get_by_user_id(user_id, filter_type, limit)
        
        # Convert to response format
        flashcards_response = [flashcard.to_response_dict() for flashcard in flashcards]
        
        # Return success response
        return success_response({
            "flashcards": flashcards_response,
            "total": len(flashcards_response)
        })
    except Exception as e:
        print(f"Error getting flashcards: {e}")
        return error_response(
            "Erro ao obter flashcards.",
            "INTERNAL_SERVER_ERROR",
            500
        )

@flashcard_bp.route('/flashcards/due', methods=['GET'])
@token_required
def get_due_flashcards():
    """Get flashcards due for review today"""
    try:
        # Get user ID from token
        user_id = get_user_id()
        
        # Get flashcards due for review
        flashcards = Flashcard.get_by_user_id(user_id, "due")
        
        # Convert to response format
        flashcards_response = [flashcard.to_response_dict() for flashcard in flashcards]
        
        # Return success response
        return success_response({
            "flashcards": flashcards_response,
            "total": len(flashcards_response)
        })
    except Exception as e:
        print(f"Error getting due flashcards: {e}")
        return error_response(
            "Erro ao obter flashcards para revisão.",
            "INTERNAL_SERVER_ERROR",
            500
        )

@flashcard_bp.route('/flashcards/stats', methods=['GET'])
@token_required
def get_flashcard_stats():
    """Get flashcard statistics for the current user"""
    try:
        # Get user ID from token
        user_id = get_user_id()
        
        results = Flashcard.get_by_user_id(user_id, None)
        
        # Calculate statistics
        total_flashcards = len(results)
        
        now = datetime.now()
        now = datetime.now(timezone.utc)

        due_today = 0
        new_cards = 0
        learning_cards = 0
        review_cards = 0

        
        
        for flashcard in results:
            # Count cards due today
            if flashcard.next_review and flashcard.next_review <= now:
                due_today += 1
            
            # Count new cards (never reviewed)
            if flashcard.repetitions == 0:
                new_cards += 1
            # Count learning cards (repetitions < 3)
            elif flashcard.repetitions < 3:
                learning_cards += 1
            # Count review cards (repetitions >= 3)
            else:
                review_cards += 1
        
        # Return success response
        return success_response({
            "stats": {
                "totalFlashcards": total_flashcards,
                "dueToday": due_today,
                "newCards": new_cards,
                "learningCards": learning_cards,
                "reviewCards": review_cards
            }
        })
    except Exception as e:
        print(f"Error getting flashcard stats: {e}")
        return error_response(
            "Erro ao obter estatísticas de flashcards.",
            "INTERNAL_SERVER_ERROR",
            500
        )
