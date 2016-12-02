<?php
header("Cache-Control: public");
header("Pragma: cache");
$offset = 30*60*60*24; // cache 1 month
$ExpStr = "Expires: ".gmdate("D, d M Y H:i:s", time() + $offset)." GMT";
header($ExpStr);
sleep(2);
?>
Exports('php-4')
console.log( 'php-4' )				