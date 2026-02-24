<?php
/**
 * Add Missing Service Columns Migration
 * Adds is_featured and subcategory columns to services table
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'POST required']);
    exit();
}

require_once '../config/database.php';

try {
    $pdo = getDBConnection();
    $results = [];
    
    // Get current columns
    $stmt = $pdo->query("SHOW COLUMNS FROM services");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    // Add is_featured if not exists
    if (!in_array('is_featured', $columns)) {
        $pdo->exec("ALTER TABLE services ADD COLUMN is_featured TINYINT(1) DEFAULT 0 AFTER is_active");
        $results[] = "Added is_featured column";
    } else {
        $results[] = "is_featured already exists";
    }
    
    // Add subcategory if not exists
    if (!in_array('subcategory', $columns)) {
        $pdo->exec("ALTER TABLE services ADD COLUMN subcategory VARCHAR(100) AFTER category");
        $results[] = "Added subcategory column";
    } else {
        $results[] = "subcategory already exists";
    }
    
    // Add subcategory_id if not exists
    if (!in_array('subcategory_id', $columns)) {
        $pdo->exec("ALTER TABLE services ADD COLUMN subcategory_id INT AFTER subcategory");
        $results[] = "Added subcategory_id column";
    } else {
        $results[] = "subcategory_id already exists";
    }
    
    // Get updated columns
    $stmt = $pdo->query("SHOW COLUMNS FROM services");
    $updatedColumns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    echo json_encode([
        'success' => true,
        'message' => 'Migration completed',
        'results' => $results,
        'columns' => $updatedColumns
    ], JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
