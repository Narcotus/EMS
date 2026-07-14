// ============================================================
// APP — Главный модуль приложения
// ============================================================

console.log('🚀 Starting EMS Minsk PWA...');

// Состояние приложения
var state = {
  currentSection: 'home',
  favorites: new Set(),
  theme: 'light',
  sidebarOpen: false,
  searchQuery: '',
  selectedCategory: 'all'
};

// ============================================================
// Инициализация IndexedDB
// ============================================================
function initApp() {
  console.log('🔄 Initializing app...');
  
  var hasSavedState = loadState();
  
  loadTheme();
  updateOfflineStatus();

  // Навигация
  var links = document.querySelectorAll('.nav-link');
  for (var i = 0; i < links.length; i++) {
    (function(link) {
      link.addEventListener('click', function(e) {
        e.preventDefault();
        var href = link.getAttribute('href');
        navigate(href);
      });
    })(links[i]);
  }

  // Кнопки
  var menuBtn = document.getElementById('menuToggle');
  var themeBtn = document.getElementById('themeToggle');
  if (menuBtn) menuBtn.addEventListener('click', toggleSidebar);
  if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

  // Закрытие сайдбара при клике вне
  document.addEventListener('click', function(e) {
    if (state.sidebarOpen && !e.target.closest('.sidebar') && !e.target.closest('.menu-btn')) {
      closeSidebar();
    }
  });

  // Обработка навигации назад/вперед
  window.addEventListener('popstate', function() {
    var hash = window.location.hash || '#/';
    var section = hash.replace('#/', '').split('?')[0] || 'home';
    state.currentSection = section;
    renderCurrentSection();
    updateActiveNav(section);
    updatePageTitle(section);
    closeSidebar();
  });

  // Закрытие модального окна по ESC
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeModal();
    }
  });

  // Закрытие модального окна по клику на фон
  var modal = document.getElementById('docModal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        closeModal();
      }
    });
  }

  // Кнопка закрытия модального окна
  var closeBtn = document.getElementById('modalClose');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeModal);
  }

  // Регистрация Service Worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
      .then(function() { console.log('✅ SW registered'); })
      .catch(function(err) { console.error('❌ SW registration:', err); });
  }

  // Начальная навигация
  var initialHash = window.location.hash;
  if (hasSavedState && !initialHash) {
    navigate('#/' + state.currentSection, true);
  } else if (initialHash) {
    navigate(initialHash, true);
  } else {
    navigate('#/', true);
  }

  console.log('✅ EMS Минск PWA инициализировано');
}

// ============================================================
// Сохранение состояния
// ============================================================
function saveState() {
  try {
    localStorage.setItem('emsState', JSON.stringify({
      currentSection: state.currentSection,
      theme: state.theme,
      searchQuery: state.searchQuery,
      selectedCategory: state.selectedCategory
    }));
  } catch (e) {
    console.error('❌ Ошибка сохранения состояния:', e);
  }
}

function loadState() {
  try {
    var saved = localStorage.getItem('emsState');
    if (saved) {
      var parsed = JSON.parse(saved);
      state.currentSection = parsed.currentSection || 'home';
      state.theme = parsed.theme || 'light';
      state.searchQuery = parsed.searchQuery || '';
      state.selectedCategory = parsed.selectedCategory || 'all';
      console.log('✅ State loaded:', state.currentSection);
      return true;
    }
  } catch (e) {
    console.error('❌ Ошибка загрузки состояния:', e);
  }
  return false;
}

// ============================================================
// Роутинг
// ============================================================
function navigate(hash, replaceHistory) {
  replaceHistory = replaceHistory || false;
  var section = hash.replace('#/', '').split('?')[0] || 'home';
  console.log('🔀 Navigating to:', section);
  state.currentSection = section;
  state.searchQuery = '';
  state.selectedCategory = 'all';
  renderCurrentSection();
  updateActiveNav(section);
  updatePageTitle(section);
  closeSidebar();
  saveState();
  
  if (!replaceHistory) {
    window.history.pushState(null, '', hash);
  }
}

function updatePageTitle(section) {
  var titles = {
    home: 'Справочная система для скорой медицинской помощи',
    orders: '📋 Приказы',
    guidelines: '📖 Клинические рекомендации',
    calculators: '🧮 Калькуляторы',
    reference: '📚 Шпаргалки и справочная информация'
  };
  var el = document.getElementById('pageTitle');
  if (el) el.textContent = titles[section] || 'Справочная система для скорой медицинской помощи';
}

function updateActiveNav(section) {
  var links = document.querySelectorAll('.nav-link');
  for (var i = 0; i < links.length; i++) {
    var link = links[i];
    if (link.dataset.section === section) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  }
}

function renderCurrentSection() {
  var container = document.getElementById('pageContent');
  if (!container) {
    console.error('❌ pageContent not found');
    return;
  }
  console.log('🎨 Rendering section:', state.currentSection);
  switch (state.currentSection) {
    case 'home': renderHome(container); break;
    case 'orders': renderOrders(container); break;
    case 'guidelines': renderGuidelines(container); break;
    case 'calculators': renderCalculators(container); break;
    case 'reference': renderReference(container); break;
    default: renderHome(container);
  }
}

// ============================================================
// Рендеринг: Главная
// ============================================================
function renderHome(container) {
  var favoritesData = getAllFavorites();
  var timeOfDay = getTimeOfDay();
  var formattedDate = getFormattedDate();
  
  var sectionCards = [
    { id: 'orders', icon: '📋', title: 'Приказы', desc: 'Актуальные документы и распоряжения' },
    { id: 'guidelines', icon: '📖', title: 'Клинические рекомендации', desc: 'Протоколы и алгоритмы лечения' },
    { id: 'calculators', icon: '🧮', title: 'Калькуляторы', desc: 'Шкалы и индексы для оценки' },
    { id: 'reference', icon: '📚', title: 'Шпаргалки и справочная информация', desc: 'Лекарства, нормы, критерии' }
  ];

  var html = '<div class="home-page">';
  
  html += '<div class="hero-banner">';
  html += '<div class="hero-left">';
  html += '<div class="hero-time-icon">' + timeOfDay.emoji + '</div>';
  html += '<div class="hero-greeting">';
  html += '<span class="hero-greeting-text">' + timeOfDay.text + '</span>';
  html += '</div></div>';
  html += '<div class="hero-right">';
  html += '<div class="hero-date">' + formattedDate + '</div>';
  html += '</div></div>';

  html += '<div class="section-cards-grid">';
  for (var i = 0; i < sectionCards.length; i++) {
    var card = sectionCards[i];
    html += '<div class="section-card" onclick="window._navigateTo(\'' + card.id + '\')">';
    html += '<div class="section-card-icon">' + card.icon + '</div>';
    html += '<h3 class="section-card-title">' + card.title + '</h3>';
    html += '<p class="section-card-desc">' + card.desc + '</p>';
    html += '<span class="section-card-arrow">→</span>';
    html += '</div>';
  }
  html += '</div>';

  if (favoritesData.length > 0) {
    html += '<div class="favorites-section">';
    html += '<h3>⭐ Избранное</h3>';
    html += '<div class="favorites-grid">';
    for (var j = 0; j < favoritesData.length; j++) {
      var item = favoritesData[j];
      html += '<div class="favorite-card" onclick="window._navigateTo(\'' + item.section + '\')">';
      html += '<span class="favorite-icon">' + item.icon + '</span>';
      html += '<span class="favorite-title">' + item.title + '</span>';
      html += '</div>';
    }
    html += '</div></div>';
  } else {
    html += '<div class="empty-favorites">';
    html += '<p>⭐ Добавляйте важные материалы в избранное, и они появятся здесь</p>';
    html += '</div>';
  }

  html += '</div>';
  container.innerHTML = html;
}

function getAllFavorites() {
  var all = [];
  for (var i = 0; i < DATA.orders.length; i++) {
    var o = DATA.orders[i];
    all.push({ id: o.id, title: o.title, section: 'orders', icon: '📋' });
  }
  for (var j = 0; j < DATA.guidelines.length; j++) {
    var g = DATA.guidelines[j];
    all.push({ id: g.id, title: g.title, section: 'guidelines', icon: '📖' });
  }
  for (var k = 0; k < DATA.calculators.length; k++) {
    var c = DATA.calculators[k];
    all.push({ id: c.id, title: c.title, section: 'calculators', icon: '🧮' });
  }
  for (var l = 0; l < DATA.reference.length; l++) {
    var r = DATA.reference[l];
    all.push({ id: r.id, title: r.title, section: 'reference', icon: '📚' });
  }
  return all.filter(function(item) { return state.favorites.has(item.id); });
}

// ============================================================
// Модальное окно для просмотра документов
// ============================================================
function openModal(doc, type) {
  console.log('📄 Opening modal for:', doc.title);
  
  var typeLabels = {
    'order': '📋 Приказ',
    'guideline': '📖 Клиническая рекомендация',
    'reference': '📚 Справочная информация'
  };
  
  var modal = document.getElementById('docModal');
  var modalType = document.getElementById('modalType');
  var modalTitle = document.getElementById('modalTitle');
  var modalMeta = document.getElementById('modalMeta');
  var modalContent = document.getElementById('modalContent');
  
  if (!modal) {
    console.error('❌ Modal element not found');
    return;
  }
  
  modalType.textContent = typeLabels[type] || 'Документ';
  modalTitle.textContent = doc.title || 'Без названия';
  
  // Мета-информация
  var metaHtml = '';
  if (doc.category) {
    metaHtml += '<span class="modal-category">' + doc.category + '</span>';
  }
  if (doc.date) {
    metaHtml += '<span class="modal-date">📅 ' + doc.date + '</span>';
  }
  if (modalMeta) modalMeta.innerHTML = metaHtml;
  
  // Содержание
  var contentHtml = '';
  if (doc.content) {
    var paragraphs = doc.content.split('\n');
    for (var i = 0; i < paragraphs.length; i++) {
      if (paragraphs[i].trim()) {
        contentHtml += '<p>' + paragraphs[i].trim() + '</p>';
      }
    }
  } else {
    contentHtml = '<p>Содержание не найдено</p>';
  }
  if (modalContent) modalContent.innerHTML = contentHtml;
  
  // Показываем модальное окно
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  console.log('🔒 Closing modal');
  var modal = document.getElementById('docModal');
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// ============================================================
// Рендеринг: Приказы (с карточками)
// ============================================================
function renderOrders(container) {
  console.log('📋 Rendering Orders');
  var categories = ['all'];
  for (var i = 0; i < DATA.orders.length; i++) {
    if (categories.indexOf(DATA.orders[i].category) === -1) {
      categories.push(DATA.orders[i].category);
    }
  }
  
  var filtered = DATA.orders.filter(function(o) {
    var matchCategory = state.selectedCategory === 'all' || o.category === state.selectedCategory;
    var matchSearch = o.title.toLowerCase().indexOf(state.searchQuery.toLowerCase()) !== -1 ||
                      o.summary.toLowerCase().indexOf(state.searchQuery.toLowerCase()) !== -1;
    return matchCategory && matchSearch;
  });

  var html = '<div class="section-page">';
  html += '<div class="section-toolbar">';
  html += '<div class="search-box">';
  html += '<input type="text" id="searchInput" placeholder="🔍 Поиск..." value="' + state.searchQuery + '" />';
  html += '</div>';
  html += '<div class="filter-box">';
  html += '<select id="categoryFilter">';
  for (var j = 0; j < categories.length; j++) {
    var c = categories[j];
    var selected = state.selectedCategory === c ? 'selected' : '';
    html += '<option value="' + c + '" ' + selected + '>' + (c === 'all' ? 'Все категории' : c) + '</option>';
  }
  html += '</select></div></div>';

  html += '<div class="items-grid">';
  if (filtered.length > 0) {
    for (var k = 0; k < filtered.length; k++) {
      var order = filtered[k];
      var favClass = state.favorites.has(order.id) ? 'favorited' : '';
      var favStar = state.favorites.has(order.id) ? '⭐' : '☆';
      
      html += '<div class="item-card ' + favClass + '" onclick="window._openDocument(\'' + order.id + '\', \'order\')">';
      html += '<div class="item-header">';
      html += '<span class="item-category">' + order.category + '</span>';
      html += '<button class="favorite-btn" onclick="event.stopPropagation(); window._toggleFavorite(\'' + order.id + '\')" aria-label="В избранное">' + favStar + '</button>';
      html += '</div>';
      html += '<h4 class="item-title">' + order.title + '</h4>';
      html += '<p class="item-date">📅 ' + order.date + '</p>';
      html += '<p class="item-summary">' + order.summary + '</p>';
      html += '<span class="item-open-hint">📄 Открыть документ →</span>';
      html += '</div>';
    }
  } else {
    html += '<div class="empty-state">📭 Ничего не найдено</div>';
  }
  html += '</div></div>';
  container.innerHTML = html;
  setupSectionListeners();
}

// ============================================================
// Рендеринг: Клинические рекомендации (с карточками)
// ============================================================
function renderGuidelines(container) {
  console.log('📖 Rendering Guidelines');
  var categories = ['all'];
  for (var i = 0; i < DATA.guidelines.length; i++) {
    if (categories.indexOf(DATA.guidelines[i].category) === -1) {
      categories.push(DATA.guidelines[i].category);
    }
  }
  
  var filtered = DATA.guidelines.filter(function(g) {
    var matchCategory = state.selectedCategory === 'all' || g.category === state.selectedCategory;
    var matchSearch = g.title.toLowerCase().indexOf(state.searchQuery.toLowerCase()) !== -1 ||
                      g.summary.toLowerCase().indexOf(state.searchQuery.toLowerCase()) !== -1;
    return matchCategory && matchSearch;
  });

  var html = '<div class="section-page">';
  html += '<div class="section-toolbar">';
  html += '<div class="search-box">';
  html += '<input type="text" id="searchInput" placeholder="🔍 Поиск..." value="' + state.searchQuery + '" />';
  html += '</div>';
  html += '<div class="filter-box">';
  html += '<select id="categoryFilter">';
  for (var j = 0; j < categories.length; j++) {
    var c = categories[j];
    var selected = state.selectedCategory === c ? 'selected' : '';
    html += '<option value="' + c + '" ' + selected + '>' + (c === 'all' ? 'Все категории' : c) + '</option>';
  }
  html += '</select></div></div>';

  html += '<div class="items-grid">';
  if (filtered.length > 0) {
    for (var k = 0; k < filtered.length; k++) {
      var guideline = filtered[k];
      var favClass = state.favorites.has(guideline.id) ? 'favorited' : '';
      var favStar = state.favorites.has(guideline.id) ? '⭐' : '☆';
      
      html += '<div class="item-card ' + favClass + '" onclick="window._openDocument(\'' + guideline.id + '\', \'guideline\')">';
      html += '<div class="item-header">';
      html += '<span class="item-category">' + guideline.category + '</span>';
      html += '<button class="favorite-btn" onclick="event.stopPropagation(); window._toggleFavorite(\'' + guideline.id + '\')" aria-label="В избранное">' + favStar + '</button>';
      html += '</div>';
      html += '<h4 class="item-title">' + guideline.title + '</h4>';
      html += '<p class="item-summary">' + guideline.summary + '</p>';
      html += '<span class="item-open-hint">📄 Открыть документ →</span>';
      html += '</div>';
    }
  } else {
    html += '<div class="empty-state">📭 Ничего не найдено</div>';
  }
  html += '</div></div>';
  container.innerHTML = html;
  setupSectionListeners();
}

// ============================================================
// Рендеринг: Калькуляторы
// ============================================================
function renderCalculators(container) {
  console.log('🧮 Rendering Calculators');
  var filtered = DATA.calculators.filter(function(c) {
    return c.title.toLowerCase().indexOf(state.searchQuery.toLowerCase()) !== -1 ||
           c.description.toLowerCase().indexOf(state.searchQuery.toLowerCase()) !== -1;
  });

  var html = '<div class="section-page">';
  html += '<div class="section-toolbar">';
  html += '<div class="search-box">';
  html += '<input type="text" id="searchInput" placeholder="🔍 Поиск калькуляторов..." value="' + state.searchQuery + '" />';
  html += '</div></div>';

  html += '<div class="items-grid">';
  if (filtered.length > 0) {
    for (var k = 0; k < filtered.length; k++) {
      var calc = filtered[k];
      var favClass = state.favorites.has(calc.id) ? 'favorited' : '';
      var favStar = state.favorites.has(calc.id) ? '⭐' : '☆';
      html += '<div class="item-card calc-card ' + favClass + '">';
      html += '<div class="item-header">';
      html += '<span class="item-category">' + calc.category + '</span>';
      html += '<button class="favorite-btn" onclick="event.stopPropagation(); window._toggleFavorite(\'' + calc.id + '\')" aria-label="В избранное">' + favStar + '</button>';
      html += '</div>';
      html += '<h4 class="item-title">' + calc.title + '</h4>';
      html += '<p class="item-summary">' + calc.description + '</p>';
      html += '<div class="calc-fields">';
      for (var f = 0; f < calc.fields.length; f++) {
        var field = calc.fields[f];
        html += '<div class="calc-field">';
        html += '<label>' + field.name + '</label>';
        html += '<select class="calc-select" data-calc-id="' + calc.id + '" data-field-idx="' + f + '">';
        for (var o = 0; o < field.options.length; o++) {
          html += '<option value="' + field.scores[o] + '">' + field.options[o] + ' (' + field.scores[o] + ' баллов)</option>';
        }
        html += '</select></div>';
      }
      html += '</div>';
      html += '<button class="calc-result-btn" onclick="event.stopPropagation(); window._calculate(\'' + calc.id + '\')">Рассчитать</button>';
      html += '<div class="calc-result" id="calc-result-' + calc.id + '"></div>';
      html += '</div>';
    }
  } else {
    html += '<div class="empty-state">📭 Ничего не найдено</div>';
  }
  html += '</div></div>';
  container.innerHTML = html;
  setupSectionListeners();
}

window._calculate = function(calcId) {
  console.log('🧮 Calculating:', calcId);
  var calc = null;
  for (var i = 0; i < DATA.calculators.length; i++) {
    if (DATA.calculators[i].id === calcId) {
      calc = DATA.calculators[i];
      break;
    }
  }
  if (!calc) return;
  
  var selects = document.querySelectorAll('.calc-select[data-calc-id="' + calcId + '"]');
  var total = 0;
  var results = [];
  
  for (var j = 0; j < selects.length; j++) {
    var select = selects[j];
    var val = parseInt(select.value) || 0;
    var field = calc.fields[j];
    var selectedText = field.options[field.scores.indexOf(val)] || '';
    total += val;
    results.push(field.name + ': ' + val + ' (' + selectedText + ')');
  }

  var resultDiv = document.getElementById('calc-result-' + calcId);
  if (resultDiv) {
    var interpretation = getInterpretation(calcId, total);
    var riskClass = getRiskClass(calcId, total);
    
    resultDiv.innerHTML = '<div class="calc-result-content">' +
      '<strong>Результат: ' + total + ' баллов</strong>' +
      '<div class="calc-detail">' + results.join('; ') + '</div>' +
      '<div class="calc-interpretation ' + riskClass + '">' + interpretation + '</div>' +
      '</div>';
    resultDiv.style.display = 'block';
  }
};

// ============================================================
// Рендеринг: Шпаргалки и справочная информация (с карточками)
// ============================================================
function renderReference(container) {
  console.log('📚 Rendering Reference');
  var categories = ['all'];
  for (var i = 0; i < DATA.reference.length; i++) {
    if (categories.indexOf(DATA.reference[i].category) === -1) {
      categories.push(DATA.reference[i].category);
    }
  }
  
  var filtered = DATA.reference.filter(function(r) {
    var matchCategory = state.selectedCategory === 'all' || r.category === state.selectedCategory;
    var matchSearch = r.title.toLowerCase().indexOf(state.searchQuery.toLowerCase()) !== -1 ||
                      r.content.toLowerCase().indexOf(state.searchQuery.toLowerCase()) !== -1;
    return matchCategory && matchSearch;
  });

  var html = '<div class="section-page">';
  html += '<div class="section-toolbar">';
  html += '<div class="search-box">';
  html += '<input type="text" id="searchInput" placeholder="🔍 Поиск..." value="' + state.searchQuery + '" />';
  html += '</div>';
  html += '<div class="filter-box">';
  html += '<select id="categoryFilter">';
  for (var j = 0; j < categories.length; j++) {
    var c = categories[j];
    var selected = state.selectedCategory === c ? 'selected' : '';
    html += '<option value="' + c + '" ' + selected + '>' + (c === 'all' ? 'Все категории' : c) + '</option>';
  }
  html += '</select></div></div>';

  html += '<div class="items-grid">';
  if (filtered.length > 0) {
    for (var k = 0; k < filtered.length; k++) {
      var ref = filtered[k];
      var favClass = state.favorites.has(ref.id) ? 'favorited' : '';
      var favStar = state.favorites.has(ref.id) ? '⭐' : '☆';
      
      html += '<div class="item-card ' + favClass + '" onclick="window._openDocument(\'' + ref.id + '\', \'reference\')">';
      html += '<div class="item-header">';
      html += '<span class="item-category">' + ref.category + '</span>';
      html += '<button class="favorite-btn" onclick="event.stopPropagation(); window._toggleFavorite(\'' + ref.id + '\')" aria-label="В избранное">' + favStar + '</button>';
      html += '</div>';
      html += '<h4 class="item-title">' + ref.title + '</h4>';
      html += '<span class="item-open-hint">📄 Открыть документ →</span>';
      html += '</div>';
    }
  } else {
    html += '<div class="empty-state">📭 Ничего не найдено</div>';
  }
  html += '</div></div>';
  container.innerHTML = html;
  setupSectionListeners();
}

// ============================================================
// Функция открытия документа в модальном окне
// ============================================================
window._openDocument = function(id, type) {
  console.log('📄 Opening document:', id, type);
  
  // Находим документ по ID и типу
  var doc = null;
  var items = [];
  
  if (type === 'order') {
    items = DATA.orders;
  } else if (type === 'guideline') {
    items = DATA.guidelines;
  } else if (type === 'reference') {
    items = DATA.reference;
  } else {
    console.error('❌ Unknown type:', type);
    return;
  }
  
  for (var i = 0; i < items.length; i++) {
    if (items[i].id === id) {
      doc = items[i];
      break;
    }
  }
  
  if (doc) {
    console.log('✅ Document found:', doc.title);
    openModal(doc, type);
  } else {
    console.error('❌ Document not found:', id);
  }
};

// ============================================================
// UI Helpers
// ============================================================
function setupSectionListeners() {
  var searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', function(e) {
      state.searchQuery = e.target.value;
      renderCurrentSection();
      saveState();
    });
  }

  var filterSelect = document.getElementById('categoryFilter');
  if (filterSelect) {
    filterSelect.addEventListener('change', function(e) {
      state.selectedCategory = e.target.value;
      renderCurrentSection();
      saveState();
    });
  }
}

window._toggleFavorite = function(id) {
  console.log('⭐ Toggling favorite:', id);
  toggleFavorite(id, state.favorites).then(function(favorites) {
    state.favorites = favorites;
    renderCurrentSection();
    saveState();
  }).catch(function(err) {
    console.error('❌ Ошибка при переключении избранного:', err);
  });
};

window._navigateTo = function(section) {
  console.log('🔀 Navigate to:', section);
  navigate('#/' + section);
};

// ============================================================
// Sidebar и тема
// ============================================================
function toggleSidebar() {
  state.sidebarOpen = !state.sidebarOpen;
  var sidebar = document.getElementById('sidebar');
  if (state.sidebarOpen) {
    sidebar.classList.add('open');
  } else {
    sidebar.classList.remove('open');
  }
}

function closeSidebar() {
  state.sidebarOpen = false;
  document.getElementById('sidebar').classList.remove('open');
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  document.body.classList.toggle('dark-theme', state.theme === 'dark');
  document.getElementById('themeToggle').textContent = state.theme === 'dark' ? '☀️' : '🌙';
  localStorage.setItem('emsTheme', state.theme);
  saveState();
}

function loadTheme() {
  var saved = localStorage.getItem('emsTheme');
  if (saved) {
    state.theme = saved;
  }
  document.body.classList.toggle('dark-theme', state.theme === 'dark');
  document.getElementById('themeToggle').textContent = state.theme === 'dark' ? '☀️' : '🌙';
}

// ============================================================
// Офлайн-статус
// ============================================================
function updateOfflineStatus() {
  var status = document.getElementById('offlineStatus');
  if (!status) return;
  if (navigator.onLine) {
    status.textContent = '🟢 Онлайн';
    status.style.color = '#2E7D32';
  } else {
    status.textContent = '🔴 Офлайн';
    status.style.color = '#C62828';
  }
}

window.addEventListener('online', updateOfflineStatus);
window.addEventListener('offline', updateOfflineStatus);

// ============================================================
// Запуск приложения
// ============================================================
console.log('📦 Checking dependencies...');
console.log('DATA:', typeof DATA !== 'undefined' ? '✅' : '❌');
console.log('getTimeOfDay:', typeof getTimeOfDay !== 'undefined' ? '✅' : '❌');
console.log('openDB:', typeof openDB !== 'undefined' ? '✅' : '❌');

// Запускаем инициализацию
if (typeof DATA !== 'undefined' && typeof openDB === 'function') {
  console.log('🚀 Starting app...');
  
  // Инициализация IndexedDB и загрузка избранного
  openDB().then(function() {
    console.log('✅ DB ready');
    return loadFavorites();
  }).then(function(favorites) {
    console.log('✅ Favorites loaded:', favorites.size);
    state.favorites = favorites;
    // Запускаем приложение
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initApp);
    } else {
      initApp();
    }
  }).catch(function(err) {
    console.error('❌ Initialization error:', err);
    // Все равно запускаем приложение
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initApp);
    } else {
      initApp();
    }
  });
} else {
  console.error('❌ Dependencies not loaded!');
  // Показываем ошибку пользователю
  document.addEventListener('DOMContentLoaded', function() {
    var container = document.getElementById('pageContent');
    if (container) {
      container.innerHTML = '<div style="padding:40px;text-align:center;color:#C62828;">' +
        '<h2>❌ Ошибка загрузки приложения</h2>' +
        '<p>Пожалуйста, обновите страницу или проверьте консоль разработчика</p>' +
        '</div>';
    }
  });
}
