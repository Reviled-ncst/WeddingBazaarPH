<?php
// Upload service images endpoint

require_once __DIR__ . '/../config/database.php';

setCorsHeaders();

// Handle preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Content-Type: application/json');
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Check for vendor_id
if (!isset($_POST['vendor_id'])) {
    header('Content-Type: application/json');
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'vendor_id is required']);
    exit;
}

$vendorId = (int)$_POST['vendor_id'];
$serviceId = isset($_POST['service_id']) ? (int)$_POST['service_id'] : null;

// Check for files
if (!isset($_FILES['images']) || empty($_FILES['images']['name'][0])) {
    header('Content-Type: application/json');
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No images uploaded']);
    exit;
}

// Create upload directory
$uploadDir = __DIR__ . '/../uploads/services/' . $vendorId . '/';
if (!file_exists($uploadDir)) {
    mkdir($uploadDir, 0755, true);
}

$allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
$maxSize = 5 * 1024 * 1024; // 5MB

$uploadedImages = [];
$errors = [];

// Handle multiple file uploads
$files = $_FILES['images'];
$fileCount = count($files['name']);

for ($i = 0; $i < $fileCount; $i++) {
    if ($files['error'][$i] !== UPLOAD_ERR_OK) {
        $errors[] = "Error uploading file: " . $files['name'][$i];
        continue;
    }
    
    // Validate file type
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $files['tmp_name'][$i]);
    finfo_close($finfo);
    
    if (!in_array($mimeType, $allowedTypes)) {
        $errors[] = "Invalid file type for: " . $files['name'][$i];
        continue;
    }
    
    // Validate file size
    if ($files['size'][$i] > $maxSize) {
        $errors[] = "File too large: " . $files['name'][$i];
        continue;
    }
    
    // Generate unique filename
    $extension = strtolower(pathinfo($files['name'][$i], PATHINFO_EXTENSION));
    $filename = uniqid('service_') . '_' . time() . '.jpg'; // Always save as jpg for compression
    $filepath = $uploadDir . $filename;
    
    // Try to compress and resize image
    $saved = false;
    if (extension_loaded('gd')) {
        try {
            $sourceImage = null;
            switch ($mimeType) {
                case 'image/jpeg':
                    $sourceImage = imagecreatefromjpeg($files['tmp_name'][$i]);
                    break;
                case 'image/png':
                    $sourceImage = imagecreatefrompng($files['tmp_name'][$i]);
                    break;
                case 'image/webp':
                    $sourceImage = imagecreatefromwebp($files['tmp_name'][$i]);
                    break;
                case 'image/gif':
                    $sourceImage = imagecreatefromgif($files['tmp_name'][$i]);
                    break;
            }
            
            if ($sourceImage) {
                // Get original dimensions
                $origWidth = imagesx($sourceImage);
                $origHeight = imagesy($sourceImage);
                
                // Max dimensions (resize if larger)
                $maxWidth = 1200;
                $maxHeight = 800;
                
                // Calculate new dimensions maintaining aspect ratio
                $ratio = min($maxWidth / $origWidth, $maxHeight / $origHeight);
                if ($ratio < 1) {
                    $newWidth = (int)($origWidth * $ratio);
                    $newHeight = (int)($origHeight * $ratio);
                    
                    // Create resized image
                    $resized = imagecreatetruecolor($newWidth, $newHeight);
                    imagecopyresampled($resized, $sourceImage, 0, 0, 0, 0, $newWidth, $newHeight, $origWidth, $origHeight);
                    imagedestroy($sourceImage);
                    $sourceImage = $resized;
                }
                
                // Save as JPEG with 80% quality for good balance of quality/size
                $saved = imagejpeg($sourceImage, $filepath, 80);
                imagedestroy($sourceImage);
            }
        } catch (Exception $e) {
            // Fall back to raw upload
        }
    }
    
    // Fallback: just move the file if GD processing failed
    if (!$saved) {
        $filename = uniqid('service_') . '_' . time() . '.' . $extension;
        $filepath = $uploadDir . $filename;
        $saved = move_uploaded_file($files['tmp_name'][$i], $filepath);
    }
    
    if ($saved) {
        // Use just /uploads/... path - the API URL will be prepended by frontend
        $uploadedImages[] = [
            'url' => '/uploads/services/' . $vendorId . '/' . $filename,
            'filename' => $filename,
            'originalName' => $files['name'][$i],
            'size' => filesize($filepath),
            'mimeType' => 'image/jpeg'
        ];
    } else {
        $errors[] = "Failed to save: " . $files['name'][$i];
    }
}

// If service_id provided, update the service images
if ($serviceId && !empty($uploadedImages)) {
    $pdo = getDBConnection();
    
    try {
        // Get existing images
        $sql = "SELECT images FROM services WHERE id = ? AND vendor_id = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$serviceId, $vendorId]);
        $service = $stmt->fetch();
        
        if ($service) {
            $existingImages = $service['images'] ? json_decode($service['images'], true) : [];
            $allImages = array_merge($existingImages, $uploadedImages);
            
            // Update service with new images
            $updateSql = "UPDATE services SET images = ? WHERE id = ? AND vendor_id = ?";
            $updateStmt = $pdo->prepare($updateSql);
            $updateStmt->execute([json_encode($allImages), $serviceId, $vendorId]);
        }
    } catch (PDOException $e) {
        $errors[] = "Database error: " . $e->getMessage();
    }
}

header('Content-Type: application/json');
echo json_encode([
    'success' => count($uploadedImages) > 0,
    'message' => count($uploadedImages) . ' image(s) uploaded successfully',
    'images' => $uploadedImages,
    'errors' => $errors
]);
