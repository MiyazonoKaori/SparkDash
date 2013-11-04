var mongojs = require('mongojs')
	, redis = require("redis");

module.exports = function(req, res, next) {
	
	res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
	
	// Validate Authorization header
	if (!req.headers.authorization) {
		console.log('Missing authorization');
		return res.send({'response':'error', 'message':'Missing authorization token.'});
	}

	var subdomain = (req.headers.host) ? req.headers.host.split('.').shift() : 'api';
	
	console.log('Subdomain: '+subdomain);
	
	// bypass if no subdomain exists..
	if (subdomain == 'api') {
		console.log('bypassing validate middleware..');
		next();
	} else {
	
		var db = mongojs('sp', ['domains']);

		if(req.headers.host=="127.0.0.1:3001" || req.headers.host=="localhost:3001") {
			subdomain = 'acme';
		}
		
		// Verify subdomain is registered, otherwise redirect to sign up page
		db.domains.findOne({id:subdomain},function(err,domain){
			if (domain) {
				req.subdomain = domain;
								
				// Verify Authorization.  Returns the domain and app OID for a given auth token
				if (!req.Redis) {
					req.Redis = redis.createClient(
						domain.database.port, 
						domain.database.host,{
						'no_ready_check' : true
						}
					);
					req.Redis.on("end", function(err) {
					    console.log("Connection terminated to ", this.host, this.port);
							res.send({'message':'Redis connection terminated.'});
							next(new Error("Redis connection terminated"));
					});
					req.Redis.on("error", function (err) {
						if (err.message.indexOf("ECONNREFUSED") > 0) {
							console.log('Connection refused. Redis is not running: '+domain.database.host+':'+domain.database.port);
							res.send({'message':'Connection refused. Database is not running.'});
							next(err);
						} else if (err.message.indexOf("ENOTFOUND") > 0) {
							console.log('Redis is not found at: '+domain.database.host+':'+domain.database.port);
							console.log('Check your internet connection.');
							res.send({'message':'Connection refused. Database is not found.'});
						} else if (err.message.indexOf("ECONNRESET") > 0) {
							console.log('Redis connection reset (ECONNRESET) for '+domain.database.host+':'+domain.database.port);
							res.send({'message':err.message});
						} else {
							console.log("!Error " + err.message);
							res.send({'message':err.message});
						}
					});
					
					// switch to the authorization database
					req.Redis.select(1, function() {

						req.Redis.HGETALL(req.headers.authorization, function(_err,_data){
							if (!_data) {
								console.log('Invalid authorization, but ignoring');
								//return res.send({'response':'error', 'message':'Invalid authorization.'});
								next();
							} else {
								next();
							}
						});
					});
					
				}
				
				
				
			} else {
				return res.send({'message': 'This domain is not registered. Contact sales@semanticpress.com.'});
			}
		});
			
	}
	
};