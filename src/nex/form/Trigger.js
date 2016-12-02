;$import([
	'Nex.form.Text'
],function(){
	"use strict";
	var trigger = Nex.define('Nex.form.Trigger','Nex.form.Text',{
		alias : 'Nex.Form.Trigger',
		xtype : 'trigger',
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
				name : 'trigger',
				cls : ['nex-form-triggerfield-trigger',opt.triggerCls].join(' '),
				iconCls : ['nex-form-triggerfield-icon',opt.triggerIconCls].join(' '),
				callBack : function( d,e ){
					var r = self.fireEvent('onTriggerClick',[ opt ]);
					if( r === false ) return;
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
			var cls = ['nex-form-field-trigger'].concat( ccls );	
			$('#'+opt.id+'-input').addClass( cls.join(' ') );
		}
	});	
	//参数重载
	trigger.setOptions( function(opt){
		return {
			__inputType  : 'text',
			containerCls : [opt.containerCls,'nex-form-trigger'].join(' '),
			_inputCls    : [],
			clearBtn 	 : false,
			triggerToFocus : false,
			triggerCls	 : '',
			triggerIconCls	 : ''
		};	
	} );
});