var path = require('path')
	, http = require('http')
	, https = require('https')
	, querystring = require('querystring')
	, config = require('../../../config/app.json');
	
module.exports = function(app,App){

	app.post('/validate/user/name', function(req, res){
		res.json({'response':'ok'});
	});
	
	app.post('/validate/spark/token', function(req, res){
		res.json({'response':'ok'});
	});
	
	app.post('/validate/spark/key', function(req, res){

		if (req.body) {
			
			App.db.redis.devices.select(config.databases['redis-devices'].name, function() {
				
				// Check if it's a new clientID
				App.db.redis.devices.HEXISTS(req.body.clientID, "clientID",function(_err,_hexists){
					
					// Create timestamp
					req.body.timestamp = Math.round(new Date().getTime() / 1000);
					
					// save/update clientID
					App.db.redis.devices.HMSET(req.body.clientID, req.body, function(e,o) {
						if (e) { request.reply(e); return; }

						// Expiration
						if (req.body.expiration) {
							App.db.redis.devices.expire(req.body.clientID, req.body.expiration);
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
	
	
	app.get('/health', function(req, res){
	  res.send({
	    pid: process.pid,
	    memory: process.memoryUsage(),
	    uptime: process.uptime()
	  })
	})
	
};