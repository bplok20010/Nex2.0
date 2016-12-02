/*
Nex.ajax
*/

;(function($){
	"use strict";
	//var ajax = Nex.widget('ajax');
	var ajax = Nex.define('Nex.Ajax').setXType('ajax');
	ajax.extend({
		version : '1.0',
		getDefaults : function(opt){
			var _opt = {
				prefix : 'nexajax-',
				autoDestroy : false,
				ajax : null,
				data : {},
				_qdata : {},
				events : {
					onStart : $.noop,
					onAjaxReady : $.noop,
					onCreate : $.noop,
					onBeforeSend : $.noop,
					onSuccess : $.noop,
					onError : $.noop,
					onComplete : $.noop,
					onAjaxStart : $.noop,
					onAjaxStop : $.noop
				}
			};
			var _opt = this.extSet(_opt);
			return $.extend({},_opt,opt);
		},
		_Tpl : {},
		/*直接使用jquery 的Deferred对象 所以要使用when需要确定jquery版本支持Deferred*/
		when : function(){
			return Nex.when.apply(Nex,arguments);	
		}
	});
	ajax.fn.extend({
		_init : function(opt) {
			var self = this,undef;
			
			opt._beforeSend = opt.beforeSend || null;
			opt._error = opt.error || null;
			opt._success = opt.success || null;
			opt._abort = opt.abort || null;
			opt._complete = opt.complete || null;
			
			if( $.isPlainObject(opt.data) ) {
				$.extend( opt.data,opt._qdata );
			} else if( typeof opt.data === 'string' && typeof opt._qdata === 'string' ) {
				opt.data = opt.data.length ? '&'+opt._qdata : opt._qdata;
			}
			
			opt.abort = function(){
				var argvs = [];
				//var argvs = [].slice.apply(arguments);
				for( var i=0;i<arguments.length;i++ ) {
					argvs.push( arguments[i] );	
				}
				argvs.push( this );
				var r = self.fireEvent('onAbort',argvs);	
				if( r === false ) return r;	
				if( $.isFunction( opt._abort ) ) {
					return opt._abort.apply( self,argvs );
				}
			}
			opt.success = function(){
				var argvs = [];
				//var argvs = [].slice.apply(arguments);
				for( var i=0;i<arguments.length;i++ ) {
					argvs.push( arguments[i] );	
				}
				argvs.push( this );
				if( self._customAbort === true ) {
					opt.abort.apply( this,argvs );
					return;
				}
				var r = self.fireEvent('onSuccess',argvs);	
				if( r === false ) return r;	
				if( $.isFunction( opt._success ) ) {
					return opt._success.apply( self,argvs );
				}
			}
			opt.beforeSend = function(){
				var argvs = [];
				for( var i=0;i<arguments.length;i++ ) {
					argvs.push( arguments[i] );	
				}
				argvs.push( this );
				var r = self.fireEvent('onBeforeSend',argvs);	
				if( r === false ) return r;
				var rf;
				if( $.isFunction( opt._beforeSend ) ) {
					rf = opt._beforeSend.apply( self,argvs );
				}
				if( rf === false ) return false;
				self.fireEvent('onAjaxStart',argvs);	
			}
			opt.error = function(){
				var argvs = [];
				for( var i=0;i<arguments.length;i++ ) {
					argvs.push( arguments[i] );	
				}
				argvs.push( this );
				if( self._customAbort === true ) {
					opt.abort.apply( this,argvs );
					return;
				}
				var r = self.fireEvent('onError',argvs);	
				if( r === false ) return r;
				if( $.isFunction( opt._error ) ) {
					return opt._error.apply( self,argvs );
				}
			}
			opt.complete = function(){
				var argvs = [];
				for( var i=0;i<arguments.length;i++ ) {
					argvs.push( arguments[i] );	
				}
				argvs.push( this );
				self.fireEvent('onAjaxStop',argvs);
				var r = self.fireEvent('onComplete',argvs);	
				if( r === false ) return r;	
				if( $.isFunction( opt._complete ) ) {
					return opt._complete.apply( self,argvs );
				}
			}
			
			self.fireEvent('onAjaxReady',[ opt ]);	
			//检测url是否是用户自定义函数
			if( $.isFunction( opt.url ) ) {
				opt.ajax = $.Deferred ? $.Deferred() : opt.url;	
				var success = function(data){
					if( $.isFunction( opt.dataFilter ) ) {
						data = opt.dataFilter.call( self,data,opt.dataType || 'json' );	
					}
					opt.success.apply( self,[ data ] );
					opt.complete.call( self,self,self._customAbort === true?'abort':'success' );
					if( $.Deferred ) {
						opt.ajax.resolve([ data ]);	
					}
				}; 
				var error = function( data ){
					var argvs = [];
					for( var i=0;i<arguments.length;i++ ) {
						argvs.push( arguments[i] );	
					}
					opt.error.apply( self,[ data ] );
					opt.complete.call( self,self,self._customAbort === true?'abort':'error' );
					if( $.Deferred ) {
						opt.ajax.reject([ data ]);
					}
				};
				var rf = opt.beforeSend.call( self,opt );
				if( rf !== false ) {
					setTimeout( function(){
						var undef,d = opt.url.apply( self,[opt.data,success,error,opt] );	 
						if( d !== undef ) {
							if( d===false ) {
								error(null);	
							} else {
								success(d);		
							}
						}
					},0 );
				}
			} else {
				var rf = opt.beforeSend.call( self,opt );
				opt.beforeSend = null;
				delete opt.beforeSend; 
				if( rf !== false ) {
					opt.ajax = $.ajax( opt );	
				}
			}
			
			self.fireEvent('onCreate',[ opt.ajax,opt ]);	
		},
		getAjax : function(){
			return this.C('ajax');	
		},
		getDeferred : function(){
			return this.getAjax();	
		},
		//设置是否用户自己调用abort来取消请求
		_customAbort : false,
		//如果传递了参数则说明是绑定取消事件
		abort : function(){
			var self = this;
			var argvs = arguments;
			if( argvs.length ) {
				for( var i=0,len = argvs.length;i<len;i++ ) {
					if( $.isFunction( argvs[i] ) ) {
						this.bind('onAbort.deferred',argvs[i]/*,this*/);
					}		
				}
			} else {
				var ajax = self.getAjax();
				if( ajax && ajax.abort ) {
					self._customAbort = true;
					ajax.abort();	
				}
			}
			return self;
		},
		_sysEvents : function(){
			var self = this;
			var opt = self.configs;
			self.bind("onComplete",self._removeAjax,self);
			return self;
		},
		_removeAjax : function(){
			this.configs.autoDestroy = true;
			this.configs.context = null;
			this.removeCmp(true);	
		},
		done : function(func){
			var argvs = arguments;
			for( var i=0,len = argvs.length;i<len;i++ ) {
				if( $.isFunction( argvs[i] ) ) {
					this.bind('onSuccess.deferred',argvs[i]/*,this*/);
				}		
			}
			return this;	
		},
		success : function(){
			this.done.apply(this,arguments);	
			return this;	
		},
		fail : function(){	
			var argvs = arguments;
			for( var i=0,len = argvs.length;i<len;i++ ) {
				if( $.isFunction( argvs[i] ) ) {
					this.bind('onError.deferred',argvs[i]/*,this*/);
				}		
			}
			return this;	
		},
		error : function(){
			this.fail.apply(this,arguments);	
			return this;	
		},
		then : function(s,f,p){	
			if( $.isFunction( s ) ) {
				this.bind('onSuccess.deferred',s/*,this*/);
			}	
			if( $.isFunction( f ) ) {
				this.bind('onError.deferred',f/*,this*/);
			}		
			return this;	
		},
		always : function(){
			var argvs = arguments;
			for( var i=0,len = argvs.length;i<len;i++ ) {
				if( $.isFunction( argvs[i] ) ) {
					this.bind('onComplete.deferred',argvs[i]/*,this*/);
				}		
			}
			return this;
		},
		complete : function(){
			return this.always.apply(this,arguments);	
		}
	});
})(jQuery);