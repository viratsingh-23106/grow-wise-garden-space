
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Eye, EyeOff } from 'lucide-react';

interface AdminSecretLoginProps {
  onSubmit: (secret: string) => Promise<boolean>;
  loading?: boolean;
}

const AdminSecretLogin: React.FC<AdminSecretLoginProps> = ({ onSubmit, loading = false }) => {
  const [secret, setSecret] = useState('');
  const [showSecret, setShowSecret] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(secret);
    } finally {
      setIsSubmitting(false);
      setSecret('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">Admin Access</CardTitle>
          <p className="text-gray-600">Enter the admin secret code to continue</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="secret">Admin Secret Code</Label>
              <div className="relative">
                <Input
                  id="secret"
                  type={showSecret ? "text" : "password"}
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="Enter admin secret code"
                  disabled={isSubmitting || loading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isSubmitting || loading}
                >
                  {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full bg-red-600 hover:bg-red-700"
              disabled={!secret.trim() || isSubmitting || loading}
            >
              {isSubmitting ? "Validating..." : "Access Admin Panel"}
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">
              <strong>Security Notice:</strong> This admin panel provides full access to all system data. 
              Only authorized administrators should have access to the secret code.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSecretLogin;
