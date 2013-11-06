var path = require('path')
	, http = require('http')
	, https = require('https')
	, querystring = require('querystring')
	, mongojs = require('mongojs')
	, bcrypt = require("bcrypt");

module.exports = function(app,App){
	
	var db = mongojs(App.config.databases.mongo, ['users','domains']);
	
			
			
	app.all('/api', function(req, res) {
		
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
				res.json(200,{message:'Welcome to '+domain.title+' API.'});
			} else {
				res.json(200,{'message': 'This domain is not registered.'});
			}
		});
	
	});

	app.get('/api/sparkdash', function(req, res) {
		console.log(req.subdomain);
		res.json(200,{message:'SparkDash API'});
	});

	// Catcha all
	app.all('/api/sparkdash/:do', function(req, res){
		res.json(200,{'response':'invalid verb. Use POST.'});
	});
	
	// Catcha all
	app.all('/api/sparkdash/:do/:something', function(req, res){
		res.json(200,{'response':'invalid verb. Use POST.'});
	});
	
};