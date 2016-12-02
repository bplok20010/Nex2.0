/*
Nex.Form  继承 Nex.Html
xtype form|textfield
author:nobo
qq:505931977
QQ交流群:13197510
email:zere.nobo@gmail.com or QQ邮箱
*/
;$define([
	'Nex.Html'
],function(){
	"use strict";
	var form = Nex.define('Nex.form.Form','Nex.Html',{
		alias : 'Nex.Form',
		xtype : 'form'	
	});
	
	Nex.form = form;//兼容以前版本
	Nex.form.Form = form;
	
	form.extend({
		version : '1.0',
		dropdownzIndex : 999999+Nex.zIndex,
		list : {},
		fieldList : {},
		isExists : function(id){
			if( !$( "#"+id ).length ) {
				return false;
			}	
			return true;
		},
		/*
		*根据name , group 获取输入框对象
		*@param {string} 输入框name
		*@param {string} 输入框分组
		*@return {array}
		*/
		get : function(name,group){
			var self = this,
				undef;
			if( name === undef ) return [];
			
			var group = self._undef( group , 'default' );
			
			var ls = [];
			
			var list = self.fieldList;
			if( group in list ) {
				
				var fields = list[ group ];
				
				$.each(fields,function(id,data){
					if( !data ) return;
					var field = data.scope;
					var fname = data.name+'';
					//同时判断当前对象是否存在
					if( !self.isExists( id ) ) {
						field._destroy();
						field = null;
						data.scope = null;
						delete fields[id];
						return;
					}
					if( fname === name+'' ) {
						ls.push(field);	
					}
				});
				
			}
			return ls;//ls.length == 1 ? ls[0] : ls
		},
		/*
		*@m 如果为true则多个数据不转换字符串
		*/
		getVal : function(name,group,m){
			var self = this;
			if( $.type( group ) !== 'string' || group === '' ) {
				group = 'default';	
			}
			var obj = self.get.apply(self,[ name,group ]);
			var val = [];
			var m = self._undef( m,false );
			if( $.isArray(obj) ) {
				$.each(obj,function(){
					var _val = this.val();
					if( _val !== '' ) {
						val.push( _val );	
					}
				});
				var _v = {};
				var _s = false;
				$.each( val,function(i,value){
					if( $._isPlainObject( value ) ) {
						_s = true;
						$.each( value,function(k,v){
							_v[k] = _v[k] || [];
							_v[k].push( v );					   
						} );	
					} else {
						_v[name] = _v[name] || [];
						_v[name].push( value );
					}			 
				} );
				if( !_s ) {
					_v[name] = _v[name] || [];
					val = !m ? _v[name].join(',') : _v[name];		
				} else {
					val = _v;	
					if( $._isPlainObject( val ) ) {
						$.each( val,function(x,d){
							d = d || [];
							d[x] = !m ? d.join(',') : d;	
						} );
					}
				}
				return val;	
			}
			return {};
		},
		getValue : function(){
			return this.getVal.apply( this,arguments );	
		},
		setVal : function(value,name,group){
			var self = this;
			var obj = self.get.apply(self,[arguments[1],arguments[2]]);
			var val = [];
			if( $.isArray(obj) ) {
				$.each(obj,function(i,f){
					if( $.isArray( value ) ) {
						this.val(self._undef(value[i],''));	
					} else {
						this.val(value);
					}
				});
				return true;
			}
			return null;
		},
		setValue : function(){
			return this.setValue.apply( this,arguments );		
		},
		/*
		*@param {string} 分组 默认default
		*@param {boolean} 默认 false 不获取disabled的输入框 如果为true则获取
		*@param {boolean} 默认 false 返回组件 否则返回name
		*/
		getGroup : function(group,m,t){
			var self = this;
			var group = self._undef( group , 'default' );	
			var m = self._undef( m , false );	
			var t = self._undef( t , false );	
			var list = self.fieldList;
			var inputs = [];
			var names = {};
			var _fields = [];
			if( group in list ) {
				var fields = list[ group ];
				$.each(fields,function(id,d){
					if( d === null ) return;
					var field = d.scope;
					//同时判断当前对象是否存在
					if( !self.isExists( field.C('id') ) ) {
						field._destroy();
						d = null;
						fields[id] = null;
						delete fields[id];
						return;
					}
					
					var isDisabled = field.C('disabled');
					if( !m && isDisabled ) {
						return;	
					}
					_fields.push( field );
					if( !t ) {
						inputs.push( field );	
					} else {
						if( !names[ d.name ] ) {
							inputs.push( d.name );
						}
					}
					names[ d.name ] = true;
				});
			}	
			inputs.call =function(){
				var argvs = [].slice.apply(arguments);
				if( !argvs.length ) return self;
				var method = argvs[0];
				argvs.splice(0,1);
				$.each( _fields,function(i,o){
					if( o[method] && $.isFunction( o[method] ) ) {
						o[method].apply( o,argvs );	
					}
				} );
				return self;	
			};
			return 	inputs;
		},
		getGroupName : function(group,m){
			return this.getGroup.apply( this,[ group,m,true ] );	
		},
		//获取某分组下的所有值
		/*
		*@m 是否获取disabled 字段 默认不获取 false
		*@t 如果为true如果多个数据不转换字符串
		*/
		getGroupVal : function(group,m,t){
			var self = this;
			var group = self._undef( group , 'default' );	
			var m = self._undef( m , false );	
			var groupNames = self.getGroupName(group,m);
			var data = {};
			$.each(groupNames,function(i,name){
				var value = self.getVal( name,group,t );
				if( $._isPlainObject( value ) ) {
					$.extend( data,value );	
				} else {
					data[ name ] = value;	
				}
			});
			return data;
		},
		getGroupValue : function(){
			return this.getGroupVal.apply( this,arguments );	
		},
		setGroupVal : function(data,group){
			var self = this;
			var data = data || {};
			if( $.isPlainObject( data ) && !$.isEmptyObject(data) ) {
				$.each( data,function(name,value){
					self.setVal( value,name,group );	
				} );	
			}
			return self;
		},
		setGroupValue : function(){
			return this.setGroupVal.apply( this,arguments );		
		},
		//验证是否通过，并返回错误的字段name
		/*
		*m 是否验证disabled 字段 默认不验证 false
		*/
		checkGroup : function(group,m) {
			var self = this;
			var group = self._undef( group , 'default' );	
			var m = self._undef( m , false );	
			var list = self.getGroup( group,m );
			var errorList = [];
			var r;
			for( var i=0;i<list.length;i++ ) {
				var field = list[i];
				r = field.scope.checkVal();
				if( r === false ) {
					errorList.push(l.name);	
				}
			}
			return errorList.length ? errorList : true;
		},
		//验证某分组是否通过
		/*
		*m 是否验证disabled 字段 默认不验证 false
		*/
		valid : function(group,m){
			var self = this;
			var r = self.checkGroup(group,m);
			return r === true ? true : false;
		},
		//验证某一元素
		checkField : function( name,group ){
			var self = this;
			var obj = self.get.apply( self,arguments );
			obj = $.isArray( obj ) ? obj : [obj];
			var re = true;
			$.each(obj,function(i,input){
				if( !input.checkVal() ) {
					re = false;
				}
			});
			return re;
		}
		
	});
	form.setOptions( function( opt ){
		return {
			prefix : 'nexform-',
			renderTo : document.body,
			//当DOM不存在是允许回收当前对象
			autoDestroy : true,
			//表单默认设置的是固定宽度，关闭了大小只适应
			autoResize : false,
			//From没有BodyView，虽然有但是大小不会改变
			_hasBodyView : false,
			_checkScrollBar : false,
			//不需要多余事件绑定
			denyEvents : true,
			borderCls : [opt.borderCls,'nex-form-border'].join(' '),
			containerCls : [opt.containerCls,'nex-form'].join(' '),
			//不是容器，不需要开启
			autoScroll : false,
			autoScrollCls : '',
			//是否创建后获得焦点
			autoFocus : false,
			//表单自带tabIndex,关闭系统自带的
			tabIndex : false,
			//多选控件时数据的分隔符
			multiSplit : ',',
			/*private*/
			__inputType : 'text',
			//是否显示Label
			showLabel : true,// 是否开启Label显示
			labelCls : '',
			labelStyle : {},
			labelvAlign : 'middle',
			labelPosition : 'left',//left top bottom right
			labelAlign : 'left',
			labelText : '',
			labelWidth : 80,
			showPlaceholder : true,
			placeholder : '',
			autocomplete : 'off',
			//显示规则：inline block
			display : 'inline',
			//设置分组
			group : 'default',//分组
			//表单name
			name : '',
			//表单默认值
			value : '',
			_value : '',
			//inner或者outer
			triggerBtnsPosition : 'inner',
			triggerBtns : [],
			triggerBtnSelection : false,
			//点击triggerBtn输入框也会获得焦点 默认关闭
			triggerToFocus : false,
			//清空按钮
			clearBtn : false,
			inputAttrs : {},
			//数据设置时改变数据的值
			formater : null,
			//数据获取是可改变数据的值
			getFormater : null,
			//数据设置最终控制
			setFormater : null,
			//数据映射，单纯的数据显示时用 并不会实际改变输入框的值 eg : {1:'01'} 显示的时候是01 获取到的值是 1
			renderer : {},
			_renderer : {},//反renderer
			rendererDef : '_default_',
			validator : Nex.formValid || {},
			rules : [],
			messages : {},
			errorCls : 'nex-form-valid-error',
			successCls : 'nex-form-valid-success',
			textKey : 'text',
			valueKey : 'value',
			items : [],//{cls:'',text:'年龄',value:'45',readOnly:false,disabled:false,selected:true,attrs:''} or '|' ',' ';'
			//_multiItems : [],//multi缓存数据
			splitChr : ['-',',',';','|'],
			_item :　{
				cls:'',
				text:'',
				value:'',
				readOnly:false,
				disabled:false,
				selected:false,
				title : '',//multiSelect
				display : 'inline-block'
			},
			itemDefault : {},
			//是否动画显示dropdown
			animateDropDown: false,
			//加载items时是否显示loading提示
			showItemsLoading : false,
			loadMsg : '数据加载中...',
			//默认和Input一样长
			loadWidth : 0,
			//如果items为空是的提示内容
			emptyMsg : '<div style="text-align:center;">暂无数据</div>',
			//加载提示显示参数设置
			loadShowAt : {},
			//加载items的ajax参数设置
			_ajaxOptions : {
				dataType : 'json',	
				type : 'GET'
			},//ajax自定义默认参数
			ajaxOptions : {},//ajax自定义参数
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
			width : 150,
			height : 'auto',//textarea multselect
			autoValidDelay : 50,
			autoValidEvents : ['onChange','onBlur','onPaste'],//什么时候进行数据验证
			disabled : false,
			readOnly : false,
			cls : '',
			overCls : '',
			focusCls : '',
			disabledCls : '',
			readonlyCls : '',
			tpl : {
				formTpl : '<table id="<%=id%>-inner" class="nex-field nex-form-inner" cellspacing="0" cellpadding="0" ><tbody>'
								+'<tr id="<%=id%>-inputRow">'
									+'<td class="nex-form-inner-body" id="<%=id%>-body-td">'
										+'<div id="<%=id%>-body" class="nex-form-body">'
											+'<div <%=attrs%> id="<%=id%>-input" type="<%=type%>" name="<%=name%>" tabindex=<%=tabIndex%> value="" style="/*width:0px;*/" class="nex-form-field nex-form-field-<%=type%>"></div>'
											+'<label id="<%=id%>-placeholder" class="nex-form-placeholder"><%=placeholder%></label>'//for="<%=id%>-input"
											+'<div id="<%=id%>-trigger-body" class="nex-form-trigger-body"></div>'
										 +'</div>'
									+'</td>'
								+'</tr>'
							+'</tbody></table>'
			},
			dropdownItemTpl : '<div id="<%=id%>" value="<%=value%>" class="nex-form-dropdown-item <%=selected?"nex-form-dropdown-item-selected":""%> <%=disabled?"nex-form-dropdown-item-disabled":""%> <%=cls%>"><%=text%></div>',
			dropdownItemSplitLineTpl : '<div class="nex-form-item-separator"><div class="nex-form-line-h"></div></div>',
			events : {
				onStart : $.noop,
				onCreate : $.noop,
				onSizeChange : $.noop,
				onClick : $.noop,
				onFocus : $.noop,
				onBlur : $.noop,
				onKeyDown : $.noop,
				onKeyUp : $.noop,
				onKeyPress : $.noop,
				onMouseOver : $.noop,
				onMouseOut : $.noop,
				onPaste : $.noop,
				onSpinnerUp : $.noop,
				onSpinnerDown : $.noop,
				onMouseDown : $.noop,
				onMouseUp : $.noop,
				onBeforeGet : $.noop,
				onAfterGet : $.noop,
				onChange : $.noop,
				onValidError : $.noop,
				onValidSuccess : $.noop,
				onDestroy : $.noop
			}
		};	
	} );
	form.fn.extend({
		_triggerID : 1,
		_init : function(opt) {
			var self = this;
			//检查参数
			self._checkOptions( opt ).
				 setContainer().
				 _setFormView().
				 initComponent();
		},
		_checkOptions : function( opt ){
			opt.cls += ' nex-form-group-'+opt.group;
			opt.cls += ' nex-form-display-'+opt.display;
			return this;
		},
		_sysEvents : function(){
			var self = this;
			var opt = self.configs;
			
			Nex.Html.fn._sysEvents.apply( self,arguments );
			
			self.bind("onMouseOver._sys",self._setOverCls,self);
			self.bind("onMouseOut._sys",self._unsetOverCls,self);
			
			self.bind("onFocus._sys",self._setFocusCls,self);
			self.bind("onBlur._sys",self._unsetFocusCls,self);
			
			self.bind("onChange._sys",self._triggerPlaceholder,self);
			self.bind("onBlur._sys",self.refreshFormater,self);//refreshFormater
			self.bind("onBlur._sys",self.refreshRenderer,self);
			
			self.bind("onValidError._sys",self.setValidError,self);
			self.bind("onValidSuccess._sys",self.setValidSuccess,self);
			for(var i=0;i<opt.autoValidEvents.length;i++ ) {
				var s = self.bind(opt.autoValidEvents[i],self._autoValid,self);	
			}
			return self;
		},
		/*
		*作为备份用，如果用户没有定义tpl.formTpl 那么会使用当前函数
		*/
		formTpl : function(d){
			var text = [];
			/*
			text.push('<table id="'+d.id+'-inner" class="nex-field nex-form-inner" cellspacing="0" cellpadding="0" ><tbody>');//style="table-layout:fixed;" 不建议设置 IE 67 下会有问题
			text.push('<tr id="'+d.id+'-inputRow">');
				text.push('<td class="nex-form-inner-body" id="'+d.id+'-body-td">');	
				text.push('<div id="'+d.id+'-body" class="nex-form-body">');	
					text.push('<div '+d.attrs+' id="'+d.id+'-input" name="'+d.name+'" tabindex='+d.tabIndex+' value="" style="width:0px;" class="nex-form-field"></div>');
				text.push('</div></td>');
			text.push('</tr>');
			text.push('</tbody></table>');
			*/
			return text.join("");	
		},
		/*
		*获取表单模版
		*/
		_getFormTpl : function(){
			var self = this,
				opt = self.configs;
			var d = $.extend({},opt);
			var attrs = [];	
			if( $.isPlainObject( d.inputAttrs ) ) {
				$.each( d.inputAttrs,function(k,v){
					attrs.push(k+'='+v);
				} );
			}
			attrs.join(' ');
			d.attrs = attrs;
			d.tabIndex = ++Nex.tabIndex;
			d.placeholder = opt.placeholder;
			d.type = opt.__inputType;
			return self.tpl( 'formTpl',d );
		},
		getBody : function(){
			var self = this,
				opt = self.configs;
			return opt.views['body'];
		},
		/*
		*设置组件HTML
		*/
		_setFormView : function(){
			var self = this,
				opt = self.configs,
				container = opt.views['container'];
			container.html( self._getFormTpl() );
			opt.views['body'] = $('#'+opt.id+'_body');
			
			self._setSysTriggerBtns();
			self._setTriggerBtns();
			self._bindEvent();
			
			self.fireEvent("onSetFormView",[opt]);	
			
			return self;
		},
		/*重载设置系统的trigger btn*/
		_setSysTriggerBtns : function(){
			var self = this,
				opt = self.configs;
			if( opt.clearBtn ) {
				self.addInnerTriggerBtn({
					cls : 'nex-form-clear-trigger',
					iconCls : 'nex-form-clear-icon',
					callBack : function(){
						self.val('');	
						self.focus();
					}	
				});
			}
			//clearBtn	
			return self;
		},
		/*设置触发按钮*/
		_setTriggerBtns : function(){
			var self = this,
				opt = self.configs;
			var html = [];	
			var method = opt.triggerBtnsPosition === 'inner' ? 'addInnerTriggerBtn' : 'addOuterTriggerBtn';
			$.each( opt.triggerBtns,function(i,d){
				if( $.isArray( d ) && d.length>1 ) {
					self[method].call(self,d[0],d[1]);		
				} else {
					self[method].call(self,d);		
				}
			} );	
		},
		_setViewSize : function(){
			var self = this,
				opt = self.configs,
				container = opt.views['container'],
				vbody = opt.views['body'],
				input = self.getInput();
			if( !self.isAutoWidth() ) {	
				input.width(0);
				var inputRow = $("#"+opt.id+"-inputRow");
				var w = 0;
				$('>td',inputRow).not('.nex-form-inner-body').each( function(){
					w += $(this)._outerWidth();	
				} );
				input._outerWidth( container.width()-w );
			}
			if( !self.isAutoHeight() ) {
				vbody._outerHeight( container.height() );	
			}
			
			self.fireEvent("onSetViewSize",[opt]);	
		},
		_addToList : function(){
			var self = this;
			var opt = self.configs;
			var list = Nex.Form.fieldList;
			if( opt.group in list ) {
				list[ opt.group ][opt.id] = {
					name : opt.name,
					'scope' : self
				};	
			} else {
				list[ opt.group ] = {};
				list[ opt.group ][opt.id] = {
					name : opt.name,
					'scope' : self
				};
			}
		},
		/*
		*设置Lable
		*/
		_setLabel : function(){
			var self = this,
				td = [],
				opt = self.configs;
			var ltd = $('#'+opt.id+'-label-td');
			if( ltd.size() ) {
				ltd.remove();	
			}
			td.push('<td valign="'+opt.labelvAlign+'" align="'+opt.labelAlign+'" id="'+opt.id+'-label-td" class="nex-form-inner-label nex-form-inner-label-'+opt.labelvAlign+'">');	
				td.push('<label id="'+opt.id+'-label" for="'+opt.id+'-input" class="nex-form-label '+opt.labelCls+'"></label>');
			td.push('</td>');
			
			var $td = $(td.join(''));
			
			$("#"+opt.id+"-body-td").before($td);
			
			$('#'+opt.id+'-label').css( opt.labelStyle );
			
			return self;	
		},
		setLabel : function(){
			return this._setLabel();	
		},
		/*
		*设置Label位置
		*/
		_setLabelPosition : function( pos ){
			var self = this,
				undef,
				opt = self.configs,
				pos = pos === undef ? 'left' : pos;	
			var _pos = {
				left : true,
				top : true,
				bottom : true,
				right : true	
			};	
			pos = _pos[pos] ? pos : 'left';
			//td-label
			var td = $("#"+opt.id+"-label-td");
			var inputRow = $("#"+opt.id+"-inputRow");
			$('#'+opt.id+'-label-tb').remove();
			var tr = null;
			if( $.inArray( pos,['top','bottom'] ) !== -1 ) {
				tr = $('<tr id="'+opt.id+'-label-tb"></tr>');	
			}
			
			if( pos === 'left' ) {
				$("#"+opt.id+"-body-td").before(td);
			} else if( pos === 'right' ) {
				$(">td:last",inputRow).after(td);
			} else if( pos === 'top' ) {
				if( tr ) {
					inputRow.before(tr);
					tr.append( td );
				}
			} else {
				if( tr ) {
					inputRow.after(tr);	
					tr.append( td );
				}
			}
			
			$('#'+opt.id+'-label').removeClass('nex-form-label-left nex-form-label-right nex-form-label-top nex-form-label-bottom')
								  .addClass('nex-form-label-'+pos);
			
			return self;
		},
		setLabelPosition : function(pos){
			this._setLabelPosition(pos);
			this.resetViewSize();
			return this;		
		},
		/*
		*设置Label内容
		*/
		_setLabelText : function( text ){
			var opt = this.configs;
			var label = $('#'+opt.id+'-label');
			label.empty();
			this.renderComponent( text || opt.labelText,label );
			return this;	
		},
		setLabelText : function( text ){
			this._setLabelText(text);
			return this;	
		},
		/*
		*设置Lable宽度
		*/
		_setLabelWidth : function( w ){
			var opt = this.configs;
			$('#'+opt.id+'-label')._outerWidth( w || opt.labelWidth );
			return this;	
		},
		setLabelWidth : function( w ){
			this._setLabelWidth(w);
			this.resetViewSize();
			return this;	
		},
		checkLabelSet : function(){
			var self = this,
				opt = this.configs;	
			if( !opt.showLabel ) return self;	
			self._setLabel()
				._setLabelPosition( opt.labelPosition )
				._setLabelWidth( opt.labelWidth )
				._setLabelText( opt.labelText );
			return self;		
		},
		initComponent : function(){
			var self = this,
				opt = this.configs;
				
			self.checkLabelSet();	
			
			Nex.Html.fn.initComponent.apply( self,arguments );
			
			self._addToList();
			
			self._afterCreate();
			
		},
		_afterCreate : function(){
			var self = this,
				opt = self.configs;
			if( opt.disabled ) {
				self._disabled();
			}
			if( opt.readOnly ) {
				self._readOnly( true );
			}
			if( opt.autoFocus ) {
				self.focus();	
			}
			
			opt._value = opt.value;
			if( opt.value ) {
				self.lockEvent('onChange');
				//初始值设置
				self.setValue( opt.value );	
				self.unLockEvent('onChange');
				//初始化设置值时会触发onInitChange
				self.fireEvent('onInitChange',[opt.value,'']);
				if( opt.showPlaceholder ) {
					self.hidePlaceholder();
				}
			} else {
				if( opt.showPlaceholder ) {
					self.showPlaceholder();
				}
			}
		},
		_appendContent : function(){},
		__placeholderShow : false,
		_triggerPlaceholder : function( value ){
			if( !this.configs.showPlaceholder ) {
				return;	
			}
			if( value === '' ) {
				this.showPlaceholder();	
			} else {
				this.hidePlaceholder();		
			}
		},
		/*
		*获取placeholder
		*/
		getPlaceholder : function(){
			var opt = this.configs;
			var ph = $("#"+opt.id+"-placeholder");
			return ph;	
		},
		getPlaceholderText : function(){
			return this.configs.placeholder;	
		},
		setPlaceholder : function( text ){
			var text = this._undef( text,'' );
			if( text !== '' ) {
				this.configs.placeholder = text;
				this.getPlaceholder().html( text );
			}
			return this;
		},
		showPlaceholder : function(){
			if( !this.__placeholderShow ) {
				this.getPlaceholder().addClass('nex-form-placeholder-show');
			}
			this.__placeholderShow = true;	
			this.el.addClass('nex-form-empty');
			return this;
		},
		hidePlaceholder : function(){
			if( this.__placeholderShow ) {
				this.getPlaceholder().removeClass('nex-form-placeholder-show');
			}
			this.__placeholderShow = false;
			this.el.removeClass('nex-form-empty');
			return this;
		},
		/*
		*获取显示的input
		*/
		__input : null,
		getInput : function(){
			var self = this;
			var opt = self.configs;
			self.__input = self.__input ? self.__input : $("#"+opt.id+"-input");
			return self.__input;
		},
		/*
		*获取实际中的input 一般和input相同
		*/
		__inputreal : null,
		getInputReal : function(){
			var self = this;
			var opt = self.configs;
			self.__inputreal = self.__inputreal ? self.__inputreal : $("#"+opt.id+"-input");
			return self.__inputreal;
		},
		//判断元素是否属于input, textarea, select 和 button 元素
		_isInput : function( el ){
			return $(el).is(':input');	
		},
		/*
		*获取输入框的值
		*/
		getInputValue : function(){
			var self = this;
			var opt = self.configs;
			var input = self.getInputReal();
			
			var value = self._isInput( input ) ? input.val() : input.html();
			
			return value;	
		},
		setInputValue : function( value ){
			var self = this;
			var opt = self.configs;
			var input = self.getInputReal();
			self._isInput( input ) ? input.val( value ) : input.html( value );
			
			self.currentValue = value;
			
			return self;
		},
		/*
		*private
		*/
		getInputWidth : function(){
			return this.getInput()._outerWidth();		
		},
		/*
		*获取输入框的显示值 一般和getInputValue相同
		*/
		getInputText : function(){
			var self = this;
			var opt = self.configs;
			var input = self.getInput();
			
			var value = self._isInput( input ) ? input.val() : input.html();
			
			return $.trim( value );	
		},
		setInputText : function( value ){
			var self = this;
			var opt = self.configs;
			var input = self.getInput();
			self._isInput( input ) ? input.val( value ) : input.html( value );
			return self;
		},
		//过渡用 目前已经没用
		currentValue : '',
		/*
		*获取当前组件值
		*/
		getValue : function(){
			var self = this,undef;
			var opt = self.configs;
			
			var value = $.trim( self.rendererDecode( self.getInputValue() ) );
			
			if( $.isFunction( opt.getFormater ) ) {
				var val = opt.getFormater.call( self,value );
				value = val === undef ? value : val;
			}
			
			var _d = {
				value : value	
			};
			
			self.fireEvent('onGetValue',[ _d ]);
			self.currentValue = _d.value;
			
			return _d.value;
		},
		_oldValue : null,
		setValue : function(){
			var self = this,
				opt = this.configs,
				undef;
			var argvs = [].slice.apply(arguments);
			//记录表单改变之前的值
			var oldValue = self._oldValue === null ? self.getValue() : self._oldValue;
			self._oldValue = oldValue;
			
			self.fireEvent('onSetValue',[argvs]);
			
			if( $.isFunction( opt.setFormater ) ) {
				var val = opt.setFormater.apply( self,argvs );
				if( val !== undef ) {
					if( !$.isArray( val ) ) {
						argvs = [ val ];	
					}
				}
			}
			//formater 一般不建议使用 只对设置时有效
			if( $.isFunction( opt.formater ) ) {
				var val = opt.formater.apply( self,argvs );
				if( val !== undef ) {
					if( !$.isArray( val ) ) {
						argvs = [ val ];	
					}
				}
			}
			
			if( !argvs.length ) {
				return self;	
			}
			
			var v = argvs[0]+'';
			//显示映射
			argvs[0] = self.rendererEncode(argvs[0]);
			
			self.setInputValue.apply(self, argvs );
			
			var newValue = v;
			
			if( oldValue !== newValue && self._oldValue!==null ) {
				self._oldValue = null;
				opt.value = newValue;
				self.fireEvent('onChange',[newValue,oldValue]);	
			}
			
			return self;
		},
		val : function(){
			var self = this,undef;
			var opt = self.configs;
			//设置当前值
			if( arguments.length ) {
				return self.setValue.apply( self,arguments );	
			} else {
				return self.getValue();	
			};
		},
		_focusValue : null,
		_bindEvent : function(){
			var self = this;
			var opt = self.configs;
			
			var inputRow = $("#"+opt.id+"-inputRow");
			var input = $("#"+opt.id+"-input");
			var bd = $("#"+opt.id+"-body");
			var trigger = $("#"+opt.id+"-trigger-body");
			
			var events = {
				'click' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var r = self.fireEvent('onClick',[ this,e ]);	
					if( r === false ) return false;
				},
				'focus' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					
					self._focusValue = $(this).val();
					
					//var input = $('#'+opt.id+"-input");
					input.addClass('nex-form-field-focus');
					$('#'+opt.id).addClass('nex-form-focus');
					
					var r = self.fireEvent('onFocus',[ this,e ]);	
					if( r === false ) return false;
				},
				'blur' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					
					var oldValue = self._focusValue;
					var newValue = $(this).val();
					
					//var input = $('#'+opt.id+"-input");
					input.removeClass('nex-form-field-focus');
					
					$('#'+opt.id).removeClass('nex-form-focus');
					
					if( oldValue !== newValue ) {
						opt.value = newValue;
						self.fireEvent('onChange',[ newValue,oldValue ]);
					}
					
					var r = self.fireEvent('onBlur',[ this,e ]);	
					if( r === false ) return false;
				},
				'keydown' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					self._oldValue = self._oldValue === null ? $(this).val() : self._oldValue;
					var r = self.fireEvent('onKeyDown',[ this,e ]);	
					if( r === false ) return false;
					
				},
				'keyup' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var oldValue = self._oldValue;
					var newValue = $(this).val();
					if( oldValue !== newValue && self._oldValue!==null ) {
						opt.value = newValue;
						self.fireEvent('onChange',[ newValue,oldValue ]);	
						self._oldValue =null;
					}
					var r = self.fireEvent('onKeyUp',[ this,e ]);	
					if( r === false ) return false;
				},
				'keypress' : function(e){
					if( opt.disabled || opt.readOnly ) {
						return;		
					}
					var r = self.fireEvent('onKeyPress',[ this,e ]);	
					if( r === false ) return false;
				},
				'mouseenter' : function(e){
					if( opt.disabled || opt.readOnly ) {
						return;		
					}
					var r = self.fireEvent('onMouseOver',[ this,e ]);	
					if( r === false ) return false;
				},
				'mouseleave' : function(e){
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var r = self.fireEvent('onMouseOut',[ this,e ]);	
					if( r === false ) return false;
				},
				'paste' : function(e){
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var r = self.fireEvent('onPaste',[ this,e ]);	
					if( r === false ) return false;
				},
				'mousedown' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var r = self.fireEvent('onMouseDown',[ this,e ]);	
					if( r === false ) return false;
				},
				'mouseup' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var r = self.fireEvent('onMouseUp',[ this,e ]);	
					if( r === false ) return false;
				}
			};
			var __t = 0;
			var triggerEvns = {
				'click' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var $this = $(this);
					var tid = parseInt($this.attr('tid'))-1;
					var data = self.__TriBtns[tid];
					var r = self.fireEvent('onTriggerBtnClick',[ data,this,e ]);	
					if( r === false ) return false;
					
					//input.trigger('click',[e]);
				},
				'dblclick' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var $this = $(this);
					var tid = parseInt($this.attr('tid'))-1;
					var data = self.__TriBtns[tid];
					var r = self.fireEvent('onTriggerBtnDblClick',[ data,this,e ]);	
					if( r === false ) return false;
					
					//input.trigger('dblclick',[e]);
				},
				'mouseenter' : function(e){
					if( opt.disabled || opt.readOnly ) {
						return;		
					}
					var $this = $(this);
					var tid = parseInt($this.attr('tid'))-1;
					var data = self.__TriBtns[tid];
					var r = self.fireEvent('onTriggerBtnOver',[ data,this,e ]);	
					if( r === false ) return false;
					
					$this.addClass('nex-form-trigger-btn-over');
					//input.trigger('mouseenter',[e]);
				},
				'mouseleave' : function(e){
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var $this = $(this);
					var tid = parseInt($this.attr('tid'))-1;
					var data = self.__TriBtns[tid];
					var r = self.fireEvent('onTriggerBtnOut',[ data,this,e ]);	
					if( r === false ) return false;
					
					$this.removeClass('nex-form-trigger-btn-over');
					//input.trigger('mouseleave',[e]);
				}, 
				'mousedown' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var $this = $(this);
					var tid = parseInt($this.attr('tid'))-1;
					var data = self.__TriBtns[tid];
					var r = self.fireEvent('onTriggerBtnDown',[ data,this,e ]);	
					if( r === false ) return false;
					
					$this.addClass('nex-form-trigger-btn-down');
					__t = setTimeout(function(){
						__t = 0;
						$(document).one('mouseup',function(){
							$this.removeClass('nex-form-trigger-btn-down');	
						});	
					},0);
					
					//input.trigger('mousedown',[e]);
				},
				'mouseup' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					var $this = $(this);
					var tid = parseInt($this.attr('tid'))-1;
					var data = self.__TriBtns[tid];
					var r = self.fireEvent('onTriggerBtnUp',[ data,this,e ]);	
					if( r === false ) return false;
					
					$this.removeClass('nex-form-trigger-btn-down');
					if( __t ) {
						clearTimeout( __t );	
						__t = 0;
					}
					//input.trigger('mouseup',[e]);
				}
			};
			var placeholderEvns = {
				'click' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					input.trigger('click',[e]);
				},
				'mouseenter' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					input.trigger('mouseenter',[e]);
				},
				'mouseleave' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					input.trigger('mouseleave',[e]);
				},
				'mousedown' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					
					input.trigger('mousedown',[e]);
					
					if( opt.triggerToFocus ) {
						input.trigger('focus',[e]);
					} else {
						if( $(this).hasClass('nex-form-placeholder') ) {
							input.trigger('focus',[e]);	
						}	
					}
				},
				'mouseup' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					input.trigger('mouseup',[e]);
				}
			};
			
			input.bind(events);
			
			bd.undelegate('>.nex-form-placeholder')
			  .delegate('>.nex-form-placeholder',placeholderEvns);
					   
			trigger.undelegate('>.nex-form-trigger-btn')
				   .delegate('>.nex-form-trigger-btn',triggerEvns);
				   
			trigger.bind( placeholderEvns );	   
				   
			inputRow.undelegate('>.nex-form-outer-trigger-td >.nex-form-outer-trigger-body >.nex-form-trigger-btn')
					.delegate('>.nex-form-outer-trigger-td >.nex-form-outer-trigger-body >.nex-form-trigger-btn',triggerEvns);
			
		},
		__TriBtns : [],
		/*
		*添加触发按钮
		*@param 任意文字,对象或者Nex组件
		*@param 触发按钮按下后调用的回调 可选
		*@param private
		*/
		addInnerTriggerBtn : function( d,callback,_tb ){
			var self = this,
				opt = self.configs;
			var trigger = _tb ? $(_tb) : $("#"+opt.id+"-trigger-body");
			var tid = self.__TriBtns.push( d );
			var _d = {
				text : '',
				icon : '',
				cls : '',
				iconCls : '',
				callBack : null,//兼容以前的用法
				callback : null,
				handler : null	
			};
			
			if( $.type( d ) === 'string' || $.type( d ) === 'number' ) {
				var text = d+'';	
				d = $.extend( {},_d,{
					text : text	
				} );
			} else {
				for( var k in _d ) {
					if( k in d ) {
						continue;
					}	
					d[k] = _d[k];
				}
			}
			
			var tpl = ['<div id="'+opt.id+'-inner-trigger-'+tid+'" tid="'+tid+'" class="nex-form-trigger-btn '+( d.icon || d.iconCls ? 'nex-form-trigger-has-icon':'' )+' '+d.cls+'">'];
			if( d.icon || d.iconCls ) {
				tpl.push('<span class="nex-form-trigger-icon '+d.iconCls+'" style="'+(d.icon?('background-image:url('+d.icon+')'):'')+'"></span>');	
			}
			
			//tpl.push( d.text );
			
			tpl.push( '</div>' );
			var $tpl = $(tpl.join(''));
			$tpl.prependTo( trigger )
			    .bind('click',function(e){
					if( opt.disabled || opt.readOnly ) {
						return;	
					}
					if( $.isFunction( callback ) ) {
						return callback.call( self,d,e );	
					}	
					if( $.isFunction( d.callBack ) ) {
						return d.callBack.call( self,d,e );	
					}
					if( $.isFunction( d.callback ) ) {
						return d.callback.call( self,d,e );	
					}
					if( $.isFunction( d.handler ) ) {
						return d.handler.call( self,d,e );	
					}	   
			    });
			
			if( !opt.triggerBtnSelection ) {	
				$tpl.disableSelection();
			}
			
			if( Nex.isXtype( d ) || Nex.isNexConstructor( d ) ) {
				self.renderComponent( d.text,$tpl );	
			} else if( Nex.isNex( d ) ) {
				$tpl.append( d.getDom() );	
			} else {
				self.renderComponent( d.text,$tpl );
			}
			return tid;
		},
		removeInnerTriggerBtn : function( tid ){
			var self = this,
				opt = self.configs;
			if( typeof tid === 'undefined' ) {
				return self;	
			}
			tid = parseInt(tid) - 1;
			self.__TriBtns[tid] = null;
			$('#'+opt.id+'-inner-trigger-'+tid).remove();
			
			Nex.gc();
			
			return self;
		},
		/*
		*添加触发按钮
		*@param 任意文字或者Nex组件
		*@param 触发按钮按下后调用的回调 可选
		*/
		addOuterTriggerBtn : function( msg,callback ){
			var self = this,
				opt = self.configs;	
			
			var td = [];
			
			td.push('<td valign="'+opt.labelvAlign+'" align="'+opt.labelAlign+'" class="nex-form-outer-trigger-td">');	
					td.push('<div id="'+opt.id+'-outer-trigger-body" class="nex-form-outer-trigger-body"></div>');
			td.push('</td>');	
			var td = $(td.join(""));
			
			var triggerBtnTd = $("#"+opt.id+"-inputRow td:last");
			triggerBtnTd.after(td);
			
			/*var itemBtn = td.find(">div");
			if( $.isFunction(callback) ) {
				itemBtn.bind('click',function(e){
					callback.call( self,itemBtn,e );	
				});
			}
			
			self.renderComponent( msg,itemBtn );*/
			
			var tid = self.addInnerTriggerBtn( msg,callback,$('#'+opt.id+'-outer-trigger-body') );
			
			td.attr(opt.id+'-outer-trigger-td-'+tid);
				
			self.resetViewSize();
			
			return tid;
		},
		removeOuterTriggerBtn : function( tid ){
			var self = this,
				opt = self.configs;	
				
			self.removeInnerTriggerBtn( tid );
			$('#'+opt.id+'-outer-trigger-td-'+tid).remove();
				
			self.resetViewSize();
					
			return self;
		},
		_disabled : function(){
			var self = this,
				opt = self.configs,
				input = self.getInput(),
				field = self.getDom();
			
			opt.disabled = true;
			input.attr('disabled',true);	 
			
			field.addClass('nex-form-disabled');
			if( opt.disabledCls ) {
				field.addClass(opt.disabledCls);	
			}
			
			return self;	
		},
		disabled : function(){
			var self = this;
			var opt = self.configs;
			
			self._disabled();
			
			self.fireEvent("onDisabled",[opt]);	
			return self;
		},
		_enable : function(){
			var self = this,
				opt = self.configs,
				input = self.getInput(),
				field = self.getDom();
				
			opt.disabled = false;	
			
			input.attr('disabled',false);	
			
			field.removeClass('nex-form-disabled');
			if( opt.disabledCls ) {
				field.removeClass(opt.disabledCls);	
			}
			
			return self;	
		},
		enable : function(){
			var self = this,
				opt = self.configs;
			
			self._enable();	
				
			self.fireEvent("onEnable",[opt]);	
			return self;
		},
		_readOnly : function( flag ){
			var self = this,
				undef,
				input = self.getInput(),
				field = self.getDom(),
				opt = self.configs;
			var flag = flag === undef ? true : flag;
			opt.readOnly = flag;
			input.attr('readonly',flag);	
			
			if( flag ) {
				self.fireEvent("onReadOnly",[opt]);	
				field.addClass('nex-form-readonly');
				if( opt.readonlyCls ) {
					field.addClass(opt.readonlyCls);	
				}
			} else {
				self.fireEvent("onUnReadOnly",[opt]);		
				field.removeClass('nex-form-readonly');
				if( opt.readonlyCls ) {
					field.removeClass(opt.readonlyCls);	
				}
			}
			return self;	
		},
		readOnly : function( flag ){
			var self = this,
				undef,
				opt = self.configs;
			
			var flag = flag === undef ? true : flag;
			
			self._readOnly( flag );
			
			if( flag ) {
				self.fireEvent("onReadOnly",[opt]);			
			} else {
				self.fireEvent("onUnReadOnly",[opt]);		
			}
			return self;
		},
		_getOffset : function(el){
			var self = this;
			var opt = self.configs;	
			var offset = $(el).offset();
			var sLeft = $(window).scrollLeft();
			var sTop = $(window).scrollTop();
			return !offset ? {left:sLeft,top:sTop} : offset;
		},
		//获取周围可显示空间
		_getShowSpace : function(el){
			var self = this;
			var opt = self.configs;
			var el = self._undef(el,self.getInput());
			//需要获取的对象
			var obj = $(el);
			
			//获取窗口显示区域大小
			var cw = $(window).width();
			var ch = $(window).height();
			
			var offset = $._isPlainObject(el) ? el : self._getOffset(obj);
			
			//获取滚位置
			var sLeft = $(window).scrollLeft();
			var sTop = $(window).scrollTop();
			
			var space = {
				top : offset.top - sTop,
				left : offset.left - sLeft
			};
			space.bottom = ch - space.top - ( $._isPlainObject(el) ? 0 : obj._outerHeight() );
			space.right = cw - space.left - ( $._isPlainObject(el) ? 0 : obj._outerWidth() );
			return space;
		},
		setValidError : function(){
			var self = this;
			var opt = self.configs;
			var el = $("#"+opt.id);
			self.resetVaildCss();
			el.addClass(opt.errorCls);
		},
		setValidSuccess : function(){
			var self = this;
			var opt = self.configs;
			var el = $("#"+opt.id);
			self.resetVaildCss();
			el.addClass(opt.successCls);
		},
		resetVaildCss : function(){
			var self = this;
			var opt = self.configs;
			var el = $("#"+opt.id);
			el.removeClass(opt.errorCls);	
			el.removeClass(opt.successCls);	
		},
		_setFocusCls : function(t,e){
			var self = this;
			var opt = self.configs;
			if( opt.disabled || opt.readOnly ) {
				return;	
			}
			var field = self.el;
			field.addClass('nex-form-focus');
			if( opt.focusCls ) {
				field.addClass(opt.focusCls);	
			}	
		},
		_unsetFocusCls : function(t,e){
			var self = this;
			var opt = self.configs;
			if( opt.disabled || opt.readOnly ) {
				return;	
			}
			var field = self.el;
			field.removeClass('nex-form-focus');
			if( opt.focusCls ) {
				field.removeClass(opt.focusCls);	
			}	
		},
		_setOverCls : function(t,e){
			var self = this;
			var opt = self.configs;
			if( opt.disabled || opt.readOnly ) {
				return;	
			}
			var field = self.el;
			field.addClass('nex-form-over');
			$('>.nex-form-inner',field).addClass('nex-form-inner-over');
			if( opt.overCls ) {
				field.addClass(opt.overCls);	
			}
		},
		_unsetOverCls : function(t,e){
			var self = this;
			var opt = self.configs;
			if( opt.disabled || opt.readOnly ) {
				return;	
			}
			var field = self.el;
			field.removeClass('nex-form-over');
			$('>.nex-form-inner',field).removeClass('nex-form-inner-over');
			if( opt.overCls ) {
				field.removeClass(opt.overCls);	
			}
		},
		_autoValid :　function(){
			var self = this;
			var opt = self.configs;
			if( opt._ct ) {
				clearTimeout( opt._ct )
			}
			opt._ct = setTimeout(function(){
				self.checkVal();
				opt._ct = 0;	
			},opt.autoValidDelay);
		},
		hidden : function(){
			var self = this;
			var opt = self.configs;
			$("#"+opt.id).hide();
		},
		show : function(){
			var self = this;
			var opt = self.configs;
			$("#"+opt.id).show();	
		},
		"focus" : function(){
			var self = this;
			try{
				self.getInput().focus();
			}catch(e){};
		},
		"select" : function(){
			var self = this;
			try{
				self.getInput().select();
			}catch(e){};
		},
		selectText : function(start, end){
			var self = this,
				opt = self.configs,
				v = self.val(),
				undef,
				el = self.getInput().get(0),
				range;
	
			if (v.length > 0) {
				start = start === undef ? 0 : start;
				end = end === undef ? v.length : end;
				if (el.setSelectionRange) {
					el.setSelectionRange(start, end);
				}
				else if(el.createTextRange) {
					range = el.createTextRange();
					range.moveStart('character', start);
					range.moveEnd('character', end - v.length);
					range.select();
				}
				
			}
			self.focus();
		},
		"blur" : function(){
			var self = this;
			try{
				self.getInput().blur();
			} catch(e){}
		},
		checkVal : function(){
			var self = this;
			var opt = self.configs;
			var r = true;
			var rules = opt.rules;
			var validator = opt.validator;
			var rule;
			var value = self.val();
			//var value = $.nexForm.getVal( opt.name,opt.group );
			var checkList = {};//验证函数
			if( $.isArray( rules ) && rules.length ) {
				for( var x=0;x<rules.length;x++ ) {
					rule = rules[x];
					if( $.isFunction(rule) ) {
						//r = rule.call(self,value);
						checkList['checklist_'+x] = rule;
					} else if( $.isPlainObject(rule) ){
						for(var i in rule ) {
							if( $.isFunction( rule[i] ) ) {
								//r = rule[i].call(self,value);
								checkList['checklist_'+i] = rule[i];
							}else if( i in validator.methods ) {
								//r = validator.methods[i].call(self,value,rule[i]);
								checkList['checklist_'+i] = { method : i,params : rule[i] };
							}
						}
					} else {
						if( rule in validator.methods ) {
							//r = validator.methods[rule].call(self,value);
							checkList['checklist_'+rule] = rule;
						}
					}
				}
			} else if( typeof rules == 'string' ) {
				if( rules in validator.methods ) {
					//r = validator.methods[rule].call(self,value);
					checkList['checklist_'+rules] = rules;
				}	
			}
			for( rule in checkList ) {
				var _rule = checkList[ rule ];
				var m_rule = rule.replace('checklist_','');

				if( $.isFunction( checkList[rule] ) ) {
					m_rule = opt.name;
					r = checkList[rule].call( self,value );
					if( r === false) break;
				} else if( $.isPlainObject(checkList[rule]) ) {
					if( checkList[rule].method in validator.methods ) {
						r = validator.methods[ checkList[rule].method ].call(self,value,checkList[rule].params);
						if( r === false) break;
					}	
				} else {
					if( _rule in validator.methods ) {
						//r = validator.methods[rule].call(self,value);
						r = validator.methods[_rule].call(self,value);
						if( r === false) break;
					}	
				}
			}
			
			if( r === false ) {
				var errorMsg = '';
				if( $.isPlainObject( opt.messages ) ) {
					errorMsg = opt.messages[m_rule] || validator.messages[m_rule] || m_rule;
				} else {
					errorMsg = 	opt.messages;
				}
				self.fireEvent("onValidError",[errorMsg,m_rule]);	
			} else {
				self.fireEvent("onValidSuccess",[]);		
			}
			
			return r;
		},
		isValid : function(){
			return this.checkVal();	
		},
		valid : function(){
			return this.checkVal();		
		},
		"reset" : function(){
			var self = this;
			var opt = self.configs;
			opt.value = opt._value;
			
			//初始值设置
			self.setValue( opt.value );	
			
			self.blur();
			clearTimeout( opt._ct );//取消验证
			self.resetVaildCss();	
		},
		//获取数据 ,一般作为内部使用
		
		//一般作为外部使用 又val 区别在于可做最终数据处理
		refreshFormater : function(){
			var self = this,undef;
			var opt = self.C();	
			if( $.isFunction( opt.formater ) ) {
				var value = self.val();
				var _value = opt.formater.call( self,value );
				value = _value === undef ? value : _value;
				self.val( value );
			}	
		},
		/*
		*映射 只有使用api val() 才有效
		*/
		refreshRenderer : function( input,e ){
			var self = this;
			var opt = self.C();	
			if( $.isPlainObject( opt.renderer ) && $.isEmptyObject( opt.renderer ) ) {
				return ;	
			}
			var value = self.val();
			self.val( value );
		},
		/*
		* 映射
		*/
		rendererEncode : function(str){
			var self = this,
				opt = this.configs,
				undef;
			var renderer = opt.renderer;
			var value = '';
			
			if( $.isPlainObject( opt.renderer ) && $.isEmptyObject( opt.renderer ) ) {
				return str;	
			}
			
			if( $.isFunction( opt.renderer ) ) {
				value = self.tpl( renderer , str );	
				if( value === undef ) {
					value = str;	
				}
			} else if( $._isPlainObject( renderer ) ) {
				if( str in renderer ) {
					value = self.tpl( renderer[str] , str );		
				} else if( opt.rendererDef in renderer ) {
					value = self.tpl( renderer[opt.rendererDef] , str );			
				} else {
					value = str;	
				}
			} else {
				value = str;	
			}
			opt._renderer[ value ] = str;
			return value;
		},
		/*
		*反映射
		*/
		rendererDecode : function(str){
			var self = this;
			var opt = self.C();	
			
			if( $.isPlainObject( opt.renderer ) && $.isEmptyObject( opt.renderer ) ) {
				return str;	
			}
			
			var value = '';
			if( str in opt._renderer ) {
				value = opt._renderer[str];	
			}else {
				value = str;	
			}
			return value;
		},
		/*
		*下拉框处理流程，由于实现单选 多选 autocomplete下拉框
		*/
		/*
		*检测当前itemData是否包含__id text value 
		*/
		__itemId : 1,
		_parseItemData : function( data ){
			var self = this,
				undef,
				opt = self.configs;
			var value = opt.valueKey,
				text = opt.textKey;
			//如果data.__id已经存在说明已经处理过了，不需要重复处理
			if( $.isPlainObject( data ) && data.__id ) {
				return data;	
			}		
			var d = {};	
			if( $.isArray( data ) && data.length ) {
				d[ value ] = data[0];
				d[ text ] = self._undef(data[1],data[0]);	
			} else if( $.isPlainObject( data ) ) {
				data[value] = self._undef(data[value],data[text]);
				data[text] = self._undef(data[text],data[value]);
				data[value] = self._undef(data[value],'');
				data[text] = self._undef(data[text],'');
				d = data;
			} else {//string
				d[ value ] = data+'';
				d[ text ] = d[ value ];	
				if( $.inArray( d[ value ],opt.splitChr ) !== -1 ) {
					d[ '__splitLine' ] = true;	
				}
			}
			if( !('__id' in d) ) {
				d.__id = opt.id+'_item_'+self.__itemId++;	
			}
			$.extend( d,opt.itemDefault,d );
			return d;
		},
		isSplitLine : function( data ){
			var data = data || {};
			if( data.__splitLine ) {
				return true;	
			}
			return false;
		},
		/*
		*设置表单的Items
		*/
		setItems : function( items ){
			if( items ) {
				this.configs.items = $.isArray(items) ? items.concat([]) : [items];
			}
			$.each( this.configs.items,function( i,d ){
				this.configs.items[i] = self._parseItemData( d );	
			} );
			return this.configs.items;	
		},
		/*
		*获取items
		*感觉getItems实用性不是很大 因为用户数据返回格式是个不定因素，配置起来会增加使用难度，这个函数先放着把
		*/
		getItems : function(success,error,complete,options){
			var self = this,
				undef,
				opt = self.configs,
				success,
				error,
				complete,
				options = options || {};
			options = $.extend( {},options,opt._ajaxOptions,opt.ajaxOptions );	
			
			var items = opt.items;
			
			var r = self.fireEvent('onBeforeLoadItems',[items]);
			if( r === false ) return null;
			
			var _success = function(d){
				if( $.isFunction( success ) ) {
					success.apply( self,[ d ] );
				}
				self.fireEvent('onLoadItemsSuccess',[d]);
			};
			var _error = function(d){
				if( $.isFunction( error ) ) {
					error.apply( self,[ d ] );	
				}
				self.fireEvent('onLoadItemsError',[d]);
			};
			var _complete = function(){
				if( $.isFunction( complete ) ) {
					complete.apply( self,arguments );
				}
				self.fireEvent('onLoadItemsComplete');
			};
			//如果Item是数组则直接获取
			if( $.isArray( items ) ) {
				_success.call(self,items);	
				_complete();
			} else {
				return self.getAsyncData( items,_success,_error,_complete,options );
			}
			return null;
		},
		/*
		*获取items数据
		*@param {String,Array}单个字符是返回当前对象，如果是数组或者以','分割的字符串时返回的是数组
		*@param {Boolean} true 默认 返回数据  false返回索引
		*return {Array,Object}
		*/
		getItemData : function(value,m){
			var self = this,
				undef,
				opt = self.configs,
				m = m === undef ? true : m,
				items = opt.items || [];	
			var _v = value;	
			if( value === undef ) return null;
			if( $.type( value ) === 'string' ) {
				value = value.split( opt.multiSplit );	
				if( value.length>1 ) {
					_v = value;	
				}
			} else if( $.type( value ) !== 'array' ) {
				value = [ value ];	
			}
			var d = {};
			$.each( value,function(i,v){
				d[v] = true;					   
			} );
			var list = [];
			$.each( items , function(i,v){
				if( !$.isPlainObject( v ) ) return;
				var value = v['value'];
				if( value in d ) {
					list.push( m?v:i );	
				}
			} );
			
			if( list.length === 1 && $.type( _v ) !== 'array' ) {
				return list[0];	
			} else {
				return list;	
			}
		},
		getItemIndex : function(value){
			return this.getItemData( value,false );
		},
		getItemDataById : function( id ){
			var self = this,
				undef,
				opt = self.configs;
			var d = {};
			var items = opt.items;
			if( id === undef ) {
				return d;	
			}
			$.each( items , function(i,v){
				if( !$.isPlainObject( v ) ) return;
				var value = v['__id'];
				if( value === id ) {
					d = v;
					return false;
				}
			} );	
			return d;
		},
		showDropDowLoading : function( msg,callback ){
			var self = this,
				undef,
				opt = self.configs;
			var msg = msg || opt.loadMsg;
			var at = self.getInput();
			var loader = $('#'+opt.id+'_dropdown_loading');	
			if( self.__ddt ) {
				clearTimeout( self.__ddt );	
			}
			if( loader.length ) {
				loader.html( opt.loadMsg );
			} else {
				//创建dropdown
				loader = $('<div id="'+opt.id+'_dropdown_loading" class="nex-form-dropdown-loading">'+msg+'</div>');	
				$(document.body).append( loader );
				var w = self.getInputWidth();
				var w1 = loader._outerWidth();
				if( opt.loadWidth>0 ) {
					loader._outerWidth( opt.loadWidth );		
				} else {
					if( w1<w ) {
						loader._outerWidth( w );	
					}
				}
			}
			loader.showAt(
				$.extend(
					{
						el:at
						,xAlign:'left'
						,yAlign:'bottom'
						,offsetY:-1 
					}
				,opt.loadShowAt
				) 
			);
			
			if( $.isFunction( callback ) ) {
				callback.call( self,loader );
			}
			
			return loader;
		},
		__ddt : 0,
		hideDropDowLoading : function( callback ){
			var self = this,
				undef,
				opt = self.configs;	
			var loader = $('#'+opt.id+'_dropdown_loading');	
			if( loader.length ) {
				self.__ddt = setTimeout( function(){
					loader.hide(callback);
					self.__ddt = 0;
				},0 );
			}	
			return self;
		},
		getDropDown : function(){
			var self = this,
				opt = self.configs;	
			return $('#'+opt.id+'_dropdown');
		},
		/*
		*创建下拉框 默认一个输入框只能同时存在一个下拉框
		*/
		createDropDown : function(){
			var self = this,
				undef,
				opt = self.configs;
			
			var r = self.fireEvent('onBeforeCreateDropDwon',[ opt ]);	
			if( r === false ) {
				return self;	
			}
			
			var dropdown = $('#'+opt.id+'_dropdown');
			if( dropdown.length ) {
				return dropdown;	
			}
			
			var html = [];	
			//创建dropdown
			html.push('<div id="'+opt.id+'_dropdown" class="nex-form-dropdown '+opt.dropdownCls+'" tabindex="-1">');
				html.push('<div id="'+opt.id+'_dropdown_body" class="nex-form-dropdown-body" tabindex="-1" >');
					html.push('<div id="'+opt.id+'_dropdown_list" class="nex-form-dropdown-list" tabindex="-1" ></div>');
				html.push('</div>');
			html.push('</div>');
			
			dropdown = $( html.join('') ).appendTo( document.body );
			
			if( !opt.dropdownSelectionable ) {
				dropdown.disableSelection();		
			}
			
			self.fireEvent('onCreateDropDwon',[ dropdown,opt ]);
			
			return dropdown;
		},
		/*
		*创建dropdown内容
		*param {Array} 指定创建下拉框的显示内容 可选 不指定默认获取opt.items
		*/
		createDropDownList : function( list ){
			var self = this,
				undef,
				value = this.val(),
				opt = self.configs;
			var html = [];
			var valueKey = opt.valueKey,
				textKey = opt.textKey;
			var list = self._undef( list,opt.items );
			if( !$.isArray( list ) ) {
				return self;
			}
			
			var r = self.fireEvent('onBeforeCreateDropDwonList',[ list,opt ]);
			if( r === false ) {
				return self;
			}
			
			var dropdown = $('#'+opt.id+'_dropdown');
			if( !dropdown.length ) {
				dropdown = self.createDropDown();	
			}
			var v_maps = {};
			$.each( value.split( opt.multiSplit ),function(i,v){
				v_maps[v] = true;	
			} );
			var len = list.length;
			for( var i=0;i<len;i++ ) {
				var _d = self._parseItemData( list[i] );
				if( v_maps[ _d[valueKey] ] ) {
					_d.selected = true;	
				} else {
					_d.selected = false;		
				}
				list[i] = _d;
				var d = $.extend( {
					id : list[i]['__id'],
					cls : '',
					selected : false,
					disabled : false	
				},_d );
				
				if( opt.dropdownItemFilter && $.isFunction( opt.dropdownItemFilter ) ) {
					var r = opt.dropdownItemFilter.call( self,d,html );
					if( r === false ) continue;
				}
				
				var r = self.fireEvent("onDropDownItemCreate",[d,html,opt]);
				if( r === false ) continue;
				
				d.text = d[ textKey ];
				d.value = d[ valueKey ];
				
				if( opt.dropdownFormatItem && $.isFunction( opt.dropdownFormatItem ) ) {
					d.text = opt.dropdownFormatItem.call( self,d.text );
				}
				if( self.isSplitLine( d ) ) {
					html.push( self.tpl(opt.dropdownItemSplitLineTpl,d) );	
				} else {
					html.push( self.tpl(opt.dropdownItemTpl,d) );
				}
			}	
			$('#'+opt.id+'_dropdown_list').html( html.join('') );
			
			self.setDropDownEvent();
			
			self.fireEvent('onCreateDropDwonList',[ dropdown,opt ]);
			
			return dropdown;
		},
		resetDropDownList : function(){
			this.createDropDownList.apply( this,arguments );
			this.setDropDownSize();
			return this;	
		},
		__DP_zIndex : Nex.Form.dropdownzIndex,
		__CItems : [],
		/*
		*显示下拉框
		*/
		showDropDown : function( list,callback ){
			var self = this,
				undef,
				_func,
				opt = self.configs;
			_func = $.isFunction( list ) ? list : null;
			_func = $.isFunction( callback ) ? callback : null;
			var func = function(){
				self.fireEvent("onDropDownShow",[opt]);
				if( $.isFunction( _func ) ) {
					_func.call( self );
				}
				if( opt.showDropDownShadow ) {
					self.showDropDownShadow();	
				}
			}
			
			if( !list || !$.isArray( list ) ) {
				list = opt.items;	
				self.__CItems.length = 0;
			} else {
				self.__CItems = list;		
			}
			
			var r = self.fireEvent('onBeforeDropDownShow',[ list,opt ]);
			if( r === false ) {
				return self;	
			}
			var dropdown = self.createDropDownList( list );
			
			self.setDropDownSize();
			
			//滚动到默认选中的列表
			var dsel = $('#'+opt.id+'_dropdown_list').find('>.nex-form-dropdown-item-selected:last');
			if( dsel.length ) {
				self.scrollToItemById( dsel.attr('id') );
			}
			
			var zIndex = Nex.Form.dropdownzIndex+2;
			self.__DP_zIndex = zIndex;
			dropdown.css('zIndex',zIndex);
			
			if( opt.animateDropDown ) {
				self._animateDropDownShow(func);	
			} else {
				self._defaultDropDownShow(func);		
			}
			return self;
		},
		/*关闭下拉框*/
		hideDropDown : function( callback ){
			var self = this,
				undef,
				func,
				opt = self.configs;	
			var func = function(){
				self.fireEvent("onDropDownHide",[opt]);
				if( $.isFunction( callback ) ) {
					callback.call( self );
				}
				if( opt.showDropDownShadow ) {
					self.hideDropDownShadow();	
				}
			}
			var r = self.fireEvent('onBeforeDropDownHide',[ opt ]);
			if( r === false ) {
				return self;	
			}
			self.unsetDropDownEvent();
			
			if( opt.animateDropDown ) {
				self._animateDropDownHide(func);	
			} else {
				self._defaultDropDownHide(func);		
			}
			return self;
		},
		/*计算下拉框的大小*/
		setDropDownSize : function(){
			var self = this,
				opt = self.configs;	
				
			var input = self.getInput();
			var space = self._getShowSpace( input );
			space.bottom -= opt.dropdownEdge;
			space.top 	 -= opt.dropdownEdge;
			space.left	 -= opt.dropdownEdge;
			space.right  -= opt.dropdownEdge;
			
			var bd = $('#'+opt.id+'_dropdown_body');
			var list = $('#'+opt.id+'_dropdown_list');
			
			var win_w = $(window).width();
			
			var h = opt.dropdownHeight > 0 ? opt.dropdownHeight : list._outerHeight();
			var w = opt.dropdownWidth > 0 ? opt.dropdownWidth : list._outerWidth();
			
			var max_w = opt.dropdownMaxWidth;
			var min_w = opt.dropdownMinWidth>0?opt.dropdownMinWidth:self.getInputWidth();
			var max_h = opt.dropdownMaxHeight;
			var min_h = opt.dropdownMinHeight;
			
			w = Math.max( w,min_w );
			w = Math.min( w,win_w );
			
			h = Math.min( h,Math.max(space.bottom,space.top) );
			if( opt.dropdownMinHeight>0 ) {
				h = Math.max( h,opt.dropdownMinHeight );
			}
			
			//最后计算大小
			if( max_w>0 ) {
				//if( max_w > min_w ) {
				w = Math.min( w,max_w );	
				//}
			}
			if( max_h>0 ) {
				h = Math.min( h,max_h );
			}
			
			bd._outerWidth( w );
			bd.height( h );
			
			if( opt.dropdownItemVisible ) {
				//是否有垂直滚动条
				if( Nex.hasScroll( bd,'left',true ) ) {
					var barS = sel.getScrollbarSize();
					w += barS.y;
					w += parseFloat(bd.css('borderLeftWidth')) + parseFloat(bd.css('borderRightWidth')) 
						+ parseFloat(bd.css('paddingRight')) + parseFloat(bd.css('paddingLeft'));
				}
			}
			var _d = {
				width : w,
				height : h	
			};
			self.fireEvent( 'onSetDropDownSize',[_d,opt] );
			
			bd._outerWidth( _d.width );
			bd.height( _d.height );
			
			return self;
		},
		resetDropDownSize : function(){
			return this.setDropDownSize();
		},
		/*下拉框事件*/
		setDropDownEvent : function(){
			var self = this,
				items = this.configs.items,
				opt = self.configs;	
				
			var list = $('#'+opt.id+'_dropdown_list');
			
			var getItemData = function( id ){
				var d = {};
				$.each( items.concat(self.__CItems) , function(i,v){
					if( !$.isPlainObject( v ) ) return;
					var value = v['__id'];
					if( value === id ) {
						d = v;
						return false;
					}
				} );	
				return d;
			};
			var _click = function(e){
				var $this = $(this);
				var id = $this.attr('id');
				var data = getItemData(id);
				
				if( data.disabled || $this.hasClass('nex-form-dropdown-item-disabled') ) {
					return;	
				}
				
				var r = self.fireEvent("onDropDownItemClick",[data,this,e]);	
				if( r !== false ) {
					$this.removeClass('nex-form-dropdown-item-selected');	
				
					if( opt.dropdownHideOnClick ) {
						self.hideDropDown();	
					}
				
					self.setDropDownValue( data );
					self.fireEvent("onDropDownItemSelect",[data,this,e]);
				}
			};
			//下拉框列表事件
			list.undelegate('>.nex-form-dropdown-item')
				.delegate('>.nex-form-dropdown-item',{
				"mouseenter" : function(e){
					var $this = $(this);
					var id = $this.attr('id');
					var data = getItemData(id);
					
					if( data.disabled || $this.hasClass('nex-form-dropdown-item-disabled') ) {
						return;	
					}
					
					var r = self.fireEvent("onDropDownItemOver",[data,this,e]);	
					if( r !== false ) {
						$this.addClass('nex-form-dropdown-item-over');
					}
					
				},
				"mouseleave" : function(e){
					var $this = $(this);
					var id = $this.attr('id');
					var data = getItemData(id);
					
					if( data.disabled || $this.hasClass('nex-form-dropdown-item-disabled') ) {
						return;	
					}
					
					var r = self.fireEvent("onDropDownItemOut",[data,this,e]);	
					if( r !== false ) {
						$this.removeClass('nex-form-dropdown-item-over');
					}
					
				},
				"click" : _click
			});
			
			self.unsetDropDownEvent();
			
			if( opt.dropdownHideOnClick ) {
				//移除下拉框事件
				$(document).bind('mousewheel.dropdown_'+opt.id+' contextmenu.dropdown_'+opt.id+' mousedown.dropdown_'+opt.id,function(e){
					var target = e.target || e.srcElement;
					if( $(target).is( '#'+opt.id ) 
						|| $(target).is( '#'+opt.id+'_dropdown' ) 
						|| $(target).parents('#'+opt.id+'_dropdown,#'+opt.id).size() 
					) {
						//
					} else {
						self.hideDropDown();		
					} 
				});
				$(window).bind('resize.dropdown_'+opt.id,function(){
					self.hideDropDown();			
				});
			}
			//支持上下键选择
			$(document).bind("keydown.dropdown_"+opt.id,function(e){
				var sbody = $("#"+opt.id+"_dropdown_list");
				var cur = sbody.find(">.nex-form-dropdown-item-over:last");
				var isFirst = false;
				if( !cur.size() ) {
					cur = sbody.find(">.nex-form-dropdown-item-selected:last");
					if( !cur.size() ) {
						cur = sbody.find(">.nex-form-dropdown-item:first");	
						isFirst = true;
					}
				}
				
				if( !cur.size() ) return;
				var it = cur;
				var _cur = cur;
				switch( e.keyCode ) {
					case 38 : //up
						sbody.find(">.nex-form-dropdown-item").removeClass("nex-form-dropdown-item-over");
						do {
							var prev = isFirst ? cur : cur.prev();
							if( prev.length ) {
								if( !prev.hasClass('nex-form-dropdown-item') ) {
									cur = prev;
									continue;	
								}
								if( prev.hasClass('nex-form-dropdown-item-disabled') ) {
									cur = prev;
									if( isFirst ) break;
									isFirst = false;
									continue;	
								} else {
									cur = prev;
									_cur = prev;	
								}
							} else {
								prev = _cur;
								if( !prev.hasClass('nex-form-dropdown-item') ) {
									cur = prev;
									isFirst = false;
									break;	
								}	
							}
							isFirst = false;
							
							var oitem = prev.size() ? prev : _cur;
							var id = oitem.attr('id');
							var data = getItemData(id);
							
							var r = self.fireEvent("onDropDownItemForward",[data,oitem[0],e]);	
							if( r !== false ) {
								oitem.addClass('nex-form-dropdown-item-over');
							}
							//oitem.addClass("nex-form-dropdown-item-over");		
							
							self.scrollToItem( data );
							break;
						} while(1);
						
						break;
					case 40 : //down
						sbody.find(">.nex-form-dropdown-item").removeClass("nex-form-dropdown-item-over");
						do {
							var next = isFirst ? cur : cur.next();
							isFirst = false;
							if( next.length ) {
								if( !next.hasClass('nex-form-dropdown-item') ) {
									cur = next;
									continue;	
								}
								if( next.hasClass('nex-form-dropdown-item-disabled') ) {
									cur = next;
									//如果需要滚动到disabled的话 需要在这里添加scrollToItem
									continue;	
								} else {
									cur = next;
									_cur = next;	
								}
							} else {
								next = _cur;
								if( !next.hasClass('nex-form-dropdown-item') ) {
									cur = next;
									isFirst = false;
									break;	
								}		
							}
							
							var oitem = next.size() ? next : _cur;
							var id = oitem.attr('id');
							var data = getItemData(id);
							
							var r = self.fireEvent("onDropDownItemForward",[data,oitem[0],e]);	
							if( r !== false ) {
								oitem.addClass("nex-form-dropdown-item-over");	
							}
							
							self.scrollToItem( data );
							break;
						} while(1);
						
						break;
					case 13:
						//sbody.find(">.nex-form-dropdown-item-over").trigger('click',[e]);//因为使用的是委托 模拟触发会出现问题
						_click.call(sbody.find(">.nex-form-dropdown-item-over"),e);
						//键盘触发 并不会触发是输入框失去焦点
						//self.blur();
						break;
				}
				
			});	
			self.fireEvent( 'onSetDropDownEvent',[opt] );
			
			return self;
		},
		/*
		*滚动到指定item
		*param value
		*/
		scrollToItem : function(val){
			var self = this;
			var opt = self.configs;	
			var items = opt.items;
			var id = '';
			
			if( typeof val === 'object' ) {
				val = val[opt.valueKey];	
			}
			
			for( var i=0;i<items.length;i++ ) {
				if( items[i]['value']+'' === val+'' ) {
					id = items[i]['__id'];
					break;
				}	
			}
			
			if( !id ) {
				return self;	
			}
			
			var body = $("#"+opt.id+"_dropdown_body");
			
			if( !body.length ) {
				return self;	
			}
			
			var offset = body.offset();
			var h = body._outerHeight();
			
			var f = $("#"+id);
			if( !f.length ) {
				return self;	
			}
			
			var fo = f.offset();
			var fh = f._outerHeight();
			
			var outerHeight = 0;
			if( offset.top > fo.top ) {
				outerHeight = offset.top - fo.top;
			} else if( (offset.top+h) < (fo.top+fh) ) {
				outerHeight = (offset.top+h) - (fo.top+fh);
			}
			
			var sTop = 0;
			
			sTop = body.scrollTop() - outerHeight;
			
			body.scrollTop( sTop );
			
			return self;
		},
		scrollToItemById : function( id ){
			var self = this,
				items = this.configs.items,
				opt = self.configs;	
			
			var getItemData = function( id ){
				var d = {};
				$.each( items.concat(self.__CItems) , function(i,v){
					if( !$.isPlainObject( v ) ) return;
					var value = v['__id'];
					if( value === id ) {
						d = v;
						return false;
					}
				} );	
				return d;
			};
			
			self.scrollToItem( getItemData( id ) );
			
			return self;
		},
		unsetDropDownEvent : function(){
			var self = this,
				opt = self.configs;
			$(document).unbind('.dropdown_'+opt.id);	
			$(window).unbind('.dropdown_'+opt.id);	
			self.fireEvent('onUnsetDropDownEvent',[ opt ]);
			return self;
		},
		//取消所有选中状态
		unselectDropDownAll : function(){
			var self = this,
				undef,
				opt = self.configs;
			$.each( opt.items.concat(self.__CItems),function(i,d){
				if( typeof d === 'object' ) {
					d.selected = false;	
				}
			} );
			$('#'+opt.id+'_dropdown_list').find('>.nex-form-dropdown-item-selected').removeClass('nex-form-dropdown-item-selected');
			return self;
		},
		setDropDownValue : function( data ){
			var self = this,
				undef,
				opt = self.configs;
				
			self.unselectDropDownAll();	
				
			data.selected = true;
			
			var d = $.extend({},data);	
			
			self.fireEvent('onSetDropDownValue',[ d,opt ]);	
			
			self.val( d[opt.valueKey],d[opt.textKey],d );
			
			return self;
		},
		__DP_ShowAlign : 'bottom',
		/*默认动画显示下拉框*/
		_defaultDropDownShow : function( callback ){
			var self = this,
				undef,
				func,
				opt = self.configs;	
			var dropdown = $('#'+opt.id+'_dropdown');
			func = $.isFunction( callback ) ? callback : null;	
			var at = self.getInput();
			dropdown.showAt(
				$.extend(
					{
						el:at
						,xAlign:'left'
						,yAlign:'bottom'
						,offsetY:-1,
						"onShow.dropdown" : function(pos,conf){
							self.__DP_ShowAlign = conf.yAlign;
							dropdown.removeClass('nex-form-dropdown-'+conf.yAlign);
							dropdown.addClass('nex-form-dropdown-'+conf.yAlign);
						} 
					}
				,opt.dropdownShowAt
				) 
			);
			
			if( $.isFunction( func ) ) {
				func.call( self,dropdown );
			}
			return self;
		},
		_defaultDropDownHide : function( callback ){
			var self = this,
				undef,
				opt = self.configs;	
				
			$('#'+opt.id+'_dropdown').remove();	
			
			if( $.isFunction( callback ) ) {
				callback.call( self );
			}
			return self;
		},
		_animateDropDownShow : function( callback ){
			
		},
		_animateDropDownHide : function( callback ){
			
		},
		showDropDownShadow : function(){
			var self = this,
				undef,
				opt = self.configs;
			var r = self.fireEvent('onBeforeDropDownShadowShow',[opt]);
			if( r === false ) {
				return self;	
			}	
			var shadow = $('#'+opt.id+'_dropdown_shadow');
			if( !shadow.length ) {
				shadow = $('<div id="'+opt.id+'_dropdown_shadow" class="nex-form-dropdown-shadow">'+(Nex.IEVer<=8?'<iframe style="width:99%;height:99%;">':'')+'</iframe></div>').appendTo(document.body);
			}
			var dropdown = self.getDropDown();
			shadow._width( dropdown.outerWidth() );
			shadow._height( dropdown.outerHeight() );
			shadow.css( dropdown.offset() )
				  .css( 'zIndex',self.__DP_zIndex-1 );
			self.fireEvent('onDropDownShadowShow',[opt]);
			shadow.removeClass('nex-form-dropdown-shadow-'+self.__DP_ShowAlign);
			shadow.addClass('nex-form-dropdown-shadow-'+self.__DP_ShowAlign);
			return self;
		},
		hideDropDownShadow : function(){
			var self = this,
				undef,
				opt = self.configs;
			var r = self.fireEvent('onBeforeDropDownShadowHide',[opt]);
			if( r === false ) {
				return self;	
			}		
			var shadow = $('#'+opt.id+'_dropdown_shadow');
			shadow.remove();
			self.fireEvent('onDropDownShadowHide',[opt]);
			return self;	
		},
		getDropDownShadow : function(){
			var self = this,
				opt = self.configs;	
			return $('#'+opt.id+'_dropdown_shadow');	
		}
	});
});