define(['jquery','underscore','handlebars','hbs!tpl/tabs/tasks.html'],function($,_,Handlebars,tmpl_DT) {

	// Check if controller should be processed
	if ($('body').attr('mm-controller') != 'dash') {
		return false;
	}
	
	console.log('initializing app::tasks');
	
	var $ = $||$(function($) {$=$;});
	
	function render(target, data) {
		
		var html = tmpl_DT(data, {partials: {}});
		
		// Get the target to append template HTML
    if (target instanceof jQuery) {
      var targetDom = target;
    } else {
      var targetDom = $(target + ":first");      
    }

		// Append or replace
    if( data.append ) {
      targetDom.append( html );
    } else {
      targetDom.html( html );
    }

	};
	
	Handlebars.registerHelper("key_value", function(obj, options) {
	    var buffer = "",
	        key;

	    for (key in obj) {
	        if (obj.hasOwnProperty(key)) {
	            buffer += options.fn({key: key, value: obj[key]});
	        }
	    }

	    return buffer;
	});
	
	/*
	 * Renders table rows
	 * @param: response object from DB
	*/
	return {
		
		render: function(response) {
			
			render('#main-container', {
		    rows: response.rows
		  });
		
		}
		
	}
	
});