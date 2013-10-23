define([
	'jquery',
	'underscore',
	'sammy',
	'form2js',
	'hbs!tpl/modals/app.createbuild.html', 
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
			$("#modals:first").append(tpl_0({build:'',name:'',url:''},{partials:{}}));
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
			        "I will try again in " + delay + " seconds.");
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
						
						case 'addNewAppBuild':
							$('.modal.c0').trigger('openModal');
							break;
						
						case 'deleteAppBuild':
							break;
						
						case 'editAppBuild':
							break;
							
						case 'setAppBuild':
							console.log('setAppBuild');
							var trid = $(e.target).closest('tr').attr('id');
														
							$(".modal.appkey textarea.accesstoken").val('Loading..');
							App.Network.http({
								url:window.location.pathname+'/_setCurrentBuild',
								type:'POST',
								dataType:'json',
								data:{current_build:trid}
							}).done(function(response) {
								
								$('fieldset#version label#current_build i').text(trid);
								$("fieldset#version label#current_build").highlight();

								// Remove all disabled states
								$('fieldset#version #versionTable td.activate button').each(function(el){
									$(this).removeClass('pure-button-disabled').addClass('pure-button-primary').attr('disabled',false);
								});
								
								// Add disabled state
								$(e.target).removeClass('pure-button-primary').addClass('pure-button-disabled');
								$("#forceUpdateButton").removeClass('pure-button-disabled').addClass('pure-button-warning').attr('disabled',false).css({opacity:1});

							});
							
							break;
							
						case 'runForceUpdate':
							
							$("#forceUpdateButton").removeClass('pure-button-warning').addClass('pure-button-disabled').attr('disabled',true).css({opacity:0.1});
							
							// Set App Settings
							App.Network.http({
								url:window.location.pathname+'/_update',
								type:'POST',
								dataType:'json',
								data:{"type":"current_build"}
							}).done(function(response) {	
								App.Terminal.echo(JSON.stringify(response), {
					          finalize: function(el) {el.css("color", "green");}
					      });
							});
							
							break;
					}
				});
				
				// Form Validation
				$(".modal.c0 input").on('blur',function(e){					
					// check each input for validation
					var done = false;
					$(".modal.c0 input").each(function(){
						done = ($(this).val().length > 0) ? true : false;
					});
					if (done) {
						var formData = form2js('form-c0', '.', true,function(node){console.log(node);});
						$(".modal.c0 #versionButton").removeClass('pure-button-disabled').addClass('pure-button-primary').attr('disabled',false);
					} else {
						$(".modal.c0 #versionButton").removeClass('pure-button-primary').addClass('pure-button-disabled').attr('disabled',true);
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
						
						App.Network.http({
							url:window.location.pathname+'/_createBuild',
							type:'POST',
							dataType:'json',
							data:{data:formData}
						}).done(function(response) {
							
							// Update table
							$('#versionTable tr:last').after('<tr id="'+formData.build+'"><td>'+formData.build+'</td><td>'+formData.name+'</td><td>'+formData.url+'</td><td class="edit"><button class="pure-button pure-button-xsmall" action="editAppBuild">Edit</button></td><td class="activate"><button class="pure-button pure-button-xsmall" action="setAppBuild">Set Active</button></td><td><button class="pure-button pure-button-xsmall pure-button-error" action="deleteAppBuild">X</button></td></tr>');
							$('#versionTable tr.empty').remove();
							
							// Disable button
							$(".modal.c0 #versionButton").removeClass('pure-button-primary').addClass('pure-button-disabled').attr('disabled',true);
							
							// Close modal
							$('.modal.c0').trigger('closeModal');
							
							// Highlight
							$("#versionTable tr:last").highlight();
						});
						
						
												
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
  };
});
