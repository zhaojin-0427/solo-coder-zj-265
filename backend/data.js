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

const memberTiers = [
  { id: 'tier-normal', name: '普通会员', discount: 1, minSpend: 0 },
  { id: 'tier-silver', name: '银卡会员', discount: 0.95, minSpend: 500 },
  { id: 'tier-gold', name: '金卡会员', discount: 0.9, minSpend: 2000 },
  { id: 'tier-platinum', name: '白金会员', discount: 0.85, minSpend: 5000 }
];

const members = [
  {
    id: 'mem-001',
    name: '张小姐',
    phone: '138****1234',
    tier: 'tier-gold',
    tierLabel: '金卡会员',
    totalSpent: 3280,
    joinDate: '2024-01-15',
    birthday: '1990-06-08',
    email: 'zhang@example.com',
    allergens: '花生过敏',
    defaultAddress: '北京市朝阳区建国路88号SOHO现代城A座1801',
    points: 3280,
    status: 'active'
  },
  {
    id: 'mem-002',
    name: '李先生',
    phone: '139****5678',
    tier: 'tier-silver',
    tierLabel: '银卡会员',
    totalSpent: 880,
    joinDate: '2024-03-02',
    birthday: '1988-12-20',
    email: 'li@example.com',
    allergens: '无',
    defaultAddress: '',
    points: 880,
    status: 'active'
  }
];

const subscriptionPlans = [
  {
    id: 'sub-plan-001',
    memberId: 'mem-001',
    memberName: '张小姐',
    planType: 'quarterly',
    planTypeLabel: '季度订阅(12期)',
    frequency: 'weekly',
    frequencyLabel: '每周一次',
    preferredCakes: [
      { cakeId: 'cake-1', cakeName: '经典草莓奶油蛋糕', size: '8寸' },
      { cakeId: 'cake-3', cakeName: '日式抹茶红豆蛋糕', size: '8寸' },
      { cakeId: 'cake-5', cakeName: '提拉米苏', size: '6寸' }
    ],
    allergens: '花生过敏',
    sweetnessPreference: 2,
    defaultAddress: '北京市朝阳区建国路88号SOHO现代城A座1801',
    deliveryTimePref: '15:00',
    startDate: '2024-05-01',
    endDate: '2024-07-31',
    totalPeriods: 12,
    fulfilledPeriods: 4,
    skippedPeriods: [7],
    pausedPeriods: [],
    isPaused: false,
    pauseReason: '',
    unitPrice: 158,
    totalPrice: 1896,
    paidAmount: 1896,
    status: 'active',
    createdAt: '2024-04-28 10:30'
  },
  {
    id: 'sub-plan-002',
    memberId: 'mem-002',
    memberName: '李先生',
    planType: 'monthly',
    planTypeLabel: '月度订阅(4期)',
    frequency: 'weekly',
    frequencyLabel: '每周一次',
    preferredCakes: [
      { cakeId: 'cake-2', cakeName: '浓情巧克力熔岩蛋糕', size: '6寸' }
    ],
    allergens: '无',
    sweetnessPreference: 4,
    defaultAddress: '',
    deliveryTimePref: '14:00',
    startDate: '2024-06-01',
    endDate: '2024-06-30',
    totalPeriods: 4,
    fulfilledPeriods: 1,
    skippedPeriods: [],
    pausedPeriods: [3],
    isPaused: false,
    pauseReason: '',
    unitPrice: 188,
    totalPrice: 752,
    paidAmount: 752,
    status: 'active',
    createdAt: '2024-05-28 16:45'
  }
];

const subscriptionFulfillments = [
  {
    id: 'sub-ful-001',
    subscriptionId: 'sub-plan-001',
    memberId: 'mem-001',
    memberName: '张小姐',
    period: 1,
    cakeId: 'cake-1',
    cakeName: '经典草莓奶油蛋糕',
    size: '8寸',
    quantity: 1,
    unitPrice: 158,
    address: '北京市朝阳区建国路88号SOHO现代城A座1801',
    deliveryTime: '2024-05-03 15:00',
    orderId: 'ord-20240601-sub001-p1',
    status: 'fulfilled',
    statusLabel: '已履约',
    note: '第一期配送正常'
  },
  {
    id: 'sub-ful-002',
    subscriptionId: 'sub-plan-001',
    memberId: 'mem-001',
    memberName: '张小姐',
    period: 2,
    cakeId: 'cake-3',
    cakeName: '日式抹茶红豆蛋糕',
    size: '8寸',
    quantity: 1,
    unitPrice: 158,
    address: '北京市朝阳区建国路88号SOHO现代城A座1801',
    deliveryTime: '2024-05-10 15:00',
    orderId: 'ord-20240601-sub001-p2',
    status: 'fulfilled',
    statusLabel: '已履约',
    note: ''
  },
  {
    id: 'sub-ful-003',
    subscriptionId: 'sub-plan-001',
    memberId: 'mem-001',
    memberName: '张小姐',
    period: 3,
    cakeId: 'cake-5',
    cakeName: '提拉米苏',
    size: '6寸',
    quantity: 1,
    unitPrice: 158,
    address: '北京市朝阳区建国路88号SOHO现代城A座1801',
    deliveryTime: '2024-05-17 15:00',
    orderId: 'ord-20240601-sub001-p3',
    status: 'fulfilled',
    statusLabel: '已履约',
    note: ''
  },
  {
    id: 'sub-ful-004',
    subscriptionId: 'sub-plan-001',
    memberId: 'mem-001',
    memberName: '张小姐',
    period: 4,
    cakeId: 'cake-1',
    cakeName: '经典草莓奶油蛋糕',
    size: '8寸',
    quantity: 1,
    unitPrice: 158,
    address: '北京市海淀区中关村大街1号',
    deliveryTime: '2024-05-24 15:00',
    orderId: 'ord-20240601-sub001-p4',
    status: 'fulfilled',
    statusLabel: '已履约',
    note: '临时改地址到公司'
  },
  {
    id: 'sub-ful-005',
    subscriptionId: 'sub-plan-001',
    memberId: 'mem-001',
    memberName: '张小姐',
    period: 5,
    cakeId: 'cake-3',
    cakeName: '日式抹茶红豆蛋糕',
    size: '8寸',
    quantity: 1,
    unitPrice: 158,
    address: '北京市朝阳区建国路88号SOHO现代城A座1801',
    deliveryTime: '2024-06-07 15:00',
    orderId: 'ord-20240601-sub001-p5',
    status: 'pending',
    statusLabel: '待配送',
    note: ''
  },
  {
    id: 'sub-ful-006',
    subscriptionId: 'sub-plan-002',
    memberId: 'mem-002',
    memberName: '李先生',
    period: 1,
    cakeId: 'cake-2',
    cakeName: '浓情巧克力熔岩蛋糕',
    size: '6寸',
    quantity: 1,
    unitPrice: 188,
    address: '',
    deliveryTime: '2024-06-07 14:00',
    orderId: 'ord-20240601-sub002-p1',
    status: 'pending',
    statusLabel: '待自提',
    note: '自提'
  }
];

const approvalStatuses = ['待审批', '审批中', '已通过', '已驳回', '已撤销'];

const enterpriseContracts = [
  {
    id: 'ent-ctr-001',
    companyName: '北京科技有限公司',
    contactPerson: '王经理',
    contactPhone: '135****8888',
    contactEmail: 'wang@bjtech.com',
    contractNo: 'BJTECH-2024-Q2-001',
    totalBudget: 25000,
    usedBudget: 5640,
    remainingBudget: 19360,
    invoiceInfo: {
      title: '北京科技有限公司',
      taxNo: '91110105MA001ABCDE',
      address: '北京市海淀区中关村科技园',
      phone: '010-88888888',
      bankName: '工商银行北京分行',
      bankAccount: '0200 0000 0000 0001'
    },
    departments: [
      { id: 'dept-1', name: '技术部', headcount: 35, contact: '刘主管', phone: '136****1111' },
      { id: 'dept-2', name: '市场部', headcount: 20, contact: '陈主管', phone: '136****2222' },
      { id: 'dept-3', name: '行政部', headcount: 10, contact: '赵主管', phone: '136****3333' }
    ],
    startDate: '2024-04-01',
    endDate: '2024-06-30',
    status: 'approved',
    statusLabel: '已通过',
    approvalStatus: 2,
    approver: '张总',
    approvalTime: '2024-03-28 14:30',
    approvalRemark: '同意本季度员工福利蛋糕采购合同',
    createdAt: '2024-03-25 10:00',
    createdBy: '王经理'
  },
  {
    id: 'ent-ctr-002',
    companyName: '上海创意设计有限公司',
    contactPerson: '孙总监',
    contactPhone: '137****6666',
    contactEmail: 'sun@shcreative.com',
    contractNo: 'SHCR-2024-H1-003',
    totalBudget: 48000,
    usedBudget: 0,
    remainingBudget: 48000,
    invoiceInfo: {
      title: '上海创意设计有限公司',
      taxNo: '91310104MA1K23XYZ',
      address: '上海市徐汇区漕河泾开发区',
      phone: '021-66666666',
      bankName: '招商银行上海分行',
      bankAccount: '1219 0000 0000 0088'
    },
    departments: [
      { id: 'dept-1', name: '设计一部', headcount: 25, contact: '周组长', phone: '138****4444' },
      { id: 'dept-2', name: '设计二部', headcount: 22, contact: '吴组长', phone: '138****5555' },
      { id: 'dept-3', name: '品牌部', headcount: 15, contact: '郑组长', phone: '138****6666' },
      { id: 'dept-4', name: '客户部', headcount: 18, contact: '黄组长', phone: '138****7777' }
    ],
    startDate: '2024-06-01',
    endDate: '2024-12-31',
    status: 'pending',
    statusLabel: '待审批',
    approvalStatus: 0,
    approver: '',
    approvalTime: '',
    approvalRemark: '',
    createdAt: '2024-06-05 09:15',
    createdBy: '孙总监'
  }
];

const groupPurchaseSubOrders = [
  {
    id: 'gp-ord-001',
    contractId: 'ent-ctr-001',
    companyName: '北京科技有限公司',
    departmentId: 'dept-1',
    departmentName: '技术部',
    recipients: [
      { id: 'r-1', name: '张三', phone: '136****1001', address: '北京市海淀区中关村科技园A座' },
      { id: 'r-2', name: '李四', phone: '136****1002', address: '北京市海淀区中关村科技园A座' },
      { id: 'r-3', name: '王五', phone: '136****1003', address: '北京市海淀区中关村科技园B座' }
    ],
    cakeId: 'cake-1',
    cakeName: '经典草莓奶油蛋糕',
    size: '6寸',
    quantity: 3,
    unitPrice: 138,
    totalPrice: 414,
    batchNo: 'batch-20240601',
    deliveryBatch: 1,
    totalBatches: 3,
    deliveryTime: '2024-06-07 10:00',
    deliveryStatus: 'pending',
    deliveryStatusLabel: '待配送',
    orderIds: ['ord-20240601-gp001-1', 'ord-20240601-gp001-2', 'ord-20240601-gp001-3'],
    status: 'pending',
    createdAt: '2024-06-03 11:00'
  },
  {
    id: 'gp-ord-002',
    contractId: 'ent-ctr-001',
    companyName: '北京科技有限公司',
    departmentId: 'dept-2',
    departmentName: '市场部',
    recipients: [
      { id: 'r-1', name: '赵六', phone: '136****2001', address: '北京市海淀区中关村科技园C座' },
      { id: 'r-2', name: '钱七', phone: '136****2002', address: '北京市海淀区中关村科技园C座' }
    ],
    cakeId: 'cake-4',
    cakeName: '芒果慕斯蛋糕',
    size: '6寸',
    quantity: 2,
    unitPrice: 148,
    totalPrice: 296,
    batchNo: 'batch-20240601',
    deliveryBatch: 1,
    totalBatches: 3,
    deliveryTime: '2024-06-07 10:30',
    deliveryStatus: 'pending',
    deliveryStatusLabel: '待配送',
    orderIds: ['ord-20240601-gp002-1', 'ord-20240601-gp002-2'],
    status: 'pending',
    createdAt: '2024-06-03 11:20'
  },
  {
    id: 'gp-ord-003',
    contractId: 'ent-ctr-001',
    companyName: '北京科技有限公司',
    departmentId: 'dept-3',
    departmentName: '行政部',
    recipients: [
      { id: 'r-1', name: '孙八', phone: '136****3001', address: '北京市海淀区中关村科技园D座' }
    ],
    cakeId: 'cake-6',
    cakeName: '蓝莓芝士蛋糕',
    size: '6寸',
    quantity: 1,
    unitPrice: 178,
    totalPrice: 178,
    batchNo: 'batch-20240501',
    deliveryBatch: 1,
    totalBatches: 3,
    deliveryTime: '2024-05-10 11:00',
    deliveryStatus: 'delivered',
    deliveryStatusLabel: '已送达',
    orderIds: ['ord-20240601-gp003-1'],
    status: 'completed',
    createdAt: '2024-05-08 14:00'
  },
  {
    id: 'gp-ord-004',
    contractId: 'ent-ctr-001',
    companyName: '北京科技有限公司',
    departmentId: 'dept-1',
    departmentName: '技术部',
    recipients: [
      { id: 'r-1', name: '张三', phone: '136****1001', address: '北京市海淀区中关村科技园A座' },
      { id: 'r-2', name: '李四', phone: '136****1002', address: '北京市海淀区中关村科技园A座' },
      { id: 'r-3', name: '王五', phone: '136****1003', address: '北京市海淀区中关村科技园B座' }
    ],
    cakeId: 'cake-2',
    cakeName: '浓情巧克力熔岩蛋糕',
    size: '6寸',
    quantity: 3,
    unitPrice: 168,
    totalPrice: 504,
    batchNo: 'batch-20240501',
    deliveryBatch: 1,
    totalBatches: 3,
    deliveryTime: '2024-05-10 10:00',
    deliveryStatus: 'delivered',
    deliveryStatusLabel: '已送达',
    orderIds: ['ord-20240601-gp004-1', 'ord-20240601-gp004-2', 'ord-20240601-gp004-3'],
    status: 'completed',
    createdAt: '2024-05-08 10:00'
  },
  {
    id: 'gp-ord-005',
    contractId: 'ent-ctr-001',
    companyName: '北京科技有限公司',
    departmentId: 'dept-2',
    departmentName: '市场部',
    recipients: [
      { id: 'r-1', name: '赵六', phone: '136****2001', address: '北京市海淀区中关村科技园C座' },
      { id: 'r-2', name: '钱七', phone: '136****2002', address: '北京市海淀区中关村科技园C座' }
    ],
    cakeId: 'cake-5',
    cakeName: '提拉米苏',
    size: '6寸',
    quantity: 2,
    unitPrice: 128,
    totalPrice: 256,
    batchNo: 'batch-20240501',
    deliveryBatch: 1,
    totalBatches: 3,
    deliveryTime: '2024-05-10 10:30',
    deliveryStatus: 'delivered',
    deliveryStatusLabel: '已送达',
    orderIds: ['ord-20240601-gp005-1', 'ord-20240601-gp005-2'],
    status: 'completed',
    createdAt: '2024-05-08 10:30'
  }
];

const approvals = [
  {
    id: 'apr-001',
    refType: 'enterprise_contract',
    refId: 'ent-ctr-001',
    title: '北京科技有限公司Q2蛋糕采购合同审批',
    applicant: '王经理',
    applicantPhone: '135****8888',
    amount: 25000,
    submitTime: '2024-03-25 10:00',
    currentApprover: '张总',
    approverRole: '总经理',
    status: 'approved',
    statusLabel: '已通过',
    approvalTime: '2024-03-28 14:30',
    approvalRemark: '同意本季度员工福利蛋糕采购合同，预算执行请按月规划。',
    flowSteps: [
      { step: 1, approver: '财务李经理', role: '财务审核', status: 'approved', time: '2024-03-26 09:00', remark: '预算审核通过' },
      { step: 2, approver: '运营王总监', role: '运营审核', status: 'approved', time: '2024-03-27 11:30', remark: '产能可支撑，建议分批配送' },
      { step: 3, approver: '张总', role: '总经理审批', status: 'approved', time: '2024-03-28 14:30', remark: '同意本季度员工福利蛋糕采购合同，预算执行请按月规划。' }
    ]
  },
  {
    id: 'apr-002',
    refType: 'enterprise_contract',
    refId: 'ent-ctr-002',
    title: '上海创意设计有限公司上半年团购合同审批',
    applicant: '孙总监',
    applicantPhone: '137****6666',
    amount: 48000,
    submitTime: '2024-06-05 09:15',
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
  }
];

const billingRecords = [
  {
    id: 'bill-001',
    type: 'subscription',
    refId: 'sub-plan-001',
    refNo: '季度订阅(12期)',
    customerName: '张小姐',
    amount: 1896,
    paymentMethod: '微信支付',
    paymentStatus: 'paid',
    paymentStatusLabel: '已支付',
    paidTime: '2024-04-28 10:35',
    invoiceStatus: 'none',
    invoiceStatusLabel: '无需开票',
    period: '2024-05',
    createdAt: '2024-04-28 10:30'
  },
  {
    id: 'bill-002',
    type: 'subscription',
    refId: 'sub-plan-002',
    refNo: '月度订阅(4期)',
    customerName: '李先生',
    amount: 752,
    paymentMethod: '支付宝',
    paymentStatus: 'paid',
    paymentStatusLabel: '已支付',
    paidTime: '2024-05-28 16:50',
    invoiceStatus: 'none',
    invoiceStatusLabel: '无需开票',
    period: '2024-06',
    createdAt: '2024-05-28 16:45'
  },
  {
    id: 'bill-003',
    type: 'enterprise',
    refId: 'ent-ctr-001',
    refNo: 'BJTECH-2024-Q2-001',
    customerName: '北京科技有限公司',
    amount: 1648,
    paymentMethod: '对公转账',
    paymentStatus: 'paid',
    paymentStatusLabel: '已支付',
    paidTime: '2024-05-05 15:00',
    invoiceStatus: 'issued',
    invoiceStatusLabel: '已开票',
    invoiceNo: 'INV-20240505-001',
    period: '2024-05',
    createdAt: '2024-05-02 09:00'
  },
  {
    id: 'bill-004',
    type: 'enterprise',
    refId: 'ent-ctr-001',
    refNo: 'BJTECH-2024-Q2-001',
    customerName: '北京科技有限公司',
    amount: 3992,
    paymentMethod: '对公转账',
    paymentStatus: 'pending',
    paymentStatusLabel: '待支付',
    paidTime: '',
    invoiceStatus: 'pending',
    invoiceStatusLabel: '待开票',
    period: '2024-06',
    createdAt: '2024-06-01 09:00'
  },
  {
    id: 'bill-005',
    type: 'retail',
    refId: 'ord-20240601-001',
    refNo: '零售订单',
    customerName: '张小姐',
    amount: 168,
    paymentMethod: '微信支付',
    paymentStatus: 'paid',
    paymentStatusLabel: '已支付',
    paidTime: '2024-06-05 10:35',
    invoiceStatus: 'none',
    invoiceStatusLabel: '无需开票',
    period: '2024-06',
    createdAt: '2024-06-05 10:30'
  },
  {
    id: 'bill-006',
    type: 'retail',
    refId: 'ord-20240601-002',
    refNo: '零售订单',
    customerName: '李先生',
    amount: 198,
    paymentMethod: '支付宝',
    paymentStatus: 'paid',
    paymentStatusLabel: '已支付',
    paidTime: '2024-06-05 11:25',
    invoiceStatus: 'none',
    invoiceStatusLabel: '无需开票',
    period: '2024-06',
    createdAt: '2024-06-05 11:20'
  }
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
  bookingLogs,
  memberTiers,
  members,
  subscriptionPlans,
  subscriptionFulfillments,
  enterpriseContracts,
  groupPurchaseSubOrders,
  approvals,
  approvalStatuses,
  billingRecords
};
