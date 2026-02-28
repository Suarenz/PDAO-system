<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class StaffUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['id_number' => 'staff'],
            [
                'id_number' => 'staff',
                'first_name' => 'Staff',
                'last_name' => 'User',
                'password' => 'staff',
                'role' => 'STAFF',
                'status' => 'ACTIVE',
            ]
        );
    }
}
