var path = require('path')
	, http = require('http')
	, https = require('https')
	, querystring = require('querystring')
	, mongojs = require('mongojs')
	, bcrypt = require("bcrypt")
	, keygen = require('../keygen')
	, config = require('../../../config/app.json');
	
module.exports = function(app,App){
	
	var db = mongojs('sp', ['users','apps']);
	
	app.post('/app/register', function(req, res){

		if (!req.body.package && !req.body.token) {
			console.log('Invalid request parameters');
			return res.json({status:404,message:'Invalid request parameters'});
		}
				
		// Validate session token
		App.db.redis.sessions.select(App.config.databases['sessions'].name, function() {
			App.db.redis.sessions.HEXISTS(req.body.token, "username",function(_err,valid){
				if (_err) {return res.render('login', {'error': _err.message});}
				if (valid) {
					
					// get user details
					App.db.redis.sessions.HGETALL(req.body.token, function(_err,_user){
						if (_err) {return res.render('login', {'error': _err.message});}
						
						// Check for dupes 
						db.apps.findOne({
							pkg:req.body.package,
							user_id:_user.username
						},function(err,obj){
							if (!obj) {

								// set seed
								req.body.seed = (req.body.seed) ? req.body.seed : Math.random().toString(36).slice(2);
								req.body.expires = (req.body.expires) ? req.body.seed : 1411819932;

								// Generate License Key
								var key = keygen.generateKeys({
									seed:req.body.seed,
									pkg:req.body.package,
									user_id:_user.username,
									domain:req.subdomain.id,
									level:_user.level,
									expires:req.body.expires
								},function(err,keys){
									
									var obj = {
										access_token: keys.access_token,
								    expires: req.body.expires,
								    key: keys.key,
										seed:req.body.seed,
								    pkg: req.body.package,
								    title: req.body.title,
								    user_id: _user.username
									};
									
									// Save App
									db.apps.save(obj);

									res.json({status:200,data:obj});

								});

							} else {
								res.json({status:301,message:'App is already registered.'});
							}

						});
						
					});
					
				} else {
					res.json({status:404,message:'App is already registered.'});
				}
			});
		});
				
	});
	
	app.post('/app/validate', function(req, res){
		res.json({'response':'ok'});
	});
	
	
	// Catcha all
	app.all('/app/:do', function(req, res){
		res.json({'response':'invalid verb. Use POST.'});
	});
	
};