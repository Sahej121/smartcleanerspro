'use client';
import { useState, useEffect } from 'react';

const STAGES = [
  { key: 'received', label: 'Received', color: 'var(--blue-500)' },
  { key: 'sorting', label: 'Sorting', color: 'var(--yellow-500)' },
  { key: 'washing', label: 'Washing', color: '#0284c7' },
  { key: 'dry_cleaning', label: 'Dry Clean', color: 'var(--purple-500)' },
  { key: 'drying', label: 'Drying', color: '#d97706' },
  { key: 'ironing', label: 'Ironing', color: '#db2777' },
  { key: 'quality_check', label: 'QC', color: '#9333ea' },
  { key: 'ready', label: 'Ready', color: 'var(--primary-600)' },
];

export default function OperationsPage() {
  const [workflow, setWorkflow] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkflow();
  }, []);

  const fetchWorkflow = () => {
    fetch('/api/workflow')
      .then(r => r.json())
      .then(data => { setWorkflow(data); setLoading(false); });
  };

  const advanceItem = async (itemId) => {
    await fetch(`/api/workflow/${itemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'advance' }),
    });
    fetchWorkflow();
  };

  if (loading) return <div className="loading-spinner"></div>;

  return (
    <div id="operations-page">
      <div className="page-header">
        <div>
          <h1>Operations Board</h1>
          <p>Track garments through the processing pipeline</p>
        </div>
        <button className="btn btn-secondary" onClick={fetchWorkflow}>Refresh</button>
      </div>

      <div className="kanban-board">
        {STAGES.map(stage => {
          const items = workflow[stage.key] || [];
          return (
            <div key={stage.key} className="kanban-column">
              <div className="kanban-column-header">
                <div className="kanban-column-title">
                  {stage.label}
                </div>
                <div className="kanban-column-count">{items.length}</div>
              </div>
              <div className="kanban-column-body">
                {items.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-tertiary)', fontSize: '13px' }}>
                    No items
                  </div>
                )}
                {items.map(item => (
                  <div key={item.id} className="kanban-card">
                    <div className="kanban-card-header">
                      <span className="kanban-card-id">{item.order_number}</span>
                      <span className="badge" style={{ background: `${stage.color}15`, color: stage.color, fontSize: '10px' }}>
                        #{item.id}
                      </span>
                    </div>
                    <div className="kanban-card-garment">{item.garment_type}</div>
                    <div className="kanban-card-service">{item.service_type}</div>
                    <div className="kanban-card-footer">
                      <span className="kanban-card-customer">{item.customer_name || 'Walk-in'}</span>
                      {stage.key !== 'ready' && (
                        <button className="kanban-advance-btn" onClick={() => advanceItem(item.id)}>
                          Next →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
