var config	= require('../../config');

var SPMongo = undefined;

/**
 * will reuse connection if already created
 */
function SPMongo_connect(cb) {
  if (SPMongo === undefined) {
		
		SPMongo = require('mongojs').connect(config.databases.mongo, ['domains']);
		cb(null, SPMongo);
		 
  } else {
    cb(null, SPMongo);
	}
}

/**
 * Use the db connection from our connect()
 */
SPMongo_connect(function(err, db) {
  if (err) { return console.log('errrrrrrrr!'); }
	
	// Verify database is running
	db.runCommand({ping:1}, function(dberr, dbres) {
		
		console.log('SPMongo is connected to '+config.databases.mongo);
		
    if(dberr) {
			if (req.headers['x-requested-with'] == 'XMLHttpRequest') {
				res.json({status:403, message:"Mongo is offline. Check the database configuration in config/app.json."}); 
			} else {
				res.render('register_domain',{error:"Mongo is offline. Check the database configuration in config/app.json."});
			}
		}
	});
	
});

module.exports = function(req, res, next) {
		
	var subdomain = req.headers.host.split('.').shift();
	
	// Set default subdomain for local tests
	if(req.headers.host=="127.0.0.1:4001" || req.headers.host=="localhost:4001") {
		subdomain = 'acme';
	}
			
	// Do things like validate tokens
	//console.log('should validate session token here');
	if (!SPMongo) {
		console.log('SPMongo is missing');
	}
	// Verify subdomain is registered, otherwise redirect to sign up page
	SPMongo.domains.findOne({id:subdomain},function(err,domain){
		if (domain) {
			req.subdomain = domain;
			next();
		} else {
			res.render('register_domain',{message:'This domain is not registered.'});
		}
	});

};