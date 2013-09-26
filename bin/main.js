#! /usr/bin/env node

// Clear the console
console.log('\u001B[2J\u001B[0;0f');

var App = require('../lib/')
	, colors = require('colors')
	, fs = require('fs')
	, path = require('path')
	, wrench = require('wrench')
	, util = require('util')
	, spawn = require('child_process').spawn
	, compressor = require('node-minify')
	, requirejs = require('requirejs')
	,	subcommand = process.argv.splice(2, 1)[0]
	, sass = require('node-sass')
	, pkg = require("../package.json")
  , PORT = '3001';


function playSound () {
  spawn("/usr/bin/afplay", ["/System/Library/Sounds/Blow.aiff"]);
}

/**
  * createCompiledDirectory
  *
  * Creates the directory where the static site will exist. Removes any
  * existing directory beforehand.
  *
  * @param String directory Directory where the static site will be stored
  * @param Function callback Callback function
  */
var createCompiledDirectory = function(directory, callback) {
  fs.exists(directory, function(exists) {
    if(exists) {
      util.log("Removing directory: " + directory);
      wrench.rmdirSyncRecursive(directory);
    }

    fs.mkdir(directory, function() {
      util.log("Successfully created directory: " + directory);
      callback();
    });
  });
};
	
var compileStaticFiles = function(_cb){
	
	// See https://github.com/srod/node-minify
	if (App.config.package_js.fileIn.length>0) {
		util.log('Compiling JS files'.yellow);
		var jsArr=[];
		for(var i in App.config.package_js.fileIn) {
			util.log(App.config.package_js.fileIn[i].src);
			if (App.config.package_js.fileIn[i].minify) {
				jsArr.push(srcAssets+'/'+App.config.package_js.fileIn[i].src);
			}
		}
		
		// Add compiled.js
		//jsArr.push(compiledAssets+'/js/compiled.js');
		//console.log(jsArr);	
		
		new compressor.minify({
		    type: App.config.package_js.type,
		    fileIn: jsArr,
		    fileOut: compiledAssets+'/'+App.config.package_js.fileOut,
		    callback: function(err){
		        if (err) {util.log(err+''.red);}
						
						// remove uncompressed files
						App.config.package_js.fileIn.forEach(function(path){
				        path = compiledAssets+'/'+path.src;

								// Don't delete the fileOut if by coincidence the name is the same.
								if (path != compiledAssets+'/'+App.config.package_js.fileOut) {
									util.log(String('Removing: '+path).yellow);
				        	if( fs.statSync(path).isFile() ) {
				            	fs.unlinkSync(path);
				        	}
								}
				    });
						
						
							// // Start Server
							// 							_cb({
							// 									port:PORT
							// 								},
							// 								function(e){
							// 									if (e.error) {
							// 										console.log(e.error);
							// 									} else {
							// 										App.showBanner(e);
							// 									}
							// 							});
				}
		});
		
	} else {
		// Start Server
		_cb({
				port:PORT
			},
			function(e){
				if (e.error) {
					console.log(e.error);
				} else {
					App.showBanner(e);
				}
		});
	}
};


switch(subcommand) {
	case 'build':
	
	
		var srcAssets = path.join(__dirname, '../src');
		var compiledAssets = path.join(__dirname, '../public');
		
		/**
		*
		* Step 1: Create compiled directory
		*
		*/
		createCompiledDirectory(compiledAssets,function(){
			
			
			/**
			*
			* Step 2: Compile RequireJS App
			*
			*/
			var config = {
			    baseUrl: srcAssets+'/js/vendor',
					paths: {
							controllers:'../controllers',
							views:'../views',
							tpl:'../tpl',
			        jquery: 'jquery.1.8.2.min',
							underscore: 'underscore.min',
							avgrund: "avgrund",
							text: 'requirejs-text/text',
							sammy: 'sammy-latest.min',
							handlebars: 'handlebars.runtime',
							hbs: 'hbs',
							pace: 'pace.min',
							moment: "moment.min",
							form2js: "form2js",
							js2form: "js2form"
			    },
					shim: {
			        'jquery.mustache'					: ['jquery'],
							'jquery.easyModal'				: ['jquery'],
							'jquery.ui.widget'				: ['jquery'],
							'faye-browser-min': {
								exports: 'Faye'
							},
							'handlebars': {
								exports: 'Handlebars'
							},
							'sammy':{
								deps: ['jquery'],
								exports: 'Sammy'
							}
			    },
			    name: '../app',
			    out: compiledAssets+'/js/app.min.js'
			};

			console.log('Pre-compiling RequireJS files..');

			requirejs.optimize(config, function (buildResponse) {

				console.log('..done');
				
				fs.createReadStream(srcAssets+'/js/vendor/require.js').pipe(fs.createWriteStream(compiledAssets+'/js/require.js'));
				fs.createReadStream(srcAssets+'/js/vendor/leaflet.bouncemarker.js').pipe(fs.createWriteStream(compiledAssets+'/js/leaflet.bouncemarker.js'));
				fs.createReadStream(srcAssets+'/js/vendor/leaflet.animatedmarker.js').pipe(fs.createWriteStream(compiledAssets+'/js/leaflet.animatedmarker.js'));
				fs.createReadStream(srcAssets+'/js/vendor/leaflet.usermarker.js').pipe(fs.createWriteStream(compiledAssets+'/js/leaflet.usermarker.js'));
				fs.createReadStream(srcAssets+'/js/vendor/leaflet.contextmenu.js').pipe(fs.createWriteStream(compiledAssets+'/js/leaflet.contextmenu.js'));
				fs.createReadStream(srcAssets+'/js/vendor/lvector.js').pipe(fs.createWriteStream(compiledAssets+'/js/lvector.js'));
				
				/**
				*
				* Step 3: Compile CSS
				*
				*/
				
				var banner = '/*\n' +
				          ' * '+pkg.name+'\n' +
				          ' * '+pkg.description+'\n' +
				          ' * '+pkg.url+'\n' +
				          ' * @author '+pkg.author.name+'\n' +
				          ' * @version '+pkg.version+'\n' +
				          ' * Copyright '+pkg.copyright+'. '+pkg.license+' licensed.\n' +
				          ' */\n';

				// Create directory
				fs.mkdirSync(compiledAssets+'/css');
				
				// Render CSS
				sass.render({
				    file: 'src/scss/style.scss',
				    success: function(css){
					
							// create CSS file
							fs.writeFileSync(compiledAssets+'/css/main.css', banner+css);
							
							/**
							*
							* Step 3: Copy Images files
							*
							*/
							wrench.copyDirSyncRecursive(srcAssets+'/img', compiledAssets+'/img');
							console.log("Successfully copied images");
							process.exit(0);
						},
						error: function(error) {
						 	console.error(error);
						},
						includePaths: [ 'src/scss' ],
						outputStyle: 'compressed'
				});
				
				
			}, function(err) {
			    // RequireJS err callback
					console.log('Stop! Error pre-compiling RequireJS. Cannot continue:');
					console.log(err);
			});
			
			
		});
		
		
		
		break;
		
	default:
		
		/**
		* Start server
		*
		* @method App.server.start
		* @param {object} port Port
		* @param {function} callback callback
		* @return true Returns true
		*/
		App.server.api.start({
				port:PORT
			},
			function(e){
				if (e.error) {
					console.log(e.error);
				} else {
					App.showBanner(e);
				}
		});
		
		// using pusher instead
		// App.server.ws.start({port:5001},function(){
		// 	console.log('WS is running on port 5001');
		// });
		break;
}		