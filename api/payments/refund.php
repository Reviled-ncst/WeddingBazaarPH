<?php
/**
 * Refund API
 * POST /payments/refund.php - Request a refund
 * GET /payments/refund.php?booking_id=X - Get refund status
 * 
 * For admin: POST with action=approve or action=reject
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

// Ensure refund_requests table exists
function ensureRefundTable($pdo) {
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS refund_requests (
            id INT AUTO_INCREMENT PRIMARY KEY,
            booking_id INT NOT NULL,
            user_id INT NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            reason TEXT,
            status ENUM('pending', 'approved', 'rejected', 'processed') DEFAULT 'pending',
            admin_notes TEXT,
            processed_by INT,
            processed_at TIMESTAMP NULL,
            paymongo_refund_id VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_booking (booking_id),
            INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    ");
}

try {
    $pdo = getDBConnection();
    ensureRefundTable($pdo);
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // Get refund status for a booking
        $bookingId = $_GET['booking_id'] ?? null;
        $userId = $_GET['user_id'] ?? null;
        
        if ($bookingId) {
            $stmt = $pdo->prepare("
                SELECT r.*, b.total_price, b.payment_status, u.name as requester_name
                FROM refund_requests r
                JOIN bookings b ON r.booking_id = b.id
                JOIN users u ON r.user_id = u.id
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
        } elseif ($userId) {
            // Get all refund requests for a user
            $stmt = $pdo->prepare("
                SELECT r.*, b.total_price, v.business_name as vendor_name
                FROM refund_requests r
                JOIN bookings b ON r.booking_id = b.id
                JOIN vendors v ON b.vendor_id = v.id
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
            // Check if admin (optional Authorization header check)
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
            
            if ($status && in_array($status, ['pending', 'approved', 'rejected', 'processed'])) {
                $sql .= " WHERE r.status = ?";
            }
            
            $sql .= " ORDER BY r.created_at DESC";
            
            $stmt = $pdo->prepare($sql);
            if ($status && in_array($status, ['pending', 'approved', 'rejected', 'processed'])) {
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
        
        if ($action === 'request') {
            // Couple requesting a refund
            $bookingId = $data['booking_id'] ?? null;
            $userId = $data['user_id'] ?? null;
            $reason = $data['reason'] ?? null;
            
            if (!$bookingId || !$userId) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'booking_id and user_id required']);
                exit();
            }
            
            // Check booking exists and belongs to user
            $stmt = $pdo->prepare("SELECT * FROM bookings WHERE id = ? AND user_id = ?");
            $stmt->execute([$bookingId, $userId]);
            $booking = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$booking) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Booking not found']);
                exit();
            }
            
            // Check if already has pending refund request
            $stmt = $pdo->prepare("SELECT id FROM refund_requests WHERE booking_id = ? AND status = 'pending'");
            $stmt->execute([$bookingId]);
            if ($stmt->fetch()) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Refund request already pending']);
                exit();
            }
            
            // Check if payment was made
            if ($booking['payment_status'] !== 'paid' && $booking['payment_status'] !== 'partial') {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'No payment to refund']);
                exit();
            }
            
            // Create refund request
            $refundAmount = $booking['amount_paid'] > 0 ? $booking['amount_paid'] : $booking['total_price'];
            
            $stmt = $pdo->prepare("
                INSERT INTO refund_requests (booking_id, user_id, amount, reason)
                VALUES (?, ?, ?, ?)
            ");
            $stmt->execute([$bookingId, $userId, $refundAmount, $reason]);
            $refundId = $pdo->lastInsertId();
            
            // Update booking status to cancelled
            $stmt = $pdo->prepare("UPDATE bookings SET status = 'cancelled' WHERE id = ?");
            $stmt->execute([$bookingId]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Refund request submitted',
                'refund_id' => $refundId,
                'amount' => $refundAmount
            ]);
            
        } elseif ($action === 'approve' || $action === 'reject') {
            // Admin approving/rejecting refund
            $refundId = $data['refund_id'] ?? null;
            $adminId = $data['admin_id'] ?? null;
            $adminNotes = $data['notes'] ?? null;
            
            if (!$refundId || !$adminId) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'refund_id and admin_id required']);
                exit();
            }
            
            // Get refund request
            $stmt = $pdo->prepare("SELECT * FROM refund_requests WHERE id = ?");
            $stmt->execute([$refundId]);
            $refund = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$refund) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Refund request not found']);
                exit();
            }
            
            if ($refund['status'] !== 'pending') {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Refund already processed']);
                exit();
            }
            
            if ($action === 'approve') {
                // Get booking for PayMongo payment ID
                $stmt = $pdo->prepare("SELECT * FROM bookings WHERE id = ?");
                $stmt->execute([$refund['booking_id']]);
                $booking = $stmt->fetch(PDO::FETCH_ASSOC);
                
                $paymongoRefundId = null;
                
                // If we have a PayMongo payment ID, process real refund
                if ($booking['payment_id'] && strpos($booking['payment_id'], 'pay_') === 0) {
                    // Create PayMongo refund
                    $refundResult = paymongoRequest('/refunds', 'POST', [
                        'data' => [
                            'attributes' => [
                                'amount' => (int)($refund['amount'] * 100), // Convert to centavos
                                'payment_id' => $booking['payment_id'],
                                'reason' => 'requested_by_customer',
                                'notes' => $adminNotes ?? 'Refund approved via admin panel'
                            ]
                        ]
                    ]);
                    
                    if (isset($refundResult['data']['id'])) {
                        $paymongoRefundId = $refundResult['data']['id'];
                    }
                }
                
                // Update refund request
                $stmt = $pdo->prepare("
                    UPDATE refund_requests 
                    SET status = 'approved', 
                        admin_notes = ?, 
                        processed_by = ?, 
                        processed_at = NOW(),
                        paymongo_refund_id = ?
                    WHERE id = ?
                ");
                $stmt->execute([$adminNotes, $adminId, $paymongoRefundId, $refundId]);
                
                // Update booking payment status
                $stmt = $pdo->prepare("UPDATE bookings SET payment_status = 'refunded' WHERE id = ?");
                $stmt->execute([$refund['booking_id']]);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Refund approved',
                    'paymongo_refund_id' => $paymongoRefundId
                ]);
                
            } else {
                // Reject refund
                $stmt = $pdo->prepare("
                    UPDATE refund_requests 
                    SET status = 'rejected', 
                        admin_notes = ?, 
                        processed_by = ?, 
                        processed_at = NOW()
                    WHERE id = ?
                ");
                $stmt->execute([$adminNotes, $adminId, $refundId]);
                
                // Revert booking status if was cancelled
                $stmt = $pdo->prepare("UPDATE bookings SET status = 'confirmed' WHERE id = ? AND status = 'cancelled'");
                $stmt->execute([$refund['booking_id']]);
                
                echo json_encode([
                    'success' => true,
                    'message' => 'Refund rejected'
                ]);
            }
        } else {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
        }
    }
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
}
