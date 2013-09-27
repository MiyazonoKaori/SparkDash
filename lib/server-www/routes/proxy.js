var path = require('path')
	, http = require('http')
	, https = require('https');
	
module.exports = function(app){
	
	// Proxy
	app.get('/_devices', function(req, res){
		
		// Proxy request to API server
		var request = http.request({
		    	port: 5555,
		    	hostname: '127.0.0.1',
		    	method: 'GET',
		    	path: '/devices'
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
	
};