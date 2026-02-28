<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckRole
{
    /**
     * Handle an incoming request.
     * Check if user has one of the specified roles.
     * 
     * Usage: ->middleware('role:ADMIN,STAFF')
     */
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        if (!$request->user()) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
            ], 401);
        }

        if (empty($roles) || in_array($request->user()->role, $roles)) {
            return $next($request);
        }

        return response()->json([
            'success' => false,
            'message' => 'Access denied. Insufficient privileges.',
        ], 403);
    }
}
