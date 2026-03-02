<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class MayorUserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['id_number' => 'mayor'],
            [
                'id_number' => 'mayor',
                'first_name' => 'Mayor',
                'last_name' => 'User',
                'password' => 'mayor',
                'role' => 'MAYOR',
                'unit' => 'PDAO Central',
                'status' => 'ACTIVE',
            ]
        );
    }
}
