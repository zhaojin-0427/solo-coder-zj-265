import { useState, useEffect } from 'react';
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
                  <button className="btn btn-primary btn-lg" onClick={submitOrder}>
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
