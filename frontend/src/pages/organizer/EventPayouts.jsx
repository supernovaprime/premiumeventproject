// frontend/src/pages/organizer/EventPayouts.jsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../utils/api";
import { 
  DollarSign, 
  Receipt, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertCircle,
  ArrowDownToLine,
  Download,
  RefreshCw
} from "lucide-react";

const EventPayouts = () => {
  const { id } = useParams();
  const [payouts, setPayouts] = useState({
    gross: 0,
    platformFee: 0,
    net: 0,
    requested: 0,
    paid: 0,
    pending: 0,
    history: []
  });
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    fetchPayouts();
  }, [id]);

  const fetchPayouts = async () => {
    try {
      const res = await api.get(`/organizer/events/${id}/payouts`);
      setPayouts(res.data);
    } catch (err) {
      toast.error("Failed to load payouts.");
    } finally {
      setLoading(false);
    }
  };

  const requestPayout = async () => {
    if (payouts.net - payouts.requested <= 0) {
      toast.error("No funds available.");
      return;
    }
    setRequesting(true);
    try {
      await api.post(`/organizer/events/${id}/payout`);
      toast.success("Payout requested! Awaiting admin approval.");
      fetchPayouts();
    } catch (err) {
      toast.error("Request failed.");
    } finally {
      setRequesting(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "paid": return <CheckCircle className="text-green-600" size={18} />;
      case "pending": return <Clock className="text-yellow-600" size={18} />;
      case "rejected": return <XCircle className="text-red-600" size={18} />;
      default: return <AlertCircle className="text-gray-600" size={18} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "rejected": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-pink-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Payouts & Revenue</h1>
              <p className="text-gray-600 mt-1">Track earnings and request withdrawals</p>
            </div>
            <button
              onClick={fetchPayouts}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>

          {/* Revenue Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-6 text-white">
              <DollarSign size={32} className="mb-2" />
              <p className="text-sm opacity-90">Gross Revenue</p>
              <p className="text-3xl font-bold">GHS {payouts.gross.toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl p-6 text-white">
              <Receipt size={32} className="mb-2" />
              <p className="text-sm opacity-90">Platform Fee (10%)</p>
              <p className="text-3xl font-bold">GHS {payouts.platformFee.toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 text-white">
              <TrendingUp size={32} className="mb-2" />
              <p className="text-sm opacity-90">Net Earnings</p>
              <p className="text-3xl font-bold">GHS {payouts.net.toFixed(2)}</p>
            </div>
          </div>

          {/* Payout Summary */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-sm text-gray-600">Requested</p>
                <p className="text-2xl font-bold text-indigo-600">GHS {payouts.requested.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Paid Out</p>
                <p className="text-2xl font-bold text-green-600">GHS {payouts.paid.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Available</p>
                <p className="text-2xl font-bold text-emerald-600">GHS {(payouts.net - payouts.requested).toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Request Payout */}
          <div className="flex justify-center mb-8">
            <button
              onClick={requestPayout}
              disabled={requesting || (payouts.net - payouts.requested) <= 0}
              className={`flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition shadow-lg ${
                requesting || (payouts.net - payouts.requested) <= 0
                  ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                  : "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700"
              }`}
            >
              <ArrowDownToLine size={24} />
              {requesting ? "Requesting..." : `Request GHS ${(payouts.net - payouts.requested).toFixed(2)}`}
            </button>
          </div>

          {/* Payout History */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Download size={22} />
              Payout History
            </h3>
            {payouts.history.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No payout history yet.</p>
            ) : (
              <div className="space-y-4">
                {payouts.history.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-5 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                    <div className="flex items-center gap-4">
                      {getStatusIcon(p.status)}
                      <div>
                        <p className="font-medium text-gray-800">GHS {p.amount.toFixed(2)}</p>
                        <p className="text-sm text-gray-600">
                          Requested on {new Date(p.requestedAt).toLocaleDateString()}
                          {p.paidAt && ` • Paid on ${new Date(p.paidAt).toLocaleDateString()}`}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(p.status)}`}>
                      {p.status.charAt(0).toUpperCase() + p.status.slice(1)}
                    </span>
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

export default EventPayouts;