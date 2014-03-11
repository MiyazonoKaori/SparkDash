var path = require('path')
	, http = require('http')
	, https = require('https')
	, querystring = require('querystring')
	, keygen = require('../keygen')
	, config = require('../../../config');
	
module.exports = function(app,App){
	
	app.post('/spark/validate/token', function(req, res){
		res.json({'response':'ok'});
	});
	
	app.post('/spark/validate/key', function(req, res){

		if (req.body) {
			
			// Generate License Key
			var key = keygen.parseLicense({
				seed:req.body.seed,
				license: req.body.license
			},function(err,obj){
			  res.json({'response':'ok','message':obj});
		  });
		}
		
	});	
		
	app.post('/spark/generate/token', function(req, res){
				
		keygen.generateAndUpdate({
			seed:req.body.seed,
			user:req.body.user,
			appPackage:req.body.appPackage,
			timestamp:req.body.timestamp,
			level:req.body.level
		},function(obj){
			
			if (obj) {
				res.json(obj);
			} else {
				res.send(404,{'message':'Error','message':'Invalid parameters.'});
			}
			
		});

	});
	
	app.post('/spark/generate/key', function(req, res){
		res.json({'status':200,'message':'ok'});
	});


	// Catcha all
	app.all('/spark/:do/:something', function(req, res){
		res.json({'status':200,'message':'invalid verb. Use POST.'});
	});
};