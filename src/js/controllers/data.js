define([
	'jquery',
	'sammy',
	'shortlink',
	'hbs!tpl/modals/alerts.html', 
	'jquery.easyModal',
	'jquery.ui.widget'], 
	function($, sammy, shortlink, tpl_0) {
		
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
      console.log("starting data");
			
			App.Pace.start();
			
	    // Generate random shortlink
	    var randomStr = shortlink.generate(6);
	    console.log('Generate random shortlink: ' + randomStr);

	    // Decode random shortlink to int
	    var randomNum = shortlink.decode(randomStr);
	    console.log('Decode this shortlink to int: ' + randomNum);

	    // Encode this int to shortlink
	    var str = shortlink.encode(randomNum);
	    console.log('Encode this int to shortlink: ' + str);

	    // Decode this shortlink to int
	    var num = shortlink.decode(str);
	    console.log('Decode this shortlink to int: ' + num);

	    console.log('--------------');
			
			// Create modal templates for this view
			$("#modals:first").append(tpl_0({},{partials:{}}));

			// Init modal logic
			$('.modal.c0').easyModal({top:200,overlay:0.2});
			$('.modal.c2').easyModal({top:200,overlay:0.2});

			// SammyJS
			var app = sammy(function(){ 
				
				// Hide element on doc click
				$(document).click(function(e) {
					console.log($(e.target));
					console.log('Action: '+$(e.target).attr('action'));
					
					var el_action = $(e.target).attr('action');
					switch(el_action) {
						
						case 'user.logout':
							app.setLocation('#/logout');
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
				
				
				/*
				 *
				 * Routes
				 *
				*/
				
				this.get('#/logout',function(){
					$("#layout #main").animate({opacity:0},200,'linear',function(){
						
						$('#main-menu-container').css({top:"-75px"});
						$('#menu').css({left:0});
						// Clear session

						window.location.href='/logout';
						
					});
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
