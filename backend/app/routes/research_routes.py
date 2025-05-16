from flask import Blueprint, request, jsonify
from app.services.research_service import ResearchService
from app.middleware.auth import token_required, get_user_id

# Create blueprint for research routes
research_bp = Blueprint('research', __name__)

@research_bp.route('/research/create', methods=['POST'])
@token_required
def create_research():
    """
    Create a new research
    ---
    tags:
      - Research
    security:
      - BearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - topic
            properties:
              topic:
                type: string
                description: The topic or question for the research
    responses:
      201:
        description: Research created successfully
      400:
        description: Invalid request
      401:
        description: Unauthorized
      500:
        description: Server error
    """
    data = request.get_json()
    
    # Validate request data
    if not data or 'topic' not in data:
        return jsonify({'error': 'Topic is required'}), 400
    
    topic = data.get('topic')
    user_id = get_user_id()
    
    try:
        # Create research using the service
        research = ResearchService.create_research(user_id, topic)
        
        # Return the created research
        return jsonify(research.to_response_dict()), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@research_bp.route('/research', methods=['GET'])
@token_required
def get_researches():
    """
    Get all researches for the current user
    ---
    tags:
      - Research
    security:
      - BearerAuth: []
    parameters:
      - name: limit
        in: query
        schema:
          type: integer
        description: Maximum number of researches to return
    responses:
      200:
        description: List of researches
      401:
        description: Unauthorized
      500:
        description: Server error
    """
    user_id = get_user_id()
    limit = request.args.get('limit', default=50, type=int)
    
    try:
        # Get researches for the user
        researches = ResearchService.get_researches_by_user_id(user_id, limit)
        
        # Return the researches
        return jsonify([research.to_response_dict() for research in researches]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@research_bp.route('/research/<research_id>', methods=['GET'])
@token_required
def get_research(research_id):
    """
    Get a specific research by ID
    ---
    tags:
      - Research
    security:
      - BearerAuth: []
    parameters:
      - name: research_id
        in: path
        required: true
        schema:
          type: string
        description: ID of the research to retrieve
    responses:
      200:
        description: Research details
      401:
        description: Unauthorized
      404:
        description: Research not found
      500:
        description: Server error
    """
    user_id = get_user_id()
    
    try:
        # Get the research by ID
        research = ResearchService.get_research_by_id(research_id)
        
        # Check if research exists
        if not research:
            return jsonify({'error': 'Research not found'}), 404
        
        # Check if the research belongs to the user
        if research.user_id != user_id:
            return jsonify({'error': 'Unauthorized access to this research'}), 403
        
        # Return the research
        return jsonify(research.to_response_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500
