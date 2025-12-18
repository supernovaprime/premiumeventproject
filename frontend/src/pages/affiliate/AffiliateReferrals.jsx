// frontend/src/pages/affiliate/AffiliateReferrals.jsx
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import api from "../../utils/api";
import { 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  DollarSign,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

const AffiliateReferrals = () => {
  const [referrals, setReferrals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    fetchReferrals();
  }, []);

  const fetchReferrals = async () => {
    try {
      const res = await api.get("/affiliate/referrals/all");
      setReferrals(res.data.referrals);
    } catch (err) {
      toast.error("Failed to load referrals.");
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const csv = [
      ["Date", "Name", "Email", "Event", "Amount", "Commission", "Status"],
      ...filteredReferrals.map(r => [
        new Date(r.date).toLocaleDateString(),
        r.name,
        r.email,
        r.event?.title || "N/A",
        `GHS ${r.amount.toFixed(2)}`,
        `GHS ${r.commission.toFixed(2)}`,
        r.status
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `referrals_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const filteredReferrals = referrals.filter(r => {
    const matchesSearch = 
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.event?.title || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || r.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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
              <h1 className="text-3xl font-bold text-gray-800">All Referrals</h1>
              <p className="text-gray-600 mt-1">Track every referral and commission</p>
            </div>
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold hover:from-green-700 hover:to-emerald-700 transition shadow-lg"
            >
              <Download size={20} /> Export CSV
            </button>
          </div>

          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search name, email, event..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl w-full focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="converted">Converted</option>
              <option value="paid">Paid</option>
            </select>
          </div>

          {/* Referrals Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Event</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Sale</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Commission</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredReferrals.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-12 text-gray-500">
                      No referrals found.
                    </td>
                  </tr>
                ) : (
                  filteredReferrals.map((r, i) => (
                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition">
                      <td className="py-3 px-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar size={14} className="text-gray-500" />
                          {new Date(r.date).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-800">{r.name}</p>
                          <p className="text-xs text-gray-500">{r.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {r.event?.title || <span className="text-gray-400">—</span>}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-800">
                        GHS {r.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-teal-600">
                        GHS {r.commission.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          r.status === "paid" ? "bg-green-100 text-green-800" :
                          r.status === "converted" ? "bg-blue-100 text-blue-800" :
                          "bg-yellow-100 text-yellow-800"
                        }`}>
                          {r.status === "paid" ? <CheckCircle size={14} /> :
                           r.status === "converted" ? <CheckCircle size={14} /> :
                           <Clock size={14} />}
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl p-6 text-white">
              <DollarSign size={32} className="mb-2" />
              <p className="text-sm opacity-90">Total Commission</p>
              <p className="text-3xl font-bold">
                GHS {referrals.reduce((s, r) => s + r.commission, 0).toFixed(2)}
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl p-6 text-white">
              <Users size={32} className="mb-2" />
              <p className="text-sm opacity-90">Total Referrals</p>
              <p className="text-3xl font-bold">{referrals.length}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 text-white">
              <CheckCircle size={32} className="mb-2" />
              <p className="text-sm opacity-90">Paid Referrals</p>
              <p className="text-3xl font-bold">
                {referrals.filter(r => r.status === "paid").length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AffiliateReferrals;