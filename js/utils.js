// ============================================================
// UTILS — Вспомогательные функции
// ============================================================

// Получение времени суток для приветствия
function getTimeOfDay() {
  var hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { emoji: '🌅', text: 'Доброе утро' };
  if (hour >= 12 && hour < 17) return { emoji: '☀️', text: 'Добрый день' };
  if (hour >= 17 && hour < 22) return { emoji: '🌇', text: 'Добрый вечер' };
  return { emoji: '🌙', text: 'Доброй ночи' };
}

// Форматирование даты
function getFormattedDate() {
  var now = new Date();
  var options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
  return now.toLocaleDateString('ru-RU', options);
}

// Получение класса риска для калькуляторов
function getRiskClass(calcId, score) {
  if (calcId === 'calc-001') {
    if (score <= 8) return 'risk-high';
    if (score <= 12) return 'risk-moderate';
    return 'risk-low';
  }
  if (calcId === 'calc-002') {
    if (score >= 3) return 'risk-high';
    if (score >= 2) return 'risk-moderate';
    return 'risk-low';
  }
  return '';
}

// Интерпретация результатов калькуляторов
function getInterpretation(calcId, score) {
  var map = {
    'calc-001': [
      { max: 3, text: 'Глубокая кома (3-4) — крайне тяжелое состояние' },
      { max: 8, text: 'Кома (5-8) — тяжелое повреждение мозга' },
      { max: 12, text: 'Средняя тяжесть (9-12) — умеренное повреждение' },
      { max: 14, text: 'Легкая степень (13-14) — легкое повреждение' },
      { max: 15, text: 'Полное сознание (15) — норма' }
    ],
    'calc-002': [
      { max: 0, text: '0 баллов — низкий риск, амбулаторное лечение' },
      { max: 1, text: '1 балл — умеренный риск, наблюдение' },
      { max: 2, text: '2 балла — высокий риск, госпитализация' },
      { max: 3, text: '3 балла — очень высокий риск, срочная госпитализация' },
      { max: 5, text: '4-5 баллов — критический риск, интенсивная терапия' }
    ]
  };
  var rules = map[calcId] || [];
  for (var i = 0; i < rules.length; i++) {
    if (score <= rules[i].max) return rules[i].text;
  }
  return 'Интерпретация не найдена';
}

console.log('✅ Utils loaded');
