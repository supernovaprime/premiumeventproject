// frontend/src/pages/organizer/EventNominees.jsx
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../utils/api";
import { 
  Trophy, 
  Upload, 
  Trash2, 
  Edit2, 
  Save, 
  X, 
  Crown,
  BarChart3,
  Users
} from "lucide-react";

const EventNominees = () => {
  const { id } = useParams();
  const [categories, setCategories] = useState([]);
  const [editing, setEditing] = useState(null);
  const [editName, setEditName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNominees();
  }, [id]);

  const fetchNominees = async () => {
    try {
      const res = await api.get(`/organizer/events/${id}/nominees`);
      setCategories(res.data.categories);
    } catch (err) {
      toast.error("Failed to load nominees.");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (nomineeId, file) => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      await api.post(`/nominees/${nomineeId}/image`, formData);
      toast.success("Image updated!");
      fetchNominees();
    } catch (err) {
      toast.error("Upload failed.");
    }
  };

  const startEdit = (catId, nomId, currentName) => {
    setEditing({ catId, nomId });
    setEditName(currentName);
  };

  const saveEdit = async (catId, nomId) => {
    try {
      await api.put(`/nominees/${nomId}`, { name: editName });
      toast.success("Nominee updated!");
      setEditing(null);
      fetchNominees();
    } catch (err) {
      toast.error("Update failed.");
    }
  };

  const deleteNominee = async (nomineeId) => {
    if (!window.confirm("Delete this nominee?")) return;
    try {
      await api.delete(`/nominees/${nomineeId}`);
      toast.success("Nominee deleted.");
      fetchNominees();
    } catch (err) {
      toast.error("Delete failed.");
    }
  };

  const crownWinner = async (nomineeId) => {
    try {
      await api.post(`/events/${id}/winner`, { nomineeId });
      toast.success("Winner crowned!");
      fetchNominees();
    } catch (err) {
      toast.error("Failed to set winner.");
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
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Manage Nominees</h1>
              <p className="text-gray-600 mt-1">Edit names, upload photos, crown winners</p>
            </div>
          </div>

          {/* Categories */}
          {categories.length === 0 ? (
            <div className="text-center py-16">
              <Trophy className="mx-auto text-gray-300 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Categories Yet</h3>
              <p className="text-gray-500">Add categories in event setup.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {categories.map((cat) => {
                const totalVotes = cat.nominees.reduce((sum, n) => sum + (n.votes || 0), 0);
                return (
                  <div key={cat._id} className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <BarChart3 size={22} />
                        {cat.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Users size={16} />
                        <span>{totalVotes} total votes</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {cat.nominees.map((nom) => {
                        const percentage = totalVotes > 0 ? ((nom.votes || 0) / totalVotes * 100).toFixed(1) : 0;
                        const isEditing = editing?.catId === cat._id && editing?.nomId === nom._id;
                        const isWinner = nom.isWinner;

                        return (
                          <div
                            key={nom._id}
                            className={`bg-white rounded-2xl shadow-lg p-5 hover:shadow-xl transition-all duration-300 ${
                              isWinner ? "ring-4 ring-amber-400 ring-offset-2" : ""
                            }`}
                          >
                            {/* Winner Crown */}
                            {isWinner && (
                              <div className="absolute -top-3 -right-3 bg-amber-400 text-white rounded-full p-2 shadow-lg animate-pulse">
                                <Crown size={20} />
                              </div>
                            )}

                            {/* Image */}
                            <div className="relative group mb-4">
                              <div className="w-full h-48 bg-gray-100 rounded-xl overflow-hidden">
                                {nom.image ? (
                                  <img src={nom.image} alt={nom.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-indigo-200 to-purple-200 flex items-center justify-center text-4xl font-bold text-white">
                                    {nom.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                              </div>
                              <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition cursor-pointer rounded-xl">
                                <Upload className="text-white" size={28} />
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => handleImageUpload(nom._id, e.target.files[0])}
                                  className="hidden"
                                />
                              </label>
                            </div>

                            {/* Name & Edit */}
                            <div className="flex items-center justify-between mb-3">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="flex-1 px-3 py-1 border rounded-lg text-sm"
                                  autoFocus
                                />
                              ) : (
                                <h4 className="font-semibold text-gray-800">{nom.name}</h4>
                              )}
                              <div className="flex gap-1">
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={() => saveEdit(cat._id, nom._id)}
                                      className="p-1 text-green-600 hover:bg-green-50 rounded transition"
                                    >
                                      <Save size={16} />
                                    </button>
                                    <button
                                      onClick={() => setEditing(null)}
                                      className="p-1 text-gray-600 hover:bg-gray-50 rounded transition"
                                    >
                                      <X size={16} />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    onClick={() => startEdit(cat._id, nom._id, nom.name)}
                                    className="p-1 text-indigo-600 hover:bg-indigo-50 rounded transition"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                )}
                                <button
                                  onClick={() => deleteNominee(nom._id)}
                                  className="p-1 text-red-600 hover:bg-red-50 rounded transition"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>

                            {/* Votes */}
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Votes</span>
                                <span className="font-bold text-indigo-600">{nom.votes || 0}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                              <p className="text-xs text-gray-500 text-right">{percentage}% of category</p>
                            </div>

                            {/* Crown Winner */}
                            {!isWinner && totalVotes > 0 && (
                              <button
                                onClick={() => crownWinner(nom._id)}
                                className="mt-4 w-full py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition font-medium text-sm flex items-center justify-center gap-2"
                              >
                                <Crown size={16} />
                                Crown as Winner
                              </button>
                            )}
                            {isWinner && (
                              <div className="mt-4 text-center text-amber-600 font-bold text-sm">
                                Winner
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventNominees;