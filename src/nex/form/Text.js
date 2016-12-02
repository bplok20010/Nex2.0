;$define([
	'Nex.form.Form'
],function(){
	"use strict";
	var textfield = Nex.define('Nex.form.Text','Nex.form.Form',{
		alias : 'Nex.Form.Text',
		xtype : 'textfield'
	});	
	//参数重载
	textfield.setOptions( function(opt){
		var tpl = opt.tpl;
		tpl.formTpl = '<table id="<%=id%>-inner" class="nex-field nex-form-inner" cellspacing="0" cellpadding="0" ><tbody>'
							+'<tr id="<%=id%>-inputRow">'
								+'<td class="nex-form-inner-body" id="<%=id%>-body-td">'
									+'<div id="<%=id%>-body" class="nex-form-body">'
										+'<input <%=attrs%> id="<%=id%>-input" type="<%=type%>" name="<%=name%>" tabindex=<%=tabIndex%> value="" style="/*width:0px;*/" class="nex-form-field nex-form-field-<%=type%>" />'
										+'<label id="<%=id%>-placeholder" class="nex-form-placeholder"><%=placeholder%></label>'
										+'<div id="<%=id%>-trigger-body" class="nex-form-trigger-body"></div>'
									 +'</div>'
								+'</td>'
							+'</tr>'
						+'</tbody></table>';
		return {
			__inputType  : 'text',
			containerCls : [opt.containerCls,'nex-form-text'].join(' '),
			clearBtn 	 : true,
			tpl			 : tpl
		};	
	} );
});