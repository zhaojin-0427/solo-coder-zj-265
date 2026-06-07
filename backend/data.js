const { v4: uuidv4 } = require('uuid');

const sweetnessLevels = ['1星(微甜)', '2星(轻甜)', '3星(适中)', '4星(较甜)', '5星(很甜)'];

const sizeProductionTime = {
  '6寸': 1,
  '8寸': 2,
  '10寸': 3,
  '12寸': 4
};

const cakes = [
  {
    id: 'cake-1',
    name: '经典草莓奶油蛋糕',
    description: '新鲜草莓搭配轻盈奶油，口感清爽不腻',
    price: 168,
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=500',
    ingredients: ['低筋面粉', '新鲜鸡蛋', '动物奶油', '新鲜草莓', '白砂糖', '牛奶'],
    sweetness: 2,
    sweetnessLabel: sweetnessLevels[1],
    shelfLife: '冷藏2-3天',
    category: '奶油蛋糕',
    sizes: ['6寸', '8寸', '10寸'],
    baseProductionHours: 2,
    advanceBookingHours: 24,
    commonAllergens: ['乳制品', '鸡蛋', '小麦']
  },
  {
    id: 'cake-2',
    name: '浓情巧克力熔岩蛋糕',
    description: '比利时巧克力制作，浓郁醇厚，内里流心',
    price: 198,
    image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500',
    ingredients: ['比利时黑巧克力', '黄油', '鸡蛋', '低筋面粉', '可可粉', '淡奶油'],
    sweetness: 4,
    sweetnessLabel: sweetnessLevels[3],
    shelfLife: '冷藏3天',
    category: '巧克力蛋糕',
    sizes: ['6寸', '8寸'],
    baseProductionHours: 3,
    advanceBookingHours: 48,
    commonAllergens: ['乳制品', '鸡蛋', '小麦', '大豆']
  },
  {
    id: 'cake-3',
    name: '日式抹茶红豆蛋糕',
    description: '宇治抹茶与北海道红豆的完美结合',
    price: 188,
    image: 'https://images.unsplash.com/photo-1556040220-4096d522378d?w=500',
    ingredients: ['宇治抹茶粉', '北海道红豆', '动物奶油', '低筋面粉', '鸡蛋', '牛奶'],
    sweetness: 2,
    sweetnessLabel: sweetnessLevels[1],
    shelfLife: '冷藏2-3天',
    category: '日式蛋糕',
    sizes: ['6寸', '8寸', '10寸'],
    baseProductionHours: 2,
    advanceBookingHours: 24,
    commonAllergens: ['乳制品', '鸡蛋', '小麦']
  },
  {
    id: 'cake-4',
    name: '芒果慕斯蛋糕',
    description: '热带芒果风味，冰凉顺滑，夏日首选',
    price: 178,
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500',
    ingredients: ['新鲜芒果', '淡奶油', '吉利丁片', '消化饼干', '黄油', '柠檬汁'],
    sweetness: 3,
    sweetnessLabel: sweetnessLevels[2],
    shelfLife: '冷藏3天',
    category: '慕斯蛋糕',
    sizes: ['6寸', '8寸'],
    baseProductionHours: 4,
    advanceBookingHours: 36,
    commonAllergens: ['乳制品', '鸡蛋', '小麦']
  },
  {
    id: 'cake-5',
    name: '提拉米苏',
    description: '意式经典，咖啡与马斯卡彭的浪漫邂逅',
    price: 158,
    image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=500',
    ingredients: ['马斯卡彭奶酪', '手指饼干', '浓缩咖啡', '鸡蛋', '白砂糖', '可可粉'],
    sweetness: 2,
    sweetnessLabel: sweetnessLevels[1],
    shelfLife: '冷藏3-4天',
    category: '芝士蛋糕',
    sizes: ['6寸', '8寸'],
    baseProductionHours: 3,
    advanceBookingHours: 24,
    commonAllergens: ['乳制品', '鸡蛋', '小麦']
  },
  {
    id: 'cake-6',
    name: '蓝莓芝士蛋糕',
    description: '纽约风重芝士，顶部铺满新鲜蓝莓',
    price: 208,
    image: 'https://images.unsplash.com/photo-1533134242443-d4fd2153958c?w=500',
    ingredients: ['奶油奶酪', '新鲜蓝莓', '消化饼干', '黄油', '鸡蛋', '酸奶油'],
    sweetness: 3,
    sweetnessLabel: sweetnessLevels[2],
    shelfLife: '冷藏4-5天',
    category: '芝士蛋糕',
    sizes: ['6寸', '8寸', '10寸'],
    baseProductionHours: 5,
    advanceBookingHours: 48,
    commonAllergens: ['乳制品', '鸡蛋', '小麦']
  },
  {
    id: 'cake-7',
    name: '黑森林蛋糕',
    description: '巧克力海绵蛋糕配樱桃酒渍樱桃',
    price: 188,
    image: 'https://images.unsplash.com/photo-1542834369-f10ebf06d3e0?w=500',
    ingredients: ['黑巧克力', '酒渍樱桃', '动物奶油', '低筋面粉', '樱桃酒', '可可粉'],
    sweetness: 3,
    sweetnessLabel: sweetnessLevels[2],
    shelfLife: '冷藏2-3天',
    category: '巧克力蛋糕',
    sizes: ['8寸', '10寸'],
    baseProductionHours: 4,
    advanceBookingHours: 36,
    commonAllergens: ['乳制品', '鸡蛋', '小麦', '酒精']
  },
  {
    id: 'cake-8',
    name: '榴莲千层蛋糕',
    description: '猫山王榴莲果肉，层层叠叠的幸福',
    price: 268,
    image: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=500',
    ingredients: ['猫山王榴莲果肉', '鸡蛋', '牛奶', '低筋面粉', '动物奶油', '黄油'],
    sweetness: 3,
    sweetnessLabel: sweetnessLevels[2],
    shelfLife: '冷藏2天',
    category: '千层蛋糕',
    sizes: ['6寸', '8寸'],
    baseProductionHours: 6,
    advanceBookingHours: 72,
    commonAllergens: ['乳制品', '鸡蛋', '小麦']
  }
];

const festivalSlots = [
  {
    id: 'fest-1',
    name: '情人节特惠',
    startDate: '2024-02-10',
    endDate: '2024-02-15',
    description: '情人节专属档期，浪漫主题蛋糕',
    capacityMultiplier: 1.5,
    specialCakes: ['cake-1', 'cake-5'],
    isActive: true
  },
  {
    id: 'fest-2',
    name: '母亲节感恩',
    startDate: '2024-05-01',
    endDate: '2024-05-12',
    description: '母亲节鲜花主题，感恩妈妈',
    capacityMultiplier: 1.3,
    specialCakes: ['cake-1', 'cake-3', 'cake-6'],
    isActive: true
  },
  {
    id: 'fest-3',
    name: '儿童节欢乐',
    startDate: '2024-05-25',
    endDate: '2024-06-02',
    description: '儿童节童趣主题',
    capacityMultiplier: 1.2,
    specialCakes: ['cake-1', 'cake-4'],
    isActive: true
  },
  {
    id: 'fest-4',
    name: '中秋节团圆',
    startDate: '2024-09-10',
    endDate: '2024-09-17',
    description: '中秋佳节，家庭聚会蛋糕',
    capacityMultiplier: 1.4,
    specialCakes: ['cake-6', 'cake-8'],
    isActive: true
  },
  {
    id: 'fest-5',
    name: '圣诞节狂欢',
    startDate: '2024-12-20',
    endDate: '2024-12-26',
    description: '圣诞主题，节日限定',
    capacityMultiplier: 1.6,
    specialCakes: ['cake-2', 'cake-7'],
    isActive: true
  }
];

const dailyCapacity = {
  defaultDailyHours: 8,
  defaultDailyOrders: 15,
  workStart: '08:00',
  workEnd: '20:00',
  dateOverrides: {}
};

const bookingLogs = [
  {
    id: 'blog-1',
    type: 'rejected',
    cakeId: 'cake-8',
    cakeName: '榴莲千层蛋糕',
    customerName: '潜在客户',
    requestedTime: '2024-06-10 15:00',
    reason: '产能不足',
    time: '2024-06-05 14:30'
  },
  {
    id: 'blog-2',
    type: 'rescheduled',
    orderId: 'ord-20240601-001',
    cakeName: '经典草莓奶油蛋糕',
    customerName: '张小姐',
    originalTime: '2024-06-06 10:00',
    newTime: '2024-06-07 15:00',
    reason: '客户改期',
    time: '2024-06-04 09:15'
  },
  {
    id: 'blog-3',
    type: 'rejected',
    cakeId: 'cake-6',
    cakeName: '蓝莓芝士蛋糕',
    customerName: '潜在客户',
    requestedTime: '2024-06-08 12:00',
    reason: '提前预订时间不足',
    time: '2024-06-07 10:00'
  }
];

const orderStatuses = [
  '待确认',
  '已确认排期',
  '生产中',
  '已完成待取/配送',
  '配送中',
  '已完成',
  '已取消'
];

const orders = [
  {
    id: 'ord-20240601-001',
    customerName: '张小姐',
    phone: '138****1234',
    cakeId: 'cake-1',
    cakeName: '经典草莓奶油蛋糕',
    size: '8寸',
    quantity: 1,
    totalPrice: 168,
    pickupType: 'delivery',
    pickupTypeLabel: '配送',
    address: '北京市朝阳区建国路88号SOHO现代城A座1801',
    deliveryTime: '2024-06-07 15:00',
    orderTime: '2024-06-05 10:30',
    allergens: '花生过敏',
    decorationNote: '请写"生日快乐"，粉色系装饰',
    status: 0,
    statusLabel: orderStatuses[0],
    productionPlan: null,
    productPhoto: null,
    customerNotified: false,
    deliveryStatus: null,
    estimatedArrival: null,
    customerId: 'cust-001'
  },
  {
    id: 'ord-20240601-002',
    customerName: '李先生',
    phone: '139****5678',
    cakeId: 'cake-2',
    cakeName: '浓情巧克力熔岩蛋糕',
    size: '6寸',
    quantity: 1,
    totalPrice: 198,
    pickupType: 'pickup',
    pickupTypeLabel: '自提',
    address: '',
    deliveryTime: '2024-06-07 14:00',
    orderTime: '2024-06-05 11:20',
    allergens: '无',
    decorationNote: '简单大方即可',
    status: 1,
    statusLabel: orderStatuses[1],
    productionPlan: {
      scheduledDate: '2024-06-07',
      startTime: '09:00',
      endTime: '11:00',
      baker: '王师傅',
      notes: '提前准备巧克力'
    },
    productPhoto: null,
    customerNotified: false,
    deliveryStatus: null,
    estimatedArrival: null,
    customerId: 'cust-002'
  },
  {
    id: 'ord-20240601-003',
    customerName: '王女士',
    phone: '136****9012',
    cakeId: 'cake-4',
    cakeName: '芒果慕斯蛋糕',
    size: '8寸',
    quantity: 2,
    totalPrice: 356,
    pickupType: 'delivery',
    pickupTypeLabel: '配送',
    address: '北京市海淀区中关村大街1号',
    deliveryTime: '2024-06-07 16:30',
    orderTime: '2024-06-04 16:45',
    allergens: '坚果过敏',
    decorationNote: '芒果装饰多一些',
    status: 2,
    statusLabel: orderStatuses[2],
    productionPlan: {
      scheduledDate: '2024-06-07',
      startTime: '08:00',
      endTime: '10:30',
      baker: '李师傅',
      notes: '两个蛋糕，注意芒果用量'
    },
    productPhoto: null,
    customerNotified: false,
    deliveryStatus: null,
    estimatedArrival: null,
    customerId: 'cust-001'
  },
  {
    id: 'ord-20240601-004',
    customerName: '陈先生',
    phone: '137****3456',
    cakeId: 'cake-6',
    cakeName: '蓝莓芝士蛋糕',
    size: '10寸',
    quantity: 1,
    totalPrice: 208,
    pickupType: 'delivery',
    pickupTypeLabel: '配送',
    address: '北京市西城区金融街7号',
    deliveryTime: '2024-06-07 12:00',
    orderTime: '2024-06-03 09:15',
    allergens: '无',
    decorationNote: '商务风格，简洁大方',
    status: 3,
    statusLabel: orderStatuses[3],
    productionPlan: {
      scheduledDate: '2024-06-06',
      startTime: '14:00',
      endTime: '17:00',
      baker: '王师傅',
      notes: '芝士蛋糕需要冷藏过夜'
    },
    productPhoto: 'https://images.unsplash.com/photo-1533134242443-d4fd2153958c?w=400',
    customerNotified: true,
    deliveryStatus: null,
    estimatedArrival: null,
    customerId: 'cust-003'
  },
  {
    id: 'ord-20240601-005',
    customerName: '刘女士',
    phone: '135****7890',
    cakeId: 'cake-5',
    cakeName: '提拉米苏',
    size: '6寸',
    quantity: 1,
    totalPrice: 158,
    pickupType: 'delivery',
    pickupTypeLabel: '配送',
    address: '北京市东城区王府井大街138号',
    deliveryTime: '2024-06-07 18:00',
    orderTime: '2024-06-05 20:00',
    allergens: '无',
    decorationNote: '请加蜡烛10根',
    status: 4,
    statusLabel: orderStatuses[4],
    productionPlan: {
      scheduledDate: '2024-06-07',
      startTime: '07:00',
      endTime: '09:00',
      baker: '李师傅',
      notes: ''
    },
    productPhoto: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400',
    customerNotified: true,
    deliveryStatus: {
      status: 'on_the_way',
      statusLabel: '配送中',
      driverName: '赵师傅',
      driverPhone: '130****1111',
      currentLocation: '东四北大街',
      startTime: '2024-06-07 17:15',
      updates: [
        { time: '2024-06-07 17:00', status: '已出库', location: '烘焙工作室' },
        { time: '2024-06-07 17:15', status: '配送中', location: '东四北大街' }
      ]
    },
    estimatedArrival: '2024-06-07 17:50',
    customerId: 'cust-004'
  },
  {
    id: 'ord-20240601-006',
    customerName: '周先生',
    phone: '133****2222',
    cakeId: 'cake-3',
    cakeName: '日式抹茶红豆蛋糕',
    size: '8寸',
    quantity: 1,
    totalPrice: 188,
    pickupType: 'pickup',
    pickupTypeLabel: '自提',
    address: '',
    deliveryTime: '2024-06-06 15:00',
    orderTime: '2024-06-04 13:00',
    allergens: '无',
    decorationNote: '',
    status: 5,
    statusLabel: orderStatuses[5],
    productionPlan: {
      scheduledDate: '2024-06-06',
      startTime: '09:00',
      endTime: '11:30',
      baker: '王师傅',
      notes: ''
    },
    productPhoto: 'https://images.unsplash.com/photo-1556040220-4096d522378d?w=400',
    customerNotified: true,
    deliveryStatus: null,
    estimatedArrival: null,
    actualDeliveryTime: '2024-06-06 14:55',
    customerId: 'cust-002'
  }
];

const stats = {
  cakeOrders: [
    { cakeId: 'cake-1', cakeName: '经典草莓奶油蛋糕', count: 45 },
    { cakeId: 'cake-2', cakeName: '浓情巧克力熔岩蛋糕', count: 32 },
    { cakeId: 'cake-3', cakeName: '日式抹茶红豆蛋糕', count: 28 },
    { cakeId: 'cake-4', cakeName: '芒果慕斯蛋糕', count: 38 },
    { cakeId: 'cake-5', cakeName: '提拉米苏', count: 41 },
    { cakeId: 'cake-6', cakeName: '蓝莓芝士蛋糕', count: 25 },
    { cakeId: 'cake-7', cakeName: '黑森林蛋糕', count: 18 },
    { cakeId: 'cake-8', cakeName: '榴莲千层蛋糕', count: 22 }
  ],
  peakHours: [
    { hour: '09:00', count: 8 },
    { hour: '10:00', count: 15 },
    { hour: '11:00', count: 22 },
    { hour: '12:00', count: 35 },
    { hour: '13:00', count: 28 },
    { hour: '14:00', count: 18 },
    { hour: '15:00', count: 25 },
    { hour: '16:00', count: 32 },
    { hour: '17:00', count: 40 },
    { hour: '18:00', count: 45 },
    { hour: '19:00', count: 30 },
    { hour: '20:00', count: 15 }
  ],
  deliveryStats: {
    totalDeliveries: 210,
    onTime: 195,
    onTimeRate: 92.86
  },
  customerStats: {
    totalCustomers: 156,
    repeatCustomers: 68,
    repeatRate: 43.59,
    newCustomersThisMonth: 32
  }
};

const notifications = [
  { id: 'notif-1', orderId: 'ord-20240601-005', type: 'delivery_update', message: '您的蛋糕正在配送中，预计17:50送达', time: '2024-06-07 17:15', read: false },
  { id: 'notif-2', orderId: 'ord-20240601-004', type: 'product_ready', message: '您的蓝莓芝士蛋糕已制作完成，可以取货了', time: '2024-06-07 08:30', read: false },
  { id: 'notif-3', orderId: 'ord-20240601-002', type: 'order_confirmed', message: '您的订单已确认排期，预计明天14:00可自提', time: '2024-06-06 16:00', read: true }
];

module.exports = {
  cakes,
  orders,
  orderStatuses,
  sweetnessLevels,
  stats,
  notifications,
  uuidv4,
  sizeProductionTime,
  festivalSlots,
  dailyCapacity,
  bookingLogs
};
