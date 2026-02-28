<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            BarangaySeeder::class,
            DisabilityTypeSeeder::class,
            AdminUserSeeder::class,
            StaffUserSeeder::class,
            MayorUserSeeder::class,
            RegularUserSeeder::class,
        ]);
    }
}
