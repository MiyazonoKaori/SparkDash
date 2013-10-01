define([
	'jquery',
	'sammy',
	'faye',
	'views/sparkdash/devices', 
	'views/sparkdash/fsm', 
	'views/sparkdash/tasks', 
	'hbs!tpl/sparkdash/user.menu.html', 
	'hbs!tpl/sparkdash/modals/alerts.html', 
	'hbs!tpl/sparkdash/tabs.html', 
	'jquery.easyModal',
	'jquery.ui.widget'], 
	function($, sammy, Faye, DEVICES, FSM, TASKS, tpl_User, tpl_0, tpl_Tabs) {
		
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
			$("#main-menu-login:first").append(tpl_User({},{partials:{}}));
			$("#menu #app_tabs:first").append(tpl_Tabs({},{partials:{}}));

			// Init modal logic
			$('.modal.c0').easyModal({top:200,overlay:0.2});
			$('.modal.c2').easyModal({top:200,overlay:0.2});

			// SammyJS
			var app = sammy(function(){ 
				
				// Hide element on doc click
				$(document).click(function(e) {
					console.log($(e.target));
					console.log($(e.target).attr('data'));
					
					var el_data = $(e.target).attr('data');
					if (!$(e.target).is('#main-menu-login ul li')) {
						$('div.account_dropdown').hide();
					}
					if (!$(e.target).is('#main-menu-header ul li')) {
						$('div.app_dropdown').hide();
					}
					switch(el_data) {
						case 'new-app':
							$('.modal.c1').trigger('openModal');
							$('div.app_dropdown').hide();
							break;
							
						case 'user.logout':
							$('div.account_dropdown').hide();
							app.setLocation('#/logout');
							break;
							
						case 'user.account':
							alert('account');
							break;
					}
				});
				
				// Click events
				$('#main-menu-header ul:first').on('click',function(){
					$("div.app_dropdown").css("display","inline-block");
				});

				$('#main-menu-login ul:first').on('click',function(){
					$("div.account_dropdown").css("display","inline-block");
				});
				$('li.app').on('click',function(){
					$('div.app_dropdown').hide();
				});
				
				$('#menu-bottom.alert').on('click',function(){
					$('.modal.c0').trigger('openModal');
					
					App.Avgrund.show( "#options" );
			    $('#options #list li:not(#options .active)').each(function(index){
			      $(this).css("-webkit-animation-delay",80 * index +"ms").addClass('animated fadeInLeft');
			    });
					
				});
				
				
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
		    this.get('#/:appid/devices', function(){
			 		updateNavLinks(this.params['appid']);
					$('header').each(function(){ $(this).removeClass('active'); });
					$('header.devices').toggleClass("active");
					$('div.app_dropdown').hide();
					DEVICES.render();
		    }); 
		
		    this.get('#/:appid/fsm', function(){ 
					updateNavLinks(this.params['appid']);
					$('header').each(function(){ $(this).removeClass('active'); });
					$('header.fsm').toggleClass("active");
					$('div.app_dropdown').hide();
					FSM.render();
		    });

				this.get('#/:appid/tasks', function(){ 
					console.log('Sammy says: tasks');
					updateNavLinks(this.params['appid']);
					$('header').each(function(){ $(this).removeClass('active'); });
					$('header.tasks').toggleClass("active");
					$('div.app_dropdown').hide();
					TASKS.render({foo:'bar'});
		    });
			
				
				this.get('#/account',function(){
				});
				
				this.get('#/logout',function(){
					$("#layout #main").animate({opacity:0},200,'linear',function(){
						
						$('#main-menu-container').css({top:"-75px"});
						$('#menu').css({left:0});
						// Clear session

						window.location.href='/logout';
						
					});
				});
				
				this.get('#/login',function(){
					$('#main-menu-container').css({top:0});
					$('#menu').css({left:"75px"});
				});
				
				this.get('#/:appid',function(){
					console.log('initalizing app '+this.params['appid']);
					
					// renders Tabs, dropdowns, etc
					
					if (this.params['appid'] == '182379837498298rh938') {
						// Load Devices view
						
						updateNavLinks(this.params['appid']);
						app.setLocation('#/'+this.params['appid']+'/devices');
					} else {
						alert('Inavalid App ID. Contact the administrator.');
					}
					
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
