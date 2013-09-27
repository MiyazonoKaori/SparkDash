define(['jquery','hbs!tpl/modals/app.settings.html'], function($,tpl_Settings) {
		
	console.log("Loaded register");
	
	var $ = $||$(function($) {$=$;});
	
  return {
    start: function(App) {
      console.log("starting register");
			
			// Create modal templates for this view
			$("#settings:first").append(tpl_Settings({},{partials:{}}));
			
			// Create Sammy
			
			$('#options #list li').click(function(){
			  var $el = $(this);

			  // Update List
			  $('#options #list li.active').removeClass('active');
			  $el.addClass('active');

			  // Load New Content
			  $('.settings.show').fadeOut(0).removeClass('show');
			  var idx = $(this).index();
			  $(settings[idx]).fadeIn(100).addClass('show');
			});
			
			/*
			 *
			 * Default Route
			 *
			*/
			//app.setLocation('#/welcome');
			
      return true;
    }
  }
});
