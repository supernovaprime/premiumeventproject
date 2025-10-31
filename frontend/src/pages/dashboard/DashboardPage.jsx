import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Calendar, Users, Award, DollarSign } from 'lucide-react';

const DashboardPage = () => {
  const { user } = useAuth();

  const getDashboardContent = () => {
    switch (user?.role) {
      case 'admin':
        return {
          title: 'Admin Dashboard',
          description: 'Manage the entire platform',
          stats: [
            { label: 'Total Users', value: '1,234', icon: Users },
            { label: 'Active Events', value: '56', icon: Calendar },
            { label: 'Total Revenue', value: '$12,345', icon: DollarSign },
            { label: 'Awards Sold', value: '789', icon: Award },
          ]
        };
      case 'organizer':
        return {
          title: 'Organizer Dashboard',
          description: 'Manage your events and analytics',
          stats: [
            { label: 'My Events', value: '12', icon: Calendar },
            { label: 'Total Votes', value: '5,678', icon: Users },
            { label: 'Revenue', value: '$2,345', icon: DollarSign },
            { label: 'Awards Sold', value: '45', icon: Award },
          ]
        };
      case 'affiliate':
        return {
          title: 'Affiliate Dashboard',
          description: 'Track your referrals and earnings',
          stats: [
            { label: 'Referrals', value: '89', icon: Users },
            { label: 'Commission', value: '$456', icon: DollarSign },
            { label: 'Active Events', value: '23', icon: Calendar },
            { label: 'Conversion Rate', value: '12%', icon: Award },
          ]
        };
      default:
        return {
          title: 'User Dashboard',
          description: 'Manage your events and activities',
          stats: [
            { label: 'Events Joined', value: '8', icon: Calendar },
            { label: 'Votes Cast', value: '45', icon: Users },
            { label: 'Tickets Purchased', value: '12', icon: Award },
            { label: 'Orders', value: '3', icon: DollarSign },
          ]
        };
    }
  };

  const content = getDashboardContent();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{content.title}</h1>
        <p className="text-gray-600 mt-2">{content.description}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {content.stats.map((stat, index) => (
          <Card key={index} className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <stat.icon className="w-6 h-6 text-primary-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {user?.role === 'organizer' && (
            <>
              <Button className="h-20 flex flex-col items-center justify-center">
                <Calendar className="w-6 h-6 mb-2" />
                Create Event
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Users className="w-6 h-6 mb-2" />
                Manage Events
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Award className="w-6 h-6 mb-2" />
                View Analytics
              </Button>
            </>
          )}
          
          {user?.role === 'admin' && (
            <>
              <Button className="h-20 flex flex-col items-center justify-center">
                <Users className="w-6 h-6 mb-2" />
                Manage Users
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Calendar className="w-6 h-6 mb-2" />
                Manage Events
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <DollarSign className="w-6 h-6 mb-2" />
                View Finances
              </Button>
            </>
          )}

          {user?.role === 'user' && (
            <>
              <Button className="h-20 flex flex-col items-center justify-center">
                <Calendar className="w-6 h-6 mb-2" />
                Browse Events
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Award className="w-6 h-6 mb-2" />
                My Tickets
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center">
                <Users className="w-6 h-6 mb-2" />
                My Votes
              </Button>
            </>
          )}
        </div>
      </Card>

      {/* Recent Activity */}
      <Card>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <div className="text-center py-8 text-gray-500">
          <p>No recent activity to display</p>
        </div>
      </Card>
    </div>
  );
};

export default DashboardPage;
