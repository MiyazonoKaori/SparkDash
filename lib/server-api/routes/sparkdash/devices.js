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
		Redis.select(2, function() {
			
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
	
};