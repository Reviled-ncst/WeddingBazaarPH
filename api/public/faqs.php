<?php
/**
 * Get FAQs API
 * Returns frequently asked questions from help articles or dedicated FAQ table
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/../config/database.php';

try {
    $database = new Database();
    $pdo = $database->getConnection();
    
    // Get limit from query params (default 20)
    $limit = isset($_GET['limit']) ? min(50, max(1, (int)$_GET['limit'])) : 20;
    $category = isset($_GET['category']) ? trim($_GET['category']) : null;
    
    $faqs = [];
    
    // Check if faqs table exists
    $tableCheck = $pdo->query("SHOW TABLES LIKE 'faqs'");
    $hasFaqsTable = $tableCheck->rowCount() > 0;
    
    if ($hasFaqsTable) {
        // Fetch from faqs table
        $sql = "
            SELECT 
                f.id,
                f.question,
                f.answer,
                f.category,
                f.sort_order
            FROM faqs f
            WHERE f.is_published = 1
        ";
        
        $params = [];
        if ($category) {
            $sql .= " AND f.category = :category";
            $params['category'] = $category;
        }
        
        $sql .= " ORDER BY f.sort_order ASC, f.created_at DESC LIMIT :limit";
        
        $stmt = $pdo->prepare($sql);
        foreach ($params as $key => $value) {
            $stmt->bindValue(":$key", $value);
        }
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        $faqs = $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // If no FAQs table, try help_articles
    if (empty($faqs)) {
        $helpCheck = $pdo->query("SHOW TABLES LIKE 'help_articles'");
        $hasHelpArticles = $helpCheck->rowCount() > 0;
        
        if ($hasHelpArticles) {
            $sql = "
                SELECT 
                    h.id,
                    h.title as question,
                    h.content as answer,
                    h.category,
                    h.view_count as sort_order
                FROM help_articles h
                WHERE h.is_published = 1
            ";
            
            $params = [];
            if ($category) {
                $sql .= " AND h.category = :category";
                $params['category'] = $category;
            }
            
            $sql .= " ORDER BY h.view_count DESC, h.created_at DESC LIMIT :limit";
            
            $stmt = $pdo->prepare($sql);
            foreach ($params as $key => $value) {
                $stmt->bindValue(":$key", $value);
            }
            $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            
            $faqs = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
    }
    
    // Get categories
    $categories = [];
    if (!empty($faqs)) {
        $categories = array_unique(array_column($faqs, 'category'));
        sort($categories);
    }
    
    // Process FAQs
    foreach ($faqs as &$faq) {
        $faq['id'] = (int)$faq['id'];
    }
    
    echo json_encode([
        'success' => true,
        'faqs' => $faqs,
        'categories' => array_values($categories),
        'count' => count($faqs)
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Failed to fetch FAQs',
        'message' => $e->getMessage()
    ]);
}
