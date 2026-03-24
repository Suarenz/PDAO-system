<?php

namespace App\Console\Commands;

use App\Models\PwdProfile;
use App\Support\EncodingRepair;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class RepairNamesFromDump extends Command
{
    protected $signature = 'repair:names-from-dump
                            {path? : SQL dump path to use as the source of truth}
                            {--dry-run : Show planned repairs without writing changes}';

    protected $description = 'Repair corrupted PWD and family names (ñ/Ñ and accented characters) using values recovered from an SQL dump';

    // -----------------------------------------------------------------------
    // Legacy pwd_table column indices (0-based)
    // -----------------------------------------------------------------------
    private const LEGACY_COL_PWD_NUMBER          = 1;
    private const LEGACY_COL_LASTNAME            = 2;
    private const LEGACY_COL_FIRSTNAME           = 3;
    private const LEGACY_COL_MIDDLENAME          = 4;
    private const LEGACY_COL_SUFFIX              = 5;
    private const LEGACY_COL_FATHER_LASTNAME     = 35;
    private const LEGACY_COL_FATHER_FIRSTNAME    = 36;
    private const LEGACY_COL_FATHER_MIDDLENAME   = 37;
    private const LEGACY_COL_MOTHER_LASTNAME     = 38;
    private const LEGACY_COL_MOTHER_FIRSTNAME    = 39;
    private const LEGACY_COL_MOTHER_MIDDLENAME   = 40;
    private const LEGACY_COL_GUARDIAN_LASTNAME   = 41;
    private const LEGACY_COL_GUARDIAN_FIRSTNAME  = 42;
    private const LEGACY_COL_GUARDIAN_MIDDLENAME = 43;
    // Only parse up to this column; the remaining columns (including the blob) are skipped.
    private const LEGACY_MAX_COL = 43;

    public function handle(): int
    {
        $path = $this->argument('path') ?: $this->findLatestDumpPath();

        if (!$path || !is_file($path)) {
            $this->error('No SQL dump file was found. Pass the path as argument or ensure a backup exists in storage/app/backups/.');
            return self::FAILURE;
        }

        $this->info('Using dump: ' . $path);

        [$profilesByPwd, $familyByPwdAndRelation] = $this->loadDumpMaps($path);

        $this->info(sprintf('Loaded %d profile records and %d family records from dump.', count($profilesByPwd), count($familyByPwdAndRelation)));

        $profileFixes = $this->repairProfiles($profilesByPwd, (bool) $this->option('dry-run'));
        $familyFixes  = $this->repairFamily($familyByPwdAndRelation, (bool) $this->option('dry-run'));

        $this->newLine();
        $this->table(
            ['Entity', 'Updated'],
            [
                ['pwd_profiles', $profileFixes],
                ['pwd_family',   $familyFixes],
            ]
        );

        return self::SUCCESS;
    }

    private function repairProfiles(array $profilesByPwd, bool $dryRun): int
    {
        $updated = 0;

        // Only look at profiles that have suspected encoding corruption
        $profiles = PwdProfile::query()->where(function ($query) {
            $query->where('first_name',  'like', '%?%')
                ->orWhere('middle_name', 'like', '%?%')
                ->orWhere('last_name',   'like', '%?%')
                ->orWhere('suffix',      'like', '%?%')
                ->orWhere('first_name',  'like', '%Ã%')
                ->orWhere('middle_name', 'like', '%Ã%')
                ->orWhere('last_name',   'like', '%Ã%')
                ->orWhere('suffix',      'like', '%Ã%')
                ->orWhere('first_name',  'like', '%Â%')
                ->orWhere('middle_name', 'like', '%Â%')
                ->orWhere('last_name',   'like', '%Â%')
                ->orWhere('suffix',      'like', '%Â%');
        })->get();

        foreach ($profiles as $profile) {
            $source = isset($profilesByPwd[$profile->pwd_number])
                ? $profilesByPwd[$profile->pwd_number]
                : null;

            if (!$source) {
                continue;
            }

            $changes = $this->buildFieldChanges($profile->only(['first_name', 'middle_name', 'last_name', 'suffix']), $source);
            if ($changes === []) {
                continue;
            }

            if ($dryRun) {
                $this->line(sprintf('pwd_profiles #%d (%s) %s', $profile->id, $profile->pwd_number, json_encode($changes, JSON_UNESCAPED_UNICODE)));
            } else {
                $profile->fill($changes)->save();
            }

            $updated++;
        }

        return $updated;
    }

    private function repairFamily(array $familyByPwdAndRelation, bool $dryRun): int
    {
        $updated = 0;

        $rows = DB::table('pwd_family')->where(function ($query) {
            $query->where('first_name',  'like', '%?%')
                ->orWhere('middle_name', 'like', '%?%')
                ->orWhere('last_name',   'like', '%?%')
                ->orWhere('first_name',  'like', '%Ã%')
                ->orWhere('middle_name', 'like', '%Ã%')
                ->orWhere('last_name',   'like', '%Ã%')
                ->orWhere('first_name',  'like', '%Â%')
                ->orWhere('middle_name', 'like', '%Â%')
                ->orWhere('last_name',   'like', '%Â%');
        })->get();

        // Build a map from profile_id → pwd_number so we can look up the dump source
        $profilePwdNumbers = DB::table('pwd_profiles')
            ->whereIn('id', $rows->pluck('pwd_profile_id')->unique())
            ->pluck('pwd_number', 'id');

        foreach ($rows as $row) {
            $pwdNumber = $profilePwdNumbers[$row->pwd_profile_id] ?? null;
            if (!$pwdNumber) {
                continue;
            }

            $key    = $pwdNumber . '|' . $row->relation_type;
            $source = $familyByPwdAndRelation[$key] ?? null;

            if (!$source) {
                continue;
            }

            $changes = $this->buildFieldChanges([
                'first_name'  => $row->first_name,
                'middle_name' => $row->middle_name,
                'last_name'   => $row->last_name,
            ], $source);

            if ($changes === []) {
                continue;
            }

            if ($dryRun) {
                $this->line(sprintf('pwd_family #%d (%s %s) %s', $row->id, $pwdNumber, $row->relation_type, json_encode($changes, JSON_UNESCAPED_UNICODE)));
            } else {
                DB::table('pwd_family')->where('id', $row->id)->update($changes);
            }

            $updated++;
        }

        return $updated;
    }

    private function buildFieldChanges(array $current, array $source): array
    {
        $changes = [];

        foreach (['first_name', 'middle_name', 'last_name', 'suffix'] as $field) {
            if (!array_key_exists($field, $current) || !array_key_exists($field, $source)) {
                continue;
            }

            $currentValue = $current[$field];
            $sourceValue = $source[$field];

            if ($sourceValue === null || $sourceValue === '' || EncodingRepair::needsRepair($sourceValue)) {
                continue;
            }

            if ($currentValue !== $sourceValue && EncodingRepair::needsRepair($currentValue)) {
                $changes[$field] = $sourceValue;
            }
        }

        return $changes;
    }

    /**
     * Load name maps from a SQL dump.
     * Supports two dump formats:
     *   - Legacy (pdao_db.sql): contains INSERT INTO `pwd_table` with flat columns
     *   - Backup (storage/app/backups/*.sql): contains INSERT INTO `pwd_profiles` and `pwd_family`
     *
     * Returns [$profilesByPwdNumber, $familyByPwdNumberAndRelationType]
     */
    private function loadDumpMaps(string $path): array
    {
        $profilesByPwd          = [];
        $familyByPwdAndRelation = [];

        $handle = fopen($path, 'rb');
        if ($handle === false) {
            throw new \RuntimeException('Unable to open dump file: ' . $path);
        }

        $inLegacyInsert  = false;  // inside INSERT INTO `pwd_table`
        $inProfileInsert = false;  // inside INSERT INTO `pwd_profiles`
        $inFamilyInsert  = false;  // inside INSERT INTO `pwd_family`

        $this->info('Scanning dump file (this may take a moment for large files)…');

        while (($line = fgets($handle)) !== false) {
            $trimmed  = ltrim($line);
            $stripped = ltrim($trimmed); // first non-space char

            // --------------------------------------------------------------
            // Detect whether this line ends the current INSERT block.
            // We compute this BEFORE parsing so we can still parse the
            // final row that ends with ");" on the same line.
            // --------------------------------------------------------------
            $lineEndsInsert = str_contains($line, ';');

            // --------------------------------------------------------------
            // Detect the start of a relevant INSERT block (only when idle)
            // --------------------------------------------------------------
            if (!$inLegacyInsert && !$inProfileInsert && !$inFamilyInsert) {
                if (str_contains($trimmed, 'INSERT INTO `pwd_table`')) {
                    $inLegacyInsert = true;
                } elseif (str_contains($trimmed, 'INSERT INTO `pwd_profiles`')) {
                    $inProfileInsert = true;
                } elseif (str_contains($trimmed, 'INSERT INTO `pwd_family`')) {
                    $inFamilyInsert = true;
                } else {
                    continue; // skip irrelevant lines fast
                }
            }

            // --------------------------------------------------------------
            // Parse row data — only on lines that start with '(' (data rows)
            // or on INSERT lines that also contain the data (single-line format)
            // --------------------------------------------------------------
            $lineHasData = str_starts_with($stripped, '(');

            // Handle single-line: INSERT INTO ... VALUES (data...);
            if (!$lineHasData && str_contains($trimmed, 'VALUES') && str_contains($trimmed, '(')) {
                $lineHasData = true;
            }

            if ($lineHasData) {
                if ($inLegacyInsert) {
                    foreach ($this->parseRowsFromLine($line, self::LEGACY_MAX_COL) as $fields) {
                        $pwdNumber = $fields[self::LEGACY_COL_PWD_NUMBER] ?? null;
                        if (!$pwdNumber) continue;

                        // Main profile names
                        $profilesByPwd[$pwdNumber] = [
                            'last_name'   => EncodingRepair::repairName($fields[self::LEGACY_COL_LASTNAME]   ?? null),
                            'first_name'  => EncodingRepair::repairName($fields[self::LEGACY_COL_FIRSTNAME]  ?? null),
                            'middle_name' => EncodingRepair::repairName($fields[self::LEGACY_COL_MIDDLENAME] ?? null),
                            'suffix'      => EncodingRepair::repairName($fields[self::LEGACY_COL_SUFFIX]     ?? null),
                        ];

                        // Family names
                        foreach ([
                            'Father'   => [self::LEGACY_COL_FATHER_LASTNAME,   self::LEGACY_COL_FATHER_FIRSTNAME,   self::LEGACY_COL_FATHER_MIDDLENAME],
                            'Mother'   => [self::LEGACY_COL_MOTHER_LASTNAME,   self::LEGACY_COL_MOTHER_FIRSTNAME,   self::LEGACY_COL_MOTHER_MIDDLENAME],
                            'Guardian' => [self::LEGACY_COL_GUARDIAN_LASTNAME, self::LEGACY_COL_GUARDIAN_FIRSTNAME, self::LEGACY_COL_GUARDIAN_MIDDLENAME],
                        ] as $relation => [$lnIdx, $fnIdx, $mnIdx]) {
                            $lastName   = EncodingRepair::repairName($fields[$lnIdx] ?? null);
                            $firstName  = EncodingRepair::repairName($fields[$fnIdx] ?? null);
                            $middleName = EncodingRepair::repairName($fields[$mnIdx] ?? null);

                            if ($lastName || $firstName) {
                                $familyByPwdAndRelation["{$pwdNumber}|{$relation}"] = [
                                    'last_name'   => $lastName,
                                    'first_name'  => $firstName,
                                    'middle_name' => $middleName,
                                ];
                            }
                        }
                    }
                } elseif ($inProfileInsert) {
                    foreach ($this->parseRowsFromLine($line) as $fields) {
                        if (count($fields) < 6) continue;
                        $pwdNumber = $fields[1] ?? null;
                        if (!$pwdNumber) continue;
                        $profilesByPwd[$pwdNumber] = [
                            'last_name'   => EncodingRepair::repairName($fields[2] ?? null),
                            'first_name'  => EncodingRepair::repairName($fields[3] ?? null),
                            'middle_name' => EncodingRepair::repairName($fields[4] ?? null),
                            'suffix'      => EncodingRepair::repairName($fields[5] ?? null),
                        ];
                    }
                }
                // pwd_family from backup dumps not handled (no pwd_number available)
            }

            // --------------------------------------------------------------
            // End of INSERT block (check AFTER parsing the last row)
            // --------------------------------------------------------------
            if ($lineEndsInsert) {
                $inLegacyInsert  = false;
                $inProfileInsert = false;
                $inFamilyInsert  = false;
            }
        }

        fclose($handle);

        return [$profilesByPwd, $familyByPwdAndRelation];
    }

    /**
     * Parse all row tuples from a VALUES line (e.g. "(v1,v2,...),(v1,v2,...),..." or a single row line).
     * If $maxCol is set, stops collecting field values after that column index (for performance
     * when the remaining columns contain large blobs we don't need).
     *
     * @return array<int,array<int,string|null>>  Each element is an array of column values for one row.
     */
    private function parseRowsFromLine(string $line, int $maxCol = PHP_INT_MAX): array
    {
        // Strip leading 'VALUES' keyword if present
        if (($vp = stripos($line, 'VALUES')) !== false) {
            $line = substr($line, $vp + 6);
        }

        $rows      = [];
        $fields    = [];
        $value     = '';
        $inString  = false;
        $escape    = false;
        $depth     = 0;
        $colIndex  = 0;
        $skipRest  = false; // once maxCol is passed, skip to end of row

        $length = strlen($line);

        for ($i = 0; $i < $length; $i++) {
            $char = $line[$i];

            // ------- inside a quoted string -------
            if ($inString) {
                if ($escape) {
                    $value .= $char;
                    $escape = false;
                    continue;
                }
                if ($char === '\\') {
                    $escape = true;
                    // Don't append the backslash itself — decodeField handles escape sequences
                    continue;
                }
                if ($char === "'") {
                    // Check for doubled-quote escape ''
                    if ($i + 1 < $length && $line[$i + 1] === "'") {
                        $value .= "'";
                        $i++;
                        continue;
                    }
                    $inString = false; // closing quote
                    continue;
                }
                $value .= $char;
                continue;
            }

            // ------- outside a quoted string -------
            if ($char === "'") {
                $inString = true;
                continue;
            }

            if ($char === '(') {
                if ($depth === 0) {
                    // Start of a new row
                    $fields   = [];
                    $value    = '';
                    $colIndex = 0;
                    $skipRest = false;
                } elseif (!$skipRest) {
                    $value .= $char;
                }
                $depth++;
                continue;
            }

            if ($char === ')') {
                $depth--;
                if ($depth === 0) {
                    // End of row — finalize last field
                    if (!$skipRest) {
                        $fields[$colIndex] = $this->decodeField($value);
                    }
                    $rows[]   = $fields;
                    $fields   = [];
                    $value    = '';
                    $colIndex = 0;
                    $skipRest = false;
                    continue;
                }
                if (!$skipRest) {
                    $value .= $char;
                }
                continue;
            }

            if ($char === ',' && $depth === 1) {
                // Field separator
                if (!$skipRest) {
                    $fields[$colIndex] = $this->decodeField($value);
                    $value = '';
                }
                $colIndex++;
                if ($colIndex > $maxCol) {
                    $skipRest = true; // skip remaining columns (e.g. large blob)
                }
                continue;
            }

            if ($depth > 0 && !$skipRest) {
                $value .= $char;
            }
        }

        return $rows;
    }

    private function decodeField(string $value): ?string
    {
        $value = trim($value);

        if (strcasecmp($value, 'NULL') === 0 || $value === '') {
            return null;
        }

        // Unescape MySQL escape sequences stored during parsing
        return str_replace(
            ["\\'", '\\\\', '\\r', '\\n', '\\0', '\\"'],
            ["'",   '\\',   "\r",  "\n",  "\0",  '"'],
            $value
        );
    }

    private function findLatestDumpPath(): ?string
    {
        // First check for the original legacy dump next to the server directory
        $legacyDump = dirname(base_path()) . DIRECTORY_SEPARATOR . 'pdao_db.sql';
        if (is_file($legacyDump)) {
            return $legacyDump;
        }

        // Fall back to the most recent backup from storage
        $candidates = glob(storage_path('app/backups/*.sql')) ?: [];
        if ($candidates === []) {
            return null;
        }

        usort($candidates, static fn (string $left, string $right) => filemtime($right) <=> filemtime($left));

        return $candidates[0] ?? null;
    }
}