$define(['Nex.date.DateRangePicker'],function(){
	var cal = Nex.define('Nex.date.WeekPicker','Nex.date.DateRangePicker',{
		xtype : 'weekpicker',
		alias : 'Nex.WeekPicker',
		_getWeekRange : function( date ){
			var self = this;
			var opt = self.configs;	
			
			///date
			var day = date.getDay();
			day = day ? day : 7;
			
			var start = self.Date.add( date,'d',1-day );
			
			var end = self.Date.clone( start );
			
			end = self.Date.add( end,'d',6 );
			return [ start,end ];	
		},
		/*
		*@private 继承
		*默认选中日期处理
		*/
		_parseValue : function( value ){
			var self = this,
				opt=this.configs;
			var curr = opt.currentDate;
			var value = self._undef(value , opt.value);
			value = $.isArray( value ) ? value : ( value+'' ).split( opt.sepStr );
			
			if( value.length>1 ) {
				value[0] = value[value.length-1];	
				value.length = 1;
			}
			var date = null;
			if( value.length ) {
				date = self.__parse( value[0],curr );
			}
			
			if( date ) {
				value = self._getWeekRange( date );
			}
			
			//会触发onParseDefaultDate
			Nex.date.DatePicker.fn._parseValue.call( self,value );	
		},
		_selectToday : function(){
			var date = this.getSystemDate();	
			var range = this._getWeekRange( date );
			
			this._selectStart( range[0] );
			this._selectEnd( range[1] );	
			
			this.submit();
			this.hide();
		},
		//鼠标点击日期时选中日期 并检测是否需要自动提交
		toggleSelectDateRange : function( date ){
			var self = this;
			var opt = self.configs;	
			
			var range = self._getWeekRange( date );
			
			self.selectStart( range[0] );
			self.selectEnd( range[1] );	
			//检测是否需要自动提交
			self.checkToSubmit();
		}
	});	
	cal.setOptions(function(opt){
		return {
			numberOfMonths : 1
		};	
	});
});