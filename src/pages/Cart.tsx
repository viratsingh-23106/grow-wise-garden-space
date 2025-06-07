
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import NavBar from "@/components/NavBar";

const Cart = () => {
  const { items, loading, updateQuantity, removeFromCart, getTotalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checkingOut, setCheckingOut] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <NavBar />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">
            <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Please sign in to view your cart</p>
            <Button onClick={() => navigate('/auth')} className="bg-green-600 hover:bg-green-700">
              Sign In
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <NavBar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center p-8">Loading your cart...</div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <NavBar />
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="text-center">
            <ShoppingBag className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-8">Looks like you haven't added anything to your cart yet</p>
            <Button onClick={() => navigate('/products')} className="bg-green-600 hover:bg-green-700">
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const handleCheckout = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to checkout",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    setCheckingOut(true);
    console.log('Starting checkout process for user:', user.email);

    try {
      const totalAmount = Math.round(getTotalPrice() * 1.07 * 100); // Convert to paisa and include tax
      
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { 
          planType: 'cart_checkout',
          amount: totalAmount,
          items: items.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.product.price
          }))
        }
      });

      if (error) {
        console.error('Checkout error:', error);
        toast({
          title: "Checkout Failed",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (!data || !data.orderId) {
        console.error('Invalid checkout response:', data);
        toast({
          title: "Checkout Failed",
          description: "Invalid response from payment service",
          variant: "destructive",
        });
        return;
      }

      console.log('Razorpay order created for cart:', data);

      // Initialize Razorpay checkout
      const options = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: "AeroFarm Pro",
        description: "Cart Checkout",
        order_id: data.orderId,
        handler: async function (response: any) {
          console.log('Payment successful for cart, processing order...', response);
          try {
            // Create order in database
            const { data: orderData, error: orderError } = await supabase
              .from('orders')
              .insert({
                user_id: user.id,
                total_amount: totalAmount / 100, // Convert back to rupees
                status: 'completed'
              })
              .select()
              .single();

            if (orderError) {
              console.error('Error creating order:', orderError);
              toast({
                title: "Order Creation Failed",
                description: "Payment successful but order creation failed. Please contact support.",
                variant: "destructive",
              });
              return;
            }

            // Create order items
            const orderItems = items.map(item => ({
              order_id: orderData.id,
              product_id: item.product_id,
              quantity: item.quantity,
              price: item.product.price
            }));

            const { error: itemsError } = await supabase
              .from('order_items')
              .insert(orderItems);

            if (itemsError) {
              console.error('Error creating order items:', itemsError);
              toast({
                title: "Order Items Error",
                description: "Order created but items not saved. Please contact support.",
                variant: "destructive",
              });
              return;
            }

            // Clear cart after successful order
            await clearCart();

            toast({
              title: "Order Placed Successfully!",
              description: "Your order has been placed and payment processed.",
            });

            navigate('/orders');
          } catch (error) {
            console.error('Error processing order:', error);
            toast({
              title: "Order Processing Failed",
              description: "Payment successful but order processing failed. Please contact support.",
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
            setCheckingOut(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (error: any) {
      console.error('Error in handleCheckout:', error);
      toast({
        title: "Checkout Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <NavBar />
      
      {/* Razorpay Script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
        
        <div className="grid md:grid-cols-3 gap-8">
          {/* Cart Items List */}
          <div className="md:col-span-2 space-y-4">
            {items.map((item) => (
              <Card key={item.id} className="overflow-hidden">
                <div className="flex flex-col sm:flex-row">
                  <div className="w-full sm:w-36 h-36 bg-gray-100">
                    <img 
                      src={item.product.image_url || 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=500'} 
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  
                  <div className="flex-1 p-4">
                    <div className="flex flex-col h-full justify-between">
                      <div>
                        <div className="flex justify-between">
                          <h3 className="font-medium text-lg">{item.product.name}</h3>
                          <p className="font-bold text-green-600">${(item.product.price * item.quantity).toFixed(2)}</p>
                        </div>
                        
                        <p className="text-gray-600 text-sm mt-1">${item.product.price.toFixed(2)} each</p>
                      </div>
                      
                      <div className="flex justify-between items-center mt-4">
                        <div className="flex items-center border rounded">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-none" 
                            onClick={() => updateQuantity(item.product_id, Math.max(1, item.quantity - 1))}
                            disabled={item.quantity <= 1}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center text-sm">{item.quantity}</span>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-none" 
                            onClick={() => updateQuantity(item.product_id, Math.min(item.product.stock_quantity, item.quantity + 1))}
                            disabled={item.quantity >= item.product.stock_quantity}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-gray-500 hover:text-red-500"
                          onClick={() => removeFromCart(item.product_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            
            <div className="mt-8">
              <Button onClick={() => navigate('/products')} variant="outline" className="border-green-600 text-green-600">
                Continue Shopping
              </Button>
            </div>
          </div>
          
          {/* Order Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>${getTotalPrice().toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>Free</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span>${(getTotalPrice() * 0.07).toFixed(2)}</span>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>${(getTotalPrice() * 1.07).toFixed(2)}</span>
                </div>
              </CardContent>
              
              <CardFooter>
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={handleCheckout}
                  disabled={checkingOut}
                >
                  {checkingOut ? 'Processing...' : (
                    <>
                      Checkout <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </CardFooter>
              
              <div className="px-6 pb-6">
                <p className="text-xs text-center text-gray-500 mt-2">
                  (Demo mode - no actual charges will be made)
                </p>
                <div className="flex justify-center items-center gap-2 mt-4">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <span className="text-xs text-gray-400">Stripe payments integration coming soon</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
