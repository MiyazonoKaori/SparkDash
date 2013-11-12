var mongojs = require('mongojs')
	, redis = require("redis")
	, config = require('../config');


/* 

 Sync Redis with Mongo
 
 We need to keep a hash of domains for quick validations for SP Cloud using Redis, rather than MongoDB.  
 The mobile API runs into severe latency when using Mongo for domain verification.

 This script synchronizes SP's MongoDB with the local Redis instance on 6379. It saves the domain details using the domain ID as the key.

 For example, "acme" contains the property HASH.

 It then fetches individual apps for each domain and populates them into each domain's database instance (ie, 6380:0) Db 0.

 For example, "acme-5249d478a372602217000001" contains the property HASH for the app, including appPackage.


 To use, run NODE_ENV=production node bin/mongosync.js

*/

var db = mongojs(config.databases.mongo, ['domains','apps']);

// Connect to SP redis instance
var Redis = redis.createClient(
	config.databases.sp.port, 
	config.databases.sp.host,{
	'no_ready_check' : true
	}
);

console.log('Mongo connection: '+config.databases.mongo)
console.log('Redis connection: '+config.databases.sp.host+':'+config.databases.sp.port);

function getDomains(err, domain) {
			
	if(domain) {
		console.log('Saving domain: '+domain.id+' to '+Redis.host+':'+Redis.port);
		// Save DB info
		domain.dbEngine = domain.database.engine;
		domain.dbPort = domain.database.port;
		domain.dbHost = domain.database.host;
		domain.dbPass = domain.database.pass;
		domain.dbUser = domain.database.user;
		
		// Add domain to hash table
		Redis.HMSET(domain.id, domain, function(e,o) {
			if (e) { console.log(e); return; }
			
			// Run search for all domains on MongoHQ
			console.log('Searching for apps on domain: '+domain.id);
			db.apps.find({"domain":domain.id}).forEach(function(err, app){
				if (app) {
					getApps(err,app,domain);
				} else {
					console.log(' ..no apps found for '+domain.id);
				}
			});
			
		});
	} else {
		console.log('done with domains');
	}
	
};

function getApps(err, app, domain) {
			
	if(app) {		
		//delete doc.builds;

		// clean JSON object
		var o = JSON.stringify(app);
		o = JSON.parse(o);
		
		// open connection to domain db
		console.log('Saving '+o.domain+'-'+o._id+' with '+domain.dbHost+':'+domain.dbPort);
		var Redis2 = redis.createClient(domain.dbPort, domain.dbHost,{'no_ready_check' : true});
		Redis2.on("error", function (err) {
			console.log(err.message);
		});
		Redis2.select(0, function() {
			
			// Save apps to domain db
			Redis2.HMSET(o.domain+'-'+o._id, o, function(e,o) {
				if (e) { console.log(e); return; }
				console.log(o);
			});
			
			// Save apps to domain db
			Redis2.HMSET(o.domain+'-'+o.appPackage, o, function(e,o) {
				if (e) { console.log(e); return; }
				console.log(o);
			});
			
		});
	}
	
};

// Select 'domains' db
Redis.select(0, function() {
	
	// Flush domain db
	
	// Run search for all domains on MongoHQ
	db.domains.find().forEach(getDomains);
	
});