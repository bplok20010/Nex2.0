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