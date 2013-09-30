var path = require('path')
	, http = require('http')
	, https = require('https')
	, querystring = require('querystring')
	, mongojs = require('mongojs')
	, config = require('../../../config/app.json');	
	
module.exports = function(app,App){
	
	var db = mongojs('sp', ['users','domains']);
		
	// Static Files
	app.get('/', function(req, res){
		
		res.header('Access-Control-Allow-Origin', '*');
	  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	  res.header('Access-Control-Allow-Headers', 'Content-Type');

		// Validate session token
		if (req.session.token) {

			App.db.redis.sessions.select(App.config.databases['sessions'].name, function() {

				App.db.redis.sessions.HEXISTS(req.session.token.key, "username",function(_err,_hexists){
					if (_err) {return res.render('login', {domain:domain,'error': _err.message});}

					if (_hexists) {
						App.db.redis.sessions.HGETALL(req.session.token.key, function(_err,obj){
							if (_err) {return res.render('login', {'error': _err.message});}
							console.log(obj);
							res.render('launchpad', {'app_name':'SP Dashboard', domain:req.subdomain, user:obj});
						});
					} else {
						res.redirect('/login');
					}
				});
			});
		} else {
			res.redirect('/login');
		}
				
	});	
	
};