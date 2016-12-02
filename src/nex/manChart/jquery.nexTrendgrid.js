;(function($){
	"use strict";
	var trendgrid = Nex.extend('trendgrid','html');
	$.nexTrendgrid = trendgrid;
	trendgrid.extend({
		version : '1.0',
		_Tpl : {				
		}
	});
	trendgrid.setOptions(function(){
		return {
		    renderTo: '#base',
			infoData: [
			    ['新增用户（含重复安装）', 976, '日', '17.71%'],
			    ['新增用户（含重复安装）', 976, '日', '17.71%'],
			    ['新增用户（含重复安装）', 123, '日', '17.71%']
			],
			width: 800,
			height: 100,
			bgColor: [ 
				'#5D9CEC', '#62C87F', '#F15755', '#FC863F', '#7053B6', '#FFCE55', '#6ED5E6', '#F57BC1', '#DCB186', '#647C9D',
				'#058DC7', '#50B432', '#ED561B', '#DDDF00', '#24CBE5',
				'#64E572', '#FF9655', '#FFF263', '#6AF9C4',
				'#ff7f50', '#87cefa', '#da70d6', '#32cd32', '#6495ed', 
				'#ff69b4', '#ba55d3', '#cd5c5c', '#ffa500', '#40e0d0', 
				'#1e90ff', '#ff6347', '#7b68ee', '#00fa9a', '#ffd700', 
				'#6b8e23', '#ff00ff', '#3cb371', '#b8860b', '#30e0e0'
			],
			dataTpl : '{{0}}{{2}}<br>{{1}}<br>{{2}}{{3}}',
			items: function() {
			    return this.showDom();
			},
			'onCreate.1': function() {
			    this.showTD();
				this.changeColor();
			}
	    }
	});
	trendgrid.fn.extend({
	    showDom: function() {
		    return '<div class="nex-trendgrid">'
			    + '<table class="ui_trendgrid ui_trendgrid_4">'
					+ '<tbody>'
					+ '<tr></tr>'
					+ '</tbody>'
			    + '</table>'
			    + '</div>';
		},
		showTD: function() {
		    var cur = this,
				$targetCont = cur.getDom().find('.nex-trendgrid'),
				$targetTR = $targetCont.find('.ui_trendgrid tr'),
				dataTpl = cur.C('dataTpl'),
				infoData = cur.C('infoData'),
				html = '';
            for(var i=0; i<infoData.length; i++) {
			    var d = infoData[i];
				html += '<td>'
							+ '<div class="ui_trendgrid_item">'
							+ cur.parserTpl( dataTpl,d )
						    + '</div>'
						+ '</td>';
			}
			$targetTR.html(html);
			$targetTR.find('td:last').addClass('last');
		},
		parserTpl: function(dataTpl,d) {
			for(var j=0; j<d.length; j++) {
			    var reg = new RegExp('([{]{2}'+j+'[}]{2})+', 'ig');
				dataTpl = dataTpl.replace(reg, d[j]);
			}
			return dataTpl;
		},
		changeColor: function() {
		    var cur = this,	
                bgColor = cur.C('bgColor'),
				len = bgColor.length - 1,
				$targetItem = cur.getDom().find('.ui_trendgrid_item');
			$targetItem.each(function(index, info) {
				$(this).css('background', bgColor[index%len]);
			});
		}
	});
})(jQuery);