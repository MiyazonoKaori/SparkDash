define(['jquery','underscore','handlebars','moment', 'form2js', 'js2form', 'hbs!tpl/tabs/devices.html','hbs!tpl/modals/app.new.html','hbs!tpl/modals/devices.map.settings.html'],function($,_,Handlebars, moment, form2js, js2form, tmpl_DT, tpl_1, tpl_2) {
	console.log('initializing app::devices');
	
	var $ = $||$(function($) {$=$;});
			
	/*
	 *
	 * App Namespace
	 * 
	*/
	App.Tab.Devices = {
		MAP:false,
		Settings: {},
		mapShowOptions: function(){
			// Populate form data
			js2form(document.getElementById('form-c3'), App.Tab.Devices.Settings);
			
			// Open form
			$('.modal.c3').trigger('openModal');
			console.log(App.Tab.Devices.Settings);
		},
		render: function(target, data) {

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

		},
		setMarkerIdleState: function(marker) {
			var curtime = Math.round(new Date().getTime() / 1000);
			
			console.log('elapsed: '+(curtime - marker._timestamp));
			console.log('idleTimeout is set to '+(App.Tab.Devices.Settings.idleTimeout * 60)+' seconds');
			
			if ((curtime - marker._timestamp) >= (App.Tab.Devices.Settings.idleTimeout * 60) ) {
				marker.setPulsing(false);
				$(marker._icon).toggleClass('idle');
			}
		}
	};

	
	/*
	 *
	 * Handlebars
	 * 
	*/
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
	Handlebars.registerHelper('json', function(context) {
	    return JSON.stringify(context);
	});


	/*
	 *
	 * Return Public Methods
	 * 
	*/
	return {
		
		render: function() {
			console.log('Rendering map..');	
			
			var markers = [];
			
			// Create modal templates for this view
			$("#modals:first").append(tpl_1({},{partials:{}}));
			$("#modals:first").append(tpl_2({},{partials:{}}));
			// Init modal logic
			$('.modal.c1').easyModal({top:200,overlay:0.2});
			$('.modal.c3').easyModal({top:200,overlay:0.2});

			// Set App Settings
			App.Network.http({
				url:'/_db?id=map',
				type:'GET',
				dataType:'json'
			}).done(function(response) {	
				App.Tab.Devices.Settings = response;
			});
			
			// Enable pusher logging - don't include this in production
		  // Pusher.log = function(message) {
		  //   if (window.console && window.console.log) {
		  //     window.console.log(message);
		  //   }
		  // };
			var WSClient = new Pusher('212c3181292b80f4e1a9');
		  var WSChannel = WSClient.subscribe('sparkdash-dash');
		
			WSChannel.bind('update_client', function(data) {
				
				// Find the existing marker to update..			
				_.each(markers,function(_el,i){
					if (_el.options.clientID === data.clientID) {				
						
						var pA = new L.LatLng(markers[i]._latlng.lat, markers[i]._latlng.lng);
						var pB = new L.LatLng(data.latitude, data.longitude);
						var pList = [pA, pB];

						var pline = new L.Polyline(pList);

						var pMarker = L.icon({
				      iconUrl: '/img/bluedot.path.png',
				      iconSize: [18, 18],
				      iconAnchor: [9, 9],
				      shadowUrl: null
						});

						var path = 	new L.animatedMarker(pline.getLatLngs(), {
				      icon: pMarker,
				      autoStart: false,
							distance: 600,  // meters
							interval: 800,
							onEnd:function(){
								$(this._icon).fadeOut(1000, function(){
									App.Tab.Devices.MAP.removeLayer(this);
								});
							
							}
					  });
						App.Tab.Devices.MAP.addLayer(path);
						$(path._icon).hide().fadeIn(300, function(){
							path.start();
						});
						
						// Update marker icon
						markers[i].setPulsing(true);
						
						// Update final marker location
						markers[i].setLatLng(new L.LatLng(data.latitude, data.longitude));
						
						// Update timestamp with latest data
						markers[i]._timestamp = data.timestamp;
						
						setTimeout(function() {
							App.Tab.Devices.setMarkerIdleState(markers[i]);
						}, (App.Tab.Devices.Settings.idleTimeout * 60) * 1000);
						
					}
				});
		  });

		  WSChannel.bind('new_client', function(data) {
		    console.log(data);
		
				// Add client to markers
				var marker = new L.userMarker([
					data.latitude, 
					data.longitude
				],{
					bounceOnAdd: true,
					clientID:data.clientID,
					pulsing:true, 
					accuracy:10, 
					smallIcon:true
				});
				
				// Add marker to map
				marker.addTo(App.Tab.Devices.MAP);
				marker.bindPopup('<div style="font-size:22px;">'+data.userID+'</div><div style="font-size:12px;">Device: '+data.device+'</div>');
				markers.push(marker);
				
				// Add device to left panel
				
				
				// Notify the user
				//alert('A new device has been added.');
		  });
				
			
			// get devices 
      App.Network.http({url:'/_devices'}).done(function(response) {				
				
				// Populate device list
				App.Tab.Devices.render('#main-container', {devices:response});
								
				// Create map
				App.Tab.Devices.MAP = new L.Map("map-container-1", {
				    center: new L.LatLng(37.11, -94.48),
				    zoom: 14,
				    layers: [
				        new L.TileLayer("http://{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png", {
				            maxZoom: 18,
				            subdomains: ["otile1", "otile2", "otile3", "otile4"],
				            attribution: 'SparkDash v1.0 - Tiles Courtesy of <a href="http://www.mapquest.com/" target="_blank">MapQuest</a>. Map data (c) <a href="http://www.openstreetmap.org/" target="_blank">OpenStreetMap</a> contributors, CC-BY-SA.'
				        })
				    ],
						contextmenu: true,
				    contextmenuWidth: 140,
				    contextmenuItems: [{
				        text: 'Show coordinates',
				        callback: function(){alert('hi')}
				    }]
				});
				
				
				L.Control.Command = L.Control.extend({
				    options: {
				        position: 'topleft',
				    },
				    onAdd: function (map) {
				        var controlDiv = L.DomUtil.create('div', 'leaflet-control-command');
				        L.DomEvent
				            .addListener(controlDiv, 'click', L.DomEvent.stopPropagation)
				            .addListener(controlDiv, 'click', L.DomEvent.preventDefault)
				        .addListener(controlDiv, 'click', function () { App.Tab.Devices.mapShowOptions(); });

				        var controlUI = L.DomUtil.create('div', 'leaflet-control-command-interior', controlDiv);
				        controlUI.title = 'Map Commands';
				        return controlDiv;
				    }
				});

				L.control.command = function (options) {
				    return new L.Control.Command(options);
				};
				
				var commandControl = new L.Control.Command({});
				App.Tab.Devices.MAP.addControl(commandControl);
				
				
				
				// Store markers
				for(key in response) {
					
					var marker = new L.userMarker([
						response[key].latitude, 
						response[key].longitude
					],{
						clientID:response[key].clientID,
						pulsing:true, 
						accuracy:10, 
						smallIcon:true,
						contextmenu: true,
				    contextmenuWidth: 140,
				    contextmenuItems: [{
				        text: 'Set Idle Filter',
				        callback: function(){alert('hi')}
				    },{
			        separator: true,
			        index: 1
						}]
					});
					
					// Set for marker timestamp
					marker._timestamp = response[key].timestamp;
					
					// Add to map
					marker.addTo(App.Tab.Devices.MAP);
					
					// Check if marker is idle
					App.Tab.Devices.setMarkerIdleState(marker);
					
					var last_active = moment.unix(response[key].timestamp).format('MMM-Do hh:mm');
					console.log(last_active);
					marker.bindPopup('<div style="font-size:22px;">'+response[key].userID+'</div><div style="font-size:12px;">Device: '+response[key].device+'</div><div style="font-size:12px;">Last Active: '+last_active+'</div>');
					markers.push(marker);
					
				}
				
				
				
				// Handle Clicks
				$('div.main-item.device').on('click',function() {
					// update UI
					$("div.main-item.device").each(function(){
						$(this).removeClass('selected');
					});
					$(this).addClass('selected');
					
					// show marker
					var data = JSON.parse($(this).attr('data'));
					markers[$("div.device").index(this)].openPopup();
					App.Tab.Devices.MAP.panTo(new L.LatLng(data.latitude, data.longitude),{animate:true}); 
				});
				
				$('button').on('click',function(){
					
					// Handle Form Submissions
					// https://github.com/maxatwork/form2js
					if ($(this).attr('data') == 'submit-c3') {
						
						var formData = form2js('form-c3', '.', true,function(node) {
							
						});
						
						App.Tab.Devices.Settings = formData;
						
						// Save form data				
						App.Network.http({
							url:'/_db',
							type:'POST',
							dataType:'json',
							data:formData
						}).done(function(response) {	
							$('.modal.c3').trigger('closeModal');
							console.log(App.Tab.Devices.Settings);
						});
						
					}
				});
				
			});
		}
		
	}
	
});