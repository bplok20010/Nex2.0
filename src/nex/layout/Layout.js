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
			padding : null,
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
			if( opt.padding !== null ) {
				bd.css('padding',opt.padding);
			}
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