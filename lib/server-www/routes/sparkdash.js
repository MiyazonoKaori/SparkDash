var path = require('path')
	, mongojs = require('mongojs')
	, http = require('http')
	, https = require('https');
	
module.exports = function(app, App){
	
	
	app.get('/sparkdash', function(req, res){
		
		var db = mongojs('sp', ['apps']);

		res.header('Access-Control-Allow-Origin', '*');
	  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	  res.header('Access-Control-Allow-Headers', 'Content-Type');

		var message = '';
				
		// Validate session token
		if (req.session.token) {
			
			App.db.redis.sessions.select(App.config.databases['sessions'].name, function() {
				
				App.db.redis.sessions.HEXISTS(req.session.token.key, "username",function(_err,_hexists){
					if (_err) {return res.render('login', {'error': _err.message});}
					
					if (_hexists) {
						
						// Get user
						App.db.redis.sessions.HGETALL(req.session.token.key, function(_err,obj){
							if (_err) {return res.render('login', {'error': _err.message});}
							
							var apps = [];
							// Get apps for given user
							db.apps.find({user_id:obj.username}).forEach(function(err, doc) {
								if (!doc) { 
									console.log(apps); 
									res.render('sparkdash/dash', {'app_name':'SparkDash', 'message': message}); 
								}
								apps.push(doc);
							});
							
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