;$define([
	'Nex.form.Form'
],function(){
	"use strict";
	var textfield = Nex.define('Nex.form.Textarea','Nex.form.Form',{
		alias : 'Nex.Form.Textarea',
		xtype : 'textareafield',
		_sysEvents : function(){
			var self = this;
			var opt = self.configs;
			Nex.form.Form.fn._sysEvents.call( self );
			self.bind("onSetViewSize._sys",self._setTextareaHeight,self);	
		},
		_setTextareaHeight : function(){
			var self = this;
			var opt = self.configs;
			var container = opt.views['container'];
			var input = self.getInput();
			input._outerHeight( container.height() );
			return self;
		}
	});	
	//参数重载
	textfield.setOptions( function(opt){
		var tpl = opt.tpl;
		tpl.formTpl = '<table id="<%=id%>-inner" class="nex-field nex-form-inner" cellspacing="0" cellpadding="0" ><tbody>'
							+'<tr id="<%=id%>-inputRow">'
								+'<td class="nex-form-inner-body" id="<%=id%>-body-td">'
									+'<div id="<%=id%>-body" class="nex-form-body">'
										+'<textarea <%=attrs%> id="<%=id%>-input" type="<%=type%>" name="<%=name%>" tabindex=<%=tabIndex%> style="/*width:0px;*/" class="nex-form-field nex-form-field-<%=type%>"></textarea>'
										+'<label id="<%=id%>-placeholder" class="nex-form-placeholder"><%=placeholder%></label>'
										+'<div id="<%=id%>-trigger-body" class="nex-form-trigger-body"></div>'
									 +'</div>'
								+'</td>'
							+'</tr>'
						+'</tbody></table>';
		return {
			__inputType  : 'textarea',//当前组件中该参数没有作用
			containerCls : [opt.containerCls,'nex-form-textarea'].join(' '),
			clearBtn 	 : true,
			height 		 : 60,
			labelvAlign  : 'top',
			tpl			 : tpl
		};	
	} );
});