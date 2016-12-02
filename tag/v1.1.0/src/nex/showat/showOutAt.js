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