import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Building,
  Smartphone,
  Wallet,
  AlertCircle,
  Truck,
} from 'lucide-react';

import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Badge } from '@components/ui/badge';
import { FormField } from '@components/ui/label';
import { productApi, type Product } from '../product.api';
import { useAuthStore } from '@store/auth.store';

export default function ProductDetailPage(): React.ReactElement {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'easypaisa' | 'jazzcash' | 'manual'>('wallet');

  // Checkout address state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [orderSuccess, setOrderSuccess] = useState<{ orderNumber: string } | null>(null);

  useEffect(() => {
    async function loadProduct() {
      if (!slug) return;
      try {
        const data = await productApi.getProductDetails(slug);
        setProduct(data);
      } catch {
        // Fallback demo product if not in DB yet
        setProduct({
          _id: 'p1',
          name: 'Starter Node - Tier 1',
          slug: slug,
          description:
            'Entry-level affiliate node with automated daily yields, high referral multi-tier rewards, and verified ledger tracking. Designed for ambitious partners looking to build sustainable passive income streams.',
          images: [
            'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
            'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=800&auto=format&fit=crop&q=80',
          ],
          price: 500000,
          compareAtPrice: 700000,
          dailyIncome: 15000,
          referralCommission: 50000,
          level: 1,
          stock: 45,
          trackInventory: true,
          status: 'active',
          isArchived: false,
          category: 'Starter Nodes',
          tags: ['Best Seller', 'Instant Yield'],
          totalPurchases: 184,
          createdAt: new Date().toISOString(),
        });
      }
    }
    loadProduct();
  }, [slug]);

  if (!product) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const pricePKR = product.price / 100;
  const comparePKR = product.compareAtPrice ? product.compareAtPrice / 100 : null;
  const dailyPKR = product.dailyIncome / 100;
  const totalPKR = pricePKR * quantity;
  const monthlyYieldPKR = dailyPKR * 30 * quantity;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/login', { state: { message: 'Please sign in to place your order.' } });
      return;
    }

    if (!fullName.trim() || !phone.trim() || !address.trim() || !city.trim()) {
      setErrorMessage('Please fill in your delivery contact and address details.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const order = await productApi.placeOrder({
        productId: product._id,
        quantity,
        paymentMethod,
        shippingAddress: {
          fullName: fullName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          city: city.trim(),
        },
      });

      setOrderSuccess({ orderNumber: order.orderNumber });
    } catch (err: unknown) {
      if (typeof err === 'object' && err !== null && 'response' in err) {
        const axError = err as { response?: { data?: { message?: string } } };
        setErrorMessage(axError.response?.data?.message || 'Failed to complete order. Please try again.');
      } else {
        setErrorMessage('Connection error. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <Link
        to="/products"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Product Catalog
      </Link>

      {orderSuccess ? (
        <Card className="max-w-lg mx-auto border-emerald-500/30 bg-card shadow-2xl p-6 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Order Successfully Placed!</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Your order number is <strong className="font-mono text-foreground">{orderSuccess.orderNumber}</strong>.
            You can track your fulfillment status and income generation in your order history.
          </CardDescription>

          <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/orders">
              <Button className="w-full sm:w-auto text-xs">View Order History</Button>
            </Link>
            <Link to="/products">
              <Button variant="outline" className="w-full sm:w-auto text-xs">
                Continue Browsing
              </Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Image Gallery & Highlights */}
          <div className="lg:col-span-7 space-y-6">
            <div className="relative rounded-2xl overflow-hidden border border-border/80 bg-muted/20 aspect-video sm:aspect-[4/3]">
              <img
                src={product.images[selectedImageIndex] || product.images[0]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute top-4 left-4 flex gap-2">
                <Badge variant="secondary" className="bg-background/90 backdrop-blur-sm shadow-sm text-xs font-semibold">
                  {product.category}
                </Badge>
                {product.level && (
                  <Badge className="bg-primary text-primary-foreground font-bold text-xs">
                    Level {product.level}
                  </Badge>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex items-center gap-3">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`h-16 w-24 rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImageIndex === idx ? 'border-primary ring-2 ring-primary/20' : 'border-border/60 hover:border-border'
                    }`}
                  >
                    <img src={img} alt="thumb" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Description & Yield Box */}
            <div className="p-6 rounded-2xl border border-border/70 bg-card space-y-4">
              <h2 className="text-lg font-bold text-foreground">Product Overview & Specifications</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {product.description}
              </p>

              {dailyPKR > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-border/50">
                  <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                    <span className="text-muted-foreground block text-[11px]">Daily Passive Yield:</span>
                    <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                      Rs. {dailyPKR.toLocaleString()} / day
                    </span>
                    <span className="text-[10px] text-muted-foreground">Credited daily to affiliate ledger</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-xs">
                    <span className="text-muted-foreground block text-[11px]">Est. Monthly Income (30 days):</span>
                    <span className="text-base font-extrabold text-primary mt-0.5 block">
                      Rs. {monthlyYieldPKR.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Automatic multi-tier distribution</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Checkout & Purchase Form */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-border/80 shadow-xl bg-card">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl font-bold tracking-tight">{product.name}</CardTitle>
                <div className="flex items-baseline gap-2 pt-1">
                  <span className="text-3xl font-extrabold text-foreground">
                    Rs. {pricePKR.toLocaleString()}
                  </span>
                  {comparePKR && (
                    <span className="text-sm text-muted-foreground line-through">
                      Rs. {comparePKR.toLocaleString()}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">PKR</span>
                </div>
              </CardHeader>

              <CardContent className="space-y-5">
                {errorMessage && (
                  <div className="flex items-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Quantity */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                    Quantity
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center border border-border rounded-lg overflow-hidden bg-background">
                      <button
                        type="button"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3.5 py-1.5 text-sm hover:bg-muted font-bold"
                      >
                        -
                      </button>
                      <span className="px-4 py-1.5 text-sm font-semibold min-w-[2.5rem] text-center">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity(quantity + 1)}
                        className="px-3.5 py-1.5 text-sm hover:bg-muted font-bold"
                      >
                        +
                      </button>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      Subtotal: <strong className="text-foreground">Rs. {totalPKR.toLocaleString()}</strong>
                    </span>
                  </div>
                </div>

                {/* Delivery Information */}
                <div className="space-y-3 pt-2 border-t border-border/50">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Delivery / Account Information
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField label="Full Name" required>
                      <Input
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Muhammad Ali"
                        disabled={isSubmitting}
                      />
                    </FormField>
                    <FormField label="Phone Number" required>
                      <Input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="03001234567"
                        disabled={isSubmitting}
                      />
                    </FormField>
                  </div>
                  <FormField label="Shipping Address / City" required>
                    <Input
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="House/Street, Area"
                      disabled={isSubmitting}
                    />
                  </FormField>
                  <FormField label="City">
                    <Input
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Lahore / Karachi / Islamabad"
                      disabled={isSubmitting}
                    />
                  </FormField>
                </div>

                {/* Payment Method Selector */}
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Select Payment Method
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('wallet')}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border font-medium transition-all ${
                        paymentMethod === 'wallet'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border/60 hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      <Wallet className="h-4 w-4" /> Wallet Balance
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('easypaisa')}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border font-medium transition-all ${
                        paymentMethod === 'easypaisa'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border/60 hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      <Smartphone className="h-4 w-4" /> EasyPaisa
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('jazzcash')}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border font-medium transition-all ${
                        paymentMethod === 'jazzcash'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border/60 hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      <Smartphone className="h-4 w-4" /> JazzCash
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('manual')}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border font-medium transition-all ${
                        paymentMethod === 'manual'
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border/60 hover:bg-muted text-muted-foreground'
                      }`}
                    >
                      <Building className="h-4 w-4" /> Bank / Manual
                    </button>
                  </div>
                </div>

                {/* Order Summary Box */}
                <div className="p-3.5 rounded-xl border border-border/60 bg-muted/30 space-y-2 text-xs">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Item Price:</span>
                    <span>Rs. {pricePKR.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Quantity:</span>
                    <span>&times; {quantity}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Fulfillment / Activation:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">Free</span>
                  </div>
                  <div className="flex justify-between font-bold text-sm text-foreground pt-1.5 border-t border-border/50">
                    <span>Total Payable:</span>
                    <span className="text-primary">Rs. {totalPKR.toLocaleString()}</span>
                  </div>
                </div>

                <Button
                  onClick={handlePlaceOrder}
                  className="w-full h-11 text-sm font-semibold shadow-md shadow-primary/25"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Processing Order...
                    </span>
                  ) : (
                    <span>Confirm & Place Order</span>
                  )}
                </Button>
              </CardContent>

              <CardFooter className="pt-2 pb-6 border-t border-border/40 bg-muted/20 text-xs text-muted-foreground flex items-center justify-center gap-3">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Secure Checkout
                </span>
                <span className="flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5 text-primary" /> Tracked Order
                </span>
              </CardFooter>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
