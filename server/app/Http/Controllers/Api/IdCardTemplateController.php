<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\IdCardTemplate;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class IdCardTemplateController extends Controller
{
    /**
     * Default front layout – used when no DB template exists yet.
     */
    private const DEFAULT_FRONT = [
        ['id' => 'photo',     'label' => 'Photo',      'top' => 47,   'left' => 6.5,  'fontSize' => 0,   'maxWidth' => 27.5],
        ['id' => 'fullName',  'label' => 'Full Name',   'top' => 52,   'left' => 64.5, 'fontSize' => 2.8, 'maxWidth' => null],
        ['id' => 'disability','label' => 'Disability',   'top' => 66,   'left' => 64.5, 'fontSize' => 2.4, 'maxWidth' => null],
        ['id' => 'pwdNumber', 'label' => 'PWD Number',   'top' => 91.5, 'left' => 20.5, 'fontSize' => 2.1, 'maxWidth' => null],
    ];

    /**
     * Default back layout – used when no DB template exists yet.
     */
    private const DEFAULT_BACK = [
        ['id' => 'address',    'label' => 'Address',          'top' => 13.5, 'left' => 21.5, 'fontSize' => 1.8, 'maxWidth' => 73],
        ['id' => 'dob',        'label' => 'Date of Birth',    'top' => 19.5, 'left' => 32,   'fontSize' => 1.8, 'maxWidth' => null],
        ['id' => 'sex',        'label' => 'Sex',              'top' => 19.5, 'left' => 78,   'fontSize' => 1.8, 'maxWidth' => null],
        ['id' => 'dateIssued', 'label' => 'Date Issued',      'top' => 25.5, 'left' => 32,   'fontSize' => 1.8, 'maxWidth' => null],
        ['id' => 'bloodType',  'label' => 'Blood Type',       'top' => 25.5, 'left' => 78,   'fontSize' => 2.0, 'maxWidth' => null],
        ['id' => 'guardian',   'label' => 'Parent/Guardian',   'top' => 44.5, 'left' => 45,   'fontSize' => 1.8, 'maxWidth' => 50],
        ['id' => 'contactNo',  'label' => 'Contact No.',      'top' => 51,   'left' => 28,   'fontSize' => 1.8, 'maxWidth' => null],
    ];

    /**
     * Build an image URL from a storage path.
     */
    private function imageUrl(?string $path): ?string
    {
        if (!$path) return null;
        return url('storage/' . $path);
    }

    /**
     * GET /api/id-templates/active
     * Return the currently active template for both sides (fields + images).
     * Any authenticated user can call this.
     */
    public function active(): JsonResponse
    {
        $front = IdCardTemplate::active()->front()->first();
        $back  = IdCardTemplate::active()->back()->first();

        return response()->json([
            'success' => true,
            'data' => [
                'front'       => $front ? $front->styles : self::DEFAULT_FRONT,
                'back'        => $back  ? $back->styles  : self::DEFAULT_BACK,
                'front_image' => $front ? $this->imageUrl($front->image_path) : null,
                'back_image'  => $back  ? $this->imageUrl($back->image_path)  : null,
            ],
        ]);
    }

    /**
     * GET /api/id-templates
     * Admin: list all templates (history).
     */
    public function index(): JsonResponse
    {
        $templates = IdCardTemplate::with('creator:id,name')
            ->orderBy('updated_at', 'desc')
            ->get()
            ->map(function ($t) {
                $t->image_url = $this->imageUrl($t->image_path);
                return $t;
            });

        return response()->json([
            'success' => true,
            'data' => $templates,
        ]);
    }

    /**
     * POST /api/id-templates
     * Admin: save (create/replace) the active template for a given side.
     */
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'side'              => 'required|in:front,back',
            'styles'            => 'required|array|min:1',
            'styles.*.id'       => 'required|string',
            'styles.*.label'    => 'required|string',
            'styles.*.top'      => 'required|numeric',
            'styles.*.left'     => 'required|numeric',
            'styles.*.fontSize' => 'required|numeric|min:0',
            'styles.*.maxWidth' => 'nullable|numeric',
            'template_name'     => 'nullable|string|max:100',
        ]);

        $side = $request->input('side');

        // Carry forward current image if any
        $currentImage = IdCardTemplate::active()
            ->where('side', $side)
            ->value('image_path');

        // Deactivate existing
        IdCardTemplate::where('side', $side)
            ->where('is_active', true)
            ->update(['is_active' => false]);

        $template = IdCardTemplate::create([
            'template_name' => $request->input('template_name', 'Default'),
            'side'          => $side,
            'styles'        => $request->input('styles'),
            'image_path'    => $currentImage,
            'is_active'     => true,
            'created_by'    => $request->user()->id,
        ]);

        return response()->json([
            'success' => true,
            'data'    => $template,
            'message' => ucfirst($side) . ' template saved successfully.',
        ], 201);
    }

    /**
     * POST /api/id-templates/save-both
     * Admin: save both sides at once.
     */
    public function saveBoth(Request $request): JsonResponse
    {
        $request->validate([
            'front'            => 'required|array|min:1',
            'front.*.id'       => 'required|string',
            'front.*.label'    => 'required|string',
            'front.*.top'      => 'required|numeric',
            'front.*.left'     => 'required|numeric',
            'front.*.fontSize' => 'required|numeric|min:0',
            'front.*.maxWidth' => 'nullable|numeric',
            'back'             => 'required|array|min:1',
            'back.*.id'        => 'required|string',
            'back.*.label'     => 'required|string',
            'back.*.top'       => 'required|numeric',
            'back.*.left'      => 'required|numeric',
            'back.*.fontSize'  => 'required|numeric|min:0',
            'back.*.maxWidth'  => 'nullable|numeric',
            'template_name'    => 'nullable|string|max:100',
        ]);

        $name   = $request->input('template_name', 'Default');
        $userId = $request->user()->id;

        // Carry forward current images
        $currentFrontImage = IdCardTemplate::active()->front()->value('image_path');
        $currentBackImage  = IdCardTemplate::active()->back()->value('image_path');

        // Deactivate all current active templates
        IdCardTemplate::where('is_active', true)->update(['is_active' => false]);

        $front = IdCardTemplate::create([
            'template_name' => $name,
            'side'          => 'front',
            'styles'        => $request->input('front'),
            'image_path'    => $currentFrontImage,
            'is_active'     => true,
            'created_by'    => $userId,
        ]);

        $back = IdCardTemplate::create([
            'template_name' => $name,
            'side'          => 'back',
            'styles'        => $request->input('back'),
            'image_path'    => $currentBackImage,
            'is_active'     => true,
            'created_by'    => $userId,
        ]);

        return response()->json([
            'success' => true,
            'data'    => ['front' => $front, 'back' => $back],
            'message' => 'ID card template saved successfully.',
        ], 201);
    }

    /**
     * POST /api/id-templates/upload-image
     * Admin: upload a background image for front or back.
     * Body: multipart/form-data with `side` (front|back) and `image` file.
     */
    public function uploadImage(Request $request): JsonResponse
    {
        $request->validate([
            'side'  => 'required|in:front,back',
            'image' => 'required|image|mimes:jpg,jpeg,png,webp|max:5120', // 5 MB
        ]);

        $side = $request->input('side');
        $file = $request->file('image');

        // Store with a deterministic name so we overwrite per side
        $extension = $file->getClientOriginalExtension();
        $filename  = "id-templates/{$side}.{$extension}";

        // Store in public disk (storage/app/public/id-templates/)
        $path = $file->storeAs('id-templates', "{$side}.{$extension}", 'public');

        // Update the active template for this side (if exists)
        $updated = IdCardTemplate::where('side', $side)
            ->where('is_active', true)
            ->update(['image_path' => $path]);

        // If no active template exists, create one with default styles
        if (!$updated) {
            $defaults = $side === 'front' ? self::DEFAULT_FRONT : self::DEFAULT_BACK;
            IdCardTemplate::create([
                'template_name' => 'Default',
                'side'          => $side,
                'styles'        => $defaults,
                'image_path'    => $path,
                'is_active'     => true,
                'created_by'    => $request->user()->id,
            ]);
        }

        return response()->json([
            'success'   => true,
            'data'      => [
                'side'      => $side,
                'image_url' => $this->imageUrl($path),
                'path'      => $path,
            ],
            'message' => ucfirst($side) . ' template image uploaded successfully.',
        ]);
    }

    /**
     * POST /api/id-templates/revert-image
     * Admin: remove the custom background image for a side, reverting to built-in default.
     * Body: { "side": "front" | "back" }
     */
    public function revertImage(Request $request): JsonResponse
    {
        $request->validate([
            'side' => 'required|in:front,back',
        ]);

        $side = $request->input('side');

        $template = IdCardTemplate::where('side', $side)
            ->where('is_active', true)
            ->first();

        if ($template && $template->image_path) {
            // Delete the stored file
            Storage::disk('public')->delete($template->image_path);
            $template->update(['image_path' => null]);
        }

        return response()->json([
            'success' => true,
            'data'    => ['side' => $side],
            'message' => ucfirst($side) . ' template image reverted to default.',
        ]);
    }
}
