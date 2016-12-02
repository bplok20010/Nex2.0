;$define([
	'Nex.form.Radio'
],function(){
	"use strict";
	var Checkbox = Nex.define('Nex.form.Checkbox','Nex.form.Radio',{
		alias : 'Nex.Form.Checkbox',
		xtype : 'checkboxfield',
		initComponent : function(){
			var self = this;
			var opt = this.configs;	
			
			self._setCheckboxs( opt.items );
			
			self._setCheckboxEvents();
			
			//调用父级构造函数
			Nex.form.Display.fn.initComponent.apply( self,arguments );
			
			if( !opt.checkboxLabelSelection ) {	
				var input = self.getInput();
				input.disableSelection();
			}
			
		},
		/*private*/
		_setCheckboxs : function( items ){
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
					html.push('<span id="'+d.id+'" tabindex="'+(++Nex.tabIndex)+'" class="nex-form-checkbox-item nex-form-checkbox-item-d-'+d.display+' '+ (d.readOnly?'nex-form-checkbox-item-readonly':'') +' '+ (d.disabled?'nex-form-checkbox-item-disabled':'') +' '+d.cls+'" value="'+d[valueKey]+'" value="'+encodeURIComponent(d[valueKey])+'" style="'+( isNaN(parseInt( d.width )) ? '' : 'width:'+parseInt( d.width )+'px' )+'"><span id="'+opt.id+'-checkbox-icon" class="nex-form-checkbox-icon"></span><span class="nex-form-checkbox-text">'+d[textKey]+'</span></span>');				 
				} else {
					html.push( self.tpl(opt.dropdownItemSplitLineTpl,d) );
				}
			}
			
			input.html( html.join('') );
			
			return self;
		},
		resetCheckboxs : function( items ){
			var self = this;
			var opt = this.configs;	
			var value = self.getValue();	
			if( !$.isArray( items ) ) {
				return self;	
			}
			opt.items = items;
			self._setCheckboxs( items );
			
			self.setInputValue( value );
			
			return self;
		},
		/*private*/
		_setCheckboxEvents : function(){
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
			input.undelegate('>.nex-form-checkbox-item')
				 .delegate('>.nex-form-checkbox-item',{
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
							r = fn.call( this,'onCheckboxClick','click',e );
						}
						
						if( r === false ) return false;
						if( !$this.hasClass('nex-form-checkbox-item-checked') ) {
							self.setChecked( d[ opt.valueKey ] );
							//$this.toggleClass('nex-form-checkbox-item-checked');
						} else {
							self.unsetChecked( d[ opt.valueKey ] );	
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
							$(this).addClass('nex-form-checkbox-item-over');
						} );
						if( r === false ) return false;
					},
					"mouseleave" : function(e){
						var r = fn.call( this,'onRaidoOut','mouseout',e,function( d ){
							if( d.disabled || d.readOnly ) {
								return;
							}	
							$(this).removeClass('nex-form-checkbox-item-over');
						} );	
						if( r === false ) return false;
					},
					"mousedown" : function(e){
						var r = fn.call( this,'onRaidoMouseDown','mousedown',e,function( d ){
							if( d.disabled || d.readOnly ) {
								return;
							}	
							$(this).addClass('nex-form-checkbox-item-down');
							var $this = $(this);
							__t = setTimeout( function(){
								__t = 0;	
								$(document).one('mouseup',function(){
									$this.removeClass('nex-form-checkbox-item-down');							 
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
							$(this).removeClass('nex-form-checkbox-item-down');
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
			return $('>.nex-form-checkbox-item-checked',input).length;		
		},
		_uncheckedAll : function(){
			var self = this;
			var opt = this.configs;	
			var input = self.getInput();	
			$('>.nex-form-checkbox-item',input).removeClass('nex-form-checkbox-item-checked');
			$.each( opt.items , function(i,d){
				d.checked = false;	
			} );
			return self;
		},
		uncheckedAll : function(){
			this.setValue('');
			return this;
		},
		//选择所有
		checkedAll : function(  ){
			var self = this;
			var opt = this.configs;	
			var value = [];
			$.each( opt.items, function(i,d){
				value.push( d[ opt.valueKey ] );	
			} );
			self.setValue( value.join( opt.multiSplit ) );
			return self;
		},
		//反选
		reverseChecked : function(){
			var self = this;
			var opt = this.configs;	
			var selected = self.getValue();
			selected = selected.split( opt.multiSplit );
			var value = [];
			$.each( opt.items, function(i,d){
				if( $.inArray( d[opt.valueKey],selected ) === -1 ) {
					value.push( d[opt.valueKey] );
				}	
			} );
			self.setValue( value.join( opt.multiSplit ) );
			return self;
		},
		/*
		*对单个checkbox设置disabled
		*@param value
		*param m private 默认true 设置disabled , false unsetDisabled
		*param css private 默认disabled , readonly
		*/
		setCheckboxDisabled : function( value,m,css ){
			var self = this;
			var opt = this.configs;	
			var m = self._undef( m,true );
			var css = self._undef( css,'disabled' );
			var d = self.getItemData( value );
			d = $.isArray( d ) ? d[0] : d;
			if( d ) {
				if( m ) {
					$('#'+d.__id).addClass('nex-form-checkbox-item-'+css);
					if( css === 'disabled' ) {
						d.disabled = true;	
					} else if( css === 'readonly' ) {
						d.readOnly = true;		
					} else {
						d[css] = true;	
					}
				} else {
					$('#'+d.__id).removeClass('nex-form-checkbox-item-'+css);
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
		unsetCheckboxDisabled : function( value ){
			return this.setCheckboxDisabled.apply( this,[ value,false ] );		
		},
		setCheckboxReadOnly : function( value ){
			return this.setCheckboxDisabled.apply( this,[ value,true,'readonly' ] );			
		},
		unsetCheckboxReadOnly : function( value ){
			return this.setCheckboxDisabled.apply( this,[ value,false,'readonly' ] );			
		},
		_setChecked : function( value ){
			this.setCheckboxDisabled.apply( this,[ value,true,'checked' ] );	
		},
		setChecked : function( value ){
			var v1 = this.getInputValue();
			this._setChecked( value );	
			var v2 = this.getInputValue();
			if( v1 !== v2 ) {
				this.fireEvent('onChange',[v2,v1]);	
			}
			return this;		
		},
		_unsetChecked : function( value ){
			this.setCheckboxDisabled.apply( this,[ value,false,'checked' ] );
		},
		unsetChecked : function( value ){
			var v1 = this.getInputValue();
			this._unsetChecked( value );	
			var v2 = this.getInputValue();
			if( v1 !== v2 ) {
				this.fireEvent('onChange',[v2,v1]);	
			}
			return this;			
		},
		//重载
		getInputValue : function(){
			var self = this,undef;
			var opt = this.configs;	
			var input = self.getInput();
			var checked = $('>.nex-form-checkbox-item-checked',input);
			var value = [];
			if( checked.length  ) {
				checked.each( function(){
					value.push( decodeURIComponent( $(this).attr('value') ) );	
				} );
			}
			return value.join( opt.multiSplit );
		},
		setInputValue : function( value ){
			var self = this;
			var opt = this.configs;
			self._uncheckedAll();
			$.each( (value+'').split(opt.multiSplit),function(i,d){
				self._setChecked( d );	
			} );
			return self;
		},
		getInputText : function(){
			var self = this;
			var opt = this.configs;
			var value = self.getInputValue();
			var d = self.getItemData( value );
			d = $.isArray( d ) ? d : [d];
			var text = [];
			$.each( d,function(i,d){
				text.push( d[opt.textKey] );	
			} );
			return text.join( opt.multiSplit );
		},
		setInputText : function( text ){
			var self = this;
			var opt = this.configs;
			var value = [];
			var text = text.split( opt.multiSplit );
			$.each( opt.items,function( i,d ){
				if( $.inArray(d[ opt.textKey ],text) !== -1 ) {
					value.push( d[ opt.valueKey ] );
				}	
			} );	
			self.setValue( value.join( opt.multiSplit ) );
			return self;
		}
	});	
	//参数重载
	Checkbox.setOptions( function(opt){
		return {
			__inputType  : 'checkbox',
			containerCls : [opt.containerCls,'nex-form-checkbox'].join(' '),
			checkboxLabelSelection : false
		};	
	} );
});