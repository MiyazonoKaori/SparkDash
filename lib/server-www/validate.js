var mongojs = require('mongojs');

module.exports = function(req, res, next) {
	
	var subdomain = req.headers.host.split('.').shift();
	
	var db = mongojs('sp', ['domains']);

	if(req.headers.host=="127.0.0.1:4001" || req.headers.host=="localhost:4001") {
		subdomain = 'acme';
	}
	
	console.log('validating: '+subdomain);
	
	// Verify subdomain is registered, otherwise redirect to sign up page
	db.domains.findOne({id:subdomain},function(err,domain){
		console.log('..: '+domain.id);
		if (domain) {
			req.subdomain = domain;
			next();
		} else {
			res.render('register_domain',{message:'This domain is not registered.'});
		}
	});

}