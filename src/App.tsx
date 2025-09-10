import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { storage, User } from '@/lib/storage';
import { Layout } from '@/components/Layout';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { StudentDashboard } from '@/pages/student/Dashboard';
import { CoursePage } from '@/pages/student/CoursePage';
import { LessonPage } from '@/pages/student/LessonPage';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize default data
    storage.initializeDefaultData();
    
    // Check for existing user session
    const user = storage.getCurrentUser();
    if (user) {
      setCurrentUser(user);
    }
    
    setIsLoading(false);
  }, []);

  const handleLogin = (username: string, password: string): boolean => {
    if (username === 'admin' && password === '123') {
      const adminUser = storage.getUsers().find(u => u.id === 'admin');
      if (adminUser) {
        // Update last activity
        adminUser.lastActivity = new Date().toISOString();
        storage.saveUser(adminUser);
        storage.setCurrentUser(adminUser.id);
        setCurrentUser(adminUser);
        return true;
      }
    }
    return false;
  };

  const handleRegister = (name: string, department: string): void => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      department,
      role: 'student',
      lastActivity: new Date().toISOString()
    };
    
    storage.saveUser(newUser);
    storage.setCurrentUser(newUser.id);
    setCurrentUser(newUser);
  };

  const handleLogout = (): void => {
    storage.logout();
    setCurrentUser(null);
    setShowRegisterForm(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-lg">LMS</span>
          </div>
          <p className="text-white">Загрузка...</p>
        </div>
      </div>
    );
  }

  // Authentication flow
  if (!currentUser) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {showRegisterForm ? (
            <RegisterForm
              onRegister={handleRegister}
              onSwitchToLogin={() => setShowRegisterForm(false)}
            />
          ) : (
            <LoginForm
              onLogin={handleLogin}
              onSwitchToRegister={() => setShowRegisterForm(true)}
            />
          )}
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  // Main application
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Layout user={currentUser} onLogout={handleLogout}>
            <Routes>
              {currentUser.role === 'admin' ? (
                <>
                  <Route path="/" element={<AdminDashboard />} />
                  <Route path="*" element={<NotFound />} />
                </>
              ) : (
                <>
                  <Route path="/" element={<StudentDashboard />} />
                  <Route path="/course/:courseId" element={<CoursePage />} />
                  <Route path="/lesson/:lessonId" element={<LessonPage />} />
                  <Route path="*" element={<NotFound />} />
                </>
              )}
            </Routes>
          </Layout>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
