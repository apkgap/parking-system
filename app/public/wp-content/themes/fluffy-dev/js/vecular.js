function addClass(e,l){var elements=document.querySelectorAll(e);for(var s=0;s<elements.length;s++)elements[s].classList.add(l)}function removeClass(e,l){var elements=document.querySelectorAll(e);for(var s=0;s<elements.length;s++)elements[s].classList.remove(l)}

document.addEventListener(
  "click",
  function (event) {

    // Mobile Toggle
    if (event.target.closest("#toggle-main-menu")) {
      if (!event.target.classList.contains("is-active")) {
          addClass("#toggle-main-menu,#mobile_menu_wrap,.overlay_menu_m", "is-active");
      }
    }

    if (event.target.closest("#close-mobile-menu,.overlay_menu_m")) {
      removeClass("#toggle-main-menu,#mobile_menu_wrap,.overlay_menu_m", "is-active");
    }




    // Sub menu Toggle
    // if (event.target.closest(".wrap-toggle-mobile")) {
    //
    //   if (event.target.parentNode.parentNode.classList.contains(".menu-item-has-children")) {
    //     event.target.parent().add("is-active-mobile");
    //
    //   }
    //   else {
    //     event.target.parent().classList.remove("is-active-mobile");
    //
    //   }
    // }

    // if (event.target.closest("#close-mobile-menu")) {
    //   removeClass("#toggle-main-menu,#mobile_menu_wrap,.overlay_menu_m", "is-active");
    // }
 //
 // if (event.target.closest(".wrap-toggle-mobile")) {
 //    event.target(this).parent().classList.toggle("is-active-mobile");
 //  }


  },
  false
);

jQuery(document).ready(function($) {
  $('.vc_search-toggle').click(function(event) {
    $('.wrap-popup_search,.vc-search-overlay').toggleClass('active');
  });

  $('.cancel-btn_search,.vc-search-overlay').click(function(event) {
    $('.wrap-popup_search,.vc-search-overlay').removeClass('active');
  });

  $(window).on('scroll',function(){
        stop = Math.round($(window).scrollTop());
        if (stop > 300) {
        $('.site-header').addClass('fixed');
        } else {
        $('.site-header').removeClass('fixed');
        }
  });


  $('.wrap-toggle-mobile').click(function() {
  var parent_li = $(this).parent();
  parent_li.toggleClass('is-active-mobile');
  });

  $('.site-footer .widget-title').append('<svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" class="css-i6dzq1"><polyline points="6 9 12 15 18 9"></polyline></svg>');

  $('.site-footer .widget-title').click(function(event) {
    var id = $(this).parent().attr('id');
    $('#'+id+'.widget_nav_menu ul').slideToggle('400');
  });

});
