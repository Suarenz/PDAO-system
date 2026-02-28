<?php

namespace App\Console\Commands;

use App\Models\ActivityLogArchive;
use App\Models\Barangay;
use App\Models\DisabilityType;
use App\Models\PwdAddress;
use App\Models\PwdContact;
use App\Models\PwdDisability;
use App\Models\PwdEducation;
use App\Models\PwdEmployment;
use App\Models\PwdFamily;
use App\Models\PwdGovernmentId;
use App\Models\PwdHouseholdInfo;
use App\Models\PwdOrganization;
use App\Models\PwdPersonalInfo;
use App\Models\PwdProfile;
use App\Models\PwdProfileVersion;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class MigrateLegacyData extends Command
{
    /**
     * The name and signature of the console command.
     */
    protected $signature = 'migrate:legacy-data 
                            {--dry-run : Run validation without inserting data}
                            {--limit= : Limit number of records to migrate}';

    /**
     * The console command description.
     */
    protected $description = 'Migrate data from legacy pdao_db to new normalized schema';

    /**
     * Mapping caches
     */
    protected array $barangayMap = [];
    protected array $disabilityTypeMap = [];
    protected array $userMap = [];

    /**
     * Statistics counters
     */
    protected array $stats = [
        'pwd_success' => 0,
        'pwd_failed' => 0,
        'users_success' => 0,
        'users_failed' => 0,
        'logs_success' => 0,
        'logs_failed' => 0,
    ];

    /**
     * Warnings and errors
     */
    protected array $warnings = [];
    protected array $errors = [];

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $isDryRun = $this->option('dry-run');
        $limit = $this->option('limit');

        $this->info('=================================================');
        $this->info('  PDAO Legacy Data Migration Tool');
        $this->info('=================================================');
        
        if ($isDryRun) {
            $this->warn('  Running in DRY-RUN mode - no data will be inserted');
        }
        $this->newLine();

        // Check legacy database connection
        if (!$this->checkLegacyConnection()) {
            return Command::FAILURE;
        }

        // Load lookup mappings
        $this->loadMappings();

        // Migrate in order
        $this->migrateUsers($isDryRun, $limit);
        $this->migratePwdRecords($isDryRun, $limit);
        $this->migrateHistoryLogs($isDryRun, $limit);

        // Print summary
        $this->printSummary($isDryRun);

        // Save log file
        $this->saveLogFile($isDryRun);

        return Command::SUCCESS;
    }

    /**
     * Check if legacy database connection works
     */
    protected function checkLegacyConnection(): bool
    {
        try {
            $tables = DB::connection('legacy')->select('SHOW TABLES');
            $this->info('✓ Connected to legacy database successfully');
            
            // Check required tables exist
            $requiredTables = ['pwd_table', 'account_table', 'history_log'];
            foreach ($requiredTables as $table) {
                $exists = DB::connection('legacy')
                    ->select("SHOW TABLES LIKE ?", [$table]);
                if (empty($exists)) {
                    $this->error("✗ Required table '{$table}' not found in legacy database");
                    return false;
                }
            }
            
            $this->info('✓ All required tables found');
            $this->newLine();
            return true;
        } catch (\Exception $e) {
            $this->error('✗ Cannot connect to legacy database: ' . $e->getMessage());
            $this->error('  Please check LEGACY_DB_* settings in .env file');
            return false;
        }
    }

    /**
     * Load barangay and disability type mappings
     */
    protected function loadMappings(): void
    {
        $this->info('Loading lookup mappings...');

        // Load barangays
        $barangays = Barangay::all();
        foreach ($barangays as $barangay) {
            $this->barangayMap[strtolower(trim($barangay->name))] = $barangay->id;
            // Add common variations
            $normalized = $this->normalizeBarangay($barangay->name);
            $this->barangayMap[$normalized] = $barangay->id;
        }
        $this->info("  Loaded {$barangays->count()} barangays");

        // Load disability types
        $disabilityTypes = DisabilityType::all();
        foreach ($disabilityTypes as $type) {
            $this->disabilityTypeMap[strtolower(trim($type->name))] = $type->id;
            // Add common variations
            $variations = $this->getDisabilityVariations($type->name);
            foreach ($variations as $variation) {
                $this->disabilityTypeMap[$variation] = $type->id;
            }
        }
        $this->info("  Loaded {$disabilityTypes->count()} disability types");
        $this->newLine();
    }

    /**
     * Migrate users from account_table
     */
    protected function migrateUsers(bool $isDryRun, ?int $limit): void
    {
        $this->info('Migrating users from account_table...');

        $query = DB::connection('legacy')->table('account_table');
        if ($limit) {
            $query->limit($limit);
        }
        $legacyUsers = $query->get();

        $bar = $this->output->createProgressBar($legacyUsers->count());
        $bar->start();

        foreach ($legacyUsers as $legacyUser) {
            try {
                $userData = $this->mapUserData($legacyUser);
                
                if (!$isDryRun) {
                    $user = User::updateOrCreate(
                        ['email' => $userData['email']],
                        $userData
                    );
                    $this->userMap[$legacyUser->account_id] = $user->id;
                } else {
                    // In dry-run, just store the legacy ID
                    $this->userMap[$legacyUser->account_id] = $legacyUser->account_id;
                }
                
                $this->stats['users_success']++;
            } catch (\Exception $e) {
                $this->stats['users_failed']++;
                $this->errors[] = "User {$legacyUser->account_id}: " . $e->getMessage();
            }
            
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
    }

    /**
     * Map legacy account data to new user format
     */
    protected function mapUserData(object $legacy): array
    {
        // Map user_type to role
        $roleMap = [
            'superadmin' => 'ADMIN',
            'admin' => 'ADMIN',
            'staff' => 'STAFF',
            'encoder' => 'ENCODER',
            'user' => 'USER',
        ];

        $role = $roleMap[strtolower($legacy->user_type ?? 'user')] ?? 'USER';

        // Generate email if not exists
        $email = $legacy->email ?? null;
        if (!$email) {
            $email = strtolower($legacy->firstname . '.' . $legacy->lastname) . '@pdao.local';
        }

        return [
            'first_name' => $legacy->firstname ?? 'Unknown',
            'last_name' => $legacy->lastname ?? 'User',
            'email' => $email,
            'password' => $legacy->password, // Keep existing bcrypt hash
            'role' => $role,
            'status' => strtoupper($legacy->status ?? 'active') === 'APPROVED' ? 'ACTIVE' : 'INACTIVE',
        ];
    }

    /**
     * Migrate PWD records from pwd_table
     */
    protected function migratePwdRecords(bool $isDryRun, ?int $limit): void
    {
        $this->info('Migrating PWD records from pwd_table...');

        $query = DB::connection('legacy')->table('pwd_table');
        if ($limit) {
            $query->limit($limit);
        }
        $legacyRecords = $query->get();

        $bar = $this->output->createProgressBar($legacyRecords->count());
        $bar->start();

        foreach ($legacyRecords as $legacy) {
            try {
                if (!$isDryRun) {
                    DB::transaction(function () use ($legacy) {
                        $this->createPwdProfile($legacy);
                    });
                } else {
                    // Validate data mapping in dry-run
                    $this->validatePwdData($legacy);
                }
                
                $this->stats['pwd_success']++;
            } catch (\Exception $e) {
                $this->stats['pwd_failed']++;
                $this->errors[] = "PWD {$legacy->pwd_id}: " . $e->getMessage();
            }
            
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
    }

    /**
     * Create PWD profile with all related data
     */
    protected function createPwdProfile(object $legacy): PwdProfile
    {
        // Create main profile
        $profile = PwdProfile::create([
            'pwd_number' => $legacy->pwd_number ?: null,
            'first_name' => $legacy->pwd_firstname ?? 'Unknown',
            'last_name' => $legacy->pwd_lastname ?? 'Unknown',
            'middle_name' => $legacy->pwd_middlename ?: null,
            'suffix' => $legacy->pwd_suffix ?: null,
            'date_applied' => $this->parseDate($legacy->date_applied),
            'status' => 'ACTIVE',
            'current_version' => 1,
        ]);

        // Create personal info
        PwdPersonalInfo::create([
            'pwd_profile_id' => $profile->id,
            'birth_date' => $this->parseDate($legacy->pwd_birthday),
            'birth_place' => $legacy->pwd_birthplace ?: null,
            'sex' => $this->normalizeSex($legacy->pwd_sex),
            'religion' => $legacy->pwd_religion ?: null,
            'ethnic_group' => $legacy->pwd_ethnic_group ?: null,
            'civil_status' => $this->normalizeCivilStatus($legacy->pwd_civil_status),
            'blood_type' => $this->normalizeBloodType($legacy->pwd_blood_type),
        ]);

        // Create address
        $barangayId = $this->findBarangayId($legacy->pwd_barangay);
        PwdAddress::create([
            'pwd_profile_id' => $profile->id,
            'house_street' => $legacy->pwd_house_street ?: null,
            'barangay_id' => $barangayId,
            'city' => 'Pagsanjan',
            'province' => 'Laguna',
            'region' => 'Region 4A',
        ]);

        // Create contacts
        PwdContact::create([
            'pwd_profile_id' => $profile->id,
            'mobile' => $legacy->pwd_mobile ?: null,
            'landline' => $legacy->pwd_landline ?: null,
            'email' => $legacy->pwd_email ?: null,
        ]);

        // Create disability (primary)
        $disabilityTypeId = $this->findDisabilityTypeId($legacy->pwd_disability_type);
        if ($disabilityTypeId) {
            PwdDisability::create([
                'pwd_profile_id' => $profile->id,
                'disability_type_id' => $disabilityTypeId,
                'cause' => $this->normalizeCause($legacy->pwd_disability_cause),
                'cause_details' => null,
                'is_primary' => true,
            ]);
        }

        // Create employment
        PwdEmployment::create([
            'pwd_profile_id' => $profile->id,
            'status' => $this->normalizeEmploymentStatus($legacy->pwd_employment_status),
            'category' => $legacy->pwd_employment_category ?: null,
            'type' => $legacy->pwd_employment_type ?: null,
            'occupation' => $legacy->pwd_occupation ?: null,
        ]);

        // Create education
        PwdEducation::create([
            'pwd_profile_id' => $profile->id,
            'attainment' => $this->normalizeEducation($legacy->pwd_education),
        ]);

        // Create initial version snapshot
        PwdProfileVersion::create([
            'pwd_profile_id' => $profile->id,
            'version_number' => 1,
            'snapshot' => $profile->loadFullProfile()->toArray(),
            'changed_by' => null,
            'change_summary' => 'Migrated from legacy system',
            'changed_at' => now(),
        ]);

        return $profile;
    }

    /**
     * Validate PWD data in dry-run mode
     */
    protected function validatePwdData(object $legacy): void
    {
        // Check barangay mapping
        if ($legacy->pwd_barangay && !$this->findBarangayId($legacy->pwd_barangay)) {
            $this->warnings[] = "PWD {$legacy->pwd_id}: Unknown barangay '{$legacy->pwd_barangay}'";
        }

        // Check disability type mapping
        if ($legacy->pwd_disability_type && !$this->findDisabilityTypeId($legacy->pwd_disability_type)) {
            $this->warnings[] = "PWD {$legacy->pwd_id}: Unknown disability type '{$legacy->pwd_disability_type}'";
        }

        // Check required fields
        if (empty($legacy->pwd_firstname) && empty($legacy->pwd_lastname)) {
            $this->warnings[] = "PWD {$legacy->pwd_id}: Missing name";
        }
    }

    /**
     * Migrate history logs
     */
    protected function migrateHistoryLogs(bool $isDryRun, ?int $limit): void
    {
        $this->info('Migrating history logs from history_log...');

        $query = DB::connection('legacy')->table('history_log');
        if ($limit) {
            $query->limit($limit);
        }
        $legacyLogs = $query->get();

        $bar = $this->output->createProgressBar($legacyLogs->count());
        $bar->start();

        foreach ($legacyLogs as $legacy) {
            try {
                if (!$isDryRun) {
                    $archiveMonth = date('Y-m', strtotime($legacy->date_time));
                    
                    ActivityLogArchive::create([
                        'archive_month' => $archiveMonth,
                        'original_id' => $legacy->history_id,
                        'user_id' => $this->userMap[$legacy->account_id] ?? null,
                        'action_type' => strtolower($legacy->activity ?? 'login'),
                        'model_type' => null,
                        'model_id' => null,
                        'description' => "Legacy: {$legacy->activity}",
                        'original_created_at' => $legacy->date_time,
                    ]);
                }
                
                $this->stats['logs_success']++;
            } catch (\Exception $e) {
                $this->stats['logs_failed']++;
                $this->errors[] = "Log {$legacy->history_id}: " . $e->getMessage();
            }
            
            $bar->advance();
        }

        $bar->finish();
        $this->newLine(2);
    }

    /**
     * Print migration summary
     */
    protected function printSummary(bool $isDryRun): void
    {
        $this->info('=================================================');
        $this->info('  Migration Summary' . ($isDryRun ? ' (DRY-RUN)' : ''));
        $this->info('=================================================');
        $this->newLine();

        $this->table(
            ['Entity', 'Success', 'Failed'],
            [
                ['Users', $this->stats['users_success'], $this->stats['users_failed']],
                ['PWD Records', $this->stats['pwd_success'], $this->stats['pwd_failed']],
                ['History Logs', $this->stats['logs_success'], $this->stats['logs_failed']],
            ]
        );

        if (!empty($this->warnings)) {
            $this->newLine();
            $this->warn('Warnings (' . count($this->warnings) . '):');
            foreach (array_slice($this->warnings, 0, 10) as $warning) {
                $this->warn("  - {$warning}");
            }
            if (count($this->warnings) > 10) {
                $this->warn('  ... and ' . (count($this->warnings) - 10) . ' more (see log file)');
            }
        }

        if (!empty($this->errors)) {
            $this->newLine();
            $this->error('Errors (' . count($this->errors) . '):');
            foreach (array_slice($this->errors, 0, 10) as $error) {
                $this->error("  - {$error}");
            }
            if (count($this->errors) > 10) {
                $this->error('  ... and ' . (count($this->errors) - 10) . ' more (see log file)');
            }
        }
    }

    /**
     * Save detailed log file
     */
    protected function saveLogFile(bool $isDryRun): void
    {
        $timestamp = now()->format('Y-m-d_His');
        $type = $isDryRun ? 'dry-run' : 'migration';
        $filename = "migration-{$type}-{$timestamp}.log";
        
        $content = "PDAO Legacy Data Migration Log\n";
        $content .= "==============================\n";
        $content .= "Date: " . now()->toDateTimeString() . "\n";
        $content .= "Mode: " . ($isDryRun ? 'DRY-RUN' : 'LIVE') . "\n\n";
        
        $content .= "Statistics:\n";
        $content .= "  Users: {$this->stats['users_success']} success, {$this->stats['users_failed']} failed\n";
        $content .= "  PWD Records: {$this->stats['pwd_success']} success, {$this->stats['pwd_failed']} failed\n";
        $content .= "  History Logs: {$this->stats['logs_success']} success, {$this->stats['logs_failed']} failed\n\n";
        
        if (!empty($this->warnings)) {
            $content .= "Warnings:\n";
            foreach ($this->warnings as $warning) {
                $content .= "  - {$warning}\n";
            }
            $content .= "\n";
        }
        
        if (!empty($this->errors)) {
            $content .= "Errors:\n";
            foreach ($this->errors as $error) {
                $content .= "  - {$error}\n";
            }
        }

        $path = storage_path("logs/{$filename}");
        file_put_contents($path, $content);
        
        $this->newLine();
        $this->info("Log saved to: {$path}");
    }

    // ==================== Helper Methods ====================

    protected function parseDate(?string $date): ?string
    {
        if (!$date || $date === '0000-00-00') {
            return null;
        }
        try {
            return date('Y-m-d', strtotime($date));
        } catch (\Exception $e) {
            return null;
        }
    }

    protected function normalizeSex(?string $sex): ?string
    {
        if (!$sex) return null;
        $sex = strtolower(trim($sex));
        if (in_array($sex, ['male', 'm'])) return 'Male';
        if (in_array($sex, ['female', 'f'])) return 'Female';
        return null;
    }

    protected function normalizeCivilStatus(?string $status): ?string
    {
        if (!$status) return null;
        $status = strtolower(trim($status));
        $map = [
            'single' => 'Single',
            'married' => 'Married',
            'widowed' => 'Widowed',
            'widow' => 'Widowed',
            'separated' => 'Separated',
            'divorced' => 'Divorced',
        ];
        return $map[$status] ?? null;
    }

    protected function normalizeBloodType(?string $type): ?string
    {
        if (!$type) return null;
        $type = strtoupper(trim($type));
        $valid = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
        return in_array($type, $valid) ? $type : null;
    }

    protected function normalizeCause(?string $cause): ?string
    {
        if (!$cause) return null;
        $cause = strtolower(trim($cause));
        if (str_contains($cause, 'acquired')) return 'Acquired';
        if (str_contains($cause, 'congenital')) return 'Congenital';
        return null;
    }

    protected function normalizeEmploymentStatus(?string $status): ?string
    {
        if (!$status) return null;
        $status = strtolower(trim($status));
        if (str_contains($status, 'self')) return 'Self-Employed';
        if (str_contains($status, 'employ')) return 'Employed';
        if (str_contains($status, 'unemploy')) return 'Unemployed';
        return null;
    }

    protected function normalizeEducation(?string $education): ?string
    {
        if (!$education) return null;
        $education = strtolower(trim($education));
        $map = [
            'none' => 'None',
            'elementary' => 'Elementary',
            'elementary education' => 'Elementary',
            'highschool' => 'Highschool',
            'high school' => 'Highschool',
            'high school education' => 'High School Education',
            'college' => 'College',
            'postgraduate' => 'Postgraduate',
            'non-formal' => 'Non-formal',
            'vocational' => 'Vocational',
        ];
        return $map[$education] ?? null;
    }

    protected function normalizeBarangay(string $name): string
    {
        return strtolower(trim(str_replace(['.', ','], '', $name)));
    }

    protected function findBarangayId(?string $name): ?int
    {
        if (!$name) return null;
        $normalized = $this->normalizeBarangay($name);
        return $this->barangayMap[$normalized] ?? null;
    }

    protected function getDisabilityVariations(string $name): array
    {
        $variations = [strtolower(trim($name))];
        
        // Add common variations
        $variationMap = [
            'Deaf or Hard of Hearing' => ['deaf', 'hard of hearing', 'hearing impaired', 'hearing'],
            'Physical' => ['physical disability', 'physical impairment'],
            'Visual' => ['visual impairment', 'blind', 'visually impaired', 'vision'],
            'Mental' => ['mental disability', 'mental health'],
            'Intellectual' => ['intellectual disability'],
            'Orthopedic' => ['orthopedic disability', 'ortho'],
            'Psychosocial' => ['psychosocial disability'],
            'Learning' => ['learning disability'],
            'Speech/Language' => ['speech', 'language', 'speech impairment'],
            'Chronic Illness' => ['chronic', 'chronic disease'],
            'Cancer' => ['cancer'],
            'Rare Disease' => ['rare disease', 'rare'],
        ];

        if (isset($variationMap[$name])) {
            $variations = array_merge($variations, $variationMap[$name]);
        }

        return $variations;
    }

    protected function findDisabilityTypeId(?string $name): ?int
    {
        if (!$name) return null;
        $normalized = strtolower(trim($name));
        return $this->disabilityTypeMap[$normalized] ?? null;
    }
}
