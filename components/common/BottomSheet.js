'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';

/**
 * Reusable Bottom Sheet component with drag-to-dismiss.
 * 
 * @param {boolean} isOpen - Whether the sheet is visible
 * @param {function} onClose - Called when sheet is dismissed
 * @param {string} snapPoint - 'half' | 'full' | 'auto' — initial height
 * @param {boolean} showHandle - Whether to show the drag handle
 * @param {string} title - Optional title in the header
 * @param {React.ReactNode} children - Sheet content
 */
export default function BottomSheet({ 
  isOpen, 
  onClose, 
  snapPoint = 'half', 
  showHandle = true, 
  title = '',
  children 
}) {
  const sheetRef = useRef(null);
  const [sheetHeight, setSheetHeight] = useState(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const getMaxHeight = () => {
    switch (snapPoint) {
      case 'full': return '92vh';
      case 'half': return '55vh';
      case 'auto': return 'auto';
      default: return '55vh';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) {
                onClose();
              }
            }}
            className="fixed bottom-0 left-0 right-0 z-[101] bg-theme-surface rounded-t-[2rem] shadow-2xl border-t border-theme-border/60 flex flex-col overflow-hidden"
            style={{ maxHeight: getMaxHeight() }}
          >
            {/* Drag Handle */}
            {showHandle && (
              <div className="flex justify-center pt-3 pb-1 shrink-0 cursor-grab active:cursor-grabbing">
                <div className="w-10 h-1 rounded-full bg-theme-text-muted/20" />
              </div>
            )}

            {/* Optional Title */}
            {title && (
              <div className="flex items-center justify-between px-5 py-3 border-b border-theme-border/40 shrink-0">
                <h3 className="text-sm font-black text-theme-text uppercase tracking-[0.1em]">{title}</h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-theme-text-muted hover:bg-theme-surface-container transition-colors active:scale-90"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto overscroll-contain no-scrollbar">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
