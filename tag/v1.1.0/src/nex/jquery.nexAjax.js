/*
Nex.ajax
*/

;(function($){
	"use strict";
	var ajax = Nex.widget('ajax');
	$.nexAjax = $.extAjax = ajax;
	ajax.extend({
		version : '1.0',
		getDefaults : function(opt){
			var _opt = {
				prefix : 'nexajax-',
				autoDestroy : false,
				ajax : null,
				caller : null,//调用者
				isIE : !!window.ActiveXObject,
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
			opt._complete = opt.complete || null;
			
			if( $.isPlainObject(opt.data) ) {
				$.extend( opt.data,opt._qdata );
			} else if( typeof opt.data === 'string' && typeof opt._qdata === 'string' ) {
				opt.data = opt.data.length ? '&'+opt._qdata : opt._qdata;
			}
			
			opt.success = function(){
				var argvs = [];
				//var argvs = [].slice.apply(arguments);
				for( var i=0;i<arguments.length;i++ ) {
					argvs.push( arguments[i] );	
				}
				argvs.push( this );
				var r = self.fireEvent('onSuccess',argvs);	
				if( r === false ) return r;	
				if( $.isFunction( opt._success ) ) {
					return opt._success.apply( this,argvs );
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
					rf = opt._beforeSend.apply( this,argvs );
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
				var r = self.fireEvent('onError',argvs);	
				if( r === false ) return r;
				if( $.isFunction( opt._error ) ) {
					return opt._error.apply( this,argvs );
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
					return opt._complete.apply( this,argvs );
				}
			}
			
			self.fireEvent('onAjaxReady',[ opt ]);	
			//检测url是否是用户自定义函数
			if( $.isFunction( opt.url ) ) {
				opt.ajax = $.Deferred ? $.Deferred() : opt.url;	
				var success = function(data,smsg){
					smsg = self._undef( smsg,'success' );
					self.fireEvent( 'onSuccess',[ data,smsg ] );
					self.fireEvent('onComplete',[ data,smsg ] );
					if( $.Deferred ) {
						opt.ajax.resolve([ data,smsg ]);	
					}
				}; 
				var error = function( data,smsg ){
					smsg = self._undef( smsg,'error' );
					self.fireEvent( 'onError'  ,[ data,smsg ] );	
					self.fireEvent('onComplete',[ data,smsg ] );
					if( $.Deferred ) {
						opt.ajax.reject([ data,smsg ]);
					}
				};
				var rf = opt.beforeSend.call( self );
				if( rf !== false ) {
					setTimeout( function(){
						var undef,d = opt.url.apply( self,[opt.data,success,error,opt] );	 
						if( d !== undef ) {
							if( d===false ) {
								error(opt.url,'error');	
							} else {
								success(d,'error');		
							}
							self.fireEvent('onComplete',[ d,'error' ] );	
						}
					},0 );
				}
			} else {
				opt.ajax = $.ajax( opt );	
			}
			
			self.fireEvent('onCreate',[ opt.ajax,opt ]);	
		},
		getAjax : function(){
			return this.C('ajax');	
		},
		abort : function(){
			var self = this;
			var ajax = self.getAjax();
			if( ajax && ajax.abort ) {
				ajax.abort();	
			}
		},
		_sysEvents : function(){
			var self = this;
			var opt = self.configs;
			self.bind("onComplete",self._removeAjax,self);
			return self;
		},
		_removeAjax : function(){
			this.C('autoDestroy',true);
			this.removeCmp(true);	
		},
		done : function(func){
			var argvs = arguments;
			for( var i=0,len = argvs.length;i<len;i++ ) {
				if( $.isFunction( argvs[i] ) ) {
					this.bind('onSuccess',argvs[i]);
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
					this.bind('onError',argvs[i]);
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
				this.bind('onSuccess',argvs[i]);
			}	
			if( $.isFunction( argvs[i] ) ) {
				this.bind('onError',f);
			}		
			return this;	
		},
		always : function(){
			var argvs = arguments;
			for( var i=0,len = argvs.length;i<len;i++ ) {
				if( $.isFunction( argvs[i] ) ) {
					this.bind('onComplete',argvs[i]);
				}		
			}
			return this;
		},
		complete : function(){
			return this.always.apply(this,arguments);	
		}
	});
})(jQuery);