import React from 'react';
import { Heart, ShoppingBag } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onClick?: () => void;
  className?: string;
  isSelected?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, className = "", isSelected = false }) => {
  // Use the first available color image or the main image
  const displayImage = product.colors?.[0]?.imageUrl || product.imageUrl;

  return (
    <div 
        onClick={onClick}
        className={`
            group relative w-[200px] h-[280px] rounded-[24px] overflow-hidden cursor-pointer transition-all duration-500 ease-out
            ${isSelected ? 'ring-4 ring-yellow-400 scale-105 shadow-2xl z-10' : 'hover:scale-105 hover:shadow-2xl hover:-translate-y-2'}
            bg-white shadow-lg border border-zinc-100 dark:border-zinc-800
            ${className}
        `}
    >
        {/* Top Half - Image Area (55%) */}
        <div className="h-[55%] bg-[#F4F4F5] p-4 relative flex items-center justify-center overflow-hidden">
            {/* Wishlist Button - Top Right - Very Subtle Animation */}
            <button className="absolute top-3 right-3 w-8 h-8 bg-[#18181B]/10 hover:bg-[#18181B] rounded-full flex items-center justify-center text-black hover:text-white shadow-sm transition-all duration-300 z-20 group-hover:bg-red-500 group-hover:text-white hover:scale-105">
                <Heart size={14} fill="currentColor" className="opacity-80"/>
            </button>
            
            {/* Image - Subtle Zoom (105% instead of 110%) */}
            <img 
                src={displayImage} 
                alt={product.name}
                className="w-full h-full object-contain drop-shadow-lg transition-transform duration-700 ease-out group-hover:scale-105 z-10"
            />
        </div>

        {/* Bottom Half - Info Area (45%) */}
        <div className="h-[45%] bg-[#1E1E1E] p-4 flex flex-col justify-between relative">
            <div className="space-y-0.5">
                <h3 className="text-white font-black text-xs md:text-sm leading-tight line-clamp-2 uppercase tracking-wide">
                    {product.name}
                </h3>
                <p className="text-zinc-400 text-[9px] font-bold uppercase tracking-widest">
                    {product.brand}
                </p>
            </div>
            
            <div className="flex items-center justify-between mt-2">
                <span className="text-white font-black text-xl tracking-tighter">
                    ${product.price}
                </span>
                
                {/* Shopping Bag - No Rotation, just color change */}
                <button className="w-9 h-9 bg-white rounded-[10px] flex items-center justify-center text-black shadow-lg hover:bg-yellow-400 transition-colors active:scale-95 duration-200">
                    <ShoppingBag size={16} strokeWidth={2.5}/>
                </button>
            </div>
        </div>
    </div>
  );
};
