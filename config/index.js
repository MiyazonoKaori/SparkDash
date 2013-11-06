module.exports = function() {
	
	var Settings = {
	  "version":"0.1",
	  "cacheDir":"/var/www/cache/uploads/spapi/",
	  "session": {
	    "key": "SECRET-KEY",
	    "port": "",
	    "host": "127.0.0.1", 
	    "port": 6379, 
	    "prefix": "chs-sess"
	  },
	  "databases": {
	    "mongo":"127.0.0.1:27017/sp",
	    "sp": {
	      "engine":"redis",
	      "name":14,
	      "port":6379,
	      "host":"127.0.0.1",
	      "pass":"blahblahblah"
	    },
	    "users": {
	      "engine":"redis",
	      "name":14,
	      "port":6379,
	      "host":"127.0.0.1",
	      "pass":"blahblahblah"
	    },
	    "sessions": {
	      "engine":"redis",
	      "name":15,
	      "port":6379,
	      "host":"127.0.0.1",
	      "pass":"blahblahblah"
	    }
	  },
		"users": {
		  "anonymous": {},
		  "registered": {
		    "ttl": 86400
		  }
		}
	};
	
	// Override and set additional properties
	switch(process.env.NODE_ENV){
		case 'development':
			break;
	  case 'production':
	    Settings.databases.mongo = "mongodb://node:N2eaM2Bx@paulo.mongohq.com:10055/sparkdash-dev";
	 }
	
	return Settings;
}();