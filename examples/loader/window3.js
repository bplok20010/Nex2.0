//Nex.setLoaderShims('Nex/window/jquery.nexWindow.js',['Nex/showat/jquery.nexShowAt.js','Nex/jquery.nexHtml.js']);
Nex.require([
	//'Nex/window/jquery.nexWindow.js',
	'Nex/jquery.nexHtml.js',
	'Nex/jquery.nexAjax.js'
],function(  ){
	var window3 = Nex.define('Nex.Window3','html');
	Nex.exports('Nex.Window3');
	window3.setOptions(function(opt,win){
		return {
			title : 'window3',
			closeable : true,
			width : 400,
			height : 400,
			html : '33333333333'	
		};
	});
});