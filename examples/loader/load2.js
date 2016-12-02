console.log(2)
Nex.requirePath('load3','load3.js?a.js')
define(['load3'],function(a){
		exports('complete load data3');
		console.log( 'complete load data3' )				   
})