;$define([
	'Nex.form.Text'
],function(){
	"use strict";
	var textfield = Nex.define('Nex.form.Hidden','Nex.form.Text',{
		alias : 'Nex.Form.Hidden',
		xtype : 'hiddenfield'
	});	
	//参数重载
	textfield.setOptions( function(opt){
		return {
			__inputType  : 'hidden',
			containerCls : [opt.containerCls,'nex-form-hidden'].join(' '),
			width 		 : 'auto',
			height 		 : 'auto',
			showLabel	 : false,
			clearBtn	 : false
		};	
	} );
});