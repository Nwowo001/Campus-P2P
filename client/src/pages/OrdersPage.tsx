import React, { useState, useEffect } from 'react';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { ReviewModal } from '../components/ReviewModal';
import { 
  ClipboardList, 
  ArrowRightLeft, 
  Calendar, 
  User as UserIcon, 
  Tag, 
  Truck, 
  CheckCircle2, 
  AlertCircle,
  Lock,
  ArrowRight,
  Star
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const OrdersPage: React.FC = () => {
  const { user } = useAuth();
  
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'purchases' | 'sales'>('purchases');
  
  // Review Modal state
  const [reviewOrderId, setReviewOrderId] = useState<string | null>(null);
  const [buttonLoadingId, setButtonLoadingId] = useState<string | null>(null);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await API.get('/orders');
      if (res.data.success) {
        setOrders(res.data.data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load transaction logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleDeliver = async (orderId: string) => {
    if (!window.confirm('Confirm that you have physically delivered the item to the buyer?')) return;
    setButtonLoadingId(orderId);
    try {
      const res = await API.put(`/orders/${orderId}/deliver`);
      if (res.data.success) {
        // Update order state locally
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: 'delivered' } : o))
        );
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to update order state');
    } finally {
      setButtonLoadingId(null);
    }
  };

  const handleComplete = async (orderId: string) => {
    if (!window.confirm('Confirm that you have received and inspected the item? This releases the payment to the seller and cannot be undone!')) return;
    setButtonLoadingId(orderId);
    try {
      const res = await API.put(`/orders/${orderId}/complete`);
      if (res.data.success) {
        // Update order state locally
        setOrders((prev) =>
          prev.map((o) => (o._id === orderId ? { ...o, status: 'completed', escrowHeld: false } : o))
        );
      }
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to complete order');
    } finally {
      setButtonLoadingId(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const filteredOrders = orders.filter((order) => {
    const isBuyer = order.buyerId._id === user?._id;
    return activeTab === 'purchases' ? isBuyer : !isBuyer;
  });

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-t-primary-500 border-slate-200 dark:border-slate-800 rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 fade-in">
      
      {/* Title */}
      <div className="flex items-center space-x-2.5">
        <div className="p-2.5 bg-primary-50 dark:bg-primary-950/20 text-primary-500 rounded-2xl">
          <ClipboardList className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white font-sans">
            Transactions Portal
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-450">
            Track and complete your escrow-backed transactions.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 text-sm text-red-650 bg-red-50 dark:bg-red-950/20 border border-red-200 rounded-2xl">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('purchases')}
          className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-all ${
            activeTab === 'purchases'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          My Purchases (Buying)
        </button>
        <button
          onClick={() => setActiveTab('sales')}
          className={`flex-1 py-3 text-center text-sm font-bold border-b-2 transition-all ${
            activeTab === 'sales'
              ? 'border-primary-500 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          My Sales (Selling)
        </button>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
          <div className="p-4 bg-slate-100 dark:bg-slate-950 rounded-2xl text-slate-400">
            <ArrowRightLeft className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-850 dark:text-white">No transactions found</h3>
          <p className="text-slate-500 dark:text-slate-450 text-sm max-w-sm">
            {activeTab === 'purchases'
              ? "You haven't bought anything yet. Explore items on the dashboard."
              : 'No orders have been placed on your listed items yet.'}
          </p>
          {activeTab === 'purchases' && (
            <Link
              to="/"
              className="inline-flex bg-primary-600 hover:bg-primary-500 text-white font-bold px-4 py-2 rounded-xl text-sm"
            >
              Shop Items
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => {
            const isBuyer = order.buyerId._id === user?._id;
            const counterparty = isBuyer ? order.sellerId : order.buyerId;
            
            // Progress stage indices: pending = 1, paid = 2, delivered = 3, completed = 4
            const getStage = (status: string) => {
              switch (status) {
                case 'pending': return 1;
                case 'paid': return 2;
                case 'delivered': return 3;
                case 'completed': return 4;
                default: return 0;
              }
            };
            const currentStage = getStage(order.status);

            return (
              <div 
                key={order._id}
                className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/40 shadow-sm flex flex-col md:flex-row gap-6 justify-between items-start md:items-center"
              >
                {/* Product Detail info */}
                <div className="flex items-center space-x-4 w-full md:w-auto">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200/60 dark:border-slate-800">
                    <img
                      src={order.productId?.image}
                      alt={order.productId?.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=600&auto=format&fit=crop';
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 dark:text-white line-clamp-1 leading-snug">
                      {order.productId?.title || 'Deleted Item'}
                    </h3>
                    <div className="text-base font-extrabold text-slate-800 dark:text-slate-200 mt-0.5">
                      {formatPrice(order.amount)}
                    </div>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-500 dark:text-slate-450">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <UserIcon className="w-3.5 h-3.5" />
                        <span>
                          {isBuyer ? 'Seller' : 'Buyer'}: <strong className="text-slate-700 dark:text-slate-300 font-bold">{counterparty?.name || 'Deleted Account'}</strong>
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Visual Tracker */}
                <div className="w-full md:max-w-xs shrink-0 flex flex-col space-y-2">
                  <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 font-bold">
                    <span className={currentStage >= 1 ? 'text-primary-500' : ''}>Paid</span>
                    <span className={currentStage >= 3 ? 'text-indigo-500' : ''}>Delivered</span>
                    <span className={currentStage >= 4 ? 'text-green-500' : ''}>Released</span>
                  </div>
                  
                  {/* Progress Line */}
                  <div className="relative h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
                        order.status === 'completed'
                          ? 'bg-green-500'
                          : order.status === 'delivered'
                          ? 'bg-indigo-500'
                          : 'bg-primary-500'
                      }`}
                      style={{ width: `${((currentStage - 1) / 3) * 100}%` }}
                    />
                  </div>

                  {/* Escrow Badge Details */}
                  {order.escrowHeld && (
                    <span className="inline-flex items-center justify-center space-x-1 px-2.5 py-1 rounded-lg bg-primary-50 dark:bg-primary-950/20 text-[10px] font-extrabold text-primary-750 uppercase tracking-wider border border-primary-200/50 dark:border-primary-900/35">
                      <Lock className="w-3 h-3 text-primary-500 shrink-0" />
                      <span>Funds Held in Escrow</span>
                    </span>
                  )}
                  {!order.escrowHeld && order.status === 'completed' && (
                    <span className="inline-flex items-center justify-center space-x-1 px-2.5 py-1 rounded-lg bg-green-50 dark:bg-green-950/20 text-[10px] font-extrabold text-green-750 uppercase tracking-wider border border-green-200/50 dark:border-green-900/35">
                      <CheckCircle2 className="w-3 h-3 text-green-500 shrink-0" />
                      <span>Funds Released</span>
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="w-full md:w-auto shrink-0 pt-4 md:pt-0 border-t border-slate-100 dark:border-slate-850 md:border-t-0 flex items-center justify-end">
                  {order.status === 'pending' && isBuyer && (
                    <button
                      onClick={() => {
                        // Re-trigger checkout URL or redirect
                        const mockUrl = `http://localhost:5173/mock-payment?reference=${order.paymentReference}&amount=${order.amount}&email=${encodeURIComponent(user?.email || '')}`;
                        window.location.href = mockUrl;
                      }}
                      className="w-full md:w-auto flex items-center justify-center space-x-1.5 px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm rounded-xl shadow-md"
                    >
                      <span>Pay Now</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}

                  {order.status === 'pending' && !isBuyer && (
                    <span className="text-xs text-amber-500 font-bold uppercase tracking-wider flex items-center space-x-1 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 px-3 py-1.5 rounded-xl">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Awaiting Payment</span>
                    </span>
                  )}

                  {order.status === 'paid' && !isBuyer && (
                    <button
                      onClick={() => handleDeliver(order._id)}
                      disabled={buttonLoadingId === order._id}
                      className="w-full md:w-auto flex items-center justify-center space-x-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl shadow-md disabled:opacity-50"
                    >
                      <Truck className="w-4 h-4" />
                      <span>{buttonLoadingId === order._id ? 'Updating...' : 'Mark as Delivered'}</span>
                    </button>
                  )}

                  {order.status === 'paid' && isBuyer && (
                    <span className="text-xs text-primary-600 dark:text-primary-400 font-bold uppercase tracking-wider flex items-center space-x-1 bg-primary-50 dark:bg-primary-950/20 border border-primary-200/50 px-3 py-1.5 rounded-xl">
                      <Lock className="w-3.5 h-3.5 text-primary-500" />
                      <span>Escrow Secured</span>
                    </span>
                  )}

                  {order.status === 'delivered' && isBuyer && (
                    <button
                      onClick={() => handleComplete(order._id)}
                      disabled={buttonLoadingId === order._id}
                      className="w-full md:w-auto flex items-center justify-center space-x-1.5 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold text-sm rounded-xl shadow-md disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{buttonLoadingId === order._id ? 'Confirming...' : 'Confirm Delivery'}</span>
                    </button>
                  )}

                  {order.status === 'delivered' && !isBuyer && (
                    <span className="text-xs text-indigo-500 font-bold uppercase tracking-wider flex items-center space-x-1 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 px-3 py-1.5 rounded-xl">
                      <Truck className="w-3.5 h-3.5" />
                      <span>Delivered</span>
                    </span>
                  )}

                  {order.status === 'completed' && isBuyer && (
                    <button
                      onClick={() => setReviewOrderId(order._id)}
                      className="w-full md:w-auto flex items-center justify-center space-x-1.5 px-5 py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-350 text-amber-600 dark:text-amber-400 font-bold text-sm rounded-xl shadow-sm"
                    >
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>Review Seller</span>
                    </button>
                  )}

                  {order.status === 'completed' && !isBuyer && (
                    <span className="text-xs text-green-500 font-bold uppercase tracking-wider flex items-center space-x-1 bg-green-50 dark:bg-green-950/20 border border-green-200 px-3 py-1.5 rounded-xl">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Transaction Finished</span>
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal Trigger */}
      {reviewOrderId && (
        <ReviewModal
          isOpen={!!reviewOrderId}
          onClose={() => setReviewOrderId(null)}
          orderId={reviewOrderId}
          onSuccess={() => {
            alert('Review submitted successfully!');
            fetchOrders();
          }}
        />
      )}
    </div>
  );
};
