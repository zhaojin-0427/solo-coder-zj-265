import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line
} from 'recharts';
import { api } from '../api.js';

const COLORS = ['#d4a574', '#b8860b', '#d32f2f', '#388e3c', '#1976d2', '#7b1fa2', '#f57c00', '#00796b'];

export default function Statistics() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    loadStats();
  }, []);

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
      </div>

      <div className="charts-row">
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
      </div>
    </div>
  );
}
