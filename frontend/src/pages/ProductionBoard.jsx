import { useState, useEffect, useRef, useMemo } from 'react';
import { api } from '../api.js';

const STATUS_GROUPS = [
  { key: 'scheduled', label: '已排期', statuses: [1] },
  { key: 'producing', label: '生产中', statuses: [2] },
  { key: 'ready', label: '已完成待取/配送', statuses: [3] },
  { key: 'delivering', label: '配送中', statuses: [4] }
];

const URGENCY_ORDER = { critical: 0, urgent: 1, soon: 2, normal: 3 };

const URGENCY_STATS = [
  { key: 'all', label: '全部', icon: '📋', color: '#d4a574', bgColor: '#fdf5ea', borderColor: '#d4a574' },
  { key: 'critical', label: '紧急订单', icon: '🔥', color: '#c62828', bgColor: '#ffebee', borderColor: '#e53935' },
  { key: 'urgent', label: '临期订单', icon: '⚠️', color: '#e65100', bgColor: '#fff3e0', borderColor: '#fb8c00' },
  { key: 'soon', label: '即将到来', icon: '📅', color: '#f57f17', bgColor: '#fff8e1', borderColor: '#ffb300' },
  { key: 'normal', label: '正常订单', icon: '✅', color: '#2e7d32', bgColor: '#e8f5e9', borderColor: '#66bb6a' }
];

function getUrgencyStyle(urgency) {
  switch (urgency) {
    case 'critical':
      return {
        borderLeft: '4px solid #e53935',
        background: 'linear-gradient(180deg, #ffebee 0%, white 60px)',
        boxShadow: '0 2px 8px rgba(229, 57, 53, 0.15)'
      };
    case 'urgent':
      return {
        borderLeft: '4px solid #fb8c00',
        boxShadow: '0 2px 8px rgba(251, 140, 0, 0.12)'
      };
    case 'soon':
      return {
        borderLeft: '4px solid #ffb300'
      };
    default:
      return {
        borderLeft: '4px solid #d4a574'
      };
  }
}

function getUrgencyBadge(urgency) {
  switch (urgency) {
    case 'critical':
      return (
        <span style={{
          display: 'inline-block',
          padding: '3px 10px',
          background: '#e53935',
          color: 'white',
          borderRadius: 10,
          fontSize: 12,
          fontWeight: 600
        }}>
          🔥 紧急
        </span>
      );
    case 'urgent':
      return (
        <span style={{
          display: 'inline-block',
          padding: '3px 10px',
          background: '#fb8c00',
          color: 'white',
          borderRadius: 10,
          fontSize: 12,
          fontWeight: 600
        }}>
          ⚠️ 即将临期
        </span>
      );
    case 'soon':
      return (
        <span style={{
          display: 'inline-block',
          padding: '3px 10px',
          background: '#fff8e1',
          color: '#f57f17',
          borderRadius: 10,
          fontSize: 12,
          fontWeight: 600
        }}>
          📅 临近
        </span>
      );
    default:
      return null;
  }
}

function formatDeliveryHours(hours) {
  const h = Math.round(hours);
  if (h < 0) {
    return (
      <span style={{ color: '#c62828', fontWeight: 600 }}>
        ⏰ 已超时 {Math.abs(h)} 小时
      </span>
    );
  }
  return (
    <span style={{ color: h < 6 ? '#c62828' : h < 24 ? '#e65100' : h < 48 ? '#f57f17' : '#8b7355' }}>
      ⏰ 距取货还有 {h} 小时
    </span>
  );
}

function sortGroupOrders(orders) {
  return [...orders].sort((a, b) => {
    const ua = URGENCY_ORDER[a.urgency] ?? 99;
    const ub = URGENCY_ORDER[b.urgency] ?? 99;
    if (ua !== ub) return ua - ub;
    return (b.productionHours ?? 0) - (a.productionHours ?? 0);
  });
}

export default function ProductionBoard() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [urgencyFilter, setUrgencyFilter] = useState('all');
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async () => {
    try {
      const res = await api.getProductionBoardSorted();
      setOrders(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const urgencyCounts = useMemo(() => {
    const counts = { all: orders.length, critical: 0, urgent: 0, soon: 0, normal: 0 };
    orders.forEach(o => {
      if (counts[o.urgency] !== undefined) counts[o.urgency]++;
    });
    return counts;
  }, [orders]);

  const getOrdersByStatus = (statuses) => {
    let filtered = orders.filter(o => statuses.includes(o.status));
    if (urgencyFilter !== 'all') {
      filtered = filtered.filter(o => o.urgency === urgencyFilter);
    }
    return sortGroupOrders(filtered);
  };

  const handleStartProduction = async (orderId) => {
    try {
      await api.updateOrderStatus(orderId, 2);
      loadOrders();
    } catch (e) {
      console.error(e);
    }
  };

  const openPhotoModal = (order) => {
    setSelectedOrder(order);
    setPhotoPreview(null);
    setShowPhotoModal(true);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(ev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const uploadPhoto = async () => {
    if (!fileInputRef.current?.files[0]) {
      alert('请选择要上传的照片');
      return;
    }
    try {
      const formData = new FormData();
      formData.append('photo', fileInputRef.current.files[0]);
      await api.uploadProductPhoto(selectedOrder.id, formData);
      setShowPhotoModal(false);
      loadOrders();
    } catch (e) {
      console.error(e);
      alert('上传失败');
    }
  };

  return (
    <div>
      <h1 className="page-title">👨‍🍳 生产看板</h1>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {URGENCY_STATS.map(stat => {
          const isActive = urgencyFilter === stat.key;
          const count = urgencyCounts[stat.key] ?? 0;
          return (
            <div
              key={stat.key}
              onClick={() => setUrgencyFilter(stat.key)}
              style={{
                background: isActive ? stat.bgColor : 'white',
                border: isActive ? `2px solid ${stat.borderColor}` : '2px solid transparent',
                borderRadius: 16,
                padding: 20,
                boxShadow: '0 2px 12px rgba(139, 90, 43, 0.08)',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  e.currentTarget.style.border = `2px solid ${stat.borderColor}40`;
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  e.currentTarget.style.border = '2px solid transparent';
                }
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 8 }}>{stat.icon}</div>
              <div style={{ fontSize: 28, fontWeight: 'bold', color: stat.color, marginBottom: 4 }}>
                {count}
              </div>
              <div style={{ fontSize: 14, color: '#8b7355' }}>
                {stat.label}
                {isActive && <span style={{ marginLeft: 6, fontSize: 12, color: stat.borderColor }}>● 已筛选</span>}
              </div>
            </div>
          );
        })}
      </div>

      {urgencyFilter !== 'all' && (
        <div style={{
          marginBottom: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          background: '#fdf5ea',
          padding: '10px 16px',
          borderRadius: 10,
          fontSize: 14
        }}>
          <span style={{ color: '#5d4037' }}>
            当前筛选：<strong>{URGENCY_STATS.find(s => s.key === urgencyFilter)?.label}</strong>
          </span>
          <button
            className="btn btn-sm btn-secondary"
            onClick={() => setUrgencyFilter('all')}
            style={{ padding: '4px 12px', fontSize: 12 }}
          >
            清除筛选
          </button>
        </div>
      )}

      <div className="production-columns">
        {STATUS_GROUPS.map(group => (
          <div key={group.key} className="production-column">
            <div className="production-column-title">
              <span>{group.label}</span>
              <span className="production-count">{getOrdersByStatus(group.statuses).length}</span>
            </div>
            {getOrdersByStatus(group.statuses).map(order => (
              <div
                key={order.id}
                className="order-card"
                onClick={() => setSelectedOrder(order)}
                style={getUrgencyStyle(order.urgency)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <div className="order-card-title" style={{ marginBottom: 0 }}>
                    {order.cakeName}
                    <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 'normal', color: '#8b7355' }}>
                      {order.size}
                    </span>
                  </div>
                  {getUrgencyBadge(order.urgency)}
                </div>
                <div className="order-card-meta">
                  👤 {order.customerName} · {order.pickupTypeLabel}
                </div>
                <div className="order-card-meta">
                  ⏰ {order.deliveryTime}
                </div>
                <div className="order-card-meta">
                  {formatDeliveryHours(order.hoursToDelivery)}
                </div>
                {order.productionHours !== undefined && order.productionHours !== null && (
                  <div className="order-card-meta">
                    ⏱ 制作耗时 {order.productionHours} 小时
                  </div>
                )}
                {order.productionPlan && (
                  <div className="order-card-meta" style={{ color: '#8b5a2b' }}>
                    👨‍🍳 {order.productionPlan.baker} · {order.productionPlan.startTime}-{order.productionPlan.endTime}
                  </div>
                )}
                {order.allergens !== '无' && (
                  <div style={{
                    marginTop: 8,
                    padding: '4px 8px',
                    background: '#ffebee',
                    color: '#c62828',
                    borderRadius: 6,
                    fontSize: 12
                  }}>
                    ⚠️ {order.allergens}
                  </div>
                )}
                <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {group.statuses[0] === 1 && (
                    <button
                      className="btn btn-sm btn-success"
                      onClick={e => { e.stopPropagation(); handleStartProduction(order.id); }}
                    >
                      开始生产
                    </button>
                  )}
                  {group.statuses[0] === 2 && (
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={e => { e.stopPropagation(); openPhotoModal(order); }}
                    >
                      📸 上传成品
                    </button>
                  )}
                </div>
              </div>
            ))}
            {getOrdersByStatus(group.statuses).length === 0 && (
              <div style={{ textAlign: 'center', padding: 20, color: '#aaa', fontSize: 13 }}>
                暂无订单
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedOrder && !showPhotoModal && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">生产详情 - {selectedOrder.cakeName}</div>
              <button className="modal-close" onClick={() => setSelectedOrder(null)}>×</button>
            </div>

            <div className="order-detail-row">
              <div className="order-detail-label">订单号</div>
              <div className="order-detail-value" style={{ fontFamily: 'monospace' }}>{selectedOrder.id}</div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">蛋糕</div>
              <div className="order-detail-value">
                <strong>{selectedOrder.cakeName}</strong> ({selectedOrder.size} × {selectedOrder.quantity})
              </div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">客户</div>
              <div className="order-detail-value">{selectedOrder.customerName} / {selectedOrder.phone}</div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">取货时间</div>
              <div className="order-detail-value">{selectedOrder.deliveryTime}</div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">距取货</div>
              <div className="order-detail-value">{formatDeliveryHours(selectedOrder.hoursToDelivery)}</div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">制作耗时</div>
              <div className="order-detail-value">
                {selectedOrder.productionHours !== undefined && selectedOrder.productionHours !== null
                  ? `${selectedOrder.productionHours} 小时`
                  : '-'}
              </div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">紧急程度</div>
              <div className="order-detail-value">
                {getUrgencyBadge(selectedOrder.urgency) || <span style={{ color: '#8b7355' }}>正常</span>}
              </div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">状态</div>
              <div className="order-detail-value">
                <span className={`status-badge status-${selectedOrder.status}`}>
                  {selectedOrder.statusLabel}
                </span>
              </div>
            </div>

            {selectedOrder.productionPlan && (
              <>
                <div style={{ fontWeight: 'bold', marginTop: 16, marginBottom: 8, color: '#5d4037' }}>
                  📅 生产计划
                </div>
                <div className="order-detail-row">
                  <div className="order-detail-label">日期</div>
                  <div className="order-detail-value">{selectedOrder.productionPlan.scheduledDate}</div>
                </div>
                <div className="order-detail-row">
                  <div className="order-detail-label">时间</div>
                  <div className="order-detail-value">
                    {selectedOrder.productionPlan.startTime} - {selectedOrder.productionPlan.endTime}
                  </div>
                </div>
                <div className="order-detail-row">
                  <div className="order-detail-label">师傅</div>
                  <div className="order-detail-value">{selectedOrder.productionPlan.baker}</div>
                </div>
                {selectedOrder.productionPlan.notes && (
                  <div className="order-detail-row">
                    <div className="order-detail-label">备注</div>
                    <div className="order-detail-value">{selectedOrder.productionPlan.notes}</div>
                  </div>
                )}
              </>
            )}

            {selectedOrder.allergens !== '无' && (
              <div className="alert alert-warning" style={{ marginTop: 16 }}>
                ⚠️ 过敏源警告：{selectedOrder.allergens}
              </div>
            )}

            {selectedOrder.decorationNote && (
              <div className="order-detail-row">
                <div className="order-detail-label">装饰偏好</div>
                <div className="order-detail-value">{selectedOrder.decorationNote}</div>
              </div>
            )}

            {selectedOrder.productPhoto && (
              <>
                <div style={{ fontWeight: 'bold', marginTop: 16, marginBottom: 8, color: '#5d4037' }}>
                  📸 成品照片
                </div>
                <img
                  src={selectedOrder.productPhoto.startsWith('/uploads')
                    ? `http://localhost:9203${selectedOrder.productPhoto}`
                    : selectedOrder.productPhoto}
                  alt="成品"
                  className="product-photo"
                />
                <div style={{ marginTop: 8, fontSize: 13, color: '#2e7d32' }}>
                  ✅ 已通知客户
                </div>
              </>
            )}

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>关闭</button>
              {selectedOrder.status === 2 && (
                <button className="btn btn-primary" onClick={() => openPhotoModal(selectedOrder)}>
                  📸 上传成品照片
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showPhotoModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowPhotoModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">上传成品照片</div>
              <button className="modal-close" onClick={() => setShowPhotoModal(false)}>×</button>
            </div>

            <div style={{ marginBottom: 12, fontSize: 14, color: '#5d4037' }}>
              订单：<strong>{selectedOrder.cakeName}</strong> ({selectedOrder.size})
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />

            {photoPreview ? (
              <div onClick={() => fileInputRef.current?.click()}>
                <img src={photoPreview} alt="预览" style={{ width: '100%', borderRadius: 12 }} />
                <div style={{ textAlign: 'center', marginTop: 8, color: '#8b7355', fontSize: 13 }}>
                  点击更换照片
                </div>
              </div>
            ) : (
              <div className="photo-upload-area" onClick={() => fileInputRef.current?.click()}>
                <div className="photo-upload-icon">📷</div>
                <div className="photo-upload-text">点击此处上传成品照片</div>
                <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>
                  上传后将自动通知客户
                </div>
              </div>
            )}

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPhotoModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={uploadPhoto} disabled={!photoPreview}>
                上传并通知客户
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
