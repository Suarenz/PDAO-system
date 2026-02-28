<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Http\Controllers\Api\BackupController;
use Illuminate\Http\Request;
use App\Models\User;

$user = User::first();
$request = new Request(['notes' => 'Debugging Backup']);
$request->setUserResolver(fn() => $user);

// Force login for the request
auth()->login($user);

$controller = new BackupController();
$response = $controller->store($request);

echo $response->getContent();
