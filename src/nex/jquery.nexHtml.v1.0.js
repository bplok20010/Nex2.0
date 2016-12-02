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