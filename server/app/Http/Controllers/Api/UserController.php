<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Get all users
     */
    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        // Filter by status
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        // Filter by role
        if ($request->has('role')) {
            $query->where('role', $request->role);
        }

        // Search
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                                $q->where('first_name', 'like', "%{$search}%")
                                    ->orWhere('last_name', 'like', "%{$search}%")
                                    ->orWhere('id_number', 'like', "%{$search}%");
            });
        }

        // Include trashed if requested
        if ($request->boolean('with_trashed')) {
            $query->withTrashed();
        }

        $users = $query->orderBy('created_at', 'desc')->paginate($request->per_page ?? 15);

        return response()->json([
            'success' => true,
            'data' => $users->items(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    /**
     * Get a single user
     */
    public function show(User $user): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'id' => $user->id,
                'id_number' => $user->id_number,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'middle_name' => $user->middle_name,
                'role' => $user->role,
                'unit' => $user->unit,
                'status' => $user->status,
                'created_at' => $user->created_at,
                'updated_at' => $user->updated_at,
            ],
        ]);
    }

    /**
     * Create a new user
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'id_number' => 'nullable|string|unique:users,id_number',
            'username' => 'nullable|string|unique:users,username',
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'password' => 'required|string|min:6',
            'role' => ['required', Rule::in(['ADMIN', 'STAFF', 'ENCODER', 'USER', 'PWD MEMBER', 'MAYOR'])],
            'unit' => 'nullable|string|max:255',
            'status' => ['nullable', Rule::in(['ACTIVE', 'INACTIVE'])],
        ]);

        $validated['status'] = $validated['status'] ?? 'ACTIVE';

        // Password hashing is handled by the model's 'hashed' cast
        $user = User::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'User created successfully',
            'data' => $user,
        ], 201);
    }

    /**
     * Update a user
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'id_number' => ['nullable', 'string', Rule::unique('users')->ignore($user->id)],
            'username' => ['nullable', 'string', Rule::unique('users')->ignore($user->id)],
            'first_name' => 'sometimes|required|string|max:255',
            'last_name' => 'sometimes|required|string|max:255',
            'middle_name' => 'nullable|string|max:255',
            'password' => 'nullable|string|min:6',
            'role' => ['sometimes', 'required', Rule::in(['ADMIN', 'STAFF', 'ENCODER', 'USER', 'PWD MEMBER', 'MAYOR'])],
            'unit' => 'nullable|string|max:255',
            'status' => ['sometimes', Rule::in(['ACTIVE', 'INACTIVE'])],
        ]);

        if (isset($validated['password'])) {
            // Password hashing is handled by the model's 'hashed' cast
        }

        $user->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'User updated successfully',
            'data' => $user->fresh(),
        ]);
    }

    /**
     * Delete a user (soft delete)
     */
    public function destroy(Request $request, User $user): JsonResponse
    {
        // Prevent self-deletion
        if ($user->id === $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'You cannot delete your own account',
            ], 403);
        }

        if ($request->boolean('force')) {
            $user->forceDelete();
            $message = 'User permanently deleted';
        } else {
            $user->delete();
            $message = 'User deleted successfully';
        }

        return response()->json([
            'success' => true,
            'message' => $message,
        ]);
    }

    /**
     * Restore a soft-deleted user
     */
    public function restore($id): JsonResponse
    {
        $user = User::withTrashed()->findOrFail($id);
        $user->restore();

        return response()->json([
            'success' => true,
            'message' => 'User restored successfully',
            'data' => $user,
        ]);
    }
}
