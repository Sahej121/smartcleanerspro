'use client';
import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { useUser, ROLES } from '@/lib/UserContext';

const STAGE_LABELS = {
  received: 'Received', sorting: 'Sorting', washing: 'Washing',
  dry_cleaning: 'Dry Cleaning', drying: 'Drying', ironing: 'Ironing',
  quality_check: 'Quality Check', ready: 'Ready', delivered: 'Delivered',
};

// Stage Icons
const getStageIcon = (stage) => {
  if (stage === 'received') return 'inventory_2';
  if (stage === 'washing' || stage === 'dry_cleaning') return 'local_laundry_service';
  if (stage === 'ironing' || stage === 'drying') return 'iron';
  if (stage === 'quality_check') return 'fact_check';
  if (stage === 'ready') return 'checkroom';
  if (stage === 'delivered') return 'local_shipping';
  return 'sync';
};

export default function OrderDetail({ params }) {
  const { id } = use(params);
  const { role } = useUser();
  const isAdmin = role === ROLES.OWNER || role === ROLES.MANAGER;
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [refundData, setRefundData] = useState({ amount: '', reason: '' });
  const [paymentData, setPaymentData] = useState({ amount: '', method: 'cash' });

  const [selectedItem, setSelectedItem] = useState(null);
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingData, setTrackingData] = useState({ tag_id: '', bag_id: '', incident_status: 'none', incident_notes: '', status: '' });

  const [showLogisticsModal, setShowLogisticsModal] = useState(false);
  const [logisticsType, setLogisticsType] = useState('pickup'); // 'pickup' or 'delivery'
  const [logisticsStatus, setLogisticsStatus] = useState('successful');
  const [logisticsNotes, setLogisticsNotes] = useState('');
  const [logisticsDriverId, setLogisticsDriverId] = useState('');
  const [drivers, setDrivers] = useState([]);

  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({ pickup_date: '', delivery_date: '' });

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then(r => r.json())
      .then(data => { setOrder(data); setLoading(false); });
      
    fetch('/api/staff?role=driver')
      .then(r => r.json())
      .then(data => { if(Array.isArray(data)) setDrivers(data); })
      .catch(e => console.error(e));
  }, [id]);

  const updateStatus = async (status) => {
    const res = await fetch(`/api/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json();
      return alert(err.error || 'Failed to update status');
    }
    setOrder({ ...order, status });
  };

  const updateItemTracking = async () => {
    const res = await fetch(`/api/orders/${id}/items/${selectedItem.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(trackingData),
    });
    if (res.ok) {
      const updatedItem = await res.json();
      setOrder({
        ...order,
        items: order.items.map(it => it.id === updatedItem.id ? { ...it, ...updatedItem } : it)
      });
      setShowTrackingModal(false);
    } else {
      const err = await res.json();
      alert(err.error || 'Update failed');
    }
  };

  const processRefund = async () => {
    const res = await fetch(`/api/orders/${id}/refund`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(refundData),
    });
    const data = await res.json();
    if (res.ok) {
      setOrder({ ...order, payment_status: data.order_status });
      setShowRefundModal(false);
    } else {
      alert(data.error);
    }
  };

  const processPayment = async () => {
    const res = await fetch(`/api/payments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...paymentData, order_id: id }),
    });
    const data = await res.json();
    if (res.ok) {
      setOrder({ ...order, payment_status: data.order_status });
      setShowPaymentModal(false);
    } else {
      alert(data.error);
    }
  };

  const handlePrintInvoice = async () => {
    const res = await fetch(`/api/orders/${id}/invoice`);
    const data = await res.json();
    if (!res.ok) return alert(data.error);

    const printWindow = window.open('', '_blank');
    const { order, items, payments } = data;

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice #${order.order_number}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .section { margin-bottom: 30px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th { text-align: left; border-bottom: 1px solid #eee; padding: 10px; }
            td { padding: 10px; border-bottom: 1px solid #f9f9f9; }
            .total-row { font-weight: bold; font-size: 1.2em; }
            .footer { margin-top: 50px; text-align: center; font-size: 0.8em; color: #888; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${order.store_name || 'DrycleanersFlow POS'}</h1>
            <p>${order.store_address || ''} | ${order.store_phone || ''}</p>
            <h2>TAX INVOICE</h2>
          </div>
          <div style="display: flex; justify-content: space-between;" class="section">
            <div>
              <strong>ORDER DETAILS</strong><br/>
              No: ${order.order_number}<br/>
              Date: ${new Date(order.created_at).toLocaleString()}<br/>
              Status: ${order.status.toUpperCase()}
            </div>
            <div>
              <strong>CUSTOMER</strong><br/>
              Name: ${order.customer_name}<br/>
              Phone: ${order.customer_phone}<br/>
              ${order.customer_address || ''}
            </div>
          </div>
          <div class="section">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Service</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${items.map(it => `
                  <tr>
                    <td>${it.garment_type} ${it.tag_id ? `(${it.tag_id})` : ''}</td>
                    <td>${it.service_type}</td>
                    <td>${it.quantity}</td>
                    <td>₹${it.price}</td>
                    <td>₹${it.price * it.quantity}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div style="text-align: right;" class="section">
            <p>Discount: -₹${order.discount || 0}</p>
            <p>Tax: ₹${order.tax || 0}</p>
            <p class="total-row">Grand Total: ₹${order.total_amount}</p>
          </div>
          <div class="footer">
            <p>Thank you for choosing DrycleanersFlow! This is a computer generated invoice.</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const updateLogistics = async () => {
    const res = await fetch(`/api/orders/${id}/logistics`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: logisticsType, status: logisticsStatus, notes: logisticsNotes, driverId: logisticsDriverId || null }),
    });
    if (res.ok) {
      const field = logisticsType === 'pickup' ? 'pickup_status' : 'delivery_status';
      setOrder({ ...order, [field]: logisticsStatus, logistics_notes: logisticsNotes, driver_id: logisticsDriverId || order.driver_id });
      setShowLogisticsModal(false);
    } else {
      const err = await res.json();
      alert(err.error || 'Logistics update failed');
    }
  };

  const handleReschedule = async () => {
    const res = await fetch(`/api/orders/${id}/reschedule`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rescheduleData),
    });

    if (res.ok) {
      // Refresh local state with new dates
      setOrder({
        ...order,
        pickup_date: rescheduleData.pickup_date,
        delivery_date: rescheduleData.delivery_date,
        pickup_status: 'pending', // Reset status as it's a new appointment
        delivery_status: 'pending'
      });
      setShowRescheduleModal(false);
    } else {
      const err = await res.json();
      alert(err.error || 'Reschedule failed');
    }
  };

  const handlePrintAllTags = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Print All Tags - ${order.order_number}</title>
          <style>
            body { margin: 0; font-family: sans-serif; }
            .tag-page { display: flex; flex-wrap: wrap; gap: 20px; padding: 20px; justify-content: center; }
            .label { 
              text-align: center; 
              border: 2px solid #000; 
              padding: 15px; 
              border-radius: 12px; 
              width: 250px;
              page-break-inside: avoid;
              margin-bottom: 20px;
            }
            h1 { margin: 0 0 5px 0; font-size: 18px; }
            p { margin: 2px 0; font-size: 12px; font-weight: bold; }
            .qr-container { margin: 10px 0; display: flex; justify-content: center; }
            .format-line { font-size: 14px; color: #000; border-top: 1px solid #eee; pt: 5px; mt: 5px; }
          </style>
        </head>
        <body>
          <div class="tag-page" id="tags-container"></div>
          <script>
            setTimeout(() => { window.print(); }, 1000);
          </script>
        </body>
      </html>
    `);

    setTimeout(() => {
      const container = printWindow.document.getElementById('tags-container');
      order.items.forEach(item => {
        const tagDiv = printWindow.document.createElement('div');
        tagDiv.className = 'label';

        // Format: Bag - Order - Type
        const bagId = item.bag_id || 'B1';
        const displayTag = `${bagId} - ${order.order_number} - ${item.garment_type}`;

        tagDiv.innerHTML = `
          <h1>${item.garment_type}</h1>
          <p>${order.customer_name || 'Walk-in'}</p>
          <div class="qr-container" id="qr-target-${item.id}"></div>
          <div class="format-line">${displayTag}</div>
          <p style="font-size: 10px; color: #666; font-weight: normal; margin-top: 4px;">ID: ${item.tag_id || item.id}</p>
        `;
        container.appendChild(tagDiv);

        const svgElement = document.getElementById('qr-' + item.id).cloneNode(true);
        printWindow.document.getElementById('qr-target-' + item.id).appendChild(svgElement);
      });
    }, 200);
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8">
      <div className="w-12 h-12 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin mb-4"></div>
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Loading Order Details</p>
    </div>
  );

  if (!order) return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8">
      <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-theme-text">
        <span className="material-symbols-outlined text-4xl">search_off</span>
      </div>
      <h3 className="text-xl font-bold text-on-surface">Order Not Found</h3>
    </div>
  );

  const formatDate = (d) => d ? new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';
  const getStatusColor = (status) => {
    if (status === 'delivered') return 'bg-slate-500/10 text-slate-400 border border-slate-500/20';
    if (status === 'ready') return 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
    if (status === 'processing' || status === 'washing' || status === 'dry_cleaning') return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
    if (status === 'damaged') return 'bg-red-500/10 text-red-500 border border-red-500/20';
    if (status === 'lost') return 'bg-surface text-theme-text border border-theme-border';
    return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
  };

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto space-y-6 lg:space-y-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 animate-fade-in-up">
        <div className="space-y-4">
          <Link href="/orders" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors uppercase tracking-widest">
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to Orders
          </Link>
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-black text-on-surface font-headline tracking-tight">Order #{order.order_number}</h1>
            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>
              {order.status}
            </span>
          </div>
          <p className="text-theme-text-muted font-medium text-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px]">calendar_today</span>
            Created {formatDate(order.created_at)}
          </p>
        </div>

        <div className="flex gap-4">
          {isAdmin && (
            <>
              {order.status === 'received' && (
                <>
                  <button
                    className="px-6 py-3 bg-emerald-600 text-theme-text rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all flex items-center gap-2 hover:bg-emerald-700"
                    onClick={() => updateStatus('processing')}
                  >
                    <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                    Start Processing
                  </button>
                  <Link
                    href={`/orders/new?edit=${order.id}`}
                    className="px-6 py-3 bg-theme-surface border border-theme text-theme rounded-2xl font-black text-sm shadow-sm active:scale-95 transition-all flex items-center gap-2 hover:bg-theme-container"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit</span>
                    Edit Order
                  </Link>
                  <button
                    className="px-6 py-3 bg-red-50 text-red-600 rounded-2xl font-black text-sm shadow-sm active:scale-95 transition-all flex items-center gap-2 hover:bg-red-100"
                    onClick={() => { if (confirm('Are you sure you want to cancel this order?')) updateStatus('cancelled'); }}
                  >
                    <span className="material-symbols-outlined text-[18px]">cancel</span>
                    Cancel
                  </button>
                </>
              )}
              {order.status === 'ready' && (
                <button
                  className="px-6 py-3 bg-indigo-600 text-theme-text rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all flex items-center gap-2 hover:bg-indigo-700"
                  onClick={() => updateStatus('delivered')}
                >
                  <span className="material-symbols-outlined text-[18px]">local_shipping</span>
                  Mark Delivered
                </button>
              )}
            </>
          )}
          <button
            className="px-6 py-3 bg-theme-surface border border-theme text-theme rounded-2xl font-black text-sm hover:bg-theme-container transition-all flex items-center gap-2"
            onClick={() => {
              setRescheduleData({ pickup_date: order.pickup_date?.split('T')[0] || '', delivery_date: order.delivery_date?.split('T')[0] || '' });
              setShowRescheduleModal(true);
            }}
          >
            <span className="material-symbols-outlined text-[18px]">event_repeat</span>
            Reschedule
          </button>
          <button
            className="px-6 py-3 bg-slate-100 text-slate-500 border border-slate-200 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all flex items-center gap-2 shadow-sm"
            onClick={handlePrintAllTags}
          >
            <span className="material-symbols-outlined text-[18px]">qr_code_2</span>
            Print All Tags
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* Main Left Content */}
        <div className="lg:col-span-8 space-y-8 animate-fade-in-up stagger-1">

          {/* Logistics & Delivery Card */}
          <div className="glass-card-premium p-8 flex flex-col md:flex-row gap-8">
            <div className="flex-1 space-y-4">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px]">local_shipping</span>
                Logistics Snapshot
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-theme-container border border-theme">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Pickup</p>
                  <p className="text-sm font-bold text-on-surface mb-2">{formatDate(order.pickup_date)}</p>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${order.pickup_status === 'successful' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        order.pickup_status === 'failed' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                      {order.pickup_status || 'pending'}
                    </span>
                    <button
                      onClick={() => { setLogisticsType('pickup'); setLogisticsStatus(order.pickup_status || 'successful'); setLogisticsDriverId(order.driver_id || ''); setShowLogisticsModal(true); }}
                      className="text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:underline"
                    >
                      Update
                    </button>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-theme-container border border-theme">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Delivery</p>
                  <p className="text-sm font-bold text-on-surface mb-2">{formatDate(order.delivery_date)}</p>
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border ${order.delivery_status === 'successful' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        order.delivery_status === 'failed' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                      }`}>
                      {order.delivery_status || 'pending'}
                    </span>
                    <button
                      onClick={() => { setLogisticsType('delivery'); setLogisticsStatus(order.delivery_status || 'successful'); setLogisticsDriverId(order.driver_id || ''); setShowLogisticsModal(true); }}
                      className="text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:underline"
                    >
                      Update
                    </button>
                  </div>
                </div>
              </div>
              {order.driver_id && (
                <div className="mt-4 p-3 bg-blue-50/20 rounded-xl border border-blue-100/50 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[16px] text-blue-500">person</span>
                  <span className="text-[11px] font-medium text-slate-400">
                    <strong>Assigned Driver:</strong> {drivers.find(d => d.id === order.driver_id)?.name || 'Unknown'}
                  </span>
                </div>
              )}
              {order.logistics_notes && (
                <div className="mt-2 p-3 bg-amber-50 rounded-xl border border-amber-100 italic text-[10px] text-amber-800">
                  <strong>Logistics Note:</strong> {order.logistics_notes}
                </div>
              )}
            </div>

            <div className="md:w-64 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-3">Address Information</h4>
              <p className="text-xs font-bold text-theme-text mb-1">{order.customer_name}</p>
              <p className="text-[10px] text-theme-text-muted leading-relaxed mb-4">{order.customer_address || 'No address provided'}</p>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.customer_address || '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 bg-theme-surface border border-emerald-200/30 rounded-xl text-[10px] font-black text-emerald-500 uppercase tracking-widest hover:bg-emerald-500/10 transition-all flex items-center justify-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">map</span>
                View on Map
              </a>
            </div>
          </div>

          {/* Items Table */}
          <div className="glass-card-premium p-8">
            <h3 className="text-lg font-black font-headline text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-600">checkroom</span>
              Order Items
            </h3>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-theme text-[10px] uppercase tracking-widest font-black text-theme-muted">
                    <th className="pb-4 pr-6">Garment & Service</th>
                    <th className="pb-4 px-6 text-center">Tracking Info</th>
                    <th className="pb-4 px-6 text-center">Quantity</th>
                    <th className="pb-4 px-6 text-right">Price</th>
                    <th className="pb-4 pl-6 text-right w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y border-theme">
                  {order.items?.map((item, idx) => (
                    <tr key={item.id} className="group hover:bg-theme-container transition-colors">
                      <td className="py-4 pr-6">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-theme-container text-theme-muted flex items-center justify-center group-hover:bg-emerald-500/10 group-hover:text-emerald-500 transition-colors">
                            <span className="material-symbols-outlined">{getStageIcon(item.status)}</span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-on-surface">{item.garment_type}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{item.service_type}</p>
                            {item.notes && <p className="text-[10px] text-amber-600 font-medium italic mt-1">Note: {item.notes}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex flex-col items-center gap-1">
                          {item.tag_id ? (
                            <span className="px-2 py-0.5 bg-theme-container text-theme-muted rounded text-[9px] font-black tracking-widest uppercase">Tag: {item.tag_id}</span>
                          ) : (
                            <span className="text-[9px] text-theme-text font-bold italic uppercase">No Tag</span>
                          )}
                          {item.bag_id && (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[9px] font-black tracking-widest uppercase">Bag: {item.bag_id}</span>
                          )}
                          {item.incident_status !== 'none' && (
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase ${item.incident_status === 'damaged' ? 'bg-red-50 text-red-600' : 'bg-surface text-theme-text'}`}>
                              {item.incident_status}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="text-sm font-bold text-on-surface bg-theme-container px-3 py-1.5 rounded-lg">{item.quantity}</span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="text-sm font-bold text-on-surface">₹{item.price?.toLocaleString('en-IN')}</span>
                      </td>
                      <td className="py-4 pl-6 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const win = window.open('', '_blank');
                              win.document.write(`
                                 <html>
                                   <head>
                                      <title>Print Label - ${item.tag_id}</title>
                                      <style>
                                        body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: sans-serif; }
                                        .label { text-align: center; border: 2px solid #000; padding: 20px; border-radius: 12px; }
                                        h1 { margin: 0 0 10px 0; font-size: 24px; }
                                        p { margin: 5px 0; font-size: 14px; font-weight: bold; }
                                        .qr-container { margin: 15px 0; display: flex; justify-content: center; }
                                      </style>
                                   </head>
                                   <body>
                                      <div class="label">
                                        <h1>${item.garment_type}</h1>
                                        <p>${order.customer_name || 'Walk-in'}</p>
                                        <div class="qr-container" id="qr-target"></div>
                                        <p style="font-size: 14px; font-weight: bold; border-top: 1px solid #eee; padding-top: 5px;">${item.bag_id || 'B1'} - ${order.order_number} - ${item.garment_type}</p>
                                        <p style="font-size: 10px; color: #666; font-weight: normal;">ID: ${item.tag_id || item.id}</p>
                                      </div>
                                      <script>
                                        // Wait a tiny bit for the image to load on the parent side before printing
                                        setTimeout(() => { window.print(); }, 500);
                                      </script>
                                   </body>
                                 </html>
                               `);
                              setTimeout(() => {
                                const svgElement = document.getElementById('qr-' + item.id).cloneNode(true);
                                win.document.getElementById('qr-target').appendChild(svgElement);
                              }, 100);
                            }}
                            className="w-8 h-8 rounded-lg bg-theme-container text-theme-muted hover:bg-emerald-500/10 transition-colors flex items-center justify-center relative group/qr"
                          >
                            <span className="material-symbols-outlined text-lg">print</span>
                            <div className="absolute opacity-0 pointer-events-none w-0 h-0 overflow-hidden">
                              <QRCodeSVG
                                id={"qr-" + item.id}
                                value={item.tag_id || item.id.toString()}
                                size={120}
                                level={"H"}
                              />
                            </div>
                            <div className="absolute bottom-full mb-2 bg-surface text-theme-text text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover/qr:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                              Print Tag Label
                            </div>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedItem(item);
                              setTrackingData({
                                tag_id: item.tag_id || '',
                                bag_id: item.bag_id || '',
                                incident_status: item.incident_status || 'none',
                                incident_notes: item.incident_notes || '',
                                status: item.status || ''
                              });
                              setShowTrackingModal(true);
                            }}
                            className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors flex items-center justify-center"
                          >
                            <span className="material-symbols-outlined text-lg">barcode_scanner</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Workflow Timeline */}
          <div className="glass-card-premium p-8">
            <h3 className="text-lg font-black font-headline text-on-surface mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-blue-600">route</span>
              Garment Assembly Workflow
            </h3>

            <div className="space-y-6">
              {order.items?.map(item => {
                const history = item.workflow_history ? item.workflow_history.split('|').map(h => {
                  const firstColon = h.indexOf(':');
                  if (firstColon === -1) return { stage: h, time: null };
                  const stage = h.substring(0, firstColon);
                  const time = h.substring(firstColon + 1);
                  return { stage, time };
                }) : [];

                // Determine expected functional sequence based on service type
                const sType = (item.service_type || '').toLowerCase();
                let expectedSequence = ['received', 'sorting', 'washing', 'dry_cleaning', 'drying', 'ironing', 'quality_check', 'ready'];
                if (sType.includes('dry clean')) expectedSequence = ['received', 'sorting', 'dry_cleaning', 'drying', 'ironing', 'quality_check', 'ready'];
                else if (sType.includes('wash & fold') || sType.includes('wash and fold') || sType.includes('per kg')) expectedSequence = ['received', 'sorting', 'washing', 'drying', 'quality_check', 'ready'];
                else if (sType.includes('iron')) expectedSequence = ['received', 'ironing', 'quality_check', 'ready'];
                else if (sType.includes('wash')) expectedSequence = ['received', 'sorting', 'washing', 'drying', 'ironing', 'quality_check', 'ready'];

                return (
                  <div key={item.id} className="p-5 rounded-2xl bg-theme-container border border-theme-border hover:border-primary/50 transition-colors group">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-sm font-bold text-theme-text group-hover:text-primary transition-colors">
                        {item.garment_type} <span className="text-theme-text-muted font-medium ml-1">({item.service_type})</span>
                      </h4>
                      <span className="text-[10px] text-theme-text-muted font-bold uppercase tracking-widest">Line Item ID: {String(item.id).substring(0, 8)}</span>
                    </div>

                    {/* Timeline visualization */}
                    <div className="relative pt-2">
                      <div className="absolute top-[1.5rem] left-4 right-4 h-0.5 bg-theme-border"></div>
                      <div className="flex justify-between relative z-10 w-full overflow-x-auto no-scrollbar py-2 px-1">
                        {expectedSequence.map((stageKey, i) => {
                          const historyEntry = history.find(h => h.stage === stageKey);
                          const isCurrent = item.status === stageKey;
                          const isHistory = !!historyEntry;
                          const isCompleted = isHistory && !isCurrent;
                          const isPending = !isHistory && !isCurrent;

                          return (
                            <div key={i} className={`flex flex-col items-center gap-2 group/node min-w-[80px] ${isPending ? 'opacity-40' : ''}`}>
                              <div className={`w-8 h-8 rounded-full ring-4 ring-theme-container flex items-center justify-center shadow-sm transition-transform group-hover/node:scale-110 ${isCompleted ? 'bg-emerald-500 text-theme-bg' :
                                  isCurrent ? 'bg-blue-500 text-theme-bg ring-blue-500/20 animate-pulse' :
                                    'bg-theme-surface text-theme-text-muted'
                                }`}>
                                <span className="material-symbols-outlined text-[14px] translate-y-[2px]">{getStageIcon(stageKey)}</span>
                              </div>
                              <div className="text-center">
                                <p className={`text-[10px] font-black uppercase tracking-widest ${isCompleted ? 'text-emerald-500' :
                                    isCurrent ? 'text-blue-500' :
                                      'text-theme-text-muted'
                                  }`}>
                                  {STAGE_LABELS[stageKey] || stageKey}
                                </p>
                                <p className="text-[9px] font-bold text-theme-text-muted">
                                  {historyEntry && historyEntry.time ? new Date(historyEntry.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) :
                                    isCurrent ? 'In Progress' : 'Pending'}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-4 space-y-6 animate-fade-in-up stagger-2">

          {/* Customer Card */}
          <div className="glass-card-premium p-6 relative overflow-hidden group">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2 relative z-10">
              <span className="material-symbols-outlined text-[16px]">account_circle</span>
              Client Profile
            </h3>

            <div className="flex items-center gap-4 mb-6 relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 text-primary flex items-center justify-center text-2xl font-black shadow-inner">
                {(order.customer_name || 'W').charAt(0)}
              </div>
              <div>
                <h4 className="text-base font-black text-on-surface">{order.customer_name || 'Walk-in Customer'}</h4>
                <p className="text-xs font-bold text-slate-400">{order.customer_phone || 'No phone provided'}</p>
              </div>
            </div>

            {(order.customer_email || order.customer_address) && (
              <div className="space-y-4 pt-4 border-t border-slate-50 relative z-10">
                {order.customer_email && (
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-theme-text text-[18px]">mail</span>
                    <span className="text-xs font-medium text-theme-text-muted break-all">{order.customer_email}</span>
                  </div>
                )}
                {order.customer_address && (
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-theme-text text-[18px]">location_on</span>
                    <span className="text-xs font-medium text-theme-text-muted">{order.customer_address}</span>
                  </div>
                )}
              </div>
            )}

            <Link href={`/customers/${order.customer_id}`} className="mt-6 w-full py-3 bg-theme-container hover:bg-primary/10 text-primary text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 relative z-10">
              View Full Profile
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>

          {/* Payment Card */}
          <div className="glass-card-premium p-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px]">payments</span>
              Financial Summary
            </h3>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-theme-text-muted">Subtotal</span>
                <span className="text-sm font-bold text-on-surface">₹{((order.total_amount || 0) - (order.tax || 0)).toLocaleString('en-IN')}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between items-center text-emerald-600">
                  <span className="text-xs font-medium">Applied Discount</span>
                  <span className="text-sm font-bold">-₹{order.discount?.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium text-theme-text-muted">Tax (GST/VAT)</span>
                <span className="text-sm font-bold text-on-surface">₹{order.tax?.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-theme-border flex justify-between items-end mb-6">
              <span className="text-sm font-black uppercase tracking-widest text-theme-text">Total</span>
              <span className="text-3xl font-black text-emerald-500 font-headline tracking-tighter">
                ₹{order.total_amount?.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="bg-surface-container-lowest rounded-2xl p-4 border border-slate-50 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-theme-text-muted">Payment Method</span>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-theme-container rounded-md shadow-sm border border-theme-border">
                  <span className="text-theme-text font-bold text-[10px] uppercase tracking-wider">{order.payment_method}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-theme-text-muted">Status</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${order.payment_status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                    order.payment_status === 'refunded' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                      'bg-amber-500/10 text-amber-500 border-amber-500/20'
                  }`}>
                  {order.payment_status}
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2">
              {(order.payment_status === 'pending' || order.payment_status === 'partial') && (
                <button
                  onClick={() => {
                    setPaymentData({ amount: order.total_amount, method: 'cash' });
                    setShowPaymentModal(true);
                  }}
                  className="w-full py-3 bg-emerald-600 text-theme-text text-xs font-black rounded-xl shadow-lg shadow-emerald-900/10 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">payments</span>
                  Collect Payment
                </button>
              )}
              {order.payment_status === 'paid' && (
                <button
                  onClick={() => setShowRefundModal(true)}
                  className="w-full py-3 bg-red-50 text-red-600 text-xs font-black rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">undo</span>
                  Process Refund
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Item Tracking Modal */}
      {showTrackingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-theme-text/40 backdrop-blur-md animate-fade-in">
          <div className="bg-theme-surface rounded-[2.5rem] p-8 max-w-md w-full mx-4 shadow-2xl border border-theme-border animate-scale-in">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black text-theme-text">Garment Tracking</h3>
              <button
                onClick={() => setShowTrackingModal(false)}
                className="w-10 h-10 rounded-full hover:bg-theme-container flex items-center justify-center text-theme-text-muted"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-6 mb-8">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Physical Tag ID</label>
                  <input
                    type="text"
                    className="w-full bg-theme-container border border-theme-border rounded-xl p-3 text-sm font-bold text-theme-text focus:border-primary/50 outline-none transition-all"
                    value={trackingData.tag_id}
                    onChange={e => setTrackingData({ ...trackingData, tag_id: e.target.value })}
                    placeholder="e.g. CF-10293"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Bag Reference</label>
                  <input
                    type="text"
                    className="w-full bg-theme-container border border-theme-border rounded-xl p-3 text-sm font-bold text-theme-text focus:border-primary/50 outline-none transition-all"
                    value={trackingData.bag_id}
                    onChange={e => setTrackingData({ ...trackingData, bag_id: e.target.value })}
                    placeholder="e.g. Bag B-12"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Processing Stage</label>
                <select
                  className="w-full bg-theme-container border border-theme-border rounded-xl p-3 text-sm font-bold text-theme-text focus:border-primary/50 outline-none transition-all"
                  value={trackingData.status}
                  onChange={e => setTrackingData({ ...trackingData, status: e.target.value })}
                >
                  {Object.entries(STAGE_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-slate-50">
                <label className="text-[10px] font-black uppercase text-red-400 tracking-widest block mb-1">Incident Reporting</label>
                <div className="flex gap-2 mb-3">
                  {['none', 'damaged', 'lost'].map(st => (
                    <button
                      key={st}
                      onClick={() => setTrackingData({ ...trackingData, incident_status: st })}
                      className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all border ${trackingData.incident_status === st
                          ? (st === 'none' ? 'bg-theme-container border-theme-border text-theme-text' : 'bg-red-500/10 border-red-500/20 text-red-500')
                          : 'bg-theme-surface border-transparent text-theme-text-muted hover:bg-theme-container'
                        }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
                <textarea
                  className="w-full bg-theme-container border border-theme-border rounded-xl p-3 text-sm font-bold text-theme-text focus:border-red-500/50 outline-none transition-all h-20"
                  value={trackingData.incident_notes}
                  onChange={e => setTrackingData({ ...trackingData, incident_notes: e.target.value })}
                  placeholder="Details about damage or loss..."
                />
              </div>
            </div>

            <button
              onClick={updateItemTracking}
              className="w-full py-4 primary-gradient text-theme-text rounded-2xl font-black text-sm shadow-xl shadow-emerald-900/10 active:scale-95 transition-all"
            >
              Update Record
            </button>
          </div>
        </div>
      )}

      {/* Refund Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-theme-text/40 backdrop-blur-md animate-fade-in">
          <div className="bg-theme-surface rounded-[2.5rem] p-8 max-sm w-full mx-4 shadow-2xl border border-red-500/20 animate-scale-in">
            <h3 className="text-xl font-black text-theme-text mb-6">Refund Transaction</h3>
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Refund Amount</label>
                <input
                  type="number"
                  className="w-full bg-theme-container border border-theme-border rounded-xl p-3 text-sm font-bold text-theme-text focus:border-red-500/50 outline-none transition-all"
                  value={refundData.amount}
                  onChange={e => setRefundData({ ...refundData, amount: e.target.value })}
                  placeholder={order.total_amount}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Reason</label>
                <textarea
                  className="w-full bg-theme-container border border-theme-border rounded-xl p-3 text-sm font-bold text-theme-text focus:border-red-500/50 outline-none transition-all h-24"
                  value={refundData.reason}
                  onChange={e => setRefundData({ ...refundData, reason: e.target.value })}
                  placeholder="Reason for refund..."
                />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={processRefund}
                className="w-full py-4 bg-red-600 text-theme-text rounded-2xl font-black text-sm shadow-xl shadow-red-900/10 active:scale-95 transition-all"
              >
                Confirm Refund
              </button>
              <button
                onClick={() => setShowRefundModal(false)}
                className="w-full py-4 bg-theme-container text-theme-text rounded-2xl font-bold text-sm hover:bg-theme-surface-container active:scale-95 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collect Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-theme-text/40 backdrop-blur-md animate-fade-in">
          <div className="bg-theme-surface rounded-[2.5rem] p-8 max-w-sm w-full mx-4 shadow-2xl border border-theme-border animate-scale-in">
            <h3 className="text-xl font-black text-theme-text mb-6">Collect Payment</h3>
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Amount</label>
                <input
                  type="number"
                  className="w-full bg-theme-container border border-theme-border rounded-xl p-3 text-sm font-bold text-theme-text focus:border-primary/50 outline-none transition-all"
                  value={paymentData.amount}
                  onChange={e => setPaymentData({ ...paymentData, amount: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-1">Method</label>
                <select
                  className="w-full bg-theme-container border border-theme-border rounded-xl p-3 text-sm font-bold text-theme-text focus:border-primary/50 outline-none transition-all"
                  value={paymentData.method}
                  onChange={e => setPaymentData({ ...paymentData, method: e.target.value })}
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="online">UPI / Online</option>
                </select>
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={processPayment}
                className="w-full py-4 primary-gradient text-theme-text rounded-2xl font-black text-sm shadow-xl shadow-emerald-900/10 active:scale-95 transition-all"
              >
                Post Payment
              </button>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-full py-4 bg-theme-container text-theme-text rounded-2xl font-bold text-sm hover:bg-theme-surface-container active:scale-95 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Logistics Status Modal */}
      {showLogisticsModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-theme-text/40 backdrop-blur-md animate-fade-in">
          <div className="bg-theme-surface rounded-[2.5rem] p-8 max-w-sm w-full mx-4 shadow-2xl border border-theme-border animate-scale-in">
            <h3 className="text-xl font-black text-theme-text mb-6 capitalize">{logisticsType} Outcome</h3>
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Status</label>
                <div className="flex gap-2">
                  {['successful', 'failed', 'pending'].map(s => (
                    <button
                      key={s}
                      onClick={() => setLogisticsStatus(s)}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${logisticsStatus === s ? 'bg-emerald-600 text-theme-bg border-emerald-600 shadow-md' : 'bg-theme-container text-theme-text-muted border-transparent hover:bg-theme-surface-container'
                        }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Assign Driver</label>
                <select
                  className="w-full bg-theme-container border border-theme-border rounded-xl p-3 text-sm font-bold text-theme-text outline-none focus:border-primary/50 transition-all mb-4"
                  value={logisticsDriverId}
                  onChange={e => setLogisticsDriverId(e.target.value)}
                >
                  <option value="">-- Unassigned --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Outcome Notes</label>
                <textarea
                  className="w-full bg-theme-container border border-theme-border rounded-2xl p-4 text-sm font-medium text-theme-text outline-none h-24 focus:border-primary/50 transition-all"
                  value={logisticsNotes}
                  onChange={e => setLogisticsNotes(e.target.value)}
                  placeholder="e.g. Customer not home, Gate locked, etc."
                />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={updateLogistics}
                className="w-full py-4 primary-gradient text-theme-text rounded-2xl font-black text-sm shadow-xl shadow-emerald-900/10 active:scale-95 transition-all"
              >
                Update Logistics
              </button>
              <button onClick={() => setShowLogisticsModal(false)} className="w-full py-4 text-slate-400 font-bold text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-theme-text/40 backdrop-blur-md animate-fade-in">
          <div className="bg-theme-surface rounded-[2.5rem] p-8 max-w-sm w-full mx-4 shadow-2xl border border-theme-border animate-scale-in">
            <h3 className="text-xl font-black text-theme-text mb-6">Reschedule Order</h3>
            <div className="space-y-4 mb-8">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">New Pickup Date</label>
                <input
                  type="date"
                  className="w-full bg-theme-container border border-theme-border rounded-xl p-3 text-sm font-bold text-theme-text outline-none"
                  value={rescheduleData.pickup_date}
                  onChange={e => setRescheduleData({ ...rescheduleData, pickup_date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">New Delivery Date</label>
                <input
                  type="date"
                  className="w-full bg-theme-container border border-theme-border rounded-xl p-3 text-sm font-bold text-theme-text outline-none"
                  value={rescheduleData.delivery_date}
                  onChange={e => setRescheduleData({ ...rescheduleData, delivery_date: e.target.value })}
                />
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={handleReschedule}
                className="w-full py-4 primary-gradient text-theme-text rounded-2xl font-black text-sm shadow-xl shadow-emerald-900/10 active:scale-95 transition-all"
              >
                Save New Windows
              </button>
              <button onClick={() => setShowRescheduleModal(false)} className="w-full py-4 text-slate-400 font-bold text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
