from flask import Flask
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials
import os
from app.config import FIREBASE_CREDENTIALS, SECRET_KEY

def create_app():
    """Initialize and configure the Flask application"""
    app = Flask(__name__)
    app.config['SECRET_KEY'] = SECRET_KEY
    
    # Initialize CORS
    CORS(app)
    
    # Initialize Firebase if credentials exist
    if os.path.exists(FIREBASE_CREDENTIALS):
        cred = credentials.Certificate(FIREBASE_CREDENTIALS)
        firebase_admin.initialize_app(cred)
    
    # Register blueprints
    from app.routes.exam_routes import exam_bp
    from app.routes.question_routes import question_bp
    from app.routes.chat_routes import chat_bp
    from app.routes.swagger_routes import swagger_bp
    from app.routes.flashcard_routes import flashcard_bp
    from app.routes.research_routes import research_bp
    app.register_blueprint(exam_bp, url_prefix='/v1')
    app.register_blueprint(question_bp, url_prefix='/v1')
    app.register_blueprint(chat_bp, url_prefix='/v1')
    app.register_blueprint(swagger_bp, url_prefix='/v1')
    app.register_blueprint(flashcard_bp, url_prefix='/v1')
    app.register_blueprint(research_bp, url_prefix='/v1')
    
    return app
