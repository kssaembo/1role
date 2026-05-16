import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';

// Pages
import LandingPage from './pages/LandingPage';
import TeacherDashboard from './pages/TeacherDashboard';
import AuthPage from './pages/AuthPage';
import StudentApplication from './pages/StudentApplication';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage user={user} />} />
        
        {/* Teacher Routes */}
        <Route path="/teacher/auth" element={!user ? <AuthPage /> : <Navigate to="/teacher/dashboard" />} />
        <Route 
          path="/teacher/*" 
          element={user ? <TeacherDashboard user={user} /> : <Navigate to="/teacher/auth" />} 
        />

        {/* Student Routes */}
        <Route path="/student/apply/:teacherId" element={<StudentApplication />} />
        
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}
