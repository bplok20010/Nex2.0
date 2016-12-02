/*
*字符串处理处理工具
*Nex.util.String
*/
Nex.addUtil('String',{
	isFunction : function(obj){
		var toString = Object.prototype.toString;
		return toString.call(obj) == '[object Function]';	
	},
	isArray : function( iarr ){
		var nativeIsArray = Array.isArray;	
		var toString = Object.prototype.toString;
		return nativeIsArray ? nativeIsArray.call( Array,iarr ) : (toString.call(obj) == '[object Array]');
	},
	/*
	*字符串格式化
	*eg : Nex.util.String.format('{0} is {1}','apple','fruit')
	*/
	format : function(str){
		if (arguments.length === 0)
			return null;
		var str = arguments[0];
		for ( var i = 1; i < arguments.length; i++) {
			var re = new RegExp('\\{' + (i - 1) + '\\}', 'gm');
			str = str.replace(re, arguments[i]);
		}
		return str;	
	},
	/*
	*字符转整型
	*/
	toInt : function(str, defaultValue) {
		var result = parseInt(str, 10);
		return (isNaN(result)) ? defaultValue : result;
	},
	/*
	*字符转浮点
	*/
	toFloat : function(str, defaultValue) {
		var result = parseFloat(str);
		return (isNaN(result)) ? defaultValue : result;
	},
	HTMLEncode : function(text) {
		var converter = document.createElement("DIV");
		converter.innerText = text;
		converter.textContent = text;
		var output = converter.innerHTML;
		converter = null;
		output = output.replace(/"/g, "&quot;");
		output = output.replace(/'/g, "&apos;");
		return output;
	},
	HTMLDecode : function(html) {
		var converter = document.createElement("DIV");
		converter.innerHTML = html;
		var output = converter.innerText || converter.textContent;
		converter = null;
		return output;
	},
	"escape" : function( str ){
			
	},
	"unescape" : function( str ){
			
	},
	/*
	*自动填充 默认填充0
	*/
	pad : function(value, length, right, str_pad) {
		var undef;
		str_pad = str_pad === undef ? '0' : str_pad+'';
		var res = "" + value;
		for (; res.length < length; res = right ? res + str_pad : str_pad + res) {
		}
		return res;
	}
});