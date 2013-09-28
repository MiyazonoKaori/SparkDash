var path = require('path')
	, http = require('http')
	, https = require('https')
	, querystring = require('querystring')
	, mongojs = require('mongojs')
	, bcrypt = require("bcrypt")
	, config = require('../../../config/app.json');
	
module.exports = function(app,App){
	
	var db = mongojs('sp', ['users','domains']);
	
	app.post('/domain/register', function(req, res){

		console.log('ok');
		
		var token = req.body.token;
		var domain = req.body.domain;
		
		if (!domain && !token) {
			console.log('missing credentials');
			return res.json({'error': 'Missing credentails'});
		}
		
		// Verify domain 
		db.domains.findOne({domain:domain},function(err,dom){
			if (!dom) {
				
				// Validate session token
				App.db.redis.sessions.select(App.config.databases['sessions'].name, function() {
					App.db.redis.sessions.HEXISTS(token, "username",function(_err,valid){
						if (_err) {return res.render('login', {'error': _err.message});}
						if (valid) {
							
							// get user details
							App.db.redis.sessions.HGETALL(token, function(_err,obj){
								if (_err) {return res.render('login', {'error': _err.message});}
								
								// todo: Check username business status. See if they can add more domains
								if (true) {
									db.domains.save({
										username:obj.username,
										domain:domain
									});
									res.json(obj);
								} else {
									res.send('Please contact business to enable more domains for your account.');
								}
								
							});
							
						} else {
							res.send('Invalid token');
						}
					});
				});

			} else {
				res.json({message:'Domain is already registered.'});
			}

		});
				
	});
	
	
	// Catcha all
	app.all('/domain/:do', function(req, res){
		res.json({'response':'invalid verb. Use POST.'});
	});
	
};