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
	var WS_MainChannel = (req.deviceMeta.appPackage) ? req.subdomain.id+'_'+req.deviceMeta.appPackage : req.subdomain.id;
	var socketID = (req.deviceMeta.socketID) ? req.deviceMeta.socketID : false;
	
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
	var WS_MainChannel = (req.deviceMeta.appPackage) ? req.subdomain.id+'_'+req.deviceMeta.appPackage : req.subdomain.id;
	var socketID = (req.deviceMeta.socketID) ? req.deviceMeta.socketID : false;
	
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
	var WS_MainChannel = (req.deviceMeta.appPackage) ? req.subdomain.id+'_'+req.deviceMeta.appPackage : req.subdomain.id;
	var socketID = (req.deviceMeta.socketID) ? req.deviceMeta.socketID : false;
	
	var pushObj = {
		evt:(meta.eventName) ? 'exception_'+meta.eventName+'@beacon' : 'exception_unknown@beacon',
		payload:{"stacktrace":{}}
	};
	
	cb(res,WS_MainChannel, pushObj, socketID);
};
var getInternalEvent = function(req,res,meta,cb) {
	
	// Create Websocket Channel
	var WS_MainChannel = (req.deviceMeta.appPackage) ? req.subdomain.id+'_'+req.deviceMeta.appPackage : req.subdomain.id;
	var socketID = req.deviceMeta.socketID||false;
	var socketID = false;
	
	var evt = 'internal_undefined@beacon';
	var payload = {};
	
	if (!meta.eventName) {
		return cb(res,WS_MainChannel, {event:evt,payload:payload}, socketID);
	}
	
	if (req.deviceMeta.data) {
		req.deviceMeta.data = JSON.parse(req.deviceMeta.data);
	}
	
	// Target Event Name
	switch( meta.eventName ) {

		// CLIENT LIFECYCLE
		case 'LOGON':
			
			// Get app meta
			db.apps.findOne({appPackage:req.deviceMeta.appPackage},function(err,app){
				
				// Verify current app build
				if (req.deviceMeta.appBuild != app.current_build) {
					
					// Get build url
					var url = "?";
					for(var x in app.builds) {
						if (app.builds[x].build === app.current_build) {
							url = app.builds[x].url;
						}
					}
					evt = 'update@main';
					payload = {
						appPackage			: req.deviceMeta.appPackage,
						appID						: req.deviceMeta.appID,
						clientID				: [req.deviceMeta.clientID],
						userID					: [req.deviceMeta.userID],
						lifecycle_state	: req.deviceMeta.lifecycle_state,
						timestamp				: req.deviceMeta.timestamp,
						data						: {
							"type"		: req.deviceMeta.type,
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
							appPackage			: req.deviceMeta.appPackage,
							appID						: req.deviceMeta.appID,
							clientID				: [req.deviceMeta.clientID],
							userID					: [req.deviceMeta.userID],
							lifecycle_state	: req.deviceMeta.lifecycle_state,
							enabled					: req.deviceMeta.enabled,
							timestamp				: req.deviceMeta.timestamp,
							data						: req.deviceMeta.data
						};
					} else {
						evt = 'new_client@beacon';
						payload = {
							appPackage			: req.deviceMeta.appPackage,
							appID						: req.deviceMeta.appID,
							clientID				: [req.deviceMeta.clientID],
							userID					: [req.deviceMeta.userID],
							lifecycle_state	: req.deviceMeta.lifecycle_state,
							enabled					: req.deviceMeta.enabled,
							timestamp				: req.deviceMeta.timestamp,
							data: {
								latitude				: req.deviceMeta.data.latitude, 
								longitude				: req.deviceMeta.data.longitude
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
				appPackage			: req.deviceMeta.appPackage,
				appID						: req.deviceMeta.appID,
				clientID				: [req.deviceMeta.clientID],
				userID					: [req.deviceMeta.userID],
				lifecycle_state	: req.deviceMeta.lifecycle_state,
				timestamp				: req.deviceMeta.timestamp,
				data						: req.deviceMeta.data
			};
			cb(res,WS_MainChannel, {event:evt,payload:payload}, socketID);
			break;

		case 'START APP':
			
			// Get App Meta
			db.apps.findOne({appPackage:req.deviceMeta.appPackage},function(err,app){
				
				// Verify current app build
				if (req.deviceMeta.appBuild != app.current_build) {
					
					// Get build url
					var url = "?";
					for(var x in app.builds) {
						if (app.builds[x].build === app.current_build) {
							url = app.builds[x].url;
						}
					}
					evt = 'update@main';					
					payload = {
						appPackage			: req.deviceMeta.appPackage,
						appID						: req.deviceMeta.appID,
						clientID				: [req.deviceMeta.clientID],
						userID					: [req.deviceMeta.userID],
						lifecycle_state	: req.deviceMeta.lifecycle_state,
						timestamp				: req.deviceMeta.timestamp,
						data						: {
							type:req.deviceMeta.type,
							build: app.current_build,
							url: url,
							message: 'Please update your app to build '+app.current_build
						}
					};
										
				} else {
					
					evt = 'startapp@beacon';
					payload = {
						appPackage			: req.deviceMeta.appPackage,
						appID						: req.deviceMeta.appID,
						clientID				: [req.deviceMeta.clientID],
						userID					: [req.deviceMeta.userID],
						lifecycle_state	: req.deviceMeta.lifecycle_state,
						timestamp				: req.deviceMeta.timestamp,
						data						: req.deviceMeta.data
					}
				};
				
				payload.data.current_build 	= app.current_build;
				payload.data.message 				= 'You are running the current build.';
				
				cb(res,WS_MainChannel, {event:evt,payload:payload}, socketID);
			});
			break;

		case 'STOP APP':
			evt = 'stopapp@beacon';
			payload = {
				appPackage			: req.deviceMeta.appPackage,
				appID						: req.deviceMeta.appID,
				clientID				: [req.deviceMeta.clientID],
				userID					: [req.deviceMeta.userID],
				lifecycle_state	: req.deviceMeta.lifecycle_state,
				timestamp				: req.deviceMeta.timestamp,
				data						: {}
			}
			cb(res,WS_MainChannel, {event:evt,payload:payload}, socketID);
			break;

		case 'LOCATION':

			// Note: when a Location event is received, the lifecycle_state will become active (an expected behavior of movement). 

			if (meta.exists) {

				evt = 'update_client@beacon';
				payload = {
					appPackage			: req.deviceMeta.appPackage,
					appID						: req.deviceMeta.appID,
					clientID				: [req.deviceMeta.clientID],
					userID					: [req.deviceMeta.userID],
					lifecycle_state	: req.deviceMeta.lifecycle_state,
					enabled					: req.deviceMeta.enabled,
					timestamp				: req.deviceMeta.timestamp,
					data						: req.deviceMeta.data
				};
				
			} else {

				evt = 'new_client@beacon';
				payload = {
					appPackage			: req.deviceMeta.appPackage,
					appID						: req.deviceMeta.appID,
					clientID				: [req.deviceMeta.clientID],
					userID					: [req.deviceMeta.userID],
					lifecycle_state	: req.deviceMeta.lifecycle_state,
					enabled					: req.deviceMeta.enabled,
					timestamp				: req.deviceMeta.timestamp,
					data						: req.deviceMeta.data
				};

			}
			
			cb(res,WS_MainChannel, {event:evt,payload:payload}, socketID);
			
			break;


			// CUSTOM EVENTS
			case 'REMOVE':
				// remove_client@beacon
				
				req.Redis.expire(req.deviceMeta.clientID, 1);
				
				evt = 'remove_client@beacon';
				payload = {
					appPackage			: req.deviceMeta.appPackage,
					appID						: req.deviceMeta.appID,
					clientID				: [req.deviceMeta.clientID],
					userID					: [req.deviceMeta.userID],
					lifecycle_state	: req.deviceMeta.lifecycle_state,
					enabled					: req.deviceMeta.enabled,
					timestamp				: req.deviceMeta.timestamp,
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
	res.json({'status':200,'message':pushObj});
	
}


module.exports = function(app,App){
	
	// 	req contains additional properties:
	// 		- req.subdomain 

	app.post('/api/beacon', function(req, res){

		if (req.body) {
			
			// switch to the client database
			req.Redis.select(2, function() {

				// Check if the clientID exists?
				req.Redis.HGET(req.body.clientID, "data",function(_err,_data){
					
					var pushObj;
					
					var eventMeta = {
						eventType:req.body.eventType.toUpperCase(),
						eventName:req.body.eventName.toUpperCase(),
						exists:(_data)?true:false
					};
					
					var deviceData = (_data) ? JSON.parse(_data) : {status:{}};
										
					req.deviceMeta = {
						clientID				: req.body.clientID||false,
						appID						: req.body.appID||false,
						userID					: req.body.userID||'*',
						socketID				: req.body.socketID||false,
						appPackage			: req.body.appPackage||false,
						appBuild				: req.body.appBuild||false,
						lifecycle_state	: (eventMeta.eventName) ? getLifecycleState(eventMeta.eventName) : -1,
						timestamp				: parseInt(Math.round(new Date().getTime() / 1000)),
						data						: deviceData
					}
					
					// Remove unnecessary properties before storing
					delete req.body.eventType;
					delete req.body.eventName;
					
					// Move objects into the data node
					req.deviceMeta.data.latitude		= (req.body.hasOwnProperty('latitude')) ? req.body.latitude : _data.latitude;
					req.deviceMeta.data.longitude		= (req.body.hasOwnProperty('longitude')) ? req.body.longitude : _data.longitude;
					req.deviceMeta.data.geohash			= false;
					req.deviceMeta.data.status			= (deviceData.status) ? deviceData.status : {};

					
					if (req.deviceMeta.data.latitude && req.deviceMeta.data.longitude) {
						// Create geohash for filtering. see https://www.firebase.com/blog/2013-09-25-location-queries-geofire.html
						req.deviceMeta.data.geohash = geohash.GeoHash.encodeGeoHash(req.deviceMeta.data.latitude, req.deviceMeta.data.longitude);
					}					
					
					// Set device expiration
					if (req.body.expiration) {
						req.Redis.expire(req.deviceMeta.clientID, req.body.expiration);
					}

					req.deviceMeta.data = JSON.stringify(req.deviceMeta.data);

					// save/update clientID
					req.Redis.HMSET(req.body.clientID, req.deviceMeta, function(e,o) {
						if (e) { res.send({status:404,message:"clientID is "+req.body.clientID}); return; }
						
						// Get the status
						req.Redis.HGET(req.body.clientID, "status",function(_err,status) {
							if (_err) { res.send({status:404,message:"Error fetching status for "+req.body.clientID}); return; }
							
							if (status) {
								try {
									req.deviceMeta.data.status = JSON.parse(status);
								}catch(e) {
									req.deviceMeta.data.status = {}
								}
							}
							
							// Internal
							switch( eventMeta.eventType ) {

								case 'INTERNAL':
									getInternalEvent(req,res,eventMeta,doneCB);
									break;

								case 'TASK':
									getTaskEvent(req,res,eventMeta,doneCB);
									break;

								case 'EXCEPTION':
									getExceptionEvent(req,res,eventMeta,doneCB);
									break;

								default:
									// Custom
									getCustomEvent(req,res,eventMeta,doneCB);

							}
							
						});
						
					});
				});
				
				
			});
			
			
		}
		
	});
	
};