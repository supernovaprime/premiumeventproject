import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { 
  ShoppingBag, 
  Package, 
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  DollarSign,
  Image as ImageIcon,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { shopAPI } from '../../utils/api';
import Card from '../../components/ui/Card';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import LoadingSpinner from '../../components/LoadingSpinner';
import { toast } from 'react-hot-toast';

const AdminShop = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const limit = 12;

  const { data: productsData, isLoading } = useQuery(
    ['adminProducts', page, categoryFilter, searchTerm],
    () => shopAPI.getProducts({
      page,
      limit,
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      search: searchTerm || undefined
    }),
    {
      keepPreviousData: true
    }
  );

  const { data: ordersData, isLoading: ordersLoading } = useQuery(
    ['adminOrders', page],
    () => shopAPI.getOrdersByUser({ page, limit }),
    {
      enabled: false // We'll need admin-specific endpoint
    }
  );

  const products = productsData?.data?.products || [];
  const orders = ordersData?.data?.orders || [];
  const pagination = productsData?.data?.pagination || {};

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    images: [],
    status: 'active'
  });

  const createProductMutation = useMutation(
    (productData) => shopAPI.createProduct(productData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminProducts');
        toast.success('Product created successfully');
        setProductModalOpen(false);
        resetForm();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to create product');
      }
    }
  );

  const updateProductMutation = useMutation(
    ({ productId, productData }) => shopAPI.updateProduct(productId, productData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminProducts');
        toast.success('Product updated successfully');
        setProductModalOpen(false);
        resetForm();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to update product');
      }
    }
  );

  const deleteProductMutation = useMutation(
    (productId) => shopAPI.deleteProduct(productId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('adminProducts');
        toast.success('Product deleted successfully');
        setDeleteModalOpen(false);
        setSelectedProduct(null);
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to delete product');
      }
    }
  );

  const resetForm = () => {
    setProductForm({
      name: '',
      description: '',
      price: '',
      category: '',
      stock: '',
      images: [],
      status: 'active'
    });
    setIsEditing(false);
    setSelectedProduct(null);
  };

  const handleEdit = (product) => {
    setSelectedProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price,
      category: product.category,
      stock: product.inventory?.quantity || 0,
      images: product.images || [],
      status: product.status
    });
    setIsEditing(true);
    setProductModalOpen(true);
  };

  const handleDelete = (product) => {
    setSelectedProduct(product);
    setDeleteModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const productData = {
      ...productForm,
      price: parseFloat(productForm.price),
      stock: parseInt(productForm.stock)
    };

    if (isEditing) {
      updateProductMutation.mutate({
        productId: selectedProduct._id,
        productData
      });
    } else {
      createProductMutation.mutate(productData);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { variant: 'success', label: 'Active' },
      inactive: { variant: 'default', label: 'Inactive' },
      out_of_stock: { variant: 'error', label: 'Out of Stock' }
    };
    const config = statusConfig[status] || statusConfig.inactive;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (isLoading && page === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="large" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Shop Management</h1>
          <p className="text-gray-600 mt-2">Manage products and inventory</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setProductModalOpen(true);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Products</p>
              <p className="text-2xl font-bold text-gray-900">{pagination.totalProducts || 0}</p>
            </div>
            <Package className="w-8 h-8 text-primary-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Active Products</p>
              <p className="text-2xl font-bold text-gray-900">
                {products.filter(p => p.status === 'active').length}
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-success-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Low Stock</p>
              <p className="text-2xl font-bold text-gray-900">
                {products.filter(p => p.inventory?.quantity <= (p.inventory?.lowStockThreshold || 5)).length}
              </p>
            </div>
            <AlertCircle className="w-8 h-8 text-warning-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 mb-1">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                ${(products.reduce((sum, p) => sum + (p.sales?.totalRevenue || 0), 0)).toLocaleString()}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-success-500" />
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            leftIcon={<Search className="w-5 h-5 text-gray-400" />}
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Categories</option>
            <option value="plaque">Plaques</option>
            <option value="trophy">Trophies</option>
            <option value="certificate">Certificates</option>
            <option value="medal">Medals</option>
            <option value="banner">Banners</option>
          </select>
        </div>
      </Card>

      {/* Products Grid */}
      {products.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Products Found</h3>
            <p className="text-gray-600 mb-4">Get started by adding your first product.</p>
            <Button
              onClick={() => {
                resetForm();
                setProductModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Product
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <Card key={product._id} hover>
                {/* Product Image */}
                <div className="relative h-48 bg-gradient-to-br from-primary-50 to-secondary-50 rounded-lg mb-4 overflow-hidden">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ImageIcon className="w-16 h-16 text-primary-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(product.status)}
                  </div>
                </div>

                {/* Product Info */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {product.description}
                  </p>

                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-2xl font-bold text-primary-600">
                        ${product.price}
                      </p>
                      <p className="text-xs text-gray-500">
                        Stock: {product.inventory?.quantity || 0}
                      </p>
                    </div>
                    <Badge variant="default">{product.category}</Badge>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => handleEdit(product)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="error"
                      size="sm"
                      onClick={() => handleDelete(product)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, pagination.totalProducts)} of {pagination.totalProducts} products
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!pagination.hasNextPage}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Product Modal */}
      <Modal
        isOpen={productModalOpen}
        onClose={() => {
          setProductModalOpen(false);
          resetForm();
        }}
        title={isEditing ? 'Edit Product' : 'Add New Product'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Product Name *
            </label>
            <Input
              value={productForm.name}
              onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              required
              placeholder="Enter product name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description *
            </label>
            <textarea
              value={productForm.description}
              onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              required
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter product description"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price ($) *
              </label>
              <Input
                type="number"
                step="0.01"
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                required
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Stock Quantity *
              </label>
              <Input
                type="number"
                value={productForm.stock}
                onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                required
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={productForm.category}
              onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="">Select category</option>
              <option value="plaque">Plaque</option>
              <option value="trophy">Trophy</option>
              <option value="certificate">Certificate</option>
              <option value="medal">Medal</option>
              <option value="banner">Banner</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={productForm.status}
              onChange={(e) => setProductForm({ ...productForm, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="submit"
              variant="primary"
              disabled={createProductMutation.isLoading || updateProductMutation.isLoading}
              className="flex-1"
            >
              {isEditing ? 'Update Product' : 'Create Product'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setProductModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedProduct(null);
        }}
        title="Delete Product"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{selectedProduct?.name}</strong>? This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <Button
              variant="error"
              onClick={() => {
                deleteProductMutation.mutate(selectedProduct._id);
              }}
              disabled={deleteProductMutation.isLoading}
            >
              Delete Product
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteModalOpen(false);
                setSelectedProduct(null);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AdminShop;