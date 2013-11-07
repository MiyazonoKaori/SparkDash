define([
	'jquery',
	'sammy',
	'hbs!tpl/modals/alerts.html', 
	'jquery.easyModal',
	'jquery.ui.widget'], 
	function($, sammy, tpl_0) {
		
	console.log("Loaded dash");
	
	var $ = $||$(function($) {$=$;});
	
	
	function updateNavLinks(appid) {
		$("#menu nav a").each(function(){
			if ($(this).attr('data')) {
				this.href = "/#/"+appid+"/"+$(this).attr('data');
			}
		});
	}

  return {
    start: function() {
      console.log("starting dash");
			
			// Create modal templates for this view
			$("#modals:first").append(tpl_0({},{partials:{}}));

			// Init modal logic
			$('.modal.c0').easyModal({top:200,overlay:0.2});

			// SammyJS
			var app = sammy(function(){ 
				
				// Hide element on doc click
				$(document).click(function(e) {
					console.log($(e.target));
					console.log('Action: '+$(e.target).attr('action'));
					
					var el_action = $(e.target).attr('action');
					switch(el_action) {
						
						case 'user.logout':
							SP.logout();
							break;
							
						case 'download':
							$('.modal.c0').trigger('openModal');
							break;
					}
				});
				
				// Click events


				
				
				/*
				
					Form Events
					
				*/
				$('button').on('click',function(){
					// Handle Form Submissions
					if ($(this).attr('data') == 'submit-c1') {
						$('.modal.c1').trigger('closeModal');	
					}
				});
				// Stop forms from submitting
				$("form").submit(function( event ) {
					event.preventDefault();
					return false;
				});
				
				
		  });
			app.run();
			
			/*
			 *
			 * Default Route
			 *
			*/
			//app.setLocation('#/devices');
			
      return true;
    }
  }
});
