<?php
/**
 * Partnership Requests API
 * 
 * GET - List partnerships
 * POST - Create/Update partnership request
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once __DIR__ . '/../../config/database.php';

try {
    $database = new Database();
    $conn = $database->getConnection();
    
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        // List partnerships
        $conditions = [];
        $params = [];
        
        if (!empty($_GET['coordinator_id'])) {
            $conditions[] = "pr.coordinator_id = :coordinator_id";
            $params[':coordinator_id'] = (int)$_GET['coordinator_id'];
        }
        
        if (!empty($_GET['vendor_id'])) {
            $conditions[] = "pr.vendor_id = :vendor_id";
            $params[':vendor_id'] = (int)$_GET['vendor_id'];
        }
        
        if (!empty($_GET['status'])) {
            $conditions[] = "pr.status = :status";
            $params[':status'] = $_GET['status'];
        }
        
        $whereClause = !empty($conditions) ? 'WHERE ' . implode(' AND ', $conditions) : '';
        
        $sql = "SELECT 
            pr.*,
            c.business_name as coordinator_name,
            c.rating as coordinator_rating,
            c.weddings_completed,
            v.business_name as vendor_name,
            v.category as vendor_category,
            v.rating as vendor_rating,
            v.review_count as vendor_reviews,
            v.location as vendor_location,
            v.images as vendor_images,
            v.is_verified as vendor_verified
        FROM partnership_requests pr
        JOIN coordinators c ON pr.coordinator_id = c.id
        JOIN vendors v ON pr.vendor_id = v.id
        $whereClause
        ORDER BY pr.created_at DESC";
        
        $stmt = $conn->prepare($sql);
        $stmt->execute($params);
        $partnerships = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        foreach ($partnerships as &$p) {
            $p['vendor_images'] = $p['vendor_images'] ? json_decode($p['vendor_images'], true) : [];
        }
        
        echo json_encode([
            'success' => true,
            'data' => $partnerships
        ]);
        
    } else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $data = json_decode(file_get_contents('php://input'), true);
        
        $action = $data['action'] ?? 'create';
        
        if ($action === 'create') {
            // Create partnership request
            if (empty($data['coordinator_id']) || empty($data['vendor_id'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Missing coordinator_id or vendor_id']);
                exit;
            }
            
            // Check if already exists
            $checkStmt = $conn->prepare("
                SELECT id, status FROM partnership_requests 
                WHERE coordinator_id = :coordinator_id AND vendor_id = :vendor_id
            ");
            $checkStmt->execute([
                ':coordinator_id' => $data['coordinator_id'],
                ':vendor_id' => $data['vendor_id']
            ]);
            $existing = $checkStmt->fetch(PDO::FETCH_ASSOC);
            
            if ($existing) {
                http_response_code(409);
                echo json_encode([
                    'success' => false, 
                    'error' => 'Partnership request already exists',
                    'status' => $existing['status']
                ]);
                exit;
            }
            
            $sql = "INSERT INTO partnership_requests (
                coordinator_id, vendor_id, message, partnership_type, commission_rate
            ) VALUES (
                :coordinator_id, :vendor_id, :message, :partnership_type, :commission_rate
            )";
            
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                ':coordinator_id' => $data['coordinator_id'],
                ':vendor_id' => $data['vendor_id'],
                ':message' => $data['message'] ?? null,
                ':partnership_type' => $data['partnership_type'] ?? 'preferred',
                ':commission_rate' => $data['commission_rate'] ?? null
            ]);
            
            $partnerId = $conn->lastInsertId();
            
            // Log activity
            $logStmt = $conn->prepare("INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, ip_address) VALUES (:user_id, :action, :entity_type, :entity_id, :description, :ip)");
            $logStmt->execute([
                ':user_id' => $data['coordinator_id'],
                ':action' => 'partnership_request_sent',
                ':entity_type' => 'partnership_request',
                ':entity_id' => $partnerId,
                ':description' => "Sent partnership request to vendor ID: {$data['vendor_id']}",
                ':ip' => $_SERVER['REMOTE_ADDR'] ?? null
            ]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Partnership request sent',
                'data' => ['id' => $partnerId]
            ]);
            
        } else if ($action === 'respond') {
            // Respond to partnership request (accept/reject)
            if (empty($data['id']) || empty($data['status'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Missing id or status']);
                exit;
            }
            
            $validStatuses = ['accepted', 'rejected'];
            if (!in_array($data['status'], $validStatuses)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid status']);
                exit;
            }
            
            $sql = "UPDATE partnership_requests SET status = :status, responded_at = NOW() WHERE id = :id";
            $stmt = $conn->prepare($sql);
            $stmt->execute([
                ':id' => $data['id'],
                ':status' => $data['status']
            ]);
            
            // If accepted, add to coordinator_vendors affiliation table
            if ($data['status'] === 'accepted') {
                $requestStmt = $conn->prepare("SELECT coordinator_id, vendor_id, commission_rate FROM partnership_requests WHERE id = :id");
                $requestStmt->execute([':id' => $data['id']]);
                $request = $requestStmt->fetch(PDO::FETCH_ASSOC);
                
                if ($request) {
                    $conn->prepare("INSERT IGNORE INTO coordinator_vendors (coordinator_id, vendor_id, commission_rate) VALUES (:cid, :vid, :rate)")
                        ->execute([
                            ':cid' => $request['coordinator_id'],
                            ':vid' => $request['vendor_id'],
                            ':rate' => $request['commission_rate']
                        ]);
                    
                    // Log activity for partnership acceptance
                    $logStmt = $conn->prepare("INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, ip_address) VALUES (:user_id, :action, :entity_type, :entity_id, :description, :ip)");
                    $logStmt->execute([
                        ':user_id' => $request['vendor_id'],
                        ':action' => 'partnership_accepted',
                        ':entity_type' => 'partnership_request',
                        ':entity_id' => $data['id'],
                        ':description' => "Accepted partnership with coordinator ID: {$request['coordinator_id']}",
                        ':ip' => $_SERVER['REMOTE_ADDR'] ?? null
                    ]);
                }
            } else {
                // Log rejection
                $logStmt = $conn->prepare("INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, ip_address) VALUES (:user_id, :action, :entity_type, :entity_id, :description, :ip)");
                $logStmt->execute([
                    ':user_id' => $data['responder_id'] ?? 0,
                    ':action' => 'partnership_rejected',
                    ':entity_type' => 'partnership_request',
                    ':entity_id' => $data['id'],
                    ':description' => "Rejected partnership request ID: {$data['id']}",
                    ':ip' => $_SERVER['REMOTE_ADDR'] ?? null
                ]);
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'Partnership request ' . $data['status']
            ]);
        }
    }
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => $e->getMessage()
    ]);
}
