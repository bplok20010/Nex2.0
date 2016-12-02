/***************************************************
****************AMD 组件加载(单例模式)****************
****************************************************
****************************************************/
var require,$require,$module,$import,$define,$exports,Module,define,Define,Require,exports,Exports;
;(function($){
	"use strict";
	var Loader = Nex.define('Nex.Loader').setXType('loader');
	//扩展Nex
	$.extend( Nex,{
		_getLoader : function(){
			return this.Loader._getLoader();	
		},
		getLoader : function(){
			return this.Loader._getLoader();	
		},
		/*
		*新增一个路径变量
		*@param string 路径变量名称 eg nex
		*@param string 路径地址 eg ./src/nex/
		*/
		setLoaderPath : function(){
			this.Loader.setPath.apply( this.Loader,arguments );	
			return this;
		},
		/*
		*新增需要加载的脚本别名
		*@param string 别名 eg Nex.Html
		*@param string 实名路径 eg {{nex}}/Html/Html 此处的{{nex}}引用 path里的
		*/
		setLoaderAlias : function(){
			this.Loader.setAlias.apply( this.Loader,arguments );	
			return this;
		},
		setLoaderShims : function(){
			this.Loader.setShims.apply( this.Loader,arguments );	
			return this;
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
		module : function(){
			var loader = this._getLoader();
			return loader.define.apply( loader,arguments );	
		},
		exports : function(o){
			var loader = this._getLoader();
			return loader.exports( o );	
		},
		setLoaderConfig : function(){
			this.Loader.setConfig.apply( this.Loader,arguments );	
			return this;	
		},
		getLoaderConfig : function(){
			return this.Loader.getConfig.apply( this.Loader,arguments );	
		}
	} );
	Loader.extend({
		version : '1.0',
		template : Nex.getTemplate({ ltag : '{',rtag:'}',simple:true }),
		__NexLoader : null,//Nex的Loader
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
				requireApi : '$require $include',//全局加载api 
				defineApi : '$define $module $import',
				head : document.getElementsByTagName('head')[0] ||  document.documentElement,
				//是否检测文件类型后缀
				checkExt : true,
				defaultExt : '.js',
				//显示指定可以加载的文件类型后缀 eg：['json','xml'] 新增对josn xml的支持 如果不设置 当加载 a.json时会变成a.json.js
				loadExts : [],
				//默认支持的文件后缀 如果不存在则默认会使用 defaultExt来填充到后面
				_checkExtReg : /(\.css|\.js|\.php|\.jsp|\.py|\.txt|\.htm|\.html|\.php4|\.php5|\.php3|\.do|\.asp|\.aspx)$/,
				//显示指定当前路径采用那种扩展来加载 默认只支持 js css txt eg: 'lib/a.php?loadExt=txt'
				loadTypeName : 'loadExt',
				//强制统一所有加载都用该过程
				//自定义加载方法 function 或者指定当前对象的 api名称来加载
				//loadType定义后loadMaps无效
				loadType : '',
				//自定义模块或脚本的加载过程 {'a.json':function(url,s,f,c,m){},'b.txt2':'txt'}
				//做扩展用
				loadMaps : {},
				//对路径提前做写处理
				//例如:如果加载的模块都是以Nex.开头 那么我们就直接把"."替换"/"
				// [{ regexp : /^Nex./,process : function(path){ return path.repalce(/\./ig,'/'); } }]
				pathProcess : [],
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
		_getLoader : function(){
			var self = this,undef;
			if( !self.__NexLoader ) {
				self.__NexLoader = Nex.Create('Nex.Loader',{
					autoLoad : false,
					loadOrder : false,
					cjsRequireRegExp : /[^.]\s*(?:Require|require|\$require|Nex\.require)\s*\(\s*["']([^'"\s]+)["']\s*\)/g,
					exportsName : '_export',
					exportsApi : '$exports Exports',
					requireApi : '$require Require',
					defineApi : '$module $define Module Define $import',
					pathProcess : [
						{
							regexp : function( path ){
								if( path === 'Nex' ) {
									return true;	
								}	
								if( /^Nex\./.test( path ) 
									&& !/\.css/.test( path )
									&& !/\.js/.test( path )
								   ) {
									return true;	   
								}
								return false;
							},
							process : function(path){
								var p = path.split('.');
								if( p.length === 1 ) {
									p.push( p[0] );	
								}
								return p.join('/');	
							}		
						}
					],
					'onBeforeParseScriptName.require' : function( name,moduleName,opt ){
						var classPath = Nex.getClassPath( name );
						if( classPath )	{
							classPath = classPath + '';
							classPath = classPath.split('.').join('/');
							opt.currScriptName = classPath;
						}
					},
					/*
					*加载组件时检测当前组件如果已经存在则不需要设置缓存
					*/
					'onBeforeLoadScript.require' : function( deps,opt ){
						var loader = this;
						$.each( deps,function(i,v){
							if( Nex.getClass(v) ) {
								if( !Nex.Loader.isLoad( v ) ) {
									Nex.Loader.setLoadCache( v,Nex.getClass(v) );
								} 
							} else {//是否加载工具Nex.util
								var s = (v+'').replace(/^Nex\.util\./,'');
								if( Nex.getUtil( s ) ) {
									if( !Nex.Loader.isLoad( v ) ) {
										Nex.Loader.setLoadCache( v,Nex.getUtil(s) );
									}	
								}
							}		
						} );
					},
					nex : Nex.baseUrl
				});
				if( !self.__NexLoader ) {
					return null;	
				}
				self.__NexLoader.setPath('baseUrl',Nex.baseUrl)
							    .setPath('Nex',Nex.baseUrl);
			}
			return self.__NexLoader;
		},
		getLoader : function(){
			return this._getLoader();	
		},
		/*
		*key
		*value
		*/
		setConfig : function(k,v){
			var self = this;
			var loader = Nex._getLoader();
			if( !loader ) {
				return this;	
			}
			loader.C.apply(loader,arguments);
			return this;		
		},
		getConfig : function(){
			var self = this;
			var loader = Nex._getLoader();
			if( !loader ) {
				return null;	
			}
			return loader.C.apply(loader,arguments);
		},
		/*
		*新增一个路径变量
		*@param string 路径变量名称 eg nex
		*@param string 路径地址 eg ./src/nex/
		*/
		setPath : function(){
			var self = this;
			var loader = Nex._getLoader();
			if( !loader ) {
				return this;	
			}
			loader.setPath.apply(loader,arguments);
			return this;	
		},
		/*
		*新增需要加载的脚本别名
		*@param string 别名 eg Nex.Html
		*@param string 实名路径 eg {{nex}}/Html/Html 此处的{{nex}}引用 path里的
		*/
		setAlias : function(){
			var self = this;
			var loader = Nex._getLoader();
			if( !loader ) {
				return this;	
			}
			loader.setAlias.apply(loader,arguments);
			return this;		
		},
		setShims : function(){
			var self = this;
			var loader = Nex._getLoader();
			if( !loader ) {
				return this;	
			}
			loader.setShims.apply(loader,arguments);
			return this;		
		},
		/*添加加载扩展*/
		addExts : function( iarr ){
			var self = this,
				opt = self.configs,
				undef;
			iarr = iarr && $.isArray( iarr ) ? iarr : [ iarr ];
			$.each( iarr,function(i,ext){
				opt.loadExts.push( ext );	
			} );	
			return self;	
		},
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
				} else {//是否加载工具Nex.util
					var s = (name+'').replace(/^Nex\.util\./,'');	
					if( Nex.getUtil( s ) ) {
						exports[ name ] = Nex.getUtil( s );		
					}
				}
			}		
			
			return exports[ name ];
		},
		getModule : function( n ){
			return this.getExports( n );	
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
		},
		/*
		*设置自定义文件扩展加载函数
		*eg: Nex.Loader.setExtFunction( 'php',function(url,success,fail,complete,module){} );
		*/
		setExtFunction : function(){
			var self = this;
			var loader = Nex._getLoader();
			if( !loader ) {
				return this;	
			}
			loader.setExtFunction.apply(loader,arguments);
			return this;			
		},
		/*
		*设置模块的自定义加载过程 eg :
		*Nex.Loader.setLoadMaps('a.json',function( url,success,error,complete,module ){自定义加载过程});
		*/
		setLoadMaps : function(){
			var self = this;
			var loader = Nex._getLoader();
			if( !loader ) {
				return this;	
			}
			loader.setLoadMaps.apply(loader,arguments);
			return this;				
		},
		bind : function(){
			var self = this;
			var loader = Nex._getLoader();
			if( !loader ) {
				return this;	
			}
			loader.bind.apply(loader,arguments);
			return this;				
		},
		one : function(){
			var self = this;
			var loader = Nex._getLoader();
			if( !loader ) {
				return this;	
			}
			loader.one.apply(loader,arguments);
			return this;				
		},
		unbind : function(){
			var self = this;
			var loader = Nex._getLoader();
			if( !loader ) {
				return this;	
			}
			loader.unbind.apply(loader,arguments);
			return this;				
		},
		fireEvent : function(){
			var self = this;
			var loader = Nex._getLoader();
			if( !loader ) {
				return this;	
			}
			loader.fireEvent.apply(loader,arguments);
			return this;				
		},
		on : function(){
			return this.bind.apply(this,arguments);
		},
		off : function(){
			return this.unbind.apply(this,arguments);
		},
		fire : function(){
			return this.fireEvent.apply(this,arguments);	
		},
		abort : function(){
			var self = this;
			var loader = Nex._getLoader();
			if( !loader ) {
				return this;	
			}
			loader.abort.apply(loader,arguments);
			return this;				
		},
		/*
		*设置路径处理流程
		*@param {RegExp,Function} 检测当前路径是否需要处理 true则需要处理
		*@process 处理过程
		*/
		setPathProcess : function( regexp, process ){	
			var self = this;
			var loader = Nex._getLoader();
			if( !loader ) {
				return null;	
			}
			return loader.setPathProcess.apply(loader,arguments);
		},
		unsetPathProcess : function( id ){	
			var self = this;
			var loader = Nex._getLoader();
			if( !loader ) {
				return this;	
			}
			loader.unsetPathProcess.apply(loader,arguments);
			return this;					
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
			
			var config = function(){
				var conf = arguments[0];
				if( $.isPlainObject(conf) ) {
					conf.urlArgs = $.isPlainObject( conf.urlArgs ) ? conf.urlArgs : { '*':conf.urlArgs };
				}
				 return self.C.apply( self,arguments );
			};
			
			$.each( opt.requireApi.split(/\s+/),function(i,v){
				window[v] = function(){
					return self.require.apply( self,arguments );	
				};	
				window[v]['config'] = config;
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
			var self = this;
			var opt = this.configs;
			self.fireEvent('onRequireModule',[ name,Nex.Loader.exports,opt ]);
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
			//成功后回调执行状态
			var exec = {};
			//hash处理
			var maps = {};
			$.each( callbacks,function(i,d){
				if( d.moduleName ) {
					maps[ d.moduleName ] = d;
				}	
			} );
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
					if( $.isFunction( data.callBack ) && !( data.moduleName in exec ) ) {
						//setTimeout(function(){
						var deps = data.deps;
						$.each( deps,function(i,dep){
							if(  dep in exec ) {
								return;		
							}
							if( !(dep in maps) ) {
								return;	
							}
							if( $.isFunction( maps[dep].callBack ) ) {
								maps[dep].callBack.call(maps[dep]);
								exec[ dep ] = true;
							}
						} );
						var callback = data.callBack;
						callback.call(data);	
						exec[ data.moduleName ] = true;
						//},0);
					} 	
				} else {
					if( $.isFunction( data.errBack ) ) {
						//setTimeout(function(){
						var callback = data.errBack;
						callback.call(data,errDeps);	
						//},0);
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
					s(null,c);	
				}	
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
				
			//此事件一定不能用延迟 
			self.fireEvent('onLoadScriptComplete',[_currName,opt]);	
			//如果所有模块都已经缓存，那么通过.progress()不会触发 如果需要触发这里需要延迟执行 setTimeout
			var _pr = self.getProgress();
			setTimeout(function(){
				self.fireEvent('onProgress',[ _pr,_currName,opt ]);	
			},0);
			//检测是否所有脚本加载完成
			for( var k in cache ) {
				if( !self._isLoadScript(cache[k]) ) {
					complete = false;
					break;	
				}
			}
			
			if( $.isFunction(c) ) {
				c();
			}
			
			if( opt.loadOrder ) {
				self._load();
			} else {
				if( complete ) {
					self._clearLoadCache();	
				}
			}
			
			if( complete ) {
				//清空
				opt.items.length = 0;	
				//checkLoad机制检查
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
					self._isLoading = false;
					self.fireEvent('onComplete',[successDeps,errDeps,opt]);	
				};
				var eback = function(){
					self.fireEvent('onError',[errDeps,opt]);	
					if( opt.deferred ) {
						opt.deferred.reject([ opt ]);
					}	
					self._isLoading = false;
					self.fireEvent('onComplete',[successDeps,errDeps,opt]);		
				};
				if( success ) {
					//解决缓存问题导致链式调用的.done 无效
					setTimeout(function(){
						sback();	
					},0);
				} else {
					setTimeout(function(){
						eback();	
					},0);
				}
			}	
			
			return self;
		},
		/*
		*添加自定义加载函数
		*/
		setExtFunction : function( ext,func ){
			function replaceReg(reg,str){
				str = str.toLowerCase();
				return str.replace(reg,function(m){return m.toUpperCase()})
			}
			if( ext === 'js' || ext === 'css' ) {
				return this;	
			}
			ext = replaceReg( /\b(\w)|\s(\w)/g,ext );
			this['load'+ext] = func;
			
			return this;
		},
		/*
		*设置自定义加载过程 eg :
		*Nex.getLoader().setLoadMaps('a.json',function( url,success,error,complete,module ){自定义加载过程});
		*/
		setLoadMaps : function(k,v){
			var self = this,
				opt = this.configs;
			if( arguments.length>1 ) {
				opt.loadMaps[ arguments[0] ] = arguments[1]	
			}else if( $.isPlainObject( arguments[0] ) ) {
				$.extend( opt.loadMaps,arguments[0] );
			}
			return self;	
		},
		/*
		*设置路径处理流程
		*@param {RegExp,Function} 检测当前路径是否需要处理 true则需要处理
		*@process 处理过程
		*/
		setPathProcess : function( regexp, process ){
			var self = this,
				opt = this.configs;	
			return opt.pathProcess.push( {
				regexp : regexp,
				process : process || null	
			} );	
		},
		unsetPathProcess : function( id ){
			var self = this,
				opt = this.configs,
				id = parseInt(id) - 1;
			if( opt.pathProcess[id] ) {
				opt.pathProcess[id] = null;	
			}
			return this;
		},
		/*
		*加载脚本
		*@param string 脚本地址
		*@param func 成功后调用
		*@param func 失败后调用
		*@param string 当前脚本名称
		*/
		loadScript : function(name,s,f,c,_currName){
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
			/*
			*IE下有脚本执行的onload触发时，未必是当前脚本直接结束。可能是好几个脚本同时执行结束后才触发。。。
			*/
			node.scriptName = _currName;
			
			var complete = function(){
				opt.head.removeChild(node);
				if( $.isFunction(c) ) {
					c();
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
			
			return node;
		},
		/*
		*加载样式
		*@param string 脚本地址
		*@param func 成功后调用
		*@param func 失败后调用
		*@param string 当前脚本名称
		*/
		loadCss : function(name,s,f,c,_currName){
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
			
			setTimeout(function() {
			 	 if($.isFunction(s)) {
					 s();	
			 	 }
			}, 1);
			return node;
		},
		/*
		*ajax扩展类型加载
		*@param string 脚本地址
		*@param func 成功后调用
		*@param func 失败后调用
		*@param string 当前脚本名称
		*/
		loadAjax : function( url,success,fail,complete,alias ){
			var self = this,
				undef,
				opt = this.configs
				;
				
			var ajax = Nex.Create('Nex.Ajax',{
				url : url,
				'onSuccess._sys' : function(data){
					if($.isFunction(success)) {
						success(data);	
					}
				},
				'onError._sys' : function(){
					if($.isFunction(fail)) {
						fail();	
					}
				}
			});
			
			return ajax;
		},
		loadTxt : function(){
			return this.loadAjax.apply( this,arguments );	
		},
		/*
		*获取模块加载顺序
		*/
		getLoadQueues : function(){
			return this.configs.loadQueues.reverse();	
		},
		isLoading : function(){
			return this._isLoading;	
		},
		_isLoading : false,
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
			self._isLoading = true;
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
		loadExtension : function(name,success,error,complete,_currName){
			var self = this;
			return self.loadScript( name,success,error,complete,_currName );	
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
			
			//是否加上baseUrL
			var baseUrl = true;
			
			if( name in opt.alias ) {
				name = opt.alias[name];	
				baseUrl = false;
			} else {
				//name = opt.baseUrl + name;	
			}
			
			var _extReg = null;
			if( opt.loadExts.length ) {
				_extReg = new RegExp('\.('+opt.loadExts.join('|')+')$','i');	
			}
			
			function getScriptExt(url){
				var _url = url;
				
				url = url.replace(/[?#].*/, "");
				
				if( opt._checkExtReg.test( url ) 
					|| ( _extReg ? _extReg.test( url ) : false ) 
				) {
					return url.split('.').pop();	
				}
				
				if( opt._checkExtReg.test( _url ) 
					|| ( _extReg ? _extReg.test( _url ) : false ) 
				) {
					return _url.split('.').pop();	
				}
				
				return '';
			}
			
			opt.currScriptName = name;//当前脚本名
			
			opt.loadQueues.push( _currName );
			//{ module : _currName,path : name }
			var r = self.fireEvent('onBeforeParseScriptName',[ name,_currName,opt ]);
			
			name = opt.currScriptName;
			
			if( r !== false ) {
				//处理用户自定义模块路径解析
				//if( !((name in opt.paths) && opt.paths[name]) ) {
				var pathProcess = opt.pathProcess.concat([]).reverse();
				$.each( pathProcess , function(i,d){
					if( d && $.isPlainObject( d ) ) {
						var c = false;
						if( $.type(d.regexp) === 'regexp' ) {
							c = d.regexp.test( name );	
						} else if( $.isFunction( d.regexp ) ) {
							c = d.regexp.call( self,name );
						} else if( d.regexp === name ) {
							c = true;	
						}
						if( c ) {
							var _path;
							if( $.isFunction( d.process ) ) {
								_path = d.process.call( self,name,_currName,opt );	
							} else if( $.type( d.process ) === 'string' ) {
								_path = d.process;	
							} else {
								var p = name.split('.');
								if( p.length === 1 ) {
									p.push( p[0] );	
								}
								_path = p.join('/');		
							}
							name = _path ? _path+'' : name;
							return false;//跳出 break
						}
					}	
				} );
				//}
				//paths 替换
				name = name.split('/');
				if( name[0] === '.' && name[1] !=='' ) {
					if( name[1] in opt.paths ) {
						name[1] = opt.paths[name[1]];	
						baseUrl = false;
					}	
					name.splice(0,1);
				}
				if( name[0] !== '..' && name[0] !== '' ) {
					if( name[0] in opt.paths ) {
						name[0] = opt.paths[name[0]];	
						baseUrl = false;
					}	
				}
				name = name.join('/');
				
				try{
					name = opt.template.compile( name,opt.paths );
				} catch(e) {}
				
				var _ext = getScriptExt( name );
				
				//检测如果最后没有.css .js .php ...会自动加上默认后缀
				if( opt.checkExt 
					&& !opt._checkExtReg.test( name ) 
					&& (_extReg ? !_extReg.test( name ) : true)
					&& !_ext 
				) {
					name += opt.defaultExt;	
				}
				
				//opt.currScriptName = name;//当前脚本名
				
				var _paths = {
					path : _currName,
					url : name,
					module : _currName
				};
				
				self.fireEvent('onParseScriptName',[ _paths,opt ]);
				
				name = _paths.url;
				//name = opt.currScriptName;
				
				var ishttp = /^(http|\/\/)/;
				if( !ishttp.test( name ) && baseUrl ) {
					name = opt.baseUrl+	name;
				}
			}
			
			ext = getScriptExt( name ) || 'js';
			
			var complete = function(){};
			var _complete = complete;
			var success = function(data,complete){
				var name = _currName;
				//扩展加载时用到
				if( data ) {
					self._exports( name,data );		
				}
				
				opt._loadCache[name] = true;	
				Nex.Loader._loadCache[ name ] = true;
				
				if( !Nex.isIE ) {//如果不是IE 保存导出对象
					var ep = $.isPlainObject( window[opt.exportsName] ) && $.isEmptyObject( window[opt.exportsName] ) ? undef : window[opt.exportsName];
					if( ep ) {
						Nex.Loader.exports[ name ] =  ep;
					}
					window[opt.exportsName+'CallBack']['moduleName'] = name;
					//window[opt.exportsName+'CallBack'] = {};
				}
				
				self.resetExports();
				self.fireEvent('onLoadScriptSuccess',[name,opt]);
				self.onScriptComplete( complete || _complete,name );
			};
			var error = function(complete){
				var name = _currName;
				opt._loadCache[name] = false;	
				Nex.Loader._loadCache[ name ] = false;
				//window[opt.exportsName+'CallBack'] = {};
				self.fireEvent('onLoadScriptError',[name,opt]);
				self.onScriptComplete( complete || _complete,name );
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
			var __ext = {
				ext : ext,
				url : name,
				module : _currName	
			};
			self.fireEvent('onGetExtName',[ __ext,opt ]);
			ext = __ext.ext;
			
			name = opt.currScriptName = $.trim(name + query);
			
			opt.module2path[ opt.currScriptAliasName ] = name;
			/********************************/
			var loadType = opt.loadType;
			
			var _map = opt.loadMaps[ _currName ];
			if( _map ) {
				if( $.isFunction( _map ) ) {
					loadType = _map;
				} else {
					loadType = null;
					ext = _map;	
				}
			}
			
			var __d = {
				url : name,
				module : _currName,
				ext : ext,
				loadType : 	loadType,
				success : success,
				error : error,
				complete : complete,
				cache : false
			};
			
			var cache = false;
			//检查加载缓存
			if( self._isLoadScript(opt._loadCache[_currName])                 
				|| ((_currName in Nex.Loader._loadCache) && (Nex.Loader._loadCache[_currName]===true)) 
				//|| (_currName in Nex.Loader.exports) 
			  ) {
				cache = true;
			}
			/*缓存加载流程*/
			if( cache ) {
				__d.cache = true;
				var __r = self.fireEvent('onLoadScriptStart',[__d,opt]);
				if( __r !== false ) {
					opt._loadCache[_currName] = true;//必须
					self.fireEvent('onLoadScriptSuccess',[_currName,opt]);
					
					self.onScriptComplete( function(){
						self._load();	
					},_currName );
				}
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
			
			if( !opt.loadOrder ) {
				opt._loadCache[opt.currScriptAliasName] = 'pending';	
			}	
			
			var __r = self.fireEvent('onLoadScriptStart',[__d,opt]);
			if( __r !== false ) {
				loadType = __d.loadType;
				ext = __d.ext;
				if( !loadType ) {
					//加载css
					if( ext === 'css' ) {
						self.loadCss( name,success,error,complete,_currName );	
					} else if( ext === 'js' ) {//加载js
						self.loadScript( name,success,error,complete,_currName );		
					} else {
						var method = 'load'+replaceReg( /\b(\w)|\s(\w)/g,ext );
						if( (method in self) && $.isFunction( self[method] ) ) {
							self[method].call( self,name,success,error,complete,_currName );
						} else {
							self.loadExtension( name,success,error,complete,_currName );		
						}
					}
				} else {
					if( $.isFunction( loadType ) ) {
						loadType.call(self,name,success,error,complete,_currName);
					} else {
						if( loadType in self ) {
							self[loadType].call( self,name,success,error,complete,_currName );
						} else {
							self.loadScript( name,success,error,complete,_currName );	
						}
					}
				}
			}
			
			if( !opt.loadOrder ) {
				self._load();	
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
					//如果考虑./是相对路径的话 就要考虑用延迟，当前Loader不考虑./ 所有路径都是相对当前页面路径
					//setTimeout(function(){
						self._load();//如果这里能确定是文件形式加载 可以考虑用延迟	
					//},0);
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
			var args = arguments;
			if( $.isArray( deps ) ) {
				if( deps.length ) {
					if( self.isLoading() ) {
						self.one('onComplete._rsys',function(){
							self.load.apply( self,args );	
							window[opt.exportsName+'CallBack'] = {};	
						});	
					} else {
						this.load.apply( this,arguments );	
						window[opt.exportsName+'CallBack'] = {};
					}
				} else {
					if( $.isFunction( callback ) ) {
						self.require( callback );	
					}	
				}
			} else if( $.type( deps ) === 'string' ) {
				if( $.isFunction( callback ) ) {
					return self.require( [ deps ],callback,errback );
				}
				
				var __export =  self.getExports( deps );
				
				return __export;	
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
			if( argvs.length === 1 && !$.isFunction( argvs[0] ) ) {
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
					self.define( _deps,deps );	
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
		/*
		*对特殊导出的接口非IE
		*/
		_exports : function(currExports,o){
			var self = this,
				undef,
				opt = this.configs;	
			Nex.Loader.exports[ currExports ] = o;	
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
	var _loader = Nex.getLoader();
	//不要占用其他加载器的require
	if( !define ) {
		if( !require ) {
			require = function(){
				_loader.require.apply( _loader,arguments );	
			};
			require.config = function(){
				var conf = arguments[0];
				if( $.isPlainObject(conf) ) {
					conf.urlArgs = $.isPlainObject( conf.urlArgs ) ? conf.urlArgs : { '*':conf.urlArgs };
				}
				return _loader.C.apply( _loader,arguments );	
			}
		}
		
		define = function(){
			_loader.define.apply( _loader,arguments );	
		};
		
		if( !exports ) {
			exports = function(){
				_loader.exports.apply( _loader,arguments );	
			};
		}
	}
})(jQuery);