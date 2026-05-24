/**
* Скрипт для плагина "DynamicDropdown"
* Версия 1.0.0
 */

document.addEventListener('DOMContentLoaded', function() {
    const select = document.getElementById('dynamic-select');
    if (!select) return;

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
        // Плейсхолдер – это option без атрибутов data-deadline и data-price
        return !option || !option.hasAttribute('data-deadline') || !option.hasAttribute('data-price');
    }

    function updateDetails() {
        const selectedOption = select.options[select.selectedIndex];
        const placeholder = isPlaceholder(selectedOption);

        // Обновляем срок и стоимость
        if (placeholder) {
            if (deadlineSpan) deadlineSpan.textContent = '-';
            if (priceSpan) priceSpan.textContent = '-';
        } else {
            const deadline = selectedOption.getAttribute('data-deadline');
            const price = selectedOption.getAttribute('data-price');
            if (deadlineSpan) deadlineSpan.textContent = deadline || '-';
            if (priceSpan) priceSpan.textContent = price || '-';
        }

        // Обновляем строки info: добавляем "да" только если выбран реальный option
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

    // Вызываем один раз при загрузке (ничего не добавит, т.к. плейсхолдер)
    updateDetails();

    // Слушаем изменения
    select.addEventListener('change', updateDetails);
});