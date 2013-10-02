var path = require('path')
	, mongojs = require('mongojs')
	, http = require('http')
	, https = require('https')
	, mongojs = require('mongojs')
	, url = require('url');
	
module.exports = function(app, App){
	
	var db = mongojs('sp', ['apps']);
	
	app.get('/sparkdash/:_id', function(req, res){
		
		res.header('Access-Control-Allow-Origin', '*');
	  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	  res.header('Access-Control-Allow-Headers', 'Content-Type');
		
		// Validate session token
		if (req.session.token) {
			
			App.db.redis.sessions.select(App.config.databases['sessions'].name, function() {
				
				App.db.redis.sessions.HEXISTS(req.session.token.key, "username",function(_err,_hexists){
					if (_err) {return res.render('login', {'error': _err.message});}
					
					if (_hexists) {
						
						// Look up app						
						db.apps.findOne({_id:mongojs.ObjectId(req.params._id)},function(_err,_app){
							if (_err) {
								console.log(_err);
								return res.render('login');
							}
							if (_app) {
								
								// Get user
								App.db.redis.sessions.HGETALL(req.session.token.key, function(__err,_user){
									if (__err) {return res.render('login', {'error': __err.message});}

									var apps = [];
									// Get apps for given user
									db.apps.find({user_id:_user.username}).forEach(function(___err, ___doc) {
										if (!___doc) {
											res.render('sparkdash/dash', {'app_name':'SparkDash', 'apps':apps, 'ws':{'channel':req.subdomain.id+'_'+_app.pkg}}); 
										}
										apps.push(___doc);
									});
									
								});
								
							} else {
								console.log('No app found for '+req.params._id);
								res.send('No app found');
							}
						});
						
					} else {
						res.render('login', {});
					}
				});
			});
		} else {
			res.redirect('/login');
		}
		
	});
	
};