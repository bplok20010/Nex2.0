;$define([
	'Nex.form.Text'
],function(){
	"use strict";
	var textfield = Nex.define('Nex.form.Password','Nex.form.Text',{
		alias : 'Nex.Form.Password',
		xtype : 'passwordfield'
	});	
	//参数重载
	textfield.setOptions( function(opt){
		return {
			__inputType  : 'password',//设置input的type值
			containerCls : [opt.containerCls,'nex-form-password'].join(' '),
			clearBtn 	 : true
		};	
	} );
});