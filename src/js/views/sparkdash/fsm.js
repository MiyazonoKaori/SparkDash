define(['jquery','underscore','handlebars','hbs!tpl/tabs/fsm.html'],function($,_,Handlebars,tmpl_DT) {
	
	// Check if controller should be processed
	if ($('body').attr('mm-controller') != 'dash') {
		return false;
	}
	
	console.log('initializing app::fsm');
	
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
		
		render: function() {
			console.log('Rendering map..');
			
			render('#main-container', {});
			
			
			//35.05642206622684, -80.66948943389895
			//37.331689, -122.030731
			var map1 = new L.Map("map-container-1", {
			    center: new L.LatLng(35.05642206622684, -80.66948943389895),
			    zoom: 17,
			    layers: [
			        new L.TileLayer("http://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png", {
			            maxZoom: 18,
			            subdomains: ["otile1", "otile2", "otile3", "otile4"],
			            attribution: 'SparkDash v1.0 - Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a>. Map data (c) <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> contributors, CC-BY-SA.'
			        })
			    ]
			});
			
			

			cartodb_sewer_line = new lvector.CartoDB({
          user: "geojason",
          table: "sewer_line",
          scaleRange: [15, 20],
          symbology: {
              type: "range",
              property: "pipe_dia",
              ranges: [
                  {
                      range: [0, 8],
                      vectorOptions: {
                          weight: 4,
                          color: "#46461f",
                          opacity: 0.8
                      }
                  },{
                      range: [8.00001, 100],
                      vectorOptions: {
                          weight: 8,
                          color: "#ff7800",
                          opacity: 0.8
                      }
                  }
              ]
          },
          popupTemplate: '<div class="iw-content"><h3>Sewer Line</h3><table class="condensed-table"><tr><th>Diameter</th><td>{pipe_dia} in.</td></tr><tr><th>Material</th><td>{pipe_mat}</td></tr><tr><th>Flows To</th><td>{wwtp} WWTP</td></tr></table></div>',
          singlePopup: true
      });
      
      
      setTimeout(function(){
				cartodb_sewer_line.setMap(map1);
				console.log('done lvector');
			},500);
		}
		
	}
	
});