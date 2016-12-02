;$define([
	'Nex.form.Display'
],function(){
	"use strict";
	var textfield = Nex.define('Nex.form.Radio','Nex.form.Display',{
		alias : 'Nex.Form.Radio',
		xtype : 'radiofield',
		initComponent : function(){
			var self = this;
			var opt = this.configs;	
			
			self._setRadios( opt.items );
			
			self._setRadioEvents();
			
			//调用父级构造函数
			Nex.form.Display.fn.initComponent.apply( self,arguments );
			
			if( !opt.radioLabelSelection ) {	
				var input = self.getInput();
				input.disableSelection();
			}
			
		},
		_bindEvent : function(){
			var self = this;
			var opt = this.configs;	
			
			//调用父级函数
			Nex.form.Display.fn._bindEvent.apply( self,arguments );	
			//if( !Nex.isIE ) return self;
			var input = $("#"+opt.id+"-input");
			var _t = 0;
			input.unbind('focus blur')
				 .bind({
					'focus2' : function(e) {
						if( opt.disabled || opt.readOnly ) {
							return;	
						}
						
						if( input.hasClass('nex-form-field-focus') ) {
							return;	
						}
						
						self._focusValue = $(this).val();
						
					//	var input = $('#'+opt.id+"-input");
						
						input.addClass('nex-form-field-focus');
						$('#'+opt.id).addClass('nex-form-focus');
						
						var r = self.fireEvent('onFocus',[ this,e ]);	
						if( r === false ) return false;
					},
					'blur2' : function(e) {
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
					}
				});
		},
		/*private*/
		_setRadios : function( items ){
			var self = this;
			var opt = this.configs;	
			var input = self.getInput();
			var html = [];
			var valueKey = opt.valueKey,
				textKey = opt.textKey;
			var items = self._undef( items,opt.items );
			if( !$.isArray( items ) ) {
				return self;
			}
			var len = items.length;
			for( var i=0;i<len;i++ ) {
				var _d = self._parseItemData( items[i] );
				items[i] = _d;
				var d = $.extend( {
					//id 		 : items[i]['__id'],
					cls 	 : '',
					readOnly : false,
					disabled : false,
					display  : 'inline',
					width 	 : 'auto'
				}, opt.itemDefault ,_d );
				d.id = items[i]['__id'];
				if( !self.isSplitLine( d ) ) {
					html.push('<span id="'+d.id+'" tabindex="'+(++Nex.tabIndex)+'" class="nex-form-radio-item nex-form-radio-item-d-'+d.display+' '+ (d.readOnly?'nex-form-radio-item-readonly':'') +' '+ (d.disabled?'nex-form-radio-item-disabled':'') +' '+d.cls+'" value="'+d[valueKey]+'" value="'+encodeURIComponent(d[valueKey])+'" style="'+( isNaN(parseInt( d.width )) ? '' : 'width:'+parseInt( d.width )+'px' )+'"><span id="'+opt.id+'-radio-icon" class="nex-form-radio-icon"></span><span class="nex-form-radio-text">'+d[textKey]+'</span></span>');				 
				} else {
					html.push( self.tpl(opt.dropdownItemSplitLineTpl,d) );
				}
			}
			
			input.html( html.join('') );
			
			return self;
		},
		resetRadios : function( items ){
			var self = this;
			var opt = this.configs;	
			var value = self.getValue();	
			if( !$.isArray( items ) ) {
				return self;	
			}
			opt.items = items;
			self._setRadios( items );
			
			self.checked( value, false );
			
			return self;
		},
		/*private*/
		_setRadioEvents : function(){
			var self = this;
			var opt = this.configs;	
			var input = self.getInput();
			
			var fn = function( evt1,evt2,e,func ){
				if( opt.disabled || opt.readOnly ) {
					return;	
				}
				var $this = $(this);
				var id = $this.attr('id');
				var d = self.getItemDataById( id );
				if( d.disabled || d.readOnly ) {
					return;
				}	
				var r;
				if( $.isFunction( d[evt2] ) ) {
					r = d[evt2].call( self,d );	
					if( r === false ) return false;	
				}	
				
				r = self.fireEvent(evt1,[ d[ opt.valueKey ],d,this,e ]);	
				if( r === false ) return false;	
				
				if( $.isFunction( func ) ) {
					func.call( this,d );	
				}
				
			};
			var __t = 0;
			var __t2 = 0;
			input.undelegate('>.nex-form-radio-item')
				 .delegate('>.nex-form-radio-item',{
					"click" : function(e){
						if( opt.disabled || opt.readOnly ) {
							return;	
						}
						
						var $this = $(this);
						var id = $this.attr('id');
						var d = self.getItemDataById( id );
						var r;
						if( d.disabled || d.readOnly ) {
							return;
						}	
						if( $.isFunction( d.callBack ) ) {
							r = d.callBack.call( self,d,e );	
						}
						if( $.isFunction( d.callback ) && r !== false ) {
							r = d.callback.call( self,d,e );	
						}
						if( $.isFunction( d.handler ) && r !== false ) {
							r = d.handler.call( self,d,e );	
						}
						if( r !== false ) {
							r = fn.call( this,'onRaidoClick','click',e );
						}
						
						if( r === false ) return false;
						if( !$this.hasClass('nex-form-radio-item-checked') ) {
							self.setValue( d[ opt.valueKey ] );
							//$this.addClass('nex-form-radio-item-checked');
						}
						
					},
					"dblclick" : function(e){
						return fn.call( this,'onRaidoDblClick','dblclick',e );
					},
					"mouseenter" : function(e){
						var r = fn.call( this,'onRaidoOver','mouseover',e,function( d ){
							if( d.disabled || d.readOnly ) {
								return;
							}	
							$(this).addClass('nex-form-radio-item-over');
						} );
						if( r === false ) return false;
					},
					"mouseleave" : function(e){
						var r = fn.call( this,'onRaidoOut','mouseout',e,function( d ){
							if( d.disabled || d.readOnly ) {
								return;
							}	
							$(this).removeClass('nex-form-radio-item-over');
						} );	
						if( r === false ) return false;
					},
					"mousedown" : function(e){
						if( opt.disabled || opt.readOnly ) {
							return;	
						}
						//input.trigger('focus',[e]);
						
						var r = fn.call( this,'onRaidoMouseDown','mousedown',e,function( d ){
							if( d.disabled || d.readOnly ) {
								return;
							}	
							$(this).addClass('nex-form-radio-item-down');
							var $this = $(this);
							__t = setTimeout( function(){
								__t = 0;
								$(document).one('mouseup',function(){
									$this.removeClass('nex-form-radio-item-down');							 
								});					 
							},0 );
						} );	
						if( r === false ) return false;
					},
					"mouseup" : function(e){
						var r = fn.call( this,'onRaidoMouseUp','mouseup',e,function( d ){
							if( d.disabled || d.readOnly ) {
								return;
							}	
							$(this).removeClass('nex-form-radio-item-down');
							if( __t ) {
								clearTimeout( __t );	
								__t = 0;
							}
						} );	
						if( r === false ) return false;
					},
					"focus" : function(e){
						input.trigger('focus2',[e]);
						if( __t2 ) {
							clearTimeout( __t2 );
							__t2 = 0;
						}	
					},
					"blur"  : function(e){
						__t2 = setTimeout(function(){
							__t2 = 0;
							input.trigger('blur2',[e]);		
						},0);	
					}
				 });
		},
		getCheckedSize : function(){
			var self = this;
			var opt = this.configs;	
			var input = self.getInput();	
			return $('>.nex-form-radio-item-checked',input).length;		
		},
		_unchecked : function(){
			var self = this;
			var opt = this.configs;	
			var input = self.getInput();	
			$('>.nex-form-radio-item',input).removeClass('nex-form-radio-item-checked');
			return self;
		},
		_uncheckedAll : function(){
			var self = this;
			var opt = this.configs;	
			//var input = self.getInput();
			var radios = Nex.Form.get( opt.name,opt.group );
			$.each( radios,function(i,radio){
				radio._unchecked();
				if( radio.configs.id === opt.id ) {
					return;	
				}
				var v = radio.getValue();
				if( radio.getCheckedSize() ) {
					radio.fireEvent( 'onChange',[ '',v ] );	
				}
			} );
			//$('>.nex-form-radio-item',input).removeClass('nex-form-radio-item-checked');
			return self;
		},
		unchecked : function(){
			this.setValue('');
			return this;
		},
		checked : function( value,m ){
			var self = this;
			var opt = this.configs;	
			var input = self.getInput();
			var m = self._undef( m,true );
			var d = self.getItemData( value );
			d = $.isArray( d ) ? d[0] : d;
			if( d ) {
				if( m ) {
					self._uncheckedAll();
				}
				$('#'+d.__id).addClass('nex-form-radio-item-checked');
			}
		},
		/*
		*对单个radio设置disabled
		*@param value
		*param m private 默认true 设置disabled , false unsetDisabled
		*param css private 默认disabled , readonly
		*/
		setRadioDisabled : function( value,m,css ){
			var self = this;
			var opt = this.configs;	
			var m = self._undef( m,true );
			var css = self._undef( css,'disabled' );
			var d = self.getItemData( value );
			d = $.isArray( d ) ? d[0] : d;
			if( d ) {
				if( m ) {
					$('#'+d.__id).addClass('nex-form-radio-item-'+css);
					if( css === 'disabled' ) {
						d.disabled = true;	
					} else if( css === 'readonly' ) {
						d.readOnly = true;		
					} else {
						d[css] = true;	
					}
				} else {
					$('#'+d.__id).removeClass('nex-form-radio-item-'+css);
					if( css === 'disabled' ) {
						d.disabled = false;	
					} else if( css === 'readonly' ) {
						d.readOnly = false;		
					} else {
						d[css] = false;	
					}
				}
			}
			return self;		
		},
		unsetRadioDisabled : function( value ){
			return this.setRadioDisabled.apply( this,[ value,false ] );		
		},
		setRadioReadOnly : function(){
			return this.setRadioDisabled.apply( this,[ value,true,'readonly' ] );			
		},
		unsetRadioReadOnly : function(){
			return this.setRadioDisabled.apply( this,[ value,false,'readonly' ] );			
		},
		//重载
		getInputValue : function(){
			var self = this,undef;
			var opt = this.configs;	
			var input = self.getInput();
			var checked = $('>.nex-form-radio-item-checked',input);
			var value = '';
			if( checked.length  ) {
				value = decodeURIComponent( checked.attr('value') ) || '';
			}
			return value;
		},
		setInputValue : function( value ){
			var self = this;
			var opt = this.configs;
			
			self.checked( value );
			
			return self;
		},
		getInputText : function(){
			var self = this;
			var opt = this.configs;
			var value = self.getInputValue();
			var d = self.getItemData( value );
			d = $.isArray( d ) ? d[0] : d;
			if( d ) {
				return d[opt.textKey];	
			}
			return '';
		},
		setInputText : function( text ){
			var self = this;
			var opt = this.configs;
			var value = '';
			$.each( opt.items,function( i,d ){
				if( d[ opt.textKey ] === text ) {
					value = d[ opt.valueKey ];	
					return false;
				}	
			} );	
			self.setValue( value );
			return self;
		}
	});	
	//参数重载
	textfield.setOptions( function(opt){
		var tpl = opt.tpl;
		return {
			__inputType  		: 'radio',
			containerCls 		: [opt.containerCls,'nex-form-radio'].join(' '),
			showPlaceholder 	: false,
			triggerBtnsPosition : 'outer',
			radioLabelSelection : false,
			labelvAlign 		: 'top',
			width 				: 'auto',
			/*
			item = {
				cls : '',
				text : '',
				value : '',
				readOnly : false,
				disabled : false,
				display : 'inline',
				width : auto
			}
			或
			item = '-'
			*/
			itemDefault			: {},
			items 				: []
		};	
	} );
});