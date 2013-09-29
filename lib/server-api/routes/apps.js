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
			console.log('missing credentials');
			return res.json({'error': 'No app found'});
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
									level:_user.level,
									expires:req.body.expires
								},function(err,keys){

									// Save App
									db.apps.save({
										access_token: keys.access_token,
								    expires: req.body.expires,
								    key: keys.key,
										seed:req.body.seed,
								    pkg: req.body.package,
								    title: req.body.title,
								    user_id: _user.username
									});

									res.json({'response':'App created.'});

								});

							} else {
								res.json({message:'App is already registered.'});
							}

						});
						
					});
					
				} else {
					res.send('Invalid token');
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