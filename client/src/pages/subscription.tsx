import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { MainLayout } from "@/components/layout/main-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Crown, Star, Zap, Users, Shield, Brain, Clock } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || "");

const SubscribeForm = ({ clientSecret }: { clientSecret: string }) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Payment Successful! 🎉",
        description: "Welcome to StudentDrive Premium!",
      });
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing}
        className="w-full"
        data-testid="button-confirm-payment"
      >
        {isProcessing ? "Processing..." : "Subscribe to Premium"}
      </Button>
    </form>
  );
};

export default function Subscription() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("monthly");
  const [clientSecret, setClientSecret] = useState("");
  const [showPayment, setShowPayment] = useState(false);

  const plans = {
    free: {
      name: "Free",
      price: 0,
      features: [
        "Upload up to 5 documents per month",
        "Basic note organization",
        "Limited AI features (5 uses per month)",
        "Community forum access",
        "Basic analytics"
      ]
    },
    monthly: {
      name: "Premium Monthly",
      price: 19.99,
      originalPrice: 24.99,
      features: [
        "Unlimited document uploads",
        "Advanced note organization with tags",
        "Full AI suite (flashcards, quizzes, summaries)",
        "Unlimited mind map generation",
        "Advanced analytics & progress tracking",
        "Priority customer support",
        "Dark mode",
        "Export to PDF/Word",
        "Collaboration features",
        "Study schedule planner"
      ]
    },
    yearly: {
      name: "Premium Yearly",
      price: 199.99,
      originalPrice: 299.88,
      savings: 99.89,
      features: [
        "Everything in Monthly Premium",
        "2 months FREE (save $99.89)",
        "Priority AI processing",
        "Advanced study insights",
        "Personal study coach AI",
        "Institution-wide sharing",
        "API access for developers",
        "Early access to new features"
      ]
    }
  };

  const handleUpgrade = async (planType: "monthly" | "yearly") => {
    try {
      const response = await apiRequest("POST", "/api/create-subscription");
      const data = await response.json();
      
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
        setShowPayment(true);
        setSelectedPlan(planType);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate subscription. Please try again.",
        variant: "destructive",
      });
    }
  };

  const currentPlan = user?.subscriptionTier || "free";
  const isPremium = currentPlan === "premium";

  if (showPayment && clientSecret) {
    return (
      <MainLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-foreground mb-2">Complete Your Subscription</h1>
            <p className="text-muted-foreground">
              You're subscribing to {plans[selectedPlan].name} - ${plans[selectedPlan].price}
            </p>
          </div>

          <Card>
            <CardContent className="p-6">
              <Elements stripe={stripePromise} options={{ clientSecret }}>
                <SubscribeForm clientSecret={clientSecret} />
              </Elements>
            </CardContent>
          </Card>

          <div className="text-center">
            <Button 
              variant="outline" 
              onClick={() => {
                setShowPayment(false);
                setClientSecret("");
              }}
              data-testid="button-back-to-plans"
            >
              Back to Plans
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">Choose Your Plan</h1>
          <p className="text-xl text-muted-foreground">
            Unlock the full power of AI-driven learning
          </p>
          
          {isPremium && (
            <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white px-4 py-2">
              <Crown className="w-4 h-4 mr-2" />
              Current Plan: Premium
            </Badge>
          )}
        </div>

        {/* Current Usage (for free users) */}
        {!isPremium && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="w-5 h-5 mr-2 text-primary" />
                Your Current Usage
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Document uploads this month</span>
                <span className="font-medium">3 / 5</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: "60%" }}></div>
              </div>
              <div className="flex justify-between text-sm">
                <span>AI features used</span>
                <span className="font-medium">4 / 5</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-primary h-2 rounded-full" style={{ width: "80%" }}></div>
              </div>
              <p className="text-sm text-muted-foreground mt-3">
                You're close to your monthly limits. Upgrade to Premium for unlimited access!
              </p>
            </CardContent>
          </Card>
        )}

        {/* Pricing Toggle */}
        <div className="flex justify-center">
          <div className="bg-muted p-1 rounded-lg">
            <Button
              variant={selectedPlan === "monthly" ? "default" : "ghost"}
              onClick={() => setSelectedPlan("monthly")}
              className="px-6"
              data-testid="button-select-monthly"
            >
              Monthly
            </Button>
            <Button
              variant={selectedPlan === "yearly" ? "default" : "ghost"}
              onClick={() => setSelectedPlan("yearly")}
              className="px-6"
              data-testid="button-select-yearly"
            >
              Yearly
              <Badge variant="secondary" className="ml-2 text-xs">
                Save $99
              </Badge>
            </Button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Free Plan */}
          <Card className={`relative ${currentPlan === "free" ? "ring-2 ring-primary" : ""}`}>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center">
                <Users className="w-5 h-5 mr-2" />
                Free
              </CardTitle>
              <div className="space-y-2">
                <div className="text-3xl font-bold">$0</div>
                <p className="text-sm text-muted-foreground">Forever free</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {plans.free.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {currentPlan === "free" ? (
                <Badge variant="secondary" className="w-full justify-center py-2">
                  Current Plan
                </Badge>
              ) : (
                <Button variant="outline" className="w-full" disabled>
                  Downgrade Not Available
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Premium Monthly */}
          <Card className={`relative ${selectedPlan === "monthly" ? "ring-2 ring-primary shadow-xl scale-105" : ""} transition-all duration-200`}>
            {selectedPlan === "monthly" && (
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-white px-3 py-1">
                  <Star className="w-3 h-3 mr-1" />
                  Most Popular
                </Badge>
              </div>
            )}
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center">
                <Crown className="w-5 h-5 mr-2 text-primary" />
                Premium Monthly
              </CardTitle>
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-sm text-muted-foreground line-through">
                    ${plans.monthly.originalPrice}
                  </span>
                  <div className="text-3xl font-bold">${plans.monthly.price}</div>
                </div>
                <p className="text-sm text-muted-foreground">per month</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {plans.monthly.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {isPremium ? (
                <Badge variant="secondary" className="w-full justify-center py-2">
                  <Crown className="w-4 h-4 mr-2" />
                  Current Plan
                </Badge>
              ) : (
                <Button 
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={() => handleUpgrade("monthly")}
                  data-testid="button-upgrade-monthly"
                >
                  Upgrade to Premium
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Premium Yearly */}
          <Card className={`relative ${selectedPlan === "yearly" ? "ring-2 ring-primary" : ""}`}>
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white px-3 py-1">
                Best Value - Save $99
              </Badge>
            </div>
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center">
                <Shield className="w-5 h-5 mr-2 text-primary" />
                Premium Yearly
              </CardTitle>
              <div className="space-y-2">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-sm text-muted-foreground line-through">
                    ${plans.yearly.originalPrice}
                  </span>
                  <div className="text-3xl font-bold">${plans.yearly.price}</div>
                </div>
                <p className="text-sm text-muted-foreground">per year</p>
                <Badge variant="secondary" className="text-xs">
                  Save ${plans.yearly.savings}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {plans.yearly.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              {isPremium ? (
                <Button 
                  variant="outline"
                  className="w-full"
                  onClick={() => handleUpgrade("yearly")}
                  data-testid="button-upgrade-yearly"
                >
                  Switch to Yearly
                </Button>
              ) : (
                <Button 
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                  onClick={() => handleUpgrade("yearly")}
                  data-testid="button-upgrade-yearly"
                >
                  Get Best Value
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Feature Comparison */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-center">What You Get with Premium</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardContent className="pt-6">
                <Brain className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Unlimited AI Features</h3>
                <p className="text-sm text-muted-foreground">
                  Generate unlimited flashcards, quizzes, and summaries with advanced AI
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Priority Processing</h3>
                <p className="text-sm text-muted-foreground">
                  Get faster AI generation and priority server access
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <Clock className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Study Scheduling</h3>
                <p className="text-sm text-muted-foreground">
                  AI-powered study schedules and spaced repetition reminders
                </p>
              </CardContent>
            </Card>
            
            <Card className="text-center">
              <CardContent className="pt-6">
                <Users className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Collaboration</h3>
                <p className="text-sm text-muted-foreground">
                  Share notes and collaborate with study groups seamlessly
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Can I cancel anytime?</h4>
              <p className="text-sm text-muted-foreground">
                Yes! You can cancel your subscription at any time. You'll continue to have access to Premium features until the end of your billing period.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Is my data secure?</h4>
              <p className="text-sm text-muted-foreground">
                Absolutely! We use industry-standard encryption and never share your personal study materials with third parties.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Do you offer student discounts?</h4>
              <p className="text-sm text-muted-foreground">
                We offer special institutional pricing for schools and universities. Contact our sales team for more information.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
