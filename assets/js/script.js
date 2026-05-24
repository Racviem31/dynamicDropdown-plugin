/**
 * Скрипт для плагина "DynamicDropdown"
 * Версия 1.0.0
 */
 
document.addEventListener('DOMContentLoaded', function() {
    const select = document.getElementById('dynamic-select');
    if (!select) return;

    const deadlineSpan = document.querySelector('.deadline-value');
    const priceSpan = document.querySelector('.price-value');

    function updateDetails() {
        const selectedOption = select.options[select.selectedIndex];
        if (!selectedOption || selectedOption.value === '') {
            // Если выбран плейсхолдер "Выберите объект"
            if (deadlineSpan) deadlineSpan.textContent = '-';
            if (priceSpan) priceSpan.textContent = '-';
            return;
        }

        const deadline = selectedOption.getAttribute('data-deadline');
        const price = selectedOption.getAttribute('data-price');

        if (deadlineSpan) deadlineSpan.textContent = deadline || '-';
        if (priceSpan) priceSpan.textContent = price || '-';
    }

    // Обновляем при загрузке, если уже выбран какой-то option (не плейсхолдер)
    updateDetails();

    // Обновляем при изменении выбора
    select.addEventListener('change', updateDetails);
});