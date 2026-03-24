<?php

namespace Database\Seeders;

use App\Models\DisabilityType;
use Illuminate\Database\Seeder;

class DisabilityTypeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Disability types from constants.ts
     */
    public function run(): void
    {
        $disabilityTypes = [
            [
                'name' => 'Cancer (RA 11215)',
                'code' => 'CAN',
                'description' => 'Disability due to cancer or its treatment effects (Republic Act 11215)',
            ],
            [
                'name' => 'Deaf or Hard of Hearing',
                'code' => 'DHH',
                'description' => 'Hearing impairment or deafness',
            ],
            [
                'name' => 'Intellectual Disability',
                'code' => 'INT',
                'description' => 'Intellectual disability affecting cognitive functions',
            ],
            [
                'name' => 'Learning Disability',
                'code' => 'LRN',
                'description' => 'Learning disabilities such as dyslexia, dyscalculia',
            ],
            [
                'name' => 'Mental Disability',
                'code' => 'MEN',
                'description' => 'Mental health conditions affecting daily functioning',
            ],
            [
                'name' => 'Physical Disability',
                'code' => 'PHY',
                'description' => 'Physical disabilities affecting mobility or motor functions',
            ],
            [
                'name' => 'Psychosocial Disability',
                'code' => 'PSY',
                'description' => 'Psychosocial disabilities affecting social interactions',
            ],
            [
                'name' => 'Rare Disease (RA 10747)',
                'code' => 'RAR',
                'description' => 'Rare diseases causing disability (Republic Act 10747)',
            ],
            [
                'name' => 'Speech & Language Impairment',
                'code' => 'SPL',
                'description' => 'Speech or language impairments',
            ],
            [
                'name' => 'Visual Disability',
                'code' => 'VIS',
                'description' => 'Visual impairment or blindness',
            ],
            [
                'name' => 'Other',
                'code' => 'OTH',
                'description' => 'Other types of disability not listed above (user-specified)',
            ],
        ];

        foreach ($disabilityTypes as $type) {
            DisabilityType::updateOrCreate(
                ['name' => $type['name']],
                [
                    'code' => $type['code'],
                    'description' => $type['description'],
                    'is_active' => true,
                ]
            );
        }

        $this->command->info('Seeded ' . count($disabilityTypes) . ' disability types.');
    }
}
