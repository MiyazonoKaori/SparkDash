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
	

var getLifecycleState = function(state) {
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

var getCustomEvent = function(req,res,meta,cb) {
	
	// Create Websocket Channel
	var WS_MainChannel = (req.body.appPackage) ? req.subdomain.id+'_'+req.body.appPackage : req.subdomain.id;
	var socketID = (req.body.socketID) ? req.body.socketID : false;
	
	var pushObj = {
		evt:'custom@main',
		payload:{
			eventName: (meta.eventName) ? meta.eventName : 'undefined'
		}
	};
	
	cb(res,WS_MainChannel, pushObj, socketID);
	
}
var getTaskEvent = function(req,res,meta,cb){
	// If eventName is set, then assume it is a valid name.
	// SparkDash doesn't maintain a registr of valid eventNames yet.

	// Create Websocket Channel
	var WS_MainChannel = (req.body.appPackage) ? req.subdomain.id+'_'+req.body.appPackage : req.subdomain.id;
	var socketID = (req.body.socketID) ? req.body.socketID : false;
	
	var pushObj = {
		evt:(meta.eventName) ? 'task_'+meta.eventName + '@beacon' : 'task_unknown@beacon',
		payload:{}
	};
	
	cb(res,WS_MainChannel, pushObj, socketID); 
};
var getExceptionEvent = function(req,res,meta,cb){
	// If eventName is set, then assume it is a valid name.
	// SparkDash doesn't maintain a registr of valid eventNames yet.

	// Create Websocket Channel
	var WS_MainChannel = (req.body.appPackage) ? req.subdomain.id+'_'+req.body.appPackage : req.subdomain.id;
	var socketID = (req.body.socketID) ? req.body.socketID : false;
	
	var pushObj = {
		evt:(meta.eventName) ? 'exception_'+meta.eventName+'@beacon' : 'exception_unknown@beacon',
		payload:{"stacktrace":{}}
	};
	
	cb(res,WS_MainChannel, pushObj, socketID);
};
var getInternalEvent = function(req,res,meta,cb) {
	
	// Create Websocket Channel
	var WS_MainChannel = (req.body.appPackage) ? req.subdomain.id+'_'+req.body.appPackage : req.subdomain.id;
	var socketID = req.body.socketID||false;
	var socketID = false;
	
	var evt = 'internal_undefined@beacon';
	var payload = {};
	
	if (!meta.eventName) {
		return cb(res,WS_MainChannel, {event:evt,payload:payload}, socketID);
	}
	
	// Target Event Name
	switch( meta.eventName ) {

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
						appPackage			: req.body.appPackage,
						appID						: req.body.appID,
						clientID				: req.body.clientID,
						userID					: req.body.userID,
						lifecycle_state	: req.body.lifecycle_state,
						timestamp				: req.body.timestamp,
						data						: {
							"type"		: req.body.type,
							'build'		: app.current_build,
							'url'			: url,
							'message'	: 'Please update your app to build '+app.current_build
						}
					};
					
				} else {
					
					// App is current
					if (meta.exists) {
						evt = 'update_client@beacon';
						payload = {
							clientID				: req.body.clientID,
							userID					: req.body.userID,
							lifecycle_state	: req.body.lifecycle_state,
							enabled					: req.body.enabled,
							timestamp				: req.body.timestamp,
							data: {
								latitude				: req.body.latitude, 
								longitude				: req.body.longitude,
								status 					: req.body.status
							}
						};
					} else {
						evt = 'new_client@beacon';
						payload = {
							clientID				: req.body.clientID,
							userID					: req.body.userID,
							lifecycle_state	: req.body.lifecycle_state,
							enabled					: req.body.enabled,
							timestamp				: req.body.timestamp,
							data: {
								latitude				: req.body.latitude, 
								longitude				: req.body.longitude
							}
						};
					}
					
				}
				cb(res,WS_MainChannel, {event:evt,payload:payload}, socketID);
			});
			
			break;

		case 'LOGOUT':
			evt = 'update_client@beacon';
			payload = {
				appPackage			: req.body.appPackage,
				appID						: req.body.appID,
				clientID				: req.body.clientID,
				userID					: req.body.userID,
				lifecycle_state	: req.body.lifecycle_state,
				timestamp				: req.body.timestamp,
				data						: {
					latitude				: req.body.latitude, 
					longitude				: req.body.longitude,
					status					: req.body.status
				}
			};
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
						appPackage			: req.body.appPackage,
						appID						: req.body.appID,
						clientID				: req.body.clientID,
						userID					: req.body.userID,
						lifecycle_state	: req.body.lifecycle_state,
						timestamp				: req.body.timestamp,
						data						: {
							type:req.body.type,
							build: app.current_build,
							url: url,
							message: 'Please update your app to build '+app.current_build
						}
					};
										
				} else {
					
					evt = 'startapp@beacon';
					payload = {
						appPackage			: req.body.appPackage,
						appID						: req.body.appID,
						clientID				: req.body.clientID,
						userID					: req.body.userID,
						lifecycle_state	: req.body.lifecycle_state,
						timestamp				: req.body.timestamp,
						data						: {
							'current_build':app.current_build,
							'message':'You are running the current build.'
						}
					}
				};
				
				cb(res,WS_MainChannel, {event:evt,payload:payload}, socketID);
			});
			break;

		case 'STOP APP':
			evt = 'stopapp@beacon';
			payload = {
				appPackage			: req.body.appPackage,
				appID						: req.body.appID,
				clientID				: req.body.clientID,
				userID					: req.body.userID,
				lifecycle_state	: req.body.lifecycle_state,
				timestamp				: req.body.timestamp,
				data						: {}
			}
			cb(res,WS_MainChannel, {event:evt,payload:payload}, socketID);
			break;

		case 'LOCATION':

			// Note: when a Location event is received, the lifecycle_state will become active (an expected behavior of movement). 

			if (meta.exists) {

				evt = 'update_client@beacon';
				payload = {
					appPackage			: req.body.appPackage,
					appID						: req.body.appID,
					clientID				: req.body.clientID,
					userID					: req.body.userID,
					lifecycle_state	: req.body.lifecycle_state,
					enabled					: req.body.enabled,
					timestamp				: req.body.timestamp,
					data						: {
				    "latitude"		: req.body.latitude,
		        "longitude"		: req.body.longitude,
						"status" 				: req.body.status
				  }
				};
				
			} else {

				evt = 'new_client@beacon';
				payload = {
					appPackage			: req.body.appPackage,
					appID						: req.body.appID,
					clientID				: req.body.clientID,
					userID					: req.body.userID,
					lifecycle_state	: req.body.lifecycle_state,
					enabled					: req.body.enabled,
					timestamp				: req.body.timestamp,
					data						: {
				    "latitude"		: req.body.latitude,
		        "longitude"		: req.body.longitude
				  }
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
					appPackage			: req.body.appPackage,
					appID						: req.body.appID,
					clientID				: req.body.clientID,
					userID					: req.body.userID,
					lifecycle_state	: req.body.lifecycle_state,
					enabled					: req.body.enabled,
					timestamp				: req.body.timestamp,
					data						: {}
				};
				
				cb(res,WS_MainChannel, {event:evt,payload:payload}, socketID);
				
				break;
			
			default:
				cb(res,WS_MainChannel, {event:evt,payload:payload}, socketID);
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
	
	res.json({'status':200,'message':pushObj});
	
}


module.exports = function(app,App){
	
	// 	req contains additional properties:
	// 		- req.subdomain 

	app.post('/api/beacon', function(req, res){

		if (req.body) {
			
			// switch to the clientID database
			req.Redis.select(2, function() {

				// Check if the clientID exists?
				req.Redis.HGET(req.body.clientID, "clientID",function(_err,_exists){
					
					var pushObj;
								
					// Create timestamp
					req.body.timestamp = parseInt(Math.round(new Date().getTime() / 1000));

					// Set lifecycle_state if it's not explicity defined by the client. This will be active 1 or idle 2
					req.body.lifecycle_state = req.body.lifecycle_state||-1;
					
					var meta = {
						eventType:req.body.eventType.toUpperCase(),
						eventName:req.body.eventName.toUpperCase(),
						exists:_exists
					};
					
					// Remove unnecessary properties before storing
					delete req.body.eventType;
					delete req.body.eventName;
					
					// Set the lifecycle_state
					if (meta.eventName) {
						req.body.lifecycle_state = getLifecycleState(meta.eventName);						
					}
					
					// Create geohash for filtering. see https://www.firebase.com/blog/2013-09-25-location-queries-geofire.html
					req.body.geohash = geohash.GeoHash.encodeGeoHash(req.body.latitude, req.body.longitude);
					
					// Expiration
					if (req.body.expiration) {
						req.Redis.expire(req.body.clientID, req.body.expiration);
					}
					
					// save/update clientID
					req.Redis.HMSET(req.body.clientID, req.body, function(e,o) {
						if (e) { res.send({status:404,message:"clientID is "+req.body.clientID}); return; }
						
						// Get the status
						req.Redis.HGET(req.body.clientID, "status",function(_err,status) {
							if (_err) { res.send({status:404,message:"Error fetching status for "+req.body.clientID}); return; }
							
							try {
								req.body.status = JSON.parse(status);
							}catch(e) {
								req.body.status = {}
							}
							
							// Internal
							switch( meta.eventType ) {

								case 'INTERNAL':
									getInternalEvent(req,res,meta,doneCB);
									break;

								case 'TASK':
									getTaskEvent(req,res,meta,doneCB);
									break;

								case 'EXCEPTION':
									getExceptionEvent(req,res,meta,doneCB);
									break;

								default:
									// Custom
									getCustomEvent(req,res,meta,doneCB);

							}
							
						});
						
					});
				});
				
				
			});
			
			
		}
		
	});
	
};