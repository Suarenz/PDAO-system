<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class RegularUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['id_number' => 'user'],
            [
                'id_number' => 'user',
                'first_name' => 'Regular',
                'last_name' => 'User',
                'password' => 'user',
                'role' => 'USER',
                'status' => 'ACTIVE',
            ]
        );
    }
}
