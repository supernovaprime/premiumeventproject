// frontend/src/pages/affiliate/AffiliatePayouts.jsx
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import api from "../../utils/api";
import { 
  DollarSign, 
  Banknote, 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Plus,
  Edit2,
  Save
} from "lucide-react";

const AffiliatePayouts = () => {
  const [payouts, setPayouts] = useState([]);
  const [balance, setBalance] = useState({ available: 0, requested: 0 });
  const [bankInfo, setBankInfo] = useState({ bank: "", account: "", name: "" });
  const [editingBank, setEditingBank] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayoutData();
  }, []);

  const fetchPayoutData = async () => {
    try {
      const [payoutRes, balanceRes, bankRes] = await Promise.all([
        api.get("/affiliate/payouts"),
        api.get("/affiliate/balance"),
        api.get("/affiliate/bank")
      ]);
      setPayouts(payoutRes.data.payouts);
      setBalance(balanceRes.data);
      setBankInfo(bankRes.data.bank || { bank: "", account: "", name: "" });
    } catch (err) {
      toast.error("Failed to load payout data.");
    } finally {
      setLoading(false);
    }
  };

  const handleBankUpdate = async () => {
    try {
      await api.put("/affiliate/bank", bankInfo);
      toast.success("Bank details saved!");
      setEditingBank(false);
    } catch (err) {
      toast.error("Failed to save bank info.");
    }
  };

  const requestPayout = async () => {
    if (balance.available < 50) {
      toast.error("Minimum payout is GHS 50");
      return;
    }
    if (!bankInfo.bank || !bankInfo.account) {
      toast.error("Please set up your bank details first.");
      return;
    }

    setRequesting(true);
    try {
      await api.post("/affiliate/payouts/request", { amount: balance.available });
      toast.success("Payout requested! We'll process within 48 hours.");
      fetchPayoutData();
    } catch (err) {
      toast.error("Request failed.");
    } finally {
      setRequesting(false);
    }
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
              <h1 className="text-3xl font-bold text-gray-800">Payouts</h1>
              <p className="text-gray-600 mt-1">Request earnings and track payment status</p>
            </div>
          </div>

          {/* Balance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-teal-500 to-cyan-500 rounded-2xl p-6 text-white">
              <DollarSign size={32} className="mb-2" />
              <p className="text-sm opacity-90">Available for Payout</p>
              <p className="text-4xl font-bold">GHS {balance.available.toFixed(2)}</p>
              <p className="text-xs mt-1 opacity-75">Min: GHS 50</p>
            </div>
            <div className="bg-gradient-to-br from-yellow-500 to-amber-500 rounded-2xl p-6 text-white">
              <Clock size={32} className="mb-2" />
              <p className="text-sm opacity-90">Requested</p>
              <p className="text-4xl font-bold">GHS {balance.requested.toFixed(2)}</p>
              <p className="text-xs mt-1 opacity-75">Processing</p>
            </div>
          </div>

          {/* Request Payout Button */}
          <div className="mb-8 text-center">
            <button
              onClick={requestPayout}
              disabled={requesting || balance.available < 50}
              className={`inline-flex items-center gap-3 px-8 py-4 rounded-xl font-bold text-lg transition shadow-lg ${
                balance.available >= 50
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700"
                  : "bg-gray-300 text-gray-600 cursor-not-allowed"
              }`}
            >
              <Banknote size={24} />
              {requesting ? "Requesting..." : `Request GHS ${balance.available.toFixed(2)} Payout`}
            </button>
            {balance.available < 50 && (
              <p className="text-sm text-gray-500 mt-2">
                Need GHS { (50 - balance.available).toFixed(2) } more to request
              </p>
            )}
          </div>

          {/* Bank Info */}
          <div className="bg-gray-50 rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Bank Details</h3>
              {!editingBank ? (
                <button
                  onClick={() => setEditingBank(true)}
                  className="flex items-center gap-1 text-teal-600 hover:text-teal-700 text-sm font-medium"
                >
                  <Edit2 size={16} /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleBankUpdate}
                    className="flex items-center gap-1 px-3 py-1 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm"
                  >
                    <Save size={14} /> Save
                  </button>
                  <button
                    onClick={() => setEditingBank(false)}
                    className="px-3 py-1 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {editingBank ? (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Bank Name"
                  value={bankInfo.bank}
                  onChange={(e) => setBankInfo({ ...bankInfo, bank: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                />
                <input
                  type="text"
                  placeholder="Account Number"
                  value={bankInfo.account}
                  onChange={(e) => setBankInfo({ ...bankInfo, account: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                />
                <input
                  type="text"
                  placeholder="Account Holder Name"
                  value={bankInfo.name}
                  onChange={(e) => setBankInfo({ ...bankInfo, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
                />
              </div>
            ) : (
              <div className="space-y-2">
                {bankInfo.bank ? (
                  <>
                    <p className="text-sm"><strong>Bank:</strong> {bankInfo.bank}</p>
                    <p className="text-sm"><strong>Account:</strong> {bankInfo.account}</p>
                    <p className="text-sm"><strong>Name:</strong> {bankInfo.name}</p>
                  </>
                ) : (
                  <p className="text-gray-500 italic">No bank details set. Add to request payouts.</p>
                )}
              </div>
            )}
          </div>

          {/* Payout History */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4">Payout History</h3>
            {payouts.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No payout requests yet.</p>
            ) : (
              <div className="space-y-4">
                {payouts.map((p, i) => (
                  <div
                    key={i}
                    className={`p-4 rounded-xl border ${
                      p.status === "completed" ? "bg-green-50 border-green-200" :
                      p.status === "pending" ? "bg-yellow-50 border-yellow-200" :
                      "bg-red-50 border-red-200"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                          p.status === "completed" ? "bg-green-600" :
                          p.status === "pending" ? "bg-yellow-600" :
                          "bg-red-600"
                        }`}>
                          {p.status === "completed" ? <CheckCircle size={20} /> :
                           p.status === "pending" ? <Clock size={20} /> :
                           <AlertCircle size={20} />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">GHS {p.amount.toFixed(2)}</p>
                          <p className="text-sm text-gray-600">
                            Requested on {new Date(p.requestedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                          p.status === "completed" ? "bg-green-100 text-green-800" :
                          p.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                          "bg-red-100 text-red-800"
                        }`}>
                          {p.status}
                        </span>
                        {p.status === "completed" && (
                          <p className="text-xs text-gray-500 mt-1">
                            Paid on {new Date(p.paidAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
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

export default AffiliatePayouts;