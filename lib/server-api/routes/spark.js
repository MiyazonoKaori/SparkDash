var path = require('path')
	, http = require('http')
	, https = require('https')
	, querystring = require('querystring')
	, keygen = require('../keygen')
	, config = require('../../../config/app.json');
	
module.exports = function(app,App){
	
	app.post('/spark/validate/token', function(req, res){
		res.json({'response':'ok'});
	});
	
	app.post('/spark/validate/key', function(req, res){

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
		
	app.post('/spark/generate/token', function(req, res){
				
		keygen.generate({
			seed:req.body.seed,
			user:req.body.user,
			pkg:req.body.pkg,
			timestamp:req.body.timestamp,
			level:req.body.level
		},function(obj){
			
			if (obj) {
				res.json(obj);
			} else {
				res.send(404,{'response':'Error','message':'Invalid parameters.'});
			}
			
		});

	});
	
	app.post('/spark/generate/key', function(req, res){
		res.json({'response':'ok'});
	});


	// Catcha all
	app.all('/spark/:do/:something', function(req, res){
		res.json({'response':'invalid verb. Use POST.'});
	});
};