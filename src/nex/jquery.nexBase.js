/*
Nex.base
http://www.extgrid.com
author:nobo
qq:505931977
QQ交流群:13197510
email:zere.nobo@gmail.com or QQ邮箱
v1.0
1.修正继承 fix不能继承父对象的所有属性 bug 严重
2.修正当_optionsList为空时，不在继承父级属性BUG 严重
3.新增getTemplate 返回一个模版对象实例 ,以前的template 不再建议，
4.新增baseUrl
5.新增deferred 和 getDeferred方法
6.修正由于继承时大部分属性和方法都是从父类直接copy过去 所有出现部分方法的变量还是父类的内容
7.通过参数绑定事件时可使用对象来设置上下文 { func,scope }
8.新增Nex.require API提供组件依赖加载
*/
/*********************
********Nex核心*******
*********************/
var Nex = Nex || (function(win,$){
	"use strict";	
	var userAgent = navigator.userAgent.toLowerCase();
	var uaMatch = /msie ([\w.]+)/.exec( userAgent ) || [];
	function getCurrentScript(h) {
		var stack,
			DOC = document,
			undef,
			h = h === undef ? true : false,
			head = DOC.getElementsByTagName("head")[0]
			;
		try {
		  a._b.c(); //强制报错,以便捕获e.stack
		} catch (e) { //safari的错误对象只有line,sourceId,sourceURL
		  if( e.sourceURL ) {
			return e.sourceURL; //safari
		  }
		  stack = e.stack;
		  if (!stack && window.opera) {//opera
			  //opera 9没有e.stack,但有e.Backtrace,但不能直接取得,需要对e对象转字符串进行抽取
			  stack = (String(e).match(/of linked script \S+/g) || []).join(" ");
		  }
		}
		if (stack) {//chrome
		  stack = stack.split(/[@ ]/g).pop(); //取得最后一行,最后一个空格或@之后的部分
		  stack = stack[0] === "(" ? stack.slice(1, -1) : stack.replace(/\s/, ""); //去掉换行符
		  return stack.replace(/(:\d+)?:\d+$/i, ""); //去掉行号与或许存在的出错字符起始位置
		}
		//IE
		var context = h ? head : DOC;
		var nodes = context.getElementsByTagName("script");
		for (var i = nodes.length, node; node = nodes[--i]; ) {
		  if ( node.readyState === "interactive") {
			  return node.src;//node.className = 
		  }
		}
	}
	var baseUrl = getCurrentScript();
	baseUrl = baseUrl.split('/');
	baseUrl.pop();
	baseUrl = baseUrl.join('/');
	//baseUrl = baseUrl ? baseUrl+'/':baseUrl;
	/*如果是IE浏览器 加上各版本样式*/
	$(document).ready(function(){
		if( Nex.isIE && Nex.IEVer ) {
			var cls = ['nex-ie'];
			var bd = $(document.body);
			cls.push( 'nex-ie'+Nex.IEVer );
			bd.addClass( cls.join(' ') );
		}
	});
	return {
		aid : 1,
		tabIndex : 1,
		zIndex : 99999,
		scrollbarSize : false,
		resizeOnHidden : true,
		isOpera : typeof opera !== 'undefined' && opera.toString() === '[object Opera]',
		isChrome : /\bchrome\b/.test( userAgent ),
        isWebKit : /webkit/.test( userAgent ),
		isIE : uaMatch.length ? true : false,
		IEVer : parseFloat( uaMatch[ 1 ], 10 ), //如果非IE 会是NaN
		isIE6 : parseFloat( uaMatch[ 1 ], 10 ) === 6, 
		isIE7 : parseFloat( uaMatch[ 1 ], 10 ) === 7, 
		isIE8 : parseFloat( uaMatch[ 1 ], 10 ) === 8, 
		isIE9 : parseFloat( uaMatch[ 1 ], 10 ) === 9, 
		/*
		*根据参数返回模版对象
		*@param {Object} o ltag rtag simple(简单模式) 
		*@return {Object}
		*/
		getTemplate : function( o ){
			var o = o || {};
			return {
				cache1 : {},
				cache2 : {},
				helper : $.noop,//兼容用
				ltag : o.ltag || '<%',
				rtag : o.rtag || '%>',
				simple :  o.simple || false,
				compile1 : function(str, data){
					var fn = this.cache1[str] ? this.cache1[str] :
					 new Function("obj",
					"var p=[],print=function(){p.push.apply(p,arguments);};" +
					"with(obj){p.push('" +
					str
					  .replace(/[\r\t\n]/g, " ")
					  .split(this.ltag).join("\t")
					  .replace(new RegExp("((^|"+this.rtag+")[^\t]*)'","g"), "$1\r")
					  .replace(new RegExp("\t=(.*?)"+this.rtag,"g"), "',$1,'")
					  .split("\t").join("');")
					  .split(this.rtag).join("p.push('")
					  .split("\r").join("\\'")
				  + "');}return p.join('');");
					this.cache1[str] = fn;
					return data ? fn( data ) : fn;
				},
				compile2 : function(str, data){//简单的模版
					var fn = this.cache2[str] ? this.cache2[str] :
					 new Function("obj",
					"var p=[],print=function(){p.push.apply(p,arguments);};" +
					"with(obj){p.push('" +
					str
					  .replace(/[\r\t\n]/g, " ")
					  .split(this.ltag).join("\t")
					  //.replace(new RegExp("((^|"+this.rtag+")[^\t]*)'","g"), "$1\r")
					  .replace(new RegExp("\t(.*?)"+this.rtag,"g"), "',$1,'")
					  .split("\t").join("');")
					  .split(this.rtag).join("p.push('")
					  .split("\r").join("\\'")
				  + "');}return p.join('');");
					this.cache2[str] = fn;
					return data ? fn( data ) : fn;
				},
				compile : function(){
					if( this.simple ) {
						return this.compile2.apply(this,arguments);	
					} else {
						return this.compile1.apply(this,arguments);		
					}
				}	
			};	
		},
		/*
		*dirname
		*/
		dirname : function(baseUrl){
			baseUrl = baseUrl + '';
			baseUrl = baseUrl.split('/');
			baseUrl.pop();
			baseUrl = baseUrl.join('/');
			return baseUrl;
		},
		/*
		*private
		*safair不支持
		*/
		getcwd : function(h){
			return getCurrentScript(h);	
		},
		baseUrl : baseUrl,
		getCurrentScriptUrl : function(){
			return this.baseUrl;	
		},
		template : {
			cache : {},
			helper : $.noop,//兼容用
			ltag : '<%',//不能修改
			rtag : '%>',//不能修改
			compile : function(str, data){
				var fn = this.cache[str] ? this.cache[str] :
				 new Function("obj",
				"var p=[],print=function(){p.push.apply(p,arguments);};" +
				"with(obj){p.push('" +
				str
				  .replace(/[\r\t\n]/g, " ")
				  .split(this.ltag).join("\t")
				  .replace(new RegExp("((^|"+this.rtag+")[^\t]*)'","g"), "$1\r")
				  .replace(new RegExp("\t=(.*?)"+this.rtag,"g"), "',$1,'")
				  .split("\t").join("');")
				  .split(this.rtag).join("p.push('")
				  .split("\r").join("\\'")
			  + "');}return p.join('');");
				this.cache[str] = fn;
				return data ? fn( data ) : fn;
			}
		},
		/*
		*返回随机字符串
		*@param {Number} 返回自定的长度的随机字符串 默认是6位
		*@return {String}
		*/
		generateMixed : function(n){
			var n = n || 6;
			var chars = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z'];
			var res = "";
			 for(var i = 0; i < n ; i ++) {
				 var id = Math.ceil(Math.random()*35);
				 res += chars[id];
			 }
			 return res;	
		},
		/*
		*返回一个不重复字符串,使用方法同generateMixed
		*/
		unique : function(n){
			var str = Nex.generateMixed(n||6);
			var aid = str+'-'+Nex.aid++;
			return aid;	
		},
		/*
		*判断是否数字格式
		*/
		isNumber : function(value) {
			return /^-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(value) ? true : false;	
		},
		/*
		*检测当前对象是否是Nex类
		*/
		isNexConstructor : function(obj){
			return  $.type(obj) === 'function' && ('_isNexConstructor' in obj)  ? true : false;
		},
		/*
		*检测当前对象是否是Nex实例对象
		*/
		isNex : function(obj){
			return  $.type(obj) === 'object' && ('_isNex' in obj)  ? true : false;
		},
		/*
		*判断当前对象是否是xtype的对象类型 
		*/
		isXtype : function(obj){
			return ( $._isPlainObject( obj ) && ('xtype' in obj ) )	? true : false;
		},
		/*
		*检测是否是jquery实例
		*/
		isjQuery : function(obj){
			return $.type(obj) === 'object' && ('_outerWidth' in obj) ? true :　false;	
		},
		//所有Nex组件集合，目前Nex[className] 和 Nex.classes[className] 作用是一样的
		classes : {},
		getClass : function( cn ){
			return this.classes[cn];	
		},
		addClass : function( n,v ){
			this.classes[n] = v;
			return this;
		},
		_classesPaths : {},
		/*
		*动态加载组件时，设置组件路径
		*@param {String|Object} 组件名|组件和组件路径Map
		*@param {String} 组件路径
		*/
		setClassPath : function(){
			var self = this,
				argvs = arguments;
			if( argvs.length === 1 && $.isPlainObject( argvs[0] ) ) {
				$.extend( self._classesPaths,argvs[0] );	
			} else {	
				if( argvs[0] && argvs[1] ) {
					self._classesPaths[argvs[0]] = argvs[1];
				}	
			}	
			return self;
		},
		/*
		*获取组件路径
		*@param {String} 组件名
		*@return {String} 组件路径
		*/
		getClassPath : function( n ){
			return this._classesPaths[n];	
		},
		/*
		*Nex组件基类包含事件机制
		*@param 组件名称
		*@param 设置组件的xtype
		*@return {NexClass}Nex组件类
		*/
		widget : function(name,xtype){
			var undef,
				//observe
				base = function( opt ){
					var argvs = [].slice.apply(arguments);
					this.init.apply(this,argvs);	
				},
				name = name === undef ? Nex.unique(8) : name,
				xtype = xtype === undef ? name : xtype;
			
			Nex[name] = base;	
			Nex.classes[ name ] = base;
			
			/*
			*添加xtype
			*/
			if( Nex.Manager ) {
				Nex.Manager.addXtype(xtype,function(opt){
					return new Nex.classes[name](opt);									   
				});	
			}
			
			base.fn = base.prototype = {};
			base.fn.extend = function(obj){
				$.extend(this,obj);
			};
			base.extend = function(obj){
				$.extend(this,obj);	
			};
			
			//原型设置
			base.constructor = base.prototype.constructor = base;
			base.prototype.superclass = null;
			base.superclass = null;
			
			base.fn = base.prototype;
			
			base.extend({
				//标识当前函数是属于Nex类
				_isNexConstructor : true,
				puglins : [],
				puglinsConf : {},
				puglinsEvent : {},
				defaults : {},
				eventMaps : {},//事件名映射或者别名 别名:映射名
				addExtConf : function(conf){
					var d = {};
					if( $.isFunction( conf ) ) {
						var d = conf.call( this ) || {};	
					} else {
						d = conf;	
					}
					$.extend( this.puglinsConf,d );
				},
				addExtEvent : function(events){	
					var d = {};
					if( $.isFunction( events ) ) {
						var d = events.call( this ) || {};	
					} else {
						d = events;	
					}
					$.extend( this.puglinsEvent,d );
				},
				addEventMaps : function(maps){	
					var d = {};
					if( $.isFunction( maps ) ) {
						var d = maps.call( this ) || {};	
					} else {
						d = maps;	
					}
					$.extend( this.eventMaps,d );
				},
				_optionsList : [],
				setOptions : function( options ){
					if( $.isPlainObject( options ) ) {//转化成函数方式
						var _opts = options;
						options = function(){
							return _opts;	
						}
					}
					if( $.isFunction( options ) ) {
						//方法一 ： 设置的时候确定parent的参数 缺点 如果parent的class做改变时不会更新  不要使用此方法！！
						//var popts = this.getParentOptions();
						this._optionsList.push( function( opt,t ){
							//方法2 1.能够保证所有setOptions的第二个参数是当前对象 2.不会出现方法一的缺点
							var popts = this.getParentOptions(t);
							popts = $.extend( {},popts,opt );//继承属性
							return $.extend(popts,options.call( this,popts,t ));
						} );
					}
					return this;
				},
				getParentOptions : function(t){
					var ptype = this.getSuperClassXType();
					if( !ptype ) {//ptype === null || 
						return {};	
					}
					return Nex.getClass(ptype).getOptions(t);
				},
				getOptions : function(self){
					var list = this._optionsList;
					var opt = {};
					if( list.length ) {
						for( var i=0,len=list.length;i<len;i++ ) {
							var o = list[i];
							$.extend( opt, $.isFunction( o ) ? o.call(this,opt,self||this) : o  );	
						}
					} else {
						$.extend( opt, this.getParentOptions( self||this )  );		
					}
					opt = this.getDefaults( opt,self || this );
					return opt;
				},
				/*
				*基础类默认参数
				*/
				_def : function(self){ 
					var self = self || this;
					return {
						_base : this.constructor,
						prefix : 'nex_',
						id : '',
						_isInit : false,
						_isResize : false,
						//设备上下文，慎用
						context : null,
						stopOnFalse : true,
						denyManager : false,//不受Manager管理组件 不建议开启
						//autoDestroy 自动回收机制 如果Nex在触发检查的时候检查不到当前元素存在时如果开启后就删除当前组件，所以如果你创建的是一个服务那就应该设为false
						autoDestroy : true,//自动回收 回收后通过Nex.get获取不到组件  autoRecovery
						autoSetResize : false,//是否根据用户的width height 自动设置autoResize
						autoResize : false,
						autoScroll : false,
						groupName : '',//组件分组，一般有批量sendMessage 时会使用到
						resizeOnHidden : Nex.resizeOnHidden,//作废
						cls : '',
						cutHeight : 0,
						cutWidth : 0,
						deferred : $.Deferred ? $.Deferred() : null,
						autoSize : false,
						width : '100%',
						height : '100%',
						maxWidth : 0,
						maxHeight : 0,
						minHeight : 0,
						minWidth : 0,
						realWidth : null,//实际 ,width=auto时 如果max min width height 没起作用那么realWidth = auto
						realHeight : null,//同上
						_width : null,//和realWidth 不同的是 _width是一个数值
						_height : null,
						__width : 0,
						__height : 0,
						tpl : {},
						template : Nex.getTemplate(),//typeof template === 'undefined' ? Nex.template : template,//模板引擎对象
						scrollbarSize : false,
						noop : $.noop,
						self : null,
						init : $.noop,//初始化调用
						renderTo : null,//helper
						views : {},
						items : [],
						isEscape : false,
						cacheData : {},
						_childrenList : [],//当前组件下的之组件，并不严禁， 一般做清除用
						_boxModel : true,
						eventMaps : {},
						events : {}//事件组合 	
					};
				},
				extSet : function( opt,self ){
					
					var opt = $.extend( {},this._def(self),opt );
					//扩展事件
					$.extend( opt.events,this.puglinsEvent );	
					//事件名映射扩展
					$.extend( opt.eventMaps,this.eventMaps );	
					
					return $.extend({},this.puglinsConf,opt);
				},
				getDefaults : function(opt,self){
					var _opt = {};
					var _opt = this.extSet(_opt,self);
					
					return $.extend({},_opt,opt);
				},
				_undef : function (val, defaultVal) {
					return val === undefined ? defaultVal : val;
				},
				getSuperClassXType : function(){
					return null;	
				},
				getSuperClass : function(){
					return this.superclass;	
				},
				setXType : function(xtype){
					var b = this,
						undef;
					if( xtype === undef ) return b;
					
					b.getXType = function(){
						return xtype;	
					};
					b.fn.getXType = function(){
						return xtype;	
					};
					
					Nex.classes[ xtype ] = b;
					
					/*
					*添加xtype
					*/
					if( Nex.Manager ) {
						Nex.Manager.addXtype(xtype,function(opt){
							return new b(opt);									   
						});	
					}
					return b;	
				},
				getXType : function(){
					return xtype;	
				},
				setAliasName : function( aliasName ){
					var self = this;
					if( aliasName ) {
						var __psc = Nex.__psc;
						Nex.__psc = true;
						var aliasNames = $.trim(aliasName).split(/\s+/g);
						$.each( aliasNames,function(i,n){
							Nex.parseSubClass( n,self );
							Nex.addClass( n,self );
						} );
						Nex.__psc = __psc;
					}	
					return self;
				},
				create : function( opt ){
					return new this(opt||{});	
				},
				_Tpl : {}
				
			});
			base.fn.extend({
				//标识当前对象是Nex对象实例
				_isNex : true,
				getSuperClassXType : function(){
					return null;	
				},
				getSuperClass : function(){
					return this.superclass;	
				},
				getXType : function(){
					return xtype;	
				},
				initConfigs : function(){
					var self = this;
					var argvs = [].slice.apply(arguments);
					var constructor = self.constructor;
					var opts = constructor.getOptions( self );
					var configs = $.extend({},opts);
					for( var i=0,len = argvs.length;i<len;i++ ) {
						var options = argvs[i];
						if( $.isFunction( options ) ) {
							options = options.call( self,configs ) || {};	
						} else {
							options = $.extend( {},options );//防止options不是一个对象
						}
						self.initEvents(options);//初始化用户自定义事件
						$.extend( configs,options );
					}
					
					self.configs = configs;
					/*如果参数中有prototype,则当前属性会赋值到当前对象的prototype*/
					var prototype = configs.prototype;
					configs.prototype = null;
					delete configs.prototype;
					
					if( prototype && $.isFunction( prototype ) ) {
						prototype = prototype.call( self,configs );
					}
					
					if( prototype && $._isPlainObject( prototype ) ) {
						$.extend( self,prototype );	
					}
					
					return self;
				},
				init : function(options) {
					var self = this;
					var argvs = [].slice.apply(arguments);
					
					var constructor = self.constructor;
					self.initConfigs.apply( self,argvs );
					var opt = self.configs;
					opt.self = self;
		
					self._eventLocks = {};
		
					opt.id = opt.id || self.getId();
					
					opt._isInit = true;
					
					$.support.boxModel = $.support.boxModel === null ? opt._boxModel : $.support.boxModel;
					
					//系统初始化调用
					if( $.isFunction( opt.init ) && opt.init!==$.noop ) {
						opt.init.call(self,opt);
					}
					
					//系统事件绑定
					self.sysEvents();
					
					self._onStart(opt);//设置用户自定义事件
					
					//保存初始设置值
					opt.__width = opt.width;
					opt.__height = opt.height;
					
					self.fireEvent("onStart",[opt]);
					
					opt.cls = 'nex-component-item '+opt.cls;
					
					//addManager
					if( !opt.denyManager && Nex.Manager ) {
						Nex.Manager.components[opt.id] = self;
					}
					if( !opt.denyManager && Nex.Manager && opt.autoResize ) {
						Nex.Manager.addCmp( opt.id,self );	
						opt.cls += ' nex-resize-auto'; 
					}
					
					if( '_init' in self ) {
						self._init( opt );
					}
					
				},
				/*
				* @m default=false true(更新层级关系)
				*/
				enableAutoResize : function( m ){
					var self = this,undef;
					var opt = self.configs;		
					opt.autoResize = true;
				},
				/*
				* @m default=false true(更新层级关系)
				*/
				disabledAutoResize : function( m ){
					var self = this,undef;
					var opt = self.configs;	
					opt.autoResize = false;
				},
				//数组移动算法
				// pos 要移动的元素
				array_move : Nex.array_move,
				/*
				*删除数组元素 index 为下标或者下表数组 或者回调函数 回调返回true即可
				*/
				array_splice : Nex.array_splice,
				/*				
				*数组插入 index 需要插入的位置 arr源数组,_arr需要插入的值可以是数组,t 0后面  1前面
				*/
				array_insert : Nex.array_insert,
				array_clear : Nex.array_clear,
				array_copy : Nex.array_copy,
				//解决数组迭代时使用splice问题方案,在迭代之前应该使用copyArray复制出来
				copyArray : Nex.copyArray,
				//copy只是对数组或对象只是增加一个引用计数，并不是深复制
				copy : Nex.copy,
				/*
				*判断元素垂直滚动条是否滚动到底 @dom
				*/
				_checkYScrollEnd : function( el ){
					return Nex._checkYScrollEnd( el );
				},
				/*
				*判断元素水平滚动条是否滚动到底 @dom
				*/
				_checkXScrollEnd : function( el ){
					return Nex._checkXScrollEnd( el );	
				},
				/*
				*验证是否滚动到低 @el dom @a left/top
				*/
				isScrollEnd : function( el,a ){
					return Nex.isScrollEnd( el,a );	
				},
				str_number : Nex.str_number,
				_undef : function (val, d) {
					return val === undefined ? d : val;
				},
				distArr : function( arr ){
					var obj={},temp=[];
					for(var i=0;i<arr.length;i++){
						if(!obj[arr[i]]){
							temp.push(arr[i]);
							obj[arr[i]] =true;
						}
					}
					return temp;	
				},
				//只接受 字符串 number 
				inArray : function(elem,arr){
					if( $.type( elem ) === 'number' ) {
						elem = elem+'';	
					}
					if ( arr ) {
						var len = arr.length;
						var i = 0;
						for ( ; i < len; i++ ) {
							// Skip accessing in sparse arrays
							var v = arr[ i ];
							if( $.type( v ) === 'number' ) {
								v = v+'';	
							}
							if ( i in arr && (v === elem) ) {
								return i;
							}
						}
					}
					return -1;
				},
				/*判断是否出现滚动条*/
				hasScroll: function( el, a ) {
					return Nex.hasScroll( el,a );
				},
				/*
				* 获取浏览器滚动条大小
				*/
				getScrollbarSize: function () {
					var self = this,
						opt = self.configs;
					if( Nex.scrollbarSize ) {//全局缓存
						opt.scrollbarSize = Nex.scrollbarSize;
					}	
					if (!opt.scrollbarSize) {
						var db = document.body,
							div = document.createElement('div');
		
						div.style.width = div.style.height = '100px';
						div.style.overflow = 'scroll';
						div.style.position = 'absolute';
		
						db.appendChild(div); 
						
						opt.scrollbarSize = {
							width: div.offsetWidth - div.clientWidth,//竖
							height: div.offsetHeight - div.clientHeight//横
						};
						//IE下 出现过有一边获取不到的情况 就是为0
						opt.scrollbarSize.width = opt.scrollbarSize.width || opt.scrollbarSize.height;
						opt.scrollbarSize.height = opt.scrollbarSize.height || opt.scrollbarSize.width;
						
						opt.scrollbarSize.x = opt.scrollbarSize.height;
						opt.scrollbarSize.y = opt.scrollbarSize.width;
						
						db.removeChild(div);
						
						Nex.scrollbarSize = opt.scrollbarSize;
					}
					return opt.scrollbarSize;
				},
				resize : function(){
					var self = this;
					var opt = self.configs;
					if( Nex.Manager ) {
						setTimeout(function(){
							Nex.Manager.fireEvent("onResize",[opt.id]);		
						},0);
					}	
				},
				//计算 max/min/cut width height 
				__getCalcSize : function( size,t ){
					var self = this,
						undef,
						opt = this.configs;	
					if( $.isFunction( size ) ) {
						size = size.call( self );	
					}
					if( size === undef ) size = 0;
					//暂不提供百分比支持
					size = parseInt(size);
					return 	isNaN(size)?0:size;	
				},
				_getCutWidth : function(){
					var self = this,
						opt = this.configs;	
					//var pw = opt.pWidth;
					var size = opt.cutWidth;
					return 	self.__getCalcSize(size,0);
				},
				_getCutHeight : function(){
					var self = this,
						opt = this.configs;	
					var size = opt.cutHeight;
					return 	self.__getCalcSize(size,1);
				},
				_getMinWidth : function(){
					var self = this,
						opt = this.configs;	
					var size = opt.minWidth;
					return 	self.__getCalcSize(size,0);
				},
				_getMaxWidth : function(){
					var self = this,
						opt = this.configs;	
					var size = opt.maxWidth;
					return 	self.__getCalcSize(size,0);	
				},
				_getMinHeight : function(){
					var self = this,
						opt = this.configs;	
					var size = opt.minHeight;
					return 	self.__getCalcSize(size,1);		
				},
				_getMaxHeight : function(){
					var self = this,
						opt = this.configs;	
					var size = opt.maxHeight;
					return 	self.__getCalcSize(size,1);			
				},
				/*
				*组件参数设置和获取
				*/
				C : function(key,value){
					if( typeof key == 'undefined') {
						return this.configs;	
					}
					if( typeof value == 'undefined' && typeof key !== 'object' ) {
						return this.configs[key];
					}
					if( $.isFunction( value ) ) {
						this.configs[key] = value.call( this,this.configs[key] );	
					} else if( $.isPlainObject( key ) ) {
						var conf = key;
						var opt = this.configs;
						for (var k in conf) {
							var newValue = conf[k];
							var oldValue = opt[k];
			
							if ( $.isArray( oldValue ) ) {
								oldValue.push.apply(oldValue, newValue);
							} else if ($.isPlainObject( oldValue )) {
								$.extend( oldValue, newValue)
							} else {
								opt[k] = newValue;
							}
						}
					} else {
						this.configs[key] = value;
					}
					return this;
				},
				set : function(){
					return this.C.apply(this,arguments);	
				},
				get : function(){
					return this.C.apply(this,arguments);	
				},
				setConfig : function(){
					return this.C.apply(this,arguments);		
				},
				getConfig : function(){
					return this.C.apply(this,arguments);		
				},
				/**
				 * 模板处理函数(用户自定义模版级别最高,其次模板函数,最后_Tpl中的模版)
				 *  @tpl {String,Function} 模板内容
				 *  @data {Object} 模板数据 如果tpl是Function data不一定需要Object
				 *  @return {String} 模板内容
				 */
				tpl : function(tpl,data){
					
					var self = this;
					var opt = self.configs;
					var constructor = self.constructor;
					if( typeof tpl == 'undefined' ) tpl = "";
					if( typeof data == 'undefined' ) data = {};
					
					var _tpl_ = {};
					if( typeof opt.cacheData['_tpl_'] == 'undefined' ) {
						opt.cacheData['_tpl_'] = {};
						_tpl_ = opt.cacheData['_tpl_'];
					} else {
						_tpl_ = opt.cacheData['_tpl_'];
					}
					
					var argvs = [];
					var len = arguments.length;
					for( var i=2;i<len;i++ ) {
						argvs.push( arguments[i] );	
					}
					var argvs = [data].concat( argvs );
					
					var html = "";
					
					if( !opt.template ) {
						if( $.isFunction(tpl) ){
							html = tpl.apply(self,argvs);
						} else if( tpl in self ) {
							html = self[tpl].apply(self,argvs);
						} else {
							html = 	tpl;
						}
						return html;
					}
					
					opt.template.isEscape = opt.isEscape;
					
					if( $.isFunction(tpl) ){
						html = tpl.apply(self,argvs);
					}else if( tpl in opt.tpl && opt.tpl[tpl] ) {
						if( opt.tpl[tpl] in _tpl_ ) {
							var render = _tpl_[ opt.tpl[tpl] ];
							html = render.apply(self,argvs);
						} else {
							var render = opt.template.compile( opt.tpl[tpl] );
							
							_tpl_[ opt.tpl[tpl] ] = render;
							
							html = render.apply(self,argvs);		
						}
					} else if( tpl in self ) {
						html = self[tpl].apply(self,argvs);
					} else if( tpl in constructor._Tpl && constructor._Tpl[tpl] ) {
						if( constructor._Tpl[tpl] in _tpl_ ) {
							var render = _tpl_[ constructor._Tpl[tpl] ];
							html = render.apply(self,argvs);
						} else {
							var render = opt.template.compile( constructor._Tpl[tpl] );
							
							_tpl_[ constructor._Tpl[tpl] ] = render;
							
							html = render.apply(self,argvs);		
						}
					} else {
						if( tpl.toString() in _tpl_ ) {
							var render = _tpl_[ tpl.toString() ];
							html = render.apply(self,argvs);
						} else {
							var render = opt.template.compile( tpl.toString() );
							
							_tpl_[ tpl.toString() ] = render;
							
							html = render.apply(self,argvs);		
						}
					}
					return html;
				},
				/*
				*  调用当前对象里的某个API，但是不会触发里面的事件(部分函数除外例如setGridBody,因为里面事件通过计时器触发)
				*  @param1 {String} 需要调用的API
				*  @param2~N 被调用的API参数(可选)
				*/
				denyEventInvoke : function(){//method,arg1,arg2....
					var self = this;
					var r;
					if( arguments.length ){
						var argvs = [];
						for( var i=0;i<arguments.length;i++ ) {
							argvs.push(arguments[i]);	
						}
						var method = argvs[0];
						if( method in self ) {
							self._denyEvent = true;
							argvs.splice(0,1);
							r = self[method].apply(self,argvs);
							self._denyEvent = false;
						}
					}
					return r;
				},
				/*
				* API调用管理,作用在于通过该函数调用的会过滤被锁定的函数
				*  @param1 {String} 需要调用的API
				*  @param2~N 被调用的API参数(可选)
				*/
				methodInvoke : function(){//method,arg1,arg2....
					var self = this;
					var r;
					
					var methodLocks = self._methodLocks || {};
					
					if( arguments.length ){
						var argvs = [];
						for( var i=0;i<arguments.length;i++ ) {
							argvs.push(arguments[i]);	
						}
						var method = argvs[0];
						
						if( methodLocks[method] ) {
							return;	
						}
						
						if( method in self ) {
							argvs.splice(0,1);
							r = self[method].apply(self,argvs);
						}
					}
					return r;
				},
				/*
				* 事件绑定
				*  @eventType {String} 事件名
				*  @func      {Function} 事件回调
				*  @scope     {Object} this对象(可选)
				*  @return    {int} 事件ID or false
				*/
				bind : function(eventType,func,scope){
					if( typeof eventType == "undefined" ) {
						return false;	
					}
					var _f = func;
					var func = func || $.noop;
					var self = this;
					var opt = self.configs;
					var event = opt.events;
					//批量绑定支持
					if( $.type( eventType ) === 'object' ) {
						var ids = [];
						for( var ev in eventType ) {
							var _i = self.bind( ev,eventType[ev],_f );	
							ids.push( _i );
						}
						return ids;
					} else {//字符串 但是没有做检查 
						var _ev = [ eventType ].join('').split(' ');	
						if( _ev.length>1 ) {
							var len = _ev.length;
							var ids = [];
							for( var _e=0;_e<len;_e++ ) {
								if( !_ev[_e] ) continue;
								ids.push( self.bind( _ev[_e],func,scope ) );
							}
							return ids;
						}					
					}
					
					var _type = eventType.split(".");
					eventType = _type[0];
					var ext = _type.length == 2 ? _type[1] : '';
					
					//事件名映射处理
					//eventMaps
					if( eventType in opt.eventMaps ) {
						eventType = opt.eventMaps[eventType];
					}
					
					event[eventType] = self._undef(event[eventType],[]);
					
					if( $.isFunction( event[eventType] ) ) {
						event[eventType] = [];
					}
					
					var _e = {
							scope : !!scope ? scope : null,
							func : func,
							ext : ext
						};
					
					var id = event[eventType].push(_e);
				
					return id-1;
				},
				on : function(){
					return this.bind.apply(this,arguments);	
				},
				/*
				*同bind 区别在于只执行一次
				*/
				one : function(eventType,func,scope){
					if( typeof eventType == "undefined" ) {
						return false;	
					}
					var func = func || $.noop;
					var self = this;
					var scope = !!scope ? scope : self;
					
					var _ = function(){
							self.unbind(eventType,_.id);
							var r = func.apply(scope,arguments);
							return r;
						},
						id = null;
						
					id = self.bind( eventType,_,scope );
					_.id = id;
					return id;
				},
				/*
				* 取消事件绑定
				*  @eventType {String} 事件名
				*  @id        {int} 事件ID(可选)
				*/
				unbind : function(eventType,id){
					var self = this;
					var opt = self.configs;
					var event = opt.events;
					var id = self._undef(id,false);
					
					var _type = eventType.split(".");
					eventType = _type[0];
					var ext = _type.length == 2 ? _type[1] : '';
					
					if( eventType === '' && ext !== '' ) {
						for( var tp in event ) {
							self.unbind( [tp,ext].join('.') );	
						}
						return self;	
					}
					
					//事件名映射处理
					//eventMaps
					if( eventType in opt.eventMaps ) {
						eventType = opt.eventMaps[eventType];
					}
					
					if( !(eventType in event) ) {
						return self;	
					}
					
					if( $.isFunction( event[eventType] ) ) {
						event[eventType] = [];
						return self;
					}
					
					if(id === false) {
						if( ext === '' ) {
							event[eventType] = [];
						} else {
							
							var j = 0;//用于splice
							for(var i=0;i<event[eventType].length;i++) {
								var _e = event[eventType][i];
								if( $.isPlainObject( _e ) && _e.ext === ext ) {
									event[eventType][i] = null;	
									j++;
								}
							}
						}
					} else {
						event[eventType][id] = null;	
					}
					return self;
				},
				off : function(){
					return this.unbind.apply(this,arguments);	
				},
				/*
				* 锁定API
				*  @method {String} API名
				*/
				lockMethod : function(method){
					var self = this;	
					//事件锁
					var methodLocks = self._methodLocks || {};
					methodLocks[method] = true;
					self._methodLocks = methodLocks;
					return true;	
				},
				/*
				* 取消锁定API
				*  @method {String} API名
				*/
				unLockMethod : function(method){
					var self = this;	
					//事件锁
					var methodLocks = self._methodLocks || {};
					methodLocks[method] = false;
					self._methodLocks = methodLocks;
					return true;	
				},
				/*
				* 锁定事件
				*  @eventType {String} 事件名
				*/
				lockEvent : function(eventType){
					var self = this;	
					//事件锁
					var eventLocks = self._eventLocks || {};
					eventLocks[eventType] = true;
					self._eventLocks = eventLocks;
					return true;
				},
				/*
				* 取消锁定事件
				*  @eventType {String} 事件名
				*/
				unLockEvent : function(eventType){
					var self = this;	
					//事件锁
					var eventLocks = self._eventLocks || {};
					eventLocks[eventType] = false;
					self._eventLocks = eventLocks;
					return true;
				},
				_eventLocks : {},
				_executeEventMaps : {},//正在的执行的事件
				/*
				* 事件触发
				*  @eventType {String} 事件名
				*  @data      {Array} 事件参数(可选)
				*/
				fireEvent : function(eventType,data){
					var self = this;
					if( self._denyEvent ) {
						return;	
					}
					var opt = self.configs;
					
					var context = opt.context || self;
					
					var events = opt.events[eventType];
					var data = self._undef(data,[]);
					
					//判断data 是否 arguments
					if( $.isArray( data ) ) {
						data = data;	
					} else if( $.type( data ) === 'object' ){
						if( 'callee' in data && 'length' in data ) {
							data = data	
						} else {
							data = [data];	
						}
					} else {
						data = [data];
					}
					//data = $.isArray( data ) ? data : [data];
					//添加事件锁
					var eventLocks = self._eventLocks || {};
					if( eventLocks[eventType] ) {
						return;	
					}
					//防止死循环事件
					if( self._executeEventMaps[eventType] ) {
						return;	
					}
					self._executeEventMaps[eventType] = true;
					
					var r = true;
					if($.isArray(events) ) {
						var len = events.length;
						for(var i=0;i<len;i++) {
							var _e = events[i];
							if( $.isPlainObject( _e ) ) {
								r = _e.func.apply(_e.scope || context,data);
							} else if( $.isFunction( _e ) ){
								r = _e.apply(self,data);
							}
							if( opt.stopOnFalse ) {
								if(r === false) break;	
							}
						}	
						
					} else if($.isFunction(events)) {
						r = events.apply(self,data);
					}
					
					self._executeEventMaps[eventType] = false;
					
					return r;
				},
				fire : function(){
					return this.fireEvent.apply(this,arguments);	
				},
				loadPuglins : function(){
					var self = this;
					var constructor = self.constructor;
					$.each( constructor.puglins,function(i){
						if( $.isFunction( this ) )
							this.call(self);									
					} );
				},
				initEvents : function(opt){
					var self = this;
					var e = opt.events ? opt.events : {};
					var events = {};
					if( $.isPlainObject(e) && !$.isEmptyObject(e) ) {
						for(var i in e){
							var _evt = i+"",
								evt = _evt.split('.')[0],
								ext = _evt.split('.')[1],
								fn = e[i],
								context = null;
							events[evt] = events[evt] || [];	
							if( $.isPlainObject( fn ) && !$.isEmptyObject( fn ) ) {
								context = fn.scope || fn.context || null;	//scope
								fn = fn.func || fn.fn || fn.callBack || $.noop;
								if( $.isFunction(fn) && fn !== $.noop ){
									//self.bind(x,fn,context);	
									events[evt].push( {
										func : fn,
										scope : context,
										ext : ext || ''
									} );
								}
							} else if( $.isFunction(fn) && fn !== $.noop ) {
								//e[i] = [ e[i] ];//
								events[evt].push({
									func : fn,
									scope : null,
									ext : ext || ''
								});
							}	
						}
					}
					opt.events = events;
				},
				sysEvents : function(){
					var self = this;
					var opt = self.configs;
					//系统事件 注意：顺序不可随意更改
					if( '_sysEvents' in self ) {
						self._sysEvents();
					}
					
					self.bind("onStart",self.loadPuglins);	
				},
				generateMixed : function(n){
					 return Nex.generateMixed( n );	
				},
				_getId : function(){
					var aid = Nex.aid++;
					var self = this;
					var opt = self.configs;
					return opt.prefix + aid;	
				},
				getDom : function(){
					var self = this,
						opt = self.configs;
					return $('#'+opt.id);
				},
				getEl : function(){
					return this.getDom();	
				},
				getId : function(){
					if( this.configs.id === '' || this.configs.id === null || this.configs.id === undefined ) {
						return this._getId();	
					}
					return this.configs.id;	
				},
				//获取组件的父级组件
				getParent : function(  ){
					var el = this.getDom(),
						cmp = null;
					if( !el.size() ) return cmp;
					var p = el.parent('.nex-component-item'),
						_id = p.attr('id');
					cmp = _id ? Nex.get(id) : p.data('_nexInstance_');
					if( !cmp ) cmp = null;
					return cmp;
				},
				unique : function(n){
					return Nex.unique(n);	
				},
				isNumber : function(value) {
					return Nex.isNumber( value );	
				},
				/*
				*系统事件
				*/
				_onStart : function(){
					var self = this;
					var opt = self.configs;
					var e = opt.events ? opt.events : {};
					var reg = /^on[A-Z][\w|\.]*$/;
					for(var x in opt ) {
						if( reg.test(x) ) {
							var fn = opt[x],
								context = null;
							if( $.isPlainObject( fn ) && !$.isEmptyObject( fn ) ) {
								context = fn.context || fn.scope || null;	
								fn = fn.func || fn.fn || fn.callBack;
							}
							if( $.isFunction(fn) && fn !== $.noop ){
								self.bind(x,fn,context);	
							}
						}
					}
				},
				isNexConstructor : function(obj){
					return  Nex.isNexConstructor( obj );
				},
				isNex : function(obj){
					return  Nex.isNex( obj );
				},
				isXtype : function(obj){
					return Nex.isXtype( obj );
				},
				isjQuery : function(obj){
					return Nex.isjQuery( obj );
				},
				/*
				*解析xtype 到容器
				*@param {String,Dom} 容器
				*@param {Array,Nex,Xtype} 组件列表 
				*@param {Boolean} 内部插入 默认是 后 
				*/
				parseItems : function(renderTo,items,after){
					var self = this,
						opt = self.configs,
						undef;
					var after = after === undef ? true : after;
					var ac = after ? 'append' : 'prepend';
					if( $.isFunction( items ) && !self.isNexConstructor( items ) ) {
						items = items.call( self,renderTo );
					}
					var components = [];
					var items = $.isArray( items ) ? items : [items];
					if( renderTo && items.length ) {
						for( var i=0;i<items.length;i++ ) {
							var _item = items[i];
							if( _item === '' || _item === undef ) continue;
							if( $.isFunction( _item ) && !self.isNexConstructor( _item ) ) {
								_item = _item.call(self,renderTo,opt);	
								if( _item === '' 
								    || $.type( _item ) === 'boolean' 
									|| $.type( _item ) === 'null' 
									|| $.type( _item ) === 'undefined' 
								) {
									continue;	
								}
							}
							if( self.isNex( _item ) ) {
								_item.C('superclass',self);
								$( renderTo )[ac]( _item.getDom() );
								components.push( _item );
								self.addChildCmpList( _item );
							} else if( self.isNexConstructor( _item ) || self.isXtype( _item ) ){
								if( !Nex.Create ) continue;
								var cmp;
								if( self.isXtype( _item ) ) {
									cmp = Nex.Create( $.extend( _item,{renderTo:renderTo,superclass:self} ) );	
								} else {
									cmp = Nex.Create( _item,{renderTo:renderTo,superclass:self} );		
								}
								components.push( cmp );
								self.addChildCmpList( cmp );
								if( !after ) {
									$( renderTo )[ac]( cmp.getDom() );	
								}
							} else if( self.isjQuery( _item ) ) {
								$( renderTo )[ac]( _item );	
								components.push( _item );
							} else {
								_item = _item + '';
								var html = $._parseHTML( _item );//修正相同字符 不创建bug
								html = $(html).clone();
								components.push( html );
								$( renderTo )[ac]( html );				
							}	
						}
					}
					return components;
				},
				addComponent :　function( renderTo,items,after ){
					return this.parseItems( renderTo,items,after );
				},
				/*
				*解析xtype 到容器
				*@param {Array,Nex,Xtype} 组件列表 
				*@param {String,Dom} 容器
				*@param {Boolean} 内部插入 默认是 后 
				*/
				renderComponent : function( items,renderTo,after ){
					return this.parseItems( renderTo,items,after );	
				},
				render : function(){
					//todo...
					return this;	
				},
				addChildCmpList :　function(obj){
					var self = this;
					var opt = self.configs;
					opt._childrenList.push( obj );
				},
				//m @true 默认删除本身, false 删除子元素
				removeCmp :  function(m){
					var self = this,undef;
					var m = m === undef ? true : m;
					var opt = self.configs;
					opt._childrenList.length = 0;
					if( Nex.Manager ) {
						Nex.gc();
					}
				},
				/*
				*移除组件 最好需要重载
				*/
				destroy : function( m ){
					this.removeCmp( m );
					return this;
				},
				//作废
				_setBodyOverflowHidden : function(){},
				getDeferred : function(){
					var opt = this.configs;
					return opt.deferred;
				},
				/*
				*获取异步数据 必须要加载Nex.Ajax
				*方式一 通过URL设置
				*getAsyncData(url[success,error,complete,options]);
				*success,error,complete {Function}  options {Object}
				*eg getAsyncData( 'a.json',function( data ){ console.log( data ) },{ dataType:'json' } );
				*/
				getAsyncData : function( url ){
					var self = this,
						undef,
						success,
						error,
						complete,
						options,
						args = [].slice.apply(arguments);	
					var ins = null;	
					//参数处理	
					var len = args.length;
					for( var i=1;i<len;i++ ) {
						if( typeof args[i] === 'object' ) {
							options = args[i];
							break;	
						}
						if( typeof args[i] === 'function' ){
							switch( i ) {
								case 1:
									success = args[1];
									break;
								case 2:
									error = args[2];
									break;
								case 3:
									complete = args[3];
									break;		
							}
						}
					}	
					//url的处理方式	
					if( $.type( url ) === 'string' ) {
						var obj = {
								xtype : 'ajax',
								url : url,
								context : self
							};
						if( options ) {
							$.extend( obj,options );	
						}
						if( success ) {
							obj['onSuccess.__async'] = success;
						}
						if( error ) {
							obj['onError.__async'] = error;
						}
						if( complete ) {
							obj['onComplete.__async'] = complete;
						}
						ins = Nex.Create( obj );
					} else if( $.type( url ) === 'function' ) {//用户自定义函数处理方式
						var _data = url.call(self,options,success,error,complete);
						if( _data !== undef ) {
							success( _data );	
							complete();
						}	
					} else if( typeof url === 'object' ) {
						var obj = {
							xtype : 'ajax'	
						};
						if( !Nex.isXtype( url ) ) {
							$.extend( obj,url )	
						} else {
							obj = url;	
						}
						if( success ) {
							obj['onSuccess.__async'] = success;
						}
						if( error ) {
							obj['onError.__async'] = error;
						}
						if( complete ) {
							obj['onComplete.__async'] = complete;
						}
						ins = Nex.Create( obj );
					}
					return ins;
				},
				//ajax api
				loadData : function(url,data,options){//loader
					var self = this,
						undef,
						opt = self.configs;
						
				}
			});
			return base;
		},
		//数组移动算法
		// pos 要移动的元素
		array_move : function(iarr,pos,target,t) {//t 代表是前还是后 1 代表前 0 代表后

			if(pos == target) return iarr;
			var __arr = iarr;
			//支持字符下标
			var _iarr = iarr = [].concat(__arr);
			iarr = [];
			var j=0,
				len = _iarr.length;
			for(;j<len;j++) {
				var _i = iarr.push(j);
				if( j == pos) {
					pos = _i-1;
				} else if( j == target ) {
					target = _i-1;
				}
			}
			//core
			var _p = iarr[pos];//记录元副本
			if( pos>target ) {
				if(!t) {
					target++;
				}
				for(var i=pos;i>=0;i--) {
					if(i == target) {
						iarr[i] = _p;
						break;
					}
					iarr[i] = iarr[i-1];
				}
			} else if( pos<target ) {
				if(t) {
					target--;
				}
				for(var i=pos;i<=target;i++) {
					
					if( i == target ) {
						iarr[i] = _p;
					} else {
						iarr[i] = iarr[i+1];
					}	
				}
			}
			//字符下标
			
			var new_arr = __arr;
			new_arr.length = 0;
			//new_arr.push.apply(new_arr,_iarr); //不建议用 因为 _iarr 会有长度限制 63444
			var k=0,
				len = iarr.length;
			for( ;k<len;k++ ) {
				new_arr.push( _iarr[ iarr[k] ] );
			}
			iarr = new_arr;
			return iarr;
		},
		/*
		*删除数组元素 index 为下标或者下标数组 或者回调函数 回调返回true即可
		*/
		array_splice : function(index,arr){
			var self = this,undef;
			if( !$.isArray( arr ) ) return arr;
			
			var call = index;
			
			if( $.isArray( index ) && index.length<=1 ) {
				index = index[0];
			}
			
			if( index === undef ) return arr;
			
			//如果index 不是数组或者不是回调时 直接调用splice;
			if( !$.isArray( index ) && !$.isFunction(index) ) {
				if( isNaN( parseInt( index ) ) ) return arr;
				arr.splice( parseInt(index),1 );
				return arr;
			}
			
			var _arr = self.copy( arr );
			var index = $.isArray( index ) ? index : ($.isFunction(index) ? [] : [index]);
			var _index = {};
			$.each(index,function(i,v){
				_index[v] = true;	
			});
			
			arr.length = 0;
			
			$.each( _arr,function(i,v){
				if( $.isFunction( call ) ) {
					var r = call.call(v,i,v);	
					if( r === true ) {
						_index[i] = true;	
					}
				}
				if( !(i in _index) ) {
					arr.push(v);	
				}	
			} );
			
			return arr;
		},
		/*				
		*数组插入 index 需要插入的位置 arr源数组,_arr需要插入的值可以是数组,t 0后面  1前面 _arr 长度不要超过6W+
		*/
		array_insert : function(index,_arr,arr,t){
			var self = this,
				undef,
				t = t === undef ? 0 : t;
			if( !$.isArray( arr ) ) return arr;
			
			var call = index;
			
			if( !$.isArray( _arr ) ) _arr = [ _arr ];
			
			if( index === undef ) return arr;
			
			var len = arr.length;
			if( index<len ) {
				if( t )	{
					_arr = _arr.concat( [ arr[index] ] );	
				} else {
					_arr = [ arr[index] ].concat( _arr );
				}
			}
			_arr = [index,1].concat( _arr );
			arr.splice.apply(arr,_arr);
			return arr;
		},
		array_clear : function(arr){
			arr.length = 0;
			return arr;
		},
		array_copy : function(arr){
			var _ = [];
			return _.concat( arr );	
		},
		//解决数组迭代时使用splice问题方案,在迭代之前应该使用copyArray复制出来
		copyArray : function(arr){
			var _ = [];
			return _.concat( arr );
		},
		//copy只是对数组或对象只是增加一个引用计数，并不是深复制
		copy : function(data){
			if( $.isArray( data ) ) {
				return  [].concat(data);	
			} else if( $.isPlainObject(data) ) {
				return $.extend({},data);
			} else {
				return data;	
			}
		},
		str_number : function(num,elc){//elc 截取的小数位
			var num = num + '';
			if( $.type( num ) === 'string' ) {
				var n = num.split('.');
				if( n.length>1 ) {
					var ext = n[1].substring(0,elc);	
					if( ext !== '' ) {
						num = [n[0],ext].join('.');	
					} else {
						num = n[0];
					}
				}	
			}
			return Number(num);
		},
		/*
		*判断元素垂直滚动条是否滚动到底 @dom
		*/
		_checkYScrollEnd : function( el ){
			var scrollTop = 0;
			var clientHeight = 0;
			var scrollHeight = 0;	
			if( el === document.body || el === document || el === window ) {
				if (document.documentElement && document.documentElement.scrollTop) {
					scrollTop = document.documentElement.scrollTop;
				} else if (document.body) {
					scrollTop = document.body.scrollTop;
				}
				if (document.body.clientHeight && document.documentElement.clientHeight) {
					clientHeight = (document.body.clientHeight < document.documentElement.clientHeight) ? document.body.clientHeight: document.documentElement.clientHeight;
				} else {
					clientHeight = (document.body.clientHeight > document.documentElement.clientHeight) ? document.body.clientHeight: document.documentElement.clientHeight;
				}
				scrollHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight);
			} else {
				if( !el.nodeType ) return false;
				scrollTop = el.scrollTop;
				clientHeight = el.clientHeight;
				scrollHeight = el.scrollHeight;
			}
			if( clientHeight >= scrollHeight ) {
				return false;
			} else if (scrollTop + clientHeight >= scrollHeight) {//必须要使用>= 因为缩放后会大于scrollHeight
				return true;
			} else {
				return false;
			}	
		},
		/*
		*判断元素水平滚动条是否滚动到底 @dom
		*/
		_checkXScrollEnd : function( el ){
			var scrollLeft = 0;
			var clientWidth = 0;
			var scrollWidth = 0;	
			if( el === document.body || el === document || el === window ) {
				if (document.documentElement && document.documentElement.scrollLeft) {
					scrollLeft = document.documentElement.scrollLeft;
				} else if (document.body) {
					scrollLeft = document.body.scrollLeft;
				}
				if (document.body.clientWidth && document.documentElement.clientHeight) {
					clientWidth = (document.body.clientWidth < document.documentElement.clientWidth) ? document.body.clientWidth: document.documentElement.clientWidth;
				} else {
					clientWidth = (document.body.clientWidth > document.documentElement.clientWidth) ? document.body.clientWidth: document.documentElement.clientWidth;
				}
				scrollWidth = Math.max(document.body.scrollWidth, document.documentElement.scrollWidth);
			} else {
				if( !el.nodeType ) return false;
				scrollLeft = el.scrollLeft;
				clientWidth = el.clientWidth;
				scrollWidth = el.scrollWidth;
			}
			if( clientWidth >= scrollWidth ) {
				return false;
			} else if (scrollLeft + clientWidth >= scrollWidth) {//必须要使用>= 因为缩放后会大于scrollWidth
				return true;
			} else {
				return false;
			}		
		},
		/*
		*验证是否滚动到低 @el dom @a left/top
		*/
		isScrollEnd : function( el,a ){
			var self = this,
				undef;
			if( a == 'left' ) {
				return self._checkXScrollEnd( el );	
			} else {
				return self._checkYScrollEnd( el );		
			}
		},
		/*判断是否出现滚动条*/
		hasScroll: function( el, a, t ) {
			
			var el = $(el)[0];//el 是dom
			
			//If overflow is hidden, the element might have extra content, but the user wants to hide it
			/*
			//IE下 只要overflow-x/overflow-y设置了hidden那么获得的overflow就是hidden 所以我们要只取-x -y
			if ( $( el ).css( "overflow" ) === "hidden") {
				return false;
			}
			*/
			if( t !== true ) {
				if( a === "left" ) {
					if ( $( el ).css( "overflow-x" ) === "hidden") {
						return false;
					}
				} else {
					if ( $( el ).css( "overflow-y" ) === "hidden") {
						return false;
					}	
				}
			}
			var scroll = ( a && a === "left" ) ? "scrollLeft" : "scrollTop",
				has = false;
			if ( el[ scroll ] > 0 ) {
				return true;
			}
			// TODO: determine which cases actually cause this to happen
			// if the element doesn't have the scroll set, see if it's possible to
			// set the scroll
			el[ scroll ] = 1;
			has = ( el[ scroll ] > 0 );
			el[ scroll ] = 0;
			return has;
		},
		//工具集合
		util : {},
		addUtil : function(n,v){
			return this.util[n] = v;	
		},
		getUtil : function(n){
			return this.util[n];	
		},
		extendUtil : function(n,v){
			return $.extend( this.util[n],v );
		},
		removeUtil : function(){
			this.util[n] = null;
			delete this.util[n];
			return this;
		},
		/*直接使用jquery 的Deferred对象 所以要使用when需要确定jquery版本支持Deferred*/
		when : function(){
			var arr = [].slice.apply(arguments);
			for( var i=0,len=arr.length;i<len;i++ ) {
				if( Nex.isXtype(arr[i]) ) {
					arr[i] = Nex.Create( arr[i] ).getDeferred();	
					continue;
				}
				if( Nex.isNex( arr[i] ) ) {
					arr[i] = arr[i].getDeferred();
					continue;	
				}
				if( $.type(arr[i])=='string' && Nex.getClass( arr[i] ) ) {//Nex.classes //( arr[i] in Nex )
					arr[i] = Nex.Create( arr[i] ).getDeferred();	
					continue;		
				}
			}
			return $.extend($.when.apply( $,arr ),{
				success : function(){
					this.done.apply( this,arguments )	
				},
				error : function(){
					this.fail.apply( this,arguments )	
				},
				complete : function(){
					this.always.apply( this,arguments )	
				}	
			});	
		},
		/*
		*__psc=true
		*parseSubClass会把字符串直接转成对象
		*__psc=false
		*如果分割长度少于2则会把对象存放到Nex下
		*eg：parseSubClass('Test',5);__psc=true后会直接创建Test否则Nex.Test
		*/
		__psc : true,
		//把字符串转化成对象 并复制v
		parseSubClass : function(str,v){
			var undef,
				t = window,
				s = str+'';	
			s = s.split('.');
			if( s.length<2 && !this.__psc ) {
				return;	
			}
			for( var i=0,len=s.length-1;i<len;i++ ) {
				var e = s[i];
				if( !(e in t) || !t[e] ) {
					t[e] = {};	
				}
				t = t[e];	
			}	
			t[s[i]] = v;
			//return v;
		},
		//继承组件 如果没指定superClass 默认superClass=Nex.widget()
		//subclass，superClass，overrides
		extend : function(subclass,superClass,overrides){
			var undef,F = function(){};
			if( subclass === undef ) return F;
			var superClass = superClass === undef ? false : superClass;
			var overrides = overrides === undef ? {} : overrides;
			var subclassName = subclass,
				superClassName = superClass === false ? null : superClass;
			//不能继承到Nex
			if( subclass === 'Nex' ) {
				return 	Nex.widget();
			}
			var notExist = false;
			//如果不存在superClass 直接返回
			if( !superClass ) {
				superClass = Nex.widget();
				notExist = true;
				//Nex.parseSubClass( subclassName,subclass );
				//return subclass;
			}
			//mixins
			//检查是否没设置overrides
			if( $._isPlainObject( superClass ) ) {
				overrides = superClass;	
				superClass = false;
				if( 'extend' in overrides && overrides.extend ) {
					superClass = overrides.extend;
					superClass = true;
					delete overrides.extend;
				}
			}
			if( Nex.isNexConstructor( superClass ) ) {
				
				superClass = superClass;
				
			} else if( superClass && Nex.getClass( superClass ) ) {//Nex.classes // (superClass in Nex)
				
				superClass = Nex.getClass( superClass );//Nex.classes
				
			} else {
				//superClass = false;	
				superClass = Nex.widget();
				notExist = true;
			}
			
			superClassName = notExist ? null : superClass.getXType();
			
			subclass = Nex.widget(subclass);
			//只复制数组和(浅复制)对象
			var copy = function(data){
				if( $.isArray( data ) ) {
					return  [].concat(data);	
				} else if( $.isPlainObject(data) ) {
					return $.extend({},data);
				} else {
					return data;	
				}
			};
			
			if( superClass ) {
			
				for( var k in superClass ) {
					subclass[k] = copy(superClass[k]);	
				}
				var prototype = superClass['prototype'];
				for( var p in prototype ) {
					subclass.prototype[p] = copy(prototype[p]);		
				}
				subclass.prototype.superclass = superClass;
				subclass.superclass = superClass;
			}
			
			var aliasName,configs,xtype;
			if( 'alias' in overrides && overrides.alias ) {
				aliasName = overrides.alias+'';
				delete overrides.alias; 	
			}
			if( 'configs' in overrides && overrides.configs ) {
				configs = overrides.configs;
				delete overrides.configs; 	
			}
			
			if( 'xtype' in overrides && overrides.xtype ) {
				xtype = overrides.xtype+'';
				delete overrides.xtype; 
			}
			
			if( 'mixins' in overrides && overrides.mixins ) {
				overrides.mixins = $.isArray( overrides.mixins ) ? overrides.mixins : [overrides.mixins];
				$.each( overrides.mixins,function(i,d){
					$.extend( overrides,d );	
				} );
				overrides.mixins.length = 0;
				delete overrides.mixins;
			}
			
			for( var m in overrides ) {
				subclass.prototype[m] = copy(overrides[m]);	
			}
			
			//清空父级的配置参数
			subclass['_optionsList'] = [];
			
			/*getSuperClassXType设置*/
			subclass.prototype['getSuperClassXType'] = function(){
				return superClassName;
			};	
			subclass['getSuperClassXType'] = function(){
				return superClassName;
			};	
			/*getXType设置*/
			subclass.prototype['getXType'] = function(){
				return subclassName;
			};	
			subclass['getXType'] = function(){
				return subclassName;
			};

			subclass.prototype.constructor = subclass;
			subclass.constructor = subclass;
			//兼容
			subclass.fn = subclass.prototype;
			//设置一个全局变量
			Nex.parseSubClass( subclassName,subclass );
			
			if( aliasName ) {
				var __psc = Nex.__psc;
				Nex.__psc = true;
				var aliasNames = $.trim(aliasName).split(/\s+/g);
				$.each( aliasNames,function(i,n){
					Nex.parseSubClass( n,subclass );
					Nex.addClass( n,subclass );
				} );
				Nex.__psc = __psc;
			}
			if( xtype ) {
				var xtypes = $.trim(xtype).split(/\s+/g);
				$.each( xtypes,function(i,t){
					subclass.setXType(t);		
				} );
			}
			if( configs ) {
				subclass.setOptions(configs);		
			}
			
			return subclass;
		},
		define : function(){
			return this.extend.apply( this,arguments );	
		},
		error : function( msg ){
			var undef,
				e = new Error((msg===undef?'':msg));
			throw e;
			return e;	
		}
	};
})(window,jQuery);
/********************************************************
**************Nex.Manager组件****************************
**********管理创建的所有组件,常用来检测组件大小设置************
**********************************************************/
Nex._Manager = Nex.widget('_manager');
Nex._Manager.fn.extend({
	compRoot : 'root',
	//所有组件列表				   
	components : {},				   
	//需要自动resize的组件				   
	cmps : [],
	//组件ID和组件的对应hash
	_cmps : {},
	//组件树形 hanh
	_cmpsTree : {},
	//组件层级对应
	_maps : [],//[ [cmp,cmp],[..] ]
	//组件ID的所有可resize的父级组件
	_pcmps : {},//{cmpid:{pcmpid:cmp,...}}
	_init :　function(opt){
		var self = this;
		opt.autoDestroy = false;
		$(window).unbind("resize.Manager");
		$(window).bind("resize.Manager",function(){
			self.fireEvent("onResize");									 
		});
	},
	_sysEvents : function(){
		var self = this;
		self.bind("onResize.manager",self._listen,self);
		return self;
	},
	//清理comps 删除无用的cmp
	_refreshComps : function(){
		var self = this,undef;	
		var cmps = self.components;
		for( var id in cmps ) {
			self.isExists( id );	
		}
	},
	getComp : function(id){
		var self = this,undef;
		if( id === undef ) {
			self._refreshComps();
			return self.components;
		}
		self.isExists( id );	
		return self._undef(self.components[id],null);	
	},
	//获取当前分组名的所有组件
	getGroup : function(name){
		var self = this,undef;
		if( name === undef ) {
			return [];
		}
		var c = [];
		var comps = self.getComp();
		if( name === '*' ) {
			$.each( comps,function(i,d){
				c.push(d);					   
			} );
			return c;	
		}
		
		name = $.trim(name+'').split(/\s+/g);
		
		if( !name ) return c;
		
		for( var id in comps ) {
			var obj = comps[id];
			if( obj ) {
				var gname = $.trim(obj.C('groupName')+'').split(/\s+/g);
				var str_gname = gname.toString();
				for( var i=0,len=name.length;i<len;i++ ) {
					var n = name[i];
					if( gname.length && str_gname.indexOf(n)!== -1 ) {// name === gname
						c.push( obj );
						break;
					}	
				}
			}
		}
		return c;
	},
	addCmp : function(id,cmp){
		//this.cmps.push(id);
		this.components[id] = cmp;
		this._cmps[id] = cmp;
	},
	//删除组件
	removeCmp : function(id){
		this._cmps[id] = null;
		if( this.components[id] && this.components[id]['fireEvent'] ) {
			this.components[id]['fireEvent']('onDestroy');	
		}
		this.components[id] = null;
		delete this.components[id];
		delete this._cmps[id];
	},
	//判断id是否存在 如果不存在则删除
	isExists : function(id){
		var self = this;
		var cmp = self.components[id];
		
		if( cmp && cmp.getDom().size() ) {
			return true;	
		}

		//autoDestroy 如果清除dom后组件就不再用，autoDestroy设置为true autoResize 应该也是为true的
		//这里可能存有bug 例如window按关闭后会销毁dom但是window组件还是存在的  --components
		//self._cmps[id] = null;//不再设置为null，而是获取dom是否存在
		if( cmp && cmp.C('autoDestroy') ) {
			self.removeCmp(id);	
		}
		//如果组件找不到dom 那么就从resize列表移除
		delete self._cmps[id];	
		return false;
	},
	_getDomComps : function( el ){
		var el = $(el);
		if( !el.size() ) return false;
		var self = this	
			,undef
			,rlist = []
			,cmp = el.closest('.nex-component-item')
			,pid;
			
		pid = cmp.size() ? cmp.attr('id') : self.compRoot;
		
		var list = (pid in self._cmpsTree) ? self._cmpsTree[pid] : [];

		for( var i=0;i<list.length;i++ ) {
			var _item = list[i]['cmp'];
			var dom = _item.getDom();
			if( dom.closest(el).size() ) {
				rlist.push( _item )	;
			}	
		}
		
		return rlist;	
	},
	//更新指定dom下的组件大小
	resizeDom : function(el){
		var rlist = this._getDomComps( el );
		if( rlist === false ) return this;
		for( var i=0;i<rlist.length;i++ ) {
			rlist[i].resize();	
		}
		return this;
	},
	_listen : function( cid ){
		var self = this;
		self.listen( cid );	//遍历组件后刷新大小
	},
	//更新所有组件大小 如果指定cid 只更新指定组件下的所有组件的大小
	resize : function( cid ){
		this._listen( cid );	
	},
	//更新组件的层级关系
	refreshComponents : function(){
		this._refreshComps();
		this.mapCmp();
	},
	//获取当前ID组件下的子组件 
	getChildrens : function( id ){
		var self = this,undef;
		self.refreshComponents();
		var id = self._undef( id,self.compRoot );
		var cmps = self._cmpsTree[ id ] || [];
		var d = [];
		for( var i=0,len=cmps.length;i<len;i++ ) {
			d.push( cmps[i].cmp );	
		}
		return d;
	},
	//获取当前ID组件下的所有子组件 
	getAllChildrens : function( id ){
		var self = this,undef;
		var list = [];
		var _list = self.getChildrens( id );
		list = list.concat( _list );
		for( var i=0,len=_list.length;i<len;i++ ) {
			if( !_list[i] ) continue;
			var id = _list[i].C( 'id' );
			list = list.concat(self.getAllChildrens( id ));	
		}
		return list;
	},
	//获取当domID下的子组件
	getChildrensByDom : function( el ){
		var self = this,undef;
		self.refreshComponents();
		return self._getDomComps( el ) || [];
	},
	//获取当前domID组件下的所有子组件 
	getAllChildrensByDom : function( el ){
		var self = this,undef;
		self.refreshComponents();
		var list = [];
		var _list = self._getDomComps( el ) || [];
		list = list.concat( _list );
		for( var i=0,len=_list.length;i<len;i++ ) {
			if( !_list[i] ) continue;
			var id = _list[i].C( 'id' );
			list = list.concat(self.getAllChildrens( id ));	
		}
		return list;
	},
	/*
	*遍历组件之间的层级关系 所有组件
	*/
	mapCmp : function(){
		this.mapCmp2();
	},
	/*
	*遍历组件之间的层级关系 
	*/
	mapCmp2 : function(){
		var self = this,undef;
		var list = self._cmps;
		
		//缓存机制 防止快速改变浏览器大小而过多的遍历
		if( self.mapCmpCache===true ) {
			return;	
		}
		
		self._cmpsTree = {};

		for( var id in list ) {
			var cmp = self._cmps[id];
			if( id && self.isExists( id ) && cmp ) {
				
				var parent = $("#"+id).parents(".nex-component-item:first");
				var pid;
				if( !parent.length ) {
					pid = self.compRoot;
				} else {
					pid = parent.attr('id');	
				}
				var data = {
					id : id,
					cmp : list[id],
					pid : pid
				};
				
				self._cmpsTree[pid] = self._cmpsTree[pid] === undef ? [] : self._cmpsTree[pid];
				self._cmpsTree[pid].push( data );
			} else {
				//self.cmps[i] = false;
				//delete self._cmps[id];
			}	
		}
		
		self.mapCmpCache = true;
		setTimeout(function(){
			self.mapCmpCache = false;							   
		},500);
		
	},
	/*
	*更新当前id下的组件大小  强制更新当前ID下子组件大小
	*/
	_resize : function( cid,m ){
		this._resize2(cid,m);
	},
	/*
	*更新当前id下 autoResize=true的子组件大小
	*/
	_resize2 : function( cid,m ){
		var self = this,undef;
		var cid = cid === undef ? self.compRoot : cid;
		var m = m === undef ? false : m;
		if( m ) {
			self.mapCmp2();
		}
		var list = self._cmpsTree[cid];
		if( !$.isArray( list ) ) return;
		
		for( var i=0;i<list.length;i++ ) {
			var cmp = list[i]['cmp'];
			if( cmp.C('autoResize') ) {
				cmp.resize();
			}
		}
		
		
	},
	listen : function( cid ){
		var self = this,undef;
		//self.mapCmp();
		/*if( cid === undef ) {
			self.mapCmp2();
		}*/
		self.mapCmp2();
		//console.log( self._cmpsTree );
		self._resize2( cid );
	},
	xtypes : {},
	addXtype : function(xtype,func){
		this.xtypes[xtype] = func;	
	},
	//创建组件
	create : function(){
		var self = this,undef;
		var argvs = [].slice.apply(arguments);
		var len = argvs.length;
		if( len<=0 ) return false;
		if( len > 1 ) {
			var xtype = argvs[0];
			if( Nex.isNexConstructor( xtype ) ) {
				return new xtype( argvs[1] );
			}
			if( (xtype in self.xtypes) && $.isFunction( self.xtypes[ xtype ] ) ) {
				return self.xtypes[ xtype ]( argvs[1] );	
			}
		} else if( Nex.isNexConstructor( argvs[0] ) ) {
			return new argvs[0]();
		} else {
			argvs[0] = argvs[0] === undef ? {} : argvs[0];
			if( typeof argvs[0] === 'string' ) {
				argvs[0] = {
					xtype : argvs[0]	
				};		
			}
			if( 'xtype' in argvs[0] ){
				if( (argvs[0]['xtype'] in self.xtypes) && $.isFunction( self.xtypes[ argvs[0]['xtype'] ] ) ) {
					return self.xtypes[ argvs[0]['xtype'] ]( argvs[0] );	
				}
			}	
		}
		//如果在xtypes中找不到 就直接从Nex中创建
		if( len ) {
			var type= len>1?argvs[0]:argvs[0]['xtype'];
			var opt = len>1?argvs[1]:argvs[0];
			var o = Nex.getClass(type);
			if( o && $.isFunction( o )  ) {
				return new o( opt );
			}
		}
		return false;
	},
	//创建服务组件
	createServer : function(){
		var self = this;
		var argvs = [].slice.apply(arguments);
		var len = argvs.length;
		if( len > 1 ) {
			var xtype = argvs[0];
			if( (xtype in self.xtypes) && $.isFunction( self.xtypes[ xtype ] ) ) {
				return self.xtypes[ xtype ]( $.extend({},argvs[1],{ autoDestroy:false }) );	
			}
		} else {
			if( typeof argvs[0] === 'string' ) {
				argvs[0] = {
					xtype : argvs[0]	
				};		
			}
			argvs[0]['autoDestroy'] = false;
			if( 'xtype' in argvs[0] ){
				if( (argvs[0]['xtype'] in self.xtypes) && $.isFunction( self.xtypes[ argvs[0]['xtype'] ] ) ) {
					return self.xtypes[ argvs[0]['xtype'] ]( argvs[0] );	
				}
			}	
		}
		//如果在xtypes中找不到 就直接从Nex中创建
		if( len ) {
			var type= len>1?argvs[0]:argvs[0]['xtype'];
			var opt = len>1?argvs[1]:argvs[0];
			opt.autoDestroy = false;
			var o = Nex.getClass(type);
			if( o && $.isFunction( o )  ) {
				return new o( opt );
			}
		}
		return false;
	},
	/*
	给组件发送消息 一般当作自定义消息来使用
	@ *ids 发送的组件ID 可以是数组 或者是 组件对象，如果为"*"则发送给所有组件
	@ *evt 发送的消息事件
	@ params 发送的参数 可以是数组
	@ sender 发送者 这个参数可以通过 arguments[ arguments.length-1 ] 获得
	*/
	sendMessage : function( ids,evt,params,sender ){
		var self = this,undef;
		var cmps = self.getComp();
		var params = self._undef( params,[] );
		params = $.isArray( params ) ? params : [ params ];
		if( sender ) {
			params.push( sender );		
		}
		if( ids === undef ) return false;
		
		if( ids === '*' ) {
			for( var obj in cmps ) {
				var cmp = cmps[obj];
				cmp.fireEvent(evt,params);
			}	
		}
		
		ids = $.isArray( ids ) ? ids : [ ids ];
		
		for( var i=0,len=ids.length;i<len;i++ ) {
			var cmpid = ids[i];
			if( Nex.isNex( cmpid ) ) {
				cmpid.fireEvent(evt,params);	
			} else {
				cmp = cmps[cmpid];
				if( cmp ) {
					cmp.fireEvent(evt,params);		
				}
			}
		}
		return true;
	},
	/*作用同sendMessage 只是会立即返回*/
	postMessage : function(ids,evt,params,sender){
		var self = this,undef;
		setTimeout(function(){
			self.sendMessage( ids,evt,params,sender );					
		},0);
		return true;
	},
	/*
	给组件发送消息 一般当作自定义消息来使用
	@ *name 组件的groupName
	@ *evt 发送的消息事件
	@ params 发送的参数 可以是数组
	@ sender 发送者 这个参数可以通过 arguments[ arguments.length-1 ] 获得
	*/
	sendMessageByGroupName : function(name,evt,params,sender){
		var self = this,undef;
		
		if( name === undef ) return false;
		
		var cmps = self.getGroup( name );
		
		var params = self._undef( params,[] );
		params = $.isArray( params ) ? params : [ params ];
		if( sender ) {
			params.push( sender );		
		}
		
		for( var i=0,len=cmps.length;i<len;i++ ) {
			var cmp = cmps[i];
			cmp.fireEvent(evt,params);
		}	
			
		return true;	
	},
	sendMessageToGroup : function(){
		return this.sendMessageByGroupName.apply( this,arguments );	
	},
	/*作用同sendMessageByGroupName 只是会立即返回*/
	postMessageByGroupName : function(name,evt,params,sender){
		var self = this,undef;
		setTimeout(function(){
			self.sendMessageByGroupName( name,evt,params,sender );					
		},0);
		return true;	
	},
	postMessageToGroup : function(){
		return this.postMessageByGroupName.apply( this,arguments );	
	}
});
Nex.Manager = new Nex._Manager();
/***************************************
****************Nex功能扩展**************
****************************************/
$.extend( Nex,{
	gc : function() {
		Nex.Manager._refreshComps();
		return this;
	},
	create :　function(){
		return Nex.Manager.create.apply(Nex.Manager,arguments);
	},
	Create : function(){
		return this.create.apply( this,arguments );	
	},
	//创建一个Nex服务 
	createserver : function(){
		return Nex.Manager.createServer.apply(Nex.Manager,arguments);//	
	},
	createServer : function(){
		return this.createserver.apply( this,arguments );		
	},
	removeComponent : function(id){
		Nex.Manager.removeCmp(id);
		return this;
	},
	removeServer : function(id){
		Nex.Manager.removeCmp(id);
		return this;
	},
	get : function(id){
		return 	Nex.Manager.getComp(id);
	},
	getGroup : function( name ){
		return 	Nex.Manager.getGroup(name);	
	},
	getChildrens : function(id){
		return 	Nex.Manager.getChildrens(id);		
	},
	getAllChildrens : function(id){
		return 	Nex.Manager.getAllChildrens(id);		
	},
	getChildrensByDom : function( el ){
		return 	Nex.Manager.getChildrensByDom( el );		
	},
	getAllChildrensByDom : function( el ){
		return 	Nex.Manager.getAllChildrensByDom( el );		
	},
	refreshComponents : function(){
		return 	Nex.Manager.refreshComponents(name);		
	},
	resize : function(id,m){
		var undef;
		var m = m === undef ? false : m;
		if( m ) {
			Nex.Manager.mapCmp2();	
		}
		Nex.Manager._resize2();
		return this;
	},
	sendMessage : function(){
		var mg = Nex.Manager;
		mg.sendMessage.apply(mg,arguments);	
		return this;
	},
	postMessage : function(){
		var mg = Nex.Manager;
		mg.postMessage.apply(mg,arguments);	
		return this;
	},
	sendMessageByGroupName : function(){
		var mg = Nex.Manager;
		mg.sendMessageByGroupName.apply(mg,arguments);	
		return this;
	},
	sendMessageToGroup : function(){
		var mg = Nex.Manager;
		mg.sendMessageByGroupName.apply(mg,arguments);	
		return this;
	},
	postMessageByGroupName : function(){
		var mg = Nex.Manager;
		mg.postMessageByGroupName.apply(mg,arguments);	
		return this;
	},
	postMessageToGroup : function(){
		var mg = Nex.Manager;
		mg.postMessageByGroupName.apply(mg,arguments);	
		return this;
	}
} );
/*******************************************
***************jQuery功能扩展****************
********************************************/
/*
*因为父元素的display为none 那么隐藏的子元素获取高度为0
*可调用_display短暂的显示，要记得调用后也要_hidden返回原始状态
*@param {string} 如果设置就会对元素添加样式否则直接设置display:block
*/
$.fn._display = function(_e){
	return this.each(function(i){
		var $this = $(this);
		if( !_e ) {
			$this.css('display','block');
			$this.data('_display_',true); 
			var hidden = $this.css('visibility');
			$this.data('_visibility_',hidden); 
			$this.css('visibility','hidden');
		} else {
			$this.addClass(_e);		
		}
	});
};
/*状态
*@param {string} 如果设置就会对元素移除样式否则直接设置display:none
*/
$.fn._hidden = function(_e){
	return this.each(function(i){
		var $this = $(this);
		if( !_e ) {
			if( $this.data('_display_') ) {
				$this.css('display','none');
				$this.removeData('_display_');
			}
			var visibility = $this.data('_visibility_');
			if( visibility ) {
				$this.css('visibility',visibility);
				$this.removeData('_visibility_');
			}
		} else {
			$this.removeClass(_e);			
		}
	});
};
/*
*获取和设置元素宽高
*使用同$.fn.width,不同在于如果元素隐藏也能正确获取到宽高
*/
$.fn._width = function(_e){
	if(_e==undefined){
		var f = this[0];
		if(f==window || f==document || f==document.body ){
			return this.width()||document.body.clientWidth;
		}
		var p = null,
			$f = $(f);
		var isHidden = $f.is(":hidden");
		if( isHidden ) {
			p = $f.parents(":hidden")._display('nex-hide2show');
		}
		var w = $f.width();
		if( isHidden ) {
			p._hidden('nex-hide2show');	
		}
		return w||0;
	}
	return this.width(_e);
};
/*
*获取和设置元素宽高
*使用同$.fn.height,不同在于如果元素隐藏也能正确获取到宽高
*/
$.fn._height = function(_e){
	if(_e==undefined){
		var f = this[0];
		if(f==window || f==document || f==document.body ){
			return this.height()||document.body.clientHeight;
		}
		var p = {},
			$f = $(f);
		var isHidden = $f.is(":hidden");
		if( isHidden ) {
			p = $f.parents(":hidden")._display('nex-hide2show');
		}
		var h = $(f).height();
		if( isHidden ) {
			p._hidden('nex-hide2show');	
		}
		return h||0;
	}
	return this.height(_e);
}; 
/*
*获取和设置元素宽高
*@param {int} 设置宽高
*使用同$.fn.outerWidth,不同在于可以设置宽高
*/
$.fn._outerWidth = function(_e){
	if(_e==undefined || _e === false || _e === true){
		var f = this[0];
		if(f==window || f==document || f==document.body ){
			return this.width()||document.body.clientWidth;
		}
		var $f = $(f),p = null;
		var isHidden = $f.is(":hidden");
		if( isHidden ) {
			p = $f.parents(":hidden")._display('nex-hide2show');
		}
		var w = this.outerWidth(!!_e)||0;
		if( isHidden ) {
			p._hidden('nex-hide2show');	
		}
		return w;
	}
	var isIE= Nex.isIE;
	return this.each(function(){
		var $this = $(this);					  
		if( !$.support.boxModel ){
			$this.width(_e);
		}else{
			var $f = $this,
				p = null,
				isHidden = $f.is(":hidden");
			if( isHidden ) {
				p = $f.parents(":hidden")._display('nex-hide2show');
			}
			var _w = _e-($f.outerWidth()-$f.width());
			_w = _w<0?0:_w;
			$f.width(_w);
			if( isHidden ) {
				p._hidden('nex-hide2show');	
			}
		}
	});
}; 
/*
*获取和设置元素宽高
*@param {int} 设置宽高
*使用同$.fn.outerHeight,不同在于可以设置宽高
*/
$.fn._outerHeight = function(_f){
	if(_f==undefined || _f === false || _f === true){
		var f = this[0];
		if(f==window || f==document || f==document.body ){
			return this.height()||document.body.clientHeight;
		}
		var $f = $(f),p = null;
		var isHidden = $f.is(":hidden");
		if( isHidden ) {
			p = $f.parents(":hidden")._display('nex-hide2show');
		}
		var h = this.outerHeight(!!_f)||0;
		if( isHidden ) {
			p._hidden('nex-hide2show');	
		}
		return h;
	}
	var isIE= Nex.isIE;
	return this.each(function(){
		var $this = $(this);					  
		if( !$.support.boxModel ){
			$this.height(_f);
		}else{
			var $f = $this,
				p = null,
				isHidden = $f.is(":hidden");
			if( isHidden ) {
				p = $f.parents(":hidden")._display('nex-hide2show');
			}
			var _h = _f-($f.outerHeight()-$f.height());
			_h = _h<0?0:_h;
			$f.height(_h);
			if( isHidden ) {
				p._hidden('nex-hide2show');	
			}
		}
	});
};
/*
*返回相对offsetParent的绝对高度，而不是相对
*/
$.fn._position = function(_f){
	var undef;
	if( _f === undef ) {
		var t = this.eq(0);
		var op = t.offsetParent();
		if( op.is('body') || op.is('html') ) {
			return t.offset();	
		} else {
			var _a = t.offset(),
				_b = op.offset(),
				_c = parseFloat(op.css('borderLeftWidth')),
				_e = parseFloat(op.css('paddingLeft')),
				_c1 = parseFloat(op.css('borderTopWidth')),
				_e1 = parseFloat(op.css('paddingTop'));
			_c = isNaN( _c ) ? 0 : _c;
			_e = isNaN( _e ) ? 0 : _e;
			_c1 = isNaN( _c1 ) ? 0 : _c1;
			_e1 = isNaN( _e1 ) ? 0 : _e1;	
			var pos = {
				top : _a.top - _b.top - _c1 - _e1,
				left : _a.left - _b.left - _c - _e
			};
			return {
				top : pos.top + op.scrollTop(),	
				left : pos.left + op.scrollLeft()
			};
		}
	} else {
		return this.css( _f );	
	}
};
/*
*用CSS设置top=-100000px来达到隐藏的效果
*/
$.fn._show = function(fn){
	this.removeClass('nex-hidden');	
	if( fn && $.isFunction(fn) ) {
		fn.call(this);	
	}
};
/*
*去除_show的隐藏效果
*/
$.fn._hide = function(fn){
	this.addClass('nex-hidden');	
	if( fn && $.isFunction(fn) ) {
		fn.call(this);	
	}
};
/*
*检测是否是纯对象
*/
$._isPlainObject = function(obj){
	var r = $.isPlainObject(obj);
	if( r && '_outerWidth' in obj ) {
		r = false;	
	}
	return r;
};
/*
*兼容jquery低版本也支持parseHtml
*/
$._parseHTML = $.parseHTML = $.parseHTML || function( data, context, scripts ){
	var parsed,rsingleTag = /^<(\w+)\s*\/?>(?:<\/\1>)?$/;
	if ( !data || typeof data !== "string" ) {
		return null;
	}
	if ( typeof context === "boolean" ) {
		scripts = context;
		context = 0;
	}
	context = context || document;

	// Single tag
	if ( (parsed = rsingleTag.exec( data )) ) {
		return [ context.createElement( parsed[1] ) ];
	}

	parsed = jQuery.buildFragment( [ data ], context, scripts ? null : [] );
	return jQuery.merge( [],parsed.fragment.childNodes );

};
/*
*移除元素css内联样式扩展
*/
jQuery.fn.extend({
	/*
	*移除style属性(移除cssText的css)
	*@param {string} 需要移除的样式属性 可用 "," " " 分割
	*@param {boolean} 是否全匹配  否则模糊匹配 默认模糊匹配
	*/
	_removeStyle : function(proto,m){
		proto = proto+'';
		var _proto = $.trim(proto.toLowerCase());
		_proto = _proto.replace(/\s+/g,',').split(',');
		var proto = {};
		$.each( _proto,function(i,v){
			proto[v] = true;						
		} );
		return this.each(function(){
			var cssText = this.style.cssText;
			if( cssText ) {
				var css = cssText.split(';');
				var data = {};
				$.each( css , function(i,v){
					if( v ) {
						var d = v.split(':');
						if( d.length ) {
							data[$.trim(d[0].toLowerCase())] = $.trim(d[1]);
						}
					}
				} );
				var t = [];
				for( var k in data ) {
					if( m ) {
						if( k in proto ) continue;	
					} else {
						//if( k.indexOf(proto) === 0 ) continue;	
						var r = false;
						for( var key in proto ) {
							if( k.indexOf(key) === 0 ) r=true;	
						}
						if( r ) {
							continue;	
						}
					}
					t.push( k+":"+data[k]+';' );
				}
				this.style.cssText = t.join("");
			}
		});	
	}				 
});
/*
selection扩展
*/
jQuery.support.selectstart = false;
jQuery.fn.extend({
	disableSelection: function() {
		return this.bind( ( $.support.selectstart ? "selectstart" : "mousedown" ) +
			".nex-disableSelection", function( event ) {
				event.preventDefault();
			});
	},
	enableSelection: function() {
		return this.unbind( ".nex-disableSelection" );
	}
});
/*
兼容 jquery 1.9 以上 移除 $.support.boxMoal
*/
if( jQuery.support.boxModel === undefined ) {
	jQuery.support.boxModel = document.compatMode === "CSS1Compat";
}
/*
是否支持 onselectstart 检查
*/
jQuery(function() {
	var body = document.body,
		div = body.appendChild( div = document.createElement( "div" ) );
		
	$.support.selectstart = "onselectstart" in div;

	// set display to none to avoid a layout bug in IE
	// http://dev.jquery.com/ticket/4014
	body.removeChild( div ).style.display = "none";
});
/*
jquery.easing.js
*/
jQuery.easing['jswing']=jQuery.easing['swing'];jQuery.extend(jQuery.easing,{def:'easeOutQuad',swing:function(x,t,b,c,d){return jQuery.easing[jQuery.easing.def](x,t,b,c,d);},easeInQuad:function(x,t,b,c,d){return c*(t/=d)*t+b;},easeOutQuad:function(x,t,b,c,d){return-c*(t/=d)*(t-2)+b;},easeInOutQuad:function(x,t,b,c,d){if((t/=d/2)<1)return c/2*t*t+b;return-c/2*((--t)*(t-2)-1)+b;},easeInCubic:function(x,t,b,c,d){return c*(t/=d)*t*t+b;},easeOutCubic:function(x,t,b,c,d){return c*((t=t/d-1)*t*t+1)+b;},easeInOutCubic:function(x,t,b,c,d){if((t/=d/2)<1)return c/2*t*t*t+b;return c/2*((t-=2)*t*t+2)+b;},easeInQuart:function(x,t,b,c,d){return c*(t/=d)*t*t*t+b;},easeOutQuart:function(x,t,b,c,d){return-c*((t=t/d-1)*t*t*t-1)+b;},easeInOutQuart:function(x,t,b,c,d){if((t/=d/2)<1)return c/2*t*t*t*t+b;return-c/2*((t-=2)*t*t*t-2)+b;},easeInQuint:function(x,t,b,c,d){return c*(t/=d)*t*t*t*t+b;},easeOutQuint:function(x,t,b,c,d){return c*((t=t/d-1)*t*t*t*t+1)+b;},easeInOutQuint:function(x,t,b,c,d){if((t/=d/2)<1)return c/2*t*t*t*t*t+b;return c/2*((t-=2)*t*t*t*t+2)+b;},easeInSine:function(x,t,b,c,d){return-c*Math.cos(t/d*(Math.PI/2))+c+b;},easeOutSine:function(x,t,b,c,d){return c*Math.sin(t/d*(Math.PI/2))+b;},easeInOutSine:function(x,t,b,c,d){return-c/2*(Math.cos(Math.PI*t/d)-1)+b;},easeInExpo:function(x,t,b,c,d){return(t==0)?b:c*Math.pow(2,10*(t/d-1))+b;},easeOutExpo:function(x,t,b,c,d){return(t==d)?b+c:c*(-Math.pow(2,-10*t/d)+1)+b;},easeInOutExpo:function(x,t,b,c,d){if(t==0)return b;if(t==d)return b+c;if((t/=d/2)<1)return c/2*Math.pow(2,10*(t-1))+b;return c/2*(-Math.pow(2,-10*--t)+2)+b;},easeInCirc:function(x,t,b,c,d){return-c*(Math.sqrt(1-(t/=d)*t)-1)+b;},easeOutCirc:function(x,t,b,c,d){return c*Math.sqrt(1-(t=t/d-1)*t)+b;},easeInOutCirc:function(x,t,b,c,d){if((t/=d/2)<1)return-c/2*(Math.sqrt(1-t*t)-1)+b;return c/2*(Math.sqrt(1-(t-=2)*t)+1)+b;},easeInElastic:function(x,t,b,c,d){var s=1.70158;var p=0;var a=c;if(t==0)return b;if((t/=d)==1)return b+c;if(!p)p=d*.3;if(a<Math.abs(c)){a=c;var s=p/4;}
else var s=p/(2*Math.PI)*Math.asin(c/a);return-(a*Math.pow(2,10*(t-=1))*Math.sin((t*d-s)*(2*Math.PI)/p))+b;},easeOutElastic:function(x,t,b,c,d){var s=1.70158;var p=0;var a=c;if(t==0)return b;if((t/=d)==1)return b+c;if(!p)p=d*.3;if(a<Math.abs(c)){a=c;var s=p/4;}
else var s=p/(2*Math.PI)*Math.asin(c/a);return a*Math.pow(2,-10*t)*Math.sin((t*d-s)*(2*Math.PI)/p)+c+b;},easeInOutElastic:function(x,t,b,c,d){var s=1.70158;var p=0;var a=c;if(t==0)return b;if((t/=d/2)==2)return b+c;if(!p)p=d*(.3*1.5);if(a<Math.abs(c)){a=c;var s=p/4;}
else var s=p/(2*Math.PI)*Math.asin(c/a);if(t<1)return-.5*(a*Math.pow(2,10*(t-=1))*Math.sin((t*d-s)*(2*Math.PI)/p))+b;return a*Math.pow(2,-10*(t-=1))*Math.sin((t*d-s)*(2*Math.PI)/p)*.5+c+b;},easeInBack:function(x,t,b,c,d,s){if(s==undefined)s=1.70158;return c*(t/=d)*t*((s+1)*t-s)+b;},easeOutBack:function(x,t,b,c,d,s){if(s==undefined)s=1.70158;return c*((t=t/d-1)*t*((s+1)*t+s)+1)+b;},easeInOutBack:function(x,t,b,c,d,s){if(s==undefined)s=1.70158;if((t/=d/2)<1)return c/2*(t*t*(((s*=(1.525))+1)*t-s))+b;return c/2*((t-=2)*t*(((s*=(1.525))+1)*t+s)+2)+b;},easeInBounce:function(x,t,b,c,d){return c-jQuery.easing.easeOutBounce(x,d-t,0,c,d)+b;},easeOutBounce:function(x,t,b,c,d){if((t/=d)<(1/2.75)){return c*(7.5625*t*t)+b;}else if(t<(2/2.75)){return c*(7.5625*(t-=(1.5/2.75))*t+.75)+b;}else if(t<(2.5/2.75)){return c*(7.5625*(t-=(2.25/2.75))*t+.9375)+b;}else{return c*(7.5625*(t-=(2.625/2.75))*t+.984375)+b;}},easeInOutBounce:function(x,t,b,c,d){if(t<d/2)return jQuery.easing.easeInBounce(x,t*2,0,c,d)*.5+b;return jQuery.easing.easeOutBounce(x,t*2-d,0,c,d)*.5+c*.5+b;}});
/*
jquery.mousewheel.js
*/
(function($){var types=['DOMMouseScroll','mousewheel'];if($.event.fixHooks){for(var i=types.length;i;){$.event.fixHooks[types[--i]]=$.event.mouseHooks;}}
$.event.special.mousewheel={setup:function(){if(this.addEventListener){for(var i=types.length;i;){this.addEventListener(types[--i],handler,false);}}else{this.onmousewheel=handler;}},teardown:function(){if(this.removeEventListener){for(var i=types.length;i;){this.removeEventListener(types[--i],handler,false);}}else{this.onmousewheel=null;}}};$.fn.extend({mousewheel:function(fn){return fn?this.bind("mousewheel",fn):this.trigger("mousewheel");},unmousewheel:function(fn){return this.unbind("mousewheel",fn);}});function handler(event){var orgEvent=event||window.event,args=[].slice.call(arguments,1),delta=0,returnValue=true,deltaX=0,deltaY=0;event=$.event.fix(orgEvent);event.type="mousewheel";if(orgEvent.wheelDelta){delta=orgEvent.wheelDelta/120;}
if(orgEvent.detail){delta=-orgEvent.detail/3;}
deltaY=delta;if(orgEvent.axis!==undefined&&orgEvent.axis===orgEvent.HORIZONTAL_AXIS){deltaY=0;deltaX=-1*delta;}
if(orgEvent.wheelDeltaY!==undefined){deltaY=orgEvent.wheelDeltaY/120;}
if(orgEvent.wheelDeltaX!==undefined){deltaX=-1*orgEvent.wheelDeltaX/120;}
args.unshift(event,delta,deltaX,deltaY);return($.event.dispatch||$.event.handle).apply(this,args);}})(jQuery);