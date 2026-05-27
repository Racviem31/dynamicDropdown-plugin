/**
 * Скрипт для плагина DynamicDropdown
 * Версия 1.1.0
 */

document.addEventListener('DOMContentLoaded', function() {
    const containers = document.querySelectorAll('.dynamic-dropdown');
    containers.forEach(container => {
        const variant = container.getAttribute('data-variant');
        if (variant === '1') {
            initVariant1(container);
        } else if (variant === '2') {
            initVariant2(container);
        } else {
            // fallback: проверяем наличие селекта или чекбоксов
            if (container.querySelector('.dynamic-select')) {
                initVariant1(container);
            } else if (container.querySelector('input[type="checkbox"]')) {
                initVariant2(container);
            } else {
                // статический вариант без options – добавляем "да"
                addDaToInfoStatic(container);
            }
        }
    });
});

function initVariant1(container) {
    const select = container.querySelector('.dynamic-select');
    if (!select) return;

    const deadlineSpan = container.querySelector('.deadline-value');
    const priceSpan = container.querySelector('.price-value');
    const infoItems = container.querySelectorAll('.info p');

    // Сохраняем оригинальные тексты info
    infoItems.forEach(p => {
        if (!p.getAttribute('data-original-text')) {
            p.setAttribute('data-original-text', p.innerHTML);
        }
    });

    function isPlaceholder(option) {
        return !option || !option.hasAttribute('data-deadline') || !option.hasAttribute('data-price');
    }

    function updateDetails() {
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
                } else {
                    p.innerHTML = original;
                }
            }
        });
    }

    updateDetails();
    select.addEventListener('change', updateDetails);
}

function initVariant2(container) {
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    const totalDeadlineSpan = container.querySelector('.total-deadline');
    const totalPriceSpan = container.querySelector('.total-price');
    const checkAllBtn = container.querySelector('.check-all-btn');
    const uncheckAllBtn = container.querySelector('.uncheck-all-btn');

    function extractNumber(str) {
        if (!str) return 0;
        let match = str.match(/(\d[\d\s]*)/);
        if (match) {
            return parseInt(match[1].replace(/\s/g, ''), 10);
        }
        return 0;
    }

    function formatPrice(sum) {
        return 'от ' + sum.toLocaleString('ru-RU') + ' ₽.';
    }

    function formatDeadline(maxDays) {
        return 'от ' + maxDays + ' дней';
    }

    function recalcTotals() {
        let maxDeadline = 0;
        let totalPrice = 0;
        checkboxes.forEach(cb => {
            if (cb.checked) {
                const deadlineNum = extractNumber(cb.getAttribute('data-deadline'));
                const priceNum = extractNumber(cb.getAttribute('data-price'));
                if (deadlineNum > maxDeadline) maxDeadline = deadlineNum;
                totalPrice += priceNum;
            }
        });
        if (totalDeadlineSpan) totalDeadlineSpan.textContent = maxDeadline > 0 ? formatDeadline(maxDeadline) : '-';
        if (totalPriceSpan) totalPriceSpan.textContent = totalPrice > 0 ? formatPrice(totalPrice) : '-';
    }

    checkboxes.forEach(cb => cb.addEventListener('change', recalcTotals));
    if (checkAllBtn) checkAllBtn.addEventListener('click', () => { checkboxes.forEach(cb => cb.checked = true); recalcTotals(); });
    if (uncheckAllBtn) uncheckAllBtn.addEventListener('click', () => { checkboxes.forEach(cb => cb.checked = false); recalcTotals(); });
    recalcTotals();
}

function addDaToInfoStatic(container) {
    const infoItems = container.querySelectorAll('.info p');
    infoItems.forEach(p => {
        const original = p.innerHTML;
        if (!original.endsWith(' да')) {
            p.innerHTML = original + ' да';
        }
    });
}