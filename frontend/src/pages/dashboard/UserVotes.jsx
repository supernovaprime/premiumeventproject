// frontend/src/pages/dashboard/UserVotes.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../utils/api";
import { 
  Trophy, 
  Calendar, 
  Clock, 
  MapPin, 
  CheckCircle,
  ExternalLink,
  RefreshCw
} from "lucide-react";

const UserVotes = () => {
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVotes();
  }, []);

  const fetchVotes = async () => {
    try {
      const res = await api.get("/user/votes");
      setVotes(res.data.votes);
    } catch (err) {
      toast.error("Failed to load votes.");
    } finally {
      setLoading(false);
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
              <h1 className="text-3xl font-bold text-gray-800">My Votes</h1>
              <p className="text-gray-600 mt-1">View your voting history across all events</p>
            </div>
            <button
              onClick={fetchVotes}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>

          {/* Votes List */}
          {votes.length === 0 ? (
            <div className="text-center py-16">
              <Trophy className="mx-auto text-gray-300 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Votes Cast</h3>
              <p className="text-gray-500 mb-6">Your votes will appear here once you participate in events.</p>
              <Link
                to="/events"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition"
              >
                <ExternalLink size={18} />
                Explore Events
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {votes.map((vote) => (
                <div
                  key={vote._id}
                  className="bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-800">{vote.event.title}</h3>
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle size={14} />
                          Vote Confirmed
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar size={16} />
                          <span>{new Date(vote.event.date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock size={16} />
                          <span>{vote.event.time || "Time TBD"}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin size={16} />
                          <span>{vote.event.venue || "Venue TBD"}</span>
                        </div>
                      </div>
                    </div>
                    <Link
                      to={`/events/${vote.event._id}/vote`}
                      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition font-medium"
                    >
                      <ExternalLink size={16} />
                      View Event
                    </Link>
                  </div>

                  {/* Nominee Voted For */}
                  <div className="mt-5 p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                    <p className="text-sm font-medium text-amber-900 mb-1">You voted for:</p>
                    <div className="flex items-center gap-3">
                      {vote.nominee.image ? (
                        <img
                          src={vote.nominee.image}
                          alt={vote.nominee.name}
                          className="w-12 h-12 rounded-full object-cover border-2 border-amber-300"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-amber-200 rounded-full flex items-center justify-center text-amber-700 font-bold">
                          {vote.nominee.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-800">{vote.nominee.name}</p>
                        <p className="text-sm text-amber-700">Category: {vote.category.name}</p>
                      </div>
                    </div>
                  </div>

                  {/* Vote Timestamp */}
                  <div className="mt-4 text-right text-xs text-gray-500">
                    Voted on {new Date(vote.createdAt).toLocaleString()}
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

export default UserVotes;