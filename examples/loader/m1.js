//模块m2
Define( 'm1',['m2','m3'],function( m2,m3 ){
	console.log( m2,m3 );
	Exports('m1');
	//打包用
	//Define('m1','m1');	
} );