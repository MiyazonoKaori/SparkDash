var crypto = require('crypto');
var mongojs = require('mongojs');
var config = require('../../config');
var db = mongojs(config.databases.mongo, ['users','apps']);
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

// simply return key and access_token
keygen.generateLicense = function(args,_cb) {
		console.log(args);
		// Create key for package
		var crypted = keygen.createKey(args.seed,args.pkg+'|'+args.user_id+'|'+args.expires+'|'+args.domain+'|'+args.level);
		var access_token = keygen.createAccessToken(crypted);
		
		_cb(false,{
			key:crypted, 
			access_token: access_token 
		});
};


keygen.parseLicense = function(args,_cb){
  var decrypted = {};
  
  if (args.license && args.seed) {
    
    // Create API Key
  	var decipher = crypto.createDecipher('aes-128-ecb',args.seed);
  	var decrypted = decipher.update(str,'hex','binary');
  	decrypted += decipher.final('binary');
  	
  	if (decrypted.indexOf("|") >= 0) {
			var tmp = decrypted.split('|');
			decrypted = {
			  'packageName':tmp[0],
			  'id':tmp[1],
			  'domain': tmp[3]
			};
		}
  } 
  _cb(false,decrypted);
};

// generates and updates an existing app with new keys
keygen.generateAndUpdate = function(args,_cb){ 
	
	// required
	// seed, appID, user, level, timestamp(expiration)
	
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
				db.apps.findOne({appPackage:args.appPackage},function(err,app){
					
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
							STRING = app.appPackage+'|'+user.username+'|'+app.expires+'|'+args.domain+'|'+user.level;
							crypted = keygen.createKey(user.secret,STRING);
							access_token = keygen.createAccessToken(crypted);
							
							db.apps.findAndModify({
							    query: { appPackage: args.appPackage, user_id:args.user_id },
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