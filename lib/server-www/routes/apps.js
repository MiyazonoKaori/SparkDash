var path = require('path')
	, http = require('http')
	, https = require('https')
	, querystring = require('querystring')
	, config = require('../../../config/app.json');	
module.exports = function(app,App){
		
	// Static Files
	app.get('/apps', function(req, res){

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
						res.render('apps', {'app_name':'SP Dashboard', 'message': message});
					} else {
						res.render('login', {});
					}
				});
			});
		} else {
			res.redirect('/login');
		}
		
		console.log('check user auth..');
		
	});	
	
};