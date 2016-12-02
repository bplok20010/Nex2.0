;(function($){
	"use strict";
	var eduChart = Nex.extend('eduChart','html');
	$.nexAgeChart = eduChart;
	eduChart.extend({
		version : '1.0',
		_Tpl : {				
		}
	});
	eduChart.setOptions(function(){
		return {
		    renderTo: '#base',
			infoData: [
				{'value': '12', 'text': '未知'}, 
				{'value': '83', 'text': '初中'}, 
				{'value': '93', 'text': '高中'}, 
				{'value': '53', 'text': '本科'}, 
				{'value': '43', 'text': '硕士'}, 
				{'value': '30', 'text': '博士'}
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
	eduChart.fn.extend({
	    showDom: function() {
		    return '<div class="nex-educhart">'
			    + '<div class="visitor_education cf">'
					//+ '<h4 class="chart_tit">学历分布</h4>'
					+ '<div class="visitor_streak cf">'
						+ '<ul></ul>'
					+ '</div>'
					+ '<div class="legend"></div>'
			    + '</div>'
			    + '</div>';
		},
		showMan: function() {
		    var cur = this,		    
				percent = cur.getScale(),
				names = cur.getScaleName(),
				$targetCont = cur.getDom().find('.nex-educhart'),
				$targetUl = $targetCont.find('.visitor_streak ul'),
				$targetLeg = $targetCont.find('.legend'),
				strLi = '', strP = '';			
		    for(var i=0; i<percent.length; i++) {
			    strLi += '<li><a href="javascript:void(0);"><em>'+percent[i]+'%</em><br><i class="i_education'+i+'"></i></a></li>';
				strP += '<p><i class="i_education'+i+'"></i>'+names[i]+'</p>'
			}
			$targetUl.html(strLi);
			$targetLeg.html(strP);
			console.log();
			var $ageW = $targetUl.find('li i');
			for(var i=0; i<percent.length; i++) {
				$ageW.eq(i).width($targetUl.width()*(percent[i]/100));
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
				$targetI = cur.getDom().find('.nex-educhart').find('.i_pillar');
			$targetI.css('background', opt.iColor);
		}
	});
})(jQuery);