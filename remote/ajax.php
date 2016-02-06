<?php

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Method: *");

$response['status'] = 'OK';

echo json_encode($response);

?>