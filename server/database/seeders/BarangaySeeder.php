<?php

namespace Database\Seeders;

use App\Models\Barangay;
use Illuminate\Database\Seeder;

class BarangaySeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Barangays of Pagsanjan, Laguna from constants.ts
     */
    public function run(): void
    {
        $barangays = [
            ['name' => 'Anibong', 'code' => 'ANI'],
            ['name' => 'Poblacion I', 'code' => 'B01'],
            ['name' => 'Poblacion II', 'code' => 'B02'],
            ['name' => 'Barangay III', 'code' => 'B03'],
            ['name' => 'Biñan', 'code' => 'BIN'],
            ['name' => 'Buboy', 'code' => 'BUB'],
            ['name' => 'Cabanbanan', 'code' => 'CAB'],
            ['name' => 'Calusiche', 'code' => 'CAL'],
            ['name' => 'Dingin', 'code' => 'DIN'],
            ['name' => 'Lambac', 'code' => 'LAM'],
            ['name' => 'Layugan', 'code' => 'LAY'],
            ['name' => 'Magdapio', 'code' => 'MAG'],
            ['name' => 'Maulawin', 'code' => 'MAU'],
            ['name' => 'Pinagsanjan', 'code' => 'PIN'],
            ['name' => 'Sabang', 'code' => 'SAB'],
            ['name' => 'Sampaloc', 'code' => 'SAM'],
            ['name' => 'San Isidro', 'code' => 'SIS'],
        ];

        foreach ($barangays as $barangay) {
            Barangay::updateOrCreate(
                ['name' => $barangay['name']],
                ['code' => $barangay['code'], 'is_active' => true]
            );
        }

        $this->command->info('Seeded ' . count($barangays) . ' barangays.');
    }
}
