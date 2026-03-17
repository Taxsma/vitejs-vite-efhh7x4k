import React, { useState, useEffect } from 'react';

// --- 全局隐藏滚动条样式 ---
const hideScrollbarStyle = `
  .no-scrollbar::-webkit-scrollbar { display: none; }
  .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
`;

// --- 错误捕获雷达 (ErrorBoundary) 核心 ---
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error: any, errorInfo: any}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }
  componentDidCatch(error: any, errorInfo: any) {
    this.setState({ errorInfo });
    console.error("捕捉到崩溃信息:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '30px', color: '#ff8080', backgroundColor: '#111', minHeight: '100vh', fontFamily: 'sans-serif' }}>
          <h2 style={{ color: 'white', marginBottom: '10px' }}>⚠️ 捕捉到白屏原因！</h2>
          <p style={{ color: '#ccc', fontSize: '14px', marginBottom: '20px' }}>请把下面这个黑色框里的红色文字截图发给 AI：</p>
          <pre style={{ background: '#000', padding: '15px', borderRadius: '8px', overflowX: 'auto', fontSize: '12px', lineHeight: '1.5' }}>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </pre>
          <button 
            onClick={() => { localStorage.clear(); window.location.reload(); }} 
            style={{ marginTop: '20px', padding: '12px 24px', background: '#10b981', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            尝试清除本地缓存并重启
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- 纯净内置 SVG 图标库 ---
const Icon = ({ name, size = 20, className = "" }: { name: string, size?: number, className?: string }) => {
  const paths: Record<string, React.ReactNode> = {
    Plus: <><path d="M5 12h14"/><path d="M12 5v14"/></>,
    Trash: <><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></>,
    ChevronLeft: <path d="M15 18l-6-6 6-6"/>,
    ChevronRight: <path d="M9 18l6-6-6-6"/>,
    ChevronDown: <path d="M6 9l6 6 6-6"/>,
    Edit: <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>,
    Check: <path d="M20 6L9 17l-5-5"/>,
    Droplet: <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>,
    User: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>,
    ArrowLeft: <><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></>,
    Calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></>,
    Search: <><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></>,
    Book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></>,
    X: <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>,
    PlusCircle: <><circle cx="12" cy="12" r="10"/><path d="M12 8v8"/><path d="M8 12h8"/></>,
    Copy: <><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {paths[name]}
    </svg>
  );
};

// --- 数据接口 ---
interface RecordItem { id: number; name: string; calories: number; protein: number; carbs: number; fat: number; mealType: string; timestamp: string; amount: number; unit: string; }
interface UserProfile { gender: 'M' | 'F'; age: number; height: number; weight: number; activityLevel: number; }
interface FoodItem { id: string; name: string; cal: number; p: number; c: number; f: number; unit: string; iconStr: string; }

const iconMap: Record<string, string> = {
  coffee: '☕', egg: '🥚', meat: '🍗', salad: '🥗', apple: '🍎', bowl: '🍚', beef: '🍜', bread: '🍞', drink: '🥤', cake: '🍰', snack: '🍪'
};

const defaultFoods: FoodItem[] = [
  { id: '1', name: '米饭', cal: 116, p: 2.6, c: 25.9, f: 0.3, unit: '100g', iconStr: 'bowl' },
  { id: '2', name: '大肉包', cal: 250, p: 10, c: 30, f: 10, unit: '1个', iconStr: 'bread' },
  { id: '3', name: '馒头', cal: 223, p: 7, c: 47, f: 1, unit: '1个(约100g)', iconStr: 'bread' },
  { id: '4', name: '燕麦片(干)', cal: 377, p: 15, c: 66, f: 6, unit: '100g', iconStr: 'bowl' },
  { id: '5', name: '全麦面包', cal: 246, p: 9, c: 45, f: 4, unit: '1片(约50g)', iconStr: 'bread' },
  { id: '6', name: '红薯(蒸/煮)', cal: 86, p: 1.5, c: 20, f: 0.1, unit: '100g', iconStr: 'apple' },
  { id: '7', name: '玉米(蒸/煮)', cal: 112, p: 3.3, c: 22.8, f: 1.2, unit: '1根(约200g)', iconStr: 'apple' },
  { id: '8', name: '油条', cal: 388, p: 4, c: 40, f: 20, unit: '1根', iconStr: 'snack' },
  { id: '9', name: '水煮蛋', cal: 75, p: 6, c: 0, f: 5, unit: '1个', iconStr: 'egg' },
  { id: '10', name: '茶叶蛋', cal: 78, p: 6.5, c: 1, f: 5.5, unit: '1个', iconStr: 'egg' },
  { id: '11', name: '煎蛋', cal: 90, p: 6, c: 0, f: 7, unit: '1个', iconStr: 'egg' },
  { id: '12', name: '水煮鸡胸肉', cal: 133, p: 30, c: 0, f: 1.5, unit: '100g', iconStr: 'meat' },
  { id: '13', name: '酱牛肉', cal: 246, p: 31, c: 3, f: 11, unit: '100g', iconStr: 'meat' },
  { id: '14', name: '清蒸鱼', cal: 105, p: 18, c: 0, f: 3, unit: '100g', iconStr: 'meat' },
  { id: '15', name: '煎牛排', cal: 220, p: 25, c: 0, f: 12, unit: '100g', iconStr: 'meat' },
  { id: '16', name: '火腿肠', cal: 308, p: 12, c: 15, f: 22, unit: '1根(约50g)', iconStr: 'meat' },
  { id: '17', name: '清炒时蔬', cal: 100, p: 2, c: 5, f: 8, unit: '1小盘', iconStr: 'salad' },
  { id: '18', name: '凉拌黄瓜', cal: 45, p: 1, c: 5, f: 2, unit: '1小盘', iconStr: 'salad' },
  { id: '19', name: '轻食鸡肉沙拉', cal: 350, p: 25, c: 20, f: 15, unit: '1份', iconStr: 'salad' },
  { id: '20', name: '无糖豆浆', cal: 30, p: 3, c: 1, f: 2, unit: '100ml', iconStr: 'drink' },
  { id: '21', name: '全脂牛奶', cal: 65, p: 3.2, c: 4.8, f: 3.5, unit: '100ml', iconStr: 'drink' },
  { id: '22', name: '拿铁(无糖)', cal: 120, p: 4, c: 10, f: 5, unit: '1杯', iconStr: 'coffee' },
  { id: '23', name: '美式咖啡(无糖)', cal: 5, p: 0, c: 1, f: 0, unit: '1杯', iconStr: 'coffee' },
  { id: '24', name: '珍珠奶茶(正常糖)', cal: 450, p: 5, c: 60, f: 20, unit: '1杯', iconStr: 'drink' },
  { id: '25', name: '可乐(常规)', cal: 140, p: 0, c: 35, f: 0, unit: '1听(330ml)', iconStr: 'drink' },
  { id: '26', name: '牛肉面', cal: 550, p: 25, c: 70, f: 15, unit: '1大碗', iconStr: 'beef' },
  { id: '27', name: '兰州拉面', cal: 500, p: 20, c: 75, f: 12, unit: '1碗', iconStr: 'beef' },
  { id: '28', name: '螺蛳粉', cal: 700, p: 18, c: 80, f: 30, unit: '1碗', iconStr: 'beef' },
  { id: '29', name: '麦当劳巨无霸', cal: 508, p: 26, c: 42, f: 26, unit: '1个', iconStr: 'bread' },
  { id: '30', name: '肯德基香辣鸡腿堡', cal: 571, p: 21, c: 45, f: 33, unit: '1个', iconStr: 'bread' },
  { id: '31', name: '番茄炒蛋(盖饭)', cal: 650, p: 18, c: 85, f: 25, unit: '1份', iconStr: 'bowl' },
  { id: '32', name: '苹果', cal: 52, p: 0.2, c: 13.8, f: 0.2, unit: '100g', iconStr: 'apple' },
  { id: '33', name: '香蕉', cal: 89, p: 1.1, c: 22.8, f: 0.3, unit: '1根(约150g)', iconStr: 'apple' },
  { id: '34', name: '薯片', cal: 536, p: 6, c: 53, f: 33, unit: '100g', iconStr: 'snack' },
];

const getDateString = (date: Date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
const isSameDay = (date1: Date | string, date2: Date | string) => getDateString(new Date(date1)) === getDateString(new Date(date2));
const isToday = (date: Date) => isSameDay(date, new Date());
const getWeekDays = (date: Date) => {
  const current = new Date(date), day = current.getDay(), diff = current.getDate() - day + (day === 0 ? -6 : 1); 
  const monday = new Date(current.setDate(diff));
  return Array.from({length: 7}, (_, i) => new Date(monday.getTime() + i * 24 * 60 * 60 * 1000));
};
const getMonthDays = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1), lastDay = new Date(year, month + 1, 0), days = [];
  let startDay = firstDay.getDay() || 7; 
  for (let i = startDay - 1; i > 0; i--) days.push(new Date(year, month, 1 - i));
  for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(year, month, i));
  for(let i=1; days.length < 42; i++) days.push(new Date(year, month + 1, i));
  return days;
};

// 自动判断当前时间对应的餐次
const getDefaultMeal = () => {
  const hour = new Date().getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 16) return 'lunch';
  if (hour < 21) return 'dinner';
  return 'snack';
};

function MainApp() {
  const [activeView, setActiveView] = useState<'home' | 'profile' | 'library' | 'create_food'>('home');
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);
  const [calendarViewDate, setCalendarViewDate] = useState(new Date()); 
  
  const [goal, setGoal] = useState(2000); 
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState('');
  
  const [allHistory, setAllHistory] = useState<RecordItem[]>([]); 
  const [waterLog, setWaterLog] = useState<Record<string, number>>({}); 
  const [stepLog, setStepLog] = useState<Record<string, number>>({}); // 新增：步数记录状态
  
  const [selectedMeal, setSelectedMeal] = useState(getDefaultMeal());
  
  const [customFoods, setCustomFoods] = useState<FoodItem[]>(defaultFoods);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFoodForAdd, setSelectedFoodForAdd] = useState<FoodItem | null>(null);
  const [addAmount, setAddAmount] = useState<string>('1');

  const [isEditingSteps, setIsEditingSteps] = useState(false);
  const [tempSteps, setTempSteps] = useState('');

  const [newFood, setNewFood] = useState({ name: '', cal: '', p: '', c: '', f: '', unit: '100g', iconStr: 'bowl' });
  const [profile, setProfile] = useState<UserProfile>({ gender: 'M', age: 25, height: 170, weight: 65, activityLevel: 1.2 });

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('myAllTimeHistory_v8_4');
      const savedGoal = localStorage.getItem('myCalorieGoal_v8_4');
      const savedWater = localStorage.getItem('myWaterLog_v8_4');
      const savedProfile = localStorage.getItem('myUserProfile_v8_4');
      const savedFoods = localStorage.getItem('myCustomFoods_v8_4');
      const savedSteps = localStorage.getItem('myStepLog_v9'); // 加载步数数据
      
      if (savedHistory) { const p = JSON.parse(savedHistory); if(Array.isArray(p)) setAllHistory(p); }
      if (savedGoal) { const g = parseInt(savedGoal, 10); if(!isNaN(g)) setGoal(g); }
      if (savedWater) { const w = JSON.parse(savedWater); if(w && typeof w === 'object') setWaterLog(w); }
      if (savedSteps) { const s = JSON.parse(savedSteps); if(s && typeof s === 'object') setStepLog(s); }
      if (savedFoods) { const f = JSON.parse(savedFoods); if(Array.isArray(f) && f.length > 0) setCustomFoods(f); }
      if (savedProfile) { const p = JSON.parse(savedProfile); if(p && typeof p === 'object') setProfile(prev => ({...prev, ...p})); }
    } catch (e) {
      console.warn("读取缓存时遇到轻微异常，已安全跳过", e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('myAllTimeHistory_v8_4', JSON.stringify(allHistory));
    localStorage.setItem('myCalorieGoal_v8_4', goal.toString());
    localStorage.setItem('myWaterLog_v8_4', JSON.stringify(waterLog));
    localStorage.setItem('myStepLog_v9', JSON.stringify(stepLog)); // 保存步数数据
    localStorage.setItem('myUserProfile_v8_4', JSON.stringify(profile));
    localStorage.setItem('myCustomFoods_v8_4', JSON.stringify(customFoods));
  }, [allHistory, goal, waterLog, stepLog, profile, customFoods]);

  const currentDateKey = getDateString(currentDate);

  const safeHistory = Array.isArray(allHistory) ? allHistory : [];
  const currentRecords = safeHistory.filter(item => item && item.timestamp && isSameDay(currentDate, item.timestamp)).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  
  const consumed = currentRecords.reduce((sum, item) => sum + (item.calories || 0), 0);
  const consumedProtein = currentRecords.reduce((sum, item) => sum + (item.protein || 0), 0);
  const consumedCarbs = currentRecords.reduce((sum, item) => sum + (item.carbs || 0), 0);
  const consumedFat = currentRecords.reduce((sum, item) => sum + (item.fat || 0), 0);
  
  // --- 步数与热量抵扣核心逻辑 ---
  const currentSteps = stepLog[currentDateKey] || 0;
  // 运动消耗公式：步数 * 0.04 * (体重 / 60) -> 比如60kg的人走10000步消耗400大卡
  const stepCaloriesBurned = Math.round(currentSteps * 0.04 * (profile.weight / 60));
  
  // 今日总允许热量 = 基础目标 + 运动消耗
  const totalAllowed = goal + stepCaloriesBurned;
  const remaining = totalAllowed - consumed;
  const progressPercent = Math.min((consumed / totalAllowed) * 100, 100);
  
  // 动态调整三大营养素目标额度 (运动消耗后可以吃更多碳水和蛋白质)
  const goalCarbs = Math.round((totalAllowed * 0.4) / 4) || 1;
  const goalProtein = Math.round((totalAllowed * 0.3) / 4) || 1;
  const goalFat = Math.round((totalAllowed * 0.3) / 9) || 1;
  
  const currentWater = waterLog[currentDateKey] || 0;

  const addWater = () => setWaterLog(prev => ({ ...prev, [currentDateKey]: Math.min((prev[currentDateKey] || 0) + 1, 8) }));
  const removeWater = () => setWaterLog(prev => ({ ...prev, [currentDateKey]: Math.max((prev[currentDateKey] || 0) - 1, 0) }));
  const deleteRecord = (id: number) => setAllHistory(safeHistory.filter(item => item.id !== id));

  const saveGoal = () => {
    const newGoal = parseInt(tempGoal, 10);
    if (newGoal > 0) setGoal(newGoal);
    setIsEditingGoal(false);
  };

  const saveSteps = () => {
    const s = parseInt(tempSteps, 10);
    if (!isNaN(s) && s >= 0) {
      setStepLog(prev => ({ ...prev, [currentDateKey]: s }));
    }
    setIsEditingSteps(false);
  };

  const safeCustomFoods = Array.isArray(customFoods) ? customFoods : defaultFoods;

  const confirmAddRecord = () => {
    if (!selectedFoodForAdd) return;
    const amount = parseFloat(addAmount) || 1;
    const newItem: RecordItem = {
      id: Date.now(), name: selectedFoodForAdd.name,
      calories: Math.round(selectedFoodForAdd.cal * amount),
      protein: parseFloat((selectedFoodForAdd.p * amount).toFixed(1)),
      carbs: parseFloat((selectedFoodForAdd.c * amount).toFixed(1)),
      fat: parseFloat((selectedFoodForAdd.f * amount).toFixed(1)),
      mealType: selectedMeal, unit: selectedFoodForAdd.unit, amount: amount,
      timestamp: isToday(currentDate) ? new Date().toISOString() : new Date(new Date(currentDate).setHours(12, 0, 0, 0)).toISOString()
    };
    setAllHistory([newItem, ...safeHistory]);
    setSelectedFoodForAdd(null);
    setAddAmount('1');
    setActiveView('home'); 
  };

  const copyYesterdayMeal = (mealId: string) => {
    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayRecords = safeHistory.filter(r => isSameDay(r.timestamp, yesterday) && r.mealType === mealId);
    
    if (yesterdayRecords.length === 0) return;

    const newRecords = yesterdayRecords.map((r, index) => ({
      ...r,
      id: Date.now() + index, 
      timestamp: isToday(currentDate) ? new Date().toISOString() : new Date(new Date(currentDate).setHours(12, 0, 0, 0)).toISOString()
    }));

    setAllHistory(prev => [...newRecords, ...prev]);
  };

  const handleAddNewCustomFood = () => {
    if (!newFood.name || !newFood.cal) return;
    const createdFood: FoodItem = {
      id: Date.now().toString(), name: newFood.name, unit: newFood.unit || '1份', iconStr: newFood.iconStr,
      cal: parseInt(newFood.cal) || 0, p: parseFloat(newFood.p) || 0, c: parseFloat(newFood.c) || 0, f: parseFloat(newFood.f) || 0,
    };
    setCustomFoods([createdFood, ...safeCustomFoods]);
    setNewFood({ name: '', cal: '', p: '', c: '', f: '', unit: '100g', iconStr: 'bowl' });
    setActiveView('library');
  };

  const filteredFoods = safeCustomFoods.filter(f => f && f.name && (f.name.toLowerCase().includes(searchQuery.toLowerCase()) || f.name.includes(searchQuery)));
  
  const calculateBodyMetrics = () => {
    const bmi = profile.weight / Math.pow(profile.height / 100, 2);
    const bmrBase = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age);
    const bmr = profile.gender === 'M' ? bmrBase + 5 : bmrBase - 161;
    return { 
      bmi: isNaN(bmi) ? 0 : bmi.toFixed(1), 
      bmr: Math.round(bmr), tdee: Math.round(bmr * profile.activityLevel),
      bmiColor: bmi < 18.5 ? 'text-blue-400' : (bmi < 24 ? 'text-emerald-400' : (bmi < 28 ? 'text-yellow-400' : 'text-red-500')),
      bmiStatus: bmi < 18.5 ? '偏瘦' : (bmi < 24 ? '标准' : (bmi < 28 ? '超重' : '肥胖'))
    };
  };
  const metrics = calculateBodyMetrics();

  const mealTypes = [
    { id: 'breakfast', name: '早餐', icon: '🌅' }, 
    { id: 'lunch', name: '午餐', icon: '☀️' },
    { id: 'dinner', name: '晚餐', icon: '🌙' }, 
    { id: 'snack', name: '加餐', icon: '🍵' },
  ];

  // ----------------------------------------------------
  // 视图渲染
  // ----------------------------------------------------
  
  if (activeView === 'create_food') {
    return (
      <MobileContainer>
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-950/80 backdrop-blur-md sticky top-0 z-10">
          <button onClick={() => setActiveView('library')} className="p-2 text-gray-400 hover:text-white"><Icon name="ArrowLeft"/></button>
          <h1 className="font-bold text-gray-100">添加自定义食物</h1>
          <div className="w-8"></div>
        </div>
        
        <div className="p-5 overflow-y-auto no-scrollbar pb-20">
          <div className="bg-gray-100 text-gray-900 p-5 rounded-xl border-4 border-gray-300 shadow-xl mb-6 font-sans">
            <h1 className="text-3xl font-black border-b-8 border-gray-900 pb-2 mb-2 tracking-tighter uppercase">Nutrition Facts</h1>
            
            <div className="flex justify-between items-center border-b-4 border-gray-900 pb-2 mb-2">
              <span className="font-bold text-sm">食物名称</span>
              <input type="text" placeholder="如：红烧肉" value={newFood.name} onChange={e => setNewFood({...newFood, name: e.target.value})} className="bg-transparent text-right font-bold outline-none placeholder-gray-400 w-3/5" />
            </div>

            <div className="flex justify-between items-center border-b-8 border-gray-900 pb-2 mb-2">
              <span className="font-bold text-sm">参考量 (Unit)</span>
              <input type="text" placeholder="100g, 1碗..." value={newFood.unit} onChange={e => setNewFood({...newFood, unit: e.target.value})} className="bg-transparent text-right font-bold outline-none placeholder-gray-400 w-3/5" />
            </div>

            <div className="flex justify-between items-end border-b-4 border-gray-900 pb-1 mb-2">
              <div>
                <div className="font-bold text-xs">Amount Per Serving</div>
                <div className="font-black text-2xl">Calories (热量)</div>
              </div>
              <div className="flex items-center text-3xl font-black">
                <input type="number" placeholder="0" value={newFood.cal} onChange={e => setNewFood({...newFood, cal: e.target.value})} className="bg-transparent text-right outline-none w-24" />
              </div>
            </div>

            <div className="text-xs font-bold border-b border-gray-400 py-1 flex justify-between">
              <span>Total Fat (脂肪)</span>
              <div className="flex items-center"><input type="number" placeholder="0" value={newFood.f} onChange={e => setNewFood({...newFood, f: e.target.value})} className="bg-transparent text-right outline-none w-12" />g</div>
            </div>
            <div className="text-xs font-bold border-b border-gray-400 py-1 flex justify-between">
              <span>Total Carbohydrate (碳水)</span>
              <div className="flex items-center"><input type="number" placeholder="0" value={newFood.c} onChange={e => setNewFood({...newFood, c: e.target.value})} className="bg-transparent text-right outline-none w-12" />g</div>
            </div>
            <div className="text-xs font-bold border-b-4 border-gray-900 py-1 flex justify-between">
              <span>Protein (蛋白质)</span>
              <div className="flex items-center"><input type="number" placeholder="0" value={newFood.p} onChange={e => setNewFood({...newFood, p: e.target.value})} className="bg-transparent text-right outline-none w-12" />g</div>
            </div>
          </div>

          <div className="mb-6">
            <label className="text-xs font-bold text-gray-500 uppercase mb-3 block">选择食物分类图标</label>
            <div className="flex flex-wrap gap-3">
              {Object.keys(iconMap).map(key => (
                <button key={key} onClick={() => setNewFood({...newFood, iconStr: key})} className={`p-3 rounded-xl transition-all text-2xl ${newFood.iconStr === key ? 'bg-emerald-500/20 border border-emerald-500/50 scale-110 shadow-lg' : 'bg-gray-900 border border-gray-800 hover:bg-gray-800'}`}>
                  {iconMap[key]}
                </button>
              ))}
            </div>
          </div>

          <button onClick={handleAddNewCustomFood} disabled={!newFood.name || !newFood.cal} className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed text-gray-950 font-black py-4 rounded-2xl transition-all flex justify-center items-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
            <Icon name="Check" /> 保存到我的食物库
          </button>
        </div>
      </MobileContainer>
    );
  }

  if (activeView === 'library') {
    return (
      <MobileContainer>
        <div className="p-4 border-b border-gray-800 bg-gray-950/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => {setActiveView('home'); setSelectedFoodForAdd(null);}} className="p-2 -ml-2 text-gray-400 hover:text-white"><Icon name="ArrowLeft"/></button>
            <h1 className="text-xl font-bold text-gray-100 flex-1">食物库</h1>
            <button onClick={() => setActiveView('create_food')} className="flex items-center gap-1 text-sm font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full"><Icon name="Plus" size={16}/> 新建</button>
          </div>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"><Icon name="Search" size={18}/></div>
            <input type="text" placeholder="搜索食物 (支持拼音/汉字)..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full bg-gray-900 border border-gray-800 text-white pl-10 pr-4 py-3 rounded-xl outline-none focus:border-emerald-500 transition-colors placeholder-gray-600" />
            {searchQuery && <button onClick={()=>setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"><Icon name="X" size={16}/></button>}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-32">
          {filteredFoods.length === 0 ? (
            <div className="text-center mt-10 text-gray-500 flex flex-col items-center">
              <div className="opacity-20 mb-3"><Icon name="Search" size={40}/></div>
              <p>找不到相关的食物</p>
              <button onClick={() => setActiveView('create_food')} className="mt-4 text-emerald-400 underline underline-offset-4">去手动新建一个？</button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFoods.map(food => (
                <div key={food.id} onClick={() => setSelectedFoodForAdd(food)} className="flex items-center justify-between bg-gray-900 hover:bg-gray-800 p-4 rounded-2xl border border-gray-800/80 cursor-pointer transition-colors active:scale-95">
                  <div className="flex items-center gap-4">
                    <span className="text-2xl">{iconMap[food.iconStr] || '🍽️'}</span>
                    <div>
                      <div className="font-bold text-gray-200 text-base">{food.name} <span className="text-xs font-normal text-gray-500 ml-1">/{food.unit}</span></div>
                      <div className="text-xs text-gray-500 mt-1 flex gap-2">
                        <span>碳 {food.c}g</span><span>蛋 {food.p}g</span><span>脂 {food.f}g</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-emerald-400">{food.cal}</div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-wider">kcal</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {selectedFoodForAdd && (
          <div className="absolute inset-x-0 bottom-0 bg-gray-900 border-t border-gray-800 rounded-t-3xl p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-30 animate-in slide-in-from-bottom-10 duration-200">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">{selectedFoodForAdd.name}</h3>
                <p className="text-gray-400 text-sm mt-1">每 {selectedFoodForAdd.unit} 含 {selectedFoodForAdd.cal} kcal</p>
              </div>
              <button onClick={() => setSelectedFoodForAdd(null)} className="p-2 bg-gray-800 rounded-full text-gray-400 hover:text-white"><Icon name="X" size={18}/></button>
            </div>
            
            <div className="flex items-center justify-between mb-6 bg-gray-950 p-4 rounded-2xl border border-gray-800">
              <span className="text-gray-400 font-bold text-sm">食用份数 (乘以 {selectedFoodForAdd.unit})</span>
              <div className="flex items-center gap-3">
                <button onClick={() => setAddAmount(Math.max(0.1, parseFloat(addAmount) - 0.5).toString())} className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-emerald-400">-</button>
                <input type="number" step="0.5" value={addAmount} onChange={e => setAddAmount(e.target.value)} className="w-12 bg-transparent text-center text-xl font-black text-white outline-none" />
                <button onClick={() => setAddAmount((parseFloat(addAmount) + 0.5).toString())} className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">+</button>
              </div>
            </div>

            <div className="flex gap-2 mb-6">
              {mealTypes.map(meal => (
                <button key={meal.id} onClick={() => setSelectedMeal(meal.id)} className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 text-sm font-bold rounded-xl transition-all border ${selectedMeal === meal.id ? 'bg-emerald-500 text-gray-950 border-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-gray-800 text-gray-400 border-transparent'}`}>
                  <span>{meal.icon}</span> <span className="text-xs">{meal.name}</span>
                </button>
              ))}
            </div>

            <button onClick={confirmAddRecord} className="w-full bg-emerald-500 hover:bg-emerald-400 text-gray-950 font-black py-4 rounded-2xl transition-transform active:scale-95 flex items-center justify-center gap-2 text-lg">
              <Icon name="PlusCircle" size={22} /> 确认打卡 ({(selectedFoodForAdd.cal * (parseFloat(addAmount)||1)).toFixed(0)} kcal)
            </button>
          </div>
        )}
      </MobileContainer>
    );
  }

  if (activeView === 'profile') {
    return (
      <MobileContainer>
         <div className="flex items-center gap-3 p-4 mb-2 sticky top-0 bg-gray-950/90 backdrop-blur-sm z-10 border-b border-gray-800">
          <button onClick={() => setActiveView('home')} className="p-2 text-gray-400 hover:text-emerald-400"><Icon name="ArrowLeft" /></button>
          <h1 className="text-xl font-bold text-gray-200">身体数据</h1>
        </div>
        <div className="p-4 overflow-y-auto no-scrollbar pb-10">
          <div className="bg-gray-900 rounded-2xl p-5 mb-6 border border-gray-800 space-y-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase flex items-center gap-2"><Icon name="User" size={16}/> 基础资料</h2>
            <div className="flex gap-4">
              <div className="flex-1"><label className="text-xs text-gray-500 mb-1 block">性别</label><div className="flex gap-2"><button onClick={() => setProfile({...profile, gender:'M'})} className={`flex-1 py-2 rounded-xl text-sm font-medium ${profile.gender === 'M' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 'bg-gray-800 text-gray-400'}`}>男生</button><button onClick={() => setProfile({...profile, gender:'F'})} className={`flex-1 py-2 rounded-xl text-sm font-medium ${profile.gender === 'F' ? 'bg-pink-500/20 text-pink-400 border border-pink-500/50' : 'bg-gray-800 text-gray-400'}`}>女生</button></div></div>
              <div className="flex-1"><label className="text-xs text-gray-500 mb-1 block">年龄</label><input type="number" value={profile.age} onChange={(e) => setProfile({...profile, age:Number(e.target.value)})} className="w-full bg-gray-800 text-white px-3 py-2 rounded-xl text-center outline-none" /></div>
            </div>
            <div className="flex gap-4">
              <div className="flex-1"><label className="text-xs text-gray-500 mb-1 block">身高(cm)</label><input type="number" value={profile.height} onChange={(e) => setProfile({...profile, height:Number(e.target.value)})} className="w-full bg-gray-800 text-white px-3 py-2 rounded-xl text-center outline-none" /></div>
              <div className="flex-1"><label className="text-xs text-gray-500 mb-1 block">体重(kg) ⚖️</label><input type="number" value={profile.weight} onChange={(e) => setProfile({...profile, weight:Number(e.target.value)})} className="w-full bg-gray-800 text-emerald-400 font-bold px-3 py-2 rounded-xl text-center outline-none" /></div>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-2 mt-2">活动水平</label>
              <div className="space-y-2">
                {[{val: 1.2, l: '几乎不运动'}, {val: 1.375, l: '轻度活动'}, {val: 1.55, l: '中度活动'}, {val: 1.725, l: '高度活动'}].map(a => (
                  <div key={a.val} onClick={() => setProfile({...profile, activityLevel:a.val})} className={`p-3 rounded-xl border flex justify-between ${profile.activityLevel === a.val ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' : 'bg-gray-800 border-transparent text-gray-300'}`}>
                    <span className="text-sm">{a.l}</span>{profile.activityLevel === a.val && <Icon name="Check" size={16}/>}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="bg-gray-900 rounded-2xl p-5 mb-6 border border-gray-800 shadow-lg relative overflow-hidden">
            <h2 className="text-sm font-bold text-gray-400 uppercase mb-4 flex items-center gap-2">🎯 分析报告</h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-800 p-4 rounded-xl"><div className="text-xs text-gray-500 mb-1">BMI</div><div className={`text-2xl font-black ${metrics.bmiColor}`}>{metrics.bmi}</div></div>
              <div className="bg-gray-800 p-4 rounded-xl"><div className="text-xs text-gray-500 mb-1">BMR</div><div className="text-2xl font-black">{metrics.bmr}<span className="text-xs text-gray-500 font-normal">kcal</span></div></div>
            </div>
            <div className="bg-gray-800 p-4 rounded-xl flex justify-between items-center"><div><div className="text-xs text-gray-500 mb-1">TDEE (总消耗)</div><div className="text-3xl font-black text-emerald-400">{metrics.tdee}</div></div></div>
          </div>
          <div className="bg-gray-900 rounded-2xl p-5 border border-gray-800 shadow-lg">
            <h2 className="text-sm font-bold text-gray-400 uppercase mb-4">一键设定目标</h2>
            <div className="space-y-3">
              <button onClick={() => { setGoal(metrics.tdee - 500); setActiveView('home'); }} className="w-full flex justify-between p-4 rounded-xl bg-gray-800 text-left"><span className="text-sm font-bold text-blue-400">🔥 减脂 (-500)</span><span className="text-lg font-black">{metrics.tdee - 500}</span></button>
              <button onClick={() => { setGoal(metrics.tdee); setActiveView('home'); }} className="w-full flex justify-between p-4 rounded-xl bg-gray-800 text-left"><span className="text-sm font-bold text-emerald-400">⚖️ 维持 (TDEE)</span><span className="text-lg font-black">{metrics.tdee}</span></button>
              <button onClick={() => { setGoal(metrics.tdee + 300); setActiveView('home'); }} className="w-full flex justify-between p-4 rounded-xl bg-gray-800 text-left"><span className="text-sm font-bold text-yellow-500">💪 增肌 (+300)</span><span className="text-lg font-black">{metrics.tdee + 300}</span></button>
            </div>
          </div>
        </div>
      </MobileContainer>
    );
  }

  // ================= 主视图：首页 (Home) =================
  return (
    <MobileContainer>
      <div className="bg-gray-900 border-b border-gray-800 px-4 pt-6 pb-2 z-20 rounded-b-3xl relative">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setIsCalendarExpanded(!isCalendarExpanded)}>
            <div className="bg-gray-800 p-2 rounded-xl text-emerald-400 group-hover:bg-gray-700"><Icon name="Calendar" size={20} /></div>
            <div>
              <h2 className="text-lg font-bold text-gray-100 flex items-center gap-1">
                {isCalendarExpanded ? `${calendarViewDate.getFullYear()}年 ${calendarViewDate.getMonth() + 1}月` : `${currentDate.getMonth() + 1}月${currentDate.getDate()}日`}
                <span className={`text-gray-500 transition-transform duration-300 ${isCalendarExpanded ? 'rotate-180' : ''}`}><Icon name="ChevronDown" size={18}/></span>
              </h2>
              <p className="text-xs text-gray-500 font-medium">{isSameDay(currentDate, new Date()) ? '今天' : '查看历史'}</p>
            </div>
          </div>
          <button onClick={() => setActiveView('profile')} className="p-2 text-emerald-400 bg-gray-800 rounded-xl relative">
            <Icon name="User" size={20} /><div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
          </button>
        </div>
        
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['一', '二', '三', '四', '五', '六', '日'].map(day => <div key={day} className="text-center text-[10px] font-bold text-gray-500">{day}</div>)}
        </div>

        <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isCalendarExpanded ? 'max-h-[22rem]' : 'max-h-12'}`}>
          <div className={`grid grid-cols-7 gap-1 ${isCalendarExpanded ? 'hidden' : 'block'}`}>
            {getWeekDays(currentDate).map((date, idx) => {
              const selected = isSameDay(date, currentDate);
              return (
                <div key={idx} onClick={() => {setCurrentDate(date); setCalendarViewDate(date); setIsCalendarExpanded(false);}} className="flex flex-col items-center justify-center cursor-pointer">
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-sm font-bold ${selected ? 'bg-emerald-500 text-gray-950' : 'text-gray-300'}`}>{date.getDate()}</div>
                  {isToday(date) && !selected && <div className="w-1 h-1 bg-emerald-500 rounded-full mt-1 absolute bottom-0"></div>}
                </div>
              );
            })}
          </div>
          <div className={isCalendarExpanded ? 'block' : 'hidden'}>
            <div className="grid grid-cols-7 gap-y-1 gap-x-1 pb-1">
              {getMonthDays(calendarViewDate.getFullYear(), calendarViewDate.getMonth()).map((date, idx) => {
                const selected = isSameDay(date, currentDate), isCurMonth = date.getMonth() === calendarViewDate.getMonth();
                return (
                  <div key={idx} onClick={() => {setCurrentDate(date); setCalendarViewDate(date); setIsCalendarExpanded(false);}} className="flex flex-col items-center justify-center h-10 cursor-pointer">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${selected ? 'bg-emerald-500 text-gray-950' : isCurMonth ? 'text-gray-300' : 'text-gray-700'}`}>{date.getDate()}</div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between items-center mt-1 pt-2 border-t border-gray-800/50">
              <button onClick={() => setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1))} className="p-2 text-gray-400 hover:text-emerald-400"><Icon name="ChevronLeft" size={18} /></button>
              <span className="text-xs text-gray-500 cursor-pointer" onClick={() => setCalendarViewDate(new Date())}>回到今月</span>
              <button onClick={() => setCalendarViewDate(new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1))} className="p-2 text-gray-400 hover:text-emerald-400"><Icon name="ChevronRight" size={18} /></button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-10">
        
        {/* 核心仪表盘 */}
        <div className="bg-gray-900 rounded-2xl p-5 mb-5 shadow-lg border border-gray-800">
          <div className="flex justify-between items-center mb-2">
            <h1 className="text-xs font-bold text-gray-400 uppercase tracking-wider">剩余大卡</h1>
            {isEditingGoal ? (
              <div className="flex items-center gap-2"><input type="number" autoFocus value={tempGoal} onChange={e=>setTempGoal(e.target.value)} onKeyDown={e=>e.key==='Enter'&&saveGoal()} className="w-16 bg-gray-800 text-sm text-center text-emerald-400 rounded outline-none py-1" /><button onClick={saveGoal} className="text-emerald-500"><Icon name="Check" size={16}/></button></div>
            ) : (
              <div className="flex items-center gap-1 group cursor-pointer bg-gray-800 px-2 py-1 rounded-md" onClick={() => {setTempGoal(goal.toString()); setIsEditingGoal(true);}}>
                <span className="text-xs text-gray-400 font-medium">目标 {goal}</span>
                {stepCaloriesBurned > 0 && <span className="text-xs text-orange-400 font-bold ml-1">+{stepCaloriesBurned}</span>}
                <span className="text-gray-500 ml-1"><Icon name="Edit" size={10} /></span>
              </div>
            )}
          </div>
          <div className="mb-4 text-5xl font-black tracking-tighter text-emerald-400">{(remaining < 0 ? 0 : remaining)}</div>
          <div className="w-full bg-gray-800 rounded-full h-1.5 mb-4 overflow-hidden"><div className={`h-full rounded-full transition-all duration-700 ${remaining < 0 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${progressPercent}%` }}></div></div>
          <div className="grid grid-cols-3 gap-3 pt-3 border-t border-gray-800">
            <div><div className="flex justify-between text-[10px] text-gray-400 mb-1"><span>碳水</span><span>{consumedCarbs}/{goalCarbs}</span></div><div className="w-full bg-gray-800 rounded-full h-1"><div className="bg-yellow-500 h-1 rounded-full" style={{ width: `${Math.min((consumedCarbs/goalCarbs)*100, 100)}%` }}></div></div></div>
            <div><div className="flex justify-between text-[10px] text-gray-400 mb-1"><span>蛋白</span><span>{consumedProtein}/{goalProtein}</span></div><div className="w-full bg-gray-800 rounded-full h-1"><div className="bg-blue-400 h-1 rounded-full" style={{ width: `${Math.min((consumedProtein/goalProtein)*100, 100)}%` }}></div></div></div>
            <div><div className="flex justify-between text-[10px] text-gray-400 mb-1"><span>脂肪</span><span>{consumedFat}/{goalFat}</span></div><div className="w-full bg-gray-800 rounded-full h-1"><div className="bg-purple-500 h-1 rounded-full" style={{ width: `${Math.min((consumedFat/goalFat)*100, 100)}%` }}></div></div></div>
          </div>
        </div>

        {/* 喝水与步数打卡区 (双列布局) */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2"><span className="text-cyan-400"><Icon name="Droplet" size={18} /></span><span className="text-sm font-bold text-gray-300">饮水打卡</span></div>
              <span className="text-xs text-gray-500">{currentWater}/8 杯</span>
            </div>
            <div className="flex gap-1 justify-between">
              {[...Array(8)].map((_, i) => (
                <button key={i} onClick={i < currentWater ? removeWater : addWater} className={`flex-1 h-7 rounded-lg transition-all ${i < currentWater ? 'bg-cyan-500/20 border-cyan-400 border' : 'bg-gray-800 border-gray-700 border'}`}>
                  <div className={`w-full h-full rounded-lg opacity-50 ${i < currentWater ? 'bg-cyan-400' : 'bg-transparent'}`}></div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 shadow-lg">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <span className="text-xl">🚶</span>
                <span className="text-sm font-bold text-gray-200">运动步数</span>
              </div>
              {isEditingSteps ? (
                <div className="flex items-center gap-2">
                  <input type="number" autoFocus value={tempSteps} onChange={e=>setTempSteps(e.target.value)} onKeyDown={e=>e.key==='Enter'&&saveSteps()} className="w-20 bg-gray-800 text-sm text-center text-orange-400 rounded outline-none py-1 border border-gray-700" placeholder="步数" />
                  <button onClick={saveSteps} className="text-orange-500 bg-orange-500/10 p-1.5 rounded-lg"><Icon name="Check" size={16}/></button>
                </div>
              ) : (
                <button onClick={() => {setTempSteps(currentSteps.toString() === '0' ? '' : currentSteps.toString()); setIsEditingSteps(true);}} className="text-xs font-bold text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors hover:bg-orange-500/20">
                  {currentSteps > 0 ? `${currentSteps} 步` : '记录步数'} <Icon name="Edit" size={12}/>
                </button>
              )}
            </div>
            {currentSteps > 0 && !isEditingSteps && (
              <div className="text-[11px] text-gray-500 mt-1.5 pl-7">
                已自动为你增加 <span className="text-orange-400 font-bold">{stepCaloriesBurned} kcal</span> 饮食额度
              </div>
            )}
          </div>
        </div>

        {/* 三餐分类栏 (横向Tab页) */}
        <div className="bg-gray-900 rounded-2xl p-1.5 mb-4 border border-gray-800 flex shadow-lg">
          {mealTypes.map(meal => {
            const mealCal = currentRecords.filter(r => r.mealType === meal.id).reduce((s, r) => s + r.calories, 0);
            const isActive = selectedMeal === meal.id;
            return (
              <button
                key={meal.id}
                onClick={() => setSelectedMeal(meal.id)}
                className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl transition-all ${isActive ? 'bg-gray-800 text-emerald-400 shadow-md' : 'text-gray-500 hover:text-gray-300'}`}
              >
                <div className="flex items-center gap-1.5 text-sm font-bold">
                  <span className="text-lg">{meal.icon}</span>
                  <span className={isActive ? 'text-gray-100' : 'hidden sm:inline'}>{meal.name}</span>
                </div>
                <div className="text-[10px] mt-1 font-medium">{mealCal > 0 ? `${mealCal} kcal` : '--'}</div>
              </button>
            )
          })}
        </div>

        {/* 当前选中餐食的详细内容区域 */}
        <div className="bg-gray-900 rounded-2xl p-4 border border-gray-800 shadow-lg mb-6 relative overflow-hidden">
          {(() => {
            const meal = mealTypes.find(m => m.id === selectedMeal)!;
            const mealRecords = currentRecords.filter(r => r.mealType === selectedMeal);
            const mealCal = mealRecords.reduce((sum, r) => sum + r.calories, 0);
            
            const yesterday = new Date(currentDate);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayRecords = safeHistory.filter(r => isSameDay(r.timestamp, yesterday) && r.mealType === meal.id);

            return (
              <>
                <div className="flex justify-between items-center mb-4 relative z-10">
                  <div className="text-sm font-bold text-gray-200">
                    {meal.name}明细 {mealCal > 0 && <span className="text-emerald-400 ml-2">{mealCal} kcal</span>}
                  </div>
                  <button 
                    onClick={() => setActiveView('library')} 
                    className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-full transition-colors"
                  >
                    <Icon name="Plus" size={14}/> 添加记录
                  </button>
                </div>

                <div className="min-h-[120px] relative z-10">
                  {mealRecords.length > 0 ? (
                    <div className="space-y-2">
                      {mealRecords.map(item => (
                        <div key={item.id} className="flex justify-between items-center bg-gray-950 p-3.5 rounded-xl border border-gray-800 group relative">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-200">{item.name}</p>
                            <p className="text-[10px] text-gray-500 mt-1">{item.amount} {item.unit}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-base font-bold text-emerald-400">{item.calories} <span className="text-[10px] font-normal text-gray-600 ml-0.5">kcal</span></span>
                            <button onClick={() => deleteRecord(item.id)} className="opacity-0 group-hover:opacity-100 text-red-500 p-2 hover:bg-red-500/20 rounded-lg transition-opacity"><Icon name="Trash" size={16}/></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    yesterdayRecords.length > 0 ? (
                      <div className="flex flex-col items-center justify-center h-full pt-4">
                        <button onClick={() => copyYesterdayMeal(meal.id)} className="w-full py-4 border border-dashed border-emerald-500/30 rounded-xl text-emerald-400 text-sm font-medium bg-emerald-500/5 hover:bg-emerald-500/10 flex justify-center items-center gap-2 transition-colors">
                          <Icon name="Copy" size={18}/> 一键复制昨天{meal.name} ({yesterdayRecords.reduce((s, r)=>s+r.calories, 0)} kcal)
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full pt-6 pb-2 text-center text-sm text-gray-600">
                        <div className="opacity-20 mb-3 text-4xl">{meal.icon}</div>
                        还没有记录{meal.name}哦 🍽️
                      </div>
                    )
                  )}
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </MobileContainer>
  );
}

function MobileContainer({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-950 sm:bg-gray-900 flex items-center justify-center sm:p-6 font-sans">
      <style dangerouslySetInnerHTML={{ __html: hideScrollbarStyle }} />
      <div className="w-full h-[100dvh] sm:h-[800px] sm:max-h-screen sm:w-[400px] bg-gray-950 sm:rounded-[2.5rem] sm:border-[8px] border-gray-800 relative overflow-hidden flex flex-col shadow-2xl">
        <div className="hidden sm:flex absolute top-0 inset-x-0 h-6 z-50 pointer-events-none justify-center">
          <div className="w-28 h-6 bg-gray-800 rounded-b-2xl"></div>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}