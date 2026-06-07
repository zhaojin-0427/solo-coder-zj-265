import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line,
  ReferenceLine
} from 'recharts';
import { api } from '../api.js';

const COLORS = ['#d4a574', '#b8860b', '#d32f2f', '#388e3c', '#1976d2', '#7b1fa2', '#f57c00', '#00796b'];

export default function Statistics() {
  const [stats, setStats] = useState(null);
  const location = useLocation();

  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 15000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const loadStats = async () => {
    try {
      const res = await api.getStats();
      setStats(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  if (!stats) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📊</div>
        <div className="empty-state-text">加载统计数据中...</div>
      </div>
    );
  }

  const totalCakeOrders = stats.cakeOrders.reduce((sum, c) => sum + c.count, 0);

  return (
    <div>
      <h1 className="page-title">📊 统计分析</h1>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">🎂</div>
          <div className="stat-value">{totalCakeOrders}</div>
          <div className="stat-label">总预订量</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎉</div>
          <div className="stat-value highlight">{stats.festivalStats?.totalFestivalOrders ?? 0}</div>
          <div className="stat-label">节日档期订单</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-value success">{stats.capacityStats?.avgUtilization ?? 0}%</div>
          <div className="stat-label">平均产能利用率</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-value" style={{ color: '#d32f2f' }}>{stats.bookingStats?.rejectedCount ?? 0}</div>
          <div className="stat-label">被拒绝预约</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔄</div>
          <div className="stat-value highlight">{stats.bookingStats?.rescheduledCount ?? 0}</div>
          <div className="stat-label">被改期预约</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🚚</div>
          <div className="stat-value">{stats.deliveryStats.totalDeliveries}</div>
          <div className="stat-label">总配送订单</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-value success">{stats.deliveryStats.onTimeRate}%</div>
          <div className="stat-label">配送准时率</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔁</div>
          <div className="stat-value highlight">{stats.customerStats.repeatRate}%</div>
          <div className="stat-label">回头客比例</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-value">{stats.customerStats.totalCustomers}</div>
          <div className="stat-label">总客户数</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🆕</div>
          <div className="stat-value success">{stats.customerStats.newCustomersThisMonth}</div>
          <div className="stat-label">本月新增客户</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❤️</div>
          <div className="stat-value">{stats.customerStats.repeatCustomers}</div>
          <div className="stat-label">回头客人数</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏰</div>
          <div className="stat-value highlight">
            {stats.peakHours.reduce((max, h) => h.count > max.count ? h : max, stats.peakHours[0]).hour}
          </div>
          <div className="stat-label">最高峰时段</div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-title">🎂 各款式预订量排行</div>
        <ResponsiveContainer width="100%" height={360}>
          <BarChart data={stats.cakeOrders.sort((a, b) => b.count - a.count)} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0e6d8" />
            <XAxis type="number" stroke="#8b7355" />
            <YAxis type="category" dataKey="cakeName" stroke="#8b7355" width={160} />
            <Tooltip
              contentStyle={{
                background: 'white',
                border: '1px solid #e0d4c3',
                borderRadius: 10,
                padding: 12
              }}
              formatter={(value) => [`${value} 单`, '预订量']}
            />
            <Bar dataKey="count" fill="#d4a574" radius={[0, 8, 8, 0]}>
              {stats.cakeOrders.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-title">🎉 节日档期订单量排行</div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={(stats.festivalStats?.festivalOrders || []).sort((a, b) => b.count - a.count)}
              layout="vertical"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e6d8" />
              <XAxis type="number" stroke="#8b7355" />
              <YAxis type="category" dataKey="festivalName" stroke="#8b7355" width={120} />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e0d4c3',
                  borderRadius: 10,
                  padding: 12
                }}
                formatter={(value) => [`${value} 单`, '订单量']}
              />
              <Bar dataKey="count" fill="#b8860b" radius={[0, 8, 8, 0]}>
                {(stats.festivalStats?.festivalOrders || []).map((entry, index) => (
                  <Cell key={`cell-festival-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title">📊 近30天产能利用率趋势</div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.capacityStats?.dailyUtilization || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e6d8" />
              <XAxis dataKey="date" stroke="#8b7355" tick={{ fontSize: 11 }} />
              <YAxis stroke="#8b7355" domain={[0, 'auto']} />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e0d4c3',
                  borderRadius: 10,
                  padding: 12
                }}
                formatter={(value, name) => {
                  if (name === 'utilization') return [`${value}%`, '产能利用率'];
                  if (name === 'orders') return [`${value} 单`, '订单数'];
                  return [value, name];
                }}
              />
              <Legend />
              <ReferenceLine
                y={85}
                stroke="#f57c00"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{ value: '高风险线 85%', position: 'right', fill: '#f57c00', fontSize: 11 }}
              />
              <ReferenceLine
                y={100}
                stroke="#d32f2f"
                strokeDasharray="5 5"
                strokeWidth={2}
                label={{ value: '超卖线 100%', position: 'right', fill: '#d32f2f', fontSize: 11 }}
              />
              <Line
                type="monotone"
                dataKey="utilization"
                name="产能利用率"
                stroke="#1976d2"
                strokeWidth={3}
                dot={{ fill: '#1976d2', r: 3 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-title">🔥 热门档期分布</div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.popularSlots || []}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="orderCount"
                nameKey="festivalName"
                paddingAngle={2}
                label={({ festivalName, orderCount, percent }) =>
                  `${festivalName}: ${orderCount}单 (${(percent * 100).toFixed(1)}%)`
                }
                labelLine={{ stroke: '#8b7355' }}
              >
                {(stats.popularSlots || []).map((entry, index) => (
                  <Cell key={`cell-slot-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e0d4c3',
                  borderRadius: 10,
                  padding: 12
                }}
                formatter={(value, name) => {
                  if (name === 'orderCount') return [`${value} 单`, '订单数'];
                  return [value, name];
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title">⚠️ 预约异常统计</div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: '被拒绝', value: stats.bookingStats?.rejectedCount ?? 0 },
                  { name: '被改期', value: stats.bookingStats?.rescheduledCount ?? 0 }
                ]}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={100}
                dataKey="value"
                label={({ name, value, percent }) =>
                  `${name}: ${value} (${(percent * 100).toFixed(1)}%)`
                }
              >
                <Cell fill="#d32f2f" />
                <Cell fill="#f57c00" />
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e0d4c3',
                  borderRadius: 10,
                  padding: 12
                }}
                formatter={(value) => [`${value} 次`, '']}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-title">🥧 客户结构分布</div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={[
                  { name: '回头客', value: stats.customerStats.repeatCustomers },
                  { name: '新客户', value: stats.customerStats.totalCustomers - stats.customerStats.repeatCustomers }
                ]}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
              >
                <Cell fill="#d4a574" />
                <Cell fill="#e8d5be" />
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e0d4c3',
                  borderRadius: 10,
                  padding: 12
                }}
                formatter={(value) => [`${value} 人`, '']}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title">🌾 过敏源分布 TOP10</div>
          {stats.allergenStats && stats.allergenStats.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.allergenStats.slice(0, 10)}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="count"
                  nameKey="name"
                  paddingAngle={2}
                  label={({ name, count, percent }) =>
                    `${name}: ${count} (${(percent * 100).toFixed(1)}%)`
                  }
                  labelLine={{ stroke: '#8b7355' }}
                >
                  {stats.allergenStats.slice(0, 10).map((entry, index) => (
                    <Cell key={`cell-allergen-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'white',
                    border: '1px solid #e0d4c3',
                    borderRadius: 10,
                    padding: 12
                  }}
                  formatter={(value) => [`${value} 次`, '出现次数']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ height: 280 }}>
              <div className="empty-state-text">暂无过敏源数据</div>
            </div>
          )}
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-title">📈 高峰时段订单分布</div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.peakHours}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0e6d8" />
              <XAxis dataKey="hour" stroke="#8b7355" />
              <YAxis stroke="#8b7355" />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e0d4c3',
                  borderRadius: 10,
                  padding: 12
                }}
                formatter={(value) => [`${value} 单`, '订单数']}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#b8860b"
                strokeWidth={3}
                dot={{ fill: '#b8860b', r: 5 }}
                activeDot={{ r: 8 }}
                fill="#fdf5ea"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-title">🚚 配送准时率分析</div>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={[
                  { name: '准时送达', value: stats.deliveryStats.onTime },
                  { name: '延迟送达', value: stats.deliveryStats.totalDeliveries - stats.deliveryStats.onTime }
                ]}
                cx="50%"
                cy="50%"
                outerRadius={100}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
              >
                <Cell fill="#388e3c" />
                <Cell fill="#d32f2f" />
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e0d4c3',
                  borderRadius: 10,
                  padding: 12
                }}
                formatter={(value) => [`${value} 单`, '']}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 16,
              padding: '12px 24px',
              background: '#e8f5e9',
              borderRadius: 12
            }}>
              <span style={{ fontSize: 14, color: '#2e7d32' }}>准时送达</span>
              <span style={{ fontSize: 14, color: '#c8e6c9' }}>|</span>
              <span style={{ fontSize: 14, color: '#2e7d32' }}>{stats.deliveryStats.onTime} / {stats.deliveryStats.totalDeliveries} 单</span>
              <span style={{ fontSize: 14, color: '#c8e6c9' }}>|</span>
              <span style={{ fontSize: 20, fontWeight: 'bold', color: '#2e7d32' }}>
                {stats.deliveryStats.onTimeRate}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="charts-row">
        <div className="chart-card">
          <div className="chart-title">🎯 预订量 TOP5 蛋糕</div>
          <table className="table" style={{ marginTop: 10 }}>
            <thead>
              <tr>
                <th style={{ width: 50 }}>排名</th>
                <th>蛋糕名称</th>
                <th style={{ width: 100, textAlign: 'right' }}>预订量</th>
                <th style={{ width: 120, textAlign: 'right' }}>占比</th>
              </tr>
            </thead>
            <tbody>
              {stats.cakeOrders
                .sort((a, b) => b.count - a.count)
                .slice(0, 5)
                .map((cake, idx) => (
                  <tr key={cake.cakeId}>
                    <td>
                      <span style={{
                        display: 'inline-flex',
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: idx < 3 ? '#d4a574' : '#e8d5be',
                        color: idx < 3 ? 'white' : '#8b7355',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        fontSize: 13
                      }}>
                        {idx + 1}
                      </span>
                    </td>
                    <td>{cake.cakeName}</td>
                    <td style={{ textAlign: 'right', fontWeight: 500 }}>{cake.count} 单</td>
                    <td style={{ textAlign: 'right', color: '#8b7355' }}>
                      {((cake.count / totalCakeOrders) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="chart-card">
          <div className="chart-title">🔥 热门档期 TOP5</div>
          <table className="table" style={{ marginTop: 10 }}>
            <thead>
              <tr>
                <th style={{ width: 50 }}>排名</th>
                <th>档期名称</th>
                <th style={{ width: 100, textAlign: 'right' }}>订单数</th>
                <th style={{ width: 100, textAlign: 'right' }}>产能倍数</th>
              </tr>
            </thead>
            <tbody>
              {(stats.popularSlots || []).slice(0, 5).map((slot, idx) => (
                <tr key={`slot-${slot.festivalId}-${idx}`}>
                  <td>
                    <span style={{
                      display: 'inline-flex',
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      background: idx < 3 ? '#d4a574' : '#e8d5be',
                      color: idx < 3 ? 'white' : '#8b7355',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: 13
                    }}>
                      {idx + 1}
                    </span>
                  </td>
                  <td>{slot.festivalName}</td>
                  <td style={{ textAlign: 'right', fontWeight: 500 }}>{slot.orderCount} 单</td>
                  <td style={{ textAlign: 'right', color: '#b8860b' }}>
                    {slot.capacityMultiplier}x
                  </td>
                </tr>
              ))}
              {(stats.popularSlots || []).length === 0 && (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: '#8b7355', padding: 24 }}>
                    暂无热门档期数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
