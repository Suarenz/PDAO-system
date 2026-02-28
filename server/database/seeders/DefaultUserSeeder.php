<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DefaultUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Create default admin user
     */
    public function run(): void
    {
        // Create default admin user
        User::updateOrCreate(
            ['email' => 'admin@pdao.gov.ph'],
            [
                'first_name' => 'System',
                'last_name' => 'Administrator',
                'password' => 'admin',
                'role' => 'ADMIN',
                'unit' => 'PDAO Office',
                'status' => 'ACTIVE',
            ]
        );

        $this->command->info('Created default admin user (admin@pdao.gov.ph / admin)');

        // Create a sample staff user
        User::updateOrCreate(
            ['email' => 'staff@pdao.gov.ph'],
            [
                'first_name' => 'Staff',
                'last_name' => 'User',
                'password' => 'staff',
                'role' => 'STAFF',
                'unit' => 'PDAO Office',
                'status' => 'ACTIVE',
            ]
        );

        $this->command->info('Created default staff user (staff@pdao.gov.ph / staff)');

        // Create a sample encoder user
        User::updateOrCreate(
            ['email' => 'encoder@pdao.gov.ph'],
            [
                'first_name' => 'Encoder',
                'last_name' => 'User',
                'password' => 'encoder',
                'role' => 'ENCODER',
                'unit' => 'PDAO Office',
                'status' => 'ACTIVE',
            ]
        );

        $this->command->info('Created default encoder user (encoder@pdao.gov.ph / encoder)');

        // Create an online application user
        User::updateOrCreate(
            ['email' => 'online'],
            [
                'first_name' => 'Online',
                'last_name' => 'Application',
                'password' => 'user',
                'role' => 'USER',
                'unit' => 'Online Portal',
                'status' => 'ACTIVE',
            ]
        );

        $this->command->info('Created online application user (online / user)');
    }
}
