define([
	'jquery',
	'sammy',
	'faye',
	'jspdf',
	'views/devices', 
	'views/fsm', 
	'views/tasks', 
	'hbs!tpl/main.menu.right.html', 
	'hbs!tpl/modals/alerts.html', 
	'hbs!tpl/tabs.html', 
	'jquery.easyModal',
	'jquery.terminal',
	'jquery.ui.widget',
	'jsmodel'], 
	function($, sammy, jspdf, Faye, DEVICES, FSM, TASKS, tpl_User, tpl_0, tpl_Tabs) {
		
	console.log("Loaded dash");
	
	var $ = $||$(function($) {$=$;});
	
	function updateNavLinks(appid) {
		$("#menu nav a").each(function(){
			if ($(this).attr('data')) {
				this.href = "/#/"+appid+"/"+$(this).attr('data');
			}
		});
	}
	
	showOfflineBanner = function(){
		$("#main-container").append('<p style="text-align:center;margin-top:100px;"><h1 style="text-align:center;">You are offline.</h1><h3 style="text-align:center;">Refresh to try again</h3></p>');
	};

  return {
    start: function() {
      console.log("starting dash on channel: "+SP.WS.channel);
			
			// Check internet connection
			if (!navigator.onLine) {
		    showOfflineBanner();
				return;
		  }
		
			// Create Terminal
			SP.Terminal = $('#terminal').terminal({}, {
	      enabled:false,
				greetings:'Ready.',
	      onFocus: function(){
	        return false;
	      },
	      onBlur: function() {
	        return true;
	      }
	    });
	
			$('#terminal .terminal-header').html('<div style="float:right;"><a href="#" style="color:#fff;" action="log2PDF">Download</a></div>');
		
			
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
				$(document).on("click",function(e) {
					console.log($(e.target));
					console.log('Action : '+$(e.target).attr('action'));
					
					var el_action = $(e.target).attr('action');
					if (!$(e.target).is('#main-menu-login ul li')) {
						$('div.account_dropdown').hide();
					}
					if (!$(e.target).is('#main-menu-header ul li')) {
						$('div.app_dropdown').hide();
					}
					if (!$(e.target).is('#menu-right li.beacon')) {
						$('#menu-right div.beacon.dropdown').hide();
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
						
						case 'openDashboard':
							window.location.href='/apps';
							break;

						case 'openConsole':
							$('#terminal').toggle();
							break;
						
						case 'log2PDF':
							
							var doc = new jsPDF();
					    var specialElementHandlers = {
					        '#editor': function (element, renderer) {
					            return true;
					        }
					    };
							doc.fromHTML($('#terminal .terminal-output').html(), 15, 15, {
			            'width': 800,
			                'elementHandlers': specialElementHandlers
			        });
			        doc.save('log.pdf');
							break;

						case 'showBeaconTabbadgeMenu':
							SP.incrementTabIcon();
							$('#menu-right div.beacon.dropdown').css({'display':'inline-block'});
							break;
						
					}
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
		    this.get('/:appid/sparkdash/#/devices', function(){
					$('header').each(function(){ $(this).removeClass('active'); });
					$('header.devices').toggleClass("active");
					$('div.app_dropdown').hide();

					if (!SP.Tab.Devices.MAP) {
						DEVICES.render();
					}
		    }); 
		
		    this.get('/:appid/sparkdash/#/fsm', function(){ 
					console.log('Sammy says: fsm');
					$('header').each(function(){ $(this).removeClass('active'); });
					$('header.fsm').toggleClass("active");
					$('div.app_dropdown').hide();
					FSM.render();
		    });

				this.get('/:appid/sparkdash/#/tasks', function(){ 
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
				
				this.get('/:appid/sparkdash',function(){
					console.log('initalizing app '+this.params['appid']);
					
					// renders Tabs, dropdowns, etc
					// Load Devices view
					updateNavLinks(this.params['appid']);
					app.setLocation('/'+this.params['appid']+'/sparkdash/#/devices');
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
