var path = require('path')
	, http = require('http')
	, https = require('https')
	, querystring = require('querystring')
	, mongojs = require('mongojs')
	, bcrypt = require("bcrypt")
	, Pusher = require('pusher')
	, geohash = require('geohash');

module.exports = function(app,App){
	
	var db = mongojs(App.config.databases.mongo, ['users','domains']);
	
	var pusher = new Pusher({
	  appId: '54725',
	  key: '212c3181292b80f4e1a9',
	  secret: '4857bb6a46e81f7e29c1'
	});
	
	// 	req contains additional properties:
	// 		- req.subdomain.id = 'acme'
	
	function s4() {
	  return Math.floor((1 + Math.random()) * 0x10000)
	             .toString(16)
	             .substring(1);
	};
	
	app.post('/api/messages', function(req, res){
		// send a message to a specific packageName
		
		var WS_MainChannel = (req.body.appPackage) ? req.subdomain.id+'_'+req.body.appPackage : req.subdomain.id;
		res.json({'status':200,'data':'ok','message':{'event':"",'payload':""}});
		
	});
	
	app.post('/api/:_id/messages', function(req, res){
		
		if (req.body) {
						
			// Switch to Messages database
			req.Redis.select(3, function() {
				
				
				// Check if a clientID exists
				req.Redis.HGET(req.body.clientID, "timestamp",function(_err,_keyTimestamp){
					
					var evt;
					
					// Set keystamp
					if (!_keyTimestamp) { _keyTimestamp = 0; }
					
					// Key requires Authorization string from header
					var key = req.headers.authorization + s4() + '-' + s4();
					
					// Save message to a redis SET with an expiration
					req.Redis.SETEX(key, 30, JSON.stringify(req.body), function(e,o){
						
						if (e) { res.send(e); return; }

						// Create Websocket Channel
						// Get the appPackage url
						var WS_MainChannel = (req.body.appPackage) ? req.subdomain.id+'_'+req.body.appPackage : req.subdomain.id;
						var socketID = (req.body.socket_id) ? req.body.socket_id : false;

						// Expiration
						if (req.body.expiration) {
							req.Redis.expire(req.body.clientID, req.body.expiration);
						}

						evt = 'message@main';
						
						console.log(WS_MainChannel);
						

						pusher.trigger(WS_MainChannel, evt, {
							clientID: req.body.clientID,
							userID:req.body.userID,
							data:req.body.data
						},socketID);

						if (App.config.log) {
							pusher.trigger(WS_MainChannel, 'log@main', {
								from:{},
								to:{
									event:evt,
									clientID: req.body.clientID,
									userID:req.body.userID
								}
							});
						}
						
						res.json({'status':200,'message':{'event':evt,'payload':req.body.data}});
					
					});
					
				});
				
				
			});
			
			
		}
		
	});
	
};