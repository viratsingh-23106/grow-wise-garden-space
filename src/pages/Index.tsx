
import { ArrowRight, ShoppingCart, Database, Calendar, User } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import NavBar from "@/components/NavBar";

const Index = () => {
  const features = [
    {
      icon: ShoppingCart,
      title: "Smart Product Catalog",
      description: "Seeds, plants, and tools with integrated IoT sensor recommendations",
      link: "/products"
    },
    {
      icon: Database,
      title: "IoT Dashboard",
      description: "Monitor your garden with real-time sensor data and automation",
      link: "/dashboard"
    },
    {
      icon: Calendar,
      title: "Learn & Connect",
      description: "Guides, community discussions, and expert knowledge sharing",
      link: "/learn"
    },
    {
      icon: User,
      title: "Community Hub",
      description: "Connect with other gardeners, attend webinars, and share knowledge",
      link: "/learn"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <NavBar />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-green-600/10 to-emerald-600/10"></div>
        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Grow Smarter with
            <span className="block text-green-600">BloomSync Solutions</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            From seeds to harvest, we provide everything you need for successful gardening with IoT-powered insights and expert guidance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg">
              <Link to="/products">
                Shop Products <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-green-600 text-green-600 hover:bg-green-50 px-8 py-6 text-lg">
              <Link to="/dashboard">
                View Dashboard
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
            Everything You Need to Succeed
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Our comprehensive platform combines traditional gardening wisdom with modern IoT technology
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                  <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                    <feature.icon className="h-8 w-8 text-green-600" />
                  </div>
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-gray-600 mb-4">
                    {feature.description}
                  </CardDescription>
                  <Button asChild variant="ghost" className="text-green-600 hover:text-green-700">
                    <Link to={feature.link}>
                      Learn More <ArrowRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-green-600 text-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">10,000+</div>
              <div className="text-green-100">Products Available</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">5,000+</div>
              <div className="text-green-100">Active Gardeners</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">98%</div>
              <div className="text-green-100">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold text-gray-900 mb-6">
            Ready to Transform Your Garden?
          </h2>
          <p className="text-xl text-gray-600 mb-8">
            Join thousands of successful gardeners who trust our platform for their growing needs.
          </p>
          <Button asChild size="lg" className="bg-green-600 hover:bg-green-700 text-white px-8 py-6 text-lg">
            <Link to="/products">
              Start Growing Today <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h3 className="text-2xl font-bold text-white mb-4">BloomSync Solutions</h3>
          <p className="mb-6">Empowering gardeners with technology and knowledge</p>
          <div className="flex justify-center space-x-6">
            <Link to="/products" className="hover:text-white transition-colors">Products</Link>
            <Link to="/learn" className="hover:text-white transition-colors">Learn</Link>
            <Link to="/learn" className="hover:text-white transition-colors">Blog</Link>
            <Link to="/learn" className="hover:text-white transition-colors">Community</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
