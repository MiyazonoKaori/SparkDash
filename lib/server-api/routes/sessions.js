var path = require('path')
	, http = require('http')
	, https = require('https')
	, querystring = require('querystring');

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
};
	
module.exports = function(app,App){
		
	// Generate new Auth token for a given app OID
	app.post('/session/generate', function(req, res){
		
		if (!req.body._id) {
			return res.json({status:404,message:'Invalid request parameters'});
		}
		
		// Generate an SHA-1 hash on the token
		var new_token = s4()+s4()+s4()+s4()+s4()+s4();
		
		// Verify subdomain is registered, otherwise redirect to sign up page
		App.db.mongo.apps.findAndModify({
			query:{_id:App.db.mongo.ObjectId(req.body._id)},
			update: { $set: { access_token:new_token } }
		},function(err,app){
			if (!app){ res.json({"access_token":'error'});}
			
			app.domain = req.subdomain.id;
						
			req.Redis.HMSET(new_token, app, function(e,o) {
				if (e) { return res.send(e); }
				
				// Delete old key
				req.Redis.HMSET(req.headers.authorization,function(){
					res.json({'status':200,'message':{"access_token":new_token}});
				});
			
			});
			
		});
		
	});

	app.post('/session/validate', function(req, res){
		res.json({'response':'ok'});
	});
	
	// Catcha all
	app.all('/session/:do', function(req, res){
		res.json({'response':'invalid verb. Use POST.'});
	});
};