<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AdminOnly
{
    /**
     * Handle an incoming request.
     * Only allow users with ADMIN role.
     */
    public function handle(Request $request, Closure $next): Response
    {
        \Log::info("AdminOnly middleware check for: " . $request->fullUrl());
        
        if (!$request->user()) {
            \Log::warning("AdminOnly: Unauthenticated");
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }

        if ($request->user()->role !== 'ADMIN') {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Admin privileges required.',
            ], 403);
        }

        return $next($request);
    }
}
