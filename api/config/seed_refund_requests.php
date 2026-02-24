<?php
/**
 * Seed Refund Requests
 * Creates test refund requests based on actual bookings in the database
 * 
 * Usage: php seed_refund_requests.php
 */

require_once 'database.php';

try {
    $pdo = getDBConnection();
    
    echo "=== Seeding Refund Requests ===\n\n";
    
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
    
    // Get paid bookings that don't have refund requests yet
    $stmt = $pdo->query("
        SELECT b.id, b.user_id, b.vendor_id, b.total_price, b.amount_paid, b.service_id,
               u.name as user_name, v.business_name as vendor_name, s.name as service_name
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        JOIN vendors v ON b.vendor_id = v.id
        LEFT JOIN services s ON b.service_id = s.id
        WHERE b.payment_status IN ('paid', 'partial')
        AND b.id NOT IN (SELECT booking_id FROM refund_requests)
        ORDER BY RAND()
        LIMIT 10
    ");
    $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (empty($bookings)) {
        echo "No eligible bookings found. Creating some test bookings first...\n";
        
        // Get a couple user and vendor
        $coupleStmt = $pdo->query("SELECT id FROM users WHERE role IN ('individual', 'couple') LIMIT 1");
        $couple = $coupleStmt->fetch(PDO::FETCH_ASSOC);
        
        $vendorStmt = $pdo->query("SELECT v.id as vendor_id, v.user_id, s.id as service_id, s.name as service_name FROM vendors v JOIN services s ON v.id = s.vendor_id LIMIT 3");
        $vendors = $vendorStmt->fetchAll(PDO::FETCH_ASSOC);
        
        if ($couple && !empty($vendors)) {
            foreach ($vendors as $i => $vendor) {
                $price = rand(15000, 50000);
                $eventDate = date('Y-m-d', strtotime('+' . (30 + $i * 10) . ' days'));
                
                $stmt = $pdo->prepare("
                    INSERT INTO bookings (user_id, vendor_id, service_id, event_date, total_price, amount_paid, payment_status, status, notes)
                    VALUES (?, ?, ?, ?, ?, ?, 'paid', 'confirmed', 'Test booking for refund testing')
                ");
                $stmt->execute([$couple['id'], $vendor['vendor_id'], $vendor['service_id'], $eventDate, $price, $price]);
                echo "Created test booking #{$pdo->lastInsertId()}\n";
            }
            
            // Re-fetch bookings
            $stmt = $pdo->query("
                SELECT b.id, b.user_id, b.vendor_id, b.total_price, b.amount_paid, b.service_id,
                       u.name as user_name, v.business_name as vendor_name
                FROM bookings b
                JOIN users u ON b.user_id = u.id
                JOIN vendors v ON b.vendor_id = v.id
                WHERE b.payment_status IN ('paid', 'partial')
                AND b.id NOT IN (SELECT booking_id FROM refund_requests)
                ORDER BY b.id DESC
                LIMIT 10
            ");
            $bookings = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
    }
    
    if (empty($bookings)) {
        echo "ERROR: No bookings available for refund seeding.\n";
        exit(1);
    }
    
    echo "Found " . count($bookings) . " eligible bookings.\n\n";
    
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
            'appeal_reason' => 'The vendor promised premium flowers but delivered standard ones. I have photos as proof. The contract clearly stated premium roses but I received regular carnations.',
            'admin_notes' => null,
        ],
        [
            'status' => 'appealed',
            'reason' => 'Vendor cancelled on me last minute.',
            'vendor_notes' => 'We had to cancel due to equipment failure. We offered to reschedule.',
            'appeal_reason' => 'I had to find a replacement vendor at the last minute which cost me extra. The vendor should refund since they cancelled, not me.',
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
            'admin_notes' => 'Customer appeal rejected. Contract clearly states no refunds within 60 days of event. Event is in 3 weeks.',
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
    
    $createdCount = 0;
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
        $createdCount++;
        
        // Update booking status for certain refund statuses
        if (in_array($scenario['status'], ['pending_vendor', 'pending_admin', 'appealed'])) {
            $pdo->prepare("UPDATE bookings SET status = 'refund_requested' WHERE id = ?")->execute([$booking['id']]);
        } elseif ($scenario['status'] === 'processed' || $scenario['status'] === 'approved') {
            $pdo->prepare("UPDATE bookings SET status = 'cancelled', payment_status = 'refunded' WHERE id = ?")->execute([$booking['id']]);
        } elseif ($scenario['status'] === 'rejected') {
            $pdo->prepare("UPDATE bookings SET status = 'confirmed' WHERE id = ?")->execute([$booking['id']]);
        }
        
        echo "Created refund #{$refundId}: {$scenario['status']} - Booking #{$booking['id']} ({$booking['vendor_name']})\n";
        echo "  Amount: ₱" . number_format($amount, 2) . "\n";
        echo "  Reason: " . substr($scenario['reason'], 0, 50) . "...\n\n";
    }
    
    echo "=== Summary ===\n";
    echo "Created {$createdCount} refund requests.\n\n";
    
    // Show counts by status
    $countStmt = $pdo->query("
        SELECT status, COUNT(*) as count 
        FROM refund_requests 
        GROUP BY status 
        ORDER BY FIELD(status, 'pending_vendor', 'pending_admin', 'vendor_rejected', 'appealed', 'approved', 'rejected', 'processed')
    ");
    echo "Refund requests by status:\n";
    while ($row = $countStmt->fetch(PDO::FETCH_ASSOC)) {
        echo "  - {$row['status']}: {$row['count']}\n";
    }
    
    echo "\nDone!\n";
    
} catch (PDOException $e) {
    echo "Database error: " . $e->getMessage() . "\n";
    exit(1);
}
