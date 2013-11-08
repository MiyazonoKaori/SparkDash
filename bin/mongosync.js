var mongojs = require('mongojs')
	, redis = require("redis")
	, config = require('../config');


/* 

 Sync Redis with Mongo
 
 We need to keep a hash of domains for quick validations

*/

var db = mongojs(config.databases.mongo, ['domains','apps']);

// Connect to SP redis instance
var Redis = redis.createClient(
	config.databases.sp.port, 
	config.databases.sp.host,{
	'no_ready_check' : true
	}
);

function getDomains(err, domain) {
			
	if(domain) {
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
			db.apps.find({"domain":domain.id}).forEach(function(err, app){
				getApps(err,app,domain);
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
		console.lo
		console.log('Connecting to domain db: '+domain.dbHost+':'+domain.dbPort);
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
		});
	} else {
		console.log('done with apps');
	}
	
};

// Select 'domains' db
Redis.select(0, function() {

	// Run search for all domains on MongoHQ
	db.domains.find().forEach(getDomains);
	
});