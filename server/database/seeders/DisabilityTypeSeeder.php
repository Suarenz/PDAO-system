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
                'name' => 'Cancer',
                'code' => 'CAN',
                'description' => 'Disability due to cancer or its treatment effects',
            ],
            [
                'name' => 'Deaf or Hard of Hearing',
                'code' => 'DHH',
                'description' => 'Hearing impairment or deafness',
            ],
            [
                'name' => 'Intellectual',
                'code' => 'INT',
                'description' => 'Intellectual disability affecting cognitive functions',
            ],
            [
                'name' => 'Learning',
                'code' => 'LRN',
                'description' => 'Learning disabilities such as dyslexia, dyscalculia',
            ],
            [
                'name' => 'Mental',
                'code' => 'MEN',
                'description' => 'Mental health conditions affecting daily functioning',
            ],
            [
                'name' => 'Orthopedic',
                'code' => 'ORT',
                'description' => 'Bone, joint, or muscle disorders',
            ],
            [
                'name' => 'Physical',
                'code' => 'PHY',
                'description' => 'Physical disabilities affecting mobility or motor functions',
            ],
            [
                'name' => 'Psychosocial',
                'code' => 'PSY',
                'description' => 'Psychosocial disabilities affecting social interactions',
            ],
            [
                'name' => 'Rare Disease',
                'code' => 'RAR',
                'description' => 'Rare diseases causing disability',
            ],
            [
                'name' => 'Speech/Language',
                'code' => 'SPL',
                'description' => 'Speech or language impairments',
            ],
            [
                'name' => 'Visual',
                'code' => 'VIS',
                'description' => 'Visual impairment or blindness',
            ],
            [
                'name' => 'Chronic Illness',
                'code' => 'CHR',
                'description' => 'Chronic illnesses causing long-term disability',
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
