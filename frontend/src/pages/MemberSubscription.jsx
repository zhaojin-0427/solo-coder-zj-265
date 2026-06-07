import { useState, useEffect } from 'react';
import { api } from '../api.js';

const MEMBER_STATUS_MAP = {
  active: { label: '正常', status: 3 },
  inactive: { label: '停用', status: 5 },
  suspended: { label: '冻结', status: 6 }
};

const SUBSCRIPTION_STATUS_MAP = {
  active: { label: '进行中', status: 3 },
  paused: { label: '已暂停', status: 2 },
  expired: { label: '已过期', status: 5 },
  cancelled: { label: '已取消', status: 6 }
};

const FULFILLMENT_STATUS_MAP = {
  pending: { label: '待履约', status: 2 },
  in_progress: { label: '制作中', status: 1 },
  delivered: { label: '已送达', status: 3 },
  skipped: { label: '已跳过', status: 5 },
  cancelled: { label: '已取消', status: 6 }
};

const PLAN_TYPES = [
  { value: 'monthly', label: '月度订阅' },
  { value: 'quarterly', label: '季度订阅' },
  { value: 'yearly', label: '年度订阅' }
];

const FREQUENCIES = [
  { value: 'weekly', label: '每周一次' },
  { value: 'biweekly', label: '每两周一次' },
  { value: 'monthly', label: '每月一次' }
];

const CAKE_SIZES = ['4寸', '6寸', '8寸', '10寸', '12寸'];
const SWEETNESS_LEVELS = [1, 2, 3, 4, 5];

export default function MemberSubscription() {
  const [activeTab, setActiveTab] = useState('members');

  const [members, setMembers] = useState([]);
  const [memberTiers, setMemberTiers] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [fulfillments, setFulfillments] = useState([]);
  const [cakes, setCakes] = useState([]);

  const [memberSearch, setMemberSearch] = useState('');
  const [subSearch, setSubSearch] = useState('');
  const [fulfillSearch, setFulfillSearch] = useState('');

  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [memberForm, setMemberForm] = useState({
    name: '',
    phone: '',
    tierId: '',
    totalSpent: 0,
    points: 0,
    status: 'active'
  });

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [subscriptionForm, setSubscriptionForm] = useState({
    memberId: '',
    planType: 'monthly',
    frequency: 'weekly',
    preferredCakes: [],
    allergens: '',
    sweetness: 3,
    address: '',
    deliveryTimePreference: '',
    startDate: '',
    endDate: ''
  });

  const [showPauseModal, setShowPauseModal] = useState(false);
  const [pauseData, setPauseData] = useState({ subscriptionId: '', reason: '' });

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressData, setAddressData] = useState({ subscriptionId: '', address: '' });

  const [showSkipModal, setShowSkipModal] = useState(false);
  const [skipData, setSkipData] = useState({ subscriptionId: '', period: 1 });

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateData, setGenerateData] = useState({ subscriptionId: '', periods: 1 });

  useEffect(() => {
    loadMemberTiers();
    loadCakes();
  }, []);

  useEffect(() => {
    if (activeTab === 'members') loadMembers();
    if (activeTab === 'subscriptions') loadSubscriptions();
    if (activeTab === 'fulfillments') loadFulfillments();
  }, [activeTab]);

  const loadMembers = async () => {
    try {
      const res = await api.getMembers({ search: memberSearch });
      setMembers(res.data || []);
    } catch (e) {
      console.error('加载会员列表失败', e);
    }
  };

  const loadMemberTiers = async () => {
    try {
      const res = await api.getMemberTiers();
      setMemberTiers(res.data || []);
    } catch (e) {
      console.error('加载会员等级失败', e);
    }
  };

  const loadSubscriptions = async () => {
    try {
      const res = await api.getSubscriptions({ search: subSearch });
      setSubscriptions(res.data || []);
    } catch (e) {
      console.error('加载订阅列表失败', e);
    }
  };

  const loadFulfillments = async () => {
    try {
      const res = await api.getSubscriptionFulfillments({ search: fulfillSearch });
      setFulfillments(res.data || []);
    } catch (e) {
      console.error('加载履约记录失败', e);
    }
  };

  const loadCakes = async () => {
    try {
      const res = await api.getCakes({});
      setCakes(res.data || []);
    } catch (e) {
      console.error('加载蛋糕列表失败', e);
    }
  };

  const openCreateMember = () => {
    setEditingMember(null);
    setMemberForm({
      name: '',
      phone: '',
      tierId: memberTiers[0]?.id || '',
      totalSpent: 0,
      points: 0,
      status: 'active'
    });
    setShowMemberModal(true);
  };

  const openEditMember = (member) => {
    setEditingMember(member);
    setMemberForm({
      name: member.name || '',
      phone: member.phone || '',
      tierId: member.tierId || memberTiers[0]?.id || '',
      totalSpent: member.totalSpent || 0,
      points: member.points || 0,
      status: member.status || 'active'
    });
    setShowMemberModal(true);
  };

  const submitMember = async () => {
    if (!memberForm.name || !memberForm.phone) {
      alert('请填写会员姓名和手机号');
      return;
    }
    try {
      if (editingMember) {
        await api.updateMember(editingMember.id, memberForm);
      } else {
        await api.createMember(memberForm);
      }
      setShowMemberModal(false);
      loadMembers();
    } catch (e) {
      alert('保存会员信息失败');
      console.error(e);
    }
  };

  const openCreateSubscription = () => {
    setSubscriptionForm({
      memberId: members[0]?.id || '',
      planType: 'monthly',
      frequency: 'weekly',
      preferredCakes: [],
      allergens: '',
      sweetness: 3,
      address: '',
      deliveryTimePreference: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: ''
    });
    setShowSubscriptionModal(true);
  };

  const togglePreferredCake = (cakeId) => {
    setSubscriptionForm(prev => {
      const existing = prev.preferredCakes.find(c => c.cakeId === cakeId);
      if (existing) {
        return {
          ...prev,
          preferredCakes: prev.preferredCakes.filter(c => c.cakeId !== cakeId)
        };
      } else {
        return {
          ...prev,
          preferredCakes: [...prev.preferredCakes, { cakeId, size: CAKE_SIZES[1] }]
        };
      }
    });
  };

  const updateCakeSize = (cakeId, size) => {
    setSubscriptionForm(prev => ({
      ...prev,
      preferredCakes: prev.preferredCakes.map(c =>
        c.cakeId === cakeId ? { ...c, size } : c
      )
    }));
  };

  const submitSubscription = async () => {
    if (!subscriptionForm.memberId) {
      alert('请选择会员');
      return;
    }
    if (!subscriptionForm.startDate) {
      alert('请选择开始日期');
      return;
    }
    if (subscriptionForm.preferredCakes.length === 0) {
      alert('请至少选择一款偏好蛋糕');
      return;
    }
    try {
      await api.createSubscription(subscriptionForm);
      setShowSubscriptionModal(false);
      loadSubscriptions();
    } catch (e) {
      alert('创建订阅失败');
      console.error(e);
    }
  };

  const handlePause = (subscriptionId) => {
    setPauseData({ subscriptionId, reason: '' });
    setShowPauseModal(true);
  };

  const submitPause = async () => {
    try {
      await api.pauseSubscription(pauseData.subscriptionId, pauseData.reason);
      setShowPauseModal(false);
      loadSubscriptions();
    } catch (e) {
      alert('暂停订阅失败');
      console.error(e);
    }
  };

  const handleResume = async (subscriptionId) => {
    try {
      await api.resumeSubscription(subscriptionId);
      loadSubscriptions();
    } catch (e) {
      alert('恢复订阅失败');
      console.error(e);
    }
  };

  const handleSkip = (subscription) => {
    setSkipData({ subscriptionId: subscription.id, period: 1 });
    setShowSkipModal(true);
  };

  const submitSkip = async () => {
    try {
      await api.skipSubscriptionPeriod(skipData.subscriptionId, skipData.period);
      setShowSkipModal(false);
      loadSubscriptions();
    } catch (e) {
      alert('跳过期数失败');
      console.error(e);
    }
  };

  const handleChangeAddress = (subscription) => {
    setAddressData({ subscriptionId: subscription.id, address: subscription.address || '' });
    setShowAddressModal(true);
  };

  const submitAddress = async () => {
    if (!addressData.address) {
      alert('请填写配送地址');
      return;
    }
    try {
      await api.changeSubscriptionAddress(addressData.subscriptionId, { address: addressData.address });
      setShowAddressModal(false);
      loadSubscriptions();
    } catch (e) {
      alert('修改地址失败');
      console.error(e);
    }
  };

  const handleGenerateOrders = (subscription) => {
    setGenerateData({ subscriptionId: subscription.id, periods: 1 });
    setShowGenerateModal(true);
  };

  const submitGenerateOrders = async () => {
    try {
      await api.generateSubscriptionOrders(generateData.subscriptionId, generateData.periods);
      setShowGenerateModal(false);
      loadSubscriptions();
    } catch (e) {
      alert('生成订单失败');
      console.error(e);
    }
  };

  const getMemberTierName = (tierId) => {
    const tier = memberTiers.find(t => t.id === tierId);
    return tier?.name || tier?.tierName || '-';
  };

  const getMemberName = (memberId) => {
    const member = members.find(m => m.id === memberId);
    return member?.name || '-';
  };

  const getCakeName = (cakeId) => {
    const cake = cakes.find(c => c.id === cakeId);
    return cake?.name || '-';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    try {
      const date = new Date(dateStr);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status, map) => {
    const info = map[status] || { label: status, status: 5 };
    return <span className={`status-badge status-${info.status}`}>{info.label}</span>;
  };

  const renderMembersTab = () => (
    <div>
      <div className="filter-bar">
        <input
          className="input"
          placeholder="搜索会员姓名/手机号..."
          value={memberSearch}
          onChange={e => setMemberSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <button className="btn btn-primary" onClick={openCreateMember}>
          + 新增会员
        </button>
        <span style={{ color: '#8b7355', fontSize: 14 }}>
          共 {members.length} 位会员
        </span>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>会员姓名</th>
              <th>手机号</th>
              <th>会员等级</th>
              <th style={{ textAlign: 'right' }}>累计消费</th>
              <th style={{ textAlign: 'right' }}>积分</th>
              <th>加入日期</th>
              <th>状态</th>
              <th style={{ width: 120 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="empty-state" style={{ padding: '40px 20px' }}>
                    <div className="empty-state-icon">👥</div>
                    <div className="empty-state-text">暂无会员数据</div>
                  </div>
                </td>
              </tr>
            ) : (
              members.map(member => (
                <tr key={member.id}>
                  <td style={{ fontWeight: 500 }}>{member.name}</td>
                  <td>{member.phone}</td>
                  <td>{getMemberTierName(member.tierId)}</td>
                  <td style={{ textAlign: 'right', color: '#d32f2f', fontWeight: 500 }}>
                    ¥{member.totalSpent?.toLocaleString() || 0}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: 500 }}>
                    {member.points?.toLocaleString() || 0}
                  </td>
                  <td>{formatDate(member.joinDate || member.createdAt)}</td>
                  <td>{getStatusBadge(member.status, MEMBER_STATUS_MAP)}</td>
                  <td>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => openEditMember(member)}
                    >
                      编辑
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderSubscriptionsTab = () => (
    <div>
      <div className="filter-bar">
        <input
          className="input"
          placeholder="搜索会员/订阅..."
          value={subSearch}
          onChange={e => setSubSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <button className="btn btn-primary" onClick={openCreateSubscription}>
          + 新建订阅
        </button>
        <span style={{ color: '#8b7355', fontSize: 14 }}>
          共 {subscriptions.length} 条订阅
        </span>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>会员</th>
              <th>订阅方案</th>
              <th>配送频率</th>
              <th>偏好蛋糕</th>
              <th>开始日期</th>
              <th>结束日期</th>
              <th style={{ textAlign: 'center' }}>期数</th>
              <th style={{ textAlign: 'right' }}>价格</th>
              <th>状态</th>
              <th style={{ width: 340 }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {subscriptions.length === 0 ? (
              <tr>
                <td colSpan={10}>
                  <div className="empty-state" style={{ padding: '40px 20px' }}>
                    <div className="empty-state-icon">📋</div>
                    <div className="empty-state-text">暂无订阅数据</div>
                  </div>
                </td>
              </tr>
            ) : (
              subscriptions.map(sub => (
                <tr key={sub.id}>
                  <td style={{ fontWeight: 500 }}>{getMemberName(sub.memberId)}</td>
                  <td>{PLAN_TYPES.find(p => p.value === sub.planType)?.label || sub.planType}</td>
                  <td>{FREQUENCIES.find(f => f.value === sub.frequency)?.label || sub.frequency}</td>
                  <td>
                    {sub.preferredCakes && sub.preferredCakes.length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {sub.preferredCakes.slice(0, 2).map((pc, idx) => (
                          <span key={idx} className="ingredient-tag">
                            {getCakeName(pc.cakeId)} {pc.size}
                          </span>
                        ))}
                        {sub.preferredCakes.length > 2 && (
                          <span className="ingredient-tag" style={{ background: '#f5efe6', color: '#8b7355' }}>
                            +{sub.preferredCakes.length - 2}
                          </span>
                        )}
                      </div>
                    ) : '-'}
                  </td>
                  <td>{formatDate(sub.startDate)}</td>
                  <td>{formatDate(sub.endDate)}</td>
                  <td style={{ textAlign: 'center', fontWeight: 500 }}>
                    {sub.completedPeriods || 0} / {sub.totalPeriods || '-'}
                  </td>
                  <td style={{ textAlign: 'right', color: '#d32f2f', fontWeight: 600 }}>
                    ¥{sub.price?.toLocaleString() || 0}
                  </td>
                  <td>{getStatusBadge(sub.status, SUBSCRIPTION_STATUS_MAP)}</td>
                  <td>
                    <div className="actions-bar">
                      {sub.status === 'active' && (
                        <>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handlePause(sub.id)}
                          >
                            暂停
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleSkip(sub)}
                          >
                            跳过
                          </button>
                        </>
                      )}
                      {sub.status === 'paused' && (
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleResume(sub.id)}
                        >
                          恢复
                        </button>
                      )}
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleChangeAddress(sub)}
                      >
                        改地址
                      </button>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleGenerateOrders(sub)}
                      >
                        生成订单
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderFulfillmentsTab = () => (
    <div>
      <div className="filter-bar">
        <input
          className="input"
          placeholder="搜索履约记录..."
          value={fulfillSearch}
          onChange={e => setFulfillSearch(e.target.value)}
          style={{ maxWidth: 280 }}
        />
        <button
          className="btn btn-secondary"
          onClick={loadFulfillments}
        >
          刷新
        </button>
        <span style={{ color: '#8b7355', fontSize: 14 }}>
          共 {fulfillments.length} 条记录
        </span>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>履约编号</th>
              <th>会员</th>
              <th>蛋糕</th>
              <th>尺寸</th>
              <th>计划日期</th>
              <th>实际日期</th>
              <th>配送地址</th>
              <th>状态</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            {fulfillments.length === 0 ? (
              <tr>
                <td colSpan={9}>
                  <div className="empty-state" style={{ padding: '40px 20px' }}>
                    <div className="empty-state-icon">📦</div>
                    <div className="empty-state-text">暂无履约记录</div>
                  </div>
                </td>
              </tr>
            ) : (
              fulfillments.map(ff => (
                <tr key={ff.id}>
                  <td style={{ fontFamily: 'monospace', color: '#8b7355' }}>
                    {ff.id?.slice(0, 8) || '-'}
                  </td>
                  <td style={{ fontWeight: 500 }}>{getMemberName(ff.memberId)}</td>
                  <td>{getCakeName(ff.cakeId)}</td>
                  <td>{ff.size || '-'}</td>
                  <td>{formatDate(ff.scheduledDate)}</td>
                  <td>{formatDate(ff.fulfilledDate)}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ff.address || '-'}
                  </td>
                  <td>{getStatusBadge(ff.status, FULFILLMENT_STATUS_MAP)}</td>
                  <td style={{ color: '#8b7355', fontSize: 13 }}>{ff.remark || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div>
      <h1 className="page-title">👥 会员与订阅管理</h1>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveTab('members')}
        >
          会员列表
        </button>
        <button
          className={`tab ${activeTab === 'subscriptions' ? 'active' : ''}`}
          onClick={() => setActiveTab('subscriptions')}
        >
          订阅管理
        </button>
        <button
          className={`tab ${activeTab === 'fulfillments' ? 'active' : ''}`}
          onClick={() => setActiveTab('fulfillments')}
        >
          履约记录
        </button>
      </div>

      {activeTab === 'members' && renderMembersTab()}
      {activeTab === 'subscriptions' && renderSubscriptionsTab()}
      {activeTab === 'fulfillments' && renderFulfillmentsTab()}

      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editingMember ? '编辑会员' : '新增会员'}</div>
              <button className="modal-close" onClick={() => setShowMemberModal(false)}>×</button>
            </div>

            <div className="form-group">
              <label className="label">会员姓名 *</label>
              <input
                className="input"
                placeholder="请输入会员姓名"
                value={memberForm.name}
                onChange={e => setMemberForm({ ...memberForm, name: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="label">手机号码 *</label>
              <input
                className="input"
                placeholder="请输入手机号码"
                value={memberForm.phone}
                onChange={e => setMemberForm({ ...memberForm, phone: e.target.value })}
              />
            </div>

            <div className="row">
              <div className="col">
                <div className="form-group">
                  <label className="label">会员等级</label>
                  <select
                    className="select"
                    value={memberForm.tierId}
                    onChange={e => setMemberForm({ ...memberForm, tierId: e.target.value })}
                  >
                    {memberTiers.map(tier => (
                      <option key={tier.id} value={tier.id}>
                        {tier.name || tier.tierName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col">
                <div className="form-group">
                  <label className="label">会员状态</label>
                  <select
                    className="select"
                    value={memberForm.status}
                    onChange={e => setMemberForm({ ...memberForm, status: e.target.value })}
                  >
                    <option value="active">正常</option>
                    <option value="inactive">停用</option>
                    <option value="suspended">冻结</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col">
                <div className="form-group">
                  <label className="label">累计消费 (元)</label>
                  <input
                    type="number"
                    min="0"
                    className="input"
                    value={memberForm.totalSpent}
                    onChange={e => setMemberForm({ ...memberForm, totalSpent: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="col">
                <div className="form-group">
                  <label className="label">积分</label>
                  <input
                    type="number"
                    min="0"
                    className="input"
                    value={memberForm.points}
                    onChange={e => setMemberForm({ ...memberForm, points: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowMemberModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={submitMember}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {showSubscriptionModal && (
        <div className="modal-overlay" onClick={() => setShowSubscriptionModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div className="modal-header">
              <div className="modal-title">新建订阅</div>
              <button className="modal-close" onClick={() => setShowSubscriptionModal(false)}>×</button>
            </div>

            <div className="row">
              <div className="col">
                <div className="form-group">
                  <label className="label">选择会员 *</label>
                  <select
                    className="select"
                    value={subscriptionForm.memberId}
                    onChange={e => setSubscriptionForm({ ...subscriptionForm, memberId: e.target.value })}
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name} - {m.phone}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col">
                <div className="form-group">
                  <label className="label">订阅方案 *</label>
                  <select
                    className="select"
                    value={subscriptionForm.planType}
                    onChange={e => setSubscriptionForm({ ...subscriptionForm, planType: e.target.value })}
                  >
                    {PLAN_TYPES.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="label">配送频率 *</label>
              <div className="radio-group">
                {FREQUENCIES.map(f => (
                  <label
                    key={f.value}
                    className={`radio-option ${subscriptionForm.frequency === f.value ? 'selected' : ''}`}
                  >
                    <input
                      type="radio"
                      name="frequency"
                      value={f.value}
                      checked={subscriptionForm.frequency === f.value}
                      onChange={e => setSubscriptionForm({ ...subscriptionForm, frequency: e.target.value })}
                    />
                    <div className="radio-option-label">{f.label}</div>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="label">偏好蛋糕 * (可多选，选择尺寸)</label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 10,
                marginTop: 8
              }}>
                {cakes.map(cake => {
                  const selected = subscriptionForm.preferredCakes.find(c => c.cakeId === cake.id);
                  return (
                    <div
                      key={cake.id}
                      style={{
                        border: selected ? '2px solid #d4a574' : '2px solid #e0d4c3',
                        borderRadius: 12,
                        padding: 12,
                        cursor: 'pointer',
                        background: selected ? '#fdf5ea' : 'white',
                        transition: 'all 0.2s'
                      }}
                      onClick={() => togglePreferredCake(cake.id)}
                    >
                      <div style={{ fontWeight: 500, color: '#5d4037', marginBottom: 6 }}>
                        {cake.name}
                      </div>
                      <div style={{ color: '#d32f2f', fontSize: 13, marginBottom: 8 }}>
                        ¥{cake.price}
                      </div>
                      {selected && (
                        <select
                          className="select"
                          style={{ padding: '6px 10px', fontSize: 12 }}
                          onClick={e => e.stopPropagation()}
                          value={selected.size}
                          onChange={e => updateCakeSize(cake.id, e.target.value)}
                        >
                          {CAKE_SIZES.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="row">
              <div className="col">
                <div className="form-group">
                  <label className="label">甜度偏好</label>
                  <div className="size-options">
                    {SWEETNESS_LEVELS.map(l => (
                      <span
                        key={l}
                        className={`size-option ${subscriptionForm.sweetness === l ? 'selected' : ''}`}
                        onClick={() => setSubscriptionForm({ ...subscriptionForm, sweetness: l })}
                      >
                        {l}★
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="col">
                <div className="form-group">
                  <label className="label">配送时间偏好</label>
                  <input
                    type="time"
                    className="input"
                    value={subscriptionForm.deliveryTimePreference}
                    onChange={e => setSubscriptionForm({ ...subscriptionForm, deliveryTimePreference: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="label">过敏源备注</label>
              <input
                className="input"
                placeholder="如：花生、坚果、乳糖不耐受等"
                value={subscriptionForm.allergens}
                onChange={e => setSubscriptionForm({ ...subscriptionForm, allergens: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="label">配送地址</label>
              <input
                className="input"
                placeholder="请输入详细配送地址"
                value={subscriptionForm.address}
                onChange={e => setSubscriptionForm({ ...subscriptionForm, address: e.target.value })}
              />
            </div>

            <div className="row">
              <div className="col">
                <div className="form-group">
                  <label className="label">开始日期 *</label>
                  <input
                    type="date"
                    className="input"
                    value={subscriptionForm.startDate}
                    onChange={e => setSubscriptionForm({ ...subscriptionForm, startDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="col">
                <div className="form-group">
                  <label className="label">结束日期</label>
                  <input
                    type="date"
                    className="input"
                    value={subscriptionForm.endDate}
                    onChange={e => setSubscriptionForm({ ...subscriptionForm, endDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSubscriptionModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={submitSubscription}>
                创建订阅
              </button>
            </div>
          </div>
        </div>
      )}

      {showPauseModal && (
        <div className="modal-overlay" onClick={() => setShowPauseModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <div className="modal-title">暂停订阅</div>
              <button className="modal-close" onClick={() => setShowPauseModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label className="label">暂停原因</label>
              <textarea
                className="textarea"
                placeholder="请输入暂停原因（可选）"
                value={pauseData.reason}
                onChange={e => setPauseData({ ...pauseData, reason: e.target.value })}
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPauseModal(false)}>
                取消
              </button>
              <button className="btn btn-danger" onClick={submitPause}>
                确认暂停
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddressModal && (
        <div className="modal-overlay" onClick={() => setShowAddressModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <div className="modal-title">修改配送地址</div>
              <button className="modal-close" onClick={() => setShowAddressModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label className="label">新的配送地址 *</label>
              <textarea
                className="textarea"
                placeholder="请输入详细配送地址"
                value={addressData.address}
                onChange={e => setAddressData({ ...addressData, address: e.target.value })}
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddressModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={submitAddress}>
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {showSkipModal && (
        <div className="modal-overlay" onClick={() => setShowSkipModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <div className="modal-title">跳过配送期</div>
              <button className="modal-close" onClick={() => setShowSkipModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label className="label">跳过第几期</label>
              <input
                type="number"
                min="1"
                className="input"
                value={skipData.period}
                onChange={e => setSkipData({ ...skipData, period: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSkipModal(false)}>
                取消
              </button>
              <button className="btn btn-danger" onClick={submitSkip}>
                确认跳过
              </button>
            </div>
          </div>
        </div>
      )}

      {showGenerateModal && (
        <div className="modal-overlay" onClick={() => setShowGenerateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <div className="modal-title">生成订阅订单</div>
              <button className="modal-close" onClick={() => setShowGenerateModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label className="label">生成未来几期的订单</label>
              <input
                type="number"
                min="1"
                className="input"
                value={generateData.periods}
                onChange={e => setGenerateData({ ...generateData, periods: parseInt(e.target.value) || 1 })}
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowGenerateModal(false)}>
                取消
              </button>
              <button className="btn btn-primary" onClick={submitGenerateOrders}>
                生成订单
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
