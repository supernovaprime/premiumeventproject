import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar, 
  Users, 
  Award, 
  ShoppingBag, 
  TrendingUp,
  Shield,
  Zap,
  Globe
} from 'lucide-react';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';

const HomePage = () => {
  const features = [
    {
      icon: Calendar,
      title: 'Event Management',
      description: 'Create and manage award events with ease. Set up categories, nominees, and voting systems.'
    },
    {
      icon: Users,
      title: 'Voting System',
      description: 'Secure online voting with fraud prevention. Real-time results and analytics.'
    },
    {
      icon: Award,
      title: 'Award Shop',
      description: 'Sell plaques, trophies, and certificates. Integrated e-commerce for award materials.'
    },
    {
      icon: ShoppingBag,
      title: 'Ticketing',
      description: 'Sell event tickets with QR codes. Integrated payment processing and validation.'
    },
    {
      icon: TrendingUp,
      title: 'Analytics',
      description: 'Comprehensive analytics and reporting. Track votes, sales, and engagement.'
    },
    {
      icon: Shield,
      title: 'Security',
      description: 'Enterprise-grade security with data encryption and fraud prevention.'
    }
  ];

  const stats = [
    { label: 'Events Hosted', value: '10,000+' },
    { label: 'Active Users', value: '50,000+' },
    { label: 'Votes Cast', value: '1M+' },
    { label: 'Countries', value: '50+' }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-50 via-white to-secondary-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              Host Award Events
              <span className="block text-primary-500">Like a Pro</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              The ultimate platform for creating award events, managing votes, selling tickets, 
              and connecting with your audience. Professional tools for professional results.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="text-lg px-8 py-4">
                Get Started Free
              </Button>
              <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                Watch Demo
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-primary-500 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Everything You Need
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to make your award events successful and memorable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} hover className="text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Create Your First Event?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Join thousands of organizers who trust Premium Events for their award ceremonies.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="secondary" size="lg" className="text-lg px-8 py-4">
              Start Free Trial
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-primary-500">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-16 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-white mb-4">
              Need Help Getting Started?
            </h3>
            <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
              Our support team is here to help you create amazing award events.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/contact" 
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-primary-600 bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                Get Support
              </Link>
              <Link 
                to="/about" 
                className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-white hover:bg-gray-800 transition-colors duration-200"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
