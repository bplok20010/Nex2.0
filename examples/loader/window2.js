Nex.setLoaderShims('Nex/window/jquery.nexWindow.js',['Nex/showat/jquery.nexShowAt.js','Nex/jquery.nexHtml.js']);
define([
	'a',
	'b',
	'c',
	'Nex/window/jquery.nexWindow.js',
	'load2'
],function(  ){
	console.log( arguments,'++' );
	var window2 = Nex.define('Nex.Window2','html');
	Nex.exports('Nex.Window2');
	window2.setOptions(function(opt,win){
		return {
			title : 'window2',
			closeable : true,
			width : 400,
			height : 400,
			html : 'ddddddddddd'	
		};
	});
});