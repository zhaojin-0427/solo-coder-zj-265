const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const {
  cakes, orders, orderStatuses, sweetnessLevels, stats, notifications, uuidv4,
  sizeProductionTime, festivalSlots, dailyCapacity, bookingLogs,
  memberTiers, members, subscriptionPlans, subscriptionFulfillments,
  enterpriseContracts, groupPurchaseSubOrders, approvals, approvalStatuses,
  billingRecords
} = require('./data');

const createOrderFromSource = (orderData, sourceType, sourceId) => {
  const cake = cakes.find(c => c.id === orderData.cakeId);
  if (!cake) return null;
  const newOrder = {
    id: `ord-${Date.now()}-${uuidv4().slice(0, 6)}`,
    customerName: orderData.customerName,
    phone: orderData.phone,
    cakeId: orderData.cakeId,
    cakeName: cake.name,
    size: orderData.size,
    quantity: orderData.quantity || 1,
    totalPrice: orderData.totalPrice || cake.price * (orderData.quantity || 1),
    pickupType: orderData.pickupType || 'delivery',
    pickupTypeLabel: orderData.pickupType === 'pickup' ? '自提' : '配送',
    address: orderData.address || '',
    deliveryTime: orderData.deliveryTime,
    orderTime: new Date().toISOString().replace('T', ' ').slice(0, 16),
    allergens: orderData.allergens || '无',
    decorationNote: orderData.decorationNote || '',
    status: 0,
    statusLabel: orderStatuses[0],
    productionPlan: null,
    productPhoto: null,
    customerNotified: false,
    deliveryStatus: null,
    estimatedArrival: null,
    customerId: orderData.customerId || `cust-${uuidv4().slice(0, 8)}`,
    sourceType,
    sourceId
  };
  orders.unshift(newOrder);
  notifications.unshift({
    id: `notif-${Date.now()}-${uuidv4().slice(0, 6)}`,
    orderId: newOrder.id,
    type: 'new_order',
    message: `新${sourceType === 'subscription' ? '订阅' : sourceType === 'group' ? '团购' : ''}订单: ${newOrder.cakeName} (${newOrder.size}) - ${newOrder.customerName}`,
    time: newOrder.orderTime,
    read: false
  });
  return newOrder;
};

const calcProductionHours = (cakeId, size, quantity = 1) => {
  const cake = cakes.find(c => c.id === cakeId);
  if (!cake) return 0;
  const sizeHours = sizeProductionTime[size] || 2;
  return (cake.baseProductionHours + sizeHours) * quantity;
};

const getFestivalByDate = (dateStr) => {
  const d = dateStr.slice(0, 10);
  return festivalSlots.find(f => f.isActive && d >= f.startDate && d <= f.endDate);
};

const getDailyCapacity = (dateStr) => {
  const d = dateStr.slice(0, 10);
  if (dailyCapacity.dateOverrides[d]) {
    return dailyCapacity.dateOverrides[d];
  }
  const festival = getFestivalByDate(d);
  const multiplier = festival ? festival.capacityMultiplier : 1;
  return {
    dailyHours: Math.round(dailyCapacity.defaultDailyHours * multiplier),
    dailyOrders: Math.round(dailyCapacity.defaultDailyOrders * multiplier),
    workStart: dailyCapacity.workStart,
    workEnd: dailyCapacity.workEnd,
    festival
  };
};

const getDateUsage = (dateStr) => {
  const d = dateStr.slice(0, 10);
  const dayOrders = orders.filter(o => o.status !== 6 && o.deliveryTime && o.deliveryTime.startsWith(d));
  let usedHours = 0;
  const allergenMap = {};
  dayOrders.forEach(o => {
    usedHours += calcProductionHours(o.cakeId, o.size, o.quantity);
    if (o.allergens && o.allergens !== '无') {
      allergenMap[o.allergens] = (allergenMap[o.allergens] || 0) + 1;
    }
  });
  const cap = getDailyCapacity(d);
  return {
    date: d,
    festival: cap.festival,
    totalOrders: dayOrders.length,
    capacityOrders: cap.dailyOrders,
    usedHours: parseFloat(usedHours.toFixed(1)),
    capacityHours: cap.dailyHours,
    orders: dayOrders,
    allergenMap,
    utilization: cap.dailyHours > 0 ? parseFloat(((usedHours / cap.dailyHours) * 100).toFixed(1)) : 0,
    orderUtilization: cap.dailyOrders > 0 ? parseFloat(((dayOrders.length / cap.dailyOrders) * 100).toFixed(1)) : 0
  };
};

const getAvailableSlots = (cakeId, size, quantity, pickupType, startDate, days = 14) => {
  const cake = cakes.find(c => c.id === cakeId);
  if (!cake) return [];
  const reqHours = calcProductionHours(cakeId, size, quantity);
  const slots = [];
  const today = new Date(startDate || new Date());
  const advHours = cake.advanceBookingHours;
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const usage = getDateUsage(dateStr);
    const earliest = new Date();
    earliest.setHours(earliest.getHours() + advHours);
    const dateObj = new Date(dateStr + 'T23:59:59');
    if (dateObj < earliest) continue;
    const hoursLeft = usage.capacityHours - usage.usedHours;
    const ordersLeft = usage.capacityOrders - usage.totalOrders;
    if (hoursLeft >= reqHours && ordersLeft >= quantity) {
      slots.push({
        date: dateStr,
        festival: usage.festival,
        available: true,
        hoursLeft: parseFloat(hoursLeft.toFixed(1)),
        ordersLeft,
        utilization: usage.utilization
      });
    } else {
      slots.push({
        date: dateStr,
        festival: usage.festival,
        available: false,
        hoursLeft: parseFloat(Math.max(0, hoursLeft).toFixed(1)),
        ordersLeft: Math.max(0, ordersLeft),
        utilization: usage.utilization,
        reason: hoursLeft < reqHours ? '产能工时不足' : '当日订单已满'
      });
    }
  }
  return slots;
};

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
  
  const festivalOrderCounts = {};
  festivalSlots.forEach(f => {
    festivalOrderCounts[f.id] = {
      festivalId: f.id,
      festivalName: f.name,
      count: 0
    };
  });
  orders.forEach(order => {
    if (order.deliveryTime) {
      const d = order.deliveryTime.slice(0, 10);
      const fest = festivalSlots.find(f => d >= f.startDate && d <= f.endDate);
      if (fest && festivalOrderCounts[fest.id]) {
        festivalOrderCounts[fest.id].count += order.quantity;
      }
    }
  });

  const baseFestival = {
    'fest-1': 28, 'fest-2': 35, 'fest-3': 22, 'fest-4': 30, 'fest-5': 40
  };
  Object.values(festivalOrderCounts).forEach(f => {
    f.count += baseFestival[f.festivalId] || 0;
  });

  const rejectedBookings = bookingLogs.filter(b => b.type === 'rejected').length;
  const rescheduledBookings = bookingLogs.filter(b => b.type === 'rescheduled').length;
  const baseRejected = 12;
  const baseRescheduled = 8;

  const recent30Days = [];
  const totalCapacity = [];
  const avgUtilizationData = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const usage = getDateUsage(dateStr);
    recent30Days.push({
      date: dateStr,
      utilization: usage.utilization || 0,
      orders: usage.totalOrders || 0
    });
  }

  const avgUtilization = recent30Days.reduce((s, d) => s + d.utilization, 0) / (recent30Days.length || 1);

  const allergenStats = {};
  const baseAllergens = { '乳制品': 15, '坚果': 8, '花生': 10, '鸡蛋': 6, '小麦': 4, '乳糖': 5 };
  Object.assign(allergenStats, baseAllergens);
  orders.forEach(o => {
    if (o.allergens && o.allergens !== '无') {
      allergenStats[o.allergens] = (allergenStats[o.allergens] || 0) + 1;
    }
  });

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
    },
    festivalStats: {
      festivalOrders: Object.values(festivalOrderCounts),
      totalFestivalOrders: Object.values(festivalOrderCounts).reduce((s, f) => s + f.count, 0)
    },
    capacityStats: {
      avgUtilization: parseFloat(avgUtilization.toFixed(1)),
      dailyUtilization: recent30Days,
      defaultDailyHours: dailyCapacity.defaultDailyHours,
      defaultDailyOrders: dailyCapacity.defaultDailyOrders
    },
    bookingStats: {
      rejectedCount: baseRejected + rejectedBookings,
      rescheduledCount: baseRescheduled + rescheduledBookings,
      total: baseRejected + rejectedBookings + baseRescheduled + rescheduledBookings,
      logs: bookingLogs.slice(0, 20)
    },
    popularSlots: festivalSlots.map(f => {
      const fo = festivalOrderCounts[f.id];
      return {
        festivalId: f.id,
        festivalName: f.name,
        startDate: f.startDate,
        endDate: f.endDate,
        orderCount: fo ? fo.count : 0,
        capacityMultiplier: f.capacityMultiplier
      };
    }).sort((a, b) => b.orderCount - a.orderCount),
    allergenStats: Object.entries(allergenStats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
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

app.get('/api/festivals', (req, res) => {
  res.json(festivalSlots);
});

app.post('/api/festivals', (req, res) => {
  const fest = {
    id: `fest-${Date.now()}`,
    name: req.body.name,
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    description: req.body.description || '',
    capacityMultiplier: parseFloat(req.body.capacityMultiplier) || 1,
    specialCakes: req.body.specialCakes || [],
    isActive: req.body.isActive !== false
  };
  festivalSlots.push(fest);
  res.status(201).json(fest);
});

app.put('/api/festivals/:id', (req, res) => {
  const fest = festivalSlots.find(f => f.id === req.params.id);
  if (!fest) {
    res.status(404).json({ error: '节日档期不存在' });
    return;
  }
  Object.assign(fest, req.body);
  res.json(fest);
});

app.delete('/api/festivals/:id', (req, res) => {
  const idx = festivalSlots.findIndex(f => f.id === req.params.id);
  if (idx === -1) {
    res.status(404).json({ error: '节日档期不存在' });
    return;
  }
  festivalSlots.splice(idx, 1);
  res.json({ success: true });
});

app.get('/api/capacity', (req, res) => {
  res.json({
    ...dailyCapacity,
    sizeProductionTime
  });
});

app.put('/api/capacity', (req, res) => {
  if (req.body.defaultDailyHours !== undefined) dailyCapacity.defaultDailyHours = parseInt(req.body.defaultDailyHours);
  if (req.body.defaultDailyOrders !== undefined) dailyCapacity.defaultDailyOrders = parseInt(req.body.defaultDailyOrders);
  if (req.body.workStart !== undefined) dailyCapacity.workStart = req.body.workStart;
  if (req.body.workEnd !== undefined) dailyCapacity.workEnd = req.body.workEnd;
  res.json(dailyCapacity);
});

app.put('/api/capacity/date/:date', (req, res) => {
  const d = req.params.date;
  dailyCapacity.dateOverrides[d] = {
    dailyHours: parseInt(req.body.dailyHours),
    dailyOrders: parseInt(req.body.dailyOrders),
    workStart: req.body.workStart || dailyCapacity.workStart,
    workEnd: req.body.workEnd || dailyCapacity.workEnd
  };
  res.json(dailyCapacity.dateOverrides[d]);
});

app.delete('/api/capacity/date/:date', (req, res) => {
  delete dailyCapacity.dateOverrides[req.params.date];
  res.json({ success: true });
});

app.put('/api/cakes/:id/production', (req, res) => {
  const cake = cakes.find(c => c.id === req.params.id);
  if (!cake) {
    res.status(404).json({ error: '蛋糕不存在' });
    return;
  }
  if (req.body.baseProductionHours !== undefined) cake.baseProductionHours = parseInt(req.body.baseProductionHours);
  if (req.body.advanceBookingHours !== undefined) cake.advanceBookingHours = parseInt(req.body.advanceBookingHours);
  if (req.body.commonAllergens !== undefined) cake.commonAllergens = req.body.commonAllergens;
  res.json(cake);
});

app.post('/api/booking/check', (req, res) => {
  const { cakeId, size, quantity, pickupType, deliveryTime } = req.body;
  const cake = cakes.find(c => c.id === cakeId);
  if (!cake) {
    res.status(404).json({ error: '蛋糕不存在' });
    return;
  }
  const errors = [];
  const warnings = [];
  const now = new Date();
  const delivery = new Date(deliveryTime.replace(' ', 'T'));
  const diffHours = (delivery - now) / (1000 * 60 * 60);
  if (diffHours < cake.advanceBookingHours) {
    errors.push(`该款式需提前 ${cake.advanceBookingHours} 小时预订，当前仅提前 ${Math.round(diffHours)} 小时`);
  }
  if (delivery.getHours() < 8 || delivery.getHours() >= 20) {
    warnings.push('取货时间建议在 08:00-20:00 之间');
  }
  const usage = getDateUsage(deliveryTime);
  const reqHours = calcProductionHours(cakeId, size, quantity);
  const hoursLeft = usage.capacityHours - usage.usedHours;
  const ordersLeft = usage.capacityOrders - usage.totalOrders;
  if (hoursLeft < reqHours) {
    errors.push(`当日产能工时不足，需要 ${reqHours} 小时，剩余 ${Math.max(0, hoursLeft).toFixed(1)} 小时`);
  }
  if (ordersLeft < quantity) {
    errors.push(`当日订单已满，最多可接 ${Math.max(0, ordersLeft)} 单`);
  }
  if (usage.utilization >= 85) {
    warnings.push(`当日产能利用率已达 ${usage.utilization}%，排期较紧张`);
  }
  const festival = getFestivalByDate(deliveryTime);
  if (festival) {
    warnings.push(`${deliveryTime.slice(0, 10)} 正处于「${festival.name}」档期`);
  }
  const similarCakes = [];
  if (errors.length > 0) {
    const addCakeIfAvail = (c, days = 14) => {
      if (c.id === cakeId) return false;
      if (similarCakes.find(s => s.cakeId === c.id)) return false;
      const s = getAvailableSlots(c.id, size, quantity, pickupType, deliveryTime, days);
      const firstAvail = s.find(x => x.available);
      if (firstAvail) {
        similarCakes.push({
          cakeId: c.id,
          cakeName: c.name,
          price: c.price,
          image: c.image,
          baseProductionHours: c.baseProductionHours,
          advanceBookingHours: c.advanceBookingHours,
          suggestedDate: firstAvail.date
        });
        return true;
      }
      return false;
    };

    cakes.forEach(c => {
      if (c.category === cake.category) addCakeIfAvail(c, 14);
    });

    if (similarCakes.length < 3) {
      const minPrice = cake.price * 0.7;
      const maxPrice = cake.price * 1.3;
      cakes.forEach(c => {
        if (c.category !== cake.category && c.price >= minPrice && c.price <= maxPrice) {
          addCakeIfAvail(c, 14);
        }
      });
    }

    if (similarCakes.length < 3) {
      for (const c of cakes) {
        if (addCakeIfAvail(c, 30)) {
          if (similarCakes.length >= 3) break;
        }
      }
    }
  }
  const alternativeSlots = getAvailableSlots(cakeId, size, quantity, pickupType, deliveryTime, 10)
    .filter(s => s.available)
    .slice(0, 5);
  if (errors.length > 0 && alternativeSlots.length === 0) {
    bookingLogs.push({
      id: `blog-${Date.now()}`,
      type: 'rejected',
      cakeId,
      cakeName: cake.name,
      customerName: req.body.customerName || '潜在客户',
      requestedTime: deliveryTime,
      reason: errors.join('; '),
      time: new Date().toISOString().replace('T', ' ').slice(0, 16)
    });
  }
  res.json({
    valid: errors.length === 0,
    errors,
    warnings,
    requiredHours: reqHours,
    advanceBookingHours: cake.advanceBookingHours,
    dailyUsage: {
      date: usage.date,
      usedHours: usage.usedHours,
      capacityHours: usage.capacityHours,
      totalOrders: usage.totalOrders,
      capacityOrders: usage.capacityOrders,
      utilization: usage.utilization,
      festival: usage.festival
    },
    alternativeSlots,
    similarCakes: similarCakes.slice(0, 3)
  });
});

app.get('/api/schedule/overview', (req, res) => {
  const { startDate, days = 7 } = req.query;
  const result = [];
  const base = new Date(startDate || new Date());
  for (let i = 0; i < parseInt(days); i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().slice(0, 10);
    const usage = getDateUsage(dateStr);
    result.push({
      date: dateStr,
      festival: usage.festival,
      totalOrders: usage.totalOrders,
      capacityOrders: usage.capacityOrders,
      usedHours: usage.usedHours,
      capacityHours: usage.capacityHours,
      utilization: usage.utilization,
      orderUtilization: usage.orderUtilization,
      oversold: usage.utilization >= 100 || usage.orderUtilization >= 100,
      risk: usage.utilization >= 85 ? usage.utilization >= 100 ? 'high' : 'medium' : 'low',
      allergens: Object.entries(usage.allergenMap).map(([k, v]) => ({ name: k, count: v }))
    });
  }
  res.json(result);
});

app.get('/api/production-board/sorted', (req, res) => {
  const productionOrders = orders
    .filter(o => o.status >= 1 && o.status <= 4)
    .map(o => {
      const hours = calcProductionHours(o.cakeId, o.size, o.quantity);
      const now = new Date();
      const delivery = new Date((o.deliveryTime || '').replace(' ', 'T'));
      const hoursToDelivery = (delivery - now) / (1000 * 60 * 60);
      let urgency = 'normal';
      if (hoursToDelivery < 0) {
        urgency = 'overdue';
      } else if (hoursToDelivery < 6) {
        urgency = 'critical';
      } else if (hoursToDelivery < 24) {
        urgency = 'urgent';
      } else if (hoursToDelivery < 48) {
        urgency = 'soon';
      }
      return {
        ...o,
        productionHours: hours,
        hoursToDelivery: parseFloat(hoursToDelivery.toFixed(1)),
        urgency
      };
    })
    .sort((a, b) => {
      const urgencyWeight = { critical: 0, urgent: 1, soon: 2, normal: 3, overdue: 4 };
      if (urgencyWeight[a.urgency] !== urgencyWeight[b.urgency]) {
        return urgencyWeight[a.urgency] - urgencyWeight[b.urgency];
      }
      return a.hoursToDelivery - b.hoursToDelivery;
    });
  res.json(productionOrders);
});

app.get('/api/booking-logs', (req, res) => {
  res.json(bookingLogs);
});

app.post('/api/orders/reschedule', (req, res) => {
  const { orderId, newTime, reason } = req.body;
  const order = orders.find(o => o.id === orderId);
  if (!order) {
    res.status(404).json({ error: '订单不存在' });
    return;
  }
  bookingLogs.push({
    id: `blog-${Date.now()}`,
    type: 'rescheduled',
    orderId,
    cakeName: order.cakeName,
    customerName: order.customerName,
    originalTime: order.deliveryTime,
    newTime,
    reason: reason || '客户改期',
    time: new Date().toISOString().replace('T', ' ').slice(0, 16)
  });
  order.deliveryTime = newTime;
  res.json(order);
});

app.get('/api/members', (req, res) => {
  const { status, search } = req.query;
  let filtered = [...members];
  if (status && status !== 'all') filtered = filtered.filter(m => m.status === status);
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(m => m.name.toLowerCase().includes(s) || m.phone.includes(s));
  }
  res.json(filtered);
});

app.get('/api/members/:id', (req, res) => {
  const member = members.find(m => m.id === req.params.id);
  if (!member) return res.status(404).json({ error: '会员不存在' });
  const memberSubscriptions = subscriptionPlans.filter(s => s.memberId === member.id);
  const memberFulfillments = subscriptionFulfillments.filter(f => f.memberId === member.id);
  res.json({ ...member, subscriptions: memberSubscriptions, fulfillments: memberFulfillments });
});

app.post('/api/members', (req, res) => {
  let tier = 'tier-normal';
  let tierLabel = '普通会员';
  for (let i = memberTiers.length - 1; i >= 0; i--) {
    if ((req.body.totalSpent || 0) >= memberTiers[i].minSpend) {
      tier = memberTiers[i].id;
      tierLabel = memberTiers[i].name;
      break;
    }
  }
  const newMember = {
    id: `mem-${Date.now()}`,
    name: req.body.name,
    phone: req.body.phone,
    tier,
    tierLabel,
    totalSpent: req.body.totalSpent || 0,
    joinDate: new Date().toISOString().slice(0, 10),
    birthday: req.body.birthday || '',
    email: req.body.email || '',
    allergens: req.body.allergens || '无',
    defaultAddress: req.body.defaultAddress || '',
    points: req.body.totalSpent || 0,
    status: 'active'
  };
  members.unshift(newMember);
  res.status(201).json(newMember);
});

app.put('/api/members/:id', (req, res) => {
  const member = members.find(m => m.id === req.params.id);
  if (!member) return res.status(404).json({ error: '会员不存在' });
  Object.assign(member, req.body);
  if (req.body.totalSpent !== undefined) {
    for (let i = memberTiers.length - 1; i >= 0; i--) {
      if (member.totalSpent >= memberTiers[i].minSpend) {
        member.tier = memberTiers[i].id;
        member.tierLabel = memberTiers[i].name;
        break;
      }
    }
    member.points = member.totalSpent;
  }
  res.json(member);
});

app.get('/api/member-tiers', (req, res) => {
  res.json(memberTiers);
});

app.get('/api/subscriptions', (req, res) => {
  const { status, memberId } = req.query;
  let filtered = [...subscriptionPlans];
  if (status && status !== 'all') filtered = filtered.filter(s => s.status === status);
  if (memberId) filtered = filtered.filter(s => s.memberId === memberId);
  res.json(filtered);
});

app.get('/api/subscriptions/:id', (req, res) => {
  const sub = subscriptionPlans.find(s => s.id === req.params.id);
  if (!sub) return res.status(404).json({ error: '订阅计划不存在' });
  const fulfillments = subscriptionFulfillments.filter(f => f.subscriptionId === sub.id);
  res.json({ ...sub, fulfillments });
});

app.post('/api/subscriptions', (req, res) => {
  const member = members.find(m => m.id === req.body.memberId);
  const planTypeLabels = { monthly: '月度订阅(4期)', quarterly: '季度订阅(12期)', yearly: '年度订阅(52期)' };
  const freqLabels = { weekly: '每周一次', biweekly: '每两周一次', monthly: '每月一次' };
  const totalPeriods = { monthly: 4, quarterly: 12, yearly: 52 };
  const basePrice = req.body.preferredCakes.reduce((sum, c) => {
    const cake = cakes.find(ck => ck.id === c.cakeId);
    return sum + (cake ? cake.price : 0);
  }, 0) / Math.max(req.body.preferredCakes.length, 1);
  const discount = member ? memberTiers.find(t => t.id === member.tier)?.discount || 1 : 1;
  const unitPrice = Math.round(basePrice * discount * 0.9);
  const tp = totalPeriods[req.body.planType] || 4;

  const newSub = {
    id: `sub-plan-${Date.now()}`,
    memberId: req.body.memberId,
    memberName: member ? member.name : req.body.memberName,
    planType: req.body.planType || 'monthly',
    planTypeLabel: planTypeLabels[req.body.planType] || planTypeLabels.monthly,
    frequency: req.body.frequency || 'weekly',
    frequencyLabel: freqLabels[req.body.frequency] || freqLabels.weekly,
    preferredCakes: req.body.preferredCakes || [],
    allergens: req.body.allergens || (member ? member.allergens : '无'),
    sweetnessPreference: req.body.sweetnessPreference || 3,
    defaultAddress: req.body.defaultAddress || (member ? member.defaultAddress : ''),
    deliveryTimePref: req.body.deliveryTimePref || '15:00',
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    totalPeriods: tp,
    fulfilledPeriods: 0,
    skippedPeriods: [],
    pausedPeriods: [],
    isPaused: false,
    pauseReason: '',
    unitPrice,
    totalPrice: unitPrice * tp,
    paidAmount: req.body.paidAmount || 0,
    status: 'active',
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
  };
  subscriptionPlans.unshift(newSub);

  billingRecords.unshift({
    id: `bill-${Date.now()}`,
    type: 'subscription',
    refId: newSub.id,
    refNo: newSub.planTypeLabel,
    customerName: newSub.memberName,
    amount: newSub.totalPrice,
    paymentMethod: req.body.paymentMethod || '微信支付',
    paymentStatus: req.body.paidAmount > 0 ? 'paid' : 'pending',
    paymentStatusLabel: req.body.paidAmount > 0 ? '已支付' : '待支付',
    paidTime: req.body.paidAmount > 0 ? new Date().toISOString().replace('T', ' ').slice(0, 16) : '',
    invoiceStatus: 'none',
    invoiceStatusLabel: '无需开票',
    period: new Date().toISOString().slice(0, 7),
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
  });

  if (member) {
    member.totalSpent += newSub.totalPrice;
    member.points += newSub.totalPrice;
    for (let i = memberTiers.length - 1; i >= 0; i--) {
      if (member.totalSpent >= memberTiers[i].minSpend) {
        member.tier = memberTiers[i].id;
        member.tierLabel = memberTiers[i].name;
        break;
      }
    }
  }

  res.status(201).json(newSub);
});

app.put('/api/subscriptions/:id/pause', (req, res) => {
  const sub = subscriptionPlans.find(s => s.id === req.params.id);
  if (!sub) return res.status(404).json({ error: '订阅计划不存在' });
  sub.isPaused = true;
  sub.pauseReason = req.body.reason || '会员申请暂停';
  sub.status = 'paused';
  notifications.unshift({
    id: `notif-${Date.now()}`,
    type: 'subscription_update',
    message: `订阅已暂停: ${sub.memberName} - ${sub.planTypeLabel}`,
    time: new Date().toISOString().replace('T', ' ').slice(0, 16),
    read: false
  });
  res.json(sub);
});

app.put('/api/subscriptions/:id/resume', (req, res) => {
  const sub = subscriptionPlans.find(s => s.id === req.params.id);
  if (!sub) return res.status(404).json({ error: '订阅计划不存在' });
  sub.isPaused = false;
  sub.pauseReason = '';
  sub.status = 'active';
  notifications.unshift({
    id: `notif-${Date.now()}`,
    type: 'subscription_update',
    message: `订阅已恢复: ${sub.memberName} - ${sub.planTypeLabel}`,
    time: new Date().toISOString().replace('T', ' ').slice(0, 16),
    read: false
  });
  res.json(sub);
});

app.put('/api/subscriptions/:id/skip', (req, res) => {
  const sub = subscriptionPlans.find(s => s.id === req.params.id);
  if (!sub) return res.status(404).json({ error: '订阅计划不存在' });
  const period = parseInt(req.body.period);
  if (!sub.skippedPeriods.includes(period)) {
    sub.skippedPeriods.push(period);
  }
  res.json(sub);
});

app.put('/api/subscriptions/:id/change-address', (req, res) => {
  const sub = subscriptionPlans.find(s => s.id === req.params.id);
  if (!sub) return res.status(404).json({ error: '订阅计划不存在' });
  if (req.body.period) {
    const ful = subscriptionFulfillments.find(
      f => f.subscriptionId === sub.id && f.period === parseInt(req.body.period)
    );
    if (ful) {
      ful.address = req.body.address;
      const linkedOrder = orders.find(o => o.id === ful.orderId);
      if (linkedOrder) linkedOrder.address = req.body.address;
    }
  } else {
    sub.defaultAddress = req.body.address;
  }
  res.json(sub);
});

app.post('/api/subscriptions/:id/generate-orders', (req, res) => {
  const sub = subscriptionPlans.find(s => s.id === req.params.id);
  if (!sub) return res.status(404).json({ error: '订阅计划不存在' });
  const member = members.find(m => m.id === sub.memberId);
  const generatedOrders = [];
  const startPeriod = sub.fulfilledPeriods + 1;
  const periodsToGenerate = req.body.periods || 1;

  for (let i = 0; i < periodsToGenerate; i++) {
    const period = startPeriod + i;
    if (period > sub.totalPeriods) break;
    if (sub.skippedPeriods.includes(period) || sub.pausedPeriods.includes(period)) continue;

    const prefCake = sub.preferredCakes[(period - 1) % sub.preferredCakes.length];
    const cake = cakes.find(c => c.id === prefCake.cakeId);
    if (!cake) continue;

    let deliveryDate = new Date(sub.startDate);
    if (sub.frequency === 'weekly') {
      deliveryDate.setDate(deliveryDate.getDate() + (period - 1) * 7);
    } else if (sub.frequency === 'biweekly') {
      deliveryDate.setDate(deliveryDate.getDate() + (period - 1) * 14);
    } else {
      deliveryDate.setMonth(deliveryDate.getMonth() + (period - 1));
    }
    const dateStr = deliveryDate.toISOString().slice(0, 10);
    const deliveryTime = `${dateStr} ${sub.deliveryTimePref}`;

    const orderData = {
      customerName: sub.memberName,
      phone: member ? member.phone : '',
      cakeId: prefCake.cakeId,
      size: prefCake.size,
      quantity: 1,
      totalPrice: sub.unitPrice,
      pickupType: sub.defaultAddress ? 'delivery' : 'pickup',
      address: sub.defaultAddress,
      deliveryTime,
      allergens: sub.allergens,
      decorationNote: `订阅第${period}期 甜度:${sweetnessLevels[sub.sweetnessPreference - 1] || ''}`,
      customerId: sub.memberId
    };

    const bookingCheckResp = { valid: true };
    try {
      const fakeReq = { body: { cakeId: prefCake.cakeId, size: prefCake.size, quantity: 1, deliveryTime } };
      const c = cakes.find(ck => ck.id === prefCake.cakeId);
      const now = new Date();
      const delivery = new Date(deliveryTime.replace(' ', 'T'));
      const diffHours = (delivery - now) / (1000 * 60 * 60);
      if (diffHours < (c?.advanceBookingHours || 24)) {
        bookingCheckResp.valid = false;
      }
    } catch (e) {}

    if (bookingCheckResp.valid) {
      const newOrder = createOrderFromSource(orderData, 'subscription', sub.id);
      if (newOrder) {
        generatedOrders.push(newOrder);
        const fulfillment = {
          id: `sub-ful-${Date.now()}-${i}`,
          subscriptionId: sub.id,
          memberId: sub.memberId,
          memberName: sub.memberName,
          period,
          cakeId: prefCake.cakeId,
          cakeName: cake.name,
          size: prefCake.size,
          quantity: 1,
          unitPrice: sub.unitPrice,
          address: sub.defaultAddress,
          deliveryTime,
          orderId: newOrder.id,
          status: 'pending',
          statusLabel: '待配送',
          note: ''
        };
        subscriptionFulfillments.push(fulfillment);
        sub.fulfilledPeriods = period;
      }
    }
  }
  res.json({ generated: generatedOrders.length, orders: generatedOrders });
});

app.get('/api/subscription-fulfillments', (req, res) => {
  const { subscriptionId, status } = req.query;
  let filtered = [...subscriptionFulfillments];
  if (subscriptionId) filtered = filtered.filter(f => f.subscriptionId === subscriptionId);
  if (status && status !== 'all') filtered = filtered.filter(f => f.status === status);
  res.json(filtered);
});

app.put('/api/subscription-fulfillments/:id/status', (req, res) => {
  const ful = subscriptionFulfillments.find(f => f.id === req.params.id);
  if (!ful) return res.status(404).json({ error: '履约记录不存在' });
  ful.status = req.body.status;
  const statusLabels = { pending: '待配送', fulfilled: '已履约', skipped: '已跳过', cancelled: '已取消' };
  ful.statusLabel = statusLabels[req.body.status] || ful.statusLabel;
  res.json(ful);
});

app.get('/api/enterprise-contracts', (req, res) => {
  const { status, search } = req.query;
  let filtered = [...enterpriseContracts];
  if (status && status !== 'all') filtered = filtered.filter(c => c.status === status);
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(c => c.companyName.toLowerCase().includes(s) || c.contractNo.toLowerCase().includes(s));
  }
  res.json(filtered);
});

app.get('/api/enterprise-contracts/:id', (req, res) => {
  const contract = enterpriseContracts.find(c => c.id === req.params.id);
  if (!contract) return res.status(404).json({ error: '企业合同不存在' });
  const subOrders = groupPurchaseSubOrders.filter(o => o.contractId === contract.id);
  res.json({ ...contract, subOrders });
});

app.post('/api/enterprise-contracts', (req, res) => {
  const newContract = {
    id: `ent-ctr-${Date.now()}`,
    companyName: req.body.companyName,
    contactPerson: req.body.contactPerson,
    contactPhone: req.body.contactPhone,
    contactEmail: req.body.contactEmail || '',
    contractNo: req.body.contractNo || `CTR-${Date.now()}`,
    totalBudget: parseFloat(req.body.totalBudget) || 0,
    usedBudget: 0,
    remainingBudget: parseFloat(req.body.totalBudget) || 0,
    invoiceInfo: req.body.invoiceInfo || {},
    departments: req.body.departments || [],
    startDate: req.body.startDate,
    endDate: req.body.endDate,
    status: 'pending',
    statusLabel: '待审批',
    approvalStatus: 0,
    approver: '',
    approvalTime: '',
    approvalRemark: '',
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    createdBy: req.body.createdBy || req.body.contactPerson
  };
  enterpriseContracts.unshift(newContract);

  const approval = {
    id: `apr-${Date.now()}`,
    refType: 'enterprise_contract',
    refId: newContract.id,
    title: `${newContract.companyName}团购合同审批`,
    applicant: newContract.createdBy,
    applicantPhone: newContract.contactPhone,
    amount: newContract.totalBudget,
    submitTime: newContract.createdAt,
    currentApprover: '财务李经理',
    approverRole: '财务审核',
    status: 'pending',
    statusLabel: '待审批',
    approvalTime: '',
    approvalRemark: '',
    flowSteps: [
      { step: 1, approver: '财务李经理', role: '财务审核', status: 'pending', time: '', remark: '' },
      { step: 2, approver: '运营王总监', role: '运营审核', status: 'waiting', time: '', remark: '' },
      { step: 3, approver: '张总', role: '总经理审批', status: 'waiting', time: '', remark: '' }
    ]
  };
  approvals.unshift(approval);

  notifications.unshift({
    id: `notif-${Date.now()}`,
    type: 'approval_request',
    message: `新合同待审批: ${newContract.companyName} - 金额¥${newContract.totalBudget}`,
    time: newContract.createdAt,
    read: false
  });

  res.status(201).json({ contract: newContract, approval });
});

app.get('/api/group-purchase-orders', (req, res) => {
  const { contractId, status, departmentId } = req.query;
  let filtered = [...groupPurchaseSubOrders];
  if (contractId) filtered = filtered.filter(o => o.contractId === contractId);
  if (status && status !== 'all') filtered = filtered.filter(o => o.status === status);
  if (departmentId) filtered = filtered.filter(o => o.departmentId === departmentId);
  res.json(filtered);
});

app.get('/api/group-purchase-orders/:id', (req, res) => {
  const order = groupPurchaseSubOrders.find(o => o.id === req.params.id);
  if (!order) return res.status(404).json({ error: '团购子订单不存在' });
  const linkedOrders = orders.filter(o => order.orderIds.includes(o.id));
  res.json({ ...order, linkedOrders });
});

app.post('/api/group-purchase-orders', (req, res) => {
  const contract = enterpriseContracts.find(c => c.id === req.body.contractId);
  if (!contract) return res.status(404).json({ error: '合同不存在' });
  if (contract.status !== 'approved') return res.status(400).json({ error: '合同未审批通过，无法创建团购订单' });

  const cake = cakes.find(c => c.id === req.body.cakeId);
  if (!cake) return res.status(404).json({ error: '蛋糕不存在' });

  const recipients = req.body.recipients || [];
  const totalPrice = req.body.unitPrice * recipients.length;

  if (contract.remainingBudget < totalPrice) {
    return res.status(400).json({ error: '合同剩余预算不足' });
  }

  const generatedOrderIds = [];
  const generatedOrders = [];

  for (let i = 0; i < recipients.length; i++) {
    const r = recipients[i];
    const order = createOrderFromSource({
      customerName: r.name,
      phone: r.phone,
      cakeId: req.body.cakeId,
      size: req.body.size,
      quantity: 1,
      totalPrice: req.body.unitPrice,
      pickupType: 'delivery',
      address: r.address,
      deliveryTime: req.body.deliveryTime,
      allergens: '无',
      decorationNote: `企业团购 - ${contract.companyName} - ${req.body.departmentName}`,
      customerId: `ent-${contract.id}`
    }, 'group', req.body.contractId);
    if (order) {
      generatedOrderIds.push(order.id);
      generatedOrders.push(order);
    }
  }

  const subOrder = {
    id: `gp-ord-${Date.now()}`,
    contractId: contract.id,
    companyName: contract.companyName,
    departmentId: req.body.departmentId,
    departmentName: req.body.departmentName,
    recipients,
    cakeId: req.body.cakeId,
    cakeName: cake.name,
    size: req.body.size,
    quantity: recipients.length,
    unitPrice: req.body.unitPrice,
    totalPrice,
    batchNo: req.body.batchNo || `batch-${Date.now()}`,
    deliveryBatch: req.body.deliveryBatch || 1,
    totalBatches: req.body.totalBatches || 1,
    deliveryTime: req.body.deliveryTime,
    deliveryStatus: 'pending',
    deliveryStatusLabel: '待配送',
    orderIds: generatedOrderIds,
    status: 'pending',
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
  };
  groupPurchaseSubOrders.unshift(subOrder);

  contract.usedBudget += totalPrice;
  contract.remainingBudget -= totalPrice;

  notifications.unshift({
    id: `notif-${Date.now()}`,
    type: 'group_order',
    message: `企业团购订单已生成: ${contract.companyName} - ${subOrder.departmentName} ${recipients.length}个`,
    time: new Date().toISOString().replace('T', ' ').slice(0, 16),
    read: false
  });

  res.status(201).json({ subOrder, generatedOrders });
});

app.put('/api/group-purchase-orders/:id/delivery-status', (req, res) => {
  const subOrder = groupPurchaseSubOrders.find(o => o.id === req.params.id);
  if (!subOrder) return res.status(404).json({ error: '团购子订单不存在' });

  subOrder.deliveryStatus = req.body.status;
  const statusLabels = { pending: '待配送', on_the_way: '配送中', delivered: '已送达', cancelled: '已取消' };
  subOrder.deliveryStatusLabel = statusLabels[req.body.status] || subOrder.deliveryStatusLabel;

  if (req.body.status === 'delivered') {
    subOrder.status = 'completed';
    subOrder.orderIds.forEach(oid => {
      const order = orders.find(o => o.id === oid);
      if (order) {
        order.status = 5;
        order.statusLabel = orderStatuses[5];
        order.actualDeliveryTime = new Date().toISOString().replace('T', ' ').slice(0, 16);
      }
    });
  } else if (req.body.status === 'on_the_way') {
    subOrder.orderIds.forEach(oid => {
      const order = orders.find(o => o.id === oid);
      if (order) {
        order.status = 4;
        order.statusLabel = orderStatuses[4];
        order.deliveryStatus = {
          status: 'on_the_way',
          statusLabel: '配送中',
          driverName: req.body.driverName || '企业配送',
          driverPhone: req.body.driverPhone || '',
          currentLocation: '已出库',
          startTime: new Date().toISOString().replace('T', ' ').slice(0, 16),
          updates: [{ time: new Date().toISOString().replace('T', ' ').slice(0, 16), status: '企业批量配送已出库', location: '烘焙工作室' }]
        };
      }
    });
  }

  notifications.unshift({
    id: `notif-${Date.now()}`,
    type: 'delivery_update',
    message: `企业团购配送状态变更: ${subOrder.companyName} ${subOrder.departmentName} - ${subOrder.deliveryStatusLabel}`,
    time: new Date().toISOString().replace('T', ' ').slice(0, 16),
    read: false
  });

  res.json(subOrder);
});

app.get('/api/approvals', (req, res) => {
  const { status, refType } = req.query;
  let filtered = [...approvals];
  if (status && status !== 'all') filtered = filtered.filter(a => a.status === status);
  if (refType) filtered = filtered.filter(a => a.refType === refType);
  res.json(filtered);
});

app.get('/api/approvals/:id', (req, res) => {
  const approval = approvals.find(a => a.id === req.params.id);
  if (!approval) return res.status(404).json({ error: '审批不存在' });
  res.json(approval);
});

app.put('/api/approvals/:id/approve', (req, res) => {
  const approval = approvals.find(a => a.id === req.params.id);
  if (!approval) return res.status(404).json({ error: '审批不存在' });

  const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
  for (let i = 0; i < approval.flowSteps.length; i++) {
    if (approval.flowSteps[i].status === 'pending') {
      approval.flowSteps[i].status = 'approved';
      approval.flowSteps[i].time = now;
      approval.flowSteps[i].remark = req.body.remark || '审核通过';

      if (i < approval.flowSteps.length - 1) {
        approval.flowSteps[i + 1].status = 'pending';
        approval.currentApprover = approval.flowSteps[i + 1].approver;
        approval.approverRole = approval.flowSteps[i + 1].role;
        approval.status = 'in_progress';
        approval.statusLabel = '审批中';
      } else {
        approval.status = 'approved';
        approval.statusLabel = '已通过';
        approval.approvalTime = now;
        approval.approvalRemark = req.body.remark || '审批通过';

        if (approval.refType === 'enterprise_contract') {
          const contract = enterpriseContracts.find(c => c.id === approval.refId);
          if (contract) {
            contract.status = 'approved';
            contract.statusLabel = '已通过';
            contract.approvalStatus = 2;
            contract.approver = approval.flowSteps[i].approver;
            contract.approvalTime = now;
            contract.approvalRemark = req.body.remark || '审批通过';

            billingRecords.unshift({
              id: `bill-${Date.now()}`,
              type: 'enterprise',
              refId: contract.id,
              refNo: contract.contractNo,
              customerName: contract.companyName,
              amount: contract.totalBudget,
              paymentMethod: '对公转账',
              paymentStatus: 'pending',
              paymentStatusLabel: '待支付',
              paidTime: '',
              invoiceStatus: 'pending',
              invoiceStatusLabel: '待开票',
              period: new Date().toISOString().slice(0, 7),
              createdAt: now
            });
          }
        }
      }
      break;
    }
  }

  notifications.unshift({
    id: `notif-${Date.now()}`,
    type: 'approval_update',
    message: `审批${approval.status === 'approved' ? '已通过' : '进度更新'}: ${approval.title}`,
    time: now,
    read: false
  });

  res.json(approval);
});

app.put('/api/approvals/:id/reject', (req, res) => {
  const approval = approvals.find(a => a.id === req.params.id);
  if (!approval) return res.status(404).json({ error: '审批不存在' });

  const now = new Date().toISOString().replace('T', ' ').slice(0, 16);
  for (let i = 0; i < approval.flowSteps.length; i++) {
    if (approval.flowSteps[i].status === 'pending') {
      approval.flowSteps[i].status = 'rejected';
      approval.flowSteps[i].time = now;
      approval.flowSteps[i].remark = req.body.remark || '审核驳回';
      break;
    }
  }
  approval.status = 'rejected';
  approval.statusLabel = '已驳回';
  approval.approvalTime = now;
  approval.approvalRemark = req.body.remark || '审批驳回';

  if (approval.refType === 'enterprise_contract') {
    const contract = enterpriseContracts.find(c => c.id === approval.refId);
    if (contract) {
      contract.status = 'rejected';
      contract.statusLabel = '已驳回';
      contract.approvalStatus = 3;
      contract.approvalRemark = req.body.remark || '审批驳回';
    }
  }

  notifications.unshift({
    id: `notif-${Date.now()}`,
    type: 'approval_update',
    message: `审批已驳回: ${approval.title}`,
    time: now,
    read: false
  });

  res.json(approval);
});

app.get('/api/billing', (req, res) => {
  const { type, period, paymentStatus } = req.query;
  let filtered = [...billingRecords];
  if (type && type !== 'all') filtered = filtered.filter(b => b.type === type);
  if (period) filtered = filtered.filter(b => b.period === period);
  if (paymentStatus && paymentStatus !== 'all') filtered = filtered.filter(b => b.paymentStatus === paymentStatus);

  const totalAmount = filtered.reduce((s, b) => s + b.amount, 0);
  const paidAmount = filtered.filter(b => b.paymentStatus === 'paid').reduce((s, b) => s + b.amount, 0);
  const pendingAmount = filtered.filter(b => b.paymentStatus === 'pending').reduce((s, b) => s + b.amount, 0);

  const byType = {};
  billingRecords.forEach(b => {
    if (!byType[b.type]) byType[b.type] = 0;
    byType[b.type] += b.amount;
  });

  const byPeriod = {};
  billingRecords.forEach(b => {
    if (!byPeriod[b.period]) byPeriod[b.period] = { period: b.period, total: 0, paid: 0, pending: 0 };
    byPeriod[b.period].total += b.amount;
    if (b.paymentStatus === 'paid') byPeriod[b.period].paid += b.amount;
    else byPeriod[b.period].pending += b.amount;
  });

  res.json({
    records: filtered,
    summary: {
      totalAmount,
      paidAmount,
      pendingAmount,
      recordCount: filtered.length
    },
    byType: Object.entries(byType).map(([type, amount]) => ({
      type,
      typeLabel: type === 'subscription' ? '会员订阅' : type === 'enterprise' ? '企业团购' : '零售订单',
      amount
    })),
    byPeriod: Object.values(byPeriod).sort((a, b) => a.period.localeCompare(b.period))
  });
});

app.put('/api/billing/:id/payment', (req, res) => {
  const bill = billingRecords.find(b => b.id === req.params.id);
  if (!bill) return res.status(404).json({ error: '账单不存在' });
  bill.paymentStatus = req.body.status || 'paid';
  bill.paymentStatusLabel = bill.paymentStatus === 'paid' ? '已支付' : bill.paymentStatus === 'pending' ? '待支付' : '已取消';
  if (bill.paymentStatus === 'paid') {
    bill.paidTime = new Date().toISOString().replace('T', ' ').slice(0, 16);
  }
  res.json(bill);
});

app.put('/api/billing/:id/invoice', (req, res) => {
  const bill = billingRecords.find(b => b.id === req.params.id);
  if (!bill) return res.status(404).json({ error: '账单不存在' });
  bill.invoiceStatus = req.body.status || 'issued';
  const invLabels = { none: '无需开票', pending: '待开票', issued: '已开票', cancelled: '已作废' };
  bill.invoiceStatusLabel = invLabels[bill.invoiceStatus] || bill.invoiceStatusLabel;
  if (req.body.invoiceNo) bill.invoiceNo = req.body.invoiceNo;
  res.json(bill);
});

app.get('/api/approval-statuses', (req, res) => {
  res.json(approvalStatuses);
});

app.listen(PORT, () => {
  console.log(`蛋糕预订系统后端服务已启动: http://localhost:${PORT}`);
  console.log(`API 文档:`);
  console.log(`  蛋糕列表:      GET    /api/cakes`);
  console.log(`  订单列表:      GET    /api/orders`);
  console.log(`  会员管理:      GET    /api/members`);
  console.log(`  订阅管理:      GET    /api/subscriptions`);
  console.log(`  企业合同:      GET    /api/enterprise-contracts`);
  console.log(`  团购订单:      GET    /api/group-purchase-orders`);
  console.log(`  审批流:        GET    /api/approvals`);
  console.log(`  账单统计:      GET    /api/billing`);
  console.log(`  生产看板:      GET    /api/production-board`);
  console.log(`  统计数据:      GET    /api/stats`);
});
