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
	var uaMatch = /msie ([\w.]+)/.exec( navigator.userAgent.toLowerCase() ) || [];
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
					
					var xtypes = $.trim(xtype).split(/\s+/g);
					if( xtypes.length>2 ) {
						for( var i=0;i<xtypes.length;i++ ) {
							b.setXType( xtypes[i] );	
						}	
						return b;
					}
					
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
		hasScroll: function( el, a ) {
			
			var el = $(el)[0];//el 是dom
			
			//If overflow is hidden, the element might have extra content, but the user wants to hide it
			/*
			//IE下 只要overflow-x/overflow-y设置了hidden那么获得的overflow就是hidden 所以我们要只取-x -y
			if ( $( el ).css( "overflow" ) === "hidden") {
				return false;
			}
			*/
			if( a === "left" ) {
				if ( $( el ).css( "overflow-x" ) === "hidden") {
					return false;
				}
			} else {
				if ( $( el ).css( "overflow-y" ) === "hidden") {
					return false;
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
/*
Nex.html组件说明：
组件名称       : Nex.Html 可通过 new Nex.Html() 或者 Nex.Create('Nex.Html') 来创建
组件别名xtype  : html  可通过Nex.Create('html')
加载名称       : Nex.Html 组件存放目录结构 {{nex目录}}/Html.js
*/
;(function($){
	"use strict";
	var html = Nex.define('Nex.Html').setXType('html');
	//兼容以前版本
	Nex.html = html;
	html.extend({
		version : '1.0',
		getDefaults : function(opt){
			var _opt = {
				prefix : 'nexhtml-',
				tag : 'div',
				autoDestroy : true,
				autoScroll : false,
				autoResize : true,
				selectionable : true,
				_checkScrollBar : false,//检查是否出现滚动条 如果出现会触发onViewSizeChange
				_hasBodyView : false,//是否有view部分 html 没有这部分 应该关闭 提高效率
				tabIndex : -1,
				renderTo : document.body,
				cls : '',
				overCls : '',
				cssText : '',
				width : 'auto',// 设为auto后 大小将不会设置 宽度 高度都是auto 或者css控制的,设为0 相当于100% 
				height : 'auto',
				border : false,
				borderCls : 'nex-html-border',
				containerCls : 'nex-html',
				autoScrollCls : 'nex-html-auto-scroll',
				_initMethod : [],//初始时扩展调用
				padding : 0,
				style : {},
				'class' : '',
				views : {},
				attrs : {},
				html : '',
				items : [],
				loadMsg : 'Loading...',
				_lmt : 0,
				denyEvents : false,//禁止绑定事件 或者指定那些事件不需要绑定 eg [ 'click',dblclick,scroll ]
				events : {
					onStart : $.noop,
					onCreate : $.noop,
					onInitComponent : $.noop,
					onSetContainerSize : $.noop,
					onSizeChange : $.noop,
					onSetContainerEvent : $.noop
				}
			};
			var _opt = this.extSet(_opt);
			return $.extend({},_opt,opt);
		},
		_Tpl : {}
	});
	html.fn.extend({
		_init : function(opt) {
			var self = this;
			var methods = opt._initMethod;
			self.setContainer();
			/*调用扩展api*/
			if( methods.length ) {
				var i=0,len = methods.length;
				for( ;i<len;i++ ) {
					var m = methods[i];
					if( !m ) continue;
					if( $.isFunction( m ) ) {
						m.call( self );	
					} else if( ($.type( m ) === 'string') && $.isFunction( self[m] ) ) {
						self[m].call( self );	
					}
				}	
			}
			self.initComponent();
		},
		_sysEvents : function(){
			var self = this;
			var opt = self.configs;
			self.bind("onStart",function(){
				if( opt.autoSize ) {
					opt.width = 'auto';
					opt.height = 'auto';
				}
			});
			self.bind("onCreate",function(){
				opt._isInit = false;	
			});
			self.bind("onMouseEnter",self._setOverCls,self);
			self.bind("onMouseLeave",self._unsetOverCls,self);
			self.bind("onInitComponent",self._setPadding,self);
			return self;
		},
		/*如果width height 设置的是百分比那么将返回百分比值，只对resize和初始创建时有效*/
		getResizeWH : function(){
			var self = this;
			var opt = self.configs;	
			var views = opt.views;
			var container = self.getContainer();
			var renderTo = $(opt.renderTo);
			var width =  renderTo._width();
			var height =  renderTo._height();
			
			var isChange = true;
			if( opt.pWidth === width && opt.pHeight === height && opt._isResize ) {//resize 时才判断 setWH 都会执行
				isChange = false;	
			}
			if( !isChange ) {
				return {
					width:opt._width,
					height:opt._height,
					isChange : isChange
				};	
			}
			
			opt.pWidth = width;
			opt.pHeight = height;
			
			var w = parseFloat(opt.width) === 0 ? width : opt.width
				,h = parseFloat(opt.height) === 0 ? height : opt.height;

			if( opt.width.toString().indexOf("%") != -1 ) {
				w = parseFloat(opt.width)*width/100;
			}
			if( opt.height.toString().indexOf("%") != -1 ) {
				h = parseFloat(opt.height)*height/100;
			}
			if( w === 'auto' || isNaN(parseFloat(w)) ) {
				$.each( views , function(key,_item){
					_item._removeStyle('width',true);	
				} );
				//container._removeStyle('width',true);
				w = container._outerWidth();	
			}
			if( h === 'auto' || isNaN(parseFloat(h)) ) {
				//container._removeStyle('height',true);
				$.each( views , function(key,_item){
					_item._removeStyle('height',true);	
				} );
				h = container._outerHeight();	
			}
			//因为浏览器会对像素进行 四舍五入 处理 所以应该用parseInt对像素取整 
			return {
				width:parseInt(w),
				height:parseInt(h),
				isChange : isChange
			};
		},
		checkSize : function(width,height){
			var self = this;
			var opt = self.configs;	
			//var renderTo = $(opt.renderTo);
			var cutHeight = self._getCutHeight(opt.cutHeight);
			var cutWidth = self._getCutWidth(opt.cutWidth);
			height -= isNaN(parseFloat(opt.cutHeight)) ? 0 : opt.cutHeight;
			width -= isNaN(parseFloat(opt.cutWidth)) ? 0 : opt.cutWidth;
			
			var minWidth = self._getMinWidth();
			var minHeight = self._getMinHeight();
			var maxHeight = self._getMaxHeight();
			var maxWidth = self._getMaxWidth();
			
			if( maxWidth>0 ) {
				width = Math.min(width,maxWidth);
			}
			if( maxHeight>0 ) {
				height = Math.min(height,maxHeight);
			}
			if( minWidth>0 ) {
				width = Math.max(width,minWidth);
			}
			if( minHeight>0 ) {
				height = Math.max(height,minHeight);
			}
			
			return {
					//width : isNaN(width)?'auto':width,
					//height : isNaN(height)?'auto':height
					width : parseInt(isNaN(width)?opt.pWidth:width),//实际上 width,height 一直不会是NaN
					height : parseInt(isNaN(height)?opt.pHeight:height)
				};
		},
		setContainerSize : function(w,h){
			var self = this,
				undef,
				opt = self.configs,	
				//render = $(opt.renderTo),
				container = self.getContainer()
				;
			
			opt.width = w === undef ? opt.width : w;	
			opt.height = h === undef ? opt.height : h;
			
			var size = self.getResizeWH();
			//注：如果width,height 为auto是 size 和 wh 的 width height 应该是一样的 除非设置了 max/min/cut width height 
			var wh = self.checkSize( size.width,size.height );
			
			self.fireEvent('onSetContainerSize',[wh,opt]);
			//判断宽高大小是否有变更
			if( !size.isChange ) {
				return false;	
			}
			//缓存
			if( opt._containerWidth && opt._containerHeight ) {
				if( opt._containerWidth === wh.width && opt._containerHeight === wh.height ) {
					return false;	
				}	
			}
			
			opt._width = wh.width;
			opt._height = wh.height;
			
			var _w = opt.width.toString().toLowerCase(),
				_h = opt.height.toString().toLowerCase();
				
			//判断是否设置了 max/min/cut width height 
			if( _w === 'auto' && size.width !== wh.width ) {
				_w = wh.width;	
			}	
			if( _h === 'auto' && size.height !== wh.height ) {
				_h = wh.height;	
			}
			
			opt.realWidth = _w;
			opt.realHeight = _h;	
			
			//最终判断 如果 _w _h 已然是auto 那么参数  max/min/cut width height  根本没有设置 width heigth 可以设为auto 否则就设为对应的数
			if( _w !== 'auto') {
				container._outerWidth(opt._width);	
			} else {
				container._removeStyle('width',true);
			}
			if( _h !== 'auto') {
				container._outerHeight(opt._height);	
			} else {
				container._removeStyle('height',true);
			}
			//缓存
			opt._containerWidth = wh.width;
			opt._containerHeight = wh.height;
			
			return true;
		},
		/*
		*判断当前是否自适应高度
		*/
		isAutoHeight : function(){
			var self = this,
				opt = this.configs;
			return 	opt.realHeight === 'auto' ? true : false;
		},
		/*
		*判断当前是否自适应宽度
		*/
		isAutoWidth : function(){
			var self = this,
				opt = this.configs;
			return 	opt.realWidth === 'auto' ? true : false;
		},
		/*
		*设置容器大小  @w 宽度 @h 高度 如果传的是func 则作为回调 并且只作为刷新用 @m如果为false 则触发onResize让子组件改变大小
		*/
		resetHtmlSize : function(w,h,m){
			var self = this,
				undef,
				container = self.getContainer(),
				opt = self.configs,
				m = m === undef ? true : m;	
				
			var func = false;
			if( $.isFunction(w) ) {
				func = w;
				h = w = undef;
			}
			
			//如果不需要设置会返回false
			var r = self.setContainerSize(w,h);
			
			if( r ) {
				self.methodInvoke('resetViewSize',function(){
					self.fireEvent("onSizeChange",[container,opt]);	
					if( func ) {
						func.call( self );
					}
					if( Nex.Manager && !opt._isInit && m ) {
						if( opt.__onresize ) {
							clearTimeout( opt.__onresize );	
						}
						opt.__onresize = setTimeout(function(){
							Nex.Manager.fireEvent("onResize",[opt.id]);		
						},0);
					}	
				});	
			}
			
			return r;
		},
		setHtmlSize : function(w,h){
			return this.resetHtmlSize(w,h);
		},
		//兼容以前的代码
		onSizeChange : function(w,h){
			return this.resetHtmlSize(w,h);	
		},
		/*
		* 更新html视图既Body部分宽高 由于Html和container和body是一样的 所有不做处理
		*  触发onViewSizeChange事件
		*/
		resetViewSize : function( func ){
			var self = this,
				opt = self.configs;	
			var r = self.onViewSizeChange();
			if( r ) {
				var vbody = self.getBody();
				self.fireEvent("onViewSizeChange",[opt]);
			}
			
			if( func && $.isFunction(func) ) {
				func.call( self );
			}
			return self;
		},
		//设置body大小 
		_setViewSize : function(){
			var self = this,
				opt = self.configs;
			self.fireEvent("onSetViewSize",[opt]);	
		},
		onViewSizeChange : function(func){
			var self = this,
				undef,
				opt = self.configs,
				vbody = self.getBody();
				
			self.methodInvoke('_setViewSize');		
			
			if( !opt._hasBodyView ) {
				return false;	
			}
				
			//事件检查滚动条 滚动条出现也会触发viewSize事件
			if( opt._checkScrollBar ) {
				//缓存机制
				//因为grid特殊 所以应该判断是否出现滚动条
				var hasScrollLeft = self.hasScroll( vbody,'left' );
				var hasScrollTop = self.hasScroll( vbody,'top' );
				var barSize = self.getScrollbarSize();
				
				var _vbodyWidth = vbody._width() - ( hasScrollTop ? barSize.y : 0 );
				var _vbodyHeight = vbody._height() - ( hasScrollLeft ? barSize.x : 0 );
			} else {
				var _vbodyWidth = vbody._width();
				var _vbodyHeight = vbody._height();
			}
			
			if( opt._vbodyWidth && opt._vbodyHeight ) {
				if( (opt._vbodyWidth == _vbodyWidth) && (opt._vbodyHeight == _vbodyHeight) ) {
					return false;
				}
			} 
				
			//设置缓存
			opt._vbodyWidth = _vbodyWidth;
			opt._vbodyHeight = _vbodyHeight;
			
			return true;
		},
		showLoading : function(msg,render){
			var self = this,
				opt = self.configs;
			var msg = self._undef( msg,opt.loadMsg );//typeof msg === 'undefined' ? opt.loadMsg : msg;
			var render = self._undef( render,self.getBody() );
			
			if( opt._lmt ) {
				clearTimeout(opt._lmt);	
			}
			/*var isExists = $("#"+opt.id+"-laoding-mask-wraper");
			if( isExists.length ) {
				var maskMsg = $("#"+opt.id+"-laoding-mask-msg");
				maskMsg.html( msg );
				isExists.show();	
				var w = maskMsg.outerWidth();
				maskMsg.css("marginLeft",-w/2+"px");
				return self;
			}*/
			var maskWraper = $('<div id="'+opt.id+'-laoding-mask-wraper" class="nex-loading-mask-wraper"><div id="'+opt.id+'-mask" class="nex-loading-mask"></div><div id="'+opt.id+'-laoding-mask-msg" class="nex-loading-mask-msg">'+msg+'</div><div>');
			$(render).append(maskWraper);
			if( opt.realWidth == 'auto' && Nex.isIE6 ) {
				maskWraper._outerHeight( maskWraper.outerHeight() );
			}
			var maskMsg = $("#"+opt.id+"-laoding-mask-msg");
			var w = maskMsg.outerWidth();
			maskMsg.css("marginLeft",-w/2+"px");
			maskWraper.click(function(e){
				e.stopPropagation();
				e.preventDefault();											 
			});
			return self;
		},
		/*
		*有可能只有IE6才会用到
		*/
		resizeLoadMask : function(){
			var self = this,
				opt = self.configs;	
			var maskWraper = $("#"+opt.id+"-laoding-mask-wraper");	
			if( opt.realWidth == 'auto' && Nex.isIE6 ) {
				maskWraper._outerHeight( maskWraper.outerHeight() );
			}
		},
		hideLoading : function(render){
			var self = this,
				opt = self.configs;
			opt._lmt = setTimeout(function(){
				$("#"+opt.id+"-laoding-mask-wraper").remove();					
			},0);
			return self;
		},
		getContainer : function(){
			var self = this,
				opt = self.configs;
			return opt.views['container'];	
		},
		getBody : function(){
			var self = this,
				opt = self.configs;
			return opt.views['container'];
		},
		setWH : function(w,h,m){
			var self = this,
				opt = self.configs;
			self.resetHtmlSize(w,h,m);
			return true;
		},
		setWidth : function( w ){
			this.resetHtmlSize(w);	
			return this;
		},
		setHeight : function( h ){
			var undef;
			this.resetHtmlSize(undef,h);	
			return this;
		},
		getWidth : function(){
			//最好用 this.C('_width')
			return this.getDom().outerWidth() || 0;	
		},
		getHeight : function(){
			//最好用 this.C('_height')
			return this.getDom().outerHeight() || 0;	
		},
		setSize : function( o,s ){
			if( $.isPlainObject( o ) ) {
				this.setWH( o.width,o.height );	
			} else {
				this.setWH( o,s );		
			}
			return this;
		},
		getSize : function(){
			return {
				width : this.getWidth(),
				height : this.getHeight()
			};
		},
		autoSize : function(){
			this.setWH('auto','auto');	
		},
		//m : true 默认改变子组件的大小
		resize : function(m){
			var self = this,
				opt = self.configs,
				undef;
			
			self.__rt = self.__rt || 0;
			
			if( self.__rt ) {
				clearTimeout( self.__rt );	
			}
			
			self.__rt = setTimeout(function(){
				opt._isResize = true;
				self.setWH(undef,undef,m);
				opt._isResize = false;
			},0);
		},
		setContainerEvent : function(){
			var self = this;
			var opt = self.configs;
			var container = self.getContainer();
			
			//事件绑定
			if( opt.denyEvents === true ) {
				return false;
			} else if( $.isFunction(opt.denyEvents) ) {
				opt.denyEvents.call(self);	
				return false;
			}
			
			var callBack = function(type,e){
				var r = self.fireEvent(type,[ this,e,opt ]);
				if( r === false ) {
					e.stopPropagation();
					e.preventDefault();
				}
			};
			var events = {
				'focusin' : function(e) {
					callBack.call(this,'onFocusin',e);
				},
				'focusout' : function(e) {
					callBack.call(this,'onFocusout',e);
				},
				'focus' : function(e) {
					callBack.call(this,'onFocus',e);
				},
				'blur' : function(e) {
					callBack.call(this,'onBlur',e);
				},
				'click' : function(e) {
					callBack.call(this,'onClick',e);
				},
				'dblclick' : function(e) {
					callBack.call(this,'onDblClick',e);
				},
				'scroll' : function(e){
					callBack.call(this,'onScroll',e);
					var $this = $(this);
					if( $this.scrollTop()<=0 ) {
						self.fireEvent('onScrollTopStart',[ this,e,opt ]);		
					} else if( $this.scrollLeft()<=0 ) {
						self.fireEvent('onScrollLeftStart',[ this,e,opt ])
					}
					if( self.isScrollEnd( this,'top' ) ) {
						self.fireEvent('onScrollTopEnd',[ this,e,opt ]);	
					}
					if( self.isScrollEnd( this,'left' ) ) {
						self.fireEvent('onScrollLeftEnd',[ this,e,opt ]);	
					}
				},
				'keydown' : function(e) {
					callBack.call(this,'onKeyDown',e);
				},
				'keyup' : function(e) {
					callBack.call(this,'onKeyUp',e);
				},
				'keypress' : function(e){
					callBack.call(this,'onKeyPress',e);
				},
				'mousewheel' : function(e){
					callBack.call(this,'onMouseWheel',e);	
				},
				'mouseenter' : function(e){
					callBack.call(this,'onMouseEnter',e);
				},
				'mouseleave' : function(e){
					callBack.call(this,'onMouseLeave',e);
				},
				'mouseover' : function(e){
					callBack.call(this,'onMouseOver',e);
				},
				'mouseout' : function(e){
					callBack.call(this,'onMouseOut',e);
				},
				'mousedown' : function(e) {
					callBack.call(this,'onMouseDown',e);
				},
				'mouseup' : function(e) {
					callBack.call(this,'onMouseUp',e);
				},
				'contextmenu' : function(e){	
					callBack.call(this,'onContextMenu',e);
				}
			};
			
			if( $.isArray( opt.denyEvents ) ) {
				$.each( opt.denyEvents,function(i,e){
					delete events[e];
				} );	
			}
			
			container.bind(events);
			self.fireEvent("onSetContainerEvent",[container,opt]);
			return true;
		},
		_disableSelection : function(){
			var self = this;
			var opt = self.configs;	
			var container = self.getContainer();	
			container.disableSelection();	
		},
		setContainer : function(){
			var self = this;
			var opt = self.configs;	
			var render = $( $.isWindow(opt.renderTo) ? document.body : opt.renderTo );
			var container = $('<'+opt.tag+' class="'+opt.containerCls+' '+( opt.autoScroll ? opt.autoScrollCls : '' )+' '+( opt.border ? opt.borderCls : '' )+' '+opt.cls+' '+ opt['class'] +'" id="'+opt.id+'"></'+opt.tag+'>');
			render.append(container);
			opt.views['container'] = container;
			//方便使用
			self.el = container;
			
			container[0].style.cssText = opt.cssText;
			
			//container.css('padding',opt.padding);
			
			if( opt.tabIndex !== false ) {
				//设置tabIndex=-1 
				container.attr( {
					tabIndex : opt.tabIndex	   
				} );
			}
			container.attr( opt.attrs )
				     .css( opt.style );
			container.data('_nexInstance_',self);
					 
			self.setContainerEvent();	 
			
			if( !opt.selectionable ) {
				self._disableSelection();	
			}
			
			self.fireEvent("onContainerCreate",[container,opt]);
			return self;
		},
		_autoSize : function(){
			var self = this;
			var opt = self.configs;	
			var minWidth = self._getMinWidth();
			var minHeight = self._getMinHeight();
			var maxHeight = self._getMaxHeight();
			var maxWidth = self._getMaxWidth();	
			//如果都没有设置 最大 最小 宽度和高度 那么就不用调用onSizeChange 容器不会去设置宽度和高度
			//发现一个BUG创建时如果min max都没设置 但是由于height是auto 导致出现了滚动条 所以需要再次确实的resize
			/*if( !minWidth && !minHeight && !maxHeight && !maxWidth ) {
				return false;	
			}*/
			
			if( opt.width === 'auto' || opt.height==='auto' ) {
				var r = self.resetHtmlSize();
				if( r ) {
					return true;	
				}
			}
			
			return false;
		},
		initComponent : function(func){
			var self = this;
			var opt = self.configs;	
			self.fireEvent('onInitComponent',[opt]);
			//初始是不应该触发onSizeChange事件
			self.lockEvent('onSizeChange');
			self.resetHtmlSize();
			self._appendContent();
			self._autoSize();
			self.unLockEvent('onSizeChange');
			if( $.isFunction( func ) ) {
				func.call(self);	
			}
			self.fireEvent('onCreate',[opt]);
			opt._isInit = false;
		},
		_appendContent : function(){
			var self = this;
			var opt = self.configs;	
			var lbody = self.getBody();
			var items = opt['html'];
			self.addComponent( lbody,items );
			var items = opt['items'];
			self.addComponent( lbody,items );
			return lbody;
		},
		_add : function( item , after ){
			return this._insert.apply(this,arguments );	
		},
		add : function( item , after ){
			return this.insert.apply(this,arguments );	
		},
		_insert : function( item , after ){
			var self = this;
			var opt = self.C();	
			var lbody = self.getBody();
			var list = self.addComponent( lbody,item,after );
			
			if( opt.__insertVt ) {
				clearTimeout(opt.__insertVt);	
			}
			opt.__insertVt = setTimeout( function(){
				var r = self._autoSize();
				if( !r && opt._checkScrollBar ) {
					self.methodInvoke('resetViewSize');		
				}						 
			},0 );
			
			return list;
		},
		insert : function(item , after ){
			var self = this;
			var opt = self.configs;	
			var list = self._insert.apply(self,arguments );	
			self.fireEvent('onAddComponent',[ list,opt ]);
			return list;
		},
		_empty : function(){
			var self = this;
			var opt = self.configs;	
			var lbody = self.getBody();	
			
			lbody.empty();
			
			self.removeCmp( false );
			
			if( opt.__insertVt ) {
				clearTimeout(opt.__insertVt);	
			}
			opt.__insertVt = setTimeout( function(){
				var r = self._autoSize();
				if( !r && opt._checkScrollBar ) {
					self.methodInvoke('resetViewSize');		
				}						 
			},0 );
			
			return self;
		},
		empty : function(){
			var self = this;
			var opt = self.configs;	
			var x = self._empty.apply(self,arguments );	
			self.fireEvent('onClearComponent',[ opt ]);
			return x;
		},
		removeAll : function(){
			return this.empty.apply(this,arguments );		
		},
		//判断当前对象是否还存在
		isExists : function(){
			var self = this,
				opt = self.configs,
				dom = self.getDom();
			if( dom.size() ) {
				return true;	
			} else {
				if( opt.autoDestroy ) {
					self.removeCmp(opt.id);	
				}	
			}
		},
		_setOverCls : function(){
			var self = this,
				opt = self.configs,
				container = this.el;
			if( opt.overCls ) {
				container.addClass( opt.overCls );	
			}
		},
		_unsetOverCls : function(){
			var self = this,
				opt = self.configs,
				container = this.el;
			if( opt.overCls ) {
				container.removeClass( opt.overCls );	
			}
		},
		_setPadding : function(){
			var self = this,
				opt = self.configs;
			var bd = self.getBody();
			bd.css('padding',opt.padding);
		},
		focus : function(){
			var self = this,
				opt = this.configs,
				el;
			if( el = self.getBody() ) {
				if( opt.tabIndex === false || opt.tabIndex===null ) {
					el.attr({
						tabIndex : opt.tabIndex	   
					});	
				}	
				el.focus();
			}	
			return self;
		},
		scrollLeft : function( sLeft ){
			var self = this,
				undef;
			self.scrollBy( sLeft,undef );	
			return self;
		},
		scrollToLeftEnd : function(){
			var self = this;
			var bd = $(self.getBody())[0];
			if( !bd ) {
				return self;	
			}
			var ch = bd.clientWidth;
			var sh = bd.scrollWidth;
			if( sh <= ch ){
				return self;	
			}
			
			var sTop = sh - ch;
			self.scrollLeft( sTop );
			return self;
		},
		scrollTop : function( sTop ){
			var self = this,
				undef;
			self.scrollBy( undef,sTop );	
			return self;	
		},
		scrollToTopEnd : function(){
			var self = this;
			var bd = $(self.getBody())[0];
			if( !bd ) {
				return self;	
			}
			var ch = bd.clientHeight;
			var sh = bd.scrollHeight;
			
			if( sh <= ch ){
				return self;	
			}
			
			var sTop = sh - ch;
			self.scrollTop( sTop );
			return self;
		},
		scrollBy : function(x,y,ani,func){
			var self = this,
				opt = this.configs,
				undef,
				func = func || $.noop,
				el = self.getBody();
			var pos = {};
			if( x !== undef ) {
				pos['scrollLeft'] = x;	
			}
			if( y !== undef ) {
				pos['scrollTop'] = y;	
			}
			
			if( !$.isEmptyObject( pos ) ) {
				if( ani === undef || ani <= 0 || !ani ) {
					/*el.animate( pos , 1 , function(){	
						func.call( self,el );
					});		*/
					for( var ac in pos ) {
						el[ac]( pos[ac] );
					}
					func.call( self,el );
				} else {
					el.animate( pos , Math.abs(ani) , function(){
						func.call( self,el );
					} );	
				}
			}
			return self;
		},
		setStyle : function( style ){
			this.el.css(style || {});
			return this;		
		},
		setBorder : function( str ){
			this.el.css('border',str);	
			return this;
		},
		setAutoScroll : function(){
			var self = this,
				opt = this.configs;
			self.removeCls(opt.autoScrollCls);	
			return self;
		},
		addCls : function( s ){
			this.el.addClass( s );
			return this;	
		},
		addClass : function( s ){
			this.addCls( s );	
			return this;
		},
		removeCls : function( s ){
			this.el.removeClass( s );
			return this;		
		},
		removeClass : function( s ){
			this.removeCls( s );
			return this;		
		},
		destroy : function(  ){
			this.el.data('_nexInstance_',null);
			this.el.remove();
			this.removeCmp(  );
			return this;
		},
		isHidden : function(){},
		isVisible : function(){},
		setPosition : function(){},
		getPosition : function(){},
		setOverflowXY : function(){},
		showAt : function(){},
		hide : function(){
			var self = this;
			self.el.hide();
			return self;	
		},
		show : function(){
			var self = this;
			self.el.show();
			return self;		
		}
	});
})(jQuery);
/***************************************************
****************AMD 组件加载(单例模式)****************
****************************************************
****************************************************/
var require,$require,$module,$define,$exports,Module,define,Define,Require,exports,Exports;
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
				defineApi : '$define $module',
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
					defineApi : '$module $define Module Define',
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
								} else {//是否加载工具Nex.util
									var s = (v+'').replace(/^Nex\.util\./,'');
									if( Nex.getUtil( s ) ) {
										if( !Nex.Loader.isLoad( v ) ) {
											Nex.Loader.setLoadCache( v,Nex.getUtil(s) );
										}	
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
						//setTimeout(function(){
						var callback = data.callBack;
						callback.call(data);	
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
/*
Nex.location
eg
index.html#!/Home/Login
*/

;(function($){
	"use strict";
	var $location = Nex.widget('location');
	$.nexLocation = $.extLocation = location;
	$location.extend({
		version : '1.0',
		getDefaults : function(opt){
			var _opt = {
				prefix : 'nexlocation-',
				ajax : null,
				data : {},
				_qdata : {},
				autoDestroy : false,
				removeHTag : true,//删除 #
				removeHTagData : '#', 
				location : window.location,
				doc : document,
				timeout_id : null,
				hash : '',
				_iframe : null,
				_delay : 50,
				_currentHash : '',
				supportHashChange : (function(win){
					var  documentMode = document.documentMode;
					return ('onhashchange' in window) && ( documentMode === void 0 || documentMode > 7 );	
				})(window),
				events : {
					onStart : $.noop,
					onCreate : $.noop,
					onGetHash : $.noop,
					onInitHashChange : $.noop,
					onHashChange : $.noop
				}
			};
			var _opt = this.extSet(_opt);
			return $.extend({},_opt,opt);
		},
		_Tpl : {}
	});
	$location.fn.extend({
		_init : function(opt) {
			var self = this;
			self.initLocation();
		},
		_getHash : function( url ) {
			var self = this;
			var opt = self.C();
            url = url || opt.location.href;
			return '#' + url.replace( /^[^#]*#?(.*)$/, '$1' );
        },
		getHash : function( url ){
			var self = this;	
			var opt = self.C();
			opt.hash = self._getHash( url );
			self.fireEvent('onGetHash',[ opt ]);	
			return opt.hash;
		},
		_initHashChange : function(){
			var self = this;
			var opt = self.C();	
			var iframe, timeoutID;
			
			opt.last_hash = self._getHash();
			
			iframe = $('<iframe tabindex="-1" title="empty"/>').hide()
			
				.one( 'load', function(){
					 self.history_set( self._getHash() );
					//计时器监控hanschange
					self._poll();
				})
				// Load Iframe src if specified, otherwise nothing.
				.attr( 'src', 'javascript:0' )
				// Append Iframe after the end of the body to prevent unnecessary
				// initial page scrolling (yes, this works).
				.insertAfter( 'body' );
			
			opt._iframe = iframe;
			opt._iframe_win = iframe[0].contentWindow;
			
		},
		history_get : function() {
			var self = this;
			var opt = self.C();	
			return self._getHash( opt._iframe_win.location.href );
		},
		history_set : function( hash, history_hash ) {
			var self = this;
			var opt = self.C();	
			var iframe = opt._iframe_win;
			var iframe_doc = iframe.document;
			var doc = opt.doc;
			if ( hash !== history_hash ) {
			  // Update Iframe with any initial `document.title` that might be set.
			  iframe_doc.title = doc.title;
			  
			  // Opening the Iframe's document after it has been closed is what
			  // actually adds a history entry.
			  iframe_doc.open();
			  
			  // Set document.domain for the Iframe document as well, if necessary.
			  //domain && iframe_doc.write( '<script>document.domain="' + domain + '"</script>' );//''
			  
			  iframe_doc.close();
			  
			  // Update the Iframe's hash, for great justice.
			  iframe.location.hash = hash;
			}
		  },
		_poll : function() {
			var self = this;
			var opt = self.C();	
			  var hash = self._getHash(),
			  	last_hash = opt.last_hash,
				history_hash = self.history_get( last_hash );
			  
			  if ( hash !== last_hash ) {
				self.history_set( opt.last_hash = hash, history_hash );
				self.fireEvent('onHashChange',[self.getHash(),opt]);
			  } else if ( history_hash !== last_hash ) {
				location.href = location.href.replace( /#.*/, '' ) + history_hash;
			  }
			  
			  opt.timeout_id = setTimeout( function(){
					self._poll();									
				}, opt._delay );
		},
		initLocation : function(){
			var self = this;
			var opt = self.C();	
			if( opt.supportHashChange ) {
				$(window).bind('hashchange.location',function(){
					self.fireEvent('onHashChange',[ self.getHash(),opt ]);	
				});	
				self.fireEvent('onInitHashChange',[ self.getHash(),opt ]);
				self.fireEvent('onCreate',[ opt ]);
			} else {
				$(document).ready(function(){
					self._initHashChange();		
					self.fireEvent('onInitHashChange',[ self.getHash(),opt ]);
					self.fireEvent('onCreate',[ opt ]);						   
				});
			}
		},
		_sysEvents : function(){
			var self = this;
			var opt = self.configs;
			self.bind('onGetHash',function(opt){
				if( opt.removeHTag ) {
					opt.hash = opt.hash.replace( opt.removeHTagData ,'');	
				}
			});	
			return self;
		}
	});
})(jQuery);
/*
jquery.nexShowAt.js
http://www.extgrid.com/nexShowAt
author:nobo
qq:505931977
QQ交流群:13197510
email:zere.nobo@gmail.com or QQ邮箱
eg1:
var at = new Nex.showAt({source:'#t1',el:'#t2'});
eg2:
$("#t1").showAt("#t2"[,{xAlign:'right'}]);
*/

;(function($){
	"use strict";
	var showAt = Nex.widget('showAt');

	$.showAt = $.nexShowAt = showAt;
	
	showAt.extend({
		version : '1.0',
		getDefaults : function(opt){
			var _opt = {
				prefix : 'showAt-',
				autoDestroy : true,
				source : null,
				autoShow : false,//是否自动显示
				openAtOpt : true,//开启后 可使用参数 at 代替el来设置，只是助于理解
				el : null,// 相当于at 或者 一个 坐标eg {left:0,top:2}
				parent : document.body,//source 的父元素 会自动获取offsetParent
				autoRegion : true,//自动调整显示方位
				visibleable : true,//必定可见 相对于source的父元素
				offsetX : 0,//正 负 分别代表外离 内缩
				offsetY : 0,//同上
				zAlign : 'y',// x:横 y:竖
				xAlign : 'center',// left right center
				yAlign : 'center',//top cenger bottom
				animate : null,//动画显示函数 默认直接show
				events : {
					onStart : $.noop,
					onShow : $.noop,
					onGetPosition : $.noop,
					onBeforeAdaptRegion : $.noop,
					onAdaptRegion : $.noop,
					onAdaptPosition : $.noop,
					onBeforeShow : $.noop
				}
			};
			
			var _opt = this.extSet(_opt);
			
			return $.extend({},_opt,opt);
		}
	});
	$.showAt.fn.extend({
		_init : function(opt) {
			var self = this,undef;
			if( opt.source===null ) return false;
			if( opt.openAtOpt && opt.at !== undef ) {
				opt.el = opt.at;	
			}
			var s = $(opt.source);
			if( s.is(':hidden') ) {
				s.show();
				opt.parent = s.offsetParent();//如果source的display 设置为 none 则会是返回body
				s.hide();
			} else {
				opt.parent = s.offsetParent();	
			}
			//曾经在chrome下获取得到的是一个html
			opt.parent = opt.parent.is('html') ? $(document.body) : opt.parent;
			
			if( opt.el === null ) {
				opt.el = opt.parent;
				if( opt.el.is('body') ) {
					opt.el = window;	
				}
			} else {
				if( $(opt.el).is('body') ) {
					opt.el = window;	
				}
			}
			opt.el = (opt.el === document) ? window : opt.el;
			
			self.fireEvent("onCreate",[opt]);	
			
		},
		_sysEvents : function(){
			var self = this;
			var opt = self.configs;
			self.bind("onCreate",self._checkToShow,self);
			return self;
		},
		_checkToShow : function(){
			var self = this;
			var opt = self.configs;
			if( opt.autoShow ) {
				self.show();	
			}		
		},
		//获取 source元素的 offsetParent
		getRender : function(p){
			var self = this,undef;
			var opt = self.configs;
			var parent = p === undef ? opt.parent : $(p);
			if( parent.is('body') || parent.is('html') ) {//opt.el === window || 
				return window;	
			} else {
				return  parent[0];	
			}
		},
		//返回相对于parent(renderTo)的绝对位置
		getOffset : function(el){
			var self = this,undef;
			var opt = self.configs;	
			var renderTo = self.getRender();
			
			if( $._isPlainObject( el ) ) {
				el.left = el.left === undef ? 0 : el.left ;
				el.top = el.top === undef ? 0 : el.top ;
				var offset = $.extend({},el);
				
				var sLeft = $(renderTo).scrollLeft();
				var sTop = $(renderTo).scrollTop();
				offset.left += sLeft;
				offset.top += sTop;
				return offset;
			}
			
			if( $.isWindow(renderTo) ) {// === window
				var offset = $(el).offset();//el是个纯对象时 会返回null
				var sLeft = $(window).scrollLeft();
				var sTop = $(window).scrollTop();
				//return !offset ? {left:sLeft,top:sTop} : offset;	
				return !offset ? {left:sLeft,top:sTop} : offset;	
			} else {
				var renderTo = $(renderTo);
				var sLeft = renderTo.scrollLeft();
				var sLeftBorder = parseFloat(renderTo.css('borderLeftWidth'));
				sLeftBorder = isNaN( sLeftBorder ) ? 0 : sLeftBorder;
				var sLeftPadding = parseFloat(renderTo.css('paddingLeft'));
				sLeftPadding = isNaN( sLeftPadding ) ? 0 : sLeftPadding;
				
				var sTop = renderTo.scrollTop();
				var sTopBorder = parseFloat(renderTo.css('borderTopWidth'));
				sTopBorder = isNaN( sTopBorder ) ? 0 : sTopBorder;
				var sTopPadding = parseFloat(renderTo.css('paddingTop'));
				sTopPadding = isNaN( sTopPadding ) ? 0 : sTopPadding;
				var offset = {
					left : 0,
					top : 0
				};
				try {
					var rOffset = renderTo.offset();
					var eOffset = $(el).offset();	
					//offset = $(el).position();	
					offset = {
						left : eOffset.left - rOffset.left - sLeftBorder - sLeftPadding,
						top : eOffset.top - rOffset.top - sTopBorder - sTopPadding
					};	
				} catch(e){
					//..el 不是dom	
					sLeft = 0;
					sTop = 0;
				}
				return {
					left : 	sLeft + offset.left,
					top : sTop + offset.top
				};
			}
		},
		//获取el[at]周围可显示空间
		getShowSpace : function(el,parent){
			var self = this,undef;
			var opt = self.configs;
			var el = self._undef(el,opt.el);
			//需要获取的对象
			var obj = $(el);
			
			var renderTo = self.getRender(parent);
			
			//获取窗口显示区域大小
			var cw = $(renderTo).width();
			var ch = $(renderTo).height();
			
			var offset = self.getOffset(el);
			
			//获取滚位置
			var sLeft = $(renderTo).scrollLeft();
			var sTop = $(renderTo).scrollTop();
			
			var space = {
				top : offset.top - sTop,
				left : offset.left - sLeft
			};
			space.bottom = ch - space.top - ( $._isPlainObject(el) ? 0 : obj._outerHeight() );
			space.right = cw - space.left - ( $._isPlainObject(el) ? 0 : obj._outerWidth() );
			
			return space;
		},
		checkSpace : function(a,s,e,r){
			var self = this;
			var opt = self.configs;	
			var space = self.getShowSpace();
			if( space[a]<=0 ) return false;
			switch(a){
				case 'bottom':
					return s.height>space.bottom?false:true;
					break;
				case 'top' : 
					return s.height>space.top?false:true;
					break;
				case 'right' :
					return s.width>space.right?false:true;
					break;
				case 'left' :
					return s.width>space.left?false:true;
					break;
			};
			return true;
		},
		/*
		*根据当前的设置自动适配对应显示位置
		*/
		adaptRegion : function(s,e,r){
			var self = this;
			var opt = self.configs;	
			var zAlign = opt.zAlign.toLowerCase();
			var xAlign = opt.xAlign.toLowerCase();
			var yAlign = opt.yAlign.toLowerCase();
			var space = self.getShowSpace();
			
			var r = self.fireEvent('onBeforeAdaptRegion',[xAlign,yAlign,zAlign,opt]);
			if( r === false ) return false;
			if( zAlign==='y' ) {
				if( yAlign==='center' ) return;
				var sp = self.checkSpace(yAlign,s,e,r);
				if( sp === false ) {
					var _yAlign = yAlign==='bottom' ? 'top' : 'bottom';
					var sp = self.checkSpace(_yAlign,s,e,r);	
					if( sp ) {
						opt.yAlign = _yAlign;
					} else {
						if( space.bottom > space.top ) {
							opt.yAlign = 'bottom';	
						} else if( space.bottom < space.top ) {
							opt.yAlign = 'top';		
						} //===情况
						//opt.yAlign = space.bottom>=space.top?'bottom':'top';	
					}
				}
			} else {
				if( xAlign==='center' ) return;
				var sp = self.checkSpace(xAlign,s,e,r);
				if( sp === false ) {
					var _xAlign = xAlign==='right' ? 'left' : 'right';
					var sp = self.checkSpace(_xAlign,s,e,r);	
					if( sp ) {
						opt.xAlign = _xAlign;
					} else {
						if( space.left > space.right ) {
							opt.yAlign = 'left';	
						} else if( space.left < space.right ) {
							opt.yAlign = 'right';		
						} //===情况
						//opt.xAlign = space.left>=space.right?'left':'right';	
					}
				}	
			}	
			self.fireEvent('onAdaptRegion',[opt.xAlign,opt.yAlign,opt.zAlign,opt]);
		},
		/*是否出现水平滚动条*/ 
		//scrollHeight scrollWidth
		hasScrollBarX : function(el){
			return Nex.hasScroll(el,'left');
		},
		/*是否出现垂直滚动条*/
		hasScrollBarY : function(el){
			return Nex.hasScroll(el);
		},
		adaptPosition : function(pos){
			var self = this;
			var opt = self.configs;
			var renderTo = self.getRender();
			
			//if( !$.isWindow(renderTo) ) return pos;
			
			var winWidth = $(renderTo).width();
			var winHeight = $(renderTo).height();
			if( !$.isWindow(renderTo) ) {
				var scrollbarSize = self.getScrollbarSize();
				if( self.hasScrollBarX(renderTo) ) {
					winHeight -= scrollbarSize.width;	
				}
				if( self.hasScrollBarY(renderTo) ) {
					winWidth -= scrollbarSize.height;	
				}
			}
			/*
			*有个小bug @已修正
			*如果renderTo 不是window时，应该判断renderTo 是否出现滚动条 然后winWidth - scrollBarWidth,winHeight - scrollBarWidth
			*/
			
			//获取滚位置
			var sLeft = $(renderTo).scrollLeft();
			var sTop = $(renderTo).scrollTop();
			var width = self.getWidth(opt.source);
			var height = self.getHeight(opt.source);

			var x = winWidth + sLeft - pos.left - width;
			var y = winHeight + sTop - pos.top - height;

			x = x<0?x:0;
			y = y<0?y:0;
			pos.left = (pos.left + x - sLeft)<0?sLeft:(pos.left + x);
			pos.top = (pos.top + y - sTop)<0?sTop:(pos.top + y);
			self.fireEvent('onAdaptPosition',[pos,opt]);
			return pos;
		},
		getWidth : function(el){
			var self = this;
			var opt = self.configs;
			return $._isPlainObject(el) ? 0 : $(el)._outerWidth();
		},
		getHeight : function(el){
			var self = this;
			var opt = self.configs;
			return $._isPlainObject(el) ? 0 : $(el)._outerHeight();
		},
		/*
		*x_inner_top x_inner_bottom y_inner_left y_inner_right
		*/
		x_innerleft : function(s,e,r){
			var self = this;
			var opt = self.configs;
			return e.left + opt.offsetX;
		},
		x_innerright : function(s,e,r){
			var self = this;
			var opt = self.configs;
			return e.left + ( e.width-s.width ) - opt.offsetX;
		},
		y_innertop : function(s,e,r){
			var self = this;
			var opt = self.configs;
			return e.top + opt.offsetY;
		},
		y_innerbottom : function(s,e,r){
			var self = this;
			var opt = self.configs;
			return e.top + ( e.height-s.height ) - opt.offsetY;
		},
		x_left : function(s,e,r){
			var self = this;
			var opt = self.configs;
			var zAlign = opt.zAlign.toLowerCase();
			return zAlign==='y' ? e.left + opt.offsetX : e.left-s.width - opt.offsetX ;
		},
		x_center : function(s,e,r){
			var self = this;
			var opt = self.configs;
			return e.left+(e.width-s.width)/2;
			//return (e.width-s.width)/2;
		},
		x_right : function(s,e,r){
			var self = this;
			var opt = self.configs;
			var zAlign = opt.zAlign.toLowerCase();
			return zAlign==='y' ? e.left + ( e.width-s.width ) - opt.offsetX : e.left+e.width + opt.offsetX ;
		},
		y_top : function(s,e,r){
			var self = this;
			var opt = self.configs;
			var zAlign = opt.zAlign.toLowerCase();
			return zAlign==='y' ? e.top-s.height - opt.offsetY : e.top-( s.height-e.height ) - opt.offsetY;
		},
		y_center : function(s,e,r){
			var self = this;
			var opt = self.configs;
			var zAlign = opt.zAlign.toLowerCase();
			return e.top+(e.height-s.height)/2;
			//return (e.height-s.height)/2;
		},
		y_bottom : function(s,e,r){
			var self = this;
			var opt = self.configs;
			var zAlign = opt.zAlign.toLowerCase();
			return zAlign==='y' ? e.top+e.height + opt.offsetY : e.top + opt.offsetY;
		},
		
		fixPosition : function(pos,opt){
			var self = this;
			
			/*if( opt.parent[0] !== document.body ) {
				if( $.support.boxModel == true ) {
					var _pos = $(opt.parent).offset();
					pos.left = pos.left- _pos.left;
					pos.top = pos.top- _pos.top;
				}
			}*/
			return pos;
		},
		unFixPosition : function(pos,opt){
			var self = this;
			/*if( opt.parent[0] !== document.body ) {
				if( $.support.boxModel == true ) {
					var _pos = $(opt.parent).offset();
					pos.left = pos.left + _pos.left;
					pos.top = pos.top + _pos.top;
				}
			}*/
			return pos;
		},
		getShowPos : function(){
			var self = this;
			var opt = self.configs;
			//滚动位置
			var renderTo = self.getRender();
			var sLeft = $(renderTo).scrollLeft();
			var sTop = $(renderTo).scrollTop();
			var scrollPos = {
				left : sLeft,
				top : sTop
			};
			//源数据
			var source = self.getOffset(opt.source);
			source.width = self.getWidth( opt.source );
			source.height = self.getHeight( opt.source );
			//目标数据
			var target = self.getOffset(opt.el);
			target.width = self.getWidth( opt.el );
			target.height = self.getHeight( opt.el );
			//自动设置或获取显示方位
			if( opt.autoRegion ) {
				self.adaptRegion(source,target,scrollPos);
			}
			
			//获取显示位置
			var _func = function(func){
				var getPos = null;
				if( func in opt ) {
					getPos = opt[func];	
				} else if( func in self ) {
					getPos = self[func];		
				} else if( func in window ) {
					getPos = window[func];	
				} else {
					getPos = function(){return {left:0,top:0};};	
				}
				return getPos;
			}
			var x_func = 'x_'+opt.xAlign.toLowerCase();
			var y_func = 'y_'+opt.yAlign.toLowerCase();
			var pos = {
				left : _func(x_func).call(self,source,target,scrollPos),
				top : _func(y_func).call(self,source,target,scrollPos) 
			};
			var _pos = false;
			
			if( opt.visibleable ) {
				_pos = self.adaptPosition(pos);	
			}
			var p = _pos ? _pos : pos;
			//对显示坐标做最终检测
			p = self.fixPosition(p,opt);
			
			self.fireEvent("onGetPosition",[p,opt]);
			//位置的最后修改
			return p;
		},
		show : function(){
			var self = this,
				opt=this.configs;	
			var pos = self.getShowPos();
			var r = self.fireEvent("onBeforeShow",[pos,opt]);
			if( r === false ) return false;
			var callBack = function(){
				self.fireEvent("onShow",[pos,opt]);	
			}
			if( $.isFunction(opt.animate) ) {
				opt.animate.call(self,opt.source,pos,callBack);	
			} else {
				var position = $(opt.source).css('position');
				if( position === 'static' || position === 'relative' ) {
					pos.position = 'absolute';
				}
				$(opt.source).css(pos).show();
				callBack();
			}
		}
	});
	$.fn.nexShowAt = function(options,conf){
		var undef,opt;
		var conf = conf === undef ? {} : conf;
		if( options === undef ) {
			opt = {}	
		}else if( !$._isPlainObject(options) ) {
			opt = { el:options };	
			$.extend(opt,conf);
		} else {
			opt = 	options;
		}
		var list = [];
		this.each(function(){
			opt.source = $(this);
			var o = new Nex.showAt(opt);
			o.show();
			list.push(o);
			$(this).data('nex.showAt',o);
		});
		return list.length === 1 ? list[0] : list;
	};
	$.fn.showAt = $.fn.nexShowAt;
})(jQuery);
/*
jquery.showOutAt.js
http://www.extgrid.com/showOutAt
author:nobo
qq:505931977
QQ交流群:13197510
email:zere.nobo@gmail.com or QQ邮箱
eg1:
var at = new Nex.showAt({source:'#t1',el:'#t2'});
动画显示
*/

;(function($){
	"use strict";
	var showOutAt = Nex.extend( 'showOutAt','showAt');
	function easingShow( src,pos,callBack ){
		var self = this,
			opt=this.configs;	
		var src = $(opt.source);
		var position = src.css('position');
		if( position === 'static' || position === 'relative' ) {
			pos.position = 'absolute';
		}
		//这个是淡出效果 所以pos应该是自己计算 
		var offset = src.position();
		
		//显示
		src.show();
		
		var width = src.outerWidth();
		var height = src.outerHeight();
		
		//计算出代理坐标
		var _pos = {
			left : 	offset.left+(width - opt.initWidth)/2,
			top : offset.top+(height - opt.initHeight)/2
		};
		//隐藏
		src.hide();
		
		var zIndex = src.css('zIndex');
		if( zIndex != 'auto' ) {
			zIndex++;	
		}
		
		var proxy = $('<div>',{
			id : opt.id+'_mod',
			'class' : 'nex-showat-proxy nex-showat-modal-proxy '+opt.proxyCls	
		}).css(
			$.extend({},offset,{
				zIndex : zIndex,
				width : width,
				height : height
			})
		).appendTo( src.parent() );
		
		opt.animationTime = opt.animationTime<=0?1:opt.animationTime;
		
		proxy.animate( {
			left : _pos.left,
			top : _pos.top,	
			width : opt.initWidth,
			height : opt.initHeight
		},opt.animationTime,opt.animationEasing,function(){
			src.css( offset );
			proxy.remove();
			callBack();
		} );
		
	}
	showOutAt.setOptions( function(){
		return {
			initWidth : 16,//最终大小
			initHeight : 16,
			animationTime : 300,
			animationEasing : 'swing',
			proxyCls : '',
			animate : easingShow
		}	
	} );
})(jQuery);
/*
jquery.showInAt.js
http://www.extgrid.com/showInAt
author:nobo
qq:505931977
QQ交流群:13197510
email:zere.nobo@gmail.com or QQ邮箱
eg1:
var at = new Nex.showAt({source:'#t1',el:'#t2'});
动画显示
*/

;(function($){
	"use strict";
	var showInAt = Nex.extend( 'showInAt','showAt');
	function easingShow( src,pos,callBack ){
		var self = this,
			opt=this.configs;	
		var src = $(opt.source);
		var position = src.css('position');
		if( position === 'static' || position === 'relative' ) {
			pos.position = 'absolute';
		}
		
		var offset = pos;
		
		//显示
		src.show();
		
		var width = src.outerWidth();
		var height = src.outerHeight();
		
		//计算出代理坐标
		var _pos = {
			left : 	offset.left+(width - opt.initWidth)/2,
			top : offset.top+(height - opt.initHeight)/2
		};

		src.css( {
			left : -9999,
			top : -9999	
		} );
		
		var zIndex = src.css('zIndex');
		if( zIndex != 'auto' ) {
			zIndex--;	
		}
		var proxy = $('<div>',{
			id : opt.id+'_mod',
			'class' : 'nex-showat-proxy nex-showat-modal-proxy '+opt.proxyCls	
		}).css(
			$.extend({},_pos,{
				zIndex : zIndex,
				width : opt.initWidth,
				height : opt.initHeight
			})
		).appendTo( src.parent() );
		
		opt.animationTime = opt.animationTime<=0?1:opt.animationTime;
		
		proxy.stop(true,true).animate( {
			left : offset.left,
			top : offset.top,	
			width : width,
			height : height
		},opt.animationTime,opt.animationEasing,function(){
			src.css( offset );
			proxy.remove();
			callBack();
		} );
		
	}
	showInAt.setOptions( function(){
		return {
			initWidth : 100,
			initHeight : 50,
			animationTime : 300,
			animationEasing : 'swing',
			proxyCls : '',
			animate : easingShow
		}	
	} );
})(jQuery);
/*
draggable - jQuery Nex
nobo
zere.nobo@gmail.com
qq : 505931977
var drag = new Nex.draggable({helper:$('#drag')});
*/
;(function($){
	"use strict";
	var drag = Nex.widget('draggable');

	$.dragable = $.nexDragable = drag;
	
	drag.extend({
		version : '1.0', 
		getDefaults : function(opt){
			var _opt = {
				prefix : 'drag-',
				cursor:'move',
				_cursor : '',
				appendTo : null,//document.body
				clone : false,
				helper:null,//用于触发移动的元素 必须
				target: null,//最终需要移动的元素
				disabled: false,
				axis:null,	// v or h
				parent : null,
				afterDrag : null,//停止移动后可自定义函数实现
				delay : 0, //当鼠标点下后，延迟指定时间后才开始激活拖拽动作（单位：毫秒）。
				distance : 0, //当鼠标点下后，只有移动指定像素后才开始激活拖拽动作。
				opacity : false,//当元素开始拖拽时，改变元素的透明度。
				_opacity : 1,
				_revertConf : {},//还原信息
				revert :　false,//当元素拖拽结束后，元素回到原来的位置。   
				revertDuration : 500,//当元素拖拽结束后，元素回到原来的位置的时间。（单位：毫秒）
				revertEasing : 'easeOutCubic',
				moveHelper : null,//移动中的元素
				left : 0,//moveHelper移动后的位置 
				top : 0,
				_sLeft : 0,//moveHelper初始位置
				_sTop : 0,
				_ssLeft : 0,//moveHelper滚动条初始位置
				_ssTop : 0,
				_sX : 0, //初始坐标
				_sY : 0,
				offsetX : 0,
				offsetY : 0,
				_sPosition : '',
				_dragging : false,
				edge : 0,//无效边缘
				events : {
					onStart : $.noop,//初始化事件
					onBeforeDrag : $.noop,
					onStartDrag : $.noop,
					onDrag : $.noop,
					onStopDrag : $.noop,
					onAfterDrag : $.noop
				}
			};
			var _opt = this.extSet(_opt);
			
			return $.extend({},_opt,opt);
		}
	});
	drag.fn.extend({
		_init : function(opt) {
			var self = this;
			
			if( !opt.helper && !opt.target ) return;
			if( !opt.helper ) {
				opt.helper = opt.target;	
			}
			var target = null;
            if (typeof opt.target == 'undefined' || opt.target == null){
                target = opt.helper;
            } else {
                target = (typeof opt.target == 'string' ? $(opt.target) : opt.target);
            }
			
			//opt.parent = $(target).offsetParent();
			opt.target = target;
			
			$(opt.helper).data('nex.draggable', self);
			
			opt.helper.bind('mousedown.draggable', $.proxy( self,'mouseDown' ));
			opt.helper.bind('mousemove.draggable', $.proxy( self,'mouseMove' ));
			opt.helper.bind('mouseleave.draggable', $.proxy( self,'mouseLeave' ));
		},
		
		//系统事件
		_sysEvents : function(){
			var self = this;
			var opt = self.configs;
			//self.bind("onStart",self.onStart);	
		},
		_doDown : function(e){
			var self = this;
			var opt = self.configs;
			
			$(document).bind("selectstart.draggable",function(){return false;});	
			
			var r = self.fireEvent('onStartDrag',[e,opt]);
			if( r === false) return;
			
			//$('body').css('cursor', opt.cursor);
		},
		_doMove : function(e){
			var self = this;
			var opt = self.configs;
			if( opt.disabled ) return;
			
			var offsetX = e.pageX - opt._sX;
			var offsetY = e.pageY - opt._sY;
			
			opt.offsetX = offsetX;
			opt.offsetY = offsetY;
			
			if( opt.distance && !opt._dragging ) {
				
				var dist = Math.max( Math.abs( offsetX ),Math.abs( offsetY ) );
				if( dist<opt.distance ) {
					return;	
				}
				
			}
			if( !opt._dragging ) {
				var r = self.fireEvent('onBeforeDrag',[e,opt]);
				if( r === false) return;
				
				self._startMove();
				
				opt._dragging = true;
			}
			
			//var parent = $(opt.moveHelper).parent();
			var cLeft = 0;//parent.scrollLeft();
			var cTop = 0;//parent.scrollTop();
			
			var left = opt._sLeft + offsetX + cLeft - opt._ssLeft;
			var top = opt._sTop + offsetY + cTop - opt._ssTop;
			
			if (opt.axis == 'h') {
				opt.left = left;
				opt.top = opt._sTop;
			} else if (opt.axis == 'v') {
				opt.left = opt._sLeft;
				opt.top = top;
			} else {
				opt.left = left;
				opt.top = top;
			}
			
			var r = self.fireEvent('onDrag',[e,opt]);
			if( r === false) return;
			
			self.moveToPosition(opt.left,opt.top,e);	
			
		},
		_doUp : function(e){
			var self = this;
			var opt = self.configs;
			$(document).unbind('.draggable');	
			/*setTimeout(function(){
				$('body').css('cursor','');
			},100);*/
			if( !opt._dragging ) {
				return;	
			}
			opt._dragging = false;
			$('body').css('cursor',opt._cursor);
			/*var endDrag = function(){
				opt._dragging = false;	
			};*/
			var r = self.fireEvent('onStopDrag',[e,opt]);
			if( r === false ) {//easeOutCubic
				self._revertEl();
			} else {
				//self.moveToPosition(opt.left,opt.top,e);	
				var afterDrag = function(){
					if( opt.revert === true ) {
						self._revertEl();	
					} else if( opt.revert === false ) {
						self._endMove();
					}	
				};
				if( $.isFunction( opt.afterDrag ) ) {
					afterDrag = opt.afterDrag;	
				}
				afterDrag.call(self);
			}
			//因为onStopDrag后会继续设置target的坐标实际上onStopDrag并不是最终触发的事件，onAfterDrag才是最终触发的事件
			self.fireEvent('onAfterDrag',[e,opt]);
		},
		_revertEl : function(){
			var self = this;
			var opt = self.configs;
			var call = function(){
				$(opt.moveHelper).css( 'opacity',opt._opacity );
				if( opt.clone ) {
					$(opt.moveHelper).remove();	
				}	
				if( opt.appendTo ) {
					opt._revertConf.revert();
					opt._revertConf.target[0].style.cssText = opt._revertConf.cssText;
					opt._revertConf.parent.scrollTop( opt._revertConf.sTop );
					opt._revertConf.parent.scrollLeft( opt._revertConf.sLeft );
				}
			};
			if( opt.revertDuration>0 ) {
				$(opt.moveHelper).animate({
					left:opt._sLeft,
					top:opt._sTop
				}, opt.revertDuration, opt.revertEasing ,function(){
					call();
				});	
			} else {
				$(opt.moveHelper).css({
					left:opt._sLeft,
					top:opt._sTop
				});	
				call();
			}
		},
		_getFixPositionSize : function( op ){
			
			var _c = parseFloat(op.css('borderLeftWidth')),
			_e = parseFloat(op.css('paddingLeft')),
			_c1 = parseFloat(op.css('borderTopWidth')),
			_e1 = parseFloat(op.css('paddingTop'));
			_c = isNaN( _c ) ? 0 : _c;
			_e = isNaN( _e ) ? 0 : _e;
			_c1 = isNaN( _c1 ) ? 0 : _c1;
			_e1 = isNaN( _e1 ) ? 0 : _e1;
			return {
				left : _c + _e,
				top : _c1 + _e1
			};		
		},
		_startMove : function(){
			var self = this;
			var opt = self.configs;
			
			opt._cursor = $('body').css('cursor');
			$('body').css('cursor',opt.cursor);
			
			opt.moveHelper = $(opt.target);	
			var _rv = opt.moveHelper;
			var _rvp = opt.moveHelper.parent();
			if( opt.appendTo ) {
				//记录初始位置和信息
				opt._revertConf = {
					target : opt.moveHelper,
					parent : _rvp,
					sLeft : _rvp.scrollLeft(),
					sTop : _rvp.scrollTop()
				};
				var prev = _rv.prev();
				var next = _rv.next();
				if( prev.size() ) {
					opt._revertConf.revert = function(){
						prev.after( _rv );
					}	
				} else if( next.size() ) {
					opt._revertConf.revert = function(){
						prev.before( _rv );
					}	
				} else {
					opt._revertConf.revert = function(){
						_rvp.prepend( _rv );
					}	
				}
				opt._revertConf.cssText = _rv[0].style.cssText;
			}
			
			if( opt.clone ) {
				opt.moveHelper = $(opt.target).clone();
			}
			
			if( opt.appendTo ) {
				var offset1 = $(opt.target).offset();
				var offset2 = $(opt.appendTo).offsetParent().offset();
				$(opt.appendTo).append( opt.moveHelper );
				if( opt.clone ) {
					$(opt.appendTo).append( opt.target );	
				}
				var offset2 = $(opt.target).offsetParent().offset(),
					_s = self._getFixPositionSize( $(opt.appendTo).offsetParent() );
				$(opt.target).css({
					position : 'absolute',
					left : offset1.left - offset2.left - _s.left,
					top : offset1.top - offset2.top - _s.top
				});
			} else {
				if( opt.clone ) {
					$(opt.target).parent().append( opt.moveHelper );	
				}
			}
			
			//var parent = $(opt.target).parent();
			opt._ssLeft = 0;//parent.scrollLeft();
			opt._ssTop = 0;//parent.scrollTop();
			var position = $(opt.target)._position();
			opt.left = position.left;
			opt.top = position.top;
			
			var target = opt.moveHelper;
			opt._sLeft = opt.left + opt._ssLeft;
			opt._sTop = opt.top + opt._ssTop;
			
			target.css('position','absolute');
			if( opt.clone ) {
				target.css({		   
					left : 	opt._sLeft,
					top : opt._sTop
				});
			}
			opt._opacity = target.css('opacity');
			if( opt.opacity ) {
				target.css( 'opacity',opt.opacity );
			}
			
			return self;
		},
		_endMove : function(){
			var self = this;
			var opt = self.configs;
			
			//self.moveToPosition( opt.left,opt.top );
			$(opt.target).css( {
				position : 'absolute',
				left : opt.left,
				top : opt.top
			} );
			
			$(opt.moveHelper).css( 'opacity',opt._opacity );
			if( opt.clone ) {
				$(opt.moveHelper).remove();
			}
		},
		moveToPosition : function(left,top,e){
			var self = this;
			var opt = self.configs;
			
			var target = $(opt.moveHelper);
			//var parent = target.parent();
			
			target.css({
				left : left,
				top : top
				//position : 'absolute'
			});
		},
		mouseDown : function(e){
			var self = this;
			var opt = self.configs;
			
			if( self.checkDisabledEdge(e) ) {
				//opt.helper.css('cursor', '');
				return;
			}
			
			opt._sX = e.pageX;
			opt._sY = e.pageY;
			
			var st = 0;
			if( opt.delay>0 ) {
				st = setTimeout( function(){
					st = 0;
					$(document).bind('mousedown.draggable', $.proxy( self,'_doDown' ));
					$(document).bind('mousemove.draggable', $.proxy( self,'_doMove' ));	
					$(document).bind('mouseup.draggable', $.proxy( self,'_doUp' ));		
				},opt.delay );	
				$(document).one('mouseup.draggable', function(){
					if( st ) {
						clearTimeout( st );	
					}											   
				});
			} else {
				$(document).bind('mousedown.draggable', $.proxy( self,'_doDown' ));
				$(document).bind('mousemove.draggable', $.proxy( self,'_doMove' ));	
				$(document).bind('mouseup.draggable', $.proxy( self,'_doUp' ));	
			}
			
		},
		mouseMove : function(e){
			var self = this;
			var opt = self.configs;
			
			if( opt._dragging ) return;
			
			if( self.checkDisabledEdge(e) ) {
				//opt.helper.css('cursor', '');
				return;
			}
			
			//opt.helper.css('cursor', opt.cursor);
		},
		mouseLeave : function(e){
			var self = this;
			var opt = self.configs;
			
			if( opt._dragging ) return;
			
			if( self.checkDisabledEdge(e) ) {
				//opt.helper.css('cursor', '');
				return;
			}
			
			//opt.helper.css('cursor', '');	
		},
		//移除可拖拽
		removeDragable : function(){
			var self = this;
			var opt = self.configs;
			
			$(opt.helper).data('nex.draggable', null);
			
			opt.helper.unbind('mousedown.draggable');
			opt.helper.unbind('mousemove.draggable');
			opt.helper.unbind('mouseleave.draggable');
			return true;
		},
		checkDisabledEdge : function(e){
			var self = this;
			var opt = self.configs;
			var offset = $(opt.helper).offset();
			var width = $(opt.helper).outerWidth();
			var height = $(opt.helper).outerHeight();
			var t = e.pageY - offset.top;
			var r = offset.left + width - e.pageX;
			var b = offset.top + height - e.pageY;
			var l = e.pageX - offset.left;
			return Math.min(t,r,b,l) < opt.edge;
		}
	});
	$.fn.draggable = function(options, param){
		var options = options || {};
		if (typeof options == 'string'){
			switch(options) {
				case 'options':
					return $(this[0]).data('nex.draggable').C();
				case 'disabled':
					return this.each(function(){
								$(this).data('nex.draggable').C('disabled',true);
							});
				case 'enable':
					return this.each(function(){
								$(this).data('nex.draggable').C('disabled',false);
							});
				default : 
					return this.each(function(){
						if( param ) {
							$(this).data('nex.draggable').C(options,param);
						}
					}); 
			}
		}
		
		return this.each(function(){
			var opt;
			var self = $(this).data('nex.draggable');
			if (self) {
				opt = self.configs;
				$.extend(opt, options);
				return;
			}
			options.helper = $(this);
			new Nex.draggable(options);
		});
	};
})(jQuery);
/*
jquery.nexPanel.js
http://www.extgrid.com/panel
author:nobo
qq:505931977
QQ交流群:13197510
email:zere.nobo@gmail.com or QQ邮箱

*/

;(function($){
	"use strict";
	var panel = Nex.define('Nex.Panel','Nex.Html').setXType('panel');
	panel.extend({
		version : '1.0',
		_Tpl : {				
		}
	});
	panel.setOptions(function( opt,t ){
		return {
			prefix : 'nexpanel-',
			autoDestroy : true,
			autoResize : true,
			_hasBodyView : true,
			_checkScrollBar : false,
			position : 'relative',
			border : true,
			borderCls : [opt.borderCls,'nex-panel-border'].join(' '),
			containerCls : [opt.containerCls,'nex-panel'].join(' '),
			autoScrollCls : [opt.autoScrollCls,'nex-panel-auto-scroll'].join(' '),
			autoScroll : false,
			autoShow : true,
			closeToRremove : true,//关闭窗口后 销毁对象
			draggable : false,
			resizeable : false,
			modal : false,
			focusToTop : false,//点击窗口后最顶层显示
			zIndex : (function(){
				var zIndex = Nex['zIndex']+2;
				Nex['zIndex'] = zIndex;
				return zIndex;
			})(),
			refreshPosOnResize : false,//通过调用resize时会重置窗口显示位置
			point : null,//point : {left:0,top:0},
			showAt : {},
			title : '',
			toolsItems : [],//更自由的自定义组件显示
			toolsIcons : [],//自定义图标显示 {icon:'abc',text:'',callBack:func}
			collapseable : false,
			collapsed :　false,
			minable : false,
			maxable : false,
			hideHeader : false,
			headerSelectionable : true,
			closeable : false,
			headerItemsCls : '',
			footerItemsCls : '',
			headerItems : null,//string xobject [ xobject ] jquery...
			footerItems : null,
			html : '',
			items : [],
			padding : 0,//body的
			style : '',//body的
			renderTo : window,
			isIE : !!window.ActiveXObject,
			url : '',//支持远程创建 返回数据格式  json
			cache : true,
			dataType : 'json',
			queryParams : {},
			method : 'get',
			parames : {},
			views : {},
			cls : '',
			headerCls : '',
			icon : '',
			iconCls : '',
			iconTitle : '',
			iconTag : 'span',
			modalCls : '',
			bodyCls : '',
			bodyStyle : {},
			autoSize : false,
			width : 'auto',
			height : 'auto',
			maxWidth : function(){
				var self = this;
				var opt = self.configs;
				var renderTo = this.C('renderTo');	
				if( $.isWindow(opt.renderTo) ) {
					return $(renderTo).width();
				} else {
					return 0;		
				}
			},
			maxHeight : function(){
				var self = this;
				var opt = self.configs;
				var renderTo = this.C('renderTo');
				if( $.isWindow(opt.renderTo) ) {
					return $(renderTo).height();
				} else {
					return 0;	
				}
			},
			minHeight : 0,
			minWidth : 0,
			events : {
				onStart : $.noop,
				onCreate : $.noop,
				onDestroy : $.noop
			}
		};	
	});
	panel.fn.extend({
		_init : function(opt) {
			var self = this;
			self.setContainer();//setContainer必须
			if( !opt.hideHeader ) {	
				self.setHeader();
			}
			self.setHeaderItems()
				.setBody()
				.setFooter()
				.createModal()
				.initPanel();		
		},
		_sysEvents : function(){
			var self = this;
			var opt = self.configs;
			
			Nex.Html.fn._sysEvents.apply(self,arguments);
			
			self.bind("onHeaderCreate",self._drag,self);
			self.bind("onCreate",self._resizeable,self);
			self.bind("onHeaderCreate",self._setTopzindex,self);
			//self.bind("onHeaderCreate",self.displayHeader,self);
			return self;
		},
		displayHeader : function(m){
			var self = this;
			var opt = self.configs;
			var header = opt.views['header'];
			if( !header ) { 
				return false;
			}
			if( m ) {
				header.show();	
			} else {
				header.hide();	
			}
		},
		showHeader : function(){
			return this.displayHeader( true );	
		},
		hideHeader : function(){
			return this.displayHeader( false );	
		},
		_setTopzindex : function(){
			var self = this;
			var opt = self.configs;	
			
			if( !opt.focusToTop ) return;
			
			var container = opt.views['container'];
			
			container.bind('mousedown.zindex',function(e){
				var zIndex = Nex['zIndex']+2;
				Nex['zIndex'] = zIndex;
				opt.zIndex = zIndex; 
				
				container.css('z-index',opt.zIndex);
				var modal = false;	
				if( opt.modal && ('modal' in opt.views) ) {
					modal = opt.views['modal'];
					modal.css('z-index',opt.zIndex-1);
				}										   
			
			});
		},
		_drag : function(){
			var self = this;
			var opt = self.configs;
			if( !opt.draggable || !Nex.draggable ) return;
			var header = opt.views['header'];
			Nex.Create('draggable',{
				helper : header,
				target:opt.views['container'],
				onBeforeDrag : function(e,_opt){
					
					if( !opt.draggable ) return false;
					
					var r = self.fireEvent("onPanelBeforeDrag",[e,_opt]);	
					if( r === false) return r;
				},
				onStartDrag : function(e,_opt){
					var r = self.fireEvent("onPanelStartDrag",[e,_opt]);	
					if( r === false) return r;
				},
				onDrag : function(e,_opt){
					var r = self.fireEvent("onPanelDrag",[e,_opt]);	
					if( r === false) return r;
				},
				onStopDrag : function(e,_opt){
					var r = self.fireEvent("onPanelStopDrag",[e,_opt]);	
					if( r === false) return r;
				}
			});
			//header.draggable({target:opt.views['container']});
		},
		_resizeable : function(){
			var self = this;
			var opt = self.configs;
			if( !opt.resizeable || !Nex.resizable ) return;
			var container = opt.views['container'];
			
			Nex.Create('resizable',{
				target : container,
				minWidth: opt.minWidth,	
				minHeight: opt.minHeight,
				//maxWidth: opt.maxWidth,	
				//maxHeight: opt.maxHeight,
				onBeforeResize : function(e,_opt){
					
					if( opt.autoSize || !opt.resizeable || opt.collapsed ) return false;
					
					var r = self.fireEvent("onPanelBeforeResize",[e,_opt]);	
					if( r === false) return r;	
				},
				onStartResize : function(e,_opt){
					var r = self.fireEvent("onPanelStartResize",[e,_opt]);	
					if( r === false) return r;	
				},
				onResize : function(w,h,e,_opt){
					var r = self.fireEvent("onPanelResize",[w,h,e,_opt]);	
					if( r === false) return r;	
					self.setWH( _opt.width,_opt.height );	
				},
				onStopResize : function(w,h,e,_opt){
					var r = self.fireEvent("onPanelStopResize",[w,h,e,_opt]);	
					if( r === false) return r;	
				}
			});
			/*container.resizable({
				minWidth: opt.minWidth,
				minHeight: opt.minHeight,
				onResize:function(w,h){
				self.setWH( w,h );		
			}});*/
		},
		setContainer : function(){
			var self = this;
			var opt = self.C();
			var render = $( $.isWindow(opt.renderTo) ? document.body : opt.renderTo );
			/*if( render.css('position') === 'static' ) {
				render.css('position','relative');	
			}*/
			//防止重复创建相同ID的窗口
			$("#"+opt.id).remove();
			$("#"+opt.id+'_modal').remove();
			
			self.lockEvent('onContainerCreate');
			
			opt.containerCls += ' nex-panel-'+opt.position;
			
			Nex.Html.fn.setContainer.call(self);
			
			self.unLockEvent('onContainerCreate');
			/*var container = $('<div class="nex-panel '+( opt.autoScroll ? 'nex-panel-auto-scroll' : '' )+' nex-panel-'+opt.position+' '+opt.cls+'" id="'+opt.id+'"></div>');
			opt.views['container'] = container;*/
			var container = opt.views['container'];
			
			//container._removeStyle('padding');
			
			//container.css('z-index',opt.zIndex);
			render.append(container);
			self.fireEvent("onContainerCreate",[container,opt]);
			return self;
		},
		_hide : function( func ){
			var self = this,undef;
			var opt = self.configs;	
			var container = opt.views['container'];
			var modal = false;	
			if( opt.modal && ('modal' in opt.views) ) {
				modal = opt.views['modal'];
			}	
			//animateHide
			container.hide();
			
			if( modal ) {
				modal.hide();
			}
			
			if( $.isFunction(func) ) {
				func.call( self );	
			}
			
		},
		_show : function(func){
			var self = this,undef;
			var opt = self.configs;		
			var container = opt.views['container'];
			var modal = false;	
			if( opt.modal && ('modal' in opt.views) ) {
				modal = opt.views['modal'];
			}
			//animateShow
			if( opt.showAt.at ) {
				opt.showAt.el = opt.showAt.at;
			}
			
			opt.showAt.el = opt.showAt.el === undef ? (opt.point === null ? opt.renderTo : opt.point) : opt.showAt.el;
			
			container.show();
					 //.showAt(opt.showAt);
			
			if( modal ) {
				modal.show();
			}
			
			if( $.isFunction(func) ) {
				func.call( self );	
			}
		},
		maxPanel : function(btn){
			var self = this,undef;
			var opt = self.configs;		
			var container = opt.views['container'];
			var header = opt.views['header'];
			
			var r = self.fireEvent("onBeforeMaxPanel",[container,opt]);
			if( r === false ) return r;
			
			var btn = btn === undef ? $('.nex-panel-max-icon',header) : btn;
			
			var render = $( $.isWindow(opt.renderTo) ? document.body : opt.renderTo );
			render.addClass('nex-panel-noscroll');
			
			btn.addClass('nex-panel-max-icon-reset');
			
			opt.__mOffset = self.getPosition();
			container.css({
							left : 0,
							top : 0
						});
			opt.__mWidth = opt.width;
			opt.__mHeight = opt.height;
			opt.__mdraggable = opt.draggable;
			opt.__mresizeable = opt.resizeable;
			opt.__mautosize = opt.autoSize;
			opt.autoSize = opt.resizeable = opt.draggable = false;
			
			self.initWH('100%','100%');	
			
			if( opt.collapsed ) {
				container.height( header._height() );	
				if( opt._mAutoResize ) {	
					Nex.Manager._resize(opt.id,true);
				}
			}
			
			self.fireEvent("onMaxPanel",[container,opt]);
			
		},
		maxResetPanel : function(btn){
			var self = this,undef;
			var opt = self.configs;		
			var container = opt.views['container'];
			var header = opt.views['header'];
			
			var r = self.fireEvent("onBeforeMaxResetPanel",[container,opt]);
			if( r === false ) return r;
			
			var btn = btn === undef ? $('.nex-panel-max-icon',header) : btn;
			
			var render = $( $.isWindow(opt.renderTo) ? document.body : opt.renderTo );
			render.removeClass('nex-panel-noscroll');
			
			btn.removeClass('nex-panel-max-icon-reset');
			
			opt.width = opt.__mWidth || opt.width;
			opt.height = opt.__mHeight || opt.height;
			
			opt.draggable = self._undef(opt.__mdraggable,opt.draggable);
			opt.resizeable = self._undef(opt.__mresizeable,opt.resizeable);
			opt.autoSize = self._undef(opt.__mautosize,opt.autoSize);
			
			self.initWH(opt.__mWidth,opt.__mHeight);	
			
			if( opt.__mOffset ) {
				container.css(opt.__mOffset);
			}
			
			if( opt.collapsed ) {
				container.height( header._height() );		
				if( opt._mAutoResize ) {	
					Nex.Manager._resize(opt.id,true);
				}
			}
			
			self.fireEvent("onMaxResetPanel",[container,opt]);
			
		},
		minPanel : function(e1,e2){
			var self = this,undef;
			var opt = self.configs;		
			var container = opt.views['container'];
			var header = opt.views['header'];
			
			var e1 = e1 === undef ? 'onBeforeMinPanel' : e1;
			var e2 = e2 === undef ? 'onMinPanel' : e2;
			
			var r = self.fireEvent(e1,[container,opt]);
			if( r === false ) return r;
			
			var modal = false;	
			if( opt.modal && ('modal' in opt.views) ) {
				modal = opt.views['modal'];
			}	
			container.addClass('nex-panel-hidden');
			if( modal ) {
				modal.addClass('nex-panel-hidden');
			}
			
			opt._mAutoResize = opt.autoResize;
			self.disabledAutoResize();
			
			self._hide(function(){
				self.fireEvent(e2,[container,opt]);					
			});
		},
		minResetPanel : function(e1,e2){
			var self = this,undef;
			var opt = self.configs;		
			var container = opt.views['container'];
			var header = opt.views['header'];
			opt._mAutoResize = opt._mAutoResize === undef ? opt.autoResize : opt._mAutoResize;
			
			var e1 = e1 === undef ? 'onBeforeMinResetPanel' : e1;
			var e2 = e2 === undef ? 'onMinResetPanel' : e2;
			
			var r = self.fireEvent(e1,[container,opt]);
			if( r === false ) return r;
			
			var modal = false;	
			if( opt.modal && ('modal' in opt.views) ) {
				modal = opt.views['modal'];
			}	
			container.removeClass('nex-panel-hidden');
			if( modal ) {
				modal.removeClass('nex-panel-hidden');
			}
			//恢复	
			var func = opt._mAutoResize ? 'enableAutoResize' : 'disabledAutoResize';
			self[func]();
			
			self._show(function(){
				self.resize();
				self.fireEvent(e2,[container,opt]);					
			});
			
		},
		closePanel : function(){
			var self = this,undef;
			var opt = self.configs;		
			var container = opt.views['container'];
			var header = opt.views['header'];
			if( !opt.closeToRremove ) {
				self.minPanel('onBeforeClosePanel','onClosePanel');	
			} else {
				var r = self.fireEvent('onBeforeClosePanel',[container,opt]);
				if( r === false ) return r;
				opt._closed = true;
				self._hide(function(){
					opt.views['container'] = container.detach();
					var modal = false;	
					if( opt.modal && ('modal' in opt.views) ) {
						opt.views['modal'] = opt.views['modal'].detach();
					}	
					self.fireEvent('onClosePanel',[container,opt]);
				});
			}
		},
		openPanel : function(){
			var self = this,undef;
			var opt = self.configs;		
			var container = opt.views['container'];
			var header = opt.views['header'];
			if( !opt.closeToRremove ) {
				self.minResetPanel('onBeforeOpenPanel','onOpenPanel');	
			} else {
				opt._closed = opt._closed === undef ? false : opt._closed;
				if( opt._closed ) {
					var r = self.fireEvent('onBeforeOpenPanel',[container,opt]);
					if( r === false ) return r;
					var render = $( $.isWindow(opt.renderTo) ? document.body : opt.renderTo );
					container.appendTo( render );
					var modal = false;	
					if( opt.modal && ('modal' in opt.views) ) {
						modal = opt.views['modal'];
						modal.appendTo( render );
					}	
				}
				self._show(function(){
					self.resize();	
					self.fireEvent('onOpenPanel',[container,opt]);
				});
			}
		},
		collapsePanel : function(btn){
			var self = this,undef;
			var opt = self.configs;		
			var container = opt.views['container'];
			var header = opt.views['header'];
			
			var r = self.fireEvent("onBeforeCollapsePanel",[container,opt]);
			if( r === false ) return r;
			
			var btn = btn === undef ? $('.nex-panel-collapse-icon',header) : btn;
			btn.addClass('nex-panel-collapse-icon-collapsed');	
			
			opt.collapsed = true;
			opt._mAutoResize = opt.autoResize;
			self.disabledAutoResize();
			container.animate({
				height : header._height()  
			},300);	
			self.fireEvent("onCollapsePanel",[container,opt]);
		},
		expandPanel : function(btn){
			var self = this,undef;
			var opt = self.configs;		
			var container = opt.views['container'];
			var header = opt.views['header'];
			
			var r = self.fireEvent("onBeforeExpandPanel",[container,opt]);
			if( r === false ) return r;
			
			var btn = btn === undef ? $('.nex-panel-collapse-icon',header) : btn;
			btn.removeClass('nex-panel-collapse-icon-collapsed');	
			
			opt.collapsed = false;
			var func = opt._mAutoResize ? 'enableAutoResize' : 'disabledAutoResize';
			self[func]();
			container.animate({
				height : opt._height - ( container._outerHeight() - container._height() )
			},300);	
			self.fireEvent("onExpandPanel",[container,opt]);
		},
		bindHeaderEvent : function(){
			var self = this;
			var opt = self.configs;	
			var container = opt.views['container'];
			var header = opt.views['header'];
			
			if( opt.closeable ) {
				$('a.nex-panel-close-icon',header).click(function(e){
					self.closePanel();
					$(document).trigger('click',[e]);
					return false;
				});
			}
			if( opt.maxable ) {
				$('.nex-panel-max-icon',header).click(function(e){
					var btn = $(this);
					if( btn.hasClass('nex-panel-max-icon-reset') ) {
						self.maxResetPanel(btn);		
					} else {
						self.maxPanel(btn);		
					}
					$(document).trigger('click',[e]);
					return false;					   
				});
			}
			if( opt.minable ) {
				$('.nex-panel-min-icon',header).click(function(e){													
					/*if( container.hasClass('nex-panel-hidden') ) { 
						self.minResetPanel();
					} else {
						self.minPanel();
					}*/
					self.minPanel();
					$(document).trigger('click',[e]);
					return false;
				});	
			}
			if( opt.collapseable ) {
				$('.nex-panel-collapse-icon',header).click(function(e){
					var btn = $(this);												  
					if( $(this).hasClass('nex-panel-collapse-icon-collapsed') ) {
						self.expandPanel(btn);
					} else {
						self.collapsePanel(btn);
					}	
					$(document).trigger('click',[e]);
					return false;				   
				});
			}
		},
		setHeader : function(){
			var self = this;
			var opt = self.C();	
			var container = opt.views['container'];
			
			if( opt.views['header'] ) return self;
			var icon = '';
			if( opt.icon || opt.iconCls ) {
				var _icon = '';
				if( opt.icon ) {
					_icon = 'background-image:url('+opt.icon+')';	
				}
				var ititle = '';
				if( opt.iconTitle ) {
					ititle = 'title="'+opt.iconTitle+'"';	
				}
				icon = '<'+opt.iconTag+' '+ititle+' class="nex-panel-icon '+opt.iconCls+'" style="'+_icon+'"></'+opt.iconTag+'>';	
			}
			
			var header = $('<div class="nex-panel-header '+opt.headerCls+'" id="'+opt.id+'_header" style=""><div class="nex-panel-tools"></div><div class="nex-panel-header-title">'+icon+'<span class="nex-panel-title-text"></span></div></div>');
			opt.views['header'] = header;
			container.prepend(header);
			if( !opt.headerSelectionable ) {
				header.disableSelection();
			}
			self.addComponent( $('.nex-panel-title-text',header),opt.title );
			var icons = [];
			if( opt.closeable ) {
				icons.push('close');
			}
			if( opt.maxable ) {
				icons.push('max');
			}
			if( opt.minable ) {
				icons.push('min');
			}
			if( opt.collapseable ) {
				icons.push('collapse');
			}
			icons.reverse();
			var tools = $('>.nex-panel-tools',header);
			if( opt.toolsItems.length ) {
				self.addComponent( tools,opt.toolsItems );
			}
			for( var i=0;i<opt.toolsIcons.length;i++ ) {
				var __d = {
					icon : '',
					text : '',
					callBack : null
				};
				var iconData = 	opt.toolsIcons[i];
				iconData = $.extend( __d,iconData );
				
				if( !$._isPlainObject( iconData ) ) {
					continue;	
				}
				var _icon = $('<a class="nex-panel-icon '+iconData.icon+'" hideFocus=true href="javascript:void(0)">'+iconData.text+'</a>');
				tools.append( _icon );
				(function(cdata){
					_icon.click(function(e){
						if( $.isFunction( cdata.callBack ) ) {
							var r = cdata.callBack.call( self,_icon,e );
							if( r === false ) return r;	
						}					 
					});	
				})(iconData);
			}
			for( var i=0;i<icons.length;i++ ) {
				tools.append( $('<a class="nex-panel-icon nex-panel-'+icons[i]+'-icon" hideFocus=true href="javascript:void(0)"></a>') );	
			}
			
			self.bindHeaderEvent();
			
			self.fireEvent("onHeaderCreate",[header],opt);
			
			if( opt.hideHeader ) {
				self.setWH();
			}
			
			return self;
		},
		setHeaderItems : function(){
			var self = this,undef;
			var opt = self.C();	
			var container = opt.views['container'];	
			
			var headerItems = opt.headerItems;
			if( $.isFunction( headerItems ) ) {
				headerItems = headerItems.apply( self,arguments );
				if( headerItems === undef ) {
					headerItems = null;	
				}	
			}
			
			if( headerItems === null || headerItems === '' ) return self;
			
			var headerItem = $('<div class="nex-panel-header-items '+opt.headerItemsCls+'" id="'+opt.id+'_header_items" style=""></div>');
			container.append(headerItem);
			opt.views['headerItem'] = headerItem;
			
			self.addComponent( headerItem,headerItems );
			return self;
		},
		bindBodyEvents : function(){
			var self = this;
			var opt = self.configs;	
			var bd = opt.views['body'];
			var callBack = function(type,e){
				var r = self.fireEvent(type,[ this,e,opt ]);
				if( r === false ) {
					e.stopPropagation();
					e.preventDefault();
				}
			};
			bd.unbind('.panel');
			var events = {
				'scroll.panel' : function(e){
					callBack.call(this,'onScroll',e);
					var $this = $(this);
					if( $this.scrollTop()<=0 ) {
						self.fireEvent('onScrollTopStart',[ this,e,opt ]);		
					} else if( $this.scrollLeft()<=0 ) {
						self.fireEvent('onScrollLeftStart',[ this,e,opt ])
					}
					if( self.isScrollEnd( this,'top' ) ) {
						self.fireEvent('onScrollTopEnd',[ this,e,opt ]);	
					}
					if( self.isScrollEnd( this,'left' ) ) {
						self.fireEvent('onScrollLeftEnd',[ this,e,opt ]);	
					}
				}
			};
			bd.bind(events);
		},
		setBody : function(){
			var self = this;
			var opt = self.configs;	
			var container = opt.views['container'];
			var bd = $( '<div class="nex-panel-body '+opt.bodyCls+'" id="'+opt.id+'_body" style=""></div>' );
			opt.views['body'] = bd;
			container.append(bd);
			//bd.css('padding',opt.padding);
			bd.css(opt.bodyStyle);
			self.bindBodyEvents();	 
			self.fireEvent("onBodyCreate",[bd],opt);
			return self;
		},
		setFooter : function(){
			var self = this,undef;
			var opt = self.C();	
			var container = opt.views['container'];
			
			var footerItems = opt.footerItems;
			if( $.isFunction( footerItems ) ) {
				footerItems = footerItems.apply( self,arguments );
				if( footerItems === undef ) {
					footerItems = null;	
				}	
			}
			
			if( footerItems === null || footerItems === '' ) return self;
			
			var footer = $('<div class="nex-panel-footer '+opt.footerItemsCls+'" id="'+opt.id+'_footer" style=""></div>');
			opt.views['footer'] = footer;
			
			container.append(footer);	
			
			self.addComponent( footer,footerItems );
			
			self.fireEvent("onFooterCreate",[footer],opt);
			
			return self;
		},
		createModal : function (){
			var self = this;
			var opt = self.C();	
			
			if( !opt.modal ) return self;
			
			var container = opt.views['container'];
			var modal = $('<div class="nex-panel-modal '+opt.modalCls+'" id="'+opt.id+'_modal" style=""></div>');	
			opt.views['modal'] = modal;
			
			modal.css( 'zIndex',opt.zIndex-1 );

			modal.bind({
				'click' : function(e){
					self.fireEvent('onModalClick',[modal,e,opt]);
					$(document).trigger('click',[e]);
					return false;
				},
				'dblclick' : function(e){
					self.fireEvent('onModalDblClick',[modal,e,opt]);
					$(document).trigger('dblclick',[e]);
					return false;
				},
				'mousedown' : function(e){
					self.fireEvent('onModalMouseDown',[modal,e,opt]);
					$(document).trigger('mousedown',[e]);
					return false;	
				},
				'mouseup' : function(e){
					self.fireEvent('onModalMouseUp',[modal,e,opt]);
					$(document).trigger('mouseup',[e]);
					return false;	
				},
				'keydown' : function(e){
					self.fireEvent('onModalKeyDown',[modal,e,opt]);
					$(document).trigger('keydown',[e]);
					return false;		
				},
				'keyup' : function(e){
					self.fireEvent('onModalKeyUp',[modal,e,opt]);
					$(document).trigger('keyup',[e]);
					return false;		
				},
				'mousewheel' : function(e){
					self.fireEvent('onModalMouseWheel',[modal,e,opt]);	
				},
				'mouseover' : function(e){
					self.fireEvent('onModalMouseOver',[modal,e,opt]);
					$(document).trigger('mouseover',[e]);
					return false;		
				},
				'mouseout' : function(e){
					self.fireEvent('onModalMouseOut',[modal,e,opt]);
					$(document).trigger('mouseout',[e]);
					return false;		
				}
			});
			
			container.after(modal);	
			self.fireEvent("onModelCreate",[modal],opt);
			return self;
		},
		showModal : function (){
			var self = this;
			var opt = self.C();	
			//如果开启modal 应该是不能出现滚动条的
			//var render = $(opt.renderTo);
			//render.addClass('nex-panel-noscroll');
			
			opt.views['modal'].show();
		},
		hideModal : function (){
			var self = this;
			var opt = self.C();	
			
			//var render = $(opt.renderTo);
			//render.removeClass('nex-panel-noscroll');
			
			opt.views['modal'].hide();
		},
		getPosition : function(){
			var self = this;
			var opt = self.C();	
			var container = opt.views['container'];
			if( $.isWindow(opt.renderTo) ) {
				return 	container.position();
			} else {
				var sLeft = $(opt.renderTo).scrollLeft();
				var sTop = $(opt.renderTo).scrollTop();	
				var pos = container.position();
				return {
						left　: sLeft + pos.left,
						top　: sTop + pos.top
					}
			}
		},
		getHeader : function(){
			var self = this,
				opt = self.configs;
			return opt.views['header'];	
		},
		getHeaderItem : function(){
			var self = this,
				opt = self.configs;
			return opt.views['headerItem'];	
		},
		getBody : function(){
			var self = this,
				opt = self.configs;
			return opt.views['body'];
		},
		getFooter : function(){
			var self = this,
				opt = self.configs;
			return opt.views['footer'];	
		},
		/*
		onViewSizeChange : function(func){
			var self = this;
			var opt = self.C();	
			var container = opt.views['container'];	
			self.resetViewSize();
			self.resetModelSize();		
			Nex.html.fn.onViewSizeChange.apply(self,arguments);
		},
		*/
		/*onSizeChange : function(w,h){
			var self = this,
				opt=this.configs,
				undef;
			if( opt.autoSize ){
				self.autoSize();	
			} else {
				self._onSizeChange(w,h);	
			}
		},*/
		resetModelSize : function(){
			var self = this,
				opt=this.configs,
				undef;
			
			if( !opt.modal ) return self;
			if( !( 'modal' in opt.views ) ) return self;

			var render = $(opt.renderTo);
			
			var  isWin = $.isWindow( opt.renderTo );
			
			var modal = opt.views['modal'];
			
			var w = isWin ? 0 : parseInt(render.css('paddingLeft')) + parseInt(render.css('paddingRight'));
			var h = isWin ? 0 : parseInt(render.css('paddingTop')) + parseInt(render.css('paddingBottom'));
			
			var mw = render._width() + w,
				mh = render._height() + h;
			
			if( isWin ) {
				var winWidth = $(window).width();
				var winHeight = $(window).height();
				w = parseInt($(document.body).css('paddingLeft')) + parseInt($(document.body).css('paddingRight'));
				h = parseInt($(document.body).css('paddingTop')) + parseInt($(document.body).css('paddingBottom'));
				mw = Math.max( winWidth,$(document.body).width() + w );
				mh = Math.max( winHeight,$(document.body).height() + h );
			}
			
			modal._outerWidth( mw );
			modal._outerHeight( mh );
			
			self.fireEvent('onModelSizeChange',[ opt ]);
		},
		_setViewSize : function(){
			var self = this,
				opt=this.configs,
				undef;
			var container = self.getContainer();	
			var bd = self.getBody();
			
			if( opt.realWidth !== 'auto' ) {
				bd._outerWidth( container._width() );
			}
			if( opt.realHeight !== 'auto' ) {
				var h = 0;
				$.each( opt.views,function(key,item){
					if( key === 'body' || key === 'container' || key === 'modal' ) return;
					h += item._outerHeight();
				} );
				bd._outerHeight( container._height()-h );
			}
			self.fireEvent("onSetViewSize",[opt]);
			
			self.resetModelSize();
			//self.fireEvent('onViewSizeChange',[ opt ]);
		},
		initWH : function(w,h){
			var self = this,
				opt = self.C();
			self.setWH(w,h);
		},
		resize : function(m){
			var self = this,
				opt = self.C(),
				undef;
			
			opt._rt = opt._rt || 0;
			
			if( opt._rt ) {
				clearTimeout( opt._rt );	
			}
			
			opt._rt = setTimeout(function(){
				self._setBodyOverflowHidden();	
				self.setWH();	
				if( opt.refreshPosOnResize ) {
					self.resetModelSize();
				}
				if( opt.refreshPosOnResize ) {
					self._show();
				}	
				
			},0);
			return self;
		},
		/*
		*清空panel内容
		*/
		empytContent : function(){
			return this.empty();
		},
		_addContent : function(items,after){
			return this._insert( items,after );
		},
		/*
		*向panel追加内容
		*/
		addContent : function(items,after){
			return this.insert( items,after );
		},
		initPanel : function(){
			var self = this,
				opt=this.configs;
				
			Nex.Html.fn.initComponent.apply(self,arguments);

			var container = opt.views['container'];
			container.hide();
			if( opt.autoShow ) {
				self._show();	
			}
			//self.fireEvent('onCreate',[ opt ]);
			
			return self;
		},
		hide :　function(){
			var self = this;
			var opt = self.configs;	
			self.closePanel();
		},
		//默认显示函数
		show : function(){
			var self = this,
				opt=this.configs;	
			self.openPanel();	
		}
	});
})(jQuery);
/*
jquery.nexWindow.js
http://www.extgrid.com/window
author:nobo
qq:505931977
QQ交流群:13197510
email:zere.nobo@gmail.com or QQ邮箱

*/

;(function($){
	"use strict";
	var win = Nex.define('Nex.Window','Nex.Html').setXType('window');
	win.extend({
		version : '1.0',
		_Tpl : {				
		}
	});
	win.setOptions(function(opt,t){
		return {
			prefix : 'nexwindow-',
			autoDestroy : true,
			autoResize : true,
			_hasBodyView : true,
			_checkScrollBar : false,
			position : 'absolute',
			border : true,
			borderCls : [opt.borderCls,'nex-window-border'].join(' '),
			containerCls : [opt.containerCls,'nex-window'].join(' '),
			autoScrollCls : [opt.autoScrollCls,'nex-window-auto-scroll'].join(' '),
			autoScroll : false,
			autoShow : true,
			closeToRremove : true,//关闭窗口后 销毁对象
			draggable : true,
			resizeable : false,
			modal : false,
			focusToTop : true,//点击窗口后最顶层显示
			zIndex : (function(){
				var zIndex = Nex['zIndex']+2;
				Nex['zIndex'] = zIndex;
				return zIndex;
			})(),
			refreshPosOnResize : true,//通过调用resize时会重置窗口显示位置
			point : null,//point : {left:0,top:0},
			showAt : {},
			title : '',
			toolsItems : [],//更自由的自定义组件显示
			toolsIcons : [],//自定义图标显示 {icon:'abc',text:'',callBack:func}
			collapseable : false,
			collapsed :　false,
			minable : false,
			maxable : false,
			hideHeader : false,
			headerSelectionable : true,
			closeable : false,
			headerItemsCls : '',
			footerItemsCls : '',
			headerItems : null,//string xobject [ xobject ] jquery...
			footerItems : null,
			html : '',
			items : [],
			padding : 0,
			style : '',
			renderTo : window,
			url : '',//支持远程创建 返回数据格式  json
			cache : true,
			dataType : 'json',
			queryParams : {},
			method : 'get',
			parames : {},
			views : {},
			cls : '',
			headerCls : '',
			modalCls : '',
			bodyCls : '',
			bodyStyle : {},
			icon : '',
			iconCls : '',
			iconTitle : '',
			iconTag : 'span',
			autoSize : false,
			width : 'auto',
			height : 'auto',
			animShow : false,//是否动画显示
			animShowType : 'showInAt',
			animHideType : 'showOutAt',
			denyEvents : [ 'scroll' ],
			animateShow : {
				xtype : 'showInAt'	
			},//动画显示函数
			animateHide : {
				xtype : 'showOutAt'		
			},//动画关闭函数
			maxWidth : function(){
				var self = this;
				var opt = self.configs;
				var renderTo = this.C('renderTo');	
				if( $.isWindow(opt.renderTo) ) {
					return $(renderTo).width();
				} else {
					return 0;		
				}
			},
			maxHeight : function(){
				var self = this;
				var opt = self.configs;
				var renderTo = this.C('renderTo');
				if( $.isWindow(opt.renderTo) ) {
					return $(renderTo).height();
				} else {
					return 0;	
				}
			},
			minHeight : 100,
			minWidth : 200,
			events : {
				onStart : $.noop,
				onCreate : $.noop,
				onDestroy : $.noop
			}
		};	
	});
	win.fn.extend({
		_init : function(opt) {
			var self = this;
			self.setContainer();//setContainer必须
			if( !opt.hideHeader ) {	
				self.setHeader();
			}
			self.setHeaderItems()
				.setBody()
				.setFooter()
				.createModal()
				.initWindow();		
		},
		_sysEvents : function(){
			var self = this;
			var opt = self.configs;
			
			Nex.Html.fn._sysEvents.apply(self,arguments);
			
			self.bind("onHeaderCreate",self._drag,self);
			self.bind("onCreate",self._resizeable,self);
			self.bind("onCreate",self._setTopzindex,self);
			//self.bind("onHeaderCreate",self.displayHeader,self);
			return self;
		},
		displayHeader : function(m){
			var self = this;
			var opt = self.configs;
			var header = opt.views['header'];
			if( !header ) { 
				return false;
			}
			if( m ) {
				header.show();	
			} else {
				header.hide();	
			}
		},
		showHeader : function(){
			return this.displayHeader( true );	
		},
		hideHeader : function(){
			return this.displayHeader( false );	
		},
		setzIndex : function(){
			var self = this;
			var opt = self.configs;		
			var container = opt.views['container'];
			var zIndex = Nex['zIndex']+2;
			Nex['zIndex'] = zIndex;
			opt.zIndex = zIndex; 
			
			container.css('z-index',opt.zIndex);
			var modal = false;	
			if( opt.modal && ('modal' in opt.views) ) {
				modal = opt.views['modal'];
				modal.css('z-index',opt.zIndex-1);
			}		
		},
		_setTopzindex : function(){
			var self = this;
			var opt = self.configs;	
			
			if( !opt.focusToTop ) return;
			
			var container = opt.views['container'];
			
			container.bind('mousedown.zindex',function(e){
				self.setzIndex();
			});
		},
		_drag : function(){
			var self = this;
			var opt = self.configs;
			if( !opt.draggable || !Nex.draggable ) return;
			var header = opt.views['header'];
			Nex.Create('draggable',{
				helper : header,
				target:opt.views['container'],
				onBeforeDrag : function(e,_opt){
					
					if( !opt.draggable ) return false;
					
					var r = self.fireEvent("onWindowBeforeDrag",[e,_opt]);	
					if( r === false) return r;
				},
				onStartDrag : function(e,_opt){
					var r = self.fireEvent("onWindowStartDrag",[e,_opt]);	
					if( r === false) return r;
				},
				onDrag : function(e,_opt){
					var r = self.fireEvent("onWindowDrag",[e,_opt]);	
					if( r === false) return r;
				},
				onStopDrag : function(e,_opt){
					var r = self.fireEvent("onWindowStopDrag",[e,_opt]);	
					if( r === false) return r;
				}
			});
			//header.draggable({target:opt.views['container']});
		},
		_resizeable : function(){
			var self = this;
			var opt = self.configs;
			if( !opt.resizeable || !Nex.resizable ) return;
			var container = opt.views['container'];
			
			Nex.Create('resizable',{
				target : container,
				minWidth: opt.minWidth,	
				minHeight: opt.minHeight,
				//maxWidth: opt.maxWidth,	
				//maxHeight: opt.maxHeight,
				onBeforeResize : function(e,_opt){
					
					if( opt.autoSize || !opt.resizeable || opt.collapsed ) return false;
					
					var r = self.fireEvent("onWindowBeforeResize",[e,_opt]);	
					if( r === false) return r;	
				},
				onStartResize : function(e,_opt){
					var r = self.fireEvent("onWindowStartResize",[e,_opt]);	
					if( r === false) return r;	
				},
				onResize : function(w,h,e,_opt){
					var r = self.fireEvent("onWindowResize",[w,h,e,_opt]);	
					if( r === false) return r;	
					self.setWH( _opt.width,_opt.height );	
				},
				onStopResize : function(w,h,e,_opt){
					var r = self.fireEvent("onWindowStopResize",[w,h,e,_opt]);	
					if( r === false) return r;	
				}
			});
			/*container.resizable({
				minWidth: opt.minWidth,
				minHeight: opt.minHeight,
				onResize:function(w,h){
				self.setWH( w,h );		
			}});*/
		},
		setContainer : function(){
			var self = this;
			var opt = self.C();
			var render = $( $.isWindow(opt.renderTo) ? document.body : opt.renderTo );
			if( render.css('position') === 'static' ) {
				render.css('position','relative');	
			}
			//防止重复创建相同ID的窗口
			$("#"+opt.id).remove();
			$("#"+opt.id+'_modal').remove();
			
			self.lockEvent('onContainerCreate');
			
			opt.containerCls += ' nex-window-'+opt.position;
			
			Nex.Html.fn.setContainer.call(self);
			
			self.unLockEvent('onContainerCreate');
			/*var container = $('<div class="nex-window '+( opt.autoScroll ? 'nex-window-auto-scroll' : '' )+' nex-window-'+opt.position+' '+opt.cls+'" id="'+opt.id+'"></div>');
			opt.views['container'] = container;*/
			var container = opt.views['container'];
			
			container._removeStyle('padding');
			
			container.css('z-index',opt.zIndex);
			render.append(container);
			self.fireEvent("onContainerCreate",[container,opt]);
			return self;
		},
		_hide : function( func ){
			var self = this,undef;
			var opt = self.configs;	
			var container = opt.views['container'];
			var modal = false;	
			if( opt.modal && ('modal' in opt.views) ) {
				modal = opt.views['modal'];
			}	
			opt._isShow = false;
			if( modal ) {
				modal.hide();
			}
			if( opt.animShowType && opt.animShow ) {
				var d = $.extend( {},opt.showAt,{ 
					xtype : opt.animHideType || 'showAt',
					source:container,
					onShow : function(){
						if( $.isFunction(func) ) {
							func.call( self );	
						}	
					}
				 } );
				 
				Nex.Create(d).show();
			} else {
				container.hide();
				func.call( self );		
			}
		},
		_show : function(func){
			var self = this,undef;
			var opt = self.configs;		
			var container = opt.views['container'];
			var modal = false;	
			if( opt.modal && ('modal' in opt.views) ) {
				modal = opt.views['modal'];
			}
			
			if( opt._isShow ) {
				return;	
			}
			opt._isShow = true;
			//animateShow
			self.setzIndex();//设置z-index 重要...
			
			if( opt.showAt.at ) {
				opt.showAt.el = opt.showAt.at;
			}
			
			opt.showAt.el = opt.showAt.el === undef ? (opt.point === null ? opt.renderTo : opt.point) : opt.showAt.el;
			
			//container.show()
			//		 .showAt(opt.showAt);
			
			if( modal ) {
				modal.show();
			}
			var animShowType = 'showAt';
			if( opt.animShow && opt.animShowType ) {
				animShowType = opt.animShowType
			}
			//animShowType
			var d = $.extend( {},opt.showAt,{ 
				xtype : animShowType,
				source:container,
				onShow : function(){
					if( $.isFunction(func) ) {
						func.call( self );	
					}	
				}
			 } );
			Nex.Create(d).show();	
			
		},
		resetPosition : function(){
			var self = this,undef;
			var opt = self.configs;		
			var container = opt.views['container'];
			if( opt.showAt.at ) {
				opt.showAt.el = opt.showAt.at;
			}
			
			opt.showAt.el = opt.showAt.el === undef ? (opt.point === null ? opt.renderTo : opt.point) : opt.showAt.el;
			var d = $.extend( {},opt.showAt,opt.animateShow,{ 
				source:container
			 } );
			
			if( !opt.animShow ) {
				d.xtype = 'showAt';	
			}
			
			var anim = Nex.Create(d),
				pos = {};
			if( anim ) {
				pos = anim.getShowPos();		
			}
			container.stop(true,true).animate( pos,200,function(){
				self.fireEvent("onResetPosition",[container,opt]);													
			} );
		},
		maxWindow : function(btn){
			var self = this,undef;
			var opt = self.configs;		
			var container = opt.views['container'];
			var header = opt.views['header'];
			
			var r = self.fireEvent("onBeforeMaxWindow",[container,opt]);
			if( r === false ) return r;
			
			var btn = btn === undef ? $('.nex-window-max-icon',header) : btn;
			
			var render = $( $.isWindow(opt.renderTo) ? document.body : opt.renderTo );
			render.addClass('nex-window-noscroll');
			
			btn.addClass('nex-window-max-icon-reset');
			
			opt.__mOffset = self.getPosition();
			container.css({
							left : 0,
							top : 0
						});
			opt.__mWidth = opt.width;
			opt.__mHeight = opt.height;
			opt.__mdraggable = opt.draggable;
			opt.__mresizeable = opt.resizeable;
			opt.__mautosize = opt.autoSize;
			opt.autoSize = opt.resizeable = opt.draggable = false;
			
			self.initWH('100%','100%');	
			
			if( opt.collapsed ) {
				container.height( header._height() );	
				if( opt._mAutoResize ) {	
					Nex.Manager._resize(opt.id,true);
				}
			}
			
			self.fireEvent("onMaxWindow",[container,opt]);
			
		},
		maxResetWindow : function(btn){
			var self = this,undef;
			var opt = self.configs;		
			var container = opt.views['container'];
			var header = opt.views['header'];
			
			var r = self.fireEvent("onBeforeMaxResetWindow",[container,opt]);
			if( r === false ) return r;
			
			var btn = btn === undef ? $('.nex-window-max-icon',header) : btn;
			
			var render = $( $.isWindow(opt.renderTo) ? document.body : opt.renderTo );
			render.removeClass('nex-window-noscroll');
			
			btn.removeClass('nex-window-max-icon-reset');
			
			opt.width = opt.__mWidth || opt.width;
			opt.height = opt.__mHeight || opt.height;
			
			opt.draggable = self._undef(opt.__mdraggable,opt.draggable);
			opt.resizeable = self._undef(opt.__mresizeable,opt.resizeable);
			opt.autoSize = self._undef(opt.__mautosize,opt.autoSize);
			
			self.initWH(opt.__mWidth,opt.__mHeight);	
			
			if( opt.__mOffset ) {
				container.css(opt.__mOffset);
			}
			
			if( opt.collapsed ) {
				container.height( header._height() );		
				if( opt._mAutoResize ) {	
					Nex.Manager._resize(opt.id,true);
				}
			}
			
			self.fireEvent("onMaxResetWindow",[container,opt]);
			
		},
		minWindow : function(e1,e2){
			var self = this,undef;
			var opt = self.configs;		
			var container = opt.views['container'];
			var header = opt.views['header'];
			
			var e1 = e1 === undef ? 'onBeforeMinWindow' : e1;
			var e2 = e2 === undef ? 'onMinWindow' : e2;
			
			var r = self.fireEvent(e1,[container,opt]);
			if( r === false ) return r;
			
			var modal = false;	
			if( opt.modal && ('modal' in opt.views) ) {
				modal = opt.views['modal'];
			}	
			container.addClass('nex-window-hidden');
			if( modal ) {
				modal.addClass('nex-window-hidden');
			}
			
			opt._mAutoResize = opt.autoResize;
			self.disabledAutoResize();
			
			self._hide(function(){
				self.fireEvent(e2,[container,opt]);					
			});
		},
		minResetWindow : function(e1,e2){
			var self = this,undef;
			var opt = self.configs;		
			var container = opt.views['container'];
			var header = opt.views['header'];
			opt._mAutoResize = opt._mAutoResize === undef ? opt.autoResize : opt._mAutoResize;
			
			var e1 = e1 === undef ? 'onBeforeMinResetWindow' : e1;
			var e2 = e2 === undef ? 'onMinResetWindow' : e2;
			
			var r = self.fireEvent(e1,[container,opt]);
			if( r === false ) return r;
			
			var modal = false;	
			if( opt.modal && ('modal' in opt.views) ) {
				modal = opt.views['modal'];
			}	
			container.removeClass('nex-window-hidden');
			if( modal ) {
				modal.removeClass('nex-window-hidden');
			}
			//恢复	
			var func = opt._mAutoResize ? 'enableAutoResize' : 'disabledAutoResize';
			self[func]();
			
			self._show(function(){
				self.resize();
				self.fireEvent(e2,[container,opt]);		
				self.fireEvent('onWindowShow',[opt]);					
			});
			
		},
		closeWindow : function(){
			var self = this,undef;
			var opt = self.configs;		
			var container = opt.views['container'];
			var header = opt.views['header'];
			if( !opt.closeToRremove ) {
				self.minWindow('onBeforeCloseWindow','onCloseWindow');	
			} else {
				var r = self.fireEvent('onBeforeCloseWindow',[container,opt]);
				if( r === false ) return r;
				opt._closed = true;
				self._hide(function(){
					opt.views['container'] = container.detach();
					var modal = false;	
					if( opt.modal && ('modal' in opt.views) ) {
						opt.views['modal'] = opt.views['modal'].detach();
					}	
					self.fireEvent('onCloseWindow',[container,opt]);
					self.fireEvent('onWindowHide',[opt]);
				});
			}
		},
		openWindow : function(){
			var self = this,undef;
			var opt = self.configs;		
			var container = opt.views['container'];
			var header = opt.views['header'];
			if( !opt.closeToRremove ) {
				self.minResetWindow('onBeforeOpenWindow','onOpenWindow');	
			} else {
				opt._closed = opt._closed === undef ? false : opt._closed;
				if( opt._closed ) {
					var r = self.fireEvent('onBeforeOpenWindow',[container,opt]);
					if( r === false ) return r;
					var render = $( $.isWindow(opt.renderTo) ? document.body : opt.renderTo );
					container.appendTo( render );
					var modal = false;	
					if( opt.modal && ('modal' in opt.views) ) {
						modal = opt.views['modal'];
						modal.appendTo( render );
					}	
				}
				self._show(function(){
					self.resize();	
					self.fireEvent('onOpenWindow',[container,opt]);
				});
			}
		},
		collapseWindow : function(btn){
			var self = this,undef;
			var opt = self.configs;		
			var container = opt.views['container'];
			var header = opt.views['header'];
			
			var r = self.fireEvent("onBeforeCollapseWindow",[container,opt]);
			if( r === false ) return r;
			
			var btn = btn === undef ? $('.nex-window-collapse-icon',header) : btn;
			btn.addClass('nex-window-collapse-icon-collapsed');	
			
			opt.collapsed = true;
			opt._mAutoResize = opt.autoResize;
			self.disabledAutoResize();
			container.animate({
				height : header._height()  
			},300);	
			self.fireEvent("onCollapseWindow",[container,opt]);
		},
		expandWindow : function(btn){
			var self = this,undef;
			var opt = self.configs;		
			var container = opt.views['container'];
			var header = opt.views['header'];
			
			var r = self.fireEvent("onBeforeExpandWindow",[container,opt]);
			if( r === false ) return r;
			
			var btn = btn === undef ? $('.nex-window-collapse-icon',header) : btn;
			btn.removeClass('nex-window-collapse-icon-collapsed');	
			
			opt.collapsed = false;
			var func = opt._mAutoResize ? 'enableAutoResize' : 'disabledAutoResize';
			self[func]();
			container.animate({
				height : opt._height - ( container._outerHeight() - container._height() )
			},300);	
			self.fireEvent("onExpandWindow",[container,opt]);
		},
		bindHeaderEvent : function(){
			var self = this;
			var opt = self.configs;	
			var container = opt.views['container'];
			var header = opt.views['header'];
			
			if( opt.closeable ) {
				$('a.nex-window-close-icon',header).click(function(e){
					self.closeWindow();
					$(document).trigger('click',[e]);
					return false;
				});
			}
			if( opt.maxable ) {
				$('.nex-window-max-icon',header).click(function(e){
					var btn = $(this);
					if( btn.hasClass('nex-window-max-icon-reset') ) {
						self.maxResetWindow(btn);		
					} else {
						self.maxWindow(btn);		
					}	
					$(document).trigger('click',[e]);
					return false;				   
				});
			}
			if( opt.minable ) {
				$('.nex-window-min-icon',header).click(function(e){													
					/*if( container.hasClass('nex-window-hidden') ) { 
						self.minResetWindow();
					} else {
						self.minWindow();
					}*/
					self.minWindow();
					$(document).trigger('click',[e]);
					return false;
				});	
			}
			if( opt.collapseable ) {
				$('.nex-window-collapse-icon',header).click(function(e){
					var btn = $(this);												  
					if( $(this).hasClass('nex-window-collapse-icon-collapsed') ) {
						self.expandWindow(btn);
					} else {
						self.collapseWindow(btn);
					}	
					$(document).trigger('click',[e]);
					return false;				   
				});
			}
		},
		setHeader : function(){
			var self = this;
			var opt = self.C();	
			var container = opt.views['container'];
			
			if( opt.views['header'] ) return self;
			var icon = '';
			if( opt.icon || opt.iconCls ) {
				var _icon = '';
				if( opt.icon ) {
					_icon = 'background-image:url('+opt.icon+')';	
				}
				var ititle = '';
				if( opt.iconTitle ) {
					ititle = 'title="'+opt.iconTitle+'"';	
				}
				icon = '<'+opt.iconTag+' '+ititle+' class="nex-window-icon '+opt.iconCls+'" style="'+_icon+'"></'+opt.iconTag+'>';	
			}
			//var header = $('<div class="nex-window-header '+opt.headerCls+'" id="'+opt.id+'_header" style=""><table class="nex-window-header-table" cellpadding="0" cellspacing="0" border="0"><tr><td>'+icon+'</td><td><span class="nex-window-title-text"></span></td></tr></table><div class="nex-window-tools"></div></div>');
			var header = $('<div class="nex-window-header '+opt.headerCls+'" id="'+opt.id+'_header" style=""><div class="nex-window-tools"></div><div class="nex-window-header-title">'+icon+'<span class="nex-window-title-text"></span></div></div>');
			
			opt.views['header'] = header;
			container.prepend(header);
			if( !opt.headerSelectionable ) {
				header.disableSelection();
			}
			self.addComponent( $('.nex-window-title-text',header),opt.title );
			var icons = [];
			if( opt.closeable ) {
				icons.push('close');
			}
			if( opt.maxable ) {
				icons.push('max');
			}
			if( opt.minable ) {
				icons.push('min');
			}
			if( opt.collapseable ) {
				icons.push('collapse');
			}
			icons.reverse();
			var tools = $('>.nex-window-tools',header);
			if( opt.toolsItems.length ) {
				self.addComponent( tools,opt.toolsItems );
			}
			for( var i=0;i<opt.toolsIcons.length;i++ ) {
				var __d = {
					icon : '',
					text : ''
				};
				var iconData = 	opt.toolsIcons[i];
				iconData = $.extend( __d,iconData );
				
				if( !$._isPlainObject( iconData ) ) {
					continue;	
				}
				var _icon = $('<a class="nex-window-icon '+iconData.icon+'" hideFocus=true href="javascript:void(0)">'+iconData.text+'</a>');
				tools.append( _icon );
				(function(cdata){
					_icon.click(function(e){
						if( $.isFunction( cdata.callBack ) ) {
							cdata.callBack.call( self,_icon,e );	
						}					 
					});	
				})(iconData);
			}
			for( var i=0;i<icons.length;i++ ) {
				tools.append( $('<a class="nex-window-icon nex-window-'+icons[i]+'-icon" hideFocus=true href="javascript:void(0)"></a>') );	
			}
			
			self.bindHeaderEvent();
			
			self.fireEvent("onHeaderCreate",[header],opt);
			
			if( opt.hideHeader ) {
				self.setWH();
			}
			
			return self;
		},
		setHeaderItems : function(){
			var self = this,undef;
			var opt = self.C();	
			var container = opt.views['container'];	
			
			var headerItems = opt.headerItems;
			if( $.isFunction( headerItems ) ) {
				headerItems = headerItems.apply( self,arguments );
				if( headerItems === undef ) {
					headerItems = null;	
				}	
			}
			
			if( headerItems === null || headerItems === '' ) return self;
			
			var headerItem = $('<div class="nex-window-header-items '+opt.headerItemsCls+'" id="'+opt.id+'_header_items" style=""></div>');
			container.append(headerItem);
			opt.views['headerItem'] = headerItem;
			
			self.addComponent( headerItem,headerItems );
			return self;
		},
		bindBodyEvents : function(){
			var self = this;
			var opt = self.configs;	
			var bd = opt.views['body'];
			var callBack = function(type,e){
				var r = self.fireEvent(type,[ this,e,opt ]);
				if( r === false ) {
					e.stopPropagation();
					e.preventDefault();
				}
			};
			bd.unbind('.window');
			var events = {
				'scroll.window' : function(e){
					callBack.call(this,'onScroll',e);
					var $this = $(this);
					if( $this.scrollTop()<=0 ) {
						self.fireEvent('onScrollTopStart',[ this,e,opt ]);		
					} else if( $this.scrollLeft()<=0 ) {
						self.fireEvent('onScrollLeftStart',[ this,e,opt ])
					}
					if( self.isScrollEnd( this,'top' ) ) {
						self.fireEvent('onScrollTopEnd',[ this,e,opt ]);	
					}
					if( self.isScrollEnd( this,'left' ) ) {
						self.fireEvent('onScrollLeftEnd',[ this,e,opt ]);	
					}
				}
			};
			bd.bind(events);
		},
		setBody : function(){
			var self = this;
			var opt = self.configs;	
			var container = opt.views['container'];
			var bd = $( '<div class="nex-window-body '+opt.bodyCls+'" id="'+opt.id+'_body" class="" style=""></div>' );
			opt.views['body'] = bd;
			container.append(bd);
			bd.css('padding',opt.padding);
			bd.css(opt.bodyStyle);
			self.bindBodyEvents();	 
			self.fireEvent("onBodyCreate",[bd],opt);
			return self;
		},
		setFooter : function(){
			var self = this,undef;
			var opt = self.C();	
			var container = opt.views['container'];
			
			var footerItems = opt.footerItems;
			if( $.isFunction( footerItems ) ) {
				footerItems = footerItems.apply( self,arguments );
				if( footerItems === undef ) {
					footerItems = null;	
				}	
			}
			
			if( footerItems === null || footerItems === '' ) return self;
			
			var footer = $('<div class="nex-window-footer '+opt.footerItemsCls+'" id="'+opt.id+'_footer" style=""></div>');
			opt.views['footer'] = footer;
			
			container.append(footer);	
			
			self.addComponent( footer,footerItems );
			
			self.fireEvent("onFooterCreate",[footer],opt);
			
			return self;
		},
		createModal : function (){
			var self = this;
			var opt = self.C();	
			
			if( !opt.modal ) return self;
			
			var container = opt.views['container'];
			var modal = $('<div class="nex-window-modal '+opt.modalCls+'" id="'+opt.id+'_modal" style=""></div>');	
			opt.views['modal'] = modal;
			
			modal.css( 'zIndex',opt.zIndex-1 );

			modal.bind({
				'click' : function(e){
					self.fireEvent('onModalClick',[modal,e,opt]);
					$(document).trigger('click',[e]);
					return false;
				},
				'dblclick' : function(e){
					self.fireEvent('onModalDblClick',[modal,e,opt]);
					$(document).trigger('dblclick',[e]);
					return false;
				},
				'mousedown' : function(e){
					self.fireEvent('onModalMouseDown',[modal,e,opt]);
					$(document).trigger('mousedown',[e]);
					return false;	
				},
				'mouseup' : function(e){
					self.fireEvent('onModalMouseUp',[modal,e,opt]);
					$(document).trigger('mouseup',[e]);
					return false;	
				},
				'keydown' : function(e){
					self.fireEvent('onModalKeyDown',[modal,e,opt]);
					$(document).trigger('keydown',[e]);
					return false;		
				},
				'keyup' : function(e){
					self.fireEvent('onModalKeyUp',[modal,e,opt]);
					$(document).trigger('keyup',[e]);
					return false;		
				},
				'mousewheel' : function(e){
					self.fireEvent('onModalMouseWheel',[modal,e,opt]);	
				},
				'mouseover' : function(e){
					self.fireEvent('onModalMouseOver',[modal,e,opt]);
					$(document).trigger('mouseover',[e]);
					return false;		
				},
				'mouseout' : function(e){
					self.fireEvent('onModalMouseOut',[modal,e,opt]);
					$(document).trigger('mouseout',[e]);
					return false;		
				}
			});
			
			container.after(modal);	
			self.fireEvent("onModelCreate",[modal],opt);
			return self;
		},
		showModal : function (){
			var self = this;
			var opt = self.C();	
			//如果开启modal 应该是不能出现滚动条的
			//var render = $(opt.renderTo);
			//render.addClass('nex-window-noscroll');
			
			opt.views['modal'].show();
		},
		hideModal : function (){
			var self = this;
			var opt = self.C();	
			
			//var render = $(opt.renderTo);
			//render.removeClass('nex-window-noscroll');
			
			opt.views['modal'].hide();
		},
		getPosition : function(){
			var self = this;
			var opt = self.C();	
			var container = opt.views['container'];
			if( $.isWindow(opt.renderTo) ) {
				return 	container.position();
			} else {
				var sLeft = $(opt.renderTo).scrollLeft();
				var sTop = $(opt.renderTo).scrollTop();	
				var pos = container.position();
				return {
						left　: sLeft + pos.left,
						top　: sTop + pos.top
					}
			}
		},
		getHeader : function(){
			var self = this,
				opt = self.configs;
			return opt.views['header'];	
		},
		getHeaderItem : function(){
			var self = this,
				opt = self.configs;
			return opt.views['headerItem'];	
		},
		getBody : function(){
			var self = this,
				opt = self.configs;
			return opt.views['body'];
		},
		getFooter : function(){
			var self = this,
				opt = self.configs;
			return opt.views['footer'];	
		},
		/*
		onViewSizeChange : function(func){
			var self = this;
			var opt = self.C();	
			var container = opt.views['container'];	
			self.resetViewSize();
			self.resetModelSize();		
			Nex.html.fn.onViewSizeChange.apply(self,arguments);
		},
		*/
		/*onSizeChange : function(w,h){
			var self = this,
				opt=this.configs,
				undef;
			if( opt.autoSize ){
				self.autoSize();	
			} else {
				self._onSizeChange(w,h);	
			}
		},*/
		resetModelSize : function(){
			var self = this,
				opt=this.configs,
				undef;
			
			if( !opt.modal ) return self;
			if( !( 'modal' in opt.views ) ) return self;

			var render = $(opt.renderTo);
			
			var  isWin = $.isWindow( opt.renderTo );
			
			var modal = opt.views['modal'];
			
			var w = isWin ? 0 : parseInt(render.css('paddingLeft')) + parseInt(render.css('paddingRight'));
			var h = isWin ? 0 : parseInt(render.css('paddingTop')) + parseInt(render.css('paddingBottom'));
			
			var mw = render._width() + w,
				mh = render._height() + h;
			
			if( isWin ) {
				var winWidth = $(window).width();
				var winHeight = $(window).height();
				w = parseInt($(document.body).css('paddingLeft')) + parseInt($(document.body).css('paddingRight'));
				h = parseInt($(document.body).css('paddingTop')) + parseInt($(document.body).css('paddingBottom'));
				mw = Math.max( winWidth,$(document.body).width() + w );
				mh = Math.max( winHeight,$(document.body).height() + h );
			}
			
			modal._outerWidth( mw );
			modal._outerHeight( mh );
			
			self.fireEvent('onModelSizeChange',[ opt ]);
		},
		_setViewSize : function(){
			var self = this,
				opt=this.configs,
				undef;
			var container = opt.views['container'];	
			var bd = self.getBody();
			
			if( opt.realWidth !== 'auto' ) {
				bd._outerWidth( container._width() );
			}
			if( opt.realHeight !== 'auto' ) {
				var h = 0;
				$.each( opt.views,function(key,item){
					if( key === 'body' || key === 'container' || key === 'modal' ) return;
					h += item._outerHeight();
				} );
				bd._outerHeight( container._height()-h );
			}
			self.fireEvent("onSetViewSize",[opt]);
			
			self.resetModelSize();
			//self.fireEvent('onViewSizeChange',[ opt ]);
		},
		initWH : function(w,h){
			var self = this,
				opt = self.C();
			self.setWH(w,h);
		},
		resize : function(m){
			var self = this,
				opt = self.C(),
				undef;
			
			opt._rt = opt._rt || 0;
			
			if( opt._rt ) {
				clearTimeout( opt._rt );	
			}
			
			opt._rt = setTimeout(function(){
				self._setBodyOverflowHidden();	
				self.setWH();	
				if( opt.refreshPosOnResize ) {
					self.resetModelSize();
					self.resetPosition();
				}
				
			},0);
			return self;
		},
		/*
		*清空window内容
		*/
		empytContent : function(){
			return this.empty();
		},
		_addContent : function(items,after){
			return this._insert( items,after );
		},
		/*
		*向window追加内容
		*/
		addContent : function(items,after){
			return this.insert( items,after );
		},
		initWindow : function(){
			var self = this,
				opt=this.configs;
				
			Nex.Html.fn.initComponent.apply(self,arguments);
			
			var container = opt.views['container'];
			container.hide();
			if( opt.autoShow ) {
				self._show();	
			}
			//self.fireEvent('onCreate',[ opt ]);
			
			return self;
		},
		hide :　function(){
			var self = this;
			var opt = self.configs;	
			self.closeWindow();
		},
		//默认显示函数
		show : function(){
			var self = this,
				opt=this.configs;	
			self.openWindow();	
		}
	});
})(jQuery);
/*
layout组件继承 html
author:nobo
zere.nobo@gmail.com
qq : 505931977
*/
;(function($){
	"use strict";
	var layout = Nex.extend('Nex.Layout','Nex.Html').setXType('layout');
	
	layout.extend({
		version : '1.0',
		_Tpl : {				
		}
	});
	layout.setOptions(function( opt ){
		return {
			prefix : 'nexLayout-',
			autoDestroy : true,
			autoResize : true,
			_hasBodyView : false,
			_checkScrollBar : false,
			position : 'relative',
			renderTo: document.body,
			width : '100%',
			height : '100%',
			easing : 'easeOutCirc',
			layouts : ['north','south','west','east'],
			isCreate : false,
			closeTime : 300,
			cls : '',
			borderCls : [opt.borderCls,'nex-layout-border'].join(' '),
			containerCls : [opt.containerCls,'nex-layout nex-layout-wrap'].join(' '),
			autoScrollCls : '',
			autoScrollRegionCls : 'nex-layout-auto-scroll',
			borderRegionCls : 'nex-layout-region-border',
			cssText : '',
			style : {},//css
			bodyCls : '',
			bodyStyle : {},
			padding : 0,
			dblclickToClose : true,
			_north : {
				handles : 's',
				"split" : true,
				splitBtn : true,
				splitSize : 5,
				resizable : true,
				isClosed : false,
				autoScroll : false,
				selectionable : true,
				border : true,
				borderCls : '',
				attrs : {},
				cls : '',
				clsText : '',
				style : {},//css
				padding : 0,
				html : '',
				items : [],
				maxSize : 0,//maxHeight 
				minSize : 28,//minHeight
				height : 80
			},
			_south : {
				handles : 'n',
				"split" : true,
				splitBtn : true,
				splitSize : 5,
				resizable : true,
				isClosed : false,
				autoScroll : false,
				selectionable : true,
				border : true,
				borderCls : '',
				attrs : {},
				cls : '',
				clsText : '',
				style : {},//css
				padding : 0,
				html : '',
				items : [],
				maxSize : 0,//maxHeight 
				minSize : 28,//minHeight
				height : 40
			},
			_east : {
				handles : 'w',
				"split" : true,
				splitBtn : true,
				splitSize : 5,
				resizable : true,
				isClosed : false,
				autoScroll : false,
				selectionable : true,
				border : true,
				borderCls : '',
				attrs : {},
				cls : '',
				clsText : '',
				style : {},//css
				padding : 0,
				html : '',
				items : [],
				maxSize : 0,//maxHeight 
				minSize : 28,//minHeight
				width : 80
			},
			_west : {
				handles : 'e',
				"split" : true,
				splitBtn : true,
				splitSize : 5,
				resizable : true,
				isClosed : false,
				autoScroll : false,
				selectionable : true,
				border : true,
				borderCls : '',
				attrs : {},
				cls : '',
				clsText : '',
				style : {},//css
				padding : 0,
				html : '',
				items : [],
				maxSize : 0,//maxHeight 
				minSize : 28,//minHeight
				width : 160
			},
			_center : {
				minWidth : 20,
				minHeight : 20,
				autoScroll : false,
				selectionable : true,
				border : true,
				borderCls : '',
				attrs : {},
				cls : '',
				clsText : '',
				style : {},//css
				padding : 0,
				html : '',
				items : []
			},
			maxWidth : 0,
			minWidth : 0,
			maxHeight : 0,
			minHeight : 0,
			dir : '',
			denyEvents : [ 'scroll' ],
			events : {
				onCreate : $.noop,
				onBeforeRegionCreate : $.noop,
				onRegionCreate : $.noop,
				onBeforeRegionRemove : $.noop,
				onRegionRemove : $.noop,
				onBeforeSplitDrag : $.noop,
				onSplitDrag : $.noop,
				onSplitStopDrag : $.noop
			}
		};	
	});
	layout.fn.extend({
		_init : function(opt) {
			var self = this;
			self.initOptions(opt);
			self.setContainer();
			self.setBody();
			self.initComponent();
		},
		initOptions : function(opt){
			var self = this;
			var regions =['north','south','west','east','center'];
			var cfs = {};
			for( var i=0;i<regions.length;i++ ) {
				var cf = {};
				var region = regions[i];
				$.extend(cf,opt['_'+region],opt[region] || {});
				cfs[region] = cf;
			}
			opt = $.extend(opt,cfs);
		},
		_setPadding : function(){
			var self = this,
				opt = self.configs;
			var bd = self.getContainer();
			bd.css('padding',opt.padding);
		},
		getBody : function(){
			var self = this,
				opt = self.configs;
			return opt.views['body'];
		},
		setBody : function(){
			var self = this;
			var opt = self.configs;	
			var container = opt.views['container'];
			var bd = $( '<div class="nex-layout-container '+opt.bodyCls+'" id="'+opt.id+'_container" style=""></div>' );
			opt.views['body'] = bd;
			container.append(bd);
			//bd.css('padding',opt.padding);
			bd.css(opt.bodyStyle);
			//self.bindBodyEvents();	 
			self.fireEvent("onBodyCreate",[bd,opt]);
			return self;
		},
		getBodyWidth : function(){
			var vbody = this.getBody();
			return vbody.width();	
		},
		getBodyHeight : function(){
			var vbody = this.getBody();
			return vbody.height();	
		},
		initComponent : function(){
			var self = this;
			var opt = self.configs;	
			self.fireEvent('onInitComponent',[opt]);
			//初始是不应该触发onSizeChange事件
			self.lockEvent('onSizeChange');
			self.resetHtmlSize();
			self.unLockEvent('onSizeChange');
			
			self.createLayouts();
			
			self.fireEvent('onCreate',[opt]);
			opt._isInit = false;
		},
		//系统事件
		_sysEvents : function(){
			var self = this;
			var opt = self.configs;
			Nex.Html.fn._sysEvents.apply(self,arguments);
			//self.bind("onRegionSizeChange",self.setExpandSize);	
			self.bind("onRegionCreate",self.bindReginEvent);
		//	self.bind("onRegionCreate",self.onRegionCreate);
			//self.bind("onCreate",self.onCreate);	
			self.bind("onRegionCreate",self.closeDefault);	
			self.bind("onSplitBtnClick",self.splitClickToClose);
			self.bind("onSplitDblClick",self.splitDblClickToClose);
			self.bind("onRegionCreate",self.dragSplit);
		},
		dragSplit : function(region){
			var self = this,opt=this.C();
			var bar = $("#"+opt.id+"_"+region+"_split");
			if( !bar.length || !Nex.draggable ) return;
			
			if( !opt[region]['resizable'] ) return;
			
			var axis = 'h';
			var cursor = 'default';
			switch( region ) {
				case 'north':
				case 'south':
					axis = 'v';
					cursor = 'row-resize';
					break;
				case 'west':
				case 'east':
					axis = 'h';
					cursor = 'col-resize';
					break
			}
			
			var _setRegionSize = function(x,y){
				var _s = self.inArray(region,['north','south']) == -1 ? x : y;
				if( self.inArray(region,['east','south']) != -1 ) {
					_s *= -1; 	
				}
				var size = self._undef(opt[region]['height'],opt[region]['width']) + _s;
				size = size < 0 ? 0 : size;
				var layoutSize = {width:$("#"+opt.id+"_container").width(),height:$("#"+opt.id+"_container").height()};
				var maxHeight = 0,maxWidth = 0;
				switch( region ) {
					case 'south':
					case 'north':
						maxHeight = size + ( region==='south' ? opt['north']['height'] : opt['south']['height'] ) + opt['center']['minHeight'];
						if( maxHeight>=layoutSize.height ) {
							size -= maxHeight - layoutSize.height;
						}
						break;
					case 'west':
					case 'east':
						maxWidth = size + ( region==='west' ? opt['east']['width'] : opt['west']['width'] ) + opt['center']['minWidth'];
						if( maxWidth>=layoutSize.width ) {
							size -= maxWidth - layoutSize.width;
						}
						break;
				}
				self.setRegionSize(region,size);
				self.refresh();
			}
			
			Nex.Create('draggable',{
				helper : bar,
				axis :　axis,			 
				cursor : cursor,
				onBeforeDrag : function(e,ui){
					var self = this;
					var target = e.srcElement ? e.srcElement : e.target;
					if( !$(target).hasClass('nex-layout-split') ) return false;
					if( !opt[region]['resizable'] || opt[region]['isClosed'] ) {
						return false;	
					}
					var r = self.fireEvent('onBeforeSplitDrag',[ region,e,opt ]);
					if( r === false ) return f;
					
					$(bar).addClass('nex-split-drag');
					$(bar).css('zIndex',99999);
					
					var clone = $(bar).clone();	
					clone.attr('id','_dragSplit');
					clone.css('zIndex',-1);
					clone.addClass('nex-split-proxy-drag');
					clone.empty();
					$(bar).after(clone);
					
					self.__clone = clone;
				},
				onDrag : function(e,ui){
					var self = this;
					var r = self.fireEvent('onSplitDrag',[ region,ui,e,opt ]);
					if( r === false ) return r;
					//return false;	
				},
				//如果要用 onStopDrag 那么 就需要使用setTimeout来调用_setRegionSize和fireEvent(onSplitStopDrag)
				onAfterDrag : function(e,ui){
					var self = this;
					$(bar).removeClass('nex-split-drag');
					$(bar).css('zIndex',0);
					self.__clone.remove();
					_setRegionSize( ui.left - ui._sLeft,ui.top-ui._sTop );
					self.fireEvent('onSplitStopDrag',[ region,ui.left - ui._sLeft,ui.top-ui._sTop,ui,e,opt ]);
				}
			});
		},
		splitClickToClose : function(bar,region,e){
			var self = this;
			var opt = self.C();	
			if( opt[region]['isClosed'] ) {
				self.openRegion( region );	
			} else {
				self.closeRegion( region );	
			}		
		},
		splitDblClickToClose : function(bar,region,e){
			var self = this;
			var opt = self.C();	
			if( !opt.dblclickToClose ) return;
			if( opt[region]['isClosed'] ) {
				self.openRegion( region );	
			} else {
				self.closeRegion( region );	
			}
		},
		onCreate : function(){
			/*var self = this;
			var opt = self.configs;	
			var ename = "resize."+opt.id;
			$(window).unbind(ename);
			$(window).bind(ename,function(){
				self.resize();						  
			});*/
		},
		closeDefault : function(region,lbody){
			var self = this;
			var opt = self.C();	
			var rg = opt[region];
			if( region == 'center' ) return;
			if( rg['isClosed'] ) {
				self.closeRegion(region);	
			}
		},
		bindReginEvent : function(region,lbody){
			var self = this;
			var opt = self.configs;	
			if( !opt[region]['split'] ) return;
			var $split = $("#"+opt.id+"_"+region+"_split");
			var $split_i = $("#"+opt.id+"_"+region+"_split").find(">a.nex-layout-split-i");
			var callBack = function(type,e){
				var target = e.srcElement ? e.srcElement : e.target;
				if( !$(target).hasClass('nex-layout-split') ) return;
				var r = self.fireEvent(type,[ this,region,e ]);
				if( r === false ) return r;
				var r = self.fireEvent(type.replace('Split',self._toUpperCase(region)+'Split'),[ this,region,e ]);
				if( r === false ) return r;
				if( r === false ) {
					e.stopPropagation();
					e.preventDefault();
				}
			};
			var events = {
				'click' : function(e) {
					callBack.call(this,'onSplitClick',e);
				},
				'dblclick' : function(e) {
					callBack.call(this,'onSplitDblClick',e);
				},
				'keydown' : function(e) {
					callBack.call(this,'onSplitKeyDown',e);
				},
				'keyup' : function(e) {
					callBack.call(this,'onSplitKeyUp',e);
				},
				'keypress' : function(e){
					callBack.call(this,'onSplitKeyPress',e);
				},
				'mouseover' : function(e){
					callBack.call(this,'onSplitMouseOver',e);
				},
				'mouseout' : function(e){
					callBack.call(this,'onSplitMouseOut',e);
				},
				'mousedown' : function(e) {
					callBack.call(this,'onSplitMouseDown',e);
				},
				'mouseup' : function(e) {
					callBack.call(this,'onSplitMouseUp',e);
				},
				'contextmenu' : function(e){	
					callBack.call(this,'onSplitContextMenu',e);
				}
			};
			var callBack2 = function(type,e){
				var target = e.srcElement ? e.srcElement : e.target;
				if( !$(target).hasClass('nex-layout-split-i') ) return;
				var r = self.fireEvent(type,[ this,region,e ]);
				if( r === false ) return r;
				var r = self.fireEvent(type.replace('SplitBtn',self._toUpperCase(region)+'SplitBtn'),[ this,region,e ]);
				if( r === false ) return r;
				
				if( r === false ) {
					e.stopPropagation();
					e.preventDefault();
				}
				
			};
			var events2 = {
				'click' : function(e) {
					callBack2.call(this,'onSplitBtnClick',e);
				},
				'dblclick' : function(e) {
					callBack2.call(this,'onSplitBtnDblClick',e);
				},
				'keydown' : function(e) {
					callBack2.call(this,'onSplitBtnKeyDown',e);
				},
				'keyup' : function(e) {
					callBack2.call(this,'onSplitBtnKeyUp',e);
				},
				'keypress' : function(e){
					callBack2.call(this,'onSplitBtnKeyPress',e);
				},
				'mouseover' : function(e){
					callBack2.call(this,'onSplitBtnMouseOver',e);
				},
				'mouseout' : function(e){
					callBack2.call(this,'onSplitBtnMouseOut',e);
				},
				'mousedown' : function(e) {
					callBack2.call(this,'onSplitBtnMouseDown',e);
				},
				'mouseup' : function(e) {
					callBack2.call(this,'onSplitBtnMouseUp',e);
				},
				'contextmenu' : function(e){	
					callBack2.call(this,'onSplitBtnContextMenu',e);
				}
			};
			$split.bind(events);
			$split_i.bind(events2);
		},
		getRegion : function(region){
			var self = this;
			var opt = self.C();
			var $region = $("#"+opt.id+'_'+region);
			if( $region.size() ) {
				return  $region;	
			}
			return false;
		},
		getRegionBody : function(region){
			var self = this;
			var opt = self.C();
			var $region = $("#"+opt.id+'_'+region+'_body');
			if( $region.size() ) {
				return  $region;	
			}
			return false;
		},
		//设置 标题,collapsible宽度
		setExpandSize : function(region){
			var self = this;
			var opt = self.configs;	
			var $region = $("#"+opt.id+'_'+region);
			var h = 0;
			$(">div:not(div.nex-layout-body)",$region).each(function(){
				h += $(this)._outerHeight();												 
			});
			
			$("#"+opt.id+'_'+region+'_body')._outerWidth( $region._width() );
			$("#"+opt.id+'_'+region+'_body')._outerHeight( $region._height()-h );

		},
		getRegionSize : function(region,mod){
			var self = this;
			var opt = self.configs;
			
			var mod = self._undef( mod,true );
			
			var $region = opt[region].isClosed ? false : $("#"+opt.id+'_'+region);
			var size = 0;
			
			var $split = opt[region]['split'] ? $("#"+opt.id+'_'+region+'_split') : false;
			
			if( self.inArray( region,['north','south'] ) != -1 ) {
				size += $region ? $region._outerHeight() : 0;
				size += $split ? $split._outerHeight() : 0;
			} else if( self.inArray( region,['west','east'] ) != -1 ) {
				size += $region ? $region._outerWidth() : 0;
				size += $split ? $split._outerWidth() : 0;	
			}
			return size;
		},
		//设置region的大小 初始设置必须先设置 north,south 然后再设置 west,east
		setRegionSize : function(region,size,b){
			var self = this;
			var opt = self.configs;
			
			var b = self._undef( b,false );
			
			if( self.inArray( region,opt.layouts ) == -1 ) { 
				return self; 
			}
			
			var r = self.fireEvent('onBeforeRegionSizeChange',[region]);
			if( r===false ) return r;
			
			var layoutW = self.getBodyWidth();
			var layoutH = self.getBodyHeight();
			
			var isChange = false;
			
			if( self.inArray( region,['north','south'] ) != -1 ) {
				
				if( typeof size != 'undefined' ) {
					if( size == opt[region].height ) return false;
				}
				
				var size = size || opt[region].height;
				
				if( opt[region].minSize>0 ) {
					size = Math.max(size,opt[region].minSize);
				}
				if( opt[region].maxSize>0 ) {
					size = Math.min(size,opt[region].maxSize);
				}
				
				if( size != opt[region].height ) {
					isChange = true;
				}
				
				opt[region].height = size;
				var $region = $("#"+opt.id+'_'+region);
				$region._outerWidth( layoutW );
				$region._outerHeight( size );
				
				if( opt[region]['split'] ) {
					var $split = $("#"+opt.id+'_'+region+'_split');
					$split._outerWidth( layoutW );
					$split._outerHeight( opt[region]['splitSize'] );
				}
				
			} else if( self.inArray( region,['west','east'] ) != -1 ) {
				
				if( typeof size != 'undefined' ) {
					if( size == opt[region].width ) return false;
				}
				
				var size = size || opt[region].width;
				
				if( opt[region].minSize>0 ) {
					size = Math.max(size,opt[region].minSize);
				}
				if( opt[region].maxSize>0 ) {
					size = Math.min(size,opt[region].maxSize);
				}
				
				if( size != opt[region].width ) {
					isChange = true;
				}
				
				opt[region].width = size;
				var $region = $("#"+opt.id+'_'+region);
				
				var height = layoutH - self.getRegionSize('north',!b) - self.getRegionSize('south',!b);
				
				$region._outerHeight( height );
				$region._outerWidth( size );
				
				if( opt[region]['split'] ) {
					var $split = $("#"+opt.id+'_'+region+'_split');
					$split._outerWidth( opt[region]['splitSize'] );
					$split._outerHeight( height );
				}
				
			} else {//center
				var $region = $("#"+opt.id+'_'+region);	
				$region._outerWidth( layoutW-self.getRegionSize('west')-self.getRegionSize('east') );
				$region._outerHeight( layoutH-self.getRegionSize('north')-self.getRegionSize('south') );
			}
			
			self.setExpandSize(region);
			
			if(  isChange ) {
				self.fireEvent('onRegionSizeChange',[region]);
			}
			return true;
		},
		setRegionPos : function(region,mod){//mod  false 只设置split bar的位置 不设置region的
			var self = this;
			var opt = self.configs;
			if( self.inArray( region,opt.layouts ) == -1 ) { 
				return self; 
			}
			
			var r = self.fireEvent('onBeforeRegionPositionChange',[region]);
			if( r===false ) return r;
			
			var mod = self._undef( mod,true );
			
			var layoutW = self.getBodyWidth();
			var layoutH = self.getBodyHeight();
			
			if( self.inArray( region,['north','south'] ) != -1 ) {
				
				var left = 0,top = 0;
				
				var $region = $("#"+opt.id+'_'+region);
				
				var h=$region._outerHeight();
				
				var $region_h = opt[region].isClosed ?  0 :h ;
				
				var $split = opt[region]['split'] ? $("#"+opt.id+'_'+region+'_split') : false;
				
				if( region == 'north' ) {
					top = opt[region].isClosed ? -h : 0;
					if( mod ) {
						$region.css({
							left : left,
							top :　top,
							position : 'absolute'
						});	
					}
					if( $split ) {
						$split.css({
							left : left,
							top :　$region_h,
							position : 'absolute'
						});		
					}
				} else if( region == 'south' ) {
					top = opt[region].isClosed ? layoutH : layoutH - self.getRegionSize('south') + ($split?$split._outerHeight():0);
					if( $split ) {
						$split.css({
							left : left,
							top :　layoutH - self.getRegionSize('south'),
							position : 'absolute'
						});		
					}
					if( mod ) {
						$region.css({
							left : left,
							top :　top,
							position : 'absolute'
						});	
					}
				}
			} else if( self.inArray( region,['west','east'] ) != -1 ) {
				var left = 0,top = 0;
				
				var $region = $("#"+opt.id+'_'+region);
				
				var w = $region._outerWidth();
				
				var $region_w = opt[region].isClosed ? 0 : w;
				
				var $split = opt[region]['split'] ? $("#"+opt.id+'_'+region+'_split') : false;
				
				if( region == 'west' ) {
					left = opt[region].isClosed ? -w : 0;
					if( mod ) {
						$region.css({
							left : left,
							top :　self.getRegionSize('north'),
							position : 'absolute'
						});	
					}
					if( $split ) {
						$split.css({
							left : $region_w,
							top :　self.getRegionSize('north'),
							position : 'absolute'
						});		
					}
				} else if( region == 'east' ) {
					left = opt[region].isClosed ? layoutW : layoutW - self.getRegionSize('east') + ($split?$split._outerWidth():0);
					if( $split ) {
						$split.css({
							left :　layoutW - self.getRegionSize('east'),
							top :　self.getRegionSize('north'),
							position : 'absolute'
						});	
					}
					if( mod ) {
						$region.css({
							left :　left,
							top :　self.getRegionSize('north'),
							position : 'absolute'
						});	
					}
				}
			} else { //center
				var left = 0,top = 0;
				var $region = $("#"+opt.id+'_'+region);
				$region.css({
					left :　self.getRegionSize('west'),
					top :　self.getRegionSize('north'),
					position : 'absolute'
				});
			}
			self.fireEvent('onRegionPositionChange',[region]);
			return self
		},
		openRegion : function( region ){
			var self = this,undef;
			var opt = self.configs;
			
			if( region == 'center' ) {
				return self;	
			}
			
			var r = self.fireEvent('onBeforeOpenRegion',[region]);
			if( r === false ) return r;
			var r = self.fireEvent('onBefore'+ self._toUpperCase(region) +'Open',[region]);
			if( r === false ) return r;
			
			var openCallBack = function(){
				self.refresh();
				self.fireEvent('onOpenRegion',[region]);	
				self.fireEvent('on'+ self._toUpperCase(region) +'Open',[region]);
				//设置split bar css
				$("#"+opt.id+"_"+region+"_split").removeClass("nex-layout-split-closed nex-layout-"+region+"-split-closed");
			}
			
			opt[region]['isClosed'] = false;
			
			var layoutW = self.getBodyWidth();
			var layoutH = self.getBodyHeight();
			
			var $region = $("#"+opt.id+'_'+region);
			switch( region ) {
				case 'north' :
					$region.animate({
						top : 0			 
					},opt.closeTime,opt.easing,function(){
						openCallBack();
					});
					break;
				case 'south':
					$region.animate({
						top : layoutH-$region._outerHeight()				 
					},opt.closeTime,opt.easing,function(){
						openCallBack();
					});
					break;
				case 'west' :
					$region.animate({
						left : 0				 
					},opt.closeTime,opt.easing,function(){
						openCallBack();
					});
					break;
				case 'east':
					$region.animate({
						left : layoutW-$region._outerWidth()				 
					},opt.closeTime,opt.easing,function(){
						openCallBack();
					});
					break;
			}
		},
		closeRegion : function( region ){
			var self = this,undef;
			var opt = self.configs;
			
			if( region == 'center' ) {
				return self;	
			}
			
			var r = self.fireEvent('onBeforeCloseRegion',[region]);
			if( r === false ) return r;
			var r = self.fireEvent('onBefore'+ self._toUpperCase(region) +'Close',[region]);
			if( r === false ) return r;
			
			var closeCallBack = function(){
				self.fireEvent('onCloseRegion',[region]);	
				self.fireEvent('on'+ self._toUpperCase(region) +'Close',[region]);
				//设置split bar css
				$("#"+opt.id+"_"+region+"_split").addClass("nex-layout-split-closed nex-layout-"+region+"-split-closed");
			}
			
			opt[region]['isClosed'] = true;
			
			var layoutW = self.getBodyWidth();
			var layoutH = self.getBodyHeight();
			//剔除当前正关闭的region
			var regions =['north','south','west','east','center'];
			var pos = self.inArray( region,regions );
			if( pos !== -1 ) {
				regions.splice(pos,1);
			}
			self.refresh();
			//只设置当前正在关闭的split bar
			self.setRegionPos(region,false);
			
			var $region = $("#"+opt.id+'_'+region);
			
			switch( region ) {
				case 'north' :
					$region.animate({
						top : -$region._outerHeight()				 
					},opt.closeTime,opt.easing,function(){
						closeCallBack();
					});
					break;
				case 'south'://easeInCirc
					$region.animate({
						top : layoutH+$region._outerHeight()				 
					},opt.closeTime,opt.easing,function(){
						closeCallBack();
					});
					break;
				case 'west' :
					$region.animate({
						left : -$region._outerWidth()				 
					},opt.closeTime,opt.easing,function(){
						closeCallBack();
					});
					break;
				case 'east'://easeInCirc
					$region.animate({
						left : layoutW+$region._outerWidth()				 
					},opt.closeTime,opt.easing,function(){
						closeCallBack();
					});
					break;
			}
			//self.fireEvent('onRegionSizeChange',[region]);
		},
		_appendContent : function(region,lbody){
			var self = this;
			var opt = self.C();	
			var lbody = lbody || $('#'+opt.id+'_'+region+'_body');
			//因为创建后立马写入内容，宽高都没设置，放到回调里
			var items = opt[region]['html'];
			self.addComponent( lbody,items );
			var items = opt[region]['items'];
			self.addComponent( lbody,items );
		},
		_createRegion : function( region ){
			var self = this;
			var opt = self.configs;
			
			if( $("#"+opt.id+'_'+region).size() ) {
				return false;	
			}
			
			var container = $("#"+opt.id+'_container');
			
			if( region =='center' ) {
				var ln = $('<div class="nex-layout-panel nex-layout-'+region+'" id="'+opt.id+'_'+region+'"></div>');
				container.append(ln);	
				
			} else {
				var ln = $('<div class="nex-layout-panel nex-layout-'+region+'" id="'+opt.id+'_'+region+'"></div>');
				container.append(ln);
				if( opt[region]['split'] ) {
					var lns = $('<div class="nex-layout-panel nex-layout-split nex-layout-'+region+'-split" id="'+opt.id+'_'+region+'_split"></div>');
					if( opt[region]['splitBtn'] ) {
						lns.append($('<a href="javascript:void(0)" class="nex-layout-split-i nex-layout-'+region+'-split-i"></a>'));
					}
					container.append(lns);
				}
			}
			var lbody = $('<div class="nex-layout-body '+( opt[region]['autoScroll'] ? opt.autoScrollRegionCls : '' )+' nex-layout-'+region+'-body '+opt[region]['cls']+'"  id="'+opt.id+'_'+region+'_body"></div>');
			
			lbody[0].style.cssText = opt[region]['cssText'];
			
			if( opt[region]['padding'] ) {
				lbody.css('padding',opt[region]['padding'])	;
			}
			lbody.attr(opt[region]['attrs']).css(opt[region]['style']);
			
			ln.append(lbody);
			
			if( opt[region]['border'] ) {
				ln.addClass( opt.borderRegionCls );	
				ln.addClass( opt[region]['borderCls'] );	
			}
			
			if( !opt.selectionable ) {	
				ln.disableSelection();	
			}
			
			return lbody;
		},
		_refresh : function(regions){
			var self = this;
			var opt = self.C();
			regions = regions || ['north','south','west','east','center'];
			for( var x=0;x<regions.length;x++ ) {
				self.setRegionSize( regions[x] );
				self.setRegionPos( regions[x]);	
			}
		},
		/*
		*更新region的大小以及位置 @regions需要更新的regions Array , @m 是否更新后触发onResize事件 默认 true , false不触发
		*/
		refresh : function( regions,m ){
			var self = this;
			var opt = self.configs;	
			var m = self._undef( m,true );
			var regions =regions || ['north','south','west','east','center'];
			
			self._refresh(regions);

			if( Nex.Manager && m ) {
				if( opt.__onresize ) {
					clearTimeout( opt.__onresize );	
				}
				opt.__onresize = setTimeout(function(){
					Nex.Manager.fireEvent("onResize",[opt.id]);		
				},0);
			}	
			
		},
		updateRegionSize : function( region,size ){
			var self = this;
			var opt = self.configs;	
			var r = self.setRegionSize( region,size );
			if( r === false ) return r;
			self.refresh();
		},
		_setViewSize : function(w,h){
			var self = this,
				opt = self.configs,
				container = self.getContainer(),
				vbody = self.getBody();
			
			vbody._outerWidth( container._width() );
			vbody._outerHeight( container._height() );
			
			self.fireEvent("onSetViewSize",[opt]);	
			
		},
		resetViewSize : function( func ){
			var self = this,
				opt = self.configs;	
			Nex.Html.fn.resetViewSize.apply(self,arguments);
			if( !opt._isInit ) {
				self.refresh();//解决初始时就调用refresh api
			}
			return self;
		},
		//首字母大写
		_toUpperCase : function(str){
				return str.replace(/\s[a-z]/g,function($1){return $1.toLocaleUpperCase()}).replace(/^[a-z]/,function($1){return $1.toLocaleUpperCase()});	
		},
		removeRegion : function(region){
			var self = this;
			var opt = self.C();
			var pos = self.inArray( region,opt.layouts );
			if( pos == -1 ) return true;
			
			var r = self.fireEvent('onBeforeRegionRemove',[region]);
			if( r === false ) return r;
			var r = self.fireEvent('onBefore'+_toUpperCase(region)+'Remove',[region]);
			if( r === false ) return r;
			
			var _toUpperCase = self._toUpperCase;
			
			opt.layouts.splice(pos,1);
			$("#"+opt.id+'_'+region).remove();
			$("#"+opt.id+'_'+region+'_split').remove();
			self.refresh();
			self.fireEvent('onRegionRemove',[region]);
			self.fireEvent('on'+_toUpperCase(region)+'Remove',[region]);
			
			return true;
		},
		createRegion : function( region,d ){
			var self = this;
			var opt = self.configs;
			var d = self._undef(d,{});
			
			var r = self.fireEvent('onBeforeRegionCreate',[region]);
			if( r === false ) return r;
			var r = self.fireEvent('onBefore'+_toUpperCase(region)+'Create',[region]);
			if( r === false ) return r;
			
			var _toUpperCase = self._toUpperCase;
			var $region = $("#"+opt.id+'_'+region);
			if( !$region.size() ) {
				opt.layouts.push( region );
				//添加数据
				$.extend(opt[region],d);
				
				var lbody = self._createRegion( region );
				//self.setRegionSize( region );	
				//self.setRegionPos( region  );	
				
				self.fireEvent('onRegionCreate',[region,lbody]);
				self.fireEvent('on'+_toUpperCase(region)+'Create',[region,lbody]);
				
				self.refresh();	
				//填入内容
				self._appendContent(region,lbody);
			}
			
			return true;
		},
		createLayouts : function(){
			var self = this;
			var opt = self.configs;
			
			if( opt.isCreate ) return;
			
			opt.layouts.push('center');
			
			var _l = ['north','south','west','east','center'];
			var _lbody = {};
			//初始化region和大小以及位置
			for( var i=0;i<_l.length;i++ ) {
				if( self.inArray( _l[i],opt.layouts ) == -1 ) continue;
				var _lb = self._createRegion( _l[i] );	
				_lbody[ _l[i] ] = _lb;
				//初始化设置大小和位置 可以加isClosed = true的时候 才执行下面
				//layout 不占用太多性能 可不考虑
				self.setRegionSize( _l[i] );	
				self.setRegionPos( _l[i] );		
			}
			
			for( var i=0;i<opt.layouts.length;i++ ) {
				self.fireEvent('onRegionCreate',[opt.layouts[i],_lbody[ opt.layouts[i] ]]);
				self.fireEvent('on'+self._toUpperCase(opt.layouts[i])+'Create',[opt.layouts[i],_lbody[ opt.layouts[i] ]]);
			}
			
			self._refresh();	
			
			for( var i=0;i<_l.length;i++ ) {	
				self._appendContent(_l[i],_lbody[ _l[i] ]);
			}
			opt.isCreate = true;
		},
		_insert : function( item , after , region ){
			var self = this;
			var opt = self.C();	
			var region = self._undef( region,'center' );
			var lbody = self.getRegionBody(region);
			if( !lbody ) return self;
			var list = self.addComponent( lbody,item,after );
			
			return list;
		},
		_empty : function( region ){
			var self = this;
			var opt = self.C();	
			var lbody = self.getRegionBody( region || 'center' );	
			if( !lbody ) return self;
			
			lbody.empty();
			
			var ls = Nex.Manager._getDomComps( lbody );
			$.each( ls,function(i,cmp){
				cmp.removeCmp();	
			} );
			
			return self;
		}
	});
	$.fn.layout = function(options, param){
		var options = options || {};
		if (typeof options == 'string'){
			switch(options) {
				case 'options':
					return $.data(this[0],'nex.layout').C();
				default : 
					return this.each(function(){
						if( param ) {
							$(this).data('nex.layout').C(options,param);
						}
					}); 
			}
		}
		var list = [];
		return this.each(function(){
			var opt;
			var self = $.data(this, 'nex.layout');
			if (self) {
				opt = self.configs;
				$.extend(opt, options);
				list.push(self);
				return;
			}
			options.target = $(this);
			var layout = new layout(options);
			list.push(layout);
		});
		return list.length === 1 ? list[0] : list;
	};
})(jQuery);
/*
jquery.nexMenu.js
http://www.extgrid.com/menu
author:nobo
qq:505931977
QQ交流群:13197510
email:zere.nobo@gmail.com or QQ邮箱

*/

;(function($){
	"use strict";
	var menu = Nex.widget('menu');
	//Nex.menuzIndex = 99997;
	$.nexMenu = $.extMenu = menu;
	menu.extend({
		version : '1.0',
		getDefaults : function(opt){
			var _opt = {
				prefix : 'nexmenu-',
				renderTo : document.body,
				width : 0,
				height : 0,
				maxWidth : 0,
				minWidth : 120,
				minHeight : 0,
				maxHeight : 0,
				isIE : !!window.ActiveXObject,
				url : '',//无效 不支持支持远程创建 返回数据格式  json
				cache : true,
				dataType : 'json',
				queryParams : {},
				method : 'get',
				parames : {},
				data : [],
				splitChr : ['-',',',';','|'],
				cls : '',
				delay : 0,//延迟毫秒数 ms
				_t_delay : 0,
				IEVer : Nex.IEVer,
				border :　false,
				borderCls : 'nex-menu-border',
				showShadow : true,
				hideToRemove : true,
				showMenuVLine : false,//显示节点线条
				showMenuIcon : true,//显示节点图标
				showMenuMore : true,//如果列表过多 显示上下 btn
				_speedTime : 10,
				_speedNum : 5,
				_data : {},
				_childrens : {},
				_levelData : {},//level=>[]
				_firstNodes : {},// 0:node1,1:node2 k=>v k表示第几级
				_lastNodes : {},// 0:node1,1:node2 k=>v k表示第几级
				clickToHide : true,
				expandOnEvent : 0,//0 mousover 1 click 
				simpleData : false,
				root : '0',//simpleData下可不用设置且只在初始化时有效，初始化后会用showRowId代替
				showRootId : '0',//请设置对应的顶层ID 非simpleData下可不用设置
				iconField : 'icon',//图标字段 样式
				iconClsField : 'iconCls',//图标字段 样式
				idField : 'id',
				textField : 'text',
				openField : 'open',
				levelField : '_level',
				parentField : 'pid',
				sortField : 'order',
				childField : 'items',
				disabledField : 'disabled',
				groupNode : false,//开启后会对叶子和节点进行分类
				showConf : {xAlign:'right',yAlign:'bottom',zAlign:'x'},
				events : {
					onStart : $.noop,
					onCreate : $.noop,
					onSizeChange : $.noop,
					onClick : $.noop,
					onDblClick : $.noop,
					onFocus : $.noop,
					onBlur : $.noop,
					onKeyDown : $.noop,
					onKeyUp : $.noop,
					onKeyPress : $.noop,
					onMouseOver : $.noop,
					onMouseOut : $.noop,
					onPaste : $.noop,
					onMouseDown : $.noop,
					onMouseUp : $.noop,
					onDestroy : $.noop
				}
			};
			
			var _opt = this.extSet(_opt);
			
			return $.extend({},_opt,opt);
		}
	});
	$.nexMenu.fn.extend({
		_init : function(opt) {
			var self = this;
			
			self._mapTree(opt.data);
			
			//self.show();
		},
		_sysEvents : function(){
			var self = this;
			var opt = self.configs;
			self.bind("onMouseOver.over",self.onMouseOver,self);
			self.bind("onMouseOut.over",self.onMouseOut,self);
			self.bind("onClick.click",self._clickItem,self);
			self.bind(opt.expandOnEvent == 0 ? "onMouseOver.over" : "onClick.over",self._displayMenu,self);
			
			return self;
		},
		_clickItem : function(li,tid,node,e){
			var self = this,
				opt=this.configs;
				
			if( node[opt.disabledField] ) {
				return;
			}
			if( $.isFunction( node['callBack'] ) )
				node['callBack'].apply(self,[li,tid,node,e]);
			if( self.isLeaf( tid ) && opt.clickToHide ) {
				self.hideAllMenu(opt.root,1);
			}
			
		},
		onMouseOver : function(li,tid,node,e){
			var self = this,
				opt=this.configs;
			if( node[opt.disabledField] ) {
				return;	
			}
			$(li).addClass("nex-menu-item-over");
		},
		onMouseOut : function(li,tid,node,e){
			var self = this,
				opt=this.configs,
				undef;
			if( node[opt.disabledField] ) {
				return;	
			}
			$(li).removeClass("nex-menu-item-over");	
		},
		_displayMenu : function(div,tid,node,e){
			var self = this,
				opt=this.configs,
				undef;
			self.hideAllMenu(tid);
			
			if( node[opt.disabledField] ) {
				return;	
			}
			
			var menu = self.createMenu(tid);
			
			self._showAt( menu,div,opt.showConf );
		},
		_getNode : function(tid,pro){
			var self = this,
				opt=this.configs,
				undef;	
			//var node = opt._data[ opt._tfix+tid ];
			var node = opt._data[ tid ];
			
			if( node === undef ) {
				return false;	
			}
	
			return pro===undef ? node : node[pro];
		},
		_getParentID : function(tid){
			var self = this,
				opt=this.configs,
				undef;	
			var pid = 	self._getNode(tid,opt.parentField);
			return pid === opt.root ? opt.root : 	pid;
		},
		_parseSimpleData : function(data,pid){
			var self = this,
				opt=this.configs;	
			var undef;
			var _ids = {};
			for( var i=0;i<data.length;i++ ) {
				var node = data[i];
				
				if( self.inArray( node,opt.splitChr ) !== -1 ) {
					node = {
						splitLine : true
					};	
				}
				
				if( node[opt.parentField] === undef ) {
					node[opt.parentField] = pid === undef ? opt.root : pid;
					node[opt.levelField] = pid === undef ? 0 : self._getNode(pid,opt.levelField)+1;
				} else {
					node[opt.levelField] = 	self._getNode(node[opt.parentField],opt.levelField)+1;
				}
				if( !(opt.idField in node) ) {
					node[opt.idField] = 'menu_'+self.unique();	
				} else{
					if(node[opt.idField].toString().length<=0) {
						node[opt.idField] = 'menu_'+self.unique();		
					}
				}
				
				opt._data[ node[opt.idField] ] = node; 
				
				var _pid = node[opt.parentField];
				opt._childrens[ _pid ] = opt._childrens[ _pid ] === undef ? [] : opt._childrens[ _pid ];
				var childs = opt._childrens[ _pid ];
				childs.push(node);
				//levelData
				var _lv = node[opt.levelField];
				opt._levelData[ _lv ] = opt._levelData[ _lv ] === undef ? [] : opt._levelData[ _lv ];
				var levels = opt._levelData[ _lv ];
				levels.push(node);
				
				_ids[_pid] = true;
				
			}	

			for( var nid in _ids ) {
				//self.groupNodes( nid );
				self.updateLastNodes( nid );
			}
		},
		//解析数据
		_mapTree : function(data,pid){
			var self = this,
				opt=this.configs;	
			var undef;
			if( opt.simpleData ) {
				self._parseSimpleData(data,pid);
				return self;
			}
			for( var i=0;i<data.length;i++ ) {
				var node = data[i];
				
				if( self.inArray( node,opt.splitChr ) !== -1 ) {
					node = {
						splitLine : true
					};	
				}
				
				node[opt.levelField] = pid === undef ? 0 : self._getNode(pid,opt.levelField)+1;
				node[opt.parentField] = pid === undef ? opt.root : pid;
				
				if( !(opt.idField in node) ) {
					node[opt.idField] = 'menu_'+self.unique();	
				}
				
				opt._data[ node[opt.idField] ] = node; 
				
				var _pid = node[opt.parentField];
				opt._childrens[ _pid ] = opt._childrens[ _pid ] === undef ? [] : opt._childrens[ _pid ];
				var childs = opt._childrens[ _pid ];
				childs.push(node);
				//levelData
				var _lv = node[opt.levelField];
				opt._levelData[ _lv ] = opt._levelData[ _lv ] === undef ? [] : opt._levelData[ _lv ];
				var levels = opt._levelData[ _lv ];
				levels.push(node);
				
				if( ( opt.childField in node ) && node[opt.childField].length ) {
					self._mapTree(node[opt.childField],node[opt.idField]);
				}
				
				if( (i+1) === data.length ) {
					//self.groupNodes( _pid );
					self.updateLastNodes( _pid );
				}
				
			}	
			return self;
		},
		/*
		* 对当前级的数据进行节点和叶子分类
		*/
		groupNodes : function(pid){
			var self = this,
				opt=this.configs,
				undef;
			
			var pid = pid === undef ? opt.root : pid;
			var _d = opt._childrens[ pid ];
			
			if( !opt.groupNode ) return _d;
			
			var nodes=[],leafs=[];
			var len = _d.length;
			for( var i=0;i<len;i++ ) {
				if(self.isLeaf( _d[i] )) {
					leafs.push( _d[i] );	
				} else {
					nodes.push( _d[i] );		
				}
			}
			opt._childrens[ pid ] = nodes.concat(leafs);
			
			return opt._childrens[pid];
		},
		/*
		*更新 第一个节点和最后一个节点的索引
		*/
		updateLastNodes : function(pid){
			var self = this,
				opt=this.configs,
				undef;
			var pid = pid === undef ? opt.root : pid;	
			var chlids = opt._childrens[pid];
			if( chlids.length ) {
				opt._firstNodes[pid] = chlids[0];
				opt._lastNodes[pid] = chlids[chlids.length-1];
			}
		},
		addChildren : function(tid,data){
			var self = this,
				opt=this.configs,
				undef;	
			var d = !$.isArray( data ) ? [data] : data;	
			self._mapTree(d,tid);
		//	self.refreshMenu(tid);
		},
		isSplitLine : function( node ){
			var self = this
				,opt=this.configs
				,undef;	
			if( node.splitLine ) return true;
			return false;
		},
		isLeaf : function(node){
			var self = this
				,opt=this.configs
				,undef;
			if( node === opt.root ) return false;
			var tnode = $.isPlainObject(node) ? node : self._getNode(node);
			if( tnode === false && !self._isRoot(node) ) return true;
			if( self._isRoot(node) ) return false;
			if( tnode.leaf === undef ) {
				var tid = tnode[opt.idField];
				var childrens = self.getChildrens(tid);
				if( childrens.length ) {
					return false;	
				}
				if( (opt.childField in tnode) && tnode[opt.childField].length ) {
					return false;	
				}
				return true;	
			} else {
				return !!tnode.leaf;	
			}
		},
		getAllChildrens : function(pid) {
			var self = this
				,opt=this.configs
				,undef;
			var childs = [];
			var pid = self._undef(pid,opt.root);
			var getChilds = function(pid){
				var _childs = self.getChildrens(pid);
				if( _childs.length ) {
					childs = childs.concat(_childs);
					for( var i=0;i<_childs.length;i++ ) {
						getChilds(_childs[i][opt.idField]);
					}
				}
			}
			getChilds(pid);
			return childs;
		},
		/*
		*获取子级
		*/
		getChildrens : function(pid){
			var self = this
				,opt=this.configs
				,undef;
			
			var pid = pid === undef ? opt.root : pid;
			
			return opt._childrens[pid] === undef ? [] : opt._childrens[pid];
		},
		_getParentsList : function(tid){
			var self = this
				,opt=this.configs
				,root=opt.root
				,pids = [];
			var node = $.isPlainObject(tid) ? tid : self._getNode(tid);	
			if( node===false ) return [];
			var id = node[opt.idField];
			var pid = self._getParentID(id);
			while( 1 ) {
				if( !(pid in opt._data) ) break;
				pids.push( pid );	
				pid = self._getParentID(pid);
				if( pid === opt.root ) break;
			}
			return pids.reverse();
		},
		_isFirstNode : function(tid){
			var self = this
				,opt=this.configs;
			var _pid = self._getParentID(tid);
			return opt._firstNodes[_pid][opt.idField] === tid ? true : false;
		},
		_isLastNode : function(tid){
			var self = this
				,opt=this.configs;
			var _pid = self._getParentID(tid);
			return opt._lastNodes[_pid][opt.idField] === tid ? true : false;
		},
		getMenuItem : function(tnode){
			var self = this
				,opt=this.configs
				,spacers = [];
				
			var node = $.isPlainObject(tnode) ? tnode : self._getNode(tnode);
			if( node===false ) return '';
			
			if( self.isSplitLine( node ) ) {
				return '<div class="nex-menu-item-separator"><div class="nex-menu-line-h"></div></div>';	
			}
			
			var tid = node[opt.idField];
				
			var menuID = [opt.id,'_',node[opt.idField]].join("");
			
			var _pid = self._getParentID(tid);
			var liCls='';
			if( opt._firstNodes[_pid][opt.idField] === tid ) {
				liCls = 'nex-menu-first';	
				if( opt._firstNodes[opt.root][opt.idField] === tid ) {
					liCls+=' nex-menu-first-all';
				}
			}
			if( opt._lastNodes[_pid][opt.idField] === tid ) {
				liCls = 'nex-menu-last';	
			}
			
			if( node[opt.disabledField] ) {
				liCls += ' nex-menu-item-disabled';		
			}
			
			var isLeaf = self.isLeaf(tid);
			
			self.fireEvent('onBeforeCreateItem',[ tid,liCls ]);
			
			var _s = [];
			var _bg = '';
			if( tnode[opt.iconField] ) {
				_bg = "background-image:url("+tnode[opt.iconField]+")";
			}
			
			_s.push(['<div id="',menuID,'_item" menuid="',tid,'" class="nex-menu-item ',liCls,'">'].join(""));
			if( opt.showMenuIcon ) {
				_s.push(['<span class="nex-menu-icon ',tnode[opt.iconClsField],'" style="',_bg,'"></span>'].join(''));	
			}
			_s.push(['<span class="nex-menu-title">',node[opt.textField],'</span>'].join(''));
			if( !isLeaf ) {
				_s.push(['<span class="nex-menu-arrow">&nbsp;</span>'].join(''));
			}
			_s.push('</div>');
			
			self.fireEvent('onCreateItem',[ tid,_s ]);
			
			return _s.join('');
		},
		_isRoot : function(tid){
			var self = this
				,opt=this.configs;	
			return (tid === opt.root) ? true : false;
		},
		_bindUpBtnEvent : function( up,menu ){ 
			var self = this
				,opt=this.configs;	
			var menu = menu || down.parent();	
			var wraper = $('>.nex-menu-items-wraper',menu);
			var down = $('>.nex-menu-down',menu);
			
			up.bind({
				mouseenter : function(){
					var i = parseInt(wraper.css( 'margin-top' ));
					var tid = $(this).attr('menuid');
					self.hideAllMenu2( tid );
					down.show();
					if( opt._t_down ) {
						clearInterval( opt._t_down );		
					}
					opt._t_down = setInterval(function(){
													   
						i = i+opt._speedNum;
						i = Math.min(i,0);
						wraper.css({
							'margin-top' : i								  
						});		
						
						if( i>=0 ) {
							up.hide();
							clearInterval( opt._t_down );	
						}
						
					},opt._speedTime);	
				},
				mouseleave : function(){
					clearInterval( opt._t_down );	
				}		  
			});
			
			
		},
		_bindDownBtnEvent : function( down,menu ){ 
			var self = this
				,opt=this.configs;	
			var menu = menu || down.parent();	
			var up = $('>.nex-menu-up',menu);
			var wraper = $('>.nex-menu-items-wraper',menu);
			var h1 = $(menu).height(),
				h2 = wraper.outerHeight();
			var diff = h2 - h1;
			down.bind({
				mouseenter : function(){
					var i = -parseInt(wraper.css( 'margin-top' ));
					var tid = $(this).attr('menuid');
					self.hideAllMenu2( tid );
					up.show();
					if( opt._t_down ) {
						clearInterval( opt._t_down );		
					}
					opt._t_down = setInterval(function(){
													   
						i = i+opt._speedNum;
						i = Math.min(i,diff);
						wraper.css({
							'margin-top' : -i								  
						});		
						
						if( i>=diff ) {
							down.hide();
							clearInterval( opt._t_down );	
						}
						
					},opt._speedTime);	
				},
				mouseleave : function(){
					clearInterval( opt._t_down );	
				}		  
			});
			
			
		},
		_checkMenuHeight : function( tid,menu ){
			var self = this
				,opt=this.configs;	
			if( !menu ) return false;
			var h1 = $(menu).height(),
				h2 = $('>.nex-menu-items-wraper',menu).outerHeight();
			if( h2 <= h1 ) return false;

			var up = $('<div class="nex-menu-up" menuid="'+tid+'"></div>'),
				down = $('<div class="nex-menu-down" menuid="'+tid+'"></div>');
			
			menu.append( up );	
			menu.append( down );
			
			up.hide();
			
			self._bindUpBtnEvent(up,menu);
			self._bindDownBtnEvent(down,menu);
			
			self.fireEvent('onMenuScrollBtnCreate',[tid,up,down,opt]);
			
		},
		/*
		*事件绑定 注：并没有阻止事件冒泡
		*/
		_bindMenuEvent : function(lis){
			var self = this
				,opt=this.configs;	
			var menus = opt._data;
			var callBack = function(type,e){
				var tid = $(this).attr('menuid');
				var node = self._getNode(tid);
				var r = true;
				if( (type in node) && $.isFunction(node[type]) ) {
					r = node[type].apply(self,[this,tid,menus[tid],e]);
				}
				if( r!==false ) {
					r = self.fireEvent(type,[ this,tid,menus[tid],e ]);
				}
				if( r === false ) {
					e.stopPropagation();
					e.preventDefault();
				}
			};
			var events = {
				'click' : function(e) {
					callBack.call(this,'onClick',e);
				},
				'dblclick' : function(e) {
					callBack.call(this,'onDblClick',e);
				},
				'keydown' : function(e) {
					callBack.call(this,'onKeyDown',e);
				},
				'keyup' : function(e) {
					callBack.call(this,'onKeyUp',e);
				},
				'keypress' : function(e){
					callBack.call(this,'onKeyPress',e);
				},
				'mouseenter' : function(e){
					callBack.call(this,'onMouseOver',e);
				},
				'mouseleave' : function(e){
					callBack.call(this,'onMouseOut',e);
				},
				'mousedown' : function(e) {
					callBack.call(this,'onMouseDown',e);
				},
				'mouseup' : function(e) {
					callBack.call(this,'onMouseUp',e);
				},
				'contextmenu' : function(e){	
					callBack.call(this,'onContextMenu',e);
				}
			};
			
			lis.bind(events);
			
			self.fireEvent('onBindMenuEvents',[ lis,events,opt ]);
		},
		bindMenuEvent : function(menu){
			var returnfalse = function(){return false;};
			$(menu).bind({
				'mousedown' : returnfalse,
				'mouseover' : returnfalse,
				contextmenu : returnfalse,
				click : returnfalse
			});
			this._bindMenuEvent($(">.nex-menu-item",menu));	
		},
		/*
		*创建Tree但不显示
		*/
		_bulidMenu : function(tid){
			var self = this
				,opt=this.configs;	
			var tid = self._undef(tid,opt.root);
			if( self.isLeaf( tid ) ) {
				return false;	
			}
			
			var node = self._getNode(tid);
			
			var menuID = [opt.id,'_',tid].join("");
			var menu = $("#"+menuID);
			var r = self.fireEvent('onBeforeBulidMenu',[ menu,tid,opt ]);
			if( r === false ) return false;
			
			var createMenu = function(){
				var childrens = self._undef(opt._childrens[ tid ],[]);;
				var menuCls = ['nex-menu'];
				if( opt.border ) {
					menuCls.push( opt.borderCls );	
				}
				menuCls.push( opt.cls );
				
				Nex.zIndex = Nex.zIndex + 2;
				
				var menu = ['<div id="',menuID,'" style="z-index:',Nex.zIndex,'" class="',menuCls.join(' '),'">'];
				menu.push('<div class="nex-menu-items-wraper" id="'+opt.id+'_items_wraper">')
				menu.push(opt.showMenuVLine ? '<div class="nex-menu-line-v"></div>' : '');
				for( var i=0;i<childrens.length;i++ ) {
					menu.push( self.getMenuItem(childrens[i]) );
				}
				menu.push('</div></div>');
				menu = $(menu.join(""));
				
				var render = $(opt.renderTo);
				render.append(menu);
				
				opt.height = menu._outerHeight();
				opt.width = node.width ? node.width : menu._outerWidth();
				
				var maxWidth = opt.maxWidth,maxHeight = opt.maxHeight;
				var mh = render.is('body') ? $(window) : render;
				if(!opt.maxWidth) {
					maxWidth = mh.width();	
				}
				if(!opt.maxHeight) {
					maxHeight = mh.height();	
				}
				
				if( opt.minWidth>0 ) {
					opt.width = Math.max(opt.width,opt.minWidth);
				}
				if( opt.minHeight>0 ) {
					opt.height = Math.max(opt.height,opt.minHeight);
				}
				if( maxWidth>0 ) {
					opt.width = Math.min(opt.width,maxWidth);
				}
				if( maxHeight>0 ) {
					opt.height = Math.min(opt.height,maxHeight);
				}
				
				var cutH = self._getCutHeight(),
					cutW = self._getCutWidth();
				opt.height -= cutH;
				opt.width -= cutW;
				
				menu._outerHeight(opt.height);
				menu._outerWidth(opt.width);
				
				return menu;
			};
			
			if( !menu.length ) {
				menu = createMenu();
				
				menu.bind('selectstart.menu',function(){return false;});	
				
				self.fireEvent('onBulidMenu',[ menu,tid,opt ]);
				
				self.bindMenuEvent($('>.nex-menu-items-wraper',menu));
				
				if( opt.showMenuMore ) {
					self._checkMenuHeight( tid,menu );	
				}
				
			}
			
			return menu;
		},
		_createMenu : function(tid){
			var self = this
				,opt=this.configs
				,undef
				,pids = [];	
			if( tid === undef ) return false;
			
			var node = self._getNode(tid);
			if( node === false && !self._isRoot(tid) ) return false ;
			
			var tree = self._bulidMenu(tid);
			if( tree === false ) return false;
			if( node ) {
				node[opt.openField] = true;
			}
			//$("#"+opt.id+'_'+tid+'_wraper').addClass("nex-tree-open");
			
			self.fireEvent('onCreateMenu',[tid,opt]);
			
			return tree;
		},
		showMenu : function(tid,m){//m == true 默认显示 m==false 不显示
			var self = this
				,opt=this.configs
				,undef;	
			var tid = self._undef(tid,opt.root);		
			var m = m === undef ? true : m;
			
			if( self.isLeaf(tid) ) {
				return false;	
			}
			
			var r = self.fireEvent('onBeforeShowMenu',[tid,opt]);//CreateMenu
			if( r === false ) return false;
			
			var menu = self._createMenu(tid);
			
			if( m ) {
				menu.show();	
			}
			
			if( menu ) {
				$("#"+opt.id+"_"+tid+"_item").addClass("nex-menu-item-active");
			}
			self.fireEvent('onShowMenu',[tid,opt]);
			return menu;
		},
		createMenu : function(tid){
			return this.showMenu(tid,0);	
		},
		hideMenu : function(menuid){
			var self = this,
				opt=this.configs,	
				undef;		
			if( menuid === undef ) return true;
			var treeID = [opt.id,'_',menuid].join("");
			
			var r = self.fireEvent('onBeforeHideMenu',[menuid,opt]);
			if( r === false ) return false;
			
			if( opt.hideToRemove ) {
				$("#"+treeID).remove();
			} else {
				$("#"+treeID).hide();
			}
			
			$("#"+treeID+'_shadow').remove();
			
			$("#"+opt.id+"_"+menuid+"_item").removeClass("nex-menu-item-active");	
			
			self.fireEvent('onHideMenu',[menuid,opt]);
			
			return true;
		},
		hideAllMenu2 : function(pid,m){
			var self = this,
				opt=this.configs;	
			var pid = self._undef(pid,opt.root);

			var allChilds = self.getAllChildrens(pid);
			
			for( var i=0;i<allChilds.length;i++ ) {
				var tid = allChilds[i][opt.idField];
				var isLeaf = self.isLeaf(tid);
				if( !isLeaf ) {
					self.hideMenu(tid);
				}	
			}
		},
		/*
		* 隐藏当前同级item列表下所有的contextmenu
		*/
		hideAllMenu : function(pid,m){
			var self = this,
				opt=this.configs;	
			var pid = self._undef(pid,opt.root);
			pid = self._isRoot( pid ) ? pid : self._getParentID(pid);
			var allChilds = self.getAllChildrens(pid);
			if( m ) {
				self.hideMenu(pid);
			}
			for( var i=0;i<allChilds.length;i++ ) {
				var tid = allChilds[i][opt.idField];
				var isLeaf = self.isLeaf(tid);
				if( !isLeaf ) {
					self.hideMenu(tid);
				}	
			}
		},
		hideRoot : function(){
			this.hideAllMenu(undefined,1);
		},
		hideLeveMenu : function(level){
			var self = this,
				opt=this.configs,
				undef;	
			if( level === undef ) return true;
			var menus = opt._levelData[ level ];
			for( var i=0;i<menus.length;i++ ) {
				self.hideMenu( menus[i][opt.idField] );	
			}
			return true;
		},
		/*
		*IE9以下版本不支持shadow 属性 所以用其他方法实现
		*/
		_setShadow : function(source){
			var self = this,
				opt=this.configs,
				undef;	
			/*if( !opt.IEVer || opt.IEVer>=9 ) {
				return true;	
			}*/
			var shadowid = $(source).attr('id') + '_shadow';
			$("#"+shadowid).remove();
			var shadow = $('<div class="nex-menu-shadow" id="'+shadowid+'"><iframe class="nex-menu-shadow-iframe" frameborder="0"></iframe></div>');
			shadow.appendTo(opt.renderTo);
			shadow.width( $(source)._outerWidth() );
			shadow.height( $(source)._outerHeight() );
			shadow.css( $(source).offset() );
			shadow.css( "zIndex",$(source).css('z-index') - 1 );	
			return true;
		},
		_showAt : function(source,target,conf,animate){
			var self = this,
				opt=this.configs,
				undef;	
			var confs = {};
			var animate = animate === undef ? true : animate;
			$.extend( confs,opt.showConf,conf,{el:target} );
			if( !source ) {
				return ;
			}
			if( animate && opt.delay>0 ) {
				if( opt._t_delay ) {
					clearTimeout( opt._t_delay );
					opt._t_delay = 0;
				}
				opt._t_delay = setTimeout(function(){
					$(source).showAt(confs);
					if( opt.showShadow ) {
						self._setShadow( source );
					}	
				},opt.delay);	
			} else {
				$(source).showAt(confs);
				if( opt.showShadow ) {
					self._setShadow( source );
				}
			}
		},
		//显示根节点的时候 调用
		showAt : function(source,target,conf){
			this._showAt(source,target,conf,false);	
		}
	});
})(jQuery);
/*
jquery.nexAccordion.js
http://www.extgrid.com/accordion
author:nobo
qq:505931977
QQ交流群:13197510
email:zere.nobo@gmail.com or QQ邮箱

*/

;(function($){
	"use strict";
	var accordion = Nex.define('Nex.Accordion','Nex.Html').setXType('accordion');
	accordion.extend({
		version : '1.0',
		_Tpl : {
			accordion_item : '<div class="nex-accordion-item <%=cls%> <%=autoScroll? "nex-accordion-item-auto-scroll":""%> nex-accordion-expand" itemindex="<%=index%>" id="<%=id%>_accordion_item_<%=index%>">'
								+'<div class="nex-accordion-header" itemindex="<%=index%>" id="<%=id%>_accordion_<%=index%>_header" style="">'
								+'<span class="nex-accordion-title-text">'
									+'<% if( icon !== "" || iconCls !== "" ) {%>'
									+'<span class="title-icon <%=iconCls%>" style=" <%=icon === "" ? "" : "background:url("+icon+")"%> "></span>'
									+'<% } %>'
									+'<%=title%></span><div class="nex-accordion-tools"></div>'
								+'</div>'
								+'<div class="nex-accordion-body <%=bodyCls%>" itemindex="<%=index%>" id="<%=id%>_accordion_<%=index%>_body"></div>'
							+'</div>'		
		}
	});
	accordion.setOptions(function(opt,t){
		return {
			prefix : 'nexaccordion-',
			autoResize : true,
			containerCls : [opt.containerCls,'nex-accordion'].join(' '),
			autoScrollCls : [opt.autoScrollCls,'nex-accordion-auto-scroll'].join(' '),
			autoScroll : false,
			_hasBodyView : false,
			_checkScrollBar : false,
			itemHeaderSelectionable : false,
			showCollapseIcon : true,
			border : true,
			borderCls : 'nex-accordion-border',
			collapseIcon : 'accordion-collapse',
			collapseCallBack : null,
			animateShow : true,//开启动画方式切入accordion
			easing : 'easeOutCirc',
			animate : null,//可自定义切换函数
			animateTime : 300,
			expandOnEvent : 1,//0 mouseover 1 click 2 dblclick
			items : [],
			_item : function(){
				return {
					title : '',
					padding : 0,//body padding
					autoScroll : true,
					expand : false,//默认是否展开
					icon : '',
					iconCls : '',
					items : [],
					html : [],
					toolsItems : [],//更自由的自定义组件显示
					toolsIcons : [],//自定义图标显示 {icon:'abc',text:'',callBack:func}
					cls : '',
					bodyCls : ''	
				}
			},
			renderTo : document.body,
			width : 'auto',
			height : '100%',
			singleSelect : true,
			autoItemHeight : false,//选项卡item不设置高度
			/*maxWidth : function(){
				var renderTo = this.C('renderTo');	
				return $(renderTo).width();
			},
			maxHeight : function(){
				var renderTo = this.C('renderTo');	
				return $(renderTo).height();
			},*/
			events : {
				onStart : $.noop,
				onCreate : $.noop,
				onDestroy : $.noop
			}
		};	
	});
	accordion.fn.extend({
		_init : function(opt) {
			var self = this;
			self.setContainer()
				.setAccordionItems()
			    .initAccordion();
		},
		setContainer : function(){
			var self = this;
			var opt = self.C();
			Nex.Html.fn.setContainer.apply( self,arguments );
			var container = opt.views['container'];
			if( opt.border && opt.borderCls !== '' ) {
				container.addClass( opt.borderCls );	
			}
			return self;
		},
		_sysEvents : function(){
			var self = this;
			var opt = self.configs;
			
			Nex.Html.fn._sysEvents.apply(self,arguments);
			
			if( opt.expandOnEvent == 1 ) {
				self.bind('onItemClick',self._toggleItem);
			} else if( opt.expandOnEvent == 0 ) {
				self.bind('onItemMouseEnter',self._toggleItem);	
			} else {
				self.bind('onItemDblClick',self._toggleItem);	
			}
			self.bind('onSizeChange',self._refreshExpandItem);
			self.bind('onCreate',self._setExpandItem);
			return self;
		},
		setAccordionItems : function(){
			var self = this,
				undef,
				opt = self.configs,
				container = opt.views['container'],
				_item = opt._item;
			
			var items = $.isArray( opt.items ) ? opt.items : [ opt.items ];
		
			$.each( items , function(index,item){
				var item = $.extend( {},_item.call(self),item );
				item.index = index;
				item.id = opt.id;
				var tpl = $(self.tpl( 'accordion_item',item ));	
				container.append( tpl );
				var bd = $('>.nex-accordion-body',tpl);
				bd.css( "padding",item.padding );
				
				var tools = $('>.nex-accordion-header .nex-accordion-tools',tpl);
				/*add toolIcons*/
				if( item.toolsItems.length ) {
					self.addComponent( tools,opt.toolsItems );
				}
				if( opt.showCollapseIcon ) {
					item.toolsIcons.push({
						icon : opt.collapseIcon,
						callBack : opt.collapseCallBack
					});	
				}
				var len = item.toolsIcons.length;
				
				for( var i=0;i<len;i++ ) {
					var __d = {
						icon : '',
						text : '',
						callBack : null
					};
					var iconData = 	item.toolsIcons[i];
					iconData = $.extend( __d,iconData );
					
					if( !$._isPlainObject( iconData ) ) {
						continue;	
					}
					var _icon = $('<a class="nex-accordion-icon '+iconData.icon+'" hideFocus=true href="javascript:void(0)">'+iconData.text+'</a>');
					tools.append( _icon );
					(function(cdata){
						_icon.click(function(e){
							if( $.isFunction( cdata.callBack ) ) {
								var r = cdata.callBack.call( self,_icon,index,item,e );	
								if( r === false ) return r;
							}					 
						});	
					})(iconData);
				}
				
				self.fireEvent('onAccordionItemCreate',[tpl,opt]);
			} );
			
			var _items = $('>.nex-accordion-item',container);
			
			_items.each(function(){
				var item = $(this);
				var h = $('>.nex-accordion-header',item)._outerHeight();
				item.height( h );
			});
			
			self.bindAccordionItemsEvent( _items );
			
			if( !opt.itemHeaderSelectionable ) {
				$('>.nex-accordion-header',_items).disableSelection();	
			}
			
			self.fireEvent('onAccordionCreate',[_items,opt]);
			return self;	
		},
		bindAccordionItemsEvent : function(items){
			var self = this,
				undef,
				opt = self.configs,
				list = opt.items;
			var callBack = function(type,e){
				var index = $(this).attr('itemindex');
				var r = self.fireEvent(type,[ this,index,list[index],e,opt ]);
				if( r === false ) {
					e.stopPropagation();
					e.preventDefault();
				}
			};
			var hds = $('>.nex-accordion-header',items);	
			hds.bind({
				'click' : function(e) {
					callBack.call(this,'onItemClick',e);
				},
				'dblclick' : function(e) {
					callBack.call(this,'onItemDblClick',e);
				},
				'mouseenter' : function(e){
					callBack.call(this,'onItemMouseEnter',e);
				},
				'mouseleave' : function(e){
					callBack.call(this,'onItemMouseLeave',e);
				},
				'mouseover' : function(e){
					callBack.call(this,'onItemMouseOver',e);
				},
				'mouseout' : function(e){
					callBack.call(this,'onItemMouseOut',e);
				},
				'mousedown' : function(e) {
					callBack.call(this,'onItemMouseDown',e);
				},
				'mouseup' : function(e) {
					callBack.call(this,'onItemMouseUp',e);
				},
				'contextmenu' : function(e){	
					callBack.call(this,'onItemContextMenu',e);
				}
			});		
		},
		/*
		onViewSizeChange : function(func){
			var self = this,
				undef,
				opt = self.configs;
			self.setAccordionItemsSize();	
			Nex.html.fn.onViewSizeChange.apply(self,arguments);
		},
		*/
		_setViewSize : function(){
			var self = this,
				opt = self.configs;
			self.setAccordionItemsSize();		
			self.fireEvent("onSetViewSize",[opt]);	
		},
		setAccordionItemsSize : function(){
			var self = this,
				undef,
				opt = self.configs,
				container = opt.views['container'];	
			var width,height;
			
			var items = $('.nex-accordion-item',container);
			if( !items.size() )	return self;

			if( opt.realWidth !== 'auto' ) {
				width = container.width();
				items.each(function(){
					var item = $(this);
					item._outerWidth( width );	
					var w = item.width();
					$('>.nex-accordion-body',item)._outerWidth( w );
				});
			}
			if( !opt.autoItemHeight ) {
				height = container.height();
				var h = 0;
				items.each(function(){
					var item = $(this);
					var diffH = item.outerHeight() - item.height();
					h += $('>.nex-accordion-header',item)._outerHeight() + diffH;
				});
				items.each(function(){
					var item = $(this);
					$('>.nex-accordion-body',item)._outerHeight( height - h );
				});
			}
			return self;
		},
		_setExpandItem : function(){
			var self = this,
				undef,
				opt = self.configs,
				container = opt.views['container'],
				items = opt.items;
			var ids = [];	
			$.each(items,function(index,item){
				if( !$.isPlainObject(item) ) return;
				if( item.expand ) {
					ids.push( index );	
				}
			});	
			var _animate = opt.animateShow;
			opt.animateShow = false;
			if( opt.singleSelect ) {
				self.expandItem( ids.pop() );	
			} else {
				$.each( ids,function(i,index){
					self.expandItem( index );		
				} );	
			}
			opt.animateShow = _animate;
		},
		_refreshExpandItem : function(){
			var self = this,
				undef,
				opt = self.configs,
				container = opt.views['container'];	
			var collapses = $('>.nex-accordion-collapse',container);
			collapses.each( function(){
				var index = $(this).attr( 'itemindex' );
				self.expandItem( index,true );	
			} );			
		},
		_toggleItem : function( item,e,opt ){
			var self = this,
				undef,
				opt = self.configs,
				container = opt.views['container'];	
			
			var index = $(item).attr('itemindex');
			
			var item = $('#'+opt.id+'_accordion_item_'+index);
			if( !item.size() ) return; 	
			
			if(  item.hasClass('nex-accordion-collapse') ) {
				self.collapseItem( index );
			} else {
				self.expandItem( index );	
			}
		},
		expandItem : function( index,m ){
			var self = this,
				undef,
				m = m === undef ? false : true,
				opt = self.configs,
				container = opt.views['container'];		
			var item = $('#'+opt.id+'_accordion_item_'+index);
			if( !item.size() ) return false; 
			if( !m ) {
				if(  item.hasClass('nex-accordion-collapse') ) return true;
			}
			if( opt.singleSelect ) {
				var collapses = $('>.nex-accordion-collapse',container);
				collapses.each( function(){
					var index = $(this).attr( 'itemindex' );
					self.collapseItem( index );	
				} );
			}
			item.addClass('nex-accordion-collapse');	
			item.addClass('nex-accordion-active');	
			item.removeClass('nex-accordion-expand');
			
			var callBack = function(){
				self.fireEvent('onItemExpand',[index,item,opt]);
			};
			var hd = $( '>.nex-accordion-header',item );
			var bd = $( '>.nex-accordion-body',item );
			var h = hd._outerHeight() + bd.outerHeight();
			if( opt.animateShow ) {
				if( $.isFunction( opt.animate ) ) {
					opt.animate.apply( self,[ index,item,callBack,'expand' ] );	
				} else {
					item.stop(true)
					.animate({
						height : h
					},
					opt.animateTime,
					opt.easing,function(){
						callBack();	
					});	
				}
			} else {
				item.height( h );	
				callBack();	
			}
		},
		collapseItem : function( index , m ){
			var self = this,
				undef,
				opt = self.configs,
				container = opt.views['container'];		
			var item = $('#'+opt.id+'_accordion_item_'+index);
			if( !item.size() ) return false; 
			
			if(  item.hasClass('nex-accordion-expand') ) return true;
			
			item.addClass('nex-accordion-expand');	
			item.removeClass('nex-accordion-active');
			item.removeClass('nex-accordion-collapse');
			
			var callBack = function(){
				self.fireEvent('onItemCollapse',[index,item,opt]);
			};
			
			var hd = $( '>.nex-accordion-header',item );
			var h = hd.outerHeight();
			if( opt.animateShow ) {
				if( $.isFunction( opt.animate ) ) {
					opt.animate.apply( self,[index,item,callBack,'collapse'] );	
				} else {
					item.stop(true)
					.animate({
						height : h
					},
					opt.animateTime,
					opt.easing,function(){
						callBack();		
					});
				}
			} else {
				item.height( h );	
				callBack();	
			}
		},
		refreshItemContent : function( index ){
			var self = this,undef;	
			self._appendContent( index );	
		},
		_appendContent : function( index ){
			var self = this,undef;
			var opt = self.C();	
			var container = opt.views['container'];
			var items = opt.items;
			var _item = opt._item;
			var list;
			if( index !== undef ) {
				list = $('#'+opt.id+'_accordion_item_'+index);	
			} else {
				list = $(">.nex-accordion-item",container);
			}
			list.each(function(){
				var $this = $(this);
				var index = $this.attr('itemindex');
				var lbody = $('>.nex-accordion-body',$this);
				lbody.empty();
				var d = items[index];
				if( !d ) return;
				d = $.extend( _item.call(self),d );
				var _items = d['html'];
				self.addComponent( lbody,_items );
				var _items = d['items'];
				self.addComponent( lbody,_items );
			});
			
			return container;
		},
		initAccordion : function(){
			var self = this,
				undef,
				opt = self.configs;
				
			Nex.Html.fn.initComponent.apply(self,arguments);
				
		}
	});
})(jQuery);
/*
jquery.nexTree.js
http://www.extgrid.com/tree
author:nobo
qq:505931977
QQ交流群:13197510
email:zere.nobo@gmail.com or QQ邮箱
v1.0
1.新增 nodesSort 参数  可控制叶子节点显示先后
2.新增一个sortField 可控制显示位置 为以后的可拖拽做下基础 待实现
*/

;(function($){
	"use strict";
	var tree = Nex.widget('tree');

	$.nexTree = $.extTree = tree;
	
	tree.extend({
		version : '1.0',
		getDefaults : function(opt){
			var _opt = {
				prefix : 'nextree-',
				renderTo : document.body,
				isIE : !!window.ActiveXObject,
				url : '',//支持远程创建 返回数据格式  json
				cache : true,
				dataType : 'json',
				queryParams : {},
				method : 'get',
				parames : {},
				data : [],
				cls : '',
				showTreeLines : true,//显示节点线条
				showTreeIcon : true,//显示节点图标
				animate : true,//展开 收缩节点时的动画效果
				animateTime : 100,
				_animateTime : {},
				_data : {},//树形元数据 数据状态字段 _NexTree_status_ 1 已经被删除
				_childrens : {},//当前节点下的子节点 _NexTree_status_ == 1 已经被删除
				_levelData : {},//level=>[]
				_firstNodes : {},// 0:node1,1:node2 k=>v k表示第几级
				_lastNodes : {},// 0:node1,1:node2 k=>v k表示第几级
				expandOnEvent : 2,//0 不开启 1单击展开 2双击展开
				expandOnLoad : false,
				simpleData : false,
				root : '0',//simpleData下可不用设置且只在初始化时有效，初始化后会用showRowId代替
				showRootId : '0',//请设置对应的顶层ID 非simpleData下可不用设置
				iconField : 'icon',//图标字段 样式
				iconClsField : 'iconCls',//图标字段 样式
				idField : 'id',
				textField : 'text',
				openField : 'open',
				levelField : '_level',
				parentField : 'pid',
				childrenField : 'children',
				sortable : true,
				sortField : 'order',//order field 默认会为 0 系统强制设置 1 2 3 4 ...
				sortOrder : 'asc',//asc desc
				groupNode : true,//开启后会对叶子和节点进行分类
				nodesSort : 1,//开启groupNode后 1 叶子节点放到最后， 2叶子节点放到最前
				singleSelect : true,
				_selectNodes : {},//选择的行
				allowDrag : false,//是否允许拖拽节点
				allowDrop : false,//是否允许投放节点
				//removeOnCollapse : true,//收缩节点被删除。极大提升性能。
				events : {
					onStart : $.noop,
					onCreate : $.noop,
					onSizeChange : $.noop,
					onClick : $.noop,
					onDblClick : $.noop,
					onFocus : $.noop,
					onBlur : $.noop,
					onKeyDown : $.noop,
					onKeyUp : $.noop,
					onKeyPress : $.noop,
					onMouseOver : $.noop,
					onMouseOut : $.noop,
					onPaste : $.noop,
					onMouseDown : $.noop,
					onMouseUp : $.noop,
					onDestroy : $.noop
				}
			};
			
			var _opt = this.extSet(_opt);
			
			return $.extend({},_opt,opt);
		}
	});
	$.nexTree.fn.extend({
		_init : function(opt) {
			var self = this;
			
			self._mapTree(opt.data);
			
			self.show();
		},
		_sysEvents : function(){
			var self = this;
			var opt = self.configs;
			self.bind("onMouseOver.over",self.onMouseOver,self);
			self.bind("onMouseOut.over",self.onMouseOut,self);
			self.bind("onClick.select",self._selectNode,self);
			self.bind("onClick.expand",self.toExpandClick,self);
			self.bind("onDblClick.expand",self.toExpandDblClick,self);
			//处理用户多选 单选 和其他图标
			self.bind("onBeforeCreateItem.icon",self._setNodeIcon,self);
			
			return self;
		},
		toExpandClick : function(li,tid,tree,e){
			var self = this,
				opt=this.configs;
			var target = e.srcElement ? e.srcElement : e.target;
			
			if( opt.expandOnEvent === 1 ) {
				self.toggleNode(tid);
			} else if( $(target).hasClass(opt.showTreeLines?'nex-tree-expander':'nex-tree-expander-nl') || $(target).hasClass('nex-tree-expander-end') ) {
				self.toggleNode(tid);
			}
			
		},
		toExpandDblClick : function(li,tid){
			var self = this,
				opt=this.configs;
			if( opt.expandOnEvent === 2 ) {
				self.toggleNode(tid);
			}
		},
		_setNodeIcon : function(tid,liCls,spacers){
			var self = this,
				opt=this.configs;
			var icon = self._getNode(tid,opt.iconClsField);
			//nex-tree-icon icon-folder icon-file
			if( opt.showTreeIcon ) {
				var icons = ['nex-tree-icon'];
				if( self.isLeaf( tid ) ) {
					icons.push( 'nex-tree-file' );
					if( icon !== undefined )
						icons.push( icon );
				} else {
					icons.push( 'nex-tree-folder' );
					if( icon !== undefined )
						icons.push( icon );
				}
				spacers.push( icons.join(' ') );
			}	
		},
		onMouseOver : function(li,tid){
			$(">.nex-tree-item-wraper",li).addClass("nex-tree-item-over");
		},
		onMouseOut : function(li,tid){
			$(">.nex-tree-item-wraper",li).removeClass("nex-tree-item-over");	
		},
		_getNode : function(tid,pro){
			var self = this,
				opt=this.configs,
				undef;	
			//var node = opt._data[ opt._tfix+tid ];
			var node = opt._data[ tid ];
			
			if( node === undef ) {
				return false;	
			}
	
			return pro===undef ? node : node[pro];
		},
		getNode : function(tid,pro){
			return this._getNode( tid,pro );	
		},
		_getParentID : function(tid){
			var self = this,
				opt=this.configs,
				undef;	
			var pid = self._getNode(tid,opt.parentField);
			return tid+'' === opt.root+'' ? opt.root : 	pid;
		},
		getParentID : function(tid){
			return this._getParentID( tid );	
		},
		_parseSimpleData : function(data,pid){
			var self = this,
				opt=this.configs;	
			var undef;
			var _ids = {};
			for( var i=0;i<data.length;i++ ) {
				var node = data[i];
				
				if( node[opt.parentField] === undef ) {
					node[opt.parentField] = pid === undef ? opt.root : pid;
					node[opt.levelField] = pid === undef ? 0 : self._getNode(pid,opt.levelField)+1;
				} else {
					node[opt.levelField] = 	self._getNode(node[opt.parentField],opt.levelField)+1;
				}
				if( !(opt.idField in node) ) {
					node[opt.idField] = 'tree_'+self.unique();	
				} else{
					if(node[opt.idField].toString().length<=0) {
						node[opt.idField] = 'tree_'+self.unique();		
					}
				}
				
				opt._data[ node[opt.idField] ] = node; 
				
				var _pid = node[opt.parentField];
				opt._childrens[ _pid ] = opt._childrens[ _pid ] === undef ? [] : opt._childrens[ _pid ];
				var childs = opt._childrens[ _pid ];
				childs.push(node);
				//levelData
				var _lv = node[opt.levelField];
				opt._levelData[ _lv ] = opt._levelData[ _lv ] === undef ? [] : opt._levelData[ _lv ];
				var levels = opt._levelData[ _lv ];
				levels.push(node);
				
				_ids[_pid] = true;
				
			}	

			//for( var nid in _ids ) {
				//self.updateLastNodes( nid );
			//}
		},
		//解析数据
		_mapTree : function(data,pid){
			var self = this,
				opt=this.configs;	
			var undef;
			if( opt.simpleData ) {
				self._parseSimpleData(data,pid);
				return self;
			}
			var childrenField = opt.childrenField;
			for( var i=0;i<data.length;i++ ) {
				var node = data[i];
				node[opt.levelField] = pid === undef ? 0 : self._getNode(pid,opt.levelField)+1;
				node[opt.parentField] = pid === undef ? opt.root : pid;
				
				if( !(opt.idField in node) ) { 
					node[opt.idField] = 'tree_'+self.unique();	
				}
				
				opt._data[ node[opt.idField] ] = node; 
				
				var _pid = node[opt.parentField];
				opt._childrens[ _pid ] = opt._childrens[ _pid ] === undef ? [] : opt._childrens[ _pid ];
				var childs = opt._childrens[ _pid ];
				childs.push(node);
				//levelData
				var _lv = node[opt.levelField];
				opt._levelData[ _lv ] = opt._levelData[ _lv ] === undef ? [] : opt._levelData[ _lv ];
				var levels = opt._levelData[ _lv ];
				levels.push(node);
				
				if( ( childrenField in node ) && node[childrenField].length ) {
					self._mapTree(node[childrenField],node[opt.idField]);
				}
				
				//if( (i+1) === data.length ) {
					//self.updateLastNodes( _pid );
				//}
				
			}	
			return self;
		},
		/*
		* 对指定list进行 分组
		*/
		_groupNodes : function(list){
			var self = this,
				opt=this.configs,
				undef;
			
			//var pid = pid === undef ? opt.root : pid;
			var _d = list || [];//opt._childrens[ pid ];
			
			if( !opt.groupNode ) return _d;
			
			var nodes=[],leafs=[];
			var len = _d.length;
			for( var i=0;i<len;i++ ) {
				if(self.isLeaf( _d[i] )) {
					leafs.push( _d[i] );	
				} else {
					nodes.push( _d[i] );		
				}
			}
			if( opt.nodesSort+'' === '1' ) {
				_d = nodes.concat(leafs);
			} else if( opt.nodesSort+'' === '2' ) {
				_d = leafs.concat(nodes);	
			}
			
			return _d;
		},
		/*
		*动态对item分组 或者 排序
		*/
		groupNodes : function(pid){
			var self = this,
				opt=this.configs,
				undef;
			var pid = pid === undef ? opt.root : pid;		
			var p = self.getItemDom( pid );
			var isRoot = self._isRoot( pid );
			if( !p ) return false;
			if( !isRoot && !tree._getNode(pid,opt.openField) ) return false;
			var childrens = self._groupNodes( self._getTreeItemsData( pid ) );	
			
			$.each( childrens,function( i,node ){
				var id = node[opt.idField];
				var el = self.getItemDom( id );
				if( el ) {
					p.append( el );		
				}
			} );
			return true;
		},
		sortNodes : function(pid){
			return this.groupNodes( pid );	
		},
		/*
		*更新 第一个节点和最后一个节点的索引
		*/
		updateLastNodes : function(pid,list){
			var self = this,
				opt=this.configs,
				undef;
			var pid = pid === undef ? opt.root : pid;	
			var chlids = list || self.getChildrens(pid);//self.getChildrens(pid);//opt._childrens[pid];
			if( chlids.length ) {
				opt._firstNodes[pid] = chlids[0];
				opt._lastNodes[pid] = chlids[chlids.length-1];
			} else {
				opt._firstNodes[pid] = null;
				opt._lastNodes[pid] = null;	
			}
		},
		//对当前节点的子节点的排序数字重计算
		resetNodesOrder : function( pid ){
			var self = this
				,opt=this.configs
				,undef;	
			var childs = self.getChildrens( pid );
			//sortOrder
			var isAsc = opt.sortOrder === 'asc' ? true : false;
			var len = childs.length || 0;
			var sorts = {};
			$.each( childs,function(i,node){
				var index = isAsc ? i : --len;
				node[ opt.sortField ] = index;
				sorts[ node[opt.idField] ] = index;
			} );	
			self.fireEvent( 'onResetOrder',[ sorts,childs,opt ] );
		},
		_sortItems : function( list ){
			var self = this
				,opt=this.configs
				,undef;
			if( !$.isArray( list ) || !list.length ) {
				return list;	
			}	
			var isAsc = opt.sortOrder == "asc" ? true : false;	
			list.sort(function(a,b){
				a[opt.sortField] = self._undef(a[opt.sortField],0);
				b[opt.sortField] = self._undef(b[opt.sortField],0);
				if( a['_NexTree_status_'] === 1 || b['_NexTree_status_'] === 1 ) {
					return 1;
				}
				if( a[opt.sortField] >  b[opt.sortField] ) {
					return isAsc ? 1 : -1;
				} if( a[opt.sortField] === b[opt.sortField] ){
					return 0;
				} else {
					return isAsc ? -1 : 1;
				}
			});
			return list;
		},
		_selectNode : function(li,tid,d,e){
			var self = this
				,opt=this.configs
				,undef;
			self.selectNode(tid);	
		},
		unSelectNode : function(tid){
			var self = this
				,opt=this.configs
				,undef;
			if( tid === undef ) return false;	
			var r = self.fireEvent("onBeforeUnSelectNode",[tid,opt]);
			if( r === false ) return false;
			$("#"+opt.id+'_'+tid+'_wraper').removeClass("nex-tree-item-selected");
			opt._selectNodes[tid] = false;
			self.fireEvent("onUnSelectNode",[tid,opt]);
		},
		selectNode : function(tid){
			var self = this
				,opt=this.configs
				,undef;
			if( tid === undef ) return false;
			var r = self.fireEvent("onBeforeSelectNode",[tid,opt]);
			if( r === false ) return false;
			for( var i in opt._selectNodes ) {
				if(opt._selectNodes[i] && opt.singleSelect) {
					self.unSelectNode(i);	
				}
			}
			$("#"+opt.id+'_'+tid+'_wraper').addClass("nex-tree-item-selected");
			opt._selectNodes[tid] = true;
			self.fireEvent("onSelectNode",[tid,opt]);
		},
		isLeaf : function(node){
			var self = this
				,opt=this.configs
				,undef;
			if( node === opt.root ) return false;
			var tnode = $.isPlainObject(node) ? node : self._getNode(node);
			if( tnode === false && !self._isRoot(node) ) return true;
			if( self._isRoot(node) ) return false;
			if( tnode.leaf === undef ) {
				var tid = tnode[opt.idField];
				var childrens = self.getChildrens(tid);
				if( childrens.length ) {
					return false;	
				}
				//应该用getChildrens来判断是否有子节点
				/*var childrenField = opt.childrenField;
				if( (childrenField in tnode) && tnode[childrenField].length ) {
					return false;	
				}*/
				return true;	
			} else {
				return !!tnode.leaf;	
			}
		},
		getAllChildrens : function(pid) {
			var self = this
				,opt=this.configs
				,undef;
			var childs = [];
			var pid = self._undef(pid,opt.root);
			var getChilds = function(pid){
				var _childs = self.getChildrens(pid);
				if( _childs.length ) {
					childs = childs.concat(_childs);
					for( var i=0;i<_childs.length;i++ ) {
						getChilds(_childs[i][opt.idField]);
					}
				}
			}
			getChilds(pid);
			return childs;
		},
		/*
		*获取子级
		*/
		getChildrens : function(pid){
			var self = this
				,opt=this.configs
				,undef;

			var pid = pid === undef ? opt.root : pid;
			
			var childs = opt._childrens[pid] === undef ? [] : opt._childrens[pid];
			
			var list = [];
			for( var i=0;i<childs.length;i++ ) {
				var child = childs[i];
				if( ('_NexTree_status_' in child) && (child['_NexTree_status_'] === 1) ) continue;
				list.push( child );	
			}
			//设置回去 
			childs.length = 0;
			childs.unshift.apply( childs,list );//使用apply list会有长度限制 请注意
			return childs.concat([]);//返回一个新数组
			//return opt._childrens[pid] === undef ? [] : opt._childrens[pid];
		},
		/*删除节点数据  只删除数据*/
		_removeChildrenData : function(tid){
			var self = this
				,opt=this.configs
				,undef;
			
			if( tid === undef ) return false;	
			
			var node = self._getNode( tid );
			if( !node ) return false;
			
			var pid = self._getParentID(tid);
			
			//var r = self.fireEvent('onBeforeRemoveNodeData',[node,tid,pid,opt]);
			//if( r === false ) return r;
			
			node._NexTree_status_ = 1;//删除  废弃
			
			var list = opt._childrens[pid] || [];
			self.array_splice( function(d){
				if( d[opt.idField]+'' === tid+'' ) return true;	
			},list );
			
			self.updateLastNodes(pid);
			
			delete opt._data[ tid ];
			
			//self.fireEvent('onRemoveNodeData',[node,tid,pid,opt]);
						
			return true;
		},
		/*
		*添加节点 适合批量
		*/
		_addChildren : function(tid,data){
			var self = this,
				opt=this.configs,
				undef;	
			var d = !$.isArray( data ) ? [data] : data;	
			//var r = self.fireEvent('onBeforeAddChildren',[tid,data,opt]);	
			//if( r === false ) return false;
			self._mapTree(d,tid);
			self.refreshTree(tid);
			//self.fireEvent('onAddChildren',[tid,data,opt]);	
			self.resetNodesOrder(tid);
			return true;
		},
		addChildren : function(tid,data){
			var self = this,
				opt=this.configs,
				undef;	
			var d = !$.isArray( data ) ? [data] : data;	
			var r = self.fireEvent('onBeforeAddChildren',[tid,data,opt]);	
			if( r === false ) return false;
			
			self._addChildren( tid,data );
			
			self.fireEvent('onAddChildren',[tid,data,opt]);	
			return true;
		},
		refreshTreeAllItem : function(pid){
			var self = this
				,opt=this.configs
				,undef;
			self.refreshTreeItem( pid );			
			var childs = $.isArray( pid ) ? pid : self.getAllChildrens( pid );
			for( var i=0;i<childs.length;i++ ) {
				var chlid = childs[i];
				self.refreshTreeItem( chlid[opt.idField] );		
			}		
		},
		/*删除节点数据 单条数据删除*/
		_removeChildren : function(tid,f){
			var self = this
				,opt=this.configs
				,undef;
			var f = f === undef ? true : f;
			if( tid === undef ) return false;
			
			var pid = self._getParentID(tid);
			if( pid === false ) return false;
			
			//var r = self.fireEvent('onBeforeRemoveChildren',[tid,opt]);	
			//if( r === false ) return false;
			
			var r = self._removeChildrenData( tid );	
			if( !r ) return false;
			
			$('#'+opt.id+'_'+tid).remove();
			
			if( opt.showTreeLines && f ) {
				//addnode removenode 这里都有效率问题，不应该是全部更新，而应该分好几种情况，有时间再推算下
				/*var childs = self.getAllChildrens( pid );
				for( var i=0;i<childs.length;i++ ) {
					var chlid = childs[i];
					self.refreshTreeItem( chlid[opt.idField] );		
				}*/
				self.refreshTreeAllItem( pid );
				
			}
			//self.fireEvent('onRemoveChildren',[tid,opt]);				
			return true;
		},
		removeChildren : function(tid,f){
			var self = this
				,opt=this.configs
				,undef;
			var f = f === undef ? true : f;
			if( tid === undef ) return false;
			
			var r = self.fireEvent('onBeforeRemoveChildren',[tid,opt]);	
			if( r === false ) return false;
			
			var res = self._removeChildren( tid );	
			
			self.fireEvent('onRemoveChildren',[tid,opt]);		
			return res;
		},
		_addNodeData : function(tid,data,end){
			var self = this
				,opt=this.configs
				,undef;
			var d = !$.isArray( data ) ? [data] : data;	
			var end = self._undef( end,true );
			
			var childs = self.getChildrens( tid );
			//数据添加
			self._mapTree(d,tid);	
			var _childs = [];
			if( end ) {
				_childs = childs.concat( d );
			} else {
				_childs = d.concat( childs );	
			}
			opt._childrens[tid] = _childs;
			self.updateLastNodes(tid);
			self.resetNodesOrder(tid);
		},
		/*添加节点 适合单条数据添加 */
		_addNode : function(tid,data,end,expand){//expand 添加后是否展开 end后面添加
			var self = this
				,opt=this.configs
				,undef;
			//$.isPlainObject  _getNode
			if( tid === undef ) return false; 
			var node = self._getNode( tid );
			var isRoot = self._isRoot(tid);
			if( !node && !isRoot ) return false;
			
			//var r = self.fireEvent('onBeforeAddNode',[tid,data,end,expand,opt]);	
			//if( r === false ) return false;
			
			var expand = self._undef( expand,false );
			var end = self._undef( end,true );
			var d = !$.isArray( data ) ? [data] : data;	
			
			var childs = self.getAllChildrens( tid );
			
			self._addNodeData( tid,d,end );
			
			if( isRoot ) {
				node = {};
				node[opt.openField] = true;	
			}
			
			var ul = isRoot ? $('#'+opt.id) : $('#'+opt.id+'_'+tid+'_child');
			
			if( !ul.size() ) {
				if( expand ) {
					self.expandNode( tid );	
				}
				self.refreshTreeItem( tid );		
				//self.fireEvent('onAddNode',[tid,data,end,expand,opt]);	
				return true;	
			} else {
				if( !node[ opt.openField ] ) {
					if( expand ) {
						self.expandNode( tid );	
					}
				}	
			}
			if( opt.showTreeLines ) {
				//addnode removenode 这里都有效率问题，不应该是全部更新，而应该分好几种情况，有时间再推算下
				/*for( var i=0;i<childs.length;i++ ) {
					var chlid = childs[i];
					self.refreshTreeItem( chlid[opt.idField] );		
				}*/
				self.refreshTreeAllItem( tid );//chlid
			}
			var lis = [];
			for( var i=0;i<d.length;i++ ) {
				var li = $(self.getTreeItem( d[i] ));
				self._bindTreeEvent( li.find('>.nex-tree-item-wraper') );
				lis.push( li );
			}	
			if( !end ) {
				lis.reverse();	
			}
			for( var j=0;j<lis.length;j++ ) {
				ul[ end?'append':'prepend' ]( lis[j] );
			}
			//self.fireEvent('onAddNode',[tid,data,end,expand,opt]);	
			return true;
		},
		/*添加节点 适合单条数据添加 */
		addNode : function(tid,data,end,expand){
			var self = this
				,opt=this.configs
				,undef;	
			if( tid === undef ) return false; 
			var node = self._getNode( tid );
			var isRoot = self._isRoot(tid);
			if( !node && !isRoot ) return false;	
			var r = self.fireEvent('onBeforeAddNode',[tid,data,end,expand,opt]);	
			if( r === false ) return false;	
			
			var res = self._addNode( tid,data,end,expand );
			
			self.fireEvent('onAddNode',[tid,data,end,expand,opt]);	
			return res;
		}, 
		/*删除节点  tid可以是一个数组 适合批量*/
		_removeNode : function(tid){
			var self = this
				,opt=this.configs
				,undef;
			//var r = self.fireEvent('onBeforeRemoveNode',[tid,opt]);	
			//if( r === false ) return false;
			var d = !$.isArray( tid ) ? [tid] : tid;	
			var pids = {};
			for( var i=0;i<d.length;i++ ) {
				pids[ self._getParentID( d[i] ) ]=true;
				self._removeChildren( d[i],false );	
			}	
			$.each( pids,function(k,v){
				if( v ) {
					self.refreshTreeAllItem( k );	
				}	
			} );
			//self.fireEvent('onRemoveNode',[tid,opt]);
			return true;
		},
		removeNode : function( tid ){
			var self = this
				,opt=this.configs
				,undef;
			
			var r = self.fireEvent('onBeforeRemoveNode',[tid,opt]);	
			if( r === false ) return false;	
				
			var res = self._removeNode(tid);	
			
			self.fireEvent('onRemoveNode',[tid,opt]);	
			
			return res;
		},
		_afterNodeData : function(tid,data,after){
			var self = this
				,opt=this.configs
				,undef;
			var d = !$.isArray( data ) ? [data] : data;	
			var after = self._undef( after,true );	
			var pid = self._getParentID(tid);
			if( pid === false ) return false;
			
			var childs = self.getChildrens( pid );
			//数据添加
			self._mapTree(d,pid);	
			
			for( var i=0;i<childs.length;i++ ) {
				var child = childs[i];
				if( child[opt.idField]+'' === tid+'' ) break;
			}
			var s = after ? childs.slice(0,i+1) : childs.slice(0,i);
			var e = after ? childs.slice(i+1) : childs.slice(i);
			childs = s.concat( data,e );
			opt._childrens[pid] = childs;
			self.updateLastNodes(pid);
			self.resetNodesOrder(pid);
		},
		/*添加节点 适合单条数据添加 */
		_afterNode : function(tid,data,after,expand){//expand 添加后是否展开 after后面添加
			var self = this
				,opt=this.configs
				,undef;
			//$.isPlainObject  _getNode
			if( tid === undef ) return false; 
			var node = self._getNode( tid );
			if( !node ) return false;
			
			var expand = self._undef( expand,false );
			var after = self._undef( after,true );
			var d = !$.isArray( data ) ? [data] : data;	
			
			var pid = self._getParentID(tid);
			if( pid === false ) return false;

		//	var r = self.fireEvent('onBeforeAfterNode',[tid,data,after,expand,opt]);	
		//	if( r === false ) return false;
			
			var childs = self.getAllChildrens( pid );
			
			self._afterNodeData( tid,d,after );
			
			var isRoot = self._isRoot(pid);
			if( isRoot ) {
				node = {};
				node[opt.openField] = true;	
			}
			
			var ul = isRoot ? $('#'+opt.id) : $('#'+opt.id+'_'+pid+'_child');
			
			if( !ul.size() ) {
				if( expand ) {
					self.expandNode( pid );	
				}
				self.refreshTreeItem( tid );	
				//self.fireEvent('onAfterNode',[tid,data,after,expand,opt]);	
				return true;	
			} else {
				if( !node[ opt.openField ] ) {
					if( expand ) {
						self.expandNode( pid );	
					}
				}	
			}
			if( opt.showTreeLines ) {
				//addnode removenode 这里都有效率问题，不应该是全部更新，而应该分好几种情况，有时间再推算下
				/*for( var i=0;i<childs.length;i++ ) {
					var chlid = childs[i];
					self.refreshTreeItem( chlid[opt.idField] );		
				}*/
				self.refreshTreeAllItem( pid );//childs
			}
			var lis = [];
			for( var i=0;i<d.length;i++ ) {
				var li = $(self.getTreeItem( d[i] ));
				self._bindTreeEvent( li.find('>.nex-tree-item-wraper') );
				lis.push( li );
			}	
			if( after ) {
				lis.reverse();	
			}
			
			var li = $('#'+opt.id+'_'+tid);
			
			for( var j=0;j<lis.length;j++ ) {
				li[ after?'after':'before' ]( lis[j] );
			}
			//self.fireEvent('onAfterNode',[tid,data,after,expand,opt]);	
			return true;
		},
		afterNode : function(tid,data,after,expand){
			var self = this
				,opt=this.configs
				,undef;	
			if( tid === undef ) return false; 
			var node = self._getNode( tid );
			if( !node ) return false;
				
			var r = self.fireEvent('onBeforeAfterNode',[tid,data,after,expand,opt]);	
			if( r === false ) return false;
			
			var res = self._afterNode( tid,data,after,expand );	
			
			self.fireEvent('onAfterNode',[tid,data,after,expand,opt]);
			
			return res;
		},
		_moveNode : function(src,dist,pos){//src 需要移动的节点 dist drop节点 pos: 1前 2中 3后
			var self = this
				,opt=this.configs
				,undef;
			var pos = pos || 2;	
			if( src == dist ) return false;	
			var node = self._getNode( src );	
			if( !node ) return false;
			node = $.extend({},node);
			delete node[opt.childrenField];
			//opt._animateTime[ src ] = false;
			//console.log( src,opt._animateTime[ src ] );
			//delete node[opt.parentField]
			self._removeChildren( src );//false
			if( pos == 2 ) {
				self._addNode( dist,node,true );	
			} else if( pos == 1 ) {
				self._afterNode( dist,node,false );
			} else {
				self._afterNode( dist,node,true );	
			}
			self.refreshTreeItem( dist );		
			return true;
		},
		moveNode : function(src,dist,pos){//src 需要移动的节点 dist drop节点 pos: 1前 2中 3后
			var self = this
				,opt=this.configs
				,undef;
			var r = self.fireEvent('onBeforeMoveNode',[src,dist,pos,opt]);	
			if( r === false ) return false;
			var res = self._moveNode( src,dist,pos );
			self.fireEvent('onMoveNode',[src,dist,pos,opt]);
			return res;
		},
		_getParentsList : function(tid){
			var self = this
				,opt=this.configs
				,root=opt.root
				,pids = [];
			var node = $.isPlainObject(tid) ? tid : self._getNode(tid);	
			if( node===false ) return [];
			var id = node[opt.idField];
			var pid = self._getParentID(id);
			while( 1 ) {
				if( !(pid in opt._data) ) break;
				pids.push( pid );	
				pid = self._getParentID(pid);
				if( pid === opt.root ) break;
			}
			return pids.reverse();
		},
		_isFirstNode : function(tid){
			var self = this
				,opt=this.configs;
			var _pid = self._getParentID(tid);
			return opt._firstNodes[_pid][opt.idField] === tid ? true : false;
		},
		_isLastNode : function(tid){
			var self = this
				,opt=this.configs;
			var _pid = self._getParentID(tid);
			return opt._lastNodes[_pid][opt.idField] === tid ? true : false;
		},
		getTreeItemSpacer : function(tnode){
			var self = this
				,opt=this.configs
				,pids = [];
			var node = $.isPlainObject(tnode) ? tnode : self._getNode(tnode);
			if( node === false ) return [];
			//console.log(node);
			var n = node;
			var cpid = node[opt.idField];
			//pids.push(cpid);
			pids = self._getParentsList( cpid );
			//console.log(pids);
			var spacer = [];
			
			for( var i=0;i<pids.length;i++ ) {
				//是否最后一个节点
				var pid = pids[i];
				if( self._isRoot(pid) ) continue;
				if( self._isLastNode(pid) ) {
					spacer.push('nex-tree-empty');	
				} else {
					spacer.push(opt.showTreeLines ? 'nex-tree-line' : 'nex-tree-empty');
				}
			}	
			
			if( self.isLeaf(cpid) ) {
				var d = opt._data;
				var j=0;
				for( var x in d ) {
					j++;
					if( j>=2 ) break;
				}
				if(j>1) {
					if( self._isLastNode(cpid) ) {
						spacer.push(opt.showTreeLines ? 'nex-tree-elbow-end':'nex-tree-empty');
					} else {
						spacer.push(opt.showTreeLines ? 'nex-tree-elbow':'nex-tree-empty');
					}
				} else {
					spacer.push('nex-tree-empty');//如果树形只有一条记录 可以显示nex-tree-empty nex-tree-elbow-end		 
				}
			} else {
				//spacer.push('nex-tree-expander');	
				if( self._isLastNode(cpid) ) {
					spacer.push(opt.showTreeLines ? 'nex-tree-expander-end':'nex-tree-expander-nl');
				} else {
					spacer.push(opt.showTreeLines ? 'nex-tree-expander' : 'nex-tree-expander-nl');
				}
			}
			self.fireEvent('onGetSpacers',[ cpid,spacer ]);
			return spacer;
		},
		getItemDom : function(tid){
			var self = this
				,opt=this.configs
				,undef;	
			var node = self._isRoot(tid) ? $('#'+opt.id) : $("#"+opt.id+'_'+tid);	//isRoot ? $('#'+opt.id) : $('#'+opt.id+'_'+pid+'_child')
			return node.length ? node : null;
		},
		getTreeItem : function(tnode){
			var self = this
				,opt=this.configs
				,spacers = [];
			var node = $.isPlainObject(tnode) ? tnode : self._getNode(tnode);
			if( node===false ) return '';
			
			var tid = node[opt.idField];
				
			var spacers = self.getTreeItemSpacer(node);
			var treeID = [opt.id,'_',node[opt.idField]].join("");
			
			var _pid = self._getParentID(tid);
			var liCls='';
			if( opt._firstNodes[_pid][opt.idField] === tid ) {
				liCls = 'nex-tree-first';	
				if( opt._firstNodes[opt.root][opt.idField] === tid ) {
					liCls+=' nex-tree-first-all';
				}
			}
			if( opt._lastNodes[_pid][opt.idField] === tid ) {
				liCls = 'nex-tree-last';	
			}
			liCls = [ liCls ];
			var _len = spacers.length;
			self.fireEvent('onBeforeCreateItem',[ tid,liCls,spacers ]);
			
			var _s = [];
			var _bg = '';
			if( tnode[opt.iconField] ) {
				_bg = "background-image:url("+tnode[opt.iconField]+")";
			}
			
			_s.push(['<li id="',treeID,'" class="nex-tree-item" treeid="',tid,'"><div id="',treeID,'_wraper" treeid="',tid,'" class="nex-tree-item-wraper ',liCls.join(' '),'">'].join(""));
			var bg = '';
			for( var i=0;i<spacers.length;i++ ) {
				var bg = '';
				if( i == _len ) {
					bg = _bg;	
				}
				_s.push(['<span class="nex-tree-indent ', spacers[i] ,'" style="',bg,'"></span>'].join(''));	
			}
			_s.push(['<span class="nex-tree-title">',node[opt.textField],'</span>'].join(''));
			_s.push('</div></li>');
			
			self.fireEvent('onCreateItem',[ tid,_s ]);
			
			return _s.join('');
		},
		refreshTreeItem : function(tid){
			var self = this
				,opt=this.configs;	
			var node_tree = $("#"+opt.id+'_'+tid);
			if( !node_tree.length ) return false;
			var newItem = $(self.getTreeItem(tid)).find('>.nex-tree-item-wraper').html();
			node_tree.find('>.nex-tree-item-wraper').html(newItem);	
			return tree;
		},
		_isRoot : function(tid){
			var self = this
				,opt=this.configs;	
			return (tid === opt.root) ? true : false;
		},
		/*
		*事件绑定 注：并没有阻止事件冒泡
		*/
		_bindTreeEvent : function(lis){
			var self = this
				,opt=this.configs;	
			var trees = opt._data;
			var callBack = function(type,e){
				var target = e.srcElement ? e.srcElement : e.target;
				var el = $(target).closest(".nex-tree-item-wraper");
				var tid = $(el).attr('treeid');
				var _tid = $(this).attr('treeid');
				if( tid !== _tid ) return;
				var node = self._getNode(tid);
				if( !node ) return;
				var r = true;
				if( (type in node) && $.isFunction(node[type]) ) {
					r = node[type].apply(self,[$(this).parent()[0],tid,trees[tid],e]);
				}
				if( r!==false ) {
					r = self.fireEvent(type,[ $(this).parent()[0],tid,trees[tid],e ]);
				}
				if( r === false ) {
					e.stopPropagation();
					e.preventDefault();
				}
			};
			var events = {
				'click.ntree' : function(e) {
					callBack.call(this,'onClick',e);
				},
				'dblclick.ntree' : function(e) {
					callBack.call(this,'onDblClick',e);
				},
				'keydown.ntree' : function(e) {
					callBack.call(this,'onKeyDown',e);
				},
				'keyup.ntree' : function(e) {
					callBack.call(this,'onKeyUp',e);
				},
				'keypress.ntree' : function(e){
					callBack.call(this,'onKeyPress',e);
				},
				'mouseover.ntree' : function(e){
					callBack.call(this,'onMouseOver',e);
				},
				'mouseenter.ntree' : function(e){
					callBack.call(this,'onMouseEnter',e);
				},
				'mouseout.ntree' : function(e){
					callBack.call(this,'onMouseOut',e);
				},
				'mouseleave.ntree' : function(e){
					callBack.call(this,'onMouseLeave',e);
				},
				'mousemove.ntree' : function(e){
					callBack.call(this,'onMouseMove',e);
				},
				'mousedown.ntree' : function(e) {
					callBack.call(this,'onMouseDown',e);
				},
				'mouseup.ntree' : function(e) {
					callBack.call(this,'onMouseUp',e);
				},
				'contextmenu.ntree' : function(e){	
					callBack.call(this,'onContextMenu',e);
				}
			};
			//lis.unbind('.ntree');
			lis.bind(events);
			
			self.fireEvent('onBindTreeEvents',[ lis,events,opt ]);
		},
		bindTreeEvent : function(tree){
			this._bindTreeEvent($(".nex-tree-item-wraper",tree));	//>li
		},
		/*
		*获取某个节点下的叶子节点，和getChildrens不同在于 会经过排序,分类等加工
		*/
		_getTreeItemsData : function(tid){
			var self = this
				,opt=this.configs;	
			var tid = self._undef(tid,opt.root);	
			var childrens = self.getChildrens(tid);//self._undef(opt._childrens[ tid ],[]);
			if( opt.sortable ) {
				var sr = self.fireEvent('onBeforeSortTreeData',[ tid,childrens,opt ]);
				if( sr !== false ) {
					childrens = self._sortItems( childrens );	
					self.fireEvent('onSortTreeData',[ tid,childrens,opt ]);
				}
			}
			childrens = self._groupNodes( childrens );
			self.fireEvent('onGetCreateTreeData',[ tid,childrens,opt ]);
			self.updateLastNodes( tid,childrens );
			return childrens;
		},
		/*
		*创建Tree但不显示
		*/
		_bulidTree : function(tid){
			var self = this
				,opt=this.configs;	
			var tid = self._undef(tid,opt.root);
			if( self.isLeaf( tid ) ) {
				return false;	
			}
			var isRoot = self._isRoot(tid);
			var treeID = isRoot ? opt.id : [opt.id,'_',tid,'_child'].join("");
			var tree = $("#"+treeID);
			
			var r = self.fireEvent('onBeforeBulidTree',[ tree,tid,opt ]);
			if( r === false ) return false;
			
			var createTree = function(){
				var childrens = self._getTreeItemsData(tid);
				var treeCls = isRoot ? 'nex-tree '+opt.cls : '';
				var tree = ['<ul id="',treeID,'" class="',treeCls,'">'];
				for( var i=0;i<childrens.length;i++ ) {
					tree.push( self.getTreeItem(childrens[i]) );
				}
				tree.push('</ul>');
				tree = $(tree.join(""));
				tree.hide();
				var render = isRoot ? $(opt.renderTo) : $("#"+opt.id+'_'+tid);
				render.append(tree);	
				//tree.slideDown();	
				return tree;
			};
			
			if( !tree.length ) {
				tree = createTree();
				self.bindTreeEvent(tree);
				if( isRoot ) {
					tree.bind('selectstart.tree',function(){return false;});	
				}
				self.fireEvent('onBulidTree',[ tree,tid,opt ]);
			}
			
			return tree;
		},
		showLoading : function(tid){
			var self = this,
				opt = self.configs;	
			$("#"+opt.id+'_'+tid+'_wraper').addClass('nex-tree-loading');
		},
		hideLoading : function(tid){
			var self = this,
				opt = self.configs;	
			$("#"+opt.id+'_'+tid+'_wraper').removeClass('nex-tree-loading');
		},
		jsonFilter : function(data){
			return data;	
		},
		/*
		* 设置ajax返回的数据
		* @json  {Array} 数据集
		*/
		metaData : function( tid,json ){
			var self = this,
				opt = self.configs;
			
			var d = json || {};
			
			var data = $.isArray(d) ? {data:d} : d;
			
			if( !('data' in data) ) {
				data['data'] = [];	
			}
			
			for( var c in data ) {
				opt[c] = data[c];
			}
			
			self._mapTree(opt.data,tid);
		},
		_loadSuccess : function(tid,data,successBack){
			var self = this,
				opt = self.configs;
			
			var dataType = opt.dataType.toLowerCase();
			
			var filter = dataType+'Filter';
			
			var data = data;
			
			if( filter in self ) {
				if( $.isFunction( self[filter] ) ) {
					data = self[filter].call(self,data);
				}
			} else if( filter in opt ) {
				if( $.isFunction( opt[filter] ) ) {
					data = opt[filter].call(self,data);
				}	
			} else if( filter in window ) {
				if( $.isFunction( window[filter] ) ) {
					data = window[filter].call(window,data);
				}	
			}
						
			self.fireEvent('onLoadSuccess',[tid,data,successBack,opt]);
			
			//json
			self.metaData(tid,data);
			
			self.hideLoading(tid);	
			
		},
		_loadError : function(tid,msg,errorBack,xmlHttp){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			
			self.hideLoading(tid);	
			
			self.fireEvent('onLoadError',[tid,msg,errorBack,xmlHttp,opt]);

		},
		loadTreeData : function(tid,successBack,errorBack){
			var self = this
				,opt=this.configs
				,undef;	
			var successBack = successBack || $.noop;
			var errorBack = errorBack || $.noop;
			var beforeSend = function(){
					var r = self.fireEvent('onBeforeLoad',[tid,opt]);
					if( r === false ) return false;
					self.showLoading(tid);	
				};
			var success = function(data){
				
				self._loadSuccess(tid,data,successBack);
				
				successBack.call(self);
				
			};
			var error = function(xmlHttp){
						//e.onLoadError.call(self,xmlHttp.responseText);
				var xmlHttp = $.isPlainObject( xmlHttp ) ? xmlHttp : {responseText:xmlHttp};
				
				self._loadError(tid,xmlHttp.responseText,errorBack,xmlHttp);
				
				errorBack.call(self,xmlHttp.responseText);
			};
			opt.queryParams[opt.idField] = tid;
			if( $.isFunction( opt.url ) ) {
				
				var _r = beforeSend();
				
				if( _r === false ) return;
				
				var data = opt.url.call(self,opt.queryParams,success,error);
				if( data !== undef ) {
					success(data);	
				}
				
			} else {
				$.ajax({
					url : opt.url,
					type : opt.method,
					cache : opt.cache,
					dataType : opt.dataType,
					data : opt.queryParams,
					beforeSend : beforeSend,
					success : success,
					error : error
				});	
			}	
		},
		isExpandNode : function(tid){
			var self = this
				,opt=this.configs
				,undef;
			if( tid === undef ) return false;
			
			if( self._isRoot(tid) ) return true;
			
			var node = self._getNode(tid);
			if( node === false ) return false ;
			return !!node[ opt.openField ];
		},
		toggleNode : function(tid){
			var self = this
				,opt=this.configs
				,undef;
			if( tid === undef ) return false;
			
			var node = self._getNode(tid);
			if( node === false ) return false;
			
			if( node[opt.openField] ) {
				self.collapseNode(tid);
			} else {
				self.expandNode(tid);	
			}
		},
		_expandNode : function(tid){
			var self = this
				,opt=this.configs
				,undef
				,pids = [];	
			if( tid === undef ) return false;
			
			var node = self._getNode(tid);
			if( node === false && !self._isRoot(tid) ) return false ;
			
			if( opt._animateTime[tid] ) {
				return false;	
			}

			pids = self._getParentsList( tid );
			
			for( var i=0;i<pids.length;i++ ) {
				var _tid = pids[i];
				var _node = self._getNode(_tid);
				//if( self._isRoot( _tid ) ) continue;
				if( _node !== false ) _node[opt.openField] = true;
				
				var tree = self._bulidTree(_tid);
				if( tree === false ) continue;
				tree.show();
				$("#"+opt.id+'_'+_tid+'_wraper').addClass("nex-tree-open");
			}
			
			var tree = self._bulidTree(tid);
			//console.log( 1,tree )
			if( tree === false ) return false;
			if( node ) {
				node[opt.openField] = true;
			}
			if( opt.animate ) {
				opt._animateTime[tid] = true;	
				tree.slideDown(opt.animateTime,function(){//.stop(true,true)
					opt._animateTime[tid] = false;										
				});	
			} else {
				tree.show();		
			}
			$("#"+opt.id+'_'+tid+'_wraper').addClass("nex-tree-open");
			
			self.fireEvent('onExpandNode',[tid,opt]);
			return true;
		},
		expandNode : function(tid){
			var self = this
				,opt=this.configs
				,undef;	
			var tid = self._undef(tid,opt.root);		
			if( self.isLeaf(tid) ) {
				return false;	
			}
			
			var r = self.fireEvent('onBeforeExpandNode',[tid,opt]);
			if( r === false ) return false;
			
			if( self.isEmptyData(tid) && opt.url ) {
				self.unbind("onLoadSuccess.url");
				self.bind("onLoadSuccess.url",function(tid,data){
					setTimeout(function(){
						var childrens = self.getAllChildrens(tid);
						for( var i=0;i<childrens.length;i++ ) {
							if( childrens[i][opt.openField] )
								self.expandNode(childrens[i][opt.idField]);	
						}
					},0);
				});
				self.loadTreeData(tid,function(){
					self._expandNode(tid);						   
				});
			} else {
				self._expandNode(tid);
				//BUG 待定
				/*setTimeout(function(){
					var childs = self.getChildrens( tid );
					$.each( childs,function(i,node){ 
						if( node[opt.openField] ) {
							self.expandNode( node[opt.idField] );
						}
					 } );
				},0); */
			}
		},
		_collapseNode : function(tid){
			var self = this
				,opt=this.configs
				,undef;	
			if( tid === undef ) return false;
			var node = self._getNode(tid);
			if( node === false || self._isRoot(tid) ) return false;
			if( opt._animateTime[tid] ) {
				return false;	
			}
			
			var isRoot = self._isRoot(tid);
			if( isRoot ) return false;
			var treeID = [opt.id,'_',tid,'_child'].join("");
			var tree = $("#"+treeID);
			if( opt.animate ) {
				if( tree.size() ) {
					opt._animateTime[tid] = true;	
					tree.slideUp(opt.animateTime,function(){//.stop(true,true)
						opt._animateTime[tid] = false;										
					});
				}
			} else {
				tree.hide();	
			}
			$("#"+opt.id+'_'+tid+'_wraper').removeClass("nex-tree-open");
			node[opt.openField] = false;
			self.fireEvent('onCollapseNode',[tid,opt]);
			return true;
		},
		collapseNode : function(tid){
			var self = this,opt=this.configs;
			var tid = self._undef(tid,opt.root);	
			var r = self.fireEvent('onBeforeCollapseNode',[tid,opt]);
			if( r === false ) return false;
			self._collapseNode(tid);
		},
		/*
		*打开当前节点的子节点
		*/
		expandChildrens : function(pid){
			var self = this,
				opt=this.configs;
			var pid = self._undef(pid,opt.root);	
			var childs = self.getChildrens(pid);
		
			for(var i=0;i<childs.length;i++) {
				if( self.isLeaf( childs[i] ) ) continue;
				//console.log(childs[i]);
				self.expandNode( childs[i][opt.idField] );	
			}
		},
		/*
		*打开当前节点下的所有子节点
		*/
		expandAll : function(pid){
			var self = this,
				opt=this.configs;	
			var pid = self._undef(pid,opt.root);
			var isRoot = self._isRoot(pid);
			//开启Url情况下 在 获取新值后自动展开
			if( opt.url ) {
				self.unbind("onLoadSuccess.expandAll");
				self.bind("onLoadSuccess.expandAll",function(tid,data){
					setTimeout(function(){
						self.expandAll(tid);					
					},0);
				});
			}
			var allChilds = self.getAllChildrens(pid);
			self.expandNode(pid);
			for( var i=0;i<allChilds.length;i++ ) {
				var tid = allChilds[i][opt.idField];
				var isLeaf = self.isLeaf(tid);
				if( !isLeaf ) {
					self.expandNode(tid);
				}	
			}
			/*for(var tid in opt._data) {
				
				if( !isLeaf && isRoot ) {
					self.expandNode(tid);
				} else if( !isLeaf ) {
					var pids = self._getParentsList(tid);
					if( self.inArray(pid,pids) !== -1 ) {
						self.expandNode(tid);	
					}
				}
			}*/
			
		},
		collapseChildrens : function(pid){
			var self = this,
				opt=this.configs;
			var pid = self._undef(pid,opt.root);	
			var childs = self.getChildrens(pid);
		
			for(var i=0;i<childs.length;i++) {
				if( self.isLeaf( childs[i] ) ) continue;
				//console.log(childs[i]);
				self.collapseNode( childs[i][opt.idField] );	
			}
		},
		collapseAll : function(pid){
			var self = this,
				opt=this.configs;	
			var pid = self._undef(pid,opt.root);
			
			var allChilds = self.getAllChildrens(pid);
			self.collapseNode(pid);
			for( var i=0;i<allChilds.length;i++ ) {
				var tid = allChilds[i][opt.idField];
				var isLeaf = self.isLeaf(tid);
				if( !isLeaf ) {
					self.collapseNode(tid);
				}	
			}
		
			/*for(var tid in opt._data) {
				var isLeaf = self.isLeaf(tid);
				if( !isLeaf && isRoot ) {
					self.collapseNode(tid);
				} else if( !isLeaf ) {
					var pids = self._getParentsList(tid);
					if( self.inArray(pid,pids) !== -1 ) {
						self.collapseNode(tid);	
					}
				}
			}	*/
		},
		isEmptyData : function(pid){
			var self = this,
				opt=this.configs,
				undef;
			var pid = self._undef(pid,opt.root);
			
			var childs = self.getChildrens(pid);
			
			return childs.length ? false : true;
		},
		
		/*
		*刷新某节点 整个节点都会重新创建
		*/
		refreshTree : function(pid){
			var self = this,
				opt=this.configs;	
			var pid = self._undef(pid,opt.root);
			var r = self.fireEvent('onBeforeRefreshTree',[pid,opt]);
			if( r === false ) return false;
			if( self._isRoot(pid) ) {
				$("#"+opt.id).remove();
				self.show();	
			} else {
				var _anmiate = 	opt.animate;
				opt.animate = false;
				var node = self._getNode(pid);
				if( node === false ) return false;
				
				var tree = $("#"+opt.id+'_'+pid);
				$('>ul',tree).remove();
				var newItem = $(self.getTreeItem(pid)).find('>.nex-tree-item-wraper').html();
				tree.find('>.nex-tree-item-wraper').html(newItem);
				
				if( node[opt.openField] ) {
					self.expandNode(pid);	
					var allChilds = self.getAllChildrens(pid);
					for( var i=0;i<allChilds.length;i++ ) {
						if( allChilds[i][opt.openField] ) {
							self.expandNode(allChilds[i][opt.idField]);	
						}	
					}
				} else {
				}
				opt.animate = _anmiate;
			}
			self.fireEvent('onRefreshTree',[pid,opt]);
		},
		show : function(){
			var self = this,
				opt=this.configs;	
			var _anmiate = 	opt.animate;
			opt.animate = false;
			opt.root = opt.showRootId;
			if( opt.expandOnLoad ) {
				self.expandAll(opt.root);	
			} else {
				self.expandNode(opt.root);
				for(var tid in opt._data) {
					if( opt._data[tid][opt.openField] ) {
						self.expandNode(tid);
					}	
				}
			}
			opt.animate = _anmiate;
		}
	});
	$.fn.nexTree = function(conf){
		var undef,opt;
		var conf = conf === undef ? {} : conf;
		opt = 	conf;
		var list = [];
		this.each(function(){
			opt.renderTo = $(this);
			var o = new Nex.tree(opt);
			list.push(o);
			$(this).data('nex.tree',o);
		});
		return list.length === 1 ? list[0] : list;
	};
	$.fn.extTree = $.fn.nexTree;
})(jQuery);
/*
jquery.nexTree.checkbox.js
http://www.extgrid.com
author:nobo
qq:505931977
QQ交流群:13197510
email:zere.nobo@gmail.com or QQ邮箱
+----------------------------------------------------------------------------------------------------------------------------+
*/

;(function($){
	"use strict";
	//参数
	$.nexTree.addExtConf(function(){
		return {
		  showCheckbox : false,//开启checkbox
		  simpleSelect : false,//单选or多选 开启后必须关闭 checkRecursive
		  checkedField : 'checked',
		  showRaidoButton : false,
		  showParentCheckBoxButton : true,
		  checkRecursive : true,//是否联动选择父子节点。比如选中父节点，自动全选子节点。
		  //autoCheckParent : false,//是否自动选择父节点。比如选中子节点，将父节点也自动选中。	
		  checkedNodes : {}
	   };	
	});
	//事件
	$.nexTree.addExtEvent(function(){
		return {
		 onBeforeSetChceckboxIcon:$.noop,
		 onSetChceckboxIcon:$.noop,
		 onSortData:$.noop,
		 onSortColumn:$.noop
	   };	
	});
	
	$.nexTree.puglins.push(function(){
		var self = this,
			opt = self.configs;
		//防止重复绑定	
		self.unbind("onStart.checkbox");
		self.unbind("onBeforeCreateItem.checkbox");
		self.unbind("onClick.checkbox");
		//self.unbind("onBulidTree.checkbox");
		//事件绑定
		self.bind("onBeforeCreateItem.checkbox",self._setCheckboxNode);
		self.bind("onClick.checkbox",self.toCheckedClick);
		
		if( opt.simpleSelect ) opt.checkRecursive = false;		
	});
	$.nexTree.fn.extend({
		toCheckedClick : function(li,tid,d,e){
			var self = this,
				opt=this.configs;
			var target = e.srcElement ? e.srcElement : e.target;
			if( $(target).hasClass('nex-tree-checkbox') ) {
				var r = self.fireEvent('onChceckboxClick',[ target,tid,e ]);
				if( r === false ) return r;
				self.toggleChecked(tid);
			}
		},
		toggleChecked : function(tid){
			var self = this,
				opt=this.configs;
			var t = "#"+opt.id+"_"+tid+'_wraper';
			var ck = $(">span.nex-tree-checkbox",$(t));
			if( ck.hasClass('nex-tree-checkbox1') ) {
				self.setNodeUnChecked(tid);
			} else {
				self.setNodeChecked(tid);	
			}
			return self;
		},
		_setNodeChecked : function(tid){
			var self = this,
				opt=this.configs;
			var r = self.fireEvent('onBeforeNodeChecked',[ tid ]);	
			if( r===false ) return r;
			if( opt.simpleSelect ) {
				for( var id in opt.checkedNodes ) {
					if( opt.checkedNodes[id] )	self._setNodeUnChecked(id);
				}	
			}
			var t = "#"+opt.id+"_"+tid+'_wraper';
			$(">span.nex-tree-checkbox",$(t))
			.removeClass("nex-tree-checkbox0 nex-tree-checkbox1 nex-tree-checkbox2")
			.addClass('nex-tree-checkbox1');
			var node = self._getNode(tid);
			node[opt.checkedField] = true;
			opt.checkedNodes[tid] = true;
			self.fireEvent('onNodeChecked',[ tid ]);
		},
		setNodeChecked : function(tid){
			var self = this,
				opt=this.configs;
			if( self.isLeaf(tid) || !opt.checkRecursive ) {
				self._setNodeChecked(tid);
				self.checkParentChecked(tid);
			} else {
				self.setAllNodeChecked(tid);	
			}
		},
		setAllNodeChecked : function(tid){
			var self = this,
				opt=this.configs;
				
			self._setNodeChecked(tid);	
			if( !opt.simpleSelect ) {
				var childs = self.getAllChildrens(tid);
				for( var i=0;i<childs.length;i++  ) {
					self._setNodeChecked(childs[i][opt.idField]);	
				}
			}
			self.checkParentChecked(tid);
		},
		_setNodeUnChecked : function(tid){
			var self = this,
				opt=this.configs;
			var r = self.fireEvent('onBeforeUnNodeChecked',[ tid ]);	
			if( r===false ) return r;	
			var t = "#"+opt.id+"_"+tid+'_wraper';
			$(">span.nex-tree-checkbox",$(t))
			.removeClass("nex-tree-checkbox0 nex-tree-checkbox1 nex-tree-checkbox2")
			.addClass('nex-tree-checkbox0');
			var node = self._getNode(tid);
			node[opt.checkedField] = false;
			opt.checkedNodes[tid] = false;
			self.fireEvent('onNodeUnChecked',[ tid ]);
		},
		setNodeUnChecked : function(tid){
			var self = this,
				opt=this.configs;
			if( self.isLeaf(tid) || !opt.checkRecursive  ) {
				self._setNodeUnChecked(tid);
				self.checkParentChecked(tid);
			} else {
				self.setAllNodeUnChecked(tid);	
			}
		},
		setAllNodeUnChecked : function(tid){
			var self = this,
				opt=this.configs;
			var childs = self.getAllChildrens(tid);
			self._setNodeUnChecked(tid);	
			for( var i=0;i<childs.length;i++  ) {
				self._setNodeUnChecked(childs[i][opt.idField]);	
			}
			self.checkParentChecked(tid);
		},
		setParentCheck2 : function(tid){
			var self = this,
				opt=this.configs;
			var t = "#"+opt.id+"_"+tid+'_wraper';
			$(">span.nex-tree-checkbox",$(t))
			.removeClass("nex-tree-checkbox0 nex-tree-checkbox1 nex-tree-checkbox2")
			.addClass('nex-tree-checkbox2');
		},
		checkParentChecked : function(tid){
			var self = this,
				opt=this.configs;
			if( !opt.checkRecursive ) return;	
			var pids = self._getParentsList(tid);
			pids.reverse();
			for( var i=0;i<pids.length;i++ ) {
				var _pid = pids[i];
				var childs = self.getAllChildrens(_pid);
				var t = 0;
				for( var j=0;j<childs.length;j++ ) {
					if( childs[j][opt.checkedField] ) {
						t++;	
					}	
				}
				if( t >= childs.length ) {
					self._setNodeChecked(_pid);	
				} else if( t>0 ) {
					self.setParentCheck2(_pid);		
				} else {
					self._setNodeUnChecked(_pid);			
				}
			}
		},
		_getCheckBoxIcon : function(tid){
			var self = this,
				opt=this.configs;
			if( self._getNode(tid,opt.checkedField) ) {
				opt.checkedNodes[tid] = true;
				return 'nex-tree-checkbox1';		
			} else {
				var childs = self.getAllChildrens(tid);
				for( var i=0;i<childs.length;i++  ) {
					if( childs[i][opt.checkedField] ) {
						return 	'nex-tree-checkbox2';	
					}
				}	
			}
			return 'nex-tree-checkbox0';	 
		},
		_setCheckboxNode : function(tid,liCls,spacers){
			var self = this,
				opt=this.configs;
			//nex-tree-icon icon-folder icon-file
			if( opt.showCheckbox ) {
				var r = self.fireEvent('onBeforeSetChceckboxIcon',[ tid,liCls,spacers ]);
				if( r===false ) return;
				if( !opt.showParentCheckBoxButton && !self.isLeaf(tid) ) {
					return;	
				}
				var icons = ['nex-tree-icon','nex-tree-checkbox'];
				icons.push( self._getCheckBoxIcon(tid) );	
				self.fireEvent('onSetChceckboxIcon',[ tid,liCls,spacers,icons ]);
				spacers.push( icons.join(' ') );
			}	
		}			 
	}); 
})(jQuery);
/*
jquery.nexTree.dragdrop.js  只支持tree与tree之间的拖拽
http://www.extgrid.com
author:nobo
qq:505931977
QQ交流群:13197510
email:zere.nobo@gmail.com or QQ邮箱
+----------------------------------------------------------------------------------------------------------------------------+
*/

;(function($){
	"use strict";
	//参数
	$.nexTree.addExtConf(function(){
		return {
		  dropField : 'droppable',
		  dragField : 'draggable',
		  dragDelay : 50,  // 延迟多少ms后执行拖拽
		  draggable : false,      //全局 是否节点可拖拽
		  droppable : false      //全局 是否接受drop
	   };	
	});					 
	//事件
	$.nexTree.addExtEvent(function(){
		return {
		 //onBeforeSetChceckboxIcon:$.noop,
	   };	
	});
	
	$.nexTree.puglins.push(function(){
		var self = this,
			opt = self.configs;
		//防止重复绑定	
		self.unbind(".dragdrop_tree");
		//事件绑定	
		self.bind("onMouseDown.dragdrop_tree",self._dragMouseDown);	
		self.bind("onMouseMove.dragdrop_tree",self._dragMouseMove);	
		self.bind("onMouseOut.dragdrop_tree",self._dragMouseOut);	
	});
	$.nexTree.extend({
		dragData : null,
		dropData : null,
		clone : null,
		line : null,
		startDrag : false,
		isDragging : false  //是否拖拽中...	
	});
	$.nexTree.fn.extend({
		dropNode : function( dragData,dropData ){
			var self = this
				,opt = self.configs
				,undef;
			if( !opt.droppable ) return false;
			var r = self.fireEvent('onBeforeDropNode',[ dragData,dropData,opt ]);
			if( r === false ) return r;
			
			if( dragData.dragTree === dropData.dropTree ) {//本身的拖拽
				if( dropData.pos === 'top' ) {
					self.moveNode( dragData.dragId,dropData.dropId,1 );
				} else if( dropData.pos === 'center' ) {
					self.moveNode( dragData.dragId,dropData.dropId,2 );	
				} else if( dropData.pos === 'bottom' ) {
					self.moveNode( dragData.dragId,dropData.dropId,3 );		
				}
			} else {//2颗树之间的拖拽
				if( dropData.pos === 'center' ) {
					var dtree = dropData.dropTree;
					var childrenField = dtree.C('childrenField');
					var pnode = $.extend( {},dragData.dragNode );
					pnode[ childrenField ] = dropData.dropId;
					var list = [pnode].concat(dragData.childrens);//dragNode
					$.each( list,function(i,node){
						list[i] = $.extend({},node);
						delete list[i][childrenField];	
					} );
					//console.log( list );
					dtree._parseSimpleData( list,dropData.dropId );
					dtree.refreshTree( dropData.dropId );
					//addChildren();	
				}
			}
			
			self.fireEvent('onDropNode',[ dragData,dropData,opt ]);
			
		},
		_dragMouseDown : function(li,tid,tnode,e){
			var self = this
				,opt = self.configs
				,undef;
			if( !opt.draggable || tnode[ opt.dragField ] === false ) return;
			var t = $('.nex-tree-item-wraper',$(li));
			var x = setTimeout( function(){
				$.nexTree.startDrag = true;
			},opt.dragDelay );
			
			$(document).bind("mouseup.dragdrop_tree",function(e){
				$.nexTree.startDrag = false;
				$(document).unbind(".dragdrop_tree");
				$(document).enableSelection();
				clearTimeout(x);
			});	
			$(document).disableSelection();
		},
		_dragMouseOut : function(li,tid,tnode,e){
			var self = this
				,opt = self.configs
				,undef;
			$.nexTree.dropData = null;
			var line = $.nexTree.line;
			if( line ) line.hide();
		},
		_dragMouseMove : function(li,tid,tnode,e){
			var self = this
				,opt = self.configs
				,undef;
			var tree = self;
			if($.nexTree.startDrag == false) return;
			var t = $('.nex-tree-item-wraper',$(li));
			if( $.nexTree.startDrag ) {
				$.nexTree.isDragging = true;
			}
		
			if( !$.nexTree.clone || !$.nexTree.line ) {
				start.call(t,e,tree);
			}
			
			var treeid = $(t).attr('treeid');
			var treeNode = tree._getNode( treeid );
			var pos = _checkNodeTopBottomEdge( t,e );
			
			$.nexTree.dropData = {
				dropId : treeid,
				dropNode : treeNode,
				dropTree : tree,
				pos : pos
			};
			
			var dragData = $.nexTree.dragData;
			var dropData = $.nexTree.dropData;
			//不能drop到本身
			if( (dragData.dragId === dropData.dropId) && ( dragData.dragTree === dropData.dropTree ) ) {
				pos = 'deny';	
			}
			
			var r = self.fireEvent('onDraggingOver',[ tid,tnode,dragData,dropData,opt ]);
			if( r === false ) {
				pos = 'deny';	
			}
			
			//判断当前节点是否可以drop
			if( tnode[ opt.dropField ] === false ) {
				pos = 'deny';		
			}
			
			if( pos !== 'deny' && (dragData.dragTree === dropData.dropTree) ) {//不能drop到子节点
				var childs = dragData.childrens || self.getAllChildrens( dragData.dragId );
				$.each( childs,function(i,node){
					if( node[ opt.idField ] == dropData.dropId ) {
						pos = 'deny';	
						return false;	
					}
				} );
			} 
			
			$.nexTree.dropData.pos = pos;
			
			var offset = $(t).offset();
			var width = $(t).outerWidth();
			var height = $(t).outerHeight();
			var clone = $.nexTree.clone;
			var line = $.nexTree.line;
			
			clone.removeClass('nex-tree-clone-top nex-tree-clone-center nex-tree-clone-bottom nex-tree-clone-deny');
			
			var droppable = opt.droppable;
			
			switch( pos ) {
				case 'top' : 
					if(droppable) {
						line.css({
							top : offset.top,
							left : offset.left,
							width : width	
						}).show();
					}
					clone.addClass('nex-tree-clone-top');
					break;
				case 'center' : 
					if(droppable) {
						line.hide();
					}
					clone.addClass('nex-tree-clone-center');
					break;
				case 'bottom' : 
					if(droppable) {
						line.css({
							top : offset.top+height,
							left : offset.left,
							width : width	
						}).show();
					}
					clone.addClass('nex-tree-clone-bottom');
					break;	
				default : 
					clone.addClass('nex-tree-clone-deny');
					if(droppable) {
						line.hide();	
					}
			}
			
		}
	}); 
	function start(e,tree) {
		var opt = tree.C();
		var treeid = $(this).attr('treeid');
		var treeNode = tree._getNode( treeid );
		$.nexTree.dragData = {
			dragId : treeid,
			dragNode : treeNode,
			dragTree : tree	,
			childrens : tree.getAllChildrens( treeid )
		};
		var _target = $('<div class="nex-tree-item-clone" id="'+opt.id+'_item_clone" style="position:absolute;z-index:'+(Nex.zIndex+2)+';">'+$('.nex-tree-title',this).html()+'</div>').appendTo(document.body);
		var _line = $('<div class="nex-tree-item-line" id="'+opt.id+'_item_line" style="position:absolute;z-index:'+(Nex.zIndex+3)+';"></div>').appendTo(document.body);
		
		_line.hide();
		
		var clone = $.nexTree.clone =_target;
		var line = $.nexTree.line = _line;
		
		$.nexTree.clone.css({
			left : e.pageX + 10,
			top : e.pageY + 15
		 });
	
		$(document).bind("mousemove.dragdrop_tree",function(e){
			 $.nexTree.clone.css({
				left : e.pageX + 10,
				top : e.pageY + 15
			 });
		});	
		$(document).bind("mouseup.dragdrop_tree",function(e){
			var dropData = $.nexTree.dropData;
			var dragData = $.nexTree.dragData;
			if( dropData && dropData.dropTree && dropData.pos !== 'deny' ) {
				var tree = 	dropData.dropTree;
				tree.dropNode( dragData,dropData );
			}
			$.nexTree.isDragging = false;
			$.nexTree.dragData = null;
			$.nexTree.dropData = null;
			if( $.nexTree.clone ) {
				clone.remove();
				$.nexTree.clone = null;
			}
			if( $.nexTree.line ) {
				line.remove();
				$.nexTree.line = null;
			}
			//$(document).unbind(".dragdrop_tree");
		});
	}
	function _checkNodeTopBottomEdge (helper,e){
		var self = this;
		var offset = $(helper).offset();
		var width = $(helper).outerWidth();
		var height = $(helper).outerHeight();
		var t = e.pageY - offset.top;
		var r = offset.left + width - e.pageX;
		var b = offset.top + height - e.pageY;
		var l = e.pageX - offset.left;
		var edge = 7;//设置上下 边缘是5
		if( t <= edge ) return 'top';
		if( b <= edge ) return 'bottom';
		return 'center';
		//return Math.min(t,r,b,l) < 5;
	}
})(jQuery);
/*
jquery.nexTabs.js
http://www.extgrid.com/tabs
author:nobo
qq:505931977
QQ交流群:13197510
email:zere.nobo@gmail.com or QQ邮箱

*/

;(function($){
	"use strict";
	var tab = Nex.widget('tab');
	Nex.tabs = tab;
	/*
	*添加xtype
	*/
	if( Nex.Manager ) {
		Nex.Manager.addXtype('tabs',function(opt){
			return new Nex['tab'](opt);									   
		});	
	}

	$.nexTab = $.extTab = tab;
	
	tab.extend({
		version : '1.0',
		getDefaults : function(opt){
			var _opt = {
				prefix : 'nextab-',
				autoResize : true,
				tabid : 1,//内部tab唯一标识id
				renderTo : document.body,
				align : 'top',
				border : true,
				borderCls : 'nex-tabs-container-border',
				isIE : !!window.ActiveXObject,
				url : '',//支持远程创建 返回数据格式  json
				cache : true,
				dataType : 'json',
				queryParams : {},
				method : 'get',
				parames : {},
				animateShow : true,//开启动画方式切入tab
				easing : 'easeOutCirc',
				animate : null,//可自定义切换函数
				animateTime : 300,
				leftWidth : 144,//当ailgn = right时 选项卡宽度
				rightWidth : 144,//...
				scrollStep : 80,
				scrollTime : 200,
				tabsData : [],
				_tabs : {},
				_tabsData : function(){
					return {
						id : null,
						title : '',
						html : '',
						cls : '',
						style : {},
						padding : 0,
						open : false,
						autoScroll : false,
						items : [],
						icon : '',
						url : '',
						closeable : false,
						enable : true
					}
				},
				views : {},
				cls : '',
				openOnEvent : 1,//0 mouseover 1 click 
				width : 0,
				height : 0,
				maxWidth : 0,
				maxHeight : 0,
				minHeight : 0,
				minWidth : 0,
				events : {
					onStart : $.noop,
					onCreate : $.noop,
					onSizeChange : $.noop,
					onViewSizeChange : $.noop,
					onTabClick : $.noop,
					onTabDblClick : $.noop,
					onTabKeyDown : $.noop,
					onTabKeyUp : $.noop,
					onTabKeyPress : $.noop,
					onTabMouseOver : $.noop,
					onTabMouseOut : $.noop,
					onTabMouseDown : $.noop,
					onTabMouseUp : $.noop,
					onTabContextMenu : $.noop,
					onTabBodyClick : $.noop,
					onTabBodyDblClick : $.noop,
					onTabBodyKeyDown : $.noop,
					onTabBodyKeyUp : $.noop,
					onTabBodyKeyPress : $.noop,
					onTabBodyMouseOver : $.noop,
					onTabBodyMouseOut : $.noop,
					onTabBodyMouseDown : $.noop,
					onTabBodyMouseUp : $.noop,
					onTabBodyContextMenu : $.noop,
					onDestroy : $.noop
				}
			};
			
			var _opt = this.extSet(_opt);
			
			return $.extend({},_opt,opt);
		},
		_Tpl : {
			'tab_container' : '<div class="nex-tabs-container <%=cls%> <%=border?borderCls : ""%>" id="<%=id%>"></div>',
			'tab_header' : '<div class="nex-tabs-header" id="<%=id%>_header">'
								+'<div class=" nex-tabs-wrap nex-tabs-float-left">'
									+'<ul class="nex-tabs-ul" id="<%=id%>_tab_ul">'
									+'</ul>'
								+'</div>'
						  +'</div>',
			'tab_content' : '<div class="nex-tabs-bodys" id="<%=id%>_bodys"></div>',
			'tab_header_item' : '<li id="<%=tabid%>_tab_<%=id%>" tabid="<%=id%>">'
									+'<div class="nex-tabs-inner" id="<%=tabid%>_tab_<%=id%>_inner">'
										+'<span id="<%=tabid%>_tab_<%=id%>_icon" class="<%=(icon===""?"":"nex-tabs-icon "+icon)%>"></span><span  id="<%=tabid%>_tab_<%=id%>_text" class="nex-tabs-text"><%=title%></span>'
									+'</div>'
									+'<%if(closeable){%><a href="javascript:void(0)" class="nex-tabs-close"></a><%}%>'
								+'</li>',
			'tab_content_body' : '<div id="<%=tabid%>_tab_body_<%=id%>"  tabid="<%=id%>" style="left:10000px;" class="nex-tabs-body <%=( autoScroll ? "nex-tabs-auto-scroll" : "" )%>"></div>'					
		}
	});
	$.nexTab.fn.extend({
		_init : function(opt) {
			var self = this;
			
			//保存初始设置值
			opt.__width = opt.width;
			opt.__height = opt.height;
			
			self.getTabsData()
				.setContainer() //setContainer必须
				.setHeader()
				.setBody()
				.show();		
		},
		_sysEvents : function(){
			var self = this;
			var opt = self.configs;
			self.bind("onTabClick",self.clickToOpen,self);
			self.bind("onTabMouseOver",self.overToOpen,self);
			return self;
		},
		clickToOpen : function(li,tid,d,e){
			var self = this;
			var opt = self.configs;
			if( opt.openOnEvent === 1 ) {
				self.openTab(tid);	
			}
		},
		overToOpen : function(li,tid,d,e){
			var self = this;
			var opt = self.configs;
			if( opt.openOnEvent === 0 ) {
				self.openTab(tid);	
			}	
		},
		_getTabData : function(d){
			var self = this;
			var opt = self.configs;	
			var d = $.extend({},opt._tabsData.call( self ),d);
			if( d.id === null || d.id==="" || typeof d.id !== 'string' ) {
				d.id = 'tab_'+self.unique();	
			}
			return d;
		},
		getTabsData : function(){
			var self = this;
			var opt = self.configs;	
			var tab = {};
			for( var i=0;i<opt.tabsData.length;i++ ) {
				tab = self._getTabData(opt.tabsData[i]);
				opt.tabsData[i] = tab;
				opt._tabs[tab.id] = tab;
			}
			return self;
		},
		_setTabOpen : function(tid){
			var self = this;
			var opt = self.configs;	
			if( !(tid in opt._tabs) ) return self;
			for( var id in opt._tabs ) {
				if( id == tid  ) {
					opt._tabs[id]['open'] = true;	
				} else {
					opt._tabs[id]['open'] = false;		
				}	
			}
			return self;
		},
		/*如果width height 设置的是百分比那么将返回百分比值，只对resize和初始创建时有效*/
		getResizeWH : function(){
			var self = this;
			var opt = self.C();	
			var width =  $(opt.renderTo)._width();
			var height =  $(opt.renderTo)._height();		
			var w = opt.__width === 0 ? width : opt.__width
				,h = opt.__height === 0 ? height : opt.__height;
			if( opt.__width.toString().indexOf("%") != -1 ) {
				w = parseFloat(opt.__width)*width/100;
			}
			if( opt.__height.toString().indexOf("%") != -1 ) {
				h = parseFloat(opt.__height)*height/100;
			}
			return {width:w,height:h};
		},
		checkSize : function(width,height){
			var self = this;
			var opt = self.configs;	
			
			height -= isNaN(parseFloat(opt.cutHeight)) ? 0 : opt.cutHeight;
			width -= isNaN(parseFloat(opt.cutWidth)) ? 0 : opt.cutWidth;
			
			if( opt.minWidth>0 ) {
				width = Math.max(width,opt.minWidth);
			}
			if( opt.minHeight>0 ) {
				height = Math.max(height,opt.minHeight);
			}
			if( opt.maxWidth>0 ) {
				width = Math.min(width,opt.maxWidth);
			}
			if( opt.maxHeight>0 ) {
				height = Math.min(height,opt.maxHeight);
			}
			
			return {
					width : width,
					height : height
				};
		},
		setContainerSize : function(w,h){
			var self = this;
			var opt = self.configs;	
			var render = $(opt.renderTo);
			var container = opt.views['container'];
			
			var size = self.getResizeWH();
			
			opt.width = w || size.width;
			opt.height = h || size.height;
			
			var wh = self.checkSize( opt.width,opt.height );
			opt.width = parseInt(wh.width);
			opt.height = parseInt(wh.height);
			
			container._outerWidth(opt.width);
			container._outerHeight(opt.height);
			return self;
		},
		setContainer : function(){
			var self = this;
			var opt = self.configs;
			var render = $(opt.renderTo);
			var container = $(self.tpl( 'tab_container',opt ));
			opt.views['container'] = container;
			$("#"+opt.id).remove();
			render.append(container);
			self.setContainerSize();
			self.fireEvent("onContainerCreate",[container],opt);
			return self;
		},
		unselectHeader : function(){
			var self = this;
			var opt = self.configs;	
			opt.views['header'].bind('selectstart.tabs',function(){return false;});	
			return self;
		},
		setHeader : function(){
			var self = this;
			var opt = self.configs;	
			var container = opt.views['container'];
			var header = $(self.tpl( 'tab_header',opt ));
			opt.views['header'] = header;
			container.append(header);
			self.unselectHeader();
			self.fireEvent("onHeaderCreate",[header],opt);
			return self;
		},
		setBody : function(){
			var self = this;
			var opt = self.configs;	
			var container = opt.views['container'];
			var bodys = $(self.tpl( 'tab_content',opt ));
			opt.views['body'] = bodys;
			container.append(bodys);
			self.fireEvent("onBodyCreate",[bodys],opt);
			return self;
		},
		onSizeChange : function(w,h){
			var self = this;
			var opt = self.C();	
			
			opt.width = w || opt.width;
			opt.height = h || opt.height;	
			
			var render = $(opt.renderTo);
			var pWidth = render._width();
			var pHeight = render._height();
			
			//检查自定义setWH 是否使用百分比做为单位
			if( opt.width.toString().indexOf("%") != -1 ) {
				opt.width = parseFloat(opt.width)*pWidth/100;
			}
			if( opt.height.toString().indexOf("%") != -1 ) {
				opt.height = parseFloat(opt.height)*pHeight/100;
			}
			
			self.setContainerSize(opt.width,opt.height);
			
			self.resetViewSize();
			
			self.checkScrollAble();
			
			return self;
		},
		width : function( width ){
			var self = this;
			var opt = self.configs;	
			if( typeof width != 'undefined' ) {
				self.setWH(width,opt.height);	
			}
			return $("#"+opt.id)._width();
		},
		height : function( height ){
			var self = this;
			var opt = self.configs;	
			if( typeof height != 'undefined' ) {
				self.setWH(opt.width,height);	
			}
			return $("#"+opt.id)._height();
		},
		initWH : function(w,h){
			var self = this,
				opt = self.C();
			opt.__width = w;
			opt.__height = h;
			self.setWH(w,h);
		},
		setWH : function(w,h){
			var self = this,opt = this.C();
			self.onSizeChange(w,h);
			
			if( Nex.Manager ) {
				setTimeout(function(){
					Nex.Manager.fireEvent("onResize",[opt.id]);		
				},0);
			}
			
			self.fireEvent("onSizeChange");
		},
		resize : function(m){
			var self = this,
				opt = self.C(),
				undef;
			
			opt._rt = opt._rt || 0;
			
			if( opt._rt ) {
				clearTimeout( opt._rt );	
			}
			
			//var render = $(opt.renderTo);
			//var _body = $(document.body);
			//_body.addClass('nex-overflow-hidden');
			//render.addClass('nex-overflow-hidden');
			
			opt._rt = setTimeout(function(){
				self._setBodyOverflowHidden();
				var size = self.getResizeWH();
				var w =  size.width;
				var h =  size.height;		
				if( m ) {
					self.setWH(w,h);		
				} else {
					var  wh = self.checkSize( w,h );
					if( wh.width != opt.width || wh.height != opt.height ) {
						self.setWH(w,h);	
					}
				}
				//_body.removeClass('nex-overflow-hidden');
				//render.removeClass('nex-overflow-hidden');
			},0);
			return self;
		},
		
		x_viewsize : function(){
			var self = this,
				opt=this.configs,
				undef;	
			var container = opt.views['container'];
			var header = opt.views['header'];
			var bodys = opt.views['body'];
			var width = container.width();
			var height = container.height();
			//自定义div宽度大小
			var oh = 0;
			$(">div:not(div.nex-tabs-bodys,div.nex-tabs-header)",container).each(function(){
				oh += $(this)._outerHeight();												  
			});
			height -= oh; 
			/*header*/
			var h = 0;
			$(">div:not(div.nex-tabs-wrap)",header).each(function(){
				h += $(this)._outerHeight();													  
			});
			
			header._outerWidth( opt[opt.align+'Width'] );
			header._outerHeight( height - h );
			var ul = $("#"+opt.id+"_tab_ul");
			ul._outerWidth( header.width() );
			/*body*/
			bodys._outerHeight( height );
			var ww = header._outerWidth();
			bodys._outerWidth( width - ww );
	
			$(">div.nex-tabs-body",bodys).each(function(){
				$(this)._outerWidth( bodys._width() );	
				$(this)._outerHeight( bodys._height() );	
			});
			return self;
		},
		//top bottom
		y_viewsize : function(){
			var self = this,
				opt=this.configs,
				undef;	
			var container = opt.views['container'];
			var header = opt.views['header'];
			var bodys = opt.views['body'];
			var width = container._width();
			var height = container._height();
			/*header*/
			var w = 0;
			$(">div:not(.nex-tabs-wrap)",header).each(function(){
				w += $(this)._outerWidth();													  
			});
			header._outerWidth( width );
			$('>div.nex-tabs-wrap',header)._outerWidth( header._width() - w );
			
			$("#"+opt.id+"_tab_ul").width(10000);
			header.height( $(">div.nex-tabs-wrap",header)._outerHeight() );
			/*body*/
			bodys._outerWidth( width );
			var hh = 0;//header-height
			$(">div:not(.nex-tabs-bodys)",container).each(function(){
				hh += $(this)._outerHeight();												  
			});
			hh = height - hh;
			bodys._outerHeight( hh );
			$(">div.nex-tabs-body",bodys).each(function(){
				$(this)._outerWidth( bodys._width() );	
				$(this)._outerHeight( bodys._height() );	
			});
			return self;
		},
		resetViewSize : function(align){
			var self = this,
				opt=this.configs,
				undef;
			var align = align === undef ? opt.align : align;
			switch( align ) {
				case 'top':
				case 'bottom':
					self.y_viewsize();
					break;
				case 'left':
				case 'right':
					self.x_viewsize();
					break;
			}
			self.fireEvent('onViewSizeChange',[ opt ]);
		},
		_clearAlignCls : function(){
			var self = this,
				opt=this.configs;
			var cls = 'nex-tabs-header-left nex-tabs-header-right nex-tabs-header-bottom nex-tabs-bodys-top nex-tabs-bodys-left nex-tabs-bodys-right';
			var header = opt.views['header'];
			var bodys = opt.views['body'];
			header.removeClass(cls);
			bodys.removeClass(cls);
		},
		setAlign : function(align){
			var self = this,
				opt=this.configs;	
			opt.align = align.toLowerCase();
			
			var acShow = opt.align+'Show';
			if( acShow in self ) {
				self[acShow].call(self,opt.align);
			}	
			self.resetViewSize();
		},
		topShow : function(){
			var self = this,
				opt=this.configs;
			self._clearAlignCls();	
			var header = opt.views['header'];
			var bodys = opt.views['body'];
			bodys.before(header);
			return self;
		},
		bottomShow : function(){
			var self = this,
				opt=this.configs;	
			self._clearAlignCls();
			var header = opt.views['header'];
			var bodys = opt.views['body'];
			bodys.after(header);
			header.addClass('nex-tabs-header-bottom');
			bodys.addClass('nex-tabs-bodys-top');
			return self;
		},
		rightShow : function(){
			var self = this,
				opt=this.configs;	
			self._clearAlignCls();
			var header = opt.views['header'];
			var bodys = opt.views['body'];
			bodys.before(header);
			header.addClass('nex-tabs-header-right');
			bodys.addClass('nex-tabs-bodys-left');
			return self;	
		},
		leftShow : function(){
			var self = this,
				opt=this.configs;	
			self._clearAlignCls();
			var header = opt.views['header'];
			var bodys = opt.views['body'];
			bodys.before(header);
			header.addClass('nex-tabs-header-left');
			bodys.addClass('nex-tabs-bodys-right');
			return self;	
		},
		bindTabEvent : function(hd,bd,d){
			var self = this,
				opt=this.configs;
				var tid = d.id;
			$("a.nex-tabs-close",hd).click(function(){
				self.removeTab(tid);										
			});
			var callBack = function(type,e){
				var _type = type.replace('Tab','');
				var r;
				if( !d.enable ) return;
				if( (_type in d) && $.isFunction(d[_type]) ) {
					r = d[_type].apply(self,[this,tid,d,e]);
				}
				if( r!==false ) {
					r = self.fireEvent(type,[ this,tid,d,e ]);
				}
				if( r === false ) {
					e.stopPropagation();
					e.preventDefault();
				}
			};
			var events = {
				'click' : function(e) {
					callBack.call(this,'onTabClick',e);
				},
				'dblclick' : function(e) {
					callBack.call(this,'onTabDblClick',e);
				},
				'keydown' : function(e) {
					callBack.call(this,'onTabKeyDown',e);
				},
				'keyup' : function(e) {
					callBack.call(this,'onTabKeyUp',e);
				},
				'keypress' : function(e){
					callBack.call(this,'onTabKeyPress',e);
				},
				'mouseover' : function(e){
					callBack.call(this,'onTabMouseOver',e);
				},
				'mouseout' : function(e){
					callBack.call(this,'onTabMouseOut',e);
				},
				'mousedown' : function(e) {
					callBack.call(this,'onTabMouseDown',e);
				},
				'mouseup' : function(e) {
					callBack.call(this,'onTabMouseUp',e);
				},
				'contextmenu' : function(e){	
					callBack.call(this,'onTabContextMenu',e);
				}
			};
			var callBack2 = function(type,e){
				var _type = type.replace('Tab','');
				var r;
				if( !d.enable ) return;
				if( (_type in d) && $.isFunction(d[_type]) ) {
					r = d[_type].apply(self,[this,tid,d,e]);
				}
				if( r!==false ) {
					r = self.fireEvent(type,[ this,tid,d,e ]);
				}
				if( r === false ) {
					e.stopPropagation();
					e.preventDefault();
				}
			};
			var events2 = {
				'click' : function(e) {
					callBack2.call(this,'onTabBodyClick',e);
				},
				'dblclick' : function(e) {
					callBack2.call(this,'onTabBodyDblClick',e);
				},
				'keydown' : function(e) {
					callBack2.call(this,'onTabBodyKeyDown',e);
				},
				'keyup' : function(e) {
					callBack2.call(this,'onTabBodyKeyUp',e);
				},
				'keypress' : function(e){
					callBack2.call(this,'onTabBodyKeyPress',e);
				},
				'mouseover' : function(e){
					callBack2.call(this,'onTabBodyMouseOver',e);
				},
				'mouseout' : function(e){
					callBack2.call(this,'onTabBodyMouseOut',e);
				},
				'mousedown' : function(e) {
					callBack2.call(this,'onTabBodyMouseDown',e);
				},
				'mouseup' : function(e) {
					callBack2.call(this,'onTabBodyMouseUp',e);
				},
				'contextmenu' : function(e){	
					callBack2.call(this,'onTabBodyContextMenu',e);
				}
			};
			hd.bind(events);
			bd.bind(events2);
			return self;
		},
		/*
		*检测tab选项卡是否需要添加滚动按钮 只支持top bottom
		*/
		checkScrollAble : function(){
			var self = this;
			var opt = self.C();	
			if( opt.align !== 'top' && opt.align !== 'bottom' ) return;
			var ul = $('#'+opt.id+'_tab_ul');
			var w = 0;
			$('>li',ul).each(function(){
				w += $(this)._outerWidth(true);						  
			});
			var header = opt.views['header'];
			var wrap = $('>div.nex-tabs-wrap',header);
			if( w<=wrap._width() ) {
				$('>div.nex-tabs-scroller-left',header).remove();
				$('>div.nex-tabs-scroller-right',header).remove();
			} else {
				if( !$('>div.nex-tabs-scroller-left',header).size() ) {
					var l = $('<div class="nex-tabs-scroller-left"></div>');
					l.bind({
						click :　function(e){
							var r = self.fireEvent('onScrollLeft',[ this,e ]);	
							if( r === false ) return;
							self.scrollLeft();
						}	   
					});
					wrap.before(l);	
				}
				if( !$('>div.nex-tabs-scroller-right',header).size() ) {
					var r = $('<div class="nex-tabs-scroller-right"></div>');
					r.bind({
						click :　function(e){
							var r = self.fireEvent('onScrollRight',[ this,e ]);	
							if( r === false ) return;
							self.scrollRight();
						}	   
					});
					wrap.after(r);	
				}
			}
			//二次调用 牺牲点性能
			self.resetViewSize();
		},
		/*
		*滚动到指定tab 只适合 top bottom
		*/
		scrollToTab : function(tid){
			var self = this;
			var opt = self.configs;
			
			if( opt.align !== 'top' && opt.align !== 'bottom' ) return;
			
			var body = $('#'+opt.id+'_tab_ul');
			var header = body.parent();
			
			if( !header.length ) {
				return self;	
			}
			
			var r = self.fireEvent("onBeforeScrollToTab",[tid,opt]);
			if( r === false ) {
				return r;	
			}
			
			var offset = header.offset();
			var w = header.outerWidth();
			
			var f = $('#'+opt.id+'_tab_'+tid);
			
			if( !f.length ) return self;
			
			var fo = f.offset();
			var fw = f.outerWidth(true);
			
			var outerWidth = 0;
			if( offset.left > fo.left ) {
				outerWidth = offset.left - fo.left;
			} else if( (offset.left+w) < (fo.left+fw) ) {
				outerWidth = (offset.left+w) - (fo.left+fw);
			}
			var sLeft = 0;
			
			var _sLeft = body.css('marginLeft');
			_sLeft = isNaN( parseFloat( _sLeft ) ) ? 0 : parseFloat( _sLeft );
			
			sLeft = _sLeft + outerWidth;
			
			self._scrollTab( sLeft,function(){
				self.fireEvent("onAfterScrollToTab",[tid,opt]);									
			} );
				
			return self;
		},
		_scrollTab : function(sLeft,func){
			var self = this;
			var opt = self.C();	
			var ul = $('#'+opt.id+'_tab_ul');
			ul.stop(true)
			  .animate({
					marginLeft : sLeft	   
				},opt.scrollTime,function(){
					if( $.isFunction( func ) )
						func.call(self);	
				});
		},
		scrollLeft : function(func){
			var self = this;
			var opt = self.C();
			var ul = $('#'+opt.id+'_tab_ul');
			var left = ul.css('marginLeft');
			left = isNaN( parseFloat( left ) ) ? 0 : parseFloat( left );
			left += opt.scrollStep;
			left = left >= 0 ? 0 : left;
			self._scrollTab( left,func );
		},
		scrollRight : function(func){
			var self = this;
			var opt = self.C();
			var ul = $('#'+opt.id+'_tab_ul');
			var wrap = ul.parent();
			var width = 0;
			ul.children().each(function(){
				width += $(this).outerWidth(true);	
			});
			var left = ul.css('marginLeft');
			left = isNaN( parseFloat( left ) ) ? 0 : parseFloat( left );
			
			left -= opt.scrollStep;
			var w = wrap.width();
			if( ( Math.abs( left ) + w ) >= width ) {
				left = 	(width - w)*-1;
			}
			self._scrollTab( left,func );
		},
		/*
		*清空tab内容
		*/
		empytContent : function(tid){
			var self = this;
			var opt = self.C();		
			$('#'+opt.id+'_tab_body_'+tid).empty();
		},
		/*
		*向tab追加内容
		*/
		addContent : function(tid,items){
			var self = this,undef;
			var opt = self.C();
			if( items === undef ) return;
			var tbody = $('#'+opt.id+'_tab_body_'+tid);
			if( tbody.length ) {
				self.addComponent( tbody,items );	
			}
		},
		/*调用_addTab 后 应该再掉用_appendTabContent 添加内容*/
		_appendTabContent : function(d){
			var self = this;
			var opt = self.C();	
			var lbody = $('#'+opt.id+'_tab_body_'+d.id);
			//因为创建后立马写入内容，宽高都没设置，放到回调里
			var items = d['html'];
			self.addComponent( lbody,items );
			var items = d['items'];
			self.addComponent( lbody,items );
			return lbody;
		},
		_addTab : function(d){
			var self = this,
				opt=this.configs;
			d.tabid = opt.id;
			d.self = self;
			var hd = $( self.tpl('tab_header_item',d) );
			var bd = $( self.tpl('tab_content_body',d) );
			var ul = $("#"+opt.id+"_tab_ul");
			var bodys = $("#"+opt.id+"_bodys");
			ul.append(hd);
			bodys.append(bd);
			
			if( d.padding ) {
				bd.css( 'padding',d.padding );	
			}
			bd.addClass( d.cls );
			bd.css( d.style );
			
			self.bindTabEvent(hd,bd,d);
			
			self.checkScrollAble();
			
			return bd;
		},
		/*
		* @m true=添加后切换当前tab 默认 ; =false 添加后不切换当前tab
		*/
		addTab : function(d,m){
			var self = this,undef,
				opt=this.configs;
			var d = d || {};
			var m = m === undef ? true : m;
			d = self._getTabData(d);
			
			var r = self.fireEvent('onBeforeAddTab',[ d,opt ]);
			if( r === false ) return false;
			
			if( d.id in opt._tabs ) {
				return false;	
			}
			
			var bd = self._addTab(d);
			
			opt._tabs[d.id] = d;
			opt.tabsData.push(d);
			
			self.resetViewSize();
			
			if( m ) {
				self.openTab( d.id );	
			}
			
			//_appendTabContent 必须要在resetViewSize执行后调用，
			self._appendTabContent(d);
			self.fireEvent('onAddTab',[ bd,d,opt ]);
			return d.id;
		},
		getCurrentTab : function(m){
			var self = this,
				opt=this.configs;
			var ul = $("#"+opt.id+"_tab_ul");
			var li = $(">li.nex-tabs-selected",ul).first();
			if( !li.length ) return null;
			var tid = li.attr('tabid');
			return m ? opt._tabs[tid] : tid;
		},
		/*
		*动画方式切换tab  @otab 需要消失的tab @ntab需要显示的tab
		*/
		animateShowTab : function(otab,ntab,bodys){
			var self = this,
				opt=this.configs;	
			//otab.css('left',10000);
			$(">div.nex-tabs-body",bodys).css('left',10000);
			ntab.css({
				left : otab._outerWidth()*-1,
				opacity : 0
			});
			ntab.stop(true)
				.animate({
					left : 0,
					opacity : 1
				},
				opt.animateTime,
				opt.easing);
		},
		openTab : function(tid){
			var self = this,
				opt=this.configs;
			
			if( !(tid in opt._tabs) ) return false;
			
			var curr = self.getCurrentTab();
			if( curr == tid ) {
				return true;	
			}
			
			var r = self.fireEvent('onBeforeCloseTab',[ curr,opt._tabs[curr],opt ]);
			if( r === false ) return false;
			var r = self.fireEvent('onBeforeOpenTab',[ tid,opt._tabs[tid],opt ]);
			if( r === false ) return false;
			
			var ul = $("#"+opt.id+"_tab_ul");
			var bodys = $("#"+opt.id+"_bodys");
			
			$(">li.nex-tabs-selected",ul).removeClass('nex-tabs-selected');
			$("#"+opt.id+"_tab_"+tid).addClass('nex-tabs-selected');
			
			var otab = $("#"+opt.id+"_tab_body_"+curr);
			var ntab = $("#"+opt.id+"_tab_body_"+tid);
			
			if( opt.animateShow ) {//CallBack
				var callBack = $.isFunction( opt.animate ) ? opt.animate : self.animateShowTab;
				callBack.call( self,otab,ntab ,bodys);
			} else {
				//$(">div.nex-tabs-body",bodys).hide();
				$(">div.nex-tabs-body",bodys).css('left',10000);
				ntab.css('left',0);
			}
			self._setTabOpen(tid);
			
			self.fireEvent('onCloseTab',[ curr,opt._tabs[curr],opt ]);
			self.fireEvent('onOpenTab',[ tid,opt._tabs[tid],opt ]);
			//自动滚动到指定tabid
			self.scrollToTab( tid );
			
			return true;
		},
		removeTab : function(tid){
			var self = this,
				opt=this.configs;
			if( !(tid in opt._tabs) ) return false;
			
			var r = self.fireEvent('onBeforeRemoveTab',[ tid,opt._tabs[tid],opt ]);
			if( r === false ) return false;
			
			var curr = self.getCurrentTab();
			var tabs = opt.tabsData;
			for( var i=0;i<tabs.length;i++ ) {
				if( tabs[i]['id'] == tid ) break;	
			}
			if( curr == tid ) {
				var t = i+1 > tabs.length-1 ? i-1 : i+1;
				if( tabs[t] ) {
					self.openTab(tabs[t]['id']);	
				}
			} 
			
			$("#"+opt.id+"_tab_"+tid).remove();
			$("#"+opt.id+"_tab_body_"+tid).remove();	
			delete opt._tabs[tid];
			tabs.splice(i,1);
			
			self.fireEvent('onRemoveTab',[ tid,opt._tabs[tid],opt ]);
			
			self.methodInvoke('resetViewSize');
			//self.resetViewSize();
			
			self.methodInvoke('checkScrollAble');
			//self.checkScrollAble();
			
			return true;
		},
		removeAllTabs : function(){
			var self = this,
				opt=this.configs;	
			self.lockMethod('resetViewSize');	
			self.lockMethod('checkScrollAble');	
			for( var tid in opt._tabs ) {
				self.removeTab(tid);
			}
			
			self.methodInvoke('resetViewSize');
			self.methodInvoke('checkScrollAble');
		},
		closeTab : function(tid){
			return this.removeTab(tid);	
		},
		closeAllTabs : function(){
			this.removeAllTabs();	
		},
		_initTabs : function(){
			var self = this,
				opt=this.configs;
			var tabs = opt.tabsData;
			for( var i=0;i<tabs.length;i++ ) {
				self._addTab(tabs[i]);	
			}
			//fix 初始化宽度问题
			setTimeout(function(){	
				self.resetViewSize();
				for( var i=0;i<tabs.length;i++ ) {
					var bd = self._appendTabContent(tabs[i]);	
					self.fireEvent('onAddTab',[ bd,tabs[i],opt ]);
				}
				self.fireEvent('onCreate',[ opt ]);
			},0);
			return self;
		},
		/*初始化时 调用默认tab或第一个tab*/
		openFirstTab : function(){
			var self = this,
				opt=this.configs;
			var tabs = opt.tabsData;
			if( !tabs.length ) return false;
			var tab = tabs[0];
			for( var tid in opt._tabs ) {
				if( opt._tabs[tid]['open'] ) {
					tab = opt._tabs[tid];
				}	
			}
			self.openTab(tab['id']);
			return self;
		},
		show : function(){
			var self = this,
				opt=this.configs;	
			opt.align = opt.align.toLowerCase();
			
			self._initTabs();
			
			var acShow = opt.align+'Show';
			if( acShow in self ) {
				self[acShow].call(self,opt.align);
			}
			
			self.openFirstTab();
		}
	});
	$.fn.nexTab = function(conf){
		
	};
	$.fn.extTab = $.fn.nexTab;
})(jQuery);
/*
jquery.validator.js
nobo
Create On 
zere.nobo@gmail.com
*/
;(function($){
	Nex.formValid = {
		addMethod : function(name,func){
			var self = this;
			if( $.isFunction(func) ) {
				self.methods[name] = func;
			}
			return self;
		},
		methods : {
			required: function( value, param ) {
				return $.trim(value).length > 0;
			},
			email: function( value, param ) {
				return $.trim(value).length==0 || /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i.test(value);
			},
			url: function( value, param ) {
				return $.trim(value).length==0 || /^(https?|s?ftp):\/\/(((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:)*@)?(((\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5])\.(\d|[1-9]\d|1\d\d|2[0-4]\d|25[0-5]))|((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.?)(:\d*)?)(\/((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)+(\/(([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)*)*)?)?(\?((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|[\uE000-\uF8FF]|\/|\?)*)?(#((([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(%[\da-f]{2})|[!\$&'\(\)\*\+,;=]|:|@)|\/|\?)*)?$/i.test(value);//'
			},
			ip : function( value, param ){
				return $.trim(value).length==0 || /^[\d\.]{7,15}$/.test(value);		
			},
			qq : function( value, param ){
				return $.trim(value).length==0 || /^[1-9]\d{4,12}$/.test(value);		
			},
			currency : function( value, param ){
				return $.trim(value).length==0 || /^\d+(\.\d+)?$/.test(value);		
			},
			mobile : function( value, param ){
				return $.trim(value).length==0 || /^((\(\d{3}\))|(\d{3}\-))?13[0-9]\d{8}?$|15[89]\d{8}?$/.test(value);	
			},
			phone : function( value, param ){
				return $.trim(value).length==0 || /^((\(\d{2,3}\))|(\d{3}\-))?(\(0\d{2,3}\)|0\d{2,3}-)?[1-9]\d{6,7}(\-\d{1,4})?$/.test(value);	
			},
			number: function( value, param ) {
				return $.trim(value).length==0 || /^-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/.test(value);
			},
			digits: function( value, param ) {
				return $.trim(value).length==0 || /^\d+$/.test(value);
			},
			creditcard: function( value, param ) {
				
				if( $.trim(value).length==0 ) {
					return true;	
				}
				
				if ( /[^0-9 \-]+/.test(value) ) {
					return false;
				}
				var nCheck = 0,
					nDigit = 0,
					bEven = false;
	
				value = value.replace(/\D/g, "");
	
				for (var n = value.length - 1; n >= 0; n--) {
					var cDigit = value.charAt(n);
					nDigit = parseInt(cDigit, 10);
					if ( bEven ) {
						if ( (nDigit *= 2) > 9 ) {
							nDigit -= 9;
						}
					}
					nCheck += nDigit;
					bEven = !bEven;
				}
	
				return (nCheck % 10) === 0;
			},
			//checkLength 检验radio checkbox的选择数
			rangelength: function( value, param ) {
				if( $.trim(value).length==0 ) {
					return true;	
				}
				
				var length = value.split(",").length;
				//var length = $.isArray( value ) ? value.length : this.getLength($.trim(value), element);
				return ( length >= param[0] && length <= param[1] );
			},
			min: function( value, param ) {
				if( $.trim(value).length==0 ) {
					return true;	
				}
				return value >= param;
			},
			max: function( value, param ) {
				if( $.trim(value).length==0 ) {
					return true;	
				}
				return value <= param;
			},
			range: function( value, param ) {
				if( $.trim(value).length==0 ) {
					return true;	
				}
				return ( value >= param[0] && value <= param[1] );
			},
			equalTo: function( value, param ) {
				var target = $(param);
				return value === target.val();
			}
		},
		messages: {
			required: "This field is required.",
			remote: "Please fix this field.",
			email: "Please enter a valid email address.",
			url: "Please enter a valid URL.",
			date: "Please enter a valid date.",
			dateISO: "Please enter a valid date (ISO).",
			number: "Please enter a valid number.",
			digits: "Please enter only digits.",
			creditcard: "Please enter a valid credit card number.",
			equalTo: "Please enter the same value again."
		}
	};
})(jQuery);
/*
jquery.nexForm.js
http://www.extgrid.com/form
author:nobo
qq:505931977
QQ交流群:13197510
email:zere.nobo@gmail.com or QQ邮箱

每个组件都应该提供或实现的接口 不提供则调用默认函数
组件名+Start
组件名+Init
组件名+Create 必须
组件名+BindEvent 必须
组件名+Tpl
组件名+GetValue
组件名+SetValue
组件名+ValueChange
组件名+Extend
组件名+SizeChange
组件名+Disabled
组件名+Enable
组件名+Destroy
*/

;(function($){
	"use strict";
	var form = Nex.widget('form');

	$.nexForm = $.extForm = form;
	
	form.extend({
		version : '1.0', 
		list : {},
		isExists : function(id){
			if( !$( "#"+id ).length ) {
				return false;
			}	
			return true;
		},
		get : function(name,group){
			var self = this;
			
			var group = self._undef( group , 'default' );
			
			var ls = [];
			
			var list = self.list;
			if( group in list ) {
				
				var fields = list[ group ];
				
				$.each(fields,function(id,l){
					if( l === null ) return;
					//同时判断当前对象是否存在
					if( !self.isExists( l.self.C('id') ) ) {
						l.self._destroy();
						l = null;
						fields[id] = null;
						return;
					}
					
					if( l.name+'' === name+'' ) {
						ls.push(l.self);	
					}
				});
				
			}
			return ls.length == 1 ? ls[0] : ls;
		},
		getVal : function(name,group){
			var self = this;
			var obj = self.get.apply(self,arguments);
			var val = [];
			if( $.isArray(obj) ) {
				$.each(obj,function(){
					var _val = this.val();
					if( _val !== '' ) {
						val.push( _val );	
					}
				});
				var _v = {};
				var _s = false;
				$.each( val,function(i,value){
					if( $._isPlainObject( value ) ) {
						_s = true;
						$.each( value,function(k,v){
							_v[k] = _v[k] || [];
							_v[k].push( v );					   
						} );	
					} else {
						_v[name] = _v[name] || [];
						_v[name].push( value );
					}			 
				} );
				if( !_s ) {
					_v[name] = _v[name] || [];
					val = _v[name].join(',');		
				} else {
					val = _v;	
					if( $._isPlainObject( val ) ) {
						$.each( val,function(x,d){
							d = d || [];
							d[x] = d.join(',');	
						} );
					}
				}
				return val;	
			} else {
				return obj.val();		
			}
			return null;
		},
		setVal : function(value,name,group){
			var self = this;
			var obj = self.get.apply(self,[arguments[1],arguments[2]]);
			var val = [];
			if( $.isArray(obj) ) {
				$.each(obj,function(){
					this.val(value);
				});
				return true;
			} else {
				obj.val(value);		
				return true;
			}
			return null;
		},
		getGroup : function(group,m){
			var self = this;
			var group = self._undef( group , 'default' );	
			var m = self._undef( m , false );	
			var list = self.list;
			var inputs = [];
			if( group in list ) {
				var fields = list[ group ];
				$.each(fields,function(id,l){
					if( l === null ) return;
					//同时判断当前对象是否存在
					if( !self.isExists( l.self.C('id') ) ) {
						l.self._destroy();
						l = null;
						fields[id] = null;
						return;
					}
					
					var isDisabled = l.self.C('disabled');
					if( !m && isDisabled ) {
						return;	
					}
					
					inputs.push( l.self );
				});
			}	
			return 	inputs;
		},
		//获取某分组下的所有值
		/*
		*m 是否获取disabled 字段 默认不获取 false
		*/
		getGroupVal : function(group,m){
			var self = this;
			var group = self._undef( group , 'default' );	
			var m = self._undef( m , false );	
			var list = self.list;
			var data = {};
			if( group in list ) {
				var fields = list[ group ];
				$.each(fields,function(id,l){
					if( l === null ) return;
					//同时判断当前对象是否存在
					if( !self.isExists( l.self.C('id') ) ) {
						l.self._destroy();
						l = null;
						fields[id] = null;
						return;
					}
					
					var isDisabled = l.self.C('disabled');
					if( !m && isDisabled ) {
						return;	
					}
					
					var value = Nex.form.getVal( l.name,group );
					if( $._isPlainObject( value ) ) {
						$.extend( data,value );	
					} else {
						data[ l.name ] = value;	
					}
				});
			}	
			return data;
		},
		//验证是否通过，并返回错误的字段name
		/*
		*m 是否验证disabled 字段 默认不验证 false
		*/
		checkGroup : function(group,m) {
			var self = this;
			var group = self._undef( group , 'default' );	
			var m = self._undef( m , false );	
			var list = self.list;
			var errorList = [];
			var r;
			if( group in list ) {
				var fields = list[ group ];
				$.each(fields,function(id,l){
					if( l === null ) return;
					//同时判断当前对象是否存在
					if( !self.isExists( l.self.C('id') ) ) {
						l.self._destroy();
						l = null;
						fields[id] = null;
						return;
					}
					
					var isDisabled = l.self.C('disabled');
					if( !m && isDisabled ) {
						return;	
					}
					
					r = l.self.checkVal();
					if( r === false ) {
						errorList.push(l.name);	
					}
				});
			}
			return errorList.length ? errorList : true;
		},
		//验证是否通过
		/*
		*m 是否验证disabled 字段 默认不验证 false
		*/
		valid : function(group,m){
			var self = this;
			var r = self.checkGroup(group,m);
			return r === true ? true : false;
		},
		//验证某一元素
		checkElement : function( name,group ){
			var self = this;
			var obj = self.get.apply( self,arguments );
			obj = $.isArray( obj ) ? obj : [obj];
			var re = true;
			$.each(obj,function(i,input){
				if( !input.checkVal() ) {
					re = false;
				}
			});
			return re;
		},
		getDefaults : function(opt){
			var _opt = {
				prefix : 'nexform-',
				multiSplit : ',',
				labelStyle : {},//尚未实现 预留
				labelAlign : 'left',//left top bottom right
				labelText : '',
				labelTextAlign : 'left',//尚未实现 预留
				renderTo : document.body,
				labelWidth : 80,
				labelCls : '',
				placeholder : '',
				autocomplete : 'off',
				display : 'inline-block',
				group : 'default',//分组
				name : '',
				value : '',
				formater : null,//数据自定义格式 显示作用
				getFormater : null,//数据获取最终控制
				setFormater : null,//数据获取最终控制
				isShiftKey : false,
				isCtrlKey : false,
				_firstIndex : null,
				_lastIndex : null,
				renderer : {},
				_renderer : {},//反renderer
				rendererDef : '_default_',
				isIE : !!window.ActiveXObject,
				url : '',//支持远程创建 返回数据格式  json
				dataType : 'json',
				method : 'get',
				parames : {},
				validator : Nex.formValid || {},
				rules : [],
				messages : {},
				error : 'nex-form-valid-error',//已经移除 无效
				errorCls : 'nex-form-valid-error',
				items : [],//{cls:'',text:'年龄',value:'45',readOnly:false,disabled:false,selected:true,attrs:''} or '|' ',' ';'
				_multiItems : [],//multi缓存数据
				_item :　{
					cls:'',
					text:'',
					value:'',
					readOnly:false,
					disabled:false,
					selected:false,
					title : '',//multiSelect
					attrs:'',
					display : 'inline-block'
				},
				showAt : {},
				listFilter : null,// callback select multiselect @return false 则过滤当前項
				leftText : '',
				rightText : '',
				width : 150,
				height : 60,//textarea multselect
				step : 1,//spinner,
				poll1 : 300,
				poll2 : 50,
				smax : null,//spinner,
				smin : null,//spinner,
				type : 'text',
				singleSelect : false,//mulitselect 是否只能单选
				multiSelect : false,//select 单选多选 , 无效
				selectListMaxHeight : 0,
				selectListMaxWidth : 0,
				selectReadOnly : true,//控制select 不可写
				emptyOnShowAll : true,//如果查询输入框为空 则显示所有
				onCheck : ['onChange','onBlur','onPaste'],//什么时候进行数据验证
				disabled : false,
				readOnly : false,
				cls : '',
				overCls : '',
				focusCls : '',
				disabledCls : '',
				readonlyCls : '',
				attrs : '',//用户自定义属性
				_oldVal : '',
				events : {
					onStart : $.noop,
					onCreate : $.noop,
					onSizeChange : $.noop,
					onClick : $.noop,
					onFocus : $.noop,
					onBlur : $.noop,
					onKeyDown : $.noop,
					onKeyUp : $.noop,
					onKeyPress : $.noop,
					onMouseOver : $.noop,
					onMouseOut : $.noop,
					onPaste : $.noop,
					onSpinnerUp : $.noop,
					onSpinnerDown : $.noop,
					onMouseDown : $.noop,
					onMouseUp : $.noop,
					onBeforeSet : $.noop,
					onAfterSet : $.noop,
					onBeforeGet : $.noop,
					onAfterGet : $.noop,
					onChange : $.noop,
					onValidError : $.noop,
					onValidSuccess : $.noop,
					onDestroy : $.noop
				}
			};
			
			var _opt = this.extSet(_opt);
			
			return $.extend({},_opt,opt);
		}
		
	});
	form.fn.extend({
		_init : function(opt) {
			var self = this;
			opt.type = opt.type.toLowerCase();
			opt._value = opt.value;
			
			var method = opt.type + 'Init';
			if( method in self ) {
				self[method].call(self,opt);
			}
			
			if( opt.url ) {
				self.getConf();//获取远程配置后创建
			} else {
				self.create();
			}
			
		},
		create : function(){
			var self = this;
			var opt = self.configs;
			
			var method = opt.type+'Create';
			var bindEvent = opt.type+'BindEvent';
			
			var tpl = '';
			
			if( opt.name === '' ) {
				opt.name = 'form_name_'+self.unique();	
			}
			
			if( method in self ) {
				var r = self[method].call(self);
				if( r === false ) return false;
			
				if( bindEvent in self ) {
					self[bindEvent].call(self);
				} else {
					self.commonEvent();
				}
			} else {
				self.commonCreaet();
				if( bindEvent in self ) {
					self[bindEvent].call(self);
				} else {
					self.commonEvent();
				}
			}
			
			self.fireEvent('onCreate',[opt.helper]);	
			
			self.setSize(opt.width,opt.height,function(){
				self.fireEvent('onInitSetSize',[opt.helper]);										   
			});
			
			return true;
		},
		addList : function(){
			var self = this;
			var opt = self.configs;
			var list = Nex.form.list;
			if( opt.group in list ) {
				list[ opt.group ][opt.id] = {
					name : opt.name,
					'self' : self
				};	
			} else {
				list[ opt.group ] = {};
				list[ opt.group ][opt.id] = {
					name : opt.name,
					'self' : self
				};
			}
		},
		_getOffset : function(el){
			var self = this;
			var opt = self.configs;	
			var offset = $(el).offset();
			var sLeft = $(window).scrollLeft();
			var sTop = $(window).scrollTop();
			return !offset ? {left:sLeft,top:sTop} : offset;
		},
		//获取周围可显示空间
		_getShowSpace : function(el){
			var self = this;
			var opt = self.configs;
			var el = self._undef(el,self.getInput());
			//需要获取的对象
			var obj = $(el);
			
			//获取窗口显示区域大小
			var cw = $(window).width();
			var ch = $(window).height();
			
			var offset = $._isPlainObject(el) ? el : self._getOffset(obj);
			
			//获取滚位置
			var sLeft = $(window).scrollLeft();
			var sTop = $(window).scrollTop();
			
			var space = {
				top : offset.top - sTop,
				left : offset.left - sLeft
			};
			space.bottom = ch - space.top - ( $._isPlainObject(el) ? 0 : obj._outerHeight() );
			space.right = cw - space.left - ( $._isPlainObject(el) ? 0 : obj._outerWidth() );
			return space;
		},
		_sysEvents : function(){
			var self = this;
			var opt = self.configs;
			
			self.bind("onStart",self._initCof,self);
			
			self.bind("onCreate",self.onCreate,self);
			self.bind("onCreate",self.addList,self);
			self.bind("onCreate",self.onDisabled,self);
			self.bind("onCreate",self.onReadOnly,self);
			self.bind("onCreate",self._setValue,self);
			self.bind("onCreate",function(){
				this.lockMethod('setSize');
				this.setLabelText();	
				this.unLockMethod('setSize');						  
			},self);
			
			self.bind("onMouseOver",self.onMouseOver,self);
			self.bind("onMouseOut",self.onMouseOut,self);
			
			self.bind("onFocus",self._setFocusCls,self);
			self.bind("onBlur",self._unsetFocusCls,self);
			
			
			self.bind("onBeforeSet",self.onBeforeSet,self);
			self.bind("onAfterSet",self.onAfterSet,self);
			self.bind("onChange",self.onChange,self);
			self.bind("onBlur",self.refreshFormater,self);//refreshFormater
			self.bind("onBlur",self.refreshRenderer,self);
			
			self.bind("onValidError",self.onValidError,self);
			self.bind("onValidSuccess",self.onValidSuccess,self);
			for(var i=0;i<opt.onCheck.length;i++ ) {
				var s = self.bind(opt.onCheck[i],self.onCheck,self);	
			}
			return self;
		},
		
		_setValue : function(){
			var self = this;
			var opt = self.configs;
			self.lockEvent("onBeforeSet");
			self.lockEvent("onAfterSet");
			
			self.val( opt.value );
			
			self.unLockEvent("onBeforeSet");
			self.unLockEvent("onAfterSet");
		},
		onValidError : function(){
			var self = this;
			var opt = self.configs;
			$("#"+opt.id).removeClass(opt.errorCls);
			$("#"+opt.id).addClass(opt.errorCls);
		},
		onValidSuccess : function(){
			var self = this;
			var opt = self.configs;
			$("#"+opt.id).removeClass(opt.errorCls);
		},
		onCreate : function(){
			var self = this;
			var opt = self.configs;
			var method = opt.type + 'Extend';
			if( method in self ) {
				self[method].call(self);
			}
		},
		_initCof : function(){
			var self = this;
			var opt = self.configs;
			
			opt.cls += ' nex-form-display-'+opt.display+' nex-form-'+opt.group+'-wraper nex-form-'+opt.type+'-wraper ';
			
			if(opt.disabled){
				opt.attrs += 'disabled';
			}
			if(opt.readOnly){
				opt.attrs += ' readOnly ';
			}
		
			
			var method = opt.type + 'Start';
			if( method in self ) {
				self[method].call(self);
			}
		},
		onDisabled : function(){
			var self = this;
			var opt = self.configs;
			if( opt.disabled )
				self.disabled();
		},
		onReadOnly : function(){
			var self = this;
			var opt = self.configs;
			if( opt.readOnly ) {
				self.readOnly();
			}
		},
		//自动销毁时调用
		_destroy : function(){
			var self = this;
			var opt = self.configs;
			var method = opt.type+'Destroy';
			if( method in self ) {
				self[method].apply(self,[]);
			}
			self.fireEvent("onDestroy");
			return self;
		},
		destroy : function(){
			this._destroy();
		},
		setSize : function(w,h,cb){
			var self = this;
			var opt = self.configs;
			var w = self._undef(w,opt.width);
			var h = self._undef(h,opt.height);
			var call = self._undef(cb,null);
			opt.width = w;
			opt.height = h;
			
			var method = opt.type+'SetSize';
			
			var rsize = function(){
				if( method in self ) {
					self[method].apply(self,[w,h]);
				} else {
					self.commonSetSize(w,h);	
				}
				self.fireEvent("onSizeChange",[w,h,opt]);
				if($.isFunction( call )) {
					call();	
				}
			};
			/*if( Nex.isIE6 || Nex.isIE7 ) {
				setTimeout(rsize,0);	
			} else {
				rsize()	;
			}*/
			setTimeout(rsize,0);	
		},
		resize : function(w,h){
			var self = this;
			var opt = self.configs;
			self.setSize(w,h);
		},
		_setFocusCls : function(t,e){
			var self = this;
			var opt = self.configs;
			if( opt.disabled || opt.readOnly ) {
				return;	
			}
			var field = $("#"+opt.id);
			if( opt.focusCls ) {
				field.addClass(opt.focusCls);	
			}	
		},
		_unsetFocusCls : function(t,e){
			var self = this;
			var opt = self.configs;
			if( opt.disabled || opt.readOnly ) {
				return;	
			}
			var field = $("#"+opt.id);
			if( opt.focusCls ) {
				field.removeClass(opt.focusCls);	
			}	
		},
		onMouseOver : function(t,e){
			var self = this;
			var opt = self.configs;
			if( opt.disabled || opt.readOnly ) {
				return;	
			}
			var field = $("#"+opt.id);
			field.addClass('nex-form-wraper-over');
			$('>.nex-form-item',field).addClass('nex-form-item-over');
			if( opt.overCls ) {
				field.addClass(opt.overCls);	
			}
		},
		onMouseOut : function(t,e){
			var self = this;
			var opt = self.configs;
			if( opt.disabled || opt.readOnly ) {
				return;	
			}
			var field = $("#"+opt.id);
			field.removeClass('nex-form-wraper-over');
			$('>.nex-form-item',field).removeClass('nex-form-item-over');
			if( opt.overCls ) {
				field.removeClass(opt.overCls);	
			}
		},
		onBeforeSet : function(){
			var self = this;
			var opt = self.configs;
			opt._oldVal = opt._oldVal === null ? self.val() : opt._oldVal;
		},
		onAfterSet : function(){
			var self = this;
			var opt = self.configs;
			var newVal = self.val();
			if( opt._oldVal != newVal && opt._oldVal!==null ) {
				opt._oldVal = null;
				self.fireEvent('onChange',[]);	
			}
		},
		onCommonChange : function(){
			var self = this;
			var opt = self.configs;
			opt.value = self.val() ;
			return self;	
		},
		onChange : function(){
			var self = this;
			var opt = self.configs;
			var method = opt.type+'ValueChange';
			if( method in self ) {
				self[method].apply(self,[]);	
			} else {
				self.onCommonChange.apply(self,[]);
			}
		},
		onCheck :　function(){
			var self = this;
			var opt = self.configs;
			if( opt._ct ) {
				clearTimeout( opt._ct )
			}
			opt._ct = setTimeout(function(){
				self.checkVal();
				opt._ct = 0;	
			},0);
		},
		commonDisabled : function(){
			var self = this;
			var opt = self.configs;
			var input = $("#"+opt.id+"-input");
			
			input.attr('disabled',true);	 
			
			return self;	
		},
		hidden : function(){
			var self = this;
			var opt = self.configs;
			$("#"+opt.id).hide();
		},
		show : function(){
			var self = this;
			var opt = self.configs;
			$("#"+opt.id).show();	
		},
		disabled : function(){
			var self = this;
			var opt = self.configs;
			var method = opt.type + 'Disabled';
			
			opt.disabled = true;
			
			if( method in self ) {
				self[method].call(self);
			} else {
				self.commonDisabled();
			}
			self.fireEvent("onDisabled",[opt]);	
			
			var field = $("#"+opt.id);
			field.addClass('nex-form-disabled');
			$('>.nex-form-item',field).addClass('nex-form-item-disabled');
			if( opt.disabledCls ) {
				field.addClass(opt.disabledCls);	
			}
		},
		commonEnable : function(){
			var self = this;
			var opt = self.configs;
			
			var input = $("#"+opt.id+"-input");
			
			input.attr('disabled',false);	
			
			return self;	
		},
		enable : function(){
			var self = this;
			var opt = self.configs;
			
			opt.disabled = false;
			
			var method = opt.type + 'Enable';
			if( method in self ) {
				self[method].call(self);
			} else {
				self.commonEnable();
			}	
			self.fireEvent("onEnable",[opt]);	
			var field = $("#"+opt.id);
			field.removeClass('nex-form-disabled');
			$('>.nex-form-item',field).removeClass('nex-form-item-disabled');
			if( opt.disabledCls ) {
				field.removeClass(opt.disabledCls);	
			}
		},
		commonReadOnly : function( flag ){
			var self = this,undef;
			var opt = self.configs;
			var flag = flag === undef ? true : flag;
			var input = self.getInput();
			input.attr('readonly',flag);	
			return self;	
		},
		readOnly : function( flag ){
			var self = this;
			var opt = self.configs;
			
			var flag = typeof flag == 'undefined' ? true : flag;
			
			opt.readOnly = flag;
			
			var method = opt.type + 'ReadOnly';
			
			if( method in self ) {
				self[method].call(self,flag );
			} else {
				self.commonReadOnly( flag  );
			}
			var field = $("#"+opt.id);
			if( flag ) {
				self.fireEvent("onReadOnly",[opt]);	
				field.addClass('nex-form-readonly');
				$('>.nex-form-item',field).addClass('nex-form-item-readonly');
				if( opt.readonlyCls ) {
					field.addClass(opt.readonlyCls);	
				}
			} else {
				self.fireEvent("onUnReadOnly",[opt]);		
				field.removeClass('nex-form-readonly');
				$('>.nex-form-item',field).removeClass('nex-form-item-readonly');
				if( opt.readonlyCls ) {
					field.removeClass(opt.readonlyCls);	
				}
			}
		},
		getInput : function(){
			var self = this;
			var opt = self.configs;
			var input = $("#"+opt.id+"-input");
			return input;
		},
		getInputKey : function(){
			var self = this;
			var opt = self.configs;
			var input = $("#"+opt.id+"-input-key");
			return input;
		},
		"focus" : function(){
			var self = this;
			try{
				self.getInput().focus();
			}catch(e){};
		},
		"select" : function(){
			var self = this;
			try{
				self.getInput().select();
			}catch(e){};
		},
		selectText : function(start, end){
			var self = this,
				opt = self.configs,
				v = self.val(),
				undef,
				el = self.getInput().get(0),
				range;
	
			if (v.length > 0) {
				start = start === undef ? 0 : start;
				end = end === undef ? v.length : end;
				if (el.setSelectionRange) {
					el.setSelectionRange(start, end);
				}
				else if(el.createTextRange) {
					range = el.createTextRange();
					range.moveStart('character', start);
					range.moveEnd('character', end - v.length);
					range.select();
				}
				
			}
			self.focus();
		},
		"blur" : function(){
			var self = this;
			try{
				self.getInput().blur();
			} catch(e){}
		},
		checkVal : function(){
			var self = this;
			var opt = self.configs;
			var r = true;
			var rules = opt.rules;
			var validator = opt.validator;
			var rule;
			var value = self.val();
			//var value = $.nexForm.getVal( opt.name,opt.group );
			var checkList = {};//验证函数
			if( $.isArray( rules ) && rules.length ) {
				for( var x=0;x<rules.length;x++ ) {
					rule = rules[x];
					if( $.isFunction(rule) ) {
						//r = rule.call(self,value);
						checkList['checklist_'+x] = rule;
					} else if( $.isPlainObject(rule) ){
						for(var i in rule ) {
							if( $.isFunction( rule[i] ) ) {
								//r = rule[i].call(self,value);
								checkList['checklist_'+i] = rule[i];
							}else if( i in validator.methods ) {
								//r = validator.methods[i].call(self,value,rule[i]);
								checkList['checklist_'+i] = { method : i,params : rule[i] };
							}
						}
					} else {
						if( rule in validator.methods ) {
							//r = validator.methods[rule].call(self,value);
							checkList['checklist_'+rule] = rule;
						}
					}
				}
			} else if( typeof rules == 'string' ) {
				if( rules in validator.methods ) {
					//r = validator.methods[rule].call(self,value);
					checkList['checklist_'+rules] = rules;
				}	
			}
			for( rule in checkList ) {
				var _rule = checkList[ rule ];
				var m_rule = rule.replace('checklist_','');

				if( $.isFunction( checkList[rule] ) ) {
					m_rule = opt.name;
					r = checkList[rule].call( self,value );
					if( r === false) break;
				} else if( $.isPlainObject(checkList[rule]) ) {
					if( checkList[rule].method in validator.methods ) {
						r = validator.methods[ checkList[rule].method ].call(self,value,checkList[rule].params);
						if( r === false) break;
					}	
				} else {
					if( _rule in validator.methods ) {
						//r = validator.methods[rule].call(self,value);
						r = validator.methods[_rule].call(self,value);
						if( r === false) break;
					}	
				}
			}
			
			if( r === false ) {
				var errorMsg = '';
				if( $.isPlainObject( opt.messages ) ) {
					errorMsg = opt.messages[m_rule] || validator.messages[m_rule] || m_rule;
				} else {
					errorMsg = 	opt.messages;
				}
				self.fireEvent("onValidError",[errorMsg,m_rule]);	
			} else {
				self.fireEvent("onValidSuccess",[]);		
			}
			
			return r;
		},
		isValid : function(){
			return this.checkVal();	
		},
		"reset" : function(){
			var self = this;
			var opt = self.configs;
			opt.value = opt._value;
			self._setValue();
			self.blur();
			clearTimeout( opt._ct );//取消验证
			self.onValidSuccess();	
		},
		//获取数据 ,一般作为内部使用
		val : function(){
			var self = this,undef;
			var opt = self.configs;
			
			//设置当前值
			if( arguments.length ) {
				self.fireEvent('onBeforeSet',[]);	
				var method = opt.type+'SetValue';
				var argvs = arguments;
				
				if( $.isFunction( opt.setFormater ) ) {
					var val = opt.setFormater.apply( self,arguments );
					if( val !== undef ) {
						if( !$.isArray( argvs ) ) {
							argvs = [ val ];	
						}
					}
				}
				
				if( method in self ) {
					self[method].apply(self,argvs);	
				} else {
					self.commonSetValue.apply(self,argvs);
				}
				self.fireEvent('onAfterSet',[]);	
				//opt.value = arguments[0];
				return self;
			}
			
			var value = '';
			
			self.fireEvent('onBeforeGet',[]);	
			
			var method = opt.type+'GetValue';
			if( method in self ) {
				value = self[method].call(self);	
			} else {
				value = self.commonGetValue();
			}
			
			self.fireEvent('onAfterGet',[]);	
			
			if( $.isFunction( opt.getFormater ) ) {
				var val = opt.getFormater.call( self,value );
				value = val === undef ? value : val;
			}
			
			return value;
		},
		//一般作为外部使用 又val 区别在于可做最终数据处理
		getValue : function(){
			return this.val();	
		},
		setValue : function(){
			return this.val.apply(this,arguments);	
		},
		//根据type创建控件
		commonCreaet : function(){
			var self = this;
			var opt = self.configs;
			
			var target = opt.helper;
			
			var render = $(opt.renderTo);
			
			var method = opt.type + 'Tpl';
			
			if( method in self ) {
				var wraper = $( self.tpl(opt.type.toString()+'Tpl',opt) );
			} else {
				var wraper = $( self.commonCreateTpl(opt) );	
			}
			if( render.length ) {
				render.append( wraper );
			} else {
				target.after( wraper ).remove();
			}
			opt.helper = wraper;	
		},
		commonEvent : function(){
			var self = this;
			var opt = self.configs;
			
			var events = {
				'click' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return false;	
					}
					var r = self.fireEvent('onClick',[ this,e ]);	
					if( r === false ) return false;
				},
				'focus' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return false;	
					}
					var input = $('#'+opt.id+"-input");
					input.addClass('nex-form-focus');
					$('#'+opt.id+"").addClass('nex-form-wraper-focus');
					
					if( input.hasClass("nex-form-empty-field") && opt.isIE ) {
						input.removeClass("nex-form-empty-field")
						input.val('');
					}
					
					var r = self.fireEvent('onFocus',[ this,e ]);	
					if( r === false ) return false;
				},
				'blur' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var input = $('#'+opt.id+"-input");
					input.removeClass('nex-form-focus');
					
					$('#'+opt.id+"").removeClass('nex-form-wraper-focus');
					
					if( (input.val() === '') && Nex.IEVer && Nex.IEVer<10 && ( opt.placeholder !== '' )  ) {
						input.addClass("nex-form-empty-field");
						input.val(opt.placeholder);
					}
					
					var r = self.fireEvent('onBlur',[ this,e ]);	
					if( r === false ) return false;
				},
				'keydown' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					opt._oldVal = opt._oldVal === null ? $(this).val() : opt._oldVal;
					var r = self.fireEvent('onKeyDown',[ this,e ]);	
					if( r === false ) return false;
					
				},
				'keyup' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var val = $(this).val();
					if( opt._oldVal !== val && opt._oldVal!==null ) {
						var r = self.fireEvent('onChange',[ this,opt._oldVal,val,e ]);	
						opt._oldVal =null;
						if( r === false ) return false;
					}
					var r = self.fireEvent('onKeyUp',[ this,e ]);	
					if( r === false ) return false;
				},
				'keypress' : function(e){
					if( opt.disabled || opt.readOnly ) {
						return;		
					}
					var r = self.fireEvent('onKeyPress',[ this,e ]);	
					if( r === false ) return false;
					
				},
				'mouseenter' : function(e){
					if( opt.disabled || opt.readOnly ) {
						return;		
					}
					var r = self.fireEvent('onMouseOver',[ this,e ]);	
					if( r === false ) return false;
					
				},
				'mouseleave' : function(e){
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var r = self.fireEvent('onMouseOut',[ this,e ]);	
					if( r === false ) return false;
				},
				'change' : function(e){
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var r = self.fireEvent('onChange',[ this,e ]);	
					if( r === false ) return false;	
				},
				'paste' : function(e){
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var r = self.fireEvent('onPaste',[ this,e ]);	
					if( r === false ) return false;
				},
				'mousedown' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var r = self.fireEvent('onMouseDown',[ this,e ]);	
					if( r === false ) return false;
				},
				'mouseup' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var r = self.fireEvent('onMouseUp',[ this,e ]);	
					if( r === false ) return false;
				}
			};
			
			var input = $("#"+opt.id+"-input");
			
			input.bind(events);
		},
		refreshFormater : function(){
			var self = this,undef;
			var opt = self.C();	
			if( $.isFunction( opt.formater ) ) {
				var value = self.val();
				var _value = opt.formater.call( self,value );
				value = _value === undef ? value : _value;
				self.val( value );
			}	
		},
		/*
		*映射 只有使用api val() 才有效
		*/
		refreshRenderer : function( input,e ){
			var self = this;
			var opt = self.C();	
			if( $.isPlainObject( opt.renderer ) && $.isEmptyObject( opt.renderer ) ) {
				return ;	
			}
			var value = self.val();
			self.val( value );
		},
		/*
		* 映射
		*/
		rendererEncode : function(str){
			var self = this;
			var opt = self.C();	
			var renderer = opt.renderer;
			var value = '';
			
			if( $.isPlainObject( opt.renderer ) && $.isEmptyObject( opt.renderer ) ) {
				return str;	
			}
			
			if( $.isFunction( opt.renderer ) ) {
				value = self.tpl( renderer , str );	
			} else if( $._isPlainObject( renderer ) ) {
				if( str in renderer ) {
					value = self.tpl( renderer[str] , str );		
				} else if( opt.rendererDef in renderer ) {
					value = self.tpl( renderer[opt.rendererDef] , str );			
				} else {
					value = str;	
				}
			} else {
				value = str;	
			}
			opt._renderer[ value ] = str;
			return value;
		},
		/*
		*反映射
		*/
		rendererDecode : function(str){
			var self = this;
			var opt = self.C();	
			
			if( $.isPlainObject( opt.renderer ) && $.isEmptyObject( opt.renderer ) ) {
				return str;	
			}
			
			var value = '';
			if( str in opt._renderer ) {
				value = opt._renderer[str];	
			}else {
				value = str;	
			}
			return value;
		},
		//通用获取
		commonGetValue : function(){
			var self = this;
			var opt = self.configs;
			var input = $("#"+opt.id+"-input");
			
			var value = '';
			
			if( input.hasClass("nex-form-empty-field") && opt.isIE ) {
				value = '';	
			} else {
				value = input.val();		
			}
			
			return $.trim( self.rendererDecode(value) );
		},
		//通用设置
		commonSetValue : function(){
			var self = this,undef;
			var opt = self.C();
			var input = $("#"+opt.id+"-input");
			
			if( Nex.IEVer && Nex.IEVer<10 && ( opt.placeholder !== '' ) ) {
				if( arguments[0]+'' === '' ) {
					input.addClass("nex-form-empty-field");	
					arguments[0] = opt.placeholder;
				} else {
					input.removeClass("nex-form-empty-field");		
				}
			}
			
			var value = arguments[0];
			
			if( $.isFunction( opt.formater ) ) {
				var _value = opt.formater.call( self,value );
				value = _value === undef ? value : _value;
			}
			
			input.val( self.rendererEncode(value) );
			
			return self;
		},
		commonSetSize : function(width,height){
			var self = this;
			var opt = self.configs;
			
			var $table = $("#"+opt.id+"-item");
			
			var $input = $("#"+opt.id+"-input");
			
			$("#"+opt.id)._outerWidth( width );
			
			var lw = 0;
			$("#"+opt.id+"-inputRow >td.nex-form-label-cell").each(function(){
				lw += $(this)._outerWidth();																
			});
			$("#"+opt.id+"-inputRow >td.nex-form-button-cell").each(function(){
				lw += $(this)._outerWidth();																
			});
			
			$table._outerWidth( width );
			
			$input._outerWidth( width - lw );		
		},
		commonCreateTpl : function(d){
			if( !d ) return "";
			var self = this,
				opt = self.configs;
			var text = [];
			text.push('<div class="nex-form-wraper '+d.cls+' nex-field-'+d.group+'" style="" id="'+d.id+'">');
				text.push('<table id="'+d.id+'-item" class="nex-field nex-form-item" cellspacing="0" cellpadding="0"><tbody>');
				text.push('<tr id="'+d.id+'-inputRow">');
					text.push('<td class="nex-form-item-body" id="'+d.id+'-body" style="width: 100%;">');	
						text.push('<input '+d.attrs+' id="'+d.id+'-input" placeholder="'+d.placeholder+'" type="'+d.type+'"  name="'+d.name+'" value="" style="width:0px;" class="nex-form-field nex-form-text" autocomplete="'+d.autocomplete+'" />');
					text.push('</td>');
				text.push('</tr>');
			text.push('</tbody></table></div>');
			return text.join("");	
		},
		setLabelText : function(text,m,width){
			var self = this;
			var opt = self.configs;
			var d = opt;
			
			d.labelText = self._undef( text , d.labelText );
			
			var labelAlign = self._undef( m , d.labelAlign );
			
			d.labelWidth = self._undef( width , d.labelWidth );
			
			if( d.labelText === '' || d.labelWidth<=0 ) return false;
			
			var inputRow = $("#"+opt.id+"-inputRow");
			
			var td = [];
			if( self.inArray(labelAlign,['left','right']) != -1 ) {
				td.push('<td valign="top" halign="left" class="nex-form-label-cell">');	
						td.push('<label id="'+d.id+'-labelText-'+(Nex.aid++)+'" for="'+d.id+'-input" class="nex-form-item-label nex-form-item-label-'+labelAlign+'">'+d.labelText+'</label>');
				td.push('</td>');
			} else {
				td.push('<tr><td valign="top" halign="left" colspan='+$(">td",inputRow).size()+' class="nex-form-label-cell">');	
						td.push('<label id="'+d.id+'-labelText-'+(Nex.aid++)+'" for="'+d.id+'-input" class="nex-form-item-label nex-form-item-label-'+labelAlign+'">'+d.labelText+'</label>');
				td.push('</td></tr>');	
			}
			
			var td = $(td.join(""));
			
			td.find(">label")._outerWidth( opt.labelWidth );
			
			if( labelAlign === 'left' ) {
				$("#"+opt.id+"-body").before(td);
			} else if( labelAlign === 'right' ) {
				$(">td:last",inputRow).after(td);
			} else if( labelAlign === 'top' ) {
				inputRow.before(td);
			} else {
				inputRow.after(td);	
			}
			
			//self.setSize();
			self.methodInvoke('setSize');
			
			return td;
		},
		removeLabelText : function(td){
			var self = this;
			td.remove();
			self.setSize();
		},
		addItemButton : function(msg,w){
			var self = this;
			var opt = self.configs;
			var d = opt;
			
			//var w = self._undef( w , 17 );
			var w = self._undef( w , false );
			
			var td = [];
			
			td.push('<td valign="top" align="left" class="nex-form-button-cell">');	
					td.push('<div id="'+d.id+'-button-'+(Nex.aid++)+'" class="nex-form-item-button"></div>');
			td.push('</td>');	
			var td = $(td.join(""));
			
			var itemBtnTd = $("#"+opt.id+"-inputRow td:last");
			itemBtnTd.after(td);
			var itemBtn = td.find(">div");
			if( w ) {
				itemBtn._outerWidth( w );
			}
			
			self.addComponent( itemBtn,msg );
			
			self.setSize();
			return td;	
		},
		/*
		*@m true 返回数据 默认 false返回索引
		*/
		getItemData : function(value,m){
			var self = this,
				undef,
				opt = self.configs,
				m = m === undef ? true : m,
				items = opt.items || [];	
			var _v = value;	
			if( value === undef ) return null;
			if( $.type( value ) === 'string' ) {
				value = value.split( opt.multiSplit );	
				if( value.length>1 ) {
					_v = value;	
				}
			} else if( $.type( value ) !== 'array' ) {
				value = [ value ];	
			}
			var d = {};
			$.each( value,function(i,v){
				d[v] = true;					   
			} );
			var list = [];
			$.each( items , function(i,v){
				if( !$.isPlainObject( v ) ) return;
				var value = v['value'];
				if( value in d ) {
					list.push( m?v:i );	
				}
			} );
			
			if( list.length === 1 && $.type( _v ) !== 'array' ) {
				return list[0];	
			} else {
				return list;	
			}
		},
		getItemIndex : function(value){
			return this.getItemData( value,false );
		},
		removeItemButton : function(){
			this.removeLabelText();
		},
		hiddenInit : function(opt){
			var self = this;
			self.one("onCreate",function(){
				self.hidden();  
			});	
		},
		displayGetValue : function(){
			var self = this;
			var opt = self.configs;
			var input = $("#"+opt.id+"-input");
			
			var value = input.html();
			
			return $.trim( self.rendererDecode(value) );
		},
		displaySetValue : function(){
			var self = this,undef;
			var opt = self.configs;
			var input = $("#"+opt.id+"-input");
			
			var value = arguments[0];
			
			if( $.isFunction( opt.formater ) ) {
				var _value = opt.formater.call( self,value );
				value = _value === undef ? value : _value;
			}
			
			input.html( self.rendererEncode(value) );
			
			//input.html(arguments[0]);
			
			return self;
		},
		displayTpl :　function(d){
			if( !d ) return "";
			var self = this,
				opt = self.configs;
			var text = [];
			text.push('<div class="nex-form-wraper '+d.cls+' nex-field-'+d.group+'" style="" id="'+d.id+'">');
				text.push('<table id="'+d.id+'-item" class="nex-field nex-form-item" cellspacing="0" cellpadding="0"><tbody>');
				text.push('<tr id="'+d.id+'-inputRow">');
					text.push('<td class="nex-form-item-body" id="'+d.id+'-body" style="width: 100%;">');	
						text.push('<div '+d.attrs+' id="'+d.id+'-input" style="width:0px;" class="nex-form-field nex-form-display"></div>');
					text.push('</td>');
				text.push('</tr>');
			text.push('</tbody></table></div>');
			return text.join("");
		},
		textSetSize : function(width,height){
			this.commonSetSize(width,height);
		},
		textTpl :　function(d){
			return this.commonCreateTpl(d);
		},
		passwordSetSize : function(width,height){
			this.commonSetSize(width,height);
		},
		passwordTpl : function(d){
			return this.commonCreateTpl(d);
		},
		textareaSetSize : function(width,height){
			var self = this;
			var opt = self.configs;
			
			var $table = $("#"+opt.id+"-item");
			
			var $input = $("#"+opt.id+"-input");
			
			$("#"+opt.id)._outerWidth( width );
			
			var lw = 0;
			$("#"+opt.id+"-inputRow >td.nex-form-label-cell").each(function(){
				lw += $(this)._outerWidth();																
			});
			$("#"+opt.id+"-inputRow >td.nex-form-button-cell").each(function(){
				lw += $(this)._outerWidth();																
			});
			
			$table._outerWidth( width );
			
			$input._outerWidth( width - lw );	
			$input._outerHeight( height );	
		},
		textareaTpl :　function(d){
			if( !d ) return "";
			var self = this,
				opt = self.configs;
			var text = [];
			text.push('<div class="nex-form-wraper '+d.cls+' nex-field-'+d.group+'" style="" id="'+d.id+'">');
				text.push('<table id="'+d.id+'-item" class="nex-field nex-form-item" cellspacing="0" cellpadding="0"><tbody>');
				text.push('<tr id="'+d.id+'-inputRow">');
					text.push('<td class="nex-form-item-body" id="'+d.id+'-body" style="width: 100%;">');	
						text.push('<textarea '+d.attrs+' id="'+d.id+'-input" placeholder="'+d.placeholder+'"  name="'+d.name+'" style="width:0px;" class="nex-form-field nex-form-text nex-form-textarea" autocomplete="'+d.autocomplete+'"></textarea>');
					text.push('</td>');
				text.push('</tr>');
			text.push('</tbody></table></div>');
			return text.join("");
		},
		comboBindEvent : function(){
			var self = this;
			var opt = self.configs;
			self.commonEvent();
			
			var input = $("#"+opt.id+'-input');
			var combo = $("#"+opt.id+"-combo");
			var events = {
				'click' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var r = self.fireEvent('onComboClick',[ input.get(0),e ]);	
					if( r === false ) return false;
					var r = self.fireEvent('onClick',[ input.get(0),e ]);	
					if( r === false ) return false;
				},
				'mouseenter' : function(e){
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var r = self.fireEvent('onComboMouseOver',[ input.get(0),e ]);	
					if( r === false ) return false;
					var r = self.fireEvent('onMouseOver',[ input.get(0),e ]);	
					if( r === false ) return false;
					combo.addClass("nex-form-combo-over");
				},
				'mouseleave' : function(e){
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var r = self.fireEvent('onComboMouseOut',[ input.get(0),e ]);	
					if( r === false ) return false;
					var r = self.fireEvent('onMouseOut',[ input.get(0),e]);	
					if( r === false ) return false;
					combo.removeClass("nex-form-combo-over");
				},
				'mousedown' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var r = self.fireEvent('onComboMouseDown',[ input.get(0),e ]);	
					if( r === false ) return false;
					var r = self.fireEvent('onMouseDown',[ input.get(0),e]);	
					if( r === false ) return false;
					combo.addClass("nex-form-combo-click");
					$(document.body).mouseup(function(){
						combo.removeClass("nex-form-combo-click");								  
					});
				},
				'mouseup' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;		
					}
					var r = self.fireEvent('onComboMouseUp',[ input.get(0),e ]);	
					if( r === false ) return false;
					var r = self.fireEvent('onMouseUp',[ input.get(0),e]);	
					if( r === false ) return false;
					combo.removeClass("nex-form-combo-click");
				}
			};
			
			combo.bind( events );
			
		},
		comboSetSize : function(width,height){
			var self = this;
			var opt = self.configs;
			
			var $table = $("#"+opt.id+"-item");
			
			var $input = $("#"+opt.id+"-input");
			
			$("#"+opt.id)._outerWidth( width );
			
			var lw = 0;
			$("#"+opt.id+"-inputRow >td.nex-form-label-cell").each(function(){
				lw += $(this)._outerWidth();																
			});
			$("#"+opt.id+"-inputRow >td.nex-form-combo-cell").each(function(){
				lw += $(this)._outerWidth();																
			});
			$("#"+opt.id+"-inputRow >td.nex-form-button-cell").each(function(){
				lw += $(this)._outerWidth();																
			});
			
			$table._outerWidth( width );
			
			$input._outerWidth( width - lw );	
		},
		comboTpl : function(d){
			if( !d ) return "";
			var self = this,
				opt = self.configs;
			var text = [];
			text.push('<div class="nex-form-wraper '+d.cls+' nex-field-'+d.group+'" style="" id="'+d.id+'">');
				text.push('<table id="'+d.id+'-item" class="nex-field nex-form-item" cellspacing="0" cellpadding="0"><tbody>');
				text.push('<tr id="'+d.id+'-inputRow">');
					text.push('<td class="nex-form-item-body" id="'+d.id+'-body" style="width: 100%;">');	
						text.push('<input '+d.attrs+' id="'+d.id+'-input" placeholder="'+d.placeholder+'" type="text"  name="'+d.name+'" value="" style="width:0px;" class="nex-form-field nex-form-text" autocomplete="'+d.autocomplete+'" />');
					text.push('</td>');
					text.push('<td class="nex-form-combo-cell nex-form-'+d.type+'-cell" id="'+d.id+'-combo-cell">');	
						text.push('<div class="nex-form-combo nex-form-'+d.type+'-combo" id="'+d.id+'-combo"></div>');
					text.push('</td>');
				text.push('</tr>');
			text.push('</tbody></table></div>');
			return text.join("");	
		},
		dateBindEvent : function(){
			this.comboBindEvent();
		},
		dateSetSize : function(width,height){
			this.comboSetSize(width,height);	
		},
		dateTpl : function(d){
			return this.comboTpl(d);	
		},
		/*
		*创建List
		*/
		selectCreateList : function(lists){
			var self = this;
			var opt = self.configs;
			
			var r = self.fireEvent("onBeforeSelectListCreate",[self._undef(lists,opt.items),opt]);
			if( r === false ) {
				return r;	
			}
			
			var list = [];
			//创建
			list.push('<div id="'+opt.id+'_list" class="nex-form-select-list" tabindex="-1" style="display:none;">');
				list.push('<div id="'+opt.id+'_list_body" class="nex-form-select-list-body" tabindex="-1" style="">');
					var items = self._undef(lists,opt.items);
					for( var x=0;x<items.length;x++ ) {
						items[x] = $.extend({},opt._item,items[x]);
						var item = items[x];
						item.value = self._undef( item.value,item.text );
						item.text = self._undef( item.text,item.value );
						var icls = [];
						if( items[x]['disabled'] ) {
							icls.push('nex-form-select-list-item-disabled');	
						}
						if( items[x]['selected'] ) {
							icls.push('nex-form-select-list-item-selected');	
						}
						if( $.isFunction( opt.listFilter ) ) {
							var r = opt.listFilter.call( self,items[x] );
							if( r === false ) continue;
						}
						var r = self.fireEvent("onSelectListItemCreate",[items[x],list,opt]);
						if( r === false ) continue;//value="'+items[x]['value']+'"
						list.push('<div  itemindex="'+x+'" class="nex-form-select-list-item '+items[x]['cls']+' '+icls.join(' ')+'" id="'+opt.id+'_'+x+'_item">'+self.tpl(items[x]['text'],items[x])+'</div>');	
					}
				list.push('</div>');
			list.push('</div>');
			
			var list = $( list.join("") );
			
			var _itemList = $('.nex-form-select-list-item',list);
			
			_itemList.each(function(){
				var index = $(this).attr( 'itemindex' );
				var item = items[index];
				$(this).attr('value',item['value'])
					   .data('itemData',item);
			});
			
			list.appendTo(document.body);
			
			//设置大小
			var input = self.getInput();
			var space = self._getShowSpace( input );
			var h = list._outerHeight();
			var w = list._outerWidth();
			//selectListMinHeight : 50
			var minWidth = $('#'+opt.id+'-body')._outerWidth() + $('#'+opt.id+'-combo-cell')._outerWidth();
			w = Math.max( w,minWidth );
			w = Math.min( w,$(window).width() );
			h = Math.min( h,Math.max(space.bottom,space.top) );
			//selectListMaxHeight
			//selectListMaxWidth
			//最后计算大小
			if( opt.selectListMaxWidth>0 ) {
				if( opt.selectListMaxWidth > minWidth ) {
					w = Math.min( w,opt.selectListMaxWidth );	
				}
			}
			if( opt.selectListMaxHeight>0 ) {
				h = Math.min( h,opt.selectListMaxHeight );
			}
			
			list._outerWidth( w );
			list._outerHeight( h );
			
			/*创建一个shadow*/
			var shadow = $('<div id="'+opt.id+'_list_shadow" class="nex-form-select-shadow"><iframe style="width:99%;height:99%;"></iframe><div>');
			shadow.appendTo( document.body );
			shadow._width( w );
			shadow._height( h );
			
			//事件绑定
			var events = {
				selectstart : function(e){
					return false;	
				},
				mouseenter : function(e){
					self.fireEvent("onSelectItemOver",[this,e]);
					if( $(this).hasClass('nex-form-select-list-item-disabled') ) return;
					$(this).addClass("nex-form-select-list-item-over");
				},
				mouseleave : function(e){
					self.fireEvent("onSelectItemOut",[this,e]);
					if( $(this).hasClass('nex-form-select-list-item-disabled') ) return;
					$(this).removeClass("nex-form-select-list-item-over");
				},
				click : function(e) {
					self.fireEvent("onSelectItemClick",[this,e]);
					if( $(this).hasClass('nex-form-select-list-item-disabled') ) return false;
					var value = $(this).attr('value');
					var text = $(this).html();
					opt.multiSelect = self._undef(opt.multiSelect,false);
					if( !opt.multiSelect ) {//单选
						self.val(value);
						//self.selectUpdateValue();		
						self.selectHideList();
						//return false;//事件冒泡
					} else {//多选
						
						//return false;
					}
					
				}
			};
			_itemList.bind(events);
			
			self.fireEvent("onSelectListCreate",[list,opt]);
				
			return list;
		},
		/*
		*销毁selectList
		*/
		selectHideList : function(){
			var self = this,undef;
			var opt = self.C();
			var list = $('#'+opt.id+'_list');
			//if( opt.selectReadOnly ) {
				//self.blur();
			//}
			list.remove();
			//shadow
			var shadow = $('#'+opt.id+'_list_shadow');
			shadow.remove();
			//$(document).unbind("click.selectList"+opt.id);	
			//self.unbind('onBlur.selectList');
			$(document).unbind('mousedown.selectList'+opt.id);
			$(document).unbind('contextmenu.selectList'+opt.id);
			$(document).unbind('mousewheel.selectList'+opt.id);
			$(document).unbind("keydown.selectList"+opt.id);	
			$(window).unbind("resize.selectList"+opt.id);	
			self.fireEvent("onSelectListHide",[opt]);
		},
		/*
		*滚动到指定item
		*/
		scrollToItem : function(val){
			var self = this;
			var opt = self.configs;	
			var menus = opt.items;
			for( var i=0;i<menus.length;i++ ) {
				if( menus[i]['value']+'' === val+'' ) {
					break;
				}	
			}
			
			var body = $("#"+opt.id+"_list");
			
			if( !body.length ) {
				return self;	
			}
			
			var offset = body.offset();
			var h = body._outerHeight();
			
			var f = $("#"+opt.id+"_"+i+"_item");
			if( !f.length ) {
				return self;	
			}
			
			var fo = f.offset();
			var fh = f._outerHeight();
			
			var outerHeight = 0;
			if( offset.top > fo.top ) {
				outerHeight = offset.top - fo.top;
			} else if( (offset.top+h) < (fo.top+fh) ) {
				outerHeight = (offset.top+h) - (fo.top+fh);
			}
			
			var sTop = 0;
			
			sTop = body.scrollTop() - outerHeight;
			
			body.scrollTop( sTop );
			
			return self;
		},
		/*
		*创建并显示 select 下拉框
		*/
		selectShowList : function( lists ){
			var self = this,undef;
			var opt = self.C();
			var list = $('#'+opt.id+'_list');
			if( list.size() ) {
				self.selectHideList();	
			} else {
				setTimeout(function(){
					self.getInput().addClass('nex-form-focus');
					$('#'+opt.id).addClass('nex-form-wraper-focus');					
				},0);		
				var zIndex = Nex['zIndex']+2;
				Nex['zIndex'] = zIndex;
				//创建list
				list = self.selectCreateList(lists);	
				list.css('zIndex',zIndex);
				if( opt.showAt.at ) {
					opt.showAt.el = opt.showAt.at;
				}
				list.showAt( $.extend({el:self.getInput(), xAlign:'left',yAlign:'bottom',offsetY:-1 },opt.showAt) );
				//滚动到所选item
				self.scrollToItem( list.find('.nex-form-select-list-item-selected').attr('value') );
				//shadow
				var shadow = $('#'+opt.id+'_list_shadow');
				shadow.css( list.offset() )
					  .css( 'zIndex',zIndex-1 );
				//显示后绑定 关闭功能
				$(document).bind('mousewheel.selectList'+opt.id+' contextmenu.selectList'+opt.id+' mousedown.selectList'+opt.id,function(e){
					var target = e.target || e.srcElement;
					if( $(target).is( '#'+opt.id ) 
						|| $(target).is( '#'+opt.id+'_list' ) 
						|| $(target).parents('#'+opt.id+'_list,#'+opt.id).size() 
					) {
						//
					} else {
						self.selectHideList();		
					} 
				});
				$(window).bind('resize.selectList'+opt.id,function(){
					self.selectHideList();			
				});
				//不可设置
				/*self.bind('onBlur.selectList',function(){
					self.selectHideList();		
				});*/
				//支持上下键选择
				$(document).bind("keydown.selectList"+opt.id,function(e){
					var sbody = $("#"+opt.id+"_list_body");
					var s = sbody.find(".nex-form-select-list-item-over:last");
					if( !s.size() ) {
						s = sbody.find(">div.nex-form-select-list-item-selected:last");
						if( !s.size() ) {
							s = sbody.find(".nex-form-select-list-item:first");	
						}
					}
					
					if( !s.size() ) return;
					var it = s;
					switch( e.keyCode ) {
						case 38 : //up
							sbody.find(">div.nex-form-select-list-item").removeClass("nex-form-select-list-item-over");
							var prev = s.prev();
							if( prev.size() ) {
								it = prev;
								prev.addClass("nex-form-select-list-item-over");	
							} else {
								s.addClass("nex-form-select-list-item-over");		
							}
							self.scrollToItem( it.attr('value') );
							break;
						case 40 : //down
							sbody.find(">div.nex-form-select-list-item").removeClass("nex-form-select-list-item-over");
							var next = s.next();
							if( next.size() ) {
								it = next;
								next.addClass("nex-form-select-list-item-over");	
							} else {
								s.addClass("nex-form-select-list-item-over");		
							}
							self.scrollToItem( it.attr('value') );
							break;
						case 13:
							sbody.find(">div.nex-form-select-list-item-over").click();
							//键盘触发 并不会触发是输入框失去焦点
							self.blur();
							break;
					}
					
				});	
				
				self.fireEvent("onSelectListShow",[list,opt]);
			}
		},
		selectInit : function(){
			var self = this,undef;
			var opt = self.configs;
			self.bind('onClick.select',function(input,e){
				self.selectShowList();
				self.focus();
				//if( opt.selectReadOnly ) {
					//self.blur();
				//}
				//setTimeout(function(){
					//self.getInput().addClass('nex-form-focus');
					//$('#'+opt.id).addClass('nex-form-wraper-focus');					
				//},0);
			});
		},
		selectBindEvent : function(width,height){
			var self = this;
			self.comboBindEvent();
		},
		selectGetText : function( val ){
			var self = this;
			var opt = self.configs;	
			var menus = opt.items;
			for( var i=0;i<menus.length;i++ ) {
				if( menus[i]['value']+'' === val+'' ) {//不建议用全等于
					return  menus[i]['text'];
				}	
			}
			return undefined;
		},
		unSelectItem : function(val){
			var self = this;
			var opt = self.configs;	
			var menus = opt.items;
			for( var i=0;i<menus.length;i++ ) {
				if( menus[i]['value']+'' === val+'' ) {
					menus[i]['selected'] = false;
					$('#'+opt.id+'_'+i+'_item').removeClass('nex-form-select-list-item-selected');
				}	
			}	 
		},
		/*
		*只适合单选,而且只是选择下拉框的选中状态
		*/
		selectItem : function( val ){
			var self = this;
			var opt = self.configs;	
			var lbody = $("#"+opt.id+"_list_body");
			lbody.find(">div.nex-form-select-list-item")
				 .removeClass("nex-form-select-list-item-selected");
			var menus = opt.items;
			for( var i=0;i<menus.length;i++ ) {
				if( menus[i]['value']+'' === val+'' ) {
					menus[i]['selected'] = true;
					$('#'+opt.id+'_'+i+'_item').addClass('nex-form-select-list-item-selected');
					self.scrollToItem( val );
				} else {
					menus[i]['selected'] = false;	
				}
			}	 
		},
		selectGetValue : function(){
			var self = this;
			var opt = self.configs;	
			
			self.commonGetValue.apply( self, arguments );
			
			var key = self.getInputKey();
			return key.val();
		},
		selectSetValue : function(val,stext){
			var self = this,undef;
			var opt = self.configs;
			
			self.commonSetValue.apply( self, arguments );
			
			opt.multiSelect = self._undef(opt.multiSelect,false);
			if( !arguments.length )  return self;
			var menus = opt.items;
			if( !opt.multiSelect ) {//单选
				var text = self.selectGetText( val );
				if( text === undef ) {
					text = val;
				}
				if( stext !== undef ) {
					text = stext;	
				}
				var input = self.getInput();
				var key = self.getInputKey();
				input.val( text );
				key.val( val );
				self.selectItem( val );
			} else {//多选
					
			}
			return self;	
		},
		selectSetSize : function(width,height){
			this.comboSetSize(width,height);	
		},
		selectTpl : function(d){
			if( !d ) return "";
			var self = this,
				opt = self.configs;
			var text = [];
			text.push('<div class="nex-form-wraper '+d.cls+' nex-field-'+d.group+'" style="" id="'+d.id+'">');
				text.push('<table id="'+d.id+'-item" class="nex-field nex-form-item" cellspacing="0" cellpadding="0"><tbody>');
				text.push('<tr id="'+d.id+'-inputRow">');
					text.push('<td class="nex-form-item-body" id="'+d.id+'-body" style="width: 100%;">');	
						text.push('<input '+d.attrs+' id="'+d.id+'-input" '+( opt.selectReadOnly ? 'readonly' : '' )+' placeholder="'+d.placeholder+'" type="text"  name="'+d.name+'_text" value="" style="width:0px;" class="nex-form-field nex-form-text" autocomplete="'+d.autocomplete+'" />');
						text.push('<input id="'+d.id+'-input-key" type="hidden"  name="'+d.name+'" value="" />');
					text.push('</td>');
					text.push('<td class="nex-form-combo-cell nex-form-'+d.type+'-cell" id="'+d.id+'-combo-cell">');	
						text.push('<div class="nex-form-combo nex-form-'+d.type+'-combo" id="'+d.id+'-combo"></div>');
					text.push('</td>');
				text.push('</tr>');
			text.push('</tbody></table></div>');
			return text.join("");	
		},
		/*多选框*/
		multiselectClearItemSelected : function(){
			var self = this,undef,
				opt = self.configs,
				input = self.getInput();
			$('>.nex-form-multiselect-list-item',input).removeClass('nex-form-multiselect-list-item-selected');
			var key = self.getInputKey();
			key.val('');
			return self;
		},
		multiselectItemUnSelected : function(v){
			var self = this,undef,
				opt = self.configs,
				sDot = opt.multiSplit;	
			if( v === undef ) return false;	
			if( $.type( v ) === 'string' ) {
				v = v.split( sDot );	
			} else if( $.type( v ) !== 'array' ) {
				v = [ v ];	
			}
			var value = self.val();
			value = value.split( sDot );
			var dels = {};
			$.each(v,function(i,vv){
				dels[vv] = true;					  
			});
			self.array_splice( function(i,val){
				if( val in dels ) return true;	
			},value );
			self.multiselectItemSelected(value);
			return true;
		},
		multiselectItemSelected : function( v,m ){
			var self = this,undef,
				opt = self.configs,
				sDot = opt.multiSplit,
				m = m === undef ? false : m,//m=false 单选
				input = self.getInput();
			if( v === undef ) return false;	
			if( $.type( v ) === 'string' ) {
				v = v.split( sDot );	
			} else if( $.type( v ) !== 'array' ) {
				v = [ v ];	
			}
			//单选
			if( opt.singleSelect ) {
				m =  false;	
				if( self.inArray( opt._firstIndex,v ) === -1 ) {
					v = [v.pop()];	
				} else {
					v = [opt._firstIndex];
				}
			}
			
			if( !m ) {
				self.multiselectClearItemSelected();
			}
			var values = [];
			var sv = null;
			$('>.nex-form-multiselect-list-item',input).each(function(){
				var item = $(this);
				if( item.hasClass('nex-form-multiselect-list-item-disabled') ) return;
				var value = item.attr('value');
				var data = self.getItemData( value );
				if( self.inArray( value,v ) !== -1 ) {
					if( item.hasClass( 'nex-form-multiselect-list-item-selected' ) && opt.isCtrlKey && !opt.isShiftKey ) {
						var r = self.fireEvent('onItemUnSelected',[item,data,opt]);
						if( r !== false ) {
							item.removeClass('nex-form-multiselect-list-item-selected');
						}
					} else {
						var r = self.fireEvent('onItemSelected',[item,data,opt]);
						if( r !== false ) {
							item.addClass('nex-form-multiselect-list-item-selected');	
						}
					}
					sv = value;
				}
				if( item.hasClass( 'nex-form-multiselect-list-item-selected' ) ) {
					values.push( value );	
				}
			});
			
			self.multiselectScrollToItem(sv);
			
			var key = self.getInputKey();
			key.val( values.join(sDot) );
			return true;
		},
		_multiselectItemSelected : function(item,e){
			var self = this,
				undef,
				opt = self.configs,
				items = opt.items || [];	
			if( item === undef || e === undef ) return false;
			
			var value = $(item).attr('value');
			opt._firstIndex = value;
			opt._lastIndex = opt._lastIndex === null ? opt._firstIndex : opt._lastIndex;
			
			if( opt.isShiftKey ) {
				if( opt._firstIndex !== opt._lastIndex ) {
					//取得索引位置
					var _start,_end;
					$.each( items,function(i,v){
						if( v.value+'' === opt._firstIndex+'' ) {
							_start = i;	
						}	
						if( v.value+'' === opt._lastIndex+'' ) {
							_end = i;	
						}	
						if( _start !== undef && _end !== undef ) {
							return false;	
						}
					} );
					
					var start = Math.min( _start,_end );
					var end = Math.max( _start,_end );
					var size = Math.abs( end-start ) + 1 + start;

					var list = items.slice( start,size );

					value = [];
					for( var i=0;i<list.length;i++ ) {
						value.push( list[i]['value'] );	
					}
				}	
			}  else {
				opt._lastIndex = opt._firstIndex;	
			}
			
			if( opt.isShiftKey && opt.isCtrlKey ) {
				opt.isCtrlKey = false;	
			}
			
			self.val( value,opt.isCtrlKey );	
		},
		/*
		*滚动到指定item
		*/
		multiselectScrollToItem : function(val){
			var self = this;
			var opt = self.configs;	
			
			var body = self.getInput();
			
			if( !body.length ) {
				return self;	
			}
			
			var offset = body.offset();
			var h = body._outerHeight();
			
			var f = $('>.nex-form-multiselect-list-item[value='+val+']',body);
			if( !f.length ) {
				return self;	
			}
			
			var fo = f.offset();
			var fh = f._outerHeight();
			
			var outerHeight = 0;
			if( offset.top > fo.top ) {
				outerHeight = offset.top - fo.top;
			} else if( (offset.top+h) < (fo.top+fh) ) {
				outerHeight = (offset.top+h) - (fo.top+fh);
			}
			
			var sTop = 0;
	
			sTop = body.scrollTop() - outerHeight;
			
			body.scrollTop( sTop );
			
			return self;
		},
		multiselectGetValue : function(){
			var self = this;
			var opt = self.configs;	
			
			var key = self.getInputKey();
			return key.val();
		},
		//m=true 不清空已选择 m=false清空之前选择 默认
		multiselectSetValue : function(val,m){
			var self = this,undef;
			var opt = self.configs;
			
			self.multiselectItemSelected( val,m );
			
			return self;	
		},
		multiselectInit : function(){
			var self = this,undef;
			var opt = self.configs;
			var input = self.getInput();
			self.bind('onKeyDown.multiselect',function(input,e){
				opt.isCtrlKey = e.ctrlKey ? true : opt.isCtrlKey;		
				opt.isShiftKey = e.shiftKey ? true : opt.isShiftKey;
				if( e.keyCode===38 || e.keyCode===40 ) {
					opt.isCtrlKey = false;
					var index = opt._firstIndex;
					var ac = e.keyCode===38?'prev':'next';
					do {
						var item = $('>.nex-form-multiselect-list-item[value='+index+']',input)[ ac ]('.nex-form-multiselect-list-item');
						if( !item.size() ) break;
						index = item.attr('value');
						if( !item.hasClass('nex-form-multiselect-list-item-disabled') ) {
							//item.click();
							self._multiselectItemSelected( item,e );
							break;
						}
					} while(1);
				}
			});
			self.bind('onKeyUp.multiselect',function(input,e){
				opt.isCtrlKey = (e.keyCode===17) ? false : opt.isCtrlKey;		
				opt.isShiftKey = (e.keyCode===16) ? false : opt.isShiftKey;		
			});
		},
		multiselectBindItemsEvent : function(list){
			var self = this,
				undef,
				opt = self.configs,
				input = self.getInput(),
				items = opt._multiItems,
				list = list === undef ? $(">.nex-form-multiselect-list-item",input) : list;
					
			//事件绑定
			var events = {
				selectstart : function(e){
					return false;	
				},
				mouseenter : function(e){
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var value = $(this).attr( 'value' );
					var data = self.getItemData( value );
					var r = self.fireEvent("onItemOver",[this,data,e]);
					if( r === false ) return false;
					if( $(this).hasClass('nex-form-multiselect-list-item-disabled') ) return;
					$(this).addClass("nex-form-multiselect-list-item-over");
				},
				mouseleave : function(e){
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var value = $(this).attr( 'value' );
					var data = self.getItemData( value );
					var r = self.fireEvent("onItemOut",[this,data,e]);
					if( r === false ) return false;
					if( $(this).hasClass('nex-form-multiselect-list-item-disabled') ) return;
					$(this).removeClass("nex-form-multiselect-list-item-over");
				},
				click : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var value = $(this).attr( 'value' );
					var data = self.getItemData( value );
					var r = self.fireEvent("onItemClick",[this,data,e]);
					if( r === false ) return false;
					if( $(this).hasClass('nex-form-multiselect-list-item-disabled') ) return;
					
					self._multiselectItemSelected(this,e);
					
				},
				'mousedown' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var value = $(this).attr( 'value' );
					var data = self.getItemData( value );
					var r = self.fireEvent("onItemMouseDown",[this,data,e]);
					if( r === false ) return false;
					if( $(this).hasClass('nex-form-multiselect-list-item-disabled') ) return;
				},
				'mouseup' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var value = $(this).attr( 'value' );
					var data = self.getItemData( value );
					var r = self.fireEvent("onItemMouseUp",[this,data,e]);
					if( r === false ) return false;
					if( $(this).hasClass('nex-form-multiselect-list-item-disabled') ) return;
				},
				'dblclick' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var value = $(this).attr( 'value' );
					var data = self.getItemData( value );
					var r = self.fireEvent("onItemDblClick",[this,data,e]);
					if( r === false ) return false;
					if( $(this).hasClass('nex-form-multiselect-list-item-disabled') ) return;
				},
				'contextmenu' : function(e){	
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var value = $(this).attr( 'value' );
					var data = self.getItemData( value );
					var r = self.fireEvent("onItemContextMenu",[this,data,e]);
					if( r === false ) return false;
					if( $(this).hasClass('nex-form-multiselect-list-item-disabled') ) return;
				}
			};
			list.bind(events);
			list.each(function(){
				var $this = $(this);
				var index = $this.attr('itemindex');
				var item = items[index];
				$this.attr('value',item['value'])
					 .data('itemData',item);
			});
		},
		multiselectBindEvent : function(){
			var self = this,undef;
			var opt = self.configs;
			var input = self.getInput();
			
			var events = {
				'click' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return false;	
					}
					var r = self.fireEvent('onClick',[ this,e ]);	
					if( r === false ) return false;
				},
				'focus' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return false;	
					}
					var input = $('#'+opt.id+"-input");
					input.addClass('nex-form-focus');
					$('#'+opt.id+"").addClass('nex-form-wraper-focus');
					
					var r = self.fireEvent('onFocus',[ this,e ]);	
					if( r === false ) return false;
				},
				'blur' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var input = $('#'+opt.id+"-input");
					input.removeClass('nex-form-focus');
					
					$('#'+opt.id+"").removeClass('nex-form-wraper-focus');
					
					var r = self.fireEvent('onBlur',[ this,e ]);	
					if( r === false ) return false;
				},
				'keydown' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var r = self.fireEvent('onKeyDown',[ this,e ]);	
					if( r === false ) return false;
				},
				'keyup' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var r = self.fireEvent('onKeyUp',[ this,e ]);	
					if( r === false ) return false;
				},
				'keypress' : function(e){
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var r = self.fireEvent('onKeyPress',[ this,e ]);	
					if( r === false ) return false;
				},
				'mouseenter' : function(e){
					if( opt.disabled || opt.readOnly ) {
						return;		
					}
					var r = self.fireEvent('onMouseOver',[ this,e ]);	
					if( r === false ) return false;
					
				},
				'mouseleave' : function(e){
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var r = self.fireEvent('onMouseOut',[ this,e ]);	
					if( r === false ) return false;
				},
				'mousedown' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var r = self.fireEvent('onMouseDown',[ this,e ]);	
					if( r === false ) return false;
				},
				'mouseup' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var r = self.fireEvent('onMouseUp',[ this,e ]);	
					if( r === false ) return false;
				}
			};
			
			input.bind(events);
			
			self.multiselectBindItemsEvent();
			
		},
		multiselectSetSize : function(width,height){
			this.textareaSetSize(width,height);	
		},
		multiselectSearchItem : function(text,m){
			var self = this,
				undef,
				m = m === undef ? true : m,
				text = text === undef ? '' : text,
				opt = self.configs;
			var list = [];	
			var eid = self.bind('onMulitSelectItemCreate',function(item){
				var data = item[ m?'text':'value' ]+'';
				if( text === '' ) {
					list.push(item);	
					return true;
				};
				if( $.type(text) === 'regexp' ) {
					if( !text.test( data ) ) {
						return false;	
					}
				} else {
					
					if( data.indexOf( text.toString() ) === -1 ) {
						return false;	
					}	
				}
				list.push(item);	
			});
			self.multiselectRefreshList();
			self.unbind( 'onMulitSelectItemCreate',eid );
			return list;
		},
		//刷新
		multiselectRefreshSelected : function(){
			var self = this,
				undef,
				opt = self.configs,
				values = self.val();	
			self.val( values );		
		},
		multiselectMoveUpItem : function(value,step){
			var self = this,
				undef,
				opt = self.configs,
				step = step === undef ? 0 : (isNaN(parseInt(step)) ? 0 : parseInt(step)) ,
				items = opt.items || [],
				input = self.getInput();	
				
			if( value === undef ) return false;	
			
			var r = self.fireEvent("onItemBeforeMoveUp",[value,opt]);
			if( r === false ) return r;
				
			var index = self.getItemData( value,false );	
			
			var index = $.isArray( index ) ? index : [index];
			var len = items.length;
		
			$.each(index,function(i,index){
				var _step = index - step;
				_step = _step<0 ? 0 : _step;
				
				var _v1 = items[index]['value'];
				var _v2 = items[_step]['value'];
				
				self.array_move( items,index,_step,1 );
				
				if( index !== _step ) {
					var item1 = $('>.nex-form-multiselect-list-item[value='+_v1+']',input);
					var item2 = $('>.nex-form-multiselect-list-item[value='+_v2+']',input);
					item2.before( item1 );
				}
			});
			
			self.fireEvent("onItemMoveUp",[value,opt]);
			
			return true;
		},
		multiselectMoveDownItem : function(value,step){
			var self = this,
				undef,
				opt = self.configs,
				step = step === undef ? 0 : (isNaN(parseInt(step)) ? 0 : parseInt(step)) ,
				items = opt.items || [],
				input = self.getInput();	
				
			if( value === undef ) return false;	
			
			var r = self.fireEvent("onItemBeforeMoveDown",[value,opt]);
			if( r === false ) return r;
				
			var index = self.getItemData( value,false );	
			
			var index = $.isArray( index ) ? index : [index];
			var len = items.length;
		
			$.each(index,function(i,index){
				var _step = index + step;
				_step = _step>=len ? len-1 : _step;
				
				var _v1 = items[index]['value'];
				var _v2 = items[_step]['value'];
				
				self.array_move( items,index,_step,0 );
				if( index !== _step ) {
					var item1 = $('>.nex-form-multiselect-list-item[value='+_v1+']',input);
					var item2 = $('>.nex-form-multiselect-list-item[value='+_v2+']',input);
					item2.after( item1 );
				}
			});
			
			self.fireEvent("onItemMoveDown",[value,opt]);
			
			return true;
		},
		multiselectAddItem : function(data,after,m){
			var self = this,
				undef,
				opt = self.configs,
				after = after === undef ? true : after,
				m = m === undef ? false : m,
				items = opt.items || [],
				input = self.getInput();	
			var data = $.isArray( data ) ? data : [ data ];
			var text = [];
			var values = [];
			
			var r = self.fireEvent("onItemBeforeAdd",[data,opt]);
			if( r === false ) return r;
			
			$.each(data,function(i,item){
				if( !$.isPlainObject( item ) ) return;
				text.push( self.multiselectGetItemTpl(item) );
				if( item.selected ) {
					values.push( item.value );	
				}
			});
			
			var list = $( text.join('') );
			
			var ac = after ? 'append' : 'prepend';
			
			input[ac](list);
			
			self.multiselectBindItemsEvent(list);
			
			self.val( values.join( opt.multiSplit ),m );
			
			if( !after ) {
				data.reverse();	
			}
			$.each( data,function(i,v){
				items[ after?'push':'unshift' ]( v );					  
			} );
			
			opt.items = items;
			
			self.fireEvent("onItemAdd",[data,opt]);
			
			return true;
		},
		multiselectRemoveItem : function(value){
			var self = this,
				undef,
				opt = self.configs,
				sDot = opt.multiSplit,
				items = opt.items || [],
				input = self.getInput();	
			if( value === undef ) return false;	
			if( $.type( value ) === 'string' ) {
				value = value.split( sDot );	
			} else if( $.type( value ) !== 'array' ) {
				value = [ value ];	
			}	
			
			var r = self.fireEvent("onItemBeforeRemove",[value,opt]);
			if( r === false ) return r;
			
			var dels = {};
				
			$.each( value,function(i,v){
				var value;
				if( $.isPlainObject( v ) ) {
					if( 'value' in v ) {
						value = v.value;	
					}	
				} else {
					value = v;
				}
				if( value !== undef ) {
					dels[ value ] = true;	
				}
				$('>.nex-form-multiselect-list-item[value='+value+']',input).remove();
			} );
			
			self.array_splice( function(i,v){
				if( v.value in dels ) return true;	
			},items );
			
			self.fireEvent("onItemRemove",[value,opt]);
			
			return true;
		},
		multiselectDisabledItem : function(value){
			var self = this,
				undef,
				opt = self.configs,
				sDot = opt.multiSplit,
				input = self.getInput();
				
			var values = self.getItemData( value );	
			
			values = $.isArray( values ) ? values : [values];
			
			var r = self.fireEvent("onItemBeforeDisabled",[values,opt]);
			if( r === false ) return r;	
			
			$.each(values,function(i,v){
				var value = v.value;
				var item = $('>.nex-form-multiselect-list-item[value='+value+']',input);
				if( !item.length ) return false;
				item.removeClass('nex-form-multiselect-list-item-selected')
				.addClass('nex-form-multiselect-list-item-disabled');
				v.disabled = true;	
			});
			
			self.multiselectRefreshSelected();
			
			self.fireEvent("onItemDisabled",[values,opt]);
			
			return true;
		},
		multiselectEnableItem : function(value){
			var self = this,
				undef,
				opt = self.configs,
				sDot = opt.multiSplit,
				input = self.getInput();
				
			var values = self.getItemData( value );	
			
			values = $.isArray( values ) ? values : [values];
			
			var r = self.fireEvent("onItemBeforeEnable",[values,opt]);
			if( r === false ) return r;	
			
			$.each(values,function(i,v){
				var value = v.value;
				var item = $('>.nex-form-multiselect-list-item[value='+value+']',input);
				if( !item.length ) return false;
				item.removeClass('nex-form-multiselect-list-item-disabled');
				v.disabled = false;	
					
			});
			
			self.fireEvent("onItemEnable",[values,opt]);
			
			return true;
		},
		multiselectRefreshList : function( items ){
			var self = this,
				undef,
				opt = self.configs,
				items = $.isArray( items ) ? items :  (opt.items || []),
				text = [],
				input = self.getInput();	
			opt._multiItems.length = 0;	
			for( var x=0;x<items.length;x++ ) {
				text.push( self.multiselectGetItemTpl( items[x] ) );	
			}
			input.html( text.join('') );
			self.multiselectBindItemsEvent();
			self.multiselectRefreshSelected();
			
			self.fireEvent("onRefreshList",[opt]);
			
			return true;
		},
		multiselectGetItemTpl : function(item){
			var self = this,
				undef,
				opt = self.configs;	
			if( item === undef || $.type(item) !== 'object' ) return '';
			item = $.extend({},opt._item,item);
			item.value = self._undef( item.value,item.text );
			item.text = self._undef( item.text,item.value );
			var icls = [];
			if( item['disabled'] ) {
				icls.push('nex-form-multiselect-list-item-disabled');	
			}
			/*if( item['selected'] ) {
				icls.push('nex-form-multiselect-list-item-selected');	
			}*/
			
			var index = opt._multiItems.push( item ) - 1;//value="'+item['value']+'" 
			
			if( $.isFunction( opt.listFilter ) ) {
				var r = opt.listFilter.call( self,item );
				if( r === false ) return '';
			}
			var r = self.fireEvent("onMulitSelectItemCreate",[item,opt]);
			if( r === false ) return'';
			return '<div itemindex='+index+' '+item['attrs']+' '+ ( 'title' in item ? ('title="'+item.title+'"') : ""  ) +' class="nex-form-multiselect-list-item '+item['cls']+' '+icls.join(' ')+'">'+self.tpl(item['text'],item)+'</div>';	
		},
		multiselectTpl : function(d){
			if( !d ) return "";
			var self = this,
				opt = self.configs;
			var text = [];
			opt._multiItems.length = 0;	
			text.push('<div class="nex-form-wraper '+d.cls+' nex-field-'+d.group+'" style="" id="'+d.id+'">');
				text.push('<table id="'+d.id+'-item" class="nex-field nex-form-item" cellspacing="0" cellpadding="0"><tbody>');
				text.push('<tr id="'+d.id+'-inputRow">');
					text.push('<td class="nex-form-item-body" id="'+d.id+'-body" style="width: 100%;">');
						text.push('<div '+d.attrs+' id="'+d.id+'-list" class="nex-form-multiselect-list">');
							text.push('<div id="'+d.id+'-input" style="height:'+opt.height+'" class="nex-form-multiselect-list-body" tabindex="-1">');
								var items = self._undef(opt.items,[]);
								for( var x=0;x<items.length;x++ ) {
									text.push( self.multiselectGetItemTpl( items[x] ) );	
								}
							text.push('</div>');
						text.push('</div>');
						text.push('<input id="'+d.id+'-input-key" type="hidden"  name="'+d.name+'" value="" />');
					text.push('</td>');
				text.push('</tr>');
			text.push('</tbody></table></div>');
			return text.join("");		
		},
		/*
		*搜索输入框
		*/
		searchGetValue : function(){
			var self = this,undef;
			return self.selectGetValue();	
		},
		searchSetValue : function(val,stext){
			var self = this,undef;	
			self.selectSetValue.apply(self,arguments);
			return self;
		},
		searchResult : function( text ){
			var self = this,undef;
			var opt = self.configs;
			var items = opt.items;
			var input = self.getInput();
			var list = [];
			var text = text === undef ? input.val() : text;
			if( text === '' && opt.emptyOnShowAll ) {
				return items;
			}
			for( var i=0;i<items.length;i++ ) {
				var item = items[i];	
				item.text = item.text === undef ? '' : item.text+'';
				if( item.text.indexOf( text ) !== -1 ) {
					list.push(item);	
				}
			}
			return list;	
		},
		searchShowResult : function( list ){
			var self = this,undef;
			var opt = self.configs;	
			self.selectHideList();
			self.selectShowList( list || self.searchResult() );
		},
		searchSetSize : function(width,height){
			this.comboSetSize(width,height);	
		},
		searchBindEvent : function(width,height){
			var self = this;
			var opt = self.C();
			self.comboBindEvent();
			var input = self.getInput();
			var events = {
				'keydown.2' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					opt._oldVal2 = opt._oldVal2 === null ? input.val() : opt._oldVal2;
				},
				'keyup.2' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var val = input.val();
					if( opt._oldVal2 !== val && opt._oldVal2!==null ) {
						opt._oldVal2 =null;
						if( e.keyCode !== 13 ) {
							var r = self.fireEvent('onSearchChange',[ this,opt._oldVal2,val,e ]);	
							if( r === false ) return false;
						}
					}
				}
			};
			input.bind(events);
		},
		searchInit : function(){
			var self = this,undef;
			var opt = self.configs;
			opt.selectReadOnly = false;
			self.bind('onComboClick.search',function(input,e){
				self.searchShowResult( opt.items );
				self.focus();
			});
			self.bind('onClick.search',function(input,e){
				var list = $('#'+opt.id+'_list');
				if( !list.size() ) {
					self.searchShowResult( opt.items );
				}
			});
			self.bind('onSearchChange.search',function(input,e){
				if( self._seachDelay ) {
					clearTimeout( self._seachDelay );	
				}
				self._seachDelay = setTimeout(function(){
					self.searchShowResult();	
				},50);
			});
		},
		searchTpl : function(d){
			var self = this,
				opt = self.configs;
			return self.selectTpl(d);
		},
		spinnerBindEvent : function(){
			var self = this;
			var opt = self.configs;
			self.commonEvent();
			
			var input = $("#"+opt.id+'-input');
			var _sup = $("#"+opt.id+"-spinner-up");
			var _sdown = $("#"+opt.id+"-spinner-down");
			var _supEvents = {
				'click' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var r = self.fireEvent('onSpinnerUpClick',[ input.get(0),e ]);	
					if( r === false ) return false;
					var r = self.fireEvent('onClick',[ input.get(0),e ]);	
					if( r === false ) return false;
				},
				'mouseenter' : function(e){
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var r = self.fireEvent('onSpinnerUpOver',[ input.get(0),e ]);	
					if( r === false ) return false;
					var r = self.fireEvent('onMouseOver',[ input.get(0),e ]);	
					if( r === false ) return false;
					_sup.addClass("nex-form-spinner-up-over");
				},
				'mouseleave' : function(e){
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var r = self.fireEvent('onSpinnerUpOut',[ input.get(0),e ]);	
					if( r === false ) return false;
					var r = self.fireEvent('onMouseOut',[ input.get(0),e]);	
					if( r === false ) return false;
					_sup.removeClass("nex-form-spinner-up-over");
					//
					//_sup.removeClass("nex-form-spinner-up-click");	
					//self.fireEvent('onSpinnerUpMouseUp',[ input.get(0),e ]);	
					//self.fireEvent('onMouseUp',[ input.get(0),e]);
				},
				'mousedown' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var r = self.fireEvent('onSpinnerUpMouseDown',[ input.get(0),e ]);	
					if( r === false ) return false;
					var r = self.fireEvent('onMouseDown',[ input.get(0),e]);	
					if( r === false ) return false;
					_sup.addClass("nex-form-spinner-up-click");
					$(document).mouseup(function(){
						_sup.removeClass("nex-form-spinner-up-click");	
						self.fireEvent('onSpinnerUpMouseUp',[ input.get(0),e ]);	
						self.fireEvent('onMouseUp',[ input.get(0),e]);	
					});
				},
				'mouseup' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var r = self.fireEvent('onSpinnerUpMouseUp',[ input.get(0),e ]);	
					if( r === false ) return false;
					var r = self.fireEvent('onMouseUp',[ input.get(0),e]);	
					if( r === false ) return false;
					_sup.removeClass("nex-form-spinner-up-click");
				}
			};
			var _sdownEvents = {
				'click' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var r = self.fireEvent('onSpinnerDownClick',[ input.get(0),e ]);	
					if( r === false ) return false;
					var r = self.fireEvent('onClick',[ input.get(0),e ]);	
					if( r === false ) return false;
				},
				'mouseenter' : function(e){
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var r = self.fireEvent('onSpinnerDownOver',[ input.get(0),e ]);	
					if( r === false ) return false;
					var r = self.fireEvent('onMouseOver',[ input.get(0),e ]);	
					if( r === false ) return false;
					_sdown.addClass("nex-form-spinner-down-over");
				},
				'mouseleave' : function(e){
					if( opt.disabled || opt.readOnly ) {
						return;		
					}
					var r = self.fireEvent('onSpinnerDownOut',[ input.get(0),e ]);	
					if( r === false ) return false;
					var r = self.fireEvent('onMouseOut',[ input.get(0),e]);	
					if( r === false ) return false;
					_sdown.removeClass("nex-form-spinner-down-over");
					//
					//_sdown.removeClass("nex-form-spinner-down-click");	
					//self.fireEvent('onSpinnerDownMouseUp',[ input.get(0),e ]);	
					//self.fireEvent('onMouseUp',[ input.get(0),e]);	
				},
				'mousedown' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var r = self.fireEvent('onSpinnerDownMouseDown',[ input.get(0),e ]);	
					if( r === false ) return false;
					var r = self.fireEvent('onMouseDown',[ input.get(0),e]);	
					if( r === false ) return false;
					_sdown.addClass("nex-form-spinner-down-click");
					$(document).mouseup(function(){
						_sdown.removeClass("nex-form-spinner-down-click");	
						self.fireEvent('onSpinnerDownMouseUp',[ input.get(0),e ]);	
						self.fireEvent('onMouseUp',[ input.get(0),e]);	
					});
				},
				'mouseup' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var r = self.fireEvent('onSpinnerDownMouseUp',[ input.get(0),e ]);	
					if( r === false ) return false;
					var r = self.fireEvent('onMouseUp',[ input.get(0),e]);	
					if( r === false ) return false;
					_sdown.removeClass("nex-form-spinner-down-click");
				}
			};
			_sup.bind( _supEvents );
			_sdown.bind( _sdownEvents );
			
		},
		spinnerSetSize : function(width,height){
			var self = this;
			var opt = self.configs;
			
			var $table = $("#"+opt.id+"-item");
			
			var $input = $("#"+opt.id+"-input");
			
			$("#"+opt.id)._outerWidth( width );
			
			var lw = 0;
			$("#"+opt.id+"-inputRow >td.nex-form-label-cell").each(function(){
				lw += $(this)._outerWidth();																
			});
			$("#"+opt.id+"-inputRow >td.nex-form-spinner-cell").each(function(){
				lw += $(this)._outerWidth();																
			});
			$("#"+opt.id+"-inputRow >td.nex-form-button-cell").each(function(){
				lw += $(this)._outerWidth();																
			});
			
			$table._outerWidth( width );
			
			$input._outerWidth( width - lw );	
		},
		spinnerTpl : function(d){
			if( !d ) return "";
			var self = this,
				opt = self.configs;
			var text = [];
			text.push('<div class="nex-form-wraper '+d.cls+' nex-field-'+d.group+'" style="" id="'+d.id+'">');
				text.push('<table id="'+d.id+'-item" class="nex-field nex-form-item" cellspacing="0" cellpadding="0"><tbody>');
				text.push('<tr id="'+d.id+'-inputRow">');
					text.push('<td class="nex-form-item-body" id="'+d.id+'-body" style="width: 100%;">');	
						text.push('<input '+d.attrs+' id="'+d.id+'-input" placeholder="'+d.placeholder+'" type="text"  name="'+d.name+'" value="" style="width:0px;" class="nex-form-field nex-form-text" autocomplete="'+d.autocomplete+'" />');
					text.push('</td>');
					text.push('<td class="nex-form-spinner-cell nex-form-'+d.type+'-cell" id="'+d.id+'-spinner-cell">');	
						text.push('<div class="nex-form-spinner nex-form-'+d.type+'-spinner nex-form-spinner-up nex-form-'+d.type+'-spinner-up" id="'+d.id+'-spinner-up"></div>');
						text.push('<div class="nex-form-spinner nex-form-'+d.type+'-spinner nex-form-spinner-down nex-form-'+d.type+'-spinner-down" id="'+d.id+'-spinner-down"></div>');
					text.push('</td>');
				text.push('</tr>');
			text.push('</tbody></table></div>');
			return text.join("");	
		},
		numberInit : function(){
			var self = this,undef;
			var opt = self.configs;
			self.bind("onSpinnerUpMouseDown",function(el,e){
				clearTimeout( opt.pollTid1 );
				clearInterval( opt.pollTid2 );
				opt.pollTid1 = setTimeout(function(){			
					opt.pollTid2 = setInterval(function(){
						self.fireEvent("onSpinnerUpClick",[el,e]);
					},opt.poll2);
				},opt.poll1);									  
			});
			self.bind("onSpinnerUpMouseUp",function(){	
				clearTimeout( opt.pollTid1 );
				clearInterval( opt.pollTid2 );
			});
			self.bind("onSpinnerUpOut",function(){	
				clearTimeout( opt.pollTid1 );
				clearInterval( opt.pollTid2 );
			});
			self.bind("onSpinnerDownMouseDown",function(el,e){
				clearTimeout( opt.pollTid1 );
				clearInterval( opt.pollTid2 );
				opt.pollTid1 = setTimeout(function(){			
					opt.pollTid2 = setInterval(function(){
						self.fireEvent("onSpinnerDownClick",[el,e]);
					},opt.poll2);
				},opt.poll1);									  
			});
			self.bind("onSpinnerDownOut",function(){	
				clearTimeout( opt.pollTid1 );
				clearInterval( opt.pollTid2 );
			});
			self.bind("onSpinnerDownMouseUp",function(){	
				clearTimeout( opt.pollTid1 );
				clearInterval( opt.pollTid2 );
			});
			self.bind("onSpinnerUpClick",function(){
				var value = self.val();
				value = isNaN(parseFloat(value)) ? 0 : parseFloat(value);
				self.val( value + opt.step );
			});
			self.bind("onSpinnerDownClick",function(){
				var value = self.val();
				value = isNaN(parseFloat(value)) ? 0 : parseFloat(value);
				self.val( value - opt.step );								 
			});
		},
		numberSetValue : function(num){
			var self = this,
				opt = this.configs;	
				
			var num = isNaN(parseFloat(num)) ? 0 : parseFloat(num);
			if( opt.smin !== null ) {
				num = Math.max( num,opt.smin );
			}
			if( opt.smax !== null ) {
				num = Math.min( num,opt.smax );
			}
			
			var fix = opt.step.toString();
			var fix=fix.split(".");
			if( fix.length == 2 ) {
				fix = fix[1].toString().length;
			} else {
				fix = 0;	
			}
			if( num.toString().split(".").length>=2 ) {
				self.commonSetValue(num.toFixed(fix));
			} else {
				self.commonSetValue(num);	
			}
			return self;
		},
		numberBindEvent : function(){
			this.spinnerBindEvent();
		},
		numberSetSize : function(width,height){
			this.spinnerSetSize(width,height);
		},
		numberTpl : function(d){
			return this.spinnerTpl(d);	
		},
		radioSetSize : function(width,height){
			var self = this;
			var opt = self.configs;
			
			var $table = $("#"+opt.id+"-item");
			
			var $input = $("#"+opt.id+"-radio-wraper");
			
			$("#"+opt.id)._outerWidth( width );
			
			var lw = 0;
			$("#"+opt.id+"-inputRow >td.nex-form-label-cell").each(function(){
				lw += $(this)._outerWidth();																
			});
			$("#"+opt.id+"-inputRow >td.nex-form-button-cell").each(function(){
				lw += $(this)._outerWidth();																
			});
			
			$table._outerWidth( width );
			
			$input._outerWidth( width - lw );	
		},
		radioReadOnly : function(){},
		radioDisabled : function(){
			var self = this;
			var opt = self.configs;
			var text = $("#"+opt.id+"-radio-wraper");
			$(":radio[name='"+opt.name+"']",text).each(function(){
				$(this).attr("disabled",'true');	
			});
		},
		radioEnable : function(){
			var self = this;
			var opt = self.configs;
			var text = $("#"+opt.id+"-radio-wraper");
			$(":radio[name='"+opt.name+"']",text).each(function(){
				$(this).removeAttr("disabled");	
			});	
		},
		radioSetValue : function(val){
			var self = this;
			var opt = self.configs;
			
			if( !arguments.length )  return self;
			val = val + '';
			
			var text = $("#"+opt.id+"-radio-wraper");
			$(":radio[name='"+opt.name+"']",text).each(function(){
				//$(this).removeAttr("checked");
				this.checked = false;
				if( $(this).val() === val ) {
					//$(this).attr("checked",'true');	
					this.checked = true;
				}
			});
			return self;
		},
		radioGetValue : function(){
			var self = this;
			var opt = self.configs;
			var text = $("#"+opt.id+"-radio-wraper");
			var obj = text.find("input[name='"+opt.name+"']");
			var value = '';
			//radio
			if( obj.is(":radio") ) {
				value = text.find(":radio[name='"+opt.name+"']:checked").val();
			}
			return $.trim(value);
		},
		radioBindEvent : function(){
			var self = this;
			var opt = self.configs;
			var text = $("#"+opt.id+"-radio-wraper");
			var radios = text.find(":radio[name='"+opt.name+"']");
			if( !radios.length ) {
				return self;
			}
			var events = {
				click : function(e) {
					var value = $(this).val();
					if( opt.value != value ) {
						self.fireEvent('onChange',[]);		
					}
					var r = self.fireEvent('onClick',[ this,e ]);	
					if( r === false ) return false;
				}	
			};
			radios.bind(events);
		},
		radioTpl : function(d){
			if( !d ) return "";
			var self = this,
				opt = self.configs;
			var text = [];
			text.push('<div class="nex-form-wraper '+d.cls+' nex-field-'+d.group+'" style="" id="'+d.id+'">');
				text.push('<table id="'+d.id+'-item" class="nex-field nex-form-item" cellspacing="0" cellpadding="0"><tbody>');
				text.push('<tr id="'+d.id+'-inputRow">');
					text.push('<td class="nex-form-item-body" id="'+d.id+'-body" style="width: 100%;">');	
						text.push('<div id="'+d.id+'-radio-wraper" class="nex-form-radio-wraper">');
							var items = opt.items;
							for(var i=0;i<items.length;i++) {
								if( !$.isPlainObject( items[i] ) ) {
									continue;
								}
								var _item = items[i] = $.extend({},opt._item,items[i]);
								_item.value = self._undef( _item.value,_item.text );
								_item.text = self._undef( _item.text,_item.value );
								
								if(_item.disabled){
									_item.attrs += 'disabled';
									_item.cls +=' nex-form-disabled-radio';
								}
								if(_item.readOnly){
									_item.attrs += ' readOnly ';
									_item.cls +=' nex-form-readonly-radio';
								}
								
								var str = '<div class="nex-form-radio-item '+_item.cls+'" ><input '+_item.attrs+' type="radio" id="'+d.id+'-input-'+i+'" value="'+_item.value+'" name="'+opt.name+'" class="nex-form-field nex-form-radio" ><label id="'+d.id+'-label-input-'+i+'" class="nex-form-cb-label nex-form-cb-label-after" for="'+d.id+'-input-'+i+'">'+_item.text+'</label></div>';
								text.push(str);
								if( _item.display == 'block' ) {
									text.push('<div class="nex-clear"></div>');	
								}
							}
							text.push('<div class="nex-clear"></div>');	
						text.push('</div>');
					text.push('</td>');
				text.push('</tr>');
			text.push('</tbody></table></div>');
			return text.join("");
		},
		checkboxSetSize : function(width,height){
			var self = this;
			var opt = self.configs;
			
			var $table = $("#"+opt.id+"-item");
			
			var $input = $("#"+opt.id+"-checkbox-wraper");
			
			$("#"+opt.id)._outerWidth( width );
			
			var lw = 0;
			$("#"+opt.id+"-inputRow >td.nex-form-label-cell").each(function(){
				lw += $(this)._outerWidth();																
			});
			$("#"+opt.id+"-inputRow >td.nex-form-button-cell").each(function(){
				lw += $(this)._outerWidth();																
			});
			
			$table._outerWidth( width );
			
			$input._outerWidth( width - lw );	
		},
		checkboxReadOnly : function(){},
		checkboxDisabled : function(){
			var self = this;
			var opt = self.configs;
			var text = $("#"+opt.id+"-checkbox-wraper");
			$(":checkbox[name='"+opt.name+"']",text).each(function(){
				$(this).attr("disabled",'true');	
			});
		},
		checkboxEnable : function(){
			var self = this;
			var opt = self.configs;
			var text = $("#"+opt.id+"-checkbox-wraper");
			$(":checkbox[name='"+opt.name+"']",text).each(function(){
				$(this).removeAttr("disabled");	
			});	
		},
		checkboxSetValue : function(val){
			var self = this;
			var opt = self.configs;

			if( !arguments.length )  return self;
			
			var text = $("#"+opt.id+"-checkbox-wraper");
			var val = val+'';
			val = val.split(opt.multiSplit);
			
			$(":checkbox[name='"+opt.name+"']",text).each(function(){
				//$(this).removeAttr("checked");
				this.checked = false;
				if( self.inArray( $(this).val(),val ) != -1 ) {
					//$(this).attr("checked",'true');	
					this.checked = true;
				}
			});
			return self;
		},
		checkboxGetValue : function(){
			var self = this;
			var opt = self.configs;
			var text = $("#"+opt.id+"-checkbox-wraper");
			var obj = text.find("input[name='"+opt.name+"']");
			//checkbox
			var value = "";
			if( obj.is(":checkbox") ) {
				value = [];
				text.find(":checkbox[name='"+opt.name+"']:checked").each(function(){ 
					value.push( $(this).val() ); 
				})
				value = value.join( opt.multiSplit );
			}
			return $.trim(value);
		},
		checkboxBindEvent : function(){
			var self = this;
			var opt = self.configs;
			var text = $("#"+opt.id+"-checkbox-wraper");
			var checkboxs = text.find(":checkbox[name='"+opt.name+"']");
			if( !checkboxs.length ) {
				return self;
			}
			var events = {
				click : function(e) {
					self.fireEvent('onChange',[]);	
					var r = self.fireEvent('onClick',[ this,e ]);	
					if( r === false ) return false;
				}	
			};
			checkboxs.bind(events);
		},
		checkboxTpl : function(d){
			if( !d ) return "";
			var self = this,
				opt = self.configs;
			var text = [];
			text.push('<div class="nex-form-wraper '+d.cls+' nex-field-'+d.group+'" style="" id="'+d.id+'">');
				text.push('<table id="'+d.id+'-item" class="nex-field nex-form-item" cellspacing="0" cellpadding="0"><tbody>');
				text.push('<tr id="'+d.id+'-inputRow">');
					text.push('<td class="nex-form-item-body" id="'+d.id+'-body" style="width: 100%;">');	
						text.push('<div id="'+d.id+'-checkbox-wraper" class="nex-form-checkbox-wraper">');
							var items = opt.items;
							for(var i=0;i<items.length;i++) {
								if( !$.isPlainObject( items[i] ) ) {
									continue;
								}
								var _item = items[i] = $.extend(true,{},opt._item,items[i]);
								_item.value = self._undef( _item.value,_item.text );
								_item.text = self._undef( _item.text,_item.value );
								
								if(_item.disabled){
									_item.attrs += 'disabled';
									_item.cls +=' nex-form-disabled-checkbox';
								}
								if(_item.readOnly){
									_item.attrs += ' readOnly ';
									_item.cls +=' nex-form-readonly-checkbox';
								}
								
								var str = '<div class="nex-form-checkbox-item '+_item.cls+'" ><input '+_item.attrs+' type="checkbox" id="'+d.id+'-input-'+i+'" value="'+_item.value+'" name="'+opt.name+'" class="nex-form-field nex-form-checkbox" ><label id="'+d.id+'-label-input-'+i+'" class="nex-form-cb-label nex-form-cb-label-after" for="'+d.id+'-input-'+i+'">'+_item.text+'</label></div>';
								text.push(str);
								if( _item.display == 'block' ) {
									text.push('<div class="nex-clear"></div>');	
								}
							}
							text.push('<div class="nex-clear"></div>');	
						text.push('</div>');
					text.push('</td>');
				text.push('</tr>');
			text.push('</tbody></table></div>');
			return text.join("");
		},
		getConf : function(){
			var self = this,
				opt = self.configs;
			var success = function(data){
						if( $.isPlainObject( data ) ) {
							opt = $.extend(opt,data);	
						}
						self.create();
					};
			var error = function(xmlHttp){
						self.create();
					};
			if( $.isFunction(opt.url) ) {
				opt.url.call(self,success,error);
			} else {
				$.ajax({
					url : opt.url,
					type : opt.method,
					dataType : opt.dataType,
					data : opt.queryParams,
					success : success,
					error : error
				});
			}
		}
	});
	

	
	$.fn.nexform = function(_opt){
		if(this.size()<=0){
			return false;
		}
		var list = [];
		this.each(function(i){
			var self = $(this);
			var attrs = {
				type : $(this).attr('type'),	
				value : $(this).attr('value'),
				name : $(this).attr('name'),
				//width : $(this).attr('width'),
				//height : $(this).attr('height'),
				cls : $(this).attr('class'),
				rules : eval($(this).attr('rules') || '[]'),
				attrs : $(this).attr('attrs') || '',
				labelText : $(this).attr('label') || '',
				display : $(this).attr('display') || 'inline-block',
				group : $(this).attr('group') || 'default',
				disabled : $(this).attr('disabled'),
				readOnly : $(this).attr('readOnly')
			};
			var attrs2 = {};
			if( $(this).attr('data-options') ) {
				var attrs2 = eval('({'+$(this).attr('data-options')+'})');
			}
			
			var opt = $.extend(true,{},attrs,attrs2,_opt);

			opt.selector = self.selector;
			opt.helper = self;
			
			var extform = new Nex.form(opt);
			
			list.push(extform);
		});
		
		if( this.size() == 1 ) {
			return list[0];
		} else {
			return list	;
		}
	};
	$.fn.extform = $.fn.nexform;
})(jQuery);
/*
jquery.nexFormField.js
*/

;(function($){
	"use strict";
	var textfield = Nex.extend( 'textfield','form' );
	textfield.setOptions({
		type : 'text'	
	});
	var textareafield = Nex.extend( 'textareafield','form' );
	textareafield.setOptions({
		type : 'textarea'	
	});
	var passwordfield = Nex.extend( 'passwordfield','form' );
	passwordfield.setOptions({
		type : 'password'	
	});
	var hiddenfield = Nex.extend( 'hiddenfield','form' );
	hiddenfield.setOptions({
		type : 'hidden'	
	});
	var displayfield = Nex.extend( 'displayfield','form' );
	displayfield.setOptions({
		type : 'display'	
	});
	var combofield = Nex.extend( 'combofield','form' );
	combofield.setOptions({
		type : 'combo'	
	});
	var datefield = Nex.extend( 'datefield','form' );
	datefield.setOptions({
		type : 'date'	
	});
	var selectfield = Nex.extend( 'selectfield','form' );
	selectfield.setOptions({
		type : 'select'	
	});
	var searchfield = Nex.extend( 'searchfield','form' );
	searchfield.setOptions({
		type : 'search'	
	});
	var multiselectfield = Nex.extend( 'multiselectfield','form' );
	multiselectfield.setOptions({
		type : 'multiselect'	
	});
	var spinnerfield = Nex.extend( 'spinnerfield','form' );
	spinnerfield.setOptions({
		type : 'spinner'	
	});
	var numberfield = Nex.extend( 'numberfield','form' );
	numberfield.setOptions({
		type : 'number'	
	});
	var radiofield = Nex.extend( 'radiofield','form' );
	radiofield.setOptions({
		type : 'radio'	
	});
	var checkboxfield = Nex.extend( 'checkboxfield','form' );
	checkboxfield.setOptions({
		type : 'checkbox'	
	});
	var singlecheckboxfield = Nex.extend( 'singlecheckboxfield','form' );
	singlecheckboxfield.setOptions({
		type : 'display',
		on : '',
		off : ''
	});
	singlecheckboxfield.fn.extend({
		displaySetSize : function(width,height){
			var self = this;
			var opt = self.configs;
			
			var $table = $("#"+opt.id+"-item");
			
			var $input = $("#"+opt.id+"-ckt");
			
			$("#"+opt.id)._outerWidth( width );
			
			var lw = 0;
			$("#"+opt.id+"-inputRow >td.nex-form-label-cell").each(function(){
				lw += $(this)._outerWidth();																
			});
			$("#"+opt.id+"-inputRow >td.nex-form-button-cell").each(function(){
				lw += $(this)._outerWidth();																
			});
			
			$table._outerWidth( width );
			
			$input._outerWidth( width - lw );		
		},
		displayTpl :　function(d){
			if( !d ) return "";
			var self = this,
				opt = self.configs;
			var text = [];
			text.push('<div class="nex-form-wraper '+d.cls+' nex-field-'+d.group+'" style="" id="'+d.id+'">');
				text.push('<table id="'+d.id+'-item" class="nex-field nex-form-item" cellspacing="0" cellpadding="0"><tbody>');
				text.push('<tr id="'+d.id+'-inputRow">');
					text.push('<td class="nex-form-item-body" id="'+d.id+'-body" style="width: 100%;">');	
						text.push('<div id="'+d.id+'-ckt" style="width:0px;" class="nex-form-field nex-form-display"><input '+d.attrs+' type="checkbox" id="'+d.id+'-input" /></div>');
					text.push('</td>');
				text.push('</tr>');
			text.push('</tbody></table></div>');
			return text.join("");
		},
		displayGetValue : function(){
			var self = this;
			var opt = self.configs;
			var input = $("#"+opt.id+"-input");
			var ck = input[0];
			
			var value =  ck.checked ? opt.on : opt.off;
			
			return $.trim( self.rendererDecode(value) );
		},
		displaySetValue : function(){
			var self = this,undef;
			var opt = self.configs;
			var input = $("#"+opt.id+"-input");
			var ck = input[0];
			
			var value = arguments[0];
			
			if( $.isFunction( opt.formater ) ) {
				var _value = opt.formater.call( self,value );
				value = _value === undef ? value : _value;
			}
			
			value = self.rendererEncode(value);
			if( value+'' === opt.on+'' ) {
				ck.checked = true;	
			} else {
				ck.checked = false;		
			}
			
			return self;
		}
	});
})(jQuery);
/*
jquery.extGrid.js
http://www.extgrid.com
author:nobo
qq:505931977
QQ交流群:13197510
email:zere.nobo@gmail.com or QQ邮箱
+-----------+
v1.0        |
			|
+-----------+
+-------------------------------------------+
v1.0.1        								|
修正 不同jquery版本出现的返回字符问题			|
+-------------------------------------------+
+--------------------------------------------------------+
v 1.2+       								   			 |
修正核心函数 提升数据展示速度，修正部分函数性能                 |
	1.新增 denyRowEvents : false,//禁止或使用自定义事件      |
	2.新增 onOverCell onOutCell                           |
+--------------------------------------------------------+
+--------------------------------------------------------+
v 1.2.1       								   			 |
1.新增 column中index 数据索引参数                    |
2.修正某些函数重复调用getColumns问题                         |
3.修正IE下刷新空白问题                                      |
4.修正v1.2版本_lSize没清0导致的BUG                          |
+--------------------------------------------------------+
+--------------------------------------------------------+
v 1.2.2      								   			 |
1.修正列锁情况下 Loading 出现的header问题            |
2.修正resize line 边框样式写死                        |
3.修正对数据排序后 出现的大小改变问题               |
+--------------------------------------------------------+
+-----------------------------------------------------------------------------------+
v 1.2.3	 									   			 							|
1.修正大数据下 导致深复制出现的问题												|
2.分页工具栏按钮优化																|
3.提高核心函数模板生成的性能													|
4.新增showHeader 开关 可控制是否显示header 对应的api: showHeader hideHeader		|
5.新增数据为空时 滚动条不出现问题（可选择性开启）								|
6.新增API updateGrid(data);  用户可自己设置显示数据 方便二次开发				|
7.新增参数emptyGridMsg 当grid数据为空是 显示在grid里的数据					|
8.showEmptyGridMsg:true 当设置为true emptyGridMsg则开启,否则关闭					|
	注:开启后 显示内容的宽度和gridHeader一样,也就是说超出宽度时会显示滚动条	|
9.修正showLoading时事件传递问题													|
10.提升分页栏性能																	|
+-----------------------------------------------------------------------------------+
+-----------------------------------------------------------------------------------+
v 1.2.4 									   			 							|
1.修改事件处理函数 																|
2.分页工具栏优化																	|
3.修正单元格事件返回false不阻止事件传递										|
4.新增事件 和修改部分事件名													|
5.新增 $.extGrid.puglins:[]插件队列，系统会调用里面的自定义插件函数			|
6.修正ajax 获取数据后调用不同的数据解析函数 eg jsonFilter						|
7.修正v1.2.3下分页工具栏出现js报错问题											|
8.修正列锁后被锁列事件缺失问题													|
9.新增触发单元格事件时检测当前对象是否单元格													|
10.新增API scrollToField,scrollToRow和配置参数 autoScrollToField/Row  |
+-----------------------------------------------------------------------------------+
+---------------------------------------------------------------------------------------------------------------------------+
v 1.2.5									   			 							
1.修正searchData存在的BUG																
2.修正严格模式下部分函数出现的语法错误													
3.修正rowNumbersWidth的默认参数原本为false改为'0px'										
4.新增rowNumbersExpand的参数 : false|auto|string|function								
5.添加分页输入框数据验证															
6.新增参数url 可接受一个回调函数,grid会传入查询条件（data）和success,error 2个回调函数 
	json_data格式 {total:"255",rows:[{},{},..] [,pageSize:50,pageNumber:1,columns:[{}]]} pageSize,pageNumber,columns是可选
	注 :
		success,error 这2个回调函数，一定有一个需要调用，不然grid会一直处于loading状态
		success 接受 josn_data格式数据 数据格式参考上面.
		error 可接受xmlHttp对象 或 一个字符串
	eg:
	function getGridData(data,success,error){
		data.status = 1;
		$.ajax({
			url : 'list.php',
			data : data,
			success : function( json_data ){
				success(json_data);    
			},
			error : function(xmlHttp){
				error(xmlHttp)
			}
		});
	}
	...extgrid( {url:getGridData} )..
7.一次性实例多个gird时data丢失问题修正(v1.2.3修改后留下的BUG)
8.当grid首次创建在隐藏元素里时,grid高度问题获取不正确问题修正
9.新增metaData方法，可直接调用该方法传递json_data格式的数据
10.修正 scrollToField/Row 出现的误差值
11.新增setFieldWidth 设置列宽 支持百分比
12.把原本直接对元素设置宽度的方法改成用CSS样式控制,方便操作.
注：
1).当定义了行模板时 不要去拖动列交换位置，否则列表的列并不会交换
2).rowTpl 建议不用，用rowCallBack or 单元格回调
13.新增addRow() @return rid,updateRow,deleteRow函数
14.修改默认主键名为'_pk'
15.新增minWidth:20配置参数
+----------------------------------------------------------------------------------------------------------------------------+
*/
/*
+----------------------------------------------------------------------------------------------------------------------------+
v 1.2.6		
1.新增事件onHideExpandRow,onBeforeCellEdit
2.新增maxWidth:null 默认
3.事件可通过参数直接绑定 
	eg:
		{
			title : 'extGrid',
			onClickRow : func,
			...
		}
4.tpl(参数1,参数2) 参数1可以是回调函数：eg：_columnMetaData._expand可是是函数
5.修正多表头在低版本jquery中出现使用field无效问题
6.修正手动调用列锁，隐藏列的时候 再新增行数据时列锁和隐藏列都无效问题
7.取消leftBorder,rightBorder,topBorder,bottomBorder参数边框大小都由CSS控制
8.修正expandRow 宽度设置
9.新增事件 onShowColumn,onHideColumn
10.修正headerTpl使用data-options时部分参数无效问题 
11.新增公用配置$.extGrid.defaults = {}
12.修正initFieldWidth 时 minWidth,maxWidth 无效
13.新增column.reader 映射参数 column._expand 定义后 column.reader会无效
14.新增事件onFieldWidthChange
15.新增API:moveColumn 
16.新增参数:forceFit: true false(默认) 设置 列宽自动调整
17.新增API:forceFitColumn  作用是实现forceFit
18.新增事件 onShowGroup,onHideGroup 
19.新增参数autoHeight 以及API: autoHeight
20.优化forceFitColumn
21.新增API:unAutoHeight ,如果想取消autoHeight 应该调用unAutoHeight()
22.新增API:unForceFitColumn ,如果想取消forceFit 应该调用unForceFitColumn()
23.fireEvent中添加事件锁,防止事件循环
24.新增footer行,对应的控制参数和事件:
	footerTpl : '',
	footerData : [],//footer数据 参数可以是 模版或者 函数
	footerRowStyler 
	footerRowCallBack
	footerRowNumbersExpand : '',
	onOverFooterRow : $.noop,
	onOutFooterRow : $.noop,
	onDblClickFooterRow : $.noop,
	onFooterRowContextMenu : $.noop,
	onClickFooterRowNumber : $.noop,
	onClickFooterCell : $.noop,
	onDblClickFooterCell : $.noop,
	onOverFooterCell : $.noop,
	onOutFooterCell : $.noop,
	onFooterCellContextMenu : $.noop
25.优化事件处理，以及事件依赖
26.新增API:updateFooterData
27.优化部分细节问题
28.新增API:denyEventInvoke 
29.支持大数据加载,参数lazyLoadRow
30.优化scrollToField/Row不合理的触发onScroll 
31.优化获取行数据时考虑当前行是否创建而考虑直接获取data[rid]
32.优化footerRow显示方式，已经修正原先的显示方式而出现滚动问题
33.修正onMoveColumn触发方式
34.重写selectRow部分
35.新增API updateFooterRow,updateHeaderRow, 分别会触发onUpdateFooterRow,onUpdateHeaderRow
36.取消setFieldWidth 触发onScroll事件
37.优化核心函数 事件绑定解绑支持扩展辨别 eg onClickRow.ab
38.取消_autoHeight 事件的同时触发
39.开启大数据支持请不要开启 autoHeight,和groupBy参数
40.新增API width,height
41.新增API resetExpandRowHeight
42.新增API onScrollEnd
43.修正参数名
44.修正_loadRows不删除通过addRrow(_insert) 方式添加的行
45.新增API getRowId
46.修正fireEvent 返回false BUG
47.新增事件绑定API one() 
48.修正ajax获取数据时不检查主键问题
49.新增grid宽高 最小限制参数 minWidth,minHeight
50.onSizeChange 优化，如果大小没有更改会返回false,第三个参数可设为true 来强制更改大小
51.修正setFieldWidth在刷新grid后不重新设置列宽大小问题
52.优化togrid
53.新增事件映射(别名)
54.新增扩展参数,扩展事件
55.修正rowNumbersWidth设为false 还会多出1px宽度问题
56.优化resetViewSize 的调用次数
57.新增事件onBeforeSortColumn
58.优化resetViewSize,onScroll,setGridBody,优化展示速度
59.新增API addFooterItems
60.修正forceFitColumn 传的是对象而不是字符问题
61.新增模板引擎,可选引入artTemplate 也可选择不引入。
62.新增API page()
63.修正大数据开启下 moveColumn时行锁出现的问题
64.优化selectRow 性能
65.selectRows 可设置默认选择的行,如果singleSelect 开启只会选择当前数组中的第一个rid
+----------------------------------------------------------------------------------------------------------------------------+
*/
/*
+----------------------------------------------------------------------------------------------------------------------------+
v 1.2.7
1.修正setFieldValue 和 column.callBack(...这里调用setFieldValue会出问题...) 的循环调用问题，
并且callBack修改为初始创建单元格时才会调用
2.新增API setFieldText 和 setFieldValue 区别在于只会设置单元格的显示文本，而不会设置单元格的实际值,且不触发任何事件
3.autoHeight 开启后如果容器不设置宽度会出现首次渲染时只适应高度不正确
4.判断isEmptyGrid事件位置调整
5.新增API setRowHeight(rid,height)
6.修正IE 下autoHeight overflow hidden 时scrollWidth 获取不正确
7.修正z-index的大小 1 0 1
8.新增cutHeight cutWidth
9.新增onBeforeAjaxCreate事件
10.新增ajaxSend作为扩展
11.修正grid大小改变时抖动问题
12.render优化 可支持函数
13.优化metaData
14.新增参数 ajaxSend 可替换api ajaxSend
15.新增参数 stripeRows 可开启隔行变色
16.css文件新增隔行变色样式
17.添加行事件 onMouseEnter onMouseLeave
18.重新开启 callBack,callBack里一定不要调用setFieldValue
19.getRealField 当列没设置时返回null BUG
20.新增editColumnSetter 扩展函数可自定义编辑列内容
21.#2306 修正columns不设置field是 field为空而导致不能修改列宽的bug
22.多表头功能实现 新增参数multiColumns 可控制
23.优化moveColumn 体验
24.#2740 多表头实现中发现 getTD 里中间行使用的是field作为名称显示 已经修改成title OK
25.关于多表头多个不同行出现的不对其问题，应该使用onHeaderCreate 后 对header里的table都设置一个相同的高度就OK  待解决 OK
26.当field出现@#￥*（）等字符是 或出现很多问题 比如jquery选择器不能呢个带有( ) 会报错 待解决 OK 
27.forceFit的另外一种实现方法.
28.修正行列锁时刷新grid 导致callBack的t其实是一个已经旧的td 
var t = $("#"+opt.id+'_'+field["field"]+'_row_'+rowId+'_cell',tr);
field['callBack'].call(self,t,rowId,field,rowData);
29.新增独立api _setEmptyMsg 并取消!showHeader 不执行问题
30.修正一个久远的BUG 缺少opt定义 eg:showColumn
31. beforeSend 触发位置改变
32.getRowData 获得的是副本数据
33.新增onCreate事件
34.新增绑定autoHeight事件并重新设置列宽
35.优化部分函数的书写方式
36.新增nowrap参数 控制是否换行
37.优化hasScroll 在IE下的BUG
38.forceFit在width等于百分比时调用性能优化
39.优化改变列大小时不会触发headerColumn的click事件
40.新增事件onSetColumns。 getColumns时 触发
41.新增参数customColumnData 可针对单独列设置默认信息
42.新增参数multiFromStr multiSplitStr multiFromStrData 可通过filed来开启多列
43.优化setFieldWidth的效率，做了缓存机制
44.修正了一个BUG header 单元格id不唯一问题
45.修正onViewSizeChange添加缓存后导致初始加载时onViewSizeChange事件未触发 需要持续优化
46.修正由于getRowData 返回不是引用而引起的一些bug
47.修正autoHeight调用onViewSizeChange是不触发onViewSizeChange事件
48.onShowGrid时调用autoHeight
49.由于onViewSizeChange有缓存机制 只有改变的情况下才会触发，所以onShowGrid中绑定了isEmeptyMsg事件
50.由于开启了多列功能所以在多列处理中新增判断是否有设置field
51.新增全局变量 Nex.grid._colid
52.onFinish 不触发问题 ?
53.hideHeader 在加载数据时没有隐藏 ?
54.修正了一个可能出现的bug
	如果用户不设置columns 直接设置数据 而且数据的key是带多表头实现的 eg [{a_b_c:1}]这样的方式 会导致数据获取不正确或则说是需要用户手动配置 cutsomColumnsData:{'c':{index:'a_b_c'}}
55.现在的多表头实现已经没问题，但是不是通过rowSpan colSpan来实现的，也考虑使用这个方法
56.添加一种新的多列算法，目前可提供自由选择 参数 mulitEngine
+----------------------------------------------------------------------------------------------------------------------------+
*/
;(function($){
	"use strict";
	var dataGrid = Nex.widget('grid');
	//Nex.grid = dataGrid;
	$.extGrid = $.nexGrid = dataGrid;
	
	dataGrid.extend({
		version : '1.2.7', 
		__resizing : false,
		__moving : false,
		_colid : 1,
		getDefaults : function(opt){
			var _opt = {
				prefix : 'datagrid_',
				autoResize : true,
				renderTo : document.body,
				title : '',//为空不显示标题
				cls : '',//自定义CSS
				iconCls : '',//datagrid 标题的icon样式
				toolBars : false,// [{'text':'添加',cls:'样式',callBack,disabled:false}]
				_toolItem : {text : '',cls : '',callBack : $.noop,disabled:false},//tool 属性
				ltText : '',//leftTopText
				rowNumbersWidth : false,//左侧数字列表 一般设为24px 
				rowNumbersExpand: false,// false : 索引 ,auto : 当前显示数据的索引 , 字符串时 自定义模版
				rowNumbers2Row : true,//开启当rowNumbers2Row click的时候 选择当前行
				nowrap : true,//是否换行
				rowTpl : '',//grid 自定义行模板
				showHeader : true,//显示header
				showFooter : false,
				headerTpl : '',//自定义 header 列模板
				containerCss : 'datagrid-container-border',
				clsOverRow : 'datagrid-row-over',
				clsSelectRow : 'datagrid-row-selected',
				stripeRows : false,//开启隔行变色
				clsSingleRow : 'datagrid-row-single',
				clsDoubleRow : 'datagrid-row-double',
				border : true,//开启后会 给grid添加 containerCss 的样式
				lazyLoadRow : false,//开启后 不要使用groupBy
				pageTotal : 0,//pageTotal可用来控制lazyLoadRow显示行数,是一个虚拟值,与total 不同的是 total是用来控制分页工具栏和当前页的实际显示数,某些情况下这2个值应该相等
				lazyMaxRow : 0,
				lazyRows : [],
				lazyTopRows : 5,
				lazyBottomRows : 5,
				showLazyLoading : true,
				_trHeight : -1,
				_lazyEdge : 80,//距离边缘多少时 开始加载
				_csTop : 0,
				_loadRowing : false,
				_tq : 0,
				_initLazy : true,
				cellpPadding : 8,//因为padding 有别的用途 这里的padding 改成cellpPadding
				multiColumns : true,
				mulitEngine : 1,//第一种方法 可设置 1 2
				multiColumnsAlign : 'center',
				multiFromStr : true,//开启支持以字符串形式的方式实现 。multiColumns必须开启
				multiSplitStr : '_',//分割字符
				multiFromStrData : {},//multiFromStr 字符串开启后 可以为不同层数的单元格设置配置信息
				autoHeight : false,//如果为 true height参数无效，并且grid高度会自动调整高度
				minAutoHeight : 50,//开启autoHeight时 视图部分最小高度
				maxAutoHeight : 0,//开启autoHeight时 视图部分最大高度 0表示不限制
				width : 0,
				height : 0,
				minWidth : 0,
				minHeight : 0,
				maxWidth : 0,
				maxHeight : 0,
				checkBox : false,//是否显示checkbox列 开启后 ck 将是系统列
				checkBoxWidth : '28px',
				checkBoxForceFit : false,
				checkBoxTitle : '<input type="checkbox">',
				checkBoxFit : false,
				editColumn : false,//是否显示edit列 [{'text':'添加',cls:'样式',callBack,disabled:false}]  开启后 ed 将是系统列
				editColumnTitle : '操作',
				editColumnFit : true,
				editColumnForceFit : false,
				editCellW : 63,//每个操作按钮的大小
				editColumnSetter : null,//自定义 列内容内置，默认使用getTools
				columns : [],//
				_columnsHash : {},//field=>column 这里包含所有的 会通过getColumns填充
				_colid : 1,//col 自增 参数
				moveColumnTm : 500,//按下多少秒后开始移动列
				moveColumns : true,
				forceFit:false,//自动设置列宽
				forceFitVisible : true,//列是否始终保持可见
				_columnMetaData : {//默认列信息
					field : '',
					index : '',//数据索引，默认==field
					title : '',
					width : '120px',//默认的列宽,
					_fieldWidth : 0,//如果width是百分比 那么这个就是计算百分比后的宽度
					minWidth : 20,//默认最小宽度
					maxWidth : null,
					align : 'left',
					valign : 'middle',//body里的垂直居中
					_expand : false,//自定义列内容
					callBack : $.noop,
					hcls : '',//header cell自定义css
					bcls : '',//body cell自定义css
					fcls : '',//footer cell自定义css
					_icon : '',
					iconCls : '',
					icon : '',
					sortable : false, 
					textLimit : false,//当处理大数据的时候 性能消耗比较厉害， 不建议开启了
					fitColumn : true,//改变列大小
					casePerChange : true,//如果当前列设置的是百分比大小，手动修改列大小后 设置为true:grid刷新会失去百分比作用,false:grid刷新时不会失去百分比作用，而是失去手动修改后的宽度
					reader : {},//映射 可直接使用Function 效果同formatter
					forceFit : true,//接受forceFit开启时自动设置列大小 checkbox edit 列会设置为false
					disabled : false//当前列不可用
				},
				//用户可针对某一列设置默认信息
				customColumnData : {},
				readerDef : '_default_',
				textLimit : false,//文字溢出总开关 已经改用CSS控制，请不要设置
				textLimitDef : '...',
				autoScrollToField : true,
				autoScrollToRow : true,
				scrollbarSize : false,//获取滚动条大小
				sTop : 0,//初始滚动位置
				sLeft : 0,
				_lTime : 0,//v1.0旧 数据显示后 相隔这个时间继续显示下一个 废弃
				_lStart : 0,//采用预先加载的数据时 开始显示位置 eg offset _lStart limit _lSize
				_lSize : 0,//关闭分页显示 用于一页显示大数据时 采用一次性预先加载的数据
				fitColumns : true,//移动列总开关
				data : [],//列表数据 含有_expand的将作为扩展列 如果有 _openExpand=true 则会自动展开
				emptyGridMsg : '',//grid数据为空是的显示数据 可以是模板 opt 作为参数
				showEmptyGridMsg : true,
				pk : '_pk',//主键名称
				hideColumns : [],//已经隐藏的列
				selectRows : [],//设置默认选中的行
				_selectRows : {},//选择的行
				isCreate : false,//废弃
				isShow : false,
				views : {},
				method : 'post',
				url : '',
				loadMsg : '加载中,请稍后...',
				loadErrorMsg : '数据加载错误！',
				showErrorTime : 2000,
				_lmt : 0,//loadMsg 计时器id
				_colWidthExt : 0,//列宽精确位数
				cache : true,//缓存,
				pageNumber : 1,
				pageSize : 10,
				ajaxSend : null,//自定义ajax发送函数
				dataType : 'json',
				queryParams : {},
				singleSelect : false,//是否可以多选
				rowStyler : "",//行style 字符串作为 class function(rowid,rowdata)
				rowCallBack : $.noop,
				methodCall : {},//内部函数的回调函数
				denyRowEvents : false,//禁止触发的事件
				eventMaps : {},
				events : {
					onStart : $.noop,//创建开始 1
					onCreate : $.noop,//创建开始 1
					onViewCreate : $.noop,
					onShowContainer : $.noop,
					onFinish : $.noop,//创建结束 1
					onBeforeLoad : $.noop,//调用远程数据开始 ，如果返回false讲取消本次请1求
					onLoadSuccess : $.noop,//调用远程数据成功1
					onLoadError : $.noop,//调用远程数据失败1
					onClickRow : $.noop,//当用户点击一行时触发1
					onColumnOver : $.noop,//当用户mouseover row
					onColumnOut : $.noop,//当用户mouseout row
					onOverCell : $.noop,//当用户mouseover cell
					onOutCell : $.noop,//当用户mouseout cell
					onOverRow : $.noop,//当用户mouseover row
					onOutRow : $.noop,//当用户mouseout row
					onDblClickRow : $.noop,//当用户双击一行时触发1
					onClickCell : $.noop,//当用户单击一个单元格时触发1
					onDblClickCell : $.noop,//当用户双击一个单元格时触发1
					onResizeColumnStart : $.noop,//当用户调整列的尺寸时触发1
					onResizeColumn : $.noop,//当用户调整列的尺寸时触发1
					onResizeColumnStop : $.noop,//当用户调整列的尺寸时触发1
					onAfterResize : $.noop,//当用户调整列大小后触发,如果onResizeColumnStop 返回false 那么不会执行
					onSelect : $.noop,//用户选中一行时触发1
					onUnselect : $.noop,//当用户取消选择一行时触发1
					onSelectAll : $.noop,//当用户选中全部行时触发1
					onUnselectAll : $.noop,//当用户取消选中全部行时触发1
					onHeaderContextMenu : $.noop,//当 datagrid 的头部被右键单击时触发1
					onHeaderCreate : $.noop,//当 grid-header 创建完成时调用
					onToolBarCreate: $.noop,//排序触发1
					onRowContextMenu : $.noop,//当右键点击行时触发1
					onCellContextMenu : $.noop,
					onBeforeRefresh : $.noop,//1
					onRefresh : $.noop,//1
					onShowGriding : $.noop,// grid数据显示中的时候调用
					onShowGrid : $.noop,// grid 每次刷新都会调用
					onBeforeShowGrid : $.noop, 
					onGetData : $.noop,//1 grid 数据变动都会调用
					onClickRowNumber : $.noop,//1
					onShowColumn : $.noop,//隐藏/显示列触发
					onHideColumn : $.noop,
					onBeforeHideColumn : $.noop,
					onBeforeShowColumn : $.noop,
					onViewSizeChange : $.noop,
					onSizeChange : $.noop,
					onFieldWidthChange : $.noop,
					onScroll : $.noop,
					onScrollBar : $.noop,//手动拖动滚动条时触发
					onScrollEnd : $.noop,
					onDataChange : $.noop,//数据有变更
					onBeforeCellEdit : $.noop,//单元格数据有变更调用
					onCellEdit : $.noop,//单元格数据有变更调用
					onBeforeAddRow : $.noop,//添加行
					onAfterAddRow : $.noop,//添加行
					onBeforeUpdateRow : $.noop,//修改行
					onAfterUpdateRow : $.noop,//修改行
					onBeforeDeleteRow : $.noop,//删除改行
					onAfterDeleteRow : $.noop,//删除改行
					onAdd : $.noop,//添加数据
					onUpdate : $.noop,//更新数据
					onDelete : $.noop,//删除数据
					onAjaxAdd : $.noop,//远程添加数据 需要自定义
					onAjaxUpdate : $.noop,//远程更新数据 需要自定义
					onAjaxDelete : $.noop,//远程删除数据 需要自定义
					onColumnMove : $.noop,
					onColumnMoving : $.noop,
					onBeforeColumnMove : $.noop,
					onAutoColumnResize : $.noop,//开启forceFit 如果列自适应会触发此事件
					onShowLazyRows : $.noop,
					onLazyRowHide : $.noop,
					onUpdateHeaderRow : $.noop,
					onUpdateFooterRow : $.noop,
					onLazyRowShow : $.noop,
					onColumnValueChange : $.noop//列信息改变是触发
				}//事件组合 
				
			};
			
			var _opt = this.extSet(_opt);
			
			return $.extend({},_opt,opt);
		},
		//table转换成gird时的设置参数
		getToGridOptions : function(cfg){
			var opt = {
				options_from : 'data-options',
				columns_from : 'thead th',
				data_from : 'tbody tr',
				footdata_from : 'tfoot tr'
			}
			return $.extend(true,opt,cfg);
		},
		_Tpl : {
			'container' : '<div class="datagrid-container <%=cls%> <%=border?containerCss:""%>" id="<%=id%>" style=" position:relative; overflow:hidden; width:<%=width%>px; height:<%=height%>px;"></div>',
			'title' : '<div class="datagrid-title <%=iconCls%>" id="title_<%=id%>"><%=title%></div>',
			'toolbar' : '<div class="datagrid-toolbar" id="toolbar_<%=id%>"></div>',
			'grid' : '<div class="datagrid-view" id="view_<%=id%>" style="width:1px; height:1px;"></div>',
			'group_row' : '<tr id="<%=id%>-group-row-<%=gid%>"  datagrid-group-row-id="<%=gid%>" class="datagrid-group-row"><td style="width:<%=w%>px" colspan="<%=colspan%>"><div  class="datagrid-group-cell"><%=html%>(<%=num%>)</div></td></tr>',
			'view1' : '<div class="datagrid-view1" id="view1_<%=id%>" style="width:<%=parseFloat(rowNumbersWidth)%>px;height:100%;">'
							+'<div  class="datagrid-header" id="view1-datagrid-header-<%=id%>" style="width: 100%; z-index:1; position:relative;">'
								+'<div class="datagrid-header-inner" id="view1-datagrid-header-inner-<%=id%>">'
									+'<div class="datagrid-header-inner-wraper" id="datagrid-view1-header-inner-wraper-<%=id%>">'
										+'<table class="datagrid-htable" id="view1-datagrid-header-inner-htable-<%=id%>" border="0" cellspacing="0" cellpadding="0">'
											+'<tbody id="view1-datagrid-header-inner-htable-tbody-<%=id%>">'
											+'</tbody>'
										+'</table>'
									+'</div>'
								+'</div>'
								+'<div class="datagrid-header-outer" id="view1-datagrid-header-outer-<%=id%>">'
									+'<div class="datagrid-header-outer-wraper" id="datagrid-view1-header-outer-wraper-<%=id%>">'
										+'<table class="datagrid-locktable" id="view1-datagrid-header-outer-locktable-<%=id%>" border="0" cellspacing="0" cellpadding="0">'
											+'<tbody id="view1-datagrid-header-outer-locktable-tbody-<%=id%>">'
											+'</tbody>'
										+'</table>'
									+'</div>'
								+'</div>'
							+'</div>'
							+'<div class="datagrid-body-wrap" id="view1-datagrid-body-wrap-<%=id%>" style="width: 100%; height:0px; overflow:hidden;zoom:1; ">'
								+'<div class="datagrid-body datagrid-view1-body" id="view1-datagrid-body-<%=id%>" style="width: 100%;float:left;z-index:0;position:relative;">'
									+'<table class="datagrid-btable" id="view1-datagrid-body-btable-<%=id%>" cellspacing="0" cellpadding="0" border="0">'
										+'<tbody id="view1-datagrid-body-btable-tbody-<%=id%>">'
										+'</tbody>'
									+'</table>'
								+'</div>'
							+'</div>'
							+'<div class="datagrid-footer" id="view1-datagrid-footer-<%=id%>" style="width: 100%; height:0px; overflow:hidden;position:relative;z-index:1;"><div id="view1-datagrid-footer-inner-<%=id%>"  class="datagrid-footer-inner"></div></div>'
						+'</div>',
			'view2' : '<div class="datagrid-view2" id="view2_<%=id%>" style="width:1px;height:100%;">'
							+'<div  class="datagrid-header" id="view2-datagrid-header-<%=id%>" style="width: 100%;">'
								+'<div class="datagrid-header-inner" id="view2-datagrid-header-inner-<%=id%>">'
									+'<div class="datagrid-header-inner-wraper" id="datagrid-view2-header-inner-wraper-<%=id%>">'
										+'<table class="datagrid-htable" id="view2-datagrid-header-inner-htable-<%=id%>" border="0" cellspacing="0" cellpadding="0">'
											+'<tbody id="view2-datagrid-header-inner-htable-tbody-<%=id%>">'
											+'</tbody>'
										+'</table>'
									+'</div>'
								+'</div>'
								+'<div class="datagrid-header-outer" id="view2-datagrid-header-outer-<%=id%>">'
									+'<div class="datagrid-header-outer-wraper" id="datagrid-view2-header-outer-wraper-<%=id%>">'
										+'<table class="datagrid-locktable" id="view2-datagrid-header-outer-locktable-<%=id%>" border="0" cellspacing="0" cellpadding="0">'
											+'<tbody id="view2-datagrid-header-outer-locktable-tbody-<%=id%>">'
											+'</tbody>'
										+'</table>'
									+'</div>'	
								+'</div>'
							+'</div>'
							+'<div class="datagrid-body datagrid-view2-body" id="view2-datagrid-body-<%=id%>" style="width: 100%;height:0px;">'
								+'<table class="datagrid-btable" id="view2-datagrid-body-btable-<%=id%>" cellspacing="0" cellpadding="0" border="0">'
									+'<tbody id="view2-datagrid-body-btable-tbody-<%=id%>">'
									+'</tbody>'
								+'</table>'
							+'</div>'
							+'<div class="datagrid-footer" id="view2-datagrid-footer-<%=id%>" style="width: 100%; height:0px; "><div id="view2-datagrid-footer-inner-<%=id%>"  class="datagrid-footer-inner"></div></div>'
					+'</div>',
			'pager' : '',
			'view1_header_inner_row' : '<tr class="datagrid-header-row">'
											+'<% if( rowNumbersWidth !== false ) {%>'
											+'<td align="center" class="datagrid-td-rownumber" style=""><div class="datagrid-header-rownumber" style="width:<%=parseFloat(rowNumbersWidth)%>px;"><%=ltText%></div></td>'
											+'<% } %>'
									   +'</tr>',	
			'view1_header_outer_row' : '',	
			'view2_header_inner_row' : '',//改用模版函数代替
			'view2_header_inner_row_bak' : '<tr class="datagrid-header-row">'
											+'<% var i=0;len = fields.length;  for(;i<len;i++) {%>'
											+'<td id="<%=opt.id%>_cols_<%=fields[i]["_colid"]%>" class="datagrid_<%=fields[i]["_colid"]%>" field="<%=fields[i]["field"]%>" align="<%=fields[i]["align"]%>">'
												+'<div class="datagrid-header-wrap" field="<%=fields[i]["field"]%>" >'
													+'<div id="<%=opt.id%>_cell_header_<%=fields[i]["_colid"]%>" class="datagrid-cell datagrid-header-cell <%=opt.nowrap ? "datagrid-header-cell-nowrap":""%> datagrid-cell-<%=fields[i]["_colid"]%> datagrid-cell-header-<%=fields[i]["_colid"]%> <%=fields[i]["hcls"]%>" >'
														+'<span><%=fields[i]["title"]%></span>'
													+'</div>'
												+'</div>'
											+'</td>'
											+'<% } %>'
										+'</tr>',							
			'view2_header_outer_row' : '',
			'view1_row' : '',//改用模版函数代替
			'view2_row' : ''//改用模版函数代替
		}
		
	});
	dataGrid.fn.extend({
		_init : function( opt ) {
			var self = this;
			//模版引擎设置
			opt.template.isEscape = opt.isEscape;
			opt.template.helper('parseInt', parseInt);
			opt.template.helper('parseFloat', parseFloat);

			opt.gid = opt.gid || "#view_"+opt.id;
			
			opt.renderTo = $(opt.renderTo);

			//保存初始设置值
			opt.__width = opt.width;
			opt.__height = opt.height;
			
			self.setContainer() //setContainer必须
				.setTitle()
				.setToolBar()
				.setGrid()
				.show();
		},
		_sysEvents : function(){
			var self = this;
			var opt = self.configs;
			//绑定checkBox
			self.bind("onUnselectAll",function(){this.checkCk(false,0)});
			self.bind("onSelectAll",function(){this.checkCk(true,0)});
			self.bind("onUnselect",function(){this.checkCk(false,1)});
			
			self.bind("onBeforeShowGrid",function(){this.checkCk(false,2)});
			//core
			self.bind("onShowContainer",self.onInitFieldWidth);// onViewCreate
			
			self.bind("onSetPk",self.setPk);
			
			self.bind("onSizeChange",self.refreshColumnsWidth);
			self.bind("onShowGrid",self.resetHeader);
			
			self.bind("onScrollBar",self.onScrollBar);
			self.bind("onScroll",self.loadRows);
			
			self.bind("onDataChange",self.onDataChange);
			self.bind("onMouseEnter",self.onOverRow);
			self.bind("onMouseLeave",self.onOutRow);
			self.bind("onShowGrid",self.onDisplayField);
			
			self.bind("onHeaderCreate",self.onHeaderCreate);
			
			self.bind("onColumnValueChange",self.onColumnValueChange);
			
			self.bind("onAfterAddRow",self.onDisplayField);//隐藏列
			
			//emptyGrid
			self.bind("onAfterAddRow",self.removeEmptyDiv);
			
			self.bind("onFieldWidthChange",self.setForceFitColumn);
			
			self.bind("onAutoHeight",function(){
				var self = this,
					opt = this.configs;
				if( !opt.forceFit ) {	
					var columns = opt.columns;
					self.lockMethod( 'resetViewSize' );
					$.each(columns,function(i,column){
						if( column.width.toString().indexOf("%") != -1 ) {
							self.setFieldWidth( column.field,column.width );
						}
					});
					self.unLockMethod( 'resetViewSize' );
				}
			});//autoHeight后滚动条会消失 最好就是重设宽度
			self.bind("onViewSizeChange",self._autoHeight);
			self.bind("onViewSizeChange",self.onFitColumn);
			self.bind("onViewSizeChange",self.isEmptyGrid);//改变大小
			self.bind("onShowLazyRows",self.onDisplayField);//隐藏列
			
			self.bind("onUpdateHeaderRow",self.onDisplayField);//隐藏列
			
			//self.bind("onUpdateFooterRow",self.onDisplayField);//隐藏列
			//_loadRows
			self.bind("onSizeChange",function(){
				this.loadRows(true);							  
			});
			self.bind("onLazyRowShow",self._selectLazyRows);
			//selectRows = []
			self.bind("onShowGrid",self._selectDefRows);
			
			self.bind("onShowGrid",self._autoHeight);
			self.bind("onShowGrid",self.isEmptyGrid);//创建
			//self.bind("onShowGrid",self.refreshColumnsWidth);
			self.bind("onViewSizeChange",self.refreshColumnsWidth);
		},
		
		showLoading : function(msg,render){
			var self = this;	
			var opt = self.configs;
			var msg = typeof msg === 'undefined' ? opt.loadMsg : msg;
			if( opt._lmt ) {
				clearTimeout(opt._lmt);	
			}
			
			var render = "#"+opt.id;
			//self.hideLoading(render);
			var isExists = $("#"+opt.id+"_datagrid-mask-wraper");
			if( isExists.length ) {
				var maskMsg = $("#"+opt.id+"_datagrid-mask-msg");
				maskMsg.html( msg );
				
				isExists.show();	
				
				var w = maskMsg.outerWidth(true);
				maskMsg.css("marginLeft",-w/2+"px");
				
				return self;
			}
			
			var maskWraper = $('<div id="'+opt.id+'_datagrid-mask-wraper" class="datagrid-mask-wraper"><div id="'+opt.id+'_datagrid-mask" class="datagrid-mask"></div><div id="'+opt.id+'_datagrid-mask-spacer" class="datagrid-mask-spacer"></div><div id="'+opt.id+'_datagrid-mask-msg" class="datagrid-mask-msg" style=" left: 50%;">'+msg+'</div><div>');
			$(render).append(maskWraper);
			var maskMsg = $("#"+opt.id+"_datagrid-mask-msg");
			var w = maskMsg.outerWidth(true);
			maskMsg.css("marginLeft",-w/2+"px");
			maskWraper.click(function(e){
					e.stopPropagation();
					e.preventDefault();											 
				});
			return self;
		},
		hideLoading : function(render){
			var self = this;
			var opt = self.configs;
			//$("#"+opt.id+"_datagrid-mask-wraper").hide();
			opt._lmt = setTimeout(function(){
				$("#"+opt.id+"_datagrid-mask-wraper").hide();					
			},0);
			
			return self;
		},
		methodCall : function(method){
			var method = method || "";
			var self = this;
			var opt = self.configs;
			if( method!="" && method in opt.methodCall && $.isFunction(opt.methodCall[method]) ) {
				opt.methodCall[method].call(self);	
			}
			
			return self;
		},
		/*
		* 获取当前grid列信息,数组方式返回
		*/
		getColumnMap : function(){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var fields = opt.columns;
			return fields;
		},
		/*
		* 获取当前grid的列名,数组方式返回
		*/
		getColumnList : function(){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var fields = self.getColumnMap();
			var list = [];
			var i = 0,
				len = fields.length;
			for(;i<len;i++) {
				list.push(fields[i]['field']);	
			}
			return list;
		},
		/*
		* 获取/设置列信息(部分参数设置后会刷新grid表格)
		* 可触发事件onColumnValueChange
		*  @columnName {String} 列名
		*  @proto      {String} 参数(可选)
		*  @value      {String} 参数值(可选)
		*/
		getColumnData : function(columnName,proto,value){
			var self = this;
			var opt = self.configs;
			
			var columnName = self._undef(columnName,false);	
			var proto = self._undef(proto,false);	
			
			if(columnName === false ) return null;
			
			//var fields = self.getColumns(true);//获取columns元数据 ？？ 想不起为啥以前要获取元数据了
			//var fields = opt.columns;
			//统一使用getColumnMap 接口获取列
			var fields = opt._columnsHash;///self.getColumnMap();//这里不建议直接使用getColumnMap 因为多表头情况下 表头不存在opt.columns
			
			var col = 'nsort'+columnName;
			
			if( !(col in fields) ) return  null;
			
			var field = fields[col];
			
			if(proto === false) {
				return field;
			} else {
				if(typeof value === 'undefined') {
					return self._undef(field[proto],null);
				} else {
					field[proto] = value;
					
					//址引用 不必重新设置
					//opt.columns = fields;//设置后必须调用getColumns 。setGridHeader会调用getColumns

					self.fireEvent("onColumnValueChange",[fields[i],proto,value,opt]);
		
					//self.setGridHeader();//重新生成
					//self.refreshDataCache();
					return value;
				}
			}
			return null;
		},
		/*
		*同getColumnData
		*/
		setColumnData : function(columnName,proto,value){
			var self = this;
			return self.getColumnData(columnName,proto,value);
		},
		/*
		*系统事件
		*/
		onColumnValueChange : function(column,proto,value){
			var self = this;
			var opt = self.configs;
			switch(proto) {
				case 'width' : 
					self.setFieldWidth(column.field,value);
					break;
				case 'title' : 
					$(".datagrid-cell-header-"+column._colid+" >span:first",$("#"+opt.id)).html(value);
					break;
				case 'field' :
					self.setFieldWidth(value,column[value].width);
					self.setGridHeader();//重新生成
					self.refreshDataCache();	
					break;
				default : 
					self.setGridHeader();//重新生成
					self.refreshDataCache();	
			}
		},
		/*
		* 获取当前grid数据集
		*  @return {Object} 数据集
		*/
		getData : function(){
			var self = this;
			var opt = self.configs;
			var async = self.getAsync();
			if( async ) {
				opt.cacheData['source'] = opt.cacheData['source'] || opt.data;
				return opt.cacheData['source'];
			} else {
				return opt.data;
			}
		},
		textLimit : function(text,width,fontSize) {},
		getTpl : function(tpl) { //兼容函数
			return tpl;
		},
		/*如果width height 设置的是百分比那么将返回百分比值，只对resize和初始创建时有效*/
		getResizeWH : function(){
			var self = this;
			var opt = self.C();	
			var width =  $(opt.renderTo)._width();
			var height =  $(opt.renderTo)._height();	
			opt.__pWidth = width;
			opt.__pHeight = height;

			var w = opt.__width === 0 ? width : opt.__width
				,h = opt.__height === 0 ? height : opt.__height;
			if( opt.__width.toString().indexOf("%") != -1 ) {
				w = parseFloat(opt.__width)*width/100;
			}
			if( opt.__height.toString().indexOf("%") != -1 ) {
				h = parseFloat(opt.__height)*height/100;
			}

			return {width:w,height:h};
		},
		/*
		*返回组件的最终宽高
		*/
		checkSize : function(width,height){
			var self = this;
			var opt = self.configs;	
			
			height -= isNaN(parseFloat(opt.cutHeight)) ? 0 : opt.cutHeight;
			width -= isNaN(parseFloat(opt.cutWidth)) ? 0 : opt.cutWidth;
			
			if( opt.minWidth>0 ) {
				width = Math.max(width,opt.minWidth);
			}
			if( opt.minHeight>0 ) {
				height = Math.max(height,opt.minHeight);
			}
			if( opt.maxWidth>0 ) {
				width = Math.min(width,opt.maxWidth);
			}
			if( opt.maxHeight>0 ) {
				height = Math.min(height,opt.maxHeight);
			}
			
			return {
					width : width,
					height : height
				};
		},
		/*
		* 设置grid容器宽高
		*  @width  {int} 宽
		*  @height {int} 高
		*/
		resizeContainer : function(width,height){
			var self = this;
			var opt = self.configs;
			
			var container = $("#"+opt.id);
			
			var size = self.getResizeWH();
			
			opt.width = self._undef(width,size.width);
			opt.height = self._undef(height,size.height);
			
			//检查自定义setWH 是否使用百分比做为单位
			if( opt.width.toString().indexOf("%") != -1 ) {
				opt.width = parseFloat(opt.width)*opt.__pWidth/100;
			}
			if( opt.height.toString().indexOf("%") != -1 ) {
				opt.height = parseFloat(opt.height)*opt.__pHeight/100;
			}
			
			/*opt.height -= isNaN(parseFloat(opt.cutHeight)) ? 0 : opt.cutHeight;
			opt.width -= isNaN(parseFloat(opt.cutWidth)) ? 0 : opt.cutWidth;
			
			if( opt.minWidth>0 ) {
				opt.width = Math.max(opt.width,opt.minWidth);
			}
			if( opt.minHeight>0 ) {
				opt.height = Math.max(opt.height,opt.minHeight);
			}
			if( opt.maxWidth>0 ) {
				opt.width = Math.min(opt.width,opt.maxWidth);
			}
			if( opt.maxHeight>0 ) {
				opt.height = Math.min(opt.height,opt.maxHeight);
			}*/
			var wh = self.checkSize( opt.width,opt.height );
			opt.width = wh.width;
			opt.height = wh.height;
			
			var width=opt.width,height=opt.height;
			//2014-03-13  取消
			width -= (container._outerWidth() - container._width());
			height -= (container._outerHeight() - container._height());
			//直接使用width height
			//width = container._width();
			//height = container._height();
			container.css({
				width : width,
				height : height
			});
			return {
				width : width,
				height : height
			};
		},
		setContainer : function(opt) {
			var opt = opt || {};
			var self = this;
			//var opt = $.extend({},self.configs,opt);
			var opt = self.configs;
			var tpl = self.tpl("container",opt);
			
			opt.renderTo.append($(tpl));
			//__SIZE__ 用于 _setGridWH
			opt.__SIZE__ = self.resizeContainer();
			
			return self;
		},
		setTitle : function(title) {
			var self = this;
			var opt = self.configs;
			opt.title = typeof title === 'undefined' ?  opt.title : title;
			if(opt.title==="") return self;
			var tpl = self.tpl("title",opt);
			self.configs.views['title'] = $(tpl);
			return self;
		},
		/*
		* 获取工具列表
		*  @items  {Array} 工具按钮
		*  @return  {Object} 创建好的工具对象dom
		*/
		getTools : function(items){
			var self = this;
			var opt = self.configs;
			
			
			if( $.isPlainObject(items) ) {
				var items = [ items ];	
			}
			if( !$.isArray(items) && !$.isPlainObject(items) ) {
				return $(items);	
			}
			var _item = opt._toolItem;
			var container = '<table cellspacing="0" cellpadding="0" border="0"><tbody><tr>{$tools}</tr></tbody></table>';
			var h = '';
			var i=0,
				len = items.length;
			for(;i<len;i++) {
				if( $.isPlainObject(items[i]) ) {
					items[i] = $.extend({},_item,items[i]);
					if(items[i]['cls'] != '') {
						items[i]['cls'] += " l-btn-icon-left";		
					}
					var isDisabled = items[i]['disabled'] ? "l-btn-disabled" : "";
					h += '<td><a href="javascript:void(0)" class="l-btn l-btn-plain '+isDisabled+'" indexid="'+i+'"><span class="l-btn-left"><span class="l-btn-text '+items[i]['cls']+'">'+items[i]['text']+'</span></span></a></td>';
				} else if( items[i]==='|' || items[i]==='-' || items[i]===';' || items[i]===',' ) {
					h += '<td><div class="datagrid-btn-separator"></div></td>';	
				} else {
					h += '<td>'+items[i]+'</td>';		
				}
			}
			container = container.replace('{$tools}',h);
			var container = $(container);
			container.find(".l-btn").each(function(i){
				$(this).click(function(e){
					var indexid = $(this).attr("indexid");
					items[indexid]['callBack'].call(self,this,items[indexid]);
					e.stopPropagation();
					e.preventDefault();
				});									   
			});
			return container;
		},
		setToolBar : function() {
			var self = this;
			var opt = self.configs;
			if(opt.toolBars===false) return self;
			var tpl = self.tpl("toolbar",opt);
			self.configs.views['toolbar'] = $(tpl);
			var tool = self.getTools(opt.toolBars);
			if( tool !== false ) {
				self.configs.views['toolbar'].append(tool);	
			}
			self.fireEvent('onToolBarCreate',[self.configs.views['toolbar'],opt.toolBars,opt]);
			self.methodCall('setToolBar');
			
			return self;
		},
		//初步设置gridView高度和宽度
		_setGridWH : function(){
			var self = this;
			var opt = self.configs;
			var views = opt.views;
			var grid = views['grid'];
			
			var h = 0;
			for(var i in views) {
				if(i === 'grid') continue;
				h += views[i]._outerHeight(true);
			}
			//var g = $("#"+opt.id);
			var size = opt.__SIZE__;
			
			grid._outerHeight( size.height - h );
			grid._outerWidth( size.width );
			
			//解决IE下 $().width() 耗时问题
			//grid.data('_width',grid.width());
			//grid.data('_height',grid.height());
		},
		_setGridViewWH : function(){
			var self = this;
			var opt = self.configs;
			
			var size = opt.__SIZE__;
			
			var w = size.width;
			
			//初始化是设置 gridViewSize 提示等待时的友好
			var view1 = $("#view1_"+opt.id);
			var view2 = $("#view2_"+opt.id);
			//设置宽度	
			var view1_w = $("#view1-datagrid-header-inner-htable-"+opt.id)._outerWidth();
			view1.width(view1_w);
			var v1_w = view1._outerWidth();
			//设置绝对显示位置
			view2.css('left',v1_w);
			var _v2 = w - v1_w;
			view2._outerWidth( _v2 );
		},
		setGrid : function () {
			//setView
			var self = this;
			var opt = self.configs;
			var views = opt.views;
			if(!views['grid']) {
				var tpl = self.tpl("grid",opt);
				self.configs.views['grid'] = $(tpl);
			}
			self.methodCall('setGrid');
			return self;
		},
		//autoExpand : function(){},
		checkCk : function(type,t){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var render = gid;
			var type = self._undef(type,false);
			var t = self._undef(t,0);
			if( t == 1 ) {
				if( opt.lazyLoadRow ) {
					return;
				}	
			}
			//view2-datagrid-header-inner-htable-tbody-datagrid_57036
			$("#view2-datagrid-header-inner-htable-tbody-"+opt.id).find(">.datagrid-header-row td[field='ck']").find("input:checkbox").each(function(i){
				this.checked = type ? true : false;																					   
			});
		},
		//setExpandEvent : function(t,rowId,rowData){},
		/*
		* 滚动到指定列
		*  @field {String} 列名
		*/
		scrollToField : function(field){
			var self = this;
			var opt = self.configs;
			var header = $("#view2-datagrid-header-"+opt.id);
			
			if( !header.length ) {
				return self;	
			}
			
			var columns = self.getColumnList();
			
			if( self.inArray( field,columns ) == -1 ) {
				return self;		
			}
			
			//检测当前列是否已经隐藏
			if( self.inArray( field,opt.hideColumns ) != -1 ) {
				return self;		
			}
			
			var r = self.fireEvent("onBeforeScrollToField",[field,opt]);
			if( r === false ) {
				return r;	
			}
			
			var scrollbarSize = self.getScrollbarSize();
			
			var offset = header.offset();
			var w = header._outerWidth();
			//判断是否出现了垂直滚动条
			//这里在某些情况下有可能存在BUG, 可参见autoHeight 对判断是否出现滚动条问题的解决
			var body = $("#view2-datagrid-body-"+opt.id);
			var sh = body.get(0).scrollHeight;
			if( sh > body._outerHeight() ) {
				w -= scrollbarSize.width;//-滚动条大小
			}
			
			var f = $(">.datagrid-header-row td[field='"+field+"']","#view2-datagrid-header-inner-htable-tbody-"+opt.id);
			
			if( !f.length ) return self;
			
			var fo = f.offset();
			var fw = f._outerWidth();
			
			var outerWidth = 0;
			if( offset.left > fo.left ) {
				outerWidth = offset.left - fo.left;
			} else if( (offset.left+w) < (fo.left+fw) ) {
				outerWidth = (offset.left+w) - (fo.left+fw);
			}
			var sLeft = 0;
			
			sLeft = opt.sLeft - outerWidth;
			
			opt.sLeft = sLeft;

			//self.fireEvent("onScroll",[true]);
			
			self.onScroll(true);
			
			self.fireEvent("onAfterScrollToField",[field,opt]);

			return self;
		},
		/*
		* 滚动到指定行
		*  @rid {int} 行id
		*/
		scrollToRow : function(rid){
			var self = this;
			var opt = self.configs;
	
			var r = self.fireEvent("onBeforeScrollToRow",[rid,opt]);
			if( r === false ) {
				return r;	
			}
			
			if( opt.lazyLoadRow && self.inArray( rid,opt.lazyRows ) == -1 ) {
				opt.sTop = opt._trHeight*rid;
				self.fireEvent("onScroll",[]);
				return self;
			}
			
			var body = $("#view2-datagrid-body-"+opt.id);
			
			if( !body.length ) {
				return self;	
			}
			
			var scrollbarSize = self.getScrollbarSize();
			
			var offset = body.offset();
			var h = body._outerHeight();
			//判断是否出现了水平滚动条
			//这里在某些情况下有可能存在BUG, 可参见autoHeight 对判断是否出现滚动条问题的解决
			var sw = body.get(0).scrollWidth;
			if( sw > body._outerWidth() ) {
				h -= scrollbarSize.height;//-滚动条大小
			}
			
			var f = $("#"+opt.id+"-row-"+rid);
			if( !f.length ) {
				return self;	
			}
			
			var fo = f.offset();
			var fh = f._outerHeight();
			
			var outerHeight = 0;
			if( offset.top > fo.top ) {
				outerHeight = offset.top - fo.top;
			} else if( (offset.top+h) < (fo.top+fh) ) {
				outerHeight = (offset.top+h) - (fo.top+fh);
			}
			
			var sTop = 0;
			
			sTop = opt.sTop - outerHeight;
			
			opt.sTop = sTop;

			//self.fireEvent("onScroll",[true]);
			self.onScroll(true);
			
			self.fireEvent("onAfterScrollToRow",[rid,opt]);
			
			return self;
		},
		//refreshPager : function(){},
		//addPagerEvent : function(){},
		//setPager : function(init) {},
		_autoHeight : function(){
			var self = this;
			var opt = self.configs;
			/*
			if( opt.autoHeight ) {
				self.autoHeight();		
			}	
			*/
			if( opt._atuoHTime ) {
				clearTimeout( opt._atuoHTime )	
			}
			opt._atuoHTime = setTimeout(function(){
				if( opt.autoHeight ) {
					self.autoHeight();		
				}	
			},0);
			
		},
		/*
		* 只适应高度
		*  大数据开启下不建议使用这个
		*/
		autoHeight : function(){
			var self = this;
			var opt = self.configs;
			var grid = $("#"+opt.id);
			var view = $("#view_"+opt.id);

			var scrollbarSize = self.getScrollbarSize();
			
			$("#view2-datagrid-body-"+opt.id).css("overflow-y","hidden");	
			
			//var h = grid.outerHeight() - view.outerHeight();//2014-03-03 取消 
			var rv = $("#view2-datagrid-header-"+opt.id)._outerHeight();
			var rh = $("#view2-datagrid-body-btable-"+opt.id)._outerHeight();
			var rf = $("#view2-datagrid-footer-"+opt.id)._outerHeight();
			var _min = opt.minAutoHeight;
			var _max = opt.maxAutoHeight;
			rh = Math.max( rh,_min );
			if( _max>0 ) {
				
				if( rh > _max ) {
					$("#view2-datagrid-body-"+opt.id).css("overflow-y","auto");	
				}
				
				rh = Math.min( rh,_max );	
			}
			var _f = 0;
			if( !opt.forceFit ) {
				//判断是否出现了水平滚动条
				var header = $("#view2-datagrid-header-"+opt.id);
				var headerInner = $("#view2-datagrid-header-inner-htable-"+opt.id);
				if( headerInner._outerWidth()>header._outerWidth() ) {
					_f = scrollbarSize.height;
				}
			}
			var height = rv + rh + rf + _f;//取消 +h 
			
			//bug : grid.outerHeight()-grid.height()
			//如果容器高度为0时 则 grid.outerHeight()会是一个0或者2 grid.outerHeight()-grid.height() 的值就是错误的
			//fix 2014-3-3
			//以上问题出现在于grid不在$.ready里创建 ,$.boxModel还没设置
			var views = opt.views;
			var h = grid._outerHeight()-grid._height();
			for(var i in views) {
				if(i == 'grid') continue;
				h += views[i]._outerHeight(true);
			}
			
			self.onSizeChange( opt.width,height+h );
			var r = self.onViewSizeChange();
			if( r ) {
				self.fireEvent("onViewSizeChange",[opt]);	
			}
			/*self.methodInvoke('resetViewSize',function(){
				self.fireEvent("onAutoHeight",[opt]);					   
			});*/
			
			//如果是opt.autoHeight = true 应该把高度设置给grid
			if( opt.autoHeight ) {
				opt.height = height+h;	
			}
			
			self.fireEvent("onAutoHeight",[opt]);
		},
		unAutoHeight : function(){
			var self = this;
			var opt = self.configs;	
			opt.autoHeight = false;
			$("#view2-datagrid-body-"+opt.id).css("overflow-y","auto");
		},
		/*
		* 设置grid宽,高
		*  触发onSizeChange事件
		*  @width  {int} 宽
		*  @height {int} 高
		*  @m      {boolean} true:强制更新,false:大小都没变化时不更新大小返回false 默认(可选)
		*/
		resetGridSize : function(width,height,m){
			var self = this;
			var opt = self.configs;	
			var m = self._undef(m,false);
			var width = self._undef(width,opt.width);
			var height = self._undef(height,opt.height);
			//如果不需要设置会返回false
			var r = self.onSizeChange(width,height,m);
			if( r === false ) return r;
			
			//self.resetViewSize();
			self.methodInvoke('resetViewSize',function(){
				self.fireEvent("onSizeChange",[opt]);								   
			});
			//因为resetViewSize有延迟，所以必须要把事件触发放到resetViewSize里
			//self.fireEvent("onSizeChange",[opt]);	
		},
		setGridSize : function(w,h,m){
			this.resetGridSize(w,h,m);
		},
		onSizeChange : function(width,height,m){
			var self = this;
			var opt = self.configs;
			
			var m = self._undef(m,false);
			//m:true 强制更新宽高
			if( !m ) {
				var w = self._undef(width,opt.width);
				var h = self._undef(height,opt.height);
				var  wh = self.checkSize( w,h );
				if( wh.width == opt.width && wh.height == opt.height ) return false;
			}
			
			opt.width = self._undef(width,opt.width);
			opt.height = self._undef(height,opt.height);

			var container = $("#"+opt.id);
			
			var size = self.resizeContainer(opt.width,opt.height);
			//计算grid高度
			var views = opt.views;
			var grid = views['grid'];
			var h = 0;
			for(var i in views) {
				if(i == 'grid') continue;
				h += views[i]._outerHeight(true);
			}
			grid._outerWidth( size.width );
			grid._outerHeight(size.height - h);
			
			self.fireEvent("onSetGridSize",[opt]);
			//解决IE下耗时问题 方案1
			//grid.data('_width',grid.width());
			//grid.data('_height',grid.height());
			return true;
		},
		/*
		* 更新grid视图部分宽高
		*  触发onViewSizeChange事件
		*/
		resetViewSize : function (func){
			var self = this;
			var opt = self.configs;
			if( opt.__svt ) {
				clearTimeout(opt.__svt);	
			}
			opt.__svt = setTimeout(function(){
				var r = self.onViewSizeChange();
				if( r ) {
					self.fireEvent("onViewSizeChange",[opt]);
				}
				opt.__svt = 0;
				if( func && $.isFunction(func) ) {
					func();
				}
			},0);
			
		}, 
		setViewSize : function(func){
			var self = this;
			self.methodInvoke('resetViewSize',func);
			//this.resetViewSize();
		},
		_setViewSize : function(){
			//var s = $.now();
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var grid = $(gid);
			
			var w = grid.width();//列太多，会导致获取时间成正比
			var	h = grid.height();
			
			var view1 = $("#view1_"+opt.id);
			var view2 = $("#view2_"+opt.id);
			
			//设置宽度	
			var view1_w = $("#view1-datagrid-header-inner-htable-"+opt.id)._outerWidth();
			view1.width(view1_w);
			var v1_w = view1._outerWidth();
			//设置绝对显示位置
			view2.css('left',v1_w);
			var _v2 = w - v1_w;
			view2._outerWidth( _v2 );
			//设置高度
			var view2_header_h = $("#view2-datagrid-header-inner-htable-"+opt.id)._height();//datagrid-view2-header-inner-wraper-datagrid_1
			//左右高度一样
			$("#view1-datagrid-header-inner-htable-"+opt.id).height( view2_header_h );

			//隐藏header
			if( !opt.showHeader ) {
				view2_header_h = 0;	
			}
			
			$("#view1-datagrid-header-inner-"+opt.id)._outerHeight( view2_header_h );
			$("#view2-datagrid-header-inner-"+opt.id)._outerHeight( view2_header_h );
			//设置datagrid-header-outer
			var view2_header_outer_h = $("#datagrid-view2-header-outer-wraper-"+opt.id)._height();
			$("#view1-datagrid-header-outer-"+opt.id).height( view2_header_outer_h );
			$("#view2-datagrid-header-outer-"+opt.id).height( view2_header_outer_h );
			//设置datagrid-header
			var header_h =  $("#view2-datagrid-header-inner-"+opt.id)._outerHeight() + $("#view2-datagrid-header-outer-"+opt.id)._outerHeight();
			
			$("#view1-datagrid-header-"+opt.id).height( header_h );
			$("#view2-datagrid-header-"+opt.id).height( header_h );
			//隐藏footer
			if( !opt.showFooter ) {
				opt.gfooter.height( 0 );
				$("#view1-datagrid-footer-"+opt.id).height( 0 );
			} else {
				var fh = 0;
				var nodes = $("#view2-datagrid-footer-inner-"+opt.id).children();
				nodes.each(function(){
					fh += $(this)._outerHeight();				
				});
				opt.gfooter.height( fh );	
				$("#view1-datagrid-footer-"+opt.id).height( fh );
			}
			
			var bodyH = view2._height() - opt.gheader._outerHeight() - opt.gfooter._outerHeight();
			opt.gbody._outerHeight( bodyH );
			$("#view1-datagrid-body-wrap-"+opt.id)._outerHeight( bodyH );
			//开启显示footer后,如果数据过少会导致不粘合在一起问题,觉得不需要
			if( opt.showFooter ) {}
			
			self.fireEvent("onSetGridViewSize",[opt]);
		},
		onViewSizeChange : function( roll ){
			//var s = $.now();
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var roll = self._undef( roll,true );
			
			//self._setViewSize();
			self.methodInvoke('_setViewSize');
			
			if( roll ) {
				self.methodInvoke('onScroll',true);
			}
			
			//缓存机制
			//因为grid特殊 所以应该判断是否出现滚动条
			var hasScrollLeft = self.hasScroll( opt.gbody,'left' );
			var hasScrollTop = self.hasScroll( opt.gbody,'top' );
			var barSize = self.getScrollbarSize();
			
			var _gbodyWidth = opt.gbody._width() - ( hasScrollTop ? barSize.y : 0 );
			var _gbodyHeight = opt.gbody.height() - ( hasScrollLeft ? barSize.x : 0 );
			
			if( opt._gbodyWidth && opt._gbodyHeight ) {
				if( (opt._gbodyWidth == _gbodyWidth) && (opt._gbodyHeight == _gbodyHeight) ) {
					return false;
				}
			} 
			//设置缓存
			opt._gbodyWidth = _gbodyWidth;
			opt._gbodyHeight = _gbodyHeight;
			
			
			return true;
		},
		//数组移动算法
		// pos 要移动的元素
		array_sort : function(iarr,pos,target,t) {//t 代表是前还是后 1 代表前 0 代表后

			if(pos == target) return iarr;
			//支持字符下标
			var _iarr = iarr;
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
			var new_arr = [];
			var k=0,
				len = iarr.length;
			for( ;k<len;k++ ) {
				new_arr.push( _iarr[ iarr[k] ] );
			}
			iarr = new_arr;
			return iarr;
		},
		/*
		@moveField : field 需要移动的列
		@moveToField : field 需要移动到目的列
		@moveToFieldPos : 1,0(1=>移动到moveToField之前,0=>之后)	
		*/
		moveColumn : function( moveField,moveToField,moveToFieldPos ){
			var self = this,
				opt = self.configs;
			self.onColumnMove( moveField,moveToField,moveToFieldPos );
			return self;
		},
		onColumnMove : function(moveField,moveToField,moveToFieldPos){
			var self = this,
				opt = self.configs;
			//var fields = opt.columns;
			//统一使用getColumnMap 接口获取列
			var fields = self.getColumnMap();
			var pos = 0;
			var target = 0;
			var t = moveToFieldPos || opt.moveToFieldPos;
			opt.moveField = moveField || opt.moveField;
			opt.moveToField = moveToField || opt.moveToField;
			if( opt.moveField == opt.moveToField ) return;
			
			var _r = self.fireEvent("onBeforeSwitchColumn",[opt.moveField,opt.moveToField,opt.moveToFieldPos,opt]);
			if( _r === false ) {
				return _r;	
			}
			
			var i=0,
				len = fields.length;
			for(;i<len;i++) {
				if( fields[i]['field'] == opt.moveField ) {
					pos  = i;	
				}
				if( fields[i]['field'] == opt.moveToField ) {
					target  = i;	
				}
			}
			//移动列
			fields = opt.columns =self.array_sort(fields,pos,target,t);
			//数组去重
			var disArr = self.distArr;
			
			//移动单元格数据
			if( t ) {//移动到目标元素前
				var pos = $("#view2-datagrid-header-inner-htable-tbody-"+opt.id).find("td[field='"+opt.moveField+"']");
				var target = $("#view2-datagrid-header-inner-htable-tbody-"+opt.id).find("td[field='"+opt.moveToField+"']");
				target.before( pos );
				if( opt.lazyLoadRow ) {
					var rows = [];
					rows = rows.concat(opt.lazyRows,opt.lockRows);
					rows = disArr(rows);
					var j = 0,
						len = rows.length;
					for(;j<len;j++) {
						var rid = rows[j];
						pos = $("#"+opt.id+"-row-"+rid).find("td[field='"+opt.moveField+"']");
						target = $("#"+opt.id+"-row-"+rid).find("td[field='"+opt.moveToField+"']");	
						target.before( pos );
					}
				} else {
					var j = 0,
						len = opt.data.length;
					for(;j<len;j++) {
						pos = $("#"+opt.id+"-row-"+j).find("td[field='"+opt.moveField+"']");
						target = $("#"+opt.id+"-row-"+j).find("td[field='"+opt.moveToField+"']");	
						target.before( pos );
					}
				}
				
			} else {//移动到目标元素后
				var pos = $("#view2-datagrid-header-inner-htable-tbody-"+opt.id).find("td[field='"+opt.moveField+"']");
				var target = $("#view2-datagrid-header-inner-htable-tbody-"+opt.id).find("td[field='"+opt.moveToField+"']");
				target.after( pos );
				if( opt.lazyLoadRow ) {
					var rows = [];
					rows = rows.concat(opt.lazyRows,opt.lockRows);
					rows = disArr(rows);
					var j = 0,
						len = rows.length;
					for(;j<len;j++) {
						var rid = rows[j];
						pos = $("#"+opt.id+"-row-"+rid).find("td[field='"+opt.moveField+"']");
						target = $("#"+opt.id+"-row-"+rid).find("td[field='"+opt.moveToField+"']");	
						target.after( pos );
					}	
				} else {
					var j = 0,
						len = opt.data.length;
					for(;j<len;j++) {
						pos = $("#"+opt.id+"-row-"+j).find("td[field='"+opt.moveField+"']");
						target = $("#"+opt.id+"-row-"+j).find("td[field='"+opt.moveToField+"']");	
						target.after( pos );
					}	
				}
				
			}
			
			self.fireEvent("onColumnMove",[opt.moveField,opt.moveToField,t,opt]);
		},
		setView : function(){
			var self = this,
				opt = self.configs,
				tpl_view1 = self.tpl(self.getTpl("view1"),opt),
				tpl_view2 = self.tpl(self.getTpl("view2"),opt),
				gid = opt.gid;
				$(gid).html('');//防止重复调用
				$(tpl_view1).appendTo(gid);
				$(tpl_view2).appendTo(gid);
				opt.gheader = $("#view2-datagrid-header-"+opt.id);
				opt.gbody = $("#view2-datagrid-body-"+opt.id);
				opt.gfooter = $("#view2-datagrid-footer-"+opt.id);
				// 滚动条事件绑定
				opt.gbody.scroll(function(){
					self.onScroll();
					self.fireEvent('onScroll',[]);
					self.fireEvent("onScrollBar",[]);
					//console.log(3);
				});
		},
		/*
		* 获取指定行数据
		*  获取失败会返回false
		*  @rid {int} 行id或者主键
		*  @isPK {boolean} 默认false,true代表根据主键获取数据(可选)
		*/
		_getRowData : function(rid,isPK){
			var self = this;
			var opt = self.configs;
			
			var isPK = self._undef(isPK,false);
			
			var data = isPK ? self.getData() : opt.data;
			
			var rd = false;
			
			if(!isPK) {
				var tr = $("#"+opt.id+"-row-"+rid);
				if( tr.size() ) {
					rd = tr.data('rowData');	
				} else {
					rd = data[rid];	
				}
				
			} else {
				var pk = opt.pk;
				var i=0,
					len = data.length;
				for(;i<len;i++) {
					if(data[i][pk] == rid) {
						rd = data[i];
						break;
					}	
				}
			}
			
			return self._undef(rd,false);
		},
		/*
		* 获取指定行数据 参考_getRowData
		*  返回的是一个副本数据
		*/
		getRowData : function (rid,isPK){
			var data = this._getRowData( rid,isPK );
			if( data ) {
				data = $.extend( {},data );		
			}
			return data;
		},
		/*
		* 获取指定主键的行id
		*  设置不成功会返回falsee
		*  @pk   {int,String,Object,Array} 
		*  @return {int,Array} 失败返回false,否则如果传入的是数组则返回数组，其他则直接返回id
		*/
		getRowId : function(pk){
			var self = this,
				opt = self.configs;	
			if( typeof pk == 'undefined' ) return false;
			var pks = [];
			if( $.isArray( pk ) ) {
				for( var i=0;i<pk.length;i++ ) {
					if( $.isPlainObject( pk[i] ) && (opt.pk in pk[i]) ) {
						pks.push( pk[i][opt.pk] );	
					} else {
						pks.push( pk[i] );	
					}
				}	
			} else {
				if( $.isPlainObject( pk ) && (opt.pk in pk) ) {
					pks.push( pk[opt.pk] );	
				} else {
					pks.push( pk );	
				}
			}
			
			var rids = [];
			
			$("#view2-datagrid-header-outer-locktable-tbody-"+opt.id+",#view2-datagrid-body-btable-tbody-"+opt.id).find(">tr.datagrid-row").each(function(i){
				var rowData = $(this).data('rowData');
				var rid = $(this).attr("datagrid-rid");
				if( rowData && (opt.pk in rowData) ) {
					if( self.inArray( rowData[opt.pk],pks ) != -1 ) {
						rids.push(rid);	
					}	
				}
				
			});
			return rids.length == 1 ? rids[0] : rids;
		},
		/*
		* 设置指定行下指定列的值
		*  field应该是通过getRealField处理过的,或者改做setFieldValue
		*  设置不成功会返回false,否则返回true
		*  @rid   {int} 行id
		*  @field {String} 列名
		*  @value {String} 值
		*/
		setRowData : function (rid,field,value){
			var self = this,
				opt = self.configs;	
			
			var tr = $("#"+opt.id+"-row-"+rid);
			var data;
			if( tr.size() ) {
				data = tr.data('rowData');
			} else {
				data = opt.data[rid];	
			}
			
			if( !data ) return false;	
			
			data[field] = value;
			//同时修改元数据
			var _d = false;
			//这里应该不用再修改，因为他们是引用同一个对象
			if( typeof data[opt.pk] != "undefined" ) {
				_d = self._getRowData( data[opt.pk],true);
				if( _d ) {
					_d[field] = value;
				}
			}
			
			return true;
		},
		/*
		* 获取当前Field 和 data数据的真实索引
		*  @field {String} 列名
		*  @return {String} 索引名
		*/
		getRealField : function(field){
			var self = this,
				opt = self.configs;	
			if( typeof field == 'undefined' ) {
				return null;	
			}
			var _field = field;
			var field = self.getColumnData(field,'index');
			
			if( field === null ) return _field;
			
			field = field=="" ? _field : field;
			return field;
		},
		/*
		* 获取指定单元格内容
		*  不要直接用 rowData[rid][field] 获取数据 而应该用getFieldValue
		*  @rid {int} 行id
		*  @field {String} 列名
		*  @mod {boolean} false:获取经过映射后的值,true:源数据 默认（可选）
		*/
		getFieldValue : function (rid,field,mod){
			var self = this,
				opt = self.configs;	
			
			var mod = self._undef(mod,true);
				
			field = self.getRealField(field);
			
			var data = this._getRowData(rid);
			
			if( !data ) {
				return "";
			}
			if( typeof data[field] == 'undefined' ) {
				return "";
			}
			
			return mod?data[field]:self._cellReader( data[field], self.getColumnData(field,'reader') ,data ,rid,field);
		},
		/*
		* 设置指定单元格内容
		*  不要直接用 rowData[rid][field],setRowData 来设置 而应该用setFieldValue
		*  成功设置后会返回当前行数据，否则返回false
		*  @rid   {int} 行id
		*  @field {String} 列名
		*  @value {String} 值
		*/
		setFieldValue : function(rid,field,value){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			
			var _field = self.getRealField(field);//
			
			var rowData = self.getRowData(rid);
			if( !rowData ) {
				return false;	
			}
			//判断是否内容是否改动
			rowData[_field] = typeof rowData[_field] == 'undefined' ? "" : rowData[_field];
			if( rowData[_field] === value ) {
				return false;	
			}

			var rc = self.fireEvent('onBeforeCellEdit',[rid,field,value,rowData,opt]);
			if( rc === false ) {
				return false;	
			}

			self.setRowData(rid,_field,value);
			rowData = self.getRowData(rid);//getRowData返回的是非引用数据 所以必须要在数据更新后再次获取
			
			var _colid = self.getColumnData( field,'_colid' );
			_colid = _colid === null ? '' : _colid;
			
			var t = _colid == '' ? $() : $("#"+opt.id+"_"+_colid+"_row_"+rid+"_cell");
			if( !t.size() && _colid!=='' ) {
				var rows = "#"+opt.id+"-row-"+rid+",#"+opt.id+"-view1-row-"+rid;
				var t = $(rows).find("td[field='"+field+"'] .datagrid-cell");
			}
			if( t.size() ) {
				var _expand = self.getColumnData(field,'_expand');
				_expand = _expand === null ? false : _expand;
				
				var value = _expand !== false ? self.tpl(_expand,rowData,rid,field) : self._cellReader( value , self.getColumnData(field,'reader') , rowData , rid,field );//value;
				
				t.html(value)
				 .addClass("datagrid-cell-edit");
				 
				 //取消2014-02-26
				 //重新开启， callBack 请不要调用setFieldValue
				var callBack = self.getColumnData(field,"callBack");
				if( callBack!=null && $.isFunction(callBack) &&  callBack != opt.noop) {
					callBack.call(self,t,rid,field,rowData);	//field['callBack'].call(self,t,rowId,field,rowData)
				}
			}
			
			self.fireEvent('onCellEdit',[t,rid,field,rowData[_field],rowData,opt]);

			return rowData;
		},
		setFieldText : function(rid,field,value){
			var self = this,
				opt = self.configs;	
			var _colid = self.getColumnData( field,'_colid' );	
			var t = $("#"+opt.id+"_"+_colid+"_row_"+rid+"_cell");
			if( !t.size() ) {
				var rows = "#"+opt.id+"-row-"+rid+",#"+opt.id+"-view1-row-"+rid;
				var t = $(rows).find("td[field='"+field+"'] div.datagrid-cell");
			}	
			if( t.size() ) {
				t.html(value);
			} else {
				return false;	
			}
			return true;
		},
		/*
		* 获取选择行id或数据
		*  @d   {boolean} true:返回选择行数据,false:返回行id 默认 (可选)
		*/
		getSlectRows : function( d ){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var $list = opt._selectRows;
			var list = [];
			
			for( var rid in $list ) {
				if( $list[rid] === true ) {
					list.push( rid );	
				}	
			}
			
			var d = self._undef(d,false);
			
			var _list = [];
			if( d ) {
				var j=0,
					len = list.length;
				for(;j<len;j++)	{
					if( !opt.data[ list[j] ] ) continue;
					_list.push( opt.data[ list[j] ] );	
				}
				return _list;
			} 
			return list;
		},
		/*
		*同getSlectRows
		*/
		getSelectRows : function( d ) {
			var self = this;
			return self.getSlectRows(d);
		},
		//行列锁
		//onLockRow : function(){},
		//onAfterLockRow : function(rowId){},
		//onLockColumn : function(){},
		//onAfterLockColumn : function(field){},
		//lockRow : function(rowId){},
		//unLockRow : function(rowId){},
		//unLockColumn : function(field){},
		//lockColumn : function(field){},
		//_lockRow : function(rowId) {},
		//_unLockRow : function(rowId){},
		//_getFooterRowNumber : function(rowId) {},
		_getRowNumber : function(rowId) {
			var self = this,
				opt = self.configs,
				data = opt.data,
				gid = opt.gid;
			var view1_tr = $("#"+opt.id+"-view1-row-"+rowId);
			var isNew = false;
			var _d = {};
			if( !view1_tr.size() ) {//添加行
				isNew = true;
				var view1_row = self.getTpl("view1_row");
				_d = {
					i : rowId,
					id : opt.id,
					rowNumbersExpand : opt.rowNumbersExpand,
					data : data[rowId],
					//groupBy : opt.groupBy,
					rowNumbersWidth : opt.rowNumbersWidth,
					opt : opt
				};
				var ltr = $( self.tpl(view1_row,_d) );
				self.bindRowEvent(false,ltr);
				view1_tr = ltr;

			}
			return {
					isNew : isNew,
					node : view1_tr
				};
		},
		//_lockColumn : function(field) {},
		//_unLockColumn : function(field) {},
		
		getCheckBoxColumn : function(columns) {
			var self = this,
			opt = self.configs;
			var r = $.extend({},opt._columnMetaData);
			r._colid = 'col'+opt._colid++;
			r._hasSetCk = true;
			r.field = 'ck';
			r.title = opt.checkBoxTitle;
			r._expand = '<input type="checkbox">';
			r.hcls = 'datagrid-header-check';
			r.bcls = 'datagrid-cell-check';
			r.width = opt.checkBoxWidth;
			r.forceFit = opt.checkBoxForceFit;
			r.fitColumn = opt.checkBoxFit;
			r.align = 'center';
			r.callBack = function(t,rowId,field,rowData){
				var self = this;
				$(t).find("input:checkbox").click(function(e){
					if( this.checked ) {
						self.selectRow(rowId);	
					} else {
						self.unselectRow(rowId);
					}
					e.stopPropagation();
				});
			};
			return r;
		},
		geteditColumn : function(columns) {
			var self = this,
			opt = self.configs;
			var r = $.extend({},opt._columnMetaData);
			var j = 0;
			var k = 0;
			if( $.isArray(opt.editColumn) ) { 
				$.each(opt.editColumn,function(i,n){
					if( $.isPlainObject(this) ) {
						opt.editColumn[i] = $.extend({},opt._toolItem,opt.editColumn[i]);
						j++;	
					} else {
						k++;	
					}						   
				});
			} else {
				opt.editColumn = [];
			}

			var str = '';
			r._colid = 'col'+opt._colid++;
			r._hasSetEd = true;
			r.field = 'ed';
			r.title = (opt.editColumnTitle === '' || opt.editColumnTitle === false ) ? ' ' : opt.editColumnTitle;
			r._expand = str;
			r.forceFit = opt.editColumnForceFit;
			r.hcls = 'datagrid-header-edit';
			r.bcls = 'datagrid-cell-edit';
			r.width = ( j * opt.editCellW + k * 4 )+'px';
			r.fitColumn = opt.editColumnFit;
			r.align = 'center';
			r.callBack = function(t,rowId,field,rowData){
				var self = this;
				var _item = opt._toolItem;
				var tools = [];
				var tool = {};
				var i = 0,
					len = opt.editColumn.length;
				for(;i<len;i++) {
					
					if( $.isPlainObject(opt.editColumn[i]) ) {
						tool = $.extend(true,{},_item,opt.editColumn[i]);
						tool.callBack = function(t,_item_){
							var indexid = $(t).attr("indexid");
							opt.editColumn[indexid]['callBack'].call(self,t,rowId,field,rowData,_item_);	
						}
						
						tools.push(tool);	
					}  else {
						tools.push(opt.editColumn[i]);	
					}
				};
				if( !$.isFunction( opt.editColumnSetter ) ) {
					var _tool = self.getTools(tools);
					t.append(_tool);
				} else {
					opt.editColumnSetter.call( self,tools,t,rowId,field,rowData );	
				}
			}
			
			return r;
		},
		/*
		*系统事件,设置grid列宽
		*/
		onInitFieldWidth : function(){
			var self = this,
			opt = self.configs;
			self._initFieldWidth();
			return self;
		},
		/*
		*系统事件,设置grid中含有百分比的列宽
		*/
		onFinishFieldWidth : function(){
			var self = this,
			opt = self.configs;
			var columns = opt.columns;
			var nd = false;
			self.lockMethod( 'resetViewSize' );
			//self.lockEvent("onFieldWidthChange");
			$.each(columns,function(i,column){
				if( column.width.toString().indexOf("%") != -1 ) {
					nd = true;
					self.setFieldWidth( column.field,column.width );
				}
			});
			//self.unLockEvent("onFieldWidthChange");
			
			/*if( nd && opt.forceFit ) {
				self.forceFitColumn();	
			}*/
			
			self.unLockMethod( 'resetViewSize' );
			if( nd ) {
				self.lockMethod("onScroll");
				self.lockEvent("onScroll");
				self.methodInvoke('resetViewSize',function(){
					self.unLockMethod("onScroll");	
					self.unLockEvent("onScroll");
				});
			}
			return self;
		},
		refreshColumnsWidth : function(){
			return this.onFinishFieldWidth();	
		},
		//初始化宽度
		_initFieldWidth : function(){
			var self = this,
			opt = self.configs;	
			//console.log('^^1',opt.columns);
			var columns = self.getColumns();
			//opt.columns = columns;
			
			//取得grid 显示区域宽度
			var w = 0;
			var gridWidth = $("#view_"+opt.id).width();//不要用_width 因为grid表格一定会设置宽度
			var view1_w = $("#view1-datagrid-header-inner-htable-"+opt.id)._outerWidth(); 
			w = gridWidth - parseFloat( view1_w );
			
			$("#"+opt.id+"_css").remove();
			var style = [];
			style.push('<style type="text/css" id="'+opt.id+'_css">');
			//datagrid_cols_
			for(var i=0;i<columns.length;i++) {
				var column = columns[i];
				var _colpadding = opt.cellpPadding;
				if( '_colpadding' in column ) {
					_colpadding	= parseFloat(column._colpadding);
				} else {
					var _colpadding = $('#'+opt.id+'_cols_' + column['_colid']);
					var cell_colpadding = $('#'+opt.id+'_cell_header_' + column['_colid']);
					if( _colpadding.size() ) {
						var _w = _colpadding.outerWidth()-cell_colpadding._width();
						_w = _w<0?0:_w;	
						_colpadding = _w;
						column._colpadding = _colpadding;
					} else {
						_colpadding = opt.cellpPadding;	
						column._colpadding = _colpadding;
					}
				}
				var width = column['width'];
				var field = column['field'];
				//初始化宽度
				if( width.toString().indexOf("%") != -1 ) {
					width = parseFloat(width)*w/100;
				} else {
					width = parseFloat(width);
				}
				//maxWidth
				var maxWidth = column['maxWidth'];
				if( maxWidth !== null ) {
					maxWidth = 	parseFloat(maxWidth);
					width = Math.min(maxWidth,width);
				}
				
				var minWidth = column['minWidth'];
				width = width>=minWidth ? width : minWidth;
				
				column._fieldWidth = width;

				width -= column._colpadding;
				
				if( opt._colWidthExt ) {
					width = self.str_number( width,opt._colWidthExt );	
				} else {
					width = Math.floor(width); 	
				}
				
				var css = ['#',opt.id,' .datagrid-cell-',column['_colid'],'{width:',width,'px;}'].join('');	
				style.push(css);
			}
			style.push('</style>');
			style = style.join("\n");
			$("#"+opt.id).before(style);
			
			return self;
		},
		//ie6 7 下动态添加的css对 隐藏元素无效
		_setFieldWidth : function(field,width,real){
			var self = this,
			opt = self.configs;
			var column = self.getColumnData(field);
			if( column === null ) {
				return false;	
			}
			var _colid = column._colid;
			var real = self._undef(real,false);
			var width = self._undef(width,120);

			if( width.toString().indexOf("%") != -1 ) {
				var w = 0;
				var body = $("#view2-datagrid-body-"+opt.id);
				//判断是否出现了垂直滚动条
				if( body.size() && self.hasScroll( body[0],'top' ) ) {
					var scrollbarSize = self.getScrollbarSize();
					w = body.width() - scrollbarSize.width;//减滚动条宽度
					width = parseFloat(width)*w/100;
				} else {
					var body = $("#view2-datagrid-header-inner-"+opt.id);
					width = parseFloat(width)*(body.width())/100;
				}
			} else {
				width = parseFloat(width);
			}
			//maxWidth
			var maxWidth = column.maxWidth;
			if( maxWidth !== null ) {
				maxWidth = 	parseFloat(maxWidth);
				width = Math.min(maxWidth,width);
			}
			
			var minWidth = parseFloat(column.minWidth);
			width = width>=minWidth ? width : minWidth;
			
			var changeWidth = width;
			//如果当前值和上一次的_realWidth值相同，那么列宽并没有改变不需要重设
			if( column._fieldWidth && column._fieldWidth == changeWidth ) {
				return false;//列宽并没有改变 不需要设置
			}
			
			if( !real ) {
				width -= column._colpadding;
			}
			//保留几位小数点 不要开启
			if( opt._colWidthExt ) {
				width = self.str_number( width,opt._colWidthExt );	
			} else {
				width = Math.floor(width); 	
			}
			
			var cellSelector = ["#",opt.id," .datagrid-cell-",_colid].join('');
			
			var style = $("#"+opt.id+'_css').get(0);
			if( !style ) return false;
			var styleSheet = style.styleSheet?style.styleSheet:(style.sheet||document.styleSheets[document.styleSheets.length-1]);
			var rules = styleSheet.cssRules || styleSheet.rules;
			var isRule = false;//判断是否存在当前设置
			//解决IE下 width = NaN的情况
			width = isNaN( width ) ? 0 : width;
			for(var i=0;i<rules.length;i++) {
				if( rules[i].selectorText.toLowerCase() == cellSelector.toLowerCase() ) {
					rules[i]['style']['width'] = width+'px';
					isRule = true;
					break;
				}
			}
			if( !isRule ) {
				var addRule = styleSheet.addRule || styleSheet.insertRule;
				if( styleSheet.addRule ) {
					styleSheet.addRule(cellSelector,"width:"+width+"px");	
				} else {
					styleSheet.insertRule(cellSelector+"{width:"+width+"px}",rules.length);	
				}
				
			}
			//作为缓存用，判断是否改变
			column._fieldWidth = changeWidth;
			return changeWidth;
		},
		/*
		* 设置列宽度(支持百分比)
		*  必须要等到grid创建好才可调用
		*  @field {String} 列名
		*  @width {String,int} 列宽
		*  @real {boolean} true:真实宽度,false:需要对当前设置的宽度处理 默认(可选)
		*/
		setFieldWidth : function(field,width,real){
			var self = this,
			opt = self.configs;

			var _c = self.getColumnData(field);
			if( _c === null ) return width;
			//var _fieldWidth = _c._fieldWidth;
			var changeWidth = self._setFieldWidth(field,width,real);
			if( changeWidth === false ) {
				return false;	
			}
			//self.onScroll(true);
			var w = _c['width'];
			if( width.toString().indexOf("%") != -1 ) {
				self.setColumnValue(field,'width',width);	
			} else {
				if( w.toString().indexOf("%") != -1 ) {	
					if( _c.casePerChange ) {
						self.setColumnValue(field,'width',changeWidth);	
					}
				} else {
					self.setColumnValue(field,'width',changeWidth);	
				}
			}
			
			self.fireEvent("onFieldWidthChange",[field,changeWidth,width,w,opt]);
			//作用是 如果开启了autoHeight emptyMsg 需要通知他们更新宽度或高度
			//方式一
			//var r = self.onViewSizeChange( false );
			//if( r ) {
			//	self.fireEvent("onViewSizeChange",[opt]);
			//}
			//方式二
			self.lockEvent("onScroll");
			self.methodInvoke('resetViewSize');
			self.unLockEvent("onScroll");
			
			return changeWidth;
		},
		setForceFitColumn : function( field,w ){
			var self = this,
			opt = self.configs;	
	
			var column = self.getColumnData(field);
			if( opt.forceFit && column.forceFit ) {
				self.onFitColumn( field,w );
			}
		},
		onFitColumn : function( field,w ){
			var self = this,
			opt = self.configs;
			if( opt.forceFit ) {
				self.forceFitColumn( field,w );
				self.fireEvent("onAutoColumnResize",[opt]);
			}
		},
		/*
		* 列宽度只适应
		* fields {Array} 不需要自适应的列(可选)
		* _w {int} 当前fields改变后的宽度(可选)
		*/
		_forceFitColumn : function( fields,_w ){//平均设置列宽大小，如果传入field则传入的filed 大小不会改变
			var self = this,
			opt = self.configs;	
			var columns = opt.columns;
			
			var fields = typeof fields == 'undefined' ? [] : fields;
			
			fields = $.isArray( fields ) ? fields : [ fields ];
			
			$("#view2-datagrid-body-"+opt.id).css("overflow-x","hidden");
			
			var w = $('#view2_'+opt.id).width();

			var body = $("#view2-datagrid-body-"+opt.id);

			if( self.hasScroll(body,'top') ) {
				var scrollbarSize = self.getScrollbarSize();
				w -= scrollbarSize.width;
			} else {
				w -= 0;	
			}
			
			var _clw = {};
			var _mw = {};//获取最小宽度
			var _wt = 0;//总宽
			var border = 0;
			//获取每个列宽
			$("#view2-datagrid-header-inner-htable-tbody-"+opt.id).find(">.datagrid-header-row td[field]").each(function(){	
				var tw = $(this)._outerWidth();

				var field = $(this).attr('field');

				for( var x=0;x<columns.length;x++ ) {
					if( columns[x]['field'] == field && self.inArray( field,opt.hideColumns )==-1 ) {
						if( columns[x]['forceFit'] && self.inArray( field,fields )==-1 ) {
							_clw[ field ] = tw;
							_mw[ field ] = columns[x]['minWidth'];
							_wt += tw;
						} else {
							w -= tw;	
						}
						break;
					}
				}
			});
		//	console.log(w,_wt);
			var dw = 0;//超出宽度
			for( var f in _clw ) {
				_clw[f] =  (w*Math.floor( _clw[f]*10000/_wt )/10000) - border;	//Number(_clw[f]).toFixed(0);
				
				if( _clw[f] < _mw[f] ) {
					dw += (_mw[f]-_clw[f]);
				}
				self._setFieldWidth(f,_clw[f]);
			}
			//如果forceFit的列都已经是最小了，那么还超出宽度就需要减少当前列的宽度
			if( dw && fields.length==1 && _w && opt.forceFitVisible ) {
				//fields[0]['field']
				self._setFieldWidth(fields[0],_w-dw);	
			}

			//self.fireEvent("onForceFitColumn",[opt]);
			return self;
		},
		forceFitColumn : function(fields,_w){
			var self = this,
			opt = self.configs;	
			if( opt._forceFitWTime ) {
				clearTimeout( opt._forceFitWTime );	
			}
			opt._forceFitWTime = setTimeout( function(){
				self._forceFitColumn(fields,_w);	
				self.fireEvent("onForceFitColumn",[opt]);
			},0 );
			return self;
		},
		unForceFitColumn : function(){
			var self = this,
			opt = self.configs;	
			opt.forceFit = false;
			$("#view2-datagrid-body-"+opt.id).css("overflow-x","auto");
		},
		/*遍历 树形 columns 并返回叶子节点*/
		_columnsMap : function( columns ){
			var self = this
				,undef
				,opt = self.configs
				,columns = columns === undef ? opt.columns : columns
			;
			var fields = columns;
			var list = [];
			
			/*递归遍历*/
			var listMap = function( column,pid ){
				
				if( column.field === undef || column.field=='' ) {
					column.field = ['field',++Nex.aid].join('');	
				}
				
				if( pid === undef || pid === null ) {
					  pid = null;	
				} else {
					pid = $.isPlainObject( pid ) && (pid.field !== undef) ? pid.field : null;
				}
				
				if( opt.multiFromStr && opt.multiSplitStr != '' ) {
					//对列名有"_"的进行处理
					var _sp = opt.multiSplitStr;
					var _md = opt.multiFromStrData;
					var _field = column.field+'';
					column._ofield =  column._ofield===undef ? _field : column._ofield;
					
					var sl = column._hasSet?[]:_field.split(_sp);
					if( sl.length>1 ) {
						 column._hasSet = true;
						 column.field = sl[0];
						 var of = column._ofield.split(_sp);
						 var index = $.inArray( column.field,of );
						 column.field = of.slice(0,index+1).join(_sp); 
						 var tls = column.field.split(_sp);
						 var _realField = tls.pop();
						 column.title = column.title||_realField;
						 if( _realField in _md ) {
							$.extend( column,_md[ _realField ] ); 
						 }
						 if( column.field in _md ) {
							$.extend( column,_md[ column.field ] ); 
						 }
						 sl.splice(0,1);//删除第一个
						 column.columns = column.columns === undef ? [] : column.columns;
						 column.columns.push( { field : sl.join(_sp),_ofield:column._ofield } );
						
					} else {
						if( !column._hasSet && sl.length ) {
							   column._hasSet = true;
							   var of = column._ofield.split(_sp);
							   var index = $.inArray( column.field,of );
							   column.field = of.slice(0,index+1).join(_sp); 
							   var tls = column.field.split(_sp);
							   var _realField = tls.pop();
							   column.title = column.title||_realField;
							   
							   if( _realField in _md ) {
									$.extend( column,_md[ _realField ] ); 
							   }
							   if( column.field in _md ) {
									$.extend( column,_md[ column.field ] ); 
							   }
						}
					}
				}
				
				//设置默认值
				column = $.extend({},opt._columnMetaData,column);
				
				if( column.disabled===true  ) return;
				
				opt._columnsHash['nsort'+column.field] = column;
				column.__pid = column.__pid===undef ?  pid : column.__pid;
				
				if( ('columns' in column) && $.isArray( column.columns ) && column.columns.length ) {
					var ls = column.columns;
					var len = ls.length;
					for( var i=0;i<len;i++ ) {
						listMap( ls[i],column );	
					}
				} else {
					//console.log( column.field );
					list.push( column );	
				}
			}
			var i = 0,
				len = fields.length;
			for(;i<len;i++) {
				listMap( fields[i],null );
			}	
			//修正header和body如果columns设置不一致时顺序问题
			list = self._getLeafColumns();
			return list;
		},
		addColumn : function( column ){
			var self = this,
			opt = self.configs;
			opt.columns.push( column );
			self._initFieldWidth();
			self.setGridHeader();
			self.refreshDataCache();
			return self;
		},
		/*
		* 获取当前grid的列信息
		* s {boolean} true:返回源数据,false:返回经过处理后的数据 默认(可选)
		*/
		getColumns : function(s){
			var self = this,
				undef,
				opt = self.configs;
			var xcolumns = opt.columns;
			//console.log(xcolumns,xcolumns.length);
			var s = self._undef(s,false);
			//初始调用时保存副本
			opt.cacheData['columns'] = self._undef(opt.cacheData['columns'],xcolumns);//cacheData
			//获取副本
			if(s) {
				return 	opt.cacheData['columns'];
			}
			
			//检测是否设置了 列 否则用data的key作为列名
			//var _mIndex = {}; //已经做了处理
			if(xcolumns.length<=0) {
				if(opt.data.length>0) {
					
					if( $.isPlainObject( opt.data[0] ) ) {
					
						for(var i in opt.data[0]) {
							xcolumns.push({'field':i});
						}
					}
					//已经做了处理
					//给每列添加数据映射 因为每列有可能以"_"分割 所以最后一个就是需要的列名
					/*var _hdata = opt.data[0];
					if( $.isPlainObject( _hdata ) ) {
						for(var _index in _hdata) {
							var _cl = _index.split('_');
							if( _cl.length>1 ) {
								_mIndex[ _cl[ _cl.length-1 ] ] = _index;
							} else {
								_mIndex[ _index ] = _index;
							}
						}
					}*/
				}
			}
			
			//对多级列进行处理 初次用时有效
			var columns = self._columnsMap(xcolumns);
			
			//var _columns = [];
			var _hasSetCk = false,
				_hasSetEd = false;
			var i = 0,
				len = columns.length;
			for(;i<len;i++) {
				
				//columns[i] = $.extend({},opt._columnMetaData,columns[i]);
				
				if( columns[i]['disabled'] === true ) continue;
				
				//if(typeof columns[i]['width'] == 'number') columns[i]['width'] += 'px';
				columns[i]['field'] = columns[i]['field'] === "" ?  i : columns[i]['field'];
				//已经做了处理
				//if( !$.isEmptyObject( _mIndex ) ) {
					//columns[i]['index'] = _mIndex[ columns[i]['field'] ] === undefined ?  columns[i]['index'] : _mIndex[ columns[i]['field'] ];
				//}
				
				//customColumnData
				if( columns[i]['field'] in opt.customColumnData ) {
					$.extend( columns[i],opt.customColumnData[columns[i]['field']] );
				}
				
				columns[i]['title'] = columns[i]['title'] === "" ?  columns[i]['field'] : columns[i]['title'];
				columns[i]['index'] = columns[i]['index'] === "" ?  columns[i]['field'] : columns[i]['index'];
				columns[i]['_colid'] = columns[i]['_colid'] === undef ? 'col'+(Nex.grid._colid++ || opt._colid++) : columns[i]['_colid'];
				
				//判断是否开启ck ed字段
				if( opt.checkBox !== false && columns[i]['field']=="ck" && _hasSetCk===false ) {
					if( !columns[i]['_hasSetCk'] ) {
						columns[i] = self.getCheckBoxColumn();
						opt._columnsHash[ 'nsort'+columns[i]['field'] ] = columns[i];
					}
					_hasSetCk = true;
				}
				if( opt.editColumn !== false  && columns[i]['field']=="ed" && _hasSetEd===false ) {
					if( !columns[i]['_hasSetEd'] ) {
						columns[i] = self.geteditColumn();
						opt._columnsHash[ 'nsort'+columns[i]['field'] ] = columns[i];
					}
					_hasSetEd = true;
				}
				
				//opt._columnsHash[ columns[i]['field'] ] = columns[i];
				//_columns.push(columns[i]);
			}
			
			//columns = _columns;
			
			//检测是否使用checkbox
			var ck = [],
				ed = [];
			if( opt.checkBox !== false && _hasSetCk===false ) {
				var copt = self.getCheckBoxColumn();
				if( copt !== false) {
					ck = [ copt ];
					opt._columnsHash[ 'nsort'+copt['field'] ] = copt;
					//$.merge(ck,columns);
					columns.unshift( copt );
					//columns = ck.concat( columns );
					//columns = ck;
				}
			}
			
			if( opt.editColumn !== false && _hasSetEd===false) {
				if(self.geteditColumn() !== false) {
					ed = [ self.geteditColumn() ];
					opt._columnsHash[ 'nsort'+ed[0]['field'] ] = ed[0];
					//$.merge(columns,ed);
					//columns = columns.concat( ed );
					columns.push(ed[0]);
				}
			}
			//opt.columns.length = 0;
			opt.columns = columns;
			
			self.fireEvent( 'onSetColumns',[columns] );
			
			return opt.columns;
		},
		//页面刷新的时候调用
		onDisplayField : function(){
			var self = this,
				opt = self.configs,
				_columns = opt.hideColumns,
				gid = opt.gid;
			if(_columns.length <= 0) return;
			var i = 0,
				len = _columns.length;
			for(;i<len;i++) {
				if( _columns[i] == null ) continue;
				self.hideColumn(_columns[i]);
			}
		},
		displayColumn : function( field , type ) {
			var self = this,
				opt = self.configs,
				_columns = opt.hideColumns,
				gid = opt.gid;
			var fields = self.getColumnList();

			if( self.inArray(field,fields) == -1 ) return false;
			
			var isDisplay = (type == "show") ? true : false;
			if( isDisplay  ) { //&& self.inArray( field,_columns )
				var i = 0,
				len = _columns.length;
				for(;i<len;i++) {
					if(_columns[i] == field) _columns[i] = null;
				}
			} else {
				if( self.inArray( field,_columns ) == -1 )
					_columns.push( field );
			}
			$(gid).find("td[field='"+field+"']")[type]();
			
			var eventType = isDisplay ? 'onShowColumn' : 'onHideColumn';

			self.fireEvent(eventType,[field,opt]);
			//是否应该锁定？ onScrll
			self.lockEvent("onScroll");
			self.methodInvoke('resetViewSize');
			self.unLockEvent("onScroll");
			
			return true;
		},
		/*
		* 显示指定列
		*  field {String} 列名
		*/
		showColumn : function( field ){
			var self = this,
				opt = self.configs;
			var r = self.fireEvent('onBeforeShowColumn',[field,opt]);
			if( r === false ) {
				return r;	
			}
			return self.displayColumn( field ,"show");
		},
		/*
		* 隐藏指定列
		*  field {String} 列名
		*/
		hideColumn : function( field ){
			var self = this,
				opt = self.configs;
			var r = self.fireEvent('onBeforeHideColumn',[field,opt]);
			if( r === false ) {
				return r;	
			}
			return self.displayColumn( field , "hide");
		},
		/*
		* 对指定列排序
		*  field {String} 列名
		*/
		sortColumn : function(field){},
		/*
		* 显示列头
		*/
		showHeader : function(){
			var self = this,
				opt = self.configs;
				opt.showHeader = true;
			//self.resetViewSize();
			self.methodInvoke('resetViewSize');
		},
		/*
		* 隐藏列头
		*/
		hideHeader : function(){
			var self = this,
				opt = self.configs;
				opt.showHeader = false;
			//self.resetViewSize();
			self.methodInvoke('resetViewSize');
		},
		setGridHeaderEvent : function(tr,ltr){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			
			var fields = self.getColumnMap();	
			
			
			var tds = tr.find("td[field]");
			
			//设置列 是否可以改变大小 参数
			if(opt.fitColumns) {
				var o = $.extend({},opt);
				o.self = self;
				o.stop = function(e,cfg){
					var r = self.fireEvent('onResizeColumnStop',[cfg,opt]);
					if(r === false) return r;
					self.cStop(cfg);
				};
				setTimeout(function(){
					var resizes = [];
					tds.each(function(){
						var field = $(this).attr("field");
						//设置列是否可改变大小
						var fitColumn = self.getColumnData(field,'fitColumn');
						
						if( fitColumn ) {
							//$(".datagrid-cell",this)._resize(o);
							resizes.push($(".datagrid-cell",this));
						}	
					});
					$(resizes)._resize(o);
				},10);
			}
			//拖动列
			if( opt.moveColumns ) {
				setTimeout(function(){
					tds.moveColumn(opt);//tr.find("td[field]").moveColumn(opt)					
				},10);
			}
			
			tds.bind({
				click : function(e){  
					if( dataGrid.__resizing || dataGrid.__moving ) {
						return;	
					}
					var field = $(this).attr("field");
					if( opt.autoScrollToField ) {
						self.scrollToField(field);	
					}
					var r = self.fireEvent('onColumnClick',[field,this,e]);
					if( r === false ) return r;
				},	 
				mouseenter : function(e){
					var field = $(this).attr("field");
					$(this).addClass("datagrid-header-over");
					var r = self.fireEvent('onColumnOver',[field,this,e]);	
					if( r === false ) return r;
				},	
				mouseleave : function(e){
					var field = $(this).attr("field");
					$(this).removeClass("datagrid-header-over");
					var r = self.fireEvent('onColumnOut',[field,this,e]);	
					if( r === false ) return r;
				},	
				dblclick : function(e){
					var field = $(this).attr("field");
					var r = self.fireEvent('onColumnDblClick',[field,this,e]);	
					if( r === false ) return r;
				},
				contextmenu : function(e){
					var field = $(this).attr("field");
					var r = self.fireEvent('onColumnContextMenu',[field,this,e]);	
					if( r === false ) return r;
				}
			});
			
			//设置contentmenu
			tr.bind("contextmenu",function(ev){
				//触发单击行事件
				var r = self.fireEvent('onHeaderContextMenu',[this,ev]);
				if(r == false) return false;
			});
			/*检查文字是否超出边界*/
			self.setGridHeaderTextLimit();
			/*checkbox绑定*/
			if(opt.checkBox) {
				var cks = tr.find("td[field='ck']");
				//cks.find(".datagrid-sort-icon").hide();
				cks.find("input:checkbox").click(function(){
						if(opt.singleSelect) {
							this.checked = false;
							return false;
						}
						if(this.checked) {
							self.selectAllRows();
						} else {
							self.unselectAllRows();
						}
					});
			}
			
			self.fireEvent("onSetGridHeaderEvent",[tr,tds,opt]);
			
		},
		/*检查文字是否超出边界*/
		setGridHeaderTextLimit : function(){},
		updateHeaderRow : function(w){
			var self = this,
				opt = self.configs;
			var w = self._undef( w,false );
			self.setGridHeader();
			if( w ) {
				self.onInitFieldWidth();
				self.refreshColumnsWidth();
			}
			self.fireEvent("onUpdateHeaderRow",[opt]);
		},
		_getColumnChildrens : function( name ){
			var self = this
				,undef
				,opt = self.configs;	
			var list = [];
			if( name === undef || name === null ) {
				return self._getRootColumns();	
			}
			var columns = opt._columnsHash;	
			for( var key in columns ) {
				var field = columns[key];	
				if( field.__pid === name ) {
					list.push( field );
				}		
			}		
			return list;	
		},
		_getColumnAllChildrens : function( name ){
			var self = this
				,undef
				,opt = self.configs;	
			var list = [];
			var name = name;
			var _loop = function( n ){
				var childs = self._getColumnChildrens(n);
				for( var i=0,len=childs.length;i<len;i++ ) {
					list.push( childs[i] );	
					_loop( childs[i]['field'] );
				}
			};
			_loop(name);
			return list;	
		},
		/*获取当前单元格下 还有多少层次*/
		_getColumnAllLevel : function( name ){
			var self = this
				,undef
				,opt = self.configs;	
			if( name === undef || name === null || name === '' ) {
				name = null;
			}	
			var columns = opt._columnsHash;	
			var childs = self._getLeafColumns( name );
			var level = 1;
			var getTop = function( n ){
				var n = 'nsort'+n;
				if( n in columns ) {
					var column = columns[n];
					if( column.__pid !== name ) {
						level++;
						return getTop( column.__pid );	
					} else {
						return level++;	
					}	
				}	
			};
			var _max = 0;
			$.each( childs,function(i,field){
				var i = getTop( field['field'] );
				_max = Math.max( _max,i );	
				level = 1;
			} );
			
			return _max;	
		},
		_isRootColumn : function( field ){
			var field = field || {};
			return field.__pid === null || 	field.__pid===undef ? true : false;	
		},
		_isLeafColumn : function(name){
			var list = this._getColumnChildrens( name );
			return list.length ? false : true;
		},
		/**
		*获取指定单元格下的叶子节点	
		*/
		_getLeafColumns : function( name ){
			var self = this
				,undef
				,opt = self.configs;
			var list = [];
			var columns = opt._columnsHash;	
			var childs = self._getColumnAllChildrens( name );
			for( var i=0,len=childs.length;i<len;i++ ) {
				if( self._isLeafColumn( childs[i]['field'] ) ) {
					list.push( childs[i] );	
				}
			}
			return list;	
		},
		//返回指定单元格的最顶层
		_getTopColumn : function(name){
			var self = this
				,undef
				,opt = self.configs;
			var columns = opt._columnsHash;	
			var name = 'nsort'+name;
			if( name in columns ) {
				var column = columns[name];
				if( column.__pid !== null && column.__pid !== undef ) {
					return self._getTopColumn( column.__pid );	
				} else {
					return column;	
				}	
			}	
		},
		//返回最顶层的单元格列表
		_getRootColumns : function(){
			var self = this
				,undef
				,opt = self.configs;
			var list = [];
			var columns = opt._columnsHash;
			for( var key in columns ) {
				var field = columns[key];	
				if( field.__pid === null || field.__pid===undef ) {
					list.push( field );
				}	
			}	
			return list;		
		},
		/*
		*多表头实现 方法一
		*/
		view2_header_inner_row_1 : function(){
			var self = this
				,undef
				,opt = self.configs;
			var hlist = [];
			var hhash = {};
			
			if( !opt.multiColumns ) {
				return self.tpl('view2_header_inner_row_bak',data);	
			}	
			//leafColumn 模版
			var tdTpl = '<td rowspan="<%=rowSpan%>" colspan="<%=colSpan%>" id="<%=gridId%>_cols_<%=_colid%>" class="datagrid-td-leaf datagrid_<%=_colid%>" field="<%=field%>" align="<%=align%>">'
							+'<div class="datagrid-header-wrap" field="<%=field%>" >'
								+'<div id="<%=gridId%>_cell_header_<%=_colid%>" class="datagrid-cell datagrid-header-cell datagrid-cell-<%=_colid%> datagrid-cell-header-<%=_colid%> <%=hcls%>" >'
									+'<span class="datagrid-header-column-inner datagrid-header-column-inner-text"><%=title%></span>'
								+'</div>'
							+'</div>'
						+'</td>';
			//parentColumn模版
			var tdTpl2 = '<td rowspan="<%=rowSpan%>" colspan="<%=colSpan%>" class="datagrid-td-noleaf" align="<%=align%>">'
							+'<div class="datagrid-header-wrap">'
								+'<span class="datagrid-header-column-inner datagrid-header-column-inner-text"><%=title%></span>'
							+'</div>'
						+'</td>';
			
			function getTD( field,level ){
				var level = level || 0;
				var name = field['field'];
				var colSpan = self._getLeafColumns( name );
				var rowSpan = 1;
				colSpan = colSpan.length;
				//rowSpan += 1;
				rowSpan = maxRow-level;
				var fieldText = field.title === undef ? field.field : field.title ;
				field.title = fieldText;
			
				if( self._isLeafColumn(name) ) {
					colSpan = 1;
					var tds = self.tpl( tdTpl,$.extend({},field,{gridId:opt.id,rowSpan:rowSpan,colSpan:colSpan}) );	
					trs[level].push( tds );
					return;
				} else {
					rowSpan = 1;
					var tds = self.tpl( tdTpl2,$.extend({},field,{gridId:opt.id,rowSpan:rowSpan,colSpan:colSpan,align:opt.multiColumnsAlign}) );	
					trs[level].push( tds );
					var childs = self._getColumnChildrens( name );
					$.each( childs,function(i,f){
						var _level = level;
						getTD( f,++_level );
					} );
				}	
			}
			
			//更新_columnsHash
			//self._columnsMap();
			var columns = opt._columnsHash;
			var maxRow = self._getColumnAllLevel();
			var cols = self._getRootColumns();
			var trs = [];//每层td内容
			//初始化内容
			for(var i=0;i<maxRow;i++) {
				trs[i] = [];	
			}
			$.each( cols,function(i,field){
				getTD( field );	
			} );
			
			var html = [];
			$.each(trs,function(i,tr){
				var tds = ['<tr class="datagrid-header-row">'];
				tds.push(tr.join(''));
				tds.push('</tr>');
				html.push( tds.join('') );	
			});
			return html.join('');
		},
		/*
		*多表头实现 方法二
		*/
		view2_header_inner_row : function( data ){ 
			var self = this
				,undef
				,opt = self.configs;
			var hlist = [];
			var hhash = {};
			
			if( !opt.multiColumns ) {
				return self.tpl('view2_header_inner_row_bak',data);	
			}
			if( opt.mulitEngine == 1 ) {
				return self.view2_header_inner_row_1( data );
			}
			//更新_columnsHash
			//self._columnsMap();
			var columns = opt._columnsHash;
			/*
			 *最终单元格模版
			*/
			var tdTpl = '<td id="<%=gridId%>_cols_<%=_colid%>" class="datagrid_<%=_colid%>" field="<%=field%>" align="<%=align%>">'
							+'<div class="datagrid-header-wrap" field="<%=field%>" >'
								+'<div id="<%=gridId%>_cell_header_<%=_colid%>" class="datagrid-cell datagrid-header-cell datagrid-cell-<%=_colid%> datagrid-cell-header-<%=_colid%> <%=hcls%>" >'
									+'<span><%=title%></span>'
								+'</div>'
							+'</div>'
						+'</td>';
			var getTopParent = function(name){
				return self._getTopColumn( name );
			}			
			var sortColumns = function( columns ){
				return columns;	
			}
			var getRoot = function(){
				return self._getRootColumns();
			}
			var getChildrens = function(name){
				return self._getColumnChildrens(name);
			}
			var isRoot = function(field){
				return self._isRootColumn();
			}
			var isLeaf = function( name ){
				return self._isLeafColumn(name);
			}
			
			var getTD = function( field ){
				var name = field.field;
				var fieldText = field.title === undef ? field.field : field.title ;
				field.title = fieldText;
				if( isLeaf( name ) ) {
					return self.tpl( tdTpl,$.extend({},field,{gridId:opt.id}) );
				} else {
					var childs = getChildrens( name );
					var itd = ['<td class="datagrid-noborder" valign="bottom">'];
					itd.push('<table cellpadding="0" cellspacing="0" style="height:100%;">');
						itd.push('<tr class="datagrid-header-middle-row">');
							itd.push('<td colspan="'+childs.length+'" class="datagrid-td-noborder" align="'+opt.multiColumnsAlign+'">'+fieldText+'</td>');
						itd.push('</tr>');
						itd.push('<tr>');
							for( var i=0;i<childs.length;i++ ) {
								itd.push( getTD( childs[i] ) );	
							}
						itd.push('</tr>');
					itd.push('</table>');
					itd.push('</td>');
					return itd.join('');
				}
			}
			
			/*
			* 排列顺序，但是只曾对顶成field有效，
			*/
			var fields = self.getColumnMap();//getColumnMap 是 相当于直接使用opt.columns 只是封装接口而已
			var _flist = {};
			for( var t=0;t<fields.length;t++ ) {
				var tf = getTopParent( fields[t]['field'] );
				if( tf === undef ) continue;
				_flist[ tf.field+'_mf_nsort' ] = tf;
			}
			var mfields = [];
			for( var k in _flist ) {
				mfields.push( _flist[k] )	
			}
			//直接调用getChildrens会有顺序问题
			//var fields = getChildrens(null);

			var tds = ['<tr class="datagrid-header-row">'];
			for( var i=0;i<mfields.length;i++ ) {
				var field = mfields[i];
				var td = getTD( field );
				tds.push(td);
			}
			tds.push('</tr>');
			
			return tds.join('');
		},
		/*
		* 重新设置列头 当前会执行2次 待检查
		*/
		setGridHeader : function(){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			//console.log('^^2',opt.columns);
			//var fields = opt.columns;
			var fields = self.getColumns();
			//self.C('columns',fields);
			//console.log('^^22',fields);
			var view1_header_row = self.getTpl("view1_header_inner_row");
			var view2_header_row = opt.headerTpl ? opt.headerTpl : self.getTpl("view2_header_inner_row");
			
			var $view2_header_inner_wraper = $("#datagrid-view2-header-inner-wraper-"+opt.id);
			var $view1_header_inner_wraper = $("#datagrid-view1-header-inner-wraper-"+opt.id);
			var $view2_header_outer_wraper = $("#datagrid-view2-header-outer-wraper-"+opt.id);
			var $view1_header_outer_wraper = $("#datagrid-view1-header-outer-wraper-"+opt.id);
			
			//datagrid-header-inner-wraper
			var view1_header_inner_wraper = ['<table class="datagrid-htable" id="view1-datagrid-header-inner-htable-'+opt.id+'" border="0" cellspacing="0" cellpadding="0"><tbody id="view1-datagrid-header-inner-htable-tbody-'+opt.id+'">'];
			var view2_header_inner_wraper = ['<table class="datagrid-htable" id="view2-datagrid-header-inner-htable-'+opt.id+'" border="0" cellspacing="0" cellpadding="0"><tbody id="view2-datagrid-header-inner-htable-tbody-'+opt.id+'">'];
			//datagrid-header-outer-wraper
			var view1_header_outer_wraper = ['<table class="datagrid-locktable" id="view1-datagrid-header-outer-locktable-'+opt.id+'" border="0" cellspacing="0" cellpadding="0"><tbody id="view1-datagrid-header-outer-locktable-tbody-'+opt.id+'"></tbody></table>'];
			var view2_header_outer_wraper = ['<table class="datagrid-locktable" id="view2-datagrid-header-outer-locktable-'+opt.id+'" border="0" cellspacing="0" cellpadding="0"><tbody id="view2-datagrid-header-outer-locktable-tbody-'+opt.id+'">'];
			
			var ltr = self.tpl(view1_header_row,opt);
			var tr = self.tpl(view2_header_row,{'fields':fields,opt:opt});

			view1_header_inner_wraper.push(ltr);
			view2_header_inner_wraper.push(tr);
			
			view1_header_inner_wraper.push('</tbody></table>');
			view2_header_inner_wraper.push('</tbody></table>');
			

			view2_header_outer_wraper.push('</tbody></table>');
			
			$view1_header_inner_wraper.html( view1_header_inner_wraper.join("") );
			$view2_header_inner_wraper.html( view2_header_inner_wraper.join("") );
			$view1_header_outer_wraper.html( view1_header_outer_wraper.join("") );
			$view2_header_outer_wraper.html( view2_header_outer_wraper.join("") );
			
			ltr = $(">.datagrid-header-row",'#view1-datagrid-header-inner-htable-tbody-'+opt.id);
			tr = $(">.datagrid-header-row",'#view2-datagrid-header-inner-htable-tbody-'+opt.id);
			
			self.setGridHeaderEvent(tr,ltr);//性能
			
			self.methodCall('setGridHeader');
			if( opt.mulitEngine != 1 ) {
				self.refreshHeaderHeight(tr,ltr,opt);
			}
			self.fireEvent('onHeaderCreate',[tr,ltr,opt]);
			
			return true;
		},
		refreshHeaderHeight : function(tr,ltr,opt){
			var self = this;
			
			var h = tr._height();
		  	var tr = tr.add(ltr);

			tr.find('>td').each(function(){
				var $this = $(this);
				$this._outerHeight( h );
				if( Nex.isIE ) {
					$('table',$this).each(function(){
						var $table = $(this);	
						var ph = $table.parent()._height();
						$table._outerHeight( ph );
					});
				}
			});		

		},
		onHeaderCreate : function(){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			//headerTpl都不在建议使用了	
			if( !opt.headerTpl ) return -1;
			var fields = opt.columns;	
			var headerBody = $("#view2-datagrid-header-inner-htable-tbody-"+opt.id);
			var _columns = [];
			var _thex = dataGrid.getToGridOptions();
			//jquery 1.4.4出现不能寻找tr下多级th td问题
			headerBody.find("td[field],th[field],td["+_thex.options_from+"],th["+_thex.options_from+"]").each(function(i){
				var field = $(this).attr("field");
				var _d = $(this).attr(_thex.options_from);
				if( _d ) {
					_d = eval("({"+_d+"})")	
				} else {
					_d = {};	
				}
				if(!field) {
					field = _d.field ?  _d.field : 'field_'+Nex.aid++;
				}
				
				var _d2 = {};
				_d2.title = $(this).html();
				if( _d2.title === '' ) {
					_d2 = {};	
				}
				
				var _d3 = {};
				var j = 0,
				len = fields.length;
				for(;j<len;j++) {
					if( fields[j]['field'] == field ) {
						_d3 = fields[j];
						break;
					}
				}
				if( $.isEmptyObject( _d3 ) ) {
					_d3.field = field;
				}
				
				var _d4 = $.extend(true,{},_d3,_d,_d2);
				
				_d4.align = _d4.align ? _d4.align : ($(this).attr("align") ? $(this).attr("align") : opt._columnMetaData.align);
				_d4.hcls = _d4.hcls ? _d4.hcls : opt._columnMetaData.hcls;
				_d4.title = _d4.title === '' ? _d4.field : _d4.title;
				_d4.width = _d4.width ? _d4.width : $(this)._width();

				var $this = this;
				
				if( $(this).is("th") ) {
					$this = $('<td field="'+_d4.field+'" align="'+_d4.align+'"></td>');
					$(this).replaceWith($this);
				} else {
					$(this).attr("field",_d4.field);
					$(this).attr("align",_d4.align);
				}
				
				$($this).html('<div class="datagrid-header-wrap" field="'+_d4.field+'"><div class="datagrid-cell datagrid-cell-'+_d4._colid+' datagrid-cell-header-'+_d4._colid+' '+_d4.hcls+'" ><span>'+_d4.title+'</span></div></div>');//style="width:'+parseFloat(_d4.width)+'px"
				
				_columns.push(_d4);
				
			});
			opt.columns = _columns;
			//添加系统必要的参数
			headerBody.find(">tr").addClass('datagrid-header-row');
			
			self.getColumns();
			//因为自定义header可能会不设置列信息，所以需要重新设置列宽，但是这个会给设置htpl的 带来每次刷新的问题,以下是解决判断
			/*
			opt._headerTpl = self._undef( opt._headerTpl,'' );
			if( opt._headerTpl != opt.headerTpl ) {
				self.onInitFieldWidth();
			}
			*/
			
			return headerBody.find(">tr");
		},
		/*
		* 同setColumnData,不同在于不会触发事件和刷新表格
		*/
		setColumnValue : function(field,key,value){
			var self = this,
				opt = this.configs;
			var fields = opt.columns;;//self.getColumns();
			var i = 0,
				len = fields.length;
			for(;i<len;i++) {
				if(fields[i]['field'] == field) {
					fields[i][key] = value;
					continue;
				}	
			}
		},
		cStop : function(cfg){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			
			var column = self.getColumnData(cfg.field);
			
			if( !column ) return;
			
			var w = column._fieldWidth + cfg.offsetX;
			
			var w = self.setFieldWidth( cfg.field,w );

			self.fireEvent("onAfterResize",[cfg.field,w,cfg]);
		},
		//当行的宽度改变时 group row的大小也要随之改变
		//setGroupRowSize : function(){},
		//changeExpandPos : function(){},
		//当行的宽度改变时expand row的大小也要随之改变
		//setExpandRowSize : function(){},
		//resetExpandRowHeight : function(rid){},
		isRowHidden : function(rowId) {
			var self = this,
				opt = self.configs,
				gid = opt.gid;
				if(rowId === undefined) return true;
				return ($("#"+opt.id+"-row-"+rowId).size() && !$("#"+opt.id+"-row-"+rowId).is(":hidden") ) ? false : true;
		},
		_selectDefRows : function(){
			var self = this,
				opt = self.configs;
			var rows = opt.selectRows;
			//因为开启lazyLoadRows时 默认被锁的行是在_selectDefRows调用后才生成，而当前事件绑定没有绑定最后执行事件的功能.
			//只能通过计时器来实现
			setTimeout(function(){
				for( var i=0;i<rows.length;i++ ) {
					self.selectRow(rows[i]);	
					if( opt.singleSelect ) break;
				}						
			},0);
		},
		//destroyExpandRow : function(rowId){},
		//updateExpandRow : function(rowId,html){},
		/*
		* 选择所有行
		*/
		selectAllRows : function(){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			//var e = opt.events;	
			if(opt.singleSelect) return self; //singleSelect 模式下无效
			//var r = e.onSelectAll.call(self);
			var r = self.fireEvent('onSelectAll',[opt]);
			if(r === false) return self;
			if( opt.lazyLoadRow ) {
				self._clearSelectRows();
				var i = 0,
					len = opt.data.length;
				for(;i<len;i++) {
					opt._selectRows[i] = true;	
				}
			}
			$(">.datagrid-row",$("#view2-datagrid-header-outer-locktable-tbody-"+opt.id)).each(function(idx){
				self.selectRow($(this).attr("datagrid-rid"));									
			});
			$(">.datagrid-row",$("#view2-datagrid-body-btable-tbody-"+opt.id)).each(function(idx){
				self.selectRow($(this).attr("datagrid-rid"));									
			});

			return self;
		},
		/*
		* 取消选择所有行
		*/
		unselectAllRows : function(){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var e = opt.events;	
			//var r = e.onUnSelectAll.call(self);
			var r = self.fireEvent('onUnselectAll',[opt]);
			if(r === false) return self;
			
			$(">.datagrid-row",$("#view2-datagrid-header-outer-locktable-tbody-"+opt.id)).each(function(idx){
				self.unselectRow($(this).attr("datagrid-rid"));									
			});
			$(">.datagrid-row",$("#view2-datagrid-body-btable-tbody-"+opt.id)).each(function(idx){
				self.unselectRow($(this).attr("datagrid-rid"));									
			});
			
			self._clearSelectRows();
			return self;
		},
		_clearSelectRows : function(){
			var self = this,
				opt = self.configs;
			opt._selectRows = {};
		},
		/*
		* 选择指定行
		*/
		selectRow : function(rowId){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var e = opt.events;	
			var render = gid;
			var rowId = typeof rowId === 'undefined' ? false : rowId;
			if(rowId === false) return self;

			var rowData = self.getRowData(rowId);

			var obj1 = $("#"+opt.id+"-row-"+rowId);
			var obj2 = $("#"+opt.id+"-view1-row-"+rowId);
			var obj = $(obj1).add(obj2);

			if( !obj.size() ) {
				var r = self.fireEvent('onSelect',[obj,rowId,rowData,opt]);
				if(r === false) return r;	
			} else {
				if( obj1.hasClass(opt.clsSelectRow) ) {
					return self;	
				}	
				var r = self.fireEvent('onSelect',[obj,rowId,rowData,opt]);
				if(r === false) return r;
			}		

			opt._selectRows[rowId] = true;	
			
			if( obj.size() ) {
				obj1.addClass(opt.clsSelectRow);
				obj2.addClass(opt.clsSelectRow);
			}
			
			if( opt.checkBox && obj.size() ){
				var ck = obj.find("td[field='ck'] .datagrid-cell-check input:checkbox");

				if(ck.length)
					ck.get(0).checked = true;
			}
			
			if( opt.singleSelect) {
				//var selects = opt.selectRows;
				var selects = self.getSlectRows();
				var _dr = [];
				for(var si=0;si<selects.length;si++){
					if(selects[si] == rowId) continue;
					_dr.push( selects[si] );
				}
				for(var si=0;si<_dr.length;si++){
					self.unselectRow(_dr[si]);
				}	
				
				self._clearSelectRows();
				opt._selectRows[rowId] = true;	
			}
			return self;
		},
		/*
		* 取消选择指定行
		*/
		unselectRow : function(rowId){
			var self = this,
				opt = self.configs,
				gid = opt.gid;

			var rowId = typeof rowId === 'undefined' ? false : rowId;
			if(rowId === false) return self;
			var rowData = self.getRowData(rowId);

			var obj1 = $("#"+opt.id+"-row-"+rowId);
			var obj2 = $("#"+opt.id+"-view1-row-"+rowId);
			var obj = $(obj1).add(obj2);
			
			if( !obj.size() ) {
				var r = self.fireEvent('onUnselect',[obj,rowId,rowData,opt]);
				if(r === false) return r;	
			} else {
				if( !obj1.hasClass(opt.clsSelectRow) ) {
					return self;	
				}	
				var r = self.fireEvent('onUnselect',[obj,rowId,rowData,opt]);
				if(r === false) return r;
			}		
			
			opt._selectRows[rowId] = false;
			
			if( obj.size() ) {
				obj1.removeClass(opt.clsSelectRow);
				obj2.removeClass(opt.clsSelectRow);
			}
			//obj.find("td[field='ck'] .datagrid-cell-check input:checkbox").get(0).checked = false;
			if( opt.checkBox && obj.size() ){
				var ck = obj.find("td[field='ck'] .datagrid-cell-check input:checkbox");

				if(ck.length)
					ck.get(0).checked = false;
			}
			return self;
		},
		//showGroup : function(groupId,type){},
		//hideGroup : function(groupId){},
		//addGroupRow : function(isFirst){},
		//setGroupEvent : function(){},
		//对数据按指定的grouplist字段分类，并重新设置configs的data数据，途中会修改configs的 groupBy  groupList
		//groupByField : function(field,data,groupList){},
		//searchData : function(text,field,async,data){},
		//_refresh true 则 清除查询结果并刷新表格; false 不刷新表格
		//clearSearch : function( _refresh ){},
		onOverRow : function(tr,rowId){
			var self = this,
				opt = self.configs,
				gid = opt.gid;	
			if( opt.clsOverRow ) {
				$("#"+opt.id+"-view1-row-"+rowId).addClass(opt.clsOverRow);
				$(tr).addClass(opt.clsOverRow);
			}
		},
		onOutRow : function(tr,rowId){
			var self = this,
				opt = self.configs,
				gid = opt.gid;	
			if( opt.clsOverRow ) {	
				$("#"+opt.id+"-view1-row-"+rowId).removeClass(opt.clsOverRow);
				$(tr).removeClass(opt.clsOverRow);
			}
		},
		setGridBodyTextLimit : function(field,data){},
		bindRowEvent : function( tr,ltr ){
			var self = this,
				opt = self.configs,
				data = opt.data,
				gid = opt.gid;
				
			if( typeof tr === "undefined" ) {
				tr = false;	
			}
			if( typeof ltr === "undefined" ) {
				ltr = false;	
			}
			var fields = opt.columns;
			
			var tr_events = {
				'click' : function(ev){
					var rowId = $(this).attr("datagrid-rid");
					var rowData = self.getRowData(rowId);
					//自动显示当前行隐藏部分
					if( opt.autoScrollToRow ) {
						self.scrollToRow(rowId);	
					}
					//触发单元格事件
					var cr = self.cellEvents(rowId,ev);
					if(cr === false) return false;
					
					var r = self.fireEvent('onClickRow',[this,rowId,rowData,ev]);
					if(r === false) return false;
					//触发行 是否选择事件
					var isSelect = $(this).hasClass(opt.clsSelectRow);
					var selects = self.getSlectRows();
					if( isSelect ) {
						if(opt.singleSelect) {
							if(selects.length==1 && selects[0] != rowId) {
								self.unselectRow(rowId);	
							}
						} else {
							self.unselectRow(rowId);
						}
					} else {
						self.selectRow(rowId);
					}
					
				},
				'mouseenter' : function(e){
					var rowId = $(this).attr("datagrid-rid");	
					var rowData = self.getRowData(rowId);
					//触发单元格事件
					var cr = self.cellEvents(rowId,rowData,e);	
					if(cr === false) return false;
					
					self.fireEvent("onMouseEnter",[this,rowId,rowData,e]);	
				},
				'mouseover' : function(e){//mouseenter
					var rowId = $(this).attr("datagrid-rid");	
					var rowData = self.getRowData(rowId);
					//触发单元格事件
					var cr = self.cellEvents(rowId,rowData,e);	
					if(cr === false) return false;
					
					self.fireEvent("onOverRow",[this,rowId,rowData,e]);
				},
				'mouseleave' : function(e){
					var rowId = $(this).attr("datagrid-rid");	
					var rowData = self.getRowData(rowId);
					//触发单元格事件
					var cr = self.cellEvents(rowId,e);	
					if(cr === false) return false;
					
					self.fireEvent("onMouseLeave",[this,rowId,rowData,e]);	
				},
				'mouseout' : function(e){//mouseleave
					var rowId = $(this).attr("datagrid-rid");	
					var rowData = self.getRowData(rowId);
					//触发单元格事件
					var cr = self.cellEvents(rowId,e);	
					if(cr === false) return false;
					
					self.fireEvent("onOutRow",[this,rowId,rowData,e]);
				},
				'dblclick' : function(e){
					var rowId = $(this).attr("datagrid-rid");
					var rowData = self.getRowData(rowId);

					//触发单元格事件
					var cr = self.cellEvents(rowId,e);
					if(cr === false) return false;
					
					var r = self.fireEvent('onDblClickRow',[this,rowId,rowData,e]);
					if(r == false) return false;
				},
				'contextmenu' : function(e){
					var rowId = $(this).attr("datagrid-rid");
					var rowData = self.getRowData(rowId);
					
					//触发单元格事件
					var cr = self.cellEvents(rowId,e);
					if(cr === false) return false;
					
					var r = self.fireEvent('onRowContextMenu',[this,rowId,rowData,e]);
					if(r == false) return false;
				}
			};
			
			if(tr) {
				tr.bind(tr_events);
				tr.each(function(){
					var tr = $(this);
					var rowId = $(this).attr("datagrid-rid");
					var rowData = self._getRowData(rowId);//因为这个是一次性过程 必须使用引用的rowData
					//行回调
					if( $.isFunction(opt.rowCallBack) && opt.rowCallBack != $.noop ) {
						opt.rowCallBack.call(self,tr,rowId,rowData);
					}
					if( opt.rowStyler ) {
						if( $.isFunction(opt.rowStyler) ) {
							var rstyle = opt.rowStyler.call(self,tr,rowId,rowData);
							if( typeof rstyle == 'string' ) {
								tr.addClass(rstyle);	
							}
						} else if( typeof opt.rowStyler == 'string' ) {
							tr.addClass(opt.rowStyler);	
						}	
					}
					//单元格回调
					var field = [];
					var j = 0,
						len = fields.length;
					for(;j<len;j++) {
						field = fields[j];
						if( !$.isFunction(field['callBack']) || field['callBack'] == opt.noop ) {
							//是否有单元格回调
							continue;	
						}
						
						var t = $("#"+opt.id+'_'+field["_colid"]+'_row_'+rowId+'_cell',tr);//FIX BUG 需要添加tr做限制，否则会取到旧的td
						field['callBack'].call(self,t,rowId,field,rowData);
					}
					
					//检测文字是否超出
					self.setGridBodyTextLimit(tr,rowData);
					
				});
			}
			
			if( ltr ) {
				
					var ltr_events = {
					'click' : function(e){
						var rowId = $(this).attr("datagrid-rid");
						var rowData = self.getRowData(rowId);
						var rid = rowId;
						
						var target = e.srcElement ? e.srcElement : e.target;
						
						//触发单元格事件
						var cr = self.cellEvents(rowId,e);	
						if(cr === false) return false;	
						//var tr = $("#"+opt.id+"-row-"+rowId).get(0);
						self.fireEvent('onClickRowNumber',[this,rid,rowData,e]);
						if( opt.rowNumbers2Row !== false ) {
							//self.selectRow(rid);
							$("#"+opt.id+"-row-"+rid).trigger('click');
						}
					},
					'mouseover' : function(e){
						var rowId = $(this).attr("datagrid-rid");
						var rowData = self.getRowData(rowId);
						//触发单元格事件
						var cr = self.cellEvents(rowId,e);	
						if(cr === false) return false;	
						var tr = $("#"+opt.id+"-row-"+rowId).get(0);
						self.fireEvent("onOverRow",[tr,rowId,rowData,e])
						
					},
					'mouseout' : function(e){
						
						var rowId = $(this).attr("datagrid-rid");
						var rowData = self.getRowData(rowId);
						//触发单元格事件
						var cr = self.cellEvents(rowId,e);	
						if(cr === false) return false;	
						var tr = $("#"+opt.id+"-row-"+rowId).get(0);
						self.fireEvent("onOutRow",[tr,rowId,rowData,e]);
					},
					'dblclick' : function(e){
						var rowId = $(this).attr("datagrid-rid");
						var rid = rowId;
						//触发单元格事件
						var cr = self.cellEvents(rowId,e);	
						if(cr === false) return false;	
						if( opt.rowNumbers2Row !== false ) {
							$("#"+opt.id+"-row-"+rid).trigger('dblclick');
						}
						
					},
					'contextmenu' : function(ev){
					}
				};
				//view1 行事件绑定
				ltr.bind(ltr_events);
			}
			self.fireEvent("onSetRowEvent",[tr,ltr,opt]);
		},
		isCell : function(o){
			
			if( !$(o).length )
				return false;
			
			//检测是否rowNumber
			if( $(o).is('td') && $(o).hasClass('datagrid-td-rownumber') ) {
				return false;
			}	
			if( $(o).is('tr') && $(o).hasClass('datagrid-row') ) {
				return false;	
			}
			//检测是否有datagrid-cell
			if( !$(o).hasClass("datagrid-cell") ) {
				var cell = $(o).closest("tr.datagrid-row div.datagrid-cell");	
				if( !cell.length ) {
					return false;
				}
			}
			
			return true;
		},
		cellEvents : function(rowId,e) {
			var self = this,
				opt = self.configs;
			var target = e.srcElement ? e.srcElement : e.target;
			
			//检测当前是否对象是否单元格
			if( !self.isCell(target) ) {
				return true;	
			}
			
			var cell = $(target);
			
			var field = cell.parent("td").attr("field");

			var value = self.getFieldValue(rowId,field);
			
			var r = true;
			
			switch( e.type ) {
				case 'click' :
					//自动显示当前行隐藏部分
					if( opt.autoScrollToField ) {
						self.scrollToField(field);	
					}
				
					r = self.fireEvent('onClickCell',[cell.eq(0),rowId,field,value,e]);
					break;
				case 'dblclick' :
					r = self.fireEvent('onDblClickCell',[cell.eq(0),rowId,field,value,e]);
					break;
				case 'mouseenter' : //case 'mouseenter' : 
					r = self.fireEvent('onMouseEnterCell',[cell.eq(0),rowId,field,value,e]);
					break;
				case 'mouseover' : //case 'mouseenter' : 
					r = self.fireEvent('onOverCell',[cell.eq(0),rowId,field,value,e]);
					break;
				case 'mouseleave' :
					r = self.fireEvent('onMouseLeaveCell',[cell.eq(0),rowId,field,value,e]);
					break;
				case 'mouseout' :
					r = self.fireEvent('onOutCell',[cell.eq(0),rowId,field,value,e]);
					break;
				case 'contextmenu' :
					r = self.fireEvent('onCellContextMenu',[cell.eq(0),rowId,field,value,e]);
					break;
			}
			return r;
		},
		//checkToRow : function(rid){}, 
		/*
		* 动态添加一行数据
		*  @rid {int} 行id
		*  @d   {Object} 行数据(可选)
		*  @ai  {boolean} true:直接插入到最后 默认,false:会根据rid选择合适的位置插入(可选)
		*  @return {Object} 
		*/
		_insert : function(rid,d,ai){
			var self = this,
				opt = self.configs,
				data = opt.data,
				gid = opt.gid;
			var fields = opt.columns;
			
			var rid = self._undef(rid,0);
			//判断当前行是否已经存在
			var isExists = false;
			var _tr = $("#"+opt.id+"-row-"+rid);
			if( _tr.size() ){
				isExists = true;
			}

			var i = rid;
			
			var ai = self._undef(ai,true);
			var d = self._undef(d,{});
			
			var view1_row_tpl = self.getTpl("view1_row");
			var view2_row_tpl = opt.rowTpl ? opt.rowTpl : self.getTpl("view2_row");

			var view2_tbodyId = $("#view2-datagrid-body-btable-tbody-"+opt.id);
			var view1_tbodyId = $("#view1-datagrid-body-btable-tbody-"+opt.id);	
			
			var $theader2 = $("#view2-datagrid-body-btable-tbody-header-"+opt.id);
			var $theader1 = $("#view1-datagrid-body-btable-tbody-header-"+opt.id);
			var $tfooter2 = $("#view2-datagrid-body-btable-tbody-footer-"+opt.id);
			var $tfooter1 = $("#view1-datagrid-body-btable-tbody-footer-"+opt.id);
			
			if( !isExists ) {
				
				var _d = {
						i : i,
						id : opt.id,
						fields : fields	,
						rowNumbersExpand : opt.rowNumbersExpand,
						data : d,
						isCreate : opt.isCreate,
						//groupBy : opt.groupBy,
						rowNumbersWidth : opt.rowNumbersWidth,
						opt : opt
					};
				
				var tr = $(self.tpl(view2_row_tpl,_d));
				
				var ltr = false;

				ltr = $(self.tpl(view1_row_tpl,_d));
				
			} else {
				var tr = _tr;
				var ltr = false;
				ltr = $("#"+opt.id+"-view1-row-"+rid);
			}
			
			if( ai ) {
			
				$tfooter2.before( tr );
				if( ltr!==false ) {
					
					$tfooter1.before( ltr );
				}
			} else {
				
				var rows = $(">tr.datagrid-row","#view2-datagrid-body-btable-tbody-"+opt.id);
				var rids = [];
				rows.each(function(i,t){
					rids.push( Number($(t).attr("datagrid-rid")) );				   
				});
				rids.push(rid);
				rids.sort(function(a,b){
					return a>=b?1:-1; 
				});
				var index = self.inArray(rid,rids);
				if( !index ) {//第一行数据
					$theader2.after(tr);
					if( ltr!==false ) {
						$theader1.after(ltr);	
					}	
				} else {
					var prid = rids[index-1];
					$("#"+opt.id+"-row-"+prid).after(tr);
					if( ltr!==false ) {
						$("#"+opt.id+"-view1-row-"+prid).after(ltr);	
					}	
				}
				
			}
			
			if( opt.rowTpl ) {
				self.parseRowTpl(tr,rid,d);	
			}
			//绑定该行数据
			tr.data("rowData",d);
			
			self.fireEvent("onAfterAddRow",[rid,d,opt]);
			//self.resetViewSize();
			self.methodInvoke('resetViewSize');
			
			return {tr:tr,ltr:ltr,isNew:!isExists};
		},
		/*
		* 动态添加一行数据
		*  @d   {Object} 行数据(可选)
		*  @ai  {boolean} true:自动识别是否超过pageSize超过pageSize则不创建直接添加到数据集 默认,false:不识别pageSize,直接创建一行(可选)
		*  @return {int}  rid
		*/
		addRow : function(d,ai){
			var self = this,
				opt = self.configs,
				data = opt.data,
				gid = opt.gid;
			var fields = opt.columns;
			var rid = data.length;
			var i = rid;
			
			var ai = self._undef(ai,true);
			
			var d = self._undef(d,{});
			
			//本地
			if( self.getAsync() ) {
				data.push( d );
				var datas = self.getData();
				datas.push( d );
			} else {
				data.push( d );	
			}
			
			opt.total++;

			var pk = opt.pk;
			
			if( !d[pk] ) {
				d[pk] = self.unique();	
			}
			
			var r = self.fireEvent("onBeforeAddRow",[d,opt]);
			if( r === false ) {
				return false;	
			}
			
			self.fireEvent("onSuccessAddRow",[rid,d,opt]);
			
			if( ai && (rid >= opt.pageSize) ) {
				return true;	
			}

			var tr_row = self._insert(rid,d);
			if( tr_row.isNew ) {
				//行事件绑定
				if( opt.denyRowEvents === false ) {
					self.bindRowEvent(tr_row.tr,tr_row.ltr);
				} else if( $.isFunction(opt.denyRowEvents) ) {
					opt.denyRowEvents.call(self,tr_row.tr,tr_row.ltr);	
				}
			}
			
			return rid;
		},
		/*
		* 更新指定行和数据
		*  @rid   {int} 行id
		*  @d   {Object} 行数据(可选)
		*  @return {boolean}
		*/
		updateRow : function(rid,d){
			var self = this,
				opt = self.configs,
				data = opt.data,
				gid = opt.gid;	
				
			var d = self._undef(d,{});
			
			var r = self.fireEvent("onBeforeUpdateRow",[rid,d,opt]);
			if( r === false ) {
				return false;	
			}
			
			//var fieldList = self.getColumnList();
			
			var editList = [];
			
			for(var f in d) {
				//if( self.inArray(f,fieldList)!=-1 ) {
					var ed = self.setFieldValue(rid,f,d[f]);	
					if( ed !== false ) {
						editList.push(f);
					}
				//} else {
				//	self.setRowData( rid,f,d[f] )	
				//}	
			}
			//editList:修改过的单元格
			self.fireEvent("onAfterUpdateRow",[rid,d,editList,opt]);
			return true;
		},
		/*
		* 删除指定行和数据
		*  @rid   {int} 行id
		*  @m   {boolean} true:删除行和数据 默认,false:删除行不删除数据(可选)
		*  @return {boolean} 
		*/
		deleteRow : function(rid,m){
			
			var self = this,
				opt = self.configs,
				data = opt.data,
				gid = opt.gid;
			var m = self._undef(m,true);	
			var r = self.fireEvent("onBeforeDeleteRow",[rid,opt]);
			if( r === false ) {
				return false;	
			}
			
			var tr = $("#"+opt.id+"-row-"+rid);
			/*if( !tr.size() ) {
				return false;	
			}*/
			
			var ltr = $("#"+opt.id+"-view1-row-"+rid);
			
			var data = tr.size() ? tr.data('rowData') : opt.data[rid,opt];
			if( !data ) return false;
			if( !data[opt.pk] ) {
				return false;	
			}
			
			if( m ) {
				for( var i=0;i<opt.data.length;i++ ) {
					if( opt.data[i][opt.pk] == data[opt.pk] ) {
						opt.data.splice(i,1);//删除	
						break;
					}	
				}
				if( self.getAsync() ) {
					var datas = self.getData();
					for( var i=0;i<datas.length;i++ ) {
						if( datas[i][opt.pk] == data[opt.pk] ) {
							datas.splice(i,1);//删除
							break;
						}	
					}
				}
				opt.total--;
			}
			
			tr.remove();
			ltr.remove();
			//self.destroyExpandRow(rid);
			
			self.fireEvent("onAfterDeleteRow",[rid,opt]);
			self.methodInvoke('resetViewSize');
			
			return true;
			
		},
		//解析用户自定义行
		parseRowTpl : function(tr,rid,d){
			var self = this,
				opt = self.configs,
				data = opt.data,
				gid = opt.gid;
			var fields = opt.columns;
			
			var i = rid,
				rowId = rid;
			
			var d = self._undef(d,false);
			
			if( !d ) {
				d = data[i] ? data[i] : {};
			}
			
			tr.find(">td,>th").each(function(f){
				var _colid = self.getColumnData( fields[f]['field'],'_colid' );
				var tdId = opt.id+'_'+_colid+'_row_'+rowId+'_td';
				var cellId = opt.id+'_'+_colid+'_row_'+rowId+'_cell';
				var $this = this;
				if( $(this).is("th") ) {
					$this = $("<td id='"+tdId+"' field='"+fields[f]['field']+"' align='"+fields[f]['align']+"'><div  id='"+cellId+"'  class='datagrid-cell datagrid-cell-"+_colid+" ' >"+$(this).html()+"</div></td>");//style='width:"+fields[f]['width']+";'
					$(this).replaceWith( $this );
				} else {
					$(this).attr("field",fields[f]['field'])
						   .attr("align",fields[f]['align'])
						   .attr("id",tdId)
						   .html("<div  id='"+cellId+"' class='datagrid-cell datagrid-cell-"+_colid+" ' >"+$(this).html()+"</div>");//style='width:"+fields[f]['width']+";'
				}						 
			});
			var modelTr = opt.stripeRows ? ((rid+1)%2 ? opt.clsSingleRow : opt.clsDoubleRow) : '';
			tr.addClass("datagrid-row "+modelTr)
			  .attr("id",opt.id+"-row-"+i)
			  .attr("datagrid-rid",i);
			if( typeof d["_groupid_"] != 'undefined') {
				tr.attr("datagrid-group-id",d["_groupid_"]);
			}
		},
		//行 生成
		setRow : function(n,_func){
			var self = this,
				opt = self.configs,
				data = opt.data,
				gid = opt.gid;
			var fields = opt.columns;
			
			var view1_row_tpl = self.getTpl("view1_row");
			var view2_row_tpl = opt.rowTpl ? opt.rowTpl : self.getTpl("view2_row");
			var _d = {};
			var view2_tbodyId = $("#view2-datagrid-body-"+opt.id);
			var view1_tbodyId = $("#view1-datagrid-body-"+opt.id);
			var _func = self._undef(_func,$.noop);
			var n = self._undef(n,0);
			
			var j = opt._lSize;
			var pos = 1;
			var rows_view1 = ['<table class="datagrid-btable" id="view1-datagrid-body-btable-'+opt.id+'" cellspacing="0" cellpadding="0" border="0"><tbody id="view1-datagrid-body-btable-tbody-'+opt.id+'"><tr class="datagrid-row-header" id="view1-datagrid-body-btable-tbody-header-'+opt.id+'" style="height:0px;"></tr>'];
			var rows_view2 = ['<table class="datagrid-btable" id="view2-datagrid-body-btable-'+opt.id+'" cellspacing="0" cellpadding="0" border="0"><tbody id="view2-datagrid-body-btable-tbody-'+opt.id+'"><tr class="datagrid-row-header" id="view2-datagrid-body-btable-tbody-header-'+opt.id+'" style="height:0px;"></tr>'];
			
			var rowIds = [];
			
			if(  !$.isArray(data) ) {
				data = [];	
			}
			var len = data.length;
			for(var i=n;i<len;i++){
				//只显示某部分数据
				if(j>0) {
					if(pos>j) {
						break;
					}
					pos++;
					opt._lStart = pos;
				}
				
				rowIds.push(i);
				
				_d = {
					i : i,
					id : opt.id,
					fields : fields	,
					rowNumbersExpand : opt.rowNumbersExpand,
					data : data[i],
					isCreate : opt.isCreate,
					//groupBy : opt.groupBy,
					rowNumbersWidth : opt.rowNumbersWidth,
					opt : opt
				};
				
				var tr = self.tpl(view2_row_tpl,_d);
				
				rows_view2.push(tr);
				
				var ltr = false;
				
				ltr = self.tpl(view1_row_tpl,_d);
				rows_view1.push(ltr);
				
			}
			
			rows_view2.push('<tr class="datagrid-row-footer" id="view2-datagrid-body-btable-tbody-footer-'+opt.id+'" style="height:0px;"></tr></tbody></table>');
			rows_view1.push('<tr class="datagrid-row-footer" id="view1-datagrid-body-btable-tbody-footer-'+opt.id+'" style="height:0px;"></tr></tbody></table>');
			
			view2_tbodyId.html(rows_view2.join(""));
			view1_tbodyId.html( rows_view1.join("") );
			
			var tr = false;
			var ltr = false;
			//如果自定义opt.rowTpl 那么就添加系统必要的元素
			if( opt.rowTpl ) {
				tr = $(">tr:not(.datagrid-row-header,.datagrid-row-footer)","#view2-datagrid-body-btable-tbody-"+opt.id);
				tr.each(function(t){
					var tr = $(this);
					var rowId = rowIds[t];
					var i = rowId;
					
					self.parseRowTpl(tr,rowId);
									 
				});
			} else {
				tr = $(">tr.datagrid-row","#view2-datagrid-body-btable-tbody-"+opt.id);	
			}

			tr.each(function(i){//2000 140ms
				var rid = $(this).attr("datagrid-rid"); 
				$(this).data("rowData",data[rid]);
			});
			
			ltr = $(">tr.datagrid-row","#view1-datagrid-body-btable-tbody-"+opt.id);
			
			if( opt.denyRowEvents === false ) {
				self.bindRowEvent(tr,ltr);
			} else if( $.isFunction(opt.denyRowEvents) ) {
				opt.denyRowEvents.call(self,tr,ltr);	
			}
			
			_func();
			
			self.afterGridShow();
			
		},
		//单元格内容映射检测
		_cellReader : function(val,maps,data , rid , field){
			var self = this,
				opt = self.configs;	
			var val = self._undef(val,'');
			var maps = self._undef(maps,{});
			var data = self._undef(data,{});
			if( $.isFunction( maps ) ) {
				 return self.tpl( maps , val ,data, rid , field);	
			} else if( val in maps ) {
				return self.tpl(maps[val],data,val, rid , field);	
			} else if( opt.readerDef in maps  ) {
				return self.tpl(maps[opt.readerDef],data,val, rid , field);		
			}
			return val;
		},
		//模版函数
		view2_row : function(d){
			
			if( !d ) return "";
			var self = this,
				opt = self.configs,
				data = opt.data,
				gid = opt.gid;
			//var  group_id = ( typeof d.data["_groupid_"] != "undefined" )? "datagrid-group-id="+d.data["_groupid_"] : "";
			if( typeof d.data[opt.pk] == "undefined" ) {
				d.data[opt.pk] = self.unique();
			}
			
			var group_id = [];
			if( typeof d.data["_groupid_"] != "undefined" ) {
				group_id.push('datagrid-group-id=');
				group_id.push(d.data["_groupid_"]);
			}
			group_id = group_id.join("");
			//var modelTr = opt.stripeRows ? ((rid+1)%2 ? opt.clsSingleRow : opt.clsDoubleRow) : '';
			var modelTr = opt.stripeRows ? ((d.i+1)%2 ? opt.clsSingleRow : opt.clsDoubleRow) : '';
			//var tr = ['<tr id="'+d.id+'-row-'+d.i+'" '+group_id+' datagrid-rid="'+d.i+'" datagrid-row-select="0" class="datagrid-row '+modelTr+'">'];
			var tr = [];
			tr.push('<tr id="');
			tr.push(d.id);
			tr.push('-row-');
			tr.push(d.i);
			tr.push('" ');
			tr.push(group_id);
			tr.push(' datagrid-rid="');
			tr.push(d.i);
			tr.push('" class="datagrid-row ');
			tr.push(modelTr);
			tr.push('">');
			
			var j = 0,
				len = d.fields.length;
			for(;j<len;j++) {
				//var tdId = opt.id+'_'+d.fields[j]["field"]+'_row_'+d.i+'_td';
				var tdId = [];
				tdId.push(opt.id);
				tdId.push('_');
				tdId.push(d.fields[j]["_colid"]);
				tdId.push('_row_');
				tdId.push(d.i);
				tdId.push('_td');
				tdId = tdId.join("");
				
				//var cellId = opt.id+'_'+d.fields[j]["field"]+'_row_'+d.i+'_cell';
				var cellId = [];
				cellId.push(opt.id);
				cellId.push('_');
				cellId.push(d.fields[j]["_colid"]);
				cellId.push('_row_');
				cellId.push(d.i);
				cellId.push('_cell');
				cellId = cellId.join("");
				
				var _colid = d.fields[j]["_colid"];
				var field = d.fields[j]["field"];
				var index = d.fields[j]["index"];
				var _expand = d.fields[j]["_expand"] !== false ? opt.self.tpl(d.fields[j]["_expand"],d.data , d.i ,field) : self._cellReader(d.data[index],d.fields[j]["reader"],d.data, d.i ,field );//d.data[index]
				
				//tr.push('<td class="datagrid_'+_colid+'" field="'+field+'" id="'+tdId+'" align="'+d.fields[j]["align"]+'">');
				tr.push('<td class="datagrid_');
				tr.push(_colid)
				tr.push('" field="');
				tr.push(field);
				tr.push('" id="');
				tr.push(tdId);
				tr.push('" align="');
				tr.push(d.fields[j]["align"]);
				tr.push('" valign="');
				tr.push(d.fields[j]["valign"]);
				tr.push('">');
				
				//tr.push('<div id="'+cellId+'" class="datagrid-cell datagrid-cell-c1-'+field+' '+d.fields[j]["bcls"]+'" style="width:'+d.fields[j]["width"]+';" >'+_expand+'</div></td>');
				tr.push('<div id="');
				tr.push(cellId);
				tr.push('" class="datagrid-cell');
				if( opt.nowrap ) {
					tr.push(' datagrid-cell-nowrap ');	
				}
				tr.push(' datagrid-cell-');
				tr.push(_colid);
				//tr.push(' datagrid-cell-c1-');
				//tr.push(field);
				tr.push(' ');
				tr.push(d.fields[j]["bcls"]);
				tr.push('" >');
				//tr.push('" style="width:');
				//tr.push(d.fields[j]["width"]);
				//tr.push(';" >');
				tr.push(_expand);
				tr.push('</div></td>');
			}
			tr.push('</tr>');
			
			return tr.join("");
		},
		//模版函数
		view1_row : function(d){
			if( !d ) return "";
			var self = this,
				opt = self.configs,
				data = opt.data,
				gid = opt.gid;
			//var  group_id = ( typeof d.data["_groupid_"] != "undefined" )? "datagrid-group-id="+d.data["_groupid_"] : "";
			var group_id = [];
			if( typeof d.data["_groupid_"] != "undefined" ) {
				group_id.push('datagrid-group-id=');
				group_id.push(d.data["_groupid_"]);
			}
			group_id = group_id.join("");
			
			var modelTr = ((d.i+1)%2 ? "datagrid-row-single" : "datagrid-row-double");
			//var tdId = opt.id+'_row_'+d.i+'_td_rownumber';
			var tdId = [];
				tdId.push(opt.id);
				tdId.push('_row_');
				tdId.push(d.i);
				tdId.push('_td_rownumber');
				tdId = tdId.join("");
			
			//var cellId = opt.id+'_row_'+d.i+'_cell_rownumber';
			var cellId = [];
				cellId.push(opt.id);
				cellId.push('_row_');
				cellId.push(d.i);
				cellId.push('_cell_rownumber');
				cellId = cellId.join("");
			
			//var tr = ['<tr id="'+d.id+'-view1-row-'+d.i+'" '+group_id+' datagrid-rid="'+d.i+'" datagrid-row-select="0" class="datagrid-row datagrid-row-view1 '+modelTr+'">'];
			var tr = [];
			tr.push('<tr id="');
			tr.push(d.id);
			tr.push('-view1-row-');
			tr.push(d.i);
			tr.push('" ');
			tr.push(group_id);
			tr.push(' datagrid-rid="');
			tr.push(d.i);
			tr.push('" class="datagrid-row datagrid-row-view1 ');
			tr.push(modelTr);
			tr.push('">');
			if( opt.rowNumbersWidth!==false ) {
				//tr.push('<td id="'+tdId+'" align="center" class="datagrid-td-rownumber"><div id="'+cellId+'" class="datagrid-cell-rownumber" style="width:'+parseFloat(d.rowNumbersWidth)+'px;">'+(d.rowNumbersExpand === false ? ++d.i : opt.self.tpl(d.rowNumbersExpand,d.data))+'</div></td>');//--
				tr.push('<td id="');
				tr.push(tdId);
				tr.push('" align="center" class="datagrid-td-rownumber"><div id="');
				tr.push(cellId);
				tr.push('" class="datagrid-cell-rownumber" style="width:');
				tr.push(parseFloat(d.rowNumbersWidth));
				tr.push('px;">');
				var _expand_Num = "";
				if( d.rowNumbersExpand === false ) {
					_expand_Num = (opt.pageNumber-1)*opt.pageSize + ( ++d.i );
				} else if( d.rowNumbersExpand == 'auto' ) {
					_expand_Num = ++d.i;
				} else if( $.isFunction( d.rowNumbersExpand ) ) {
					_expand_Num	= d.rowNumbersExpand.call(self,d.data);
				} else {
					_expand_Num = opt.self.tpl(d.rowNumbersExpand,d.data);	
				}
				//var _expand_Num = d.rowNumbersExpand === false ? ++d.i : opt.self.tpl(d.rowNumbersExpand,d.data);
				tr.push( _expand_Num );
				tr.push('</div></td>');
			}
			
			tr.push('</tr>');

			return tr.join("");
		},
		//该函数 需要用到加载lockrow or lockcolumn才有效
		resetHeader : function(){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			if( ('lockColumns' in opt) && opt.lockColumns.length) {
				var j = 0,
					len = opt.lockColumns.length;
				for(;j<len;j++) {
					if(opt.lockColumns[j] != null) {
						self.setGridHeader();
						return;
					}	
				}	
			}
			if( ('lockRows' in opt) && opt.lockRows.length) {
				var j = 0,
					len = opt.lockRows.length;
				for(;j<len;j++) {
					if(opt.lockRows[j] != null) {
						self.setGridHeader();
						return;
					}	
				}	
			}
		},
		_selectLazyRows : function(rid){
			var self = this,
				opt = self.configs;			
			if( opt.lazyLoadRow ) {
				var selectRows = self.getSlectRows();
				if( self.inArray( rid,selectRows ) != -1 ) {
					//self.denyEventInvoke('selectRow',[rid]);	
					self.selectRow(rid);
				}	
			}					
		},
		//已知bug:如果 加载一条虚拟行,即opt.data中不存在改条数据时,如果在大于第一页的情况下rowNumber实际会比rid 大 pageNumber*pageSize
		//可设置rowNumbersExpand = auto 来修正
		/*
		* 动态加载一行 类似_insert addRow
		*  @rid   {int} 行id
		*  @m   {boolean} 同_insert的@ai
		*  @return {boolean} 
		*/
		_loadRow : function( rid,m ){
			var self = this,
				opt = self.configs,
				data = opt.data;
			var len = opt.pageTotal || data.length;	
			//if( !len || !data[rid] ) return;
			if( !len ) return;
			
			var m = self._undef(m,true);
			var tr_row = self.denyEventInvoke('_insert',rid,data[rid],m);	

			if( tr_row.isNew ) {
				//行事件绑定
				if( opt.denyRowEvents === false ) {
					self.bindRowEvent(tr_row.tr,tr_row.ltr);
				} else if( $.isFunction(opt.denyRowEvents) ) {
					opt.denyRowEvents.call(self,tr_row.tr,tr_row.ltr);	
				}
				self.fireEvent("onLazyRowShow",[rid,tr_row,opt]);
			}
		},
		/*
		*刷新当前滚动条所在位置的行
		*/
		_loadRows : function(){
			
			var self = this,
				opt = self.configs,
				data = opt.data;
			var len = opt.pageTotal || data.length;
			
			if( !opt.lazyLoadRow || !len ) return;
			
			var vh = $("#view2-datagrid-body-"+opt.id)._height();
			//console.log(opt.sTop);
			opt.__vh = vh;
			
			var totalRow = (opt.lazyMaxRow ? opt.lazyMaxRow : Math.ceil(vh/opt._trHeight)) + opt.lazyTopRows + opt.lazyBottomRows;
			var start = Math.ceil(opt.sTop/opt._trHeight) - opt.lazyTopRows;
			start = start>0 ? start : 1;
			var end = totalRow + start;
			end = end<=len ? end : len;
			if( start >= len ) {
				end = len;	
				start = end - totalRow;
				start = start>0 ? start : 1;
			}
			
			var r = self.fireEvent("onBeforeLazyLoadRow",[start,end,totalRow,data,opt]);
			if( r === false ) return false;
			
			var vheader = (start-1)*opt._trHeight;
			var vfooter = (len-end)*opt._trHeight;
			
			$("#view2-datagrid-body-btable-tbody-header-"+opt.id).height(vheader);
			$("#view1-datagrid-body-btable-tbody-header-"+opt.id).height(vheader);
			
			$("#view2-datagrid-body-btable-tbody-footer-"+opt.id).height(vfooter);
			$("#view1-datagrid-body-btable-tbody-footer-"+opt.id).height(vfooter);
		
			self.lockMethod('resetViewSize');
			
			var _dr = [];
			
			//添加行时如果不把rid 加入lazyRows 则会出现新添加的行会删除不了问题
			$("#view2-datagrid-body-btable-tbody-"+opt.id).find(">tr.datagrid-row").each(function(i){
				var rid = $(this).attr("datagrid-rid");
				if( self.inArray( rid,opt.lazyRows ) == -1 ) {
					opt.lazyRows.push(rid);	
				}
			});
			
			for( var x=0;x<opt.lazyRows.length;x++ ) {
				
				if( opt.lazyRows[x]>=(start-1) && opt.lazyRows[x]<=(end-1) ) {
					continue;
				}
				var rid = opt.lazyRows[x];
				
				//if( self.inArray( rid,opt.lockRows )!=-1 ) continue;
				var lr = self.fireEvent("onBeforeLazyRowHide",[rid,opt]);
				if( lr === false ) {
					continue
				}
				
				self.denyEventInvoke('deleteRow',rid,false);
				
				self.fireEvent("onLazyRowHide",[rid,opt]);
				
				_dr.push(rid);
			}
			
			for( var _de=0;_de<_dr.length;_de++ ) {
				var drid = _dr[_de];
				var _ix = self.inArray( drid,opt.lazyRows );
				if( _ix != -1 ) {
					opt.lazyRows.splice(_ix,1);		
				}
			}

			var $lazyRows = opt.lazyRows;
			
			for(var i=start;i<=end;i++ ) {
				var rid = i-1;
				if( self.inArray( rid,$lazyRows ) != -1 ) {
					continue;	
				}
				//if( self.inArray( rid,opt.lockRows )!=-1 ) continue;
				var lr = self.fireEvent("onBeforeLazyRowShow",[rid,opt]);
				if( lr === false ) {
					continue
				}
				
				var tr_row = self.denyEventInvoke('_insert',rid,data[rid],false);	
				
				if( tr_row.isNew ) {
					//行事件绑定
					if( opt.denyRowEvents === false ) {
						self.bindRowEvent(tr_row.tr,tr_row.ltr);
					} else if( $.isFunction(opt.denyRowEvents) ) {
						opt.denyRowEvents.call(self,tr_row.tr,tr_row.ltr);	
					}
				}
				
				opt.lazyRows.push(rid);
						
				self.fireEvent("onLazyRowShow",[rid,tr_row,opt]);
				
			}
			
			opt.lazyRows.sort(function(a,b){
				return a>=b ? 1 : -1;						   
			});
			
			self.unLockMethod('resetViewSize');
			
		},
		/*
		* 刷新当前滚动条所在位置的行
		*  @m {boolean} true:强制刷新,false:不强制刷新 默认(可选)
		*/
		loadRows : function(m){
			var self = this,
				opt = self.configs;
			var len = opt.pageTotal || opt.data.length;

			if( !opt.lazyLoadRow ) return;
			
			var m = self._undef(m,false);
			
			var tq= opt._tq;
			if( tq ) {
				clearTimeout(tq);
			}

			var _func = function(){
				var initLazy = opt._initLazy;
				opt._initLazy = false;
				
				if( opt._trHeight<=0 ) {
					self.lockMethod('resetViewSize');
					self.denyEventInvoke('_insert',0,{},false);	
					opt._trHeight = $("#"+opt.id+"-row-0")._outerHeight();
					self.denyEventInvoke('deleteRow',0,false);
					self.unLockMethod('resetViewSize');
				}
				
				opt._hc = Math.min(opt.lazyBottomRows,opt.lazyTopRows) * opt._trHeight - opt._lazyEdge;
				
				var needLoad = false;
				if( !initLazy ) {
					if( Math.abs(opt.sTop-opt._csTop)<=opt._hc && !m  ) {
						return;	
					} else {
						//计算相差值 如果太多则显示loading
						opt.__vh = opt.__vh || $("#view2-datagrid-body-"+opt.id)._height();
						if( Math.abs(opt.sTop-opt._csTop)>= opt.__vh ) {
							needLoad = true;	
						}
						
						opt._csTop = opt.sTop;	
					}	
				} else {
					opt.lazyRows = [];
					opt._csTop = opt.sTop;
				}
				
				self.lockEvent('onScroll');
				if( (needLoad || initLazy) && opt.showLazyLoading ) {
					self.showLoading();	
				}
				setTimeout(function(){
									
					self._loadRows();
					
					if( (needLoad || initLazy) && opt.showLazyLoading ) {
						self.hideLoading();	
					}
					self.lockMethod('resetViewSize');
					self.fireEvent('onShowLazyRows',[opt.lazyRows,opt]);
					self.unLockMethod('resetViewSize');
					if( initLazy ) {
						//code
						self.afterGridShow(true);
					} else {
						self.onScroll(true);//必须	
					}
					self.unLockEvent('onScroll');
					
				},0);	
			};
			
			var t;
			t = setTimeout(function(){
				self.lockMethod('resetViewSize');
				self.fireEvent('onBeforeShowLazyRows',[opt]);
				self.unLockMethod('resetViewSize');
				_func();
			},50);
			opt._tq = t;
		},
		lazyLoadRow : function(){
			var self = this,
				opt = self.configs,
				data = opt.data;
			
			var len = opt.pageTotal || opt.data.length;
			
			var fields = opt.columns;
			
			var view2_tbodyId = $("#view2-datagrid-body-"+opt.id);
			var view1_tbodyId = $("#view1-datagrid-body-"+opt.id);
			
			var rows_view1 = ['<table class="datagrid-btable" id="view1-datagrid-body-btable-'+opt.id+'" cellspacing="0" cellpadding="0" border="0"><tbody id="view1-datagrid-body-btable-tbody-'+opt.id+'"><tr class="datagrid-row-header" id="view1-datagrid-body-btable-tbody-header-'+opt.id+'" style="height:0px;"></tr>'];
			var rows_view2 = ['<table class="datagrid-btable" id="view2-datagrid-body-btable-'+opt.id+'" cellspacing="0" cellpadding="0" border="0"><tbody id="view2-datagrid-body-btable-tbody-'+opt.id+'"><tr class="datagrid-row-header" id="view2-datagrid-body-btable-tbody-header-'+opt.id+'" style="height:0px;"></tr>'];
			
			if(  !$.isArray(data) ) {
				data = [];	
			}
			
			rows_view2.push('<tr class="datagrid-row-footer" id="view2-datagrid-body-btable-tbody-footer-'+opt.id+'" style="height:0px;"></tr></tbody></table>');
			rows_view1.push('<tr class="datagrid-row-footer" id="view1-datagrid-body-btable-tbody-footer-'+opt.id+'" style="height:0px;"></tr></tbody></table>');
			
			view2_tbodyId.html(rows_view2.join(""));
			view1_tbodyId.html( rows_view1.join("") );
			
			//取得行高
			if( opt._trHeight<=0 ) {
				self.lockMethod('resetViewSize');
				self.denyEventInvoke('_insert',0,{},false);	
				opt._trHeight = $("#"+opt.id+"-row-0")._outerHeight();
				self.denyEventInvoke('deleteRow',0,false);
				self.unLockMethod('resetViewSize');
			}
			var vh = opt._trHeight*len;
			
			$("#view2-datagrid-body-btable-tbody-header-"+opt.id).height( vh );
			$("#view1-datagrid-body-btable-tbody-header-"+opt.id).height( vh );
			
		},
		_clearBeforeShow : function(){
			var self = this,
				opt = self.configs;
			self.showLoading();	
			self._clearSelectRows();
		},
		setGridBody : function(render,func){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			//self.showLoading();	
			//刷新gridHeader 数据
			
			/*
			ajax 下 如果不设置columns则会出现列宽问题，解决方法:
			1.判断列是否手动设置
			2.如果没有则调用getColumns
			3.调用onInitFieldWidth
			已知BUG ,如果开启checkbox editcolumn 后，一定要手动设置columns
			*/
			var _sc = true;
			if( !opt.columns.length ) {
				_sc = false;
			}
			//console.log('^^3',opt.columns);
			self.getColumns();
			
			if( !_sc ) {
				self.setGridHeader();
				self.onInitFieldWidth();	
			}
			
			var func = func || $.noop;
			
			var br = self.fireEvent('onBeforeShowGrid',[opt]);
			if( br === false ) {
				return false;	
			}
			self._clearBeforeShow();
			
			if( opt.lazyLoadRow ) {
				opt._initLazy = true;
				
				var sLeft = opt.sLeft;
				var sTop = opt.sTop;
				//修正FF下 刷新grid 滚动条回到原点问题，修正chrome下水平滚动条回归原点
				self.one("onShowGrid.lazy",function(){
					opt.sLeft = sLeft;	
					opt.sTop = sTop;
				});

				self.lazyLoadRow();
				self._setViewSize();
				self.fireEvent('onScroll',[]);
		
				self.hideLoading();
				return true;
			}
				
			//修正IE 下刷新白屏问题
			setTimeout(function(){
				
				var data = opt.data;
				//记录当前滚动条位置
				//self.setRow(0,func);//grid 生成
				var sLeft = opt.sLeft;
				var sTop = opt.sTop;
				
				self._setViewSize();
				
				self.setRow(0,function(){
					func();	
					opt.sLeft = sLeft;
					opt.sTop = sTop;
				});
				
				self.hideLoading();
			},0);
			
			return true;
		},
		//setRow 结束后需要处理的问题
		afterGridShow : function(lazy){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			
			var lazy =  self._undef(lazy,false);	
			
			self.methodCall('setGridBody');
			
			self.lockMethod('resetViewSize');
			self.fireEvent('onShowGrid',[opt]);
			self.unLockMethod('resetViewSize');

			self.methodInvoke('resetViewSize',function(){
				//是否初始加载
				self.onFinishDone = self.onFinishDone || false;
				if(!self.onFinishDone) {
					self.onFinishDone = true;
					self.fireEvent('onFinish',[opt]);
				}										   
			});

		},
		removeEmptyDiv : function(){
			var self = this;
			self._clearEmptyMsg();
			return true;
		},
		_setEmptyMsg : function( msg ){
			var self = this,
				opt = self.configs,
				gid = opt.gid;		
				
			var w = $("#view2-datagrid-header-inner-htable-"+opt.id)._outerWidth();
			
			if( parseInt(w)<=0 ) {
				w = $("#view2-datagrid-header-"+opt.id)._outerWidth();	
			}
			
			var vbody = $("#view2-datagrid-body-"+opt.id)
			var h = vbody._height();
			if( w>vbody._width() ) {
				var sbar = self.getScrollbarSize();
				h -= sbar.width;
			}
			var obj = $("#"+opt.id+"_empty-grid-msg");

			if( obj.size() ) {
				obj.html( self.tpl( msg || opt.emptyGridMsg,opt ) );
				obj._outerWidth( w );
				obj._outerHeight( h );
				return obj;
			}
			//
			var dom = $('<div class="empty-grid-msg" id="'+opt.id+'_empty-grid-msg" style="height:100%;">'+self.tpl( msg || opt.emptyGridMsg,opt )+'</div>');
			$("#view2-datagrid-body-"+opt.id).append( dom );
			dom._outerWidth( w );
			dom._outerHeight( h );		
			return dom;
		},
		_clearEmptyMsg : function(){
			var self = this,
				opt = self.configs;
			
			$("#"+opt.id+"_empty-grid-msg").remove();	
			
			return true;		
		},
		/*自动判断当前grid是否没有数据 并显示提示信息*/
		isEmptyGrid : function(){
			var self = this,
				opt = self.configs;
			
			if( !opt.showEmptyGridMsg ) {
				return;	
			}

			if( opt.data.length>=1 ) {
				self._clearEmptyMsg();	
			} else {
				self._setEmptyMsg();	
			}
		},
		//footerCellEvents : function(rowId,e) {},
		//bindFooterRowEvent : function( tr,ltr ){},
		//解析用户自定义行
		//parseFooterTpl : function(tr,rid,d){},
		//模版函数
		//view2_footer_row : function(d){},
		//模版函数
		//view1_footer_row : function(d){},
		//showFooter : function(){},
		//hideFooter : function(){},
		//行 生成
		//setFooterRow : function(){},
		//updateFooterData : function( data ){},
		//updateFooterRow : function( data ){},
		//setGridFooter : function(){},
		addFooterItems : function(elem1,elem2){
			var self = this,
				opt = self.configs;
			var $footer2 = $("#view2-datagrid-footer-inner-"+opt.id);
			var $footer1 = $("#view1-datagrid-footer-inner-"+opt.id);
			$footer1.append(elem1);
			$footer2.append(elem2);
			self.methodInvoke('resetViewSize');
		},
		//未完成
		onScroll : function(auto){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var render = render || gid+" .datagrid-view2";
			var render1 = gid+" .datagrid-view1";
			auto = self._undef(auto,false);	
			if(auto) { // IE 下 300ms ++
				if( opt.sLeft>=0 )
					opt.gbody.scrollLeft(opt.sLeft);
				if( opt.sTop>=0 )
					opt.gbody.scrollTop(opt.sTop);
			}
			
			//if(!auto) {
				opt.sLeft = opt.gbody._scrollLeft();
				opt.sTop = opt.gbody._scrollTop();
			//}
			
			//$(render+" .datagrid-header .datagrid-header-inner .datagrid-header-inner-wraper")._scrollLeft( opt.sLeft );
			$("#datagrid-view2-header-inner-wraper-"+opt.id)._scrollLeft( opt.sLeft );
			//$(render+" .datagrid-header .datagrid-header-outer .datagrid-header-outer-wraper")._scrollLeft( opt.sLeft );
			$("#datagrid-view2-header-outer-wraper-"+opt.id)._scrollLeft( opt.sLeft );
			
			//footer
			$("#view2-datagrid-footer-inner-"+opt.id)._scrollLeft( opt.sLeft );
			
			//$(render1+" .datagrid-body")._scrollTop( opt.sTop );
			$("#view1-datagrid-body-"+opt.id)._scrollTop( opt.sTop );

		},
		onScrollBar : function(){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			
			//计算是否滚动到底
			var tbody = $("#view2-datagrid-body-"+opt.id);
			
			var sw = 0;
			
			if( tbody[0].scrollWidth>tbody._width() ) {
				sw = self.getScrollbarSize().width;	
			}
			
			var scrollHeight = tbody[0].scrollHeight;
			
			if( (opt.sTop + tbody.innerHeight() - sw)>=scrollHeight ) {
				self.fireEvent('onScrollEnd');
			}
		},
		//统一使用该函数来实现表格展示
		showGrid : function(successBack,errorBack,async){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var render = render || gid+" .datagrid-view2";
			
			var successBack = successBack || $.noop;
			var errorBack = errorBack || $.noop;
			var async = self._undef(async,false);	

			
			self.getGridData(function(){
				self.fireEvent('onGetGridData',[opt.data,opt]);//onGetData 修改为onGetGridData
				successBack.apply(this,arguments);	
			},function(){
				errorBack.apply(this,arguments);
			},async);
		},
		/*
		* 刷新表格数据
		*/
		refreshData : function(){
			var e = this.configs.events;
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var render = render || gid+" .datagrid-view2";
			//e.onBeforeRefresh.call(self);	
			self.fireEvent('onBeforeRefresh',[opt]);
			self.showGrid(function(){
				self.setGridBody(render,function(){
					//e.onRefresh.call(self);	
					self.fireEvent('onRefresh',[opt]);
				});						  
			});
		},
		/*
		* 更新当前分页表格数据
		* @data {Array} 当前页数据集
		*/
		updateGrid : function(data){
			var self = this,
				opt = self.configs;
			self.setGridData(data,false,true);
		},
		/*
		* 更新grid表格数据
		* @data {Array} 数据集
		*/
		updateGridData : function(data){
			var self = this,
				opt = self.configs;
			self.setGridData(data,true,true);
		},
		/*
		* 刷新表格数据(无ajax刷新)
		*/
		refreshDataCache : function(){
			var self = this;
			self.setGridBody();
		},
		/*
		*设置行高
		*/
		setRowHeight : function(rid,height){
			var self = this,
				opt = self.configs;
			$("#"+opt.id+"-view1-row-"+rid)._outerHeight( height );	
			$("#"+opt.id+"-row-"+rid)._outerHeight( height );	
			var t = self._undef( opt.__srh,0 );
			if( t ) {
				clearTimeout(t);	
			}
			opt.__srh = setTimeout(function(){
				opt.__srh = 0;	
				self.lockEvent("onScroll");
				self.methodInvoke('resetViewSize');
				self.unLockEvent("onScroll");
			},t);
			return self;
		},
		clearCache : function(){
			var opt = this.configs;
			//缓存清除
			opt.views = [];//清空视图缓存
			opt.isCreate = false;//已经废弃
			this.onFinishDone = false;
			opt.isShow = false;
			opt.pki = 0;
		},
		clearDataCache : function(){
			var opt = this.configs;
			opt.cacheData = {};
			return this;
		},
		//重新生成grid 慎用 setAll是否重置所有数据 否则保留source columns
		reLoadGrid : function(cfg,setAll/*废弃*/){
			//var setAll = self._undef(setAll,false);
			this.clearCache();
			this.clearDataCache();
			var _d = [];
			if(cfg.data) {
				_d = cfg.data ;
				cfg.data = [];
			}
			var opt = $.extend(true,{},cfg);
			opt.data = _d;
			cfg.data = _d;
			dataGrid.call(this,opt);
		},
		width : function(width){
			var self = this;
			var opt = self.configs;
			self.resetGridSize(width,opt.height);
			return self;	
		},
		height : function(height){
			var self = this;
			var opt = self.configs;
			self.resetGridSize(opt.width,height);
			return self;		
		},
		initWH : function(w,h){
			var self = this,
				opt = self.C();
			opt.__width = w;
			opt.__height = h;
			self.setWH(w,h);
		},
		setWH : function(width,height){
			var self = this;
			self.resetGridSize(width,height);
			return self;
		},
		/*
		* @m      {boolean} true:强制更新,false:大小都没变化时不更新大小返回false 默认(可选)
		*/
		resize : function(m){
			var self = this;	
			var opt = self.configs;
			
			//var render = $(opt.renderTo);
			//var _body = $(document.body);
			//_body.addClass('nex-overflow-hidden');
			//render.addClass('nex-overflow-hidden');
			setTimeout(function(){
				self._setBodyOverflowHidden();		
				var size = self.getResizeWH();
				self.resetGridSize(size.width,size.height,m);		
				//_body.removeClass('nex-overflow-hidden');
				//render.removeClass('nex-overflow-hidden');
			},0);
			
		},
		createGrid : function(render){
			
			var self = this,
				opt = self.configs,
				gid = opt.gid;
				
			
			var render = render || gid+" .datagrid-view2";
			
			self.setGridHeader(render);
			
			self._setGridViewWH();
			
			//opt.gbody = self.setGridBody(render);//grid数据列表
			self.showGrid(function(){
				self.setGridBody(render);
			});

			self.methodCall('createGrid');
			return self;
		}, 
		//对数据进行排序,返回排序后的结果，不支持中文排序 可对没显示字段进行排序
		sortData : function(field,data,type) {},
		//数据管理 addData 添加表格数据 updateData更新表格数据 removeData删除表格数据
		//如果是opt.url 存在则发送数据到服务器
		//如果async = true的话 就所有操作都在本地进行
		//最好通过自己的函数向服务器添加数据然后调用refreshData 如果本地的话就无所谓
		onDataChange : function(data){
			var self = this,
				opt = self.configs;	
			self.refreshData();
		},
		addData : function(data){
			var self = this,
				opt = self.configs;
				
			var async = self.getAsync();
			
			var datas = self._undef( datas , [] );
			datas = $.isPlainObject(datas) ? [datas] : datas;
			
			var pk = opt.pk;
			//本地添加
			if( async ) {
				var _d = self.getData();
				var len = datas.length;
				for(var n=0;n<len;n++) {
					var data = datas[n];
					data[pk] = self._undef( data[pk] , self.unique() );
					_d.push(data);
				}
				self.fireEvent("onAdd",[datas,true]);
				self.fireEvent("onDataChange",self,[datas]);
			} else {
				//远程处理		
				self.fireEvent("onAjaxAdd",[datas,function(){self.onDataChange(datas);}]);
			}
		},
		updateData : function(datas){
			var self = this,
				opt = self.configs;
				
			var async = self.getAsync();
			
			var datas = self._undef( datas , [] );
			datas = $.isPlainObject(datas) ? [datas] : datas;
			var pk = opt.pk;
			var setPk = false;
			//本地更新
			if( async ) {
				var len = datas.length;
				for(var n=0;n<len;n++) {
					var data = datas[n];
					if( !$.isPlainObject(data)) continue;
					setPk = self._undef( data[pk] , false );
					if(setPk === false) {
						continue;
					}
					
					var _d = self.getData();
					var i = 0;
					var xdlen = _d.length;
					for(;i<xdlen;i++) {
						if(_d[i][pk] == data[pk]) {
							_d[i] = data;
							break;
						}	
					}
				}
				self.fireEvent("onUpdate",[datas,true]);
				self.fireEvent("onDataChange",[datas]);
			} else {
				//远程处理	
				self.fireEvent("onAjaxUpdate",[datas,function(){self.onDataChange(datas);}]);
			}
		},
		deleteData : function(datas){
			var self = this,
				opt = self.configs;
				
			var async = self.getAsync();
			
			var datas = self._undef( datas , [] );
			datas = $.isPlainObject(datas) ? [datas] : datas;
			var pk = opt.pk;
			var setPk = false;
			//本地删除
			if( async ) {
				var _d = self.getData();
				var len = datas.length;
				for(var n=0;n<len;n++) {
					var data = datas[n];
					if( !$.isPlainObject(data)) continue;
					setPk = self._undef( data[pk] , false );
					if(setPk === false) {
						continue;
					}
					var i = 0,
						len = _d.length;
					for(;i<len;i++) {
						if(_d[i][pk] == data[pk]) {
							break;
						}	
					}
					var j = 0;
					var __d = [];//删除后的新数据
					for(;j<len;j++) {
						if( i == j ) continue;
						__d.push(_d[j]);	
					}
					_d = __d;
				}
				//opt.cacheData['source'] = __d;
				
				self.fireEvent("onDelete",[datas,true]);
				self.fireEvent("onDataChange",[datas]);
			} else {
				//远程处理	
				self.fireEvent("onAjaxDelete",[datas,function(){self.onDataChange(datas);}]);
			}
		},
		//判断当前的操作是 服务器还是本地 true 表示本地操作
		getAsync : function(){
			var self = this,
				opt = self.configs,
				gid = opt.gid;	
			return (opt.url == "" || opt.url===false)  ? true : false;
		},
		/*
		* 更新grid表格数据
		* @data  {Array} 数据集
		* @async {Boolean} 当前数据获取模式 true:本地,false:远程服务器(可选)
		* @s     {Boolean} true:刷新表格,false:不刷新表格 默认(可选)
		*/
		setGridData : function(data , async , s){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var data = self._undef(data,false);	
			if( !data ) return false;
			var async = self._undef(async,null);	
			var s = self._undef(s,false);	
			if(async == null) {
				async = self.getAsync();
			}
			
			if( async ) {
				opt.cacheData['source'] = data;
			} else {
				opt.data = data;	
			}
			//数据重置后 PK值也的重置
			if(opt.pk == '_pk') {
				self.fireEvent("onSetPk",[data]);
			}
			
			//数据源改变时调用
			if( s ) {
				if( async )
					self.showGrid(function(){
						self.setGridBody();							   
					},$.noop,true);	
				else 
					self.refreshDataCache();
			}
			return true;
		},
		page : function( i ){
			var self = this,
				opt = self.configs;
			var i = self._undef(i,1);	
			opt.pageNumber = parseInt( i ) <= 0 ? 1 :  parseInt( i );
			self.refreshData();
		},
		//获取每页数据
		getPageData : function(){
				
		},
		/*
		* ajax返回数据过滤函数,可通过参数或者已知函数声明eg : xmlFilter,htmlFilter
		*/
		jsonFilter : function(data){
			return data;	
		},
		/*
		* 设置ajax返回的数据
		* @json  {Array} 数据集
		* @s     {Boolean} true:刷新表格,false:不刷新表格 默认(可选)
		*/
		metaData : function( json,s ){
			var self = this,
				opt = self.configs;
			
			var data = json || {};
			var s = self._undef(s,false);	
			
			if( $.isArray(json) ) {
				data = {
					rows : data	
				};
			}
			
			//data.rows = data.rows || [];
			/*if( data.footer ) {
				opt.footerData = data.footer;
			}*/
			if( $.isArray(data.footer) ) {
				opt.footerData = data.footer;
			} else if( $.isPlainObject( data.footer ) ) {
				opt.footerData = [ data.footer ];
			} else {
				opt.footerData = [];	
			}
			
			if( $.isArray(data.rows) ) {
				opt.data = data.rows;
			} else if( $.isPlainObject( data.rows ) ) {
				opt.data = [ data.rows ];
			} else {
				opt.data = [];	
			}
			//opt.data = data.rows;
			opt.total = data.total || opt.data.length;
			opt.pageSize = self.isNumber( data.pageSize ) ? data.pageSize : opt.pageSize;
			opt.pageNumber = self.isNumber( data.pageNumber ) ? data.pageNumber : opt.pageNumber;
			
			//检查是否返回了column
			if(data.columns) {
				opt.columns = data.columns;
				self.setGridHeader();
			}
			
			for( var c in data ) {
				if( self.inArray( c,['footer','rows','total','pageSize','pageNumber','columns'] ) == -1 ) {
					opt[c] = data[c];
				}	
			}
			
			if( s )
				self.refreshDataCache();
		},
		_loadSuccess : function(data,successBack){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			
			var dataType = opt.dataType.toLowerCase();
			
			var filter = dataType+'Filter';
			
			var data = data;
			
			if( filter in opt ) {
				if( $.isFunction( opt[filter] ) ) {
					data = opt[filter].call(self,data);
				}
			} else if( filter in self ) {
				if( $.isFunction( self[filter] ) ) {
					data = self[filter].call(self,data);
				}	
			} else if( filter in window ) {
				if( $.isFunction( window[filter] ) ) {
					data = window[filter].call(window,data);
				}	
			}
						
			self.fireEvent('onLoadSuccess',[data,successBack,opt]);
			
			//json
			self.metaData(data);
		},
		_loadError : function(msg,errorBack,xmlHttp){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
				
			var emsg = '<div class="datagrid-error-msg" title="'+xmlHttp.status+':'+xmlHttp.statusText+'">'+opt.loadErrorMsg+'</div>';
			
			self.showLoading(emsg);
			
			self.fireEvent('onLoadError',[emsg,msg,errorBack,xmlHttp,opt]);
			
			setTimeout(function(){
				self.hideLoading();	
				self.refreshDataCache();
			},opt.showErrorTime);
		},
		//获取ajax返回的data数据
		getGridData : function(successBack,errorBack,async){
			var self = this,
				undef,
				opt = self.configs,
				gid = opt.gid;
			
			var successBack = successBack || $.noop;
			var errorBack = errorBack || $.noop;
			
			var render = gid+" .datagrid-view2";
			
			var async = self._undef(async,false);	
			if(async == false) {
				async = self.getAsync();
			}
			
			//ajax部分
			opt.queryParams.pageNumber = opt.pageNumber;
			opt.queryParams.pageSize = opt.pageSize;
			
			self.methodCall('getGridData');
			//onGetGridData
			var _xr = self.fireEvent('onBeforeGetGridData',[successBack,errorBack,async]);
			if( _xr === false ) return;
			
			if(async) {
				self.showLoading();	
				//本地数据都会存储到source 只有显示部分才会放到data里 远程数据就都放在data 不会存放到source
				opt.cacheData['source'] = opt.cacheData['source'] || opt.data;
				
				self.fireEvent('onSetPk', [opt.cacheData['source']]);
				
				/*if(opt.sortName != '') {
					opt.cacheData['source'] = self.sortData();		
				}*/
				
				opt.total = opt.cacheData['source'].length;
				
				var start = (opt.pageNumber-1) * opt.pageSize;
				var end = opt.pageSize * opt.pageNumber;
				end = end>opt.total ? opt.total : end;
				var data = [];
				for(var i = start;i<end;i++){
					if( opt.cacheData['source'][i] )
						data.push(opt.cacheData['source'][i]);
				}
				opt.data = data;
				
				self.hideLoading();
				
				successBack.call(self,render);
				
				return;	
			}
			
			//ajax部分
			//opt.queryParams.pageNumber = opt.pageNumber;
			//opt.queryParams.pageSize = opt.pageSize;
			/*if(opt.sortName != '') {
				//opt.queryParams.sortName = opt.sortName;
				opt.queryParams.sortName = self.getColumnData(opt.sortName,'index');
				opt.queryParams.sortOrder = opt.sortOrder;
			}*/
			//var e = self.configs.events;
			var beforeSend = function(){
						var r = self.fireEvent('onBeforeLoad',[opt.queryParams,opt]);
						if( r === false ) return false;
						self.showLoading();	
					};
			var success = function(data){
				
						self._loadSuccess(data,successBack);
						
						self.fireEvent('onSetPk', [opt.data]);
						
						self.hideLoading();
						
						successBack.call(self);
						
					};
			var error = function(xmlHttp){
						//e.onLoadError.call(self,xmlHttp.responseText);
						var xmlHttp = $.isPlainObject( xmlHttp ) ? xmlHttp : {responseText:xmlHttp};
						
						self._loadError(xmlHttp.responseText,errorBack,xmlHttp);
						
						errorBack.call(self,xmlHttp.responseText);
					};
			var complete = function(data){
						self.fireEvent('onLoadComplete',[data,opt]);
					};	
			var _r = beforeSend();
			if( _r === false ) return;
			
			if( $.isFunction( opt.url ) ) {
				
				/*var _r = beforeSend();
				if( _r === false ) return;*/
				
				var rdata = opt.url.call(self,opt.queryParams,success,error);
				if( rdata !== undef ) {
					success( rdata );	
					complete();
				}
				
			} else {
				var ajaxOptions = {
					url : opt.url,
					type : opt.method,
					cache : opt.cache,
					dataType : opt.dataType,
					data : opt.queryParams,
					//beforeSend : beforeSend,
					success : success,
					error : error,
					complete : complete
				};
				self.fireEvent('onBeforeCreateAjax',[ajaxOptions,opt]);
				self.ajaxSend(ajaxOptions);	
			}
			
		},
		ajaxSend : function(ajaxOptions){
			var self = this;
			var opt = self.configs;
			if( $.isFunction( opt.ajaxSend ) ) {
				opt.ajaxSend.call( self,ajaxOptions )	;
			} else {
				$.ajax(ajaxOptions);
			}
		},
		setPk : function(data) {//data 必须是数组 这里是引用
			var self = this;
			var opt = self.configs;
			if(opt.pk != '_pk') return;
			//opt.pki = 1;
			$.each(data,function(i,n){
				var aid = Nex.aid++;
				data[i][opt.pk] = aid;//opt.pki++;			 
			});
		},
		show : function (){
			var self = this;
			var opt = self.configs;
			var views = opt.views;
			var container = $("#"+opt.id);
			//防止重复调用
			if(opt.isShow) {
				return;	
			}
			opt.isShow = true;
			
			var r = self.fireEvent('onBeforeShowContainer',[views]);
			if( r === false ) return;
			
			for(var i in views) {
				container.append( views[i] );	
			}
			
			self._setGridWH();
			
			self.setView();// 显示grid的容器
			
			self.fireEvent("onViewCreate",[]);
			
			self.createGrid();//gird数据显示开始...
			
			self.methodCall('show');
			self.fireEvent('onShowContainer',[views]);
			
			self.fireEvent('onCreate',[opt]);
			
		}
	});
	
	$.fn._scrollLeft=function(_10){
		if(_10==undefined){
			return this.scrollLeft();
	
		}else{
			return this.each(function(){
				//$(this)._scrollLeft(_10);			  
				$(this).css("marginLeft",_10*-1);
			});
		}
	};
		
	$.fn._scrollTop=function(_10){
		if(_10==undefined){
			return this.scrollTop();
		}else{
			return this.each(function(){
				//$(this).scrollTop(_10);
				$(this).css("marginTop",_10*-1);
			});
		}
	};
	
	$.fn.grid = function(_opt){
		if(this.size()<=0){
			//alert('容器不正确');
			return false;
		}
		var list = [],_opt=_opt||{};
		var _d = [];
		if( _opt.data ) {
			_d = _opt.data;
			_opt.data = [];
		}
		
		this.each(function(i){
			var self = $(this);
			
			if( self.data('datagrid') ) {
				list.push(self.data('datagrid'));
				return; 	
			}
			
			var u = {};
			
			if( self.attr('data-options') ) {
				u = eval("({"+self.attr('data-options')+"})");	
			}
			
			var opt = $.extend(true,u,_opt);
			
			opt.selector = self.selector;
			opt.renderTo = self;
			
			
			//opt.width = dataGrid._undef(opt.width,self.width());
			//opt.height = dataGrid._undef(opt.height,self.height());
			
			if( _opt.data ) {
				opt.data = _d;
			}
			
			self.data('metaData',opt);	
			
			var grid = new dataGrid(opt);
			
			self.data('datagrid',grid);	
			
			list.push(grid);
		});
		
		if( this.size() == 1 ) {
			return this.data('datagrid');
		} else {
			return list	;
		}
	};
	$.fn.datagrid = $.fn.datagrid || $.fn.grid;
	$.fn.dataGrid = $.fn.dataGrid || $.fn.grid;
	$.fn.extGrid = $.fn.grid;
	$.fn.extgrid = $.fn.grid;
	$.fn.nexGrid = $.fn.grid;
	$.fn.nexgrid = $.fn.grid;
	//迁移到togrid.js
	$.fn.togrid = function(cfg,_cfg){};
	$.fn.toGrid = $.fn.togrid;
	//resizeable
	$.fn._resize = function(opt){
		var opt = opt || {};
		var opt = $.extend({},opt);
		
		var self = this;
		function start(e,opt) {
			
			dataGrid.__resizing = true;
			
			$(document.body).css("cursor", "col-resize");
			$(document.body).disableSelection();
			//$(document.body).css("-moz-user-select", "none");
			//$(document.body).attr("unselectable", "on");
			opt.gheader.find(".datagrid-header-inner").css("cursor", "col-resize");
			opt.gheader.find("div.datagrid-cell").css("cursor", "col-resize");
			
			var _f = opt.self.getColumnData(opt.field,'_colid');
			var rtd = $('#'+opt.id+'_cols_'+_f);
			
			var line = $("<div class='datagrid-resize'></div>");
			var line2 = $("<div class='datagrid-resize'></div>");
			var render = $("#view_"+opt.id);
			render.append(line);
			render.append(line2);
			var offset = $(this).offset();
			var left = offset.left - render.offset().left;
			var height = render.height();
			var width = $(this).width();
			left = parseFloat(left)+parseFloat(width);
			line2.css({
				position:'absolute',
				'top':0,
				'zIndex':9999,
				'height':parseFloat(height),
				'left':left - rtd.outerWidth()
			});
			line.css({
				position:'absolute',
				'top':0,
				'zIndex':9999,
				'height':parseFloat(height),
				'left':left
			});
			opt.line = line;
			opt.line2 = line2;
			opt.x = e.clientX;
			opt.left = left;
			
			opt.offsetX = 0;
			
			/*$(document.body).bind("selectstart._resize", function(e){
				return false;
			});*/
			
			$(document).bind("mousemove._resize", function(e){
				//var r = opt.events.onResizeColumn(e,opt);
				var r = opt.self.fireEvent('onResizeColumn',[opt,e]);
				if(r === false) return;
				resize(e,opt);
			});
			$(document).bind("mouseup._resize", function(e){
				setTimeout(function(){
					dataGrid.__resizing = false;						
				},0);
				if( opt.offsetX ) {
					var r = opt.stop(e,opt);
					//if(r === false) return;
				}
				stop(e,opt);
			});
		}
		function resize(e,opt){
			
			var x = e.clientX;
			var left = opt.left + (x - opt.x);
			opt.offsetX = (x - opt.x);
			opt.line.css({
				'left':left
			});
		}
		function stop(e,opt){
			//opt.self.resizing = false;
			var render = "#view_"+opt.id;
			$(document).unbind("mousemove._resize");
			$(document).unbind("mouseup._resize");
			
			//$(document.body).unbind("selectstart._resize");
			
			$(document.body).css("cursor",'default');
			//$(document.body).removeAttr("unselectable");
			$(document.body).enableSelection();
			
			opt.gheader.find(".datagrid-header-inner").css("cursor", "default");
			opt.gheader.find("div.datagrid-cell").css("cursor", "default");
			
			$(opt.line).remove();
			$(opt.line2).remove();
		}
		self.each(function(idx){
			var p = $(this).parent();
			$('.datagrid_resize',p).remove();
			var resize = $("<div class='datagrid_resize'></div>");
				resize.bind({
					"mousedown._gresize":function(e){
						//opt.self.resizing = true;
						opt.field = p.attr("field");
						//var r = opt.events.onResizeColumnStart.call(this,e,opt);
						var r = opt.self.fireEvent('onResizeColumnStart',[this,opt,e]);
						if(r === false) return;
						start.call(this,e,opt);
						e.preventDefault();
						e.stopPropagation();
					},
					"click._gresize" : function(e){
						e.preventDefault();
						e.stopPropagation();
					}
				});
				p.append(resize);
		});
	};
	$.fn.moveColumn = function(opt) {
		var columns = this;
		var moving = false;
		dataGrid.__moving = false;
		columns.bind("mousedown.move",function(e){
			var self = this;
			var _t = setTimeout(function(){
				start.call(self,e);
				$(document.body).unbind("mousemove.wt");
			},opt.moveColumnTm);
			$(document.body).bind("mouseup.wt",function(e){
				clearTimeout(_t);
				$(document.body).unbind("mouseup.wt");
				$(document.body).unbind("mousemove.wt");
				//$(document.body).unbind("selectstart.wt");
				$(document.body).enableSelection();
			});	
			$(this).one("mouseout.wt",function(e){
				  clearTimeout(_t);
			});		
			/*setTimeout(function(){
				$(document.body).bind("mousemove.wt",function(e){
					clearTimeout(_t);
					$(document.body).unbind("mousemove.wt");
				});		
			},0);*/
			$(document.body).disableSelection();
			//e.preventDefault();
			//e.stopPropagation();
		});
		columns.bind("mousemove.h",function(e){
			if(moving == false) return;
			var p = $("#"+opt.id).offset();
			var pt = p.top;
			var pl = p.left;
			
			var w = $(this).outerWidth();
			var h = $(this).height() - 2;
			
			var wt = $(this).offset().top - pt;
			var w1 = $(this).offset().left - pl - 2;
			
			var w2 = e.pageX;
			var w3 = w2 - $(this).offset().left;
			
			opt.moveToField = $(this).attr("field");

			
			if( w3<=w/2 ) {
				$("#"+opt.id+"_line").css({
					left : w1,
					top : wt,
					height : h
				});
			opt.moveToFieldPos = 1;
				//console.log("前面");
			} else {
				$("#"+opt.id+"_line").css({
					left : w1 + w,
					top : wt,
					height : h
				});
			opt.moveToFieldPos = 0;
				//console.log("后面");
			}
		});
		function start(e) {
			moving = true;
			dataGrid.__moving = true;
			opt.moveField = $(this).attr("field");
			
			var _r = opt.self.fireEvent("onBeforeColumnMove",[opt.moveField,opt]);
			if(_r === false) {
				return _r;	
			}
			
			var _target = $('<div class="column-move" id="'+opt.id+'_move" style="position:absolute;z-index:9999;">'+$(".datagrid-cell",this).html()+'</div>').appendTo("#"+opt.id);
			var line = $('<div class="column-move-line" id="'+opt.id+'_line" style="position:absolute;height:'+$(this).outerHeight()+'px;"></div>').appendTo("#"+opt.id);
			var pos = $("#"+opt.id).offset();
			_target.css({
				left : e.pageX - pos.left + 10,
				top : e.pageY- pos.top + 10
			 });
		
			$(document.body).bind("mousemove.move",function(e){
			 	 _target.css({
					left : e.pageX - pos.left + 10,
					top : e.pageY- pos.top + 10
				 });
				
				var r = opt.self.fireEvent("onColumnMoving",[_target,opt.moveField,opt.moveToField,opt]);
				if(r === false) {
					opt.moveToField = opt.moveField;
					return;	
				}
				
			});	
			$(document.body).bind("mouseup.move",function(e){
				moving = false;
				dataGrid.__moving = false;
				_target.remove();
				line.remove();
				$(document.body).unbind("mousemove.move mouseup.move");
				opt.self.moveColumn()
				//e.preventDefault();
				//e.stopPropagation();
			});
		}
	};
})(jQuery);
/*
jquery.extGrid.pagination.js
http://www.extgrid.com
author:nobo
qq:505931977
QQ交流群:13197510
email:zere.nobo@gmail.com or QQ邮箱
+----------------------------------------------------------------------------------------------------------------------------+
*/

;(function($){
	"use strict";
	//参数
	$.nexGrid.addExtConf({
						  pagination:false,
						  pagerToolBar:false,
						  pageList : [10,20,30,40,50],
						  pagerMsg:'当前显示 {start} 到 {end} 条，共 {total} 条'
						 });
	//事件
	$.nexGrid.addExtEvent({
						   onPagerCreate:$.noop,
						   onPageChange:$.noop,
						   onPageSizeChange:$.noop,
						   onPageItemSelect:$.noop
						 });
	//事件名映射
	$.nexGrid.addEventMaps({
						   onSelectPage:'onPageItemSelect',
						   onChangePageSize:'onPageSizeChange'
						 });
	//模板
	$.nexGrid._Tpl['pager'] = '<div class="datagrid-pager pagination" id="<%=id%>_pager">'
								+' <table cellspacing="0" cellpadding="0" border="0">'
									+'<tbody>'
										+'<tr>'
											+'<td><select class="pagination-page-list">'
											+'<% var s = ""; for(var i=0;i<pageList.length;i++) {%>'
												+'<% if(pageList[i] == pageSize) {%>'
												+'<% s="selected";%>'
												+'<% } else {s="";} %>'
											+'<option value="<%=pageList[i]%>" <%=s%> ><%=pageList[i]%></option>'
											+'<% } %>'
											+'</select></td><td><div class="pagination-btn-separator"></div></td>'
											+'<td><a href="javascript:void(0)" class="pagination-first-btn p-plain <%=(pageNumber <= 1 )?"p-btn-disabled":""%>"><span class="pagination-first  p-btn">&nbsp;</span></a></td>'
											+'<td><a href="javascript:void(0)" class="pagination-prev-btn p-plain <%=(pageNumber <= 1 )?"p-btn-disabled":""%>"><span class="pagination-prev  p-btn">&nbsp;</span></a></td>'
											+'<td><div class="pagination-btn-separator"></div></td>'
											+'<td><span style="padding-left:6px;" class="pager-text">第</span></td>'
											+'<td><input class="pagination-num" type="text" value="<%=pageNumber%>" size="2"></td>'
											+'<td><span style="padding-right:6px;"  class="pager-text">页 共 <%=pages%> 页</span></td>'
											+'<td><div class="pagination-btn-separator"></div></td>'
											+'<td><a href="javascript:void(0)" class="pagination-next-btn p-plain <%=(pageNumber >= pages)?"p-btn-disabled":""%>"><span class="pagination-next p-btn">&nbsp;</span></a></td>'
											+'<td><a href="javascript:void(0)" class="pagination-last-btn p-plain <%=(pageNumber >= pages)?"p-btn-disabled":""%>"><span class="pagination-last p-btn ">&nbsp;</span></a></td>'
											+'<td><div class="pagination-btn-separator"></div></td>'
											+'<td><a href="javascript:void(0)" class="pagination-load-btn p-plain"><span class="pagination-load p-btn">&nbsp;</span></a></td>'
											+'<td id="pagination-toolbar-<%=id%>"></td>'
										+'</tr>'
									+'</tbody>'
								+'</table>'
								+'<div class="pagination-info"><%=pagerMsg%></div>'
								+'<div style="clear:both;"></div>'
							+'</div>';
	$.nexGrid.puglins.push(function(){
		var self = this,
			opt = self.configs;
		//防止重复绑定	
		self.unbind("onBeforeShowContainer.pagination");
		self.unbind("onBeforeShowGrid.pagination");
		self.unbind("onSuccessAddRow.pagination");
		self.unbind("onAfterDeleteRow.pagination");
		
		//事件绑定
		self.bind("onBeforeShowContainer.pagination",function(){
			this.setPager(true);													  
		});
		self.bind("onBeforeShowGrid.pagination",self.setPager);
		self.bind("onSuccessAddRow.pagination",self.refreshPager);
		self.bind("onAfterDeleteRow.pagination",self.refreshPager);
	});
	$.nexGrid.fn.extend({
		refreshPager : function(){
			var self = this;
			var opt = self.configs;	
			self.setPager();
		},
		addPagerEvent : function(){
			var self = this;
			var opt = self.configs;
			var obj = opt.views['pager'];
			//var e = opt.events;
			obj.find("a.pagination-first-btn").click(function(){
				if($(this).hasClass("p-btn-disabled")) return;
				
				var r = self.fireEvent('onPageChange',[1,opt]);
				if(r === false) return false;
				
				opt.pageNumber = 1;
				
				self.refreshData();	
			});
			obj.find("a.pagination-prev-btn").click(function(){
				if($(this).hasClass("p-btn-disabled")) return;
				var pageNumber = opt.pageNumber - 1;
				pageNumber = pageNumber<=0 ? 1 : pageNumber;	
				
				var r = self.fireEvent('onPageChange',[pageNumber,opt]);
				if(r === false) return false;
				
				opt.pageNumber = pageNumber;
				
				self.refreshData();											 
			});
			obj.find("a.pagination-next-btn").click(function(){
				if($(this).hasClass("p-btn-disabled")) return;																				
				var total = opt.total || opt.data.length;
				var pages = Math.ceil( parseInt(total)/parseInt(opt.pageSize) );
				var pageNumber = opt.pageNumber + 1;
				pageNumber = pageNumber>pages ? pages : pageNumber;	
				
				var r = self.fireEvent('onPageChange',[pageNumber,opt]);
				if(r === false) return false;
				
				opt.pageNumber = pageNumber;
				
				self.refreshData();	
			});
			obj.find("a.pagination-last-btn").click(function(){
				if($(this).hasClass("p-btn-disabled")) return;
				var total = opt.total || opt.data.length;
				var pages = Math.ceil( parseInt(total)/parseInt(opt.pageSize) );
				
				var r = self.fireEvent('onPageChange',[pages,opt]);
				if(r === false) return false;
				
				opt.pageNumber = pages;
				
				self.refreshData();	
			});
			obj.find("a.pagination-load-btn").click(function(){
				if($(this).hasClass("p-btn-disabled")) return;
				self.refreshData();											 
			});
			obj.find(".pagination-page-list").change(function(){
				var total = opt.total || opt.data.length;
				var pageSize = $(this).val();
				var pages = Math.ceil( parseInt(total)/parseInt(pageSize) );
				var pageNumber = opt.pageNumber;
				
				if( opt.pageNumber>pages ) {
					pageNumber = pages;		
				}
				
				var r = self.fireEvent('onPageSizeChange',[pageSize]);
				if(r === false) return false;
				
				var r = self.fireEvent('onPageItemSelect',[pageSize]);
				if(r === false) return false;
				
				opt.pageSize = pageSize;
				
				var xr = self.fireEvent('onPageChange',[pageNumber,opt]);
				if(xr === false) return false;
		
				opt.pageNumber = pageNumber;		
		
				self.refreshData();	
			});
			obj.find(".pagination-num").keydown(function(e){
				if(e.keyCode === 13) {
					var pageNumber;
					pageNumber = parseInt( obj.find(".pagination-num").val() );	
					pageNumber = self.isNumber( pageNumber ) ? pageNumber : 1;
					
					pageNumber = pageNumber<=0 ? 1 : pageNumber;	
					
					var total = opt.total || opt.data.length;
					var pages = Math.ceil( parseInt(total)/parseInt(opt.pageSize) );
					pageNumber = pageNumber>pages ? pages : pageNumber;	
					
					var r = self.fireEvent('onPageChange',[pageNumber,opt]);
					if(r === false) return false;
					
					opt.pageNumber = pageNumber;
					
					self.refreshData();	
				}
			});
			return self;
		},
		setPager : function(init) {

			var self = this;
			var opt = self.configs;
			var init = self._undef(init,false);
			if( !opt.pagination ) return self;
			//计算分页
			var data = {};
			data.id = opt.id;
			data.total = opt.total || opt.data.length;
			data.pageSize = opt.pageSize;
			data.pageNumber = opt.pageNumber;
			data.pageList = opt.pageList;
			data.pages = Math.ceil( parseInt(data.total)/parseInt(data.pageSize) );
			//检查pageNumber的合法性
			opt.pageNumber = opt.pageNumber > data.pages ? data.pages : opt.pageNumber;
			opt.pageNumber = opt.pageNumber<=0 ? 1 : opt.pageNumber;
			data.pageNumber = opt.pageNumber;
			
			data.start = (data.pageNumber*data.pageSize - data.pageSize + 1)<0 ? 0 : (data.pageNumber*data.pageSize - data.pageSize + 1);
			data.end = data.pageNumber*data.pageSize;
			
			data.pagerMsg = opt.pagerMsg.replace("{start}",data.start).replace("{end}",data.end).replace("{total}",data.total);

			var _pager = $("#"+opt.id+"_pager");

			var tpl = self.tpl("pager",data);
			
			if(!_pager.size()) {
				opt.views['pager'] = $(tpl);
			} else {
				opt.views['pager'] = $(tpl);
				_pager.after( opt.views['pager'] );
				_pager.remove();
			}
			
			//是否初始化
			if(init === true) {
				return self;	
			}

			self.addPagerEvent();
			
			if( $.isArray( opt.pagerToolBar ) && opt.pagerToolBar.length ) {
				$("#pagination-toolbar-"+opt.id).append( self.getTools( opt.pagerToolBar ) );
			}

			self.fireEvent("onPagerCreate",[opt.views['pager']]);
	
			self.methodCall('setPager');
			
			return self;	
		}					 
	}); 
})(jQuery);
/*
jquery.extGrid.sort.js
http://www.extgrid.com
author:nobo
qq:505931977
QQ交流群:13197510
email:zere.nobo@gmail.com or QQ邮箱
+----------------------------------------------------------------------------------------------------------------------------+
*/

;(function($){
	"use strict";
	//参数
	$.nexGrid.addExtConf({
							sortable : true,//全局开关
							pageSort : false,//只对当前页做排序
							sortName : '',
							sortOrder : 'asc'
						 });
	//事件
	$.nexGrid.addExtEvent({
						   onBeforeSortColumn:$.noop,
						   onSortData:$.noop,
						   onSortColumn:$.noop
						 });
	
	$.nexGrid.puglins.push(function(){
		var self = this,
			opt = self.configs;
		//防止重复绑定	
		self.unbind("onColumnClick.sort");
		self.unbind("onBeforeGetGridData.sort");
		self.unbind("onGetGridData.sort");
		self.unbind("onHeaderCreate.sort");
		
		//事件绑定
		self.bind("onColumnClick.sort",self._sortColumn);
		self.bind("onHeaderCreate.sort",self._setSortIcon);
		self.bind("onBeforeGetGridData.sort",self._sortData);
	});
	$.nexGrid.fn.extend({
		_sortColumn : function(field,td,e){
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var field = field || false;
			if(field == false) return;
			
			if( !opt.sortable ) {
				return;	
			}
			
			//设置列是否可排序
			var sortable = self.getColumnData(field,'sortable');
			if( !sortable ) {
				return;
			} else {
				var _s = $(".datagrid-sort-icon",td);
				if( !_s.size() ) {
					$(".datagrid-cell",td).append($('<span class="datagrid-sort-icon">&nbsp;</span>'));
				}
			}
			
			opt.sortName = field;
			
			var v2 = $('#view2-datagrid-header-inner-htable-tbody-'+opt.id).find("div.datagrid-cell");
			var v1 = $('#view1-datagrid-header-inner-htable-tbody-'+opt.id).find("div.datagrid-cell");
			var hcell = $("div.datagrid-cell",td);
			 if( hcell.hasClass('datagrid-sort-asc') ) {
				v2.removeClass('datagrid-sort-desc datagrid-sort-asc');
				v1.removeClass('datagrid-sort-desc datagrid-sort-asc');
				hcell.addClass('datagrid-sort-desc');
				opt.sortOrder = 'desc';
			 } else {
				v2.removeClass('datagrid-sort-desc datagrid-sort-asc');
				v1.removeClass('datagrid-sort-desc datagrid-sort-asc');
				hcell.addClass('datagrid-sort-asc');	 
				opt.sortOrder = 'asc';
			 };
			 
			 self.refreshData();
		},
		_sortData : function( successBack,errorBack,async ){
			var self = this,
				opt = self.configs;
			if( opt.sortName=='' ) {
				return;
			}
			var sortField = opt.sortName;
			var _c = self.getColumnData(sortField);
			if( _c === null ) {
				opt.sortName = '';
				return;
			}
			var sortable = _c['sortable'];
			if( !sortable ) return;
			var index = _c['index'];
			
			var data = self.getData();
			var r = self.fireEvent("onBeforeSortColumn",[sortField,data,opt.sortOrder,successBack,errorBack,async]);
			if( r === false ) return r;
			
			if(async) {
				opt.cacheData['source'] = self.sortData();		
			} else {
				opt.queryParams.sortName = index;
				opt.queryParams.sortOrder = opt.sortOrder;	
			}	
			self.fireEvent("onSortColumn",[sortField,data,opt.sortOrder]);
		},
		_setSortIcon : function(){
			var self = this,
				opt = self.configs;	
			if( opt.sortName=='' ) {
				return;
			}
			var sortField = opt.sortName;
			
			var _c = self.getColumnData(sortField);
			if( _c === null ) {
				opt.sortName = '';
				return;
			}
			
			var sortable = _c['sortable'];
			if( !sortable ) return;
			//设置默认排序列
			var hcell = $("#view2-datagrid-header-inner-htable-tbody-"+opt.id).find(">tr.datagrid-header-row td[field='"+sortField+"']")
																  			  .find("div.datagrid-cell");
				var _s = $(".datagrid-sort-icon",hcell);
				if( !_s.size() ) {
					hcell.append($('<span class="datagrid-sort-icon">&nbsp;</span>'));
				}
				hcell.addClass('datagrid-sort-'+opt.sortOrder.toLowerCase());
		},
		//清空排序缓存
		clearSort : function(){
			var self = this,
				opt = self.configs;		
			opt.sortName = '';
			delete opt.queryParams.sortName;
			delete opt.queryParams.sortOrder;
		},
		//对数据进行排序,返回排序后的结果，不支持中文排序 可对没显示字段进行排序
		sortData : function(field,data,type) {//对field列进行排序 type = asc type= desc
			var self = this,
				opt = self.configs,
				gid = opt.gid;
			var field = self._undef(field,opt.sortName);
			if( field == '' ) return self;
			
			var fields = opt.columns;
			var _field = false;
			var index = false;
			
			for(var i=0;i<fields.length;i++) {
				if( fields[i]['field'] == field ) {
					_field = field;
					index = fields[i]['index'];
					break;	
				}
			}
			if( _field === false ) return self;
			//排序处理
			opt.cacheData['source'] = opt.cacheData['source'] || opt.data;
			var data = self._undef(data,opt.cacheData['source']);
			var type = self._undef(type,opt.sortOrder);
			var isAsc = type == "asc" ? true : false;
			
			data.sort(function(a,b){
				a[index] = self._undef(a[index],"");
				b[index] = self._undef(b[index],"");
				if( a[index] >  b[index] ) {
					return isAsc ? 1 : -1;
				} if( a[index] === b[index] ){
					return 0;
				} else {
					return isAsc ? -1 : 1;
				}
				/*if( a[index] >=  b[index]) return isAsc ? 1 : -1;
				return isAsc ? -1 : 1;*/
			});
			
			self.fireEvent("onSortData",[index,data,type]);
			
			return data;
		}				 
	}); 
})(jQuery);
/*
jquery.nexButton.js
http://www.extgrid.com/button
author:nobo
qq:505931977
QQ交流群:13197510
email:zere.nobo@gmail.com or QQ邮箱

*/

;(function($){
	"use strict";
	var button = Nex.widget('button');
	$.nexButton = $.extButton = button;
	button.extend({
		version : '1.0',
		getDefaults : function(opt){
			var _opt = {
				prefix : 'nexbutton-',
				renderTo : document.body,
				autoDestroy : true,
				width : 0,
				height : 0,
				isIE : !!window.ActiveXObject,
				url : '',//无效 不支持支持远程创建 返回数据格式  json
				cache : true,
				autoFocus : false,
				dataType : 'json',
				queryParams : {},
				method : 'get',
				parames : {},
				type : 'button',// type button file
				name : '',//file时使用
				splitBtn : false,
				toggleBtn : false,
				pressed : false,
				plain : false,
				skin : 'nex-btn-skin-default',//按钮主题
				cls : '',
				pressedCls : '',
				activeCls : '',
				overCls : '',
				focusCls : '',
				disabledCls : '',
				cssText : '',
				iconCls : '',
				disabled : false,
				callBack : $.noop,
				toggleHandler : $.noop,
				icon : '',
				text : '',
				views : {},
				menuConf : {},
				menu : [],
				events : {
					onStart : $.noop,
					onCreate : $.noop,
					onSizeChange : $.noop,
					onDestroy : $.noop
				}
			};
			
			var _opt = this.extSet(_opt);
			
			return $.extend({},_opt,opt);
		}
	});
	$.nexButton.fn.extend({
		_init : function(opt) {
			var self = this;
			
			self.createButton();
			
			self.fireEvent('onCreate');
		},
		createButton : function(){
			var self = this;
			var opt = self.configs;
			
			var method = opt.type+'Create';
			var bindEvent = opt.type+'BindEvent';
			
			var tpl = '';
			
			if( method in self ) {
				var r = self[method].call(self);
				if( r === false ) return false;
			
				if( bindEvent in self ) {
					self[bindEvent].call(self);
				} else {
					self.commonEvent();
				}
			} else {
				self.commonCreaet();
				if( bindEvent in self ) {
					self[bindEvent].call(self);
				} else {
					self.commonEvent();
				}
			}
			self.fireEvent('onCreate',[]);
			return true;
		},
		commonCreaet : function(){
			var self = this;
			var opt = self.configs;
			
			var render = $(opt.renderTo);
			
			var method = opt.type + 'Tpl';
			
			var _bg = '';
			if( opt.icon ) {
				_bg = "background-image:url("+opt.icon+")";
			}
			var icon = [];
			if( opt.icon || opt.iconCls ) {
				icon = ['<span class="nex-btn-inner nex-btn-icon ',opt.iconCls,'" style="',_bg,'"></span>'];
			}
			var text = [];
			if( opt.text != '' ) {
				text = ['<span class="nex-btn-inner nex-btn-text" style="">',opt.text,'</span>'];
			}
			var sep = [];
			if( opt.splitBtn ) {
				sep = ['<span class="nex-btn-inner nex-btn-sep"></span>'];		
			}
			var arrow = [];
			if( opt.menu.length || opt.splitBtn ) {
				arrow=['<span class="nex-btn-inner nex-btn-arrow"></span>'];
			}
			//hidefocus="true"
			var buttons = [
				'<span class="nex-btn ',opt.skin,' ','nex-btn-',opt.type,' ',opt.plain ? 'nex-btn-plain' : '',arrow.length>0?' nex-btn-split' : ' ',' ',opt.cls,'" id="',opt.id,'"','href="javascript:void(0);" ','><span class="nex-btn-wraper">',
				icon.join(""),
				text.join(""),
				sep.join(""),
				arrow.join(""),
				'</span></span>'
			];
			
			var btn = $(buttons.join(""));
			opt.views['button'] = btn;
			render.append( btn );
		},
		commonEvent : function(){
			var self = this;
			var opt = self.configs;
			var callBack = function(type,e){
				var r = true;
				r = self.fireEvent(type,[ this,e ]);
				if( r === false ) {
					e.stopPropagation();
					e.preventDefault();
				}
			};
			var events = {
				'focus' : function(e) {
					callBack.call(this,'onFocus',e);
				},
				'blur' : function(e) {
					callBack.call(this,'onBlur',e);
				},
				'click' : function(e) {
					callBack.call(this,'onClick',e);
				},
				'dblclick' : function(e) {
					callBack.call(this,'onDblClick',e);
				},
				'keydown' : function(e) {
					callBack.call(this,'onKeyDown',e);
				},
				'keyup' : function(e) {
					callBack.call(this,'onKeyUp',e);
				},
				'keypress' : function(e){
					callBack.call(this,'onKeyPress',e);
				},
				'mouseenter' : function(e){
					callBack.call(this,'onMouseOver',e);
				},
				'mouseleave' : function(e){
					callBack.call(this,'onMouseOut',e);
				},
				'mousedown' : function(e) {
					callBack.call(this,'onMouseDown',e);
				},
				'mouseup' : function(e) {
					callBack.call(this,'onMouseUp',e);
				},
				'contextmenu' : function(e){	
					callBack.call(this,'onContextMenu',e);
				}
			};
			
			var input = opt.views['button'];//$("#"+opt.id);
			
			input.attr( {
				tabIndex : Nex.aid++	//可触发onFocus		   
			} );
			
			input.bind(events);
			
			if( opt.splitBtn ) {
				$(".nex-btn-arrow",input).bind({
					'click' : function(e){
						if( opt.disabled ) return false;
						self.fireEvent('onSplitBtnClick',[ this,e ]);	
						return false;
					},
					'mousedown' : function(e){
					//	return false;	
					}
				});
			}
		},
		focus : function(){
			var self = this,
				opt = self.configs;
			var btn = opt.views['button'];
			btn.focus();
		},
		blur : function(){
			var self = this,
				opt = self.configs;
			var btn = opt.views['button'];
			btn.blur();
		},
		_setFocus : function(){
			var self = this,
				opt = self.configs;
			if( opt.autoFocus ) {
				clearTimeout( opt._ft );
				opt._ft = setTimeout(function(){
					self.focus();	
				},0);
			}
		},
		_setFoucsCls : function(btn){
			var self = this,
				opt = self.configs,
				btn = $(btn);
			btn.addClass("nex-btn-focus");
			$('>.nex-btn-wraper',btn).addClass("nex-btn-wraper-focus");	
			if( opt.focusCls ) {
				btn.addClass( opt.focusCls );	
			}
		},
		_unsetFoucsCls : function(btn){
			var self = this,
				opt = self.configs,
				btn = $(btn);
			btn.removeClass("nex-btn-focus");
			$('>.nex-btn-wraper',btn).removeClass("nex-btn-wraper-focus");		
			if( opt.focusCls ) {
				btn.removeClass( opt.focusCls );	
			}
		},
		_sysEvents : function(){
			var self = this;
			var opt = self.configs;
			self.bind("onCreate.file",self._setFile,self);
			self.bind("onCreate.over",self._setFocus,self);
			self.bind("onCreate.over",self.toggleBtnCls,self);
			self.bind("onCreate.over",self._onCreate,self);
			self.bind("onFocus.focus",self._setFoucsCls,self);
			self.bind("onBlur.focus",self._unsetFoucsCls,self);
			self.bind("onMouseDown.focus",self._setFoucsCls,self);
			self.bind("onMouseUp.focus",self._unsetFoucsCls,self);
			self.bind("onMouseOver.over",self.onMouseOver,self);
			self.bind("onMouseOut.over",self.onMouseOut,self);
			self.bind("onClick.click",self._click,self);
			self.bind("onClick.menu",self._showMenu,self);
			self.bind("onSplitBtnClick.menu",self._showSplitMenu,self);
			return self;
		},
		getFileName : function(){
			var self = this;
			var opt = self.C();	
			return $('#'+opt.id+'-btn-file').val();
		},
		_setFile : function(){
			var self = this;
			var opt = self.C();	
			if( opt.type.toLowerCase() != 'file' ) return;
			var btn = opt.views['button'];//self.getDom();
			var name = opt.name == '' ? opt.id+'_file' : opt.name;
			$('#'+opt.id+'-btn-file').remove();
			var file = $('<input id="'+opt.id+'-btn-file" hideFocus=true class="nex-btn-file-input" type="file" size="1" name="'+name+'" />');
			var wrap = btn.find('>span.nex-btn-wraper');
			
			var isIE67 = function(){
				if(navigator.userAgent.indexOf("MSIE 6.0")>0) 
				{ 
					return true;
				} 
				else if(navigator.userAgent.indexOf("MSIE 7.0")>0)  
				{ 
					return true;
				} 
				return false;
			}
			if( isIE67() ) {
				wrap.height( wrap._height() );
			}
			
			wrap.append( file );
			file.height( wrap._outerHeight() );
			file.bind( 'change',function(e){
				self.fireEvent('onFileChange',[ this,$(this).val(),e ]);	
			} );
		},
		_showMenu : function(btn,e){
			var self = this;
			var opt = self.configs;
			var btn = $(btn);
			if( opt.menu.length && !opt.splitBtn ) {
				
				if( btn.hasClass('nex-btn-active') ) {
					btn.removeClass('nex-btn-active');
					if( opt.activeCls ) {
						btn.removeClass(opt.activeCls);	
					}
					if( self._menu ) {
						self._menu.hideRoot();	
					}	
				} else {
					btn.addClass('nex-btn-active');
					if( opt.activeCls ) {
						btn.addClass(opt.activeCls);	
					}
					self._menu = new Nex.menu($.extend(opt.menuConf,{data:opt.menu},{
						onClick : function(obj,tid,data,e){
							btn.removeClass('nex-btn-active');		
							self.fireEvent('onItemClick',[ obj,tid,data,e ]);	
						}								   
					}));	
					var _menu = self._menu.createMenu();
					$(_menu).showAt({ el:btn,xAlign:'left',yAlign:'bottom' });
					setTimeout(function(){
						$(document).one("mousedown",function(){
							btn.removeClass('nex-btn-active');								 
							self._menu.hideRoot();								 
						});					
					},0);
				}
			}
		},
		_showSplitMenu : function(btn,e){
			var self = this;
			var opt = self.configs;
			var _btn = opt.views['button'];//$("#"+opt.id);
			
			if( !opt.splitBtn ) return;
			
			var splitBtn = $('.nex-btn-arrow',_btn);
			if( splitBtn.hasClass('nex-btn-arrow-active') ) {
				splitBtn.removeClass('nex-btn-arrow-active');
				_btn.removeClass('nex-btn-active');
				if( opt.activeCls ) {
					_btn.removeClass(opt.activeCls);	
				}
				if( self._menu ) {
					self._menu.hideRoot();	
				}
			} else {
				splitBtn.addClass('nex-btn-arrow-active');
				_btn.addClass('nex-btn-active');
				if( opt.activeCls ) {
					_btn.addClass(opt.activeCls);	
				}
				self._menu = new Nex.menu($.extend(opt.menuConf,{data:opt.menu},{
					onClick : function(obj,tid,data,e){
						splitBtn.removeClass('nex-btn-arrow-active');
						_btn.removeClass('nex-btn-active');
						if( opt.activeCls ) {
							_btn.removeClass(opt.activeCls);	
						}	
						self.fireEvent('onItemClick',[ obj,tid,data,e ]);	
					}								   
				}));
				var _menu = self._menu.createMenu();	
				$(_menu).showAt({ el:_btn,xAlign:'left',yAlign:'bottom' });	
				setTimeout(function(){
					$(document).one("mousedown",function(){
						splitBtn.removeClass('nex-btn-arrow-active');
						_btn.removeClass('nex-btn-active');
						if( opt.activeCls ) {
							_btn.removeClass(opt.activeCls);	
						}								 
						self._menu.hideRoot();								 
					});					
				},0);
			}
		},
		_onCreate : function(){
			this.disabled( this.C('disabled') );	
		},
		onMouseOver : function(btn,e){
			var self = this,
				opt=this.configs;
			var btn = $(btn);
			btn.addClass("nex-btn-over");
			$('>.nex-btn-wraper',btn).addClass("nex-btn-wraper-over");
			if( opt.overCls ) {
				btn.addClass( opt.overCls );	
			}
		},
		onMouseOut : function(btn,e){
			var self = this,
				opt=this.configs;
			var btn = $(btn);
			btn.removeClass("nex-btn-over");
			$('>.nex-btn-wraper',btn).removeClass("nex-btn-wraper-over");
			if( opt.overCls ) {
				btn.removeClass( opt.overCls );	
			}
		},
		toggleBtnCls : function(){
			var self = this,
				opt=this.configs;	
			var btn = opt.views['button'];//$("#"+opt.id);
			if( opt.pressed ) {
				btn.addClass("nex-btn-pressed");
				$('>.nex-btn-wraper',btn).addClass("nex-btn-wraper-pressed");
				if( opt.pressedCls ) {
					btn.addClass( opt.pressedCls );	
				}
			} else {
				btn.removeClass("nex-btn-pressed");
				$('>.nex-btn-wraper',btn).removeClass("nex-btn-wraper-pressed");	
				if( opt.pressedCls ) {
					btn.removeClass( opt.pressedCls );	
				}
			}	
		},
		_click : function(btn,e){
			var self = this,
				opt=this.configs;
			if( opt.disabled ) {
				return;	
			}
			
			opt.callBack.call(self,btn,e);
			
			if( opt.toggleBtn ) {
				opt.pressed = !opt.pressed;
				self.toggleBtnCls();
				opt.toggleHandler.call(self,opt.pressed,opt);	
			}
			
		},
		disabled : function(m){
			var self = this,
				opt=this.configs,
				undef;
			var m = m === undef ? false : m;
			var btn = opt.views['button'];//$("#"+opt.id);
			opt.disabled = !!m;
			if( m ) {
				btn.addClass('nex-btn-disabled');
				$('>.nex-btn-wraper',btn).addClass("nex-btn-wraper-disabled");
				if( opt.disabledCls ) {
					btn.addClass(opt.disabledCls);	
				}
			} else {
				btn.removeClass('nex-btn-disabled');	
				$('>.nex-btn-wraper',btn).removeClass("nex-btn-wraper-disabled");
				if( opt.disabledCls ) {
					btn.removeClass(opt.disabledCls);	
				}
			}
			return true;
		}
	});
	/*
	*添加xtype
	*/
	if( Nex.Manager ) {
		/*Nex.Manager.addXtype('button',function(opt){
			new Nex.button(opt);									   
		});	*/
	}
})(jQuery);
/*
author:nobo
fieldSet
*/
;(function($,window){
	var fieldSetPanel = Nex.extend('fieldSetPanel','panel');
	fieldSetPanel.setOptions(function(){
		return {
			title : "查询输入控件面板",
			hideHeader : true,
			autoScroll : true,
			cls : 'nex-fieldset-panel',
			padding : 5
		};	
	});
	fieldSetPanel.fn.extend({
		setContainerSize : function(w,h){
			var self = this;
			var opt = self.configs;	
			var render = $(opt.renderTo);
			var container = opt.views['container'];
			
			var size = self.getResizeWH();
			
			opt.width = w || size.width;
			opt.height = h || size.height;
			
			var wh = self.checkSize( opt.width,opt.height );
			opt.width = wh.width;
			opt.height = wh.height;
			
			//container._outerWidth(opt.width);
			//container._outerHeight(opt.height);
			return self;
		},
		resetViewSize : function(){
			var self = this,
				opt=this.configs,
				undef;
			var bd = opt.views['body'];
			//bd._outerWidth(opt.width-opt.diffW);
			//bd._outerHeight(opt.height-opt.diffH);
			
			//self.fireEvent('onViewSizeChange',[ opt ]);
		},
		setFieldSetEvent : function(){
			var self = this;
			var opt = self.configs;	
			var bd = opt.views['body'];
			var legend = $('#'+opt.id+'_legend .nex-legend-icon');
			$('#'+opt.id+'_legend').bind({
				"click" : function(e){
					if( self.isAnim ) return;
					var isCollapse = bd.hasClass('legend-close');
					if( !isCollapse ) {
						self.isAnim = true;
						bd._height = bd._outerHeight();
						bd.stop().animate({height:0},500,function(){
							self.isAnim = false;
							bd.addClass('legend-close')	;
							legend.removeClass('fieldset-legend-collapse fieldset-legend-expand').addClass('fieldset-legend-expand');
						});
					} else {
						self.isAnim = true;
						bd.stop().animate({height:bd._height},500,function(){
							self.isAnim = false;
							bd.removeClass('legend-close')	;
							bd._outerHeight( bd._height );
							legend.removeClass('fieldset-legend-collapse fieldset-legend-expand').addClass('fieldset-legend-collapse');
						});
					}
				}	
			});
		},
		setBody : function(){
			var self = this;
			var opt = self.configs;	
			var container = opt.views['container'];
			var bd = '<fieldset class="nex-fieldset" id="'+opt.id+'_fieldset">'
					 	+'<legend class="nex-fieldset-legend" id="'+opt.id+'_legend">'
							+'<div class="nex-legend-inner" style="">'
								+'<span class="nex-legend-text" style="">'+opt.title+'</span><span class="nex-legend-icon fieldset-legend-collapse"></span>'
							+'</div>'
						+'</legend>'
						+'<div id="'+opt.id+'_body" class="nex-panel-body nex-fieldset-body '+opt.bodyCls+'">'
						+'</div>'
					+'</fieldset>';
			bd = $( bd );
			container.append(bd);
			bd = bd.find(">.nex-panel-body");
			opt.views['body'] = bd;
			bd.css('padding',opt.padding);
			bd.css(opt.style);
			self.setFieldSetEvent();
			self.fireEvent("onBodyCreate",[bd,opt]);
			return self;
		}	
	});
})(jQuery,window);
