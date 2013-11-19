/*
	
	NOTE: require.config is located in bin/main.js
	
*/
// Set Globals

var SP = {
	Controller: 'init',
	Network:{
		http: function(opts) {

			var _defaults = {
		    headers: {
					"Accept":"application/json"
				},
		    type: "GET",
				timeout:60000,
				async:true,
		    url: "/"
		  }
			var responseError = function(response) {
				if (response) {
					if(_.isArray(response) && (response.length > 0) ) response = response[0];
			    if (response.error) return errors[response.error];
				}
		  };
	    var ajaxOpts = $.extend({}, _defaults, opts);		
			var dfd = $.Deferred();

			console.log('------ Requesting URL: ' + opts.url);

	   	$.ajax(ajaxOpts).then(
	      function(successResponse) {
	        var error = responseError(successResponse);
	        if (error) {
						Emitter.emit(error, 'error');
					}
					dfd.resolve(successResponse);
	      }, 
	      function(err) {
					console.log('Ajax error');
	        Emitter.emit(err, 'notify');
	      }
	    );

	    return dfd.promise();
	  }
	},
	WS:{
		key: '212c3181292b80f4e1a9',
		channel:(typeof DOMAIN != undefined) ? DOMAIN+'_'+PKG : false
	},
	Tab:{},
	logout: function(){
		$("#layout #main").animate({opacity:0},200,'linear',function(){
			$('#main-menu-container').css({top:"-75px"});
			$('#menu').css({left:0});
			window.location.href='/logout';
		});
	},
	Terminal:false,
	DB:{
		apps:Model("apps",function(){
			this.extend({
			    find_by_ID: function(id) {
			      return this.detect(function() {
			        return this.attr("_id") == id
			      })
			    }
			  })
		}),
		devices:Model("devices",function(){
			
			this.extend({
			    find_by_ID: function(id) {
			      return this.detect(function() {
			        return this.attr("clientID") == id
			      })
			    }
			});
			
			this.extend({
			    countMarked: function() {
						var c=0;
			      this.each(function(){
							console.log("marked: "+this.attr("marked"));
							if (this.attr("marked")) {
								c++;
							}
						});
						return c;
			    }
			});
			
			this.extend({
			    getMarked: function() {
						return this.select(function() {
							if (this.attr("marked")) {
								return this.attr("socketID");
							}
						})
			    }
			});
			
			this.extend({
			    getMarkedSocketIDs: function() {
						return this.select(function() {
							if (this.attr("marked")) {
								if (this.attr("socketID")) {
									return this.attr("socketID");
								}
							}
						})
			    }
			});
			
		}),
	}
};


requirejs.onError = function (err) {
    console.log(err.requireType);
    if (err.requireType === 'timeout') {
        console.log('modules: ' + err.requireModules);
    }

    throw err;
};

// Load each RequireJS controller
require([
	'jquery', 
	'controllers/launchpad', 
	'controllers/app', 
	'controllers/apps', 
	'controllers/data', 
	'controllers/login', 
	'controllers/register', 
	'pace'], function($, launchpad, app, apps, data, login, register, pace) {
	
	/**
	 * MicroEvent - to make any js object an event emitter (server or browser)
	 * 
	 * - pure javascript - server compatible, browser compatible
	 * - dont rely on the browser doms
	 * - super simple - you get it immediatly, no mistery, no magic involved
	 *
	 * - create a MicroEventDebug with goodies to debug
	 *   - make it safer to use
	 * http://notes.jetienne.com/2011/03/22/microeventjs.html
	*/
	var MicroEvent = function(){};
	MicroEvent.prototype	= {
		on	: function(event, fct){
			this._events = this._events || {};
			this._events[event] = this._events[event]	|| [];
			this._events[event].push(fct);
		},
		clear	: function(event, fct){
			this._events = this._events || {};
			if( event in this._events === false  )	return;
			this._events[event].splice(this._events[event].indexOf(fct), 1);
		},
		trigger	: function(event /* , args... */){
			this._events = this._events || {};
			if( event in this._events === false  )	return;
			for(var i = 0; i < this._events[event].length; i++){
				this._events[event][i].apply(this, Array.prototype.slice.call(arguments, 1))
			}
		}
	};

	/**
	 * mixin will delegate all MicroEvent.js function in the destination object
	 *
	 * - require('MicroEvent').mixin(Foobar) will make Foobar able to use MicroEvent
	 *
	 * @param {Object} the object which will support MicroEvent
	*/
	MicroEvent.mixin	= function(destObject){
		var props	= ['on', 'clear', 'trigger'];
		for(var i = 0; i < props.length; i ++){
			destObject.prototype[props[i]]	= MicroEvent.prototype[props[i]];
		}
	}
	
	function registerEmitter() {
    var Emitter = function(obj) {
      this.emit = function(obj, channel) { 
        if (!channel) var channel = 'data';
        this.trigger(channel, obj); 
      };
    };
    MicroEvent.mixin(Emitter);
    return new Emitter();
  }

	var Emitter = registerEmitter();
	
	
	SP.Pace = pace;
	
		
  $(function($) {
		console.log('Starting app');
		
		// Init controller based on the HTML controller property
		SP.Controller = eval($('body').attr('controller'));
		if (typeof SP.Controller === 'object') {
				SP.Controller.start();
		} else {
			alert('No controller available');
		}
		
  });
});

