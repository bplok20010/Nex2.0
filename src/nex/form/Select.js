;$define([
	'Nex.form.Form'
],function(){
	"use strict";
	var textfield = Nex.define('Nex.form.Select','Nex.form.Form',{
		alias : 'Nex.Form.Select',
		xtype : 'selectfield',
		_sysEvents : function(){
			var self = this,
				opt = self.configs;	
			Nex.form.Form.fn._sysEvents.apply( self,arguments );
			self.bind( 'onClick._sys',self._showDropDownClick,self );
			self.bind( 'onCreateDropDwon._sys',self._setDropDownCls,self );
			self.bind( 'onDropDownHide._sys',self._setDropDownHideStatus,self );
			self.bind( 'onDropDownShow._sys',self._setDropDownShowStatus,self );
			return self;	
		},
		/*重载设置系统的trigger btn*/
		_setSysTriggerBtns : function(){
			var self = this,
				opt = self.configs;
			var input = self.getInput();	
			self.addInnerTriggerBtn({
				cls : 'nex-form-select-trigger',
				iconCls : 'nex-form-select-icon',
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
		__dpStatus : false,
		_showDropDownClick : function(){
			var self = this,
				opt = self.configs;
			if( self.__dpStatus ) {
				self.hideDropDown();
			} else {
				self.showDropDown();
			}
		},
		_setDropDownShowStatus : function(){
			this.__dpStatus = true;	
		},
		_setDropDownHideStatus : function(){
			this.__dpStatus = false;	
		},
		_setDropDownCls : function( dropdown ){
			var self = this,
				opt = self.configs;
			var el = self.el;
			if( el.hasClass('nex-form-focus') ) {	
				dropdown.addClass('nex-form-select-dropdown-focus');
			} else {
				dropdown.removeClass('nex-form-select-dropdown-focus');		
			}
		},
		_getItemData2 : function( value ){
			var self = this;
			var opt = self.configs;
			var items = opt.items;
			var d = null;
			$.each( items.concat(self.__CItems) , function(i,v){
				if( !$.isPlainObject( v ) ) return;
				var v = v[opt.valueKey];
				if( (v+'') === (value+'') ) {
					d = v;
					return false;
				}
			} );		
			return d;
		},
		/*
		*获取实际中的input 一般和input相同
		*/
		__inputreal : null,
		getInputReal : function(){
			var self = this;
			var opt = self.configs;
			self.__inputreal = self.__inputreal ? self.__inputreal : $("#"+opt.id+"-input-real");
			return self.__inputreal;
		},
		/*
		*设置下拉框的值
		*param value
		*param text 可选 如果没设置会从items里查找
		*/
		setInputValue : function( value,text ){
			var self = this;
			var opt = self.configs;
			var text = self._undef( text,null );
			
			Nex.form.Form.fn.setInputValue.apply( self,arguments );
			
			if( text === null ) {	
				var d = self._getItemData2( value );
				text = d ? d[ opt.textKey ] : value;
			}
			
			self.setInputText( text );
			
			return self;
		},
		/*
		*设置表单的Items
		*如果初始化后 需要重新设置items 最好使用setItems(list) 而不要直接使用obj.C('items',list);
		*m 默认true 会根据items自动刷新text显示框的文本
		*/
		setItems : function( items,m ){
			var opt = this.configs;
			var value = this.getInputValue();	
			var text = null;
			
			if( items ) {
				opt.items = $.isArray(items) ? items.concat([]) : [items];
			}
			
			$.each( opt.items,function( i,d ){
				var d = self._parseItemData( d );
				opt.items[i] = d;
				var v = d[opt.valueKey];
				if( (v+'') === (value+'') ) {
					text = d[opt.textKey];	
				}
			} );
			var m = this._undef( m,true );
			if( m && text !== null ) {
				this.setInputText( text );	
			}
			return opt.items;	
		}
	});	
	//参数重载
	textfield.setOptions( function(opt){
		var tpl = opt.tpl;
		tpl.formTpl = '<table id="<%=id%>-inner" class="nex-field nex-form-inner" cellspacing="0" cellpadding="0" ><tbody>'
							+'<tr id="<%=id%>-inputRow">'
								+'<td class="nex-form-inner-body" id="<%=id%>-body-td">'
									+'<div id="<%=id%>-body" class="nex-form-body">'
										+'<div <%=attrs%> id="<%=id%>-input" type="<%=type%>" tabindex=<%=tabIndex%> value="" style="/*width:0px;*/" class="nex-form-field nex-form-field-<%=type%>"></div>'
										+'<input id="<%=id%>-input-real" type="hidden" value="" name="<%=name%>" />'
										+'<label id="<%=id%>-placeholder" class="nex-form-placeholder"><%=placeholder%></label>'
										+'<div id="<%=id%>-trigger-body" class="nex-form-trigger-body"></div>'
									 +'</div>'
								+'</td>'
							+'</tr>'
						+'</tbody></table>';
		return {
			__inputType  : 'select',
			containerCls : [opt.containerCls,'nex-form-select'].join(' '),
			clearBtn 	 : false,
			triggerToFocus : true,
			tpl			 : tpl
			/*
			dropdownCls : '',
			dropdownShowAt : {},
			dropdownHeight : 0,
			dropdownWidth : 0,
			dropdownMaxHeight : 0,
			dropdownMinHeight : 0,
			dropdownMaxWidth : 0,
			dropdownMinWidth : 0,
			dropdownSelectionable : true,
			dropdownEdge : 5,//下拉框距离边缘的宽度 默认是5px
			dropdownItemFilter : null,
			dropdownFormatItem : null,
			//item的内容不会被过长也会显示出来
			dropdownItemVisible : true,
			//单击item或者其他区域后会关闭dropdown 默认true 如果为false则需要手动调用hideDropDown
			dropdownHideOnClick : true,
			showDropDownShadow : true,
			*/
		};	
	} );
});