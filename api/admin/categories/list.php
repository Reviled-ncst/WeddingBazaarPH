<?php
// Categories API - List all categories with subcategories

require_once __DIR__ . '/../../config/database.php';

setJsonHeader();
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit;
}

$pdo = getDBConnection();

// Get query parameters
$includeInactive = isset($_GET['include_inactive']) && $_GET['include_inactive'] === 'true';
$withSubcategories = !isset($_GET['subcategories']) || $_GET['subcategories'] !== 'false';

// Build query
$whereClause = $includeInactive ? '' : 'WHERE c.is_active = TRUE';

$sql = "
    SELECT 
        c.id,
        c.name,
        c.slug,
        c.description,
        c.icon,
        c.image,
        c.sort_order,
        c.is_active,
        c.created_at,
        c.updated_at
    FROM categories c
    $whereClause
    ORDER BY c.sort_order ASC, c.name ASC
";

$stmt = $pdo->query($sql);
$categories = $stmt->fetchAll();

// Get subcategories if needed
if ($withSubcategories) {
    $subWhereClause = $includeInactive ? '' : 'WHERE s.is_active = TRUE';
    $subSql = "
        SELECT 
            s.id,
            s.category_id,
            s.name,
            s.slug,
            s.description,
            s.sort_order,
            s.is_active,
            s.created_at,
            s.updated_at
        FROM subcategories s
        $subWhereClause
        ORDER BY s.sort_order ASC, s.name ASC
    ";
    $subStmt = $pdo->query($subSql);
    $subcategories = $subStmt->fetchAll();
    
    // Group subcategories by category_id
    $subcatByCategory = [];
    foreach ($subcategories as $sub) {
        $catId = $sub['category_id'];
        if (!isset($subcatByCategory[$catId])) {
            $subcatByCategory[$catId] = [];
        }
        $subcatByCategory[$catId][] = $sub;
    }
    
    // Attach subcategories to categories
    foreach ($categories as &$cat) {
        $cat['subcategories'] = $subcatByCategory[$cat['id']] ?? [];
    }
}

echo json_encode([
    'success' => true,
    'data' => $categories
]);
