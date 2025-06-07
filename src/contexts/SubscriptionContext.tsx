
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionContextType {
  isSubscribed: boolean;
  subscriptionTier: string | null;
  trialEnded: boolean;
  loading: boolean;
  checkSubscription: () => Promise<void>;
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
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState<string | null>(null);
  const [trialEnded, setTrialEnded] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkSubscription = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Check if user exists in subscribers table
      const { data: subscriber, error } = await supabase
        .from('subscribers')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking subscription:', error);
        setLoading(false);
        return;
      }

      if (!subscriber) {
        // Create new subscriber with 2-day trial
        const { error: insertError } = await supabase
          .from('subscribers')
          .insert({
            user_id: user.id,
            email: user.email!,
            subscribed: false,
            trial_end: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
          });

        if (insertError) {
          console.error('Error creating subscriber:', insertError);
        }

        setIsSubscribed(false);
        setSubscriptionTier(null);
        setTrialEnded(false);
      } else {
        setIsSubscribed(subscriber.subscribed);
        setSubscriptionTier(subscriber.subscription_tier);
        
        // Check if trial has ended
        const trialEnd = new Date(subscriber.trial_end);
        const now = new Date();
        setTrialEnded(now > trialEnd);
      }
    } catch (error) {
      console.error('Error in checkSubscription:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkSubscription();
    } else {
      setLoading(false);
    }
  }, [user]);

  const value = {
    isSubscribed,
    subscriptionTier,
    trialEnded,
    loading,
    checkSubscription,
  };

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
};
