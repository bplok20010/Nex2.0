;(function($){
	"use strict";
	var checkfield = Nex.extend( 'buttoncheckfield','displayfield');
	$.nexCheckfield = checkfield;
	checkfield.extend({
		version : '1.0',
		_Tpl : {				
		}
	});
	//*var turnNum = 0;
	checkfield.setOptions(function(){
		return {
		    renderTo: '#base',
			cls : 'button-select-list',
			'onCreate.3': function(){
				var self = this;
				var opt = self.C();
				self._setBtns();
				self._setEvent();
				self._setValue();
				
			},
			checkOnly: false,   //*是否为单选
			popId: 'otherState',
			conHeight: 30,
			//*'更多'弹窗里的a
			childItems: [
				{text:'台湾',value:'tw'},
				{text:'澳门',value:'mo'},
				{text:'德国',value:'de'},
				{text:'英国',value:'gb'},
				{text:'新加坡',value:'sg'},
				{text:'法国',value:'fr'},
				{text:'加拿大',value:'ca'},
				{text:'意大利',value:'it'},
				{text:'澳大利亚',value:'au'}
			]
	    }
	});
	checkfield.fn.extend({
	    displayGetValue : function(){
			var self = this;
			var opt = self.configs;
			var input = $("#"+opt.id+"-input");
			if(opt.checkOnly) {
			    var value = $('.radio-btn-active',input).attr('value') || '';
				if(value == 'more') {
				    value = input.find('.radio-btn-active[value="more"]').attr('data-value');
				}
			} else {
				//*遍历默认已选值，添加样式
				var $link = input.find('.radio-btn-active').not('[value="more"]'),
					$dialog = $('#'+self.C('popId')),
					$link2 = input.find('.radio-btn-active[value="more"]'),
					moreV = $link2.attr('data-value'),
					value = '';
				//*遍历除了’更多‘里的已选值
				for(var i=0; i<$link.length; i++) {
					value += $link.eq(i).attr('value') + ',';
				}
				value = (value + moreV).replace(/\s+/ig, '');
			}
			return $.trim( self.rendererDecode(value) );
		},
		displaySetValue : function(){
			var self = this,undef;
			var opt = self.configs;
			var input = $("#"+opt.id+"-input");
			
			var value = arguments[0];
			
			if( $.isFunction( opt.formater ) ) {
				var _value = opt.formater.call( self,value );
				value = _value === undef ? value : _value;
			}			
			value = self.rendererEncode(value);		
			if(self.C('checkOnly')) {
			    $('a[value="'+value+'"]',input).addClass('radio-btn-active');
			} else {
			//*遍历默认已选值，添加样式
				var $link = input.find('a'),
					arrV = [],
					arrMore = [],
					arrvalue = $.trim(value).split(',');
				$link.removeClass('radio-btn-active');
				input.find('a[value="more"]').removeClass('radio-btn-active').attr('data-value', '');
				
				//*遍历除了’更多‘里的已选值
				for(var i=0; i<$link.length; i++) {
					arrV.push($link.eq(i).attr('value'));
					for(var j=0; j<arrvalue.length; j++) {
						if($.trim($link.eq(i).attr('value')) == $.trim(arrvalue[j])) {
							$link.eq(i).addClass('radio-btn-active');
						}
					}
				}
				//*堆栈属于’更多‘里的已选值
				for(var z=0; z<arrvalue.length; z++) {
					if($.inArray($.trim(arrvalue[z]), arrV) == '-1') {
						arrMore.push(arrvalue[z]);
					}
				}
				//*设置’更多‘的已选值
				if(arrMore.length > 0) {
					input.find('a[value="more"]').addClass('radio-btn-active').attr('data-value', arrMore);
				}
			}
						
			return self;
		},
		_setBtns : function(){
			var self = this;
			var opt = self.C();	
			var input = self.getInput();
			var items = opt.items;
			var html = ['<div class="multi-checkbox-buttons">'];
			$.each(items,function(i,d){
				html.push( '<a class="radio-btn" value="'+d.value+'" style="display: block;">'+d.text+'</a>' );	
			});
			html.push('</div><div style="clear:both;"></div>');
			input.html( html.join('') );
		},
		_setEvent : function(){
			var self = this;
			var opt = self.C();
			var dom = self.getInput();
			var btns = $('.radio-btn',dom);
			btns.bind( {
				click : function(){
					var $curLink = $(this),
						value = $curLink.attr('value');
                    //*turnNum = 0;
					if(value == 'more') {  //*更多
					    var selValue = $.trim($curLink.attr('data-value')).split(','), 
						    curV = [], vStr = '';
						if(opt.checkOnly) {
						    btns.removeClass('radio-btn-active');
						}
						
						$curLink.addClass('radio-btn-active');
						Nex.Create('window', {  //*创建弹窗
							id: opt.popId,
							cls: 'more-dialog',
							hideHeader : true,
							width : 300,
							height : 'auto',
							minHeight: 0,
							//closeToRremove : false,
							padding: 0,
							onCreate : function(){
								var win = this;
								var $dialog = $('#' + win.C('id')),
								    $link = $dialog.find('a').not('.ensure-btn');
								//*记录初始已选值
								if(selValue != '' ) {
									for(var i=0; i<selValue.length; i++) {
										curV.push(selValue[i]);
										for(var j=0; j<$link.length; j++) {
											if($.trim($link.eq(j).attr('value')) == $.trim(selValue[i])) {
												$link.eq(j).addClass('radio-btn-active');
											}
										}
									}
								}
								setTimeout(function(){
									$(document).one('click',function(e){
										win.hide();
										var e = e || window.event,
											target = e.srcElement || e.target;
										if($.trim($curLink.attr('data-value')) == '' && $(target).attr('value') != 'more') {
											$curLink.removeClass('radio-btn-active');
										}
									});
									self.childClick($curLink, curV, vStr);
								},0);	
								self.autoSearch();
							},
							onClick: function() {
								return false;
							},
							showAt: {
								at : self.getDom().find('.radio-btn:last'),
								yAlign : 'bottom',
								xAlign : 'left'
							},
							items: self._childDom()
						});
					} else {
						if(opt.checkOnly) {
							if( $(this).hasClass('radio-btn-active') ) return;
							btns.removeClass('radio-btn-active');
							$(this).addClass('radio-btn-active');
							btns.parent().find('.radio-btn[value="more"]').text('更多▼').attr('data-value', '');
							self.fireEvent('onBtnClick',[ value,opt ]);
						} else {
							if( $(this).hasClass('radio-btn-active') ) {
								$(this).removeClass('radio-btn-active');
							} else {
								$(this).addClass('radio-btn-active');
								//self.fireEvent('onBtnClick',[ curV,opt ]);
							}
						}
					}
				}
			} );
		},
		//*弹窗里的a的点击事件
		childClick: function($curLink, curV, vStr) {
		    var self = this,
				$dialog = $('#' + self.C('popId'));
			$dialog.undelegate('a', 'click').delegate('a', 'click', function() {
				var $curA = $(this);
				if(self.C('checkOnly')) {
					$dialog.find('a').removeClass('radio-btn-active');
					$curA.addClass('radio-btn-active');
					$('#'+ self.C('id') + ' .multi-checkbox-buttons .radio-btn:last').text($(this).text()+'▼');
					var vStr = $curA.attr('value');
					$curLink.attr('data-value', vStr);  //*防止点击其它组件时，获取此值失败，防止传空。
					self.fireEvent('onBtnClick',[ vStr, self.C() ]);
					$dialog.hide();
				} else {
					if($curA.parent().hasClass('search-con')) {  //*内容框的A
						if( $curA .hasClass('radio-btn-active') ) {
							$curA.removeClass('radio-btn-active');
							$.grep(curV, function(v, k) {
								if($.trim(v) == $.trim($curA.attr('value'))) {
									curV.splice(k, 1);
								}
							});
						} else {
							$curA.addClass('radio-btn-active');
							curV.push($curA.attr('value'));
						}
					} else if($curA.parent().hasClass('j-pager')) {//*分页里的A
						self.pageFun($curA);
					} else if($curA.hasClass('ensure-btn')) {  //*确定按钮
					
						if(curV.length == 0) {
							vStr = '';
							$curLink.removeClass('radio-btn-active');
						} else {
							vStr = curV.join(',');
							$curLink.addClass('radio-btn-active');
						}
						$curLink.attr('data-value', vStr);  //*防止点击其它组件时，获取此值失败，防止传空。
						//self.fireEvent('onBtnClick',[ curV,opt ]);
						$dialog.hide();
					}
				}
			});
		},
		//*分页功能
		pageFun: function($dom) {
		    var opt = this.C(),
			    $dialog = $('#'+opt.popId),
			    bdHeight = $dialog.find('.search-con-bd').height(),
			    $searchCon = $dialog.find('.search-con'),
				num = Math.ceil($searchCon.height() / bdHeight);
			
			if($dom.hasClass('prev')) {  //*上一页
				if(turnNum > 0)  {
				    turnNum -= 1;
				    var aa = turnNum * bdHeight;
			        $searchCon.css('marginTop', '-'+aa+'px'); 
				}
			} 
			
			if($dom.hasClass('next')) {  //*下一页
			
				if(turnNum < num - 1)  {
				    turnNum += 1;
				    var aa = turnNum * bdHeight;
			        $searchCon.css('marginTop', '-'+aa+'px');
				}
			
			}
		},
		//*弹窗里的内容显示
		_childDom: function() {
			var self = this,
			    items = this.C('childItems'),
			    str = '';  
			$.each(items, function(index, info) {
				str += '<a href="javascript:void(0)" value="'+info['value']+'">'+info['text']+'</a>'
			});
			str = '<input type="text" class="search-input" placeholder="请输入" /><br/>'
			    + '<div class="search-con-bd"><div class="search-con">' + str + '</div></div>' ;
			if(!self.C('checkOnly')) {
				str = str + '<div class="j-pager" style="display:none;"><a href="javascript:void(0);" class="prev">上一页</a><a href="javascript:void(0);" class="next">下一页</a></div>'
					+ '<br/><a href="javascript:void(0)" class="ensure-btn">确定</a>';
			}
			return str;
		},
		//*弹窗里的输入框的模糊匹配
		autoSearch: function() {
		    var opt = this.C(),
			    $dialog = $('#' + opt.popId),
				$link = $dialog.find('a').not('.ensure-btn'),
				$searchInput = $dialog.find('.search-input'),
				arrText = [];
			$link.each(function() {
			    arrText.push($(this).text());
			});
			var t;
			$searchInput.on('keyup', function() {
			    clearTimeout(t);
			    var $this = $(this);
				t = setTimeout(function() {
				    $link.show();
					$.each(arrText, function(v, k) {
					    if( k.indexOf( $this.val() ) == -1 ) {
						    $link.eq(v).hide();//找到了的
						}
					})
				}, 200);
			});
			$searchInput.on({
			    'focus': function() {
					$(this).addClass('search-input-focus');
				},
				'blur': function() {
					$(this).removeClass('search-input-focus');
				}
			});
		}
	});
})(jQuery);