/**
 * Скрипт для плагина DynamicDropdown
 * Версия 1.2.0 (с отправкой формы)
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
            if (container.querySelector('.dynamic-select')) {
                initVariant1(container);
            } else if (container.querySelector('input[type="checkbox"]')) {
                initVariant2(container);
            } else {
                addDaToInfoStatic(container);
            }
        }
    });

    // Модальное окно (открытие/закрытие)
    const modal = document.getElementById('service-modal');
    const modalOverlay = document.querySelector('.modal-overlay');
    const modalClose = document.querySelector('.modal-close');

    function getScrollbarWidth() {
        return window.innerWidth - document.documentElement.clientWidth;
    }

    window.openModal = function() {
        if (!modal) return;
        const scrollbarWidth = getScrollbarWidth();
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = scrollbarWidth + 'px';
    }

    window.closeModal = function() {
        if (!modal) return;
        modal.style.display = 'none';
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    }

    document.querySelectorAll('.dynamic-dropdown .btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const container = btn.closest('.dynamic-dropdown');
            if (!container) return;
    
            const titleField = document.getElementById('service-title-field');
            const selectedField = document.getElementById('selected-service');
            if (titleField) {
                const titleEl = container.querySelector('h1');
                titleField.value = titleEl ? titleEl.innerText.trim() : '';
            }
            if (selectedField) {
                const nameHidden = container.querySelector('.service-option-name');
                const idHidden = container.querySelector('.service-option-id');
                const titleField = document.getElementById('service-title-field');
                if (titleField) {
                    const hiddenTitle = container.querySelector('.service-title-hidden');
                    titleField.value = hiddenTitle ? hiddenTitle.value : '';
                }
                if (nameHidden && nameHidden.value.trim() !== '') {
                    selectedField.value = nameHidden.value.trim();
                } else if (idHidden && idHidden.value.trim() !== '') {
                    selectedField.value = idHidden.value.trim();
                } else {
                    // старая логика для селекта
                    const select = container.querySelector('.dynamic-select');
                    if (select && select.selectedIndex > 0) {
                        selectedField.value = select.options[select.selectedIndex].innerText;
                    }
                }
            }
            openModal();
        });
    });

    if (modalClose) modalClose.addEventListener('click', closeModal);
    if (modalOverlay) modalOverlay.addEventListener('click', closeModal);

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && modal.style.display === 'flex') {
            closeModal();
        }
    });

    // --- Отправка формы модального окна ---
    const modalForm = document.querySelector('.modal-form');
    if (modalForm) {
        modalForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(modalForm);
            formData.append('action', 'send_service_request');
            const ajaxurl = (typeof serviceRequest !== 'undefined') ? serviceRequest.ajaxurl : '/wp-admin/admin-ajax.php';
            const nonce = (typeof serviceRequest !== 'undefined') ? serviceRequest.nonce : '';
            formData.append('nonce', nonce);
            const nameValue = nameInput ? nameInput.value.trim() : '';
            const phoneValue = phoneInput ? phoneInput.value.trim() : '';
            const phoneDigits = phoneValue.replace(/\D/g, '');

            fetch(ajaxurl, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                
                if (nameValue === '') {
                    alert('Пожалуйста, введите ваше имя.');
                    return;
                }
                if (phoneDigits.length !== 11) { // должно быть 11 цифр: 7 и 10 цифр номера
                    alert('Введите полный номер телефона в формате +7 (XXX) XXX-XX-XX');
                    return;
                }
                
                if (data.success) {
                    alert(data.data);
                    closeModal();
                    modalForm.reset();
                } else {
                    alert('Ошибка: ' + data.data);
                }
            })
            .catch(error => {
                console.error('Ошибка:', error);
                alert(' Произошла ошибка при отправке. Попробуйте позже.');
            });
        });
    }
});

// Функции вариантов
function initVariant1(container) {
    const select = container.querySelector('.dynamic-select');
    if (!select) {
        // Статический вариант (нет селекта) – просто добавляем да к info_lines
        addDaToInfoStatic(container);
        return;
    }

    const deadlineSpan = container.querySelector('.deadline-value');
    const priceSpan = container.querySelector('.price-value');
    const infoItems = container.querySelectorAll('.info p');

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

        // Обновление строк info с "да"
        infoItems.forEach(p => {
            const original = p.getAttribute('data-original-text');
            if (!original) return;
            if (placeholder) {
                p.innerHTML = original;
            } else {
                if (!original.includes('<strong>да</strong>')) {
                    p.innerHTML = original + ' <strong>да</strong>';
                } else {
                    p.innerHTML = original;
                }
            }
        });

        // ЗАПОМИНАЕМ ВЫБРАННУЮ УСЛУГУ ДЛЯ МОДАЛЬНОГО ОКНА
        const selectedServiceInput = document.getElementById('selected-service');
        if (selectedServiceInput) {
            selectedServiceInput.value = placeholder ? '' : selectedOption.innerText;
        }
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
        if (match) return parseInt(match[1].replace(/\s/g, ''), 10);
        return 0;
    }

    function formatPrice(sum) {
        return 'от ' + sum.toLocaleString('ru-RU') + ' ₽.';
    }
    function formatDeadline(maxDays) {
        return 'от ' + maxDays + ' дней';
    }

    function recalcTotals() {
        let maxDeadline = 0, totalPrice = 0;
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

    // Функция, собирающая названия выбранных услуг
    function updateSelectedServices() {
        const checked = container.querySelectorAll('input[type="checkbox"]:checked');
        const names = Array.from(checked).map(cb => {
            const label = cb.closest('.service-item');
            const strong = label ? label.querySelector('.service-content strong') : null;
            return strong ? strong.innerText.trim() : cb.value;
        }).join(', ');
        const input = document.getElementById('selected-service');
        if (input) input.value = names;
    }

    // Первоначальный расчёт и заполнение
    recalcTotals();
    updateSelectedServices();

    // Обработчики на каждый чекбокс
    checkboxes.forEach(cb => {
        cb.addEventListener('change', () => {
            recalcTotals();
            updateSelectedServices();
        });
    });

    // Кнопка "Отметить все"
    if (checkAllBtn) {
        checkAllBtn.addEventListener('click', () => {
            checkboxes.forEach(cb => cb.checked = true);
            recalcTotals();
            updateSelectedServices();
            checkAllBtn.blur();
        });
    }

    // Кнопка "Сбросить выбор"
    if (uncheckAllBtn) {
        uncheckAllBtn.addEventListener('click', () => {
            checkboxes.forEach(cb => cb.checked = false);
            recalcTotals();
            updateSelectedServices();
            uncheckAllBtn.blur();
        });
    }
}

function addDaToInfoStatic(container) {
    const infoItems = container.querySelectorAll('.info p');
    infoItems.forEach(p => {
        const original = p.innerHTML;
        if (!original.includes('<strong>да</strong>')) {
            p.innerHTML = original + ' <strong>да</strong>';
        }
    });
}

const nameInput = document.querySelector('.modal-form input[name="name"]');
if (nameInput) {
    nameInput.addEventListener('input', function(e) {
        this.value = this.value.replace(/[^a-zA-Zа-яёА-ЯЁ\s\-]/g, '');
    });
}

const phoneInput = document.querySelector('.modal-form input[name="phone"]');

function formatPhoneNumber(value) {
    // Удаляем все нецифры
    let cleaned = value.replace(/\D/g, '');
    
    // Если начинается с 8, заменяем на 7 (для единообразия)
    if (cleaned.startsWith('8')) {
        cleaned = '7' + cleaned.slice(1);
    }

    
    let result = '+7 ';
    if (cleaned.length > 1) {
        // убираем первую семёрку, если она есть
        if (cleaned.startsWith('7')) {
            cleaned = cleaned.slice(1);
        }
        // теперь cleaned содержит до 10 цифр
        let parts = cleaned.match(/(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})/);
        if (parts[1]) result += '(' + parts[1];
        if (parts[2]) result += ') ' + parts[2];
        if (parts[3]) result += '-' + parts[3];
        if (parts[4]) result += '-' + parts[4];
    }
    return result.trim();
}

if (phoneInput) {
    phoneInput.addEventListener('input', function(e) {
        let rawValue = this.value;
        let formatted = formatPhoneNumber(rawValue);
        this.value = formatted;
    });
    
    // Дополнительно: при потере фокуса можно валидировать длину
    phoneInput.addEventListener('blur', function() {
        let digits = this.value.replace(/\D/g, '');
        if (digits.length !== 11) { 
            // необязательная проверка, просто предупреждение
            this.style.borderColor = '#ffaaaa';
        } else {
            this.style.borderColor = '';
        }
    });
    
    phoneInput.addEventListener('focus', function() {
        this.style.borderColor = '';
    });
}