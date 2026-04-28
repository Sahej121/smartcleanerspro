import { useState, useMemo, useCallback } from 'react';

export function useOrderLogic() {
  const [cart, setCart] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState(null);
  const [redeemedPoints, setRedeemedPoints] = useState(0);
  const [volDiscountInfo, setVolDiscountInfo] = useState({ min_quantity: 0, discount_percent: 0 });

  const addToCart = useCallback((item) => {
    setCart(prev => [...prev, { ...item, quantity: 1, tag_id: '', bag_id: '', notes: '' }]);
  }, []);

  const removeFromCart = useCallback((index) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  }, []);

  const updateQuantity = useCallback((index, qty) => {
    setCart(prev => {
      if (qty < 1) return prev.filter((_, i) => i !== index);
      const newCart = [...prev];
      newCart[index] = { ...newCart[index], quantity: qty };
      return newCart;
    });
  }, []);

  const updateItemPrice = useCallback((index, price) => {
    setCart(prev => {
      const newCart = [...prev];
      newCart[index] = { ...newCart[index], price: parseFloat(price) || 0 };
      return newCart;
    });
  }, []);

  const subtotal = useMemo(() => cart.reduce((s, c) => s + c.price * (c.quantity || 1), 0), [cart]);
  
  const totalItemCount = useMemo(() => cart.reduce((s, c) => s + (c.quantity || 1), 0), [cart]);
  
  const applicableVolDiscount = useMemo(() => (volDiscountInfo.min_quantity > 0 && totalItemCount >= volDiscountInfo.min_quantity) 
    ? Math.round(subtotal * (volDiscountInfo.discount_percent / 100)) 
    : 0, [volDiscountInfo, totalItemCount, subtotal]);
    
  const couponDiscount = useMemo(() => couponData ? couponData.discountAmount : 0, [couponData]);
  
  const tax = useMemo(() => Math.round((subtotal - applicableVolDiscount - couponDiscount) * 0.18), [subtotal, applicableVolDiscount, couponDiscount]);
  
  const total = useMemo(() => Math.max(0, subtotal + tax - redeemedPoints - applicableVolDiscount - couponDiscount), [subtotal, tax, redeemedPoints, applicableVolDiscount, couponDiscount]);

  return {
    cart,
    setCart,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateItemPrice,
    subtotal,
    totalItemCount,
    applicableVolDiscount,
    couponDiscount,
    tax,
    total,
    couponCode,
    setCouponCode,
    couponData,
    setCouponData,
    redeemedPoints,
    setRedeemedPoints,
    volDiscountInfo,
    setVolDiscountInfo
  };
}
