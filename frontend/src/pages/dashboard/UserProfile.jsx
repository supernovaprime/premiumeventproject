// frontend/src/pages/dashboard/UserProfile.jsx
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import api from "../../utils/api";
import { 
  User, 
  Mail, 
  Phone, 
  Camera, 
  Save, 
  X, 
  CheckCircle 
} from "lucide-react";

const UserProfile = () => {
  const { user: authUser, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    bio: "",
    avatar: ""
  });

  useEffect(() => {
    if (authUser) {
      setFormData({
        name: authUser.name || "",
        email: authUser.email || "",
        phone: authUser.phone || "",
        bio: authUser.bio || "",
        avatar: authUser.avatar || ""
      });
    }
  }, [authUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("avatar", file);

    setUploading(true);
    try {
      const res = await api.post("/user/avatar", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      const newAvatar = res.data.avatar;
      setFormData(prev => ({ ...prev, avatar: newAvatar }));
      updateUser({ ...authUser, avatar: newAvatar });
      toast.success("Avatar updated!");
    } catch (err) {
      toast.error("Failed to upload avatar.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.put("/user/profile", formData);
      updateUser(res.data.user);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (err) {
      toast.error(err.response?.data?.message || "Update failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-8 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">My Profile</h1>
                <p className="mt-1 opacity-90">Manage your personal information</p>
              </div>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-6 py-2 bg-white text-indigo-600 rounded-xl font-medium hover:bg-gray-100 transition"
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          <div className="p-8">
            {/* Avatar */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-400 to-purple-400 flex items-center justify-center text-white text-4xl font-bold">
                      {formData.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                {isEditing && (
                  <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer opacity-0 group-hover:opacity-100 transition">
                    <Camera className="text-white" size={28} />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
              <h2 className="mt-4 text-2xl font-bold text-gray-800">{formData.name}</h2>
              <p className="text-gray-600">{formData.email}</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <User size={18} />
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      isEditing ? "border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" 
                      : "border-gray-200 bg-gray-50"
                    } transition`}
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Mail size={18} />
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      isEditing ? "border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" 
                      : "border-gray-200 bg-gray-50"
                    } transition`}
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Phone size={18} />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    placeholder="+233 123 456 789"
                    className={`w-full px-4 py-3 rounded-xl border ${
                      isEditing ? "border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" 
                      : "border-gray-200 bg-gray-50"
                    } transition`}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    disabled={!isEditing}
                    rows={4}
                    placeholder="Tell us about yourself..."
                    className={`w-full px-4 py-3 rounded-xl border ${
                      isEditing ? "border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent" 
                      : "border-gray-200 bg-gray-50"
                    } transition resize-none`}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: authUser.name,
                        email: authUser.email,
                        phone: authUser.phone || "",
                        bio: authUser.bio || "",
                        avatar: authUser.avatar || ""
                      });
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition flex items-center gap-2"
                  >
                    <X size={18} />
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`px-6 py-3 rounded-xl font-medium text-white transition flex items-center gap-2 ${
                      loading 
                        ? "bg-gray-400 cursor-not-allowed" 
                        : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg"
                    }`}
                  >
                    {loading ? (
                      <>Saving...</>
                    ) : (
                      <>
                        <Save size={18} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>

            {/* Verified Badge */}
            <div className="mt-8 flex items-center justify-center gap-2 text-green-600">
              <CheckCircle size={20} />
              <span className="font-medium">Email Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;