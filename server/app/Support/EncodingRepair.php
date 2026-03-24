<?php

namespace App\Support;

class EncodingRepair
{
    /**
     * Repair the mojibake patterns seen in legacy names with ñ and common accented vowels.
     */
    public static function repairName(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return $value;
        }

        $result = $value;

        foreach ([
            [
                'Ãƒâ€˜' => 'Ñ',
                'ÃƒÂ±' => 'ñ',
                'ÃƒÂ¡' => 'á',
                'ÃƒÂ©' => 'é',
                'ÃƒÂ­' => 'í',
                'ÃƒÂ³' => 'ó',
                'ÃƒÂº' => 'ú',
                'ÃƒÅ“' => 'Ü',
                'ÃƒÂ¼' => 'ü',
            ],
            [
                'Ã‘' => 'Ñ',
                'Ã±' => 'ñ',
                'Ã¡' => 'á',
                'Ã©' => 'é',
                'Ã­' => 'í',
                'Ã³' => 'ó',
                'Ãº' => 'ú',
                'Ãœ' => 'Ü',
                'Ã¼' => 'ü',
            ],
        ] as $map) {
            $result = strtr($result, $map);
        }

        return $result;
    }

    public static function needsRepair(?string $value): bool
    {
        if ($value === null || $value === '') {
            return false;
        }

        return str_contains($value, '?')
            || str_contains($value, 'Ã')
            || str_contains($value, 'Â');
    }
}