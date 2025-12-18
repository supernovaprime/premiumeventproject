// frontend/src/pages/affiliate/AffiliateEarnings.jsx
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import api from "../../utils/api";
import { 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Download,
  Filter,
  Clock,
  CheckCircle
} from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const AffiliateEarnings = () => {
  const [earnings, setEarnings] = useState({
    totalEarned: 0,
    paidOut: 0,
    pending: 0,
    monthlyData: [],
    payoutHistory: []
  });
  const [loading, setLoading] = useState(true);
  const [filterRange, setFilterRange] = useState("all");

  useEffect(() => {
    fetchEarnings();
  }, [filterRange]);

  const fetchEarnings = async () => {
    try {
      const res = await api.get(`/affiliate/earnings?range=${filterRange}`);
      setEarnings(res.data);
    } catch (err) {
      toast.error("Failed to load earnings.");
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const csv = [
      ["Date", "Event", "Referral", "Sale", "Commission", "Status"],
      ...earnings.payoutHistory.map(p => [
        new Date(p.date).toLocaleDateString(),
        p.event?.title || "N/A",
        p.referral.name,
        `GHS ${p.sale.toFixed(2)}`,
        `GHS ${p.commission.toFixed(2)}`,
        p.status
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `earnings_${filterRange}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

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
              <h1 className="text-3xl font-bold text-gray-800">Earnings Overview</h1>
              <p className="text-gray-600 mt-1">Track commissions, payouts, and growth</p>
            </div>
            <div className="flex gap-3">
              <select
                value={filterRange}
                onChange={(e) => setFilterRange(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
              >
                <option value="all">All Time</option>
                <option value="year">This Year</option>
                <option value="month">This Month</option>
                <option value="week">Last 7 Days</option>
              </select>
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-medium"
              >
                <Download size={18} /> Export
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl p-6 text-white">
              <DollarSign size={32} className="mb-2" />
              <p className="text-sm opacity-90">Total Earned</p>
              <p className="text-3xl font-bold">GHS {earnings.totalEarned.toFixed(2)}</p>
              <p className="text-xs mt-1 opacity-75">All time</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 text-white">
              <CheckCircle size={32} className="mb-2" />
              <p className="text-sm opacity-90">Paid Out</p>
              <p className="text-3xl font-bold">GHS {earnings.paidOut.toFixed(2)}</p>
              <p className="text-xs mt-1 opacity-75">Withdrawn</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-amber-500 rounded-2xl p-6 text-white">
              <Clock size={32} className="mb-2" />
              <p className="text-sm opacity-90">Pending</p>
              <p className="text-3xl font-bold">GHS {earnings.pending.toFixed(2)}</p>
              <p className="text-xs mt-1 opacity-75">Available soon</p>
            </div>
          </div>

          {/* Earnings Chart */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Earnings Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={earnings.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `GHS ${value.toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="earned" stroke="#14b8a6" name="Earned" strokeWidth={3} />
                <Line type="monotone" dataKey="paid" stroke="#10b981" name="Paid Out" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Payout History */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Payout History</h3>
            <div className="space-y-4">
              {earnings.payoutHistory.length === 0 ? (
                <p className="text-center py-8 text-gray-500">No earnings yet. Keep sharing!</p>
              ) : (
                earnings.payoutHistory.map((p, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-xl border ${
                      p.status === "paid" ? "bg-green-50 border-green-200" :
                      p.status === "pending" ? "bg-yellow-50 border-yellow-200" :
                      "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                          p.status === "paid" ? "bg-green-600" :
                          p.status === "pending" ? "bg-yellow-600" :
                          "bg-blue-600"
                        }`}>
                          {p.referral.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{p.event?.title || "General Sale"}</p>
                          <p className="text-sm text-gray-600">
                            Referred: <strong>{p.referral.name}</strong> • {new Date(p.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-teal-600">+GHS {p.commission.toFixed(2)}</p>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium mt-1 ${
                          p.status === "paid" ? "bg-green-100 text-green-800" :
                          p.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                          "bg-blue-100 text-blue-800"
                        }`}>
                          {p.status === "paid" ? <CheckCircle size={14} /> :
                           p.status === "pending" ? <Clock size={14} /> :
                           <TrendingUp size={14} />}
                          {p.status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffiliateEarnings;