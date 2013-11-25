define([
	'jquery',
	'underscore',
	'dc',
	"Pusher",
	'sammy',
	'form2js',
	'js2form',
	'hbs!tpl/modals/app.createbuild.html', 
	'jquery.terminal',
	'jquery.easyModal',
	'jquery.ui.widget',
	'crossfilter',
	'd3'], 
	function($, _, dc, Pusher, sammy, form2js, js2form, tpl_0) {
		
	console.log("Loaded devices");
	
	var $ = $||$(function($) {$=$;});
	
  return {
    start: function() {
      console.log("starting devices");
				
			
			// Fetch Apps
			// SP.Network.http({
			// 	url:window.location.pathname,
			// 	type:'GET',
			// 	cache: false
			// }).done(function(res) {	
			// 	alert('done');
			// });
			
			
      return true;
    }
  };
});
