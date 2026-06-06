import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import CakeCatalog from './pages/CakeCatalog.jsx';
import OrderSchedule from './pages/OrderSchedule.jsx';
import ProductionBoard from './pages/ProductionBoard.jsx';
import DeliveryManagement from './pages/DeliveryManagement.jsx';
import Statistics from './pages/Statistics.jsx';
import { api } from './api.js';

export default function App() {
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await api.getNotifications();
      setNotifications(res.data);
    } catch (e) {
      console.error('加载通知失败', e);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      loadNotifications();
    } catch (e) {
      console.error(e);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      await api.markNotificationRead(notif.id);
      loadNotifications();
      if (notif.orderId) {
        if (notif.type === 'delivery_update') {
          navigate('/delivery');
        } else {
          navigate('/orders');
        }
      }
      setShowNotifications(false);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🧁</span>
            <span>手工烘焙私房蛋糕</span>
          </div>
          <nav className="nav-menu">
            <NavLink to="/" end className="nav-link">蛋糕目录</NavLink>
            <NavLink to="/orders" className="nav-link">订单排期</NavLink>
            <NavLink to="/production" className="nav-link">生产看板</NavLink>
            <NavLink to="/delivery" className="nav-link">配送管理</NavLink>
            <NavLink to="/stats" className="nav-link">统计分析</NavLink>
            <button
              className="nav-link"
              style={{ position: 'relative' }}
              onClick={() => setShowNotifications(!showNotifications)}
            >
              🔔 通知
              {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>
          </nav>
        </div>
      </header>

      {showNotifications && (
        <div className="notifications-dropdown" style={{ position: 'absolute', right: 24 }}>
          <div className="notification-header">
            <span className="notification-header-title">通知中心</span>
            {unreadCount > 0 && (
              <button className="btn btn-sm btn-secondary" onClick={handleMarkAllRead}>
                全部已读
              </button>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="empty-state" style={{ padding: '30px 20px' }}>
              <div className="empty-state-icon">📭</div>
              <div className="empty-state-text">暂无通知</div>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n.id}
                className={`notification-item ${n.read ? '' : 'unread'}`}
                onClick={() => handleNotificationClick(n)}
              >
                <div className="notification-message">{n.message}</div>
                <div className="notification-time">{n.time}</div>
              </div>
            ))
          )}
        </div>
      )}

      <main className="main-content">
        <Routes>
          <Route path="/" element={<CakeCatalog />} />
          <Route path="/orders" element={<OrderSchedule />} />
          <Route path="/production" element={<ProductionBoard />} />
          <Route path="/delivery" element={<DeliveryManagement />} />
          <Route path="/stats" element={<Statistics />} />
        </Routes>
      </main>
    </div>
  );
}
