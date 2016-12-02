;$define([
	'Nex.form.Form'
],function(){
	"use strict";
	var displayfield = Nex.define('Nex.form.Display','Nex.form.Form',{
		alias : 'Nex.Form.Display',
		xtype : 'displayfield'
	});	
	//参数重载
	displayfield.setOptions( function(opt){
		return {
			__inputType  : 'display',
			containerCls : [opt.containerCls,'nex-form-display'].join(' '),
			clearBtn	 : false
		};	
	} );
});