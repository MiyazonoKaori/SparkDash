define([
	'jquery',
	'underscore',
	'sammy',
	'form2js',
	'hbs!tpl/modals/alerts.html', 
	'hbs!tpl/modals/app.new.html', 
	'hbs!tpl/modals/app.license.html', 
	'jquery.easyModal',
	'jquery.ui.widget'], 
	function($, _, sammy, form2js, tpl_0, tpl_1, tpl_2) {
		
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
      console.log("starting apps");
						
			// Create modal templates for this view
			$("#modals:first").append(tpl_0({},{partials:{}}));
			$("#modals:first").append(tpl_1({},{partials:{}}));
			$("#modals:first").append(tpl_2({},{partials:{}}));

			// Init modal logic
			$('.modal.c1').easyModal({top:200,overlay:0.2});
			$('.modal.appkey').easyModal({top:200,overlay:0.2});

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
							
						case 'user.logout':
							app.setLocation('#/logout');
							break;

						case 'app.new':
							$('.modal.c1').trigger('openModal');
							break;
							
						case 'showAppKey':
							$('.modal.appkey').trigger('openModal');
							var obj = JSON.parse($(e.target).attr('data'));
							$(".modal.appkey textarea.appkey").val(obj.key);
							$(".modal.appkey div.secret").text(obj.seed);
							$(".modal.appkey div.package").text(obj.pkg);
							break;
						
						case 'launchSparkDash':
							var obj = JSON.parse($(e.target).attr('data'));
							window.location.href='/'+obj._id+'/sparkdash/#/devices';
							break;
						
						case 'launchLog':
							alert('Future home of Application Manager. \n- Set app version to enforce auto-upgrade\n- View device logs\n- Application Settings');
							return;
							break;
							
					}
				});
				
				// Click events


				
				
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
					if ($(this).attr('data') == 'submit-c1') {
						
						var formData = form2js('form-c1', '.', true,function(node){});
						console.log(formData);
												
						// Save form data				
						App.Network.http({
							url:'/_apps',
							type:'POST',
							dataType:'json',
							data:formData
						}).done(function(response) {
							console.log(response);	
							if (response.status==200) {
								$('.modal.c1').trigger('closeModal');
								window.location.href='/apps';
							}
							if (response.status==301) {
								$('.modal.c1 input#package').css({border:'2px solid #ff0000'});
								$('.modal.c1 fieldset.field1').attr('data-tip',response.message);
							}
						});
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
