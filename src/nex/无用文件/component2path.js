/***************************************************
*******************定义组件加载路径*******************
****************************************************
****************************************************/
;(function($){
	"use strict";
	var aliasNameMaps = {
		'Nex.Html' : 'Nex.Html',
		'Nex.Ajax' : 'Nex.Ajax',
		'Nex.Panel' : 'Nex.panel.Panel',
		'Nex.Window' : 'Nex.window.Window',
		'Nex.Layout' : 'Nex.layout.Layout',
		'Nex.TableLayout' : 'Nex.layout.TableLayout',
		'Nex.Tree' : 'Nex.tree.Tree'
	};   		
	Nex.setClassPath( aliasNameMaps );   
})(jQuery);