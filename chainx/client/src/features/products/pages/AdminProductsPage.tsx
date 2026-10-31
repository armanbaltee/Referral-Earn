import React, { useEffect, useState, useCallback } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Search,
  AlertCircle,
  X,
} from 'lucide-react';

import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Badge } from '@components/ui/badge';
import { FormField } from '@components/ui/label';
import { productApi, type Product } from '../product.api';

export default function AdminProductsPage(): React.ReactElement {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [pricePKR, setPricePKR] = useState('');
  const [comparePricePKR, setComparePricePKR] = useState('');
  const [stock, setStock] = useState('100');
  const [dailyIncomePKR, setDailyIncomePKR] = useState('0');
  const [referralCommissionPKR, setReferralCommissionPKR] = useState('0');
  const [imageUrl, setImageUrl] = useState('');
  const [level, setLevel] = useState('1');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await productApi.adminGetProducts({
        search: search.trim() || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      });
      setProducts(res.data || []);
    } catch {
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const openCreateModal = () => {
    setEditingProduct(null);
    setName('');
    setDescription('');
    setCategory('Starter Nodes');
    setPricePKR('5000');
    setComparePricePKR('');
    setStock('100');
    setDailyIncomePKR('150');
    setReferralCommissionPKR('500');
    setImageUrl('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80');
    setLevel('1');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setDescription(p.description);
    setCategory(p.category);
    setPricePKR((p.price / 100).toString());
    setComparePricePKR(p.compareAtPrice ? (p.compareAtPrice / 100).toString() : '');
    setStock(p.stock.toString());
    setDailyIncomePKR((p.dailyIncome / 100).toString());
    setReferralCommissionPKR((p.referralCommission / 100).toString());
    setImageUrl(p.images[0] || '');
    setLevel(p.level.toString());
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !category.trim() || !pricePKR) {
      setFormError('Please fill in product name, description, category, and price.');
      return;
    }

    setFormError(null);
    setIsSubmitting(true);

    try {
      const payload: Partial<Product> = {
        name: name.trim(),
        description: description.trim(),
        category: category.trim(),
        price: Math.round(Number(pricePKR) * 100),
        compareAtPrice: comparePricePKR ? Math.round(Number(comparePricePKR) * 100) : undefined,
        stock: Number(stock) || 0,
        dailyIncome: Math.round(Number(dailyIncomePKR) * 100),
        referralCommission: Math.round(Number(referralCommissionPKR) * 100),
        images: imageUrl.trim() ? [imageUrl.trim()] : [],
        level: Number(level) || 1,
      };

      if (editingProduct) {
        await productApi.adminUpdateProduct(editingProduct._id, payload);
      } else {
        await productApi.adminCreateProduct(payload);
      }

      setIsModalOpen(false);
      loadProducts();
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axError = err as { response?: { data?: { message?: string } } };
        setFormError(axError.response?.data?.message || 'Failed to save product.');
      } else {
        setFormError('Connection error. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await productApi.adminToggleStatus(id);
      loadProducts();
    } catch {
      alert('Failed to toggle status.');
    }
  };

  const handleArchive = async (id: string, prodName: string) => {
    if (!confirm(`Are you sure you want to archive "${prodName}"? It will no longer appear in the catalog.`)) {
      return;
    }
    try {
      await productApi.adminArchiveProduct(id);
      loadProducts();
    } catch {
      alert('Failed to archive product.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Product & Node Management</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure catalog assets, set pricing & daily return yields, and manage live inventory.
          </p>
        </div>
        <Button onClick={openCreateModal} className="text-xs gap-1.5 font-semibold shadow-sm">
          <Plus className="h-4 w-4" /> Add New Product
        </Button>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products by title..."
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
          <span className="text-muted-foreground">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 px-3 rounded-md border border-input bg-background text-xs font-medium text-foreground"
          >
            <option value="all">All Products</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <Card className="border-border/80 shadow-sm overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b border-border/80 text-muted-foreground uppercase text-[10px] font-semibold tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Product</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Price</th>
                <th className="px-5 py-3.5">Daily Return</th>
                <th className="px-5 py-3.5">Stock</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-muted-foreground">
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-muted-foreground">
                    No products found. Click &quot;Add New Product&quot; to create one.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const price = p.price / 100;
                  const daily = p.dailyIncome / 100;
                  return (
                    <tr key={p._id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images[0] || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80'}
                            alt={p.name}
                            className="h-10 w-10 rounded-lg object-cover border border-border flex-shrink-0"
                          />
                          <div>
                            <span className="font-bold text-foreground block">{p.name}</span>
                            <span className="text-[10px] text-muted-foreground font-mono">
                              Slug: {p.slug}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-medium">{p.category}</td>
                      <td className="px-5 py-4 font-bold text-foreground">Rs. {price.toLocaleString()}</td>
                      <td className="px-5 py-4">
                        {daily > 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                            Rs. {daily.toLocaleString()} / day
                          </span>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`font-semibold ${p.stock < 10 ? 'text-amber-500' : 'text-foreground'}`}>
                          {p.stock}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(p._id)}
                          className="cursor-pointer"
                        >
                          {p.isArchived ? (
                            <Badge variant="outline" className="text-muted-foreground">Archived</Badge>
                          ) : p.status === 'active' ? (
                            <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </button>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2.5 text-xs"
                            onClick={() => openEditModal(p)}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          {!p.isArchived && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10 border-destructive/20"
                              onClick={() => handleArchive(p._id, p.name)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create / Edit Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl my-8 bg-card border border-border/80 rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-border/60">
              <h3 className="text-lg font-bold text-foreground">
                {editingProduct ? 'Edit Product / Node' : 'Create New Product'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <FormField label="Product Name" required>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Starter Node - Tier 1"
                  disabled={isSubmitting}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Category" required>
                  <Input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g. Starter Nodes"
                    disabled={isSubmitting}
                  />
                </FormField>
                <FormField label="Level (1-10)">
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    disabled={isSubmitting}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FormField label="Price (PKR)" required>
                  <Input
                    type="number"
                    value={pricePKR}
                    onChange={(e) => setPricePKR(e.target.value)}
                    placeholder="5000"
                    disabled={isSubmitting}
                  />
                </FormField>
                <FormField label="Compare-at Price (PKR)">
                  <Input
                    type="number"
                    value={comparePricePKR}
                    onChange={(e) => setComparePricePKR(e.target.value)}
                    placeholder="Optional original price"
                    disabled={isSubmitting}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <FormField label="Daily Income (PKR)">
                  <Input
                    type="number"
                    value={dailyIncomePKR}
                    onChange={(e) => setDailyIncomePKR(e.target.value)}
                    placeholder="150"
                    disabled={isSubmitting}
                  />
                </FormField>
                <FormField label="Referral Reward (PKR)">
                  <Input
                    type="number"
                    value={referralCommissionPKR}
                    onChange={(e) => setReferralCommissionPKR(e.target.value)}
                    placeholder="500"
                    disabled={isSubmitting}
                  />
                </FormField>
                <FormField label="Stock Inventory">
                  <Input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="100"
                    disabled={isSubmitting}
                  />
                </FormField>
              </div>

              <FormField label="Image URL">
                <Input
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  disabled={isSubmitting}
                />
              </FormField>

              <FormField label="Description" required>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-xs focus:ring-1 focus:ring-primary focus:outline-none"
                  placeholder="Describe the product yield and affiliate perks..."
                  disabled={isSubmitting}
                />
              </FormField>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
