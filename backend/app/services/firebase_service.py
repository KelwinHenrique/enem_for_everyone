from firebase_admin import firestore, auth
from datetime import datetime

class FirebaseService:
    """Service for interacting with Firebase (Firestore and Authentication)"""
    
    @staticmethod
    def get_db():
        """Get Firestore database instance"""
        return firestore.client()
    
    @staticmethod
    def verify_token(token):
        """Verify Firebase auth token and return user data"""
        try:
            decoded_token = auth.verify_id_token(token)
            return decoded_token
        except Exception as e:
            print(f"Error verifying token: {e}")
            return None
    
    @classmethod
    def get_user_by_id(cls, user_id):
        """Get user data from Firestore by user ID"""
        db = cls.get_db()
        user_doc = db.collection('users').document(user_id).get()
        
        if user_doc.exists:
            return user_doc.to_dict()
        return None
    
    @classmethod
    def create_or_update_user(cls, user_data):
        """Create or update user in Firestore"""
        db = cls.get_db()
        user_id = user_data.get('uid')
        
        if not user_id:
            raise ValueError("User ID is required")
        
        # Check if user exists
        user_ref = db.collection('users').document(user_id)
        user_doc = user_ref.get()
        
        if user_doc.exists:
            # Update existing user
            user_ref.update({
                'last_login': datetime.utcnow(),
                'email': user_data.get('email'),
                'display_name': user_data.get('name'),
                # Add other fields as needed
            })
        else:
            # Create new user
            user_ref.set({
                'uid': user_id,
                'email': user_data.get('email'),
                'display_name': user_data.get('name'),
                'created_at': datetime.utcnow(),
                'last_login': datetime.utcnow(),
                # Add other fields as needed
            })
        
        return user_id
    
    @classmethod
    def save_exam_result(cls, exam_id, user_id, answers, score, time_spent):
        """Save exam result to Firestore"""
        db = cls.get_db()
        
        # Get the exam
        exam_ref = db.collection('exams').document(exam_id)
        exam_doc = exam_ref.get()
        
        if not exam_doc.exists:
            raise ValueError(f"Exam with ID {exam_id} not found")
        
        exam_data = exam_doc.to_dict()
        
        # Verify user owns the exam
        if exam_data.get('user_id') != user_id:
            raise ValueError("User does not have permission to access this exam")
        
        # Update exam status
        exam_ref.update({
            'status': 'completed',
            'completed_at': datetime.utcnow(),
            'score': score,
            'time_spent': time_spent,
            'user_answers': answers
        })
        
        # Save detailed result in a separate collection
        result_ref = db.collection('exam_results').document(f"{exam_id}_{user_id}")
        result_ref.set({
            'exam_id': exam_id,
            'user_id': user_id,
            'score': score,
            'total_questions': len(exam_data.get('questions', [])),
            'correct_answers': int(score * len(exam_data.get('questions', [])) / 10),
            'time_spent': time_spent,
            'completed_at': datetime.utcnow(),
            'answers': answers
        })
        
        return result_ref.id
