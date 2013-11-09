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
	pusher.trigger(WS_MainChannel, pushObj.event, pushObj.payload, socketID, function(){
		res.json({status:200,'message':pushObj});
	});
};

module.exports = function(app,App){
	
		app.post('/api/status', function(req, res){
			
			if (req.body) {
				
				// switch to the clientID database
				req.Redis.select(4, function() {
					
					// Verify clientID
					// Timestamp
					req.body.event.timestamp = Math.round(new Date().getTime() / 1000);
					
					var event = req.body.event;
					event.data = JSON.stringify(req.body.event);
					
					// save
					req.Redis.HMSET(req.body.appPackage+'-'+req.body.clientID, event, function(e,o) {
						if (e) { res.send({status:503,message:e.message}); return; }
						go(req,res,done);
					});
					
				});
				
			}
			
		});
};