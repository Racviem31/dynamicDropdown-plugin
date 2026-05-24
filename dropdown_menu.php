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

    public function __construct()
    {
        $this->plugin_url = plugin_dir_url(__FILE__);
        $this->plugin_path = plugin_dir_path(__FILE__);

        add_shortcode('dynamic_dropdown', array($this, 'render_shortcode'));
        add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));
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
     * Получает данные, соответствующие текущему URL страницы
     */
    private function get_data_for_current_url()
    {
        $all_data = $this->load_json_data();
        if (empty($all_data)) {
            return null;
        }

        // Получаем полный URL текущей страницы (без якоря и параметров)
        $current_url = get_permalink();
        if (!$current_url) {
            // резерв: из серверных переменных
            $current_url = home_url(add_query_arg(array(), $_SERVER['REQUEST_URI']));
        }

        // Ищем запись с совпадающим URL
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
        $atts = shortcode_atts(array(
            'height' => '100px',
            'position' => 'center'
        ), $atts);

        $data = $this->get_data_for_current_url();

        // Значения по умолчанию
        $title = $data['title'] ?? 'Изготовление технического паспорта';
        $subtitle = $data['subtitle'] ?? 'Пожалуйста, выберите объект для изготовления технического паспорта:';
        $info_lines = $data['info_lines'] ?? [
            'Получение технического паспорта:',
            'Постановка на государственный кадастровый учет:'
        ];
        
        // Получаем массив опций (если нет — используем старые с пустыми ценой/сроком)
        $options = $data['options'] ?? null;
        if (!$options) {
            // fallback для обратной совместимости
            $default_names = ['Квартира', 'Дом', 'Коммерческое помещение'];
            $options = array_map(function($name) {
                return [
                    'name' => $name,
                    'deadline' => '-',
                    'price' => '-'
                ];
            }, $default_names);
        }

        ob_start();
        ?>
        <div class="container">
            <h1><?php echo esc_html($title); ?></h1>
            <p class="subtitle"><?php echo esc_html($subtitle); ?></p>

            <select class="select" id="dynamic-select">
                <option hidden disabled selected>Выберите объект</option>
                <?php foreach ($options as $index => $opt): ?>
                    <option value="<?php echo esc_attr($index); ?>"
                            data-deadline="<?php echo esc_attr($opt['deadline']); ?>"
                            data-price="<?php echo esc_attr($opt['price']); ?>">
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

            <button class="btn">ПОЛУЧИТЬ УСЛУГУ</button>
        </div>
        <?php

        return ob_get_clean();
    }
}
    // Инициализация плагина
    new DynamicDropdown();  