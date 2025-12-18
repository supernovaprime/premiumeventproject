// frontend/src/pages/ProductDetailPage.jsx
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../utils/api";
import Loader from "../components/Loader";
import { ShoppingCart, Star, Package, Truck } from "lucide-react";

const ProductDetailPage = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const res = await api.get(`/shop/products/${productId}`);
      setProduct(res.data.product);
    } catch (err) {
      toast.error("Product not found.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (addingToCart) return;
    setAddingToCart(true);
    try {
      await api.post("/cart/add", { productId, quantity });
      toast.success(`${quantity} × ${product.name} added to cart!`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add to cart.");
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) return <Loader />;

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Product Not Found</h2>
          <Link
            to="/shop"
            className="mt-6 inline-block bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Product Image */}
          <div className="relative group">
            <img
              src={product.image || "/placeholder-product.jpg"}
              alt={product.name}
              className="w-full h-96 lg:h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute top-4 left-4 bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
              In Stock
            </div>
          </div>

          {/* Product Details */}
          <div className="p-8 lg:p-12 flex flex-col justify-between">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-gray-800 mb-3">
                {product.name}
              </h1>
              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-yellow-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={18} fill={i < 4 ? "currentColor" : "none"} />
                  ))}
                </div>
                <span className="text-sm text-gray-600">(4.8 • 124 reviews)</span>
              </div>

              <div className="text-4xl font-bold text-indigo-600 mb-6">
                GHS {product.price.toFixed(2)}
              </div>

              <p className="text-gray-700 mb-6 leading-relaxed">
                {product.description}
              </p>

              <div className="space-y-4 mb-8">
                <div className="flex items-center gap-3 text-gray-600">
                  <Package className="text-indigo-600" size={20} />
                  <span>Premium quality materials</span>
                </div>
                <div className="flex items-center gap-3 text-gray-600">
                  <Truck className="text-indigo-600" size={20} />
                  <span>Free delivery on orders over GHS 500</span>
                </div>
              </div>
            </div>

            {/* Quantity & Add to Cart */}
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <span className="font-medium text-gray-700">Quantity:</span>
                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-3 py-2 hover:bg-gray-100 transition"
                  >
                    −
                  </button>
                  <span className="px-5 py-2 font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="px-3 py-2 hover:bg-gray-100 transition"
                  >
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={addingToCart}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3 ${
                  addingToCart
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-lg"
                }`}
              >
                <ShoppingCart size={22} />
                {addingToCart ? "Adding..." : "Add to Cart"}
              </button>

              <Link
                to="/shop"
                className="block text-center text-indigo-600 hover:text-indigo-800 font-medium"
              >
                ← Continue Shopping
              </Link>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 text-center shadow-md">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Package className="text-indigo-600" />
            </div>
            <h3 className="font-bold text-gray-800">Premium Craftsmanship</h3>
            <p className="text-sm text-gray-600 mt-1">Handcrafted with care</p>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-md">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Truck className="text-green-600" />
            </div>
            <h3 className="font-bold text-gray-800">Fast Delivery</h3>
            <p className="text-sm text-gray-600 mt-1">3–5 business days</p>
          </div>
          <div className="bg-white rounded-xl p-6 text-center shadow-md">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Star className="text-purple-600" />
            </div>
            <h3 className="font-bold text-gray-800">Award-Worthy</h3>
            <p className="text-sm text-gray-600 mt-1">Perfect for ceremonies</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;