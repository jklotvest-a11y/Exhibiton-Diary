// 看展日记 · App 主入口（Stitch 视觉版 v0.5 - 1:1 移植）
// 直接采用 Google Stitch 生成的 Tailwind 风格，所有图片用 Unsplash 真实图

(function () {
  const $app = document.getElementById('app');

  // ========== 公共组件：AppBar（顶部）============
  // Step 1 重做：白底半透明 + 淡蓝边框，去掉黄底黑边
  function appBar(title, backUrl = null) {
    const backAction = backUrl === 'back'
      ? `history.back()`
      : (backUrl ? `Router.navigate('${backUrl}')` : `toast('菜单开发中 ✦')`);
    return `
      <header class="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 bg-white/85 backdrop-blur-md border-b border-[#C7E5EF] h-16 flex items-center justify-between px-5 shadow-[0_1px_4px_rgba(47,95,115,0.04)]">
        <div class="flex items-center gap-3">
          ${backUrl
            ? `<span class="material-symbols-outlined text-[#2F5F73] text-2xl cursor-pointer" onclick="${backAction}">arrow_back</span>`
            : `<span class="material-symbols-outlined text-[#2F5F73] text-2xl cursor-pointer" onclick="toast('菜单开发中 ✦')">menu</span>`
          }
          <h1 class="text-lg font-bold text-[#2F5F73] font-['Playfair_Display']">${title}</h1>
        </div>
        <div class="flex items-center gap-4">
          ${backUrl
            ? ''
            : `<span class="material-symbols-outlined text-[#7F8A85] cursor-pointer" onclick="toast('搜索下一版再加 ✦')">search</span>
               <span class="material-symbols-outlined text-[#2F5F73] cursor-pointer" onclick="Router.navigate('/profile')">account_circle</span>`
          }
        </div>
      </header>
    `;
  }

  // ========== 公共组件：Tab Bar（4 个底部 Tab）============
  // Step 1 重做：白底 + 淡蓝 pill 选中态，去掉蛋黄黄
  // 桌面下限制 max-width 480px 居中，与内容对齐
  function tabBar(active) {
    // 拍作品默认跳到一个"当前数字展"，没有则跳到 /record 让用户选
    const currentEx = activeExhibitionId();
    const scanUrl = currentEx ? ('/camera/' + currentEx) : '/record';
    const tabs = [
      { key: 'news', icon: 'auto_awesome_motion', label: '展讯', url: '/' },
      { key: 'record', icon: 'edit_note', label: '记录', url: '/record' },
      { key: 'scan', icon: 'photo_camera', label: '拍作品', url: scanUrl },
      { key: 'me', icon: 'person', label: '我的', url: '/profile' }
    ];
    return `
      <nav class="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 bg-white/90 backdrop-blur-md border-t border-[#C7E5EF] flex justify-around items-center px-3 py-3 pb-safe shadow-[0_-2px_8px_rgba(47,95,115,0.04)]">
        ${tabs.map(t => `
          <div class="flex flex-col items-center justify-center ${active === t.key ? 'bg-[#A9DFF3] text-[#2F5F73]' : 'text-[#7F8A85]'} rounded-full px-4 py-1.5 active:scale-90 transition-transform duration-150 cursor-pointer"
               onclick="Router.navigate('${t.url}')">
            <span class="material-symbols-outlined" style="${active === t.key ? "font-variation-settings: 'FILL' 1; font-size: 20px;" : 'font-size: 20px;'}">${t.icon}</span>
            <span class="text-[10px] font-bold mt-0.5">${t.label}</span>
          </div>
        `).join('')}
      </nav>
    `;
  }

  // ========== 公共组件：FAB（浮动 + 按钮）============
  // Step 1 重做：淡蓝主按钮 + 轻阴影
  function fab(url) {
    return `
      <button class="fixed bottom-24 right-6 w-14 h-14 bg-[#A9DFF3] hover:bg-[#95D4ED] border border-[#C7E5EF] rounded-full shadow-[0_4px_12px_rgba(169,223,243,0.4)] flex items-center justify-center active:scale-90 transition-all z-50 group"
              onclick="Router.navigate('${url}')">
        <span class="material-symbols-outlined text-3xl text-[#2F5F73] font-bold group-hover:rotate-90 transition-transform" style="font-variation-settings: 'wght' 600;">add</span>
      </button>
    `;
  }

  // ========== Toast ==========
  function toast(msg) {
    let t = document.querySelector('.toast');
    if (!t) {
      t = document.createElement('div');
      t.className = 'toast';
      t.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(26,26,26,0.9);color:#fff;padding:14px 24px;border-radius:16px;font-size:14px;font-weight:600;z-index:9999;pointer-events:none;opacity:0;transition:opacity 0.2s;font-family:Quicksand,sans-serif;';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.opacity = '1';
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.style.opacity = '0', 1800);
  }
  window.toast = toast;

  function render(html) {
    $app.innerHTML = html;
    window.scrollTo(0, 0);
  }

  // ========== 路由：首页（雾感淡蓝 + 奶油白） ==========
  // Step 1: 只改首页，结构按用户规划：城市情境 + 最近展大卡 + 3 统计 + 双列展卡
  Router.register('/', () => {
    const exs = Storage.listExhibitions();
    const stats = Storage.stats();
    const totalArtworks = stats.paintings + stats.exhibits;
    const recentEx = exs[0]; // 最新创建的那个

    // 城市 / 日期 / 天气情境（顶部一行）
    const today = new Date();
    const monthDay = `${today.getMonth() + 1}月${today.getDate()}日`;
    const weekday = ['周日','周一','周二','周三','周四','周五','周六'][today.getDay()];

    // 最近展大卡
    const recentBlock = recentEx ? `
      <article class="bg-white rounded-3xl overflow-hidden border border-[#C7E5EF] shadow-[0_4px_16px_rgba(47,95,115,0.06)] mb-6">
        <div class="relative aspect-[16/9] overflow-hidden">
          <img class="w-full h-full object-cover" src="${escapeAttr(recentEx.cover)}" alt="${escapeAttr(recentEx.title)}">
          <div class="absolute top-3 left-3 bg-white/85 backdrop-blur rounded-full px-3 py-1 text-xs font-semibold text-[#2F5F73] flex items-center gap-1">
            <span class="material-symbols-outlined text-sm" style="font-variation-settings: 'FILL' 1;">${getWeatherIcon(recentEx.weather)}</span>
            最近一次
          </div>
        </div>
        <div class="p-5">
          <h3 class="text-xl font-bold text-[#2F5F73] mb-1 font-['Playfair_Display']">${escapeHtml(recentEx.title)}</h3>
          <p class="text-sm text-[#7F8A85] mb-4">${escapeHtml(recentEx.location || '')} · ${escapeHtml(recentEx.date || '')}</p>
          <button class="w-full py-3 bg-[#A9DFF3] hover:bg-[#95D4ED] active:scale-[0.98] transition-all rounded-2xl text-[#2F5F73] font-bold text-sm flex items-center justify-center gap-1"
                  onclick="Router.navigate('/detail/${recentEx.id}')">
            继续整理
            <span class="material-symbols-outlined text-base">arrow_forward</span>
          </button>
        </div>
      </article>
    ` : `
      <article class="bg-white rounded-3xl border border-dashed border-[#C7E5EF] p-8 mb-6 text-center">
        <div class="text-5xl mb-3">🖼</div>
        <p class="text-[#2F5F73] font-semibold mb-1">还没有数字展</p>
        <p class="text-sm text-[#7F8A85] mb-4">点右下 + 创建你的第一个</p>
      </article>
    `;

    // 3 个小统计
    const statBlock = `
      <section class="grid grid-cols-3 gap-3 mb-8">
        <div class="bg-[#A9DFF3]/30 rounded-2xl p-4 text-center border border-[#C7E5EF]">
          <p class="text-3xl font-bold text-[#2F5F73] font-['Playfair_Display']">${stats.exhibitions}</p>
          <p class="text-xs text-[#7F8A85] mt-1">已看展</p>
        </div>
        <div class="bg-[#DFF3CE]/40 rounded-2xl p-4 text-center border border-[#C7E5EF]">
          <p class="text-3xl font-bold text-[#2F5F73] font-['Playfair_Display']">${totalArtworks}</p>
          <p class="text-xs text-[#7F8A85] mt-1">已记录</p>
        </div>
        <div class="bg-[#FFD56B]/30 rounded-2xl p-4 text-center border border-[#C7E5EF]">
          <p class="text-3xl font-bold text-[#2F5F73] font-['Playfair_Display']">0</p>
          <p class="text-xs text-[#7F8A85] mt-1">待整理</p>
        </div>
      </section>
    `;

    // 双列展卡网格
    const cardGrid = exs.length === 0
      ? ''
      : `<section class="grid grid-cols-2 gap-4">
          ${exs.map((ex, i) => `
            <article class="bg-white rounded-2xl overflow-hidden border border-[#C7E5EF] shadow-[0_2px_8px_rgba(47,95,115,0.04)] cursor-pointer active:scale-[0.98] transition-transform"
                     onclick="Router.navigate('/detail/${ex.id}')">
              <div class="relative aspect-[4/3] overflow-hidden">
                <img class="w-full h-full object-cover" src="${escapeAttr(ex.cover)}" alt="${escapeAttr(ex.title)}" loading="lazy">
                <div class="absolute top-2 right-2 bg-white/85 backdrop-blur rounded-full w-7 h-7 flex items-center justify-center">
                  <span class="material-symbols-outlined text-sm text-[#2F5F73]" style="font-variation-settings: 'FILL' 1;">${getWeatherIcon(ex.weather)}</span>
                </div>
              </div>
              <div class="p-3">
                <h4 class="text-sm font-bold text-[#27302B] truncate mb-1">${escapeHtml(ex.title)}</h4>
                <p class="text-xs text-[#7F8A85] flex items-center gap-1">
                  <span class="material-symbols-outlined text-[10px]">calendar_today</span>
                  ${escapeHtml(ex.date || '')}
                </p>
              </div>
            </article>
          `).join('')}
        </section>`;

    render(`
      ${appBar('看展日记')}

      <main class="mt-20 px-5 max-w-md mx-auto fade-in">
        <!-- 城市 / 日期 / 天气情境 -->
        <section class="py-5">
          <p class="text-xs text-[#7F8A85] tracking-wider">杭州 · ${monthDay} · ${weekday}</p>
          <h2 class="text-2xl font-bold text-[#2F5F73] mt-1 font-['Playfair_Display']">
            早安，小雅 <span class="text-[#A9DFF3]">✦</span>
          </h2>
          <p class="text-sm text-[#7F8A85] mt-1">今天想看点什么展？</p>
        </section>

        <!-- 最近展大卡 -->
        ${recentBlock}

        <!-- 3 统计 -->
        ${statBlock}

        <!-- 我的数字展 -->
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-base font-bold text-[#2F5F73] flex items-center gap-2">
            我的数字展
            <span class="text-[#A9DFF3]">✦</span>
          </h3>
          <span class="text-xs text-[#7F8A85] cursor-pointer" onclick="Router.navigate('/paintings')">查看全部</span>
        </div>

        ${cardGrid}

        <div style="height: 80px;"></div>
      </main>

      ${fab('/create')}
      ${tabBar('news')}
    `);
  });

  function getWeatherIcon(w) {
    if (w === '☀️') return 'wb_sunny';
    if (w === '⛅') return 'cloud';
    if (w === '🌧') return 'rainy';
    if (w === '❄️') return 'ac_unit';
    if (w === '🌫') return 'filter_drama';
    return 'wb_sunny';
  }

  // 当前在用的数字展 id（默认回退到最新创建的那个）
  function activeExhibitionId() {
    const id = Storage.getCurrentExhibitionId();
    if (id && Storage.getExhibition(id)) return id;
    const list = Storage.listExhibitions();
    return list[0]?.id || null;
  }

  // 压缩图片到指定最大宽 + JPEG 质量，返回 Promise<dataURL>
  // 压缩失败或浏览器没 canvas 时返回 null
  function compressImage(file, maxW, quality) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          try {
            const scale = img.width > maxW ? maxW / img.width : 1;
            const w = Math.round(img.width * scale);
            const h = Math.round(img.height * scale);
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', quality));
          } catch (e) {
            console.warn('[compress] 失败', e);
            resolve(null);
          }
        };
        img.onerror = () => resolve(null);
        img.src = ev.target.result;
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  // 转义工具，避免用户输入的 "</>" 破坏模板
  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  function escapeAttr(s) { return escapeHtml(s); }

  // ========== 路由：数字展详情 ==========
  Router.register('/detail/:id', () => {
    const id = Router.current().split('/').pop();
    const ex = Storage.getExhibition(id);
    if (!ex) {
      render(`<div class="p-20 text-center text-on-surface-variant">找不到这个数字展</div>`);
      return;
    }
    // 记下"当前在用"展，让扫一扫/记录 Tab 知道默认进哪个
    Storage.setCurrentExhibitionId(id);
    const arts = Storage.listArtworksByExhibition(id);
    const paintings = arts.filter(a => a.type === 'painting');
    const exhibits = arts.filter(a => a.type === 'exhibit');

    const artTiles = (arr) => arr.map((a, i) => `
      <article class="bg-surface-container-lowest hand-drawn-border p-3 shadow-sm sticker-rotate-${(i % 3) + 1} cursor-pointer"
               onclick="Router.navigate('/artwork/${a.id}')">
        <div class="relative aspect-square rounded-lg overflow-hidden mb-2">
          <img class="w-full h-full object-cover" src="${escapeAttr(a.cover)}" alt="${escapeAttr(a.title)}" loading="lazy">
        </div>
        <h4 class="font-title-md text-charcoal-text text-base">${escapeHtml(a.title)}</h4>
        <p class="font-caption text-on-surface-variant">${escapeHtml(a.author || '')}</p>
      </article>
    `).join('');

    function viewMode() {
      render(`
        ${appBar('展览详情', '/')}

        <main class="mt-20 px-container-margin max-w-md mx-auto fade-in">
          <!-- 大封面（手绘边框） -->
          <article class="bg-surface-container-lowest hand-drawn-border p-3 shadow-[4px_4px_0px_0px_#1A1A1A] mb-section-gap">
            <div class="relative aspect-[4/3] rounded-xl overflow-hidden">
              <img class="w-full h-full object-cover" src="${escapeAttr(ex.cover)}" alt="${escapeAttr(ex.title)}">
              <span class="absolute top-3 left-3 bg-warm-yellow border-2 border-charcoal-text rounded-full px-3 py-1 text-label-sm text-charcoal-text">
                ⭐ 精选展览
              </span>
            </div>
          </article>

          <!-- 标题 -->
          <h1 class="font-headline-lg text-headline-lg text-charcoal-text mb-3">${escapeHtml(ex.title)}</h1>

          <!-- 元信息 -->
          <div class="font-body-md text-on-surface-variant space-y-1 mb-6">
            <div class="flex items-center gap-2"><span class="material-symbols-outlined text-base">calendar_today</span>${escapeHtml(ex.date || '')}</div>
            <div class="flex items-center gap-2"><span class="material-symbols-outlined text-base">location_on</span>${escapeHtml(ex.location || '未填写地点')}</div>
            <div class="flex items-center gap-2">${escapeHtml(ex.weather || '☀️')}${ex.summary ? '· ' + escapeHtml(ex.summary.slice(0, 40)) + (ex.summary.length > 40 ? '...' : '') : ''}</div>
          </div>

          <!-- 当天小结（可编辑） -->
          <div class="bg-primary-container/30 border-2 border-charcoal-text rounded-[20px] p-5 mb-section-gap relative">
            <span class="absolute -top-3 left-5 bg-cream-base px-3 text-label-sm text-primary">✦ 当天小结</span>
            ${ex.summary
              ? `<p class="font-body-md text-on-surface-variant leading-relaxed whitespace-pre-wrap">${escapeHtml(ex.summary)}</p>`
              : `<p class="font-caption text-on-surface-variant italic">还没写，点 ✎ 补一句吧</p>`
            }
            <button class="absolute top-2 right-3 w-8 h-8 rounded-full bg-warm-yellow border-2 border-charcoal-text flex items-center justify-center active:scale-90 transition-transform"
                    onclick="editSummary('${id}')" title="编辑小结">
              <span class="material-symbols-outlined text-base text-charcoal-text">edit</span>
            </button>
          </div>

        ${paintings.length > 0 ? `
          <div class="flex items-center justify-between mb-4 mt-8">
            <h3 class="font-title-md text-charcoal-text flex items-center gap-2">
              画作 <span class="text-coral-pink">${paintings.length}</span>
            </h3>
            <span class="font-label-sm text-primary cursor-pointer" onclick="Router.navigate('/paintings')">查看全部</span>
          </div>
          <section class="grid grid-cols-2 gap-4 mb-section-gap">
            ${artTiles(paintings)}
          </section>
        ` : ''}

        ${exhibits.length > 0 ? `
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-title-md text-charcoal-text flex items-center gap-2">
              展品 <span class="text-coral-pink">${exhibits.length}</span>
            </h3>
            <span class="font-label-sm text-primary cursor-pointer" onclick="Router.navigate('/exhibits')">查看全部</span>
          </div>
          <section class="grid grid-cols-2 gap-4 mb-section-gap">
            ${artTiles(exhibits)}
          </section>
        ` : ''}

        ${arts.length === 0 ? `
          <div class="text-center py-20 text-on-surface-variant">
            <div class="text-5xl mb-3">📷</div>
            <p>还没有拍作品<br>点右下 ⊕ 开始第一张</p>
          </div>
        ` : ''}

        <div class="flex justify-center py-12 gap-4 text-outline-variant">
          <span>✦</span><span>✦</span><span>✦</span>
        </div>
      </main>

      ${fab('/camera/' + id)}
      ${tabBar('news')}
      `);
    }

    function editMode() {
      render(`
        ${appBar('展览详情', '/')}
        <main class="mt-20 px-container-margin max-w-md mx-auto fade-in">
          <article class="bg-surface-container-lowest hand-drawn-border p-3 shadow-[4px_4px_0px_0px_#1A1A1A] mb-section-gap">
            <div class="relative aspect-[4/3] rounded-xl overflow-hidden">
              <img class="w-full h-full object-cover" src="${escapeAttr(ex.cover)}" alt="${escapeAttr(ex.title)}">
            </div>
          </article>
          <h1 class="font-headline-lg text-headline-lg text-charcoal-text mb-6">${escapeHtml(ex.title)}</h1>

          <div class="bg-surface-container-lowest border-2 border-charcoal-text rounded-[20px] p-5 mb-section-gap relative">
            <span class="absolute -top-3 left-5 bg-cream-base px-3 text-label-sm text-primary">✦ 编 辑 小 结</span>
            <textarea id="summary-input" rows="6" placeholder="今天看到了什么？心情如何？"
                      class="w-full p-3 bg-cream-base border-2 border-charcoal-text rounded-2xl font-body-md text-charcoal-text outline-none focus:border-warm-yellow resize-none">${escapeHtml(ex.summary || '')}</textarea>
            <div class="flex gap-2 mt-3">
              <button class="flex-1 p-3 bg-surface-container-lowest border-2 border-charcoal-text rounded-full font-label-sm text-charcoal-text shadow-[3px_3px_0px_0px_#1A1A1A] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#1A1A1A] transition-all"
                      onclick="cancelEditSummary()">取 消</button>
              <button class="flex-1 p-3 bg-warm-yellow border-2 border-charcoal-text rounded-full font-label-sm text-charcoal-text shadow-[3px_3px_0px_0px_#1A1A1A] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#1A1A1A] transition-all"
                      onclick="saveEditSummary('${id}')">保 存</button>
            </div>
          </div>
        </main>
        ${tabBar('news')}
      `);
    }

    window.editSummary = editMode;
    window.cancelEditSummary = viewMode;
    window.saveEditSummary = (aid) => {
      const ta = document.getElementById('summary-input');
      if (!ta) return;
      const cur = Storage.getExhibition(aid);
      if (!cur) return;
      cur.summary = ta.value.trim();
      Storage.saveExhibition(cur);
      toast('小结已保存 ✦');
      viewMode();
    };

    viewMode();
  });

  // ========== 路由：创建数字展 ==========
  Router.register('/create', () => {
    let coverOptions = Storage.listExhibitions().map(e => e.cover);
    if (coverOptions.length === 0) {
      // 用 Unsplash 兜底
      coverOptions.push(
        'https://images.unsplash.com/photo-1577083552431-6e5fd01988ec?w=800&q=80',
        'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=800&q=80',
        'https://images.unsplash.com/photo-1564399263809-d5e7c6f8c43b?w=800&q=80',
        'https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=800&q=80'
      );
    }
    let coverIdx = 0;
    let customCover = null; // 用户拍照的封面 dataURL
    let weather = '☀️';
    let title = '';
    let date = new Date().toISOString().slice(0, 10);
    let location = '';

    function currentCover() { return customCover || coverOptions[coverIdx]; }

    function rerender() {
      render(`
        ${appBar('创建', '/')}
        <main class="mt-20 px-container-margin max-w-md mx-auto fade-in">
          <h1 class="font-headline-lg text-headline-lg text-charcoal-text text-center mb-section-gap" style="letter-spacing: 6px;">创 建 数 字 展</h1>

          <!-- 封面上传 -->
          <article class="bg-surface-container-lowest hand-drawn-border p-4 mb-section-gap">
            <div class="relative aspect-[4/3] rounded-xl overflow-hidden mb-3 border border-outline-variant">
              <img class="w-full h-full object-cover" src="${currentCover()}" alt="封面预览">
              ${customCover ? '<span class="absolute top-2 right-2 bg-warm-yellow border-2 border-charcoal-text rounded-full px-2 py-0.5 text-caption text-charcoal-text">📷 自拍</span>' : ''}
            </div>
            <div class="flex gap-3 justify-center">
              <label class="font-body-md text-on-surface-variant px-4 py-2 bg-surface-container-lowest rounded-full border border-charcoal-text cursor-pointer active:scale-95 transition-transform">
                📷 拍一张
                <input id="cover-input" type="file" accept="image/*" capture="environment" class="hidden">
              </label>
              <span class="font-body-md text-on-surface-variant px-4 py-2 bg-surface-container-lowest rounded-full border border-charcoal-text cursor-pointer active:scale-95 transition-transform" onclick="cycleCover()">🎨 默认</span>
            </div>
          </article>

          <!-- 表单 -->
          <div class="space-y-5 mb-section-gap">
            <div>
              <label class="font-label-sm text-primary block mb-2">展览名称</label>
              <input id="f-title" type="text" placeholder="莫奈·睡莲" value="${title}" class="w-full p-4 bg-surface-container-lowest border-2 border-charcoal-text rounded-2xl font-body-md text-charcoal-text outline-none">
            </div>
            <div>
              <label class="font-label-sm text-primary block mb-2">看展时间</label>
              <input id="f-date" type="date" value="${date}" class="w-full p-4 bg-surface-container-lowest border-2 border-charcoal-text rounded-2xl font-body-md text-charcoal-text outline-none">
            </div>
            <div>
              <label class="font-label-sm text-primary block mb-2">地点</label>
              <input id="f-loc" type="text" placeholder="杭州·良渚文化艺术中心" value="${location}" class="w-full p-4 bg-surface-container-lowest border-2 border-charcoal-text rounded-2xl font-body-md text-charcoal-text outline-none">
            </div>
            <div>
              <label class="font-label-sm text-primary block mb-2">天气</label>
              <div class="grid grid-cols-5 gap-3">
                ${['☀️','⛅','🌧','❄️','🌫'].map(w => `
                  <button class="aspect-square bg-surface-container-lowest border-2 ${w === weather ? 'border-warm-yellow bg-warm-yellow' : 'border-charcoal-text'} rounded-2xl text-2xl cursor-pointer transition-all active:scale-95" onclick="pickWeather('${w}')">${w}</button>
                `).join('')}
              </div>
            </div>
          </div>

          <button class="w-full p-4 bg-warm-yellow border-2 border-charcoal-text rounded-full shadow-[4px_4px_0px_0px_#1A1A1A] font-label-sm text-charcoal-text active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#1A1A1A] transition-all" onclick="doSave()">创 建</button>
          <div style="height: 60px;"></div>
        </main>
      `);
      // 绑定拍封面的 input
      const input = document.getElementById('cover-input');
      if (input) input.addEventListener('change', async (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        // 压缩到 1200px 宽 / JPEG 0.75
        const dataUrl = await compressImage(f, 1200, 0.75);
        if (!dataUrl) return toast('图片处理失败 😢');
        customCover = dataUrl;
        rerender();
        toast('封面已设置 ✦');
      });
    }

    window.cycleCover = () => {
      customCover = null;
      coverIdx = (coverIdx + 1) % coverOptions.length;
      rerender();
    };
    window.pickWeather = (w) => { weather = w; rerender(); };
    window.doSave = () => {
      title = document.getElementById('f-title').value.trim();
      date = document.getElementById('f-date').value;
      location = document.getElementById('f-loc').value.trim();
      if (!title) return toast('请输入展览名称');
      if (!date) return toast('请选择看展时间');
      const ex = {
        id: Storage.uid(),
        title, date, location,
        weather,
        cover: currentCover(),
        summary: '',
        createdAt: Date.now()
      };
      Storage.saveExhibition(ex);
      Storage.setCurrentExhibitionId(ex.id);
      toast('已创建 ✦');
      Router.navigate('/detail/' + ex.id);
    };

    rerender();
  });

  // ========== 路由：记录（聚合"写小结/编辑作品/新建展"） ==========
  // 进入"记录"Tab 不直接是个空页，而是：
  // ① 如果没有数字展 → 引导建第一个
  // ② 否则展示"当前展"：可改小结、可看今天拍了啥
  // ③ 还能"切展"或"新建展"
  Router.register('/record', () => {
    const exs = Storage.listExhibitions();
    if (exs.length === 0) {
      render(`
        ${appBar('记录', '/')}
        <main class="mt-20 px-container-margin max-w-md mx-auto fade-in">
          <div class="text-center py-16">
            <div class="text-6xl mb-4 chick-float">🐣</div>
            <h1 class="font-headline-lg text-headline-lg text-charcoal-text mb-2">先 建 一 个 数 字 展</h1>
            <p class="font-body-md text-on-surface-variant mb-8">看展前建一个，看展时拍的作品会自动归档到这里 ✦</p>
            <button class="px-8 py-4 bg-warm-yellow border-2 border-charcoal-text rounded-full shadow-[4px_4px_0px_0px_#1A1A1A] font-label-sm text-charcoal-text active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#1A1A1A] transition-all" onclick="Router.navigate('/create')">
              + 创建第一个数字展
            </button>
          </div>
        </main>
        ${tabBar('record')}
      `);
      return;
    }

    // 有展时，默认进"当前展"，可切换
    const currentId = activeExhibitionId() || exs[0].id;
    renderRecordPage(currentId);
  });

  // /record/:id 切到指定展的记录页
  Router.register('/record/:id', () => {
    const id = Router.current().split('/').pop();
    if (!Storage.getExhibition(id)) {
      Router.navigate('/record');
      return;
    }
    Storage.setCurrentExhibitionId(id);
    renderRecordPage(id);
  });

  function renderRecordPage(exId) {
    const ex = Storage.getExhibition(exId);
    if (!ex) { Router.navigate('/'); return; }
    const allExs = Storage.listExhibitions();
    const arts = Storage.listArtworksByExhibition(exId);
    // 按"今天"过滤 —— 简化用 createdAt 在今天范围内的算今日
    const today = new Date(); today.setHours(0,0,0,0);
    const todayTs = today.getTime();
    const todayArts = arts.filter(a => (a.createdAt || 0) >= todayTs);
    const recentArts = [...arts].sort((a,b) => (b.createdAt||0) - (a.createdAt||0));

    // 展切换条
    const exSwitcher = `
      <div class="flex items-center justify-between mb-4 bg-surface-container-lowest border-2 border-charcoal-text rounded-2xl p-3">
        <div class="flex items-center gap-2 flex-1 min-w-0">
          <img class="w-9 h-9 rounded-lg object-cover border border-charcoal-text" src="${escapeAttr(ex.cover)}" alt="${escapeAttr(ex.title)}">
          <div class="min-w-0">
            <p class="font-label-sm text-on-surface-variant">正在记录</p>
            <p class="font-title-md text-charcoal-text text-base truncate">${escapeHtml(ex.title)}</p>
          </div>
        </div>
        <label class="ml-2 font-caption text-primary border border-charcoal-text rounded-full px-3 py-1 cursor-pointer active:scale-95 transition-transform">
          切 换 ▾
          <select id="ex-switch" class="hidden">
            ${allExs.map(e => `<option value="${e.id}" ${e.id === exId ? 'selected' : ''}>${escapeHtml(e.title)}</option>`).join('')}
          </select>
        </label>
      </div>
    `;

    // 展切换 → 跳到 /record/:id
    setTimeout(() => {
      const sel = document.getElementById('ex-switch');
      if (sel) sel.addEventListener('change', (ev) => {
        const newId = ev.target.value;
        Router.navigate('/record/' + newId);
      });
    }, 0);

    // 小结编辑区
    const summaryBlock = `
      <article class="bg-surface-container-lowest hand-drawn-border p-5 mb-section-gap">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-title-md text-charcoal-text flex items-center gap-2">
            <span class="text-warm-yellow">✦</span> 当天小结
          </h3>
          <span class="font-caption text-on-surface-variant">${ex.date || ''}</span>
        </div>
        <textarea id="record-summary" rows="3" placeholder="今天看了什么？心情如何？"
                  class="w-full p-3 bg-cream-base border-2 border-charcoal-text rounded-2xl font-body-md text-charcoal-text outline-none focus:border-warm-yellow resize-none mb-3">${escapeHtml(ex.summary || '')}</textarea>
        <button class="w-full p-3 bg-warm-yellow border-2 border-charcoal-text rounded-full shadow-[3px_3px_0px_0px_#1A1A1A] font-label-sm text-charcoal-text active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#1A1A1A] transition-all"
                onclick="saveSummary('${exId}')">保 存 小 结</button>
      </article>
    `;

    // 今日作品（可补感受/标签）
    const todayBlock = todayArts.length === 0 ? `
      <div class="bg-surface-container-lowest border-2 border-charcoal-text rounded-2xl p-6 text-center mb-section-gap">
        <div class="text-4xl mb-2">📷</div>
        <p class="font-body-md text-on-surface-variant mb-3">今天还没拍作品</p>
        <button class="px-6 py-2 bg-warm-yellow border-2 border-charcoal-text rounded-full shadow-[3px_3px_0px_0px_#1A1A1A] font-label-sm text-charcoal-text active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#1A1A1A] transition-all"
                onclick="Router.navigate('/camera/${exId}')">+ 去拍一张</button>
      </div>
    ` : `
      <div class="mb-section-gap">
        <h3 class="font-title-md text-charcoal-text flex items-center gap-2 mb-3">
          今天拍的作品 <span class="text-coral-pink">${todayArts.length}</span>
        </h3>
        <div class="space-y-3">
          ${todayArts.map(a => artEditCard(a)).join('')}
        </div>
      </div>
    `;

    // 最近作品（不含今天）
    const olderArts = recentArts.filter(a => (a.createdAt || 0) < todayTs);
    const olderBlock = olderArts.length === 0 ? '' : `
      <div class="mb-section-gap">
        <h3 class="font-title-md text-charcoal-text mb-3">较 早 的 作 品</h3>
        <div class="space-y-3">
          ${olderArts.slice(0, 5).map(a => artEditCard(a)).join('')}
        </div>
      </div>
    `;

    render(`
      ${appBar('记录', '/')}
      <main class="mt-20 px-container-margin max-w-md mx-auto fade-in">
        <h1 class="font-headline-lg text-headline-lg text-charcoal-text mb-2" style="letter-spacing: 4px;">记 录</h1>
        <p class="font-body-md text-on-surface-variant mb-6">写下今天的看展心情 ✦</p>

        ${exSwitcher}
        ${summaryBlock}
        ${todayBlock}
        ${olderBlock}

        <div class="flex gap-3 mb-6">
          <button class="flex-1 p-4 bg-surface-container-lowest border-2 border-charcoal-text rounded-full font-label-sm text-charcoal-text shadow-[3px_3px_0px_0px_#1A1A1A] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#1A1A1A] transition-all"
                  onclick="Router.navigate('/create')">+ 新 建 展</button>
          <button class="flex-1 p-4 bg-warm-yellow border-2 border-charcoal-text rounded-full font-label-sm text-charcoal-text shadow-[3px_3px_0px_0px_#1A1A1A] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#1A1A1A] transition-all"
                  onclick="Router.navigate('/camera/${exId}')">📸 拍 作 品</button>
        </div>

        <div style="height: 60px;"></div>
      </main>
      ${tabBar('record')}
    `);

    // 暴露给按钮用
    window.saveSummary = (id) => {
      const ta = document.getElementById('record-summary');
      if (!ta) return;
      const cur = Storage.getExhibition(id);
      if (!cur) return;
      cur.summary = ta.value.trim();
      Storage.saveExhibition(cur);
      toast('小结已保存 ✦');
    };
  }

  // 单张作品的可编辑卡片
  function artEditCard(a) {
    return `
      <article class="bg-surface-container-lowest hand-drawn-border p-3 shadow-sm">
        <div class="flex gap-3 items-start">
          <img class="w-20 h-20 rounded-lg object-cover border border-charcoal-text flex-shrink-0" src="${escapeAttr(a.cover)}" alt="${escapeAttr(a.title)}">
          <div class="flex-1 min-w-0">
            <p class="font-label-sm text-coral-pink">${a.type === 'painting' ? '🎨 画作' : '🗿 展品'}</p>
            <h4 class="font-title-md text-charcoal-text text-base truncate">${escapeHtml(a.title)}</h4>
            <p class="font-caption text-on-surface-variant truncate">${escapeHtml(a.author || '未知')}${a.year ? ' · ' + escapeHtml(a.year) : ''}</p>
          </div>
        </div>
        <textarea data-art="${a.id}" data-field="note" rows="2" placeholder="补一句感受…"
                  class="art-edit w-full mt-3 p-2 bg-cream-base border-2 border-outline-variant rounded-xl font-body-md text-charcoal-text outline-none focus:border-warm-yellow resize-none text-sm">${escapeHtml(a.note || '')}</textarea>
        <div class="flex gap-2 mt-2">
          <button class="flex-1 py-2 bg-surface-container-high border border-charcoal-text rounded-full font-caption text-charcoal-text active:scale-95 transition-transform"
                  onclick="saveArtField('${a.id}')">保 存</button>
          <button class="px-4 py-2 bg-cream-base border border-charcoal-text rounded-full font-caption text-charcoal-text active:scale-95 transition-transform"
                  onclick="if(confirm('删除这件作品？')){Storage.deleteArtwork('${a.id}');Router.resolve();}">删 除</button>
        </div>
      </article>
    `;
  }

  window.saveArtField = (id) => {
    const ta = document.querySelector(`textarea[data-art="${id}"][data-field="note"]`);
    if (!ta) return;
    const cur = Storage.getArtwork(id);
    if (!cur) return;
    cur.note = ta.value.trim();
    Storage.saveArtwork(cur);
    toast('已保存 ✦');
  };

  // ========== 路由：画作列表 ==========
  Router.register('/paintings', () => {
    const arts = Storage.listArtworksByType('painting');
    render(`
      ${appBar('画作', '/profile')}
      <main class="mt-20 px-container-margin max-w-md mx-auto fade-in">
        <div class="py-6">
          <p class="font-label-sm text-on-surface-variant mb-1">共收藏</p>
          <p class="font-display-lg text-primary">${arts.length}<span class="font-body-md text-on-surface-variant ml-2">件画作</span></p>
        </div>
        ${arts.length === 0
          ? `<div class="text-center py-20 text-on-surface-variant"><div class="text-5xl mb-3">🎨</div><p>还没有拍过画作</p></div>`
          : `<section class="grid grid-cols-2 gap-4">${arts.map(a => `
              <article class="bg-surface-container-lowest hand-drawn-border p-3 shadow-sm sticker-rotate-${(arts.indexOf(a) % 3) + 1} cursor-pointer" onclick="Router.navigate('/artwork/${a.id}')">
                <div class="aspect-square rounded-lg overflow-hidden mb-2">
                  <img class="w-full h-full object-cover" src="${a.cover}" alt="${a.title}" loading="lazy">
                </div>
                <h4 class="font-title-md text-charcoal-text text-base">${a.title}</h4>
                <p class="font-caption text-on-surface-variant">${a.author || ''}</p>
              </article>
            `).join('')}</section>`
        }
        <div style="height: 80px;"></div>
      </main>
      ${tabBar('me')}
    `);
  });

  // ========== 路由：展品列表 ==========
  Router.register('/exhibits', () => {
    const arts = Storage.listArtworksByType('exhibit');
    render(`
      ${appBar('展品', '/profile')}
      <main class="mt-20 px-container-margin max-w-md mx-auto fade-in">
        <div class="py-6">
          <p class="font-label-sm text-on-surface-variant mb-1">共收藏</p>
          <p class="font-display-lg text-primary">${arts.length}<span class="font-body-md text-on-surface-variant ml-2">件立体展品</span></p>
        </div>
        ${arts.length === 0
          ? `<div class="text-center py-20 text-on-surface-variant"><div class="text-5xl mb-3">🗿</div><p>还没有拍过展品</p></div>`
          : `<section class="grid grid-cols-2 gap-4">${arts.map(a => `
              <article class="bg-surface-container-lowest hand-drawn-border p-3 shadow-sm sticker-rotate-${(arts.indexOf(a) % 3) + 1} cursor-pointer" onclick="Router.navigate('/artwork/${a.id}')">
                <div class="aspect-square rounded-lg overflow-hidden mb-2">
                  <img class="w-full h-full object-cover" src="${a.cover}" alt="${a.title}" loading="lazy">
                </div>
                <h4 class="font-title-md text-charcoal-text text-base">${a.title}</h4>
                <p class="font-caption text-on-surface-variant">${a.author || ''}</p>
              </article>
            `).join('')}</section>`
        }
        <div style="height: 80px;"></div>
      </main>
      ${tabBar('me')}
    `);
  });

  // ========== 路由：作品详情 ==========
  Router.register('/artwork/:id', () => {
    const id = Router.current().split('/').pop();
    const art = Storage.getArtwork(id);
    if (!art) {
      render(`<div class="p-20 text-center text-on-surface-variant">找不到这个作品</div>`);
      return;
    }
    const ex = Storage.getExhibition(art.exId);
    const tags = art.type === 'painting' ? ['画作', '印象派', '油画'] : ['展品', '立体', '装置'];

    function viewMode() {
      render(`
        ${appBar('作品', 'back')}

        <main class="mt-20 max-w-md mx-auto fade-in">
          <div class="aspect-square bg-charcoal-text">
            <img class="w-full h-full object-cover" src="${escapeAttr(art.cover)}" alt="${escapeAttr(art.title)}">
          </div>
          <div class="px-container-margin py-6">
            <h1 class="font-headline-lg text-headline-lg text-charcoal-text mb-2">${escapeHtml(art.title)}</h1>
            <p class="font-body-md text-on-surface-variant mb-4">${escapeHtml(art.author || '未知')}${art.year ? ' · ' + escapeHtml(art.year) : ''}</p>

            <div class="flex gap-2 flex-wrap mb-6">
              ${tags.map(t => `<span class="bg-warm-yellow border border-charcoal-text rounded-full px-3 py-1 font-caption text-charcoal-text transform ${tags.indexOf(t) % 2 === 0 ? '-rotate-1' : 'rotate-1'}">${escapeHtml(t)}</span>`).join('')}
            </div>

            <div class="bg-primary-container/30 border-2 border-charcoal-text rounded-[20px] p-5 relative mb-section-gap">
              <span class="absolute -top-3 left-5 bg-cream-base px-3 text-label-sm text-primary">✦ 我的感受</span>
              ${art.note
                ? `<p class="font-body-md text-on-surface-variant leading-relaxed whitespace-pre-wrap">${escapeHtml(art.note)}</p>`
                : `<p class="font-caption text-on-surface-variant italic">还没写，点"编辑"补一句吧</p>`
              }
            </div>

            ${ex ? `
              <div class="flex items-center justify-between mb-3 mt-8">
                <h3 class="font-title-md text-charcoal-text">所属数字展</h3>
              </div>
              <article class="bg-surface-container-lowest hand-drawn-border p-3 shadow-sm sticker-rotate-1 cursor-pointer" onclick="Router.navigate('/detail/${ex.id}')">
                <div class="flex gap-3 items-center">
                  <img class="w-14 h-14 rounded-lg object-cover" src="${escapeAttr(ex.cover)}" alt="${escapeAttr(ex.title)}">
                  <div class="flex-1">
                    <h4 class="font-title-md text-charcoal-text text-base">${escapeHtml(ex.title)}</h4>
                    <p class="font-caption text-on-surface-variant">${escapeHtml(ex.date)}</p>
                  </div>
                  <div class="bg-warm-yellow px-3 py-1 rounded-full text-label-sm text-charcoal-text border border-charcoal-text">
                    查看
                  </div>
                </div>
              </article>
            ` : ''}

            <div class="flex gap-3 mt-8">
              <button class="flex-1 p-4 bg-surface-container-lowest border-2 border-charcoal-text rounded-full font-label-sm text-charcoal-text shadow-[3px_3px_0px_0px_#1A1A1A] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#1A1A1A] transition-all"
                      onclick="editArtwork()">✎ 编 辑</button>
              <button class="px-5 p-4 bg-cream-base border-2 border-charcoal-text rounded-full font-label-sm text-charcoal-text active:scale-95 transition-transform"
                      onclick="deleteArtwork('${id}')">删 除</button>
            </div>
            <div style="height: 60px;"></div>
          </div>
        </main>
      `);
    }

    function editMode() {
      render(`
        ${appBar('编辑作品', 'back')}
        <main class="mt-20 px-container-margin max-w-md mx-auto fade-in">
          <div class="aspect-square bg-charcoal-text rounded-2xl overflow-hidden mb-4 border-2 border-charcoal-text">
            <img class="w-full h-full object-cover" src="${escapeAttr(art.cover)}" alt="${escapeAttr(art.title)}">
          </div>
          <div class="space-y-4 mb-6">
            <div>
              <label class="font-label-sm text-primary block mb-2">类型</label>
              <div class="grid grid-cols-2 gap-3">
                <button id="eb-painting" class="p-3 bg-surface-container-lowest border-2 ${art.type === 'painting' ? 'border-warm-yellow bg-warm-yellow shadow-[2px_2px_0px_0px_#1A1A1A]' : 'border-charcoal-text'} rounded-2xl font-label-sm text-charcoal-text" onclick="setArtType('painting')">🎨 画作</button>
                <button id="eb-exhibit" class="p-3 bg-surface-container-lowest border-2 ${art.type === 'exhibit' ? 'border-warm-yellow bg-warm-yellow shadow-[2px_2px_0px_0px_#1A1A1A]' : 'border-charcoal-text'} rounded-2xl font-label-sm text-charcoal-text" onclick="setArtType('exhibit')">🗿 展品</button>
              </div>
            </div>
            <div>
              <label class="font-label-sm text-primary block mb-2">作品名</label>
              <input id="ef-title" value="${escapeAttr(art.title)}" class="w-full p-3 bg-surface-container-lowest border-2 border-charcoal-text rounded-2xl font-body-md text-charcoal-text outline-none focus:border-warm-yellow">
            </div>
            <div>
              <label class="font-label-sm text-primary block mb-2">作者</label>
              <input id="ef-author" value="${escapeAttr(art.author || '')}" class="w-full p-3 bg-surface-container-lowest border-2 border-charcoal-text rounded-2xl font-body-md text-charcoal-text outline-none focus:border-warm-yellow">
            </div>
            <div>
              <label class="font-label-sm text-primary block mb-2">年代</label>
              <input id="ef-year" value="${escapeAttr(art.year || '')}" class="w-full p-3 bg-surface-container-lowest border-2 border-charcoal-text rounded-2xl font-body-md text-charcoal-text outline-none focus:border-warm-yellow">
            </div>
            <div>
              <label class="font-label-sm text-primary block mb-2">我的感受</label>
              <textarea id="ef-note" rows="4" class="w-full p-3 bg-surface-container-lowest border-2 border-charcoal-text rounded-2xl font-body-md text-charcoal-text outline-none focus:border-warm-yellow resize-none">${escapeHtml(art.note || '')}</textarea>
            </div>
          </div>
          <div class="flex gap-3">
            <button class="flex-1 p-4 bg-surface-container-lowest border-2 border-charcoal-text rounded-full font-label-sm text-charcoal-text shadow-[3px_3px_0px_0px_#1A1A1A] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px_#1A1A1A] transition-all" onclick="viewArtwork()">取 消</button>
            <button class="flex-1 p-4 bg-warm-yellow border-2 border-charcoal-text rounded-full font-label-sm text-charcoal-text shadow-[3px_3px_0px_0px_#1A1A1A] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[1px_1px_0px_0px#1A1A1A] transition-all" onclick="saveArtworkEdit()">保 存</button>
          </div>
          <div style="height: 60px;"></div>
        </main>
      `);
    }

    // 暴露给按钮的全局函数
    window.editArtwork = editMode;
    window.viewArtwork = viewMode;
    window.setArtType = (t) => {
      art.type = t;
      editMode();
    };
    window.saveArtworkEdit = () => {
      art.title = document.getElementById('ef-title').value.trim();
      art.author = document.getElementById('ef-author').value.trim();
      art.year = document.getElementById('ef-year').value.trim();
      art.note = document.getElementById('ef-note').value.trim();
      if (!art.title) return toast('请输入作品名');
      if (!Storage.saveArtwork(art)) {
        return toast('存储已满，先去「我的」清理一下 😢');
      }
      toast('已保存 ✦');
      viewMode();
    };
    window.deleteArtwork = (aid) => {
      if (!confirm('删除这件作品？')) return;
      Storage.deleteArtwork(aid);
      toast('已删除');
      if (ex) Router.navigate('/detail/' + ex.id);
      else Router.navigate('/');
    };

    viewMode();
  });

  // ========== 路由：拍照 ==========
  // 真拍照：<input capture> 调起原生相机/相册，存到 sessionStorage 后跳到 /ocr
  Router.register('/camera/:id', () => {
    const exId = Router.current().split('/').pop();
    const ex = Storage.getExhibition(exId);
    const exName = ex ? ex.title : '你的数字展';
    render(`
      <div style="position:fixed;inset:0;background:#1A1A1A;display:flex;flex-direction:column;z-index:100;">
        <div class="h-16 px-container-margin flex items-center justify-between border-b border-gray-700 flex-shrink-0">
          <span class="material-symbols-outlined text-white text-2xl cursor-pointer" onclick="goBackFromCamera()">close</span>
          <div class="text-white/80 text-sm font-label-sm">拍作品 · 归属「${escapeHtml(exName)}」</div>
          <span class="material-symbols-outlined text-white text-2xl opacity-30" title="相机由系统提供">photo_camera</span>
        </div>

        <div class="flex-1 flex flex-col items-center justify-center relative px-container-margin">
          <!-- 引导区：告诉你拍什么 -->
          <div class="text-center mb-6">
            <div class="text-5xl mb-3 chick-float">🐣</div>
            <p class="text-white text-base font-headline-lg-mobile">拍下你喜欢的作品</p>
            <p class="text-white/60 text-xs font-body-md mt-2">展签、画作、雕塑都可以</p>
          </div>

          <!-- 取景提示框（仅视觉引导，不是真的取景器） -->
          <div class="relative w-full max-w-xs aspect-[3/4] mb-8">
            <div class="absolute inset-0 border-2 border-dashed border-white/40 rounded-3xl"></div>
            <div class="absolute inset-3 border-2 border-dashed border-white/70 rounded-2xl"></div>
            <div class="absolute top-[20%] left-0 right-0 h-0.5 bg-coral-pink shadow-[0_0_12px_rgba(255,181,167,0.8)]" style="animation: pulse 1.5s infinite;"></div>
            <div class="absolute -bottom-7 left-0 right-0 text-center text-white/50 text-xs font-caption">对准作品 / 展签</div>
          </div>
        </div>

        <div class="py-8 text-center bg-charcoal-text flex-shrink-0">
          <!-- 隐藏的 input，label 触发；capture=environment 在手机会调后置相机 -->
          <input id="cam-input" type="file" accept="image/*" capture="environment" class="hidden">
          <button class="w-20 h-20 rounded-full bg-white border-4 border-gray-300 mx-auto flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
                  onclick="document.getElementById('cam-input').click()">
            <span class="w-16 h-16 rounded-full bg-white border-2 border-charcoal-text flex items-center justify-center text-3xl">📸</span>
          </button>
          <p class="text-white/60 text-xs font-caption mt-3">轻点拍照 / 从相册选</p>
        </div>
      </div>
      <style>@keyframes pulse { 0%,100%{opacity:0.4;} 50%{opacity:1;} }</style>
    `);

    // 绑事件
    const input = document.getElementById('cam-input');
    input.addEventListener('change', async (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      // 压缩到 1000px 宽 / JPEG 0.72
      const dataUrl = await compressImage(f, 1000, 0.72);
      if (!dataUrl) return toast('图片处理失败 😢');
      try {
        sessionStorage.setItem('kz_capture', JSON.stringify({
          exId, dataUrl, takenAt: Date.now()
        }));
      } catch (err) {
        return toast('图片太大，存不下 😢');
      }
      Router.navigate('/ocr/' + exId);
    });

    // 关闭时回到归属展（不是直接关）
    window.goBackFromCamera = () => {
      if (exId) Router.navigate('/detail/' + exId);
      else Router.navigate('/');
    };
  });

  // ========== 路由：OCR 识别结果（手填表） ==========
  Router.register('/ocr/:id', () => {
    const exId = Router.current().split('/').pop();
    // 从 sessionStorage 拿真拍照的图
    let capture = null;
    try { capture = JSON.parse(sessionStorage.getItem('kz_capture') || 'null'); } catch (e) {}
    const photoDataUrl = capture && capture.exId === exId ? capture.dataUrl : null;

    let author = '';
    let title = '';
    let year = '';
    let type = 'painting';
    let note = '';

    function ocr() {
      render(`
        <div class="min-h-screen flex flex-col bg-cream-base">
          <div class="h-16 px-container-margin flex items-center justify-between flex-shrink-0">
            <span class="material-symbols-outlined text-charcoal-text text-2xl cursor-pointer" onclick="cancelOcr()">close</span>
            <span class="font-headline-lg-mobile text-headline-lg-mobile text-primary">记 录 作 品</span>
            <span style="width:24px;"></span>
          </div>

          <!-- 拍照预览（真图或占位） -->
          <div class="mx-container-margin rounded-2xl mb-4 overflow-hidden border-2 border-charcoal-text shadow-[4px_4px_0px_0px_#1A1A1A] bg-charcoal-text">
            ${photoDataUrl
              ? `<img src="${photoDataUrl}" class="w-full max-h-[40vh] object-contain bg-black" alt="拍照预览">`
              : `<div class="w-full h-48 flex items-center justify-center text-white/50 text-sm font-body-md">还没拍照呢</div>`
            }
          </div>

          <div class="bg-surface-container-lowest rounded-t-[32px] border-t-2 border-charcoal-text shadow-[0_-8px_24px_rgba(26,26,26,0.08)] px-container-margin py-8">
            <div class="w-10 h-1 bg-outline-variant rounded-full mx-auto mb-5"></div>

            <h2 class="font-headline-lg text-headline-lg text-charcoal-text mb-1">✦ 记 下 这 件 作 品</h2>
            <p class="font-caption text-on-surface-variant mb-6">不知道的留空，之后随时能补</p>

            <div class="space-y-4 mb-6">
              <!-- 类型 -->
              <div>
                <label class="font-label-sm text-primary block mb-2">类型</label>
                <div class="grid grid-cols-2 gap-3">
                  <button id="btn-painting" class="p-3 bg-surface-container-lowest border-2 ${type === 'painting' ? 'border-warm-yellow bg-warm-yellow shadow-[2px_2px_0px_0px_#1A1A1A]' : 'border-charcoal-text'} rounded-2xl font-label-sm text-charcoal-text cursor-pointer transition-all" onclick="setType('painting')">🎨 画作</button>
                  <button id="btn-exhibit" class="p-3 bg-surface-container-lowest border-2 ${type === 'exhibit' ? 'border-warm-yellow bg-warm-yellow shadow-[2px_2px_0px_0px_#1A1A1A]' : 'border-charcoal-text'} rounded-2xl font-label-sm text-charcoal-text cursor-pointer transition-all" onclick="setType('exhibit')">🗿 展品</button>
                </div>
              </div>
              <!-- 作品名 -->
              <div>
                <label class="font-label-sm text-primary block mb-2">作品名 <span class="text-coral-pink">*</span></label>
                <input id="f-title" value="${escapeAttr(title)}" placeholder="睡莲 / 掷铁饼者" class="w-full p-3 bg-surface-container-lowest border-2 border-charcoal-text rounded-2xl font-body-md text-charcoal-text outline-none focus:border-warm-yellow">
              </div>
              <!-- 作者 -->
              <div>
                <label class="font-label-sm text-primary block mb-2">作者</label>
                <input id="f-author" value="${escapeAttr(author)}" placeholder="莫奈 / 米隆" class="w-full p-3 bg-surface-container-lowest border-2 border-charcoal-text rounded-2xl font-body-md text-charcoal-text outline-none focus:border-warm-yellow">
              </div>
              <!-- 年代 -->
              <div>
                <label class="font-label-sm text-primary block mb-2">年代</label>
                <input id="f-year" value="${escapeAttr(year)}" placeholder="1916 / 公元前 450" class="w-full p-3 bg-surface-container-lowest border-2 border-charcoal-text rounded-2xl font-body-md text-charcoal-text outline-none focus:border-warm-yellow">
              </div>
              <!-- 感受 -->
              <div>
                <label class="font-label-sm text-primary block mb-2">我的感受</label>
                <textarea id="f-note" rows="3" placeholder="第一眼看到时想到了什么…" class="w-full p-3 bg-surface-container-lowest border-2 border-charcoal-text rounded-2xl font-body-md text-charcoal-text outline-none focus:border-warm-yellow resize-none">${escapeHtml(note)}</textarea>
              </div>
            </div>

            <div class="flex gap-3">
              <button class="flex-1 p-4 bg-surface-container-lowest border-2 border-charcoal-text rounded-full font-label-sm text-charcoal-text shadow-[4px_4px_0px_0px_#1A1A1A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#1A1A1A] transition-all" onclick="cancelOcr()">取 消</button>
              <button class="flex-1 p-4 bg-warm-yellow border-2 border-charcoal-text rounded-full font-label-sm text-charcoal-text shadow-[4px_4px_0px_0px_#1A1A1A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#1A1A1A] transition-all" onclick="doSave()">保存到日记</button>
            </div>
            <div style="height: 40px;"></div>
          </div>
        </div>
      `);
    }

    window.setType = (t) => { type = t; ocr(); };
    window.cancelOcr = () => {
      try { sessionStorage.removeItem('kz_capture'); } catch (e) {}
      Router.navigate('/detail/' + exId);
    };
    window.doSave = () => {
      title = document.getElementById('f-title').value.trim();
      author = document.getElementById('f-author').value.trim();
      year = document.getElementById('f-year').value.trim();
      note = document.getElementById('f-note').value.trim();
      if (!title) return toast('请输入作品名');
      const art = {
        id: Storage.uid(),
        exId, type, title,
        author: author || '未知',
        year: year || '',
        note: note || '',
        // 优先用真拍照图，否则按类型给个 unsplash 占位（这个是真没拍时兜底）
        cover: photoDataUrl || (type === 'painting'
          ? 'https://images.unsplash.com/photo-1577083552431-6e5fd01988ec?w=600&q=80'
          : 'https://images.unsplash.com/photo-1554907984-15263bfd63bd?w=600&q=80'),
        createdAt: Date.now()
      };
      if (!Storage.saveArtwork(art)) {
        return toast('存储已满，先去「我的」清理一下 😢');
      }
      try { sessionStorage.removeItem('kz_capture'); } catch (e) {}
      toast('已保存到日记 ✦');
      Router.navigate('/detail/' + exId);
    };

    ocr();
  });

  // ========== 路由：我的 ==========
  Router.register('/profile', () => {
    const s = Storage.stats();
    render(`
      ${appBar('我的', '/')}
      <main class="mt-20 px-container-margin max-w-md mx-auto fade-in">
        <div class="text-center py-8">
          <div class="w-24 h-24 rounded-full bg-gradient-to-br from-warm-yellow to-coral-pink border-2 border-charcoal-text mx-auto mb-4 flex items-center justify-center text-5xl shadow-[4px_4px_0px_0px_#1A1A1A] overflow-hidden">
            <img src="icons/icon.svg" class="w-full h-full object-contain" alt="avatar">
          </div>
          <h1 class="font-headline-lg text-headline-lg text-charcoal-text mb-1">小雅</h1>
          <p class="font-body-md text-on-surface-variant">加入看展日记 184 天</p>
        </div>

        <section class="grid grid-cols-3 gap-3 mb-section-gap">
          <a class="bg-surface-container-lowest border-2 border-charcoal-text rounded-2xl p-4 text-center shadow-sm cursor-pointer active:scale-95 transition-transform" onclick="Router.navigate('/')">
            <div class="text-3xl mb-1">📚</div>
            <p class="font-display-lg text-primary">${s.exhibitions}</p>
            <p class="font-caption text-on-surface-variant mt-1">数字展</p>
          </a>
          <a class="bg-surface-container-lowest border-2 border-charcoal-text rounded-2xl p-4 text-center shadow-sm cursor-pointer active:scale-95 transition-transform" onclick="Router.navigate('/paintings')">
            <div class="text-3xl mb-1">🎨</div>
            <p class="font-display-lg text-primary">${s.paintings}</p>
            <p class="font-caption text-on-surface-variant mt-1">画作</p>
          </a>
          <a class="bg-surface-container-lowest border-2 border-charcoal-text rounded-2xl p-4 text-center shadow-sm cursor-pointer active:scale-95 transition-transform" onclick="Router.navigate('/exhibits')">
            <div class="text-3xl mb-1">🗿</div>
            <p class="font-display-lg text-primary">${s.exhibits}</p>
            <p class="font-caption text-on-surface-variant mt-1">展品</p>
          </a>
        </section>

        <div class="mb-3"><h3 class="font-title-md text-charcoal-text">设 置</h3></div>
        <button class="w-full flex items-center py-4 border-b border-outline-variant/50" onclick="toast('主题设置开发中 ✦')">
          <div class="w-10 h-10 rounded-xl bg-primary-container/40 flex items-center justify-center text-xl mr-3">🎨</div>
          <span class="flex-1 text-left font-body-md text-charcoal-text">主题设置</span>
          <span class="material-symbols-outlined text-on-surface-variant">chevron_right</span>
        </button>
        <button class="w-full flex items-center py-4 border-b border-outline-variant/50" onclick="toast('云同步开发中 ✦')">
          <div class="w-10 h-10 rounded-xl bg-primary-container/40 flex items-center justify-center text-xl mr-3">☁️</div>
          <span class="flex-1 text-left font-body-md text-charcoal-text">云同步</span>
          <span class="material-symbols-outlined text-on-surface-variant">chevron_right</span>
        </button>
        <button class="w-full flex items-center py-4 border-b border-outline-variant/50" onclick="exportData()">
          <div class="w-10 h-10 rounded-xl bg-primary-container/40 flex items-center justify-center text-xl mr-3">📤</div>
          <span class="flex-1 text-left font-body-md text-charcoal-text">导出我的数据</span>
          <span class="material-symbols-outlined text-on-surface-variant">chevron_right</span>
        </button>
        <button class="w-full flex items-center py-4 border-b border-outline-variant/50" onclick="resetData()">
          <div class="w-10 h-10 rounded-xl bg-primary-container/40 flex items-center justify-center text-xl mr-3">📥</div>
          <span class="flex-1 text-left font-body-md text-charcoal-text">重置示例数据</span>
          <span class="material-symbols-outlined text-on-surface-variant">chevron_right</span>
        </button>

        <div class="mb-3 mt-6"><h3 class="font-title-md text-charcoal-text">关 于</h3></div>
        <button class="w-full flex items-center py-4 border-b border-outline-variant/50" onclick="toast('看展日记 PWA v0.5 · Stitch 视觉版 1:1')">
          <div class="w-10 h-10 rounded-xl bg-primary-container/40 flex items-center justify-center text-xl mr-3">ℹ️</div>
          <span class="flex-1 text-left font-body-md text-charcoal-text">关于看展日记</span>
          <span class="material-symbols-outlined text-on-surface-variant">chevron_right</span>
        </button>

        <div style="height: 60px;"></div>
      </main>
      ${tabBar('me')}
    `);

    window.exportData = () => {
      const data = {
        exhibitions: Storage.listExhibitions(),
        artworks: Storage.listArtworks(),
        exportedAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kanzhan-${Date.now()}.json`;
      a.click();
      toast('已下载 ✦');
    };

    window.resetData = () => {
      if (confirm('重置所有数据并恢复示例？')) {
        Storage.clearAll();
        localStorage.removeItem('kz_seeded');
        location.reload();
      }
    };
  });

  // ========== 启动 ==========
  Router.resolve();

  // ========== Service Worker ==========
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then(reg => console.log('[SW] 注册成功', reg.scope))
        .catch(err => console.warn('[SW] 注册失败', err));
    });
  }
})();