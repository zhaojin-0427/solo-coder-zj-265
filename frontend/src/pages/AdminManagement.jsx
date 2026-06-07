import { useState, useEffect } from 'react';
import { api } from '../api.js';

export default function AdminManagement() {
  const [activeTab, setActiveTab] = useState('festivals');
  const [festivals, setFestivals] = useState([]);
  const [capacity, setCapacity] = useState(null);
  const [cakes, setCakes] = useState([]);
  const [showFestivalModal, setShowFestivalModal] = useState(false);
  const [editingFestival, setEditingFestival] = useState(null);
  const [festivalForm, setFestivalForm] = useState({
    name: '', startDate: '', endDate: '', description: '',
    capacityMultiplier: 1, specialCakes: [], isActive: true
  });
  const [showCakeModal, setShowCakeModal] = useState(false);
  const [editingCake, setEditingCake] = useState(null);
  const [cakeForm, setCakeForm] = useState({
    baseProductionHours: 2, advanceBookingHours: 24, commonAllergens: ''
  });

  useEffect(() => {
    if (activeTab === 'festivals') loadFestivals();
    if (activeTab === 'capacity') loadCapacity();
    if (activeTab === 'cakes') loadCakes();
  }, [activeTab]);

  const loadFestivals = async () => {
    try {
      const res = await api.getFestivals();
      setFestivals(res.data);
    } catch (e) { console.error(e); }
  };

  const loadCapacity = async () => {
    try {
      const res = await api.getCapacity();
      setCapacity(res.data);
    } catch (e) { console.error(e); }
  };

  const loadCakes = async () => {
    try {
      const res = await api.getCakes({});
      setCakes(res.data);
    } catch (e) { console.error(e); }
  };

  const openAddFestival = () => {
    setEditingFestival(null);
    setFestivalForm({ name: '', startDate: '', endDate: '', description: '', capacityMultiplier: 1, specialCakes: [], isActive: true });
    setShowFestivalModal(true);
  };

  const openEditFestival = (f) => {
    setEditingFestival(f);
    setFestivalForm({ ...f, specialCakes: [...(f.specialCakes || [])] });
    setShowFestivalModal(true);
  };

  const saveFestival = async () => {
    if (!festivalForm.name || !festivalForm.startDate || !festivalForm.endDate) {
      alert('请填写完整信息');
      return;
    }
    try {
      if (editingFestival) {
        await api.updateFestival(editingFestival.id, festivalForm);
      } else {
        await api.createFestival(festivalForm);
      }
      setShowFestivalModal(false);
      loadFestivals();
    } catch (e) {
      console.error(e);
      alert('保存失败');
    }
  };

  const handleDeleteFestival = async (f) => {
    if (!confirm(`确定要删除档期「${f.name}」吗？`)) return;
    try {
      await api.deleteFestival(f.id);
      loadFestivals();
    } catch (e) { console.error(e); }
  };

  const toggleSpecialCake = (cakeId) => {
    const exists = festivalForm.specialCakes.includes(cakeId);
    setFestivalForm({
      ...festivalForm,
      specialCakes: exists
        ? festivalForm.specialCakes.filter(id => id !== cakeId)
        : [...festivalForm.specialCakes, cakeId]
    });
  };

  const saveCapacity = async () => {
    try {
      await api.updateCapacity(capacity);
      alert('产能设置已保存');
      loadCapacity();
    } catch (e) {
      console.error(e);
      alert('保存失败');
    }
  };

  const openEditCake = (cake) => {
    setEditingCake(cake);
    setCakeForm({
      baseProductionHours: cake.baseProductionHours || 2,
      advanceBookingHours: cake.advanceBookingHours || 24,
      commonAllergens: (cake.commonAllergens || []).join(', ')
    });
    setShowCakeModal(true);
  };

  const saveCakeProduction = async () => {
    try {
      await api.updateCakeProduction(editingCake.id, {
        baseProductionHours: parseInt(cakeForm.baseProductionHours),
        advanceBookingHours: parseInt(cakeForm.advanceBookingHours),
        commonAllergens: cakeForm.commonAllergens.split(',').map(s => s.trim()).filter(Boolean)
      });
      setShowCakeModal(false);
      loadCakes();
    } catch (e) {
      console.error(e);
      alert('保存失败');
    }
  };

  return (
    <div>
      <h1 className="page-title">⚙️ 产能与档期管理</h1>

      <div className="tabs">
        <button className={`tab ${activeTab === 'festivals' ? 'active' : ''}`} onClick={() => setActiveTab('festivals')}>
          🎉 节日档期
        </button>
        <button className={`tab ${activeTab === 'capacity' ? 'active' : ''}`} onClick={() => setActiveTab('capacity')}>
          📊 产能设置
        </button>
        <button className={`tab ${activeTab === 'cakes' ? 'active' : ''}`} onClick={() => setActiveTab('cakes')}>
          🍰 款式配置
        </button>
      </div>

      {activeTab === 'festivals' && (
        <div>
          <div className="filter-bar" style={{ justifyContent: 'space-between' }}>
            <span style={{ color: '#8b7355', fontSize: 14 }}>共 {festivals.length} 个节日档期</span>
            <button className="btn btn-primary" onClick={openAddFestival}>+ 新增档期</button>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>档期名称</th>
                  <th>活动时间</th>
                  <th>产能倍率</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {festivals.map(f => (
                  <tr key={f.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{f.name}</div>
                      <div style={{ fontSize: 12, color: '#8b7355' }}>{f.description}</div>
                    </td>
                    <td>{f.startDate} ~ {f.endDate}</td>
                    <td>
                      <span style={{ color: f.capacityMultiplier > 1 ? '#d32f2f' : '#5d4037', fontWeight: 500 }}>
                        ×{f.capacityMultiplier}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${f.isActive ? 'status-1' : 'status-5'}`}>
                        {f.isActive ? '启用中' : '已停用'}
                      </span>
                    </td>
                    <td>
                      <div className="actions-bar">
                        <button className="btn btn-sm btn-secondary" onClick={() => openEditFestival(f)}>编辑</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDeleteFestival(f)}>删除</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {festivals.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <div className="empty-state-text">暂无节日档期</div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'capacity' && capacity && (
        <div className="card">
          <div className="chart-title">基础产能设置</div>
          <div className="row">
            <div className="col">
              <div className="form-group">
                <label className="label">每日标准工时（小时）</label>
                <input
                  type="number"
                  className="input"
                  min="1"
                  max="24"
                  value={capacity.defaultDailyHours}
                  onChange={e => setCapacity({ ...capacity, defaultDailyHours: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div className="col">
              <div className="form-group">
                <label className="label">每日最大订单数</label>
                <input
                  type="number"
                  className="input"
                  min="1"
                  value={capacity.defaultDailyOrders}
                  onChange={e => setCapacity({ ...capacity, defaultDailyOrders: parseInt(e.target.value) })}
                />
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col">
              <div className="form-group">
                <label className="label">工作开始时间</label>
                <input
                  type="time"
                  className="input"
                  value={capacity.workStart}
                  onChange={e => setCapacity({ ...capacity, workStart: e.target.value })}
                />
              </div>
            </div>
            <div className="col">
              <div className="form-group">
                <label className="label">工作结束时间</label>
                <input
                  type="time"
                  className="input"
                  value={capacity.workEnd}
                  onChange={e => setCapacity({ ...capacity, workEnd: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="chart-title" style={{ marginTop: 24 }}>尺寸耗时倍率</div>
          <div className="row">
            {Object.entries(capacity.sizeProductionTime || {}).map(([size, hours]) => (
              <div className="col" key={size} style={{ flex: '0 0 200px' }}>
                <div className="form-group">
                  <label className="label">{size}（额外耗时：小时）</label>
                  <input
                    type="number"
                    className="input"
                    min="0"
                    value={hours}
                    onChange={e => {
                      const sp = { ...capacity.sizeProductionTime, [size]: parseInt(e.target.value) };
                      setCapacity({ ...capacity, sizeProductionTime: sp });
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="modal-footer">
            <button className="btn btn-primary" onClick={saveCapacity}>保存设置</button>
          </div>
        </div>
      )}

      {activeTab === 'cakes' && (
        <div>
          <div className="filter-bar" style={{ justifyContent: 'space-between' }}>
            <span style={{ color: '#8b7355', fontSize: 14 }}>共 {cakes.length} 款蛋糕</span>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>蛋糕</th>
                  <th>分类</th>
                  <th>基础制作耗时</th>
                  <th>提前预订时间</th>
                  <th>常见过敏源</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {cakes.map(cake => (
                  <tr key={cake.id}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{cake.name}</div>
                      <div style={{ fontSize: 12, color: '#8b7355' }}>¥{cake.price}</div>
                    </td>
                    <td>{cake.category}</td>
                    <td>{cake.baseProductionHours || 2} 小时</td>
                    <td>{cake.advanceBookingHours || 24} 小时</td>
                    <td>
                      {(cake.commonAllergens || []).length > 0
                        ? (cake.commonAllergens || []).join('、')
                        : <span style={{ color: '#aaa' }}>未设置</span>
                      }
                    </td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => openEditCake(cake)}>配置</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showFestivalModal && (
        <div className="modal-overlay" onClick={() => setShowFestivalModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editingFestival ? '编辑档期' : '新增节日档期'}</div>
              <button className="modal-close" onClick={() => setShowFestivalModal(false)}>×</button>
            </div>

            <div className="form-group">
              <label className="label">档期名称 *</label>
              <input
                className="input"
                placeholder="如：情人节特惠"
                value={festivalForm.name}
                onChange={e => setFestivalForm({ ...festivalForm, name: e.target.value })}
              />
            </div>

            <div className="row">
              <div className="col">
                <div className="form-group">
                  <label className="label">开始日期 *</label>
                  <input
                    type="date"
                    className="input"
                    value={festivalForm.startDate}
                    onChange={e => setFestivalForm({ ...festivalForm, startDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="col">
                <div className="form-group">
                  <label className="label">结束日期 *</label>
                  <input
                    type="date"
                    className="input"
                    value={festivalForm.endDate}
                    onChange={e => setFestivalForm({ ...festivalForm, endDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="label">档期描述</label>
              <input
                className="input"
                placeholder="档期介绍"
                value={festivalForm.description}
                onChange={e => setFestivalForm({ ...festivalForm, description: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="label">产能倍率（节日期间产能倍率，例如 1.5 表示提升50%）</label>
              <input
                type="number"
                step="0.1"
                min="0.5"
                max="3"
                className="input"
                value={festivalForm.capacityMultiplier}
                onChange={e => setFestivalForm({ ...festivalForm, capacityMultiplier: parseFloat(e.target.value) })}
              />
            </div>

            <div className="form-group">
              <label className="label">主推款式（可多选）</label>
              <div className="ingredient-tags">
                {cakes.map(c => (
                  <span
                    key={c.id}
                    className={`ingredient-tag ${festivalForm.specialCakes.includes(c.id) ? 'selected-tag' : ''}`}
                    onClick={() => toggleSpecialCake(c.id)}
                    style={{ cursor: 'pointer', border: '1px solid ' + (festivalForm.specialCakes.includes(c.id) ? '#d4a574' : '#e0d4c3'), background: festivalForm.specialCakes.includes(c.id) ? '#fdf5ea' : '#f5efe6' }}
                  >
                    {c.name}
                  </span>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="radio-option-label" style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={festivalForm.isActive}
                  onChange={e => setFestivalForm({ ...festivalForm, isActive: e.target.checked })}
                />
                启用该档期
              </label>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowFestivalModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={saveFestival}>保存</button>
            </div>
          </div>
        </div>
      )}

      {showCakeModal && editingCake && (
        <div className="modal-overlay" onClick={() => setShowCakeModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">配置款式生产 - {editingCake.name}</div>
              <button className="modal-close" onClick={() => setShowCakeModal(false)}>×</button>
            </div>

            <div className="form-group">
              <label className="label">基础制作耗时（小时）</label>
              <input
                type="number"
                min="0.5"
                step="0.5"
                className="input"
                value={cakeForm.baseProductionHours}
                onChange={e => setCakeForm({ ...cakeForm, baseProductionHours: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="label">提前预订时间（小时，例：24 表示至少提前 24 小时预订）</label>
              <input
                type="number"
                min="0"
                className="input"
                value={cakeForm.advanceBookingHours}
                onChange={e => setCakeForm({ ...cakeForm, advanceBookingHours: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="label">常见过敏源（逗号分隔，如：乳制品,鸡蛋,小麦）</label>
              <input
                className="input"
                value={cakeForm.commonAllergens}
                onChange={e => setCakeForm({ ...cakeForm, commonAllergens: e.target.value })}
              />
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCakeModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={saveCakeProduction}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
