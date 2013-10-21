/*
 * 	Hapi Server
 		Docs: https://github.com/walmartlabs/hapi#documentation
		
		Status Codes: http://en.wikipedia.org/wiki/List_of_HTTP_status_codes#4xx_Client_Error
 *
*/


var Server = function (options) {	
	var that = this;
		
	return function(App) {
		
		
		var 
			express 	= require('express'),
			fs				= require('fs'),
			path			= require('path'),
			hbs 			= require('hbs');
				
		/**
		 *
		 * Public Methods
		 * 
		*/
		
		that.start = function(_cfg,_cb) {
			
			// 
			// verify cache directory is writable
			//
			if (!fs.existsSync(App.config.cacheDir)) {
				_cb({error:'\033[31;1m STOP! '+App.config.cacheDir+' does not exist or is not writable. Please ensure this is writable before proceeding.\033[0m'});
				return;
			}
			
			
			var allowCrossDomain = function(req, res, next) {
			    res.header('Access-Control-Allow-Origin', '*');
			    res.header('Access-Control-Allow-Methods', 'OPTIONS, GET,PUT,POST,DELETE');
			    res.header('Access-Control-Allow-Headers', 'Content-Type, x-requested-with, x-mm-token-auth');
					res.header('access-control-max-age', '86400');
			    res.header('access-control-allow-credentials', 'true');
			    next();
			};
			
			
			/** 
			 * HELPER: #key_value
			 *
			 * Usage: {{#key_value obj}} Key: {{key}} // Value: {{value}} {{/key_value}}
			 *
			 * Iterate over an object, setting 'key' and 'value' for each property in the object.
			 * See http://stackoverflow.com/questions/9058774/handlebars-mustache-is-there-a-built-in-way-to-loop-through-the-properties-of
			*/ 
			hbs.registerHelper("key_value", function(obj, options) {
			    var buffer = "",
			        key;

			    for (key in obj) {
			        if (obj.hasOwnProperty(key)) {
			            buffer += options.fn({key: key, value: obj[key]});
			        }
			    }

			    return buffer;
			});
			
			hbs.registerHelper("list_headers", function(obj, options) {
			    var buffer = "",
			        key;
			
			    for (key in obj[0]) {
			        buffer += options.fn({header: key});
			    }

			    return buffer;
			});

			/**
			 * HELPER: #each_with_key
			 * 
			 * Usage: {{#each_with_key container key="myKey"}}...{{/each_with_key}}
			 *
			 * Iterate over an object containing other objects. Each
			 * inner object will be used in turn, with an added key ("myKey") 
			 * set to the value of the inner object's key in the container.
			*/
			hbs.registerHelper("each_with_key", function(obj, options) {
			    var context,
			        buffer = "",
			        key,
			        keyName = options.hash.key;

			    for (key in obj) {
			        if (obj.hasOwnProperty(key)) {
			            context = obj[key];

			            if (keyName) {
			                context[keyName] = key;
			            }
			            buffer += options.fn(context);
			        }
			    }

			    return buffer;
			});
										
			
			/**
			* Set Session storage type based
			* on NODE_ENV
			*
			* @attribute cacheStore
			* @default MemoryStore
			* @type object
			*/
		  if (process.env.NODE_ENV === 'production') 
			{
		    var RedisStore = require('connect-redis')(express);
				App.cacheStore = new RedisStore({
					host:App.config.session.host, 
					port:App.config.session.port, 
					prefix:App.config.session.prefix
				});
		  } 
			else 
			{
		    App.cacheStore = new express.session.MemoryStore;
		  }
		
			
			/**
			*
			* Express Server
			* Express 3.0
			* Read the Express migration guide 
			* https://github.com/visionmedia/express/wiki/Migrating-from-2.x-to-3.x
			*
			*/
			var app = module.exports = express();
						
			app.engine('html', hbs.__express);
			
			// Must use defer:true to disable multipart processing and exposes the Formidable form object as req.form
			// see http://stackoverflow.com/questions/11295554/how-to-disable-express-bodyparser-for-file-uploads-node-js
			
			app.use(express.bodyParser());
			app.use(express.methodOverride());
			app.use(express.cookieParser('nodester'));
			app.use(express.session({ secret: App.config.session.key, store: App.cacheStore }));
			
			app.use(function(req, res, next){
			  //console.log('%s %s %s', req.method, req.url, JSON.stringify(req.headers));
			  next();
			});
			
			app.use(function(err, req, res, next) {
			    if(!err) return next(); // you also need this line
						
				 	res.status(err.status || 500);
			    res.json({"status":500,"message":err});
			});

			app.set('views', path.join(__dirname, '../../') + 'views');
			app.set('view engine', 'html');
			
			app.use(express.static(path.join(__dirname, '../../') + 'public'));
			
			app.use(require('./validate'));
			
			app.use(app.router);
			app.use(allowCrossDomain); // CORS
			
			app.locals({
				app_name: 'SP-API'
			});
			
			
			/**
			*
			* Load Route Files
			*
			*/
			
			app.get('/health', function(req, res){
			  res.send({
			    pid: process.pid,
			    memory: process.memoryUsage(),
			    uptime: process.uptime()
			  })
			});
			
			// subdomain APIs
			require('./routes/sparkdash/beacon')(app,App);
			require('./routes/sparkdash/devices')(app,App);
			require('./routes/sparkdash/messages')(app,App);
			require('./routes/sparkdash')(app,App);
			
			// main API
			require('./routes/spark')(app,App);
			require('./routes/sessions')(app,App);
			require('./routes/users')(app,App);
			require('./routes/domains')(app,App);
			require('./routes/apps')(app,App);
			
			
			app.all('/', function(req, res){
				res.send({message:'Welcome to Semantic Press API.'});
			});
			
			app.listen(_cfg.port);
			
			// Callback
			if (_cb) {
				_cb(_cfg);
			}
			
		};
		
		that.stop = function (options, _cb) {
			console.log('stopped');
			if (_cb) {_cb();}
		};
		return that;
	};
	
};

module.exports = new Server();