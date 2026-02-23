<?php
// Public: Get landing page sections
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/jwt.php';

setJsonHeader();
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$pdo = getDBConnection();

try {
    // Get specific section or all
    $sectionKey = isset($_GET['section']) ? trim($_GET['section']) : null;
    
    $sql = "SELECT * FROM landing_sections WHERE is_active = 1";
    $params = [];
    
    if ($sectionKey) {
        $sql .= " AND section_key = ?";
        $params[] = $sectionKey;
    }
    
    $sql .= " ORDER BY sort_order";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $sections = $stmt->fetchAll();
    
    // Parse JSON content
    foreach ($sections as &$section) {
        if ($section['content']) {
            $decoded = json_decode($section['content'], true);
            if ($decoded !== null) {
                $section['content'] = $decoded;
            }
        }
    }
    
    // If single section requested, return just that
    if ($sectionKey && count($sections) === 1) {
        echo json_encode([
            'success' => true,
            'data' => $sections[0]
        ]);
    } else {
        // Group by section key for easy access
        $keyed = [];
        foreach ($sections as $section) {
            $keyed[$section['section_key']] = $section;
        }
        
        echo json_encode([
            'success' => true,
            'data' => [
                'sections' => $sections,
                'keyed' => $keyed
            ]
        ]);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Failed to fetch landing sections']);
}
