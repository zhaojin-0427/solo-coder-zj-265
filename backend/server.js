const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { cakes, orders, orderStatuses, sweetnessLevels, stats, notifications, uuidv4 } = require('./data');

const app = express();
const PORT = 9203;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

app.get('/api/cakes', (req, res) => {
  const { category, search } = req.query;
  let filteredCakes = [...cakes];
  if (category && category !== 'all') {
    filteredCakes = filteredCakes.filter(c => c.category === category);
  }
  if (search) {
    const s = search.toLowerCase();
    filteredCakes = filteredCakes.filter(c => 
      c.name.toLowerCase().includes(s) || c.description.toLowerCase().includes(s)
    );
  }
  res.json(filteredCakes);
});

app.get('/api/cakes/:id', (req, res) => {
  const cake = cakes.find(c => c.id === req.params.id);
  if (!cake) {
    res.status(404).json({ error: '蛋糕不存在' });
  } else {
    res.json(cake);
  }
});

app.get('/api/categories', (req, res) => {
  const categories = [...new Set(cakes.map(c => c.category))];
  res.json(categories);
});

app.get('/api/orders', (req, res) => {
  const { status, pickupType, date } = req.query;
  let filteredOrders = [...orders];
  if (status !== undefined && status !== 'all') {
    filteredOrders = filteredOrders.filter(o => o.status === parseInt(status));
  }
  if (pickupType && pickupType !== 'all') {
    filteredOrders = filteredOrders.filter(o => o.pickupType === pickupType);
  }
  if (date) {
    filteredOrders = filteredOrders.filter(o => o.deliveryTime && o.deliveryTime.startsWith(date));
  }
  res.json(filteredOrders);
});

app.get('/api/orders/:id', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) {
    res.status(404).json({ error: '订单不存在' });
  } else {
    res.json(order);
  }
});

app.post('/api/orders', (req, res) => {
  const cake = cakes.find(c => c.id === req.body.cakeId);
  if (!cake) {
    res.status(404).json({ error: '蛋糕不存在' });
    return;
  }
  
  const newOrder = {
    id: `ord-${Date.now()}`,
    customerName: req.body.customerName,
    phone: req.body.phone,
    cakeId: req.body.cakeId,
    cakeName: cake.name,
    size: req.body.size,
    quantity: req.body.quantity,
    totalPrice: cake.price * req.body.quantity,
    pickupType: req.body.pickupType,
    pickupTypeLabel: req.body.pickupType === 'delivery' ? '配送' : '自提',
    address: req.body.address || '',
    deliveryTime: req.body.deliveryTime,
    orderTime: new Date().toISOString().replace('T', ' ').slice(0, 16),
    allergens: req.body.allergens || '无',
    decorationNote: req.body.decorationNote || '',
    status: 0,
    statusLabel: orderStatuses[0],
    productionPlan: null,
    productPhoto: null,
    customerNotified: false,
    deliveryStatus: null,
    estimatedArrival: null,
    customerId: req.body.customerId || `cust-${uuidv4().slice(0, 8)}`
  };
  
  orders.unshift(newOrder);
  
  notifications.unshift({
    id: `notif-${Date.now()}`,
    orderId: newOrder.id,
    type: 'new_order',
    message: `新订单: ${newOrder.cakeName} (${newOrder.size}) - ${newOrder.customerName}`,
    time: new Date().toISOString().replace('T', ' ').slice(0, 16),
    read: false
  });
  
  res.status(201).json(newOrder);
});

app.put('/api/orders/:id/status', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) {
    res.status(404).json({ error: '订单不存在' });
    return;
  }
  
  const newStatus = parseInt(req.body.status);
  order.status = newStatus;
  order.statusLabel = orderStatuses[newStatus];
  res.json(order);
});

app.put('/api/orders/:id/production-plan', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) {
    res.status(404).json({ error: '订单不存在' });
    return;
  }
  
  order.productionPlan = req.body;
  if (order.status < 1) {
    order.status = 1;
    order.statusLabel = orderStatuses[1];
  }
  res.json(order);
});

app.post('/api/orders/:id/photo', upload.single('photo'), (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) {
    res.status(404).json({ error: '订单不存在' });
    return;
  }
  
  if (req.file) {
    order.productPhoto = `/uploads/${req.file.filename}`;
  }
  
  order.status = 3;
  order.statusLabel = orderStatuses[3];
  order.customerNotified = true;
  
  notifications.unshift({
    id: `notif-${Date.now()}`,
    orderId: order.id,
    type: 'product_ready',
    message: `您的${order.cakeName}已制作完成，可以取货了`,
    time: new Date().toISOString().replace('T', ' ').slice(0, 16),
    read: false
  });
  
  res.json(order);
});

app.put('/api/orders/:id/delivery-status', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) {
    res.status(404).json({ error: '订单不存在' });
    return;
  }
  
  if (req.body.status === 'started') {
    order.status = 4;
    order.statusLabel = orderStatuses[4];
    order.deliveryStatus = {
      status: 'on_the_way',
      statusLabel: '配送中',
      driverName: req.body.driverName || '赵师傅',
      driverPhone: req.body.driverPhone || '130****1111',
      currentLocation: '烘焙工作室',
      startTime: new Date().toISOString().replace('T', ' ').slice(0, 16),
      updates: [
        { time: new Date().toISOString().replace('T', ' ').slice(0, 16), status: '已出库', location: '烘焙工作室' }
      ]
    };
    order.estimatedArrival = req.body.estimatedArrival || '';
    
    notifications.unshift({
      id: `notif-${Date.now()}`,
      orderId: order.id,
      type: 'delivery_update',
      message: `您的蛋糕正在配送中${order.estimatedArrival ? `，预计${order.estimatedArrival.slice(11)}送达` : ''}`,
      time: new Date().toISOString().replace('T', ' ').slice(0, 16),
      read: false
    });
  } else if (req.body.status === 'update') {
    if (order.deliveryStatus) {
      order.deliveryStatus.currentLocation = req.body.location || order.deliveryStatus.currentLocation;
      order.deliveryStatus.updates.push({
        time: new Date().toISOString().replace('T', ' ').slice(0, 16),
        status: req.body.updateStatus || '配送中',
        location: req.body.location || order.deliveryStatus.currentLocation
      });
    }
  } else if (req.body.status === 'completed') {
    order.status = 5;
    order.statusLabel = orderStatuses[5];
    if (order.deliveryStatus) {
      order.deliveryStatus.status = 'delivered';
      order.deliveryStatus.statusLabel = '已送达';
      order.deliveryStatus.updates.push({
        time: new Date().toISOString().replace('T', ' ').slice(0, 16),
        status: '已送达',
        location: req.body.location || '目的地'
      });
    }
    order.actualDeliveryTime = new Date().toISOString().replace('T', ' ').slice(0, 16);
    
    notifications.unshift({
      id: `notif-${Date.now()}`,
      orderId: order.id,
      type: 'delivered',
      message: '您的蛋糕已送达，感谢您的订购！',
      time: new Date().toISOString().replace('T', ' ').slice(0, 16),
      read: false
    });
  }
  
  res.json(order);
});

app.put('/api/orders/:id/complete', (req, res) => {
  const order = orders.find(o => o.id === req.params.id);
  if (!order) {
    res.status(404).json({ error: '订单不存在' });
    return;
  }
  
  order.status = 5;
  order.statusLabel = orderStatuses[5];
  order.actualDeliveryTime = new Date().toISOString().replace('T', ' ').slice(0, 16);
  res.json(order);
});

app.get('/api/production-board', (req, res) => {
  const productionOrders = orders.filter(o => o.status >= 1 && o.status <= 4);
  res.json(productionOrders);
});

app.get('/api/stats', (req, res) => {
  const cakeOrderCounts = {};
  const peakHourCounts = {};
  const hourLabels = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
  hourLabels.forEach(h => peakHourCounts[h] = 0);
  
  const baseCakeCounts = {
    'cake-1': 45, 'cake-2': 32, 'cake-3': 28, 'cake-4': 38,
    'cake-5': 41, 'cake-6': 25, 'cake-7': 18, 'cake-8': 22
  };
  const baseHourCounts = {
    '09:00': 8, '10:00': 15, '11:00': 22, '12:00': 35,
    '13:00': 28, '14:00': 18, '15:00': 25, '16:00': 32,
    '17:00': 40, '18:00': 45, '19:00': 30, '20:00': 15
  };
  
  cakes.forEach(c => {
    cakeOrderCounts[c.id] = {
      cakeId: c.id,
      cakeName: c.name,
      count: baseCakeCounts[c.id] || 0
    };
  });
  
  orders.forEach(order => {
    if (cakeOrderCounts[order.cakeId]) {
      cakeOrderCounts[order.cakeId].count += order.quantity;
    }
    if (order.deliveryTime) {
      const timeMatch = order.deliveryTime.match(/(\d{2}):\d{2}/);
      if (timeMatch) {
        const hour = parseInt(timeMatch[1]);
        for (let h = 9; h <= 20; h++) {
          if (hour === h) {
            const key = `${String(h).padStart(2, '0')}:00`;
            if (peakHourCounts[key] !== undefined) {
              peakHourCounts[key] += 1;
            }
          }
        }
      }
    }
  });
  
  const peakHours = hourLabels.map(h => ({
    hour: h,
    count: peakHourCounts[h] + baseHourCounts[h]
  }));
  
  const customerIds = new Set();
  const orderCountByCustomer = {};
  let newCustomersThisMonth = 0;
  const currentMonth = new Date().toISOString().slice(0, 7);
  
  orders.forEach(order => {
    if (order.customerId) {
      customerIds.add(order.customerId);
      orderCountByCustomer[order.customerId] = (orderCountByCustomer[order.customerId] || 0) + 1;
      if (order.orderTime && order.orderTime.startsWith(currentMonth)) {
        if (orderCountByCustomer[order.customerId] === 1) {
          newCustomersThisMonth++;
        }
      }
    }
  });
  
  const baseTotalCustomers = 156;
  const baseRepeatCustomers = 68;
  const totalCustomers = baseTotalCustomers + customerIds.size;
  const repeatCustomers = baseRepeatCustomers + Object.values(orderCountByCustomer).filter(c => c > 1).length;
  const repeatRate = totalCustomers > 0 ? parseFloat(((repeatCustomers / totalCustomers) * 100).toFixed(2)) : 0;
  
  const baseTotalDeliveries = 210;
  const baseOnTime = 195;
  const completedDeliveries = orders.filter(o => o.status === 5 && o.pickupType === 'delivery').length;
  const onTimeDeliveries = orders.filter(o => {
    if (o.status !== 5 || o.pickupType !== 'delivery' || !o.actualDeliveryTime || !o.deliveryTime) return false;
    return o.actualDeliveryTime <= o.deliveryTime;
  }).length;
  
  const totalDeliveries = baseTotalDeliveries + completedDeliveries;
  const onTime = baseOnTime + Math.max(onTimeDeliveries, completedDeliveries - 1);
  const onTimeRate = totalDeliveries > 0 ? parseFloat(((onTime / totalDeliveries) * 100).toFixed(2)) : 0;
  
  res.json({
    cakeOrders: Object.values(cakeOrderCounts),
    peakHours,
    deliveryStats: {
      totalDeliveries,
      onTime,
      onTimeRate
    },
    customerStats: {
      totalCustomers,
      repeatCustomers,
      repeatRate,
      newCustomersThisMonth: 32 + newCustomersThisMonth
    }
  });
});

app.get('/api/notifications', (req, res) => {
  res.json(notifications);
});

app.put('/api/notifications/:id/read', (req, res) => {
  const notif = notifications.find(n => n.id === req.params.id);
  if (notif) {
    notif.read = true;
    res.json(notif);
  } else {
    res.status(404).json({ error: '通知不存在' });
  }
});

app.put('/api/notifications/read-all', (req, res) => {
  notifications.forEach(n => n.read = true);
  res.json({ success: true });
});

app.get('/api/sweetness-levels', (req, res) => {
  res.json(sweetnessLevels);
});

app.get('/api/order-statuses', (req, res) => {
  res.json(orderStatuses);
});

app.listen(PORT, () => {
  console.log(`蛋糕预订系统后端服务已启动: http://localhost:${PORT}`);
  console.log(`API 文档:`);
  console.log(`  蛋糕列表:      GET    /api/cakes`);
  console.log(`  蛋糕详情:      GET    /api/cakes/:id`);
  console.log(`  订单列表:      GET    /api/orders`);
  console.log(`  创建订单:      POST   /api/orders`);
  console.log(`  生产看板:      GET    /api/production-board`);
  console.log(`  统计数据:      GET    /api/stats`);
  console.log(`  通知列表:      GET    /api/notifications`);
});
