;(function($){
	"use strict";
	var ageChart = Nex.extend('ageChart','html');
	$.nexAgeChart = ageChart;
	ageChart.extend({
		version : '1.0',
		_Tpl : {				
		}
	});
	ageChart.setOptions(function(){
		return {
		    renderTo: '#base',
			infoData: [
				{'value': '12', 'text': '0-17岁'}, 
				{'value': '83', 'text': '18-24岁'}, 
				{'value': '93', 'text': '25-29岁'}, 
				{'value': '53', 'text': '30-34岁'}, 
				{'value': '43', 'text': '35-39岁'}, 
				{'value': '30', 'text': '40岁以上'}
			],
			width: 500,
			height: 300,
			iColor: '',
			items: function() {
			    return this.showDom();
			},
			'onCreate.1': function() {
			    this.showMan();
				this.changeColor();
			}
	    }
	});
	ageChart.fn.extend({
	    showDom: function() {
		    return '<div class="nex-agechart">'
			    + '<div class="visitor_age">'
					//+ '<h4 class="chart_tit">年龄分布</h4>'
					+ '<div class="visitor_pillar cf">'
						+ '<ul></ul>'
					+ '</div>'
			    + '</div>'
			    + '</div>';
		},
		showMan: function() {
		    var cur = this,		    
				percent = cur.getScale(),
				names = cur.getScaleName(),
				$targetCont = cur.getDom().find('.nex-agechart'),
				$targetUl = $targetCont.find('.visitor_pillar ul'),
				strLi = '';			
		    for(var i=0; i<percent.length; i++) {
			    strLi += '<li><a href="javascript:void(0);"><span class="vline"><em>'+percent[i]+'%</em><br /><i class="i_pillar"></i></span><span><i class="i_v'+i+'0"></i><br />'+names[i]+'</span></a></li>';
				
			}
			$targetUl.html(strLi);
			
			var $ageH = $targetCont.find('.i_pillar');
			for(var i=0; i<percent.length; i++) {
				$ageH.eq(i).height($ageH.eq(i).height()*(percent[i]/100));
			}			
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
				arr = [], total = 0;
			$.each(infoData, function(index, info) {
				total += parseInt(info['value']);
			});
			$.each(infoData, function(index, info) {
			    var value = (parseInt(info['value']) / total * 100).toFixed(2);
				arr.push(value);
			});
			
			return arr;
		},
		changeColor: function() {
		    var cur = this,	
                opt = cur.C(),
				$targetI = cur.getDom().find('.nex-agechart').find('.i_pillar');
			$targetI.css('background', opt.iColor);
		}
	});
})(jQuery);