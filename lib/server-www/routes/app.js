var path = require('path')
	, http = require('http')
	, https = require('https')
	, url = require('url');


var getAppAnalytics = function(app, req, res){
	var request = http.request({
	    	port: 3001,
	    	hostname: '127.0.0.1',
	    	method: 'GET',
				headers:{'Authorization':'test'},
	    	path: '/api/devices?app_oid='+app._id+'&filter=sum'
			}, function(__res){
				var str = '';
			  __res.on('data', function (chunk) {
			    str += chunk;
			  });
			  __res.on('end', function () {
					var o = (typeof str === 'string') ? JSON.parse(str) : str;
					if (o.error) {
						app.stats = e.message;
					} else {
						app.stats = o.message;
						doneWithAnalytics(app,req,res);						
					}
			  });
			}
	);
	request.end();
};

var doneWithAnalytics = function(app, req, res){
	res.render('app', {'app':app, 'domain':req.subdomain, 'ws':{'channel':req.subdomain.id+'_'+app.appPackage}}); 
};
	
module.exports = function(app, App){
		
	app.get('/:_id', function(req, res){
		
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
						getAppAnalytics(_app, req, res);
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