var path = require('path')
	, http = require('http')
	, https = require('https')
	, querystring = require('querystring')
	, mongojs = require('mongojs')
	, bcrypt = require("bcrypt")
	, config = require('../../../config/app.json');
	
module.exports = function(app,App){
	
	var db = mongojs('sp', ['users']);
	
	app.post('/user/register', function(req, res){
		
		var username = req.body.username;
		var password = req.body.password;
		
		if (!username && !password) {
			console.log('missing credentials');
			return res.json({'error': 'No user found'});
		}
		
		// Verify user 
		db.users.findOne({username:req.body.username},function(err,user){
			if (!user) {
				
				bcrypt.genSalt(10, function(err, salt) {
				    bcrypt.hash(req.body.password, salt, function(err, hash) {
							
							db.users.save({
								username:username,
								password:hash,
								type:0,
							 	level:10,
								company:'Semantic Press',
								verified:false,
								secret:'thisisatestoftheemergencybroadcastsystem'
							});

							res.json({'response':'User created.'});
							
				    });
				});

			} else {
				res.json({message:'User is already registered.'});
			}

		});
				
	});
	
	app.post('/user/validate/name', function(req, res){
		res.json({'response':'ok'});
	});
	
	
	// Catcha all
	app.all('/user/:do/:something', function(req, res){
		res.json({'response':'invalid verb. Use POST.'});
	});
	
};