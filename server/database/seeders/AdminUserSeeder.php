<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['id_number' => 'admin'],
            [
                'id_number' => 'admin',
                'first_name' => 'Admin',
                'last_name' => 'User',
                'password' => 'admin',
                'role' => 'ADMIN',
                'status' => 'ACTIVE',
            ]
        );
    }
}
