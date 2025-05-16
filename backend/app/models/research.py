import uuid
from datetime import datetime
from firebase_admin import firestore

class Research:
    """Model class for Research objects"""
    
    def __init__(self, user_id, topic, content=None, flashcards=None, id=None, created_at=None):
        self.id = id or f"rs_{uuid.uuid4().hex[:8]}"
        self.user_id = user_id
        self.topic = topic
        self.content = content or ""
        self.flashcards = flashcards or []
        self.created_at = created_at or datetime.utcnow()
    
    def to_dict(self):
        """Convert research object to dictionary for Firestore"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "topic": self.topic,
            "content": self.content,
            "flashcards": self.flashcards,
            "created_at": self.created_at
        }
    
    def to_response_dict(self):
        """Convert research object to API response format"""
        return {
            "id": self.id,
            "userId": self.user_id,
            "topic": self.topic,
            "content": self.content,
            "flashcards": self.flashcards,
            "createdAt": self.created_at.isoformat() if self.created_at else None
        }
    
    @classmethod
    def from_dict(cls, data):
        """Create a Research object from Firestore data"""
        return cls(
            id=data.get("id"),
            user_id=data.get("user_id"),
            topic=data.get("topic"),
            content=data.get("content", ""),
            flashcards=data.get("flashcards", []),
            created_at=data.get("created_at")
        )
    
    def save(self):
        """Save research to Firestore"""
        db = firestore.client()
        doc_ref = db.collection("researches").document(self.id)
        doc_ref.set(self.to_dict())
        return self
    
    @staticmethod
    def get_by_id(research_id):
        """Retrieve a research by ID from Firestore"""
        db = firestore.client()
        doc_ref = db.collection("researches").document(research_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return None
            
        return Research.from_dict(doc.to_dict())
    
    @staticmethod
    def get_by_user_id(user_id, limit=50):
        """Retrieve researches for a specific user"""
        db = firestore.client()
        query = db.collection("researches").where("user_id", "==", user_id)
        
        # Execute query with limit
        results = list(query.limit(limit).stream())
        
        # Convert to Research objects
        researches = [Research.from_dict(doc.to_dict()) for doc in results]
        
        return researches
    
    @staticmethod
    def delete(research_id):
        """Delete a research from Firestore"""
        db = firestore.client()
        doc_ref = db.collection("researches").document(research_id)
        doc_ref.delete()
        return True
