var path = require('path')
	, http = require('http')
	, https = require('https')
	, querystring = require('querystring')
	, bcrypt = require("bcrypt");
	
module.exports = function(app,App){
		
	app.post('/domain/register', function(req, res){
		
		if (!req.body.id && !req.body.token) {
			console.log('missing credentials');
			return res.json({'error': 'Missing credentails'});
		}
		
		// Verify domain 
		App.db.mongo.domains.findOne({id:req.body.id},function(err,dom){
			if (!dom) {
				
				// Validate session token
				App.db.redis.sessions.select(App.config.databases['sessions'].name, function() {
					App.db.redis.sessions.HEXISTS(req.body.token, "username",function(_err,valid){
						if (_err) {return res.render('login', {'error': _err.message});}
						if (valid) {
							
							// get user details
							App.db.redis.sessions.HGETALL(req.body.token, function(_err,obj){
								if (_err) {return res.render('login', {'error': _err.message});}
								
								// todo: Check username business status. See if they can add more domains
								if (true) {
									App.db.mongo.domains.save({
										username:obj.username,
										id:req.body.id,
										title:req.body.title,
										logo:req.body.logo,
										icon:req.body.icon,
										favicon:req.body.favicon,
										database: {
								        engine: "redis",
								        port: 6380,
								        host: "127.0.0.1",
								        pass: "blahblahblah"
								    }
									});
									res.json({'status':200,'message':obj});
								} else {
									res.json({'status':200,'message':'Please contact business to enable more domains for your account.'});
								}
								
							});
							
						} else {
							res.json({'status':501,'message':'Invalid token'});
						}
					});
				});

			} else {
				res.json({'status':300,'message':'Domain is already registered.'});
			}

		});
				
	});
	
	
	// Catcha all
	app.all('/domain/:do', function(req, res){
		res.json({'status':200,'message':'invalid verb. Use POST.'});
	});
	
};