var path = require('path')
	, http = require('http')
	, https = require('https')
	, url = require('url');
	
module.exports = function(app, App){
		
	app.get('/:_id/d/:_clientID', function(req, res){
		
		res.header('Access-Control-Allow-Origin', '*');
	  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	  res.header('Access-Control-Allow-Headers', 'Content-Type');
		
		// Verify session token exists
		if (req.session.token) {
			
			// Check if id is a valid Mongo _id using hex / byte length of 12
			if (Buffer.byteLength(req.params._id, 'utf8') == 12 || req.params._id.length == 24) {
				// Look up app						
				App.db.mongo.apps.findOne({_id:App.db.mongo.ObjectId(req.params._id)},function(_err,_app){
					if (_err) {
						console.log(_err);
						return res.redirect('/login');
					}
					if (_app) {
						// Get all devices for app
						
						var device = false;
						var str = '';
						// Proxy request to API server
						var request = http.request({
						    	port: 3001,
						    	hostname: '127.0.0.1',
						    	method: 'GET',
									headers:{'Authorization':'test'},
						    	path: '/api/devices?app_oid='+req.params._id+'&clientID='+req.params._clientID
								}, function(__res){
								  __res.on('data', function (chunk) {
								    str += chunk;
								  });
								  __res.on('end', function () { 
										device = JSON.parse(str);
										str = null;
										if (req.headers['x-requested-with'] == 'XMLHttpRequest') {
											res.json({'status':device.status, 'message':device.message[0]}); 
										} else {
											res.render('device', {'app':_app, 'domain':req.subdomain, 'device':device.message[0], 'ws':{'channel':req.subdomain.id+'_'+_app.appPackage}});
										}
										devices = null;
								  });
								}
						);
						request.end();
						
					} else {
						
						res.send('Valid ID, but no app found for '+req.params._id);
						
					}
				});
			} else {
				res.redirect('/apps');
			}
			
		} else {
			res.redirect('/login');
		}
		
	});
	
};