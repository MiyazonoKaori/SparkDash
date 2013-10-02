var path = require('path')
	, http = require('http')
	, https = require('https');
	
module.exports = function(app){
	
	// Proxy
	app.get('/_devices', function(req, res){
		
		// Proxy request to API server
		var request = http.request({
		    	port: 3001,
		    	hostname: '127.0.0.1',
		    	method: 'GET',
		    	path: '/api/sparkdash/devices'
				}, function(__res){
					var str = '';
				  __res.on('data', function (chunk) {
				    str += chunk;
				  });
				  __res.on('end', function () { 
						res.json(JSON.parse(str));
				  });
				}
		);
		request.end();
		
	});	
	
	app.get('/:_id/_devices', function(req, res){
		
		// Proxy request to API server
		var request = http.request({
		    	port: 3001,
		    	hostname: '127.0.0.1',
		    	method: 'GET',
		    	path: '/api/sparkdash/devices?app_oid='+req.params._id
				}, function(__res){
					var str = '';
				  __res.on('data', function (chunk) {
				    str += chunk;
				  });
				  __res.on('end', function () { 
						res.json(JSON.parse(str));
				  });
				}
		);
		request.end();
		
	});
	
	
	app.post('/_apps', function(req, res){
		console.log('Proxy to /apps/register');
		
		var post_data = JSON.stringify({
			package:req.body.appPackage,
			appID:req.body.appID,
			title:req.body.title,
			token:(req.session.token.key) ? req.session.token.key : req.body.token
		});
		
		// Proxy request to API server
		var request = http.request({
		    	port: 3001,
		    	hostname: '127.0.0.1',
		    	method: 'POST',
		    	path: '/app/register',
					headers: {
		          'Content-Type': 'application/json',
		          'Content-Length': post_data.length
		      }
				}, function(__res){
					var str = '';
				  __res.on('data', function (chunk) {
				    str += chunk;
				  });
				  __res.on('end', function () { 
						res.json(JSON.parse(str));
				  });
				}
		);
		request.write(post_data);
		request.end();
		
	});
	
	
	
	// app.post('/apps', function(req, res){
	// 	console.log(req.session.token);
	// 	console.log(req.body);
	// 	res.json({status:true});
	// 	
	// 	if (req.session.token) {
	// 		
	// 		App.db.redis.sessions.select(App.config.databases['sessions'].name, function() {
	// 			
	// 			App.db.redis.sessions.HEXISTS(req.session.token.key, "username",function(_err,_hexists){
	// 				if (_err) {return res.json({status:false, error: _err.message});}
	// 				
	// 				if (_hexists) {
	// 					
	// 					
	// 					
	// 				} else {
	// 					res.json({status:false,message:'Session expired.'});
	// 				}
	// 			});
	// 		});
	// 	} else {
	// 		res.json({status:false,message:'Session expired.'});
	// 	}
	// });
};