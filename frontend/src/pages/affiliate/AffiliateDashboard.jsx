// frontend/src/pages/affiliate/AffiliateDashboard.jsx
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import api from "../../utils/api";
import { 
  Link2, 
  Users, 
  DollarSign, 
  TrendingUp,
  Copy,
  ExternalLink,
  Calendar,
  CheckCircle
} from "lucide-react";

const AffiliateDashboard = () => {
  const [stats, setStats] = useState({
    referralCode: "",
    referrals: 0,
    clicks: 0,
    conversions: 0,
    totalEarned: 0,
    paidOut: 0,
    pendingPayout: 0,
    commissionRate: 10
  });
  const [recentReferrals, setRecentReferrals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAffiliateData();
  }, []);

  const fetchAffiliateData = async () => {
    try {
      const [statsRes, referralsRes] = await Promise.all([
        api.get("/affiliate/stats"),
        api.get("/affiliate/referrals")
      ]);
      setStats(statsRes.data);
      setRecentReferrals(referralsRes.data.referrals);
    } catch (err) {
      toast.error("Failed to load affiliate data.");
    } finally {
      setLoading(false);
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/?ref=${stats.referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success("Referral link copied!");
  };

  const referralLink = `${window.location.origin}/?ref=${stats.referralCode}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-50 to-cyan-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-white to-cyan-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Affiliate Dashboard</h1>
              <p className="text-gray-600 mt-1">Earn {stats.commissionRate}% on every sale from your referrals</p>
            </div>
            <button
              onClick={copyReferralLink}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-xl font-bold hover:from-teal-700 hover:to-cyan-700 transition shadow-lg"
            >
              <Copy size={20} /> Copy Link
            </button>
          </div>

          {/* Referral Link Card */}
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-2xl p-6 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-700 mb-1">Your Referral Link</p>
                <div className="flex items-center gap-2">
                  <code className="bg-white px-3 py-2 rounded-lg font-mono text-sm text-teal-700 flex-1 truncate">
                    {referralLink}
                  </code>
                  <a
                    href={referralLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
                  >
                    <ExternalLink size={16} />
                  </a>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-600">Commission Rate</p>
                <p className="text-2xl font-bold text-teal-700">{stats.commissionRate}%</p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { icon: Users, label: "Total Referrals", value: stats.referrals, color: "from-blue-500 to-cyan-500" },
              { icon: Link2, label: "Link Clicks", value: stats.clicks, color: "from-purple-500 to-pink-500" },
              { icon: CheckCircle, label: "Conversions", value: stats.conversions, color: "from-green-500 to-emerald-500" },
              { icon: DollarSign, label: "Total Earned", value: `GHS ${stats.totalEarned.toFixed(2)}`, color: "from-yellow-500 to-amber-500" }
            ].map((stat, i) => (
              <div
                key={i}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center text-white`}>
                    <stat.icon size={24} />
                  </div>
                  <TrendingUp className="text-green-500 animate-pulse" size={20} />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
                <p className="text-sm text-gray-600">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Earnings Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 text-white">
              <DollarSign size={32} className="mb-2" />
              <p className="text-sm opacity-90">Total Earned</p>
              <p className="text-3xl font-bold">GHS {stats.totalEarned.toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white">
              <CheckCircle size={32} className="mb-2" />
              <p className="text-sm opacity-90">Paid Out</p>
              <p className="text-3xl font-bold">GHS {stats.paidOut.toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-amber-500 rounded-2xl p-6 text-white">
              <Calendar size={32} className="mb-2" />
              <p className="text-sm opacity-90">Pending Payout</p>
              <p className="text-3xl font-bold">GHS {stats.pendingPayout.toFixed(2)}</p>
            </div>
          </div>

          {/* Recent Referrals */}
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Recent Referrals</h2>
            {recentReferrals.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No referrals yet. Share your link!</p>
            ) : (
              <div className="space-y-3">
                {recentReferrals.map((ref, i) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                        {ref.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-gray-800">{ref.name}</p>
                        <p className="text-xs text-gray-500">{ref.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-teal-600">GHS {ref.earned.toFixed(2)}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(ref.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffiliateDashboard;