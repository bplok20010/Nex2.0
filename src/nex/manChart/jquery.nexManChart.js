;(function($){
	"use strict";
	var manChart = Nex.extend('manChart','html');
	$.nexManChart = manChart;
	manChart.extend({
		version : '1.0',
		_Tpl : {				
		}
	});
	manChart.setOptions(function(){
		return {
		    renderTo: '#base',
			infoData: [{'value': '33', 'text': '新用户'}, {'value': '70', 'text': '老用户'}],
			width: 500,
			height: 200,
			unewColor: '',
			uoldColor: '',
			items: function() {
			    return this.showDom();
			},
			'onCreate.1': function() {
			    this.showMan();
				this.changeColor();
			}
	    }
	});
	manChart.fn.extend({
	    showDom: function() {
		    return '<div class="nex-manchart">'
			    + '<div class="visitor_user">'
					//+ '<h4 class="chart_tit">新用户比例</h4>'
					+ '<div class="visitor_cont pos-rel">'
						+ '<div class="ul_unew"><span class="current"></span></div>'
						+ '<div class="ul_uold"></div>'
					+ '</div>'
					+ '<div class="legend">'
						+ '<p><i class="i_new"></i><span class="i_name">新用户</span></p>'
						+ '<p><i class="i_old"></i><span class="i_name">老用户</span></p>'
					+ '</div>'
			    + '</div>'
			    + '</div>';
		},
		showMan: function() {
		    var cur = this,		    
				percent = cur.getScale(),
				names = cur.getScaleName(),
				$targetCont = cur.getDom().find('.nex-manchart'),
				$unewUl = $targetCont.find('.ul_unew'),
				$scaleName = $targetCont.find('.legend .i_name');			
		
			$unewUl.css('width', percent);
			$unewUl.find('.current').text(percent);
			$scaleName.eq(0).text(names[0]);
			$scaleName.eq(1).text(names[1]);
			
		},
		getScaleName: function() {
		    var cur = this,	
                opt = cur.C(),		    
			    infoData = cur.C('infoData'),
				arr = [];
			$.each(infoData, function(index, info) {
			    arr.push(info['text']);
			});
			return arr;
		},
		getScale: function() {
		    var cur = this,	
                opt = cur.C(),		    
			    infoData = cur.C('infoData'),
				unewV = parseInt(infoData[0]['value']),
				uoldV = parseInt(infoData[1]['value']),
				percent = (unewV / (uoldV + unewV) * 100).toFixed(2);
				return (percent+'%');
		},
		changeColor: function() {
		    var cur = this,	
                opt = cur.C(),
				$targetI = cur.getDom().find('.nex-manchart').find('.legend').find('i');
			$targetI.eq(0).css('background', opt.unewColor);
			$targetI.eq(1).css('background', opt.uoldColor);
		}
	});
})(jQuery);