// frontend/src/pages/dashboard/UserDashboard.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../utils/api";
import { 
  Ticket, 
  ShoppingBag, 
  Trophy, 
  TrendingUp, 
  Calendar, 
  User, 
  Bell,
  Settings,
  LogOut
} from "lucide-react";

const UserDashboard = () => {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({
    tickets: 0,
    orders: 0,
    votes: 0,
    upcomingEvents: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [ticketsRes, ordersRes, votesRes, eventsRes, activityRes] = await Promise.all([
        api.get("/user/tickets"),
        api.get("/user/orders"),
        api.get("/user/votes"),
        api.get("/events/upcoming"),
        api.get("/user/activity")
      ]);

      setStats({
        tickets: ticketsRes.data.count,
        orders: ordersRes.data.count,
        votes: votesRes.data.count,
        upcomingEvents: eventsRes.data.events.length
      });

      setRecentActivity(activityRes.data.activities.slice(0, 5));
    } catch (err) {
      toast.error("Failed to load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully.");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Welcome back, {user.name.split(" ")[0]}!</h1>
                <p className="text-sm text-gray-600">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button className="p-2 rounded-lg hover:bg-gray-100 transition">
                <Bell size={20} className="text-gray-600" />
              </button>
              <button className="p-2 rounded-lg hover:bg-gray-100 transition">
                <Settings size={20} className="text-gray-600" />
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition"
              >
                <LogOut size={18} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            { icon: Ticket, label: "My Tickets", value: stats.tickets, color: "from-blue-500 to-cyan-500", link: "/dashboard/tickets" },
            { icon: ShoppingBag, label: "Shop Orders", value: stats.orders, color: "from-green-500 to-emerald-500", link: "/dashboard/orders" },
            { icon: Trophy, label: "Votes Cast", value: stats.votes, color: "from-purple-500 to-pink-500", link: "/dashboard/votes" },
            { icon: Calendar, label: "Upcoming Events", value: stats.upcomingEvents, color: "from-orange-500 to-red-500", link: "/events" }
          ].map((stat, i) => (
            <Link
              key={i}
              to={stat.link}
              className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center text-white`}>
                  <stat.icon size={24} />
                </div>
                <TrendingUp className="text-green-500 group-hover:animate-pulse" size={20} />
              </div>
              <h3 className="text-3xl font-bold text-gray-800">{stat.value}</h3>
              <p className="text-sm text-gray-600 mt-1">{stat.label}</p>
            </Link>
          ))}
        </div>

        {/* Recent Activity + Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Activity</h2>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((act, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      act.type === 'vote' ? 'bg-purple-100 text-purple-600' :
                      act.type === 'ticket' ? 'bg-blue-100 text-blue-600' :
                      act.type === 'order' ? 'bg-green-100 text-green-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {act.type === 'vote' && <Trophy size={18} />}
                      {act.type === 'ticket' && <Ticket size={18} />}
                      {act.type === 'order' && <ShoppingBag size={18} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{act.message}</p>
                      <p className="text-xs text-gray-500">{new Date(act.date).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No recent activity.</p>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-6 text-white">
            <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              {[
                { icon: Ticket, label: "Browse Events", link: "/events" },
                { icon: Trophy, label: "Vote Now", link: "/events" },
                { icon: ShoppingBag, label: "Shop Awards", link: "/shop" },
                { icon: User, label: "Edit Profile", link: "/dashboard/profile" }
              ].map((action, i) => (
                <Link
                  key={i}
                  to={action.link}
                  className="flex items-center gap-3 p-3 rounded-xl bg-white bg-opacity-10 hover:bg-opacity-20 transition"
                >
                  <action.icon size={20} />
                  <span className="font-medium">{action.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;