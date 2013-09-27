
var path = require('path')
	, http = require('http')
	, https = require("https")
	, redis = require("redis")
	, express = require('express');


module.exports = function(app,App){

		
		/**
		*
		* Logout
		*
		*/
		
    app.all("/logout",function(req,res) {
			
			/*
				Looks like there's a bug in Express when trying to clearCookie().
				https://groups.google.com/forum/?fromgroups#!topic/express-js/PmgGMNOzhgM

				res.clearCookie('user');
				res.clearCookie('pass');

				Try.. manually expire the cookie
			*/

			res.cookie('username', '', {expires: new Date(1), path: '/' });
			res.cookie('password', '', {expires: new Date(1), path: '/' });
			res.cookie('passname', '', {expires: new Date(1), path: '/' });
			res.cookie('userid', '', {expires: new Date(1), path: '/' });
			res.cookie('user', '', {expires: new Date(1), path: '/' });
			res.cookie('pass', '', {expires: new Date(1), path: '/' });
			res.cookie('token', '', {expires: new Date(1), path: '/' });

			// Save Access Token
			console.log('Deleting token: '+req.session.token);
			
			if (req.session.token) {
				App.db.redis.sessions.select(App.config.databases['sessions'].name);
				App.db.redis.sessions.del(req.session.token.key, function(e0,o0) {
					console.log('Sessions and cookies cleared');
					req.session.destroy(function(e){ 
						console.log('Session destroyed');
						res.redirect('/login');
					});
				});
			} else {
				res.redirect('/login');
			}
		});

}