<?php

use App\Kernel;

require dirname(__DIR__).'/vendor/autoload.php';

$kernel = new Kernel('dev', true);
$request = Symfony\Component\HttpFoundation\Request::createFromGlobals();
$response = $kernel->handle($request);
$response->send();
$kernel->terminate($request, $response);
