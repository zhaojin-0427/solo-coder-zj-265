import { useState, useEffect } from 'react';
import { api } from '../api.js';

const CONTRACT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

const CONTRACT_STATUS_LABEL = {
  pending: '待审批',
  approved: '已通过',
  rejected: '已驳回'
};

const DELIVERY_STATUS = {
  PENDING: 'pending',
  ON_THE_WAY: 'on_the_way',
  DELIVERED: 'delivered'
};

const DELIVERY_STATUS_LABEL = {
  pending: '待配送',
  on_the_way: '配送中',
  delivered: '已送达'
};

function getContractStatusBadge(status) {
  const styles = {
    pending: { background: '#fff3e0', color: '#e65100' },
    approved: { background: '#e8f5e9', color: '#2e7d32' },
    rejected: { background: '#ffebee', color: '#c62828' }
  };
  const style = styles[status] || styles.pending;
  return (
    <span className="status-badge" style={style}>
      {CONTRACT_STATUS_LABEL[status] || status}
    </span>
  );
}

function getDeliveryStatusBadge(status) {
  const styles = {
    pending: { background: '#fff3e0', color: '#e65100' },
    on_the_way: { background: '#e3f2fd', color: '#1565c0' },
    delivered: { background: '#e8f5e9', color: '#2e7d32' }
  };
  const style = styles[status] || styles.pending;
  return (
    <span className="status-badge" style={style}>
      {DELIVERY_STATUS_LABEL[status] || status}
    </span>
  );
}

function formatCurrency(amount) {
  if (amount === null || amount === undefined) return '-';
  return `¥${Number(amount).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function EnterpriseGroupPurchase() {
  const [activeTab, setActiveTab] = useState('contracts');
  const [contracts, setContracts] = useState([]);
  const [groupOrders, setGroupOrders] = useState([]);
  const [cakes, setCakes] = useState([]);
  const [selectedContract, setSelectedContract] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showCreateContractModal, setShowCreateContractModal] = useState(false);
  const [showCreateOrderModal, setShowCreateOrderModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showContractDetailModal, setShowContractDetailModal] = useState(false);

  const [contractForm, setContractForm] = useState({
    companyName: '',
    contactPerson: '',
    contactPhone: '',
    contactEmail: '',
    contractNumber: '',
    totalBudget: '',
    invoiceTitle: '',
    invoiceTaxNo: '',
    invoiceAddress: '',
    invoicePhone: '',
    invoiceBankName: '',
    invoiceBankAccount: '',
    departments: [{ name: '', headcount: '', contact: '', phone: '' }],
    startDate: '',
    endDate: ''
  });

  const [orderForm, setOrderForm] = useState({
    contractId: '',
    departmentName: '',
    cakeId: '',
    size: '',
    unitPrice: '',
    recipients: [{ name: '', phone: '', address: '' }],
    batchNumber: '',
    deliveryBatch: '',
    totalBatches: '',
    deliveryTime: ''
  });

  const [deliveryForm, setDeliveryForm] = useState({
    status: DELIVERY_STATUS.ON_THE_WAY
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeTab === 'contracts') {
      loadContracts();
    } else if (activeTab === 'orders' || activeTab === 'batches') {
      loadGroupOrders();
    }
  }, [activeTab]);

  const loadData = async () => {
    loadContracts();
    loadGroupOrders();
    loadCakes();
  };

  const loadContracts = async () => {
    api.getEnterpriseContracts()
      .then(res => setContracts(res.data || []))
      .catch(e => console.error(e));
  };

  const loadGroupOrders = async () => {
    api.getGroupPurchaseOrders()
      .then(res => setGroupOrders(res.data || []))
      .catch(e => console.error(e));
  };

  const loadCakes = async () => {
    api.getCakes()
      .then(res => setCakes(res.data || []))
      .catch(e => console.error(e));
  };

  const handleCreateContract = async () => {
    if (!contractForm.companyName) {
      alert('请填写公司名称');
      return;
    }
    if (!contractForm.contactPerson) {
      alert('请填写联系人');
      return;
    }
    if (!contractForm.contractNumber) {
      alert('请填写合同编号');
      return;
    }
    if (!contractForm.totalBudget) {
      alert('请填写总预算');
      return;
    }
    if (!contractForm.startDate || !contractForm.endDate) {
      alert('请填写合同起止日期');
      return;
    }
    try {
      const data = {
        ...contractForm,
        totalBudget: Number(contractForm.totalBudget),
        departments: contractForm.departments.map(d => ({
          ...d,
          headcount: d.headcount ? Number(d.headcount) : 0
        }))
      };
      await api.createEnterpriseContract(data);
      setShowCreateContractModal(false);
      resetContractForm();
      loadContracts();
    } catch (e) {
      console.error(e);
      alert('创建合同失败');
    }
  };

  const resetContractForm = () => {
    setContractForm({
      companyName: '',
      contactPerson: '',
      contactPhone: '',
      contactEmail: '',
      contractNumber: '',
      totalBudget: '',
      invoiceTitle: '',
      invoiceTaxNo: '',
      invoiceAddress: '',
      invoicePhone: '',
      invoiceBankName: '',
      invoiceBankAccount: '',
      departments: [{ name: '', headcount: '', contact: '', phone: '' }],
      startDate: '',
      endDate: ''
    });
  };

  const handleAddDepartment = () => {
    setContractForm({
      ...contractForm,
      departments: [...contractForm.departments, { name: '', headcount: '', contact: '', phone: '' }]
    });
  };

  const handleRemoveDepartment = (idx) => {
    const deps = [...contractForm.departments];
    deps.splice(idx, 1);
    setContractForm({ ...contractForm, departments: deps });
  };

  const handleDepartmentChange = (idx, field, value) => {
    const deps = [...contractForm.departments];
    deps[idx][field] = value;
    setContractForm({ ...contractForm, departments: deps });
  };

  const handleViewContractDetail = async (contractId) => {
    try {
      const res = await api.getEnterpriseContract(contractId);
      setSelectedContract(res.data);
      setShowContractDetailModal(true);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateOrder = async () => {
    if (!orderForm.contractId) {
      alert('请选择合同');
      return;
    }
    if (!orderForm.departmentName) {
      alert('请选择部门');
      return;
    }
    if (!orderForm.cakeId) {
      alert('请选择蛋糕');
      return;
    }
    if (!orderForm.size) {
      alert('请选择蛋糕尺寸');
      return;
    }
    if (!orderForm.unitPrice) {
      alert('请填写单价');
      return;
    }
    if (!orderForm.batchNumber) {
      alert('请填写批次号');
      return;
    }
    if (!orderForm.deliveryTime) {
      alert('请填写配送时间');
      return;
    }
    const hasInvalidRecipient = orderForm.recipients.some(r => !r.name || !r.phone || !r.address);
    if (hasInvalidRecipient) {
      alert('请完善所有收件人信息');
      return;
    }
    try {
      const data = {
        ...orderForm,
        unitPrice: Number(orderForm.unitPrice),
        quantity: orderForm.recipients.length,
        totalPrice: Number(orderForm.unitPrice) * orderForm.recipients.length,
        deliveryBatch: orderForm.deliveryBatch ? Number(orderForm.deliveryBatch) : 1,
        totalBatches: orderForm.totalBatches ? Number(orderForm.totalBatches) : 1,
        recipients: orderForm.recipients
      };
      await api.createGroupPurchaseOrder(data);
      setShowCreateOrderModal(false);
      resetOrderForm();
      loadGroupOrders();
    } catch (e) {
      console.error(e);
      alert('创建团购订单失败');
    }
  };

  const resetOrderForm = () => {
    setOrderForm({
      contractId: '',
      departmentName: '',
      cakeId: '',
      size: '',
      unitPrice: '',
      recipients: [{ name: '', phone: '', address: '' }],
      batchNumber: '',
      deliveryBatch: '',
      totalBatches: '',
      deliveryTime: ''
    });
  };

  const handleAddRecipient = () => {
    setOrderForm({
      ...orderForm,
      recipients: [...orderForm.recipients, { name: '', phone: '', address: '' }]
    });
  };

  const handleRemoveRecipient = (idx) => {
    const recs = [...orderForm.recipients];
    recs.splice(idx, 1);
    setOrderForm({ ...orderForm, recipients: recs });
  };

  const handleRecipientChange = (idx, field, value) => {
    const recs = [...orderForm.recipients];
    recs[idx][field] = value;
    setOrderForm({ ...orderForm, recipients: recs });
  };

  const handleCakeSelect = (cakeId) => {
    const cake = cakes.find(c => c.id === Number(cakeId));
    setOrderForm({
      ...orderForm,
      cakeId,
      size: cake?.sizes?.[0] || '',
      unitPrice: cake?.prices?.[0] || ''
    });
  };

  const handleContractSelect = (contractId) => {
    const contract = contracts.find(c => c.id === Number(contractId));
    setOrderForm({
      ...orderForm,
      contractId,
      departmentName: contract?.departments?.[0]?.name || ''
    });
  };

  const openDeliveryModal = (order) => {
    setSelectedOrder(order);
    setDeliveryForm({ status: order.deliveryStatus || DELIVERY_STATUS.PENDING });
    setShowDeliveryModal(true);
  };

  const handleUpdateDelivery = async () => {
    try {
      await api.updateGroupPurchaseDeliveryStatus(selectedOrder.id, {
        status: deliveryForm.status
      });
      setShowDeliveryModal(false);
      loadGroupOrders();
    } catch (e) {
      console.error(e);
      alert('更新配送状态失败');
    }
  };

  const getBatchGroups = () => {
    const groups = {};
    groupOrders.forEach(order => {
      const key = order.batchNumber || '未分批';
      if (!groups[key]) {
        groups[key] = {
          batchNumber: key,
          companyName: order.companyName,
          orders: [],
          pending: 0,
          on_the_way: 0,
          delivered: 0
        };
      }
      groups[key].orders.push(order);
      if (order.deliveryStatus && groups[key][order.deliveryStatus] !== undefined) {
        groups[key][order.deliveryStatus]++;
      } else {
        groups[key].pending++;
      }
    });
    return Object.values(groups);
  };

  const getBatchStatus = (batch) => {
    if (batch.delivered === batch.orders.length) return 'delivered';
    if (batch.on_the_way > 0) return 'on_the_way';
    return 'pending';
  };

  const tabs = [
    { key: 'contracts', label: '企业合同', count: contracts.length },
    { key: 'orders', label: '团购子订单', count: groupOrders.length },
    { key: 'batches', label: '分批配送', count: getBatchGroups().length }
  ];

  const selectedContractForOrder = contracts.find(c => c.id === Number(orderForm.contractId));

  return (
    <div>
      <h1 className="page-title">🏢 企业团购管理</h1>

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

      {activeTab === 'contracts' && (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={() => setShowCreateContractModal(true)}>
              + 新建企业合同
            </button>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>公司名称</th>
                  <th>合同编号</th>
                  <th>联系人</th>
                  <th>总预算</th>
                  <th>已用预算</th>
                  <th>剩余预算</th>
                  <th>部门数</th>
                  <th>开始日期</th>
                  <th>结束日期</th>
                  <th>状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {contracts.map(contract => (
                  <tr key={contract.id}>
                    <td style={{ fontWeight: 500 }}>{contract.companyName}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{contract.contractNumber}</td>
                    <td>
                      <div>{contract.contactPerson}</div>
                      <div style={{ fontSize: 12, color: '#8b7355' }}>{contract.contactPhone}</div>
                    </td>
                    <td>{formatCurrency(contract.totalBudget)}</td>
                    <td>{formatCurrency(contract.usedBudget)}</td>
                    <td style={{ color: contract.remainingBudget < 0 ? '#c62828' : '#2e7d32', fontWeight: 500 }}>
                      {formatCurrency(contract.remainingBudget)}
                    </td>
                    <td>{contract.departments?.length || 0}</td>
                    <td>{contract.startDate}</td>
                    <td>{contract.endDate}</td>
                    <td>{getContractStatusBadge(contract.status)}</td>
                    <td>
                      <div className="actions-bar">
                        <button className="btn btn-sm btn-secondary" onClick={() => handleViewContractDetail(contract.id)}>
                          查看详情
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {contracts.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <div className="empty-state-text">暂无企业合同</div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'orders' && (
        <div>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <button className="btn btn-primary" onClick={() => setShowCreateOrderModal(true)}>
              + 新建团购订单
            </button>
          </div>
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>公司名称</th>
                  <th>部门</th>
                  <th>蛋糕</th>
                  <th>数量</th>
                  <th>总价</th>
                  <th>批次信息</th>
                  <th>配送时间</th>
                  <th>配送状态</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {groupOrders.map(order => (
                  <tr key={order.id}>
                    <td>{order.companyName}</td>
                    <td>{order.departmentName}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{order.cakeName}</div>
                      <div style={{ fontSize: 12, color: '#8b7355' }}>{order.size}</div>
                    </td>
                    <td>{order.quantity}</td>
                    <td style={{ color: '#d32f2f', fontWeight: 500 }}>{formatCurrency(order.totalPrice)}</td>
                    <td>
                      <div>批次号：{order.batchNumber}</div>
                      <div style={{ fontSize: 12, color: '#8b7355' }}>
                        第 {order.deliveryBatch}/{order.totalBatches} 批
                      </div>
                    </td>
                    <td>{order.deliveryTime}</td>
                    <td>{getDeliveryStatusBadge(order.deliveryStatus)}</td>
                    <td>
                      <div className="actions-bar">
                        <button className="btn btn-sm btn-secondary" onClick={() => setSelectedOrder(order)}>
                          详情
                        </button>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => openDeliveryModal(order)}
                        >
                          更新配送
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {groupOrders.length === 0 && (
              <div className="empty-state">
                <div className="empty-state-icon">🧁</div>
                <div className="empty-state-text">暂无团购订单</div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'batches' && (
        <div>
          {getBatchGroups().map(batch => (
            <div key={batch.batchNumber} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 'bold', color: '#5d4037' }}>
                    📦 批次号：{batch.batchNumber}
                  </div>
                  <div style={{ fontSize: 13, color: '#8b7355', marginTop: 4 }}>
                    {batch.companyName} · 共 {batch.orders.length} 个订单
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 12 }}>
                    <span style={{ background: '#fff3e0', color: '#e65100', padding: '3px 10px', borderRadius: 10 }}>
                      待配送 {batch.pending}
                    </span>
                    <span style={{ marginLeft: 8, background: '#e3f2fd', color: '#1565c0', padding: '3px 10px', borderRadius: 10 }}>
                      配送中 {batch.on_the_way}
                    </span>
                    <span style={{ marginLeft: 8, background: '#e8f5e9', color: '#2e7d32', padding: '3px 10px', borderRadius: 10 }}>
                      已送达 {batch.delivered}
                    </span>
                  </span>
                  {getDeliveryStatusBadge(getBatchStatus(batch))}
                </div>
              </div>
              <table className="table">
                <thead>
                  <tr>
                    <th>订单号</th>
                    <th>部门</th>
                    <th>蛋糕</th>
                    <th>收件人</th>
                    <th>地址</th>
                    <th>配送时间</th>
                    <th>状态</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {batch.orders.map(order => (
                    <tr key={order.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: 13 }}>{order.id}</td>
                      <td>{order.departmentName}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{order.cakeName}</div>
                        <div style={{ fontSize: 12, color: '#8b7355' }}>{order.size}</div>
                      </td>
                      <td>
                        {order.recipients?.map((r, i) => (
                          <div key={i} style={{ fontSize: 13 }}>
                            {r.name} · {r.phone}
                          </div>
                        ))}
                      </td>
                      <td style={{ fontSize: 13 }}>
                        {order.recipients?.[0]?.address || '-'}
                      </td>
                      <td>{order.deliveryTime}</td>
                      <td>{getDeliveryStatusBadge(order.deliveryStatus)}</td>
                      <td>
                        <div className="actions-bar">
                          <button className="btn btn-sm btn-primary" onClick={() => openDeliveryModal(order)}>
                            更新配送
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {getBatchGroups().length === 0 && (
            <div className="empty-state">
              <div className="empty-state-icon">🚚</div>
              <div className="empty-state-text">暂无分批配送数据</div>
            </div>
          )}
        </div>
      )}

      {showCreateContractModal && (
        <div className="modal-overlay" onClick={() => setShowCreateContractModal(false)}>
          <div className="modal" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">新建企业合同</div>
              <button className="modal-close" onClick={() => setShowCreateContractModal(false)}>×</button>
            </div>

            <div style={{ fontWeight: 'bold', marginTop: 8, marginBottom: 12, color: '#5d4037' }}>企业基本信息</div>
            <div className="row">
              <div className="col">
                <div className="form-group">
                  <label className="label">公司名称 *</label>
                  <input
                    className="input"
                    placeholder="请输入公司名称"
                    value={contractForm.companyName}
                    onChange={e => setContractForm({ ...contractForm, companyName: e.target.value })}
                  />
                </div>
              </div>
              <div className="col">
                <div className="form-group">
                  <label className="label">合同编号 *</label>
                  <input
                    className="input"
                    placeholder="请输入合同编号"
                    value={contractForm.contractNumber}
                    onChange={e => setContractForm({ ...contractForm, contractNumber: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col">
                <div className="form-group">
                  <label className="label">联系人 *</label>
                  <input
                    className="input"
                    placeholder="请输入联系人姓名"
                    value={contractForm.contactPerson}
                    onChange={e => setContractForm({ ...contractForm, contactPerson: e.target.value })}
                  />
                </div>
              </div>
              <div className="col">
                <div className="form-group">
                  <label className="label">联系电话</label>
                  <input
                    className="input"
                    placeholder="请输入联系电话"
                    value={contractForm.contactPhone}
                    onChange={e => setContractForm({ ...contractForm, contactPhone: e.target.value })}
                  />
                </div>
              </div>
              <div className="col">
                <div className="form-group">
                  <label className="label">联系邮箱</label>
                  <input
                    className="input"
                    placeholder="请输入联系邮箱"
                    value={contractForm.contactEmail}
                    onChange={e => setContractForm({ ...contractForm, contactEmail: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col">
                <div className="form-group">
                  <label className="label">总预算 (元) *</label>
                  <input
                    className="input"
                    type="number"
                    placeholder="请输入总预算金额"
                    value={contractForm.totalBudget}
                    onChange={e => setContractForm({ ...contractForm, totalBudget: e.target.value })}
                  />
                </div>
              </div>
              <div className="col">
                <div className="form-group">
                  <label className="label">开始日期 *</label>
                  <input
                    type="date"
                    className="input"
                    value={contractForm.startDate}
                    onChange={e => setContractForm({ ...contractForm, startDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="col">
                <div className="form-group">
                  <label className="label">结束日期 *</label>
                  <input
                    type="date"
                    className="input"
                    value={contractForm.endDate}
                    onChange={e => setContractForm({ ...contractForm, endDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div style={{ fontWeight: 'bold', marginTop: 16, marginBottom: 12, color: '#5d4037' }}>发票信息</div>
            <div className="row">
              <div className="col">
                <div className="form-group">
                  <label className="label">发票抬头</label>
                  <input
                    className="input"
                    placeholder="请输入发票抬头"
                    value={contractForm.invoiceTitle}
                    onChange={e => setContractForm({ ...contractForm, invoiceTitle: e.target.value })}
                  />
                </div>
              </div>
              <div className="col">
                <div className="form-group">
                  <label className="label">税号</label>
                  <input
                    className="input"
                    placeholder="请输入纳税人识别号"
                    value={contractForm.invoiceTaxNo}
                    onChange={e => setContractForm({ ...contractForm, invoiceTaxNo: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col">
                <div className="form-group">
                  <label className="label">开票地址</label>
                  <input
                    className="input"
                    placeholder="请输入开票地址"
                    value={contractForm.invoiceAddress}
                    onChange={e => setContractForm({ ...contractForm, invoiceAddress: e.target.value })}
                  />
                </div>
              </div>
              <div className="col">
                <div className="form-group">
                  <label className="label">开票电话</label>
                  <input
                    className="input"
                    placeholder="请输入开票电话"
                    value={contractForm.invoicePhone}
                    onChange={e => setContractForm({ ...contractForm, invoicePhone: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col">
                <div className="form-group">
                  <label className="label">开户银行</label>
                  <input
                    className="input"
                    placeholder="请输入开户银行名称"
                    value={contractForm.invoiceBankName}
                    onChange={e => setContractForm({ ...contractForm, invoiceBankName: e.target.value })}
                  />
                </div>
              </div>
              <div className="col">
                <div className="form-group">
                  <label className="label">银行账号</label>
                  <input
                    className="input"
                    placeholder="请输入银行账号"
                    value={contractForm.invoiceBankAccount}
                    onChange={e => setContractForm({ ...contractForm, invoiceBankAccount: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 12 }}>
              <div style={{ fontWeight: 'bold', color: '#5d4037' }}>部门信息</div>
              <button className="btn btn-sm btn-secondary" onClick={handleAddDepartment}>
                + 添加部门
              </button>
            </div>
            {contractForm.departments.map((dept, idx) => (
              <div key={idx} style={{
                background: '#faf5ee',
                padding: 16,
                borderRadius: 12,
                marginBottom: 12
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontWeight: 500, color: '#5d4037' }}>部门 {idx + 1}</div>
                  {contractForm.departments.length > 1 && (
                    <button className="btn btn-sm btn-danger" onClick={() => handleRemoveDepartment(idx)}>
                      删除
                    </button>
                  )}
                </div>
                <div className="row">
                  <div className="col">
                    <div className="form-group">
                      <label className="label">部门名称</label>
                      <input
                        className="input"
                        placeholder="部门名称"
                        value={dept.name}
                        onChange={e => handleDepartmentChange(idx, 'name', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col">
                    <div className="form-group">
                      <label className="label">人数</label>
                      <input
                        className="input"
                        type="number"
                        placeholder="部门人数"
                        value={dept.headcount}
                        onChange={e => handleDepartmentChange(idx, 'headcount', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col">
                    <div className="form-group">
                      <label className="label">部门联系人</label>
                      <input
                        className="input"
                        placeholder="联系人姓名"
                        value={dept.contact}
                        onChange={e => handleDepartmentChange(idx, 'contact', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col">
                    <div className="form-group">
                      <label className="label">联系电话</label>
                      <input
                        className="input"
                        placeholder="联系电话"
                        value={dept.phone}
                        onChange={e => handleDepartmentChange(idx, 'phone', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreateContractModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreateContract}>创建合同</button>
            </div>
          </div>
        </div>
      )}

      {showContractDetailModal && selectedContract && (
        <div className="modal-overlay" onClick={() => setShowContractDetailModal(false)}>
          <div className="modal" style={{ maxWidth: 680 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">合同详情 - {selectedContract.companyName}</div>
              <button className="modal-close" onClick={() => setShowContractDetailModal(false)}>×</button>
            </div>

            <div className="order-detail-row">
              <div className="order-detail-label">公司名称</div>
              <div className="order-detail-value" style={{ fontWeight: 500 }}>{selectedContract.companyName}</div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">合同编号</div>
              <div className="order-detail-value" style={{ fontFamily: 'monospace' }}>{selectedContract.contractNumber}</div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">联系人</div>
              <div className="order-detail-value">{selectedContract.contactPerson} / {selectedContract.contactPhone}</div>
            </div>
            {selectedContract.contactEmail && (
              <div className="order-detail-row">
                <div className="order-detail-label">邮箱</div>
                <div className="order-detail-value">{selectedContract.contactEmail}</div>
              </div>
            )}
            <div className="order-detail-row">
              <div className="order-detail-label">合同周期</div>
              <div className="order-detail-value">{selectedContract.startDate} 至 {selectedContract.endDate}</div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">状态</div>
              <div className="order-detail-value">{getContractStatusBadge(selectedContract.status)}</div>
            </div>

            <div style={{ fontWeight: 'bold', marginTop: 16, marginBottom: 8, color: '#5d4037' }}>预算信息</div>
            <div className="row">
              <div className="col">
                <div style={{ background: '#fdf5ea', padding: 16, borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: '#8b7355' }}>总预算</div>
                  <div style={{ fontSize: 22, fontWeight: 'bold', color: '#5d4037', marginTop: 4 }}>
                    {formatCurrency(selectedContract.totalBudget)}
                  </div>
                </div>
              </div>
              <div className="col">
                <div style={{ background: '#fff3e0', padding: 16, borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: '#8b7355' }}>已使用</div>
                  <div style={{ fontSize: 22, fontWeight: 'bold', color: '#e65100', marginTop: 4 }}>
                    {formatCurrency(selectedContract.usedBudget)}
                  </div>
                </div>
              </div>
              <div className="col">
                <div style={{ background: '#e8f5e9', padding: 16, borderRadius: 12, textAlign: 'center' }}>
                  <div style={{ fontSize: 13, color: '#8b7355' }}>剩余</div>
                  <div style={{ fontSize: 22, fontWeight: 'bold', color: '#2e7d32', marginTop: 4 }}>
                    {formatCurrency(selectedContract.remainingBudget)}
                  </div>
                </div>
              </div>
            </div>

            {selectedContract.invoiceTitle && (
              <>
                <div style={{ fontWeight: 'bold', marginTop: 16, marginBottom: 8, color: '#5d4037' }}>发票信息</div>
                <div className="order-detail-row">
                  <div className="order-detail-label">发票抬头</div>
                  <div className="order-detail-value">{selectedContract.invoiceTitle}</div>
                </div>
                {selectedContract.invoiceTaxNo && (
                  <div className="order-detail-row">
                    <div className="order-detail-label">税号</div>
                    <div className="order-detail-value" style={{ fontFamily: 'monospace' }}>{selectedContract.invoiceTaxNo}</div>
                  </div>
                )}
                {selectedContract.invoiceAddress && (
                  <div className="order-detail-row">
                    <div className="order-detail-label">地址</div>
                    <div className="order-detail-value">{selectedContract.invoiceAddress}</div>
                  </div>
                )}
                {selectedContract.invoicePhone && (
                  <div className="order-detail-row">
                    <div className="order-detail-label">电话</div>
                    <div className="order-detail-value">{selectedContract.invoicePhone}</div>
                  </div>
                )}
                {selectedContract.invoiceBankName && (
                  <div className="order-detail-row">
                    <div className="order-detail-label">开户银行</div>
                    <div className="order-detail-value">{selectedContract.invoiceBankName}</div>
                  </div>
                )}
                {selectedContract.invoiceBankAccount && (
                  <div className="order-detail-row">
                    <div className="order-detail-label">银行账号</div>
                    <div className="order-detail-value" style={{ fontFamily: 'monospace' }}>{selectedContract.invoiceBankAccount}</div>
                  </div>
                )}
              </>
            )}

            {selectedContract.departments && selectedContract.departments.length > 0 && (
              <>
                <div style={{ fontWeight: 'bold', marginTop: 16, marginBottom: 8, color: '#5d4037' }}>部门列表</div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>部门名称</th>
                      <th>人数</th>
                      <th>联系人</th>
                      <th>联系电话</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedContract.departments.map((dept, idx) => (
                      <tr key={idx}>
                        <td>{dept.name}</td>
                        <td>{dept.headcount}</td>
                        <td>{dept.contact}</td>
                        <td>{dept.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowContractDetailModal(false)}>关闭</button>
            </div>
          </div>
        </div>
      )}

      {showCreateOrderModal && (
        <div className="modal-overlay" onClick={() => setShowCreateOrderModal(false)}>
          <div className="modal" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">新建团购订单</div>
              <button className="modal-close" onClick={() => setShowCreateOrderModal(false)}>×</button>
            </div>

            <div className="row">
              <div className="col">
                <div className="form-group">
                  <label className="label">选择合同 *</label>
                  <select
                    className="select"
                    value={orderForm.contractId}
                    onChange={e => handleContractSelect(e.target.value)}
                  >
                    <option value="">请选择企业合同</option>
                    {contracts.filter(c => c.status === CONTRACT_STATUS.APPROVED).map(c => (
                      <option key={c.id} value={c.id}>{c.companyName} - {c.contractNumber}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col">
                <div className="form-group">
                  <label className="label">选择部门 *</label>
                  <select
                    className="select"
                    value={orderForm.departmentName}
                    onChange={e => setOrderForm({ ...orderForm, departmentName: e.target.value })}
                  >
                    <option value="">请选择部门</option>
                    {selectedContractForOrder?.departments?.map((d, idx) => (
                      <option key={idx} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col">
                <div className="form-group">
                  <label className="label">选择蛋糕 *</label>
                  <select
                    className="select"
                    value={orderForm.cakeId}
                    onChange={e => handleCakeSelect(e.target.value)}
                  >
                    <option value="">请选择蛋糕</option>
                    {cakes.map(cake => (
                      <option key={cake.id} value={cake.id}>{cake.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col">
                <div className="form-group">
                  <label className="label">蛋糕尺寸 *</label>
                  <select
                    className="select"
                    value={orderForm.size}
                    onChange={e => setOrderForm({ ...orderForm, size: e.target.value })}
                  >
                    <option value="">请选择尺寸</option>
                    {cakes.find(c => c.id === Number(orderForm.cakeId))?.sizes?.map((size, idx) => (
                      <option key={idx} value={size}>{size}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="col">
                <div className="form-group">
                  <label className="label">单价 (元) *</label>
                  <input
                    className="input"
                    type="number"
                    placeholder="请输入单价"
                    value={orderForm.unitPrice}
                    onChange={e => setOrderForm({ ...orderForm, unitPrice: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col">
                <div className="form-group">
                  <label className="label">批次号 *</label>
                  <input
                    className="input"
                    placeholder="例如：BATCH20240101"
                    value={orderForm.batchNumber}
                    onChange={e => setOrderForm({ ...orderForm, batchNumber: e.target.value })}
                  />
                </div>
              </div>
              <div className="col">
                <div className="form-group">
                  <label className="label">当前批次</label>
                  <input
                    className="input"
                    type="number"
                    placeholder="第几次配送"
                    value={orderForm.deliveryBatch}
                    onChange={e => setOrderForm({ ...orderForm, deliveryBatch: e.target.value })}
                  />
                </div>
              </div>
              <div className="col">
                <div className="form-group">
                  <label className="label">总批次数</label>
                  <input
                    className="input"
                    type="number"
                    placeholder="总共几批"
                    value={orderForm.totalBatches}
                    onChange={e => setOrderForm({ ...orderForm, totalBatches: e.target.value })}
                  />
                </div>
              </div>
              <div className="col">
                <div className="form-group">
                  <label className="label">配送时间 *</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={orderForm.deliveryTime}
                    onChange={e => setOrderForm({ ...orderForm, deliveryTime: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, marginBottom: 12 }}>
              <div style={{ fontWeight: 'bold', color: '#5d4037' }}>
                收件人信息（共 {orderForm.recipients.length} 人，合计 {formatCurrency(Number(orderForm.unitPrice || 0) * orderForm.recipients.length)}）
              </div>
              <button className="btn btn-sm btn-secondary" onClick={handleAddRecipient}>
                + 添加收件人
              </button>
            </div>
            {orderForm.recipients.map((rec, idx) => (
              <div key={idx} style={{
                background: '#faf5ee',
                padding: 16,
                borderRadius: 12,
                marginBottom: 12
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <div style={{ fontWeight: 500, color: '#5d4037' }}>收件人 {idx + 1}</div>
                  {orderForm.recipients.length > 1 && (
                    <button className="btn btn-sm btn-danger" onClick={() => handleRemoveRecipient(idx)}>
                      删除
                    </button>
                  )}
                </div>
                <div className="row">
                  <div className="col">
                    <div className="form-group">
                      <label className="label">姓名</label>
                      <input
                        className="input"
                        placeholder="收件人姓名"
                        value={rec.name}
                        onChange={e => handleRecipientChange(idx, 'name', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col">
                    <div className="form-group">
                      <label className="label">电话</label>
                      <input
                        className="input"
                        placeholder="联系电话"
                        value={rec.phone}
                        onChange={e => handleRecipientChange(idx, 'phone', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col" style={{ minWidth: '100%' }}>
                    <div className="form-group">
                      <label className="label">地址</label>
                      <input
                        className="input"
                        placeholder="配送地址"
                        value={rec.address}
                        onChange={e => handleRecipientChange(idx, 'address', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCreateOrderModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleCreateOrder}>创建订单</button>
            </div>
          </div>
        </div>
      )}

      {showDeliveryModal && selectedOrder && (
        <div className="modal-overlay" onClick={() => setShowDeliveryModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">更新配送状态</div>
              <button className="modal-close" onClick={() => setShowDeliveryModal(false)}>×</button>
            </div>

            <div className="alert alert-info">
              订单：{selectedOrder.cakeName} ({selectedOrder.size}) × {selectedOrder.quantity}
            </div>

            <div className="order-detail-row">
              <div className="order-detail-label">公司</div>
              <div className="order-detail-value">{selectedOrder.companyName}</div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">部门</div>
              <div className="order-detail-value">{selectedOrder.departmentName}</div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">配送时间</div>
              <div className="order-detail-value">{selectedOrder.deliveryTime}</div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">当前状态</div>
              <div className="order-detail-value">{getDeliveryStatusBadge(selectedOrder.deliveryStatus)}</div>
            </div>

            <div className="form-group" style={{ marginTop: 16 }}>
              <label className="label">更新配送状态</label>
              <select
                className="select"
                value={deliveryForm.status}
                onChange={e => setDeliveryForm({ ...deliveryForm, status: e.target.value })}
              >
                <option value={DELIVERY_STATUS.PENDING}>待配送</option>
                <option value={DELIVERY_STATUS.ON_THE_WAY}>配送中</option>
                <option value={DELIVERY_STATUS.DELIVERED}>已送达</option>
              </select>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowDeliveryModal(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleUpdateDelivery}>确认更新</button>
            </div>
          </div>
        </div>
      )}

      {selectedOrder && !showDeliveryModal && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div className="modal" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">团购订单详情</div>
              <button className="modal-close" onClick={() => setSelectedOrder(null)}>×</button>
            </div>

            <div className="order-detail-row">
              <div className="order-detail-label">订单号</div>
              <div className="order-detail-value" style={{ fontFamily: 'monospace' }}>{selectedOrder.id}</div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">公司</div>
              <div className="order-detail-value">{selectedOrder.companyName}</div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">部门</div>
              <div className="order-detail-value">{selectedOrder.departmentName}</div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">蛋糕</div>
              <div className="order-detail-value">
                <strong>{selectedOrder.cakeName}</strong> ({selectedOrder.size})
              </div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">数量</div>
              <div className="order-detail-value">{selectedOrder.quantity} 个</div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">总价</div>
              <div className="order-detail-value" style={{ color: '#d32f2f', fontWeight: 500 }}>
                {formatCurrency(selectedOrder.totalPrice)}
              </div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">批次</div>
              <div className="order-detail-value">
                {selectedOrder.batchNumber}（第 {selectedOrder.deliveryBatch}/{selectedOrder.totalBatches} 批）
              </div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">配送时间</div>
              <div className="order-detail-value">{selectedOrder.deliveryTime}</div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">配送状态</div>
              <div className="order-detail-value">{getDeliveryStatusBadge(selectedOrder.deliveryStatus)}</div>
            </div>

            {selectedOrder.recipients && selectedOrder.recipients.length > 0 && (
              <>
                <div style={{ fontWeight: 'bold', marginTop: 16, marginBottom: 8, color: '#5d4037' }}>收件人列表</div>
                <table className="table">
                  <thead>
                    <tr>
                      <th>姓名</th>
                      <th>电话</th>
                      <th>地址</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.recipients.map((r, idx) => (
                      <tr key={idx}>
                        <td>{r.name}</td>
                        <td>{r.phone}</td>
                        <td>{r.address}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedOrder(null)}>关闭</button>
              <button className="btn btn-primary" onClick={() => openDeliveryModal(selectedOrder)}>
                更新配送状态
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
