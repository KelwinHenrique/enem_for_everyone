import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { useAuth } from './contexts/AuthContext';
import Login from './components/Login/Login';
import Dashboard from './components/Dashboard/Dashboard';
import ExamConfiguration from './components/Exams/ExamConfiguration';
import ExamRouter from './components/Exams/ExamRouter';
import ExamResult from './components/Exams/ExamResult';
import ExamTest from './components/ExamTest';
import { 
  Flashcards, 
  FlashcardCreate, 
  FlashcardEdit, 
  FlashcardList, 
  FlashcardReview,
  FlashcardFromQuestion 
} from './components/Flashcards';
import Research from './components/Research';
import './App.css';

// Component for protected routes that require authentication
const PrivateRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { currentUser } = useAuth();
  return currentUser ? element : <Navigate to="/login" />;
};

// Component to redirect authenticated users from the login page
const PublicRoute: React.FC<{ element: React.ReactElement }> = ({ element }) => {
  const { currentUser } = useAuth();
  return currentUser ? <Navigate to="/dashboard" /> : element;
};

const AppRoutes: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<PublicRoute element={<Login />} />} />
        <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
        <Route path="/exams/configuration" element={<PrivateRoute element={<ExamConfiguration />} />} />
        <Route path="/exams/simulation/:examId" element={<PrivateRoute element={<ExamRouter />} />} />
        <Route path="/exams/result" element={<PrivateRoute element={<ExamResult />} />} />
        <Route path="/exams/test" element={<PrivateRoute element={<ExamTest />} />} />
        
        {/* Flashcards Routes */}
        <Route path="/flashcards" element={<PrivateRoute element={<Flashcards />} />} />
        <Route path="/flashcards/create" element={<PrivateRoute element={<FlashcardCreate />} />} />
        <Route path="/flashcards/edit/:flashcardId" element={<PrivateRoute element={<FlashcardEdit />} />} />
        <Route path="/flashcards/all" element={<PrivateRoute element={<FlashcardList />} />} />
        <Route path="/flashcards/review" element={<PrivateRoute element={<FlashcardReview />} />} />
        <Route path="/flashcards/from-question/:questionId" element={<PrivateRoute element={<FlashcardFromQuestion />} />} />
        
        {/* Research Routes */}
        <Route path="/research/*" element={<PrivateRoute element={<Research />} />} />
        <Route path="/" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </NotificationProvider>
  );
}

export default App;
