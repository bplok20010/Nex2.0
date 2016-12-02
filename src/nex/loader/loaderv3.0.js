/***************************************************
****************AMD 组件加载(单例模式)--不支持打包！****************
****************************************************
****************************************************/
;(function($){
	"use strict";
	var Loader = Nex.define('Nex.Loader').setXType('loader');
	//扩展Nex
	$.extend( Nex,{
		__loader : null,
		_getLoader : function(){
			var self = this,undef;
			if( !self.__loader ) {
				self.__loader = Nex.Create('Nex.Loader',{
					autoLoad : false,
					loadOrder : false,
					cjsRequireRegExp : /[^.]\s*(?:Require|\$require|Nex\.use|Nex\.require)\s*\(\s*["']([^'"\s]+)["']\s*\)/g,
					exportsName : '_export',
					exportsApi : '$exports Exports',
					includeApi : '$require Require',
					defineApi : '$module Module Define',
					'onBeforeParseScriptName.require' : function( name,moduleName,opt ){
						var classPath = Nex.getClassPath( name );
						if( classPath )	{
							classPath = classPath + '';
							classPath = classPath.split('.').join('/');
							opt.currScriptName = classPath;
						}
					},
					'onBeforeLoadScript.require' : function( deps,opt ){
						var loader = this;
						$.each( deps,function(i,v){
							if( Nex.getClass(v) ) {
								if( !Nex.Loader.isLoad( v ) ) {
									Nex.Loader.setLoadCache( v,Nex.getClass(v) );
								}
							}		
						} );
					},
					'onRequireModule.require' : function( deps,exports,opt ){
						if( !(deps in exports) || exports[deps] === undef ) {
							if( Nex.getClass( deps ) ) {
								exports[ deps ] = Nex.getClass( deps );	
							}	
						}	
					},
					nex : Nex.baseUrl
				});
				if( !self.__loader ) {
					return null;	
				}
				self.__loader.setPath('baseUrl',Nex.baseUrl)
							 .setPath('Nex',Nex.baseUrl);
			}
			return self.__loader;
		},
		getLoader : function(){
			return this._getLoader();	
		},
		/*
		*新增一个路径变量
		*@param string 路径变量名称 eg nex
		*@param string 路径地址 eg ./src/nex/
		*/
		requirePath : function(n,v){
			var self = this;
			var loader = self._getLoader();
			if( !loader ) {
				return this;	
			}
			loader.setPath.apply(loader,arguments);
			return this;
		},
		setLoaderPath : function(){
			return this.requirePath.apply( this,arguments );	
		},
		/*
		*新增需要加载的脚本别名
		*@param string 别名 eg Nex.Html
		*@param string 实名路径 eg {{nex}}/Html/Html 此处的{{nex}}引用 path里的
		*/
		requireAlias : function(n,v){
			var self = this;
			var loader = self._getLoader();
			if( !loader ) {
				return this;	
			}
			loader.setAlias.apply(loader,arguments);
			return this;	
		},
		setLoaderAlias : function(){
			return this.requireAlias.apply( this,arguments );	
		},
		requireShims : function(n,v){
			var self = this;
			var loader = self._getLoader();
			if( !loader ) {
				return this;	
			}
			loader.setShims.apply(loader,arguments);
			return this;	
		},
		setLoaderShims : function(){
			return this.requireShims.apply( this,arguments );	
		},
		/*
		*加载组件或脚本
		*如果加载的是组件 则 如果组件存在则不会加载 如果你加载的是组件，名称一定要对上
		*@param {Array} 组件列表 eg ['Nex.Ajax','Nex.Html']
		*@param {func} 回调
		*@param {boolean} 是否强制加载 默认 false  
		*/
		require : function(deps,callback,errback){
			var loader = this._getLoader();
			return loader.require( deps,callback,errback );
		},
		use : function(){
			var loader = this._getLoader();
			return loader.require.apply( loader,arguments );	
		},
		module : function(){
			var loader = this._getLoader();
			return loader.define.apply( loader,arguments );	
		},
		include : function(deps,callback,errback){
			var loader = this._getLoader();
			return loader.require( deps,callback,errback );
		},
		exports : function(o){
			var loader = this._getLoader();
			return loader.exports( o );	
		},
		setLoaderOptions : function(){
			var loader = this._getLoader();
			if( loader ) {
				loader.C.apply( loader,arguments );	
			}	
			return this;
		},
		getLoaderOptions : function(){
			var loader = this._getLoader();
			if( loader ) {
				return loader.C.apply( loader,arguments );	
			}	
			return null;	
		}
	} );
	Loader.extend({
		version : '1.0',
		template : Nex.getTemplate({ ltag : '{',rtag:'}',simple:true }),
		__loader : null,//单例模式的缓存
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
				singleModel : true,//默认开启单例模式
				debug : false,
				strictDeps : true,//严格依赖 如果依赖加载失败就不会执行回调
				commentRegExp : /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg,
       			cjsRequireRegExp : /[^.]\s*(?:\$require|\$include)\s*\(\s*["']([^'"\s]+)["']\s*\)/g,
				exportsName : '_$export',// 做导出用 最好是没创建一个Loader exportsName都应该设置不同 因为在IE下会有onload 通知不及时问题
				exportsApi : '$exports',//全局导出api 最好用这个因为支持IE
				includeApi : '$require $include',//全局加载api 
				defineApi : '$module',
				head : document.getElementsByTagName('head')[0] ||  document.documentElement,
				checkExt : true,//自动检查后缀 并添加.js
				checkExtReg : /(\.css|\.js|\.php|\.jsp|\.py|\.txt|\.htm|\.html|\.php4|\.php5|\.php3|\.do|\.asp|\.aspx)$/,
				loadTypeName : 'loadType',//url loadType参数
				loadType : '',//自定义加载方法 func 或者指定api来加载
				defaultExt : '.js',
				baseUrl : '',
				loadOrder : false,//是否按顺序加载脚本(串联加载，阻塞加载) 默认 false 
				scriptType : 'text/javascript',
				charset : 'utf-8',
				items : [],
				_list : [],//缓存list
				loadQueues : [],
				_loadCache : {},//判断是否加载ok
				module2path : {},//路径对应模块 
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
				urlArgs : {},
				shim : {},//依赖机制
				template : Loader.template,
				autoLoad : false,//初始化后自动加载
				//pending : null,
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
		_Tpl : {},
		/*
		*判断模块是否已经加载
		*@param {String} 模块
		*/
		isLoad : function(moduleName){
			var self = this,
				undef;
			if( moduleName === undef ) {
				return false;	
			}	
			if( Nex.Loader._loadCache[ moduleName ]===true 
				//|| Nex.Loader.exports[ moduleName ] !== undef 
			  ) {
				return true;	
			}
			return false;
		},
		/*
		*获取导出对象
		*/
		getExports : function( name ){
			var self = this,undef;
			var exports = this.exports;
			
			if( name === undef ) {
				return exports;	
			}
			
			if( !(name in exports) || exports[name] === undef ) {
				if( Nex.getClass( name ) ) {
					exports[ name ] = Nex.getClass( name );	
				}	
			}		
			
			return exports[ name ];
		},
		/*
		*设置模块加载缓存 
		*@param {String} 需要设置的模块缓存
		*@param {...} 模块对象
		*/
		setLoadCache : function(moduleName,exports){
			var self = this,
				undef;
			if( moduleName === undef ) {
				return self;	
			} else {
				moduleName = moduleName + '';	
			}
			Nex.Loader._loadCache[ moduleName ]	= true;
			Nex.Loader.exports[ moduleName ] = exports;
			return self;
		},
		/*
		*清空模块加载缓存 
		*@param {moduleName} 需要设置的模块缓存
		*/
		unsetLoadCache : function( moduleName ){
			var self = this,
				undef;
			if( moduleName === undef ) {
				return self;	
			} else {
				moduleName = moduleName + '';	
			}
			delete Nex.Loader._loadCache[ moduleName ];
			delete Nex.Loader.exports[ moduleName ];
			return self;	
		},
		/*
		*清空所有加载缓存
		*/
		clearLoadCache : function(){
			var self = this,
				undef;
			Nex.Loader._loadCache = {};	
			Nex.Loader.exports = {};
			return self;	
		}
	});
	Loader.fn.extend({
		_init : function(opt) {
			var self = this;
			
			if( Loader.__loader && opt.singleModel ) {
				$.extend( self,Loader.__loader );
				return;
			}
			if( opt.singleModel ) {
				Loader.__loader = Loader.__loader ? Loader.__loader : self;
			}
			
			window[opt.exportsName] = {};
			window[opt.exportsName+'CallBack'] = {};
			
			$.each( opt.includeApi.split(/\s+/),function(i,v){
				window[v] = function(){
					return self.require.apply( self,arguments );	
				};	
			} );
			$.each( opt.exportsApi.split(/\s+/),function(i,v){
				window[v] = function(){
					return self.exports.apply( self,arguments );	
				};	
			} );
			$.each( opt.defineApi.split(/\s+/),function(i,v){
				window[v] = function(){
					return self.define.apply( self,arguments );	
				};	
			} );
			
			self.initComponent();
		},
		__loaderCallBack : [],
		resetExports : function(){
			var self = this,
				opt = self.configs;	
			window[opt.exportsName] = {};
			window[opt.exportsName+'CallBack'] = {};
			return self;
		},
		_sysEvents : function(){
			var self = this;
			var opt = self.configs;
			
			self.bind("onCreate",self._autoLoad,self);
			
			return self;
		},
		getExports : function( name ){ 
			return Nex.Loader.getExports( name );
		},
		_checkLoad : function(){
			var self = this,
				opt = self.configs;
				
			self._checkLoad1();		
			/*
			if( opt.loadOrder ) {
				self._checkLoad2();	
			} else {
				self._checkLoad1();	
			}	
			*/
			return self;
		},
		//回调实现方式1 ，等所有脚本加载完后才执行 适合所有模式
		/*
		*回调使用了延时机制，解决内嵌require死循环问题但是不再支持模块打包
		*/
		_checkLoad1 : function(){
			var self = this,
				opt = self.configs;
			var cache = opt._loadCache;
			var callbacks = self.__loaderCallBack;
			self.__loaderCallBack = [];
			$.each( callbacks,function(i,data){
				var isSuccess = true,
					errDeps = [],
					deps = data.deps;
				$.each( deps,function(i,d){				 
					if( (d in cache) && cache[d] === false ) {
						isSuccess = false;
						errDeps.push( d );
						//return false;
					}					 
				} );
				//如果严格模式下 当前模块应该是没有加载成功
				if( opt.strictDeps && !isSuccess ) {
					Nex.Loader.unsetLoadCache( data.moduleName );
				}
				isSuccess = opt.strictDeps ? isSuccess : true;
				if( isSuccess ) {
					if( $.isFunction( data.callBack ) ) {
						setTimeout(function(){
							var callback = data.callBack;
							callback.call(data);	
						},0);
					} 	
				} else {
					if( $.isFunction( data.errBack ) ) {
						setTimeout(function(){
							var callback = data.errBack;
							callback.call(data,errDeps);	
						},0);
					} 		
				}
				
			} );
			
			//self.__loaderCallBack = [];	
			
			return self;
		},
		//以废弃
		//回调实现方式2 ，依赖加载完后就执行 ,虽然实现会更复杂，但却更符合逻辑
		//只适合loadOrder
		_checkLoad2 : function(){
			var self = this,
				opt = self.configs;
			
			var cache = opt._loadCache;
			$.each( self.__loaderCallBack.concat([]),function(i,data){
				var deps = data.deps,
					isSuccess = true,
					errDeps = [],
					complete = true;
				$.each( deps,function(i,d){				 
					if( (d in cache) && !self._isLoadScript( cache[d] ) ) {
						complete = false;
						return false;
					}					 
				} );
				$.each( deps,function(i,d){				 
					if( (d in cache) && cache[d] === false ) {
						isSuccess = false;
						errDeps.push( d );
						//return false;
					}					 
				} );
				//如果严格模式下 当前模块应该是没有加载成功
				if( opt.strictDeps && !isSuccess ) {
					Nex.Loader.unsetLoadCache( data.moduleName );
				}
				isSuccess = opt.strictDeps ? isSuccess : true;
				//如果loadOrder模式下没有完成 那么后面的也不用检查了
				if( complete ) {
					if( isSuccess ) {
						if( $.isFunction( data.callBack ) ) {
							data.callBack();
						} 	
					} else {
						if( $.isFunction( data.errBack ) ) {
							data.errBack(errDeps);
						} 		
					}
					self.__loaderCallBack.shift();//出栈
				} 
				if( opt.loadOrder && !complete ) {
					return false;	
				}
			} );
			
			return self;
		},
		_autoLoad : function(){
			var self = this,
				opt = self.configs;
			
			if( opt.autoLoad ) {
				self.load( opt.items );	
			}	
		},
		//判断当前状态是否加载完
		_isLoadScript : function( status ){
			return ( status === true || status === false ) ? true : false;	
		},
		_isLoadPending : function( status ){
			return status === 'pending' ? true : false;	
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
				completeNum =  !self._isLoadScript( cache[n] ) ? completeNum : ++completeNum;
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
		*设置强制依赖
		*@param string 需要加载的脚本
		*@param string 强制依赖的脚本
		*/
		setShims : function(/* name,value */){
			var self = this,
				argvs = arguments,
				opt = this.configs;
			if( argvs.length === 1 && $.isPlainObject( argvs[0] ) ) {
				$.extend( opt.shim,argvs[0] );	
			} else {	
				if( argvs[0] && argvs[1] ) {
					opt.shim[argvs[0]] = argvs[1];
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
				Nex.Loader._loadCache[ _currName ] = true;
				this.fireEvent('onLoadScriptSuccess',[_currName,opt]);
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
			Nex.Loader._loadCache[ _currName ] = false;
			this.fireEvent('onLoadScriptError',[_currName,opt]);
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
				successDeps = [],
				errDeps = [],
				success = true;	
			//有2中checkLoad机制检查	
			//if( opt.loadOrder ) {
//				self._checkLoad();	
//			}	
			
			this.fireEvent('onLoadScriptComplete',[_currName,opt]);	
			this.fireEvent('onProgress',[ self.getProgress(),_currName,opt ]);	
			
			for( var k in cache ) {
				if( !self._isLoadScript(cache[k]) ) {
					complete = false;
					break;	
				}
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
			
			if( complete ) {
				//清空
				opt.items.length = 0;	
				//有2中checkLoad机制检查
				//if( !opt.loadOrder ) {
//					self._checkLoad();	
//				}
				self._checkLoad();
				
				for( var k in cache ) {
					if( cache[k]===false ) {
						success = false;
						errDeps.push( k );
					} else if( cache[k]===true ) {
						successDeps.push( k );
					}	
				}	
				var sback = function(){
					self.fireEvent('onSuccess',[successDeps,opt]);	
					if( opt.deferred ) {
						opt.deferred.resolve([ opt ]);	
					}	
					self.fireEvent('onComplete',[successDeps,errDeps,opt]);	
				};
				var eback = function(){
					self.fireEvent('onError',[errDeps,opt]);	
					if( opt.deferred ) {
						opt.deferred.reject([ opt ]);
					}	
					self.fireEvent('onComplete',[successDeps,errDeps,opt]);		
				};
				if( success ) {
					/*self.fireEvent('onSuccess',[successDeps,opt]);	
					if( opt.deferred ) {
						opt.deferred.resolve([ opt ]);	
					}*/
					setTimeout(function(){
						sback();	
					},10);
				} else {
					/*self.fireEvent('onError',[errDeps,opt]);	
					if( opt.deferred ) {
						opt.deferred.reject([ opt ]);
					}	*/
					setTimeout(function(){
						eback();	
					},10);
				}
				/*self.fireEvent('onComplete',[successDeps,errDeps,opt]);	*/
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
			
			if( !opt.loadOrder ) {
				opt._loadCache[opt.currScriptAliasName] = 'pending';	
			}	
				
			node = document.createElement('script');	
			node.type = opt.scriptType || 'text/javascript';
            node.charset = opt.charset || 'utf-8';
            node.async = true;
			/*
			*IE下有脚本执行的onload触发时，未必是当前脚本直接结束。可能是好几个脚本同时执行结束后才触发。。。
			*/
			node.scriptName = _currName;
			
			var complete = function(){
				opt.head.removeChild(node);
				if( opt.loadOrder ) {
					self._load();	
				}
			};
			
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
			self.currentlyAddingScript = node;
			
            node.src = url;
			head.appendChild(node);
			
			self.currentlyAddingScript = null;
			
			if( !opt.loadOrder ) {
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
				
			if( !opt.loadOrder ) {
				opt._loadCache[opt.currScriptAliasName] = 'pending';	
			}
				
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
				Nex.Loader._loadCache[ _currName ] = true;
				self.fireEvent('onLoadScriptSuccess',[_currName,opt]);
			  	self.onScriptComplete(complete,_currName);
				if( !opt.loadOrder ) {
					self._load();	
				}
			}, 1);
			/*if( !opt.loadOrder ) {
				complete();
			}*/
			
			return node;
		},
		/*
		*获取模块加载顺序
		*/
		getLoadQueues : function(){
			return this.configs.loadQueues.reverse();	
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

			//opt.pending = true;
			
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
			opt.loadQueues.length = 0;	
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
				if( d in opt._loadCache && !self._isLoadScript(opt._loadCache[d]) ) {
					finish = false;	
					return false;
				}						   
			} );
			return finish;
		},
		/*
		*判断当前队里是否还有正在等待的脚本
		*/
		isAllPending : function(){
			var self = this,
				undef,
				pending = true,
				opt = this.configs;
			$.each( opt._list,function(i,d){
				if( opt._loadCache[d] === null ) {
					pending = false;	
					return false;
				}						   
			} );
			return pending;	
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
				if( d in opt._loadCache && !self._isLoadScript(opt._loadCache[d]) && !self._isLoadPending(opt._loadCache[d]) ) {
					script = d;	
					return false;
				}
			} );
			return script;
		},
		//扩展用
		loadExtension : function(name,success,error,_currName){
			var self = this;
			return self.loadScript( name,success,error,_currName );	
		},
		/*
		*判断模块是否已经加载
		*@param {String} 模块
		*/
		isLoad : function(moduleName){
			return Nex.Loader.isLoad(moduleName);		
		},
		/*
		*设置模块加载缓存 
		*@param {String} 需要设置的模块缓存
		*@param {...} 模块对象
		*/
		setLoadCache : function(moduleName,exports){
			return Nex.Loader.setLoadCache(moduleName,exports);		
		},
		/*
		*清空模块加载缓存 
		*@param {moduleName} 需要设置的模块缓存
		*/
		unsetLoadCache : function( moduleName ){
			return Nex.Loader.unsetLoadCache(moduleName);		
		},
		/*
		*清空所有加载缓存
		*/
		clearLoadCache : function(){
			return Nex.Loader.clearLoadCache();	
		},
		_getShim : function( moduleName ){
			var self = this,
				undef,
				opt = this.configs,
				deps = [];
			
			var modules = $.isArray( moduleName ) ? moduleName : [moduleName];
			$.each( modules,function( i,n ){
				var shim = opt.shim[ n ] === undef ? "" : opt.shim[ n ];
				if( shim ) {
					shim = $.isArray( shim ) ? shim : [shim];	
				} else {
					shim = [];	
				}
				deps.push.apply( deps,shim );
			} );
			
			//清除为空的模块或者以及加载的模块
			Nex.array_splice( function(i,v){
				if( $.trim( v ) === '' ) return true;	
				if( Nex.Loader._loadCache[v] === true || Nex.Loader._loadCache[v] === false ) {
					return true;	
				}
			},deps );
			
			return deps;	
		},
		_addDeps : function( deps ){
			var self = this,
				undef,
				opt = this.configs;
				
			$.each( deps,function(i,d){
				if( !(d in opt._loadCache) ) {
					opt._loadCache[d + ''] = null;
				}
			} );
			
			Nex.array_insert( 0,deps,opt._list,1 );
			
			return self;
		},
		_currentPath : null,
		/*
		*加载单个脚本
		*因为需要加载的文件都会存入一个堆栈(后进先出) 文件加载成功后都会出堆 直到堆栈为空则停止
		*/
		_load : function(){
			var self = this,
				undef,
				opt = this.configs,
				ext = opt.defaultExt.replace('.',"");
			
			if( !opt.loadOrder && self.isAllPending() ) {
				return self;	
			}
			
			if( self.isLoadComplete() ) {
				if( opt.loadOrder ) {
					self._clearLoadCache();
				}
				return self;	
			}
			
			var _currName = self.getNextLoadScript();
			
			_currName = _currName + '';
			var name = _currName;
			opt.currScriptAliasName = name;
			
			if( name in opt.alias ) {
				name = opt.alias[name];	
			} else {
				name = opt.baseUrl + name;	
			}
			
			function getScriptExt(url){
				var _url = url;
				
				url = url.replace(/[?#].*/, "");
				
				if( /\.css$/i.test( url ) ) {
					return 'css';
				}
				if( /\.js$/i.test( url ) ) {
					return 'js';
				}
				
				/*var reg = /\.([^\.]+)$/ig;
				var exts = reg.exec( url );
				if( $.isArray(exts) && exts.length ) {
					return exts[0].replace(".","");	
				}*/
				
				if( /\.css$/i.test( _url ) ) {
					return 'css';
				}
				if( /\.js$/i.test( _url ) ) {
					return 'js';
				}
				
				return '';
			}
			
			opt.currScriptName = name;//当前脚本名
			
			opt.loadQueues.push( _currName );
			
			var r = self.fireEvent('onBeforeParseScriptName',[ name,_currName,opt ]);
			
			name = opt.currScriptName;
			
			if( r !== false ) {
				
				name = name.split('/');
				if( name[0] === '.' && name[1] !=='' ) {
					if( name[1] in opt.paths ) {
						name[1] = opt.paths[name[1]];	
					}	
					name.splice(0,1);
				}
				if( name[0] !== '..' && name[0] !== '' ) {
					if( name[0] in opt.paths ) {
						name[0] = opt.paths[name[0]];	
					}	
				}
				name = name.join('/');
				
				try{
					name = opt.template.compile( name,opt.paths );
				} catch(e) {}
				
				var _ext = getScriptExt( name );
				//检测如果最后没有.css .js .php 会自动加上默认后缀
				if( opt.checkExt && !opt.checkExtReg.test( name ) && !_ext ) {
					name += opt.defaultExt;	
				}
				
				opt.currScriptName = name;//当前脚本名
				
				self.fireEvent('onParseScriptName',[ name,_currName,opt ]);
				
				name = opt.currScriptName;
			}
			
			ext = getScriptExt( name ) || 'js';
			
			var success = function(){
				var name = _currName;
				opt._loadCache[name] = true;	
				
				if( !Nex.isIE ) {//如果不是IE 保存导出对象
					var ep = $.isPlainObject( window[opt.exportsName] ) && $.isEmptyObject( window[opt.exportsName] ) ? undef : window[opt.exportsName];
					if( ep ) {
						Nex.Loader.exports[ name ] =  ep;
					}
					window[opt.exportsName+'CallBack']['moduleName'] = name;
					//window[opt.exportsName+'CallBack'] = {};
				}
				
				self.resetExports();
			};
			var error = function(){
				var name = _currName;
				opt._loadCache[name] = false;	
				//window[opt.exportsName+'CallBack'] = {};
			};
			
			var query = $.param( $.extend(opt.param,opt.params,opt.urlArgs) );
			if( query ) {
				query = name.indexOf('?') === -1 ? '?'+query : '&'+query;
			}
			
			//再次获取扩展名 以确定调用对应的扩展函数加载
			var extReg = new RegExp( opt.loadTypeName+'=[^&]+','ig' );
			if( $.isArray( extReg ) && extReg.length ) {
				ext = extReg.pop().replace('.','');
			}
			
			name = opt.currScriptName = $.trim(name + query);
			
			opt.module2path[ opt.currScriptAliasName ] = name;
			
			var cache = false;
			//检查加载缓存
			if( self._isLoadScript(opt._loadCache[_currName])                 
				|| ((_currName in Nex.Loader._loadCache) && (Nex.Loader._loadCache[_currName]===true)) 
				//|| (_currName in Nex.Loader.exports) 
			  ) {
				cache = true;
			}
			
			if( cache ) {
				opt._loadCache[_currName] = true;//必须
				self.fireEvent('onLoadScriptSuccess',[_currName,opt]);
				
				self.onScriptComplete( function(){
					self._load();	
				},_currName );
				
				if( !opt.loadOrder ) {
					self._load();	
				}
				return self;
			}
			
			//设置默认值 这一步或许不必要 但是按理来说都应该有导出模块 只是默认是{}
			//Nex.Loader.exports[ _currName ] = {};
			//首字母大写
			function replaceReg(reg,str){
				str = str.toLowerCase();
				return str.replace(reg,function(m){return m.toUpperCase()})
			}
			if( !opt.loadType ) {
				//加载css
				if( ext === 'css' ) {
					self.loadCss( name,success,error,_currName );	
				} else if( ext === 'js' ) {//加载js
					self.loadScript( name,success,error,_currName );		
				} else {
					var method = 'load'+replaceReg( /\b(\w)|\s(\w)/g,ext );
					if( (method in self) && $.isFunction( self[method] ) ) {
						self[method].call( self,name,success,error,_currName );
					} else {
						self.loadExtension( name,success,error,_currName );		
					}
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
		//取消加载
		abort : function(){
			var self = this,
				undef,
				errDeps = [],
				successDeps = [],
				opt = this.configs,
				cache = opt._loadCache,
				pendings = [], //正在加载的脚本
				_pendings = {}
				;
			for( var k in cache ) {
				if( cache[k]===false ) {
					success = false;
					errDeps.push( k );
				} else if( cache[k]===true ) {
					successDeps.push( k );
				} else if( cache[k]==='pending' ) {
					pendings.push( k ); 
					_pendings[k] = true;	
				}
			}	
			if( pendings.length ) {
				opt._isAbort = true;
				var eid,eid2;
				eid = self.bind('onLoadScriptComplete._abort',function(module){
					_pendings[ module ] = false;
					var end = true;
					$.each( _pendings,function(k,v){
						if( v ) {
							end = false;
							return false;	
						}	
					} );
					if( end ) {
						opt._isAbort = false;	
						self.unbind('onLoadScriptComplete',eid);	
						self.unbind('onBeforeLoadScript',eid2);	
					}
				});	
				eid2 = self.bind('onBeforeLoadScript._abort',function(list,fn,errback){
					var currExports = Nex.isIE ? self.getInteractiveName() : null;
					$.each( list,function(i,m){
						cache[m] = false;	
					} );
					if( $.isFunction(fn) ) {
						var exports = list.concat([]);
						window[opt.exportsName+'CallBack'] = {
							moduleName : currExports,
							deps : exports,
							errBack : errback,
							callBack : function(){
								var argvs = [];
								$.each( this.deps,function(i,v){
									//argvs.push( Nex.Loader.exports[v] );				
									argvs.push( self.getExports( v ) );				  
								} );
								argvs.push( window[opt.exportsName] );
								fn.apply(self,argvs);	
								var ep = $.isPlainObject( window[opt.exportsName] ) && $.isEmptyObject( window[opt.exportsName] ) ? undef : window[opt.exportsName];
								//如果模块存在 执行回调 并且回调里面的exports保持到当前模块中
								if( this.moduleName ) {//&& !( this.moduleName in Nex.Loader.exports ) 
									Nex.Loader.exports[ this.moduleName ] = ep;	//window[opt.exportsName];	
								}
								//清空exports
								self.resetExports();
							}
						};
						Nex.array_insert( 0,[ window[opt.exportsName+'CallBack'] ],self.__loaderCallBack,1 );
					}
					return false;	
				});
			}
			$.each( opt._list,function(i,m){
				if( cache[m] === null ) cache[m] = false;	
			} );
			self.fireEvent('onAbort',[opt]);	
			return self;
		},
		/*
		*加载脚本
		*@param {Array} 组件列表 eg ['Nex.Ajax','Nex.Html']
		*@param {func} 回调
		*/
		"load" : function( list,fn,errback,module ){//deps,callback,errback
			var self = this,
				undef,
				opt = this.configs;
			
			if( $.isFunction(list) ) {
				var __list = self.getInlineDeps( list );
				fn = list;
				errback = fn;
				module = errback;
				list = __list;
			}	
		
			var r = self.fireEvent('onBeforeLoadScript',[list,fn,errback,opt]);
			if( r === false ) return self;
			
			if( $.type( errback ) === 'string' && module === undef ) {
				module = errback;
				errback = undef;
			}
				
			//由于IE的onload事件回调不准确，我们只能在执行脚本的时候 确定当前执行的脚本名称
			var currExports = Nex.isIE ? self.getInteractiveName() : null;
			
			if( list !== undef ) {	
				list = $.isArray( list ) ? list : [ list ];	
			} else {
				list = opt.items;	
			}
			
			var exports = list.concat([]);
			
			//如果有强制依赖 就检测是否有多级依赖
			var checkCircle = {};//检测环形回路 暂时没有处理
			var shimDeps = [];
			function checkToShimLoad( deps ){
				var _shimLoadCache={},
					eid,
					//是否有强制依赖
					nlist = [];
				$.each( deps,function(i,m){
					var shims = self._getShim( m );	
					if( shims.length ) {
						nlist.push.apply( nlist,shims );	
						$.each( shims,function(i,d){
							checkCircle[d] = true;
							_shimLoadCache[d] = false;	
						} )
					}
				} );
				//简单检测一下
				/*Nex.array_splice(function(i,d){
					if( checkCircle[d] ) {
						return true;	
					}	
				},nlist);*/
				
				if( nlist.length ) {
					list = nlist;
					shimDeps = nlist;
					var eventType = opt.strictDeps ? 'onLoadScriptSuccess' : 'onLoadScriptComplete';
					eid = self.bind( eventType+'._load',function( m ){
						_shimLoadCache[m] = true;
						var complete = true;
						$.each( _shimLoadCache,function(m,r){
							if( !r ) {
								complete = false;
								return false;	
							}		
						} );
						if( complete ) {
							self._addDeps( deps );
							self.load( deps );
							self.unbind( eventType,eid );	
						}
					} );
					checkToShimLoad( nlist );
				}	
			}
			//检测是否设置了shim 强依赖
			if( list.length ) {
				checkToShimLoad( list );	
				//清除为空的模块
				Nex.array_splice( function(i,v){
					if( $.trim( v ) === '' ) return true;	
				},list );
				Nex.array_splice( function(i,v){
					if( $.trim( v ) === '' ) return true;	
				},exports );
			}
			
			if( $.isFunction(fn) ) {
				window[opt.exportsName+'CallBack'] = {
					loader : self,
					moduleName : currExports,
					_module : module,//显示定义的模块名称
					deps : exports,
					errBack : errback,
					callBack : function(){
						var argvs = [];
						$.each( this.deps,function(i,v){
							//argvs.push( Nex.Loader.exports[v] );	
							argvs.push( self.getExports( v ) );					  
						} );
						argvs.push( window[opt.exportsName] );
						var r = fn.apply(this,argvs);	
						if( r !== undef ) {
							window[opt.exportsName] = r;	
						}
						//如果模块存在 执行回调 并且回调里面的exports保持到当前模块中
						var ep = $.isPlainObject( window[opt.exportsName] ) && $.isEmptyObject( window[opt.exportsName] ) ? undef : window[opt.exportsName];
						if( this.moduleName && ep ) {
							Nex.Loader.exports[ this.moduleName ] = ep;
						}
						
						if( this._module && ep ) {
							var mextra = this._module.split(/\s+/);
							$.each( mextra,function(i,v){
								Nex.Loader.exports[ v ] = ep;	
								Nex.Loader._loadCache[ v ] = true;	
							} );
						}
						//清空exports
						self.resetExports();
					}
				};
				Nex.array_insert( 0,[ window[opt.exportsName+'CallBack'] ],self.__loaderCallBack,1 );
			} else {
				window[opt.exportsName+'CallBack'] = {};	
			}
			
			if( opt._list.length ) {
				$.each( list,function(i,d){
					if( !(d in opt._loadCache) ) {
						opt._loadCache[d + ''] = null;
					}
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
		/*
		*获取内置加载模块
		*param {func} 回调
		*/
		getInlineDeps : function(callback){
			var self = this,
				undef,	
				deps = [],
				opt = this.configs;
			if( $.isFunction( callback ) ) {
				callback
						.toString()
						.replace(opt.commentRegExp, '')
						.replace(opt.cjsRequireRegExp, function (match, dep) {
							deps.push(dep);
						});
			} 	
			return deps;
		},
		/*
		*加载模块
		*@param {Array} 需要加载的依赖 {String} 直接获取已经加载的模块 {func} 定义一个模块
		*@param {func} 依赖加载完回调
		*@param {func} 依赖加载失败回调
		*/
		require : function( deps,callback,errback ){
			var self = this,
				undef,	
				opt = this.configs;
			if( !arguments.length ) {
				return self;	
			}	
			if( $.isArray( deps ) ) {
				if( deps.length ) {
					this.load.apply( this,arguments );	
					window[opt.exportsName+'CallBack'] = {};
				} else {
					if( $.isFunction( callback ) ) {
						self.require( callback );	
					}	
				}
			} else if( $.type( deps ) === 'string' ) {
				if( $.isFunction( callback ) ) {
					return self.require( [ deps ],callback,errback );
				}
				self.fireEvent('onRequireModule',[ deps,Nex.Loader.exports,opt ]);
				return Nex.Loader.exports[ deps ];	
			} else if( $.isFunction( deps ) ) {
				var _deps = self.getInlineDeps( deps );
				if( _deps.length ) {
					self.require( _deps,deps );	
				} else {
					deps();	
				}
			}
			return self;
		},
		/*
		*定义一个模块
		*@param {Array} deps 依赖模块
		*@param {Function} callback 依赖加载后调用回调
		*@param {Function} errback 依赖加载失败后调用回调 不建议用
		*/
		define : function(deps,callback,errback){
			var self = this,
				undef,
				argvs = arguments,	
				opt = this.configs;
			if( !argvs.length ) {
				return self;	
			}	
			if( argvs.length === 1 ) {
				self.exports( argvs[0] );
			} else if( $.isArray( deps ) /*&& deps.length*/ ) {
				this.load.apply( this,arguments );	
			} else if( $.type( deps ) === 'string' ) {
				//定义模块
				if( argvs.length>2 && $.isArray( callback ) ) {
					var exports = argvs[1].concat([]),
						currExports = argvs[0],
						errBack = argvs[3],
						fn = argvs[2];
					self.load( exports,fn,undef,currExports );
				} else if( callback!==undef ) {
					Nex.Loader.setLoadCache(deps,callback);	
				}
			} else if( $.isFunction( deps ) ) {
				var _deps = self.getInlineDeps( deps );
				if( _deps.length ) {
					self.require( _deps,deps );	
				} else {
					var d = deps();
					if( d !== undef ) {
						self.exports( d );	
					}	
				}
			} else {
				self.exports( deps );		
			}
			return self;
		},
		//IE下获取currScriptAliasName
		currentlyAddingScript : null,
		interactiveScript : null,
		getInteractiveName : function(){
			var self = this,	
				opt = this.configs;
			if (self.currentlyAddingScript) {
				return self.currentlyAddingScript.scriptName;
			}
			else if (
				self.interactiveScript
				&& self.interactiveScript.readyState === 'interactive'
			) {
				return self.interactiveScript.scriptName;
			}
			//var name = Nex.getcwd(true);	
			var nodes = opt.head.getElementsByTagName("script");
			for (var i = nodes.length, node; node = nodes[--i]; ) {
			  if ( node.readyState === "interactive") {
				  self.interactiveScript = node;
				  return node.scriptName;
			  }
			}
			return null;
		},
		include : function(){
			return this.require.apply( this,arguments );
		},
		//主要是针对IE 导出模块
		exports : function(o){
			var self = this,
				undef,
				opt = this.configs;
			if( Nex.isIE ) {
				var currExports = self.getInteractiveName();
				if( !currExports ) {
					window[opt.exportsName] = o;		
				} else {
					Nex.Loader.exports[ currExports ] = o;	
					window[opt.exportsName] = o;	
					self.resetExports();
				}
			} else {
				window[opt.exportsName] = o;
			}
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
		done : function(){
			var argvs = arguments;
			for( var i=0,len = argvs.length;i<len;i++ ) {
				if( $.isFunction( argvs[i] ) ) {
					this.one('onSuccess._deferred',argvs[i]);
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
					this.one('onError._deferred',argvs[i]);
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
				this.one('onSuccess._deferred',argvs[i]);
			}	
			if( $.isFunction( argvs[i] ) ) {
				this.one('onError._deferred',f);
			}		
			return this;	
		},
		always : function(){
			var argvs = arguments;
			for( var i=0,len = argvs.length;i<len;i++ ) {
				if( $.isFunction( argvs[i] ) ) {
					this.one('onComplete._deferred',argvs[i]);
				}		
			}
			return this;
		},
		progress : function(){
			var argvs = arguments;
			for( var i=0,len = argvs.length;i<len;i++ ) {
				if( $.isFunction( argvs[i] ) ) {
					this.bind('onProgress._deferred',argvs[i]);
				}		
			}
			this.always('onComplete._deferred',function(){
				this.unbind('onProgress._deferred');
			});
			return this;	
		},
		complete : function(){
			return this.always.apply(this,arguments);	
		}
	});
	//创建Loader
	Nex.getLoader();
})(jQuery);