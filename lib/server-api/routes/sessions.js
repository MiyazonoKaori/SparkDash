var path = require('path')
	, http = require('http')
	, https = require('https')
	, mongojs = require('mongojs')
	, querystring = require('querystring');

function s4() {
  return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
};
	
module.exports = function(app,App){
	
	var db = mongojs(App.config.databases.mongo, ['apps']);
	
	// Generate new Auth token for a given app OID
	app.post('/session/generate', function(req, res){
		
		if (!req.body._id) {
			console.log('Invalid request parameters');
			return res.json({status:404,message:'Invalid request parameters'});
		}
		
		// Generate an SHA-1 hash on the token
		var new_token = s4()+s4()+s4()+s4()+s4()+s4();
		
		// Verify subdomain is registered, otherwise redirect to sign up page
		db.apps.findAndModify({
			query:{_id:mongojs.ObjectId(req.body._id)},
			update: { $set: { access_token:new_token } }
		},function(err,app){
			if (!app){ res.json({"access_token":'error'});}
			
			app.domain = req.subdomain.id;
						
			req.Redis.HMSET(new_token, app, function(e,o) {
				if (e) { return res.send(e); }
				
				// Delete old key
				req.Redis.HMSET(req.headers.authorization,function(){
					res.json({"access_token":new_token});
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