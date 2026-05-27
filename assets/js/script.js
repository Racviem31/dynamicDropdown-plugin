/**
 * Скрипт для плагина DynamicDropdown
 * Версия 1.0.0
 */

document.addEventListener('DOMContentLoaded', function() {
    // --- Первый вариант (селект) ---
    const select = document.getElementById('dynamic-select');
    if (select) {
        initVariant1(select);
        return; // если нашли селект, дальше не идём (чтоб не мешать)
    }
    
    // --- Второй вариант (чекбоксы) ---
    const variant2Container = document.querySelector('.container[data-variant="2"]');
    if (variant2Container) {
        initVariant2(variant2Container);
        return;
    }
    
    // --- Страницы без селекта (статика) ---
    const infoItems = document.querySelectorAll('.info p');
    if (infoItems.length) {
        addDaToInfoStatic();
    }
});

function initVariant1(select) {
    const deadlineSpan = document.querySelector('.deadline-value');
    const priceSpan = document.querySelector('.price-value');
    const infoItems = document.querySelectorAll('.info p');

    // Сохраняем оригинальные тексты info
    infoItems.forEach(p => {
        if (!p.getAttribute('data-original-text')) {
            p.setAttribute('data-original-text', p.innerHTML);
        }
    });

    function isPlaceholder(option) {
        return !option || !option.hasAttribute('data-deadline') || !option.hasAttribute('data-price');
    }

    function updateDetailsForSelect() {
        const selectedOption = select.options[select.selectedIndex];
        const placeholder = isPlaceholder(selectedOption);

        if (placeholder) {
            if (deadlineSpan) deadlineSpan.textContent = '-';
            if (priceSpan) priceSpan.textContent = '-';
        } else {
            const deadline = selectedOption.getAttribute('data-deadline');
            const price = selectedOption.getAttribute('data-price');
            if (deadlineSpan) deadlineSpan.textContent = deadline || '-';
            if (priceSpan) priceSpan.textContent = price || '-';
        }

        infoItems.forEach(p => {
            const original = p.getAttribute('data-original-text');
            if (!original) return;
            if (placeholder) {
                p.innerHTML = original;
            } else {
                if (!original.endsWith(' да')) {
                    p.innerHTML = original + ' да';
                }
            }
        });
    }

    updateDetailsForSelect();
    select.addEventListener('change', updateDetailsForSelect);
}

function initVariant2(container) {
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    const totalDeadlineSpan = container.querySelector('.total-deadline');
    const totalPriceSpan = container.querySelector('.total-price');
    const checkAllBtn = container.querySelector('.check-all-btn');
    const uncheckAllBtn = container.querySelector('.uncheck-all-btn');

    // Функция извлечения числа из строки типа "от 7 дней" или "от 6 000 ₽."
    function extractNumber(str) {
        if (!str) return 0;
        // убираем "от", пробелы, "дней", "₽", точку, оставляем только цифры и пробелы
        let match = str.match(/(\d[\d\s]*)/);
        if (match) {
            // убираем пробелы внутри числа
            return parseInt(match[1].replace(/\s/g, ''), 10);
        }
        return 0;
    }

    // Форматирование цены обратно в "от X ₽"
    function formatPrice(sum) {
        return 'от ' + sum.toLocaleString('ru-RU') + ' ₽.';
    }

    // Форматирование срока: "от X дней"
    function formatDeadline(maxDays) {
        return 'от ' + maxDays + ' дней';
    }

    function recalcTotals() {
        let maxDeadline = 0;
        let totalPrice = 0;
        
        checkboxes.forEach(cb => {
            if (cb.checked) {
                const deadlineStr = cb.getAttribute('data-deadline');
                const priceStr = cb.getAttribute('data-price');
                const deadlineNum = extractNumber(deadlineStr);
                const priceNum = extractNumber(priceStr);
                if (deadlineNum > maxDeadline) maxDeadline = deadlineNum;
                totalPrice += priceNum;
            }
        });
        
        if (totalDeadlineSpan) {
            totalDeadlineSpan.textContent = maxDeadline > 0 ? formatDeadline(maxDeadline) : '-';
        }
        if (totalPriceSpan) {
            totalPriceSpan.textContent = totalPrice > 0 ? formatPrice(totalPrice) : '-';
        }
    }

    // Обработчики для чекбоксов
    checkboxes.forEach(cb => {
        cb.addEventListener('change', recalcTotals);
    });

    // Кнопка "Отметить все"
    if (checkAllBtn) {
        checkAllBtn.addEventListener('click', () => {
            checkboxes.forEach(cb => { cb.checked = true; });
            recalcTotals();
        });
    }

    // Кнопка "Сбросить выбор"
    if (uncheckAllBtn) {
        uncheckAllBtn.addEventListener('click', () => {
            checkboxes.forEach(cb => { cb.checked = false; });
            recalcTotals();
        });
    }

    // Первоначальный расчёт (если какие-то чекбоксы уже выбраны по умолчанию)
    recalcTotals();
}

function addDaToInfoStatic() {
    const infoItems = document.querySelectorAll('.info p');
    infoItems.forEach(p => {
        const original = p.innerHTML;
        if (!original.endsWith(' да')) {
            p.innerHTML = original + ' да';
        }
    });
}