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

	app.get('/api/sparkdash/devices', function(req, res){
		res.header('Access-Control-Allow-Origin', '*');
	  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	  res.header('Access-Control-Allow-Headers', 'Content-Type');
		
		var Redis = redis.createClient(
			req.subdomain.database.port, 
			req.subdomain.database.host
		);
		Redis.on("error", function (err) {
			if (err.message.indexOf("ECONNREFUSED") > 0) {
				console.log('Connection refused. Redis is not running: '+req.subdomain.database.host+':'+req.subdomain.database.port);
				res.send('Connection refused. Database is not running.');
				process.exit();
			} else {
				console.log("Error " + err.message);
				res.send(err.message);
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
								devices.map(function(d){
									if(d.appPackage == app.pkg) {
										filtered.push(d);
									}
								});
								
								res.json(filtered);
								
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