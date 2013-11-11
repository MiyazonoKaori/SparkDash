var fs = require('fs');
var redis	= require("redis");

var App = function (options) {	
	
	var that = this;
	
	/**
	* Package Info
	*
	* @attribute info
	* @type object
	*/
	this.info = module.exports;
	
	
	this.config = require('../config');
	
	
	this.db = {
		redis: {
			users: redis.createClient(
				this.config.databases['users'].port, 
				this.config.databases['users'].host
			),
			sessions: redis.createClient(
				this.config.databases['sessions'].port, 
				this.config.databases['sessions'].host
			)
		}
	};
	
	this.db.redis.users.on("error", function (err) {
		
		if (err.message.indexOf("ECONNREFUSED") > 0) {
			console.log('Connection refused. Redis is not running.');
			//Start Redis
			console.log('Attempting to start redis locally...');
			var sys = require('sys')
			var exec = require('child_process').exec;
			exec("redis-server", function puts(error, stdout, stderr) { sys.puts(stdout) });
		} else {
			console.log("Error " + err.message);
		}
		
	});
		
	
	/**
	* Create server.
	*
	* @attribute server
	* @type object
	*/
	this.server = {
		api: require(__dirname+'/server-api/')(this),
		www: require(__dirname+'/server-www/')(this)
	};
	
	/**
	* Display ascii banner during start.
	*
	* @method showBanner
	* @param {String} host Host name
	* @param {String} port Port
	* @return true Returns true
	*/
	this.showBanner = function(e) {
		console.log("  Semantic Press API Server");
	  console.log("  © 2012 Semantic Press Inc.");
	  console.log("  All Rights Reserved - www.semanticpress.com");
	  console.log("  ");
	  console.log("  http://localhost:"+e.port);
		console.log("  ");
	  console.log("  Files are uploaded to "+that.config.cacheDir);
		console.log("  NODE_ENV: "+process.env.NODE_ENV);
		console.log("  NODE_ENV=development node bin/main.js build && node bin/main.js")
		console.log("  -----------------------------------------------------");
		console.log("  ");
	};

};

module.exports = new App();