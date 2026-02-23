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
    $extension = pathinfo($files['name'][$i], PATHINFO_EXTENSION);
    $filename = uniqid('service_') . '_' . time() . '.' . $extension;
    $filepath = $uploadDir . $filename;
    
    if (move_uploaded_file($files['tmp_name'][$i], $filepath)) {
        $uploadedImages[] = [
            'url' => '/wedding-bazaar-api/uploads/services/' . $vendorId . '/' . $filename,
            'filename' => $filename,
            'originalName' => $files['name'][$i],
            'size' => $files['size'][$i],
            'mimeType' => $mimeType
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
