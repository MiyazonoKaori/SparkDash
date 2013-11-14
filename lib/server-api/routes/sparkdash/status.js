var path = require('path')
	, redis = require("redis")
	, Pusher = require('pusher')
	, Config = require('../../../../config');

	
var pusher = new Pusher({
  appId: '54725',
  key: '212c3181292b80f4e1a9',
  secret: '4857bb6a46e81f7e29c1'
});


var goPOST = function(req,res,cb) {
	
	// Create Websocket Channel
	var WS_MainChannel = (req.body.appPackage) ? req.subdomain.id+'_'+req.body.appPackage : req.subdomain.id;
	var socketID = (req.body.socketID) ? req.body.socketID : false;
	
	var pushObj = {
		event:'status@main',
		payload:{
			clientID:req.body.clientID,
			data: {
				status:req.body.event||{}
			}
		}
	};
	
	// Parse out data node
	if (typeof pushObj.payload.data.status.data == "string") {
		pushObj.payload.data.status.data  = JSON.parse(pushObj.payload.data.status.data);
	}
	
	cb(res,WS_MainChannel, pushObj, socketID);
	
};
var donePOST = function(res,WS_MainChannel, pushObj, socketID) {
	pusher.trigger(WS_MainChannel, pushObj.event, pushObj.payload, socketID, function(){
		res.json({status:200,'message':pushObj});
	});
};

var goGET = function(appPackage,req,res,cb) {
	// switch to the clientID database
	req.Redis.select(4, function() {
		
		//console.log('Looking up status for: '+appPackage+'-'+req.params._clientID);

		req.Redis.HGETALL(appPackage+'-'+req.params._clientID, function(e,o) {
			if (e) { res.send({status:503,message:e.message}); return; }

			var status = {
				clientID: req.params._clientID,
				data:o
			};
			if (o.data) {
				status.data.data = JSON.parse(o.data);
			}
			
			res.send({status:200,message:status});
		});
	});
};

module.exports = function(app,App){
		
		app.get('/api/:_clientID/status', function(req, res){
			
			if (req.query.app_oid) { 
				// Look up appPackage from db
				req.Redis.select(0, function() {
					//console.log('Using app_oid. Looking up appPackage for '+req.subdomain.id+'-'+req.query.app_oid);	
					req.Redis.HGET(req.subdomain.id+'-'+req.query.app_oid,'appPackage',function(e,appPackage){
						if (e) { res.send({status:503,message:e.message}); return; }
						if (!appPackage) {
							res.send({status:404,message:'Cannot find the appPackage for '+req.subdomain.id+'-'+req.query.app_oid})
						} else {
							goGET(appPackage,req,res);
						}
					});
				});
			} else {
				goGET(req.query.appPackage,req,res);
			}
		});
		
		
		app.post('/api/status', function(req, res){
			
			if (req.body) {
				
				// Timestamp
				req.body.event.timestamp = Math.round(new Date().getTime() / 1000);
				
				// switch to the clientID database
				req.Redis.select(2, function() {
					
					// Check if the clientID exists?
					req.Redis.HGET(req.body.clientID, "data",function(_err,_data){
						if (_err) { res.send({status:503,message:e.message}); return; }
						
						if (!_data) {
							res.json({status:404,'message':'ClientID does not exist'});
						} else {
							
							// parse existing data object
							var d = JSON.parse(_data);
							
							// add status to existing data object
							d.status = req.body.event;

							// save/update status ID 
							req.Redis.HMSET(req.body.clientID, {data:JSON.stringify(d)}, function(e,o) {
								if (e) { res.send({status:503,message:e.message}); return; }
								
								// switch to the clientID database
								req.Redis.select(4, function() {
									
									// save
									req.Redis.HMSET(req.body.appPackage+'-'+req.body.clientID, req.body.event, function(e,o) {
										if (e) { res.send({status:503,message:e.message}); return; }
										goPOST(req,res,donePOST);
									});

								});

							});
							
						}
					});
					
				});
				
			}
			
		});
};