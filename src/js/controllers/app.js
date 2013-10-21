define([
	'jquery',
	'underscore',
	'sammy',
	'form2js',
	'hbs!tpl/modals/app.version.html', 
	'jquery.terminal',
	'jquery.easyModal',
	'jquery.ui.widget'], 
	function($, _, sammy, form2js, tpl_0) {
		
	console.log("Loaded app");
	
	var $ = $||$(function($) {$=$;});
	
  return {
    start: function() {
      console.log("starting app");

			// Create Modals
			$("#modals:first").append(tpl_0({versionNum:'',versionURL:''},{partials:{}}));
			$('.modal.c0').easyModal({top:200,overlay:0.2});
			
			// Create Terminal
			App.Terminal = $('fieldset#logs #terminal').terminal({}, {
	      enabled:false,
				greetings:'Ready.',
	      onFocus: function(){
	        return false;
	      },
	      onBlur: function() {
	        return true;
	      }
	    });
			
			// Create Websocket
			Pusher.log = function(message) {
				App.Terminal.echo(message, {
	          finalize: function(el) {el.css("color", "white");}
	      });
			};
			
			var WSClient = new Pusher(App.WS.key);
			var WSChannel = WSClient.subscribe(App.WS.channel);
			WSClient.connection.bind('state_change', function(states) {
			  // states = {previous: 'oldState', current: 'newState'}
				$("fieldset#logs #terminal-header").text(states.current);
			});
			WSClient.connection.bind('connecting_in', function(delay) {
			  alert("I haven't been able to establish a connection for the console.  " +
			        "I will try again in " + delay + " seconds.")
			});
			WSClient.connection.bind('subscription_error', function(delay) {
			  alert("Error connecting to SparkDash network");
			});
			WSClient.connection.bind( 'error', function( err ) { 
			  if( err.data.code === 4004 ) {
					App.Terminal.echo('>>> detected Pusher limit error. Upgrade your account.', {
		          finalize: function(el) {el.css("color", "red");}
		      });
			  }
			});
			WSChannel.bind('log@main', function(data) {
				App.Terminal.echo(JSON.stringify(data), {
	          finalize: function(el) {el.css("color", "yellow");}
	      });
			});
	
			
			// SammyJS
			var app = sammy(function(){ 
				
				// Hide element on doc click
				$(document).click(function(e) {
					console.log($(e.target));
					console.log('Action: '+$(e.target).attr('action'));
					
					var el_action = $(e.target).attr('action');
					switch(el_action) {
						
						case 'clearform':
							// clear data
							$('.modal input').each(function(el){
								$(this).css({border:'1px solid #CCCCCC'});
								$(this).val('');
							});
							$('.modal fieldset').each(function(el){
								$(this).removeAttr('data-tip');
							});
							break;
						
						case 'addNewAppVersion':
							$('.modal.c0').trigger('openModal');
							break;
						
						case 'setAppVersion':
							console.log('setAppVersion');
							var trid = $(e.target).closest('tr').attr('id');
							
							$('fieldset#version label#current_version i').text(trid);
							$("fieldset#version label#current_version").highlight();
							
							// Remove all disabled states
							$('fieldset#version #versionTable td.activate button').each(function(el){
								$(this).removeClass('pure-button-disabled').addClass('pure-button-primary');
							});
							// Add disabled state
							$(e.target).removeClass('pure-button-primary').addClass('pure-button-disabled');
							$("#forceUpdateButton").removeClass('pure-button-disabled').addClass('pure-button-warning').css({opacity:1});
							break;
							
						case 'runForceUpdate':
							
							$("#forceUpdateButton").removeClass('pure-button-warning').addClass('pure-button-disabled').css({opacity:0.1});
							
							// Set App Settings
							App.Network.http({
								url:window.location.pathname+'/_update',
								type:'POST',
								dataType:'json',
								data:{"type":"current_appBuild"}
							}).done(function(response) {	
								App.Terminal.echo(JSON.stringify(response), {
					          finalize: function(el) {el.css("color", "green");}
					      });
							});
							
							break;
					}
				});
				
				// Events

				$("#versionList").on('change',function(e){
					var val = $(this).val();
					var curVersion = $(this).attr('data');
					console.log(val+" = "+curVersion);
					if (val == 'false' || val == curVersion) {
						$("#versionButton").removeClass('pure-button-primary').addClass('pure-button-disabled');
					} else {
						$("#versionButton").removeClass('pure-button-disabled').addClass('pure-button-primary');
					}
				});
				
				
				/*
				
					Form Events
					
				*/
				$('button').on('click',function(){
					
					// clear data
					$('.modal.c1 input').each(function(el){
						$(this).css({border:'1px solid #CCCCCC'});
					});
					$('.modal.c1 fieldset').each(function(el){
						$(this).removeAttr('data-tip');
					});
					
					
					// Handle Form Submissions
					if ($(this).attr('data') == 'submit-c0') {
												
						// Save version number and update UI
						var formData = form2js('form-c0', '.', true,function(node){console.log(node);});
						$('#versionTable tr:last').after('<tr id="'+formData.versionNum+'"><td>'+formData.versionNum+'</td><td>'+formData.versionURL+'</td><td class="edit"><button class="pure-button pure-button-xsmall" action="">Edit</button></td><td class="activate"><button class="pure-button pure-button-xsmall" action="setAppVersion">Set Active</button></td><td><button class="pure-button pure-button-xsmall pure-button-error" action="deleteAppVersion">X</button></td></tr>');
						$('#versionTable tr.empty').remove();
						
						$(".modal.c0 #versionButton").removeClass('pure-button-primary').addClass('pure-button-disabled');
						$('.modal.c0').trigger('closeModal');
												
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
