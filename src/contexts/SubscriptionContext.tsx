
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionContextType {
  isPremium: boolean;
  isLoading: boolean;
  checkSubscription: () => Promise<void>;
  createCheckout: (priceType: 'monthly' | 'yearly') => Promise<void>;
  manageBilling: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const checkSubscription = async () => {
    try {
      console.log('Checking subscription status...');
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.log('No session found, setting isPremium to false');
        setIsPremium(false);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.error('Error checking subscription:', error);
        throw error;
      }
      
      console.log('Subscription check result:', data);
      setIsPremium(data?.is_premium || false);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setIsPremium(false);
    } finally {
      setIsLoading(false);
    }
  };

  const createCheckout = async (priceType: 'monthly' | 'yearly') => {
    try {
      console.log('Creating checkout session for:', priceType);
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceType }
      });

      if (error) {
        console.error('Checkout error:', error);
        throw error;
      }

      console.log('Checkout session created:', data);

      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error) {
      console.error('Error creating checkout:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create checkout session. Please try again.",
        variant: "destructive"
      });
    }
  };

  const manageBilling = async () => {
    try {
      console.log('Opening billing portal...');
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) {
        console.error('Billing portal error:', error);
        throw error;
      }

      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error) {
      console.error('Error accessing billing portal:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to access billing portal. Please try again.",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    checkSubscription();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        checkSubscription();
      } else if (event === 'SIGNED_OUT') {
        setIsPremium(false);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <SubscriptionContext.Provider value={{
      isPremium,
      isLoading,
      checkSubscription,
      createCheckout,
      manageBilling
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};
