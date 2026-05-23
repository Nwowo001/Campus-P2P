import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../services/api';
import { ArrowLeft, Tag, DollarSign, FileText, Image as ImageIcon, Sparkles } from 'lucide-react';

export const AddProduct: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Other');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // stock preset images to make listing item creation super easy and gorgeous
  const presets = [
    { name: 'Laptop/Tech', url: 'https://images.unsplash.com/photo-1496181130204-7552cc1534e0?q=80&w=600&auto=format&fit=crop' },
    { name: 'Headphones', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600&auto=format&fit=crop' },
    { name: 'Textbook/Notes', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=600&auto=format&fit=crop' },
    { name: 'Hoodie/Clothing', url: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=600&auto=format&fit=crop' },
    { name: 'Bicycle/Ride', url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=600&auto=format&fit=crop' },
    { name: 'Snack/Drinks', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop' },
    { name: 'Room/Hostel', url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?q=80&w=600&auto=format&fit=crop' },
  ];

  const categories = ['Electronics', 'Textbooks', 'Clothing', 'Services', 'Housing/Hostels', 'Food & Snacks', 'Other'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !description || !category || !imageUrl) {
      setError('Please fill in all fields (choose a preset image or enter a URL)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await API.post('/products', {
        title,
        price: Number(price),
        description,
        category,
        image: imageUrl,
      });

      if (res.data.success) {
        navigate(`/products/${res.data.data._id}`);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Failed to list product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6 fade-in">
      
      {/* Breadcrumb */}
      <Link to="/" className="inline-flex items-center space-x-1.5 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-350">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to listings</span>
      </Link>

      {/* Main card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* Title header */}
        <div className="border-b border-slate-100 dark:border-slate-850 pb-4">
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-sans">
            Sell an Item
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-450 mt-1">
            Fill in the details below to list your item on the campus store.
          </p>
        </div>

        {error && (
          <div className="p-3.5 text-sm text-red-650 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/35 rounded-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Title */}
          <div className="space-y-1.5">
            <label htmlFor="title" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-450">
              Listing Title
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
                <Tag className="w-4 h-4" />
              </span>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. iPhone 13 Pro (256GB)"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-medium"
              />
            </div>
          </div>

          {/* Grid: Price & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            
            {/* Price */}
            <div className="space-y-1.5">
              <label htmlFor="price" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-450">
                Price (₦)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
                  <DollarSign className="w-4 h-4" />
                </span>
                <input
                  id="price"
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Price in Naira"
                  required
                  min="0"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-medium"
                />
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <label htmlFor="category" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-450">
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-medium"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label htmlFor="description" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-450">
              Product Description
            </label>
            <div className="relative">
              <span className="absolute top-3 left-3.5 text-slate-400 dark:text-slate-500 pointer-events-none">
                <FileText className="w-4 h-4" />
              </span>
              <textarea
                id="description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail the condition, age, minor flaws, why you're selling, meeting points, etc."
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-medium resize-none"
              />
            </div>
          </div>

          {/* Image Upload/Preset Selection */}
          <div className="space-y-3.5 border-t border-slate-100 dark:border-slate-850 pt-5">
            <div>
              <label htmlFor="image" className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-450">
                Product Image Link
              </label>
              <div className="relative mt-1">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 dark:text-slate-500 pointer-events-none">
                  <ImageIcon className="w-4 h-4" />
                </span>
                <input
                  id="image"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm font-medium"
                />
              </div>
            </div>

            {/* Presets Selection list */}
            <div className="space-y-1.5">
              <span className="text-xs font-bold text-slate-450 flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>Or select a high-quality preset:</span>
              </span>
              <div className="flex flex-wrap gap-2">
                {presets.map((preset) => (
                  <button
                    type="button"
                    key={preset.name}
                    onClick={() => setImageUrl(preset.url)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      imageUrl === preset.url
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20 text-primary-600 dark:text-primary-400 font-bold'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-850'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Image Preview Box */}
            {imageUrl && (
              <div className="mt-3 aspect-video w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800/80 bg-slate-100 dark:bg-slate-950">
                <img
                  src={imageUrl}
                  alt="Product Listing Preview"
                  className="w-full h-full object-cover object-center"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=600&auto=format&fit=crop';
                  }}
                />
              </div>
            )}
          </div>

          {/* Submit Action */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-850 flex gap-4">
            <Link
              to="/"
              className="flex-1 text-center py-3 px-4 rounded-xl border border-slate-200 dark:border-slate-800 text-sm font-semibold text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 px-4 bg-primary-600 hover:bg-primary-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-lg shadow-primary-500/20 hover:shadow-xl hover:shadow-primary-500/35 transition-all duration-250 active:scale-98"
            >
              {loading ? 'Publishing Listing...' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
