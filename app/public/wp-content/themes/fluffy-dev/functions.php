<?php
/**
 * fluffy functions and definitions
 *
 * @link https://developer.wordpress.org/themes/basics/theme-functions/
 *
 * @package fluffy
 */
require_once get_template_directory() . '/customize/customize.php';
require_once get_template_directory() . '/control/control.php';
require_once get_template_directory() . '/dashboard/dashboard.php';
require_once get_template_directory() . '/inc/react-app.php';
require_once get_template_directory() . '/inc/admin-react-app.php';




function enqueue_wpt_assets() {
    $css_file = get_template_directory() . '/booking/wpt-styles.css';
    $js_file = get_template_directory() . '/booking/wpt-script.js';

    $css_version = filemtime($css_file);
    $js_version = filemtime($js_file);
	$theme_dir = get_template_directory();

	    // Enqueue Flatpickr from local files
		wp_enqueue_style('flatpickr-css', get_template_directory_uri() . '/booking/flatpickr.min.css', array(), filemtime($theme_dir . '/booking/flatpickr.min.css'));
		wp_enqueue_script('flatpickr-js', get_template_directory_uri() . '/booking/flatpickr.min.js', array(), filemtime($theme_dir . '/booking/flatpickr.min.js'), true);
		wp_enqueue_script('flatpickr-th', get_template_directory_uri() . '/booking/th.js', array('flatpickr-js'), filemtime($theme_dir . '/booking/th.js'), true);
		

    wp_enqueue_style('wpt-styles', get_template_directory_uri() . '/booking/wpt-styles.css', array(), $css_version);
    wp_enqueue_script('wpt-script', get_template_directory_uri() . '/booking/wpt-script.js', array('jquery'), $js_version, true);

	
}
add_action('wp_enqueue_scripts', 'enqueue_wpt_assets');

function enqueue_admin_styles() {
    $css_file = get_template_directory() . '/css/admin-style.css';
    $css_version = file_exists($css_file) ? filemtime($css_file) : '1.0.0';
    wp_enqueue_style('admin-style', get_template_directory_uri() . '/css/admin-style.css', array(), $css_version);
}
add_action('admin_enqueue_scripts', 'enqueue_admin_styles');

function wpt_enqueue_swiper_scripts() {
    // Get file modification times for versioning
    $css_file = get_template_directory() . '/css/wpt-carousel.css';
    $js_file = get_template_directory() . '/js/wpt-carousel.js';
    $css_ver = file_exists($css_file) ? filemtime($css_file) : '1.0.0';
    $js_ver = file_exists($js_file) ? filemtime($js_file) : '1.0.0';
    
    // Enqueue Swiper.js CSS
    wp_enqueue_style('swiper-css', get_template_directory_uri() . '/css/swiper-bundle.min.css', array());

    // Enqueue Swiper.js JS
    wp_enqueue_script('swiper-js', get_template_directory_uri() . '/js/swiper-bundle.min.js', array(), '', true);

    // Enqueue custom CSS for the carousel with file modification time as version
    wp_enqueue_style('wpt-carousel-style', get_template_directory_uri() . '/css/wpt-carousel.css', array(), $css_ver);
}
add_action('wp_enqueue_scripts', 'wpt_enqueue_swiper_scripts');



function wpt_promotion_carousel_shortcode($atts) {
    // Enqueue the carousel script
    wp_enqueue_script('wpt-carousel-script', get_template_directory_uri() . '/js/wpt-carousel.js', array('swiper-js'), filemtime(get_template_directory() . '/js/wpt-carousel.js'), true);

    // Shortcode attributes
    $atts = shortcode_atts(array(
        'posts_per_page' => 9, // Number of posts to display
		'layout' => '', // Optional category slug
        'category' => '', // Optional category slug
    ), $atts, 'wpt_post_carousel');

    // Query arguments
    $args = array(
        'post_type' => 'post',
        'posts_per_page' => $atts['posts_per_page'],
        'post_status' => 'publish',
    );

    if (!empty($atts['category'])) {
        $args['category_name'] = $atts['category'];
    }

    $query = new WP_Query($args);

    // Start output buffering
    ob_start();

	$layout = '';
    if ($query->have_posts()) :
	
		$layout = $atts['layout']
	?>
        <div class="wpt-post-carousel swiper<?php echo $layout; ?>">
            <div class="swiper-wrapper<?php echo $layout; ?>">
                <?php while ($query->have_posts()) : $query->the_post(); 
					$wpt_promotion_discount = get_field('wpt_promotion_discount');
				?>
                    <div class="wpt-swiper-slide swiper-slide<?php echo $layout; ?>">
                        <?php if (has_post_thumbnail()) : ?>
                            <img src="<?php echo get_the_post_thumbnail_url(get_the_ID(), 'medium'); ?>" alt="<?php the_title(); ?>" class="wpt-slide-image">
                        <?php endif; ?>
						<?php if ($wpt_promotion_discount): ?>
							<div class="wpt-discount-badge">
								<span>ส่วนลด</span>
								<span class="r2"><?php echo $wpt_promotion_discount; ?>%</span>
							</div>
						<?php endif; ?>
                        
                        <div class="wpt-slide-content">
                            <a href="<?php the_permalink(); ?>">
								<h3 class="wpt-slide-title"><?php the_title(); ?></h3>
							</a>
                            <p class="wpt-slide-description"><?php echo wp_trim_words(get_the_excerpt(), 20, '...'); ?></p>
                            <a href="<?php the_permalink(); ?>" class="wpt-slide-button">จองเลย!</a>
                        </div>
                    </div>
                <?php endwhile; ?>
            </div>
            <!-- Add Navigation -->
			 <?php if ($layout != 'grid'): ?>
				<div class="swiper-button-next"></div>
				<div class="swiper-button-prev"></div>
			 <?php endif; ?>
            
        </div>

		<script type="module">
			document.addEventListener('DOMContentLoaded', function() {
				var swiperElements = document.querySelectorAll('.wpt-post-carousel.swiper');
				
				swiperElements.forEach(function(element) {
					var swiper = new Swiper(element, {
						slidesPerView: 1,
						spaceBetween: 10,
						navigation: {
							nextEl: element.querySelector('.wpt-post-carousel .swiper-button-next'),
							prevEl: element.querySelector('.wpt-post-carousel .swiper-button-prev'),
						},
						breakpoints: {
							640: {
								slidesPerView: 1,
								spaceBetween: 20,
							},
							768: {
								slidesPerView: 2,
								spaceBetween: 30,
							},
							1024: {
								slidesPerView: 3,
								spaceBetween: 30,
							},
						},
						autoplay: {
							delay: 10000,
							disableOnInteraction: false,
						},
						loop: true,
					});
				});
			});
		</script>

		<style>
			.wpt-post-carousel .swiper-wrapper {
				align-items: stretch;
			}
			.wpt-swiper-slide {
				display: flex;
				flex-direction: column;
				height: 100%;
				min-height: 471px;
			}
			.wpt-slide-content {
				flex: 1;
				display: flex;
				flex-direction: column;
				justify-content: space-between;
			}
			.wpt-slide-image {
				min-height: 241px;
				object-fit: cover;
				width: 100%;
			}
		</style>
    <?php endif;

    // Reset post data
    wp_reset_postdata();

    return ob_get_clean();
}
add_shortcode('wpt_promotion_carousel', 'wpt_promotion_carousel_shortcode');


function is_elementor() {
    // Check if Elementor is active.
	if (class_exists('\Elementor\Plugin')) {
        global $post;
        
        // Ensure $post and $post->ID are available.
        if (!empty($post) && !empty($post->ID)) {
            // Check if the post is built with Elementor.
            $document = \Elementor\Plugin::$instance->documents->get($post->ID);
            if ($document) {
                return $document->is_built_with_elementor();
            }
        }
    }
    
    return false; // Default return value if conditions aren't met.
}


function rocket_lazyload_exclude_class( $attributes ) {
	$attributes[] = 'class="custom-logo"';
	return $attributes;
}
add_filter( 'rocket_lazyload_excluded_attributes', 'rocket_lazyload_exclude_class' );


add_action('wp_head', function() { echo '<script type="text/javascript"> if (typeof(wp) == "undefined") { window.wp = { i18n: { setLocaleData: (function() { return false; })} }; } </script>'; });

function vecular_prefix_menu_arrow($item_output, $item, $depth, $args) {
		if (in_array('menu-item-has-children', $item->classes)) {
				$arrow = '<div class="wrap-toggle-mobile"><svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg></div>'; // Change the class to your font icon
				$item_output = str_replace('</a>', '</a>'. $arrow .'', $item_output);
		}
		return $item_output;
}
add_filter('walker_nav_menu_start_el', 'vecular_prefix_menu_arrow', 10, 4);


if ( ! function_exists( 'fluffy_setup' ) ) :
	/**
	 * Sets up theme defaults and registers support for various WordPress features.
	 *
	 * Note that this function is hooked into the after_setup_theme hook, which
	 * runs before the init hook. The init hook is too late for some features, such
	 * as indicating support for post thumbnails.
	 */
	function fluffy_setup() {
		/*
		 * Make theme available for translation.
		 * Translations can be filed in the /languages/ directory.
		 * If you're building a theme based on fluffy, use a find and replace
		 * to change 'fluffy' to the name of your theme in all the template files.
		 */
		load_theme_textdomain( 'fluffy', get_template_directory() . '/languages' );

		// Add default posts and comments RSS feed links to head.
		add_theme_support( 'automatic-feed-links' );

		/*
		 * Let WordPress manage the document title.
		 * By adding theme support, we declare that this theme does not use a
		 * hard-coded <title> tag in the document head, and expect WordPress to
		 * provide it for us.
		 */
		add_theme_support( 'title-tag' );

		/*
		 * Enable support for Post Thumbnails on posts and pages.
		 *
		 * @link https://developer.wordpress.org/themes/functionality/featured-images-post-thumbnails/
		 */
		add_theme_support( 'post-thumbnails' );


		require( get_template_directory() . '/updater/theme-updater.php' );

		// This theme uses wp_nav_menu() in one location.
		register_nav_menus(
			array(
				'primary' => esc_html__( 'Primary', 'fluffy' ),
				'mobile' => esc_html__( 'Mobile Menu', 'fluffy' ),
				'topbar' => esc_html__( 'Top Bar Menu', 'fluffy' ),
			)
		);
	
		/*
		 * Switch default core markup for search form, comment form, and comments
		 * to output valid HTML5.
		 */
		add_theme_support(
			'html5',
			array(
				'search-form',
				'comment-form',
				'comment-list',
				'gallery',
				'caption',
				'style',
				'script',
			)
		);

		// Set up the WordPress core custom background feature.
		add_theme_support(
			'custom-background',
			apply_filters(
				'fluffy_custom_background_args',
				array(
					'default-color' => 'ffffff',
					'default-image' => '',
				)
			)
		);

		// Add theme support for selective refresh for widgets.
		add_theme_support( 'customize-selective-refresh-widgets' );

		/**
		 * Add support for core custom logo.
		 *
		 * @link https://codex.wordpress.org/Theme_Logo
		 */
		add_theme_support(
			'custom-logo',
			array(
				'height'      => 250,
				'width'       => 250,
				'flex-width'  => true,
				'flex-height' => true,
			)
		);

	}
endif;



add_action( 'after_setup_theme', 'fluffy_setup' );





/**
 * Set the content width in pixels, based on the theme's design and stylesheet.
 *
 * Priority 0 to make it available to lower priority callbacks.
 *
 * @global int $content_width
 */
function fluffy_content_width() {
	$GLOBALS['content_width'] = apply_filters( 'fluffy_content_width', 640 );
}
add_action( 'after_setup_theme', 'fluffy_content_width', 0 );

/**
 * Register widget area.
 *
 * @link https://developer.wordpress.org/themes/functionality/sidebars/#registering-a-sidebar
 */
function fluffy_widgets_init() {
	register_sidebar(
		array(
			'name'          => esc_html__( 'Footer Widget 1', 'fluffy' ),
			'id'            => 'footer-widget-1',
			'description'   => esc_html__( 'Add widgets here.', 'fluffy' ),
			'before_widget' => '<section id="%1$s" class="widget %2$s">',
			'after_widget'  => '</section>',
			'before_title'  => '<h4 class="widget-title">',
			'after_title'   => '</h4>',
		)
	);

	register_sidebar(
		array(
			'name'          => esc_html__( 'Footer Widget 2', 'fluffy' ),
			'id'            => 'footer-widget-2',
			'description'   => esc_html__( 'Add widgets here.', 'fluffy' ),
			'before_widget' => '<section id="%1$s" class="widget %2$s">',
			'after_widget'  => '</section>',
			'before_title'  => '<h4 class="widget-title">',
			'after_title'   => '</h4>',
		)
	);

	register_sidebar(
		array(
			'name'          => esc_html__( 'Footer Widget 3', 'fluffy' ),
			'id'            => 'footer-widget-3',
			'description'   => esc_html__( 'Add widgets here.', 'fluffy' ),
			'before_widget' => '<section id="%1$s" class="widget %2$s">',
			'after_widget'  => '</section>',
			'before_title'  => '<h4 class="widget-title">',
			'after_title'   => '</h4>',
		)
	);

	register_sidebar(
		array(
			'name'          => esc_html__( 'Footer Widget 4', 'fluffy' ),
			'id'            => 'footer-widget-4',
			'description'   => esc_html__( 'Add widgets here.', 'fluffy' ),
			'before_widget' => '<section id="%1$s" class="widget %2$s">',
			'after_widget'  => '</section>',
			'before_title'  => '<h4 class="widget-title">',
			'after_title'   => '</h4>',
		)
	);

	register_sidebar(
		array(
			'name'          => esc_html__( 'Sidebar', 'fluffy' ),
			'id'            => 'sidebar-1',
			'description'   => esc_html__( 'Add widgets here.', 'fluffy' ),
			'before_widget' => '<section id="%1$s" class="widget %2$s">',
			'after_widget'  => '</section>',
			'before_title'  => '<h2 class="widget-title">',
			'after_title'   => '</h2>',
		)
	);
}
add_action( 'widgets_init', 'fluffy_widgets_init' );

/**
 * Enqueue scripts and styles.
 */
function fluffy_scripts() {
	wp_enqueue_style( 'fluffy-style', get_stylesheet_uri(), array(), '1.0' );
	wp_enqueue_style('fluffy-fonts', get_theme_file_uri('/fonts/noto-sans-thai/font.css'), array(), filemtime(get_theme_file_path('/fonts/noto-sans-thai/font.css')));

	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action( 'wp_enqueue_scripts', 'fluffy_scripts' );


function get_excerpt($limit, $source = null){

    $excerpt = $source == "content" ? get_the_content() : get_the_excerpt();
    $excerpt = preg_replace(" (\[.*?\])",'',$excerpt);
    $excerpt = strip_shortcodes($excerpt);
    $excerpt = strip_tags($excerpt);
    $excerpt = substr($excerpt, 0, $limit);
    $excerpt = substr($excerpt, 0, strripos($excerpt, " "));
    $excerpt = trim(preg_replace( '/\s+/', ' ', $excerpt));
    // $excerpt = $excerpt.'... <a href="'.get_permalink($post->ID).'">'.esc_html__( 'Read More', 'fluffy' ).'</a>';
		  $excerpt = $excerpt.'...';
    return $excerpt;
}

function yp_popup_search(){
  if (isset($_GET['s'])) {
    $s = $_GET['s'];
  }
  else {
    $s = '';
  }
  ?>
	<div class="wrap-all-search">
		<div class="vc_search-toggle">
			<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="css-i6dzq1"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
		</div>
		<div class="wrap-popup_search">
			<div class="cancel-btn_search">
					<span class="btn-close">
					<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="css-i6dzq1"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
					</span>
			</div>
			<div class="popup_search">
				<div class="box-search">
						<div class="sec-search_box">
														<form action="<?php echo home_url(); ?>" id="search-h_box" class="search-h_box" method="GET">
																<div class="main-object_s">
																		<div class="s-object object-1">
																			<label for="s-text">
																				<input type="text" name="s" id="s-text" class="input-s_box input-s_text" value="<?php echo $s; ?>" placeholder="<?php yp_text( 'ค้นหา...', 'Search...' ); ?>">
																				</label>
																		</div>
																		<div class="s-object object-2">
																				<button type="submit" class="btn-search_h btn-sh"><svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="css-i6dzq1"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg></button>
																		</div>
																</div>
														</form>
												</div>
				</div>
			</div>
		</div>
		<div class="vc-search-overlay"></div>
	</div>
  <?php
}

function polylang_slink() {
	if ( ! function_exists( 'pll_the_languages' ) ) {
		return;
	}

	$languages = pll_the_languages(
		array(
			'display_names_as'       => 'name',
			'hide_if_no_translation' => 0,
			'show_flags'             => 0,
			'raw'                    => true,
		)
	);

	if ( empty( $languages ) || ! is_array( $languages ) ) {
		return;
	}
	?>
	<div class="polylang_slink inline-flex items-center gap-0.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-0.5">
		<?php foreach ( $languages as $language ) : ?>
			<?php
			$name       = isset( $language['name'] ) ? (string) $language['name'] : '';
			$url        = isset( $language['url'] ) ? (string) $language['url'] : '';
			$is_current = ! empty( $language['current_lang'] );
			$item_class = $is_current
				? 'languages__item languages__item--current inline-flex min-w-[36px] items-center justify-center rounded-md bg-[#29B2E2] px-2.5 py-1 text-xs font-semibold text-white no-underline transition duration-150'
				: 'languages__item inline-flex min-w-[36px] items-center justify-center rounded-md px-2.5 py-1 text-xs font-medium text-[#64748B] no-underline transition duration-150 hover:bg-white hover:text-[#0F172A]';
			?>
			<a href="<?php echo esc_url( $url ); ?>" class="<?php echo esc_attr( $item_class ); ?>"<?php echo $is_current ? ' aria-current="true"' : ''; ?>>
				<span class="l-text leading-none"><?php echo esc_html( $name ); ?></span>
			</a>
		<?php endforeach; ?>
	</div>
	<?php
}

add_shortcode( 'polylang_slink', 'polylang_slink' );



if( function_exists('acf_add_options_page') ) {

  acf_add_options_page(array(
    'page_title' 	=> 'Site Settings',
    'menu_title'	=> 'Site Settings',
    'menu_slug' 	=> 'vc-site-settings',
    'capability'	=> 'edit_posts',
    'redirect'		=> false
  ));

  acf_add_options_sub_page(array(
    'page_title' 	=> 'Footer Settings',
    'menu_title'	=> 'Footer Settings',
    'parent_slug'	=> 'vc-site-settings',
  ));

  acf_add_options_sub_page(array(
    'page_title' 	=> 'Social Media Settings',
    'menu_title'	=> 'Social Media Settings',
    'parent_slug'	=> 'vc-site-settings',
  ));


}


function social_list() {
		ob_start();
?>
<?php
$facebook = get_field('facebook_link', 'option');
$twitter = get_field('twitter_link', 'option');
$youtube = get_field('youtube_link', 'option');
$line = get_field('line_link', 'option');
$map = get_field('map_link', 'option');
$instagram = get_field('instagram_link', 'option');
?>
<div class="social-list">
	<ul>
		<?php if ($facebook): ?>
			<li class="item-facebook">
				<a target="_blank" href="<?php echo $facebook; ?>">
					<span>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="64px" height="64px"><path d="M 19.253906 2 C 15.311906 2 13 4.0821719 13 8.8261719 L 13 13 L 8 13 L 8 18 L 13 18 L 13 30 L 18 30 L 18 18 L 22 18 L 23 13 L 18 13 L 18 9.671875 C 18 7.884875 18.582766 7 20.259766 7 L 23 7 L 23 2.2050781 C 22.526 2.1410781 21.144906 2 19.253906 2 z"/></svg>
					</span>
				</a>
			</li>
		<?php endif; ?>

		<?php if ($twitter): ?>
			<li class="item-twitter">
				<a target="_blank" href="<?php echo $twitter; ?>">
					<span>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96px" height="96px">    <path d="M22,3.999c-0.78,0.463-2.345,1.094-3.265,1.276c-0.027,0.007-0.049,0.016-0.075,0.023c-0.813-0.802-1.927-1.299-3.16-1.299 c-2.485,0-4.5,2.015-4.5,4.5c0,0.131-0.011,0.372,0,0.5c-3.353,0-5.905-1.756-7.735-4c-0.199,0.5-0.286,1.29-0.286,2.032 c0,1.401,1.095,2.777,2.8,3.63c-0.314,0.081-0.66,0.139-1.02,0.139c-0.581,0-1.196-0.153-1.759-0.617c0,0.017,0,0.033,0,0.051 c0,1.958,2.078,3.291,3.926,3.662c-0.375,0.221-1.131,0.243-1.5,0.243c-0.26,0-1.18-0.119-1.426-0.165 c0.514,1.605,2.368,2.507,4.135,2.539c-1.382,1.084-2.341,1.486-5.171,1.486H2C3.788,19.145,6.065,20,8.347,20 C15.777,20,20,14.337,20,8.999c0-0.086-0.002-0.266-0.005-0.447C19.995,8.534,20,8.517,20,8.499c0-0.027-0.008-0.053-0.008-0.08 c-0.003-0.136-0.006-0.263-0.009-0.329c0.79-0.57,1.475-1.281,2.017-2.091c-0.725,0.322-1.503,0.538-2.32,0.636 C20.514,6.135,21.699,4.943,22,3.999z"/></svg>
					</span>
				</a>
			</li>
		<?php endif; ?>

		<?php if ($line): ?>
			<li class="item-line">
				<a target="_blank" href="<?php echo $line; ?>">
					<span>
						<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="100px" height="100px">    <path d="M 9 4 C 6.24 4 4 6.24 4 9 L 4 41 C 4 43.76 6.24 46 9 46 L 41 46 C 43.76 46 46 43.76 46 41 L 46 9 C 46 6.24 43.76 4 41 4 L 9 4 z M 25 11 C 33.27 11 40 16.359219 40 22.949219 C 40 25.579219 38.959297 27.960781 36.779297 30.300781 C 35.209297 32.080781 32.660547 34.040156 30.310547 35.660156 C 27.960547 37.260156 25.8 38.519609 25 38.849609 C 24.68 38.979609 24.44 39.039062 24.25 39.039062 C 23.59 39.039062 23.649219 38.340781 23.699219 38.050781 C 23.739219 37.830781 23.919922 36.789063 23.919922 36.789062 C 23.969922 36.419063 24.019141 35.830937 23.869141 35.460938 C 23.699141 35.050938 23.029062 34.840234 22.539062 34.740234 C 15.339063 33.800234 10 28.849219 10 22.949219 C 10 16.359219 16.73 11 25 11 z M 23.992188 18.998047 C 23.488379 19.007393 23 19.391875 23 20 L 23 26 C 23 26.552 23.448 27 24 27 C 24.552 27 25 26.552 25 26 L 25 23.121094 L 27.185547 26.580078 C 27.751547 27.372078 29 26.973 29 26 L 29 20 C 29 19.448 28.552 19 28 19 C 27.448 19 27 19.448 27 20 L 27 23 L 24.814453 19.419922 C 24.602203 19.122922 24.294473 18.992439 23.992188 18.998047 z M 15 19 C 14.448 19 14 19.448 14 20 L 14 26 C 14 26.552 14.448 27 15 27 L 18 27 C 18.552 27 19 26.552 19 26 C 19 25.448 18.552 25 18 25 L 16 25 L 16 20 C 16 19.448 15.552 19 15 19 z M 21 19 C 20.448 19 20 19.448 20 20 L 20 26 C 20 26.552 20.448 27 21 27 C 21.552 27 22 26.552 22 26 L 22 20 C 22 19.448 21.552 19 21 19 z M 31 19 C 30.448 19 30 19.448 30 20 L 30 26 C 30 26.552 30.448 27 31 27 L 34 27 C 34.552 27 35 26.552 35 26 C 35 25.448 34.552 25 34 25 L 32 25 L 32 24 L 34 24 C 34.553 24 35 23.552 35 23 C 35 22.448 34.553 22 34 22 L 32 22 L 32 21 L 34 21 C 34.552 21 35 20.552 35 20 C 35 19.448 34.552 19 34 19 L 31 19 z"/></svg>
					</span>
				</a>
			</li>
		<?php endif; ?>

		<?php if ($instagram): ?>
			<li class="item-instagram">
				<a target="_blank" href="<?php echo $instagram; ?>">
					<span>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 50 50" width="100px" height="100px"><path d="M 16 3 C 8.8324839 3 3 8.8324839 3 16 L 3 34 C 3 41.167516 8.8324839 47 16 47 L 34 47 C 41.167516 47 47 41.167516 47 34 L 47 16 C 47 8.8324839 41.167516 3 34 3 L 16 3 z M 16 5 L 34 5 C 40.086484 5 45 9.9135161 45 16 L 45 34 C 45 40.086484 40.086484 45 34 45 L 16 45 C 9.9135161 45 5 40.086484 5 34 L 5 16 C 5 9.9135161 9.9135161 5 16 5 z M 37 11 A 2 2 0 0 0 35 13 A 2 2 0 0 0 37 15 A 2 2 0 0 0 39 13 A 2 2 0 0 0 37 11 z M 25 14 C 18.936712 14 14 18.936712 14 25 C 14 31.063288 18.936712 36 25 36 C 31.063288 36 36 31.063288 36 25 C 36 18.936712 31.063288 14 25 14 z M 25 16 C 29.982407 16 34 20.017593 34 25 C 34 29.982407 29.982407 34 25 34 C 20.017593 34 16 29.982407 16 25 C 16 20.017593 20.017593 16 25 16 z"/></svg>
					</span>
				</a>
			</li>
		<?php endif; ?>




		<?php if ($youtube): ?>
			<li class="item-youtube">
				<a target="_blank" href="<?php echo $youtube; ?>">
				<span>
					<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0px" y="0px" viewBox="0 0 310 310" style="enable-background:new 0 0 310 310;" xml:space="preserve">
					<g id="XMLID_822_">
						<path id="XMLID_823_" d="M297.917,64.645c-11.19-13.302-31.85-18.728-71.306-18.728H83.386c-40.359,0-61.369,5.776-72.517,19.938   C0,79.663,0,100.008,0,128.166v53.669c0,54.551,12.896,82.248,83.386,82.248h143.226c34.216,0,53.176-4.788,65.442-16.527   C304.633,235.518,310,215.863,310,181.835v-53.669C310,98.471,309.159,78.006,297.917,64.645z M199.021,162.41l-65.038,33.991   c-1.454,0.76-3.044,1.137-4.632,1.137c-1.798,0-3.592-0.484-5.181-1.446c-2.992-1.813-4.819-5.056-4.819-8.554v-67.764   c0-3.492,1.822-6.732,4.808-8.546c2.987-1.814,6.702-1.938,9.801-0.328l65.038,33.772c3.309,1.718,5.387,5.134,5.392,8.861   C204.394,157.263,202.325,160.684,199.021,162.41z"/>
					</g>
					</svg>
				</span>
				</a>
			</li>
		<?php endif; ?>

		<?php if ($map): ?>
			<li class="item-map">
				<a target="_blank" href="<?php echo $map; ?>">
					<span>
						<svg xmlns="http://www.w3.org/2000/svg" fill="#000000" viewBox="0 0 50 50" width="50px" height="50px"><path d="M 36 2 C 35.570313 2 35.136719 2.015625 34.71875 2.0625 C 34.605469 2.074219 34.488281 2.109375 34.375 2.125 C 34.070313 2.164063 33.765625 2.21875 33.46875 2.28125 C 33.355469 2.304688 33.269531 2.316406 33.15625 2.34375 C 32.863281 2.414063 32.566406 2.5 32.28125 2.59375 C 32.1875 2.625 32.09375 2.652344 32 2.6875 C 31.699219 2.796875 31.382813 2.929688 31.09375 3.0625 C 31.023438 3.09375 30.976563 3.125 30.90625 3.15625 C 30.597656 3.304688 30.292969 3.453125 30 3.625 C 29.953125 3.652344 29.890625 3.691406 29.84375 3.71875 C 29.53125 3.90625 29.230469 4.097656 28.9375 4.3125 C 28.914063 4.332031 28.898438 4.355469 28.875 4.375 C 28.5625 4.609375 28.257813 4.863281 27.96875 5.125 C 27.960938 5.132813 27.945313 5.117188 27.9375 5.125 C 27.636719 5.398438 27.363281 5.699219 27.09375 6 C 25.1875 8.125 24 10.925781 24 14 C 24 18.148438 26.136719 20.992188 28.40625 24 C 29.230469 25.09375 30.109375 26.246094 30.9375 27.53125 C 32.722656 29.773438 34.371094 32.410156 35.28125 35.90625 C 35.421875 36.449219 35.417969 36.875 35.65625 37.0625 C 35.765625 37.085938 35.871094 37.09375 36 37.09375 C 36.128906 37.09375 36.234375 37.082031 36.34375 37.0625 C 36.582031 36.875 36.578125 36.449219 36.71875 35.90625 C 37.628906 32.410156 39.277344 29.773438 41.0625 27.53125 C 41.890625 26.246094 42.769531 25.089844 43.59375 24 C 43.734375 23.816406 43.863281 23.621094 44 23.4375 C 44.214844 23.152344 44.417969 22.878906 44.625 22.59375 C 44.722656 22.460938 44.808594 22.320313 44.90625 22.1875 C 45.0625 21.964844 45.222656 21.753906 45.375 21.53125 C 45.484375 21.367188 45.582031 21.195313 45.6875 21.03125 C 45.820313 20.828125 45.972656 20.644531 46.09375 20.4375 C 46.203125 20.253906 46.304688 20.0625 46.40625 19.875 C 46.515625 19.679688 46.621094 19.480469 46.71875 19.28125 C 46.820313 19.078125 46.910156 18.863281 47 18.65625 C 47.085938 18.464844 47.175781 18.257813 47.25 18.0625 C 47.339844 17.832031 47.394531 17.613281 47.46875 17.375 C 47.527344 17.1875 47.605469 17.003906 47.65625 16.8125 C 47.726563 16.53125 47.761719 16.230469 47.8125 15.9375 C 47.839844 15.773438 47.886719 15.636719 47.90625 15.46875 C 47.964844 15 48 14.503906 48 14 C 48 7.382813 42.617188 2 36 2 Z M 6.34375 6 C 3.953125 6 2 7.953125 2 10.34375 L 2 43.65625 C 2 43.882813 2.027344 44.09375 2.0625 44.3125 C 2.382813 46.386719 4.179688 48 6.34375 48 L 39.65625 48 C 39.882813 48 40.09375 47.972656 40.3125 47.9375 C 42.277344 47.632813 43.8125 46.011719 43.96875 44 L 44 44 L 44 26.78125 C 43.582031 27.355469 43.160156 27.957031 42.75 28.59375 L 42.625 28.78125 C 40.597656 31.328125 39.367188 33.675781 38.65625 36.40625 C 38.625 36.523438 38.613281 36.617188 38.59375 36.71875 C 38.515625 37.125 38.371094 37.773438 37.90625 38.3125 L 42 42.40625 L 42 43.65625 C 42 44.941406 40.941406 46 39.65625 46 L 38.40625 46 L 24.34375 31.96875 L 27.9375 28.3125 L 31.5 31.90625 C 30.914063 30.871094 30.21875 29.839844 29.375 28.78125 L 29.25 28.59375 C 28.667969 27.691406 28.078125 26.902344 27.5 26.125 L 7.59375 46 L 6.34375 46 C 5.058594 46 4 44.941406 4 43.65625 L 4 42.40625 L 24.46875 21.90625 C 23.058594 19.671875 22 17.183594 22 14 C 22 11.027344 22.941406 8.269531 24.53125 6 Z M 12.125 10 C 13.710938 10 15.132813 10.605469 16.21875 11.59375 L 14.5 13.3125 C 13.855469 12.761719 13.039063 12.4375 12.125 12.4375 C 10.089844 12.4375 8.4375 14.089844 8.4375 16.125 C 8.4375 18.160156 10.089844 19.8125 12.125 19.8125 C 13.835938 19.8125 15.003906 18.789063 15.4375 17.375 L 12.125 17.375 L 12.125 15.03125 L 17.875 15.03125 C 18.378906 17.414063 17.46875 22.21875 12.125 22.21875 C 8.75 22.21875 6 19.5 6 16.125 C 6 12.75 8.75 10 12.125 10 Z M 36 11 C 37.65625 11 39 12.34375 39 14 C 39 15.65625 37.65625 17 36 17 C 34.34375 17 33 15.65625 33 14 C 33 12.34375 34.34375 11 36 11 Z"></path></svg>
					</span>
				</a>
			</li>
		<?php endif; ?>
	</ul>
</div>
<?php
$output_string = ob_get_contents();
ob_end_clean();
return $output_string;
}
add_shortcode('social_list','social_list');


// Enable media_library_infinite_scrolling
class Enable_Media_Library_Infinite_Scrolling {
	public function __construct() {
		$this->add_hooks();
	}
	public function add_hooks() {
		add_filter( 'media_library_infinite_scrolling', '__return_true' );
	}
}
new Enable_Media_Library_Infinite_Scrolling();

 // Disables the block editor from managing widgets in the Gutenberg plugin.
add_filter( 'gutenberg_use_widgets_block_editor', '__return_false' );
// Disables the block editor from managing widgets.
add_filter( 'use_widgets_block_editor', '__return_false' );



/**
 * Implement the Custom Header feature.
 */
require get_template_directory() . '/inc/custom-header.php';

/**
 * Custom template tags for this theme.
 */
require get_template_directory() . '/inc/template-tags.php';

/**
 * Functions which enhance the theme by hooking into WordPress.
 */
require get_template_directory() . '/inc/template-functions.php';

/**
 * Customizer additions.
 */
require get_template_directory() . '/inc/customizer.php';

/**
 * Load Jetpack compatibility file.
 */
if ( defined( 'JETPACK__VERSION' ) ) {
	require get_template_directory() . '/inc/jetpack.php';
}





add_action('wp_ajax_return_location', 'return_location_func'); 
add_action('wp_ajax_nopriv_return_location', 'return_location_func'); 
function return_location_func(){

	$origin_value = $_POST['origin'];
    $destination_value = $_POST['destination'];
	$selected_package_car_type = $_POST['selected_package_car_type'];
	$selected_package_price = $_POST['selected_package_price'];

	if(!empty($origin_value)){
		$origin_value = urldecode($origin_value);
	}

	
	if(!empty($destination_value)){
		$destination_value = urldecode($destination_value);
	}

	if(!empty($selected_package_car_type)){
		$selected_package_car_type = urldecode($selected_package_car_type);
	}
	
	if(!empty($selected_package_price)){
		$selected_package_price = urldecode($selected_package_price);
		$selected_package_price = str_replace(' บาท', '', $selected_package_price);
	}

	// echo $selected_package_price;
	// echo $selected_package_car_type;

	// echo $origin_value;
	// echo ' to ';
	// echo $destination_value;


	    $args = [
        'post_type'      => 'package_rent',
        'posts_per_page' => -1,
        'meta_query'     => [
            'relation' => 'AND',
            [
                'key'     => 'origin',
                'value'   => $origin_value,
                'compare' => 'LIKE'
            ],
            [
                'key'     => 'destination',
                'value'   => $destination_value,
                'compare' => 'LIKE'
            ],
            [
                'key'     => 'car_type',
                'value'   => $selected_package_car_type,
                'compare' => 'LIKE'
            ],
        ],
    ];

    $query = new WP_Query($args);
    $output = '';
	$price_return = 0;
    // print_r($query);

    if ($query->have_posts()) {

		$output = 'found';
		while ($query->have_posts()) {
			$query->the_post();
			$price_return = (int) str_replace(',', '', get_field('price'));			
		}
		wp_reset_postdata();
	} else {
		$output = 'not_found';
	}



	wp_send_json(['status' => $output, 'price' => $price_return]);
	exit();
}






// ========= Parking Booking Email Template =========
function generate_parking_booking_email_template_v2($booking_body) {
    $site_name = get_bloginfo('name');
    $site_url = get_bloginfo('url');
  
    
    $html = '<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <title>Booking Confirmation</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    @media screen and (max-width:600px){
      .container{width:100% !important}
      .px-24{padding-left:16px !important; padding-right:16px !important}
      .py-32{padding-top:20px !important; padding-bottom:20px !important}
      .stack{display:block !important; width:100% !important}
      .text-center-sm{text-align:center !important}
    }
    a[x-apple-data-detectors]{color:inherit !important; text-decoration:none !important;}
    body {margin:0; padding:0; background:#f2f4f6; font-family:Arial, Helvetica, sans-serif;}
    table {border-collapse: collapse;}
  </style>
</head>
<body style="margin:0; padding:0; background:#f2f4f6; font-family:Arial, Helvetica, sans-serif;">

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding:0 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="container" style="width:600px; max-width:600px; background:#ffffff; border-radius:8px; overflow:hidden;">

        <!-- Header -->
          <tr>
            <td bgcolor="#29b2e2" style="padding:18px 24px; color:#ffffff;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td class="text-center-sm" style="font-weight:bold; font-size:20px;color:#ffffff">' . $site_name . '</td>
                  <td align="right" style="color:#FFF;" class="text-center-sm">Parking and Shuttle</td>
                </tr>
              </table>
            </td>
          </tr>';

      $html .= $booking_body;

      $html .= '
          <!-- Promo block -->
          <tr>
            <td bgcolor="#29b2e2" align="center" style="padding:28px 24px; color:#ffffff;">
              <div style="font-size:18px; font-weight:bold; margin-bottom:10px;">Need Help? We’re Here for You!</div>
              <div style="font-size:14px; font-weight:bold; margin-bottom:10px;">If you have any questions or need assistance, please feel free to reach us</div>
              <div style="font-size:14px; margin-bottom:15px;">LINE Official Account: @parkingsystem</div>
              <div style="font-size:14px; margin-bottom:15px;">Phone: +6696-286-4050</div>
              <div style="font-size:14px; margin-bottom:15px;">Email: support@parking-system.local</div>
              <div style="font-size:17px; font-weight:bold; margin-bottom:10px;">Thank you for choosing Parking System.<BR>We look forward to welcoming you!</div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px; background:#f7f7f7;">
              <div style="font-size:12px; color:#666;">
                <div>Copyright © <strong>' . $site_name . '</strong> All rights reserved.</div>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>';
    
    
    return $html;
}



// Function to generate car rental booking email template
function generate_carrent_booking_email_template_v2($booking_data) {
    $site_name = get_bloginfo('name');
    $site_url = get_bloginfo('url');

    
    $html = '<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="utf-8">
  <title>Car Rental Booking Confirmation</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    @media screen and (max-width:600px){
      .container{width:100% !important}
      .px-24{padding-left:16px !important; padding-right:16px !important}
      .py-32{padding-top:20px !important; padding-bottom:20px !important}
      .stack{display:block !important; width:100% !important}
      .text-center-sm{text-align:center !important}
    }
    a[x-apple-data-detectors]{color:inherit !important; text-decoration:none !important;}
    body {margin:0; padding:0; background:#f2f4f6; font-family:Arial, Helvetica, sans-serif;}
    table {border-collapse: collapse;}
  </style>
</head>
<body style="margin:0; padding:0; background:#f2f4f6; font-family:Arial, Helvetica, sans-serif;">

  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding:0 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="container" style="width:600px; max-width:600px; background:#ffffff; border-radius:8px; overflow:hidden;">
          
          <!-- Header -->
          <tr>
            <td bgcolor="#e67e22" style="padding:18px 24px; color:#ffffff;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td class="text-center-sm" style="color:#FFF; font-weight:bold; font-size:20px;">' . $site_name . '</td>
                  <td align="right" style="color:#FFF;" class="text-center-sm">
                    Parking and Shuttle
                  </td>
                </tr>
              </table>
            </td>
          </tr>';

          

          $html .= $booking_data;


      
    
    $html .= '
          <!-- Promo block -->
          <tr>
            <td bgcolor="#e67e22" align="center" style="padding:28px 24px; color:#ffffff;">
              <div style="font-size:18px; font-weight:bold; margin-bottom:10px;">Contact Parking System</div>
              <div style="font-size:14px; font-weight:bold; margin-bottom:10px;">If you have any questions or need assistance, please feel free to reach us</div>
              <div style="font-size:14px; margin-bottom:15px;">LINE Official Account: @parkingsystem</div>
              <div style="font-size:14px; margin-bottom:15px;">Phone: +6696-286-4050</div>
              <div style="font-size:14px; margin-bottom:15px;">Email: support@parking-system.local</div>
              <div style="font-size:17px; font-weight:bold; margin-bottom:10px;">Thank you for choosing Parking System.<BR>We look forward to welcoming you!</div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:24px; background:#f7f7f7;">
              <div style="font-size:12px; color:#666;">
                <div>Copyright © <strong>' . $site_name . '</strong> All rights reserved.</div>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>';

    
    return $html;
}




// Add custom cron schedule for every 30 minutes
function add_every_30_minutes($schedules) {
    $schedules['every_30_minutes'] = array(
        'interval' => 1800, // 30 minutes in seconds
        'display' => __('Every 30 minutes')
    );
    return $schedules;
}
add_filter('cron_schedules', 'add_every_30_minutes');

// Schedule the ParkingReminder event
function schedule_parking_reminder() {
    if (!wp_next_scheduled('parking_reminder_event')) {
        wp_schedule_event(time(), 'every_30_minutes', 'parking_reminder_event');
    }
}
add_action('wp', 'schedule_parking_reminder');




// Cancellation notification function
function parking_cancellation_notification($post_id) {
    // Check if this is a parking_booking post type
    if (get_post_type($post_id) !== 'parking_booking') {
        return;
    }
    
    // Check if tracking_check_status is 'cancel'
    $tracking_status = get_field('tracking_check_status', $post_id);
    if ($tracking_status !== 'cancel') {
        return;
    }
    
    // Check if notification already sent
    $transient_key = 'parking_cancellation_sent_v2_' . $post_id;
    if (get_transient($transient_key)) {
        return; // Already sent
    }
    
    $order_id = get_field('order_code', $post_id);
    $to = get_field('email_park', $post_id);
    $subject = 'Parking System - [Parking Reservation Service] Booking Canceled (Booking No. [' . $order_id . '])';
    $headers = array('Content-Type: text/html; charset=UTF-8');
    
    $full_name = get_field('fullname_park', $post_id);
    $location_park = get_field('location_park', $post_id);
    $start_date = get_field('start_date', $post_id);
    $start_time = get_field('start_time', $post_id);
    $end_date = get_field('end_date', $post_id);
    $end_time = get_field('end_time', $post_id);
    $vehicle_info = get_field('vehicle_info', $post_id);
    // update_field('tracking_check_status', 'cancel', $post_id); 

    $parking_slot = '';
    $amount_paid = get_field('cp_price', $post_id);
    if ($amount_paid == '') $amount_paid = '0';

    $license_plate = '';
    foreach($vehicle_info as $vehicle){
        if ($license_plate != '') $license_plate .= ', ';
        $license_plate .= $vehicle['license_plate'];
        $parking_slot .= $vehicle['parking_slot'] . ' ';
    }
    
    ob_start();
    $body_content = '
      <!-- Title -->
       <tr>
        <td align="left" class="px-24 py-32" style="padding:28px 24px;">
          <img src="' . get_stylesheet_directory_uri() . '/customize/img/brand-logo.svg" width="60" height="60" alt="Success" style="display:block; margin:0 auto 12px; border-radius:32px;">
          <div style="font-size:14px;line-height:20px; font-weight:bold; color:#333;">Dear '.$full_name.',</div>
          <div style="font-size:13px;line-height:20px; color:#666;">
           Your reservation with a booking number [' . $order_id . '] has been successfully canceled. Please find the details below:
          </div>
        </td>
      </tr>

      <!-- Summary Details -->
      <tr>
        <td class="px-24" style="padding:0 24px 8px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 15px; border:1px solid #e5e7eb; border-radius:6px;">
          <tbody>
          <tr>
              <td colspan="2" style="padding:16px; font-weight:bold; color:#111827;">Canceled Reservation Details</td>
            </tr>
                <tr>
              <td style="padding:12px 16px; color:#666;">Parking Location</td>
              <td align="right" style="padding:12px 16px; color:#111;">' . $location_park . '</td>
            </tr>
            <tr>
              <td style="padding:12px 16px; color:#666;">Dates:</td>
              <td align="right" style="padding:12px 16px; color:#111;">' . $start_date . ' ' . $start_time . '</td>
            </tr>
            <tr>
              <td style="padding:12px 16px; color:#666;">License Plate.</td>
              <td align="right" style="padding:12px 16px; color:#111;">' . $license_plate . '</td>
            </tr>
            <tr>
              <td style="padding:12px 16px; color:#666;">Parking Slot</td>
              <td align="right" style="padding:12px 16px; color:#111;">' . $parking_slot . '</td>
            </tr>

          
        
          </tbody>
          </table>
        </td>
      </tr>



      <!-- Payment Details -->
      <tr>
        <td class="px-24" style="padding:0 24px 8px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 15px; border:1px solid #e5e7eb; border-radius:6px;">
          <tbody>
          <tr>
              <td colspan="2" style="padding:16px; font-weight:bold; color:#111827;">Payment Summary/td>
            </tr>
            <tr>
              <td style="padding:12px 16px; color:#666;">Amount Paid</td>
              <td align="right" style="padding:12px 16px; color:#111;">' . $amount_paid . '</td>
            </tr>
            <tr>
              <td style="padding:12px 16px; color:#666;">If you would like to make a new reservation, please visit:</td>
              <td align="right" style="padding:12px 16px; color:#111;"><a target="_blank" href="'.get_home_url().'/carpark">'.get_home_url().'/carpark</a></td>
            </tr>
          </tbody>
          </table>
        </td>
      </tr>';
    
    echo generate_parking_booking_email_template_v2($body_content);
    $body = ob_get_contents();
    ob_end_clean();
    
    wp_mail( $to, $subject, $body, $headers );
    
    // Send to admin as well
    $admin_email = get_option('admin_email');
    wp_mail( $admin_email, 'ADMIN: ' . $subject, $body, $headers );
    
    // Set transient to prevent sending again, expire in 24 hours
    set_transient($transient_key, true, 24 * 3600);
}
add_action('save_post', 'parking_cancellation_notification', 50);




function carrent_cancellation_notification($post_id) {
    // Check if this is a car_rentals post type
    if (get_post_type($post_id) !== 'car_rentals') {
        return;
    }
    
    // Check if rental_status is 'cancel'
    $rental_status = get_field('rental_status', $post_id);
    if ($rental_status !== 'cancel') {
        return;
    }
    
    // Check if notification already sent
    $transient_key = 'carrent_cancellation_sent_v2_' . $post_id;
    if (get_transient($transient_key)) {
        return; // Already sent
    }
    
    $order_code = get_the_title($post_id); // Assuming title is order code
                        // Extract order ID from parentheses in title
                        if (preg_match('/\((.*?)\)/', $order_code, $matches)) {
                            $order_code = $matches[1];
                        } else {
                            $order_code = $order_code; // fallback if no parentheses found
                        }

    $personal_info = get_field('personal_information', $post_id);
    $to = $personal_info['email'];
    $subject = 'Parking System - [Private Car Service] Booking Cancelled (Booking No. [' . $order_code . '])';
    $headers = array('Content-Type: text/html; charset=UTF-8');
    
    $full_name = get_field('fullname', $post_id);
    $phone = get_field('phone', $post_id);
    $vehicle_info = get_field('vehicle_info', $post_id);
    // update_field('tracking_check_status', 'cancel', $post_id); 

    $license_plate = '';
    foreach($vehicle_info as $vehicle){
        if ($license_plate != '') $license_plate .= ', ';
        $license_plate .= $vehicle['license_plate'];
    }
    
        // $amount_paid = get_field('cp_price', $post_id);
        if ($amount_paid == '') $amount_paid = '0';

            $travel_info = get_field('travel_information_outbound_trip', $booking_id);
            $depart_date = $travel_info['depart_date'];
            $depart_time = $travel_info['depart_time'];

                    $pickup_location = $travel_info['depart_start_location'].' ('.$travel_info['depart_start_location_note'].')';
                    $dropoff_location = $travel_info['depart_destination'].' ('.$travel_info['depart_destination_note'].')';
                    $booking_details = get_field('booking_details', $booking_id);
                    $vehicle_type = $booking_details['car_type'];
                    
    ob_start();
    $body_content = '
      <!-- Title -->
       <tr>
        <td align="left" class="px-24 py-32" style="padding:28px 24px;">
          <img src="' . get_stylesheet_directory_uri() . '/customize/img/brand-logo.svg" width="60" height="60" alt="Success" style="display:block; margin:0 auto 12px; border-radius:32px;">
          <div style="font-size:14px;line-height:20px; font-weight:bold; color:#333;">Dear '.$full_name.',</div>
          <div style="font-size:13px;line-height:20px; color:#666;">
          We regret to inform you that your booking number [' . $order_code . '] has been successfully cancelled. Please see the details below:
          </div>
        </td>
      </tr>

      <!-- Summary Details -->
      <tr>
        <td class="px-24" style="padding:0 24px 8px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 15px; border:1px solid #e5e7eb; border-radius:6px;">
          <tbody>
          <tr>
              <td colspan="2" style="padding:16px; font-weight:bold; color:#111827;">Cancelled Booking Details</td>
            </tr>

            
                <tr>
              <td style="padding:12px 16px; color:#666;">Customer Name</td>
              <td align="right" style="padding:12px 16px; color:#111;">' . $full_name . '</td>
            </tr>

            <tr>
                                  <td style="padding:12px 16px; color:#666;">Travel Date:</td>
                                  <td align="right" style="padding:12px 16px; color:#111;">' . $depart_date . '</td>
                                </tr>
                                      <tr>
                                  <td style="padding:12px 16px; color:#666;">Pickup Time:</td>
                                  <td align="right" style="padding:12px 16px; color:#111;">' . $depart_time . '</td>
                                </tr>
                                    <tr>
                                  <td style="padding:12px 16px; color:#666;">Pickup Location:</td>
                                  <td align="right" style="padding:12px 16px; color:#111;">' . $pickup_location . '</td>
                                </tr>
                                <tr>
                                  <td style="padding:12px 16px; color:#666;">Drop-off Location:</td>
                                  <td align="right" style="padding:12px 16px; color:#111;">' . $dropoff_location . '</td>
                                </tr>
                                <tr>
                                  <td style="padding:12px 16px; color:#666;">Vehicle Type:</td>
                                  <td align="right" style="padding:12px 16px; color:#111;">' . $vehicle_type . '</td>
                                </tr>


                                
      <!-- Payment Details -->
      <tr>
        <td class="px-24" style="padding:0 24px 8px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 15px; border:1px solid #e5e7eb; border-radius:6px;">
          <tbody>
          <tr>
              <td colspan="2" style="padding:16px; font-weight:bold; color:#111827;">Payment Summary/td>
            </tr>
            <tr>
              <td style="padding:12px 16px; color:#666;">Amount Paid</td>
              <td align="right" style="padding:12px 16px; color:#111;">' . $amount_paid . '</td>
            </tr>
            <tr>
              <td style="padding:12px 16px; color:#666;">If you would like to make a new reservation, please visit:</td>
              <td align="right" style="padding:12px 16px; color:#111;"><a target="_blank" href="'.get_home_url().'/carrent">'.get_home_url().'/carrent</a></td>
            </tr>
          </tbody>
          </table>
        </td>
      </tr>

          </tbody>
          </table>
        </td>
      </tr>';
    
    echo generate_carrent_booking_email_template_v2($body_content);
    $body = ob_get_contents();
    ob_end_clean();
    
    wp_mail( $to, $subject, $body, $headers );
    
    // Send to admin as well
    $admin_email = get_option('admin_email');
    wp_mail( $admin_email, 'ADMIN: ' . $subject, $body, $headers );
    
    // Set transient to prevent sending again, expire in 24 hours
    set_transient($transient_key, true, 24 * 3600);
}
add_action('save_post', 'carrent_cancellation_notification', 50);








// ParkingReminder cron function
function parking_reminder_cron() {
    $today = date_i18n( 'Ymd' );
    
    $args = array(
        'post_type' => 'parking_booking',
        'meta_query' => array(
            array(
                'key' => 'tracking_check_status',
                'value' => 'confirmed',
                'compare' => '='
            ),
            array(
                'key' => 'start_date',
                'value' => $today,
                'compare' => '='
            )
        ),
        'posts_per_page' => -1
    );
    
    $bookings = get_posts($args);
	
    
    foreach ($bookings as $booking) {
        $booking_id = $booking->ID;
        $transient_key = 'parking_reminder_sent_v1_' . $booking_id;
        
        if (get_transient($transient_key)) {
            continue; // Already sent
        }
	
        
        $start_date = get_field('start_date', $booking_id);
        $start_time = get_field('start_time', $booking_id);
        $start_datetime = strtotime($start_date . ' ' . $start_time);
        $reminder_time = $start_datetime - 12 * 3600; // 12 hours before
        $current_time = time();
        
        // Send if current time is between reminder_time and start_datetime
        if ($current_time <= $reminder_time && $current_time < $start_datetime) {
            $order_id = get_field('order_code', $booking_id);
            $to = get_field('email_park', $booking_id);
            $subject = 'Parking System - [Parking Service] Reminder: Your booking starts soon (Booking No. [' . $order_id . '])';
            $headers = array('Content-Type: text/html; charset=UTF-8');
            
            $full_name = get_field('fullname_park', $booking_id);
            $location_park = get_field('location_park', $booking_id);
            $vehicle_info = get_field('vehicle_info', $booking_id);
            $license_plate = '';
            foreach($vehicle_info as $vehicle){
                if ($license_plate != '') $license_plate .= ', ';
                $license_plate .= $vehicle['license_plate'];
            }
            
            ob_start();
            $body_content = '
              <!-- Title -->
               <tr>
                <td align="left" class="px-24 py-32" style="padding:28px 24px;">
                  <img src="' . get_stylesheet_directory_uri() . '/customize/img/brand-logo.svg" width="60" height="60" alt="Success" style="display:block; margin:0 auto 12px; border-radius:32px;">
                  <div style="font-size:14px;line-height:20px; font-weight:bold; color:#333;">Dear '.$full_name.',</div>
                  <div style="font-size:13px;line-height:20px; color:#666;">
                  This is a reminder that your parking booking is starting soon.
                  </div>
                </td>
              </tr>

              <!-- Summary Details -->
              <tr>
                <td class="px-24" style="padding:0 24px 8px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 15px; border:1px solid #e5e7eb; border-radius:6px;">
                  <tbody>
                  <tr>
                      <td colspan="2" style="padding:16px; font-weight:bold; color:#111827;">Booking Details</td>
                    </tr>
                        <tr>
                      <td style="padding:12px 16px; color:#666;">Parking Location</td>
                      <td align="right" style="padding:12px 16px; color:#111;">' . $location_park . '</td>
                    </tr>
                    <tr>
                      <td style="padding:12px 16px; color:#666;">Start Date & Time:</td>
                      <td align="right" style="padding:12px 16px; color:#111;">' . $start_date . ' ' . $start_time . '</td>
                    </tr>
                    <tr>
                      <td style="padding:12px 16px; color:#666;">Vehicle Plate No.</td>
                      <td align="right" style="padding:12px 16px; color:#111;">' . $license_plate . '</td>
                    </tr>
                    
                <tr>
                 <td colspan="2" style="padding:16px; text-align:center;">
                    <div style="text-align:center;">
                        <div style="font-weight:bold; color:#111; margin-bottom:10px;font-size:12px;">Please use the QR Code below to Check-in when you arrive at the parking area.</div>
                            <div style="display:inline-block; padding:15px; background:#ffffff; border:1px solid #e5e7eb; border-radius:8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <img style="width:200px; height:200px;" alt="QR Code" src="' . esc_url_raw(get_field('qr_code_url', $booking_id)) . '">
                            </div>
                        <div style="font-size:12px; color:#666; margin-top:8px;">Please show this QR Code at the entry and exit points</div>
                    </div>
                 </td>
                </tr>
                  </tbody>
                  </table>
                </td>
              </tr>';
            
            echo generate_parking_booking_email_template_v2($body_content);
            $body = ob_get_contents();
            ob_end_clean();
            
            wp_mail( $to, $subject, $body, $headers );
            
            // Send to admin as well
            $admin_email = get_option('admin_email');
            wp_mail( $admin_email, 'ADMIN: ' . $subject, $body, $headers );
            
            // Set transient to prevent sending again, expire in 24 hours
            set_transient($transient_key, true, 24 * 3600);
        }
    }
}

// Parking reminder before checkout (12 hours before end time)
function parking_checkout_reminder_cron() {
    $today = date_i18n( 'Ymd' );
    
    $args = array(
        'post_type' => 'parking_booking',
        'meta_query' => array(
            array(
                'key' => 'tracking_check_status',
                'value' => 'confirmed',
                'compare' => '='
            ),
            array(
                'key' => 'end_date',
                'value' => $today,
                'compare' => '='
            )
        ),
        'posts_per_page' => -1
    );
    
    $bookings = get_posts($args);
    
    foreach ($bookings as $booking) {
        $booking_id = $booking->ID;
        $transient_key = 'parking_checkout_reminder_sent_v1_' . $booking_id;
        
        if (get_transient($transient_key)) {
            continue; // Already sent
        }
        
        $end_date = get_field('end_date', $booking_id);
        $end_time = get_field('end_time', $booking_id);
        $end_datetime = strtotime($end_date . ' ' . $end_time);
        $reminder_time = $end_datetime - 12 * 3600; // 12 hours before
        $current_time = time();
        
        // Send if current time is between reminder_time and end_datetime
        if ($current_time >= $reminder_time && $current_time < $end_datetime) {
            $order_id = get_field('order_code', $booking_id);
            $to = get_field('email_park', $booking_id);
            $subject = 'Parking System - [Parking Service] Reminder: Your booking end soon (Booking No. [' . $order_id . '])';
            $headers = array('Content-Type: text/html; charset=UTF-8');
            
            $full_name = get_field('fullname_park', $booking_id);
            $location_park = get_field('location_park', $booking_id);
            $vehicle_info = get_field('vehicle_info', $booking_id);
            $license_plate = '';
            foreach($vehicle_info as $vehicle){
                if ($license_plate != '') $license_plate .= ', ';
                $license_plate .= $vehicle['license_plate'];
            }
            
            ob_start();
            $body_content = '
              <!-- Title -->
               <tr>
                <td align="left" class="px-24 py-32" style="padding:28px 24px;">
                  <img src="' . get_stylesheet_directory_uri() . '/customize/img/brand-logo.svg" width="60" height="60" alt="Success" style="display:block; margin:0 auto 12px; border-radius:32px;">
                  <div style="font-size:14px;line-height:20px; font-weight:bold; color:#333;">Dear '.$full_name.',</div>
                  <div style="font-size:13px;line-height:20px; color:#666;">
                    This is a reminder that your parking booking will end soon.
                  </div>
                </td>
              </tr>

              <!-- Summary Details -->
              <tr>
                <td class="px-24" style="padding:0 24px 8px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 15px; border:1px solid #e5e7eb; border-radius:6px;">
                  <tbody>
                  <tr>
                      <td colspan="2" style="padding:16px; font-weight:bold; color:#111827;">Booking Details</td>
                    </tr>
                    <tr>
                      <td style="padding:12px 16px; color:#666;">End Date & Time:</td>
                      <td align="right" style="padding:12px 16px; color:#111;">' . $end_date . ' ' . $end_time . '</td>
                    </tr>
                    <tr>
                      <td style="padding:12px 16px; color:#666;">Location</td>
                      <td align="right" style="padding:12px 16px; color:#111;">' . $location_park . '</td>
                    </tr>
                    
                <tr>
                 <td colspan="2" style="padding:16px; text-align:center;">
                    <div style="text-align:center;">
                        <div style="font-weight:bold; color:#111; margin-bottom:10px;font-size:12px;">Please use the same QR Code for Check-out when leaving the parking area. If you need to extend your booking, please do so in the system before the end time to avoid late fees.</div>
                            <div style="display:inline-block; padding:15px; background:#ffffff; border:1px solid #e5e7eb; border-radius:8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                                <img style="width:200px; height:200px;" alt="QR Code" src="' . esc_url_raw(get_field('qr_code_url', $booking_id)) . '">
                            </div>
                        <div style="font-size:12px; color:#666; margin-top:8px;">Please show this QR Code at the exit points</div>
                    </div>
                 </td>
                </tr>
                  </tbody>
                  </table>
                </td>
              </tr>';
            
            echo generate_parking_booking_email_template_v2($body_content);
            $body = ob_get_contents();
            ob_end_clean();
            
            wp_mail( $to, $subject, $body, $headers );
            
            // Send to admin as well
            $admin_email = get_option('admin_email');
            wp_mail( $admin_email, 'ADMIN: ' . $subject, $body, $headers );
            
            // Set transient to prevent sending again, expire in 24 hours
            set_transient($transient_key, true, 24 * 3600);
        }
    }
}



// Overtime notification function (12 hours after booking end time)
function parking_overtime_notification_cron() {
    $current_time = time();
    
    $args = array(
        'post_type' => 'parking_booking',
        'meta_query' => array(
            array(
                'key' => 'tracking_check_status',
                'value' => 'checked-out',
                'compare' => '!='
            )
        ),
        'posts_per_page' => -1
    );
    
    $bookings = get_posts($args);
    
    foreach ($bookings as $booking) {
        $booking_id = $booking->ID;
        $transient_key = 'parking_overtime_sent_' . $booking_id;
        
        if (get_transient($transient_key)) {
            continue; // Already sent
        }
        
        $end_date = get_field('end_date', $booking_id);
        $end_time = get_field('end_time', $booking_id);
        $end_datetime = strtotime($end_date . ' ' . $end_time);
        
        // Check if booking has ended and 12 hours have passed
        $overtime_threshold = $end_datetime + (12 * 3600); // 12 hours after end time
        
        if ($current_time > $overtime_threshold) {
            $order_id = get_field('order_code', $booking_id);
            $to = get_field('email_park', $booking_id);
            $subject = 'Parking System - [Parking Service] Overtime Notification (Booking No. [' . $order_id . '])';
            $headers = array('Content-Type: text/html; charset=UTF-8');
            
            $full_name = get_field('fullname_park', $booking_id);
            $location_park = get_field('location_park', $booking_id);
            $vehicle_info = get_field('vehicle_info', $booking_id);
            update_field('tracking_check_status', 'overtime_checkout', $booking_id); 

            $license_plate = '';
            foreach($vehicle_info as $vehicle){
                if ($license_plate != '') $license_plate .= ', ';
                $license_plate .= $vehicle['license_plate'];
            }
            
            // Calculate overtime hours
            $overtime_hours = ceil(($current_time - $end_datetime) / 3600);
            $overtime_fee = $overtime_hours * 50; // Assuming 50 THB per hour
            
            ob_start();
            $body_content = '
              <!-- Title -->
               <tr>
                <td align="left" class="px-24 py-32" style="padding:28px 24px;">
                  <img src="' . get_stylesheet_directory_uri() . '/customize/img/brand-logo.svg" width="60" height="60" alt="Success" style="display:block; margin:0 auto 12px; border-radius:32px;">
                  <div style="font-size:14px;line-height:20px; font-weight:bold; color:#333;">Dear '.$full_name.',</div>
                  <div style="font-size:13px;line-height:20px; color:#666;">
                    Our system has detected that your booking has already passed the scheduled end time, but you have not yet completed the Check-out process. This means your vehicle has overstayed the reserved period.
                  </div>
                </td>
              </tr>

              <!-- Summary Details -->
              <tr>
                <td class="px-24" style="padding:0 24px 8px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 15px; border:1px solid #e5e7eb; border-radius:6px;">
                  <tbody>
                  <tr>
                      <td colspan="2" style="padding:16px; font-weight:bold; color:#111827;">Booking Details</td>
                    </tr>

                    <tr>
                      <td style="padding:12px 16px; color:#666;">Booking No.</td>
                      <td align="right" style="padding:12px 16px; color:#111;">' . $order_id . '</td>
                    </tr>
                      <tr>
                      <td style="padding:12px 16px; color:#666;">End Date & Time:</td>
                      <td align="right" style="padding:12px 16px; color:#111;">' . $end_date . ' ' . $end_time . '</td>
                    </tr>
                    <tr>
                      <td style="padding:12px 16px; color:#666;">Overtime Duration</td>
                      <td align="right" style="padding:12px 16px; color:#dc2626; font-weight:bold;">' . $overtime_hours . ' hours</td>
                    </tr>
                    <tr>
                      <td style="padding:12px 16px; color:#666;">Additional Fee (50 THB/hour)</td>
                      <td align="right" style="padding:12px 16px; color:#dc2626; font-weight:bold;">' . number_format($overtime_fee) . ' THB</td>
                    </tr>
                <tr>
                 <td colspan="2" style="padding:16px; text-align:center;">
                    <div style="text-align:center;">
                        <div style="font-weight:bold; color:#dc2626; margin-bottom:10px;font-size:14px;"><strong>Important Note:</strong></div>
                        <div style="font-size:12px; color:#666; margin-top:8px;">You are required to settle the additional fee/penalty at the parking lot before Check-out. The system will only unlock and allow your vehicle to exit once the payment has been made. Please make the payment at the parking service counter as soon as possible to avoid any inconvenience.</div>
                    </div>
                 </td>
                </tr>
                  </tbody>
                  </table>
                </td>
              </tr>';
            
            echo generate_parking_booking_email_template_v2($body_content);
            $body = ob_get_contents();
            ob_end_clean();
            
            // wp_mail( $to, $subject, $body, $headers );
            
            // // Send to admin as well
            // $admin_email = get_option('admin_email');
            // wp_mail( $admin_email, 'ADMIN: ' . $subject, $body, $headers );
            
            // Set transient to prevent sending again, expire in 24 hours
            // set_transient($transient_key, true, 24 * 3600);
        }
    }
}



// Check-in overdue notification function (1 hour after booking start time)
function parking_checkin_overdue_notification_cron() {
    $current_time = time();

    $args = array(
        'post_type' => 'parking_booking',
        'meta_query' => array(
            array(
                'key' => 'tracking_check_status',
                'value' => 'checked-in',
                'compare' => '!='
            ),
            array(
                'key' => 'tracking_check_status',
                'value' => 'checked-out',
                'compare' => '!='
            )
        ),
        'posts_per_page' => -1
    );

    $bookings = get_posts($args);

    foreach ($bookings as $booking) {
        $booking_id = $booking->ID;
        $transient_key = 'parking_checkin_overdue_sent_' . $booking_id;

        if (get_transient($transient_key)) {
            continue; // Already sent
        }

        $start_date = get_field('start_date', $booking_id);
        $start_time = get_field('start_time', $booking_id);
        $start_datetime = strtotime($start_date . ' ' . $start_time);

        // Check if booking has started and 1 hour has passed without check-in
        $overdue_threshold = $start_datetime + (1 * 3600); // 1 hour after start time

        if ($current_time > $overdue_threshold) {
            $order_id = get_field('order_code', $booking_id);
            $admin_email = get_option('admin_email');
            $subject = 'ADMIN ALERT: Check-in Overdue - Booking No. [' . $order_id . ']';
            $headers = array('Content-Type: text/html; charset=UTF-8');

            $full_name = get_field('fullname_park', $booking_id);
            $location_park = get_field('location_park', $booking_id);
            $vehicle_info = get_field('vehicle_info', $booking_id);
            update_field('tracking_check_status', 'overtime_checkin', $booking_id);

            $license_plate = '';
            foreach($vehicle_info as $vehicle){
                if ($license_plate != '') $license_plate .= ', ';
                $license_plate .= $vehicle['license_plate'];
            }

            // Calculate overdue hours
            $overdue_hours = ceil(($current_time - $start_datetime) / 3600);

            ob_start();
            $body_content = '
              <!-- Title -->
               <tr>
                <td align="left" class="px-24 py-32" style="padding:28px 24px;">
                  <img src="' . get_stylesheet_directory_uri() . '/customize/img/brand-logo.svg" width="60" height="60" alt="Success" style="display:block; margin:0 auto 12px; border-radius:32px;">
                  <div style="font-size:14px;line-height:20px; font-weight:bold; color:#333;">Admin Alert</div>
                  <div style="font-size:13px;line-height:20px; color:#666;">
                  A customer has not checked in within 1 hour of their booking start time. This requires immediate attention.
                  </div>
                </td>
              </tr>

              <!-- Summary Details -->
              <tr>
                <td class="px-24" style="padding:0 24px 8px;">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 15px; border:1px solid #e5e7eb; border-radius:6px;">
                  <tbody>
                  <tr>
                      <td colspan="2" style="padding:16px; font-weight:bold; color:#111827;">Check-in Overdue Details</td>
                    </tr>
                        <tr>
                      <td style="padding:12px 16px; color:#666;">Parking Location</td>
                      <td align="right" style="padding:12px 16px; color:#111;">' . $location_park . '</td>
                    </tr>
                    <tr>
                      <td style="padding:12px 16px; color:#666;">Customer Name</td>
                      <td align="right" style="padding:12px 16px; color:#111;">' . $full_name . '</td>
                    </tr>
                    <tr>
                      <td style="padding:12px 16px; color:#666;">Start Date & Time:</td>
                      <td align="right" style="padding:12px 16px; color:#111;">' . $start_date . ' ' . $start_time . '</td>
                    </tr>
                    <tr>
                      <td style="padding:12px 16px; color:#666;">Vehicle Plate No.</td>
                      <td align="right" style="padding:12px 16px; color:#111;">' . $license_plate . '</td>
                    </tr>
                    <tr>
                      <td style="padding:12px 16px; color:#666;">Overdue Duration</td>
                      <td align="right" style="padding:12px 16px; color:#dc2626; font-weight:bold;">' . $overdue_hours . ' hours</td>
                    </tr>
                    <tr>
                      <td style="padding:12px 16px; color:#666;">Current Status</td>
                      <td align="right" style="padding:12px 16px; color:#dc2626; font-weight:bold;">Not Checked In</td>
                    </tr>

                <tr>
                 <td colspan="2" style="padding:16px; text-align:center;">
                    <div style="text-align:center;">
                        <div style="font-weight:bold; color:#dc2626; margin-bottom:10px;font-size:14px;">This booking requires immediate attention from staff.</div>
                        <div style="font-size:12px; color:#666; margin-top:8px;">Please contact the customer or check the parking area.</div>
                    </div>
                 </td>
                </tr>
                  </tbody>
                  </table>
                </td>
              </tr>';

            echo generate_parking_booking_email_template_v2($body_content);
            $body = ob_get_contents();
            ob_end_clean();

            // wp_mail( $admin_email, $subject, $body, $headers );

            // Set transient to prevent sending again, expire in 24 hours
            set_transient($transient_key, true, 24 * 3600);
        }
    }
}


// testing schedule event
// add_action('init', 'parking_reminder_cron');
// add_action('init', 'parking_checkout_reminder_cron');


// Hook the cron functions to the event
add_action('parking_reminder_event', 'parking_reminder_cron');
add_action('parking_reminder_event', 'parking_checkout_reminder_cron');
add_action('parking_reminder_event', 'parking_overtime_notification_cron');
add_action('parking_reminder_event', 'parking_checkin_overdue_notification_cron');
add_action('parking_reminder_event', 'carrent_12hour_reminder_cron');
add_action('parking_reminder_event', 'carrent_12hour_return_reminder_cron');

// add_action('init', 'carrent_12hour_reminder_cron');

// Car rental 12-hour reminder function
function carrent_12hour_reminder_cron() {
      $current_time = time();

    $args = array(
        'post_type' => 'car_rentals',
        'meta_query' => array(
            array(
                'key' => 'rental_status',
                'value' => 'renting',
                'compare' => '='
            )
        ),
        'posts_per_page' => -1
    );
    
    $bookings = get_posts($args);
    // print_r($bookings);
    
    foreach ($bookings as $booking) {
        $booking_id = $booking->ID;
        $transient_key = 'carrent_12hour_reminder_sent_v1-1_' . $booking_id;
        if (get_transient($transient_key)) {
            continue; // Already sent
        }
        
        // Get travel information from ACF group field
        $travel_info = get_field('travel_information_outbound_trip', $booking_id);
        
        if ($travel_info) {
            $depart_date = $travel_info['depart_date'];
            $depart_time = $travel_info['depart_time'];


            
            if ($depart_date && $depart_time) {
                $depart_datetime = strtotime($depart_date . ' ' . $depart_time);




                $reminder_time = $depart_datetime - 12 * 3600;
                
                // Send if current time is between reminder_time and depart_datetime
                if ($current_time <= $reminder_time && $current_time < $depart_datetime) {
                    $personal_information = get_field('personal_information', $booking_id);
                    $customer_email = $personal_information['email'];
                    $admin_email = get_option('admin_email');

                    $pickup_location = $travel_info['depart_start_location'].' ('.$travel_info['depart_start_location_note'].')';
                    $dropoff_location = $travel_info['depart_destination'].' ('.$travel_info['depart_destination_note'].')';
                    $booking_details = get_field('booking_details', $booking_id);
                    $vehicle_type = $booking_details['car_type'];

                    if ($customer_email) {
                    // echo 'Send reminder for booking ID: ' . $booking_id . '<br>';
                        $order_code = get_the_title($booking_id);
                        // Extract order ID from parentheses in title
                        if (preg_match('/\((.*?)\)/', $order_code, $matches)) {
                            $order_id = $matches[1];
                        } else {
                            $order_id = $order_code; // fallback if no parentheses found
                        }
                        $subject = 'Parking System - [Private Car Service] 12-Hour Appointment Reminder (Booking No. [' . $order_id . '])';  

                        $headers = array('Content-Type: text/html; charset=UTF-8');
                        
                        $full_name = get_field('fullname', $booking_id);
                        $phone = get_field('phone', $booking_id);
                        $vehicle_info = get_field('vehicle_info', $booking_id);
                        $license_plate = '';
                        if ($vehicle_info) {
                            foreach($vehicle_info as $vehicle){
                                if ($license_plate != '') $license_plate .= ', ';
                                $license_plate .= $vehicle['license_plate'];
                            }
                        }
                        
                        ob_start();
                        $body_content = '
                    
                      <!-- Title -->
                          <tr>
                            <td align="left" class="px-24 py-32" style="padding:28px 24px;">
                              <img src="' . get_stylesheet_directory_uri() . '/customize/img/brand-logo.svg" width="60" height="60" alt="Success" style="display:block; margin:0 auto 12px; border-radius:32px;">
                              <div style="font-size:14px;line-height:20px; font-weight:bold; color:#333;">Dear '.$full_name.',</div>
                              <div style="font-size:13px;line-height:20px; color:#666;">
                                This is a reminder for your upcoming Private Car Service with Parking System scheduled in the next 12 hours. Please see the details below:
                              </div>
                            </td>
                          </tr>

                          <!-- Summary Details -->
                          <tr>
                            <td class="px-24" style="padding:0 24px 8px;">
                              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 15px; border:1px solid #e5e7eb; border-radius:6px;">
                              <tbody>
                              <tr>
                                  <td colspan="2" style="padding:16px; font-weight:bold; color:#111827;">Travel Details</td>
                                </tr>
                                      <tr>
                                  <td style="padding:12px 16px; color:#666;">Travel Date:</td>
                                  <td align="right" style="padding:12px 16px; color:#111;">' . $depart_date . '</td>
                                </tr>
                                      <tr>
                                  <td style="padding:12px 16px; color:#666;">Pickup Time:</td>
                                  <td align="right" style="padding:12px 16px; color:#111;">' . $depart_time . '</td>
                                </tr>
                                    <tr>
                                  <td style="padding:12px 16px; color:#666;">Pickup Location:</td>
                                  <td align="right" style="padding:12px 16px; color:#111;">' . $pickup_location . '</td>
                                </tr>
                                <tr>
                                  <td style="padding:12px 16px; color:#666;">Drop-off Location:</td>
                                  <td align="right" style="padding:12px 16px; color:#111;">' . $dropoff_location . '</td>
                                </tr>
                                <tr>
                                  <td style="padding:12px 16px; color:#666;">Vehicle Type:</td>
                                  <td align="right" style="padding:12px 16px; color:#111;">' . $vehicle_type . '</td>
                                </tr>
                              
                                
                            <tr>
                             <td colspan="2" style="padding:16px; text-align:center;">
                                <div style="text-align:center;">
                                    <div style="font-weight:bold; color:#059669; margin-bottom:10px;font-size:14px;"><strong>Note:</strong></div>
                                    <div style="font-size:12px; color:#666; margin-top:8px;">At the scheduled time, your driver will call you directly. Please make sure to answer the call for a smooth pickup and drop-off.</div>
                                </div>
                             </td>
                            </tr>
                              </tbody>
                              </table>
                            </td>
                          </tr>';
                        
                        echo generate_carrent_booking_email_template_v2($body_content);
                        $body = ob_get_contents();
                        ob_end_clean();
                        
                        wp_mail( $customer_email, $subject, $body, $headers );
                        
                        // Send to admin as well
                        wp_mail( $admin_email, 'ADMIN: ' . $subject, $body, $headers );
                        
                        // Set transient to prevent sending again, expire in 24 hours
                        set_transient($transient_key, true, 24 * 3600);
                    }
                }
            }
        }
    }
}

// Car rental 12-hour return reminder function
function carrent_12hour_return_reminder_cron() {
      $current_time = time();

    $args = array(
        'post_type' => 'car_rentals',
        'meta_query' => array(
            array(
                'key' => 'rental_status',
                'value' => 'renting',
                'compare' => '='
            )
        ),
        'posts_per_page' => -1
    );

    $bookings = get_posts($args);

    foreach ($bookings as $booking) {
        $booking_id = $booking->ID;
        $transient_key = 'carrent_12hour_return_reminder_sent_v1_' . $booking_id;
        if (get_transient($transient_key)) {
            continue; // Already sent
        }

        // Get travel information from ACF group field
        $travel_info = get_field('travel_information_return_trip', $booking_id);

        if ($travel_info) {
            $return_date = $travel_info['return_date'];
            $return_time = $travel_info['return_time'];

            if ($return_date && $return_time) {
                $return_datetime = strtotime($return_date . ' ' . $return_time);
                $reminder_time = $return_datetime - 12 * 3600;

                // Send if current time is between reminder_time and return_datetime
                if ($current_time <= $reminder_time && $current_time < $return_datetime) {
                    $personal_information = get_field('personal_information', $booking_id);
                    $customer_email = $personal_information['email'];
                    $admin_email = get_option('admin_email');

                    $return_location = $travel_info['return_start_location'].' ('.$travel_info['return_start_location_note'].')';
                    $return_destination = $travel_info['return_destination'].' ('.$travel_info['return_destination_note'].')';
                    $booking_details = get_field('booking_details', $booking_id);
                    $vehicle_type = $booking_details['car_type'];

                    if ($customer_email) {
                        $order_code = get_the_title($booking_id);
                        // Extract order ID from parentheses in title
                        if (preg_match('/\((.*?)\)/', $order_code, $matches)) {
                            $order_id = $matches[1];
                        } else {
                            $order_id = $order_code; // fallback if no parentheses found
                        }
                        $subject = '  Parking System - [Private Car Service] 12-Hour Return Trip Reminders - Booking No. [' . $order_id . ']';
                        $headers = array('Content-Type: text/html; charset=UTF-8');

                        $full_name = get_field('fullname', $booking_id);
                        $phone = get_field('phone', $booking_id);
                        $vehicle_info = get_field('vehicle_info', $booking_id);
                        $license_plate = '';
                        if ($vehicle_info) {
                            foreach($vehicle_info as $vehicle){
                                if ($license_plate != '') $license_plate .= ', ';
                                $license_plate .= $vehicle['license_plate'];
                            }
                        }

                        ob_start();
                        $body_content = '
                          <!-- Title -->
                           <tr>
                            <td align="left" class="px-24 py-32" style="padding:28px 24px;">
                              <img src="' . get_stylesheet_directory_uri() . '/customize/img/brand-logo.svg" width="60" height="60" alt="Success" style="display:block; margin:0 auto 12px; border-radius:32px;">
                              <div style="font-size:14px;line-height:20px; font-weight:bold; color:#333;">Car Rental Return Reminder</div>
                              <div style="font-size:13px;line-height:20px; color:#666;">
                              Your car rental return is scheduled in 12 hours. Please ensure you return the vehicle on time.
                              </div>
                            </td>
                          </tr>

                          <!-- Summary Details -->
                          <tr>
                            <td class="px-24" style="padding:0 24px 8px;">
                              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-bottom: 15px; border:1px solid #e5e7eb; border-radius:6px;">
                              <tbody>
                              <tr>
                                  <td colspan="2" style="padding:16px; font-weight:bold; color:#111827;">Travel Details</td>
                                </tr>
                                      <tr>
                                  <td style="padding:12px 16px; color:#666;">Return Date:</td>
                                  <td align="right" style="padding:12px 16px; color:#111;">' . $return_date . '</td>
                                </tr>
                                      <tr>
                                  <td style="padding:12px 16px; color:#666;">Pickup Time:</td>
                                  <td align="right" style="padding:12px 16px; color:#111;">' . $return_time . '</td>
                                </tr>
                                    <tr>
                                  <td style="padding:12px 16px; color:#666;">Pickup Location:</td>
                                  <td align="right" style="padding:12px 16px; color:#111;">' . $return_location . '</td>
                                </tr>
                                <tr>
                                  <td style="padding:12px 16px; color:#666;">Drop-off Location:</td>
                                  <td align="right" style="padding:12px 16px; color:#111;">' . $return_destination . '</td>
                                </tr>
                          
                                <tr>
                                  <td style="padding:12px 16px; color:#666;">Vehicle Type:</td>
                                  <td align="right" style="padding:12px 16px; color:#111;">' . $vehicle_type . '</td>
                                </tr>
                              

                            <tr>
                             <td colspan="2" style="padding:16px; text-align:center;">
                                <div style="text-align:center;">
                                    <div style="font-weight:bold; color:#059669; margin-bottom:10px;font-size:14px;"><strong>Note:</strong></div>
                                    <div style="font-size:12px; color:#666; margin-top:8px;">At the scheduled time, your driver will call you directly. Please make sure to answer the phone for a smooth pickup and drop-off.</div>
                                </div>
                             </td>
                            </tr>
                              </tbody>
                              </table>
                            </td>
                          </tr>';

                        echo generate_carrent_booking_email_template_v2($body_content);
                        $body = ob_get_contents();
                        ob_end_clean();

                        wp_mail( $customer_email, $subject, $body, $headers );

                        // Send to admin as well
                        wp_mail( $admin_email, 'ADMIN: ' . $subject, $body, $headers );

                        // Set transient to prevent sending again, expire in 24 hours
                        set_transient($transient_key, true, 24 * 3600);
                    }
                }
            }
        }
    }
}


// Add admin columns for parking_booking post type
function add_parking_booking_admin_columns($columns) {
    // Add pickup_time and dropoff_time columns
    $columns['pickup_timexx'] = __('Pickup Time', 'fluffy');
    $columns['dropoff_timexx'] = __('Dropoff Time', 'fluffy');
    return $columns;
}
add_filter('manage_parking_booking_posts_columns', 'add_parking_booking_admin_columns');


// Display pickup_time and dropoff_time column content
function display_parking_booking_admin_columns($column, $post_id) {
    if ($column === 'pickup_timexx') {
        // Get the addon_information group field
        $addon_info = get_field('addon_information', $post_id);

        if (!empty($addon_info['sending_flight']['pickup_time'])) {
            echo esc_html($addon_info['sending_flight']['pickup_time']);
        } else {
            echo '—'; // Display dash if field is empty
        }
    }
    
    if ($column === 'dropoff_timexx') {
        // Get the addon_information group field
        $addon_info = get_field('addon_information', $post_id);

        if (!empty($addon_info['sending_flight']['dropoff_time'])) {
            echo esc_html($addon_info['sending_flight']['dropoff_time']);
        } else {
            echo '—'; // Display dash if field is empty
        }
    }
}
add_action('manage_parking_booking_posts_custom_column', 'display_parking_booking_admin_columns', 10, 2);

// Add meta box for shop_coupon post type
function add_coupon_meta_box() {
    add_meta_box(
        'product_coupon_meta_box',
        'Product Coupon',
        'display_product_coupon_meta_box',
        'shop_coupon',
        'side',
        'default'
    );
}
add_action('add_meta_boxes', 'add_coupon_meta_box');

// Display the meta box content
function display_product_coupon_meta_box($post) {
    // Add nonce for security
    wp_nonce_field('save_product_coupon_meta_box', 'product_coupon_meta_box_nonce');

    // Get current value
    $product_coupon = get_post_meta($post->ID, '_product_coupon', true);

    // Display select field
    echo '<label for="product_coupon">Product Coupon:</label>';
    echo '<select name="product_coupon" id="product_coupon" style="width: 100%;">';
    echo '<option value="">Select Product</option>';
    echo '<option value="parking"' . selected($product_coupon, 'parking', false) . '>Parking</option>';
    echo '<option value="carent"' . selected($product_coupon, 'carent', false) . '>Car Rent</option>';
    echo '</select>';
}

// Save the meta box data
function save_product_coupon_meta_box($post_id) {
    // Check if nonce is set
    if (!isset($_POST['product_coupon_meta_box_nonce'])) {
        return;
    }

    // Verify nonce
    if (!wp_verify_nonce($_POST['product_coupon_meta_box_nonce'], 'save_product_coupon_meta_box')) {
        return;
    }

    // Check if user has permission to edit
    if (!current_user_can('edit_post', $post_id)) {
        return;
    }

    // Check if not autosave
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }

    // Check if post type is shop_coupon
    if ('shop_coupon' !== $_POST['post_type']) {
        return;
    }

    // Sanitize and save
    if (isset($_POST['product_coupon'])) {
        $product_coupon = sanitize_text_field($_POST['product_coupon']);
        update_post_meta($post_id, '_product_coupon', $product_coupon);
    }
}
add_action('save_post', 'save_product_coupon_meta_box');
