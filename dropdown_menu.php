<?php
/**
 * Plugin Name: DynamicDropdown
 * Description: Отображение дропдауна с динамической настройкой значений[dynamic_dropdown]
 * Version: 1.0.0
 * Author: Racviem(Бородатов Константин), ООО "Цифровые решения"
 */

// Защита от прямого доступа
if (!defined('ABSPATH')) {
    exit;
}

class DynamicDropdown
{
    private $plugin_url;
    private $plugin_path;
    private static $instance_counter = 0;

    public function __construct()
    {
        $this->plugin_url = plugin_dir_url(__FILE__);
        $this->plugin_path = plugin_dir_path(__FILE__);

        add_shortcode('dynamic_dropdown', array($this, 'render_shortcode'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));
        add_action( 'wp_ajax_send_service_request', array( $this, 'ajax_send_request' ) );
        add_action( 'wp_ajax_nopriv_send_service_request', array( $this, 'ajax_send_request' ) );
    }

    public function enqueue_assets()
    {
        global $post;
        if (is_a($post, 'WP_Post') && has_shortcode($post->post_content, 'dynamic_dropdown')) {
            wp_enqueue_style(
                'dynamic-dropdown-style',
                $this->plugin_url . 'assets/css/style.css',
                array(),
                '1.0.0'
            );
            wp_enqueue_script(
                'dynamic-dropdown-script',
                $this->plugin_url . 'assets/js/script.js',
                array(),
                '1.0.0',
                true
            );
            wp_localize_script( 
                'dynamic-dropdown-script', 
                'serviceRequest', 
                array(
                'ajaxurl' => admin_url( 'admin-ajax.php' ),
                'nonce'   => wp_create_nonce( 'service_request_nonce' ))
            );
        }
    }

    /**
     * Загружает данные из JSON-файла и возвращает массив
     */
    private function load_json_data()
    {
        $json_file = $this->plugin_path . 'data.json';
        if (!file_exists($json_file)) {
            return [];
        }

        $content = file_get_contents($json_file);
        $data = json_decode($content, true);
        return is_array($data) ? $data : [];
    }

        /**
     * Получает данные: либо по service_id, либо по текущему URL
     */
    private function get_data_for_current_url($service_key = '')
    {
    $all_data = $this->load_json_data();
    if (empty($all_data)) {
        return null;
    }

    // Если передан service_key – ищем по нему
    if (!empty($service_key)) {
        foreach ($all_data as $item) {
            if (isset($item['service_id']) && $item['service_id'] === $service_key) {
                return $item;
            }
        }
        return null; // не найдено
    }

    // Иначе ищем по URL (текущая логика)
    $current_url = get_permalink();
    if (!$current_url) {
        $current_url = home_url(add_query_arg(array(), $_SERVER['REQUEST_URI']));
    }

    foreach ($all_data as $item) {
        if (isset($item['url']) && $item['url'] === $current_url) {
            return $item;
        }
    }

    return null;
    }



    /**
     * Рендер шорткода с данными из JSON в зависимости от URL
     */
    public function render_shortcode($atts)
    {
        
    self::$instance_counter++;
    $instance_id = self::$instance_counter;
    
    $atts = shortcode_atts(array(
        'height'   => '100px',
        'position' => 'center',
        'variant'  => '1',
        'service'  => '',
        'show_title' => 'true' 
    ), $atts);

    $service_key = sanitize_text_field($atts['service']);
    $data = $this->get_data_for_current_url($service_key); // передаём ключ
    $variant = (int)$atts['variant'];

    // Общие данные
    $title = $data['title'] ?? 'Изготовление технического паспорта';
    $subtitle = $data['subtitle'] ?? 'Пожалуйста, выберите объект для изготовления технического паспорта:';
    $info_lines = $data['info_lines'] ?? [];

    ob_start();
    ?>
    <div class="container dynamic-dropdown dynamic-dropdown-<?php echo $instance_id; ?>" data-variant="<?php echo $variant; ?>">
        <?php if (filter_var($atts['show_title'], FILTER_VALIDATE_BOOLEAN)): ?>
            <h1><?php echo esc_html($title); ?></h1>
        <?php endif; ?>

        <?php if ($variant === 2 && isset($data['options']) && is_array($data['options']) && !empty($data['options'])): ?>
            <!-- ВАРИАНТ 2: чекбоксы, множественный выбор -->
            <p class="subtitle"><?php echo esc_html($subtitle); ?></p>
            
            <div class="checkbox-actions">
                <button type="button" class="check-all-btn">ОТМЕТИТЬ ВСЕ</button>
                <button type="button" class="uncheck-all-btn">СБРОСИТЬ ВЫБОР</button>
            </div>

            <div class="services-list">
                <?php foreach ($data['options'] as $index => $opt): ?>
                    <label class="service-item">
                        <input type="checkbox" 
                               name="service[]" 
                               value="<?php echo esc_attr($index); ?>"
                               data-deadline="<?php echo esc_attr($opt['deadline'] ?? '-'); ?>"
                               data-price="<?php echo esc_attr($opt['price'] ?? '-'); ?>">
                        <div class="service-content">
                            <strong><?php echo esc_html($opt['name']); ?></strong>
                            <div class="service-meta">
                                <span>Срок: <?php echo esc_html($opt['deadline'] ?? '-'); ?></span>
                                <span>Стоимость: <?php echo esc_html($opt['price'] ?? '-'); ?></span>
                            </div>
                        </div>
                    </label>
                <?php endforeach; ?>
            </div>

            <?php if (!empty($info_lines)): ?>
                <div class="info">
                    <?php foreach ($info_lines as $line): ?>
                        <p><?php echo esc_html($line); ?></p>
                    <?php endforeach; ?>
                </div>
            <?php endif; ?>

            <hr style="width: 70%">

            <div class="total-details">
                <p>Итоговые сроки: <span class="total-deadline">-</span></p>
                <p>Итоговая стоимость: <span class="total-price">-</span></p>
            </div>

            <button class="btn">ПОЛУЧИТЬ УСЛУГУ</button>

        <?php elseif ($variant === 1 || !isset($data['options']) || empty($data['options'])): ?>
            <!-- Первый вариант -->
            <?php if (isset($data['options']) && is_array($data['options']) && !empty($data['options'])): ?>
                <p class="subtitle"><?php echo esc_html($subtitle); ?></p>
                <select class="select dynamic-select">
                    <option hidden disabled selected>Выберите объект</option>
                    <?php foreach ($data['options'] as $index => $opt): ?>
                        <option value="<?php echo esc_attr($index); ?>"
                                data-deadline="<?php echo esc_attr($opt['deadline'] ?? '-'); ?>"
                                data-price="<?php echo esc_attr($opt['price'] ?? '-'); ?>">
                            <?php echo esc_html($opt['name']); ?>
                        </option>
                    <?php endforeach; ?>
                </select>

                <div class="info">
                    <?php foreach ($info_lines as $line): ?>
                        <p><?php echo esc_html($line); ?></p>
                    <?php endforeach; ?>
                </div>

                <hr style="width: 70%">

                <div class="details">
                    <p>Срок изготовления: <span class="deadline-value">-</span></p>
                    <p>Стоимость услуги: <span class="price-value">-</span></p>
                </div>
            <?php else: ?>
                <!-- Без options (статическая версия) -->
                <?php
                $deadline = $data['deadline'] ?? '-';
                $price = $data['price'] ?? '-';
                ?>
                <div class="info">
                    <?php foreach ($info_lines as $line): ?>
                        <p><?php echo esc_html($line); ?></p>
                    <?php endforeach; ?>
                </div>

                <hr style="width: 70%">

                <div class="details">
                    <p>Срок изготовления: <span><?php echo esc_html($deadline); ?></span></p>
                    <p>Стоимость услуги: <span><?php echo esc_html($price); ?></span></p>
                </div>
            <?php endif; ?>
            <button class="btn">ПОЛУЧИТЬ УСЛУГУ</button>
        <?php endif; ?>
    </div>
    <?php
    echo $this->render_modal();
    return ob_get_clean();
    }
    private static $modal_rendered = false;

    private function render_modal() {
        if (self::$modal_rendered) {
            return '';
        }
        self::$modal_rendered = true;
        ob_start();
        ?>
        <div id="service-modal" class="service-modal" style="display: none;">
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <span class="modal-close">&times;</span>
                <h2>Заявка на получение услуги</h2>
                <p class="modal-subtitle">Пожалуйста, оставьте свои контактные данные, и мы свяжемся с вами в ближайшее время.</p>
                <form class="modal-form">
                    <input type="text" name="name" placeholder="Ваше имя" required>
                    <input type="tel" name="phone" placeholder="Номер телефона" required>
                    <textarea name="info" placeholder="Укажите необходимую информацию, которая может быть важна, или оставьте поле пустым"></textarea>
                    <input type="hidden" name="selected_service" id="selected-service" value="">
                    <input type="hidden" name="service_title" id="service-title-field" value="">
                    <button type="submit" class="modal-submit-btn">Получить услугу</button>
                </form>
            </div>
        </div>
        <?php
        return ob_get_clean();
    }
        /**
     * AJAX-обработчик отправки заявки
     */
    public function ajax_send_request() {
        // Проверяем nonce для безопасности
        if ( !isset($_POST['nonce']) || !wp_verify_nonce($_POST['nonce'], 'service_request_nonce') ) {
            wp_send_json_error('Ошибка безопасности. Обновите страницу и попробуйте снова.');
            wp_die();
        }
        // Защита от спама: ограничение 10 заявок в час с одного IP
        $ip = $_SERVER['REMOTE_ADDR'];
        $transient_key = 'service_requests_ip_' . md5($ip);
        $request_count = get_transient($transient_key) ?: 0;
        
        if ($request_count >= 10) {
            wp_send_json_error('Вы отправили слишком много заявок за последний час. Пожалуйста, повторите позже.');
            wp_die();
        }
    
        // Получаем данные из формы
        $name    = sanitize_text_field( $_POST['name'] );
        $phone   = sanitize_text_field( $_POST['phone'] );
        $info    = sanitize_textarea_field( $_POST['info'] );
        $service_title = sanitize_text_field( $_POST['service_title'] ?? '' );
        $selected_option = sanitize_textarea_field( $_POST['selected_service'] ?? '' );
        
        if ( $service_title && $selected_option ) {
            $service = $service_title . ' — ' . $selected_option;
        } elseif ( $service_title ) {
            $service = $service_title;
        } else {
            $service = $selected_option;
        }
    
        // Получаем email текущего города с помощью шорткода belingoGeo
        $email = 'hard.isti@bk.ru';
        // Если шорткод не вернул email, используем email по умолчанию
        if ( empty($email) ) {
            $email = get_option( 'admin_email' );
        }
    
        // Формируем тему письма
        $subject = 'Новая заявка с bti';
    
        // Формируем тело письма (HTML)
        $message = "
        <html>
        <head><title>Новая заявка</title></head>
        <body>
            <h2>Детали заявки</h2>
            <table border='0' cellpadding='5' cellspacing='0'>
                <tr><td><strong>Имя:</strong></td><td>{$name}</td></tr>
                <tr><td><strong>Телефон:</strong></td><td>{$phone}</td></tr>
                <tr><td><strong>Выбранная услуга:</strong></td><td>{$service}</td></tr>
                <tr><td><strong>Информация:</strong></td><td>{$info}</td></tr>
            </table>
        </body>
        </html>
        ";
    
        // Заголовки письма (HTML)
        $headers = array('Content-Type: text/html; charset=UTF-8');
    
        // Отправляем письмо
        $sent = wp_mail( $email, $subject, $message, $headers );
    
        if ($sent) {
            set_transient($transient_key, $request_count + 1, HOUR_IN_SECONDS);
            wp_send_json_success('Ваша заявка успешно отправлена!');
        } else {
            wp_send_json_error('Ошибка при отправке заявки. Попробуйте позже.');
        }
            
        wp_die();
    }
}


    // Инициализация плагина
    new DynamicDropdown();  