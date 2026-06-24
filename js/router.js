// 看展日记 · 路由（SPA 简易 hash 路由）
// 支持 /foo/:id 这种带参路径，注册的 path 里 :id 会变成 ([^/]+)

const Router = (() => {
  const routes = {};   // 静态路径：'/'
  const paramRoutes = [];  // 带参路径：/detail/:id

  function register(path, handler) {
    if (path.includes(':')) {
      const re = new RegExp('^' + path.replace(/:[a-zA-Z_]+/g, '([^/]+)') + '$');
      paramRoutes.push({ re, handler });
    } else {
      routes[path] = handler;
    }
  }

  function navigate(path) {
    if (location.hash === '#' + path) {
      // 同一 hash 不会触发 hashchange，主动 resolve
      resolve();
    } else {
      location.hash = '#' + path;
    }
  }

  function current() {
    return location.hash.replace(/^#/, '') || '/';
  }

  function resolve() {
    const path = current();
    console.log('[Router] resolve path=', path, 'static=', Object.keys(routes), 'paramCount=', paramRoutes.length);
    if (routes[path]) { routes[path](); return; }
    for (const r of paramRoutes) {
      if (r.re.test(path)) { r.handler(); return; }
    }
    if (routes['/']) routes['/']();
    else console.warn('[Router] 无路由：', path);
  }

  window.addEventListener('hashchange', resolve);

  return { register, navigate, current, resolve };
})();