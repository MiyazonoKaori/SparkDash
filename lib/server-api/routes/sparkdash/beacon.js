var path = require('path')
	, http = require('http')
	, https = require('https')
	, querystring = require('querystring')
	, mongojs = require('mongojs')
	, bcrypt = require("bcrypt")
	, redis = require("redis")
	, Pusher = require('pusher')
	, geohash = require('geohash')
	, Config = require('../../../../config');

	
var pusher = new Pusher({
  appId: '54725',
  key: '212c3181292b80f4e1a9',
  secret: '4857bb6a46e81f7e29c1'
});

var db = mongojs(Config.databases.mongo, ['apps','domains']);
	

var getDeviceState = function(state) {
	var States = {
			"STOP APP"		: 0,
			"STOP"				: 0,
			"START APP"		: 1,
	    "START" 			: 1,
	    "LOGOUT" 			: 2,
			"LOGOFF" 			: 2,
	    "LOGON" 			: 3,
	    "LOGIN" 			: 3,
			"LOCATION"		: 4,
			"IDLE" 				: 10
	};
	
	if (States.hasOwnProperty(state)) {
		return States[state];
	} else {
		return -1;
	}
};

var getCustomEvent = function(req,res,_keyTimestamp,cb) {
	
	// Create Websocket Channel
	var WS_MainChannel = (req.body.appPackage) ? req.subdomain.id+'_'+req.body.appPackage : req.subdomain.id;
	var socketID = (req.body.socketID) ? req.body.socketID : false;
	
	var pushObj = {
		evt:'custom@main',
		payload:{
			eventName: (req.body.eventName) ? req.body.eventName : 'undefined'
		}
	};
	
	cb(res,WS_MainChannel, pushObj, socketID);
	
}
var getTaskEvent = function(req,res,_keyTimestamp,cb){
	// If eventName is set, then assume it is a valid name.
	// SparkDash doesn't maintain a registr of valid eventNames yet.

	// Create Websocket Channel
	var WS_MainChannel = (req.body.appPackage) ? req.subdomain.id+'_'+req.body.appPackage : req.subdomain.id;
	var socketID = (req.body.socketID) ? req.body.socketID : false;
	
	var pushObj = {
		evt:(req.body.eventName) ? 'task_'+req.body.eventName + '@beacon' : 'task_unknown@beacon',
		payload:{}
	};
	
	cb(res,WS_MainChannel, pushObj, socketID); 
};
var getExceptionEvent = function(req,res,_keyTimestamp,cb){
	// If eventName is set, then assume it is a valid name.
	// SparkDash doesn't maintain a registr of valid eventNames yet.

	// Create Websocket Channel
	var WS_MainChannel = (req.body.appPackage) ? req.subdomain.id+'_'+req.body.appPackage : req.subdomain.id;
	var socketID = (req.body.socketID) ? req.body.socketID : false;
	
	var pushObj = {
		evt:(req.body.eventName) ? 'exception_'+req.body.eventName+'@beacon' : 'exception_unknown@beacon',
		payload:{"stacktrace":{}}
	};
	
	cb(res,WS_MainChannel, pushObj, socketID);
};
var getInternalEvent = function(req,res,_keyTimestamp,cb) {
	
	// Create Websocket Channel
	var WS_MainChannel = (req.body.appPackage) ? req.subdomain.id+'_'+req.body.appPackage : req.subdomain.id;
	var socketID = (req.body.socketID) ? req.body.socketID : false;
	var socketID = false;
	
	var evt = 'internal_undefined@beacon';
	var payload = {};
	
	if (!req.body.eventName) {
		return cb(res,WS_MainChannel, {event:evt,payload:payload}, socketID);
	}
	console.log(req.body.eventName);
	// Target Event Name
	switch( req.body.eventName.toUpperCase() ) {

		// CLIENT LIFECYCLE
		case 'LOGON':
			
			// Get app meta
			db.apps.findOne({appPackage:req.body.appPackage},function(err,app){
				
				// Verify current app build
				if (req.body.appBuild != app.current_build) {
					
					// Get build url
					var url = "?";
					for(var x in app.builds) {
						if (app.builds[x].build === app.current_build) {
							url = app.builds[x].url;
						}
					}
					evt = 'update@main';
					payload = {
						type:req.body.type,
						clientID: req.body.clientID,
						data:{
							'build':app.current_build,
							'url':url
						}
					};
					
				} else {
					
					// App is current
					evt = 'new_client@beacon';
					payload = {
						clientID: req.body.clientID,
						userID:req.body.userID,
						device_state:1,
						enabled:req.body.enabled,
						latitude: req.body.latitude, 
						longitude: req.body.longitude,
						timestamp: req.body.timestamp
					};
					
				}
				cb(res,WS_MainChannel, {event:evt,payload:payload}, socketID);
			});
			
			break;

		case 'LOGOUT':
			evt = 'remove_client@beacon';
			payload = {};
			cb(res,WS_MainChannel, {event:evt,payload:payload}, socketID);
			break;

		case 'START APP':
			
			// Get App Meta
			db.apps.findOne({appPackage:req.body.appPackage},function(err,app){
				
				// Verify current app build
				if (req.body.appBuild != app.current_build) {
					
					// Get build url
					var url = "?";
					for(var x in app.builds) {
						if (app.builds[x].build === app.current_build) {
							url = app.builds[x].url;
						}
					}
					evt = 'update@main';
					payload = {
						type:req.body.type,
						clientID: req.body.clientID,
						data:{
							'build':app.current_build,
							'url':url
						}
					};
				} else {
					evt = 'startapp@beacon';
					payload = {
						current_build:app.current_build
					};
				}
				
				cb(res,WS_MainChannel, {event:evt,payload:payload}, socketID);
			});
			break;

		case 'STOP APP':
			evt = 'stopapp@beacon';
			payload = {};
			cb(res,WS_MainChannel, {event:evt,payload:payload}, socketID);
			break;

		case 'LOCATION':

			// Note: when a Location event is received, the device_state will become active (an expected behavior of movement). 

			if (_keyTimestamp) {
				// update_client@beacon  (clientID exists)

				evt = 'update_client@beacon';
				payload = {
					clientID: req.body.clientID,
					userID:req.body.userID,
					device_state:1,
					enabled:req.body.enabled,
					latitude: req.body.latitude, 
					longitude: req.body.longitude,
					timestamp: req.body.timestamp
				};
				
			} else {
				// new_client_geo@beacon

				evt = 'new_client@beacon';
				payload = {
					clientID: req.body.clientID,
					userID:req.body.userID,
					device_state:1,
					enabled:req.body.enabled,
					latitude: req.body.latitude, 
					longitude: req.body.longitude,
					timestamp: req.body.timestamp
				};

			}
			
			cb(res,WS_MainChannel, {event:evt,payload:payload}, socketID);
			
			break;


			// CUSTOM EVENTS
			case 'REMOVE':
				// remove_client@beacon
				
				req.Redis.expire(req.body.clientID, 1);
				
				evt = 'remove_client@beacon';
			 	payload = {
					clientID: req.body.clientID,
					userID:req.body.userID,
					device_state:req.body.device_state,
					enabled:req.body.enabled,
					timestamp: req.body.timestamp
				};
				
				cb(res,WS_MainChannel, {event:evt,payload:payload}, socketID);
				
				break;
	}

};


function doneCB(res,WS_MainChannel, pushObj, socketID) {
	
	pusher.trigger(WS_MainChannel, pushObj.event, pushObj.payload, socketID);
	
	// log
	if (Config.log) {
		pusher.trigger(WS_MainChannel, 'log@main', {
			from:{
				"clientID":pushObj.payload.clientID
			},
			to:{
				event:pushObj.event,
				socketID:socketID
			},
			payload:pushObj.payload
		});
	}
	
	res.json({'response':'ok','message':pushObj});
	
}


module.exports = function(app,App){
	
	// 	req contains additional properties:
	// 		- req.subdomain 

	app.post('/api/beacon', function(req, res){

		if (req.body) {
			
			// switch to the clientID database
			req.Redis.select(2, function() {

				// Check if the clientID exists?
				req.Redis.HGET(req.body.clientID, "clientID",function(_err,_keyTimestamp){
				
					var pushObj;
					var idleTimeout = 5; // (minutes)
								
					// Set keystamp
					if (!_keyTimestamp) { _keyTimestamp = 0; }
					
					// Create timestamp
					req.body.timestamp = Math.round(new Date().getTime() / 1000);

					// Set device_state if it's not explicity defined by the client. This will be active 1 or idle 2
					req.body.device_state = req.body.device_state||-1;
					
					// Set the device_state
					if (req.body.eventName) {
						req.body.device_state = getDeviceState(req.body.eventName.toUpperCase());						
					}

					// Check if idle from last known device_status (but only if it's an active state)
					if (req.body.device_state > 2) {
						if ((req.body.timestamp - _keyTimestamp) >= (idleTimeout * 60) ) {
							req.body.device_state = 10; // idle
						}
					}
					
					// Create geohash for filtering. see https://www.firebase.com/blog/2013-09-25-location-queries-geofire.html
					req.body.geohash = geohash.GeoHash.encodeGeoHash(req.body.latitude, req.body.longitude);
					
					// save/update clientID
					req.Redis.HMSET(req.body.clientID, req.body, function(e,o) {
						if (e) { res.send({status:404,message:"clientID is "+req.body.clientID}); return; }

						//req.Redis.BGSAVE();

						// Expiration
						if (req.body.expiration) {
							req.Redis.expire(req.body.clientID, req.body.expiration);
						}
											
						// Internal
						switch( req.body.eventType.toUpperCase()) {
							
							case 'INTERNAL':
								getInternalEvent(req,res,_keyTimestamp,doneCB);
								break;
							
							case 'TASK':
								getTaskEvent(req,res,_keyTimestamp,doneCB);
								break;
							
							case 'EXCEPTION':
								getExceptionEvent(req,res,_keyTimestamp,doneCB);
								break;
								
							default:
								// Custom
								getCustomEvent(req,res,_keyTimestamp,doneCB);
								
						}
						
					});
				});
				
				
			});
			
			
		}
		
	});
	
};