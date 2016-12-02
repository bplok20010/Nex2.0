/*
button组件继承 html
http://www.extgrid.com/button
author:nobo
zere.nobo@gmail.com
qq : 505931977
*/

;(function($){
	"use strict";
	var button = Nex.define('Nex.Button','Nex.Html').setXType('button');
	//$.nexButton = $.extButton = button;
	button.extend({
		version : '1.0',
		_Tpl : {				
		}
	});
	button.setOptions( function( opt ){
		return {
			prefix : 'nexbutton-',
			tag : 'span',
			renderTo : document.body,
			autoDestroy : true,
			autoResize : false,
			_hasBodyView : false,
			_checkScrollBar : false,
			selectionable : false,
			denyEvents : true,
			tabIndex : Nex.tabIndex++,
			width : 'auto',
			height : 'auto',
			borderCls : [opt.borderCls,'nex-button-border'].join(' '),
			containerCls : [opt.containerCls,'nex-button'].join(' '),
			autoScroll : false,
			autoScrollCls : '',
			autoFocus : false,
			splitBtn : false,
			toggleBtn : false,
			pressed : false,
			plain : false,
			skin : 'default',//按钮主题
			cls : '',
			bodyCls : '',
			bodyStyle : {},
			toggleCls : '',
			pressedCls : '',
			activeCls : '',
			overCls : '',
			focusCls : '',
			plainCls : '',
			disabledCls : '',
			cssText : '',
			align : 'center',
			//removeTextSize 如果你对button设置了比较大的值建议 设置removeTextSize = true
			removeTextSize : false,//如果设置了width 默认text也会设置宽度， 可以通关这个参数取消设置
			iconAlign : 'left', // left top bottom right
			icon : '',
			iconCls : '',
			arrowAlign : 'right',//按钮 箭头位置 right bottom
			showArrow : false,//默认不显示 如果items 有值会自动显示
			arrow : '',//图标地址
			arrowCls : '',//arrow 样式 
			disabled : false,
			callBack : $.noop,
			toggleHandler : $.noop,
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
	} );
	
	button.fn.extend({
		_init : function(opt) {
			var self = this;
			
			opt.cls += ' nex-button-skin-'+opt.skin; 
			
			self.setContainer();
			self.setBody();
			self.initComponent();
			//self.createButton();
			//self.fireEvent('onCreate');
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
			var bd = $( '<span class="nex-button-left '+opt.bodyCls+'" id="'+opt.id+'_left" ></span>' );
			var bd2 = $( '<span class="nex-button-right" id="'+opt.id+'_right"></span>' );
			
			opt.views['body'] = bd;
			opt.views['body2'] = bd2;
			container.append(bd);
			container.append(bd2);
			//bd.css('padding',opt.padding);
			bd.css(opt.bodyStyle);
			//self.bindBodyEvents();	 
			self.fireEvent("onBodyCreate",[bd,bd2,opt]);
			return self;
		},
		_setViewSize : function(w,h){
			var self = this,
				opt = self.configs,
				container = self.getContainer(),
				vbody = self.getBody();
			
			if( opt.realWidth !== 'auto' ) {
				var w = container._width();
				vbody._outerWidth( w );
				if( !opt.removeTextSize ) {
					var iconWidth = 0;
					if( opt.iconAlign === 'top' || opt.iconAlign === 'bottom' ) {
						iconWidth = 0;	
					} else {
						iconWidth = $('#'+opt.id+'_icon')._width();	
					}
					var arrowWidth = 0;
					if( opt.arrowAlign === 'top' || opt.arrowAlign === 'bottom' ) {
						arrowWidth = 0;	
					} else {
						arrowWidth = $('#'+opt.id+'_arrow')._width();	
					}
					var ww = iconWidth + arrowWidth;
					$('#'+opt.id+'_text')._outerWidth( $('#'+opt.id+'_left')._width()-ww );
				}
			}
			if( opt.realHeight !== 'auto' ) {
				var bd2 = opt.views['body2'];
				var h = container._height();
				vbody._outerHeight( h );
				bd2.height( h );
			}
			
			self.fireEvent("onSetViewSize",[opt]);	
			
		},
		initComponent : function(){
			var self = this;
			var opt = self.configs;	
			self.fireEvent('onInitComponent',[opt]);
			
			self.createButton();
			
			//初始是不应该触发onSizeChange事件
			self.lockEvent('onSizeChange');
			self.resetHtmlSize();
			self.unLockEvent('onSizeChange');
			
			self.fireEvent('onCreate',[opt]);
			opt._isInit = false;
		},
		_sysEvents : function(){
			var self = this;
			var opt = self.configs;
			self.bind("onCreate.over",self._setFocus,self);
			self.bind("onCreate.over",self.toggleBtnCls,self);
			self.bind("onCreate.over",self._onCreate,self);
			self.bind("onContainerCreate.over",self._setPlain,self);
			self.bind("onFocus.focus",self._setFoucsCls,self);
			self.bind("onBlur.focus",self._unsetFoucsCls,self);//pressedCls
			self.bind("onMouseDown.focus",self._setPressedCls,self);
			self.bind("onMouseUp.focus",self._unsetPressedCls,self);
			self.bind("onMouseOver.over",self.onMouseOver,self);
			self.bind("onMouseOut.over",self.onMouseOut,self);
			self.bind("onClick.click",self._click,self);
			self.bind("onKeyDown.click",self._click2,self);
			self.bind("onClick.menu",self._showMenu,self);
			return self;
		},
		createButton : function(){
			var self = this;
			var opt = self.configs;
			
			self.setInnerButton();
			self.bindButtonEvent();
			
			return true;
		},
		setInnerButton : function(){
			var self = this,
				opt = self.configs,
				vbody = self.getBody();
			
			var wraper = ['<table class="nex-button-layout-table" cellpadding="0" cellspacing="0" border="0"><tr><td align="'+opt.align+'" valign="middle"><div class="nex-button-wraper" id="'+opt.id+'_wraper">'];
	
			var _bg = '';
			if( opt.icon ) {
				_bg = "background-image:url("+opt.icon+")";
			}
	
			if( opt.icon || opt.iconCls ) {
				wraper.push('<span id="'+opt.id+'_icon" class="nex-button-inner nex-button-icon ',opt.iconCls,'" style="',_bg,'"></span>');
			}
			
			wraper.push('<span id="'+opt.id+'_text" class="nex-button-inner nex-button-text" style="">',opt.text,'</span>');
			
			if( opt.showArrow || opt.menu.length || opt.items.length ) {
				var _bg2 = '';
				if( opt.arrow ) {
					_bg2 = 'background-image:url('+opt.arrow+');';	
				}
				wraper.push('<span id="'+opt.id+'_arrow" class="nex-button-inner nex-button-arrow '+ opt.arrowCls +'" style="'+_bg2+'"></span>');
			}
			
			wraper.push('</div></td></tr></table>');
			
			var btnInner = $(wraper.join(""));
			
			vbody.append( btnInner );
			
			self.setIconAlign();
			self.setArrowAlign();
			
			self.fireEvent('onButtonInnerCreate',[btnInner]);
		},
		bindButtonEvent : function(){
			var self = this;
			var opt = self.C();
			var container = self.getContainer();
			
			var callBack = function(type,e){
				var r = self.fireEvent(type,[ this,e,opt ]);
				if( r === false ) {
					e.stopPropagation();
					e.preventDefault();
				}
			};
			var events = {
				'focusin' : function(e) {
					callBack.call(this,'onFocus',e);
				},
				'focusout' : function(e) {
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
			container.bind(events);
			self.fireEvent("onSetButtonEvent",[container,opt]);
			return true;
		},
		focus : function(){
			var self = this,
				opt = self.configs;
			var btn = self.el;
			btn.focus();
		},
		blur : function(){
			var self = this,
				opt = self.configs;
			var btn = self.el;//getContainer
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
		_setPlain : function(){
			var self = this,
				opt = self.configs,
				btn = self.el;
			if( !opt.plain ) return;	
			btn.addClass("nex-button-plain");
			if( opt.plainCls ) {
				btn.addClass( opt.plainCls );	
			}	
		},
		_setFoucsCls : function(btn){
			var self = this,
				opt = self.configs,
				btn = self.el;
			btn.addClass("nex-button-focus");
			if( opt.focusCls ) {
				btn.addClass( opt.focusCls );	
			}
		},
		_unsetFoucsCls : function(btn){
			var self = this,
				opt = self.configs,
				btn = self.el;
			btn.removeClass("nex-button-focus");
			if( opt.focusCls ) {
				btn.removeClass( opt.focusCls );	
			}
		},
		_setPressedCls : function(btn){
			var self = this,
				opt = self.configs,
				btn = self.el;
			btn.addClass("nex-button-pressed");
			if( opt.pressedCls ) {
				btn.addClass( opt.pressedCls );	
			}
			$(document).one('mouseup',function(){
				self._unsetPressedCls();								   
			});
		},
		_unsetPressedCls : function(btn){
			var self = this,
				opt = self.configs,
				btn = self.el;
			btn.removeClass("nex-button-pressed");
			if( opt.pressedCls ) {
				btn.removeClass( opt.pressedCls );	
			}
		},
		_showMenu : function(btn,e){
			var self = this;
			var opt = self.configs;
			var btn = $(btn);
			
			if( opt.disabled ) {
				return;	
			}
			
			if( opt.menu.length && !opt.splitBtn ) {
				
				if( btn.hasClass('nex-button-active') ) {
					btn.removeClass('nex-button-active');
					if( opt.activeCls ) {
						btn.removeClass(opt.activeCls);	
					}
					if( self._menu ) {
						self._menu.hideRoot();	
					}	
				} else {
					btn.addClass('nex-button-active');
					if( opt.activeCls ) {
						btn.addClass(opt.activeCls);	
					}
					self._menu = new Nex.menu($.extend(opt.menuConf,{data:opt.menu},{
						onClick : function(obj,tid,data,e){
							btn.removeClass('nex-button-active');		
							self.fireEvent('onItemClick',[ obj,tid,data,e ]);	
						}								   
					}));	
					var _menu = self._menu.createMenu();
					self._menu._showAt(_menu,btn,{ xAlign:'left',yAlign:'bottom',zAlign : 'y' });
					setTimeout(function(){
						$(document).one("mousedown",function(){
							btn.removeClass('nex-button-active');								 
							self._menu.hideRoot();								 
						});					
					},0);
				}
			}
		},
		_showSplitMenu : function(btn,e){
			var self = this;
			var opt = self.configs;
			var _btn = self.el;//$("#"+opt.id);
			
			if( !opt.splitBtn ) return;
			
			var splitBtn = $('.nex-button-arrow',_btn);
			if( splitBtn.hasClass('nex-button-arrow-active') ) {
				splitBtn.removeClass('nex-button-arrow-active');
				_btn.removeClass('nex-button-active');
				if( opt.activeCls ) {
					_btn.removeClass(opt.activeCls);	
				}
				if( self._menu ) {
					self._menu.hideRoot();	
				}
			} else {
				splitBtn.addClass('nex-button-arrow-active');
				_btn.addClass('nex-button-active');
				if( opt.activeCls ) {
					_btn.addClass(opt.activeCls);	
				}
				self._menu = new Nex.menu($.extend(opt.menuConf,{data:opt.menu},{
					onClick : function(obj,tid,data,e){
						splitBtn.removeClass('nex-button-arrow-active');
						_btn.removeClass('nex-button-active');
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
						splitBtn.removeClass('nex-button-arrow-active');
						_btn.removeClass('nex-button-active');
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
			var btn = self.el;
			btn.addClass("nex-button-hover");
			if( opt.overCls ) {
				btn.addClass( opt.overCls );	
			}
		},
		onMouseOut : function(btn,e){
			var self = this,
				opt=this.configs;
			var btn = self.el;
			btn.removeClass("nex-button-hover");
			if( opt.overCls ) {
				btn.removeClass( opt.overCls );	
			}
			if( opt.plain ) {
				self._unsetFoucsCls();	
			}	
		},
		toggleBtnCls : function(){
			var self = this,
				opt=this.configs;	
			var btn = self.el;//$("#"+opt.id);
			if( opt.pressed ) {
				btn.addClass("nex-button-toggle");
				if( opt.toggleCls ) {
					btn.addClass( opt.toggleCls );	
				}
			} else {
				btn.removeClass("nex-button-toggle");
				if( opt.toggleCls ) {
					btn.removeClass( opt.toggleCls );	
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
		_click2 : function(btn,e){
			var self = this,
				opt=this.configs;
			if( opt.disabled ) {
				return;	
			}	
			if( e.keyCode === 13 ) {
				self._click();
			}
		},
		disabled : function(m){
			var self = this,
				opt=this.configs,
				undef;
			var m = m === undef ? true : m;
			var btn = self.el;//$("#"+opt.id);
			opt.disabled = !!m;
			if( m ) {
				btn.addClass('nex-button-disabled');
				if( opt.disabledCls ) {
					btn.addClass(opt.disabledCls);	
				}
				btn.removeAttr('tabindex');
			} else {
				btn.removeClass('nex-button-disabled');	
				if( opt.disabledCls ) {
					btn.removeClass(opt.disabledCls);	
				}
				btn.attr('tabindex',opt.tabIndex);
			}
			return true;
		},
		enabled : function(){
			return this.disabled( false );	
		},
		setText : function( text ){
			var self = this,
				opt = self.configs;	
			text = $.isFunction( text ) ? text.call(this,opt) : text;
			opt.text = self._undef(text,opt.text);
			var t = $('#'+opt.id+'_text');
			t.html( opt.text );
		},
		setArrowAlign : function( align ){
			var self = this,
				opt = self.configs,
				align = self._undef( align,opt.arrowAlign );
			opt.arrowAlign = align;	
			var wraper = $('#'+opt.id+'_wraper');
			//var icon = $('#'+opt.id+'_icon');
			//var text = $('#'+opt.id+'_text');	
			var arrow = $('#'+opt.id+'_arrow');	
			if( !arrow.length ) {
				return self;	
			}
			arrow.removeClass( 'nex-button-inner-block' );
			switch( align ) {
				case 'left' : 
					wraper.prepend( arrow );
					break;
				case 'top' : 
					wraper.before( arrow );
					arrow.addClass( 'nex-button-inner-block' );
					break;
				case 'right' : 
					wraper.append( arrow );
					break;
				case 'bottom' : 
					wraper.append( arrow );
					arrow.addClass( 'nex-button-inner-block' );
					break;
			}
			return self;
		},
		setIconAlign : function( align ){
			var self = this,
				opt = self.configs,
				align = self._undef( align,opt.iconAlign );
			opt.iconAlign = align;	
			var wraper = $('#'+opt.id+'_wraper');
			var icon = $('#'+opt.id+'_icon');
			var text = $('#'+opt.id+'_text');	
			if( !icon.length ) {
				return self;	
			}
			icon.removeClass( 'nex-button-inner-block' );
			switch( align ) {
				case 'left' : 
					text.before( icon );
					break;
				case 'top' : 
					text.before( icon );
					icon.addClass( 'nex-button-inner-block' );
					break;
				case 'right' : 
					text.after( icon );
					break;
				case 'bottom' : 
					wraper.append( icon );
					icon.addClass( 'nex-button-inner-block' );
					break;
			}
			return self;
		},
		setIcon : function( icon,align ){
			var self = this,
				opt = self.configs,
				align = self._undef( align,opt.iconAlign ),
				vbody = self.getBody();	
			opt.icon = self._undef(icon,opt.icon);	
			
			var icon = $('#'+opt.id+'_icon');
			var text = $('#'+opt.id+'_text');
			
			if( !opt.icon && !opt.iconCls ) {
				icon.remove();	
			} else {
				var _bg = '';
				if( opt.icon ) {
					_bg = "background-image:url("+opt.icon+")";
				}
				icon.remove();
				icon = $(['<span id="',opt.id,'_icon" class="nex-button-inner nex-button-icon ',opt.iconCls,'" style="',_bg,'"></span>'].join(''));
				text.before(icon);	
				//设置icon位置
				self.setIconAlign( align );
			}
			
			self._setViewSize();
			return self;
		},
		setIconCls : function(iconCls,align){
			var self = this,
				opt = self.configs,
				align = self._undef( align,opt.iconAlign ),
				vbody = self.getBody();	
			opt.iconCls = self._undef(iconCls,opt.iconCls);	
			
			var icon = $('#'+opt.id+'_icon');
			var text = $('#'+opt.id+'_text');
			
			if( !opt.icon && !opt.iconCls ) {
				icon.remove();	
			} else {
				var _bg = '';
				if( opt.icon ) {
					_bg = "background-image:url("+opt.icon+")";
				}
				icon.remove();
				icon = $(['<span id="',opt.id,'_icon" class="nex-button-inner nex-button-icon ',opt.iconCls,'" style="',_bg,'"></span>'].join(''));
				text.before(icon);	
				//设置icon位置
				self.setIconAlign( align );
			}
			
			self._setViewSize();
			return self;
		}
	});
})(jQuery);