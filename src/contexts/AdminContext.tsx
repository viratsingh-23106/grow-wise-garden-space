
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AdminContextType {
  isAdminAuthenticated: boolean;
  adminSessionToken: string | null;
  loading: boolean;
  validateAdminSecret: (secret: string) => Promise<boolean>;
  logAdminActivity: (action: string, entityType: string, entityId?: string, details?: any) => Promise<void>;
  signOutAdmin: () => void;
}

interface AdminSecretResponse {
  success: boolean;
  session_token?: string;
  error?: string;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminSessionToken, setAdminSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing admin session
    const checkExistingSession = async () => {
      const storedToken = localStorage.getItem('admin_session_token');
      if (storedToken) {
        try {
          const { data: isValid } = await supabase.rpc('validate_admin_session', {
            token: storedToken
          });
          
          if (isValid) {
            setAdminSessionToken(storedToken);
            setIsAdminAuthenticated(true);
          } else {
            localStorage.removeItem('admin_session_token');
          }
        } catch (error) {
          console.error('Error validating admin session:', error);
          localStorage.removeItem('admin_session_token');
        }
      }
      setLoading(false);
    };

    checkExistingSession();
  }, []);

  const validateAdminSecret = async (secret: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.rpc('validate_admin_secret', {
        secret_input: secret
      });

      if (error) {
        console.error('Admin secret validation error:', error);
        toast({
          title: "Error",
          description: "Failed to validate admin secret",
          variant: "destructive",
        });
        return false;
      }

      const response = data as unknown as AdminSecretResponse;

      if (response?.success) {
        const sessionToken = response.session_token;
        if (sessionToken) {
          setAdminSessionToken(sessionToken);
          setIsAdminAuthenticated(true);
          localStorage.setItem('admin_session_token', sessionToken);
          
          toast({
            title: "Success",
            description: "Admin access granted",
          });
          
          return true;
        }
      } else {
        toast({
          title: "Access Denied",
          description: response?.error || "Invalid admin secret",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error('Error validating admin secret:', error);
      toast({
        title: "Error",
        description: "An error occurred while validating admin secret",
        variant: "destructive",
      });
    }
    return false;
  };

  const logAdminActivity = async (
    action: string,
    entityType: string,
    entityId?: string,
    details?: any
  ) => {
    if (!adminSessionToken) return;

    try {
      await supabase.rpc('log_admin_activity', {
        token: adminSessionToken,
        action_name: action,
        entity_type_name: entityType,
        entity_id_val: entityId,
        details_json: details
      });
    } catch (error) {
      console.error('Error logging admin activity:', error);
    }
  };

  const signOutAdmin = () => {
    setIsAdminAuthenticated(false);
    setAdminSessionToken(null);
    localStorage.removeItem('admin_session_token');
    toast({
      title: "Signed Out",
      description: "Admin session ended",
    });
  };

  const value = {
    isAdminAuthenticated,
    adminSessionToken,
    loading,
    validateAdminSecret,
    logAdminActivity,
    signOutAdmin,
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
};
