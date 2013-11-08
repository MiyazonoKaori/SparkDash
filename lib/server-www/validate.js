var config	= require('../../config');


module.exports = function(req, res, next) {

	var db = require('mongojs').connect(config.databases.mongo, ['domains']);
	

	var subdomain = req.headers.host.split('.').shift();
	
	// Set default subdomain for local tests
	if(req.headers.host=="127.0.0.1:4001" || req.headers.host=="localhost:4001") {
		subdomain = 'acme';
	}
			
	// Do things like validate tokens
	//console.log('should validate session token here');
	
	// Verify database is running
	db.runCommand({ping:1}, function(dberr, dbres) {
			
	    if(!dberr) {
		
				// Verify subdomain is registered, otherwise redirect to sign up page
				db.domains.findOne({id:subdomain},function(err,domain){
					if (domain) {
						req.subdomain = domain;
						next();
					} else {
						res.render('register_domain',{message:'This domain is not registered.'});
					}
				});
				
			} else {
				
				if (req.headers['x-requested-with'] == 'XMLHttpRequest') {
					res.json({status:403, message:"Mongo is offline. Check the database configuration in config/app.json."}); 
				} else {
					res.render('register_domain',{error:"Mongo is offline. Check the database configuration in config/app.json."});
				}
			}
			
	});

};