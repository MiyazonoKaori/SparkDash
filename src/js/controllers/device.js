define([
	'jquery',
	'underscore',
	'dc',
	'sammy',
	'form2js',
	'js2form',
	'hbs!tpl/modals/app.createbuild.html', 
	'jquery.terminal',
	'jquery.easyModal',
	'jquery.ui.widget',
	'crossfilter',
	'd3',
	'inspector_json'], 
	function($, _, dc, sammy, form2js, js2form, tpl_0) {
		
	console.log("Loaded device");
	
	var $ = $||$(function($) {$=$;});
	
  return {
    start: function() {
      console.log("starting device");
			
			
			// Fetch Device
			SP.Network.http({
				url:window.location.pathname,
				type:'GET',
				cache: false
			}).done(function(res) {	
				viewer = new InspectorJSON({
					element: '#json'
				});
				viewer.view(res.message);
			});
			
      return true;
    }
  };
});
