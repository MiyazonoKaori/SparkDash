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
	
	var db = mongojs('sp', ['users','domains']);
		
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
	
		// Select devices db
		Redis.select(1, function() {
			
			var devices = [];
			
			// Get all KEYS
			Redis.KEYS("*", function(e,o) {
				
				var multi = Redis.multi();
				
				for(key in o) {
					multi.hgetall(o[key]);
				}
				
				multi.exec(function (err, replies) {
					res.json(replies);
				});
			});
			
		});
	
	});
	
	app.post('/api/sparkdash/beacon', function(req, res){
		
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
		
		res.header('Access-Control-Allow-Origin', '*');
	  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	  res.header('Access-Control-Allow-Headers', 'Content-Type');
		
		if (req.body) {
			
			Redis.select(2, function() {
				
				// Check if it's a new clientID
				Redis.HEXISTS(req.body.clientID, "clientID",function(_err,_hexists){
					
					// Create timestamp
					req.body.timestamp = Math.round(new Date().getTime() / 1000);
					
					// Create geohash for filtering
					// see https://www.firebase.com/blog/2013-09-25-location-queries-geofire.html
					
					req.body.geohash = geohash.GeoHash.encodeGeoHash(req.body.latitude, req.body.longitude);
					
					// save/update clientID
					Redis.HMSET(req.body.clientID, req.body, function(e,o) {
						if (e) { request.reply(e); return; }

						// Expiration
						if (req.body.expiration) {
							Redis.expire(req.body.clientID, req.body.expiration);
						}
						
						
						if (_hexists) {
							// clientID exists

							// Broadcast websocket
							pusher.trigger('sparkdash-dash', 'update_client', {
								clientID: req.body.clientID,
								enabled:req.body.enabled,
								latitude: req.body.latitude, 
								longitude: req.body.longitude,
								timestamp: req.body.timestamp
							});

						} else {
							// New clientID

							// Broadcast websocket
							pusher.trigger('sparkdash-dash', 'new_client', {
								clientID: req.body.clientID,
								enabled:req.body.enabled,
								latitude: req.body.latitude, 
								longitude: req.body.longitude,
								timestamp: req.body.timestamp
							});

						}
						
						res.json({'response':'ok'});
					});
					
				});
				
			});
			
			
		}
		
	});
	
	app.get('/api/sparkdash', function(req, res) {
		console.log(req.subdomain);
		res.send({message:'SparkDash API'});
	
	});

	// Catcha all
	app.all('/api/sparkdash/:do/:something', function(req, res){
		res.json({'response':'invalid verb. Use POST.'});
	});
};