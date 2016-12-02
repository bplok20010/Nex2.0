/*
*
*Nex.util.Date
*/
Nex.addUtil('Date',{
	/*
	*返回当前时间对象
	*/
	now : function( d ){
		var date = new Date();
		if( d ) {
			this.add( date,'d',d );	
		}
		return date;	
	},
	isArray : function( obj ){
		var nativeIsArray = Array.isArray;	
		var toString = Object.prototype.toString;
		return nativeIsArray ? nativeIsArray.call( Array,obj ) : (toString.call(obj) == '[object Array]');
	},
	isFunction : function(obj){
		var toString = Object.prototype.toString;
		return toString.call(obj) == '[object Function]';	
	},
	/*
	*日期填充0
	*/
	pad : function(v,len){
		var res = "" + v;
		var len = len || 2;
		for (; res.length < len; res = '0' + res) {
		}
		return res;	
	},
	/*
	*判断是否日期对象
	*/
	isDate : function( date ){
		return Object.prototype.toString.call(date)	== '[object Date]';
	},
	/*
	*判断当前年份是否闰年
	*@param {Int} year
	*/
	isLeapYear : function(year){
		year = this.isDate( year ) ? year.getFullYear() : parseInt(year,10);
		return (year%4 === 0 && year%100 !== 0) || year%400 === 0;	
	},
	/*
	*日期格式处理
	*@param {Date}		日期对象			默认：当前时间
	*@param {String}	格式化字符串		默认：YYYY-MM-DD
	*@param {Array}		格式化周时文字	默认：['日','一','二','三','四','五','六']
	*	YYYY/yyyy 		年份 	eg:2014
	*	YY/yy  			年份 	eg:14
	*	MM/M			月份		eg:08/8
	*	w 				星期数 0~6 or 日~六
	*	W/WW			ISO8601自然周
	*	DD/dd			日期 	eg:01
	*	D/d   			日期  	eg:1
	*   a/A             am pm   --未实现
	*	q/Q   			季度  	eg:1
	*   o/O/oo/OO		一年中的第几天
	*	HH/hh			小时(24小时制)		eg:09
	*	H/h				小时(24小时制)		eg:9
	*	mm/m			分钟		eg:04/4
	*	SS/ss			秒		eg:01
	*	S/s				秒		eg:1
	*/
	format : function( date,fmt,w ){
		var me = this;
		var date = date || this.now();
		var str = fmt || 'YYYY-MM-DD';  
		var Week = w || ['日','一','二','三','四','五','六']; 
	 
		str=str.replace(/yyyy|YYYY/,function(){
			return date.getFullYear();
		});  
		str=str.replace(/yy|YY/,function(){
			var y = date.getYear() % 100;
			return me.pad(y);
		});  
	 
		str=str.replace(/MM/,function(){
			var m = date.getMonth()+1;
			return me.pad(m);	
		});  
		str=str.replace(/M/g,function(){
			return date.getMonth()+1;	
		});  
	 
		str=str.replace(/w/g,function(){
			return Week[date.getDay()];
		}); 
		
		str=str.replace(/W/g,function(){
			return me.weekOfYear( date );		
		});  
		str=str.replace(/WW/g,function(){
			return me.pad(me.weekOfYear( date ));	
		}); 
	 
		str=str.replace(/dd|DD/,function(){
			return me.pad( date.getDate() );	
		});  
		str=str.replace(/d|D/g,function(){
			return date.getDate();	
		});  
		
		str=str.replace(/q|Q/g,function(){
			return me.getQuarter(date.getMonth()+1);	
		});  
		
		str=str.replace(/o|O/g,function(){
			return me.dayOfYear(date);	
		});  
		str=str.replace(/oo|OO/g,function(){
			me.pad(me.dayOfYear(date),3);	
		});  
	 
		str=str.replace(/hh|HH/,function(){
			return 	me.pad( date.getHours() );
		});  
		str=str.replace(/h|H/g,function(){
			return date.getHours();
		});  
		str=str.replace(/mm/,function(){
			return me.pad( date.getMinutes() );	
		});  
		str=str.replace(/m/g,function(){
			return date.getMinutes();
		});  
	 
		str=str.replace(/ss|SS/,function(){
			return me.pad( date.getSeconds() );	
		});  
		str=str.replace(/s|S/g,function(){
			return date.getSeconds();		
		});  
	 
		return str;  
	},
	/**
	* 字符串转换为日期对象
	* @param {String} 格式为yyyy-MM-dd HH:mm:ss，必须按年月日时分秒的顺序，中间分隔符不限制
	* @parma {String} fmt 可选 如果传入后会调用parseDate来解析 一般解析复杂日期的时候处理eg strToDate('20150809','YYYYMMDD') === parseDate('20150809','YYYYMMDD');
	* @return {Date}
	*/
	strToDate : function(dateStr,fmt){
		var undef;
		if( this.isDate( dateStr ) ) {
			return dateStr;	
		}
		if( dateStr === undef ) {
			return this.now();	
		}
		if( fmt ) {
			return this.parseDate( dateStr,fmt );	
		}
		var data = dateStr;  
		var reCat = /(\d{1,4})/gm;   
		var t = data.match(reCat);
		t[1] = t[1] - 1;//月份减一
		eval('var d = new Date('+t.join(',')+');');
		return d;
	},
	clone : function(date){
		var date = this.strToDate( date );
		return new Date( date.getTime() );	
	},
	/** 
     * 根据给定的格式对给定的字符串日期时间进行解析
	 * @param string eg : 12/09/2014 
	 * @param format 可以是数组或者自定义函数 eg : DD/MM/YYYY   [] func
     */
	parseDate: function(strDate, strFormat){   
		var undef,self = this;
		if( this.isDate( strDate ) ) {
			return strDate;	
		}
		var regs = /YYYY|yyyy|YY|yy|MM|M|w|WW|W|DD|dd|D|d|A|a|q|Q|OO|oo|O|o|HH|hh|H|h|mm|m|SS|ss|S|s/g;
		//默认格式
		var fmts = [
			'YYYY-MM-DD',
			'YYYY-M-D',
			'YYYY/MM/DD',
			'YYYY/M/D',
			'DD/MM/YYYY',
			'D/M/YYYY',
			'YYYYMMDD',
			'YYYY.MM.DD',
			'YYYY.M.D'
		];
		var strFormat = strFormat ? self.isArray( strFormat ) ? strFormat : [ strFormat ] : [];
		fmts = strFormat.concat(fmts);
		var _parseFmt = function( date,fmt ){
			var _matchs = {};
			fmt = fmt.replace(/\.|\\|\/|\+|\?|\$|\*|\^|\(|\)|\||\<|\>|\{|\}/g,function(e){
				return '\\'+e;	
			});	
			var i=0;
			var _regrep = fmt.replace( regs,function(r){
				var s = '';
				_matchs[i++] = r;
				switch( r ) {
					case 'yyyy':
					case 'YYYY':
						s = '(\\d{4})';
						break;
					case 'yy':	
					case 'YY':	
					case 'MM':
					case 'dd':
					case 'DD':
					case 'WW':	
					case 'HH':	
					case 'hh':
					case 'mm':
					case 'ss':
						s = '(\\d{2})';	
						break;
					case 'q':	
					case 'Q':	
						s = '(\\d{1})';	
						break;
					case 'oo':	
					case 'OO':	
						s = '(\\d{3})';	
						break;	
					case 'o':	
					case 'O':	
						s = '(\\d{1,3})';	
						break;	
					case 'a':	
					case 'A':	
						s = '((?:pm|PM|am|AM))';	
						break;			
					case 'w' : 
						s = '(\\S)';
						break;		
					default:
						s = "(\\d\\d?)";
						break;			
				}
				return s;	
			} );
			var es = new RegExp( _regrep,'g' ).exec(date);
			if( !es ) {
				return null;	
			}
			es.splice(0,1);
			var part = {};
			for( k in _matchs ) {
				part[ _matchs[k] ] = es[k];	
			}
			var currentDate = new Date();
			var d = self.dateObject( currentDate );
			d['M+'] = '1';
			d['d+'] = '1';
			d['h+'] = '00';
			d['m+'] = '00';
			d['s+'] = '00';
			
			if( ('yyyy' in part) || ('YYYY' in part) ) {
				d['y+'] = part['YYYY'] || part['yyyy'];	
			} else if( ('yy' in part) || ('YY' in part) ) {
				var _y = (d['y+']+'').substring(0,2);
				d['y+'] = part['YY'] || part['yy'];	
				d['y+'] = _y + d['y+'];
			}
			if( ('MM' in part) || ('M' in part) ) {
				d['M+'] = part['MM'] || part['M'];	
			}
			if( ('DD' in part) || ('dd' in part) ) {
				d['d+'] = part['DD'] || part['dd'];	
			}
			if( ('D' in part) || ('d' in part) ) {
				d['d+'] = part['D'] || part['d'];	
			}
			if( ('HH' in part) || ('hh' in part) || ('H' in part) || ('h' in part) ) {
				d['h+'] = part['HH'] || part['hh'] || part['H'] || part['h'];	
			}
			if( ('mm' in part) || ('m' in part) ) {
				d['m+'] = part['mm'] || part['m'];	
			}
			if( ('SS' in part) || ('ss' in part) || ('S' in part) || ('s' in part) ) {
				d['s+'] = part['SS'] || part['ss'] || part['S'] || part['s'];	
			}
			return new Date( d['y+'],parseInt(d['M+'],10)-1,d['d+'],d['h+'],d['m+'],d['s+'] );
		};
		var es = null;
		for( var n=0;n<fmts.length;n++ ) {
			if( self.isFunction( fmts[n] ) ) {
				es = fmts[n].call( this,strDate );	
			} else {
				if( fmts[n] ) {
					es = _parseFmt.call( this, strDate, fmts[n] );	
				}
			}
			if( es ) {
				break;	
			}
		}
		if( !es ) {
			return new Date();	
		}
		return es;
    },
	/**
	* 获取本月季度
	* @param Int m 月份
	*/
	getQuarter : function(m){
		var q = 0;
		if(m<4){ 
			q = 1; 
		} 
		if( m>3 && m<7){ 
			q = 2; 
		} 
		if( m>6 && m<10){ 
			q = 3; 
		} 
		if( m>9){ 
			q = 4; 
		} 
		return q; 
	},
	/**
	* 日期添加 日期格式必须是 yyyy-MM-dd hh:mm:ss类型 顺序不可更改
	* @param {Date}
	* @param {String} interval 添加间隔类型 年y 月m 日d 季度q 周w 小时h 分n 秒s 毫秒l
	* @param {Int}	number 添加时间间隔值,可以是正负值
	*/
	add : function(idate, interval, number) {
		number = parseInt(number,10);
		var date;
		date = this.strToDate( idate );
		switch (interval) {
			case "y": date.setFullYear(date.getFullYear() + number); break;
			case "m": 
				//bug处理 eg:3.30日 ，如果减去一个月 就是 2.30日 但2月只有28天 所以会溢出又会到3.2日
				var _date = date.getDate();
				date.setDate(1);
				date.setMonth(date.getMonth() + number); 
				var days = this.maxDay( date );
				date.setDate( Math.min( _date,days ) );
				break;
			case "d": date.setDate(date.getDate() + number); break;
			case "q": 
				date.setMonth(date.getMonth() + 3 * number); 
				break;
			case "w": date.setDate(date.getDate() + 7 * number); break;
			case "h": date.setHours(date.getHours() + number); break;
			case "n": date.setMinutes(date.getMinutes() + number); break;
			case "s": date.setSeconds(date.getSeconds() + number); break;
			case "l": date.setMilliseconds(date.getMilliseconds() + number); break;
		}
		return date;
	},
	addDate : function(){
		return this.add.apply( this,arguments );	
	},
	/*
	* 日期减少 使用方法同add
	*/
	reduce : function(a,b,c){
		return this.add(a,b,parseInt(c,10)*-1);	
	},
	reduceDate : function(a,b,c){
		return this.add(a,b,parseInt(c,10)*-1);	
	},
	/**
	* 日期对比
	* @param {String} interval 对比日期类型 年y 月m 日d 季度q 周w 小时h 分n 秒s 毫秒l
	*/
	diff : function(d1, d2, interval){
		d1 = this.strToDate(d1);
		d2 = this.strToDate(d2);
		switch (interval) {
                case "d": //date
                case "w":
                    d1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
                    d2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
                    break;  //w
                case "h":
                    d1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours());
                    d2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate(), d2.getHours());
                    break; //h
                case "n":
                    d1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes());
                    d2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate(), d2.getHours(), d2.getMinutes());
                    break;
                case "s":
                    d1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate(), d1.getHours(), d1.getMinutes(), d1.getSeconds());
                    d2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate(), d2.getHours(), d2.getMinutes(), d2.getSeconds());
                    break;
            }
            var t1 = d1.getTime(), t2 = d2.getTime();
            var diff = NaN;
            switch (interval) {
                case "y": diff = d2.getFullYear() - d1.getFullYear(); break; //y
                case "m": diff = (d2.getFullYear() - d1.getFullYear()) * 12 + d2.getMonth() - d1.getMonth(); break;    //m
				case "q": diff = (d2.getFullYear() - d1.getFullYear()) * 4 + this.getQuarter(d2.getMonth()+1) - this.getQuarter(d1.getMonth()+1); break;    //q
                case "d": diff = Math.floor(t2 / 86400000) - Math.floor(t1 / 86400000); break;
                case "w": diff = Math.floor((t2 + 345600000) / (604800000)) - Math.floor((t1 + 345600000) / (604800000)); break; //w
                case "h": diff = Math.floor(t2 / 3600000) - Math.floor(t1 / 3600000); break; //h
                case "n": diff = Math.floor(t2 / 60000) - Math.floor(t1 / 60000); break; //
                case "s": diff = Math.floor(t2 / 1000) - Math.floor(t1 / 1000); break; //s
                case "l": diff = t2 - t1; break;
            }
            return diff;	
	},
	diffDate : function(){
		return this.diff.apply( this,arguments );	
	},
	/*
	* 把日期分割才数组 [y,m,d,h,i,s]
	*/
	toArray : function( date ){
		var d = []; 
		date = this.strToDate( date );
		d[0] = date.getFullYear(); 
		d[1] = date.getMonth()+1; 
		d[2] = date.getDate(); 
		d[3] = date.getHours(); 
		d[4] = date.getMinutes(); 
		d[5] = date.getSeconds(); 
		return d; 	
	},
	/**
	* 检查日期是否合法 日期格式必须要类似 yyyy-MM-dd hh:mm:ss 分隔符不限
	* 例如 2015-02-31 二月是没有31号的
	* @param date 日期字符串
	*/
	isVaild : function(date){
		var undef;
		var reCat = /(\d{1,4})/gm;   
		var r = date.match(reCat);
		if( !r.length ) return false;
		var d = this.toArray(date);
		if(r[0] !== undef && d[0]!=r[0])return false;  
   	 	if(r[1] !== undef && d[1]!=r[1])return false;  
   	 	if(r[2] !== undef && d[2]!=r[2])return false;  
    	if(r[3] !== undef && d[3]!=r[3])return false;  
    	if(r[4] !== undef && d[4]!=r[4])return false;  
    	if(r[5] !== undef && d[5]!=r[5])return false;  
		return true;
	},
	/** 
     * 根据给定的日期得到日期的年，月，日，时，分和秒的对象 
     * @params date 给定的日期 date为非Date类型， 则获取当前日期 
     * @return 有给定日期的月、日、时、分和秒组成的对象 
     */   
    dateObject: function(date){   
        date = this.strToDate( date ); 
        return {  
			'y+' : date.getFullYear(),
            'M+' : date.getMonth() + 1,    
            'd+' : date.getDate(),      
            'h+' : date.getHours(),      
            'm+' : date.getMinutes(),    
            's+' : date.getSeconds()   
         };   
    },
	//+--------------------------------------------------- 
	//| 取得日期数据信息 
	//| 参数 interval 表示数据类型 
	//| y 年 m月 d日 w星期 ww周(年) h时 n分 s秒 
	//+--------------------------------------------------- 
	part : function( date,interval,w ){
		date = this.strToDate( date );
		var d=''; 
		var Week = w||['日','一','二','三','四','五','六']; 
		switch (interval) 
		{  
			case 'y' : d = date.getFullYear();break; 
			case 'm' : d = date.getMonth()+1;break; 
			case 'd' : d = date.getDate();break; 
			case 'w' : d = Week[date.getDay()];break; 
			case 'ww': d = this.weekOfYear(date);break; 
			case 'h' : d = date.getHours();break; 
			case 'n' : d = date.getMinutes();break; 
			case 's' : d = date.getSeconds();break; 
		} 
		return d; 
	},
	/**
	* 取得指定日期所在月分的最大天数，一个月的最后一天日期(还有个更简单的方法是 日期设置上个月的日期为0，那么就可以得到这个月的最后一天日期)
	* @param date
	*/
	maxDay : function( date ){
		var date1 = this.strToDate( date );
		date1 = this.clone( date1 );
		date1.setDate(1);
		date1.setMonth( date1.getMonth()+1 );
		date1.setDate(0);
		return date1.getDate(); 		
	},
	/**
	* 返回当前月份的所有天数
	* @param date 日期
	* return Array eg:[1,2,3...,31]
	*/
	getDays : function(date){
		var days = [];
		var md = this.maxDay( date );
		for( var i=1;i<=md;i++ ) {
			days.push( i );	
		}	
		return days;
	},
	/*获取本月第一天*/
	firstDay : function(date){
		var date = this.clone(date);
		return date.setDate(1);	
	},
	/*获取本月最后一天*/
	lastDay : function( date ){
		var date = this.clone( date );
		date.setDate(this.maxDay( date ))
		return date;		
	},
	/*
	*获取月份
	*/
	getMonths : function(){
		return [1,2,3,4,5,6,7,8,9,10,11,12];	
	},
	/*
	*获取从1900到2099数组
	*/
	getYears : function(){
		var y = [];
		for( var i=1900;i<=2099;i++ ) {
			y.push( i );	
		}	
		return y;
	},
	/**
	* The default calculation follows the ISO 8601 definition: the week starts on Monday, the first week of the year contains the first Thursday of the year. This means that some days from one year may be placed into weeks 'belonging' to another year.
	*/
	iso8601Week : function(date) {
		var time,
			checkDate = new Date(date.getTime());

		// Find Thursday of this week starting on Monday
		checkDate.setDate(checkDate.getDate() + 4 - (checkDate.getDay() || 7));

		time = checkDate.getTime();
		checkDate.setMonth(0); // Compare with Jan 1
		checkDate.setDate(1);
		return Math.floor(Math.round((time - checkDate) / 86400000) / 7) + 1;
	},
	dayOfYear : function(date,m){
		var e = this.strToDate( date,m );
		var s = this.clone( e );
		s.setMonth(0);
		s.setDate(1);
		return this.diff( s,e,'d' )+1;
	},
	weekOfYear : function(date){
		return this.iso8601Week( this.strToDate( date ) )
	},
	/**
	* 获取当前日期是该月的周数
	*/
	weekOfMonth : function(date){},
	/** 
     *在控制台输出日志 
     *@params message 要输出的日志信息 
     */   
    error: function(message){   
    }
});