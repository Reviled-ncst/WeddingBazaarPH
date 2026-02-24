<?php
/**
 * Refund API - Full Workflow
 * 
 * Flow:
 * 1. Couple requests refund -> status = 'pending_vendor'
 * 2. Vendor accepts/rejects:
 *    - Accept -> status = 'pending_admin'
 *    - Reject -> status = 'vendor_rejected'
 * 3. If vendor rejected, couple can appeal -> status = 'appealed'
 * 4. Admin processes (for pending_admin or appealed):
 *    - Approve -> status = 'approved' (triggers PayMongo refund)
 *    - Reject -> status = 'rejected'
 * 
 * POST Actions:
 * - request: Couple requests refund
 * - vendor_accept: Vendor accepts refund
 * - vendor_reject: Vendor rejects refund
 * - appeal: Couple appeals vendor rejection
 * - approve: Admin approves and processes refund
 * - reject: Admin rejects refund
 * 
 * GET:
 * - ?booking_id=X: Get refund for booking
 * - ?user_id=X: Get all refunds for user
 * - ?vendor_id=X: Get refunds for vendor's bookings
 * - (no params): Admin get all refunds
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
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';
require_once '../config/paymongo.php';

// Ensure refund_requests table exists with full workflow columns
function ensureRefundTable($pdo) {
    // Check if table exists
    $stmt = $pdo->query("SHOW TABLES LIKE 'refund_requests'");
    $tableExists = $stmt->fetch();
    
    if (!$tableExists) {
        $pdo->exec("
            CREATE TABLE refund_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                booking_id INT NOT NULL,
                user_id INT NOT NULL,
                vendor_id INT NOT NULL,
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
                FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_booking (booking_id),
                INDEX idx_status (status),
                INDEX idx_vendor (vendor_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        ");
    } else {
        // Add new columns if they don't exist
        $columns = $pdo->query("SHOW COLUMNS FROM refund_requests")->fetchAll(PDO::FETCH_COLUMN);
        
        if (!in_array('vendor_id', $columns)) {
            $pdo->exec("ALTER TABLE refund_requests ADD COLUMN vendor_id INT AFTER user_id");
            // Update existing records with vendor_id from bookings
            $pdo->exec("UPDATE refund_requests r JOIN bookings b ON r.booking_id = b.id SET r.vendor_id = b.vendor_id WHERE r.vendor_id IS NULL");
        }
        if (!in_array('vendor_notes', $columns)) {
            $pdo->exec("ALTER TABLE refund_requests ADD COLUMN vendor_notes TEXT AFTER status");
        }
        if (!in_array('vendor_responded_at', $columns)) {
            $pdo->exec("ALTER TABLE refund_requests ADD COLUMN vendor_responded_at TIMESTAMP NULL AFTER vendor_notes");
        }
        if (!in_array('appeal_reason', $columns)) {
            $pdo->exec("ALTER TABLE refund_requests ADD COLUMN appeal_reason TEXT AFTER vendor_responded_at");
        }
        if (!in_array('appealed_at', $columns)) {
            $pdo->exec("ALTER TABLE refund_requests ADD COLUMN appealed_at TIMESTAMP NULL AFTER appeal_reason");
        }
        
        // Update status enum to include new values
        try {
            $pdo->exec("ALTER TABLE refund_requests MODIFY COLUMN status ENUM('pending', 'pending_vendor', 'pending_admin', 'vendor_rejected', 'appealed', 'approved', 'rejected', 'processed') DEFAULT 'pending_vendor'");
            // Migrate old 'pending' status to 'pending_vendor'
            $pdo->exec("UPDATE refund_requests SET status = 'pending_vendor' WHERE status = 'pending'");
        } catch (Exception $e) {
            // Ignore if already updated
        }
    }
}

try {
    $pdo = getDBConnection();
    ensureRefundTable($pdo);
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $bookingId = $_GET['booking_id'] ?? null;
        $userId = $_GET['user_id'] ?? null;
        $vendorId = $_GET['vendor_id'] ?? null;
        
        if ($bookingId) {
            // Get refund status for a specific booking
            $stmt = $pdo->prepare("
                SELECT r.*, b.total_price, b.payment_status, u.name as requester_name,
                       v.business_name as vendor_name, s.name as service_name
                FROM refund_requests r
                JOIN bookings b ON r.booking_id = b.id
                JOIN users u ON r.user_id = u.id
                LEFT JOIN vendors v ON b.vendor_id = v.id
                LEFT JOIN services s ON b.service_id = s.id
                WHERE r.booking_id = ?
                ORDER BY r.created_at DESC
                LIMIT 1
            ");
            $stmt->execute([$bookingId]);
            $refund = $stmt->fetch(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'data' => $refund ?: null
            ]);
        } elseif ($vendorId) {
            // Get all refund requests for a vendor's bookings
            $stmt = $pdo->prepare("
                SELECT r.*, b.total_price, b.event_date, b.payment_status,
                       u.name as user_name, u.email as user_email,
                       s.name as service_name
                FROM refund_requests r
                JOIN bookings b ON r.booking_id = b.id
                JOIN users u ON r.user_id = u.id
                LEFT JOIN services s ON b.service_id = s.id
                WHERE b.vendor_id = ?
                ORDER BY r.created_at DESC
            ");
            $stmt->execute([$vendorId]);
            $refunds = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'data' => $refunds
            ]);
        } elseif ($userId) {
            // Get all refund requests for a user (couple)
            $stmt = $pdo->prepare("
                SELECT r.*, b.total_price, b.event_date,
                       v.business_name as vendor_name, s.name as service_name
                FROM refund_requests r
                JOIN bookings b ON r.booking_id = b.id
                LEFT JOIN vendors v ON b.vendor_id = v.id
                LEFT JOIN services s ON b.service_id = s.id
                WHERE r.user_id = ?
                ORDER BY r.created_at DESC
            ");
            $stmt->execute([$userId]);
            $refunds = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'data' => $refunds
            ]);
        } else {
            // Admin: Get all refund requests
            $status = $_GET['status'] ?? '';
            
            $sql = "
                SELECT r.*, 
                       u.name as user_name, u.email as user_email,
                       b.total_price, b.payment_id, b.event_date,
                       v.business_name as vendor_name,
                       s.name as service_name
                FROM refund_requests r
                JOIN users u ON r.user_id = u.id
                JOIN bookings b ON r.booking_id = b.id
                LEFT JOIN vendors v ON b.vendor_id = v.id
                LEFT JOIN services s ON b.service_id = s.id
            ";
            
            $validStatuses = ['pending_vendor', 'pending_admin', 'vendor_rejected', 'appealed', 'approved', 'rejected', 'processed'];
            if ($status && in_array($status, $validStatuses)) {
                $sql .= " WHERE r.status = ?";
            }
            
            $sql .= " ORDER BY r.created_at DESC";
            
            $stmt = $pdo->prepare($sql);
            if ($status && in_array($status, $validStatuses)) {
                $stmt->execute([$status]);
            } else {
                $stmt->execute();
            }
            
            $requests = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo json_encode([
                'success' => true,
                'requests' => $requests
            ]);
        }
        exit();
    }
    
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        $action = $data['action'] ?? 'request';
        
        // ============================================
        // ACTION: request - Couple requests a refund
        // ============================================
        if ($action === 'request') {
            $bookingId = $data['booking_id'] ?? null;
            $userId = $data['user_id'] ?? null;
            $reason = $data['reason'] ?? null;
            
            if (!$bookingId || !$userId) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'booking_id and user_id required']);
                exit();
            }
            
            // Check booking exists and belongs to user
            $stmt = $pdo->prepare("SELECT b.*, v.user_id as vendor_user_id FROM bookings b JOIN vendors v ON b.vendor_id = v.id WHERE b.id = ? AND b.user_id = ?");
            $stmt->execute([$bookingId, $userId]);
            $booking = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$booking) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Booking not found']);
                exit();
            }
            
            // Check if already has active refund request
            $stmt = $pdo->prepare("SELECT id FROM refund_requests WHERE booking_id = ? AND status IN ('pending_vendor', 'pending_admin', 'appealed')");
            $stmt->execute([$bookingId]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Refund request already in progress']);
                exit();
            }
            
            // Check if payment was made
            if ($booking['payment_status'] !== 'paid' && $booking['payment_status'] !== 'partial') {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'No payment to refund']);
                exit();
            }
            
            // Create refund request - status starts as pending_vendor
            $refundAmount = $booking['amount_paid'] > 0 ? $booking['amount_paid'] : $booking['total_price'];
            
            $stmt = $pdo->prepare("
                INSERT INTO refund_requests (booking_id, user_id, vendor_id, amount, reason, status)
                VALUES (?, ?, ?, ?, ?, 'pending_vendor')
            ");
            $stmt->execute([$bookingId, $userId, $booking['vendor_id'], $refundAmount, $reason]);
            $refundId = $pdo->lastInsertId();
            
            // Update booking status to refund_requested
            $stmt = $pdo->prepare("UPDATE bookings SET status = 'refund_requested' WHERE id = ?");
            $stmt->execute([$bookingId]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Refund request submitted. Waiting for vendor response.',
                'refund_id' => $refundId,
                'amount' => $refundAmount
            ]);
            
        }
        // ============================================
        // ACTION: vendor_accept - Vendor accepts refund
        // ============================================
        elseif ($action === 'vendor_accept') {
            $refundId = $data['refund_id'] ?? null;
            $vendorId = $data['vendor_id'] ?? null;
            $vendorNotes = $data['notes'] ?? null;
            
            if (!$refundId || !$vendorId) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'refund_id and vendor_id required']);
                exit();
            }
            
            // Verify refund belongs to this vendor and is pending
            $stmt = $pdo->prepare("
                SELECT r.* FROM refund_requests r
                JOIN bookings b ON r.booking_id = b.id
                WHERE r.id = ? AND b.vendor_id = ? AND r.status = 'pending_vendor'
            ");
            $stmt->execute([$refundId, $vendorId]);
            $refund = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$refund) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Refund request not found or not pending']);
                exit();
            }
            
            // Update refund status to pending_admin
            $stmt = $pdo->prepare("
                UPDATE refund_requests 
                SET status = 'pending_admin', 
                    vendor_notes = ?, 
                    vendor_responded_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$vendorNotes, $refundId]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Refund accepted. Forwarded to admin for processing.'
            ]);
        }
        // ============================================
        // ACTION: vendor_reject - Vendor rejects refund
        // ============================================
        elseif ($action === 'vendor_reject') {
            $refundId = $data['refund_id'] ?? null;
            $vendorId = $data['vendor_id'] ?? null;
            $vendorNotes = $data['notes'] ?? null;
            
            if (!$refundId || !$vendorId) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'refund_id and vendor_id required']);
                exit();
            }
            
            if (!$vendorNotes) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Reason for rejection is required']);
                exit();
            }
            
            // Verify refund belongs to this vendor and is pending
            $stmt = $pdo->prepare("
                SELECT r.* FROM refund_requests r
                JOIN bookings b ON r.booking_id = b.id
                WHERE r.id = ? AND b.vendor_id = ? AND r.status = 'pending_vendor'
            ");
            $stmt->execute([$refundId, $vendorId]);
            $refund = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$refund) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Refund request not found or not pending']);
                exit();
            }
            
            // Update refund status to vendor_rejected
            $stmt = $pdo->prepare("
                UPDATE refund_requests 
                SET status = 'vendor_rejected', 
                    vendor_notes = ?, 
                    vendor_responded_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$vendorNotes, $refundId]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Refund rejected. Customer may appeal to admin.'
            ]);
        }
        // ============================================
        // ACTION: appeal - Couple appeals vendor rejection
        // ============================================
        elseif ($action === 'appeal') {
            $refundId = $data['refund_id'] ?? null;
            $userId = $data['user_id'] ?? null;
            $appealReason = $data['appeal_reason'] ?? null;
            
            if (!$refundId || !$userId) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'refund_id and user_id required']);
                exit();
            }
            
            if (!$appealReason) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Appeal reason is required']);
                exit();
            }
            
            // Verify refund belongs to this user and was rejected by vendor
            $stmt = $pdo->prepare("SELECT * FROM refund_requests WHERE id = ? AND user_id = ? AND status = 'vendor_rejected'");
            $stmt->execute([$refundId, $userId]);
            $refund = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$refund) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Refund request not found or cannot be appealed']);
                exit();
            }
            
            // Update refund status to appealed
            $stmt = $pdo->prepare("
                UPDATE refund_requests 
                SET status = 'appealed', 
                    appeal_reason = ?, 
                    appealed_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$appealReason, $refundId]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Appeal submitted. Admin will review your request.'
            ]);
        }
        // ============================================
        // ACTION: approve - Admin approves refund
        // ============================================
        elseif ($action === 'approve') {
            $refundId = $data['refund_id'] ?? null;
            $adminId = $data['admin_id'] ?? null;
            $adminNotes = $data['notes'] ?? null;
            
            if (!$refundId || !$adminId) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'refund_id and admin_id required']);
                exit();
            }
            
            // Get refund request - must be pending_admin or appealed
            $stmt = $pdo->prepare("SELECT * FROM refund_requests WHERE id = ? AND status IN ('pending_admin', 'appealed')");
            $stmt->execute([$refundId]);
            $refund = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$refund) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Refund request not found or not ready for processing']);
                exit();
            }
            
            // Get booking for PayMongo payment ID
            $stmt = $pdo->prepare("SELECT * FROM bookings WHERE id = ?");
            $stmt->execute([$refund['booking_id']]);
            $booking = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $paymongoRefundId = null;
            $refundError = null;
            
            // If we have a PayMongo payment ID, process real refund
            if ($booking['payment_id'] && strpos($booking['payment_id'], 'pay_') === 0) {
                try {
                    $refundResult = paymongoRequest('/refunds', 'POST', [
                        'data' => [
                            'attributes' => [
                                'amount' => (int)($refund['amount'] * 100),
                                'payment_id' => $booking['payment_id'],
                                'reason' => 'requested_by_customer',
                                'notes' => $adminNotes ?? 'Refund approved via admin panel'
                            ]
                        ]
                    ]);
                    
                    if (isset($refundResult['data']['id'])) {
                        $paymongoRefundId = $refundResult['data']['id'];
                    }
                } catch (Exception $e) {
                    $refundError = $e->getMessage();
                }
            }
            
            // Update refund request status
            $newStatus = $paymongoRefundId ? 'processed' : 'approved';
            $stmt = $pdo->prepare("
                UPDATE refund_requests 
                SET status = ?, 
                    admin_notes = ?, 
                    processed_by = ?, 
                    processed_at = NOW(),
                    paymongo_refund_id = ?
                WHERE id = ?
            ");
            $stmt->execute([$newStatus, $adminNotes, $adminId, $paymongoRefundId, $refundId]);
            
            // Update booking payment status and status
            $stmt = $pdo->prepare("UPDATE bookings SET payment_status = 'refunded', status = 'cancelled' WHERE id = ?");
            $stmt->execute([$refund['booking_id']]);
            
            echo json_encode([
                'success' => true,
                'message' => $paymongoRefundId ? 'Refund processed successfully' : 'Refund approved',
                'paymongo_refund_id' => $paymongoRefundId,
                'error' => $refundError
            ]);
        }
        // ============================================
        // ACTION: reject - Admin rejects refund
        // ============================================
        elseif ($action === 'reject') {
            $refundId = $data['refund_id'] ?? null;
            $adminId = $data['admin_id'] ?? null;
            $adminNotes = $data['notes'] ?? null;
            
            if (!$refundId || !$adminId) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'refund_id and admin_id required']);
                exit();
            }
            
            if (!$adminNotes) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Reason for rejection is required']);
                exit();
            }
            
            // Get refund request - can reject pending_admin or appealed
            $stmt = $pdo->prepare("SELECT * FROM refund_requests WHERE id = ? AND status IN ('pending_admin', 'appealed')");
            $stmt->execute([$refundId]);
            $refund = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$refund) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Refund request not found or not ready for processing']);
                exit();
            }
            
            // Update refund status
            $stmt = $pdo->prepare("
                UPDATE refund_requests 
                SET status = 'rejected', 
                    admin_notes = ?, 
                    processed_by = ?, 
                    processed_at = NOW()
                WHERE id = ?
            ");
            $stmt->execute([$adminNotes, $adminId, $refundId]);
            
            // Revert booking status
            $stmt = $pdo->prepare("UPDATE bookings SET status = 'confirmed' WHERE id = ? AND status IN ('cancelled', 'refund_requested')");
            $stmt->execute([$refund['booking_id']]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Refund rejected'
            ]);
        }
        else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action. Valid actions: request, vendor_accept, vendor_reject, appeal, approve, reject']);
        }
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
