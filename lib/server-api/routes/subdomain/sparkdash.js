var path = require('path')
	, http = require('http')
	, https = require('https')
	, querystring = require('querystring')
	, mongojs = require('mongojs')
	, bcrypt = require("bcrypt")
	, config = require('../../../../config/app.json');

module.exports = function(app,App){
	
	var db = mongojs('sp', ['users','domains']);
	
			
			
	app.get('/api/SparkDash', function(req, res) {
		
		var parts = req.headers.host.split('.');
		var subdomain = parts.shift();
		var tld = parts.join('.');
		
		if(req.headers.host=="127.0.0.1:3001" || req.headers.host=="localhost:3001") {
			subdomain = 'acme';
		}
		
		//
		// Verify subdomain is registered, otherwise redirect to sign up page
		db.domains.findOne({id:subdomain},function(err,domain){
			if (domain) {
				res.send({message:'SparkDash API'});
			} else {
				res.send({'message': 'This domain is not registered.'});
			}
		});
	
	});

	// Catcha all
	app.all('/spark/:do/:something', function(req, res){
		res.json({'response':'invalid verb. Use POST.'});
	});
};