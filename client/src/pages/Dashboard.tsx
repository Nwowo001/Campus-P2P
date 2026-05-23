import React, { useState, useEffect } from "react";
import API from "../services/api";
import { useAuth } from "../context/AuthContext";
import { ProductCard } from "../components/ProductCard";
import { Search, SlidersHorizontal, PackageOpen, Plus } from "lucide-react";
import { Link } from "react-router-dom";

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    "All",
    "Electronics",
    "Textbooks",
    "Clothing",
    "Services",
    "Housing/Hostels",
    "Food & Snacks",
    "Other",
  ];

  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const params: any = {};
      if (selectedCategory && selectedCategory !== "All") {
        params.category = selectedCategory;
      }
      if (search) {
        params.search = search;
      }
      if (minPrice) {
        params.minPrice = minPrice;
      }
      if (maxPrice) {
        params.maxPrice = maxPrice;
      }

      const res = await API.get("/products", { params });
      if (res.data.success) {
        setProducts(res.data.data);
      }
    } catch (err: any) {
      console.error(err);
      setError("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Fetch products. Debounce searches if we wanted, but calling on category/price submit is standard.
    // For categories and price filters, we fetch immediately on change.
    fetchProducts();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const handlePriceReset = () => {
    setMinPrice("");
    setMaxPrice("");
    // Let state update before calling fetch or pass empty strings
    setLoading(true);
    API.get("/products", {
      params: {
        category: selectedCategory !== "All" ? selectedCategory : undefined,
        search: search || undefined,
      },
    })
      .then((res) => {
        if (res.data.success) setProducts(res.data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 fade-in">
      {/* Hero Welcome banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-primary-600 via-primary-500 to-indigo-600 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_40%)] pointer-events-none" />
        <div className="relative z-10 space-y-3 max-w-lg">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 backdrop-blur-sm tracking-wide uppercase">
            Campus Marketplace
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight font-sans">
            Find items. Sell items. Secure Payments.
          </h2>
          <p className="text-slate-100 text-sm sm:text-base font-medium">
            CampusMart secures funds in escrow until you receive and verify your
            purchase.
          </p>
          <div className="pt-2 flex items-center space-x-3">
            <Link
              to="/add-product"
              className="inline-flex items-center space-x-1.5 bg-white text-primary-600 hover:bg-slate-50 font-bold px-4 py-2.5 rounded-xl text-sm shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>List an Item</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
                <Search className="w-4.5 h-4.5" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="What are you looking for today?"
                className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-450 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 shadow-sm transition-all text-sm font-medium"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-700 shadow-sm transition-colors"
            >
              Search
            </button>
          </form>

          {/* Toggle Filter Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl border text-sm font-semibold shadow-sm transition-all ${
              showFilters
                ? "border-primary-500 bg-primary-50/40 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400"
                : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Filter Drawer / Expandable panel */}
        {showFilters && (
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-5 items-end justify-between fade-in">
            <div className="grid grid-cols-2 gap-4 w-full md:max-w-md">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                  Min Price (₦)
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500/20 focus:border-primary-500 text-sm font-medium"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                  Max Price (₦)
                </label>
                <input
                  type="number"
                  placeholder="Any"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500/20 focus:border-primary-500 text-sm font-medium"
                />
              </div>
            </div>

            <div className="flex space-x-3 w-full md:w-auto shrink-0 justify-end">
              <button
                onClick={handlePriceReset}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-850"
              >
                Reset
              </button>
              <button
                onClick={fetchProducts}
                className="px-5 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-semibold shadow-md shadow-primary-500/10 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {/* Category Chips Scrollable */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                selectedCategory === cat
                  ? "bg-primary-600 text-white shadow-md shadow-primary-500/10"
                  : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Listings Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-slate-250 dark:border-slate-800/40 p-4 space-y-4"
            >
              <div className="aspect-video w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-3/4 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="h-5 w-1/3 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                <div className="h-3 w-12 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-3 w-8 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500 font-medium">{error}</p>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-3 bg-white/40 dark:bg-slate-900/10">
          <div className="p-4 bg-slate-100 dark:bg-slate-900 rounded-2xl text-slate-400 dark:text-slate-500">
            <PackageOpen className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            No products found
          </h3>
          <p className="text-slate-500 dark:text-slate-450 text-sm max-w-sm">
            Be the first to list items in this category or check your search
            criteria.
          </p>
          <Link
            to="/add-product"
            className="flex items-center space-x-1 bg-primary-600 hover:bg-primary-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Sell Item</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product._id}
              product={product}
              currentUserId={user?._id}
            />
          ))}
        </div>
      )}
    </div>
  );
};
