<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Update disability type names to match the official list and remove non-standard types.
     */
    public function up(): void
    {
        // Rename existing disability types to match the official list
        $renames = [
            'Cancer' => 'Cancer (RA 11215)',
            'Intellectual' => 'Intellectual Disability',
            'Learning' => 'Learning Disability',
            'Mental' => 'Mental Disability',
            'Physical' => 'Physical Disability',
            'Psychosocial' => 'Psychosocial Disability',
            'Rare Disease' => 'Rare Disease (RA 10747)',
            'Speech/Language' => 'Speech & Language Impairment',
            'Visual' => 'Visual Disability',
        ];

        foreach ($renames as $oldName => $newName) {
            DB::table('disability_types')
                ->where('name', $oldName)
                ->update(['name' => $newName]);
        }

        // Deactivate Orthopedic and Chronic Illness types (soft-remove, preserve data)
        // Any existing records referencing these will be reassigned to 'Other'
        $removedTypes = ['Orthopedic', 'Chronic Illness'];

        $otherType = DB::table('disability_types')->where('name', 'Other')->first();

        if ($otherType) {
            foreach ($removedTypes as $typeName) {
                $type = DB::table('disability_types')->where('name', $typeName)->first();
                if ($type) {
                    // Reassign any pwd_disabilities records to 'Other' and store old type in cause_details
                    DB::table('pwd_disabilities')
                        ->where('disability_type_id', $type->id)
                        ->update([
                            'disability_type_id' => $otherType->id,
                            'cause_details' => DB::raw("CASE WHEN cause_details IS NOT NULL AND cause_details != '' THEN CONCAT('{$typeName} - ', cause_details) ELSE '{$typeName}' END"),
                        ]);

                    // Deactivate the type
                    DB::table('disability_types')
                        ->where('id', $type->id)
                        ->update(['is_active' => false]);
                }
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Reverse renames
        $renames = [
            'Cancer (RA 11215)' => 'Cancer',
            'Intellectual Disability' => 'Intellectual',
            'Learning Disability' => 'Learning',
            'Mental Disability' => 'Mental',
            'Physical Disability' => 'Physical',
            'Psychosocial Disability' => 'Psychosocial',
            'Rare Disease (RA 10747)' => 'Rare Disease',
            'Speech & Language Impairment' => 'Speech/Language',
            'Visual Disability' => 'Visual',
        ];

        foreach ($renames as $oldName => $newName) {
            DB::table('disability_types')
                ->where('name', $oldName)
                ->update(['name' => $newName]);
        }

        // Re-activate removed types
        DB::table('disability_types')
            ->whereIn('name', ['Orthopedic', 'Chronic Illness'])
            ->update(['is_active' => true]);
    }
};
