
var path = require('path')
	, http = require('http')
	, https = require("https")
	, bcrypt = require('bcrypt')
	, redis = require("redis")
	, express = require('express');


module.exports = function(app,App){
	
	/**
	*
	* Register
	*
	*/
	app.get("/register",function(req,res) {
		res.render('register_user', {domain:req.subdomain});
	});
	
  app.post("/register",function(req,res) {
	
		console.log(req.body);
		
		App.db.redis.users.select(App.config.databases['users'].name, function() {
			
			var username = req.body.user.username;
			var password = req.body.user.password;
			
			if (!username && !password) {
				console.log('missing credentials');
				return res.render('login', {'error': 'No user found'});
			}
			
			// Check if user exists
			App.db.redis.users.HEXISTS(username, "username",function(_err,_hexists){
				
				if (_hexists) {
					console.log('Error. User exists');
					res.render('register_user', {'error':'User already exists.'});
				} else {
					
					
					bcrypt.genSalt(10, function(err, salt) {
					    bcrypt.hash(password, salt, function(err, hash) {
								
								var obj = {
									username: username, 
									password: hash
								};
								
								App.db.redis.users.HMSET(username, obj, function(e,o) {
									if (e) { res.send(e); return; }

									console.log('Success!');
									res.render('register_user', {'success':'User created.'});
								});
								
					    });
					});
					
					
					
				}
			});
		});
	});

}