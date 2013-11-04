define([
	'jquery',
	'underscore',
	'handlebars',
	'moment',
	'form2js',
	'js2form', 
	'hbs!tpl/tabs/devices.html',
	'hbs!tpl/modals/app.new.html',
	'hbs!tpl/modals/devices.map.settings.html'],function($,_,Handlebars, moment, form2js, js2form, tmpl_DT, tpl_1, tpl_2) {
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
			var state = 1; // default active
			var curtimesecs = Math.round(new Date().getTime() / 1000);
			
			console.log(new Date().getTime());
			console.log('elapsed: '+(curtimesecs - marker._timestamp));
			console.log('idleTimeout is set to '+(App.Tab.Devices.Settings.idleTimeout * 60)+' seconds');
			
			if ((curtimesecs - marker._timestamp) >= (App.Tab.Devices.Settings.idleTimeout * 60) ) {
				state = 2; // idle
			}
			return state;
		},
		
		// state: 1 active, 2 idle
		setDeviceIdleState: function(clientID,state) {
			$(".device-list ul li.device").each(function(i){
				if ($(this).attr('data') == clientID) {
					console.log('Changing idlestate to '+state+' for index: '+i);
					$(".device-list ul li.device").eq(i).find('div.led').first().removeClass( "state state1 state2" ).addClass('state'+state);
				}
			});
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


	
	showOfflineBanner = function(){
		$("#main-container").append('<p style="text-align:center;margin-top:100px;"><h1 style="text-align:center;">You are offline.</h1><h3 style="text-align:center;">Refresh to try again</h3></p>');
	};
	
	/*
	 *
	 * Return Public Methods
	 * 
	*/
	return {
		
		render: function() {
			console.log('Rendering map..');	
			
			var Markers = [];
			
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
				App.Tab.Devices.Settings = {
				  "id": "map",
				  "idleTimeout": "0.1"
				};
			});
			
			// Enable pusher logging - don't include this in production
		  // Pusher.log = function(message) {
		  //   if (window.console && window.console.log) {
		  //     window.console.log(message);
		  //   }
		  // };
			// Create terminal log
			Pusher.log = function(message) {
				App.Terminal.echo(message, {
	          finalize: function(el) {el.css("color", "white");}
	      });
			};
			var WSClient = new Pusher(App.WS.key);
		  var WSChannel = WSClient.subscribe(App.WS.channel);
			
			WSChannel.bind('update_client@beacon', function(_data) {
				
				// Find the existing marker to update..			
				_.each(Markers,function(_marker,i) {

					// Ensure clientID matches event clientID
					if (Markers[i].options.clientID === _data.clientID) {				
						
						var pFrom = new L.LatLng(Markers[i]._latlng.lat, Markers[i]._latlng.lng);
						var pTo = new L.LatLng(_data.latitude, _data.longitude);
						var pList = [pFrom, pTo];
						
						// Create path to animate on
						var pline = new L.Polyline(pList);
						
						// Create temp marker to animate
						var pMarker = L.icon({
				      iconUrl: '/img/sparkdash/bluedot.path.png',
				      iconSize: [18, 18],
				      iconAnchor: [9, 9],
				      shadowUrl: null
						});
						
						// Create marker animation path
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
					
						// Add marker animation path to map
						App.Tab.Devices.MAP.addLayer(path);
						
						// Hide marker then start
						$(path._icon).hide().fadeIn(300, function(){
							path.start();
						});
						
						// Set marker to pulsate
						_marker.setPulsing(true);
						
						// Update Device idlestatus to active (1=active, 2=idle)
						App.Tab.Devices.setDeviceIdleState(_marker.options.clientID,1);
						
						// Set final marker location from request
						_marker.setLatLng(new L.LatLng(_data.latitude, _data.longitude));
						
						// Update timestamp with latest data
						_marker._timestamp = _data.timestamp;
						
						// Set idle expiration date
						_marker.options._idletimestamp = new Date().getTime() + (App.Tab.Devices.Settings.idleTimeout * 60) * 1000;
						
						// Set active/idle state based on settings
						setTimeout(function() {
							
							console.log(Markers[i].options._idletimestamp + ' - ' + new Date().getTime());
							
							if (Markers[i].options._idletimestamp - new Date().getTime() <= 0 ) {
								console.log('SHOULD IDLE');
								Markers[i].setPulsing(false);
								$(Markers[i]._icon).toggleClass('idle');
								App.Tab.Devices.setDeviceIdleState(Markers[i].options.clientID,2);
							}
						}, (App.Tab.Devices.Settings.idleTimeout * 60) * 1000);
						
					}
				});
		  });

		  WSChannel.bind('new_client@beacon', function(data) {
		
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
				Markers.push(marker);
				
				// Add device to left panel
				
				
				// Notify the user
				//alert('A new device has been added.');
		  });
				
			
			// get devices 
      App.Network.http({url:'/'+ID+'/_devices'}).done(function(response) {				
				
				// Populate device list
				App.Tab.Devices.render('#main-container', {
					devices:response,
					height:$(document).height() - $('body').offset().top-65+'px'
				});
				
				
				// Create map
				App.Tab.Devices.MAP = new L.Map("devices-map", {
				    center: new L.LatLng(37.11, -94.48),
				    zoom: 14,
						scrollWheelZoom:false,
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
					var idleState = App.Tab.Devices.setMarkerIdleState(marker);
					App.Tab.Devices.setDeviceIdleState(marker.options.clientID,idleState);

					if (idleState == 2) {
						marker.setPulsing(false);
						$(marker._icon).toggleClass('idle');
					}
					
					var last_active = moment.unix(response[key].timestamp).format('MMM-Do hh:mm');
					marker.bindPopup('<div style="font-size:22px;">'+response[key].userID+'</div><div style="font-size:12px;">Device: '+response[key].device+'</div><div style="font-size:12px;">Last Active: '+last_active+'</div>');
					Markers.push(marker);
				}
				
								
				App.Tab.Devices.MAP.on('popupopen', function(e) {
				  var marker = e.popup._source;
					// loop through device list to find the target
					$(".device-list ul li.device").each(function(){
						$(this).removeClass('selected');
						var clientID = $(this).attr('data')
						if (clientID == marker.options.clientID) {
							$(this).addClass('selected');
							$('html,body').animate({scrollTop: $(this).position().top-10}, 500);
						}
					});
				});
				
				
				
				// Hide element on doc click
				$(document).on("click",function(e) {
					var el_action = $(e.target).attr('action');
					switch(el_action) {
						
						case 'alert':
							alert($(e.target).attr('data'));
							break;
						
						case 'sendMessageToDevice':
							alert('Not implemented. Use the /api/messages endpoint instead');
							break;
					}
				});
				
				// Device click handler
				$('.device-list ul li.device').on('click',function(){
					// update UI
					$(".device-list ul li.device").each(function(){
						$(this).removeClass('selected');
					});
					$(this).addClass('selected');

					// show marker
					var marker = Markers[$(".device-list ul li.device").index(this)];
					marker.openPopup();
					App.Tab.Devices.MAP.panTo(new L.LatLng(marker._latlng.lat, marker._latlng.lng),{animate:true});
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