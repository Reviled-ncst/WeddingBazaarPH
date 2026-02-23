<?php
// Admin: Upload media to Cloudinary and save to database
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../config/jwt.php';

setJsonHeader();
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Verify admin
$user = requireAuth();
if ($user['role'] !== 'admin') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Admin access required']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

// Check for file upload
if (!isset($_FILES['file']) && !isset($_POST['url'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'File or URL is required']);
    exit;
}

$pdo = getDBConnection();

try {
    $url = '';
    $filename = '';
    $fileType = 'image';
    $fileSize = 0;
    
    // If URL provided, use it directly (for Cloudinary uploads from frontend)
    if (isset($_POST['url'])) {
        $url = $_POST['url'];
        $filename = $_POST['filename'] ?? basename(parse_url($url, PHP_URL_PATH));
        $fileType = $_POST['file_type'] ?? 'image';
        $fileSize = isset($_POST['file_size']) ? intval($_POST['file_size']) : 0;
    } else {
        // Handle file upload - for now just store locally
        // In production, this would upload to Cloudinary
        $file = $_FILES['file'];
        $filename = $file['name'];
        $fileSize = $file['size'];
        
        // Determine file type
        $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
        if (in_array($ext, ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'])) {
            $fileType = 'image';
        } elseif (in_array($ext, ['mp4', 'webm', 'mov'])) {
            $fileType = 'video';
        } else {
            $fileType = 'document';
        }
        
        // For local storage (Railway doesn't persist files, so URL-based is preferred)
        $uploadDir = __DIR__ . '/../../uploads/media/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
        
        $uniqueName = uniqid() . '_' . preg_replace('/[^a-zA-Z0-9._-]/', '', $filename);
        $uploadPath = $uploadDir . $uniqueName;
        
        if (move_uploaded_file($file['tmp_name'], $uploadPath)) {
            // Build URL relative to API
            $url = '/uploads/media/' . $uniqueName;
        } else {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Failed to save uploaded file']);
            exit;
        }
    }
    
    // Save to database
    $stmt = $pdo->prepare("
        INSERT INTO media_library 
        (filename, url, file_type, file_size, category, alt_text, uploaded_by, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    
    $stmt->execute([
        $filename,
        $url,
        $fileType,
        $fileSize,
        $_POST['category'] ?? 'general',
        $_POST['alt_text'] ?? '',
        $user['id']
    ]);
    
    $mediaId = $pdo->lastInsertId();
    
    // Fetch the created media
    $stmt = $pdo->prepare("SELECT * FROM media_library WHERE id = ?");
    $stmt->execute([$mediaId]);
    $media = $stmt->fetch();
    
    echo json_encode([
        'success' => true,
        'message' => 'Media uploaded successfully',
        'data' => $media
    ]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to save media: ' . $e->getMessage()]);
}
