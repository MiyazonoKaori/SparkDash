var redis = require("redis")
	, config = require('../../config');
	

// Init SP Redis instance for domain validations. 
// Remember to run mongosync when new domains are created.
var SPRedis = redis.createClient(
	config.databases.sp.port, 
	config.databases.sp.host,{
	'no_ready_check' : true
	}
);
SPRedis.select(0);


module.exports = function(req, res, next) {

	res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
	
	// Validate header
	if (!req.headers.hasOwnProperty('authorization')) {
		console.log('Missing authorization');
		return res.send({status:402, message:'Missing authorization token.'});
	}
	
	if (req.method == 'POST') {
		if (!req.headers.hasOwnProperty('content-type')) {
			return res.send({status:401,message: 'Content-Type is missing. Set this to application/json'});
		}
	}

	// Set Domain
	var subdomain = (req.headers.host) ? req.headers.host.split('.').shift() : 'api';
	
	// bypass if no subdomain exists..
	if (subdomain == 'api') {
		console.log('API is used. Bypassing validation middleware..');
		next();
	} else {
	
		if (req.headers.hasOwnProperty('x-requested-with')) {
			
		}
		
		if(
			req.headers.host=="127.0.0.1:3001" || 
			req.headers.host=="localhost:3001" || 
			req.headers.host=="127.0.0.1:4001" ||
			req.headers.host=="localhost:4001"
			) {
			subdomain = 'acme';
		}
		
		// Verify subdomain is registered, otherwise redirect to sign up page
		SPRedis.HGETALL(subdomain, function(err,domain){
			
			if (domain) {
				
				req.subdomain = domain;
				
				// Create Domain DB connection

				if (!req.Redis) {
					
					console.log('Connected to '+domain.dbHost+':'+domain.dbPort);
					
					req.Redis = redis.createClient(
						domain.dbPort, 
						domain.dbHost,{
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
							console.log('Connection refused. Redis is not running: '+domain.dbHost+':'+domain.dbPort);
							res.send({'message':'Connection refused. Domain database is not running.'});
							next(err);
						} else if (err.message.indexOf("ENOTFOUND") > 0) {
							console.log('Redis is not found at: '+domain.dbHost+':'+domain.dbPort);
							console.log('Check your internet connection.');
							res.send({'message':'Connection refused. Domain database is not found.'});
							next(err);
						} else if (err.message.indexOf("ECONNRESET") > 0) {
							console.log('Redis connection reset (ECONNRESET) for '+domain.dbHost+':'+domain.dbPort);
							res.send({'message':err.message});
							next(err);
						} else {
							console.log("!Error " + err.message);
							res.send({'message':err.message});
							next(err);
						}
					});
					
					// switch to the authorization database
					req.Redis.select(1, function() {

						req.Redis.HGETALL(req.headers.authorization, function(_err,_data){
							if (!_data) {
								//console.log('Invalid authorization, but ignoring');
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