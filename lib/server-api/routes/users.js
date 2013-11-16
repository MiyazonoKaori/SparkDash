var path = require('path')
	, http = require('http')
	, https = require('https')
	, querystring = require('querystring')
	, bcrypt = require("bcrypt");
	
module.exports = function(app,App){
		
	app.post('/user/register', function(req, res){
		
		var username = req.body.username;
		var password = req.body.password;
		
		if (!username && !password) {
			console.log('missing credentials');
			return res.json({'status':404,'message': 'No user found'});
		}
		
		// Verify user 
		App.db.mongo.users.findOne({username:req.body.username},function(err,user){
			if (!user) {
				
				bcrypt.genSalt(10, function(err, salt) {
				    bcrypt.hash(req.body.password, salt, function(err, hash) {
							
							App.db.mongo.users.save({
								username:username,
								password:hash,
								type:0, // dev, pro
							 	level:10,
								domains:req.body.domains,
								name:(req.body.name) ? req.body.name : '',
								company:(req.body.company) ? req.body.name : '',
								verified:false,
								secret:(req.body.secret) ? req.body.secret : 'thisisatestoftheemergencybroadcastsystem',
							});

							res.json({'status':200,'message':'User created.'});
							
				    });
				});

			} else {
				res.json({'status':200,'message':'User is already registered.'});
			}

		});
				
	});
	
	app.post('/user/validate/name', function(req, res){
		res.json({'status':200,'message':'ok'});
	});
	
	
	// Catcha all
	app.all('/user/:do/:something', function(req, res){
		res.json({'status':200,'message':'invalid verb. Use POST.'});
	});
	
};