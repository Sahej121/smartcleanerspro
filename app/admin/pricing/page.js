'use client';
import { useState, useEffect } from 'react';

export default function PricingPage() {
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ garment_type: '', service_type: 'Dry Cleaning', price: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/pricing').then(r => r.json()).then(d => { setPricing(d); setLoading(false); });
  }, []);

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditValue(item.price.toString());
  };

  const saveEdit = async (id) => {
    const price = parseFloat(editValue);
    if (isNaN(price) || price < 0) return;

    await fetch('/api/pricing', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, price }),
    });

    setPricing(pricing.map(p => p.id === id ? { ...p, price } : p));
    setEditingId(null);
    setMessage('✅ Price updated successfully');
    setTimeout(() => setMessage(''), 3000);
  };
  
  const handleAdd = async () => {
    const price = parseFloat(newItem.price);
    if (!newItem.garment_type || !newItem.service_type || isNaN(price)) return;
    
    const res = await fetch('/api/pricing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newItem, price }),
    });
    
    if (res.ok) {
      const added = await res.json();
      setPricing([...pricing, added]);
      setShowAddModal(false);
      setNewItem({ garment_type: '', service_type: 'Dry Cleaning', price: '' });
      setMessage('✅ New pricing added successfully');
      setTimeout(() => setMessage(''), 3000);
    }
  };

  // Group by garment type
  const grouped = {};
  pricing.forEach(p => {
    if (!grouped[p.garment_type]) grouped[p.garment_type] = [];
    grouped[p.garment_type].push(p);
  });

  if (loading) return <div className="loading-spinner"></div>;

  return (
    <div id="pricing-page" className="p-4 lg:p-8 max-w-7xl mx-auto min-h-screen">
      <div className="page-header">
        <div>
          <h1>Pricing Management</h1>
          <p>Set prices for garment and service combinations</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          Add New Pricing
        </button>
      </div>

      {message && (
        <div style={{ padding: '12px 16px', background: 'var(--primary-50)', color: 'var(--primary-700)', borderRadius: 'var(--radius-md)', fontWeight: 500, marginBottom: '20px' }}>
          {message}
        </div>
      )}

      {Object.entries(grouped).map(([garment, items]) => (
        <div key={garment} className="card" style={{ marginBottom: '16px' }}>
          <div className="card-title" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, background: 'var(--primary-100)', color: 'var(--primary-700)', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>
              ITEM
            </span>
            {garment}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {items.map(item => (
              <div key={item.id} style={{
                padding: '16px',
                background: editingId === item.id ? 'var(--primary-50)' : 'var(--bg-secondary)',
                borderRadius: 'var(--radius-md)',
                border: editingId === item.id ? '2px solid var(--primary-400)' : '1px solid transparent',
              }}>
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '8px' }}>
                  {item.service_type}
                </div>
                {editingId === item.id ? (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      className="pricing-edit-input"
                      value={editValue}
                      onChange={e => setEditValue(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveEdit(item.id)}
                      autoFocus
                      style={{ flex: 1, textAlign: 'left' }}
                    />
                    <button className="btn btn-primary btn-sm" onClick={() => saveEdit(item.id)}>✓</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setEditingId(null)}>✕</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--primary-700)' }}>
                      ₹{item.price}
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => startEdit(item)} style={{ fontSize: '12px', fontWeight: 600 }}>
                      EDIT
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add New Pricing</h2>
              <button className="btn btn-ghost" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Garment Type *</label>
                <input 
                  className="form-input" 
                  value={newItem.garment_type} 
                  onChange={e => setNewItem({ ...newItem, garment_type: e.target.value })} 
                  placeholder="e.g. Saree, Suit, Lehenga"
                  list="garment-options"
                />
                <datalist id="garment-options">
                  {[...new Set(pricing.map(p => p.garment_type))].map(g => <option key={g} value={g} />)}
                </datalist>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div className="form-group">
                  <label className="form-label">Service Type *</label>
                  <select 
                    className="form-select" 
                    value={newItem.service_type} 
                    onChange={e => setNewItem({ ...newItem, service_type: e.target.value })}
                  >
                    {['Dry Cleaning', 'Washing', 'Ironing', 'Stain Removal', 'Express Service', 'Polishing'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Price (₹) *</label>
                  <input 
                    className="form-input" 
                    type="number"
                    value={newItem.price} 
                    onChange={e => setNewItem({ ...newItem, price: e.target.value })} 
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd} disabled={!newItem.garment_type || !newItem.price}>
                Add Pricing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
