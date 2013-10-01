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
			routes		= require('./routes'),
			fs				= require('fs'),
			path			= require('path'),
			hbs 			= require('hbs');
		
		
		var mongojs = require('mongojs');
		
		var validate = function(req, res, next){
			var subdomain = req.headers.host.split('.').shift();

			var db = mongojs('sp', ['domains']);

			if(req.headers.host=="127.0.0.1:4001" || req.headers.host=="localhost:4001") {
				subdomain = 'acme';
			}
			// verify access_token

			// Validate session token
			if (req.session.token) {
				App.db.redis.sessions.select(App.config.databases['sessions'].name, function() {
					console.log('slected db');
					App.db.redis.sessions.HEXISTS(req.session.token.key, "username",function(_err,_hexists){
						if (_err) {return res.render('login', {'error': _err.message});}

						if (_hexists) {
							if (_hexists.domain == subdomain) {

								// Verify subdomain is registered, otherwise redirect to sign up page
								db.domains.findOne({id:subdomain},function(err,domain){
									if (domain) {
										req.subdomain = domain;
										next();
									} else {
										res.render('register_domain',{message:'This domain is not registered.'});
									}
								});

							} else {
								res.send('Unauthorized access to this domain. Please contact the administrator.');
							}
						} else {
							res.redirect('login');
						}
					});
				});
			} else {
				res.redirect('login');
			}
			
		}
		
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
			
			hbs.registerHelper('ifCond', function (v1, operator, v2, options) {
			    switch (operator) {
			        case '==':
			            return (v1 == v2) ? options.fn(this) : options.inverse(this);
			        case '===':
			            return (v1 === v2) ? options.fn(this) : options.inverse(this);
			        case '<':
			            return (v1 < v2) ? options.fn(this) : options.inverse(this);
			        case '<=':
			            return (v1 <= v2) ? options.fn(this) : options.inverse(this);
			        case '>':
			            return (v1 > v2) ? options.fn(this) : options.inverse(this);
			        case '>=':
			            return (v1 >= v2) ? options.fn(this) : options.inverse(this);
			        default:
			            return options.inverse(this);
			    }
			});
			
			hbs.registerHelper('json', function(context) {
			    return JSON.stringify(context);
			});
			
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
			
			app.use(express.bodyParser({defer: true}));
			app.use(express.methodOverride());
			app.use(express.cookieParser('nodester'));
			app.use(express.session({ secret: App.config.session.key, store: App.cacheStore }));
						
			app.set('views', path.join(__dirname, '../../') + 'views');
			app.set('view engine', 'html');
			
			app.use(express.static(path.join(__dirname, '../../') + 'public'));
			app.use(require('./validate'));
			app.use(app.router);
			app.use(allowCrossDomain); // CORS
			
			app.locals({
				app_name: 'SparkDashWWW'
			});
			
			
			/**
			*
			* Load Route Files
			*
			*/
			
			app.get('/api', function(req, res){
			  res.send('done');
			});
			
			require('./routes/')(app,App);
			require('./routes/db')(app,App);
			require('./routes/proxy')(app);
			require('./routes/login')(app,App);
			require('./routes/logout')(app,App);
			require('./routes/register')(app,App);
			require('./routes/apps')(app,App);
			require('./routes/data')(app,App);
			
			require('./routes/sparkdash')(app,App);
			
			require('./routes/404')(app,App);
			
			app.get('/health', function(req, res){
			  res.send({
			    pid: process.pid,
			    memory: process.memoryUsage(),
			    uptime: process.uptime()
			  })
			});
			
			app.all('/', function(req, res){
				res.send({message:'Welcome to Semantic Press WWW.'});
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