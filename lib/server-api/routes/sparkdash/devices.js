var path = require('path')
	, http = require('http')
	, https = require('https')
	, querystring = require('querystring')
	, mongojs = require('mongojs')
	, bcrypt = require("bcrypt")
	, redis = require("redis")
	, Pusher = require('pusher')
	, geohash = require('geohash')
	, config = require('../../../../config/app.json');

module.exports = function(app,App){
	
	var db = mongojs('sp', ['users','domains', 'apps']);
		
	var pusher = new Pusher({
	  appId: '54725',
	  key: '212c3181292b80f4e1a9',
	  secret: '4857bb6a46e81f7e29c1'
	});

	// 	req contains additional properties:
	// 		- req.subdomain 

	app.get('/api/devices', function(req, res){

		var Redis = redis.createClient(
			req.subdomain.database.port, 
			req.subdomain.database.host
		);
		Redis.on("error", function (err) {
			console.log(err.message);
			if (err.message.indexOf("ECONNREFUSED") > 0) {
				console.log('Connection refused. Redis is not running: '+req.subdomain.database.host+':'+req.subdomain.database.port);
				res.json({"status":500,"message":err.message});
			} else if (err.message.indexOf("ENOTFOUND") > 0) {
				res.json({"status":500,"message":err.message});
			} else {
				console.log('critical error connecting to Redis server');
				process.exit();
			}
		});
	
		// Select devices db.. remember each Redis instance is tied to a domain. Databases hold devices, sessions, users, metrics.
		Redis.select(2, function() {
			
			var devices = [];
			var query = false;
			
			// Get all KEYS
			Redis.KEYS("*", function(e,o) {
				
				var multi = Redis.multi();
				
				for(key in o) {
					multi.hgetall(o[key]);
				}
				
				multi.exec(function (err, devices) {
							
					if (Object.keys(req.query).length > 0) {
						if (req.query.app_oid) { query = {_id:mongojs.ObjectId(req.query.app_oid)}; }
						if (req.query.appPackage) { query = {pkg:req.query.appPackage}; }
												
						// get appPackage for iod
						db.apps.findOne(query,function(err,app){
							if (app) {
								// filter device by package
								filtered = [];
								
								if (devices) {
									devices.map(function(d){
										if(d.appPackage == app.pkg) {
											filtered.push(d);
										}
									});
								}
								
								var test = [
								  {
								    "eventName": "Location",
								    "appPackage": "com.test.app",
								    "device": "Nexus+7+v4.3",
								    "clientID": "09b8sdfadsf98asd0f98-0as0a9sdf08-asdf",
								    "userID": "FOOBAR",
								    "longitude": "-94.492494",
								    "latitude": "37.132284",
								    "enabled": "true",
								    "expires": "123456870",
								    "timestamp": "1380933912",
								    "geohash": "9ysg1z8xjr3t",
								    "device_state": "2"
								  },
								  {
								    "appPackage": "com.test.app",
								    "device": "Nexus+7+v4.3",
								    "clientID": "09b8sdf98asd0f98-0as0a9sdf08-asdf",
								    "userID": "SMOKEY ROB",
								    "longitude": "-94.492494",
								    "latitude": "37.137284",
								    "enabled": "true",
								    "expires": "123456870",
								    "timestamp": "1381184796",
								    "geohash": "9ysg3b8sm798",
								    "eventName": "LOCATION",
								    "device_state": "1"
								  },
									{
								    "eventName": "Location",
								    "appPackage": "com.test.app",
								    "device": "Nexus+7+v4.3",
								    "clientID": "09b8sdfadsf98asd0f98-0as0a9sdf08-asd1",
								    "userID": "FOOBAR",
								    "longitude": "-94.492494",
								    "latitude": "37.132284",
								    "enabled": "true",
								    "expires": "123456870",
								    "timestamp": "1380933912",
								    "geohash": "9ysg1z8xjr3t",
								    "device_state": "2"
								  },
								  {
								    "appPackage": "com.test.app",
								    "device": "Nexus+7+v4.3",
								    "clientID": "09b8sdf98asd0f98-0as0a9sdf08-asd2",
								    "userID": "SMOKEY ROB",
								    "longitude": "-94.492494",
								    "latitude": "37.137284",
								    "enabled": "true",
								    "expires": "123456870",
								    "timestamp": "1381184796",
								    "geohash": "9ysg3b8sm798",
								    "eventName": "LOCATION",
								    "device_state": "1"
								  },
									{
								    "eventName": "Location",
								    "appPackage": "com.test.app",
								    "device": "Nexus+7+v4.3",
								    "clientID": "09b8sdfadsf98asd0f98-0as0a9sdf08-asd3",
								    "userID": "FOOBAR",
								    "longitude": "-94.492494",
								    "latitude": "37.132284",
								    "enabled": "true",
								    "expires": "123456870",
								    "timestamp": "1380933912",
								    "geohash": "9ysg1z8xjr3t",
								    "device_state": "2"
								  },
								  {
								    "appPackage": "com.test.app",
								    "device": "Nexus+7+v4.3",
								    "clientID": "09b8sdf98asd0f98-0as0a9sdf08-asd4",
								    "userID": "SMOKEY ROB",
								    "longitude": "-94.492494",
								    "latitude": "37.137284",
								    "enabled": "true",
								    "expires": "123456870",
								    "timestamp": "1381184796",
								    "geohash": "9ysg3b8sm798",
								    "eventName": "LOCATION",
								    "device_state": "1"
								  },
									{
								    "eventName": "Location",
								    "appPackage": "com.test.app",
								    "device": "Nexus+7+v4.3",
								    "clientID": "09b8sdfadsf98asd0f98-0as0a9sdf08-asd5",
								    "userID": "FOOBAR",
								    "longitude": "-94.492494",
								    "latitude": "37.132284",
								    "enabled": "true",
								    "expires": "123456870",
								    "timestamp": "1380933912",
								    "geohash": "9ysg1z8xjr3t",
								    "device_state": "2"
								  },
								  {
								    "appPackage": "com.test.app",
								    "device": "Nexus+7+v4.3",
								    "clientID": "09b8sdf98asd0f98-0as0a9sdf08-asdf",
								    "userID": "SMOKEY ROB",
								    "longitude": "-94.492494",
								    "latitude": "37.137284",
								    "enabled": "true",
								    "expires": "123456870",
								    "timestamp": "1381184796",
								    "geohash": "9ysg3b8sm798",
								    "eventName": "LOCATION",
								    "device_state": "1"
								  },
									{
								    "eventName": "Location",
								    "appPackage": "com.test.app",
								    "device": "Nexus+7+v4.3",
								    "clientID": "09b8sdfadsf98asd0f98-0as0a9sdf08-asd6",
								    "userID": "FOOBAR",
								    "longitude": "-94.492494",
								    "latitude": "37.132284",
								    "enabled": "true",
								    "expires": "123456870",
								    "timestamp": "1380933912",
								    "geohash": "9ysg1z8xjr3t",
								    "device_state": "2"
								  },
								  {
								    "appPackage": "com.test.app",
								    "device": "Nexus+7+v4.3",
								    "clientID": "09b8sdf98asd0f98-0as0a9sdf08-asd10",
								    "userID": "SMOKEY ROB",
								    "longitude": "-94.492494",
								    "latitude": "37.137284",
								    "enabled": "true",
								    "expires": "123456870",
								    "timestamp": "1381184796",
								    "geohash": "9ysg3b8sm798",
								    "eventName": "LOCATION",
								    "device_state": "1"
								  },
									{
								    "eventName": "Location",
								    "appPackage": "com.test.app",
								    "device": "Nexus+7+v4.3",
								    "clientID": "09b8sdfadsf98asd0f98-0as0a9sdf08-asdf11",
								    "userID": "FOOBAR",
								    "longitude": "-94.492494",
								    "latitude": "37.132284",
								    "enabled": "true",
								    "expires": "123456870",
								    "timestamp": "1380933912",
								    "geohash": "9ysg1z8xjr3t",
								    "device_state": "2"
								  },
								  {
								    "appPackage": "com.test.app",
								    "device": "Nexus+7+v4.3",
								    "clientID": "09b8sdf98asd0f98-0as0a9sdf08-asdf12",
								    "userID": "SMOKEY ROB",
								    "longitude": "-94.492494",
								    "latitude": "37.137284",
								    "enabled": "true",
								    "expires": "123456870",
								    "timestamp": "1381184796",
								    "geohash": "9ysg3b8sm798",
								    "eventName": "LOCATION",
								    "device_state": "1"
								  },
									{
								    "eventName": "Location",
								    "appPackage": "com.test.app",
								    "device": "Nexus+7+v4.3",
								    "clientID": "09b8sdfadsf98asd0f98-0as0a9sdf08-asdf113",
								    "userID": "FOOBAR",
								    "longitude": "-94.492494",
								    "latitude": "37.132284",
								    "enabled": "true",
								    "expires": "123456870",
								    "timestamp": "1380933912",
								    "geohash": "9ysg1z8xjr3t",
								    "device_state": "2"
								  },
								  {
								    "appPackage": "com.test.app",
								    "device": "Nexus+7+v4.3",
								    "clientID": "09b8sdf98asd0f98-0as0a9sdf08-asdf14",
								    "userID": "SMOKEY ROB",
								    "longitude": "-94.492494",
								    "latitude": "37.137284",
								    "enabled": "true",
								    "expires": "123456870",
								    "timestamp": "1381184796",
								    "geohash": "9ysg3b8sm798",
								    "eventName": "LOCATION",
								    "device_state": "1"
								  }
								];
								
								res.json(filtered);
								//res.json(test);
								
							} else {
								res.json([]);
							}
						});
						
					} else {
						res.json(devices);
					}
					
				});
			});
			
		});
	
	});
	
};