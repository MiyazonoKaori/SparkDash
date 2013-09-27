var crypto = require('crypto');
var mongojs = require('mongojs');

var db = mongojs('sp', ['users','apps']);
var keygen = exports;

keygen.createKey = function(seed, str){
	// Create API Key
	var cipher = crypto.createCipher('aes-128-ecb',seed);
	var crypted = cipher.update(str,'utf-8','hex');
	crypted += cipher.final('hex');
	// now crypted contains the hex representation of the ciphertext
	return crypted;
}

keygen.createAccessToken = function(crypted){
	// Create Access Token
	var shasum = crypto.createHash('sha1');
	shasum.update(crypted);
	return shasum.digest('hex');
}

keygen.generate = function(args,_cb){ 
	
	// required
	// seed, app_id, user, level, timestamp
	
	var access_token
		, shasum
		, crypted
		, cipher
		, STRING,
		out = false;
	
	
	if (args.user && args.pkg) {
				
		// Verify user 
		db.users.findOne({username:args.user},function(err,user){
			
			if (user) {
				
		    // lookup App IDs for given user. If app exists, use that key otherwise ask the user to create an app first.
				db.apps.findOne({pkg:args.pkg},function(err,app){
					
					if (app) {
						// use existing key
						if (app.key) {
							console.log('app key exists');
							// App key exists
							_cb({
								key: app.key,
								access_token: app.access_token,
								package: args.pkg,
								expires:890890890890,
								user:user
							});
						} else {
							console.log('creating key for package: '+args.pkg);
							
							// Create key for package
							STRING = app.pkg+'|'+user.username+'|'+app.expires+'|'+user.level;
							crypted = keygen.createKey(user.secret,STRING);
							access_token = keygen.createAccessToken(crypted);
							
							db.apps.findAndModify({
							    query: { pkg: args.pkg },
							    update: { $set: { key:crypted, access_token: access_token } },
							    new: true
							}, function(err, doc) {
								doc.user = user;
								_cb(doc);
							});
							
						}
						
					} else {
						// prompt the user to create an app first
						_cb({
							message:'Stop. This app package is not registered. You must create an app first with this name.'
						});
						
					}
					
				});
				
	    } else {
				_cb({message:'Missing user'});
			}
			
		});
		
	} else {
		console.log('missing required properties');
		_cb(false);
	}
	
};