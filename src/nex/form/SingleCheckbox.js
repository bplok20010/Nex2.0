;$define([
	'Nex.form.Checkbox'
],function(){
	"use strict";
	var textfield = Nex.define('Nex.form.SingleCheckbox','Nex.form.Checkbox',{
		alias : 'Nex.Form.SingleCheckbox',
		xtype : 'singlecheckboxfield',
		_sysEvents2 : function(){
			var self = this,
				opt = self.configs;	
			Nex.form.Checkbox.fn._sysEvents.apply( self,arguments );
			//self.bind( 'onClick._sys',self._showDropDownClick,self );
			//self.bind( 'onCreateDropDwon._sys',self._setDropDownCls,self );
			return self;	
		},
		/*private*/
		_setCheckboxs : function( ){
			var self = this;
			var opt = this.configs;	
			var data = [{
				text : opt.text,
				value : opt.on	
			}];
			opt.items = data;
			Nex.form.Checkbox.fn._setCheckboxs.apply( self,[ data ] );
			return self;
		},
		unchecked : function(){
			var self = this;
			var opt = this.configs;	
			self.setValue( opt.off );
			return this;
		},
		checked : function( value,m ){
			var self = this;
			var opt = this.configs;	
			self.setValue( opt.on );
			return self;
		},
		getInputValue : function(){
			var self = this,undef;
			var opt = this.configs;	
			
			var value = Nex.form.Checkbox.fn.getInputValue.apply( self,arguments );
			
			return value === (opt.on+'') ? opt.on : opt.off;
		}
	});	
	//参数重载
	textfield.setOptions( function(opt){
		return {
			__inputType  : 'singlecheckbox',
			containerCls : [opt.containerCls,'nex-form-singlecheckbox'].join(' '),
			clearBtn 	 : false,
			on 			 : '1',
			off 		 : '0',
			text  	     : '',
			value 		 : ''
		};	
	} );
});