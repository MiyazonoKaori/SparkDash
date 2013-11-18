var path = require('path')
	, http = require('http')
	, https = require('https')
	, querystring = require('querystring')
	, config = require('../../../config');	

var AppCount = 0;
var AppList = [];

var getAppAnalytics = function(app, i, res){
	var request = http.request({
	    	port: 3001,
	    	hostname: '127.0.0.1',
	    	method: 'GET',
				headers:{'Authorization':'test'},
	    	path: '/api/devices?app_oid='+app._id+'&filter=sum'
			}, function(__res){
				var str = '';
			  __res.on('data', function (chunk) {
			    str += chunk;
			  });
			  __res.on('end', function () { 
					app.analytics = JSON.parse(str).message;
					doneWithAnalytics(app,i,res)
			  });
			}
	);
	request.end();
};

var doneWithAnalytics = function(app, i, res){
	AppList.push(app);
	if (i == AppCount) {
		res.json({'status':200, 'message':AppList});
		AppList = [];
	}
};

module.exports = function(app,App){
		
	// Static Files
	app.get('/apps', function(req, res){
				
		//console.log(req.session);
		//console.log(req.headers);
		
		res.header('Access-Control-Allow-Origin', '*');
	  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	  res.header('Access-Control-Allow-Headers', 'Content-Type');		
	
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
							App.db.mongo.apps.find({user_id:obj.username}).forEach(function(err, doc) {
								if (!doc) { 
									
									if (req.headers['x-requested-with'] == 'XMLHttpRequest') {
										
										AppCount = apps.length-1;
										
										// Aggregate data
										if (apps.length > 0) {
											
											for(x in apps) {
												getAppAnalytics(apps[x], x, res);
											}
											
										} else {
											res.json({'status':200, 'message':apps}); 
										}
										
										
									} else {
										res.render('apps', {'app_name':'SP Dashboard', domain:req.subdomain, 'apps':apps}); 
									}
									
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