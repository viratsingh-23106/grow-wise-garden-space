import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Crown, Zap, Shield, Users, Star, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { supabase } from "@/integrations/supabase/client";
import NavBar from "@/components/NavBar";
import { toast } from "@/hooks/use-toast";

const Subscription = () => {
  const { user } = useAuth();
  const { isSubscribed, subscriptionTier, loading: subscriptionLoading } = useSubscription();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpay = () => {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => {
          setRazorpayLoaded(true);
          resolve(true);
        };
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };

    if (!(window as any).Razorpay) {
      loadRazorpay();
    } else {
      setRazorpayLoaded(true);
    }
  }, []);

  const handleSubscription = async (planType: 'premium' | 'enterprise') => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to subscribe",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    if (!razorpayLoaded || typeof (window as any).Razorpay === 'undefined') {
      toast({
        title: "Payment Gateway Loading",
        description: "Please wait for payment gateway to load and try again.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    console.log(`Starting ${planType} subscription process for user:`, user.email);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planType }
      });

      if (error) {
        console.error('Supabase function error:', error);
        toast({
          title: "Error",
          description: `Failed to start subscription process: ${error.message}`,
          variant: "destructive",
        });
        return;
      }

      if (!data || !data.orderId) {
        console.error('Invalid response from create-checkout:', data);
        toast({
          title: "Error", 
          description: "Invalid response from payment service",
          variant: "destructive",
        });
        return;
      }

      console.log('Razorpay order created:', data);

      // Initialize Razorpay checkout
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "AeroFarm Pro",
        description: `${planType === 'premium' ? 'Premium' : 'Enterprise'} Plan Subscription`,
        order_id: data.orderId,
        handler: async function (response: any) {
          console.log('Payment successful, verifying...', response);
          try {
            const { data: verifyData, error: verifyError } = await supabase.functions.invoke('verify-payment', {
              body: {
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature
              }
            });

            if (verifyError) {
              console.error('Payment verification error:', verifyError);
              toast({
                title: "Payment Verification Failed",
                description: verifyError.message,
                variant: "destructive",
              });
              return;
            }

            console.log('Payment verified successfully:', verifyData);
            toast({
              title: "Subscription Activated!",
              description: "Your subscription has been activated successfully.",
            });
            
            // Refresh the page to update subscription status
            window.location.reload();
          } catch (error) {
            console.error('Error verifying payment:', error);
            toast({
              title: "Payment Verification Failed",
              description: "Please contact support if payment was deducted.",
              variant: "destructive",
            });
          }
        },
        prefill: {
          name: user.email,
          email: user.email,
        },
        theme: {
          color: "#16a34a"
        },
        modal: {
          ondismiss: function() {
            console.log('Payment dialog closed');
            setLoading(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error: any) {
      console.error('Error in handleSubscription:', error);
      toast({
        title: "Error",
        description: `Failed to start subscription: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <NavBar />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Please Sign In</h2>
            <p className="text-gray-600 mb-8">You need to be signed in to view subscription plans</p>
            <Button onClick={() => navigate('/auth')} className="bg-green-600 hover:bg-green-700">
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (subscriptionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <NavBar />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">Loading subscription status...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <NavBar />
      
      <div className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Unlock advanced features and take your farming to the next level with our premium plans
          </p>
          {!razorpayLoaded && (
            <div className="mt-4">
              <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                Loading payment gateway...
              </Badge>
            </div>
          )}
        </div>

        {isSubscribed && (
          <div className="mb-8">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">
                    You have an active {subscriptionTier} subscription
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Premium Plan */}
          <Card className="relative border-2 border-green-500 shadow-lg">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-green-600 text-white px-4 py-1">
                <Star className="w-4 h-4 mr-1" />
                Most Popular
              </Badge>
            </div>
            
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-3 bg-green-100 rounded-full w-fit">
                <Crown className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Premium Plan</CardTitle>
              <div className="text-3xl font-bold text-green-600">₹999<span className="text-lg text-gray-500">/month</span></div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Advanced Analytics Dashboard</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Real-time Monitoring & Alerts</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>AI-Powered Crop Recommendations</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Weather Integration</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Priority Customer Support</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Up to 10 Sensor Connections</span>
                </div>
              </div>
              
              <Button 
                className="w-full bg-green-600 hover:bg-green-700" 
                size="lg"
                onClick={() => handleSubscription('premium')}
                disabled={loading || (isSubscribed && subscriptionTier === 'Premium')}
              >
                {loading ? (
                  "Processing..."
                ) : isSubscribed && subscriptionTier === 'Premium' ? (
                  "Current Plan"
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Get Premium
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Enterprise Plan */}
          <Card className="border-2 border-gray-200 shadow-lg">            
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-3 bg-purple-100 rounded-full w-fit">
                <Shield className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-2xl font-bold">Enterprise Plan</CardTitle>
              <div className="text-3xl font-bold text-purple-600">₹2999<span className="text-lg text-gray-500">/month</span></div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Everything in Premium</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Unlimited Sensor Connections</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Advanced API Access</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Custom Integrations</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>Dedicated Account Manager</span>
                </div>
                <div className="flex items-center gap-3">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <span>24/7 Phone Support</span>
                </div>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full border-purple-600 text-purple-600 hover:bg-purple-50" 
                size="lg"
                onClick={() => handleSubscription('enterprise')}
                disabled={loading || (isSubscribed && subscriptionTier === 'Enterprise')}
              >
                {loading ? (
                  "Processing..."
                ) : isSubscribed && subscriptionTier === 'Enterprise' ? (
                  "Current Plan"
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Get Enterprise
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-gray-600 mb-4">
            All plans include a 30-day money-back guarantee
          </p>
          <p className="text-sm text-gray-500">
            Secure payments powered by Razorpay • Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
