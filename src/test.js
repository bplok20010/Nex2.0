function getCurrentScript(base) {
	// 参考 https://github.com/samyk/jiagra/blob/master/jiagra.js
	var stack
	try {
		a.b.c() //强制报错,以便捕获e.stack
	} catch (e) { //safari的错误对象只有line,sourceId,sourceURL
		stack = e.stack
		if (!stack && window.opera) {
			//opera 9没有e.stack,但有e.Backtrace,但不能直接取得,需要对e对象转字符串进行抽取
			stack = (String(e).match(/of linked script \S+/g) || []).join(" ")
		}
	}
	if (stack) {
		/**e.stack最后一行在所有支持的浏览器大致如下:
		 *chrome23:
		 * at http://113.93.50.63/data.js:4:1
		 *firefox17:
		 *@http://113.93.50.63/query.js:4
		 *opera12:http://www.oldapps.com/opera.php?system=Windows_XP
		 *@http://113.93.50.63/data.js:4
		 *IE10:
		 *  at Global code (http://113.93.50.63/data.js:4:1)
		 *  //firefox4+ 可以用document.currentScript
		 */
		stack = stack.split(/[@ ]/g).pop() //取得最后一行,最后一个空格或@之后的部分
		stack = stack[0] === "(" ? stack.slice(1, -1) : stack.replace(/\s/, "") //去掉换行符
		return stack.replace(/(:\d+)?:\d+$/i, "") //去掉行号与或许存在的出错字符起始位置
	}
	var nodes = document.getElementsByTagName("script") //只在head标签中寻找
	for (var i = nodes.length, node; node = nodes[--i]; ) {
		if (node.readyState === "interactive") {
			return node.className = node.src
		}
	}
}
alert(getCurrentScript());