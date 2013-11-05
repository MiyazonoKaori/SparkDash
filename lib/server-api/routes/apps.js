var path = require('path')
	, http = require('http')
	, https = require('https')
	, querystring = require('querystring')
	, mongojs = require('mongojs')
	, bcrypt = require("bcrypt")
	, keygen = require('../keygen')
	, Pusher = require('pusher')
	, config = require('../../../config/app.json');
	
module.exports = function(app,App){
	
	var db = mongojs('sp', ['users','apps']);
	
	var pusher = new Pusher({
	  appId: '54725',
	  key: '212c3181292b80f4e1a9',
	  secret: '4857bb6a46e81f7e29c1'
	});
	
	app.post('/app/register', function(req, res){
				
		if (!req.body.appPackage && !req.body.token) {
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
							appPackage:req.body.appPackage,
							user_id:_user.username
						},function(err,obj){
							if (err) {
								return res.json({status:301,message:err});
							}
							if (!obj) {
								
								// set seed
								req.body.seed = (req.body.seed) ? req.body.seed : Math.random().toString(36).slice(2);
								req.body.expires = (req.body.expires) ? req.body.seed : 1411819932;
								
								// Check for domain
								var domain = (req.body.domain) ? req.body.domain : false;
								domain = (req.subdomain) ? req.subdomain.id : domain;
						
								if (!domain) {
									return res.json({status:301,message:'Missing domain property in the payload.'});
								}

								// Generate License Key
								var key = keygen.generateKeys({
									seed:req.body.seed,
									appPackage:req.body.appPackage,
									user_id:_user.username,
									domain:domain,
									level:_user.level,
									expires:req.body.expires
								},function(err,keys){
									
									var obj = {
										"access_token": keys.access_token,
										"current_version": "",
										"builds": [],
								    "expires": req.body.expires,
								    "key": keys.key,
										"seed":req.body.seed,
								    "appPackage": req.body.appPackage,
								    "appTitle": req.body.appTitle,
								    "user_id": _user.username
									};
									
									// Save App
									db.apps.save(obj);

									res.json({status:200,data:obj});

								});

							} else {
								console.log('appexists');
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
	
	app.post('/app/:_id/setbuild', function(req, res){

		// Save
		db.apps.findAndModify({
			query:{_id:mongojs.ObjectId(req.params._id)},
			update: { $set: { current_build:req.body.current_build}}
		},function(err,app){
			if (app) {
				res.json({'response':'ok'});
			} else {
				res.json({'response':'error','message':'No app found for '+req.params._id});
			}
		});
		
	});
	
	app.post('/app/:_id/createbuild', function(req, res){
				
		db.apps.findOne({_id:mongojs.ObjectId(req.params._id)},function(err,app){
			
			// req.body.data.appBuild
			// req.body.data.appPackage
			// req.body.data.buildURL
			
			// Append build to builds
			app.builds.push(req.body.data);
			
			// Save
			db.apps.findAndModify({
				query:{_id:app._id},
				update: { $set: { builds:app.builds}}
			},function(err,app){
				console.log(app);
				res.json({'response':'ok'});
			});
			
		});
		
	});
	
	app.post('/app/:_id/deletebuild', function(req, res){
		
		db.apps.findOne({_id:mongojs.ObjectId(req.params._id)},function(err,app){
			
			// req.body.data.appBuild
			// req.body.data.appPackage
			// req.body.data.buildURL
			
			// Remove build from builds
			for (x in app.builds) {
				if (app.builds[x].build == req.body.appBuild) {
					app.builds.splice(x, 1);
				}
			}
			
			// Save
			db.apps.findAndModify({
				query:{_id:app._id},
				update: { $set: { builds:app.builds}}
			},function(err,app){
				console.log(app);
				res.json({'response':'ok'});
			});
			
		});
		
	});
	
	app.post('/app/:_id/reset', function(req, res){
				
		db.apps.findOne({_id:mongojs.ObjectId(req.params._id)},function(err,app){
			
			// req.body.data.appBuild
			// req.body.data.appPackage
			// req.body.data.buildURL
			
			var WS_MainChannel = (app.appPackage) ? req.subdomain.id+'_'+app.appPackage : req.subdomain.id;

			var socketID = (req.body.socket_id) ? req.body.socket_id : false;
			
			var evt = 'reset@main';
			payload = {
				clientID: req.body.clientID
			};
			
			pusher.trigger(WS_MainChannel, evt, payload, socketID);
			if (config.log) {
				pusher.trigger(WS_MainChannel, 'log@main', {
					from:{},
					to:{
						event:evt,
						socketID:socketID,
						clientID: req.body.clientID,
						userID:req.body.userID
					},
					payload:payload
				});
			}
			
			res.json({'response':'ok'});
			
		});
		
	});
	
	app.post('/app/:_id/reauthenticate', function(req, res){
				
		db.apps.findOne({_id:mongojs.ObjectId(req.params._id)},function(err,app){
			
			// req.body.data.appBuild
			// req.body.data.appPackage
			// req.body.data.buildURL
			
			var WS_MainChannel = (app.appPackage) ? req.subdomain.id+'_'+app.appPackage : req.subdomain.id;

			var socketID = (req.body.socket_id) ? req.body.socket_id : false;
						
			var evt = 'reauthenticate@main';
			payload = {
				clientID: req.body.clientID
			};
			
			pusher.trigger(WS_MainChannel, evt, payload, socketID);
			if (config.log) {
				pusher.trigger(WS_MainChannel, 'log@main', {
					from:{},
					to:{
						event:evt,
						socketID:socketID,
						clientID: req.body.clientID,
						userID:req.body.userID
					},
					payload:payload
				});
			}
			
			res.json({'response':'ok'});
			
		});
		
	});
	
	
	app.post('/app/:_id/update', function(req, res){
		
		// get app info
		db.apps.findOne({_id:mongojs.ObjectId(req.params._id)},function(err,app){
			if (app) {
				
				var WS_MainChannel = (app.appPackage) ? req.subdomain.id+'_'+app.appPackage : req.subdomain.id;

				var socketID = (req.body.socket_id) ? req.body.socket_id : false;
				var payload = {};
				
				// Get build url
				var url = "?";
				for(var x in app.builds) {
					if (app.builds[x].build === app.current_build) {
						url = app.builds[x].url;
					}
				}
				
				if (req.body.type) {

					switch(req.body.type) {

						case 'current_build':

							evt = 'update@main';
							payload = {
								type:req.body.type,
								clientID: req.body.clientID,
								data:{
									'build':app.current_build,
									'url':url
								}
							};

							break;

						default:
							payload = {
								type:req.body.type,
								clientID: req.body.clientID
							};	
					}

					pusher.trigger(WS_MainChannel, evt, payload, socketID);
					if (config.log) {
						pusher.trigger(WS_MainChannel, 'log@main', {
							from:{},
							to:{
								event:evt,
								socketID:socketID,
								clientID: req.body.clientID,
								userID:req.body.userID
							},
							payload:payload
						});
					}
					
					res.json({'response':'ok'});

				} else {
					res.json({'response':'error','message':'Invalid type passed to update method.'});
				}
				
			} else {
				res.json({'response':'error','message':'Cannot find app for _id '+req.params._id});
			}
			
		});
		
	});	
		
	
	// Catcha all
	app.all('/app/:do', function(req, res){
		res.json({'response':'invalid verb. Use POST.'});
	});
	app.all('/app/:do/:something', function(req, res){
		res.json({'response':'invalid verb. Use POST.'});
	});
	
};