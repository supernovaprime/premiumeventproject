// frontend/src/pages/dashboard/UserOrders.jsx
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../utils/api";
import { 
  ShoppingBag, 
  Package, 
  Truck, 
  Download, 
  Clock, 
  CheckCircle,
  XCircle,
  RefreshCw,
  ExternalLink
} from "lucide-react";

const UserOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get("/user/orders");
      setOrders(res.data.orders);
    } catch (err) {
      toast.error("Failed to load orders.");
    } finally {
      setLoading(false);
    }
  };

  const downloadInvoice = async (orderId) => {
    setDownloading(orderId);
    try {
      const res = await api.get(`/orders/invoice/${orderId}`, { responseType: "blob" });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Invoice downloaded!");
    } catch (err) {
      toast.error("Download failed.");
    } finally {
      setDownloading(null);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending": return <Clock className="text-yellow-600" size={18} />;
      case "processing": return <Package className="text-blue-600" size={18} />;
      case "shipped": return <Truck className="text-indigo-600" size={18} />;
      case "delivered": return <CheckCircle className="text-green-600" size={18} />;
      case "cancelled": return <XCircle className="text-red-600" size={18} />;
      default: return <Clock className="text-gray-600" size={18} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "processing": return "bg-blue-100 text-blue-800";
      case "shipped": return "bg-indigo-100 text-indigo-800";
      case "delivered": return "bg-green-100 text-green-800";
      case "cancelled": return "bg-red-100 text-red-800";
      default: return "bg-gray-100 text-gray-800";
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
              <h1 className="text-3xl font-bold text-gray-800">My Orders</h1>
              <p className="text-gray-600 mt-1">Track and download invoices for your award purchases</p>
            </div>
            <button
              onClick={fetchOrders}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition"
            >
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>

          {/* Orders List */}
          {orders.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingBag className="mx-auto text-gray-300 mb-4" size={64} />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Orders Yet</h3>
              <p className="text-gray-500 mb-6">Your shop orders will appear here.</p>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:shadow-lg transition"
              >
                <ExternalLink size={18} />
                Go to Shop
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div
                  key={order._id}
                  className="bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-gray-800">Order #{order.orderNumber}</h3>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        Placed on {new Date(order.createdAt).toLocaleDateString()} • {order.items.length} item(s)
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => downloadInvoice(order._id)}
                        disabled={downloading === order._id}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
                          downloading === order._id
                            ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                            : "bg-indigo-600 text-white hover:bg-indigo-700"
                        }`}
                      >
                        {downloading === order._id ? (
                          <>Downloading...</>
                        ) : (
                          <>
                            <Download size={16} />
                            Invoice
                          </>
                        )}
                      </button>
                      <Link
                        to={`/shop/product/${order.items[0].product._id}`}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition font-medium"
                      >
                        <ExternalLink size={16} />
                        View Product
                      </Link>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-3 shadow-sm">
                        <img
                          src={item.product.image || "/placeholder-product.jpg"}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-gray-800 text-sm">{item.product.name}</p>
                          <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                          <p className="text-sm font-semibold text-indigo-600">GHS {item.price.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="flex justify-end items-center gap-6 mt-6 pt-4 border-t border-gray-200">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Total Amount</p>
                      <p className="text-2xl font-bold text-indigo-600">GHS {order.total.toFixed(2)}</p>
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

export default UserOrders;