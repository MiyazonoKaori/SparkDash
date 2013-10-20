var 
	mongojs 		= require('mongojs'),
	db 					= mongojs('sp', ['domains']);

module.exports = function(req, res, next) {

	var subdomain = req.headers.host.split('.').shift();
	
	// Set default subdomain for local tests
	if(req.headers.host=="127.0.0.1:4001" || req.headers.host=="localhost:4001") {
		subdomain = 'acme';
	}
	
	// Do things like validate tokens
	console.log('should validate session token here');
	
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
				res.render('register_domain',{error:'Mongo is offline. Check the database configuration in config/app.json.  Run `mongod` from the command line.'});
			}
			
	});

};