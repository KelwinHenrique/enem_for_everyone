import uuid
from firebase_admin import firestore

class Question:
    """Model class for Question objects"""
    
    def __init__(self, text, options, correct_answer, explanation, subject, 
                 user_id, topic=None, difficulty=None, id=None, ratings=None, possible_questions=None):
        self.id = id or f"q_{uuid.uuid4().hex[:8]}"
        self.text = text
        self.options = options
        self.correct_answer = correct_answer
        self.explanation = explanation
        self.subject = subject
        self.user_id = user_id
        self.topic = topic or ""
        self.difficulty = difficulty or "medium"
        self.ratings = ratings or []
        self.possible_questions = possible_questions or []
    
    def to_dict(self):
        """Convert question object to dictionary for Firestore"""
        return {
            "id": self.id,
            "text": self.text,
            "options": self.options,
            "correct_answer": self.correct_answer,
            "explanation": self.explanation,
            "subject": self.subject,
            "user_id": self.user_id,
            "topic": self.topic,
            "difficulty": self.difficulty,
            "ratings": self.ratings,
            "possible_questions": self.possible_questions
        }
    
    def to_response_dict(self):
        """Convert question object to API response format"""
        return {
            "id": self.id,
            "text": self.text,
            "options": self.options,
            "correctAnswer": self.correct_answer,
            "explanation": self.explanation,
            "subject": self.subject,
            "userId": self.user_id,
            "topic": self.topic,
            "difficulty": self.difficulty,
            "ratings": self.ratings,
            "possibleQuestions": self.possible_questions
        }
    
    @classmethod
    def from_dict(cls, data):
        """Create a Question object from Firestore data"""
        return cls(
            id=data.get("id"),
            text=data.get("text"),
            options=data.get("options", []),
            correct_answer=data.get("correct_answer"),
            explanation=data.get("explanation"),
            subject=data.get("subject"),
            user_id=data.get("user_id"),
            topic=data.get("topic"),
            difficulty=data.get("difficulty"),
            ratings=data.get("ratings", []),
            possible_questions=data.get("possible_questions", [])
        )
    
    @staticmethod
    def save_batch(questions, user_id):
        """Save multiple questions to Firestore in a batch"""
        db = firestore.client()
        batch = db.batch()
        
        for question in questions:
            # Ensure the question has the user_id
            if isinstance(question, Question):
                question.user_id = user_id
            elif isinstance(question, dict):
                question["user_id"] = user_id
                
            # Convert to Question object if it's a dict
            if isinstance(question, dict):
                question = Question.from_dict(question)
                
            # Add to batch
            doc_ref = db.collection("questions").document(question.id)
            batch.set(doc_ref, question.to_dict())
        
        # Commit the batch
        batch.commit()
        return questions
        
    @staticmethod
    def get_by_id(question_id):
        """Retrieve a question by ID from Firestore"""
        db = firestore.client()
        doc_ref = db.collection("questions").document(question_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return None
            
        return Question.from_dict(doc.to_dict())
    
    @staticmethod
    def get_by_ids(question_ids):
        """Retrieve multiple questions by their IDs"""
        if not question_ids:
            return []
            
        db = firestore.client()
        questions = []
        
        # Firestore has a limit of 10 items in a 'in' query
        # So we need to batch our requests if we have more than 10 IDs
        for i in range(0, len(question_ids), 10):
            batch_ids = question_ids[i:i+10]
            docs = db.collection("questions").where("id", "in", batch_ids).stream()
            questions.extend([Question.from_dict(doc.to_dict()) for doc in docs])
        
        return questions
    
    def add_rating(self, user_id, rating):
        """Add a rating to the question"""
        # Rating should be between 1-5
        if not 1 <= rating <= 5:
            raise ValueError("Rating must be between 1 and 5")
            
        # Check if user has already rated this question
        for i, r in enumerate(self.ratings):
            if r.get("user_id") == user_id:
                # Update existing rating
                self.ratings[i] = {"user_id": user_id, "rating": rating, "timestamp": datetime.utcnow()}
                break
        else:
            # Add new rating
            from datetime import datetime
            self.ratings.append({"user_id": user_id, "rating": rating, "timestamp": datetime.utcnow()})
        
        # Save to Firestore
        db = firestore.client()
        db.collection("questions").document(self.id).update({"ratings": self.ratings})
        return self
    
    def get_average_rating(self):
        """Calculate the average rating for this question"""
        if not self.ratings:
            return 0
            
        total = sum(r.get("rating", 0) for r in self.ratings)
        return total / len(self.ratings)
