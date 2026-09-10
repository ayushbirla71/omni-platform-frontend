import React, { useEffect, useState } from 'react';
import {
  Package,
  Search,
  Plus,
  Edit2,
  Trash2,
  Tag,
  CheckCircle2,
  XCircle,
  Image as ImageIcon,
  DollarSign,
  Layers,
  AlertCircle,
  RefreshCw,
  Eye,
  ExternalLink,
} from 'lucide-react';
import { productsApi } from '../api';
import type { Product } from '../types';
import { useToast } from '../context/ToastContext';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { Input } from '../components/common/Input';
import { Spinner } from '../components/common/Tabs';
import { formatDateTime, cn } from '../lib/utils';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [availableOnly, setAvailableOnly] = useState(false);

  // Add / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    price: '',
    currency: 'INR',
    category: '',
    images: '',
    inventoryQuantity: '100',
    isAvailable: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete confirmation modal
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Lightbox preview
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const { showToast } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        productsApi.list({
          search: searchQuery || undefined,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          availableOnly: availableOnly || undefined,
        }),
        productsApi.getCategories().catch(() => ({ categories: [] })),
      ]);

      setProducts(prodRes.products || []);
      setTotal(prodRes.total || 0);
      setCategories(catRes.categories || []);
    } catch (err: any) {
      showToast(err?.message || 'Failed to load products', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedCategory, availableOnly]);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
      description: '',
      price: '499',
      currency: 'INR',
      category: categories[0] || 'General',
      images: '',
      inventoryQuantity: '50',
      isAvailable: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      description: product.description || '',
      price: String(product.price || 0),
      currency: product.currency || 'INR',
      category: product.category || '',
      images: (product.images || []).join('\n'),
      inventoryQuantity: String(product.inventoryQuantity ?? product.inventory_quantity ?? 0),
      isAvailable: product.isAvailable ?? product.is_available ?? true,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sku.trim()) {
      showToast('Product name and SKU are required', 'error');
      return;
    }

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      showToast('Please enter a valid price', 'error');
      return;
    }

    const parsedImages = formData.images
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: formData.name.trim(),
      sku: formData.sku.trim().toUpperCase(),
      description: formData.description.trim() || null,
      price: priceNum,
      currency: formData.currency.trim().toUpperCase() || 'INR',
      category: formData.category.trim() || null,
      images: parsedImages,
      inventoryQuantity: parseInt(formData.inventoryQuantity, 10) || 0,
      isAvailable: formData.isAvailable,
    };

    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await productsApi.update(editingProduct.id, payload);
        showToast('Product updated successfully', 'success');
      } else {
        await productsApi.create(payload);
        showToast('Product created successfully', 'success');
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to save product', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmProduct) return;
    setIsDeleting(true);
    try {
      await productsApi.delete(deleteConfirmProduct.id);
      showToast('Product deleted', 'success');
      setDeleteConfirmProduct(null);
      loadData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete product', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleAvailability = async (product: Product) => {
    const newStatus = !(product.isAvailable ?? product.is_available ?? true);
    try {
      await productsApi.update(product.id, { isAvailable: newStatus });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isAvailable: newStatus, is_available: newStatus } : p))
      );
      showToast(`Product is now ${newStatus ? 'available' : 'unavailable'}`, 'info');
    } catch (err: any) {
      showToast('Failed to update availability', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary-100 rounded-xl text-primary-600">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Products & Catalogs</h1>
              <p className="text-xs text-gray-500">
                Manage your multi-channel product catalog for WhatsApp interactive commerce
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            icon={<RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />}
          >
            Refresh
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={openAddModal}
            icon={<Plus className="w-4 h-4" />}
          >
            Add Product
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
          <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products by title, SKU, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-primary-500 focus:outline-none"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-gray-400 shrink-0" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="text-xs bg-gray-50 border border-gray-200 text-gray-700 px-3 py-2 rounded-xl focus:bg-white focus:ring-1 focus:ring-primary-500 cursor-pointer"
              >
                <option value="all">All Categories ({categories.length})</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Availability Toggle */}
          <label className="flex items-center gap-2 text-xs text-gray-700 font-medium cursor-pointer select-none">
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span>In Stock / Available Only</span>
          </label>
        </div>
      </Card>

      {/* Products Grid / Table */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : products.length === 0 ? (
        <Card className="p-12 text-center space-y-3">
          <Package className="w-12 h-12 text-gray-300 mx-auto" />
          <h3 className="text-sm font-semibold text-gray-900">No products found</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Get started by adding your first product to enable WhatsApp catalog ordering and payment links.
          </p>
          <Button variant="primary" size="sm" onClick={openAddModal} icon={<Plus className="w-4 h-4" />}>
            Create Product
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => {
            const isAvail = product.isAvailable ?? product.is_available ?? true;
            const stockQty = product.inventoryQuantity ?? product.inventory_quantity ?? 0;
            const firstImage = product.images && product.images.length > 0 ? product.images[0] : null;

            return (
              <Card key={product.id} className="overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  {/* Product Image Header */}
                  <div className="relative h-44 bg-slate-100 flex items-center justify-center overflow-hidden border-b border-gray-100">
                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt={product.name}
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-200"
                        onClick={() => setPreviewImage(firstImage)}
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-400 gap-1">
                        <ImageIcon className="w-8 h-8 opacity-40" />
                        <span className="text-[11px]">No image uploaded</span>
                      </div>
                    )}

                    {/* Stock & Availability Badges */}
                    <div className="absolute top-2 left-2 flex gap-1">
                      <Badge
                        variant={isAvail ? 'success' : 'secondary'}
                        size="sm"
                        className="shadow-xs backdrop-blur-xs bg-white/90"
                      >
                        {isAvail ? 'In Stock' : 'Out of Stock'}
                      </Badge>
                      {product.category && (
                        <Badge variant="purple" size="sm" className="shadow-xs backdrop-blur-xs bg-white/90">
                          {product.category}
                        </Badge>
                      )}
                    </div>

                    <div className="absolute top-2 right-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-900/80 text-white shadow-xs">
                        {product.sku}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-1">
                        {product.name}
                      </h3>
                      <p className="text-sm font-extrabold text-primary-700 whitespace-nowrap">
                        {product.currency} {product.price?.toLocaleString()}
                      </p>
                    </div>

                    <p className="text-xs text-gray-500 line-clamp-2 min-h-[2rem]">
                      {product.description || 'No description provided.'}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-gray-500 pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-gray-400" />
                        <span>Qty: <strong>{stockQty}</strong></span>
                      </div>
                      <span className="text-[10px] text-gray-400">
                        Updated {formatDateTime(product.updatedAt || product.updated_at || product.createdAt || product.created_at)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="px-4 py-3 bg-gray-50/60 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => toggleAvailability(product)}
                    className={cn(
                      'text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1',
                      isAvail
                        ? 'text-gray-600 hover:bg-gray-200'
                        : 'text-emerald-700 hover:bg-emerald-100'
                    )}
                  >
                    {isAvail ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                    <span>{isAvail ? 'Mark Out of Stock' : 'Mark Available'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(product)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                      title="Edit Product"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmProduct(product)}
                      className="p-1.5 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete Product"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          if (!isSubmitting) setIsModalOpen(false);
        }}
        title={editingProduct ? 'Edit Product' : 'Add New Product'}
        description="Configure product details for WhatsApp catalog & checkout links"
        maxWidth="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Product Title *"
              placeholder="e.g. Wireless Bluetooth Headphones"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <Input
              label="SKU (Retailer Product ID) *"
              placeholder="e.g. AUDIO-HD-001"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Price *"
              type="number"
              step="0.01"
              placeholder="999"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Currency</label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-1 focus:ring-primary-500"
              >
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="AED">AED (د.إ)</option>
              </select>
            </div>
            <Input
              label="Inventory Quantity"
              type="number"
              placeholder="100"
              value={formData.inventoryQuantity}
              onChange={(e) => setFormData({ ...formData, inventoryQuantity: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1.5">Category</label>
              <input
                type="text"
                placeholder="e.g. Electronics, Footwear, Services"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                list="category-suggestions"
                className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-1 focus:ring-primary-500"
              />
              <datalist id="category-suggestions">
                {categories.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2.5 text-xs font-semibold text-gray-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-4 h-4"
                />
                <span>Product is available for purchase</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Product Description</label>
            <textarea
              rows={3}
              placeholder="Detailed description shown in WhatsApp catalog message..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-1 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              Image URLs (one URL per line)
            </label>
            <textarea
              rows={2}
              placeholder="https://example.com/images/product-front.jpg"
              value={formData.images}
              onChange={(e) => setFormData({ ...formData, images: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:ring-1 focus:ring-primary-500 font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              {editingProduct ? 'Save Changes' : 'Create Product'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteConfirmProduct)}
        onClose={() => setDeleteConfirmProduct(null)}
        title="Delete Product"
        description="Are you sure you want to delete this product? This action cannot be undone."
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-gray-600">
            Deleting <strong>{deleteConfirmProduct?.name}</strong> (SKU: {deleteConfirmProduct?.sku}) will remove it from future WhatsApp catalog queries.
          </p>
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteConfirmProduct(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
              isLoading={isDeleting}
            >
              Delete Product
            </Button>
          </div>
        </div>
      </Modal>

      {/* Image Lightbox */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-2xl max-h-[85vh]">
            <img
              src={previewImage}
              alt="Product Preview"
              className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl"
            />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/90 text-white rounded-full transition-colors"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
