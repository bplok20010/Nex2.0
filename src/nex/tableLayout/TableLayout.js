/*
Nex.TableLayout组件说明：
组件名称       : Nex.TableLayout 可通过 new Nex.TableLayout() 或者 Nex.Create('Nex.TableLayout') 来创建
组件别名xtype  : tablelayout  可通过Nex.Create('tablelayout')
加载名称       : Nex.Html 组件存放目录结构 {{nex目录}}/Html.js
*/
;(function($){
	"use strict";
	var tablelayout = Nex.extend('Nex.TableLayout','Nex.Html').setXType('tablelayout');
	tablelayout.extend({
		version : '1.0',
		_Tpl : {}
	});
	tablelayout.setOptions(function(opt,t){
		return {
			prefix : 'nexTL-',
			tag : 'div',
			autoDestroy : true,
			autoScroll : false,
			autoResize : true,
			selectionable : true,
			_checkScrollBar : false,//检查是否出现滚动条 如果出现会触发onViewSizeChange
			_hasBodyView : false,//是否有view部分 html 没有这部分 应该关闭 提高效率
			width : '100%',// 设为auto后 大小将不会设置 宽度 高度都是auto 或者css控制的,设为0 相当于100% 
			height : 'auto',
			border : false,
			tableCls : '',
			borderCls : [opt.borderCls,'nex-tablelayout-border'].join(' '),
			containerCls : [opt.containerCls,'nex-tablelayout'].join(' '),
			autoScrollCls : [opt.autoScrollCls,'nex-tablelayout-auto-scroll'].join(' '),
			padding : 0,
			style : {},
			'class' : '',
			align : 'center',
			valign : 'middle',
			rowsData : [],//所有单元格源数据
			defaults : {},
			items : [],
			denyEvents : [ 'scroll' ],
			events : {
				onStart : $.noop,
				onCreate : $.noop,
				onInitComponent : $.noop,
				onSetContainerSize : $.noop,
				onSizeChange : $.noop,
				onSetContainerEvent : $.noop
			}
		};	
	});
	tablelayout.fn.extend({
		_sysEvents : function(){
			var self = this;
			var opt = self.configs;
			Nex.Html.fn._sysEvents.apply(self,arguments);
			self.bind("onSetLayout",self._setPadding2,self);
			self.bind("onCreate",self.setTableCellData,self);
			return self;
		},
		_setPadding : function(){
			//...
		},
		_setPadding2 : function(){
			var self = this,
				opt = self.configs;
			var w = self.getContainer();
			if( opt.padding ) {
				$('.nex-tablelayout-cell',w).css('padding',opt.padding);
			}
		},
		initComponent : function(func){
			var self = this;
			var opt = self.configs;	
			
			var _init = function(){
				self.fireEvent('onTableLayoutCreate',[opt]);
				if( $.isFunction( func ) ) {
					func.call(self);		
				}
			};
			
			Nex.Html.fn.initComponent.apply(self,[_init]);
			
		},
		_appendContent : function(){
			var self = this;
			var opt = self.C();	
			var lbody = self.getContainer();
			self.setLayout();
			self.setTableCellSize();
			return lbody;
		},
		setTableCellData : function(){
			var self = this,
				opt = self.C();
			$.each( opt.rowsData,function(i,cells){
				$.each( cells,function(j,cell){
					var $cell = $(['#',opt.id,'_',i,'_',j].join(''));	
					if( cell !== '' ) {
						$cell.empty();
						if( $.isPlainObject( cell ) && !$.isEmptyObject( cell ) ) {
							if( cell.items ) {
								self.addComponent( $cell,cell.items );
							}
						} else {
							self.addComponent( $cell,cell );	
						}
					}
					self.fireEvent('onSetCellData',[ $cell,i,j,cell ]);
				} );							  
			} );	
			return self;	
		},
		setTableCellSize : function(){
			var self = this,
				opt = self.C();
			$.each( opt.rowsData,function(i,cells){
				$.each( cells,function(j,cell){
					var $cell = $(['#',opt.id,'_',i,'_',j].join(''));	
					if( $.isPlainObject( cell ) && !$.isEmptyObject( cell ) ) {
						if( cell.width ) {
							var w = cell.width+'';
							if( w.indexOf('%') !== -1 ) {
								$cell.css('width',w);	
							} else {
								$cell._outerWidth( parseFloat( w ) );	
							}
						}	
						if( cell.height ) {
							var h = cell.height+'';
							if( w.indexOf('%') !== -1 ) {
								$cell.css('height',h);	
							} else {
								$cell._outerHeight( parseFloat( h ) );	
							}
						}	
					}
					self.fireEvent('onSetCellSize',[ $cell,i,j,cell ]);
				} );							  
			} );	
			return self;
		},
		createTable : function(items){
			var self = this,
				opt = self.C(),
				items = self._undef( items,[] );
			if( $.isFunction( items ) ) {
				items = items.call( self,opt );
			}	
			var items = $.isArray( items ) ? items : [items];
			
			var html = [
					'<table id="',opt.id,'_table" class="nex-tablelayout-table ',opt.tableCls,'" cellpadding="0" cellspacing="0" border="0">',
						'<tbody id="',opt.id,'_tbody">'
				];
			for( var i=0,len=items.length;i<len;i++ ) {
				var row = items[i];
				if( row === '' 
				   	|| $.type( row ) === 'boolean' 
					|| $.type( row ) === 'null' 
					|| $.type( row ) === 'undefined' 
				  ) {
					continue;	
				}
				html.push('<tr id="'+opt.id+'_'+i+'" class="nex-tablelayout-row">');
				html.push( self.createTableRow( i,row ) );
				html.push('</tr>');
			}
			
			html.push('</tbody>');
			html.push('</table>')
			return html.join('');
		},
		createTableRow : function( rid,rwos ){
			var self = this,
				opt = self.C(),
				rwos = self._undef( rwos,[] );
			if( $.isFunction( rwos ) ) {
				rwos  = rwos.call( self,opt );
			}	
			var html = [];
			var rwos = $.isArray( rwos ) ? rwos : [rwos];	
			for( var i=0,len=rwos.length;i<len;i++ ) {
				var cell = rwos[i];
				if( $.isFunction( cell  ) ) {
					cell = cell.call( self,opt );
				}
				if( cell === '' 
				   	|| $.type( cell ) === 'boolean' 
					|| $.type( cell ) === 'null' 
					|| $.type( cell ) === 'undefined' 
				  ) {
					continue;	
				}
				
				opt.rowsData[rid] = opt.rowsData[rid] || [];
				var cellid = opt.rowsData[rid].push( cell );
				cellid -= 1;
				
				html.push( self.createTableCell( rid,cellid,cell ) );	
				
			}
			return html.join('');
		},
		createTableCell : function( rid,cellid,cell ){
			var self = this,
				opt = self.C(),
				cell = self._undef( cell ,null );
			
			var html = [];
			
			var html = [
				'<td id="',opt.id,'_',rid,'_',cellid,'" class="nex-tablelayout-cell" '
			];
			
			if( $.isPlainObject( cell ) && !$.isEmptyObject( cell ) ) {
				
				self.fireEvent('onSetCellAttr',[ html,rid,cellid,cell,opt ]);
				
				if( !isNaN(parseInt(cell.rowspan)) ) {
					html.push(' rowspan=');
					html.push(parseInt(cell.rowspan));
				}	
				if( !isNaN(parseInt(cell.colspan)) ) {
					html.push(' colspan=');
					html.push(parseInt(cell.colspan));
				}
				html.push(' align=');
				if( cell.align ) {
					html.push(cell.align);
				} else {
					html.push(opt.align);	
				}
				html.push(' valign=');	
				if( cell.valign ) {
					html.push(cell.valign);
				} else {
					html.push(opt.valign);	
				}
			} else {
				html.push(' align=');	
				html.push(opt.align);
				html.push(' valign=');	
				html.push(opt.valign);	
			}
			
			html.push(' >&nbsp;</td>')
			
			self.fireEvent('onGetTableCell',[ html,rid,cellid,cell,opt ]);
			
			return html.join('');	
		},
		setLayout : function( items ){
			var self = this,
				opt = self.C(),
				el = self.getContainer,
				items = self._undef( items,opt.items );
			self.empty();
			var table = self.add( self.createTable(items) );
			self.fireEvent('onSetLayout',[opt]);
			return table;
		}
	});
})(jQuery);