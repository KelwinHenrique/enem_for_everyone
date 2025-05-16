from datetime import datetime, timedelta
import uuid
from firebase_admin import firestore

class Exam:
    """Model class for Exam objects"""
    
    def __init__(self, user_id, exam_type, question_count, estimated_time, 
                 content_selection, title=None, question_ids=None, id=None):
        self.id = id or f"exam_{uuid.uuid4().hex[:8]}"
        self.user_id = user_id
        self.title = title or self._generate_title(exam_type, content_selection)
        self.exam_type = exam_type
        self.question_count = question_count
        self.estimated_time = estimated_time
        self.content_selection = content_selection
        self.question_ids = question_ids or []
        self.created_at = datetime.utcnow()
        self.expires_at = self.created_at + timedelta(days=30)  # Exams expire after 30 days
        self.status = "generating"  # Initial status
        
    def _generate_title(self, exam_type, content_selection):
        """Generate a title based on exam type and content selection"""
        if exam_type == "complete":
            title = "Simulado Completo"
        elif exam_type == "quick":
            title = "Simulado Rápido"
        else:
            title = "Simulado Personalizado"
        
        if content_selection.get("method") == "subject":
            subject = content_selection.get("subject")
            if subject and subject != "all":
                subject_names = {
                    "mathematics": "Matemática",
                    "languages": "Linguagens",
                    "human_sciences": "Ciências Humanas",
                    "natural_sciences": "Ciências da Natureza"
                }
                title += f" - {subject_names.get(subject, subject)}"
        elif content_selection.get("method") == "topic":
            custom_topic = content_selection.get("customTopic")
            if custom_topic:
                title += f" - {custom_topic}"
                
        return title
    
    def to_dict(self):
        """Convert exam object to dictionary for Firestore"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "title": self.title,
            "created_at": self.created_at,
            "expires_at": self.expires_at,
            "status": self.status,
            "config": {
                "type": self.exam_type,
                "question_count": self.question_count,
                "time_limit": self.estimated_time,
                "content_type": self.content_selection.get("method"),
                "subject": self.content_selection.get("subject", ""),
                "custom_topic": self.content_selection.get("customTopic", "")
            },
            "question_ids": self.question_ids
        }
    
    def to_response_dict(self, include_questions=True):
        """Convert exam object to API response format"""
        response = {
            "id": self.id,
            "title": self.title,
            "createdAt": self.created_at.isoformat() + "Z",
            "expiresAt": self.expires_at.isoformat() + "Z",
            "status": self.status,
            "config": {
                "type": self.exam_type,
                "questionCount": self.question_count,
                "timeLimit": self.estimated_time,
                "contentType": self.content_selection.get("method"),
                "subject": self.content_selection.get("subject", ""),
                "customTopic": self.content_selection.get("customTopic", "")
            }
        }
        
        if include_questions and self.question_ids:
            # Fetch questions from the questions collection
            from app.models.question import Question
            questions = Question.get_by_ids(self.question_ids)
            response["questions"] = [q.to_response_dict() for q in questions]
            
        # Add redirect URL for frontend
        response["redirectUrl"] = f"/exam/start/{self.id}"
        
        return response
    
    @classmethod
    def from_dict(cls, data):
        """Create an Exam object from Firestore data"""
        config = data.get("config", {})
        content_selection = {
            "method": config.get("content_type", "subject"),
            "subject": config.get("subject", ""),
            "customTopic": config.get("custom_topic", "")
        }
        
        exam = cls(
            user_id=data.get("user_id"),
            exam_type=config.get("type"),
            question_count=config.get("question_count"),
            estimated_time=config.get("time_limit"),
            content_selection=content_selection,
            title=data.get("title"),
            id=data.get("id")
        )
        
        # Set other attributes from data
        if "created_at" in data:
            exam.created_at = data["created_at"]
        if "expires_at" in data:
            exam.expires_at = data["expires_at"]
        if "status" in data:
            exam.status = data["status"]
        if "question_ids" in data:
            exam.question_ids = data["question_ids"]
        # For backward compatibility with old exams
        elif "questions" in data:
            from app.models.question import Question
            # If questions are stored as dicts, we need to save them to the questions collection
            # and store their IDs instead
            questions = []
            question_ids = []
            for q in data["questions"]:
                if isinstance(q, dict):
                    question = Question.from_dict(q)
                    questions.append(question)
                    question_ids.append(question.id)
                else:
                    question_ids.append(q)
            
            # Save questions to Firestore if needed
            if questions:
                Question.save_batch(questions, data.get("user_id"))
            
            exam.question_ids = question_ids
            
        return exam
    
    @staticmethod
    def get_by_id(exam_id, user_id=None):
        """Retrieve an exam by ID from Firestore"""
        db = firestore.client()
        doc_ref = db.collection("exams").document(exam_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return None
            
        exam_data = doc.to_dict()
        
        # Check if the exam belongs to the user
        if user_id and exam_data.get("user_id") != user_id:
            return None
            
        return Exam.from_dict(exam_data)
    
    def save(self):
        """Save the exam to Firestore"""
        db = firestore.client()
        db.collection("exams").document(self.id).set(self.to_dict())
        return self
    
    def update(self, data):
        """Update exam with new data"""
        for key, value in data.items():
            setattr(self, key, value)
        return self.save()
    
    @staticmethod
    def get_user_exams(user_id, status=None, page=1, limit=10):
        """Get exams for a specific user with pagination"""
        db = firestore.client()
        query = db.collection("exams").where("user_id", "==", user_id)
        
        if status:
            query = query.where("status", "==", status)
            
        # Order by creation date (newest first)
        query = query.order_by("created_at", direction=firestore.Query.DESCENDING)
        
        # Calculate pagination
        offset = (page - 1) * limit
        
        # Get total count (inefficient in Firestore, but necessary for pagination)
        total_docs = list(query.stream())
        total = len(total_docs)
        total_pages = (total + limit - 1) // limit
        
        # Apply pagination
        query = query.limit(limit).offset(offset)
        
        # Execute query
        results = query.stream()
        exams = [Exam.from_dict(doc.to_dict()) for doc in results]
        
        return {
            "exams": exams,
            "pagination": {
                "total": total,
                "pages": total_pages,
                "currentPage": page,
                "limit": limit
            }
        }
