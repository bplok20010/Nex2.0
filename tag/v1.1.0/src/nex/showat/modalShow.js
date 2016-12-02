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
			class : 'nex-showat-proxy nex-showat-modal-proxy '+opt.proxyCls	
		}).css(
			$.extend({},_pos,{
				width : opt.initWidth,
				height : opt.initHeight
			})
		).appendTo( src.parent() );
		
		opt.animationTime = opt.animationTime<=0?1:opt.animationTime;
		
		proxy.animate( {
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
	showOutAt.setOptions( function(){
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