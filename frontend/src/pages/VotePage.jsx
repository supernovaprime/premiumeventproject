// frontend/src/pages/VotePage.jsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../utils/api";
import Loader from "../components/Loader";
import NomineeCard from "../components/NomineeCard";

const VotePage = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [eventId]);

  const fetchEvent = async () => {
    try {
      const res = await api.get(`/events/${eventId}`);
      setEvent(res.data.event);
      setCategories(res.data.categories);
    } catch (err) {
      toast.error("Event not found or voting closed.");
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (nomineeId, categoryId) => {
    if (voting) return;
    setVoting(true);
    try {
      await api.post("/votes", { eventId, nomineeId, categoryId });
      toast.success("Vote recorded!");
      fetchEvent(); // Refresh vote counts
    } catch (err) {
      toast.error(err.response?.data?.message || "Vote failed. Try again.");
    } finally {
      setVoting(false);
    }
  };

  if (loading) return <Loader />;

  if (!event || !event.isVotingOpen) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Voting Closed</h2>
          <p className="text-gray-600">This event is not accepting votes at the moment.</p>
          <Link
            to={`/events/${eventId}`}
            className="mt-6 inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Back to Event
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Event Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 text-center">
          <img
            src={event.banner || "/placeholder-banner.jpg"}
            alt={event.title}
            className="w-full h-48 object-cover rounded-xl mb-4"
          />
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800">{event.title}</h1>
          <p className="text-gray-600 mt-2">{event.description}</p>
          <div className="flex justify-center gap-4 mt-4">
            <span className="bg-green-100 text-green-800 px-4 py-1 rounded-full text-sm font-medium">
              Voting Open
            </span>
            <span className="bg-indigo-100 text-indigo-800 px-4 py-1 rounded-full text-sm">
              {new Date(event.votingEndDate).toLocaleDateString()}
            </span>
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-10">
          {categories.map((category) => (
            <div key={category._id} className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-3 border-b-2 border-indigo-200">
                {category.name}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.nominees.map((nominee) => (
                  <NomineeCard
                    key={nominee._id}
                    nominee={nominee}
                    onVote={() => handleVote(nominee._id, category._id)}
                    disabled={voting}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-gray-500">
            One vote per category • Results updated in real-time
          </p>
        </div>
      </div>
    </div>
  );
};

export default VotePage;