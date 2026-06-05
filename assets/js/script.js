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

    // --- Модальное окно (открытие/закрытие) ---
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

        // Находим контейнер текущего шорткода
        const container = btn.closest('.dynamic-dropdown');
        if (container) {
            const titleElement = container.querySelector('h1');
            const serviceTitle = titleElement ? titleElement.innerText.trim() : '';
            const titleField = document.getElementById('service-title-field');
            if (titleField) titleField.value = serviceTitle;
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

            fetch(ajaxurl, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
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

// --- Функции вариантов ---
function initVariant1(container) {
    const select = container.querySelector('.dynamic-select');
    if (!select) return;

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

        // --- ЗАПОМИНАЕМ ВЫБРАННУЮ УСЛУГУ ДЛЯ МОДАЛЬНОГО ОКНА ---
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

    checkboxes.forEach(cb => cb.addEventListener('change', recalcTotals));
    if (checkAllBtn) checkAllBtn.addEventListener('click', () => {
        checkboxes.forEach(cb => cb.checked = true);
        recalcTotals();
        checkAllBtn.blur();
    });
    if (uncheckAllBtn) uncheckAllBtn.addEventListener('click', () => {
        checkboxes.forEach(cb => cb.checked = false);
        recalcTotals();
        uncheckAllBtn.blur();
    });
    recalcTotals();
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