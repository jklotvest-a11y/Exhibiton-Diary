// 看展日记 · Storage 数据层
// localStorage 封装，所有数据读写都走这里

const Storage = (() => {
  const KEYS = {
    exhibitions: 'kz_exhibitions',
    artworks: 'kz_artworks',
    settings: 'kz_settings'
  };

  function get(key, fallback = null) {
    try {
      const raw = localStorage.getItem(KEYS[key] || key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn('[Storage] 读取失败', key, e);
      return fallback;
    }
  }

  function set(key, value) {
    try {
      localStorage.setItem(KEYS[key] || key, JSON.stringify(value));
      return true;
    } catch (e) {
      console.warn('[Storage] 写入失败', key, e);
      return false;
    }
  }

  // ========== 数字展 ==========
  function listExhibitions() {
    return get('exhibitions', []);
  }
  function getExhibition(id) {
    return listExhibitions().find(e => e.id === id);
  }
  function saveExhibition(ex) {
    const list = listExhibitions();
    const i = list.findIndex(e => e.id === ex.id);
    if (i >= 0) list[i] = ex;
    else list.unshift(ex);
    set('exhibitions', list);
  }
  function deleteExhibition(id) {
    const list = listExhibitions().filter(e => e.id !== id);
    set('exhibitions', list);
    // 联动删除其作品
    const arts = listArtworks().filter(a => a.exId !== id);
    set('artworks', arts);
  }

  // ========== 作品（画作 + 展品） ==========
  function listArtworks() {
    return get('artworks', []);
  }
  function listArtworksByType(type) {
    // type: 'painting' | 'exhibit' | null（全部）
    return type ? listArtworks().filter(a => a.type === type) : listArtworks();
  }
  function listArtworksByExhibition(exId) {
    return listArtworks().filter(a => a.exId === exId);
  }
  function getArtwork(id) {
    return listArtworks().find(a => a.id === id);
  }
  function saveArtwork(art) {
    const list = listArtworks();
    const i = list.findIndex(a => a.id === art.id);
    if (i >= 0) list[i] = art;
    else list.unshift(art);
    return set('artworks', list);
  }
  function deleteArtwork(id) {
    const list = listArtworks().filter(a => a.id !== id);
    set('artworks', list);
  }

  // ========== 统计 ==========
  function stats() {
    const exs = listExhibitions();
    const arts = listArtworks();
    return {
      exhibitions: exs.length,
      paintings: arts.filter(a => a.type === 'painting').length,
      exhibits: arts.filter(a => a.type === 'exhibit').length
    };
  }

  // ========== 工具 ==========
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  // 当前正在使用的数字展（最近打开的）
  function getCurrentExhibitionId() {
    return localStorage.getItem('kz_current_exhibition') || null;
  }
  function setCurrentExhibitionId(id) {
    if (id) localStorage.setItem('kz_current_exhibition', id);
    else localStorage.removeItem('kz_current_exhibition');
  }

  function clearAll() {
    Object.values(KEYS).forEach(k => localStorage.removeItem(k));
    localStorage.removeItem('kz_current_exhibition');
  }

  return {
    listExhibitions, getExhibition, saveExhibition, deleteExhibition,
    listArtworks, listArtworksByType, listArtworksByExhibition,
    getArtwork, saveArtwork, deleteArtwork,
    stats, uid, clearAll,
    getCurrentExhibitionId, setCurrentExhibitionId
  };
})();