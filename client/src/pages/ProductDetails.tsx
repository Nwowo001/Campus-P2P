import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { ReportModal } from "../components/ReportModal";
import {
  MessageSquare,
  ShoppingBag,
  Trash2,
  User as UserIcon,
  Star,
  Calendar,
  BookOpen,
  GraduationCap,
  ShieldAlert,
  ArrowLeft,
  Lock,
} from "lucide-react";

export const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals & buying states
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  const fetchProduct = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get(`/products/${id}`);
      if (res.data.success) {
        setProduct(res.data.data);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Product not found");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const handleBuyNow = async () => {
    if (!product || purchasing) return;
    setPurchasing(true);

    try {
      const res = await API.post("/payments/initialize", {
        productId: product._id,
      });
      if (res.data.success) {
        const { authorization_url } = res.data.data;
        // Redirect to Paystack (or mock payment checkout screen)
        window.location.href = authorization_url;
      }
    } catch (err: any) {
      console.error(err);
      alert(
        err.response?.data?.message || "Failed to initialize purchase flow",
      );
    } finally {
      setPurchasing(false);
    }
  };

  const handleChatWithSeller = () => {
    if (!product || !product.sellerId) return;
    const sellerId =
      typeof product.sellerId === "object"
        ? product.sellerId._id
        : product.sellerId;
    const sellerName =
      typeof product.sellerId === "object" ? product.sellerId.name : "Seller";

    // Pass state to chat page so it auto-opens contact
    navigate("/chat", {
      state: {
        autoSelectContact: {
          _id: sellerId,
          name: sellerName,
        },
      },
    });
  };

  const handleDeleteListing = async () => {
    if (!window.confirm("Are you sure you want to delete this listing?"))
      return;

    try {
      const res = await API.delete(`/products/${product._id}`);
      if (res.data.success) {
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to delete listing");
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-t-primary-500 border-slate-200 dark:border-slate-800 rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Loading item specifications...
          </p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="max-w-md mx-auto py-12 text-center space-y-4">
        <div className="text-red-500 font-bold">
          {error || "Something went wrong"}
        </div>
        <Link
          to="/"
          className="inline-flex items-center space-x-1.5 text-primary-500 font-bold hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  const seller = typeof product.sellerId === "object" ? product.sellerId : null;
  const isOwner = seller && user?._id === seller._id;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 fade-in">
      {/* Back button */}
      <Link
        to="/"
        className="inline-flex items-center space-x-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-350"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to listings</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Product Media Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm aspect-video relative">
            <img
              src={product.image}
              alt={product.title}
              className="h-full w-full object-cover object-center"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=600&auto=format&fit=crop";
              }}
            />
            {product.isSold && (
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
                <span className="px-5 py-2 rounded-full border border-red-500 bg-red-500/20 text-red-400 font-extrabold text-sm tracking-widest uppercase shadow-xl">
                  Sold
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Product Specifications & Purchase Box */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Info */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/40 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-850 text-xs font-bold text-slate-650 dark:text-slate-350 uppercase">
                {product.category}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                Listed{" "}
                {new Date(product.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight font-sans">
              {product.title}
            </h1>

            <div className="text-2xl font-black text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-850">
              {formatPrice(product.price)}
            </div>

            <div className="space-y-1.5 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450">
                Item Description
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
                {product.description}
              </p>
            </div>

            {/* Escrow banner details */}
            {!product.isSold && !isOwner && (
              <div className="p-3.5 bg-primary-50 dark:bg-primary-950/20 rounded-2xl border border-primary-200/60 dark:border-primary-900/30 flex items-start space-x-2.5 text-xs text-primary-800 dark:text-primary-350 leading-relaxed">
                <Lock className="w-4 h-4 shrink-0 text-primary-500 mt-0.5" />
                <div>
                  <strong className="text-primary-900 dark:text-primary-300 font-bold">
                    Escrow Protection Active
                  </strong>
                  <p className="mt-0.5">
                    Your money is held securely by CampusMart. The seller will
                    only be paid once you receive and verify the item.
                  </p>
                </div>
              </div>
            )}

            {/* CTA Actions */}
            <div className="pt-4 flex flex-col gap-2.5">
              {product.isSold ? (
                <button
                  disabled
                  className="w-full py-3 px-4 rounded-2xl bg-slate-100 dark:bg-slate-850 text-slate-400 dark:text-slate-500 text-sm font-bold border border-slate-200 dark:border-slate-800 cursor-not-allowed text-center"
                >
                  Item Unavailable
                </button>
              ) : isOwner ? (
                <div className="flex gap-3">
                  <button
                    onClick={handleDeleteListing}
                    className="flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-red-650/10 hover:bg-red-650/25 text-red-600 dark:text-red-400 text-sm font-bold transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Listing</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <button
                    onClick={handleBuyNow}
                    disabled={purchasing}
                    className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-bold shadow-lg shadow-primary-500/20 hover:shadow-primary-500/35 hover:scale-[1.01] active:scale-95 transition-all duration-200 disabled:opacity-50"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>
                      {purchasing ? "Initializing Checkout..." : "Buy Now"}
                    </span>
                  </button>

                  <button
                    onClick={handleChatWithSeller}
                    className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-850 hover:scale-[1.01] active:scale-95 transition-all duration-200"
                  >
                    <MessageSquare className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                    <span>Chat with Seller</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Seller Profile Summary Card */}
          {seller && (
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/40 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450">
                Seller Information
              </h3>
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-200 to-slate-100 dark:from-slate-800 dark:to-slate-850 flex items-center justify-center text-slate-500 shrink-0">
                  <UserIcon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-850 dark:text-white truncate">
                    {seller.name}
                  </h4>
                  <div className="flex items-center space-x-2 mt-0.5">
                    <div className="flex items-center space-x-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        {seller.ratingAverage > 0
                          ? seller.ratingAverage.toFixed(1)
                          : "New Seller"}
                      </span>
                    </div>
                    {seller.ratingCount > 0 && (
                      <span className="text-xs text-slate-450 font-medium">
                        ({seller.ratingCount} reviews)
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Student Metadata */}
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-850 text-xs text-slate-550 dark:text-slate-400">
                <div className="flex items-center space-x-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{seller.department}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{seller.level}</span>
                </div>
                <div className="flex items-center space-x-1.5 col-span-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>
                    Joined{" "}
                    {new Date(seller.createdAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                    })}
                  </span>
                </div>
              </div>

              {/* Report Seller Button */}
              {!isOwner && (
                <div className="pt-2 border-t border-slate-100 dark:border-slate-850 flex justify-end">
                  <button
                    onClick={() => setIsReportOpen(true)}
                    className="flex items-center space-x-1 text-xs text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 transition-colors font-medium"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>Report User</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {seller && (
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
          reportedUserId={seller._id}
          reportedUserName={seller.name}
        />
      )}
    </div>
  );
};
