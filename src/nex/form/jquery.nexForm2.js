/*
Nex.Form  继承 Nex.Html
xtype form|textfield
author:nobo
qq:505931977
QQ交流群:13197510
email:zere.nobo@gmail.com or QQ邮箱

*/
;(function($){
	"use strict";
	var form = Nex.define('Nex.form.Form','Nex.Html',{
		alias : 'Nex.Form',
		xtype : 'form textfield'	
	});
	
	Nex.form = form;//兼容以前版本
	Nex.form.Form = form;
	
	form.extend({
		version : '1.0', 
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
		//验证是否通过
		/*
		*m 是否验证disabled 字段 默认不验证 false
		*/
		valid : function(group,m){
			var self = this;
			var r = self.checkGroup(group,m);
			return r === true ? true : false;
		},
		//验证某一元素
		checkElement : function( name,group ){
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
			autoDestroy : true,
			autoResize : false,
			_hasBodyView : false,
			_checkScrollBar : false,
			denyEvents : true,
			borderCls : [opt.borderCls,'nex-form-border'].join(' '),
			containerCls : [opt.containerCls,'nex-form'].join(' '),
			autoScroll : false,
			autoScrollCls : '',
			autoFocus : false,
			tabIndex : false,
			multiSplit : ',',
			showLabel : true,// 是否开启Label显示
			labelStyle : {},//尚未实现 预留
			labelvAlign : 'middle',
			labelPosition : 'left',//left top bottom right
			labelAlign : 'left',
			labelText : '',
			renderTo : document.body,
			labelWidth : 80,
			labelCls : '',
			placeholder : '',
			autocomplete : 'off',
			display : 'inline',
			group : 'default',//分组
			name : '',
			value : '',
			_value : '',
			triggerBtns : [],
			inputAttrs : {},
			formater : null,//数据自定义格式 显示作用
			getFormater : null,//数据获取最终控制
			setFormater : null,//数据获取最终控制
			//isShiftKey : false,
			//isCtrlKey : false,
			//_firstIndex : null,
			//_lastIndex : null,
			renderer : {},
			_renderer : {},//反renderer
			rendererDef : '_default_',
			isIE : !!window.ActiveXObject,
			url : '',//支持远程创建 返回数据格式  json
			dataType : 'json',
			method : 'get',
			parames : {},
			validator : Nex.formValid || {},
			rules : [],
			messages : {},
			//error : 'nex-form-valid-error',//已经移除 无效
			errorCls : 'nex-form-valid-error',
			successCls : 'nex-form-valid-success',
			items : [],//{cls:'',text:'年龄',value:'45',readOnly:false,disabled:false,selected:true,attrs:''} or '|' ',' ';'
			_multiItems : [],//multi缓存数据
			_item :　{
				cls:'',
				text:'',
				value:'',
				readOnly:false,
				disabled:false,
				selected:false,
				title : '',//multiSelect
				attrs:'',
				display : 'inline-block'
			},
			showAt : {},
			//listFilter : null,// callback select multiselect @return false 则过滤当前項
			leftText : '',
			rightText : '',
			width : 150,
			height : 'auto',//textarea multselect
			//step : 1,//spinner,
			//poll1 : 300,
			//poll2 : 50,
			//smax : null,//spinner,
			//smin : null,//spinner,
			//type : 'text',
			//singleSelect : false,//mulitselect 是否只能单选
			//multiSelect : false,//select 单选多选 , 无效
			//selectListMaxHeight : 0,
			//selectListMaxWidth : 0,
			//selectReadOnly : true,//控制select 不可写
			//emptyOnShowAll : true,//如果查询输入框为空 则显示所有
			onCheck : ['onChange','onBlur','onPaste'],//什么时候进行数据验证
			disabled : false,
			readOnly : false,
			cls : '',
			overCls : '',
			focusCls : '',
			disabledCls : '',
			readonlyCls : '',
			_oldVal : '',
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
				onBeforeSet : $.noop,
				onAfterSet : $.noop,
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
		/*
		*获取表单模版
		*/
		_getFormTpl : function(){
			var self = this,
				opt = self.configs;
			var d = opt;
			var attrs = [];	
			if( $.isPlainObject( d.inputAttrs ) ) {
				$.each( d.inputAttrs,function(k,v){
					attrs.push(k+'='+v);
				} );
			}
			attrs.join(' ');
			var text = [];
			text.push('<table id="'+d.id+'-inner" class="nex-field nex-form-inner" cellspacing="0" cellpadding="0" ><tbody>');//style="table-layout:fixed;" 不建议设置 IE 67 下会有问题
			text.push('<tr id="'+d.id+'-inputRow">');
				text.push('<td class="nex-form-inner-body" id="'+d.id+'-body-td">');	
				text.push('<div id="'+d.id+'-body">');	
					text.push('<input '+attrs+' id="'+d.id+'-input" placeholder="'+d.placeholder+'" type="'+d.type+'"  name="'+d.name+'" value="" style="width:0px;" class="nex-form-field nex-form-text" autocomplete="'+d.autocomplete+'" />');
				text.push('</td>');
			text.push('</tr>');
			text.push('</tbody></table>');
			return text.join("");
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
			
			self._bindEvent();
			
			return self;
		},
		_setViewSize : function(){
			var self = this,
				opt = self.configs,
				container = opt.views['container'],
				bd = self.getInput();
			var inputRow = $("#"+opt.id+"-inputRow");
			var w = 0;
			$('>td',inputRow).not('.nex-form-inner-body').each( function(){
				w += $(this)._outerWidth();	
			} );
			bd._outerWidth( container.width()-w );
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
			td.push('<td valign="'+opt.labelvAlign+'" align="'+opt.labelAlign+'" id="'+opt.id+'-label-td" class="nex-form-inner-label ">');	
				td.push('<label id="'+opt.id+'-label" for="'+opt.id+'-input" class="nex-form-label"></label>');
			td.push('</td>');
			
			var $td = $(td.join(''));
			
			$("#"+opt.id+"-body-td").before($td);
			
			$('#'+opt.id+'-label').css( opt.labelStyle );
			
			return self;	
		},
		/*
		*设置Label位置
		*/
		setLabelPosition : function( pos ){
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
		/*
		*设置Label内容
		*/
		setLabelText : function( text ){
			var opt = this.configs;
			var label = $('#'+opt.id+'-label');
			label.empty();
			this.renderComponent( text || opt.labelText,label );
			return this;	
		},
		/*
		*设置Lable宽度
		*/
		setLabelWidth : function( w ){
			var opt = this.configs;
			$('#'+opt.id+'-label')._outerWidth( w || opt.labelWidth );
			return this;	
		},
		checkLabelSet : function(){
			var self = this,
				opt = this.configs;	
			if( !opt.showLabel ) return self;	
			self._setLabel()
				.setLabelPosition( opt.labelPosition )
				.setLabelWidth( opt.labelWidth )
				.setLabelText( opt.labelText );
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
			
			opt._value = opt.value;
			if( opt.value ) {
				//self.lockEvent('onSetValue');
				self.lockEvent('onChange');
				
				//初始值设置
				self.setValue( opt.value );	
				
				//self.unLockEvent('onSetValue');
				self.unLockEvent('onChange');
			}
		},
		/*
		*获取显示的input
		*/
		getInput : function(){
			var self = this;
			var opt = self.configs;
			var input = $("#"+opt.id+"-input");
			return input;
		},
		/*
		*获取实际中的input 一般和input相同
		*/
		getInputReal : function(){
			var self = this;
			var opt = self.configs;
			var input = $("#"+opt.id+"-input");
			return input;
		},
		/*
		*获取输入框的值
		*/
		getInputValue : function(){
			var self = this;
			var opt = self.configs;
			var input = self.getInputReal();
			
			var value = input.val();
			
			return value;	
		},
		setInputValue : function( value ){
			var self = this;
			var opt = self.configs;
			var input = self.getInputReal();
			input.val( value );
			
			self.currentValue = value;
			
			return self;
		},
		/*
		*获取输入框的显示值 一般和getInputValue相同
		*/
		getInputText : function(){
			var self = this;
			var opt = self.configs;
			var input = self.getInput();
			
			var value = input.val();
			
			return $.trim( value );	
		},
		setInputText : function( value ){
			var self = this;
			var opt = self.configs;
			var input = self.getInputText();
			input.val( value );
			return self;
		},
		//过渡用
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
			//formater 一般不建议使用 只对设置时有效，作用和renderer一样
			if( $.isFunction( opt.formater ) ) {
				var val = opt.formater.call( self,argvs );
				if( val !== undef ) {
					if( !$.isArray( val ) ) {
						argvs = [ val ];	
					}
				}
			}
			
			if( !argvs.length ) {
				return self;	
			}
			
			argvs[0] = self.rendererEncode(argvs[0]);
			
			self.setInputValue.apply(self, argvs );
			
			var newValue = argvs[0];
			
			if( oldValue != newValue && self._oldValue!==null ) {
				self._oldValue = null;
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
			
			var events = {
				'click' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return false;	
					}
					var r = self.fireEvent('onClick',[ this,e ]);	
					if( r === false ) return false;
				},
				'focus' : function(e) {
					if( opt.disabled || opt.readOnly ) {
						return false;	
					}
					
					self._focusValue = $(this).val();
					
					var input = $('#'+opt.id+"-input");
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
					
					var input = $('#'+opt.id+"-input");
					input.removeClass('nex-form-field-focus');
					
					$('#'+opt.id).removeClass('nex-form-focus');
					
					if( oldValue !== newValue ) {
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
			
			var input = $("#"+opt.id+"-input");
			
			input.bind(events);
		},
		addTriggerBtn : function( msg,callback ){
			var self = this,
				opt = self.configs;	
			
			var td = [];
			
			td.push('<td valign="'+opt.labelvAlign+'" align="'+opt.labelAlign+'" class="nex-form-trigger-td">');	
					td.push('<div id="'+opt.id+'-trigger-'+(self._triggerID++)+'" class="nex-form-trigger-btn"></div>');
			td.push('</td>');	
			var td = $(td.join(""));
			
			var triggerBtnTd = $("#"+opt.id+"-inputRow td:last");
			triggerBtnTd.after(td);
			var itemBtn = td.find(">div");
			if( $.isFunction(callback) ) {
				itemBtn.bind('click',function(e){
					callback.call( self,itemBtn,e );	
				});
			}
			
			self.renderComponent( msg,itemBtn );
				
			self.resetViewSize();
			
			return td;
		},
		removeTriggerBtn : function( td ){
			var self = this,
				opt = self.configs;	
			if( td ) {
				$(td).remove();
				self.resetViewSize();	
				Nex.gc();
			}		
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
		_sysEvents : function(){
			var self = this;
			var opt = self.configs;
			
			Nex.Html.fn._sysEvents.apply( self,arguments );
			
		//	self.bind("onStart",self._initCof,self);
			
			//self.bind("onCreate",self.onCreate,self);
			//self.bind("onCreate",self.addList,self);
			//self.bind("onCreate",self.onDisabled,self);
			//self.bind("onCreate",self.onReadOnly,self);
			//self.bind("onCreate",self._setValue,self);
			/*self.bind("onCreate",function(){
				this.lockMethod('setSize');
				this.setLabelText();	
				this.unLockMethod('setSize');						  
			},self);*/
			
			self.bind("onMouseOver",self.onMouseOver,self);
			self.bind("onMouseOut",self.onMouseOut,self);
			
			self.bind("onFocus",self._setFocusCls,self);
			self.bind("onBlur",self._unsetFocusCls,self);
			
			
			//self.bind("onBeforeSet",self.onBeforeSet,self);
			//self.bind("onAfterSet",self.onAfterSet,self);
			self.bind("onChange",self.onChange,self);
			self.bind("onBlur",self.refreshFormater,self);//refreshFormater
			self.bind("onBlur",self.refreshRenderer,self);
			
			self.bind("onValidError",self.setValidError,self);
			self.bind("onValidSuccess",self.setValidSuccess,self);
			for(var i=0;i<opt.onCheck.length;i++ ) {
				var s = self.bind(opt.onCheck[i],self.onCheck,self);	
			}
			return self;
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
		onCreate : function(){
			var self = this;
			var opt = self.configs;
			var method = opt.type + 'Extend';
			if( method in self ) {
				self[method].call(self);
			}
		},
		_initCof : function(){
			var self = this;
			var opt = self.configs;
			
			opt.cls += ' nex-form-display-'+opt.display+' nex-form-'+opt.group+'-wraper nex-form-'+opt.type+'-wraper ';
			
			if(opt.disabled){
				opt.attrs += 'disabled';
			}
			if(opt.readOnly){
				opt.attrs += ' readOnly ';
			}
		
			
			var method = opt.type + 'Start';
			if( method in self ) {
				self[method].call(self);
			}
		},
		onDisabled : function(){
			var self = this;
			var opt = self.configs;
			if( opt.disabled )
				self.disabled();
		},
		onReadOnly : function(){
			var self = this;
			var opt = self.configs;
			if( opt.readOnly ) {
				self.readOnly();
			}
		},
		//自动销毁时调用
		_destroy : function(){
			var self = this;
			var opt = self.configs;
			var method = opt.type+'Destroy';
			if( method in self ) {
				self[method].apply(self,[]);
			}
			self.fireEvent("onDestroy");
			return self;
		},
		destroy : function(){
			this._destroy();
		},
		setSize : function(w,h,cb){
			var self = this;
			var opt = self.configs;
			var w = self._undef(w,opt.width);
			var h = self._undef(h,opt.height);
			var call = self._undef(cb,null);
			opt.width = w;
			opt.height = h;
			
			var method = opt.type+'SetSize';
			
			var rsize = function(){
				if( method in self ) {
					self[method].apply(self,[w,h]);
				} else {
					self.commonSetSize(w,h);	
				}
				self.fireEvent("onSizeChange",[w,h,opt]);
				if($.isFunction( call )) {
					call();	
				}
			};
			/*if( Nex.isIE6 || Nex.isIE7 ) {
				setTimeout(rsize,0);	
			} else {
				rsize()	;
			}*/
			setTimeout(rsize,0);	
		},
		/*resize : function(w,h){
			var self = this;
			var opt = self.configs;
			self.setSize(w,h);
		},*/
		_setFocusCls : function(t,e){
			var self = this;
			var opt = self.configs;
			if( opt.disabled || opt.readOnly ) {
				return;	
			}
			var field = $("#"+opt.id);
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
			var field = $("#"+opt.id);
			if( opt.focusCls ) {
				field.removeClass(opt.focusCls);	
			}	
		},
		onMouseOver : function(t,e){
			var self = this;
			var opt = self.configs;
			if( opt.disabled || opt.readOnly ) {
				return;	
			}
			var field = $("#"+opt.id);
			field.addClass('nex-form-wraper-over');
			$('>.nex-form-item',field).addClass('nex-form-item-over');
			if( opt.overCls ) {
				field.addClass(opt.overCls);	
			}
		},
		onMouseOut : function(t,e){
			var self = this;
			var opt = self.configs;
			if( opt.disabled || opt.readOnly ) {
				return;	
			}
			var field = $("#"+opt.id);
			field.removeClass('nex-form-wraper-over');
			$('>.nex-form-item',field).removeClass('nex-form-item-over');
			if( opt.overCls ) {
				field.removeClass(opt.overCls);	
			}
		},
		onBeforeSet : function(){
			var self = this;
			var opt = self.configs;
			opt._oldVal = opt._oldVal === null ? self.val() : opt._oldVal;
		},
		onAfterSet : function(){
			var self = this;
			var opt = self.configs;
			var newVal = self.val();
			if( opt._oldVal != newVal && opt._oldVal!==null ) {
				opt._oldVal = null;
				self.fireEvent('onChange',[]);	
			}
		},
		onCommonChange : function(){
			var self = this;
			var opt = self.configs;
			opt.value = self.val() ;
			return self;	
		},
		onChange : function(){
			var self = this;
			var opt = self.configs;
			var method = opt.type+'ValueChange';
			if( method in self ) {
				self[method].apply(self,[]);	
			} else {
				self.onCommonChange.apply(self,[]);
			}
		},
		onCheck :　function(){
			var self = this;
			var opt = self.configs;
			if( opt._ct ) {
				clearTimeout( opt._ct )
			}
			opt._ct = setTimeout(function(){
				self.checkVal();
				opt._ct = 0;	
			},0);
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
		commonSetSize : function(width,height){
			var self = this;
			var opt = self.configs;
			
			var $table = $("#"+opt.id+"-item");
			
			var $input = $("#"+opt.id+"-input");
			
			$("#"+opt.id)._outerWidth( width );
			
			var lw = 0;
			$("#"+opt.id+"-inputRow >td.nex-form-label-cell").each(function(){
				lw += $(this)._outerWidth();																
			});
			$("#"+opt.id+"-inputRow >td.nex-form-button-cell").each(function(){
				lw += $(this)._outerWidth();																
			});
			
			$table._outerWidth( width );
			
			$input._outerWidth( width - lw );		
		},
		removeLabelText : function(td){
			var self = this;
			td.remove();
			self.setSize();
		},
		addItemButton : function(msg,w){
			var self = this;
			var opt = self.configs;
			var d = opt;
			
			//var w = self._undef( w , 17 );
			var w = self._undef( w , false );
			
			var td = [];
			
			td.push('<td valign="top" align="left" class="nex-form-button-cell">');	
					td.push('<div id="'+d.id+'-button-'+(Nex.aid++)+'" class="nex-form-item-button"></div>');
			td.push('</td>');	
			var td = $(td.join(""));
			
			var itemBtnTd = $("#"+opt.id+"-inputRow td:last");
			itemBtnTd.after(td);
			var itemBtn = td.find(">div");
			if( w ) {
				itemBtn._outerWidth( w );
			}
			
			self.addComponent( itemBtn,msg );
			
			self.setSize();
			return td;	
		},
		/*
		*@m true 默认 返回数据  false返回索引
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
		removeItemButton : function(){
			this.removeLabelText();
		},
		getConf : function(){
			var self = this,
				opt = self.configs;
			var success = function(data){
						if( $.isPlainObject( data ) ) {
							opt = $.extend(opt,data);	
						}
						self.create();
					};
			var error = function(xmlHttp){
						self.create();
					};
			if( $.isFunction(opt.url) ) {
				opt.url.call(self,success,error);
			} else {
				$.ajax({
					url : opt.url,
					type : opt.method,
					dataType : opt.dataType,
					data : opt.queryParams,
					success : success,
					error : error
				});
			}
		}
	});
})(jQuery);