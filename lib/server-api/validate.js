var redis = require("redis")
	, config = require('../../config');
	

var SPRedis = undefined;
var CRedis = [];


CRedis['test:1234'] = 'foo';

CRedis.hasOwnProperty('test:1234s');



/**
 * will reuse connection if already created
 */
function SPRedis_connect(cb) {
  if (SPRedis === undefined) {
    // Init SP Redis instance for domain validations. 
		// Remember to run mongosync when new domains are created.
		SPRedis = redis.createClient(
			config.databases.sp.port, 
			config.databases.sp.host,{
			'no_ready_check' : true
			}
		);
		cb(null, SPRedis);
		 
  } else {
    cb(null, SPRedis);
	}
}

function CRedis_connect(host,port,cb) {
	
  if (!CRedis.hasOwnProperty(host+':'+port)) {
		
    // Init SP Redis instance for domain validations. 
		// Remember to run mongosync when new domains are created.
		CRedis[host+':'+port] = redis.createClient(port,host,{'no_ready_check' : true});
		CRedis[host+':'+port].on("connect",function(err){
			console.log('CRedis is connected to '+host+':'+port);
		});
		CRedis[host+':'+port].on("end", function(err) {
		    console.log("Connection terminated to ", this.host, this.port);
				cb(new Error("Redis connection terminated"));
		});
		CRedis[host+':'+port].on("error", function (err) {
			if (err.message.indexOf("ECONNREFUSED") > 0) {
				console.log('Connection refused. Redis is not running: '+this.host+':'+this.port);
				err.message = 'Connection refused. Domain database is not running.';
				cb(err);
			} else if (err.message.indexOf("ENOTFOUND") > 0) {
				console.log('Redis is not found at: '+this.host+':'+thos.port);
				console.log('Check your internet connection.');
				err.message = 'Connection refused. Domain database is not found.';
				cb(err);
			} else if (err.message.indexOf("ECONNRESET") > 0) {
				console.log('Redis connection reset (ECONNRESET) for '+this.host+':'+this.port);
				cb(err);
			} else {
				console.log("!Error " + err.message);
				cb(err);
			}
		});
		
		cb(null, CRedis[host+':'+port]);
		 
  } else {
    cb(null, CRedis[host+':'+port]);
	}
}

/**
 * Use the db connection from our connect()
 */
SPRedis_connect(function(err, db) {
  if (err) { return console.log('[ERROR] SPRedis cannot connect.'); }
	console.log('SPRedis is connected to '+config.databases.sp.host+':'+config.databases.sp.port);
  SPRedis.select(0);
});


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

				CRedis_connect(domain.dbHost, domain.dbPort, function(err, db) {
				  if (err) { 
						return next({type:'connection', message: err.message});
					}
								
					// switch to the authorization database
					db.select(1, function() {
						
						req.Redis = db;
												
						db.HGETALL(req.headers.authorization, function(_err,_data){
							if (!_data) {
								//console.log('Invalid authorization, but ignoring');
								//return res.send({'response':'error', 'message':'Invalid authorization.'});
								next();
							} else {								
								next();
							}
						});
					});
					
				});
				
				
				
			} else {
				return res.send({'message': 'This domain is not registered. Contact sales@semanticpress.com.'});
			}
		});
			
	}
	
};