import React from 'react';
import { Link } from 'react-router-dom';
import { Star, ShieldAlert } from 'lucide-react';

interface SellerId {
  _id: string;
  name: string;
  ratingAverage: number;
  ratingCount: number;
}

interface Product {
  _id: string;
  title: string;
  price: number;
  image: string;
  category: string;
  sellerId: SellerId | string;
  isSold: boolean;
  createdAt: string;
}

interface ProductCardProps {
  product: Product;
  currentUserId?: string;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, currentUserId }) => {
  const seller = typeof product.sellerId === 'object' ? product.sellerId : null;
  const isOwner = seller && currentUserId === seller._id;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <Link
      to={`/products/${product._id}`}
      className="group block relative rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/40 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 dark:hover:border-slate-700/60"
    >
      {/* Product Image */}
      <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-850">
        <img
          src={product.image}
          alt={product.title}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            // Fallback for broken images
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=600&auto=format&fit=crop';
          }}
        />

        {/* Category Badge */}
        <span className="absolute top-3 left-3 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-900/80 backdrop-blur-sm text-white shadow-sm">
          {product.category}
        </span>

        {/* Status Badges */}
        {product.isSold ? (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="px-4 py-1.5 rounded-full border border-red-500 bg-red-500/20 text-red-400 font-bold text-sm tracking-wide uppercase shadow-lg">
              Sold
            </span>
          </div>
        ) : (
          isOwner && (
            <span className="absolute top-3 right-3 px-2.5 py-1 text-xs font-semibold rounded-lg bg-primary-600/90 text-white shadow-sm">
              Your Listing
            </span>
          )
        )}
      </div>

      {/* Product Info */}
      <div className="p-4 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-200">
            {product.title}
          </h3>
          
          <div className="mt-1 flex items-center justify-between">
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              {formatPrice(product.price)}
            </span>
          </div>
        </div>

        {/* Seller Info Footer */}
        {seller && (
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span className="font-medium text-slate-600 dark:text-slate-300 truncate max-w-[120px]">
              {seller.name}
            </span>
            <div className="flex items-center space-x-1 shrink-0">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {seller.ratingAverage > 0 ? seller.ratingAverage.toFixed(1) : 'New'}
              </span>
              {seller.ratingCount > 0 && (
                <span className="text-slate-400 dark:text-slate-500">
                  ({seller.ratingCount})
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
};
