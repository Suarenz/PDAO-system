<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();
$user = App\Models\User::where('id_number','admin')->first();
echo 'User found: ' . ($user ? 'YES' : 'NO') . PHP_EOL;
if($user) {
    echo 'Password hash: ' . $user->password . PHP_EOL;
    echo 'Hash length: ' . strlen($user->password) . PHP_EOL;
    echo 'Verify result: ' . (Illuminate\Support\Facades\Hash::check('admin', $user->password) ? 'MATCH' : 'NO_MATCH') . PHP_EOL;
}
