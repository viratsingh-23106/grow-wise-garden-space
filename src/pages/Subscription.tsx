
import { useState } from "react";
import { Check, Zap, Shield, BarChart3, Smartphone, Cloud, Bell, Settings } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import NavBar from "@/components/NavBar";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/contexts/SubscriptionContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

// Add Razorpay script to document head
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Subscription = () => {
  const { user } = useAuth();
  const { isSubscribed, subscriptionTier, trialEnded, loading, checkSubscription } = useSubscription();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const plans = [
    {
      name: "Free Trial",
      price: "₹0",
      duration: "2 days",
      description: "Try our IoT sensor dashboard with mock data",
      features: [
        "2-day trial access",
        "Mock sensor data viewing",
        "Basic dashboard features",
        "Limited alerts",
      ],
      limitations: [
        "No real sensor connectivity",
        "No data export",
        "No automation rules",
      ],
      current: !isSubscribed && !trialEnded,
      buttonText: trialEnded ? "Trial Expired" : "Current Plan",
      buttonDisabled: true,
    },
    {
      name: "Premium",
      price: "₹999",
      duration: "month",
      description: "Full access to IoT sensor management and advanced features",
      features: [
        "Unlimited sensor connections",
        "Real-time data monitoring",
        "Advanced analytics & charts",
        "Smart notifications & alerts",
        "Data export & reporting",
        "Automation rules setup",
        "Mobile app access",
        "Cloud data storage",
        "24/7 technical support",
        "API access for integrations",
      ],
      popular: true,
      current: isSubscribed,
      buttonText: isSubscribed ? "Current Plan" : "Subscribe Now",
      buttonDisabled: isSubscribed,
    },
  ];

  const handleSubscribe = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to subscribe.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load Razorpay script");
      }

      // Create order
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        headers: {
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
      });

      if (error) throw error;

      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "IoT Sensor Dashboard",
        description: "Premium Plan Subscription",
        order_id: data.orderId,
        handler: async function (response: any) {
          try {
            // Verify payment
            const { error: verifyError } = await supabase.functions.invoke('verify-payment', {
              body: {
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature,
              },
              headers: {
                Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
              },
            });

            if (verifyError) throw verifyError;

            toast({
              title: "Success!",
              description: "Payment successful. Your subscription is now active!",
            });

            // Refresh subscription status
            await checkSubscription();
          } catch (error) {
            console.error('Payment verification error:', error);
            toast({
              title: "Error",
              description: "Payment verification failed. Please contact support.",
              variant: "destructive",
            });
          }
        },
        prefill: {
          name: user.user_metadata?.full_name || "",
          email: user.email,
        },
        theme: {
          color: "#16a34a",
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "Failed to start subscription process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <NavBar />
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <NavBar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            IoT Sensor Dashboard Plans
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Choose the perfect plan for your smart gardening needs. Start with our free trial 
            or unlock the full potential with our premium subscription.
          </p>
        </div>

        {/* Current Status */}
        {user && (
          <div className="mb-8 text-center">
            <Card className="max-w-md mx-auto bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Badge variant={isSubscribed ? "default" : trialEnded ? "destructive" : "secondary"}>
                    {isSubscribed ? "Premium Active" : trialEnded ? "Trial Expired" : "Free Trial"}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">
                  {isSubscribed 
                    ? "You have full access to all features"
                    : trialEnded 
                    ? "Subscribe to continue using the dashboard"
                    : "Your trial is active - upgrade anytime!"
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pricing Plans */}
        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.name} 
              className={`relative bg-white/80 backdrop-blur-sm border-2 transition-all hover:shadow-lg ${
                plan.popular 
                  ? 'border-green-500 shadow-lg' 
                  : plan.current 
                  ? 'border-blue-500' 
                  : 'border-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-green-600 text-white px-4 py-1">
                    <Zap className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              
              {plan.current && (
                <div className="absolute -top-3 right-4">
                  <Badge variant="secondary">Current Plan</Badge>
                </div>
              )}

              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <div className="text-3xl font-bold text-green-600">
                  {plan.price}
                  <span className="text-base font-normal text-gray-600">/{plan.duration}</span>
                </div>
                <CardDescription className="text-lg">{plan.description}</CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-600" />
                    Features Included:
                  </h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                        <Check className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {plan.limitations && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3 text-sm">Limitations:</h4>
                    <ul className="space-y-1">
                      {plan.limitations.map((limitation, index) => (
                        <li key={index} className="text-xs text-gray-500 flex items-start gap-2">
                          <span className="text-red-400">×</span>
                          {limitation}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <Button
                  className={`w-full h-12 text-base font-semibold ${
                    plan.popular 
                      ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg' 
                      : 'bg-gray-600 hover:bg-gray-700 text-white'
                  }`}
                  disabled={plan.buttonDisabled || isProcessing}
                  onClick={plan.name === "Premium" && !isSubscribed ? handleSubscribe : undefined}
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    plan.buttonText
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Comparison */}
        <div className="mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Why Choose Premium?
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6 text-center">
                <BarChart3 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Real-Time Analytics</h3>
                <p className="text-sm text-gray-600">
                  Get live data from your actual sensors with advanced charts and insights
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6 text-center">
                <Smartphone className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Mobile Access</h3>
                <p className="text-sm text-gray-600">
                  Monitor your garden from anywhere with full mobile app integration
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur-sm">
              <CardContent className="pt-6 text-center">
                <Bell className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Smart Alerts</h3>
                <p className="text-sm text-gray-600">
                  Receive intelligent notifications when your plants need attention
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Security & Support */}
        <div className="mt-12 text-center">
          <div className="flex items-center justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Secure Payments via Razorpay</span>
            </div>
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              <span>Cloud Storage</span>
            </div>
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;
