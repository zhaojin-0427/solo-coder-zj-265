import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../api.js';

export default function CakeCatalog() {
  const [cakes, setCakes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedCake, setSelectedCake] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [orderForm, setOrderForm] = useState({
    customerName: '',
    phone: '',
    size: '',
    quantity: 1,
    pickupType: 'delivery',
    address: '',
    deliveryTime: '',
    allergens: '',
    decorationNote: ''
  });
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [bookingCheckResult, setBookingCheckResult] = useState(null);
  const [isCheckingBooking, setIsCheckingBooking] = useState(false);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    loadCakes();
    loadCategories();
  }, [category, search]);

  const loadCakes = async () => {
    try {
      const res = await api.getCakes({ category, search });
      setCakes(res.data);
    } catch (e) {
      console.error('加载蛋糕列表失败', e);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await api.getCategories();
      setCategories(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOrder = (cake) => {
    setSelectedCake(cake);
    setOrderForm(prev => ({ ...prev, size: cake.sizes[0] }));
    setShowOrderModal(true);
    setOrderSuccess(false);
    setBookingCheckResult(null);
    setIsCheckingBooking(false);
  };

  const performBookingCheck = useCallback(async () => {
    if (!selectedCake || !orderForm.deliveryTime || !orderForm.size || orderForm.quantity < 1) {
      setBookingCheckResult(null);
      return;
    }

    setIsCheckingBooking(true);
    try {
      const res = await api.checkBooking({
        cakeId: selectedCake.id,
        size: orderForm.size,
        quantity: orderForm.quantity,
        pickupType: orderForm.pickupType,
        deliveryTime: orderForm.deliveryTime
      });
      setBookingCheckResult(res.data);
    } catch (e) {
      console.error('预约校验失败', e);
      setBookingCheckResult(null);
    } finally {
      setIsCheckingBooking(false);
    }
  }, [selectedCake, orderForm.deliveryTime, orderForm.size, orderForm.quantity, orderForm.pickupType]);

  const debouncedCheckBooking = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      performBookingCheck();
    }, 500);
  }, [performBookingCheck]);

  useEffect(() => {
    if (showOrderModal && selectedCake) {
      debouncedCheckBooking();
    }
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [orderForm.deliveryTime, orderForm.quantity, orderForm.size, showOrderModal, selectedCake, debouncedCheckBooking]);

  const handleSlotClick = (slot) => {
    const dateStr = slot.date;
    const currentTime = orderForm.deliveryTime ? orderForm.deliveryTime.split('T')[1] : '10:00';
    setOrderForm(prev => ({
      ...prev,
      deliveryTime: `${dateStr}T${currentTime || '10:00'}`
    }));
  };

  const handleSimilarCakeClick = (similarCake) => {
    const cake = cakes.find(c => c.id === similarCake.cakeId);
    if (cake) {
      setSelectedCake(cake);
      setOrderForm(prev => ({
        ...prev,
        size: cake.sizes[0] || '',
        deliveryTime: similarCake.suggestedDate
          ? `${similarCake.suggestedDate}T${prev.deliveryTime ? prev.deliveryTime.split('T')[1] : '10:00'}`
          : prev.deliveryTime
      }));
    }
  };

  const submitOrder = async () => {
    if (!orderForm.customerName || !orderForm.phone || !orderForm.deliveryTime) {
      alert('请填写必填信息');
      return;
    }
    if (orderForm.pickupType === 'delivery' && !orderForm.address) {
      alert('请填写配送地址');
      return;
    }
    if (bookingCheckResult && bookingCheckResult.errors && bookingCheckResult.errors.length > 0) {
      alert('请先解决订单校验中的错误问题');
      return;
    }

    try {
      await api.createOrder({
        cakeId: selectedCake.id,
        ...orderForm
      });
      setOrderSuccess(true);
      setTimeout(() => {
        setShowOrderModal(false);
        setOrderSuccess(false);
        setOrderForm({
          customerName: '',
          phone: '',
          size: '',
          quantity: 1,
          pickupType: 'delivery',
          address: '',
          deliveryTime: '',
          allergens: '',
          decorationNote: ''
        });
        setBookingCheckResult(null);
      }, 2000);
    } catch (e) {
      alert('提交订单失败，请重试');
      console.error(e);
    }
  };

  const renderSweetness = (level) => {
    return (
      <div className="cake-sweetness">
        {[1, 2, 3, 4, 5].map(i => (
          <span key={i} className={`sweetness-star ${i <= level ? '' : 'inactive'}`}>★</span>
        ))}
      </div>
    );
  };

  const getUtilizationLevel = (utilization) => {
    if (utilization < 60) return 'low';
    if (utilization < 85) return 'medium';
    return 'high';
  };

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
      return `${date.getMonth() + 1}月${date.getDate()}日 ${weekdays[date.getDay()]}`;
    } catch {
      return dateStr;
    }
  };

  const renderBookingInfoBar = () => {
    const baseHours = selectedCake?.baseProductionHours ?? 2;
    const advanceHours = selectedCake?.advanceBookingHours ?? 24;
    const allergens = selectedCake?.commonAllergens || [];

    return (
      <div className="booking-info-bar">
        <div className="booking-info-grid">
          <div className="booking-info-item">
            <span className="booking-info-label">⏱️ 基础制作耗时</span>
            <span className="booking-info-value">{baseHours} 小时</span>
          </div>
          <div className="booking-info-item">
            <span className="booking-info-label">📅 提前预订时间</span>
            <span className="booking-info-value">{advanceHours} 小时前</span>
          </div>
          <div className="booking-info-item">
            <span className="booking-info-label">⚠️ 常见过敏源</span>
            {allergens.length > 0 ? (
              <div className="allergen-tags">
                {allergens.map((a, idx) => (
                  <span key={idx} className="allergen-tag">{a}</span>
                ))}
              </div>
            ) : (
              <span className="booking-info-value" style={{ fontSize: 13 }}>无</span>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderCapacityInfo = () => {
    if (!bookingCheckResult || !bookingCheckResult.dailyUsage) return null;
    const { dailyUsage } = bookingCheckResult;
    const level = getUtilizationLevel(dailyUsage.utilization);

    return (
      <div className="capacity-bar-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#5d4037', fontWeight: 500 }}>
          <span>📊 {formatDate(dailyUsage.date)} 产能利用率</span>
          {dailyUsage.festival && (
            <span style={{ color: '#d32f2f', fontSize: 12 }}>🎊 {dailyUsage.festival.name}</span>
          )}
        </div>
        <div className="capacity-bar">
          <div
            className={`capacity-bar-fill ${level}`}
            style={{ width: `${Math.min(dailyUsage.utilization, 100)}%` }}
          />
        </div>
        <div className="capacity-info">
          <span>工时: {dailyUsage.usedHours}/{dailyUsage.capacityHours}h</span>
          <span>订单: {dailyUsage.totalOrders}/{dailyUsage.capacityOrders}</span>
          <span style={{ fontWeight: 600 }}>{dailyUsage.utilization.toFixed(1)}%</span>
        </div>
      </div>
    );
  };

  const renderValidationMessages = () => {
    if (isCheckingBooking) {
      return (
        <div className="alert alert-info">
          <span className="checking-spinner"></span>
          正在校验订单信息...
        </div>
      );
    }

    if (!bookingCheckResult) return null;

    return (
      <>
        {bookingCheckResult.errors && bookingCheckResult.errors.length > 0 && (
          <div className="alert alert-danger">
            <div style={{ fontWeight: 600, marginBottom: 6 }}>❌ 无法预订：</div>
            <ul style={{ marginLeft: 20 }}>
              {bookingCheckResult.errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}
        {bookingCheckResult.warnings && bookingCheckResult.warnings.length > 0 && (
          <div className="alert alert-warning">
            <div style={{ fontWeight: 600, marginBottom: 6 }}>⚠️ 温馨提示：</div>
            <ul style={{ marginLeft: 20 }}>
              {bookingCheckResult.warnings.map((warn, idx) => (
                <li key={idx}>{warn}</li>
              ))}
            </ul>
          </div>
        )}
      </>
    );
  };

  const renderAlternativeSlots = () => {
    if (!bookingCheckResult || !bookingCheckResult.alternativeSlots || bookingCheckResult.alternativeSlots.length === 0) {
      return null;
    }
    if (!(bookingCheckResult.errors && bookingCheckResult.errors.length > 0)) {
      return null;
    }

    return (
      <div className="suggestions-section">
        <div className="suggestions-title">💡 推荐可选时段</div>
        <div className="slot-cards">
          {bookingCheckResult.alternativeSlots.map((slot, idx) => {
            const level = getUtilizationLevel(slot.utilization);
            return (
              <div
                key={idx}
                className="slot-card"
                onClick={() => handleSlotClick(slot)}
              >
                <div className="slot-card-date">{formatDate(slot.date)}</div>
                <div className="slot-card-info">剩余工时: {slot.hoursLeft}h</div>
                <div className="slot-card-info">剩余订单: {slot.ordersLeft}个</div>
                <div className={`slot-card-utilization status-${level === 'low' ? '3' : level === 'medium' ? '2' : '6'}`}>
                  利用率: {slot.utilization.toFixed(1)}%
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSimilarCakes = () => {
    if (!bookingCheckResult || !bookingCheckResult.similarCakes || bookingCheckResult.similarCakes.length === 0) {
      return null;
    }

    return (
      <div className="suggestions-section">
        <div className="suggestions-title">🍰 同类相近款式推荐</div>
        <div className="cake-cards">
          {bookingCheckResult.similarCakes.map((cake, idx) => (
            <div
              key={idx}
              className="similar-cake-card"
              onClick={() => handleSimilarCakeClick(cake)}
            >
              <img
                src={cake.image}
                alt={cake.cakeName}
                className="similar-cake-image"
              />
              <div className="similar-cake-info">
                <div className="similar-cake-name">{cake.cakeName}</div>
                <div className="similar-cake-price">¥{cake.price}</div>
                {cake.suggestedDate && (
                  <div className="similar-cake-date">推荐: {formatDate(cake.suggestedDate)}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const canSubmit = () => {
    if (!bookingCheckResult) return false;
    if (bookingCheckResult.errors && bookingCheckResult.errors.length > 0) return false;
    return true;
  };

  return (
    <div>
      <h1 className="page-title">🎂 蛋糕图册</h1>

      <div className="filter-bar">
        <input
          className="input"
          placeholder="搜索蛋糕..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <select
          className="select"
          value={category}
          onChange={e => setCategory(e.target.value)}
          style={{ maxWidth: 200 }}
        >
          <option value="all">全部类别</option>
          {categories.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <span style={{ color: '#8b7355', fontSize: 14 }}>
          共 {cakes.length} 款蛋糕
        </span>
      </div>

      <div className="cake-grid">
        {cakes.map(cake => (
          <div key={cake.id} className="cake-card" onClick={() => setSelectedCake(cake)}>
            <img src={cake.image} alt={cake.name} className="cake-image" />
            <div className="cake-info">
              <div className="cake-name">{cake.name}</div>
              <div className="cake-desc">{cake.description}</div>
              <div className="cake-meta">
                <span className="cake-price">¥{cake.price}</span>
                {renderSweetness(cake.sweetness)}
              </div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', marginTop: 12 }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOrder(cake);
                }}
              >
                立即预订
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedCake && !showOrderModal && (
        <div className="modal-overlay" onClick={() => setSelectedCake(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">蛋糕详情</div>
              <button className="modal-close" onClick={() => setSelectedCake(null)}>×</button>
            </div>

            <div className="cake-detail">
              <img src={selectedCake.image} alt={selectedCake.name} className="cake-detail-image" />
              <div>
                <div className="detail-section">
                  <div className="detail-label">蛋糕名称</div>
                  <div className="detail-value" style={{ fontSize: 22, fontWeight: 'bold' }}>
                    {selectedCake.name}
                  </div>
                </div>
                <div className="detail-section">
                  <div className="detail-label">价格</div>
                  <div className="detail-value" style={{ color: '#d32f2f', fontSize: 24, fontWeight: 'bold' }}>
                    ¥{selectedCake.price}
                  </div>
                </div>
                <div className="detail-section">
                  <div className="detail-label">分类</div>
                  <div className="detail-value">{selectedCake.category}</div>
                </div>
                <div className="detail-section">
                  <div className="detail-label">甜度</div>
                  <div className="detail-value">
                    {renderSweetness(selectedCake.sweetness)}
                    <span style={{ marginLeft: 8, fontSize: 14 }}>{selectedCake.sweetnessLabel}</span>
                  </div>
                </div>
                <div className="detail-section">
                  <div className="detail-label">保存期限</div>
                  <div className="detail-value">{selectedCake.shelfLife}</div>
                </div>
                <div className="detail-section">
                  <div className="detail-label">可选尺寸</div>
                  <div className="detail-value">
                    <div className="size-options">
                      {selectedCake.sizes.map(s => (
                        <span key={s} className="size-option selected" style={{ cursor: 'default' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-label">食材成分</div>
              <div className="ingredient-tags">
                {selectedCake.ingredients.map(ing => (
                  <span key={ing} className="ingredient-tag">{ing}</span>
                ))}
              </div>
            </div>

            <div className="detail-section">
              <div className="detail-label">蛋糕描述</div>
              <div className="detail-value">{selectedCake.description}</div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedCake(null)}>
                关闭
              </button>
              <button className="btn btn-primary btn-lg" onClick={() => handleOrder(selectedCake)}>
                立即预订
              </button>
            </div>
          </div>
        </div>
      )}

      {showOrderModal && selectedCake && (
        <div className="modal-overlay" onClick={() => !orderSuccess && setShowOrderModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">预订蛋糕 - {selectedCake.name}</div>
              <button className="modal-close" onClick={() => !orderSuccess && setShowOrderModal(false)}>×</button>
            </div>

            {orderSuccess ? (
              <div className="empty-state">
                <div className="empty-state-icon">🎉</div>
                <div className="empty-state-text" style={{ fontSize: 18, color: '#2e7d32' }}>
                  预订成功！我们会尽快与您联系确认订单
                </div>
              </div>
            ) : (
              <>
                {renderBookingInfoBar()}

                {renderValidationMessages()}

                {renderCapacityInfo()}

                {renderAlternativeSlots()}

                {renderSimilarCakes()}

                <div className="form-group">
                  <label className="label">您的姓名 *</label>
                  <input
                    className="input"
                    placeholder="请输入您的姓名"
                    value={orderForm.customerName}
                    onChange={e => setOrderForm({ ...orderForm, customerName: e.target.value })}
                  />
                </div>

                <div className="row">
                  <div className="col">
                    <div className="form-group">
                      <label className="label">联系电话 *</label>
                      <input
                        className="input"
                        placeholder="请输入手机号码"
                        value={orderForm.phone}
                        onChange={e => setOrderForm({ ...orderForm, phone: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="col">
                    <div className="form-group">
                      <label className="label">取货/配送时间 *</label>
                      <input
                        type="datetime-local"
                        className="input"
                        value={orderForm.deliveryTime}
                        onChange={e => setOrderForm({ ...orderForm, deliveryTime: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="label">取货方式</label>
                  <div className="radio-group">
                    <label className={`radio-option ${orderForm.pickupType === 'delivery' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="pickupType"
                        value="delivery"
                        checked={orderForm.pickupType === 'delivery'}
                        onChange={e => setOrderForm({ ...orderForm, pickupType: e.target.value })}
                      />
                      <div className="radio-option-label">🚚 配送到家</div>
                    </label>
                    <label className={`radio-option ${orderForm.pickupType === 'pickup' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="pickupType"
                        value="pickup"
                        checked={orderForm.pickupType === 'pickup'}
                        onChange={e => setOrderForm({ ...orderForm, pickupType: e.target.value })}
                      />
                      <div className="radio-option-label">🏪 到店自提</div>
                    </label>
                  </div>
                </div>

                {orderForm.pickupType === 'delivery' && (
                  <div className="form-group">
                    <label className="label">配送地址 *</label>
                    <input
                      className="input"
                      placeholder="请输入详细配送地址"
                      value={orderForm.address}
                      onChange={e => setOrderForm({ ...orderForm, address: e.target.value })}
                    />
                  </div>
                )}

                <div className="row">
                  <div className="col">
                    <div className="form-group">
                      <label className="label">选择尺寸</label>
                      <div className="size-options">
                        {selectedCake.sizes.map(s => (
                          <span
                            key={s}
                            className={`size-option ${orderForm.size === s ? 'selected' : ''}`}
                            onClick={() => setOrderForm({ ...orderForm, size: s })}
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="col">
                    <div className="form-group">
                      <label className="label">数量</label>
                      <input
                        type="number"
                        min="1"
                        className="input"
                        value={orderForm.quantity}
                        onChange={e => setOrderForm({ ...orderForm, quantity: parseInt(e.target.value) || 1 })}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="label">过敏源备注</label>
                  <input
                    className="input"
                    placeholder="如：花生、坚果、乳糖不耐受等"
                    value={orderForm.allergens}
                    onChange={e => setOrderForm({ ...orderForm, allergens: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="label">装饰偏好</label>
                  <textarea
                    className="textarea"
                    placeholder="请描述您的装饰需求，如：写什么祝福语、颜色偏好、主题风格等"
                    value={orderForm.decorationNote}
                    onChange={e => setOrderForm({ ...orderForm, decorationNote: e.target.value })}
                  />
                </div>

                <div className="price-total">
                  <div className="price-total-label">订单总额</div>
                  <div className="price-total-value">
                    ¥{selectedCake.price * orderForm.quantity}
                  </div>
                </div>

                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setShowOrderModal(false)}>
                    取消
                  </button>
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={submitOrder}
                    disabled={!canSubmit()}
                  >
                    确认预订
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
