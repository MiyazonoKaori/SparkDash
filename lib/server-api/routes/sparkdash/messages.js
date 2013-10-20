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
	// 		- req.subdomain.id = 'acme'

	app.post('/api/messages', function(req, res){
		
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
		
		if (req.body) {
			
			// Switch to clientID database
			Redis.select(2, function() {
				
				// Check if a clientID exists
				Redis.HGET(req.body.clientID, "timestamp",function(_err,_keyTimestamp){
					
					var evt;
					
					// Set keystamp
					if (!_keyTimestamp) { _keyTimestamp = 0; }
					
					// save/update clientID
					Redis.HMSET(req.body.clientID, req.body, function(e,o) {
						if (e) { res.send(e); return; }

						// Create Websocket Channel
						var WS_MainChannel = (req.body.appPackage) ? req.subdomain.id+'_'+req.body.appPackage : req.subdomain.id;
						var socketID = (req.body.socket_id) ? req.body.socket_id : false;

						// Expiration
						if (req.body.expiration) {
							Redis.expire(req.body.clientID, req.body.expiration);
						}
						
						evt = 'message@main';
						
						pusher.trigger(WS_MainChannel, evt, {
							clientID: req.body.clientID,
							userID:req.body.userID,
							data:{}
						},socketID);
						
						pusher.trigger(WS_MainChannel, 'log@main', {
							from:{},
							to:{
								event:evt,
								clientID: req.body.clientID,
								userID:req.body.userID
							}
						});
						
						res.json({'response':'ok'});
					});
				});
				
				
			});
			
			
		}
		
	});
	
};