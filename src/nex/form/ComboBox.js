;$import([
	'Nex.form.Text'
],function(){
	"use strict";
	var combobox = Nex.define('Nex.form.ComboBox','Nex.form.Text',{
		alias : 'Nex.Form.ComboBox',
		xtype : 'combobox',
		_sysEvents : function(){
			var self = this,
				opt = self.configs;	
			self.bind('onSetFormView._sys',self._setInputCls,self);	
			Nex.form.Form.fn._sysEvents.apply( self,arguments );
			return self;	
		},
		/*重载设置系统的trigger btn*/
		_setSysTriggerBtns : function(){
			var self = this,
				opt = self.configs;
			var input = self.getInput();	
			self.addInnerTriggerBtn({
				cls : ['nex-form-combobox-trigger',opt.triggerCls].join(' '),
				iconCls : ['nex-form-combobox-icon',opt.triggerIconCls].join(' '),
				callBack : function( d,e ){
					if( opt.triggerToFocus ) {
						input.trigger('focus',[e]);
					}
				}	
			});
			Nex.form.Form.fn._setSysTriggerBtns.apply( self,arguments );
			//clearBtn	
			return self;
		},
		_setInputCls : function(){
			var self = this,
				opt = self.configs;
			var ccls = $.isArray(opt._inputCls) ? opt._inputCls : [ opt._inputCls ];
			var cls = ['nex-form-field-combobox'].concat( ccls );	
			$('#'+opt.id+'-input').addClass( cls.join(' ') );
		}
	});	
	//参数重载
	combobox.setOptions( function(opt){
		return {
			__inputType  : 'text',
			containerCls : [opt.containerCls,'nex-form-combobox'].join(' '),
			_inputCls    : [],
			clearBtn 	 : true,
			triggerToFocus : true,
			triggerCls	 : '',
			triggerIconCls	 : ''
		};	
	} );
});