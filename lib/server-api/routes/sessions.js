var path = require('path')
	, http = require('http')
	, https = require('https')
	, querystring = require('querystring')
	, config = require('../../../config/app.json');
	
module.exports = function(app,App){

	app.post('/session/validate', function(req, res){
		res.json({'response':'ok'});
	});
	
	// Catcha all
	app.all('/session/:do', function(req, res){
		res.json({'response':'invalid verb. Use POST.'});
	});
};