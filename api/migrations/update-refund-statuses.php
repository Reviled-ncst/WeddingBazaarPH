<?php
/**
 * Update Refund Statuses
 * Add approved, rejected, processed statuses to some existing refund requests
 * 
 * POST /migrations/update-refund-statuses.php
 */

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$allowedOrigins = ['http://localhost:3000', 'http://localhost:3001'];
$frontendUrl = getenv('FRONTEND_URL');
if ($frontendUrl) $allowedOrigins[] = $frontendUrl;

if (in_array($origin, $allowedOrigins) || preg_match('/\.railway\.app$|\.vercel\.app$/', $origin)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: http://localhost:3000");
}
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

require_once '../config/database.php';

try {
    $pdo = getDBConnection();
    $updates = [];
    
    // Get an admin user for processing
    $adminStmt = $pdo->query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    $admin = $adminStmt->fetch(PDO::FETCH_ASSOC);
    $adminId = $admin ? $admin['id'] : 1;
    
    // Find refund requests with pending_vendor status and update some to approved/rejected/processed
    $stmt = $pdo->query("SELECT id, status FROM refund_requests WHERE status IN ('pending_vendor', 'pending_admin') ORDER BY id LIMIT 6");
    $refunds = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    foreach ($refunds as $index => $refund) {
        $newStatus = null;
        $adminNotes = null;
        $processedAt = date('Y-m-d H:i:s');
        $vendorNotes = null;
        $vendorRespondedAt = null;
        
        if ($index === 0) {
            // First one: approved
            $newStatus = 'approved';
            $adminNotes = 'Verified customer claim. Refund approved for processing.';
            $vendorNotes = 'We agree to the refund.';
            $vendorRespondedAt = date('Y-m-d H:i:s', strtotime('-1 day'));
        } elseif ($index === 1) {
            // Second: rejected
            $newStatus = 'rejected';
            $adminNotes = 'Contract terms clearly state no refunds within 30 days of event. Request rejected.';
            $vendorNotes = 'Customer signed the contract with clear refund policy.';
            $vendorRespondedAt = date('Y-m-d H:i:s', strtotime('-2 days'));
        } elseif ($index === 2) {
            // Third: processed
            $newStatus = 'processed';
            $adminNotes = 'Refund processed via PayMongo. Customer should receive within 3-5 business days.';
            $vendorNotes = 'We support this refund request.';
            $vendorRespondedAt = date('Y-m-d H:i:s', strtotime('-3 days'));
        }
        
        if ($newStatus) {
            $pdo->prepare("
                UPDATE refund_requests 
                SET status = ?, 
                    admin_notes = ?, 
                    processed_by = ?, 
                    processed_at = ?,
                    vendor_notes = COALESCE(vendor_notes, ?),
                    vendor_responded_at = COALESCE(vendor_responded_at, ?)
                WHERE id = ?
            ")->execute([$newStatus, $adminNotes, $adminId, $processedAt, $vendorNotes, $vendorRespondedAt, $refund['id']]);
            
            $updates[] = [
                'id' => $refund['id'],
                'old_status' => $refund['status'],
                'new_status' => $newStatus
            ];
        }
    }
    
    // Get current counts
    $countStmt = $pdo->query("SELECT status, COUNT(*) as count FROM refund_requests GROUP BY status");
    $counts = [];
    while ($row = $countStmt->fetch(PDO::FETCH_ASSOC)) {
        $counts[$row['status']] = (int)$row['count'];
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Updated ' . count($updates) . ' refund requests',
        'updates' => $updates,
        'counts_by_status' => $counts
    ], JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
