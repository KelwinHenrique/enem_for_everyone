from flask import Blueprint, request, jsonify

from app.middleware.auth import token_required, get_user_id
from app.models.question import Question
from app.utils.response import success_response, error_response

# Create blueprint
question_bp = Blueprint('questions', __name__)

@question_bp.route('/questions/<question_id>/rate', methods=['POST'])
@token_required
def rate_question(question_id):
    """Rate a question"""
    try:
        # Get user ID from token
        user_id = get_user_id()
        
        # Get request data
        data = request.get_json()
        
        # Validate required fields
        if 'rating' not in data:
            return error_response("Campo obrigatório ausente: rating", "MISSING_FIELD")
        
        rating = data.get('rating')
        
        # Validate rating
        if not isinstance(rating, int) or rating < 1 or rating > 5:
            return error_response(
                "Classificação inválida. Deve ser um número entre 1 e 5.",
                "INVALID_RATING"
            )
        
        # Get question from Firestore
        question = Question.get_by_id(question_id)
        
        if not question:
            return error_response("Questão não encontrada.", "QUESTION_NOT_FOUND", 404)
        
        # Add rating
        question.add_rating(user_id, rating)
        
        # Return success response
        return success_response(
            {"question": question.to_response_dict()},
            "Questão classificada com sucesso."
        )
    except Exception as e:
        print(f"Error rating question: {e}")
        return error_response(
            "Erro ao classificar questão.",
            "INTERNAL_SERVER_ERROR",
            500
        )

@question_bp.route('/questions/errors', methods=['GET'])
@token_required
def get_error_questions():
    """Get questions with low ratings for review"""
    try:
        # Get user ID from token
        user_id = get_user_id()
        
        # Get query parameters
        threshold = float(request.args.get('threshold', 3.0))
        limit = int(request.args.get('limit', 10))
        
        # Validate parameters
        if threshold < 1 or threshold > 5:
            threshold = 3.0
        if limit < 1 or limit > 50:
            limit = 10
        
        # Get questions from Firestore
        db = Question.firestore.client()
        query = db.collection("questions").where("user_id", "==", user_id)
        
        # Execute query
        results = list(query.stream())
        
        # Filter questions with ratings below threshold
        error_questions = []
        for doc in results:
            question = Question.from_dict(doc.to_dict())
            avg_rating = question.get_average_rating()
            if avg_rating > 0 and avg_rating <= threshold:
                error_questions.append({
                    "question": question.to_response_dict(),
                    "averageRating": avg_rating
                })
        
        # Sort by average rating (lowest first) and limit results
        error_questions.sort(key=lambda x: x["averageRating"])
        error_questions = error_questions[:limit]
        
        # Return response
        return success_response({
            "errorQuestions": error_questions,
            "total": len(error_questions)
        })
    except Exception as e:
        print(f"Error getting error questions: {e}")
        return error_response(
            "Erro ao obter questões com erros.",
            "INTERNAL_SERVER_ERROR",
            500
        )
