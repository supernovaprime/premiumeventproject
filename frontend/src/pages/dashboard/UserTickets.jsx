// frontend/src/pages/dashboard/UserTickets.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../utils/api";
import { 
  Ticket, 
  Download, 
  QrCode, 
  Calendar, 
  MapPin, 
  Clock,
  ExternalLink,
  RefreshCw
} from "lucide-react";

const UserTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    fetchTickets();
  }, []);

  const fetchTickets = async () => {
    try {
      const res = await api.get("/user/tickets");
      setTickets(res.data.tickets);
    } catch (err) {
      toast.error("Failed to load tickets.");
    } finally {
      setLoading(false);
    }
  };

  const downloadTicket = async (ticketId) => {
    setDownloading(ticketId);
    try {
      const res = await api.get(`/tickets/pdf/${ticketId}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `ticket-${ticketId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Ticket downloaded!");
    } catch (err) {
      toast.error("Download failed.");
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">My Tickets</h1>
              <p className="text-gray-600 mt-1">View and download your event tickets</p>
            </div>
            <button
              onClick={fetchTickets}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>

          {/* Tickets Grid */}
          {tickets.length === 0 ? (
            <div className="text-center py-16">
              <Ticket className="mx-auto text-gray-300 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Tickets Yet</h3>
              <p className="text-gray-500 mb-6">Purchase tickets to events to see them here.</p>
              <Link
                to="/events"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition"
              >
                <ExternalLink size={18} />
                Browse Events
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tickets.map((ticket) => (
                <div
                  key={ticket._id}
                  className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300"
                >
                  {/* Event Banner */}
                  <div className="h-32 bg-gradient-to-r from-indigo-500 to-purple-500 relative overflow-hidden">
                    <img
                      src={ticket.event.banner || "/placeholder-banner.jpg"}
                      alt={ticket.event.title}
                      className="w-full h-full object-cover opacity-30"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                    <div className="absolute bottom-3 left-4 text-white">
                      <h3 className="text-lg font-bold">{ticket.event.title}</h3>
                      <p className="text-sm opacity-90">{ticket.type} Ticket</p>
                    </div>
                  </div>

                  {/* Ticket Details */}
                  <div className="p-5 space-y-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar size={16} />
                      <span>{new Date(ticket.event.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock size={16} />
                      <span>{ticket.event.time || "Time TBD"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <MapPin size={16} />
                      <span>{ticket.event.venue || "Venue TBD"}</span>
                    </div>

                    {/* QR Code */}
                    <div className="flex justify-center py-3">
                      <div className="bg-white p-3 rounded-xl shadow-inner">
                        <img
                          src={ticket.qrCode}
                          alt="QR Code"
                          className="w-32 h-32"
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => downloadTicket(ticket._id)}
                        disabled={downloading === ticket._id}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition ${
                          downloading === ticket._id
                            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                            : "bg-indigo-600 text-white hover:bg-indigo-700"
                        }`}
                      >
                        {downloading === ticket._id ? (
                          <>Downloading...</>
                        ) : (
                          <>
                            <Download size={16} />
                            PDF
                          </>
                        )}
                      </button>
                      <Link
                        to={`/events/${ticket.event._id}`}
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                      >
                        <ExternalLink size={16} />
                        View Event
                      </Link>
                    </div>

                    {/* Status */}
                    <div className="text-center">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                        ticket.status === "valid"
                          ? "bg-green-100 text-green-800"
                          : ticket.status === "used"
                          ? "bg-gray-100 text-gray-600"
                          : "bg-red-100 text-red-800"
                      }`}>
                        <QrCode size={14} />
                        {ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserTickets;