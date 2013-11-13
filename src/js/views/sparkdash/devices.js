define([
	'jquery',
	'underscore',
	'handlebars',
	'moment',
	'form2js',
	'js2form', 
	'codemirror',
	'hbs!tpl/tabs/devices.html',
	'hbs!tpl/modals/app.new.html',
	'hbs!tpl/modals/devices.map.settings.html',
	'hbs!tpl/modals/device.settings.html',
	'hbs!tpl/modals/action.sendmessage.html',
	'hbs!tpl/rows/device.html',
	'jquery.codemirror'],function($,_,Handlebars, moment, form2js, js2form, codemirror, tmpl_DT, tpl_1, tpl_2, tpl_Settings, tpl_3, tpl_RowDevice) {
	console.log('initializing app::devices');
	
	var $ = $||$(function($) {$=$;});
	var Markers = [];

	/*
	 *
	 * App Namespace
	 * 
	*/
	SP.Tab.Devices = {
		MAP:false,
		Settings: {},
		mapShowOptions: function(){
			// Populate form data
			js2form(document.getElementById('form-c3'), SP.Tab.Devices.Settings);
			
			// Open form
			$('.modal.c3').trigger('openModal');
			console.log(SP.Tab.Devices.Settings);
		},
		setMarkerIdleState: function(marker) {
			var state = 1; // default active
			var curtimesecs = Math.round(new Date().getTime() / 1000);
			
			console.log(new Date().getTime());
			console.log('elapsed: '+(curtimesecs - marker._timestamp));
			console.log('idleTimeout is set to '+(SP.Tab.Devices.Settings.idleTimeout * 60)+' seconds');
			
			if ((curtimesecs - marker._timestamp) >= (SP.Tab.Devices.Settings.idleTimeout * 60) ) {
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
	openModal_SendMessage = function(view){
		$('.modal.c4 form').show();
		$('.modal.c4 .header').show();
		$('.modal.c4 .loader').hide().text('Please wait while we confirm receipt.');
		$(view).find('#title').html('<i style="background-color:#ffff33;padding:3px;border-radius:3px;">'+SP.DB.devices.countMarked()+'</i> devices selected');	
	};
	closeModal_SendMessage = function(view){
		$(view).find('#title').text('');
		$(view).find('textarea#message').val('');
	};
	openModal_EditFF = function(view){
		
		// create tmp model
		var mdl = Model("ffedit");
		var tmpDevice = new mdl({
		      "longitude": "-94.486894",
		      "enabled": "true",
		      "userID": "TZMartin",
		      "clientID": "TZ-ef12155c-a286-3253-bfb1-24dbe403a1fa",
		      "latitude": "37.1122284",
		      "appPackage": "com.test.app",
		      "geohash": "9ysg1uhdruc3",
		      "device": "iPhone+4S",
		      "expires": "123456870",
		      "status": {
		        "id": 100,
		        "title": "Service Trip",
		        "data": {
		          "image": "https://www.monosnap.com/image/6jaPgaE3d0i2wq3umYzixoz7y.png",
		          "jobNum": "S9822215",
		          "address": "1199 West 25th St, Joplin",
		          "labelText": "Turn Off",
		          "labelColor": "red"
		        },
		        "timestamp": 1384165084
		      },
		      "timestamp": 1380741478
		 });
		tmpDevice.save();
		
		// Editor
		SP.UI.FFEditor = $('.expression-preview-code').codemirror({
      mode: 'javascript',
      lineNumbers: true,
			lineWrapping:true,
			smartIndent:false,
			fixedGutter:false,
			onChange: function(e){
				
				var el = $(".device-preview li[data='ffedit-preview-ef12155c-a286-3253-bfb1-24dbe403a1fa']").find('.content');
				
				var editFunc = evalFunction(e.getValue());
				if (!editFunc.errorMessage) {
					try {
						el.html(editFunc.call(this, tmpDevice.asJSON()));
					}catch(e){
						el.html(e+"");
					}
				} else {
					el.html(editFunc.errorMessage);
				}
					
				// var editFunc = App.costco.evalFunction(e.getValue());
				// 
				// 	        if (!editFunc.errorMessage) {
				// 						// Traverse and Apply editFunc to object
				// 	          var traverseFunc = function(doc) {
				// 	            App.util.traverse(doc).forEach(editFunc);
				// 	            return doc;
				// 	          };
				// 	          App.costco.previewTransform(App.db.cache, editFunc, App.currentColumn);
        //} else {
					//console.log(editFunc.errorMessage);
					//App.costco.previewTransform(App.db.cache, function() { return editFunc.errorMessage;}, App.currentColumn);
        //}
			}
    });

		SP.UI.FFEditor.setValue("function(device) {\n    return \"HELLO WORLD\";\n}");
		
	};
	closeModal_EditFF = function(view) {
		SP.UI.FFEditor = null;
	};
	logPusher = function(message) {
		SP.Terminal.echo(message, {
        finalize: function(el) {el.css("color", "white");}
    });
	};
	listen_newClient = function(data) {

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
		marker.addTo(SP.Tab.Devices.MAP);
		marker.bindPopup('<div style="font-size:22px;">'+data.userID+'</div><div style="font-size:12px;">Device: '+data.device+'</div>');
		Markers.push(marker);
		
		// Add device to left panel
		
		
		// Notify the user
		//alert('A new device has been added.');
  };
	listen_updateClient = function(_data) {
		
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
							SP.Tab.Devices.MAP.removeLayer(this);
						});
					
					}
			  });
			
				// Add marker animation path to map
				SP.Tab.Devices.MAP.addLayer(path);
				
				// Hide marker then start
				$(path._icon).hide().fadeIn(300, function(){
					path.start();
				});
				
				// Set marker to pulsate
				_marker.setPulsing(true);
				
				// Update Device idlestatus to active (1=active, 2=idle)
				SP.Tab.Devices.setDeviceIdleState(_marker.options.clientID,1);
				
				// Set final marker location from request
				_marker.setLatLng(new L.LatLng(_data.latitude, _data.longitude));
				
				// Update timestamp with latest data
				_marker._timestamp = _data.timestamp;
				
				// Set idle expiration date
				_marker.options._idletimestamp = new Date().getTime() + (SP.Tab.Devices.Settings.idleTimeout * 60) * 1000;
				
				// Set active/idle state based on settings
				setTimeout(function() {
					
					console.log(Markers[i].options._idletimestamp + ' - ' + new Date().getTime());
					
					if (Markers[i].options._idletimestamp - new Date().getTime() <= 0 ) {
						console.log('SHOULD IDLE');
						Markers[i].setPulsing(false);
						$(Markers[i]._icon).toggleClass('idle');
						SP.Tab.Devices.setDeviceIdleState(Markers[i].options.clientID,2);
					}
				}, (SP.Tab.Devices.Settings.idleTimeout * 60) * 1000);
				
			}
		});
  };
	listen_message = function(_data) {
		$('.modal.c4 .loader').text('Message successfully sent');
		setTimeout(function(){
			$('.modal.c4').trigger('closeModal');
		},2000);
		SP.incrementTabIcon(1);
	};
	listen_status = function(_data) {
		console.log('Status received for '+_data.clientID);
		var d  = SP.DB.devices.find_by_ID(_data.clientID);
		if(d){
			//_data.data = JSON.parse(_data.data.data);
			d.attr({status: _data.data});
			d.trigger("update:status");	
			SP.incrementTabIcon(1);
		}
	};
	listen_updateDeviceStatus = function(){
		console.log('Updating device object.. status: '+this.attr("status"));
		
		var html = 'Status is empty';
		
		if (this.attr("status")) {
			html = '<i>Unknown status filter</i>';
			var status = this.attr("status");
			if (status.id) {
				if(typeof SP.UI.filter[status.id] == "function") {
					 html = SP.UI.filter[status.id].call(this, this.asJSON());
				}
			}
			if (status.html) {
				html = status.html;
			}
		}
		
		$(".device-list li[data='"+this.attr("clientID")+"']").find('.content').html(html);
		
	};
	
	evalFunction = function(funcString) {
    try {
      eval("var editFunc = " + funcString + ";");
    } catch(e) {
      return {errorMessage: e+""};
    }
    return editFunc;
  };

	doDocClick = function(e) {
		var el_action = $(e.target).attr('action');
		switch(el_action) {
				
			case 'toggleDeviceMark':
				
				var row = $(e.target).closest('li');
				var marked = $(e.target).closest('input').attr('checked')?true:false;						
				var device = SP.DB.devices.find_by_ID(row.attr('data'));
				
				// Update checked state for device
				device.attr("marked", marked);
											
				// Update UI
				row.removeClass('selected').toggleClass('checked');
				
				break;
				
			case 'selectAll':							
				SP.DB.devices.each(function() {
					this.attr("marked", true);
					$('input#check-'+this.attr("clientID")).prop('checked',true);
					$("li.device[data='"+this.attr("clientID")+"']").removeClass('selected').addClass('checked');
				});
				break;
				
			case 'selectNone':
				SP.DB.devices.each(function() {
					this.attr("marked", false);
					$('input#check-'+this.attr("clientID")).prop('checked',false);
					$("li.device[data='"+this.attr("clientID")+"']").removeClass('selected').removeClass('checked');
				});
				break;
				
			case 'selectAction':
				if(SP.DB.devices.countMarked()) {
					$('.modal.c4').trigger('openModal',{"foo":"bar"});
				} else {
					alert('Mark a device before taking action.');
				}
				break;
					
			case 'sendMessageToDevice':
				alert('Not implemented. Use the /api/messages endpoint instead');
				break;

			case 'openSettings':
				$('.modal.settings').trigger('openModal',{"foo":"bar"});
				break;
			
			case 'test_FFEdit':
				console.log(evalFunction(SP.UI.FFEditor.getValue()));
				break;
		}
	};
	doFormSubmit = function(){
		
		// settings
		if ($(this).attr('data') == 'submit-c3') {
			
			var formData = form2js('form-c3', '.', true,function(node) {
				
			});
			
			SP.Tab.Devices.Settings = formData;
			
			// Save form data				
			SP.Network.http({
				url:'/_db',
				type:'POST',
				dataType:'json',
				data:formData
			}).done(function(response) {	
				$('.modal.c3').trigger('closeModal');
				console.log(SP.Tab.Devices.Settings);
			});
			
		}
		
		if ($(this).attr('data') == 'submit-c4') {
			var formData = form2js('form-c4', '.', true, function(n) {
				var str = false;
				console.log(n);
				if (typeof n.querySelector == "function") {
					var n = n.querySelector('textarea[id="message"]');
					if (n) {
						try {
							str = { name: "message", value: JSON.parse(n.value) } ;
						}catch(e) {
							str = { name: "message", value: n.value };
						}
					}
				}
				return str;
			});
			
			// Build list of SocketIDs to target
			formData.devices = [];
			SP.DB.devices.getMarked().each(function() {
				// Send an array of device socketIDs.
				// todo: add an option to send clientID or userID instead.
			  formData.devices.push({
				"socketID":this.attr("socketID"),
				"clientID":this.attr("clientID"),
				"userID":this.attr("userID")
				});
			});
			
			// Set App Settings
			SP.Network.http({
				url:'/'+ID+'/messages',
				type:'POST',
				headers:{
					'Authorization':'test',
					'Content-Type':'application/json'
				},
				dataType:'json',
				data:JSON.stringify(formData)
			}).done(function(res) {
				console.log(res);
				if (res.status == 200) {
					// Update modal and wait for confirmation
					$('.modal.c4 form').hide();
					$('.modal.c4 .header').hide();
					$('.modal.c4 .loader').show();
				} else {
					alert('['+res.status+'] '+res.message);
				}
			});
						
		}
		
	};
	stopSubmit = function( event ) {
		event.preventDefault();
		return false;
	};
	addDeviceItem = function(d) {
		console.log('Adding device');
		console.log(d);
		
		// Update UI
		$(".left-panel .device-list").append(tpl_RowDevice(d.asJSON(),{partials:{}}));
		
		// Update status
		d.trigger("update:status");	
		
		// console.log('Updating status for clientID: '+d.attr('clientID'));
		// SP.Network.http({url:'/'+ID+'/'+d.attr('clientID')+'/status'}).done(function(_res){
		// 	if (_res.status == 200) {
		// 		listen_status(_res.message);
		// 	} else {
		// 		alert(_res.message);
		// 	}
		// });
		
	};
	setupMap = function(response) {			
			
			if (response.status != 200) {
				alert(response.message);
				return;
			}
			//$('#applist .loading_dots').remove();
			
			// Save device to SP.DB.devices
			_.each(response.message,function(doc){
				var d = new SP.DB.devices(doc);
				d.bind("update:status", listen_updateDeviceStatus);
				d.save();
			});
			
			// Create map
			SP.Tab.Devices.MAP = new L.Map("devices-map", {
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
			        .addListener(controlDiv, 'click', function () { SP.Tab.Devices.mapShowOptions(); });

			        var controlUI = L.DomUtil.create('div', 'leaflet-control-command-interior', controlDiv);
			        controlUI.title = 'Map Commands';
			        return controlDiv;
			    }
			});

			L.control.command = function (options) {
			    return new L.Control.Command(options);
			};

			var commandControl = new L.Control.Command({});
			SP.Tab.Devices.MAP.addControl(commandControl);

			// Store markers
			for(key in response.message) {

				var marker = new L.userMarker([
					response.message[key].latitude, 
					response.message[key].longitude
				],{
					clientID:response.message[key].clientID,
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
				marker._timestamp = response.message[key].timestamp;

				// Add to map
				marker.addTo(SP.Tab.Devices.MAP);

				// Check if marker is idle
				var idleState = SP.Tab.Devices.setMarkerIdleState(marker);
				SP.Tab.Devices.setDeviceIdleState(marker.options.clientID,idleState);

				if (idleState == 2) {
					marker.setPulsing(false);
					$(marker._icon).toggleClass('idle');
				}
				
				var last_active = moment.unix(response.message[key].timestamp).format('MMM-Do hh:mm');
				marker.bindPopup('<div style="font-size:22px;">'+response.message[key].userID+'</div><div style="font-size:12px;">Device: '+response.message[key].device+'</div><div style="font-size:12px;">Last Active: '+last_active+'</div>');
				Markers.push(marker);
			}
			
							
			SP.Tab.Devices.MAP.on('popupopen', function(e) {
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
				SP.Tab.Devices.MAP.panTo(new L.LatLng(marker._latlng.lat, marker._latlng.lng),{animate:true});
			});
			
	};
	
	
	/*
	 *
	 * Return Public Methods
	 * 
	*/
	return {
		
		render: function() {
			console.log('Rendering map..');	
			
			// Create Device List Item
			SP.DB.devices.bind("add", addDeviceItem);
			
			/*
			 *
			 *
			 * Set up UI
			 *
			 * 
			*/
			
			// Create modal templates for this view
			$("#modals:first").append(tpl_1({},{partials:{}}));
			$("#modals:first").append(tpl_2({},{partials:{}}));
			$("#modals:first").append(tpl_3({},{partials:{}}));
			$("#modals:first").append(tpl_Settings({},{partials:{}}));
			
			// Init modal logic
			$('.modal.c1').easyModal({top:200,overlay:0.2});
			$('.modal.c3').easyModal({top:200,overlay:0.2});
			$('.modal.c4').easyModal({top:200,overlay:0.2, onOpen: openModal_SendMessage, onClose: closeModal_SendMessage});
			$('.modal.settings').easyModal({overlay:0.2, onOpen: openModal_EditFF, onClose: closeModal_EditFF});
			

			// Create Main Container
			SP.render('#main-container', tmpl_DT({
				height:$(document).height() - $('body').offset().top-65+'px'
			}, {partials: {}}));
			
			
			// Set App Settings
			SP.Network.http({
				url:'/_db?id=map',
				type:'GET',
				dataType:'json'
			}).done(function(response) {	
				SP.Tab.Devices.Settings = {
				  "id": "map",
				  "idleTimeout": "2"
				};
			});
			
			// Create terminal log
			Pusher.log = logPusher;
			var WSClient = new Pusher(SP.WS.key);
		  var WSChannel = WSClient.subscribe(SP.WS.channel);
			WSChannel.bind('update_client@beacon', listen_updateClient);
			WSChannel.bind('new_client@beacon', listen_newClient);
			WSChannel.bind('message@main', listen_message);
			WSChannel.bind('status@main', listen_status);
								
			// get devices 
      SP.Network.http({url:'/'+ID+'/_devices'}).done(setupMap);
		
			// Hide element on doc click
			$(document).on("click",doDocClick);
			
			// Handle Form Submissions
			// https://github.com/maxatwork/form2js
			$('form button').on('click',doFormSubmit);
			
			// Stop forms from submitting
			$("form").submit(stopSubmit);

		}
	}
	
});