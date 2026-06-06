import { useState, useEffect } from 'react';
import { api } from '../api.js';

export default function OrderSchedule() {
  const [orders, setOrders] = useState([]);
  const [orderStatuses, setOrderStatuses] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPickup, setFilterPickup] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planForm, setPlanForm] = useState({
    scheduledDate: '',
    startTime: '',
    endTime: '',
    baker: '王师傅',
    notes: ''
  });

  useEffect(() => {
    loadOrders();
    loadOrderStatuses();
  }, [filterStatus, filterPickup, filterDate]);

  const loadOrders = async () => {
    try {
      const res = await api.getOrders({
        status: filterStatus,
        pickupType: filterPickup,
        date: filterDate
      });
      setOrders(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const loadOrderStatuses = async () => {
    try {
      const res = await api.getOrderStatuses();
      setOrderStatuses(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmOrder = async (orderId) => {
    try {
      await api.updateOrderStatus(orderId, 1);
      loadOrders();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm('确定要取消这个订单吗？')) return;
    try {
      await api.updateOrderStatus(orderId, 6);
      loadOrders();
    } catch (e) {
      console.error(e);
    }
  };

  const openPlanModal = (order) => {
    setSelectedOrder(order);
    if (order.productionPlan) {
      setPlanForm(order.productionPlan);
    } else {
      setPlanForm({
        scheduledDate: order.deliveryTime ? order.deliveryTime.slice(0, 10) : '',
        startTime: '08:00',
        endTime: '10:00',
        baker: '王师傅',
        notes: ''
      });
    }
    setShowPlanModal(true);
  };

  const savePlan = async () => {
    if (!planForm.scheduledDate || !planForm.startTime || !planForm.endTime) {
      alert('请填写完整排期信息');
      return;
    }
    try {
      await api.updateProductionPlan(selectedOrder.id, planForm);
      setShowPlanModal(false);
      loadOrders();
    } catch (e) {
      console.error(e);
      alert('保存失败');
    }
  };

  const pendingCount = orders.filter(o => o.status === 0).length;
  const scheduledCount = orders.filter(o => o.status === 1).length;
  const producingCount = orders.filter(o => o.status === 2).length;
  const completedCount = orders.filter(o => o.status === 5).length;

  return (
    <div>
      <h1 className="page-title">📋 订单排期</h1>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-value">{pendingCount}</div>
          <div className="stat-label">待确认</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-value">{scheduledCount}</div>
          <div className="stat-label">已排期</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👨‍🍳</div>
          <div className="stat-value">{producingCount}</div>
          <div className="stat-label">生产中</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value success">{completedCount}</div>
          <div className="stat-label">已完成</div>
        </div>
      </div>

      <div className="filter-bar">
        <select
          className="select"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
          style={{ maxWidth: 180 }}
        >
          <option value="all">全部状态</option>
          {orderStatuses.map((s, i) => (
            <option key={i} value={i}>{s}</option>
          ))}
        </select>
        <select
          className="select"
          value={filterPickup}
          onChange={e => setFilterPickup(e.target.value)}
          style={{ maxWidth: 160 }}
        >
          <option value="all">全部方式</option>
          <option value="delivery">配送</option>
          <option value="pickup">自提</option>
        </select>
        <input
          type="date"
          className="input"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          style={{ maxWidth: 180 }}
        />
        <button className="btn btn-secondary" onClick={() => {
          setFilterStatus('all');
          setFilterPickup('all');
          setFilterDate('');
        }}>
          重置筛选
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>订单号</th>
              <th>蛋糕</th>
              <th>客户</th>
              <th>取货方式</th>
              <th>配送/取货时间</th>
              <th>金额</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {orders.map(order => (
              <tr key={order.id}>
                <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{order.id}</td>
                <td>
                  <div style={{ fontWeight: 500 }}>{order.cakeName}</div>
                  <div style={{ fontSize: 12, color: '#8b7355' }}>
                    {order.size} × {order.quantity}
                  </div>
                </td>
                <td>
                  <div>{order.customerName}</div>
                  <div style={{ fontSize: 12, color: '#8b7355' }}>{order.phone}</div>
                </td>
                <td>
                  <span className={`badge ${order.pickupType === 'delivery' ? 'badge-delivery' : 'badge-pickup'}`}>
                    {order.pickupTypeLabel}
                  </span>
                </td>
                <td>{order.deliveryTime}</td>
                <td style={{ fontWeight: 'bold', color: '#d32f2f' }}>¥{order.totalPrice}</td>
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
                    {order.status === 0 && (
                      <>
                        <button className="btn btn-sm btn-success" onClick={() => handleConfirmOrder(order.id)}>
                          确认
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleCancelOrder(order.id)}>
                          取消
                        </button>
                      </>
                    )}
                    {order.status <= 2 && (
                      <button className="btn btn-sm btn-primary" onClick={() => openPlanModal(order)}>
                        排期
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-text">暂无订单数据</div>
          </div>
        )}
      </div>

      {selectedOrder && !showPlanModal && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">订单详情 - {selectedOrder.id}</div>
              <button className="modal-close" onClick={() => setSelectedOrder(null)}>×</button>
            </div>

            <div className="order-detail-row">
              <div className="order-detail-label">蛋糕</div>
              <div className="order-detail-value">
                <strong>{selectedOrder.cakeName}</strong> ({selectedOrder.size} × {selectedOrder.quantity})
              </div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">客户信息</div>
              <div className="order-detail-value">
                {selectedOrder.customerName} / {selectedOrder.phone}
              </div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">取货方式</div>
              <div className="order-detail-value">{selectedOrder.pickupTypeLabel}</div>
            </div>
            {selectedOrder.pickupType === 'delivery' && (
              <div className="order-detail-row">
                <div className="order-detail-label">配送地址</div>
                <div className="order-detail-value">{selectedOrder.address}</div>
              </div>
            )}
            <div className="order-detail-row">
              <div className="order-detail-label">取货时间</div>
              <div className="order-detail-value">{selectedOrder.deliveryTime}</div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">下单时间</div>
              <div className="order-detail-value">{selectedOrder.orderTime}</div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">过敏源</div>
              <div className="order-detail-value">{selectedOrder.allergens}</div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">装饰偏好</div>
              <div className="order-detail-value">{selectedOrder.decorationNote || '无'}</div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">订单金额</div>
              <div className="order-detail-value" style={{ color: '#d32f2f', fontWeight: 'bold', fontSize: 18 }}>
                ¥{selectedOrder.totalPrice}
              </div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">订单状态</div>
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
                  <div className="order-detail-label">排期日期</div>
                  <div className="order-detail-value">{selectedOrder.productionPlan.scheduledDate}</div>
                </div>
                <div className="order-detail-row">
                  <div className="order-detail-label">时间段</div>
                  <div className="order-detail-value">
                    {selectedOrder.productionPlan.startTime} - {selectedOrder.productionPlan.endTime}
                  </div>
                </div>
                <div className="order-detail-row">
                  <div className="order-detail-label">负责师傅</div>
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

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {showPlanModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowPlanModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">制定生产计划 - {selectedOrder.cakeName}</div>
              <button className="modal-close" onClick={() => setShowPlanModal(false)}>×</button>
            </div>

            <div className="row">
              <div className="col">
                <div className="form-group">
                  <label className="label">生产日期</label>
                  <input
                    type="date"
                    className="input"
                    value={planForm.scheduledDate}
                    onChange={e => setPlanForm({ ...planForm, scheduledDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col">
                <div className="form-group">
                  <label className="label">开始时间</label>
                  <input
                    type="time"
                    className="input"
                    value={planForm.startTime}
                    onChange={e => setPlanForm({ ...planForm, startTime: e.target.value })}
                  />
                </div>
              </div>
              <div className="col">
                <div className="form-group">
                  <label className="label">结束时间</label>
                  <input
                    type="time"
                    className="input"
                    value={planForm.endTime}
                    onChange={e => setPlanForm({ ...planForm, endTime: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="label">负责师傅</label>
              <select
                className="select"
                value={planForm.baker}
                onChange={e => setPlanForm({ ...planForm, baker: e.target.value })}
              >
                <option value="王师傅">王师傅</option>
                <option value="李师傅">李师傅</option>
                <option value="张师傅">张师傅</option>
              </select>
            </div>

            <div className="form-group">
              <label className="label">备注</label>
              <textarea
                className="textarea"
                placeholder="生产注意事项等"
                value={planForm.notes}
                onChange={e => setPlanForm({ ...planForm, notes: e.target.value })}
              />
            </div>

            <div className="alert alert-warning">
              ⚠️ 客户备注：{selectedOrder.allergens ? `过敏源: ${selectedOrder.allergens}` : '无特殊过敏源'}
              {selectedOrder.decorationNote && ` | 装饰: ${selectedOrder.decorationNote}`}
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPlanModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={savePlan}>保存排期</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
