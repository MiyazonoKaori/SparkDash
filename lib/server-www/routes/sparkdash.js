var path = require('path')
	, mongojs = require('mongojs')
	, http = require('http')
	, https = require('https')
	, mongojs = require('mongojs')
	, url = require('url');
	
module.exports = function(app, App){
	
	var db = mongojs(App.config.databases.mongo, ['apps']);
	
	app.get('/:_id/sparkdash', function(req, res){
		
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
								res.render('sparkdash/dash', {'app_name':'SparkDash', 'app':_app, 'domain':req.subdomain.id, 'ws':{'channel':req.subdomain.id+'_'+_app.appPackage}}); 
								
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