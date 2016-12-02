/*
*Cookie处理工具
*Nex.util.Cookies
*/
Nex.addUtil('Cookies',{
	get: function(key) {
		var arg = key + "=",
            alen = arg.length,
            clen = document.cookie.length,
            i = 0,
            j = 0;
            
        while(i < clen){
            j = i + alen;
            if(document.cookie.substring(i, j) == arg){
                return this.getCookieVal(j);
            }
            i = document.cookie.indexOf(" ", i) + 1;
            if(i === 0){
                break;
            }
        }
        return null;
	},
	/*
	*@param {String} key键
	*@param {String} value值
	*@param {Number} ttl有效时间(秒)
	*@param {String} path
	*@param {String} domain
	*@param {String} secure
	*/
	set: function(key, value, ttl, path, domain, secure) {
		cookie = [key+'='+    escape(value),
				  'path='+    ((!path   || path=='')  ? '/' : path),
				  'domain='+  ((!domain || domain=='')?  window.location.hostname : domain)];
		
		if (ttl)         cookie.push('expires='+this.hoursToExpireDate(ttl));
		if (secure)      cookie.push('secure');
		return document.cookie = cookie.join('; ');
	},
	unset: function(key, path, domain) {
		path   = (!path   || typeof path   != 'string') ? '' : path;
		domain = (!domain || typeof domain != 'string') ? '' : domain;
		if (this.get(key)) this.set(key, '', 'Thu, 01-Jan-70 00:00:01 GMT', path, domain);
	},
	/**
     * @private
     */
	hoursToExpireDate: function(ttl) {
		if (parseInt(ttl) == 'NaN' ) return '';
		else {
			now = new Date();
			now.setTime(now.getTime() + (parseInt(ttl) * 1000));
			return now.toGMTString();			
		}
	},
	/**
     * @private
     */
    getCookieVal : function(offset){
        var endstr = document.cookie.indexOf(";", offset);
        if(endstr == -1){
            endstr = document.cookie.length;
        }
        return unescape(document.cookie.substring(offset, endstr));
    }	
});