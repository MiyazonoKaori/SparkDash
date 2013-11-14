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
	
	
	var doPOST = function(req,res,appPackage) {
		
		// Switch to Messages database
		req.Redis.select(3, function() {
				var evt;

				// Key requires Authorization string from header
				var key = req.headers.authorization + s4() + '-' + s4();
				
				req.body.timestamp = parseInt(Math.round(new Date().getTime() / 1000));

				// Save message to a redis SET with an expiration
				req.Redis.SETEX(key, 30, JSON.stringify(req.body), function(e,o){

					if (e) { res.send(e); return; }

					// Create Websocket Channel
					// Get the appPackage url on the message node
					var WS_MainChannel = (appPackage) ? req.subdomain.id+'_'+appPackage : req.subdomain.id;
					
					evt = 'message@main';
					
					// todo: Loop through each device
					// for(var x in req.body.devices) {}
					
					var devices = req.body.devices||[];
										
					var a1=[], a2=[], a3=[], d1=false, d2=false, d3=false;
					for(x in devices) {						
						d1 = (devices[x].hasOwnProperty('clientID')) ? a1.push(devices[x]) : false;
						d2 = (devices[x].hasOwnProperty('socketID')) ? a2.push(devices[x]) : false;
						d3 = (devices[x].hasOwnProperty('userID')) ? a3.push(devices[x]) : false;
					}
										
					var payload = {
						appPackage			: req.body.appPackage,
						appID						: req.body.appID,
						clientID				: (a1.length > 1) ? a1 : (a1[0])?[a1[0]]:[],
						socketID				: (a2.length > 1) ? a2 : (a2[0])?[a2[0]]:[],
						userID					: (a3.length > 1) ? a2 : (a3[0])?[a3[0]]:[],
						timestamp				: req.body.timestamp,
						data						: {
							message:req.body.message||'',
							nonce:req.body.nonce||''
						}
					};
															
					pusher.trigger(WS_MainChannel, evt, payload, false,function(){
						res.json({'status':200,'message':{'event':evt,'payload':payload}});
					});

				});
		
		});
		
	};
	
	
	
	app.post('/api/messages', function(req, res){
		// send a message to a specific packageName
		
		if (req.body) {
						
						
			if (!req.body.appPackage) {
				return res.json({'status':404,'message':"Missing an app package to validate."});
			}
			
			// Switch to domain/apps database
			req.Redis.select(0, function() {
				
				// Check if a appid exists
				req.Redis.HGET(req.subdomain.id+'-'+req.body.appPackage, "appPackage",function(_err,_appPackage) {
					
					if (!_appPackage) {
						console.log('App doesnt exist');
						return res.json({'status':404,'message':"App "+req.subdomain.id+'-'+req.body.appPackage+" doesn't exist. If you are sure this app exists, then the database is likely out of sync."});
					}
					
					doPOST(req,res,_appPackage);
					
				});
				
			});
			
		}	else {
			res.json({'status':404,'message':"Missing a payload."});
		}
		
	});
	
	
	
	app.post('/api/:_id/messages', function(req, res){
				
		if (req.body) {
						
			// Switch to domain/apps database
			req.Redis.select(0, function() {
				
				// Check if a appid exists
				req.Redis.HGET(req.subdomain.id+'-'+req.params._id, "appPackage", function(_err,_appPackage){
					
					if (!_appPackage) {
						console.log('App doesnt exist');
						return res.json({'status':404,'message':"App "+req.subdomain.id+'-'+req.params._id+" doesn't exist. If you are sure this app exists, then the database is likely out of sync."});
					}
					
					doPOST(req,res,_appPackage);
					
				});
				
			});
			
		} else {
			res.json({'status':404,'message':"Missing a payload."});
		}
		
	});
	
};