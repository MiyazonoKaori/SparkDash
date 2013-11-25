var path = require('path')
	, http = require('http')
	, https = require('https')
	, url = require('url');
	
module.exports = function(app, App){
		
	app.get('/:_id/events', function(req, res){
		
		res.header('Access-Control-Allow-Origin', '*');
	  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
	  res.header('Access-Control-Allow-Headers', 'Content-Type');
		
		// Verify session token exists
		if (req.session.token) {
			
			// Check if id is a valid Mongo _id using hex / byte length of 12
			if (Buffer.byteLength(req.params._id, 'utf8') == 12 || req.params._id.length == 24) {
				// Look up app						
				App.db.mongo.apps.findOne({_id:App.db.mongo.ObjectId(req.params._id)},function(_err,_app){
					if (_err) {
						console.log(_err);
						return res.redirect('/login');
					}
					if (_app) {
						res.render('app', {'app':_app, 'domain':req.subdomain, 'ws':{'channel':req.subdomain.id+'_'+_app.appPackage}}); 
					} else {
						
						res.send('Valid ID, but no app found for '+req.params._id);
						
					}
				});
			} else {
				res.redirect('/apps');
			}
			
		} else {
			res.redirect('/login');
		}
		
	});
	
};