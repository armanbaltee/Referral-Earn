import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  Package,
  Sparkles,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';

import { Card, CardContent } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Badge } from '@components/ui/badge';
import { productApi, type Product, type PaginationMeta } from '../product.api';

// Default starter products to display immediately if database is empty
const DEMO_PRODUCTS: Product[] = [
  {
    _id: 'p1',
    name: 'Starter Node - Tier 1',
    slug: 'starter-node-tier-1',
    description: 'Entry-level affiliate node with automated daily yields, high referral multi-tier rewards, and verified ledger tracking.',
    images: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80'],
    price: 500000, // Rs. 5,000
    compareAtPrice: 700000,
    dailyIncome: 15000, // Rs. 150/day
    referralCommission: 50000, // Rs. 500
    level: 1,
    stock: 45,
    trackInventory: true,
    status: 'active',
    isArchived: false,
    category: 'Starter Nodes',
    tags: ['Best Seller', 'Instant Yield'],
    totalPurchases: 184,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'p2',
    name: 'Pro Capital Node - Tier 2',
    slug: 'pro-capital-node-tier-2',
    description: 'High-performance earning node built for active team builders with doubled daily returns and priority commission payouts.',
    images: ['https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=600&auto=format&fit=crop&q=80'],
    price: 1500000, // Rs. 15,000
    compareAtPrice: 2000000,
    dailyIncome: 50000, // Rs. 500/day
    referralCommission: 150000, // Rs. 1,500
    level: 2,
    stock: 28,
    trackInventory: true,
    status: 'active',
    isArchived: false,
    category: 'Growth Nodes',
    tags: ['Popular', '2x Yield'],
    totalPurchases: 92,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'p3',
    name: 'Executive Wealth Node - Tier 3',
    slug: 'executive-wealth-node-tier-3',
    description: 'Enterprise grade node with premium multi-level commission privileges, direct manager support, and maximum daily returns.',
    images: ['https://images.unsplash.com/photo-1642790106117-e829e14a795f?w=600&auto=format&fit=crop&q=80'],
    price: 3500000, // Rs. 35,000
    compareAtPrice: 4500000,
    dailyIncome: 140000, // Rs. 1,400/day
    referralCommission: 400000, // Rs. 4,000
    level: 3,
    stock: 12,
    trackInventory: true,
    status: 'active',
    isArchived: false,
    category: 'Executive Nodes',
    tags: ['VIP Privileges', 'Top Yield'],
    totalPurchases: 47,
    createdAt: new Date().toISOString(),
  },
  {
    _id: 'p4',
    name: 'Digital Affiliate Master Kit',
    slug: 'digital-affiliate-master-kit',
    description: 'Complete training, social media marketing automation software, and verified lead funnel templates for partner recruitment.',
    images: ['https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=80'],
    price: 300000, // Rs. 3,000
    dailyIncome: 0,
    referralCommission: 60000, // Rs. 600
    level: 1,
    stock: 999,
    trackInventory: false,
    status: 'active',
    isArchived: false,
    category: 'Digital Tools',
    tags: ['Toolkits', 'Marketing'],
    totalPurchases: 320,
    createdAt: new Date().toISOString(),
  },
];

export default function ProductCatalogPage(): React.ReactElement {
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const categories = ['all', 'Starter Nodes', 'Growth Nodes', 'Executive Nodes', 'Digital Tools'];
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<'newest' | 'price_asc' | 'price_desc' | 'popular'>('popular');
  const [isLoading, setIsLoading] = useState(false);
  const [meta, setMeta] = useState<PaginationMeta>({
    total: DEMO_PRODUCTS.length,
    page: 1,
    limit: 12,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  });

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await productApi.getProducts({
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        search: searchQuery.trim() || undefined,
        sort: sortOption,
      });
      if (res.data && res.data.length > 0) {
        setProducts(res.data);
        setMeta(res.meta);
      } else if (selectedCategory === 'all' && !searchQuery) {
        // Fallback to rich demo items so UI is instantly populated
        setProducts(DEMO_PRODUCTS);
      } else {
        setProducts([]);
      }
    } catch {
      // Use fallback data
      setProducts(DEMO_PRODUCTS);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, searchQuery, sortOption]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-900 via-primary/90 to-zinc-900 text-white p-8 sm:p-12 shadow-2xl border border-zinc-800">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/30 border border-primary/40 text-xs font-semibold text-primary-foreground">
            <Sparkles className="h-3.5 w-3.5" /> High-Yield Affiliate Assets
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Product & Node Catalog
          </h1>
          <p className="text-sm text-zinc-300 leading-relaxed">
            Deploy automated earning nodes, explore digital partner tools, and boost your daily returns through multi-tier commission structures.
          </p>
        </div>
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-primary/20 to-transparent pointer-events-none" />
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-card border border-border/80 p-4 rounded-xl shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, nodes or toolkits..."
            className="pl-9 bg-background/60"
          />
        </div>

        {/* Sort & Controls */}
        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-xs font-medium text-muted-foreground">
            {meta.total} products available
          </span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <SlidersHorizontal className="h-3.5 w-3.5" /> Sort:
          </div>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as never)}
            className="h-9 px-3 rounded-md border border-input bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="popular">Most Popular</option>
            <option value="newest">Newest First</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            {cat === 'all' ? 'All Products' : cat}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-80 rounded-xl bg-muted/40 animate-pulse border border-border/60" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border bg-card/50 space-y-3">
          <Package className="h-10 w-10 text-muted-foreground mx-auto" />
          <h3 className="text-base font-semibold text-foreground">No products found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Try adjusting your search criteria or switching to a different category filter.
          </p>
          <Button onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }} variant="outline" size="sm">
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => {
            const pricePKR = product.price / 100;
            const comparePKR = product.compareAtPrice ? product.compareAtPrice / 100 : null;
            const dailyPKR = product.dailyIncome / 100;

            return (
              <Card
                key={product._id}
                className="group border-border/70 hover:border-primary/50 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col bg-card"
              >
                {/* Product Image */}
                <div className="relative h-48 w-full bg-muted/30 overflow-hidden">
                  <img
                    src={product.images[0] || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80'}
                    alt={product.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-[10px] bg-background/90 backdrop-blur-sm shadow-sm font-semibold">
                      {product.category}
                    </Badge>
                  </div>
                  {product.level && (
                    <div className="absolute top-2.5 right-2.5">
                      <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground shadow-sm">
                        Level {product.level}
                      </span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <CardContent className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-bold text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  {/* Highlights / Daily Yield */}
                  {dailyPKR > 0 && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs">
                      <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                        <TrendingUp className="h-3.5 w-3.5" /> Daily Income:
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        Rs. {dailyPKR.toLocaleString()} / day
                      </span>
                    </div>
                  )}

                  {/* Pricing and Action */}
                  <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-extrabold text-foreground">
                          Rs. {pricePKR.toLocaleString()}
                        </span>
                        {comparePKR && (
                          <span className="text-xs text-muted-foreground line-through">
                            Rs. {comparePKR.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground block">
                        {product.stock > 0 ? `${product.stock} in stock` : 'Unlimited digital access'}
                      </span>
                    </div>

                    <Link to={`/products/${product.slug}`}>
                      <Button size="sm" className="h-9 gap-1 font-semibold text-xs shadow-sm">
                        View <ArrowRight className="h-3 w-3" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
