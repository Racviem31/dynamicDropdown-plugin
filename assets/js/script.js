/**
* Скрипт для плагина "DynamicDropdown"
* Версия 1.0.0
 */

document.addEventListener('DOMContentLoaded', function() {
    const select = document.getElementById('dynamic-select');
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

    function updateDetailsForSelect() {
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

    function addDaToInfo() {
        // Добавляем "да" ко всем пунктам info (без условий)
        infoItems.forEach(p => {
            const original = p.getAttribute('data-original-text');
            if (original && !original.endsWith(' да')) {
                p.innerHTML = original + ' да';
            }
        });
    }

    if (select) {
        // Если селект есть – работаем по событиям
        updateDetailsForSelect(); // инициализация (плейсхолдер, да нет)
        select.addEventListener('change', updateDetailsForSelect);
    } else {
        // Если селекта нет – сразу добавляем "да" и устанавливаем фиксированные срок/цену (если есть)
        // Предполагаем, что deadline-value и price-value могут быть статическими (без селекта)
        // Если они есть – оставляем как есть (они уже заполнены из PHP)
        addDaToInfo();
    }
});