// 看展日记 · 初始示例数据（Stitch 视觉版）
// 用 Unsplash 真实图片 URL（公网可访问）

(function seed() {
  if (localStorage.getItem('kz_seeded')) return;
  if (Storage.listExhibitions().length > 0) {
    localStorage.setItem('kz_seeded', '1');
    return;
  }

  const now = Date.now();
  const day = 86400000;

  // Unsplash 高质量展览相关图片
  const img = {
    monet1: 'https://images.unsplash.com/photo-1577083552431-6e5fd01988ec?w=800&q=80',  // 莫奈睡莲
    monet2: 'https://images.unsplash.com/photo-1547333590-47fae5f58d21?w=800&q=80',  // 印象派画作
    monet3: 'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=800&q=80',  // 油画
    monet4: 'https://images.unsplash.com/photo-1579541814924-49fef17c5be5?w=800&q=80', // 湖畔
    neon1: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80',   // 霓虹装置
    neon2: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=800&q=80',   // 灯光艺术
    museum1: 'https://images.unsplash.com/photo-1564399263809-d5e7c6f8c43b?w=800&q=80', // 博物馆大厅
    museum2: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800&q=80', // 古希腊雕塑
    museum3: 'https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=800&q=80', // 雕塑
    sculpture1: 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=800&q=80', // 现代雕塑
    sculpture2: 'https://images.unsplash.com/photo-1561622539-3a7d8b4d0a85?w=800&q=80', // 青铜
    painting1: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&q=80', // 抽象画
    painting2: 'https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=800&q=80', // 画作
    painting3: 'https://images.unsplash.com/photo-1531913764164-f85c52e6e654?w=800&q=80', // 画展
    chick: 'icons/icon.svg'  // 小鸡 mascot
  };

  const ex1 = {
    id: 'ex_monet',
    title: '莫奈·睡莲',
    date: '2024.05.12',
    location: '杭州·良渚文化艺术中心',
    weather: '☀️',
    summary: '第一次看印象派原作，莫奈的光影真的温柔到心化 ✦',
    cover: img.monet1,
    createdAt: now - 90 * day
  };

  const ex2 = {
    id: 'ex_neon',
    title: '光影之境：新媒体展',
    date: '2024.05.08',
    location: '上海·当代艺术馆',
    weather: '⛅',
    summary: 'teamLab 风格的沉浸式灯光装置，走进去就不想出来。',
    cover: img.neon1,
    createdAt: now - 95 * day
  };

  const ex3 = {
    id: 'ex_museum',
    title: '大英博物馆·希腊瑰宝',
    date: '2024.04.28',
    location: '伦敦·大英博物馆',
    weather: '🌫',
    summary: '帕特农雕塑的原件、命运女神、掷铁饼者……亲眼看到比课本震撼太多。',
    cover: img.museum1,
    createdAt: now - 105 * day
  };

  const ex4 = {
    id: 'ex_kusama',
    title: '草间弥生·无限之网',
    date: '2024.04.15',
    location: '上海·龙美术馆',
    weather: '☀️',
    summary: '波点、镜屋、无限的执念。草间奶奶的执念比作品本身更动人。',
    cover: img.neon2,
    createdAt: now - 120 * day
  };

  [ex1, ex2, ex3, ex4].forEach(e => Storage.saveExhibition(e));

  // 作品（画作）
  const paintings = [
    { id: 'a1', exId: 'ex_monet', type: 'painting', title: '睡莲', author: '莫奈', year: '1916', cover: img.monet1, note: '第一眼看到时，蓝紫色调让人想起那个雨后的清晨。' },
    { id: 'a2', exId: 'ex_monet', type: 'painting', title: '日出·印象', author: '莫奈', year: '1872', cover: img.monet2, note: '光在水面颤动，时间也跟着慢下来。' },
    { id: 'a3', exId: 'ex_monet', type: 'painting', title: '鲁昂大教堂', author: '莫奈', year: '1894', cover: img.monet3, note: '同一座教堂，不同时间的光。' },
    { id: 'a4', exId: 'ex_monet', type: 'painting', title: '撑伞的女人', author: '莫奈', year: '1875', cover: img.monet4, note: '逆光下的人物剪影。' },
    { id: 'a5', exId: 'ex_kusama', type: 'painting', title: '南瓜', author: '草间弥生', year: '1990s', cover: img.painting1, note: '波点的执念。' },
    { id: 'a6', exId: 'ex_kusama', type: 'painting', title: '无限的网', author: '草间弥生', year: '2000s', cover: img.painting2, note: '看到头晕，但停不下来。' }
  ];

  // 展品（立体）
  const exhibits = [
    { id: 'e1', exId: 'ex_museum', type: 'exhibit', title: '掷铁饼者', author: '米隆', year: '公元前 450', cover: img.sculpture1, note: '青铜原作，那个瞬间的肌肉张力。' },
    { id: 'e2', exId: 'ex_museum', type: 'exhibit', title: '命运女神', author: '佚名', year: '公元前 430', cover: img.museum2, note: '帕特农雕塑残件，衣服褶皱如真。' },
    { id: 'e3', exId: 'ex_neon', type: 'exhibit', title: '光之森林', author: 'teamLab', year: '2024', cover: img.sculpture2, note: '走进去像掉进光的世界。' }
  ];

  [...paintings, ...exhibits].forEach(a => Storage.saveArtwork(a));

  localStorage.setItem('kz_seeded', '1');
  console.log('[Seed] 初始数据已注入');
})();