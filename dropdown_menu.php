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
            $this -> plugin_url = plugin_dir_url(__FILE__);
            $this -> plugin_path = plugin_dir_path(__FILE__);
            //Регистрация шорткода
            add_shorcode('dynamic_dropdown', array($this, 'render_shortcode'));
            //Подключение скриптов и стилей
            add_action('wp_enqueue_scripts', array($this, 'enqueue_assets'));
    }

    public function enqueue_assets()
    {
        //Проверяем, содержит ли текущая страница наш шорткод
        global $post;
        if (is_a($post, 'WP_post') && has_shortcode($post -> post_content, 'dynamic_dropdown')){
            //Подключаем стили
            wp_enqueue_style(
                'dynamic-dropdown-style',
                $this -> plugin_url . 'assets/css/style.css',
                array(),
                '1.0.0'
            );
            //Подключаем основной скрипт
            wp_enqueue_scripts(
                'dynamic-dropdown-script',
                $this -> plugin_url . 'assets/js/script.js',
                array(),
                '1.0.0',
                true
            );
            //Передаем данные дропдауна в JavaScript
            wp_localize_script('dynamic-dropdown-script', 'dynamicDropdownData', array(
                'dropdownData' => $this -> get_dropdown_data(),
                'ajax_url' => admin_url('admin-ajax.php'),
                'nonce' => wp_create_nonce('dynamic_dropdown_nonce')   
            ));
        }
    }
    //Данные дропдауна вывести лучше в админку в настройки плагина

    private function get_dropdown_data()
    {
        return array();
    }

    //Рендер шорткода
    public function render_shortcode($atts)
    {
        $atts = shortcode_atts(array(
            'height' => '100px',
            'position' => 'center'
        ), $atts);
        //Буферизация вывода
        ob_start();
        ?>
        //Верстка шорткода
        <?php

        return ob_get_clean();
    }
}

//Инициализация плагина
new DynamicDropdown();