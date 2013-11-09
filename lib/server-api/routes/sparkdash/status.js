var path = require('path')
	, redis = require("redis")
	, Pusher = require('pusher')
	, Config = require('../../../../config');

	
var pusher = new Pusher({
  appId: '54725',
  key: '212c3181292b80f4e1a9',
  secret: '4857bb6a46e81f7e29c1'
});


var go = function(req,res,cb) {
	
	// Create Websocket Channel
	var WS_MainChannel = (req.body.appPackage) ? req.subdomain.id+'_'+req.body.appPackage : req.subdomain.id;
	var socketID = (req.body.socketID) ? req.body.socketID : false;
		
	var pushObj = {
		event:'status@main',
		payload:{
			clientID:req.body.clientID,
			data:req.body.event||{}
		}
	};
	
	cb(res,WS_MainChannel, pushObj, socketID);
	
};

var done = function(res,WS_MainChannel, pushObj, socketID) {
	pusher.trigger(WS_MainChannel, pushObj.event, pushObj.payload, socketID);
	res.json({status:200,'message':pushObj});
};

module.exports = function(app,App){
	
		app.post('/api/status', function(req, res){
			
			if (req.body) {
				
				// switch to the clientID database
				req.Redis.select(2, function() {
					
					// Verify clientID
					req.Redis.HGET(req.body.clientID, "clientID", function(_err,_device){
						// Kill
						if (!_device) { res.send({status:503,message:"Device not found: "+req.body.clientID}); return; }
						
						// Timestamp
						req.body.timestamp = Math.round(new Date().getTime() / 1000);
						
						// save
						req.Redis.HMSET(req.body.clientID, req.body, function(e,o) {
							if (e) { res.send({status:503,message:e}); return; }
							go(req,res,done);
						});
						
					});
					
				});
				
			}
			
		});
};