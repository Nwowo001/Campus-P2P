import React, { useState, useEffect } from "react";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { ProductCard } from "../components/ProductCard";
import {
  User as UserIcon,
  BookOpen,
  GraduationCap,
  Mail,
  Star,
  LogOut,
  CreditCard,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export const ProfilePage: React.FC = () => {
  const { user, logout, refreshUser } = useAuth();
  const navigate = useNavigate();

  const [activeProducts, setActiveProducts] = useState<any[]>([]);
  const [soldProducts, setSoldProducts] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState<"listings" | "reviews">("listings");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const fetchProfileData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      setBankName(user.bankName || '');
      setBankAccountNumber(user.bankAccountNumber || '');

      // 1. Fetch user's listings
      const productsRes = await API.get("/products");
      if (productsRes.data.success) {
        const allUserItems = productsRes.data.data.filter(
          (p: any) =>
            (typeof p.sellerId === "object" ? p.sellerId._id : p.sellerId) ===
            user._id,
        );
        setActiveProducts(allUserItems.filter((p: any) => !p.isSold));
        setSoldProducts(allUserItems.filter((p: any) => p.isSold));
      }
      // 2. Fetch reviews received by user
      const reviewsRes = await API.get(`/reviews/user/${user._id}`);
      if (reviewsRes.data.success) {
        setReviews(reviewsRes.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, [user]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setSaveMessage(null);

    try {
      const res = await API.put('/auth/me', {
        bankName,
        bankAccountNumber,
      });

      if (res.data.success) {
        await refreshUser();
        setSaveMessage('Payout profile saved successfully.');
      } else {
        setSaveMessage('Unable to save payout details.');
      }
    } catch (err) {
      console.error(err);
      setSaveMessage('Unable to save payout details.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-t-primary-500 border-slate-200 dark:border-slate-800 rounded-full animate-spin font-sans"></div>
          <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
            Loading student profile...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 fade-in">
      {/* Profile Header card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/40 shadow-sm flex flex-col sm:flex-row gap-6 items-center justify-between">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          {/* Avatar Icon */}
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-primary-500/20 shrink-0">
            <UserIcon className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight font-sans">
              {user?.name}
            </h2>
            <div className="flex flex-wrap justify-center sm:justify-start items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center space-x-1">
                <Mail className="w-3.5 h-3.5" />
                <span>{user?.email}</span>
              </span>
              <span className="flex items-center space-x-1">
                <BookOpen className="w-3.5 h-3.5" />
                <span>{user?.department}</span>
              </span>
              <span className="flex items-center space-x-1">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{user?.level}</span>
              </span>
            </div>

            {/* Rating Stars summary */}
            <div className="flex items-center justify-center sm:justify-start space-x-1 text-sm font-semibold">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-slate-800 dark:text-slate-200">
                {user && user.ratingAverage > 0
                  ? user.ratingAverage.toFixed(1)
                  : "New User"}
              </span>
              {user && user.ratingCount > 0 && (
                <span className="text-slate-400 font-medium">
                  ({user.ratingCount} reviews)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={handleLogout}
          className="flex items-center space-x-1.5 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-650 rounded-xl text-sm font-bold shadow-sm transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>

      {/* Earnings + Payout Summary */}
      <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/40 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Total Earnings</p>
                <h2 className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
                  ₦{user?.totalEarned?.toLocaleString('en-NG') || '0'}
                </h2>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Amount available from completed sales after the 10% platform commission.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/40 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Sales Completed</p>
                <h2 className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white">
                  {user?.totalSales ?? 0}
                </h2>
              </div>
              <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/20 text-sky-500">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Completed orders that have been delivered and confirmed by buyers.
            </p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/40 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">Payout bank details</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Fill in your receiving bank account so your earnings can be paid out.
              </p>
            </div>
            <CreditCard className="w-6 h-6 text-primary-500" />
          </div>

          <div className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Bank / Provider</label>
              <input
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. First Bank"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Account Number</label>
              <input
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 py-3 text-sm text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="e.g. 0123456789"
              />
            </div>
            {saveMessage && (
              <p className="text-sm text-emerald-600 dark:text-emerald-400">{saveMessage}</p>
            )}
            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="mt-2 inline-flex items-center justify-center rounded-2xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-primary-500/20 hover:bg-primary-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {savingProfile ? 'Saving...' : 'Save payout details'}
            </button>
          </div>
        </div>
      </div>

      {/* Tabs list (Listings vs Reviews) */}
      <div className="space-y-5">
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setSubTab("listings")}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition-all ${
              subTab === "listings"
                ? "border-primary-500 text-primary-600 dark:text-primary-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            My Store Listings
          </button>
          <button
            onClick={() => setSubTab("reviews")}
            className={`py-3 px-6 text-sm font-bold border-b-2 transition-all ${
              subTab === "reviews"
                ? "border-primary-500 text-primary-600 dark:text-primary-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Received Reviews ({reviews.length})
          </button>
        </div>

        {/* Listings Tab */}
        {subTab === "listings" && (
          <div className="space-y-8">
            {/* Active products */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Active Listings ({activeProducts.length})
              </h3>
              {activeProducts.length === 0 ? (
                <div className="p-8 text-center text-slate-450 dark:text-slate-500 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800/40 rounded-2xl">
                  You have no active products listed.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {activeProducts.map((p) => (
                    <ProductCard
                      key={p._id}
                      product={p}
                      currentUserId={user?._id}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Sold Products */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-850">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Sold Listings ({soldProducts.length})
              </h3>
              {soldProducts.length === 0 ? (
                <div className="p-8 text-center text-slate-450 dark:text-slate-500 bg-white dark:bg-slate-900 border border-slate-250 dark:border-slate-800/40 rounded-2xl">
                  You haven't completed any sales yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 opacity-85">
                  {soldProducts.map((p) => (
                    <ProductCard
                      key={p._id}
                      product={p}
                      currentUserId={user?._id}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {subTab === "reviews" && (
          <div className="space-y-4 max-w-2xl">
            {reviews.length === 0 ? (
              <div className="p-12 text-center text-slate-450 dark:text-slate-500 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl">
                No reviews received yet. Completed transactions will accumulate
                ratings here.
              </div>
            ) : (
              reviews.map((r) => (
                <div
                  key={r._id}
                  className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/40 shadow-sm space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-950 flex items-center justify-center text-slate-400 text-xs shrink-0 font-sans font-bold">
                        {r.reviewerId?.name
                          ? r.reviewerId.name.substring(0, 2).toUpperCase()
                          : "US"}
                      </div>
                      <span className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                        {r.reviewerId?.name || "Deleted Account"}
                      </span>
                    </div>
                    {/* Stars */}
                    <div className="flex space-x-0.5 text-amber-400 fill-amber-400 shrink-0">
                      {Array.from({ length: r.rating }).map((_, idx) => (
                        <Star
                          key={idx}
                          className="w-3.5 h-3.5 fill-amber-400"
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-350 leading-relaxed font-sans pl-9">
                    {r.comment}
                  </p>
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 text-right pl-9">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
