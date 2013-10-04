define([
	'jquery',
	'sammy',
	'faye',
	'views/devices', 
	'views/fsm', 
	'views/tasks', 
	'hbs!tpl/main.menu.right.html', 
	'hbs!tpl/modals/alerts.html', 
	'hbs!tpl/tabs.html', 
	'jquery.easyModal',
	'jquery.ui.widget'], 
	function($, sammy, Faye, DEVICES, FSM, TASKS, tpl_User, tpl_0, tpl_Tabs) {
		
	console.log("Loaded dash");
	
	var $ = $||$(function($) {$=$;});
	
	

	window.addEventListener('online', function(e) {
	  console.log("And we're back :)");
	  // Get updates from server.
	}, false);

	window.addEventListener('offline', function(e) {
	  console.log("Connection is flaky.");
	  // Use offine mode.
	}, false);
	
	function updateNavLinks(appid) {
		$("#menu nav a").each(function(){
			if ($(this).attr('data')) {
				this.href = "/#/"+appid+"/"+$(this).attr('data');
			}
		});
	}

  return {
    start: function() {
      console.log("starting dash on channel: "+App.WS.channel);
			
			if (navigator.onLine) {
		    console.log('Online');
		  } else {
		    console.log('Offline');
		  }
		
			// Create modal templates for this view
			$("#modals:first").append(tpl_0({},{partials:{}}));
			$("#menu-right:first").append(tpl_User({},{partials:{}}));
			$("#menu #app_tabs:first").append(tpl_Tabs({},{partials:{}}));

			// Init modal logic
			$('.modal.c0').easyModal({top:200,overlay:0.2});
			$('.modal.c2').easyModal({top:200,overlay:0.2});

			// SammyJS
			var app = sammy(function(){ 
				
				// Hide element on doc click
				$(document).click(function(e) {
					console.log($(e.target));
					console.log('Action : '+$(e.target).attr('action'));
					
					var el_action = $(e.target).attr('action');
					if (!$(e.target).is('#main-menu-login ul li')) {
						$('div.account_dropdown').hide();
					}
					if (!$(e.target).is('#main-menu-header ul li')) {
						$('div.app_dropdown').hide();
					}
					switch(el_action) {
						case 'showNewApp':
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
					$('.modal.c0 div.appPackage').text(App.WS.channel);
					$('.modal.c0').trigger('openModal');
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
		    this.get('#/devices', function(){
			 		
					$('header').each(function(){ $(this).removeClass('active'); });
					$('header.devices').toggleClass("active");
					$('div.app_dropdown').hide();
					
					if (!App.Tab.Devices.MAP) {
						DEVICES.render();
					}
		    }); 
		
		    this.get('#/fsm', function(){ 
					console.log('Sammy says: fsm');
					$('header').each(function(){ $(this).removeClass('active'); });
					$('header.fsm').toggleClass("active");
					$('div.app_dropdown').hide();
					FSM.render();
		    });

				this.get('#/tasks', function(){ 
					console.log('Sammy says: tasks');
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
