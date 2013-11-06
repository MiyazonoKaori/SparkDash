var mongojs = require('mongojs')
	, redis = require("redis")
	, config = require('../config/app.json');


/* 

 Sync Redis with Mongo
 
 We need to keep a hash of domains for quick validations

*/

var db = mongojs(config.databases.mongo, ['domains']);

// Connect to SP redis instance
var Redis = redis.createClient(
	config.databases.sp.port, 
	config.databases.sp.host,{
	'no_ready_check' : true
	}
);

// Select 'domains' db
Redis.select(0, function() {

	// Run search for all domains on MongoHQ
	db.domains.find().forEach(function(err, doc) {
				
		if(doc) {
						
			// Save DB info
			doc.dbEngine = doc.database.engine;
			doc.dbPort = doc.database.port;
			doc.dbHost = doc.database.host;
			doc.dbPass = doc.database.pass;
			doc.dbUser = doc.database.user;
			
			// Add domain to hash table
			Redis.HMSET(doc.id, doc, function(e,o) {
				if (e) { console.log(e); return; }
				console.log(o);
			});
		} else {
			Redis.BGSAVE();
			console.log('done');
		}
		
	});
	
});