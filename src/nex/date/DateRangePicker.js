$define(['Nex.date.DatePicker'],function(){
	var cal = Nex.define('Nex.date.DateRangePicker','Nex.date.DatePicker',{
		xtype : 'daterangepicker',
		alias : 'Nex.DateRangePicker',
		/*
		*@private 继承
		*默认选中日期处理
		*/
		_parseValue : function( value ){
			var self = this,
				opt=this.configs;
			//var curr = opt.currentDate;
			var value = self._undef(value , opt.value);
			value = $.isArray( value ) ? value : ( value+'' ).split( opt.sepStr );
			
			if( value.length === 1 ) {
				value.push(value[0]);	
			}
			if( value.length>1 ) {
				value[1] = value[value.length-1];	
				value.length = 2;
			}
			
			//会触发onParseDefaultDate
			Nex.date.DatePicker.fn._parseValue.call( self,value );	
		},
		/*
		*@private
		*刷新日期选中状态
		*/
		_refreshSelectDate : function(){
			var self = this;
			var opt = self.configs;
			var first = null;
			var last = null;
			
			$.each( opt._selectDate,function(d,v){
				last = d;
				first = first ? first : d;
			} );
			
			if( !first ) return;
			
			self.selectDateRange( first,last );
				
			return self;
		},
		/*
		*@private
		*取消所有选中日期
		*/
		_unselectAll : function(){
			var self = this;
			var opt = self.configs;
			
			opt._selectDate = {};
			
			$('.nex-cal-date-selected',self.bodyEl).removeClass('nex-cal-date-selected nex-cal-date-start nex-cal-date-end nex-cal-date-dequal');
			
			return self;	
		},
		/*
		*@private
		*选择一段日期范围 
		*/
		_selectDateRange : function( start, end ){
			var self = this;
			var opt = self.configs;	
			var undef;
			if( start === undef ) return self;
			
			self._unselectAll();
			
			end = end === undef ? start : end;
			
			start = self.Date.parseDate( start,opt.dateFormat );
			end = self.Date.parseDate( end,opt.dateFormat );
			
			if( start > end ) {
				var _t = start;
				start = end;
				end = _t;	
			}
			
			Nex.date.DatePicker.fn._selectDateRange.call( self,start,end );
			
			var first = self.format( start,'YYYYMMDD' );
			var last = self.format( end,'YYYYMMDD' );
			
			if( first !== last ) {
				$('#'+opt.id+'_'+first).addClass('nex-cal-date-start');
				$('#'+opt.id+'_'+last).addClass('nex-cal-date-end');
			} else {
				$('#'+opt.id+'_'+first).addClass('nex-cal-date-dequal');		
			}
			
			opt._selectDate = {};
			opt._selectDate[first] = true;
			opt._selectDate[last] = true;
			
			return self;
		},
		//因为日期范围需要点击2次鼠标才算是选择结束
		_startDate : false,
		_endDate : false,
		_selectStart : function( start,m ){
			var self = this;
			var opt = self.configs;	
			
			start = self.Date.parseDate( start,m || opt.dateFormat );
			
			self._startDate = start;
			self._endDate = false;
			//清空之前选择的范围
			self._unselectAll();
			self._selectDate( start,m || opt.dateFormat );
			
			return self;
		},
		selectStart : function( start,m ){
			var self = this;
			var opt = self.configs;	
			self._selectStart( start,m );
			self.fireEvent('onSelectStart',[ start,m,opt ]);		
			return self;
		},
		_selectEnd : function( end,m ){
			var self = this;
			var opt = self.configs;	
			
			end = self.Date.parseDate( end,m || opt.dateFormat );
			
			self._endDate = end;	
			
			self.selectDateRange( self._startDate,self._endDate );
			
			self._startDate = false;
			self._endDate = false;
			
			return self;
		},
		selectEnd : function( end,m ){
			var self = this;
			var opt = self.configs;	
			self._selectEnd( end,m );
			self.fireEvent('onSelectEnd',[ end,m,opt ]);		
			return self;
		},
		_selectToday : function(){
			var date = this.getSystemDate();	
			this._selectStart( date );
			this._selectEnd( date );
			this.submit();
			this.hide();
		},
		//鼠标点击日期时选中日期 并检测是否需要自动提交
		toggleSelectDateRange : function( date ){
			var self = this;
			var opt = self.configs;	
			if( !self._startDate ) {
				self.selectStart( date );	
			} else {
				self.selectEnd( date );	
				//检测是否需要自动提交
				self.checkToSubmit();
			}
		},
		/*
		*@private
		*/
		_setDateRangePickerCls : function(){
			var self = this;
			var opt = self.configs;
			opt.containerCls += " nex-daterangepicker-"+opt.display;
		},
		_onDateClick : function( date,t,e ){
			var self = this,
				opt=this.configs;
			//无效日期不可点击
			if( $(t).hasClass( 'nex-cal-date-disabled' ) ) {
				return;	
			}
				
			var r = self.fireEvent('onBeforeDateSelected',[date,t,e]);	
			if( r === false ) return;
			//如果日期是属于别的月份 且自动滚动日期 则自动切换日期
			if( self._isOutside( date ) && opt.autoChangeMonth ) {
				if( date>opt.currentDate ) {
					self.nextMonth();
				} else {
					self.prevMonth();	
				}
			}
			
			self.toggleSelectDateRange( date );	
		}
	});	
	cal.setOptions(function(opt){
		return {
			/*
			*@private
			*/
			'onStart._sys0002' : function(){
				this.configs.multiSelect = true;
				this._setDateRangePickerCls();	
			},
			/*
			*@private 覆盖
			*/
			'onDateClick._sys0001' : function(){
				//不做处理
			},
			'onGetValue._sys0001' : function(d){
				var dates = d.value;
				if( $.isArray( dates ) ) {
					if( dates.length>1 ) {
						dates[1] = dates[dates.length-1];	
						dates.length = 2;
					}
					if( dates.length == 1 ) {
						dates.push( dates[0] );	
					}
				}
			},
			/*
			*@private 不可更改
			*/
			multiSelect : true,
			numberOfMonths : 2,
			sepStr : ' 至 '
			
		};	
	});
});