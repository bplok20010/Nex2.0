$define(['Nex.date.Calendar','Nex.button.Button'],function(){
	var cal = Nex.define('Nex.date.DatePicker','Nex.date.Calendar',{
		xtype : 'datepicker',
		alias : 'Nex.DatePicker',
		/*
		*@private
		*/
		_setDatePickerCls : function(){
			var self = this;
			var opt = self.configs;
			opt.containerCls += " nex-datepicker-"+opt.display;
		},
		/*
		*@private
		*/
		_setAutoCloseYearMonthPicker : function(picker,i,opt){
			if( !opt.ymPickerAutoClose ) return;
			var self = this;
			var _id = opt.id+'_'+i;
			$(document).bind('mousewheel.cal_'+_id+' contextmenu.cal_'+_id+' mousedown.cal_'+_id,function(e){
				var target = e.target || e.srcElement;
				if( !$(target).closest( '#'+opt.id+'_item'+i ).size() ) {
					self.hideYearMonthPicker(i);		
				} 
			});
			$(window).bind('resize.cal_'+_id,function(){
				self.hideYearMonthPicker(i);			
			});		
		},
		/*
		*@private
		*/
		_unsetAutoCloseYearMonthPicker : function(picker,i,opt){
			if( !opt.ymPickerAutoClose ) return;
			var _id = opt.id+'_'+i;	
			$(document).unbind('.cal_'+_id);
			$(window).unbind('.cal_'+_id);	
		},
		/*
		*选中今天
		*/
		_selectToday : function(){
			this.selectDate( this.getSystemDate() );
			this.submit();
			this.hide();		
		},
		/*
		*@private
		*/
		_setFooterBtns : function( inner ){
			var self = this;
			var opt = self.configs;
			
			self.addComponent( opt.btns,inner );
			
			if( opt.showTodayBtn ) {
				Nex.Create('button',{
					text : opt.todayText,
					renderTo : inner,
					context : this,
					cls : 'nex-cal-btns nex-cal-today-btn',
					overCls : 'nex-cal-today-btn-over',
					pressedCls : 'nex-cal-today-btn-click',
					callBack : function(){
						this._selectToday();
					}
				});
			}
			if( opt.showCancelBtn ) {
				Nex.Create('button',{
					text : opt.cancelText,
					context : this,
					renderTo : inner,
					cls : 'nex-cal-btns nex-cal-cancel-btn',
					overCls : 'nex-cal-cancel-btn-over',
					pressedCls : 'nex-cal-cancel-btn-click',
					callBack : function(){
						this.hide();	
					}
				});
			}
			if( opt.showOkBtn ) {
				Nex.Create('button',{
					text : opt.okText,
					context : this,
					cls : 'nex-cal-btns nex-cal-ok-btn',
					overCls : 'nex-cal-ok-btn-over',
					pressedCls : 'nex-cal-ok-btn-click',
					renderTo : inner,
					callBack : function(){
						this.submit();	
						this.hide();	
					}
				});
			}
		},
		/**
		* 提交当前选中的日期 作用在于触发onSubmit
		*/
		"submit" : function(){
			var opt = this.configs;
			return this.fireEvent('onSubmit',[ opt.submitToString ? this.getStrValue() : this.getValue() ]);		
		},
		showPos : function( at ){
			var self = this;
			var opt = self.configs;
			var at = self._undef( at,{} );
			var showAt = $.extend({}, opt._showAt, opt.showAt,at );
			//console.log( showAt );
			self.getDom().showAt( showAt );		
		},
		initComponent : function(){
			Nex.date.Calendar.fn.initComponent.apply( this,arguments );	
			if( this.configs.display === 'absolute' ) {
				this.showPos();
			}
		},
		checkToSubmit : function(){
			var self = this;
			var opt = self.configs;
			if( opt.autoSubmit ) {
				var r = this.submit();
				r !== false ? this.hide() : '';	
			}	
		}
	});	
	cal.setOptions(function(opt){
		return {
			/*
			*@private
			*/
			'onStart._sys0001' : function(){
				this._setDatePickerCls();	
			},
			/*
			*@private
			*/
			'onCalendarFooterCreate._sys0001' : function( footer,opt ){
				var inner = $('<div id="'+opt.id+'_footer_inner" class="nex-cal-footer-inner"></div>');
				footer.append( inner );
				this._setFooterBtns( inner );
			},
			/*
			*@private
			*/
			'onYearMonthPickerShow._sys0001' : function( picker,i,opt ){
				this._setAutoCloseYearMonthPicker.apply( this,arguments );
			},
			/*
			*@private
			*/
			'onYearMonthPickerHide._sys0001' : function( picker,i,opt ){
				this._unsetAutoCloseYearMonthPicker.apply( this,arguments );
			},
			/*
			*@private
			*/
			'onDateClick._sys0001' : function(){
				this.checkToSubmit();
			},
			borderCls : opt.borderCls+' nex-datepicker-border',
			containerCls : opt.containerCls+' nex-datepicker',
			display : 'absolute',//position(指定位置显示) inline(平面显示)
			showAt : {},
			_showAt : {
				xAlign : 'left',
				yAlign : 'bottom'	
			},
			showOkBtn : false, 
			showCancelBtn : false,
			showTodayBtn : false,
			okText : '确定',
			cancelText : '取消',
			todayText : '今天',
			btns : [],
			submitToString : true,//通过onSubmit得到的date时是一个字符串 而不是一个数组
			autoSubmit : true//是否自动提交
		};	
	});
});