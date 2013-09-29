var mongojs = require('mongojs');

module.exports = function(req, res, next) {
	var subdomain = req.headers.host.split('.').shift();
	
	// bypass if no subdomain exists..
	if (subdomain == 'api') {
		console.log('bypassing validate middleware..');
		next();
	} else {
	
		var db = mongojs('sp', ['domains']);

		if(req.headers.host=="127.0.0.1:3001" || req.headers.host=="localhost:3001") {
			subdomain = 'acme';
		}

		// verify access_token

		// Verify subdomain is registered, otherwise redirect to sign up page
		db.domains.findOne({id:subdomain},function(err,domain){
			if (domain) {
				req.subdomain = domain;
				next();
			} else {
				res.send({'message': 'This domain is not registered.'});
			}
		});
			
	}
	
};