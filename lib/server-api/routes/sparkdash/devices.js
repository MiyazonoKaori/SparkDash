var path = require('path')
	, http = require('http')
	, https = require('https')
	, querystring = require('querystring')
	, bcrypt = require("bcrypt")
	, redis = require("redis")
	, Pusher = require('pusher')
	, geohash = require('geohash');


var Filtered = [];
	
var getEvents = function(appPackage, obj, res){
	var request = http.request({
	    	port: 8585,
	    	hostname: '127.0.0.1',
	    	method: 'POST',
				headers:{'Authorization':'test'},
	    	path: '/tables/devices/query'
			}, function(__res){
				var str = '';
			  __res.on('data', function (chunk) {
			    str += chunk;
			  });
			  __res.on('end', function () { 
					obj.event_count = JSON.parse(str).count||'?';
					doneWithEvents(obj, res);
			  });
			}
	);
	request.write("WHEN appPackage == '"+appPackage+"' THEN SELECT count() END");
	request.end();
};

var doneWithEvents = function(obj, res){
	Filtered = [];
	res.json({'status':200, 'message':[obj]});
};
	
module.exports = function(app,App){
			
	var pusher = new Pusher({
	  appId: '54725',
	  key: '212c3181292b80f4e1a9',
	  secret: '4857bb6a46e81f7e29c1'
	});

	// 	req contains additional properties:
	// 		- req.subdomain 
	// 		- req.Redis

	app.get('/api/devices', function(req, res){
		
		// Switch to clientID database.. remember each Redis instance is tied to a domain. Databases hold devices, sessions, users, metrics.
		req.Redis.select(2, function() {
			
			var devices = [];
			var deviceCount = 0;
			var activeCount = 0;
			var query = false;
						
			// Get all KEYS
			req.Redis.KEYS("*", function(e,o) {
				
				var multi = req.Redis.multi();
				
				for(key in o) {
					multi.hgetall(o[key]);
				}
				
				multi.exec(function (err, devices) {
							
					if (Object.keys(req.query).length > 0) {
						if (req.query.app_oid) { query = {_id:App.db.mongo.ObjectId(req.query.app_oid)}; }
						if (req.query.appPackage) { query = {appPackage:req.query.appPackage}; }
												
						// get appPackage for iod
						App.db.mongo.apps.findOne(query,function(err,app) {
							if (app) {
								// filter device by package

								if (devices) {
									
									DeviceCount = devices.length-1;
									
									devices.map(function(d){
										if(d.appPackage == app.appPackage) {
											
											// Parse data node
											if (d.data) {
												d.data = JSON.parse(d.data);
											}
									
											// Filter for device states
											if (req.query.lifecycle_state) {
												
												// lifecycle_state
												switch(req.query.lifecycle_state) {
													case 'all':
														Filtered.push(d);
														break;
													case 'any':
														Filtered.push(d);
														break;
													default:
														if (d.lifecycle_state == req.query.lifecycle_state) {
															Filtered.push(d);
														}
												}
												
											} else if (req.query.filter) {
												
												// Filter
												switch(req.query.filter) {
													case 'sum':
														Filtered = req.query.filter;
														deviceCount++;
														if (d.lifecycle_state >= 1) {
															activeCount++;
														}
														break;
													case 'clientID':
														Filtered.push(d.clientID);
														break;
													default:
														Filtered.push(d);
												}
												
											} else {
												
												// ClientID
												if (req.query.clientID) {
													if (d.clientID == req.query.clientID) {
														Filtered.push(d);
													}
												} else {
													
													// Default
													// Show only lifecycle_states higher than 2 (those at least started the app)
													if (d.lifecycle_state >= 1) {
														Filtered.push(d);
													}
												}
												
											}
										}
									});
								}
								
								if (Filtered == 'sum') {
									getEvents(app.appPackage, {device_count:deviceCount, active_count:activeCount}, res);
								} else {
									res.json({status:200,message:Filtered});
									Filtered = [];
								}
								
							} else {
								
								res.json({status:200,message:[]});
							}
						});
						
					} else {
						res.json({status:200,message:devices});
					}
					
				});
			});
			
		});
	
	});
	
	
	
	
	/*
		var test = [
		  {
          "clientID": "ef12155c-a286-3253-bfb1-24dbe403a1fa-1",
          "userID": "false",
          "appPackage": "com.test.app",
          "appID": "false",
          "lifecycle_state": "1",
          "appBuild": "1.0",
          "timestamp": "1384386803",
          "socketID": "false",
          "data": {
              "latitude": "37.129132",
              "longitude": "-94.4819832",
              "geohash": "9ysg4p0kf5z5",
              "status": false
          }
      },
			{
          "clientID": "ef12155c-a286-3253-bfb1-24dbe403a1fa-2",
          "userID": "false",
          "appPackage": "com.test.app",
          "appID": "false",
          "lifecycle_state": "1",
          "appBuild": "1.0",
          "timestamp": "1384386803",
          "socketID": "false",
          "data": {
              "latitude": "37.129132",
              "longitude": "-94.4819832",
              "geohash": "9ysg4p0kf5z5",
              "status": false
          }
      },
			{
          "clientID": "ef12155c-a286-3253-bfb1-24dbe403a1fa-3",
          "userID": "false",
          "appPackage": "com.test.app",
          "appID": "false",
          "lifecycle_state": "1",
          "appBuild": "1.0",
          "timestamp": "1384386803",
          "socketID": "false",
          "data": {
              "latitude": "37.129132",
              "longitude": "-94.4819832",
              "geohash": "9ysg4p0kf5z5",
              "status": false
          }
      },
			{
          "clientID": "ef12155c-a286-3253-bfb1-24dbe403a1fa-4",
          "userID": "false",
          "appPackage": "com.test.app",
          "appID": "false",
          "lifecycle_state": "1",
          "appBuild": "1.0",
          "timestamp": "1384386803",
          "socketID": "false",
          "data": {
              "latitude": "37.129132",
              "longitude": "-94.4819832",
              "geohash": "9ysg4p0kf5z5",
              "status": false
          }
      },
			{
          "clientID": "ef12155c-a286-3253-bfb1-24dbe403a1fa-5",
          "userID": "false",
          "appPackage": "com.test.app",
          "appID": "false",
          "lifecycle_state": "1",
          "appBuild": "1.0",
          "timestamp": "1384386803",
          "socketID": "false",
          "data": {
              "latitude": "37.129132",
              "longitude": "-94.4819832",
              "geohash": "9ysg4p0kf5z5",
              "status": false
          }
      },
			{
          "clientID": "ef12155c-a286-3253-bfb1-24dbe403a1fa-6",
          "userID": "false",
          "appPackage": "com.test.app",
          "appID": "false",
          "lifecycle_state": "1",
          "appBuild": "1.0",
          "timestamp": "1384386803",
          "socketID": "false",
          "data": {
              "latitude": "37.129132",
              "longitude": "-94.4819832",
              "geohash": "9ysg4p0kf5z5",
              "status": false
          }
      },
			{
          "clientID": "ef12155c-a286-3253-bfb1-24dbe403a1fa-7",
          "userID": "false",
          "appPackage": "com.test.app",
          "appID": "false",
          "lifecycle_state": "1",
          "appBuild": "1.0",
          "timestamp": "1384386803",
          "socketID": "false",
          "data": {
              "latitude": "37.129132",
              "longitude": "-94.4819832",
              "geohash": "9ysg4p0kf5z5",
              "status": false
          }
      },
			{
          "clientID": "ef12155c-a286-3253-bfb1-24dbe403a1fa-8",
          "userID": "false",
          "appPackage": "com.test.app",
          "appID": "false",
          "lifecycle_state": "1",
          "appBuild": "1.0",
          "timestamp": "1384386803",
          "socketID": "false",
          "data": {
              "latitude": "37.129132",
              "longitude": "-94.4819832",
              "geohash": "9ysg4p0kf5z5",
              "status": false
          }
      },
			{
          "clientID": "ef12155c-a286-3253-bfb1-24dbe403a1fa-9",
          "userID": "false",
          "appPackage": "com.test.app",
          "appID": "false",
          "lifecycle_state": "1",
          "appBuild": "1.0",
          "timestamp": "1384386803",
          "socketID": "false",
          "data": {
              "latitude": "37.129132",
              "longitude": "-94.4819832",
              "geohash": "9ysg4p0kf5z5",
              "status": false
          }
      },
			{
          "clientID": "ef12155c-a286-3253-bfb1-24dbe403a1fa-10",
          "userID": "false",
          "appPackage": "com.test.app",
          "appID": "false",
          "lifecycle_state": "1",
          "appBuild": "1.0",
          "timestamp": "1384386803",
          "socketID": "false",
          "data": {
              "latitude": "37.129132",
              "longitude": "-94.4819832",
              "geohash": "9ysg4p0kf5z5",
              "status": false
          }
      }
		];
		*/
	
};