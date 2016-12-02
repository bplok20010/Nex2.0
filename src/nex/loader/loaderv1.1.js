/*
xtype loader
继承用
//exports
*/
;(function($){
	"use strict";
	var Loader = Nex.define('Nex.Loader').setXType('loader');
	Loader.extend({
		version : '1.0',
		template : Nex.getTemplate({ ltag : '{{',rtag:'}}',simple:true }),
		_loadCache : {},//加载缓存
		exports : {},//所有加载的模块
		getDefaults : function(opt){
			var _opt = {
				prefix : 'nexloader-',
				denyManager : true,//不需要Manager管理
				autoDestroy : true,
				autoScroll : false,
				autoResize : true,
				_lmt : 0,
				debug : false,
				exportsName : 'exports',//做导出用 最好是没创建一个Loader exportsName都应该设置不同 因为在IE下会有onload 通知不及时问题
				head : document.getElementsByTagName('head')[0] ||  document.documentElement,
				checkExt : true,//自动检查后缀 并添加.js
				checkExtReg : /(\.css|\.js)$/,
				splitChr : true,//会把.分割成"." eg : Nex.Html Nex/Html
				loadType : '',//加载类型 可以指定css js img
				defaultExt : '.js',
				baseUrl : '',
				loadOrder : true,//按顺序加载 只能设为true
				scriptType : 'text/javascript',
				charset : 'utf-8',
				items : [],
				_list : [],//缓存list
				_loadCache : {},//判断是否加载ok
				currScriptAliasName : null,
				currScriptName : null,
				total : 0,//当前加载脚本数
				completeNum : 0,//脚本完成数
				progress : 0,//进度百分比
				_sysPaths : {
					'_nex_' : Nex.baseUrl
				},//Nex默认路径
				paths : {},//路径别名 eg:{ app:'lib/app' } items使用 {{app}}/a.js
				alias : {},//加载别名 eg:{ nex : '{{app}}/nex.js' }
				param : {},
				template : Loader.template,
				autoLoad : true,//初始化后自动加载
				events : {
					onStart : $.noop,
					onCreate : $.noop,
					onInitComponent : $.noop,
					onParseScriptName : $.noop,
					onSuccess : $.noop,
					onError : $.noop,
					onComplete : $.noop
				}
			};
			var _opt = this.extSet(_opt);
			return $.extend({},_opt,opt);
		},
		_Tpl : {}
	});
	Loader.fn.extend({
		_init : function(opt) {
			var self = this;
			window[opt.exportsName] = {};
			self.initComponent();
		},
		__loaderCallBack : [],
		resetExports : function(){
			var self = this,
				opt = self.configs;	
			window[opt.exportsName] = {};
			return self;
		},
		_sysEvents : function(){
			var self = this;
			var opt = self.configs;
			self.bind("onCreate",self._autoLoad,self);
			self.bind("onComplete._require",function(){
				var opt = this.configs;
				opt.items.length = 0;	
			},self);
			//脚本加载完后记录exports 只适合没有依赖的模块
			self.bind("onLoadScriptComplete._require",function(name,opt){
				Loader.exports[ name ] = window[opt.exportsName];
				self.resetExports();
			},self);
			
			//回调实现方式1 ，等所有脚本加载完后才执行
			self.bind("onComplete.require",function(){
				if( opt.loadOrder ) return;
				$.each( self.__loaderCallBack,function(i,data){
					data.callBack();	
				} );
				self.__loaderCallBack = [];	
			},self);
			
			//回调实现方式2 ，依赖加载完后就执行 ,虽然实现会更复杂，但却更符合逻辑
			self.bind("onLoadScriptComplete._require",function(name,opt){
				if( !opt.loadOrder ) return;											   
				var cache = opt._loadCache;
				$.each( self.__loaderCallBack.concat([]),function(i,data){
					var scripts = data.scripts;
					var callBack = data.callBack;
					var complete = true;
					$.each( scripts,function(i,d){				 
						if( (d in cache) && $.type(cache[d]) !== 'boolean'  ) {
							complete = false;
							return false;
						}					 
					} );
					//如果loadOrder模式下没有完成 那么后面的也不用检查了
					if( complete ) {
						callBack();
						self.__loaderCallBack.shift();//出栈
					} 
					if( opt.loadOrder && !complete ) {
						return false;	
					}
				} );
				//self.__loaderCallBack = [];	
			},self);
			
			return self;
		},
		_autoLoad : function(){
			var self = this,
				opt = self.configs;
			
			if( opt.autoLoad ) {
				self.startLoad();	
			}	
		},
		//判断当前状态是否加载完
		_isLoadScript : function( status ){
			return $.type( status ) === 'boolean' ? true : false;	
		},
		/*
		*计算当前的加载进度
		*/
		getProgress : function(){
			var self = this,
				opt = this.configs;
			var cache = opt._loadCache,total=0,completeNum=0;
			for( var n in cache ) {
				total++;
				completeNum = cache[n] === null ? completeNum : ++completeNum;
			}
			opt.total = total;
			opt.completeNum = completeNum;
			opt.progress = completeNum*100/total;
			return opt.progress;
		},
		/*
		*新增一个路径变量
		*@param string 路径变量名称 eg nex
		*@param string 路径地址 eg ./src/nex/
		*/
		setPath : function(/* name,value */){
			var self = this,
				argvs = arguments,
				opt = this.configs;
			if( argvs.length === 1 && $.isPlainObject( argvs[0] ) ) {
				$.extend( opt.paths,argvs[0] );	
			} else {	
				if( argvs[0] && argvs[1] ) {
					opt.paths[argvs[0]] = argvs[1];
				}	
			}
			return self;
		},
		/*
		*新增需要加载的脚本别名
		*@param string 别名 eg Nex.Html
		*@param string 实名路径 eg {{nex}}/Html/Html 此处的{{nex}}引用 path里的
		*/
		setAlias : function(/* name,value */){
			var self = this,
				argvs = arguments,
				opt = this.configs;
			if( argvs.length === 1 && $.isPlainObject( argvs[0] ) ) {
				$.extend( opt.alias,argvs[0] );	
			} else {	
				if( argvs[0] && argvs[1] ) {
					opt.alias[argvs[0]] = argvs[1];
				}	
			}
			return self;
		},
		/*
		*脚本加载失败时调用
		*@param object 事件对象
		*@param func 成功后调用
		*@param func 失败后调用
		*@param func 完成后调用
		*@param string 当前脚本名
		*/
		onScriptLoad : function(evt,s,f,c,_currName){
			var node = evt.currentTarget || evt.srcElement,
				opt = this.configs;
			if (evt.type === 'load' ||
                        (/^(complete|loaded)$/.test(node.readyState))) {
				if($.isFunction(s)) {
					s();	
				}	
				//全局缓存 缓存的真实url
				Nex.Loader._loadCache[ opt.currScriptName ] = true;
				this.fireEvent('onLoadScriptSuccess',[opt]);
				this.onScriptComplete(c,_currName);	
             }
			 return this;
		},
		/*
		*脚本加载失败时调用
		*@param object 事件对象
		*@param func 成功后调用
		*@param func 失败后调用
		*@param func 完成后调用
		*@param string 当前脚本名
		*/
		onScriptError : function(evt,s,f,c,_currName){
			var node = evt.currentTarget || evt.srcElement,
				opt = this.configs;
			if($.isFunction(s)) {
				f();	
			}	
			//全局缓存 缓存的真实url
			Nex.Loader._loadCache[ opt.currScriptName ] = false;
			this.fireEvent('onLoadScriptError',[opt]);
			this.onScriptComplete(c,_currName);	
			return this;
		},
		/*
		*单个脚本加载完后必须调用，检测是否所有脚本都已经加载完
		*@param func 回调
		*@param string 当前脚本名
		*/
		onScriptComplete : function(c,_currName){
			var self = this,
				opt = this.configs,
				cache = opt._loadCache,
				complete = true,
				success = true;	
			//if( opt.loadOrder ) {	
				//从队列中删除已经加载的脚本
				//Nex.array_splice(function(i,v){ return v === _currName ? true : false  },opt._list);
			//}
			//全局缓存 缓存的真实url
			//Nex.Loader._loadCache[ opt.currScriptName ] = true;
			
			this.fireEvent('onLoadProgress',[ self.getProgress() ]);	
			this.fireEvent('onLoadScriptComplete',[_currName,opt]);	
			
			for( var k in cache ) {
				if( cache[k] === null ) {
					complete = false;
					break;	
				}
			}
			
			if( complete ) {
				for( var k in cache ) {
					if( !cache[k] ) {
						success = false;
						break;
					}	
				}	
				if( success ) {
					self.fireEvent('onSuccess',[opt]);	
					if( opt.deferred ) {
						opt.deferred.resolve([ opt ]);	
					}
				} else {
					self.fireEvent('onError',[opt]);	
					if( opt.deferred ) {
						opt.deferred.reject([ opt ]);
					}	
				}
				self.fireEvent('onComplete',[opt]);	
			}	
			
			if( opt.loadOrder ) {
				if( opt.loadOrder && $.isFunction(c) ) {
					c();
				}
			} else {
				if( complete ) {
					self._clearLoadCache();	
				}
			}
			return self;
		},
		/*
		*加载脚本
		*@param string 脚本地址
		*@param func 成功后调用
		*@param func 失败后调用
		*@param string 当前脚本名称
		*/
		loadScript : function(name,s,f,_currName){
			var self = this,
				undef,
				node,
				isOpera = Nex.isOpera,
				url = name,
				opt = this.configs,
				head = opt.head || document.getElementsByTagName('head')[0] ||  document.documentElement
				;	
			node = document.createElement('script');	
			node.type = opt.scriptType || 'text/javascript';
            node.charset = opt.charset || 'utf-8';
            node.async = true;
			
			var complete = function(){
				opt.head.removeChild(node);
				if( opt.loadOrder ) {
					self._load();	
				}
			};
			
			// see requirejs #1781
			if (node.attachEvent &&
                    !(node.attachEvent.toString && node.attachEvent.toString().indexOf('[native code') < 0) &&
                    !isOpera) {
                node.attachEvent('onreadystatechange', function(evt){
					self.onScriptLoad(evt,s,f,complete,_currName);	
				});
            } else {
                node.addEventListener('load', function(evt){
					self.onScriptLoad(evt,s,f,complete,_currName);
				});
                node.addEventListener('error', function(evt){
					self.onScriptError(evt,s,f,complete,_currName);
					if( opt.debug ) {
						Nex.error(name+' load error!');
					}
				});
            }
            node.src = url;
			head.appendChild(node);
			
			if( !opt.loadOrder ) {
				opt._loadCache[opt.currScriptAliasName] = 'pending';	
				self._load();	
			}
			
			return node;
		},
		/*
		*加载样式
		*@param string 脚本地址
		*@param func 成功后调用
		*@param func 失败后调用
		*@param string 当前脚本名称
		*/
		loadCss : function(name,s,f,_currName){
			var self = this,
				undef,
				url = name,
				node,
				opt = this.configs,
				head = opt.head || document.getElementsByTagName('head')[0] ||  document.documentElement
				;	
			node = document.createElement("link");
			node.charset = opt.charset || 'utf-8';
			node.rel = "stylesheet";
    		node.href = url;
			head.appendChild(node);
			
			var complete = function(){
				if( opt.loadOrder ) {
					self._load();	
				}
			};
			
			setTimeout(function() {
			 	 if($.isFunction(s)) {
					 s();	
			 	 }
			  	self.onScriptComplete(complete,_currName);
			}, 1);
			
			if( !opt.loadOrder ) {
				complete();
			}
			
			return node;
		},
		/*
		*开始加载脚本
		*/
		startLoad : function(){
			var self = this,
				undef,
				opt = this.configs;
			//opt.loadOrder = true;//只支持依赖加载 按顺序加载	
			opt.items = $.isArray( opt.items ) ? opt.items : [ opt.items ];
			opt._list = opt.items.concat([]);	
			opt._loadCache = {};
			
			if( !opt.items.length ) {
				return self;	
			}
			
			var r = self.fireEvent('onBeforeStartLoad',[ opt ]);
			if( r === false ) {
				return self;	
			}
			
			for( var i=0,len=opt._list.length;i<len;i++ ) {
				if( opt._list[i] === '' ) continue;
				opt._loadCache[opt._list[i] + ''] = null;
			}
				
			self._load();
			return self;
		},
		_clearLoadCache : function(){
			var self = this,
				undef,
				opt = this.configs;
			opt.currScriptAliasName = null;
			opt.currScriptName = null;
			opt._list.length = 0;	
			opt._loadCache = {};
			return self;
		},
		/*
		*判断当前当前脚本是否都加载完
		*/
		isLoadComplete : function(){
			var self = this,
				undef,
				finish = true,
				opt = this.configs;
			if( !opt._list.length ) {
				return true;	
			}
			$.each( opt._list,function(i,d){
				if( d in opt._loadCache && opt._loadCache[d] === null ) {
					finish = false;	
					return false;
				}						   
			} );
			return finish;
		},
		//获取下一个需要加载的脚本
		getNextLoadScript : function(){
			var self = this,
				undef,
				script = null,
				opt = this.configs;
			if( !opt._list.length ) {
				return script;	
			}
			$.each( opt._list,function(i,d){
				if( d in opt._loadCache && opt._loadCache[d] === null ) {
					script = d;	
					return false;
				}						   
			} );
			return script;
		},
		//获取当前正在执行的脚本名
		getCurrentScriptName : function(){
			var self = this,
				opt = this.configs;
			return opt.currScriptAliasName;
		},
		/*
		*加载单个脚本
		*因为需要加载的文件都会存入一个堆栈(后进先出) 文件加载成功后都会出堆 直到堆栈为空则停止
		*/
		_load : function(){
			var self = this,
				undef,
				opt = this.configs;
			/*if( !opt._list.length ) {
				self._clearLoadCache();
				return self;	
			}*/
			if( self.isLoadComplete() && opt.loadOrder ) {
				self._clearLoadCache();
				return self;	
			}
			
			var _currName = self.getNextLoadScript();//opt._list[0];	
			var name = _currName+'';//opt._list.shift()+'';	
			/*if( !opt.loadOrder ) {
				opt._list.shift();	
			}*/
			
			opt.currScriptAliasName = name;
			
			if( name in opt.alias ) {
				name = opt.alias[name];	
			} else {
				name = opt.baseUrl + name;	
			}
			//判断是否需要把"."替换成"/"
			if( opt.splitChr ) {
				var chr = opt.splitChr === true ? '.' : opt.splitChr;
				name = name.split( chr ).join('/');
			}
			
			name = name.split('/');
			$.each( name,function(i,d){
				if( d in opt.paths ) {
					name[i] = opt.paths[d];	
				}					  
			} );
			name = name.join('/');
			
			try{
				name = opt.template.compile( name,opt.paths );
			} catch(e) {}
			
			//检测如果最后没有.css .js 会自动加上
			if( opt.checkExt && !opt.checkExtReg.test( name ) ) {
				name += opt.defaultExt;	
			}
			
			opt.currScriptName = name;//当前脚本名
			
			self.fireEvent('onParseScriptName',[ name,opt ]);
			
			var success = function(){
				opt._loadCache[opt.currScriptAliasName] = true;	
			};
			var error = function(){
				opt._loadCache[opt.currScriptAliasName] = false;	
			};
			
			
			var query = $.param( opt.param );
			if( query ) {
				query = name.indexOf('?') === -1 ? '?'+query : '&'+query;
			}
			
			name = opt.currScriptName = $.trim(name + query);
			
			var cache = false;
			//检查加载缓存
			if( opt._loadCache[opt.currScriptAliasName] !== null 
				|| ((name in Nex.Loader._loadCache) && Nex.Loader._loadCache[name]) 
			  ) {
				cache = true;
			}
			
			if( cache ) {
				setTimeout( function(){
					success();
					self.onScriptComplete( function(){
						//if( opt.loadOrder ) {
							self._load();	
						//}
					},_currName );
					/*if( !opt.loadOrder ) {
						self._load();
					}	*/
				},1 );
				return self;
			}
			
			if( !opt.loadType ) {
				//加载css
				if( /\.css$/.test( name ) ) {
					self.loadCss( name,success,error,_currName );	
				} else {//加载js
					self.loadScript( name,success,error,_currName );		
				}
			} else {
				if( $.isFunction( opt.loadType ) ) {
					opt.loadType.call(self,name,success,error,_currName);	
				} else {
					if( opt.loadType in self ) {
						self[opt.loadType].call( self,name,success,error,_currName );
					} else {
						self.loadScript( name,success,error,_currName );	
					}
				}
			}
			
			return self;
		},
		/*
		*加载脚本
		*@param {Array} 组件列表 eg ['Nex.Ajax','Nex.Html']
		*@param {func} 回调
		*/
		load : function( list,fn ){
			var self = this,
				undef,
				opt = this.configs;
			//记录当前执行的模块
			var currExports = opt.currScriptAliasName;
			if( list !== undef ) {	
				list = $.isArray( list ) ? list : [ list ];	
			} else {
				list = opt.items;	
			}
			
			if( !list.length && $.isFunction(fn) ) {
				fn();
				return self;
			}
			if( $.isFunction(fn) ) {
				var exports = list.concat([]);
				Nex.array_insert( 0,[{
									 	scripts : exports,//如果当前脚本集合的加载完后  调用回调
										callBack : function(){
											var argvs = [];
											$.each( exports,function(i,v){
												argvs.push( Loader.exports[v] );					  
											} );
											argvs.push( window[opt.exportsName] );
											fn.apply(self,argvs);	
											//如果模块存在 执行回调 并且回调里面的exports保持到当前模块中
											if( currExports ) {
												Loader.exports[ currExports ] = window[opt.exportsName];	
											}
											//清空exports
											self.resetExports();
										}
									}],self.__loaderCallBack,1 );
			}
		
			if( opt._list.length ) {
				$.each( list,function(i,d){
					opt._loadCache[d + ''] = null;
				} );
				if( opt.loadOrder ) {
					Nex.array_insert( 0,list,opt._list,1 );
				} else {
					opt._list.push.apply( opt._list,list );	
					self._load();
				}
			} else {
				opt.items = list;
				self.startLoad();
			}
			return self;	
		},
		require : function(){
			this.load.apply( this,arguments );	
		},
		/*返回Deferred对象 Nex.when会用到*/
		getDeferred : function(){
			return this.configs.deferred;	
		},
		initComponent : function(){
			var self = this,
				undef,
				opt = this.configs;
			
			$.extend(opt.paths,opt._sysPaths);
			opt.items = $.isArray( opt.items ) ? opt.items : [ opt.items ];
				
			self.fireEvent('onCreate',[opt]);
		},
		done : function(func){
			var argvs = arguments;
			for( var i=0,len = argvs.length;i<len;i++ ) {
				if( $.isFunction( argvs[i] ) ) {
					this.one('onSuccess.deferred',argvs[i]);
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
					this.one('onError.deferred',argvs[i]);
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
				this.one('onSuccess.deferred',argvs[i]);
			}	
			if( $.isFunction( argvs[i] ) ) {
				this.one('onError.deferred',f);
			}		
			return this;	
		},
		always : function(){
			var argvs = arguments;
			for( var i=0,len = argvs.length;i<len;i++ ) {
				if( $.isFunction( argvs[i] ) ) {
					this.one('onComplete.deferred',argvs[i]);
				}		
			}
			return this;
		},
		complete : function(){
			return this.always.apply(this,arguments);	
		}
	});
})(jQuery);