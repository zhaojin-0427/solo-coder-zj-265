import { useState, useEffect } from 'react';
import { api } from '../api.js';

export default function DeliveryManagement() {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({
    driverName: '赵师傅',
    driverPhone: '130****1111',
    estimatedArrival: ''
  });
  const [updateForm, setUpdateForm] = useState({
    location: '',
    updateStatus: '配送中'
  });

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadOrders = async (keepSelected = true) => {
    try {
      const res = await api.getOrders();
      setOrders(res.data);
      if (keepSelected && selectedOrder) {
        const updated = res.data.find(o => o.id === selectedOrder.id);
        if (updated) {
          setSelectedOrder(updated);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getFilteredOrders = () => {
    switch (activeTab) {
      case 'pending':
        return orders.filter(o => o.status === 3 && o.pickupType === 'delivery');
      case 'delivering':
        return orders.filter(o => o.status === 4);
      case 'pickup':
        return orders.filter(o => o.status === 3 && o.pickupType === 'pickup');
      case 'completed':
        return orders.filter(o => o.status === 5);
      default:
        return [];
    }
  };

  const startDelivery = () => {
    if (!deliveryForm.estimatedArrival) {
      alert('请填写预计到达时间');
      return;
    }
    api.updateDeliveryStatus(selectedOrder.id, {
      status: 'started',
      ...deliveryForm
    }).then(res => {
      setShowStartModal(false);
      setSelectedOrder(res.data);
      loadOrders();
    }).catch(e => {
      console.error(e);
      alert('启动配送失败');
    });
  };

  const updateDelivery = () => {
    if (!updateForm.location) {
      alert('请填写当前位置');
      return;
    }
    api.updateDeliveryStatus(selectedOrder.id, {
      status: 'update',
      ...updateForm
    }).then(res => {
      setShowUpdateModal(false);
      setSelectedOrder(res.data);
      loadOrders();
    }).catch(e => {
      console.error(e);
      alert('更新失败');
    });
  };

  const completeDelivery = (orderId) => {
    if (!confirm('确认已送达？')) return;
    api.updateDeliveryStatus(orderId, { status: 'completed' })
      .then(res => {
        setSelectedOrder(res.data);
        loadOrders();
      })
      .catch(e => console.error(e));
  };

  const completePickup = (orderId) => {
    if (!confirm('确认客户已取货？')) return;
    api.completeOrder(orderId)
      .then(res => {
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(res.data);
        }
        loadOrders();
      })
      .catch(e => console.error(e));
  };

  const tabs = [
    { key: 'pending', label: '待配送', count: orders.filter(o => o.status === 3 && o.pickupType === 'delivery').length },
    { key: 'delivering', label: '配送中', count: orders.filter(o => o.status === 4).length },
    { key: 'pickup', label: '待自提', count: orders.filter(o => o.status >= 3 && o.pickupType === 'pickup' && o.status < 5).length },
    { key: 'completed', label: '已完成', count: orders.filter(o => o.status === 5).length }
  ];

  return (
    <div>
      <h1 className="page-title">🚚 配送管理</h1>

      <div className="tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`tab ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.count > 0 && (
              <span style={{
                marginLeft: 6,
                background: activeTab === tab.key ? '#d4a574' : '#e0d4c3',
                color: activeTab === tab.key ? 'white' : '#8b7355',
                borderRadius: 10,
                padding: '1px 8px',
                fontSize: 12
              }}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'delivering' && (
        <div style={{ marginBottom: 20 }}>
          {getFilteredOrders().map(order => (
            <div key={order.id} className="card" onClick={() => setSelectedOrder(order)} style={{ cursor: 'pointer' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: '#5d4037' }}>
                    {order.cakeName} ({order.size})
                  </div>
                  <div style={{ color: '#8b7355', marginBottom: 6 }}>
                    👤 {order.customerName} · {order.phone}
                  </div>
                  <div style={{ color: '#8b7355', marginBottom: 6 }}>
                    📍 {order.address}
                  </div>
                  <div style={{ color: '#8b7355', marginBottom: 6 }}>
                    🚚 {order.deliveryStatus?.driverName} · {order.deliveryStatus?.driverPhone}
                  </div>
                  <div style={{ color: '#8b7355' }}>
                    📍 当前位置：<strong style={{ color: '#d4a574' }}>{order.deliveryStatus?.currentLocation}</strong>
                    {order.estimatedArrival && (
                      <span style={{ marginLeft: 16 }}>⏰ 预计 {order.estimatedArrival.slice(11)} 到达</span>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`status-badge status-${order.status}`} style={{ marginBottom: 10, display: 'inline-block' }}>
                    {order.statusLabel}
                  </span>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-sm btn-secondary" onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); setShowUpdateModal(true); }}>
                      更新位置
                    </button>
                    <button className="btn btn-sm btn-success" onClick={(e) => { e.stopPropagation(); completeDelivery(order.id); }}>
                      确认送达
                    </button>
                  </div>
                </div>
              </div>

              {order.deliveryStatus?.updates && order.deliveryStatus.updates.length > 0 && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #f0e6d8' }}>
                  <div style={{ fontWeight: 500, marginBottom: 12, color: '#5d4037' }}>配送轨迹</div>
                  <div className="delivery-timeline">
                    {[...order.deliveryStatus.updates].reverse().map((update, idx) => (
                      <div key={idx} className="timeline-item">
                        <div className="timeline-dot"></div>
                        <div className="timeline-content">
                          <div className="timeline-status">{update.status}</div>
                          <div className="timeline-location">📍 {update.location}</div>
                          <div className="timeline-time">{update.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab !== 'delivering' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="table">
            <thead>
              <tr>
                <th>订单号</th>
                <th>蛋糕</th>
                <th>客户</th>
                {activeTab !== 'pickup' && <th>地址</th>}
                <th>配送/取货时间</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredOrders().map(order => (
                <tr key={order.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{order.id}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{order.cakeName}</div>
                    <div style={{ fontSize: 12, color: '#8b7355' }}>{order.size}</div>
                  </td>
                  <td>
                    <div>{order.customerName}</div>
                    <div style={{ fontSize: 12, color: '#8b7355' }}>{order.phone}</div>
                  </td>
                  {activeTab !== 'pickup' && <td style={{ fontSize: 13 }}>{order.address}</td>}
                  <td>{order.deliveryTime}</td>
                  <td>
                    <span className={`status-badge status-${order.status}`}>
                      {order.statusLabel}
                    </span>
                  </td>
                  <td>
                    <div className="actions-bar">
                      <button className="btn btn-sm btn-secondary" onClick={() => setSelectedOrder(order)}>
                        详情
                      </button>
                      {activeTab === 'pending' && (
                        <button className="btn btn-sm btn-primary" onClick={() => { setSelectedOrder(order); setShowStartModal(true); }}>
                          开始配送
                        </button>
                      )}
                      {activeTab === 'pickup' && order.status < 5 && (
                        <button className="btn btn-sm btn-success" onClick={() => completePickup(order.id)}>
                          确认取货
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {getFilteredOrders().length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">📭</div>
              <div className="empty-state-text">暂无数据</div>
            </div>
          )}
        </div>
      )}

      {selectedOrder && !showStartModal && !showUpdateModal && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">配送详情</div>
              <button className="modal-close" onClick={() => setSelectedOrder(null)}>×</button>
            </div>

            <div className="order-detail-row">
              <div className="order-detail-label">订单号</div>
              <div className="order-detail-value" style={{ fontFamily: 'monospace' }}>{selectedOrder.id}</div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">蛋糕</div>
              <div className="order-detail-value">{selectedOrder.cakeName} ({selectedOrder.size})</div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">客户</div>
              <div className="order-detail-value">{selectedOrder.customerName} / {selectedOrder.phone}</div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">方式</div>
              <div className="order-detail-value">
                <span className={`badge ${selectedOrder.pickupType === 'delivery' ? 'badge-delivery' : 'badge-pickup'}`}>
                  {selectedOrder.pickupTypeLabel}
                </span>
              </div>
            </div>
            {selectedOrder.pickupType === 'delivery' && (
              <div className="order-detail-row">
                <div className="order-detail-label">配送地址</div>
                <div className="order-detail-value">{selectedOrder.address}</div>
              </div>
            )}
            <div className="order-detail-row">
              <div className="order-detail-label">预约时间</div>
              <div className="order-detail-value">{selectedOrder.deliveryTime}</div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">状态</div>
              <div className="order-detail-value">
                <span className={`status-badge status-${selectedOrder.status}`}>
                  {selectedOrder.statusLabel}
                </span>
              </div>
            </div>

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
              </>
            )}

            {selectedOrder.deliveryStatus?.updates && selectedOrder.deliveryStatus.updates.length > 0 && (
              <>
                <div style={{ fontWeight: 'bold', marginTop: 16, marginBottom: 12, color: '#5d4037' }}>
                  🚚 配送轨迹
                </div>
                <div className="delivery-timeline">
                  {[...selectedOrder.deliveryStatus.updates].reverse().map((update, idx) => (
                    <div key={idx} className="timeline-item">
                      <div className="timeline-dot"></div>
                      <div className="timeline-content">
                        <div className="timeline-status">{update.status}</div>
                        <div className="timeline-location">📍 {update.location}</div>
                        <div className="timeline-time">{update.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {selectedOrder.actualDeliveryTime && (
              <div className="order-detail-row" style={{ marginTop: 12 }}>
                <div className="order-detail-label">实际送达</div>
                <div className="order-detail-value" style={{ color: '#2e7d32', fontWeight: 500 }}>
                  ✅ {selectedOrder.actualDeliveryTime}
                </div>
              </div>
            )}

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>关闭</button>
              {selectedOrder.status === 3 && selectedOrder.pickupType === 'delivery' && (
                <button className="btn btn-primary" onClick={() => setShowStartModal(true)}>
                  开始配送
                </button>
              )}
              {selectedOrder.status === 4 && (
                <button className="btn btn-success" onClick={() => completeDelivery(selectedOrder.id)}>
                  确认送达
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showStartModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowStartModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">启动配送</div>
              <button className="modal-close" onClick={() => setShowStartModal(false)}>×</button>
            </div>

            <div className="alert alert-warning">
              订单：{selectedOrder.cakeName} ({selectedOrder.size}) · 配送至：{selectedOrder.address}
            </div>

            <div className="form-group">
              <label className="label">配送员</label>
              <select
                className="select"
                value={deliveryForm.driverName}
                onChange={e => setDeliveryForm({ ...deliveryForm, driverName: e.target.value })}
              >
                <option value="赵师傅">赵师傅</option>
                <option value="钱师傅">钱师傅</option>
                <option value="孙师傅">孙师傅</option>
              </select>
            </div>

            <div className="form-group">
              <label className="label">配送员电话</label>
              <input
                className="input"
                value={deliveryForm.driverPhone}
                onChange={e => setDeliveryForm({ ...deliveryForm, driverPhone: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="label">预计到达时间 *</label>
              <input
                type="datetime-local"
                className="input"
                value={deliveryForm.estimatedArrival}
                onChange={e => setDeliveryForm({ ...deliveryForm, estimatedArrival: e.target.value })}
              />
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowStartModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={startDelivery}>
                确认开始配送
              </button>
            </div>
          </div>
        </div>
      )}

      {showUpdateModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowUpdateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">更新配送状态</div>
              <button className="modal-close" onClick={() => setShowUpdateModal(false)}>×</button>
            </div>

            <div className="form-group">
              <label className="label">当前位置</label>
              <input
                className="input"
                placeholder="例如：东四北大街、王府井路口等"
                value={updateForm.location}
                onChange={e => setUpdateForm({ ...updateForm, location: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="label">状态描述</label>
              <select
                className="select"
                value={updateForm.updateStatus}
                onChange={e => setUpdateForm({ ...updateForm, updateStatus: e.target.value })}
              >
                <option value="配送中">配送中</option>
                <option value="即将到达">即将到达</option>
                <option value="已到达">已到达</option>
              </select>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowUpdateModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={updateDelivery}>更新位置</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
