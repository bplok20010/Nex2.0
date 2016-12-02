/*
SplitButton组件继承 Button
http://www.extgrid.com/button
author:nobo
zere.nobo@gmail.com
qq : 505931977
*/
;(function($){
	"use strict";
	var button = Nex.extend('Nex.SplitButton','Nex.Button').setXType('splitbutton');
	button.extend({
		version : '1.0'
	});
	button.setOptions( function( opt ){
		return {
		};						
	} );
	
	button.fn.extend({
		_sysEvents : function(){
			var self = this;
			var opt = self.configs;
			
			Nex.Button.fn._sysEvents.call( self );
			
			self.bind("onSplitBtnClick.menu",self._showSplitMenu,self);
			
			return self;
		},
		disabled : function( m ){
			var self = this,
				opt=this.configs,
				file = opt.views['file'],
				undef;
			var m = m === undef ? true : m;
			
			var r = Nex.Button.fn.disabled.call( self,m );
			
			if( file ) {
				if( m ) {
					file.attr('disabled',true);	
				} else {
					file.attr('disabled',false);		
				}
			}
			
			return r;
		}
		
	});
})(jQuery);