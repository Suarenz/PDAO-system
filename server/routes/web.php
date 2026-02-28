<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group.
|
*/

Route::get('/', function () {
    return response()->json([
        'name' => 'PDAO System API',
        'version' => '1.0.0',
        'status' => 'running',
    ]);
});

// SPA Catch-All: Serve index.html for any non-API route
// This ensures React Router handles client-side routing
Route::get('/{any}', function () {
    $indexPath = base_path('../index.html');
    if (file_exists($indexPath)) {
        return response()->file($indexPath);
    }
    return response()->json(['error' => 'Frontend not found'], 404);
})->where('any', '^(?!api).*$');
