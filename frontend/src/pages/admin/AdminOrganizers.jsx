// frontend/src/pages/admin/AdminOrganizers.jsx
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import api from "../../utils/api";
import { 
  Search, 
  Calendar, 
  Ticket, 
  DollarSign, 
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  Eye,
  Ban
} from "lucide-react";

const AdminOrganizers = () => {
  const [organizers, setOrganizers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [actioning, setActioning] = useState(null);

  useEffect(() => {
    fetchOrganizers();
  }, []);

  const fetchOrganizers = async () => {
    try {
      const res = await api.get("/admin/organizers");
      setOrganizers(res.data.organizers);
    } catch (err) {
      toast.error("Failed to load organizers.");
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (orgId, approve) => {
    setActioning(orgId);
    try {
      await api.put(`/admin/organizers/${orgId}/approval`, { isApproved: approve });
      toast.success(approve ? "Organizer approved!" : "Approval revoked.");
      fetchOrganizers();
    } catch (err) {
      toast.error("Action failed.");
    } finally {
      setActioning(null);
    }
  };

  const filteredOrganizers = organizers.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-blue-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Organizer Management</h1>
              <p className="text-gray-600 mt-1">Approve, view stats, and manage events</p>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-xl w-full focus:ring-2 focus:ring-red-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Organizers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOrganizers.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <Users className="mx-auto text-gray-300 mb-4" size={64} />
                <p className="text-gray-500">No organizers found.</p>
              </div>
            ) : (
              filteredOrganizers.map(org => (
                <div
                  key={org._id}
                  className={`bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 ${
                    !org.isApproved ? "ring-2 ring-yellow-400 ring-offset-2" : ""
                  }`}
                >
                  {/* Profile */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {org.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800">{org.name}</h3>
                      <p className="text-sm text-gray-600">{org.email}</p>
                      <p className="text-xs text-gray-500">ID: {org._id.slice(-6)}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 text-center mb-4">
                    <div>
                      <Calendar size={18} className="mx-auto text-blue-600 mb-1" />
                      <p className="font-bold text-lg">{org.totalEvents}</p>
                      <p className="text-xs text-gray-500">Events</p>
                    </div>
                    <div>
                      <Ticket size={18} className="mx-auto text-green-600 mb-1" />
                      <p className="font-bold text-lg">{org.totalTickets}</p>
                      <p className="text-xs text-gray-500">Sold</p>
                    </div>
                    <div>
                      <DollarSign size={18} className="mx-auto text-yellow-600 mb-1" />
                      <p className="font-bold text-lg">GHS {org.totalRevenue}</p>
                      <p className="text-xs text-gray-500">Revenue</p>
                    </div>
                  </div>

                  {/* Approval Status */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                      org.isApproved 
                        ? "bg-green-100 text-green-800" 
                        : "bg-yellow-100 text-yellow-800"
                    }`}>
                      {org.isApproved ? <CheckCircle size={14} /> : <XCircle size={14} />}
                      {org.isApproved ? "Approved" : "Pending"}
                    </span>
                    <span className="text-xs text-gray-500">
                      Joined {new Date(org.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedOrg(org)}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
                    >
                      <Eye size={16} /> View
                    </button>
                    {!org.isApproved && (
                      <button
                        onClick={() => handleApproval(org._id, true)}
                        disabled={actioning === org._id}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-sm font-medium disabled:opacity-50"
                      >
                        <CheckCircle size={16} /> Approve
                      </button>
                    )}
                    {org.isApproved && (
                      <button
                        onClick={() => handleApproval(org._id, false)}
                        disabled={actioning === org._id}
                        className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition text-sm font-medium disabled:opacity-50"
                      >
                        <Ban size={16} /> Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Organizer Details Modal */}
      {selectedOrg && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {selectedOrg.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">{selectedOrg.name}</h2>
                    <p className="text-gray-600">{selectedOrg.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedOrg(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition"
                >
                  <XCircle size={24} className="text-gray-500" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 rounded-xl p-4 text-center">
                  <TrendingUp size={24} className="mx-auto text-blue-600 mb-2" />
                  <p className="text-2xl font-bold">{selectedOrg.totalEvents}</p>
                  <p className="text-sm text-gray-600">Total Events</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4 text-center">
                  <Ticket size={24} className="mx-auto text-green-600 mb-2" />
                  <p className="text-2xl font-bold">{selectedOrg.totalTickets}</p>
                  <p className="text-sm text-gray-600">Tickets Sold</p>
                </div>
                <div className="bg-yellow-50 rounded-xl p-4 text-center">
                  <DollarSign size={24} className="mx-auto text-yellow-600 mb-2" />
                  <p className="text-2xl font-bold">GHS {selectedOrg.totalRevenue}</p>
                  <p className="text-sm text-gray-600">Revenue</p>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-gray-800 mb-3">Events Created</h3>
                {selectedOrg.events.length === 0 ? (
                  <p className="text-gray-500">No events yet.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedOrg.events.map(ev => (
                      <div key={ev._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div>
                          <p className="font-medium">{ev.title}</p>
                          <p className="text-sm text-gray-600">{new Date(ev.date).toLocaleDateString()}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          ev.status === "live" ? "bg-green-100 text-green-800" :
                          ev.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                          "bg-gray-100 text-gray-600"
                        }`}>
                          {ev.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrganizers;