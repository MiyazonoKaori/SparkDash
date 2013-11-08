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
					headers:{'Authorization':'test'},
		    	path: '/api/devices'
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
		// GET Proxy request to API server
		var request = http.request({
		    	port: 3001,
		    	hostname: '127.0.0.1',
		    	method: 'GET',
					headers:{'Authorization':'test'},
		    	path: '/api/devices?app_oid='+req.params._id
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
	
	app.post('/:_id/messages', function(req, res){

		delete req.headers['content-length'];
		
		console.log(req.headers);
		
		var request = http.request({
		    	hostname: req.headers.host,
		    	method: 'POST',
					headers:req.headers,
		    	path: '/api/'+req.params._id+'/messages'
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
		request.write(JSON.stringify(req.body));
		request.end();
		
	});
	
	app.post('/:_id/_update', function(req, res) {
				
		// POST Proxy request to API server
		var request = http.request({
		    	port: 3001,
		    	hostname: '127.0.0.1',
		    	method: 'POST',
					headers:{'Content-Type':'application/json','Authorization':'test'},
		    	path: '/app/'+req.params._id+'/update'
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
		request.write(JSON.stringify(req.body));
		request.end();
		
	});
		
	app.post('/_apps', function(req, res){
		console.log('Proxy to /apps/register');
		
		var post_data = req.body;
		post_data.token = (req.session.token.key) ? req.session.token.key : req.body.token;
		post_data = JSON.stringify(post_data);
						
		// Proxy request to API server
		var request = http.request({
		    	port: 3001,
		    	hostname: '127.0.0.1',
		    	method: 'POST',
		    	path: '/app/register',
					headers: {
		          'Content-Type': 'application/json',
							'Authorization':'test'
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
	
	app.post('/apps/_newSession', function(req, res) {
		
		// POST Proxy request to API server
		var request = http.request({
		    	port: 3001,
		    	hostname: '127.0.0.1',
		    	method: 'POST',
					headers:{'Content-Type':'application/json','Authorization':'test'},
		    	path: '/session/generate'
				}, function(__res){
					var str = '';
				  __res.on('data', function (chunk) {
				    str += chunk;
				  });
				  __res.on('end', function () { 
						var out = str;
						if (str) {
							out = JSON.parse(str);
						}
						res.json(out);
				  });
				}
		);
		request.write(JSON.stringify({'_id':req.body._id}));
		request.end();
		
	});
	
	app.post('/:_id/_setCurrentBuild', function(req, res){
		
		// POST Proxy request to API server
		var request = http.request({
		    	port: 3001,
		    	hostname: '127.0.0.1',
		    	method: 'POST',
					headers:{'Content-Type':'application/json','Authorization':'test'},
		    	path: '/app/'+req.params._id+'/setbuild'
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
		request.write(JSON.stringify({'current_build':req.body.current_build}));
		request.end();
		
	});
	app.post('/:_id/_createBuild', function(req, res) {
		
		// POST Proxy request to API server
		var request = http.request({
		    	port: 3001,
		    	hostname: '127.0.0.1',
		    	method: 'POST',
					headers:{'Content-Type':'application/json','Authorization':'test'},
		    	path: '/app/'+req.params._id+'/createbuild'
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
		request.write(JSON.stringify({'_id':req.params._id,'data':req.body.data}));
		request.end();
		
	});
	app.post('/:_id/_deleteBuild', function(req, res) {
		
		// POST Proxy request to API server
		var request = http.request({
		    	port: 3001,
		    	hostname: '127.0.0.1',
		    	method: 'POST',
					headers:{'Content-Type':'application/json','Authorization':'test'},
		    	path: '/app/'+req.params._id+'/deletebuild'
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
		request.write(JSON.stringify({'_id':req.params._id,'appBuild':req.body.appBuild}));
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