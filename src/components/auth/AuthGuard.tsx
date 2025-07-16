
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from "@/integrations/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { Navigation } from "@/components/layout/Navigation";
import { Heart } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import type { User } from '@supabase/supabase-js';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard = ({ children }: AuthGuardProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isPremium } = useSubscription();

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('AuthGuard - Getting session:', { session, error });
        
        if (error) {
          console.error('AuthGuard - Session error:', error);
          toast({
            title: "Authentication Error",
            description: "There was an issue with your session. Please try logging in again.",
            variant: "destructive"
          });
          navigate('/login');
          return;
        }
        
        if (session?.user) {
          console.log('AuthGuard - User found:', session.user);
          setUser(session.user);
        } else {
          console.log('AuthGuard - No user, redirecting to login');
          navigate('/login');
        }
      } catch (error) {
        console.error('AuthGuard - Unexpected error:', error);
        toast({
          title: "Authentication Error",
          description: "An unexpected error occurred. Please try logging in again.",
          variant: "destructive"
        });
        navigate('/login');
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AuthGuard - Auth state changed:', event, session);
      
      if (event === 'SIGNED_OUT' || !session) {
        console.log('AuthGuard - User signed out or no session');
        setUser(null);
        navigate('/login');
      } else if (session?.user) {
        console.log('AuthGuard - User signed in:', session.user);
        setUser(session.user);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <Heart className="w-8 h-8 text-pink-500 animate-pulse mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-indigo-50">
      <Navigation user={user} isPremium={isPremium} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};
