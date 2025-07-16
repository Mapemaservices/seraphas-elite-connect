
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import Navigation from '@/components/Navigation';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import Pricing from '@/components/Pricing';
import Footer from '@/components/Footer';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check current session
    const checkAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Index - Current session:', session);
        
        if (session?.user) {
          setIsAuthenticated(true);
          navigate('/dashboard');
          return;
        }
        
        setIsAuthenticated(false);
      } catch (error) {
        console.error('Index - Auth check error:', error);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Index - Auth state changed:', event, session);
      
      if (session?.user) {
        setIsAuthenticated(true);
        navigate('/dashboard');
      } else {
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <Navigation />
      <Hero />
      <Features />
      <Pricing />
      <Footer />
    </div>
  );
};

export default Index;
