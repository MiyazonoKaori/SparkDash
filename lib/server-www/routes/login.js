
var path = require('path')
	, http = require('http')
	, https = require("https")
	, redis = require("redis")
	, bcrypt = require("bcrypt")
	, mongojs = require('mongojs')
	, util = require("../util")
	, express = require('express');


module.exports = function(app,App){
	
		var db = mongojs('sp', ['users','domains']);
		
		/**
		*
		* Login
		*
		*/
    app.get('/login', function(req, res) {
			
			if(req.headers.host=="127.0.0.1:4001" || req.headers.host=="localhost:4001") {
				req.headers.host = 'empire';
			}
			console.log(req.headers);
			// Verify subdomain is registered, otherwise redirect to sign up page
			db.domains.findOne({domain:req.headers.host},function(err,domain){
				
				console.log(domain);
				
				if (domain) {
									
					// Validate session token
					if (req.session.token) {
						
						App.db.redis.sessions.select(App.config.databases['sessions'].name, function() {

							App.db.redis.sessions.HEXISTS(req.session.token.key, "username",function(_err,_hexists){
								if (_err) {return res.render('login', {'error': _err.message});}
								
								if (_hexists) {
									if (_hexists.domain == req.headers.host) {
										res.redirect('/');
									} else {
										res.send('Unauthorized access to this domain. Please contact the administrator.');
									}
								} else {
									res.render('login', {});
								}
							});
						});
					} else {
						res.render('login', {});
					}
					
				} else {
					res.render('register_domain', {});
				}
			});
	
    });



		app.post("/login",function(req,res) {
			
			var proceed = false;
			var username = req.body.user.username;
			var password = req.body.user.password;			
			
			if (!username && !password) {
				return res.render('login', {'error': 'Missing username or password'});
			}
			
			if(req.headers.host=="127.0.0.1:4001" || req.headers.host=="localhost:4001") {
				req.headers.host = 'empire';
			}
			
			// Verify subdomain is registered, otherwise redirect to sign up page
			db.domains.findOne({domain:req.headers.host},function(err,domain){
				if (domain) {
					
					// Verify user 
					db.users.findOne({username:username},function(err,user){
						if (user) {
							
							// Check if user has access to this domain
							for(x in user.domains) {
								if (user.domains[x] == req.headers.host) {
									proceed = true;
								}
							}

							// Check if domain is accessible
							if (proceed) {

								// Check password
								bcrypt.compare(password, user.password, function(_err, _res) {

									if (_res) {

										// Save Access Token
										App.db.redis.sessions.select(App.config.databases['sessions'].name, function(){

											// Create token and session data
											var token = util.generateKeypair(user.username, user.password);
											var vals = {
												"username":username, // enforce string
												"role_level":'10'
											};

											var ttl_seconds = App.config.users.registered.ttl;

											App.db.redis.sessions.HMSET(token.key, vals, function(e0,o0) {
												App.db.redis.sessions.expire(token.key, ttl_seconds);
												if (e0) {
													console.log(e0);
													res.render('login', {'error': e0.message});
												} else {								
													req.session.token = token;								
													console.log('Redirecting back to /');
													res.redirect('/');
												}
											});

										});

									} else {
										return res.render('login', {'error': 'Invalid Password. Try again.'});
									}

								});

							} else {
								res.send('Unauthorized access to this domain. Please contact the administrator.');
							}

						} else {
							res.render('login', {'error': 'User is not registered.'});
						}

					});
					
				} else {
					res.render('register_domain', {});
				}
			});
			
		});

		// 
		// app.post("/login",function(req,res) {
		// 	
		// 	// you may need to use req.param() for multipart requests
		// 	/*
		// 	var username = req.param('username');
		// 	var password = req.param('password');
		// 	*/
		// 	
		// 	var username = req.body.user.name;
		// 	var password = req.body.user.password;
		// 	
		// 	console.log('U:'+username+', P:'+password);
		// 	
		// 	if (!username && !password) {
		// 		console.log('missing params');
		// 		res.render('login', {'error': 'No user found'});
		// 	}
		// 	
		// 	// Look up user
		// 	MongoDB(function(db){
		// 
		// 		db.collection('accounts', function(error, collection) {
		// 
		// 			collection.findOne({username:username}, function(e, o) {
		// 				
		// 				if (o == null){
		// 					console.log('No user found');
		// 					res.render('login', {'error': 'No user found'});
		// 				}	else{
		// 					
		// 					bcrypt.compare(password, o.password, function(_err, _res) {	
		// 						if (_res){
		// 							
		// 							console.log('User is authenticated');
		// 							
		// 							// Create Access Token
		// 							var token = util.generateKeypair(o.username, o.password);
		// 
		// 							// Create token meta
		// 							var vals = {
		// 								userid:o.userid.toString(), // enforce string
		// 								handle:o.handle
		// 							};
		// 
		// 							console.log('Created auth_token: '+token.key);
		// 							console.log(vals);
		// 
		// 							var ttl_seconds = App.config.users.registered.ttl;
		// 							
		// 							// Save Access Token
		// 							var sessions = redis.createClient(App.config.databases['redis-users'].port,App.config.databases['redis-users'].host);
		// 							sessions.select(App.config.databases['redis-users'].name);
		// 							sessions.HMSET(token.key, vals, function(e0,o0) {
		// 								sessions.expire(token.key, ttl_seconds);
		// 								sessions.quit();
		// 								if (e0) {
		// 									console.log(e0);
		// 									res.send(e0);
		// 								} else {								
		// 									req.session.token = token.key;								
		// 									console.log('Redirecting back to /');
		// 									res.redirect('/session#load/'+Math.random()*10000000000000000000);
		// 								}
		// 							});
		// 							
		// 							
		// 						}	else{
		// 							res.render('login', {'auth': auth, 'post': post});	
		// 						}
		// 					});
		// 				}
		// 			});
		// 			
		// 		});
		// 		
		// 	});
		// 	
		// });

}