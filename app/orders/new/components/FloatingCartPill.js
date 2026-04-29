'use client';

import { motion, AnimatePresence } from 'framer-motion';

/**
 * FloatingCartPill — appears on mobile when items are in cart.
 * Displays item count + total. Tapping opens the OrderCart bottom sheet.
 */
export default function FloatingCartPill({ itemCount, total, onTap, currencySymbol = '₹' }) {
  return (
    <AnimatePresence>
      {itemCount > 0 && (
        <motion.button
          initial={{ y: 80, opacity: 0, scale: 0.8 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.8 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          onClick={onTap}
          className="lg:hidden fixed bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] left-4 right-4 z-[54] mx-auto max-w-md"
        >
          <div className="flex items-center justify-between px-5 py-3.5 rounded-2xl primary-gradient text-white shadow-2xl shadow-emerald-900/40 active:scale-[0.97] transition-transform">
            {/* Left: item count */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  shopping_bag
                </span>
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-white text-emerald-700 text-[10px] font-black flex items-center justify-center shadow-sm">
                  {itemCount}
                </span>
              </div>
              <span className="text-[11px] font-black uppercase tracking-[0.12em]">
                View Cart
              </span>
            </div>

            {/* Right: total */}
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight">
                {currencySymbol}{total.toLocaleString('en-IN')}
              </span>
              <span className="material-symbols-outlined text-[18px]">
                arrow_forward
              </span>
            </div>
          </div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
