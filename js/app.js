document.addEventListener('DOMContentLoaded', () => {
  const registered = Object.keys(Router.routes);
  if (registered.length === 0) {
    document.getElementById('mainContent').innerHTML = '<div class="md3-page" style="text-align:center;padding:40px"><p style="color:var(--md-error)">Ошибка инициализации.</p></div>';
    return;
  }

  ThemeManager.init();

  const menuBtn = document.getElementById('menuToggle');
  if (menuBtn) menuBtn.addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); openDrawer(); });

  const scrim = document.getElementById('scrim');
  if (scrim) scrim.addEventListener('click', closeDrawer);

  const themeBtn = document.getElementById('themeToggle');
  if (themeBtn) themeBtn.addEventListener('click', () => { const next = ThemeManager.toggle(); showToast(`Тема: ${{light:'Светлая',dark:'Тёмная',auto:'Авто'}[next]}`); });

  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

  const drawer = document.getElementById('navDrawer');
  if (drawer) { let touchX = 0; drawer.addEventListener('touchstart', (e) => { touchX = e.touches[0].clientX; }); drawer.addEventListener('touchmove', (e) => { if (e.touches[0].clientX - touchX < -50) closeDrawer(); }); }

  window.addEventListener('online', () => showSnackbar('🟢 Онлайн', 2000));
  window.addEventListener('offline', () => showSnackbar('🔴 Офлайн', 3000));
  if (!navigator.onLine) setTimeout(() => showSnackbar('🔴 Офлайн-режим', 3000), 1500);

  Router.start();

  // Регистрируем Service Worker с проверкой обновлений
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then((registration) => {
      console.log('SW зарегистрирован:', registration.scope);
      
      // Проверяем обновления SW
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Новый SW установлен — можно обновить
              console.log('Доступна новая версия. Обновите страницу.');
            }
          });
        }
      });
    }).catch((err) => {
      console.log('SW не зарегистрирован:', err);
    });

    // При возврате на страницу — проверяем обновления
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }
});
