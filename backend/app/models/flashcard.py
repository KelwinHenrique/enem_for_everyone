import uuid
from datetime import datetime, timedelta
from firebase_admin import firestore

class Flashcard:
    """Model class for Flashcard objects with spaced repetition algorithm"""
    
    def __init__(self, user_id, front, back, tags=None, id=None, ease_factor=2.5, 
                 interval=0, repetitions=0, next_review=None, last_review=None,
                 media_attachments=None, user_notes=None, question_id=None):
        self.id = id or f"fc_{uuid.uuid4().hex[:8]}"
        self.user_id = user_id
        self.front = front
        self.back = back
        self.tags = tags or []
        self.created_at = datetime.utcnow()
        
        # Spaced repetition algorithm data
        self.ease_factor = ease_factor  # difficulty factor (starts at 2.5)
        self.interval = interval  # days until next review
        self.repetitions = repetitions  # consecutive successful reviews
        self.next_review = next_review or datetime.utcnow()  # scheduled date for next review
        self.last_review = last_review  # date of most recent review
        
        # Optional metadata
        self.media_attachments = media_attachments or []
        self.user_notes = user_notes or ""
        self.question_id = question_id  # reference to the original question
    
    def to_dict(self):
        """Convert flashcard object to dictionary for Firestore"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "front": self.front,
            "back": self.back,
            "tags": self.tags,
            "created_at": self.created_at,
            "ease_factor": self.ease_factor,
            "interval": self.interval,
            "repetitions": self.repetitions,
            "next_review": self.next_review,
            "last_review": self.last_review,
            "media_attachments": self.media_attachments,
            "user_notes": self.user_notes,
            "question_id": self.question_id
        }
    
    def to_response_dict(self):
        """Convert flashcard object to API response format"""
        return {
            "id": self.id,
            "userId": self.user_id,
            "front": self.front,
            "back": self.back,
            "tags": self.tags,
            "createdAt": self.created_at.isoformat() if self.created_at else None,
            "easeFactor": self.ease_factor,
            "interval": self.interval,
            "repetitions": self.repetitions,
            "nextReview": self.next_review.isoformat() if self.next_review else None,
            "lastReview": self.last_review.isoformat() if self.last_review else None,
            "mediaAttachments": self.media_attachments,
            "userNotes": self.user_notes,
            "questionId": self.question_id
        }
    
    @classmethod
    def from_dict(cls, data):
        """Create a Flashcard object from Firestore data"""
        # Convert Firestore timestamps to datetime objects
        # created_at = data.get("created_at")
        # if isinstance(created_at, firestore.SERVER_TIMESTAMP):
        #     created_at = datetime.utcnow()
            
        # next_review = data.get("next_review")
        # if isinstance(next_review, str):
        #     try:
        #         next_review = datetime.fromisoformat(next_review)
        #     except ValueError:
        #         next_review = datetime.utcnow()
                
        # last_review = data.get("last_review")
        # if isinstance(last_review, str) and last_review:
        #     try:
        #         last_review = datetime.fromisoformat(last_review)
        #     except ValueError:
        #         last_review = None
        
        return cls(
            id=data.get("id"),
            user_id=data.get("user_id"),
            front=data.get("front"),
            back=data.get("back"),
            tags=data.get("tags", []),
            ease_factor=data.get("ease_factor", 2.5),
            interval=data.get("interval", 0),
            repetitions=data.get("repetitions", 0),
            next_review=data.get("next_review"),
            last_review=data.get("last_review"),
            media_attachments=data.get("media_attachments", []),
            user_notes=data.get("user_notes", ""),
            question_id=data.get("question_id")
        )
    
    def update_spaced_repetition(self, quality):
        """
        Update flashcard using the SuperMemo-2 spaced repetition algorithm
        
        quality: Integer from 0-5 representing how well the user recalled the card
        0 - Complete blackout, failure to recall
        1 - Incorrect response, but upon seeing the answer, it felt familiar
        2 - Incorrect response, but upon seeing the answer, it seemed easy to recall
        3 - Correct response, but required significant effort to recall
        4 - Correct response, after some hesitation
        5 - Correct response, perfect recall
        """
        self.last_review = datetime.utcnow()
        
        # If quality < 3, reset repetitions (user failed to recall correctly)
        if quality < 3:
            self.repetitions = 0
            self.interval = 1
        else:
            # Update repetitions and interval
            if self.repetitions == 0:
                self.interval = 1
            elif self.repetitions == 1:
                self.interval = 6
            else:
                self.interval = round(self.interval * self.ease_factor)
            
            self.repetitions += 1
        
        # Update ease factor based on quality
        self.ease_factor += (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
        
        # Ensure ease factor doesn't go below 1.3
        if self.ease_factor < 1.3:
            self.ease_factor = 1.3
        
        # Calculate next review date
        self.next_review = datetime.utcnow() + timedelta(days=self.interval)
        
        # Save changes to Firestore
        self.save()
        
        return self
    
    def save(self):
        """Save flashcard to Firestore"""
        db = firestore.client()
        doc_ref = db.collection("flashcards").document(self.id)
        doc_ref.set(self.to_dict())
        return self
    
    @staticmethod
    def get_by_id(flashcard_id):
        """Retrieve a flashcard by ID from Firestore"""
        db = firestore.client()
        doc_ref = db.collection("flashcards").document(flashcard_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            return None
            
        return Flashcard.from_dict(doc.to_dict())
    
    @staticmethod
    def get_by_user_id(user_id, filter_type=None, limit=50):
        """
        Retrieve flashcards for a specific user
        
        filter_type: Optional filter for flashcards
            - "due": Cards due for review today
            - "new": Cards that have never been reviewed
            - "learning": Cards in the learning phase (repetitions < 3)
            - "review": Cards in the review phase (repetitions >= 3)
        """
        db = firestore.client()
        query = db.collection("flashcards").where("user_id", "==", user_id)
        
        # Apply filter if specified
        if filter_type == "due":
            now = datetime.utcnow()
            query = query.where("next_review", "<=", now)
        elif filter_type == "new":
            query = query.where("repetitions", "==", 0)
        elif filter_type == "learning":
            query = query.where("repetitions", "<", 3)
        elif filter_type == "review":
            query = query.where("repetitions", ">=", 3)
        
        # Execute query with limit
        results = list(query.limit(limit).stream())
        
        # Convert to Flashcard objects
        flashcards = [Flashcard.from_dict(doc.to_dict()) for doc in results]
        
        return flashcards
    
    @staticmethod
    def delete(flashcard_id):
        """Delete a flashcard from Firestore"""
        db = firestore.client()
        doc_ref = db.collection("flashcards").document(flashcard_id)
        doc_ref.delete()
        return True
