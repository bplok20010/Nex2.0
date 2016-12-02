$define(['Nex.Html','Nex.util.Date'],function(){
	var cal = Nex.define('Nex.date.Calendar','Nex.Html',{
		xtype : 'calendar',
		alias : 'Nex.Calendar',
		Date : Nex.util.Date,
		_sysEvents : function(){
			var self = this;
			var opt = self.configs;
			Nex.Html.fn._sysEvents.apply(this,arguments);	
			self.bind('onDateClick.cal',self._onDateClick,self);
			if( Nex.IEVer < 8 ) {
				self.bind('onResize.cal',self._resizeAuto,self);//	
			}
			return self;
		},
		_initCalendar : function(){
			var self = this,
				opt=this.configs;
			//设置defaultDate
			self._initSystemDate()	
				._setCalendar();
		},
		/*
		*初始化当前日历时间
		*/
		_initSystemDate : function(){
			var self = this,
				opt=this.configs;
			if( opt.systemDate === null ) {
				opt.systemDate = new Date();	
			}	
			if( !self.Date.isDate( opt.systemDate ) ) {
				opt.systemDate = self.Date.parseDate( opt.systemDate, opt.dateFormat ) || new Date();		
			}
			
			opt._currentDate = opt.currentDate;
			opt.currentDate = opt.currentDate || new Date(opt.systemDate.getTime());	
			
			if( !self.Date.isDate( opt.currentDate ) ) {
				opt.currentDate = self.Date.parseDate( opt.currentDate, opt.dateFormat );	
			}
			//设置currentDate value
			if( opt.value === '' && opt.autoSelectToday ) {
				opt.value = 0;	
			}
			self._parseValue();
			
			self._parseMaxMinDate();
			
			return self;		
		},
		getSystemDate : function(){
			return this.configs.systemDate;	
		},
		__parse : function( defDate,date ){
			var self = this,
				opt = this.configs;	
			if( $.type( defDate ) === 'number' ) {
				self.Date.add( date, 'd', defDate );
			} else if( $.type(defDate) === 'string' && opt._dateCalcReg.test( defDate ) ) {
				var ds = defDate.split(/\s+/ig);
				$.each( ds,function(i,defDate){
					var matches = opt._dateCalcReg.exec( defDate );
					self.Date.add( date, matches[2], matches[1] );		
				} );
			} else {
				date = self.Date.parseDate( defDate, opt.dateFormat );	
			}			
			return date;
		},
		_parseValue : function( value ){
			var self = this,
				_value = [],
				opt=this.configs;
			var curr = opt.currentDate;
			var value = self._undef(value , opt.value);
			value = $.isArray( value ) ? value : ( value+'' ).split( opt.sepStr );
			//value = $.isArray( value ) ? value : [ value ];
			//初始化选中日期
			opt._selectDate = {};
			
			for( var i=0;i<value.length;i++ ) {
				if( value[i] === '' || value[i] === null ) continue; 
				var _d = self.__parse( value[i], self.Date.clone(curr) );
				_value.push( _d );
				opt._selectDate[ self.format( _d,'YYYYMMDD' ) ] = true;
			}
			
			opt.value = _value;
			//按asc 排序
			opt.value.sort( function( a,b ){
				return a - b;	
			} );
			//处理开始显示日历的月份数
			if( !opt._currentDate ) {
				opt.currentDate = self._getCurrentDate();
			}
			
			//触发初始化日期事件
			self.fireEvent( 'onParseDefaultDate',[ opt ] );
			
			return self;		
		},
		_parseMaxMinDate : function(){
			var self = this,
				opt = this.configs;	
			var curr = opt.currentDate;	
			if( opt.maxDate !== null ) {
				opt.maxDate = self.Date.parseDate( opt.maxDate,opt.dateFormat );
			}
			if( opt.minDate !== null ) {
				opt.minDate = self.Date.parseDate( opt.minDate,opt.dateFormat );	
			}	
			var disabledDate = $.isArray( opt.disabledDate ) ? opt.disabledDate : [ opt.disabledDate ];	
			var enabledDate = $.isArray( opt.enabledDate  ) ? opt.enabledDate  : [ opt.enabledDate  ];
			
			opt.disabledDate = [];
			opt.enabledDate = [];
			
			$.each( disabledDate,function(i,date){
				var _d = self.__parse( date, self.Date.clone(curr) );	
				opt.disabledDate.push( _d );
			} );
			$.each( enabledDate,function(i,date){
				var _d = self.__parse( date, self.Date.clone(curr) );	
				opt.enabledDate.push( _d );
			} );
			return self;
		},
		//是否属于同一日期
		_isEqual : function(d1,d2){
			return this.format( d1,'YYYYMMDD' ) === this.format( d2,'YYYYMMDD' ) ? true : false;
		},
		//是否属于同一日期
		_isEqualDate : function(d1,d2){
			return this._isEqual( d1,d2 );
		},
		//同月
		_isEqualMonth : function(d1,d2){
			return this.format( d1,'YYYYMM' ) === this.format( d2,'YYYYMM' ) ? true : false;
		},
		//同年
		_isEqualYear : function(d1,d2){
			return this.format( d1,'YYYY' ) === this.format( d2,'YYYY' ) ? true : false;
		},
		_inDisabledList : function( date ){
			var self = this,
				opt = this.configs;	
			var r = false;
			
			var ds = opt.disabledDate;
			
			for( var i=0;i<ds.length;i++ ) {
				if( self._isEqual( date,ds[i] ) ) {
					r = true;
					break;	
				}
			}
			
			return r;		
		},
		_inEnabledList : function( date ){
			var self = this,
				opt = this.configs;	
			var r = false;
			
			var ds = opt.enabledDate;
			
			for( var i=0;i<ds.length;i++ ) {
				if( self._isEqual( date,ds[i] ) ) {
					r = true;
					break;	
				}
			}
			
			return r;		
		},
		isDisabledDate : function( date ){
			var self = this,
				opt = this.configs;	
			//equal	
			var date = self.Date.parseDate( date,opt.dateFormat );	
			date.setHours(0);
			date.setMinutes(0);
			date.setSeconds(0);
			var r = false;
			if( opt.maxDate !== null ) {
				r = date > opt.maxDate ? true : false;
			}	
			if( opt.minDate !== null && !r ) {
				r = date < opt.minDate ? true : false;
			}	
			if( !r ) {
				r = self._inDisabledList( date );	
			}
			if( r ) {
				r = !self._inEnabledList( date );		
			}
			return r;
		},
		setDisabledDate : function( dates ){
			var self = this,
				opt = this.configs;	
			var curr = opt.currentDate;			
			var dates = $.isArray( dates ) ? dates : [dates];
			$.each( dates,function(i,date){
				if( date === '' || date === null ) return;
				var _d = self.__parse( date, self.Date.clone(curr) );	
				var fmt = self.format( _d,'YYYYMMDD' );
				opt.disabledDate.push( _d );	
				$('#'+opt.id+'_'+fmt).addClass('nex-cal-date-disabled');
			} );
			return self;	
		},
		setEnabledDate : function( dates ){
			var self = this,
				opt = this.configs;	
			var curr = opt.currentDate;			
			var dates = $.isArray( dates ) ? dates : [dates];
			$.each( dates,function(i,date){
				if( date === '' || date === null ) return;
				var _d = self.__parse( date, self.Date.clone(curr) );	
				var fmt = self.format( _d,'YYYYMMDD' );
				opt.enabledDate.push( _d );	
				$('#'+opt.id+'_'+fmt).removeClass('nex-cal-date-disabled');
			} );
			return self;	
		},
		//从value中获取最佳显示日期 currentDate
		_getCurrentDate : function(){
			var self = this,
				opt = this.configs;	
			var num = opt.numberOfMonths;
			var _Date = self.Date;
			
			var dates = opt.value;
			var len = dates.length;
			var current = opt.currentDate;
			for( var i=0;i<len;i++ ) {
				var isOk = true;
				var diff = 0;
				var d1 = dates[i];
				for( var j=i+1;j<len;j++ ) {
					var d2 = dates[j];	
					diff = Math.abs(_Date.diff( d1,d2,'m' ));
					if( (diff+1) > num ) {
						isOk = false;
						break;	
					}
				}
				if( isOk ) {
					current = d1;	
					break;
				}
			}
			return current;	
		},
		/*
		*设置默认选中日期 默认选中当天
		*/
		format : function(date,str){
			return this.Date.format( date,str );	
		},
		/*
		*获取thead
		*@param opts 设置参数 默认是configs
		*/
		_getTheadHtml : function( opts ){
			var self = this,
				opt = opts || this.configs;
			var dn = opt.dayNamesMin;
			var html = ['<tr class="nex-cal-row nex-cal-row-h">'];
			if( opt.showWeek ) {
				html.push( '<th class="nex-cal-cell nex-cal-cell-w">' );
				html.push( opt.weekHeader );
				html.push( '</th>' );		
			}
			var len2 = 7 + opt.firstDay;
			for( var i=opt.firstDay;i<len2;i++ ) {
				var day = i%7;
				html.push( '<th class="nex-cal-cell nex-cal-cell-h nex-cal-day'+day+'" data-day="'+day+'">' );
				html.push( dn[day] );
				html.push( '</th>' );	
			}
			html.push('</tr>');
			return html.join('');	
		},
		/*
		*获取指定月份需要显示的日期数
		*返回开始和结束日期
		*/
		_getDateRange : function( date,opts ){
			var self = this,
				opt= opts || this.configs;
			var currentDate = date || opt.currentDate;
			var maxDays = self.Date.maxDay( currentDate );	
			var cDate = new Date( currentDate.getTime() );
			cDate.setDate(1);
			var startDate,endDate;
			var html = [];
			if( !opt.showOtherMonths ) {
				endDate = self.Date.lastDay( cDate );
				var eday = endDate.getDay(); 
				var next = eday<opt.firstDay?(7*1)+eday:eday;
				self.Date.add( endDate,'d',next-eday );
				
				var cday = cDate.getDay(); 
				var prev = cday<opt.firstDay?(7*1)+cday:cday;
				self.Date.add( cDate,'d',opt.firstDay-prev );
				startDate = self.Date.clone( cDate );
			} else {
				var cday = cDate.getDay(); 
				if( cday != opt.firstDay ) {
					var prev = cday<opt.firstDay?(7*1)+cday:cday;
					self.Date.add( cDate,'d',opt.firstDay-prev );
				} else {
					self.Date.add( cDate,'d',-7 );	
				}
				startDate = self.Date.clone( cDate );	
				endDate =  self.Date.clone( self.Date.add( cDate,'d',41 ) );
			}	
			return [ startDate, endDate ];	
		},
		//如果不需要显示其他月份日期则显示6行 每行7天	
		_getTbodyHtml : function( opts ){
			var self = this,
				_opt = this.configs,
				opt = opts || this.configs;	
				
			var dateRange = self._getDateRange( opt.currentDate,opt );
			
			var diff = self.Date.diff( dateRange[0],dateRange[1],'d' ) + 1;
			var startDate = dateRange[0];
			var endDate = dateRange[1];
			var html = [];
			var rows = [];
			var k = 0;
			for( var i=0;i<diff;i++ ) {
				if( i%7 == 0 ) {
					rows[k] = [];
				}
				rows[k].push( self.Date.clone(startDate) );
				if( i%7 == 6 ) {
					k++;
				}	
				self.Date.add( startDate,'d',1 );	
			}
			//autoFillOthers
			if( opt.autoFillOthers ) {
				for( var n=0;n<6;n++ ) {
					var _row = rows[n] || [];
					rows[n] = _row;
					for( var b=_row.length;b<7;b++ ) {
						_row[b] = null;	
					}	
				}	
			}
			var getPad = function(){
				var s = [];
				s.push('<td class="nex-cal-pad">');
				s.push( '&nbsp;' );
				s.push('</td>');	
				return s.join('');	
			};
			var len = rows.length;
			
			var rlast = len ? rows[0][6] : null;
			
			if( rlast )
			
			for( var j=0;j<len;j++ ) {
				var row = rows[j];
				if( j == 0 ) {
					var plast = row[6];
					if( self._isOtherMonth(plast, opt.currentDate) && !opt._showPrevMonths ) {
						continue;	
					}
				}
				if( j == len-1 ) {
					var nlast = row[0];
					if( self._isOtherMonth(nlast, opt.currentDate) && !opt._showNextMonths ) {
						continue;	
					}
				}
				html.push('<tr class="nex-cal-row nex-cal-row-b">');	
				if( opt.showWeek ) {
					var index = 0;
					if( opt.weekIndex != 'firstDay' ) {
						//计算星期索引位置
						index = parseInt(opt.weekIndex,10)<opt.firstDay?(7-opt.firstDay+opt.weekIndex):(opt.weekIndex-opt.firstDay);	
					}
					var week = self.Date.weekOfYear( row[index] );
					html.push( '<td class="nex-cal-cell nex-cal-cell-w" data-week="'+week+'">' );
					html.push( week );
					html.push( '</td>' );		
				}	
				for( var k=0;k<7;k++ ) {
					var date = row[ k ];
					if( date === null || !self.Date.isDate( date ) ) {
						html.push( getPad() );
						continue;
					}
					var day = date.getDay();
					var part = self.Date.dateObject(date);
					var isOtherMonth = self._isOtherMonth(date, opt.currentDate);
					//_showPrevMonths _showNextMonths
					if( isOtherMonth && !opt.showOtherMonths ) {//isOtherMonth && 
						html.push( getPad() );
						continue;
					}
					if( isOtherMonth ) {
						if( date.getTime() < opt.currentDate.getTime() && !opt._showPrevMonths ) {
							html.push( getPad() );
							continue;	
						}
						if( date.getTime() > opt.currentDate.getTime() && !opt._showNextMonths ) {
							html.push( getPad() );	
							continue;
						}
					}
					var tips = '';
					if( opt.showDateTips ) {
						tips = self._dateTipsFilter( date );	
					}
					
					var isToday = self._isToday( date );
					var cls = ['nex-cal-cell','nex-cal-cell-b','nex-cal-day'+day];//,'nex-cal-day'+k
					
					self.fireEvent('onSetDateClass',[ {'class':cls,data:date},_opt ]);
					
					if( isOtherMonth ) {
						cls.push( 'nex-cal-other-month' );	
					}
					if( isToday ) {
						cls.push( 'nex-cal-today' );	
					}
					if( self.isDisabledDate( date ) ) {
						cls.push( 'nex-cal-date-disabled' );		
					}
					
					html.push('<td id="'+opt.id+'_'+ self.format( date,'YYYYMMDD' ) +'" calid="'+opt.id+'" class="'+cls.join(' ')+'" data-year="'+part['y+']+'" data-month="'+part['M+']+'" data-date="'+part['d+']+'" '+tips+'>');
					html.push( self._dateFiter( self.format( date,'d' ), date ) );
					html.push('</td>');
				}
				html.push('</tr>');	
			}
			return html.join('');
		},
		/*
		*获取日历显示内容
		*@param opts 设置参数
		*/
		_getCalendarHtml : function( opts ){
			var self = this;
			var opt = this.configs;
			if( $.type( opts ) === 'string' ) {
				opts = {
					currentDate : opts
				};
			}
			var opts = opts || {};
			var _d = $.extend( {},opt );
			opts = $.extend( {},_d,opts );	
			var html = [
				'<table class="nex-cal-table" cellpadding="0" cellspacing="0" border="0">',
					'<thead>'+self._getTheadHtml(opts)+'</thead>',
					'<tbody>'+self._getTbodyHtml(opts)+'</tbody>',
				'</table>'
			];
			return html.join('');
		},
		/*
		*显示提示日期内容过滤
		*/
		_dateTipsFilter : function( startDate ){
			var self = this,
				opt=this.configs;
			var tips = '';	
			var str = '';
			tips += opt.dateTipsTag+'="';
			if( $.isFunction( opt.dateTipsFilter ) ) {
				str += opt.dateTipsFilter.call( self, self.format( startDate,opt.dateTipsFormat ), startDate);	
			} else {
				str += self.format( startDate,opt.dateTipsFormat );
			}
			var d = {
				value : str,
				date : startDate
			};
			self.fireEvent('onDateTipsFilter',[d,opt]);
			tips += d.value;
			tips += '"';	
			return tips;	
		},
		/*
		*显示日期内容过滤
		*/
		_dateFiter : function( s,date ){
			var self = this,
				opt=this.configs;
			var str = s;
			if( $.isFunction( opt.dateFilter ) ) {
				str	= opt.dateFilter.call( self,str,date );
			}	
			var d = {value:str,date:date};
			self.fireEvent('onDateFilter',[d,opt]);
			return d.value;	
		},
		/*
		*判断日期否属于当日
		*/
		_isToday : function( date ){
			var self = this,
				opt=this.configs;
			var currentDate = opt.systemDate;	
			if( $.type( date ) === 'string' ) {
				date = self.Date.strToDate( date );	
			}	
			var p1 = self.Date.dateObject( currentDate );
			var p2 = self.Date.dateObject( date );
			if( p1['y+'] != p2['y+'] ) return false;
			if( p1['M+'] != p2['M+'] ) return false;
			if( p1['d+'] != p2['d+'] ) return false;
			return true;	
		},
		/*
		*判断当前日期是否不输入本月
		*/
		_isOtherMonth : function(date,curr){
			var self = this,
				opt=this.configs;
			var currentDate = curr||opt.currentDate;	
			if( $.type( date ) === 'string' ) {
				date = self.Date.strToDate( date );	
			}	
			var p1 = self.Date.dateObject( currentDate );
			var p2 = self.Date.dateObject( date );
			if( p1['y+'] != p2['y+'] ) return true;
			if( p1['M+'] != p2['M+'] ) return true;
			return false;
		},
		_setCalendarItemHeader : function( i,opts ){
			var self = this,
				opt  = this.configs,
				opts  = opts || this.configs;
			var bd = $('#'+opt.id+'_item'+i);	
			var html = $('<div id="'+opt.id+'_item'+i+'_header" class="nex-cal-item-header"></div>');
			bd.append( html );
			//showChangeMonthBtn
			//topTitleFilter
			var topTitle = self.format( opts.currentDate,opt.topTitleFormat );
			if( $.isFunction( opts.topTitleFilter ) ) {
				topTitle = opts.topTitleFilter.call( self,opts.currentDate );
			}
			var wrap = [
				'<div class="nex-cal-item-title">',
					'<div class="nex-cal-prev-icons">',
						opts.showChangeYearBtn && opts._showChangeYearNextBtn ? '<a href="javascript:void(0);" title="'+opt.prevYearTitle+'" class="nex-cal-aicon nex-cal-prevyear"></a>' : '',
						opts.showChangeMonthBtn && opts._showChangeMonthPrevBtn ? '<a href="javascript:void(0);" title="'+opt.prevMonthTitle+'" class="nex-cal-aicon nex-cal-prevmonth"></a>' : '',
					'</div>',
					'<span class="nex-cal-ymlabel">'+topTitle+'</span>',
					'<div class="nex-cal-next-icons">',
						opts.showChangeMonthBtn && opts._showChangeMonthRightBtn ? '<a href="javascript:void(0);" title="'+opt.nextMonthTitle+'" class="nex-cal-aicon nex-cal-nextmonth"></a>' : '',
						opts.showChangeYearBtn && opts._showChangeYearRightBtn ? '<a href="javascript:void(0);" title="'+opt.nextYearTitle+'" class="nex-cal-aicon nex-cal-nextyear"></a>' : '',
					'</div>',
				'</div>'
			];
			
			html.html( wrap.join('') );
			
			return self;
		},
		_setCalendarItemBody : function( i,opts ){
			var self = this,
				opt  = this.configs,
				opts  = opts || this.configs;
			var bd = $('#'+opt.id+'_item'+i);	
			var html = $('<div id="'+opt.id+'_item'+i+'_body" class="nex-cal-item-body">'+self._getCalendarHtml( opts )+'</div>');
			bd.append( html );
			
			return self;
		},
		_setCalendarItemFooter : function( i,opts ){
			var self = this,
				opt  = this.configs,
				opts  = opts || this.configs;
			var bd = $('#'+opt.id+'_item'+i);	
			var html = $('<div id="'+opt.id+'_item'+i+'_footer" class="nex-cal-item-footer"></div>');
			bd.append( html );	
			return self;			
		},
		getCurrentDate : function(){
			return this.configs.currentDate;	
		},
		setCurrentDate : function( date ){
			var opt = this.configs;
			opt.currentDate = this.Date.parseDate( date,opt.dateFormat )
			return this;	
		},
		_setCalendarItemEvents : function(){
			var self = this,
				opt=this.configs;
			var dom = self.getDom();
			var call = function(evt,e,func){
				var $this = $(this);
				
				var date = new Date( $this.data('year'),parseInt($this.data('month'),10)-1,$this.data('date') );
				
				var r = self.fireEvent(evt,[ date,this,e,opt ]);	
				if( r === false ) {
					e.stopPropagation();
					e.preventDefault();
				} else {
					if( $.isFunction( func ) ) {
						func.call( this,date );	
					}
				}
			};
			var events = {
				'click.cal' : function(e){
					call.call( this,'onDateClick',e );
				},
				'mouseenter.cal' : function(e){
					call.call( this,'onDateOver',e,function(){
						if( !$(this).hasClass('nex-cal-date-disabled') ) {
							$(this).addClass('nex-cal-date-over');			
						}
					} );
				},
				'mouseleave.cal' : function(e){
					call.call( this,'onDateOut',e,function(){
						if( !$(this).hasClass('nex-cal-date-disabled') ) {
							$(this).removeClass('nex-cal-date-over');	
						}
					} );	
				},
				'mousedown.cal' : function(e){
					call.call( this,'onDateMouseDown',e );		
				},	
				'mouseup.cal' : function(e){
					call.call( this,'onDateMouseUp',e );			
				},
				'contextmenu.cal' : function(e){
					call.call( this,'onDateContextMenu',e );			
				},
				'dblclick.cal' : function(e){
					call.call( this,'onDateDblClick',e );	
				}
			};
			dom.undelegate('.cal')
			   .delegate('[calid="'+opt.id+'"]',events)
			   .delegate('.nex-cal-prevyear',{
					'click.cal' : function(e){
						var r = self.fireEvent('onPrevYear',[ opt ]);
						if( r === false ) return;
						self.prevYear();	
					}   
			    })
				.delegate('.nex-cal-nextyear',{
					'click.cal' : function(e){
						var r = self.fireEvent('onNextYear',[ opt ]);
						if( r === false ) return;
						self.nextYear();	
					}   
			    })
				.delegate('.nex-cal-prevmonth',{
					'click.cal' : function(e){
						var r = self.fireEvent('onPrevMonth',[ opt ]);
						if( r === false ) return;
						self.prevMonth();	
					}   
			    })
				.delegate('.nex-cal-nextmonth',{
					'click.cal' : function(e){
						var r = self.fireEvent('onNextMonth',[ opt ]);
						if( r === false ) return;
						self.nextMonth();	
					}   
			    })
				.delegate('.nex-cal-ymlabel',{
					'click.cal' : function(e){
						var _item = $(this).closest('.nex-cal-item');
						var citem = _item.attr('citem');
						var y = _item.data('year');
						var m = parseInt(_item.data('year'),10);
						var date = new Date(y,m-1);
						var r = self.fireEvent('onItemTitleClick',[ date,citem,opt ]);
						if( r === false ) return;
						if( opt.ymChangeEnable ) {
							self.showYearMonthPicker(citem);
						}
					}   
			    }); 
			return self;		
		},
		_getMonthPickerHtml : function( ci ){
			var self = this,
				opt = this.configs;	
			var months = [
				[0,1,2,3],
				[4,5,6,7],
				[8,9,10,11]
			];	
			var m = '';
			for( var i=0;i<months.length;i++ ) {
				var t = months[i];
				m += '<tr>';
					for( var j=0;j<t.length;j++ ) {
						m += '<td width="25%" class="nex-cal-mpicker-b nex-cal-mpicker-'+t[j]+'" data-month="'+(t[j]+1)+'" id="'+opt.id+'_'+ci+'_m'+t[j]+'">'+opt.monthNames[t[j]]+'</td>'; 
					}
				m += '</tr>';	
			}
			var html = [
				'<table class="nex-cal-mpicker-table" cellpadding="0" cellspacing="0" border="0">',
					m,
				'</table>',
			];	
			return html.join('');
		},
		_getYearPickerHtml : function( i ){
		},
		_getYearMonthPickerHtml : function(i){
			var self = this,
				opt = this.configs;	
			var html = [
				'<div id="'+opt.id+'_item'+i+'_ympicker" class="nex-cal-ympicker">',
					'<div id="'+opt.id+'_item'+i+'_ypicker_wrap"'+' class="nex-cal-ypicker-wrap">',
						'<span class="prev-ypicker"></span><input class="nex-cal-ypicker" id="'+opt.id+'_item'+i+'_ypicker" type="text" value=""><span class="next-ypicker"></span>',
					'</div>',
					'<div id="'+opt.id+'_item'+i+'_line" class="nex-cal-ympicker-line"></div>',
					'<div id="'+opt.id+'_item'+i+'_mpicker"'+' class="nex-cal-mpicker-wrap">',
						self._getMonthPickerHtml( i ),
					'</div>',
				'</div>'
			];	
			return html.join('');
		},
		__activePicker : null,
		hideYearMonthPicker : function( i,func ){
			var self = this,
				opt = this.configs;	
			var i = self._undef( i,self.__activePicker );
			if( i === null ) {
				if( $.isFunction( func ) ) {
					func();	
				}
				return self;	
			} 
			self.__activePicker = null;
			var picker = $('#'+opt.id+'_item'+i+'_ympicker');
			picker.stop(true).animate({
				top : picker._outerHeight()*-1,
				opacity : 0
			},opt.ymPickerDuration || 1,opt.ymPickerAnim,function(){
				if( $.isFunction( func ) ) {
					func();	
				}	
				self.fireEvent('onYearMonthPickerHide',[ picker, i, opt]);	
			});
		},
		//显示年月份选择框
		showYearMonthPicker : function( citem ){
			var self = this,
				opt = this.configs;	
				
			var citem = self._undef( citem,1 );
			
			var _itemWrap = $('#'+opt.id+'_item'+citem);
			var _item = $('#'+opt.id+'_item'+citem+'_body');
			
			var picker = $('#'+opt.id+'_item'+citem+'_ympicker');
			var _isInit = false;
			if( !picker.length ) {		
				picker = $( self._getYearMonthPickerHtml( citem ) );
				_item.append( picker );
				self.setYearMonthPickerEvents( citem );
				_isInit = true;
				self.fireEvent('onYearMonthPickerCreate',[ picker, citem, opt]);
			}
			
			var y = _itemWrap.data('year'),
				m = _itemWrap.data('month');
			
			if( self.__activePicker === citem && !_isInit ) {
				self.hideYearMonthPicker( citem );
			} else {
				
				self.hideYearMonthPicker( self.__activePicker );
				
				self.setYearMonthPickerSize( citem );
				self.setYearMonthPickerValue( citem,y,m );
					
				self.__activePicker = citem;	
				picker.stop(true).animate({
					top : 0,
					opacity : 1
				},opt.ymPickerDuration || 1,opt.ymPickerAnim,function(){
					self.fireEvent('onYearMonthPickerShow',[ picker, citem, opt]);	
				});	
			}	
			return self;
		},
		//设置month year picker大小
		setYearMonthPickerSize : function( i ){
			var self = this,
				opt = this.configs;	
			var _item = $('#'+opt.id+'_item'+i+'_body');
			var w = _item.width();
			var h = _item.height();	
			var picker = $('#'+opt.id+'_item'+i+'_ympicker');
			picker._outerHeight( h );	
			picker._outerWidth( w );
			var ph = Math.min(picker.height(),h);//使用Math.min主要是兼容IE6 。。。
			var pw = Math.min(picker.width(),w);
			var bh = ph - $('#'+opt.id+'_item'+i+'_ypicker_wrap')._outerHeight(true) - $('#'+opt.id+'_item'+i+'_line')._outerHeight(true);
			var mpicker = $('#'+opt.id+'_item'+i+'_mpicker');
			mpicker._outerHeight( bh );
			mpicker._outerWidth( pw );
		},
		setYearMonthPickerValue : function(i,y,m){
			var self = this,
				opt = this.configs;
			var picker = $('#'+opt.id+'_item'+i+'_ympicker');	
			m--;	
			$('.nex-cal-month-selected',picker).removeClass('nex-cal-month-selected');
			$('#'+opt.id+'_item'+i+'_ypicker').val( y );
			$('#'+opt.id+'_'+i+'_m'+m).addClass('nex-cal-month-selected');
				
		},
		_selectMonthPicker : function( citem,y,m,t ){
			var self = this,
				opt = this.configs;
				
			var picker = $('#'+opt.id+'_item'+citem+'_ympicker');
				
			$('.nex-cal-month-selected',picker).removeClass('nex-cal-month-selected');
			$(t).addClass('nex-cal-month-selected');
			
			var date = new Date( y,m-1 );
			
			self.Date.add(date,'m',citem*-1);
			
			
			
			if( opt.ymPickerAutoClose ) { 
				self.hideYearMonthPicker( citem,function(){
					self.changeMonth( date.getFullYear(),date.getMonth()+1 );
				} );
			}	
		},
		setYearMonthPickerEvents : function( citem ){
			var self = this,
				opt = this.configs;
			var picker = $('#'+opt.id+'_item'+citem+'_ympicker');
			$('#'+opt.id+'_item'+citem+'_ypicker_wrap').disableSelection();
			var t1 = 0,
				t2 = 0;
			picker.undelegate('.cal')
			   	  .delegate( '.nex-cal-mpicker-b',{
						'click.cal' : function(e){
							var y = $('#'+opt.id+'_item'+citem+'_ypicker').val(),
								m =  parseInt( $(this).data('month'), 10);
								
							var  r = self.fireEvent('onMonthPickerClick',[ y, m, this, e, opt]);
							if( r === false ) return;
							
							self._selectMonthPicker( citem,y,m,this );
							
						},  
						'mouseenter.cal' : function(e){
							var y = $('#'+opt.id+'_item'+citem+'_ypicker').val(),
								m =  parseInt( $(this).data('month'), 10);
							var  r = self.fireEvent('onMonthPickerOver',[ y,m,this, e, opt]);
							if( r === false ) return;
							$(this).addClass('nex-cal-mpicker-over');	
						},
						'mouseleave.cal' : function(e){
							var y = $('#'+opt.id+'_item'+citem+'_ypicker').val(),
								m =  parseInt( $(this).data('month'), 10);
							var  r = self.fireEvent('onMonthPickerOut',[ y,m,this, e, opt]);
							if( r === false ) return;
							$(this).removeClass('nex-cal-mpicker-over');		
						},
						'dblclick.cal' : function(e){
							var y = $('#'+opt.id+'_item'+citem+'_ypicker').val(),
								m =  parseInt( $(this).data('month'), 10);
							var  r = self.fireEvent('onMonthPickerDblClick',[ y,m,this, e, opt]);
							if( r === false ) return;	
						}
				  } )
				  .delegate( '.nex-cal-ypicker',{
					  	'click.cal' : function(e){
							var y = $(this).val();
							var  r = self.fireEvent('onYearPickerClick',[ y,this, e, opt]);
							if( r === false ) return;	
							$(this).select();		
						},
						'mouseente.calr' : function(e){
							var y = $(this).val();
							var  r = self.fireEvent('onYearPickerOver',[ y,this, e, opt]);
							if( r === false ) return;	
							$(this).addClass('nex-cal-ypicker-over');	
						},
						'mouseleave.cal' : function(e){
							var y = $(this).val();
							var  r = self.fireEvent('onYearPickerOut',[ y,this, e, opt]);
							if( r === false ) return;	
							$(this).removeClass('nex-cal-ypicker-over');		
						},
						'focus.cal' : function(e){
							var y = $(this).val();
							var  r = self.fireEvent('onYearPickerFocus',[ y,this, e, opt]);
							if( r === false ) return;
							$(this).addClass('nex-cal-ypicker-focus');
							setTimeout(function(){
								$(this).select();	
							},0);
						},
						'blur.cal' : function(e){
							var y = $(this).val();
							var  r = self.fireEvent('onYearPickerBlur',[ y,this, e, opt]);
							if( r === false ) return;
							$(this).removeClass('nex-cal-ypicker-focus');		
						} 
				  } )
				  .delegate( '.prev-ypicker',{
					  	'click.cal' : function(e){
							var ypicker = $('#'+opt.id+'_item'+citem+'_ypicker');
							y = parseInt(ypicker.val(),10);
							var  r = self.fireEvent('onYearPickerPrevClick',[ y,this, e, opt]);
							if( r === false ) return;	
							y--;
							y = Math.max( 0,y );
							ypicker.val( y );	
						},
						'mousedown.cal' : function(e){//处理鼠标100ms后触发自动计算
							var ypicker = $('#'+opt.id+'_item'+citem+'_ypicker');
							y = parseInt(ypicker.val(),10);
							var  r = self.fireEvent('onYearPickerPrevMouseDown',[ y,this, e, opt]);
							if( r === false ) return;	
							t1 = setTimeout(function(){
								t2 = setInterval( function(){
									y--;
									y = Math.max( 0,y );
									ypicker.val( y );	
								},opt.yPickerPoll );
							},opt.yPickerDelay);
						},
						'mouseup.cal' : function(e){
							var ypicker = $('#'+opt.id+'_item'+citem+'_ypicker');
							y = parseInt(ypicker.val(),10);
							var  r = self.fireEvent('onYearPickerPrevMouseDownUp',[ y,this, e, opt]);
							if( r === false ) return;		
							clearTimeout(t1);
							clearTimeout(t2);
						},
						'mouseleave.cal' : function(){
							clearTimeout(t1);
							clearTimeout(t2);		
						}
				  } )
				  .delegate( '.next-ypicker',{
					  	'click.cal' : function(e){
							var ypicker = $('#'+opt.id+'_item'+citem+'_ypicker');
							y = parseInt(ypicker.val(),10);
							var  r = self.fireEvent('onYearPickerNextClick',[ y,this, e, opt]);
							if( r === false ) return;	
							y++;
							ypicker.val( y );	
						},
						'mousedown.cal' : function(e){
							var ypicker = $('#'+opt.id+'_item'+citem+'_ypicker');
							y = parseInt(ypicker.val(),10);
							var  r = self.fireEvent('onYearPickerNextMouseDown',[ y,this, e, opt]);
							if( r === false ) return;		
							t1 = setTimeout(function(){
								t2 = setInterval( function(){
									y++;
									ypicker.val( y );	
								},opt.yPickerPoll );
							},opt.yPickerDelay);
						},
						'mouseup.cal' : function(e){
							var ypicker = $('#'+opt.id+'_item'+citem+'_ypicker');
							y = parseInt(ypicker.val(),10);
							var  r = self.fireEvent('onYearPickerNextMouseDownUp',[ y,this, e, opt]);
							if( r === false ) return;	
							clearTimeout(t1);
							clearTimeout(t2);	
						},
						'mouseleave.cal' : function(){
							clearTimeout(t1);
							clearTimeout(t2);		
						}
				  } );	
		},
		getYearMonthPickerDate : function( i ){
			var self = this,
				opt = this.configs;
			var i = self._undef( i,0 );	
			var y = $('#'+opt.id+'_item'+i+'_ypicker').val(  );
			var m = $('#'+opt.id+'_item'+i+'_mpicker').find( '.nex-cal-month-selected:first' ).data('month');
			return new Date( y,parseInt( m,10 ) );
		},
		setYearMonthPickerDate : function(i,y,m){
			return this.setYearMonthPickerValue(i,y,m);	
		},
		_setCalendarHeader : function(){
			var self = this,
				opt = this.configs;
			var html = $('<div class="nex-cal-header" id="'+opt.id+'_header"></div>');
			self.el.append( html );
			self.headerEl = html;
			self.fireEvent('onCalendarHeaderCreate',[ html, opt ]);
			return self;
		},
		getBody : function(){
			return this.bodyEl;
		},
		_setCalendarBody : function(){
			var self = this,
				opt = this.configs;
			var html = $('<div class="nex-cal-body" id="'+opt.id+'_body"></div>');
			self.el.append( html );	
			self.bodyEl = html;
			self.fireEvent('onCalendarBodyCreate',[ html, opt ]);
			return self;	
		},
		_setCalendarFooter :　function(){
			var self = this,
				opt = this.configs;
			var html = $('<div class="nex-cal-footer" id="'+opt.id+'_footer"></div>');
			self.el.append( $('<div class="nex-cal-clear"></div>') )	
				   .append( html )
				   .append( $('<div class="nex-cal-clear"></div>') );	
			self.footerEl = html;
			self.fireEvent('onCalendarFooterCreate',[ html, opt ]);
			return self;		
		},
		/*
		*设置日历的布局
		*/
		_setCalendar : function(){
			var self = this,
				opt = this.configs;
			self._setCalendarHeader()
				._setCalendarBody()
				._setCalendarFooter()
				._setCalendarItemEvents()
				._setCalendarItems()
				._afterRender();
			return self;	
		},
		_getCalendarItemsTpl : function( num ){
			var opt = this.configs;
			var num = this._undef( num,1 );
			var html = [];
			html.push(
					'<table cellpadding="0" cellspacing="0" border="0" class="nex-cal-items-table" id="'+opt.id+'_items_table">',
						'<tbody>',
							'<tr>'
					);
							for( var i=0;i<num;i++ ) {
								html.push(
									'<td class="nex-cal-item-table-td" citem="'+i+'">',
										'<div id="'+opt.id+'_item'+i+'" citem='+i+' class="nex-cal-item"></div>',
									'</td>'
								);
								var showSep = true;
								if( i == num-1 ) {
									showSep = false;	
								}
								var d = {show : showSep};
								var r = this.fireEvent('onSetItemSplitTd',[d,i,num,opt]);
								if( r !== false && d.show ) {
									html.push(
										'<td class="nex-cal-item-split-td" citem="'+i+'">',
											'<div class="nex-cal-item-split-line"></div>',
										'</td>'
									);		
								}
							}
					html.push(
							'</tr>',
						'</tbody>',
					   '</table>'
					);	
			return html.join('');		
		},
		_setCalendarItems : function(){
			var self = this,
				opt = this.configs;
			//numberOfMonths
			var num = parseInt(opt.numberOfMonths,10) || 1;
			self.bodyEl.html( self._getCalendarItemsTpl( num ) );
			
			var last = num - 1;
			for( var i=0;i<num;i++ ) {
				
				var d = $.extend( {},opt );
				d.currentDate = new Date(opt.currentDate.getTime());
				
				self.Date.add(d.currentDate,'m',i);
				
				if( i == 0 ) {
					d._showChangeMonthPrevBtn = true;
					d._showChangeYearNextBtn = true;
					
					d._showPrevMonths = true;
				} else {
					d._showChangeMonthPrevBtn = false;
					d._showChangeYearNextBtn = false;
					
					d._showPrevMonths = false;
				}
				if( i == last ) {
					d._showChangeMonthRightBtn = true;
					d._showChangeYearRightBtn = true;
					
					d._showNextMonths = true;
				} else {
					d._showChangeMonthRightBtn = false;
					d._showChangeYearRightBtn = false;	
					
					d._showNextMonths = false;
				}
				//设置showOtherMonths
				if( opt.showOtherMonths ) {
					if( i == 0 || i == last ) {
						d.showOtherMonths = true;
					} else {
						d.showOtherMonths = false;	
					}
				}
				
				var _item = $('#'+opt.id+'_item'+i);
				var part = self.Date.dateObject( d.currentDate );
				_item.attr('data-year',part['y+']);
				_item.attr('data-month',part['M+']);
				
				self.fireEvent('onBeforeCalendarItemCreate',[d,i,opt]);	
				self._setCalendarItemHeader( i,d )
					._setCalendarItemBody( i,d )
					._setCalendarItemFooter( i,d );
				self.fireEvent('onCalendarItemCreate',[_item,i,opt]);	
			}
			//items设置后 应该重新设置宽高
			if( !opt._isInit ) {
				self._refreshCalendarItemsSize();	
			}
			self._afterRenderItems();
			self.fireEvent('onCalendarItemsRender',[opt]);	
			return this;		
		},
		_currentDate : null,
		_afterRenderItems : function(){
			this._currentDate = this.Date.clone(this.getCurrentDate());
			this._refreshSelectDate();	
		},
		//刷新日期列表
		_refreshItems : function(){
			this._setCalendarItems();
			this._resizeAuto();	
		},
		/*
		*刷新日历
		*/
		refreshItems : function( m ){
			
			if( !m && this._currentDate ) {
				if( this._isEqualMonth( this._currentDate,this.getCurrentDate() ) ) {
					return this;	
				}	
			}
			
			this._refreshItems();
			this.fireEvent('onRefreshCalendarItems',[ this.configs ]);
			return this;	
		},
		refreshCalendar : function(m){
			return this.refreshItems( m );
		},
		//往后翻n月
		prevMonth : function( n ){
			var self = this,
				opt=this.configs;
			var n = self._undef(n,1);
			
			self.Date.add( opt.currentDate,'m',Math.abs(n)*-1 );
			
			self.refreshItems();
			return self;		
		},
		nextMonth : function( n ){
			var self = this,
				opt=this.configs;
			var n = self._undef(n,1);
				
			self.Date.add( opt.currentDate,'m',Math.abs(n));
			
			self.refreshItems();	
			return self;		
		},
		prevYear : function( n ){
			var self = this,
				opt=this.configs;
			var n = self._undef(n,1);
				
			self.Date.add( opt.currentDate,'y',Math.abs(n)*-1);
			
			self.refreshItems();	
			return self;		
		},
		nextYear : function( n ){
			var self = this,
				opt=this.configs;
			var n = self._undef(n,1);
				
			self.Date.add( opt.currentDate,'y',Math.abs(n));
			
			self.refreshItems();
			return self;			
		},
		/*IE6 7时使用*/
		_resizeAuto : function(){
			var self = this,
				opt=this.configs;
			if( Nex.IEVer == 6 || Nex.IEVer == 7 ) {	
				if( self.isAutoWidth() ) {
					var w = $('#'+opt.id+'_items_table')._width();
					self.getBody().width( w );
				}	
			}	
		},
		_isOutside : function( date ){
			var self = this,
				opt=this.configs;
			var num = opt.numberOfMonths;
			for( var i=0;i<num;i++ ) {
				var curr = self.Date.clone( opt.currentDate );
				if( !self._isOtherMonth( date,self.Date.add(curr,'m',i) ) ) {
					return false;	
				}	
			}	
			return true;
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
			
			self.toggleSelectDate( date );	
		},
		_afterRender : function(){
			var opt = this.configs;
			this.fireEvent('onCalendarCreate',[ opt ]);	
			if( opt.autoShowymPickerIndex !== null && !isNaN( parseInt( opt.autoShowymPickerIndex, 10 ) ) ) {
				this.showYearMonthPicker( Math.min( opt.autoShowymPickerIndex,opt.numberOfMonths-1 ) );	
			}
		},
		_setHeightAuto : function(){
			var self = this;
			var opt = self.configs;	
			var views = opt.views;	
			var bd = self.getBody();
			var container = self.getContainer();
			container._removeStyle('height',true);
			if( bd ) {
				bd._removeStyle('height',true);	
			}
			$('.nex-cal-item-body',bd)._removeStyle('height',true);
		},
		_setWidthAuto : function(){
			var self = this;
			var opt = self.configs;	
			var views = opt.views;	
			var bd = self.getBody();
			var container = self.getContainer();
			container._removeStyle('width',true);
			if( bd ) {
				bd._removeStyle('width',true);	
			}
		},
		_setViewSize : function(){
			var self = this;
			var opt = self.configs;
			var container = self.getContainer();	
			if( !self.isAutoHeight() ) {
				container.removeClass('nex-cal-height-auto');
				var height = container._height() - self.headerEl._outerHeight() - self.footerEl._outerHeight();
				self.bodyEl._outerHeight( height );
			} else {
				container.addClass('nex-cal-height-auto');
			}
			if( !self.isAutoWidth() ) {
				container.removeClass('nex-cal-width-auto');
				self.bodyEl._outerWidth( container._width() );
			} else {
				container.addClass('nex-cal-width-auto');	
			}
			self._refreshCalendarItemsSize();
			return Nex.Html.fn._setViewSize.apply(self,arguments);	
		},
		/*设置items的的大小*/
		_refreshCalendarItemsSize : function(){
			var self = this;
			var opt = self.configs;		
			if( !self.isAutoHeight() ) {
				var bheight = self.bodyEl._height();
				//大部分浏览器td的div如果不给td设置宽度div的百分比设置无效。 chrome上就没问题
				$('.nex-cal-item-table-td,.nex-cal-item-split-td',self.bodyEl).each( function(){
					$(this)._outerHeight( bheight );
				} );	
				$('.nex-cal-item',self.bodyEl).each( function(){
					var $this = $(this);
					var height = $this._height() - $('>.nex-cal-item-header',$this)._outerHeight() - $('>.nex-cal-item-footer',$this)._outerHeight();	
					$('>.nex-cal-item-body',$this)._outerHeight(height);
				} );
			}
			if( !self.isAutoWidth() ) {
			}
			self.fireEvent('onSetCalendarItemsSize',[opt]);
			return self;
		},
		//刷新日期选中状态
		_refreshSelectDate : function(){
			var self = this;
			var opt = self.configs;
			var last = null;
			$.each( opt._selectDate,function(d,v){
				last = d;
				if( v && opt.multiSelect ) {
					self._selectDate( d,true  );	
				}	
			} );	
			if( !opt.multiSelect && last ) {
				self._selectDate( last,true  );	
			}
			return self;
		},
		/*
		*取消所有选中日期
		*/
		_unselectAll : function(){
			var self = this;
			var opt = self.configs;
			
			opt._selectDate = {};
			
			$('.nex-cal-date-selected',self.bodyEl).removeClass('nex-cal-date-selected');
			
			/*$.each( opt._selectDate,function(d,v){
				if( v ) {
					self._unselectDate( d,true  );	
				}	
			} );	*/
			return self;	
		},
		//判断是否已经被选中
		isSelected : function(date,m){
			var self = this;
			var opt = self.configs;
			
			var fmt = self._parseSDate( date,m );
			
			return opt._selectDate[ fmt ] ? true : false;	
		},
		/*
		*把日期转化成YYYYMMDD格式
		*/
		_parseSDate : function( date,m ){
			var self = this;
			var opt = self.configs;	
			var date = date || opt.currentDate;
			var _Date = self.Date;
			var fmt;
			if( m !== true ) {
				if( !_Date.isDate( date ) ) {
					date = _Date.strToDate( date,m );	
				}
				fmt = self.format(date,'YYYYMMDD');
			} else {
				fmt = date;	
			}
			return fmt;
		},
		/*
		*设置日期的选中状态 
		*@param date 日期对象或者YYYY-MM-DD格式的日期
		*/
		_selectDate : function( date,m ){
			var self = this;
			var opt = self.configs;
			
			var fmt = self._parseSDate( date,m );
			
			var id = opt.id+'_'+fmt;
			//单选
			if( !opt.multiSelect ) {
				self._unselectAll();	
			}
			
			$( '#'+id ).addClass('nex-cal-date-selected');
			
			opt._selectDate[ fmt ] = true;
			
			return date;
		},
		/*
		*设置日期的选中状态 
		*@param date 日期对象或者YYYY-MM-DD格式的日期
		*/
		_unselectDate : function( date,m ){
			var self = this;
			var opt = self.configs;
			
			var fmt = self._parseSDate( date,m );
			
			var id = opt.id+'_'+fmt;
			
			$( '#'+id ).removeClass('nex-cal-date-selected');
			
			opt._selectDate[ fmt ] = false;
			delete opt._selectDate[ fmt ];
			
			return date;
		},
		unselectAll : function(){
			var self = this;
			var r = this.fireEvent('onDateUnSelectedAll',[date,m,this.configs]);
			if( r === false ) return this;
			
			this._unselectAll();
			
			self.fireEvent('onDateChange',[this.getValue(),this.configs]);
			
			return this;	
		},
		unselectDate : function(date,m){
			var self = this;
			var r = this.fireEvent('onDateSelected',[date,m,this.configs]);
			if( r === false ) return this;
			
			this._unselectDate(date,m);
			
			self.fireEvent('onDateChange',[this.getValue(),this.configs]);
			
			return this;	
		},
		selectDate : function( date,m ){
			var self = this;
			var opt = self.configs;
			
			var r = self.fireEvent('onDateSelected',[date,m,opt]);
			if( r === false ) return self;
			
			self._selectDate(date,m);	
			
			self.fireEvent('onDateChange',[this.getValue(),opt]);
			
			return self;
		},
		toggleSelectDate : function( date,m ){
			var self = this;
			var opt = self.configs;
			
			var fmt = self._parseSDate( date,m );
			
			if( opt.multiSelect ) {
				if( self.isSelected( date,m ) ) {
					self.unselectDate( date,m );					
				} else {
					self.selectDate( date,m );					
				}
			} else {
				self.selectDate( date,m );					
			}
			return self;
		},
		/*
		*选择一段日期范围
		*/
		_selectDateRange : function( start, end ){
			var self = this;
			var opt = self.configs;	
			var undef;
			if( start === undef ) return self;
			
			end = end === undef ? start : end;
			
			start = self.Date.parseDate( start,opt.dateFormat );
			end = self.Date.parseDate( end,opt.dateFormat );
			
			var diff = self.Date.diff( start,end,'d' );
			
			start = self.Date.clone( start );
			end = self.Date.clone( end );
			//--	
			var _s,_e,_curr;
			_curr = self.getCurrentDate();
			_s = self.Date.clone( _curr );
			_s.setDate(1);
			self.Date.add(_s,'d',-7);
			_e = self.Date.clone( _s );
			_e = self.Date.add( _e,'d',42*opt.numberOfMonths );
			
			var isOutSide = function( date ){
				if( Math.abs( diff )<42*opt.numberOfMonths ) return false;
				if( date<_s ) return true;
				if( date>_e ) return true;	
				return false;
			};
			//--
			var curr = diff<0?end:start;
			for( var j=0;j<=Math.abs(diff);j++ ) {
				if( isOutSide( curr ) ) {
					opt._selectDate[ self.format( curr,'YYYYMMDD' ) ] = true;	
				} else {
					self._selectDate( curr );	
				}
				self.Date.add( curr,'d',1 );
			}
			
			return self;
		},
		selectDateRange : function( start,end ){
			var self = this;
			var opt = self.configs;	
			self._selectDateRange( start,end );
			self.fireEvent('onDateChange',[ this.getValue(),opt ]);
			self.fireEvent('onSelectDateRange',[ start,end,opt ]);
			return self;	
		},
		today : function(){
			this.goAndSelectDate( this.configs.systemDate );	
		},
		/*
		*翻到指定日历并选中
		*/
		goAndSelectDate : function(date,m){
			var self = this;
			var opt = self.configs;	
			self.selectDate( date );
			self.goToDate( date );
			return self;
		},
		/*
		*把日历翻到指定日期
		*/
		goToDate : function( date ){
			var self = this;
			var opt = self.configs;	
			
			opt.currentDate = self.Date.parseDate( date,opt.dateFormat );
			
			self.refreshItems();	
			return self;
		},
		//改变日历月份
		changeMonth : function( y,m ){
			var self = this;
			var opt = self.configs;	
			opt.currentDate.setFullYear( y );	
			opt.currentDate.setMonth( m-1 );	
			self.refreshItems();	
			return self;	
		},
		//改变年份月份
		changeYear : function( y ){
			var self = this;
			var opt = self.configs;	
			opt.currentDate.setFullYear( y );	
			self.refreshItems();	
			return self;		
		},
		/**
		* 设置默认选中日期,当前操作会重置已经选中的日期 如果只是选中日期 请使用selectDate
		*/
		setValue : function( value ){
			var self = this;
			var opt = self.configs;
			
			var argvs = [].slice.apply(arguments);
			
			self.fireEvent('onSetValue',[argvs]);
			
			self._parseValue( argvs[0] );
			self.refreshItems( true );
			return this;
		},
		setDate : function(){
			return this.setValue.apply( this,arguments );	
		},
		/*获取当前日期 根据dateFormat格式化*/
		getValue : function(){
			var self = this;
			var opt = self.configs;
			var sel = [];
			$.each( opt._selectDate,function(k,v){
				if( v ){
					var date = self.Date.parseDate(k,'YYYYMMDD');
					sel.push( self.format( date,opt.dateFormat ) );	
				}	
			} );
			
			var value = null;
			
			if( $.isFunction( opt.getFormater ) ) {
				var val = opt.getFormater.call( self,sel );
				value = val === undef ? value : val;
			} else {
				if( opt.multiSelect ) {
					value = sel;
				} else {
					value = sel[0];	
				}	
			}
			
			var _d = {
				value : value	
			};
			
			self.fireEvent('onGetValue',[ _d ]);
			
			return _d.value;
		},
		getStrValue : function(){
			var v = this.getValue();
			if( $.isArray( v ) ) {
				v = v.join( this.configs.sepStr );	
			}	
			return v;
		},
		getDate : function(){
			return this.getValue.apply( this,arguments );	
		},
		getStrDate : function(){
			return this.getStrValue.apply( this,arguments );	
		},
		initComponent : function(){
			Nex.Html.fn.initComponent.apply( this,arguments );
			this._resizeAuto();	//兼容IE67
		}
	});	
	cal.extend( Nex.util.Date );
	cal.setOptions(function(opt){
		return {
			prefix : 'nexcal-',
			autoScroll : false,
			//关闭默认事件
			denyEvents : 'focusin focusout focus blur scroll keydown keyup keypress mousewheel mouseover mouseout'.split(/\s+/),
			disabledItems : true,
			width : 'auto',
			height : 'auto',
			borderCls : opt.borderCls+' nex-calendar-border',
			containerCls : opt.containerCls+' nex-calendar',
			autoScrollCls : opt.autoScrollCls+' nex-calendar-auto-scroll',
			dateFormat : 'YYYY-MM-DD',
			sepStr : ',',//获取时设置分隔符
			//没用上
			dayNames: ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'],
			//没用上
			dayNamesShort: ['周日','周一','周二','周三','周四','周五','周六'],
			dayNamesMin: ['日','一','二','三','四','五','六'],
			weekHeader : '周',
			monthNames: ['一月','二月','三月','四月','五月','六月',
			'七月','八月','九月','十月','十一月','十二月'],
			//没用上
			monthNamesShort: ['一月','二月','三月','四月','五月','六月',
			'七月','八月','九月','十月','十一月','十二月'],
			prevMonthTitle:"上一月",
       		nextMonthTitle:"下一月",
			prevYearTitle:"上一年",
       		nextYearTitle:"下一年",
			firstDay: 0,//0~6 日~六
			weekIndex : 'firstDay',//默认是根据firstDay来当作是一周的开始计算日起 ，可自定义星期数 0~6
			//默认系统时间 默认取当前时间
			systemDate : null,
			//当前日历面板显示的月份
			//默认是取今天 或者value的值 如果value是数组则默认取最后一个值
			currentDate : null,
			//y m d w q  年 月 日 周 季度
			//默认显示到指定日期的月份
			//默认选中的日期 默认是当天
			_dateCalcReg : /([\-|\+]\d+)(y|m|d|w|q)/i,//匹配是否是 +1d -1d ...等格式
			value : '',//默认不设置选中日期  eg : '+1d' 0 [ '2014-08-09','+1d' ] 
			getFormater : null,
			setFormater : null,
			autoSelectToday : false,//默认选择今天
			//日期所选的日子
			_selectDate : {}, //默认是defaultDate 可以是是数组表示多个选中日期
			multiSelect : false, //是否可多选
			autoFillOthers : false,//自动填充不足日期的td，日期面板显示的长度是41个单元格 如果不足用空的td填充
			autoChangeMonth : true,//点击其他月份日期时会自动滚动指定月份
			//是否在当前面板显示上、下两个月的一些日期数
			showOtherMonths : true,
			_showPrevMonths : true,//显示上个月的日期
			_showNextMonths : true,//显示下个月的日期
			//板显示上、下两个月的一些日期数时 是否不可选
			otherMonthsDisabled : false,
			//是否显示周
			showWeek : false,
			showDateTips : true,
			dateTipsTag : 'title',
			dateTipsFormat : 'YYYY-MM-DD',
			dateTipsFilter : null,
			dateFilter : null,
			maxDate : null,//最大有效日期
			minDate : null,//最小有效日期
			disabledDate : [],//可以单独指定无效日期
			enabledDate   : [],//如果指定了一个无效范围，但是有个别日期是可选的，就需要使用这个参数
			numberOfMonths : 1,//默认显示多少个月
			topTitleFormat : 'YYYY年M月',
			topTitleFilter : null,
			showChangeMonthBtn : true,//显示 <  >
			_showChangeMonthPrevBtn : true,
			_showChangeMonthRightBtn : true,
			showChangeYearBtn : true,//显示 << >>
			_showChangeYearNextBtn : true,
			_showChangeYearRightBtn : true,
			ymChangeEnable : true,//可通过年月日选择框改变年月
			autoShowymPickerIndex : null,//默认展开第几个年月选择框 0~numberOfMonths-1 该数值
			ymPickerDuration : 100,
			ymPickerAnim : 'easeOutQuad',
			ymPickerAutoClose : true,//点击月份后 年月选择框会自动关闭
			yPickerDelay : 300,
			yPickerPoll  : 50,
			//调用顺序
			_initMethod : ['_initCalendar']
		};	
	});
});