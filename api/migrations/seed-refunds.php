<?php
/**
 * Run Refund Seed
 * API endpoint to seed refund requests for testing
 * 
 * POST /migrations/seed-refunds.php
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
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    exit();
}

require_once '../config/database.php';

try {
    $pdo = getDBConnection();
    $results = [];
    
    // Ensure refund_requests table exists with all columns
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS refund_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            booking_id INT NOT NULL,
            user_id INT NOT NULL,
            vendor_id INT,
            amount DECIMAL(10,2) NOT NULL,
            reason TEXT,
            status ENUM('pending_vendor', 'pending_admin', 'vendor_rejected', 'appealed', 'approved', 'rejected', 'processed') DEFAULT 'pending_vendor',
            vendor_notes TEXT,
            vendor_responded_at TIMESTAMP NULL,
            appeal_reason TEXT,
            appealed_at TIMESTAMP NULL,
            admin_notes TEXT,
            processed_by INT,
            processed_at TIMESTAMP NULL,
            paymongo_refund_id VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_booking (booking_id),
            INDEX idx_status (status),
            INDEX idx_vendor (vendor_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
    $results[] = "Ensured refund_requests table exists";
    
    // Add missing columns if needed
    $columns = $pdo->query("SHOW COLUMNS FROM refund_requests")->fetchAll(PDO::FETCH_COLUMN);
    
    if (!in_array('vendor_id', $columns)) {
        $pdo->exec("ALTER TABLE refund_requests ADD COLUMN vendor_id INT AFTER user_id");
        $results[] = "Added vendor_id column";
    }
    if (!in_array('vendor_notes', $columns)) {
        $pdo->exec("ALTER TABLE refund_requests ADD COLUMN vendor_notes TEXT AFTER status");
        $results[] = "Added vendor_notes column";
    }
    if (!in_array('vendor_responded_at', $columns)) {
        $pdo->exec("ALTER TABLE refund_requests ADD COLUMN vendor_responded_at TIMESTAMP NULL AFTER vendor_notes");
        $results[] = "Added vendor_responded_at column";
    }
    if (!in_array('appeal_reason', $columns)) {
        $pdo->exec("ALTER TABLE refund_requests ADD COLUMN appeal_reason TEXT AFTER vendor_responded_at");
        $results[] = "Added appeal_reason column";
    }
    if (!in_array('appealed_at', $columns)) {
        $pdo->exec("ALTER TABLE refund_requests ADD COLUMN appealed_at TIMESTAMP NULL AFTER appeal_reason");
        $results[] = "Added appealed_at column";
    }
    
    // Update status enum
    try {
        $pdo->exec("ALTER TABLE refund_requests MODIFY COLUMN status ENUM('pending', 'pending_vendor', 'pending_admin', 'vendor_rejected', 'appealed', 'approved', 'rejected', 'processed') DEFAULT 'pending_vendor'");
        $results[] = "Updated status enum";
    } catch (Exception $e) {
        // Already updated
    }
    
    // Get paid bookings that don't have refund requests yet
    $stmt = $pdo->query("
        SELECT b.id, b.user_id, b.vendor_id, b.total_price, b.amount_paid, b.service_id,
               u.name as user_name, v.business_name as vendor_name
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        JOIN vendors v ON b.vendor_id = v.id
        WHERE b.payment_status IN ('paid', 'partial')
        AND b.id NOT IN (SELECT booking_id FROM refund_requests)
        ORDER BY RAND()
        LIMIT 10
    ");
    $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Get an admin user for processing
    $adminStmt = $pdo->query("SELECT id FROM users WHERE role = 'admin' LIMIT 1");
    $admin = $adminStmt->fetch(PDO::FETCH_ASSOC);
    $adminId = $admin ? $admin['id'] : 1;
    
    // Refund scenarios to seed
    $scenarios = [
        [
            'status' => 'pending_vendor',
            'reason' => 'Change of wedding plans, need to postpone indefinitely.',
            'vendor_notes' => null,
            'appeal_reason' => null,
            'admin_notes' => null,
        ],
        [
            'status' => 'pending_vendor',
            'reason' => 'Found a better deal elsewhere. Would like my deposit back.',
            'vendor_notes' => null,
            'appeal_reason' => null,
            'admin_notes' => null,
        ],
        [
            'status' => 'pending_admin',
            'reason' => 'Vendor was unresponsive to my messages for 2 weeks.',
            'vendor_notes' => 'I apologize for the delay. Customer deserves a refund.',
            'appeal_reason' => null,
            'admin_notes' => null,
        ],
        [
            'status' => 'pending_admin',
            'reason' => 'Wedding cancelled due to family emergency.',
            'vendor_notes' => 'Understood. Please process the refund.',
            'appeal_reason' => null,
            'admin_notes' => null,
        ],
        [
            'status' => 'vendor_rejected',
            'reason' => 'I changed my mind about the service.',
            'vendor_notes' => 'Per our contract, cancellations within 30 days are non-refundable. The event is in 2 weeks.',
            'appeal_reason' => null,
            'admin_notes' => null,
        ],
        [
            'status' => 'appealed',
            'reason' => 'Service quality was not as advertised.',
            'vendor_notes' => 'We delivered exactly what was promised. Customer has unrealistic expectations.',
            'appeal_reason' => 'The vendor promised premium flowers but delivered standard ones. I have photos as proof.',
            'admin_notes' => null,
        ],
        [
            'status' => 'appealed',
            'reason' => 'Vendor cancelled on me last minute.',
            'vendor_notes' => 'We had to cancel due to equipment failure. We offered to reschedule.',
            'appeal_reason' => 'I had to find a replacement vendor at extra cost. The vendor should refund since they cancelled.',
            'admin_notes' => null,
        ],
        [
            'status' => 'approved',
            'reason' => 'Duplicate payment was made by accident.',
            'vendor_notes' => 'Yes, customer paid twice. Please refund the extra payment.',
            'appeal_reason' => null,
            'admin_notes' => 'Verified duplicate payment. Refund approved.',
        ],
        [
            'status' => 'rejected',
            'reason' => 'I just dont want the service anymore.',
            'vendor_notes' => 'Customer booked 6 months ago. We have already allocated resources.',
            'appeal_reason' => 'I should be able to cancel anytime.',
            'admin_notes' => 'Customer appeal rejected. Contract clearly states no refunds within 60 days of event.',
        ],
        [
            'status' => 'processed',
            'reason' => 'Medical emergency, cannot proceed with wedding.',
            'vendor_notes' => 'Completely understand. Please refund in full.',
            'appeal_reason' => null,
            'admin_notes' => 'Verified medical documentation. Full refund processed.',
        ],
    ];
    
    $insertStmt = $pdo->prepare("
        INSERT INTO refund_requests 
        (booking_id, user_id, vendor_id, amount, reason, status, vendor_notes, vendor_responded_at, appeal_reason, appealed_at, admin_notes, processed_by, processed_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $created = [];
    foreach ($bookings as $index => $booking) {
        if ($index >= count($scenarios)) break;
        
        $scenario = $scenarios[$index];
        $amount = $booking['amount_paid'] > 0 ? $booking['amount_paid'] : $booking['total_price'];
        
        // Calculate timestamps
        $createdAt = date('Y-m-d H:i:s', strtotime('-' . (10 - $index) . ' days'));
        $vendorRespondedAt = $scenario['vendor_notes'] ? date('Y-m-d H:i:s', strtotime($createdAt . ' +1 day')) : null;
        $appealedAt = $scenario['appeal_reason'] ? date('Y-m-d H:i:s', strtotime($createdAt . ' +2 days')) : null;
        $processedAt = in_array($scenario['status'], ['approved', 'rejected', 'processed']) 
            ? date('Y-m-d H:i:s', strtotime($createdAt . ' +3 days')) 
            : null;
        $processedBy = $processedAt ? $adminId : null;
        
        $insertStmt->execute([
            $booking['id'],
            $booking['user_id'],
            $booking['vendor_id'],
            $amount,
            $scenario['reason'],
            $scenario['status'],
            $scenario['vendor_notes'],
            $vendorRespondedAt,
            $scenario['appeal_reason'],
            $appealedAt,
            $scenario['admin_notes'],
            $processedBy,
            $processedAt,
            $createdAt
        ]);
        
        $refundId = $pdo->lastInsertId();
        
        // Update booking status for certain refund statuses
        if (in_array($scenario['status'], ['pending_vendor', 'pending_admin', 'appealed'])) {
            $pdo->prepare("UPDATE bookings SET status = 'refund_requested' WHERE id = ?")->execute([$booking['id']]);
        } elseif ($scenario['status'] === 'processed' || $scenario['status'] === 'approved') {
            $pdo->prepare("UPDATE bookings SET status = 'cancelled', payment_status = 'refunded' WHERE id = ?")->execute([$booking['id']]);
        } elseif ($scenario['status'] === 'rejected') {
            $pdo->prepare("UPDATE bookings SET status = 'confirmed' WHERE id = ?")->execute([$booking['id']]);
        }
        
        $created[] = [
            'refund_id' => $refundId,
            'booking_id' => $booking['id'],
            'vendor' => $booking['vendor_name'],
            'amount' => $amount,
            'status' => $scenario['status']
        ];
    }
    
    // Get counts by status
    $countStmt = $pdo->query("
        SELECT status, COUNT(*) as count 
        FROM refund_requests 
        GROUP BY status
    ");
    $counts = [];
    while ($row = $countStmt->fetch(PDO::FETCH_ASSOC)) {
        $counts[$row['status']] = (int)$row['count'];
    }
    
    echo json_encode([
        'success' => true,
        'message' => 'Seeded ' . count($created) . ' refund requests',
        'setup_results' => $results,
        'created' => $created,
        'counts_by_status' => $counts
    ], JSON_PRETTY_PRINT);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
