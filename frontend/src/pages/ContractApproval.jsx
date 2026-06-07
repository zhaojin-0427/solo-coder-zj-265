import { useState, useEffect } from 'react';
import { api } from '../api.js';

const STATUS_FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待审批' },
  { key: 'in_progress', label: '审批中' },
  { key: 'approved', label: '已通过' },
  { key: 'rejected', label: '已驳回' }
];

function getStatusBadgeStyle(status) {
  switch (status) {
    case 'pending':
      return { background: '#fff3e0', color: '#e65100' };
    case 'in_progress':
      return { background: '#e3f2fd', color: '#1565c0' };
    case 'approved':
      return { background: '#e8f5e9', color: '#2e7d32' };
    case 'rejected':
      return { background: '#ffebee', color: '#c62828' };
    default:
      return { background: '#f5f5f5', color: '#616161' };
  }
}

function getStepBadgeStyle(status) {
  switch (status) {
    case 'approved':
      return { background: '#e8f5e9', color: '#2e7d32' };
    case 'rejected':
      return { background: '#ffebee', color: '#c62828' };
    case 'pending':
      return { background: '#fff3e0', color: '#e65100' };
    case 'waiting':
      return { background: '#f5f5f5', color: '#9e9e9e' };
    default:
      return { background: '#f5f5f5', color: '#616161' };
  }
}

function getStepLabel(status) {
  switch (status) {
    case 'approved': return '已通过';
    case 'rejected': return '已驳回';
    case 'pending': return '审批中';
    case 'waiting': return '等待中';
    default: return status;
  }
}

function getStepDotStyle(status, isCurrent) {
  if (status === 'approved') return { background: '#2e7d32' };
  if (status === 'rejected') return { background: '#c62828' };
  if (isCurrent || status === 'pending') return { background: '#d4a574', boxShadow: '0 0 0 4px rgba(212, 165, 116, 0.2)' };
  return { background: '#e0e0e0' };
}

export default function ContractApproval() {
  const [approvals, setApprovals] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [approvalDetail, setApprovalDetail] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [remark, setRemark] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadApprovals();
  }, [statusFilter]);

  const loadApprovals = async () => {
    try {
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const res = await api.getApprovals(params);
      setApprovals(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const openDetail = async (approval) => {
    setSelectedApproval(approval);
    setRemark('');
    setShowDetailModal(true);
    try {
      const res = await api.getApproval(approval.id);
      setApprovalDetail(res.data);
    } catch (e) {
      console.error(e);
      setApprovalDetail(approval);
    }
  };

  const closeDetail = () => {
    setShowDetailModal(false);
    setSelectedApproval(null);
    setApprovalDetail(null);
    setRemark('');
  };

  const handleApprove = async () => {
    if (!selectedApproval) return;
    setLoading(true);
    try {
      const res = await api.approveApproval(selectedApproval.id, remark);
      setApprovalDetail(res.data);
      alert('审批通过成功');
      loadApprovals();
      if (res.data.status === 'approved') {
        closeDetail();
      }
    } catch (e) {
      console.error(e);
      alert('审批操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedApproval) return;
    if (!remark.trim()) {
      alert('驳回请填写备注原因');
      return;
    }
    setLoading(true);
    try {
      await api.rejectApproval(selectedApproval.id, remark);
      alert('审批已驳回');
      loadApprovals();
      closeDetail();
    } catch (e) {
      console.error(e);
      alert('驳回操作失败');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredApprovals = () => {
    if (statusFilter === 'all') return approvals;
    return approvals.filter(a => a.status === statusFilter);
  };

  const getCurrentStepIndex = (flowSteps) => {
    const pendingIdx = flowSteps.findIndex(s => s.status === 'pending');
    if (pendingIdx >= 0) return pendingIdx;
    const rejectedIdx = flowSteps.findIndex(s => s.status === 'rejected');
    if (rejectedIdx >= 0) return rejectedIdx;
    return flowSteps.length - 1;
  };

  const canOperate = (approval) => {
    return approval && (approval.status === 'pending' || approval.status === 'in_progress');
  };

  return (
    <div>
      <h1 className="page-title">📋 合同审批</h1>

      <div className="tabs">
        {STATUS_FILTERS.map(tab => {
          const count = tab.key === 'all'
            ? approvals.length
            : approvals.filter(a => a.status === tab.key).length;
          return (
            <button
              key={tab.key}
              className={`tab ${statusFilter === tab.key ? 'active' : ''}`}
              onClick={() => setStatusFilter(tab.key)}
            >
              {tab.label}
              {count > 0 && (
                <span style={{
                  marginLeft: 6,
                  background: statusFilter === tab.key ? '#d4a574' : '#e0d4c3',
                  color: statusFilter === tab.key ? 'white' : '#8b7355',
                  borderRadius: 10,
                  padding: '1px 8px',
                  fontSize: 12
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th>审批标题</th>
              <th>申请人</th>
              <th>联系电话</th>
              <th>合同金额</th>
              <th>提交时间</th>
              <th>当前审批人</th>
              <th>审批角色</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {getFilteredApprovals().map(approval => (
              <tr key={approval.id}>
                <td>
                  <div style={{ fontWeight: 500, color: '#5d4037' }}>{approval.title}</div>
                  <div style={{ fontSize: 12, color: '#8b7355', fontFamily: 'monospace' }}>{approval.id}</div>
                </td>
                <td>{approval.applicant}</td>
                <td>{approval.applicantPhone}</td>
                <td style={{ color: '#d32f2f', fontWeight: 600 }}>¥{approval.amount?.toLocaleString()}</td>
                <td>{approval.submitTime}</td>
                <td>{approval.currentApprover}</td>
                <td>{approval.approverRole}</td>
                <td>
                  <span className="status-badge" style={getStatusBadgeStyle(approval.status)}>
                    {approval.statusLabel}
                  </span>
                </td>
                <td>
                  <div className="actions-bar">
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => openDetail(approval)}
                    >
                      查看详情
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {getFilteredApprovals().length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📭</div>
            <div className="empty-state-text">暂无审批数据</div>
          </div>
        )}
      </div>

      {showDetailModal && approvalDetail && (
        <div className="modal-overlay" onClick={closeDetail}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <div className="modal-header">
              <div className="modal-title">审批详情</div>
              <button className="modal-close" onClick={closeDetail}>×</button>
            </div>

            <div className="order-detail-row">
              <div className="order-detail-label">审批编号</div>
              <div className="order-detail-value" style={{ fontFamily: 'monospace' }}>{approvalDetail.id}</div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">审批标题</div>
              <div className="order-detail-value" style={{ fontWeight: 600 }}>{approvalDetail.title}</div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">申请人</div>
              <div className="order-detail-value">{approvalDetail.applicant}</div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">联系电话</div>
              <div className="order-detail-value">{approvalDetail.applicantPhone}</div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">合同金额</div>
              <div className="order-detail-value" style={{ color: '#d32f2f', fontWeight: 600, fontSize: 16 }}>
                ¥{approvalDetail.amount?.toLocaleString()}
              </div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">提交时间</div>
              <div className="order-detail-value">{approvalDetail.submitTime}</div>
            </div>
            <div className="order-detail-row">
              <div className="order-detail-label">当前状态</div>
              <div className="order-detail-value">
                <span className="status-badge" style={getStatusBadgeStyle(approvalDetail.status)}>
                  {approvalDetail.statusLabel}
                </span>
              </div>
            </div>
            {approvalDetail.status === 'approved' && approvalDetail.approvalTime && (
              <div className="order-detail-row">
                <div className="order-detail-label">通过时间</div>
                <div className="order-detail-value" style={{ color: '#2e7d32' }}>{approvalDetail.approvalTime}</div>
              </div>
            )}
            {(approvalDetail.status === 'approved' || approvalDetail.status === 'rejected') && approvalDetail.approvalRemark && (
              <div className="order-detail-row">
                <div className="order-detail-label">审批备注</div>
                <div className="order-detail-value">{approvalDetail.approvalRemark}</div>
              </div>
            )}

            <div style={{ fontWeight: 'bold', marginTop: 24, marginBottom: 16, color: '#5d4037' }}>
              📝 审批流程
            </div>

            <div className="delivery-timeline">
              {approvalDetail.flowSteps?.map((step, idx) => {
                const isCurrent = getCurrentStepIndex(approvalDetail.flowSteps) === idx
                  && (approvalDetail.status === 'pending' || approvalDetail.status === 'in_progress');
                return (
                  <div key={step.step} className="timeline-item">
                    <div
                      className="timeline-dot"
                      style={getStepDotStyle(step.status, isCurrent)}
                    ></div>
                    <div className="timeline-content">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <div className="timeline-status" style={{
                            fontWeight: isCurrent ? 700 : 600,
                            color: isCurrent ? '#d4a574' : undefined
                          }}>
                            {step.role} - {step.approver}
                            {isCurrent && (
                              <span style={{
                                marginLeft: 8,
                                fontSize: 12,
                                background: '#d4a574',
                                color: 'white',
                                padding: '2px 8px',
                                borderRadius: 10,
                                fontWeight: 500
                              }}>
                                当前步骤
                              </span>
                            )}
                          </div>
                          <div style={{ marginTop: 4 }}>
                            <span
                              className="status-badge"
                              style={getStepBadgeStyle(step.status)}
                            >
                              {getStepLabel(step.status)}
                            </span>
                          </div>
                          {step.remark && (
                            <div style={{
                              marginTop: 8,
                              padding: '10px 12px',
                              background: '#faf5ee',
                              borderRadius: 8,
                              fontSize: 13,
                              color: '#5d4037'
                            }}>
                              💬 {step.remark}
                            </div>
                          )}
                        </div>
                        {step.time && (
                          <div className="timeline-time">{step.time}</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {canOperate(approvalDetail) && (
              <>
                <div style={{ fontWeight: 'bold', marginTop: 24, marginBottom: 12, color: '#5d4037' }}>
                  ✍️ 审批操作
                </div>

                <div className="form-group">
                  <label className="label">审批备注</label>
                  <textarea
                    className="textarea"
                    placeholder="请输入审批备注（驳回必填）"
                    value={remark}
                    onChange={e => setRemark(e.target.value)}
                    rows={3}
                  />
                </div>
              </>
            )}

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeDetail}>关闭</button>
              {canOperate(approvalDetail) && (
                <>
                  <button
                    className="btn btn-danger"
                    onClick={handleReject}
                    disabled={loading}
                  >
                    {loading ? '处理中...' : '驳回'}
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={handleApprove}
                    disabled={loading}
                  >
                    {loading ? '处理中...' : '通过'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
