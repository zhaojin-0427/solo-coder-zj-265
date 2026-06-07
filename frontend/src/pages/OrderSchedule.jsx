import { useState, useEffect } from 'react';
import { api } from '../api.js';

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const estimateHours = (order) => {
  const sizeMap = { '4寸': 1.5, '6寸': 2, '8寸': 3, '10寸': 4, '12寸': 5, '14寸': 6 };
  const size = order.size || '6寸';
  const baseHours = sizeMap[size] || 2;
  const qty = order.quantity || 1;
  const hours = baseHours * qty;
  return Math.ceil(hours * 2) / 2;
};

const isUrgent = (deliveryTime) => {
  if (!deliveryTime) return false;
  const now = new Date();
  const delivery = new Date(deliveryTime);
  const diffHours = (delivery - now) / (1000 * 60 * 60);
  return diffHours > 0 && diffHours <= 24;
};

const formatDateLabel = (dateStr) => {
  const d = new Date(dateStr);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const weekday = WEEKDAYS[d.getDay()];
  return `${month}月${day}日 ${weekday}`;
};

const getRiskStyle = (utilization, oversold) => {
  if (oversold || utilization >= 100) {
    return {
      background: 'linear-gradient(135deg, #ffcdd2 0%, #ef9a9a 100%)',
      border: '1px solid #ef5350',
      badge: { bg: '#d32f2f', text: 'white', label: '超卖风险' }
    };
  }
  if (utilization >= 85) {
    return {
      background: 'linear-gradient(135deg, #ffe0b2 0%, #ffcc80 100%)',
      border: '1px solid #ffa726',
      badge: { bg: '#f57c00', text: 'white', label: '高风险' }
    };
  }
  return {
    background: 'linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%)',
    border: '1px solid #66bb6a',
    badge: { bg: '#388e3c', text: 'white', label: '正常' }
  };
};

export default function OrderSchedule() {
  const [orders, setOrders] = useState([]);
  const [orderStatuses, setOrderStatuses] = useState([]);
  const [overview, setOverview] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPickup, setFilterPickup] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [planForm, setPlanForm] = useState({
    scheduledDate: '',
    startTime: '',
    endTime: '',
    baker: '王师傅',
    notes: ''
  });
  const [rescheduleForm, setRescheduleForm] = useState({
    newTime: '',
    reason: ''
  });

  useEffect(() => {
    loadOrders();
    loadOrderStatuses();
    loadOverview();
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

  const loadOverview = async () => {
    try {
      const res = await api.getScheduleOverview({ days: 7 });
      setOverview(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleConfirmOrder = async (orderId) => {
    try {
      await api.updateOrderStatus(orderId, 1);
      loadOrders();
      loadOverview();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!confirm('确定要取消这个订单吗？')) return;
    try {
      await api.updateOrderStatus(orderId, 6);
      loadOrders();
      loadOverview();
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

  const openRescheduleModal = (order) => {
    setSelectedOrder(order);
    setRescheduleForm({
      newTime: order.deliveryTime || '',
      reason: ''
    });
    setShowRescheduleModal(true);
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
      loadOverview();
    } catch (e) {
      console.error(e);
      alert('保存失败');
    }
  };

  const saveReschedule = async () => {
    if (!rescheduleForm.newTime) {
      alert('请选择新的配送时间');
      return;
    }
    try {
      await api.rescheduleOrder({
        orderId: selectedOrder.id,
        newTime: rescheduleForm.newTime,
        reason: rescheduleForm.reason
      });
      setShowRescheduleModal(false);
      setSelectedOrder(null);
      loadOrders();
      loadOverview();
      alert('改期成功');
    } catch (e) {
      console.error(e);
      alert('改期失败');
    }
  };

  const handleDateCardClick = (dateStr) => {
    setFilterDate(dateStr);
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

      <div className="card">
        <div style={{ fontSize: 16, fontWeight: 'bold', color: '#5d4037', marginBottom: 16 }}>
          📊 未来7天产能概览
        </div>
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
          {overview.map(item => {
            const riskStyle = getRiskStyle(item.utilization, item.oversold);
            const isSelected = filterDate === item.date;
            return (
              <div
                key={item.date}
                onClick={() => handleDateCardClick(item.date)}
                style={{
                  ...riskStyle,
                  borderRadius: 12,
                  padding: 14,
                  minWidth: 170,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  outline: isSelected ? '3px solid #d4a574' : 'none',
                  outlineOffset: 2,
                  flexShrink: 0
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontWeight: 'bold', color: '#3d2e1f', fontSize: 14 }}>
                    {formatDateLabel(item.date)}
                  </div>
                  <span
                    style={{
                      background: riskStyle.badge.bg,
                      color: riskStyle.badge.text,
                      padding: '2px 8px',
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 600
                    }}
                  >
                    {riskStyle.badge.label}
                  </span>
                </div>

                {item.festival && (
                  <div style={{ marginBottom: 8 }}>
                    <span
                      style={{
                        background: '#fce4ec',
                        color: '#ad1457',
                        padding: '2px 8px',
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 500
                      }}
                    >
                      🎉 {item.festival}
                    </span>
                  </div>
                )}

                <div style={{ fontSize: 12, color: '#3d2e1f', marginBottom: 4 }}>
                  订单数：<strong>{item.totalOrders}</strong> / {item.capacityOrders}
                </div>
                <div style={{ fontSize: 12, color: '#3d2e1f', marginBottom: 4 }}>
                  工时：<strong>{item.usedHours}</strong> / {item.capacityHours}h
                </div>
                <div style={{ fontSize: 12, color: '#3d2e1f', marginBottom: 8 }}>
                  利用率：<strong>{item.utilization}%</strong>
                </div>

                {item.allergens && item.allergens.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {item.allergens.map((a, i) => (
                      <span
                        key={i}
                        style={{
                          background: '#ffebee',
                          color: '#c62828',
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 500
                        }}
                      >
                        ⚠️ {a.name}×{a.count}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
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
            {orders.map(order => {
              const hours = estimateHours(order);
              const urgent = isUrgent(order.deliveryTime);
              return (
                <tr key={order.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 13 }}>
                    {order.id}
                    {urgent && (
                      <span
                        style={{
                          display: 'inline-block',
                          marginLeft: 6,
                          background: '#ffebee',
                          color: '#c62828',
                          padding: '2px 6px',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600
                        }}
                      >
                        ⏰临期
                      </span>
                    )}
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{order.cakeName}</div>
                    <div style={{ fontSize: 12, color: '#8b7355', marginTop: 2 }}>
                      {order.size} × {order.quantity}
                      <span
                        style={{
                          display: 'inline-block',
                          marginLeft: 8,
                          background: '#f5efe6',
                          color: '#5d4037',
                          padding: '1px 6px',
                          borderRadius: 4,
                          fontSize: 11
                        }}
                      >
                        约{hours}小时
                      </span>
                    </div>
                    {order.allergens && (
                      <div style={{ marginTop: 4 }}>
                        <span
                          style={{
                            display: 'inline-block',
                            background: '#ffebee',
                            color: '#c62828',
                            padding: '2px 8px',
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600
                          }}
                        >
                          ⚠️ {order.allergens}
                        </span>
                      </div>
                    )}
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
                        <>
                          <button className="btn btn-sm btn-primary" onClick={() => openPlanModal(order)}>
                            排期
                          </button>
                          <button className="btn btn-sm btn-secondary" onClick={() => openRescheduleModal(order)}>
                            改期
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {orders.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-text">暂无订单数据</div>
          </div>
        )}
      </div>

      {selectedOrder && !showPlanModal && !showRescheduleModal && (
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
                <span
                  style={{
                    display: 'inline-block',
                    marginLeft: 8,
                    background: '#f5efe6',
                    color: '#5d4037',
                    padding: '2px 8px',
                    borderRadius: 6,
                    fontSize: 12
                  }}
                >
                  预计制作约{estimateHours(selectedOrder)}小时
                </span>
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
              <div className="order-detail-value">
                {selectedOrder.deliveryTime}
                {isUrgent(selectedOrder.deliveryTime) && (
                  <span
                    style={{
                      display: 'inline-block',
                      marginLeft: 8,
                      background: '#ffebee',
                      color: '#c62828',
                      padding: '2px 8px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600
                    }}
                  >
                    ⏰ 临期（24小时内）
                  </span>
                )}
              </div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">下单时间</div>
              <div className="order-detail-value">{selectedOrder.orderTime}</div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">过敏源</div>
              <div className="order-detail-value">
                {selectedOrder.allergens ? (
                  <span
                    style={{
                      background: '#ffebee',
                      color: '#c62828',
                      padding: '4px 10px',
                      borderRadius: 6,
                      fontWeight: 500
                    }}
                  >
                    ⚠️ {selectedOrder.allergens}
                  </span>
                ) : '无'}
              </div>
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
              {selectedOrder.status <= 2 && (
                <button className="btn btn-secondary" onClick={() => openRescheduleModal(selectedOrder)}>
                  🔄 改期
                </button>
              )}
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

      {showRescheduleModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowRescheduleModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">订单改期 - {selectedOrder.id}</div>
              <button className="modal-close" onClick={() => setShowRescheduleModal(false)}>×</button>
            </div>

            <div className="alert alert-warning">
              <div style={{ fontWeight: 500, marginBottom: 4 }}>原配送时间</div>
              <div style={{ fontSize: 16, fontWeight: 'bold' }}>{selectedOrder.deliveryTime}</div>
            </div>

            <div className="form-group">
              <label className="label">新配送时间 *</label>
              <input
                type="datetime-local"
                className="input"
                value={rescheduleForm.newTime}
                onChange={e => setRescheduleForm({ ...rescheduleForm, newTime: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="label">改期原因</label>
              <textarea
                className="textarea"
                placeholder="请填写改期原因（选填）"
                value={rescheduleForm.reason}
                onChange={e => setRescheduleForm({ ...rescheduleForm, reason: e.target.value })}
              />
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowRescheduleModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={saveReschedule}>确认改期</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
