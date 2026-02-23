<?php
// Get all pending verifications from both vendors and coordinators

require_once __DIR__ . '/../config/database.php';

setJsonHeader();
setCorsHeaders();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    sendError('Method not allowed', 405);
}

$pdo = getDBConnection();

// Get status filter from query params
$statusFilter = isset($_GET['status']) ? $_GET['status'] : 'all';
$typeFilter = isset($_GET['type']) ? $_GET['type'] : 'all';

try {
    $verifications = [];
    
    // Build status condition
    $statusCondition = '';
    if ($statusFilter !== 'all' && in_array($statusFilter, ['unverified', 'pending', 'verified', 'rejected'])) {
        // Map frontend status names to db values
        $dbStatus = $statusFilter;
        if ($statusFilter === 'approved') $dbStatus = 'verified';
        $statusCondition = "AND v.verification_status = '$dbStatus'";
    }
    
    // Fetch vendors with pending/submitted verifications
    if ($typeFilter === 'all' || $typeFilter === 'vendor') {
        $vendorQuery = "
            SELECT 
                v.id,
                v.user_id,
                v.business_name,
                v.category,
                v.verification_status,
                v.verification_documents,
                v.verification_notes,
                v.verified_at,
                v.created_at,
                v.updated_at,
                u.name as user_name,
                u.email as user_email,
                'vendor' as type
            FROM vendors v
            JOIN users u ON v.user_id = u.id
            WHERE v.verification_documents IS NOT NULL 
            AND v.verification_documents != '[]'
            AND v.verification_documents != ''
            $statusCondition
            ORDER BY 
                CASE v.verification_status 
                    WHEN 'pending' THEN 1 
                    WHEN 'unverified' THEN 2
                    WHEN 'rejected' THEN 3 
                    WHEN 'verified' THEN 4 
                END,
                v.updated_at DESC
        ";
        
        $stmt = $pdo->query($vendorQuery);
        $vendors = $stmt->fetchAll();
        
        foreach ($vendors as $vendor) {
            $docs = [];
            if ($vendor['verification_documents']) {
                $docs = json_decode($vendor['verification_documents'], true) ?? [];
            }
            
            $verifications[] = [
                'id' => (int)$vendor['id'],
                'user_id' => (int)$vendor['user_id'],
                'user_name' => $vendor['user_name'],
                'user_email' => $vendor['user_email'],
                'business_name' => $vendor['business_name'],
                'type' => 'vendor',
                'category' => $vendor['category'],
                'status' => mapStatus($vendor['verification_status']),
                'documents' => $docs,
                'submitted_at' => $vendor['updated_at'],
                'reviewed_at' => $vendor['verified_at'],
                'notes' => $vendor['verification_notes'],
            ];
        }
    }
    
    // Fetch coordinators with pending/submitted verifications
    if ($typeFilter === 'all' || $typeFilter === 'coordinator') {
        $coordinatorQuery = "
            SELECT 
                c.id,
                c.user_id,
                c.business_name,
                c.verification_status,
                c.verification_documents,
                c.verification_notes,
                c.verified_at,
                c.created_at,
                c.updated_at,
                u.name as user_name,
                u.email as user_email,
                'coordinator' as type
            FROM coordinators c
            JOIN users u ON c.user_id = u.id
            WHERE c.verification_documents IS NOT NULL 
            AND c.verification_documents != '[]'
            AND c.verification_documents != ''
            $statusCondition
            ORDER BY 
                CASE c.verification_status 
                    WHEN 'pending' THEN 1 
                    WHEN 'unverified' THEN 2
                    WHEN 'rejected' THEN 3 
                    WHEN 'verified' THEN 4 
                END,
                c.updated_at DESC
        ";
        
        $stmt = $pdo->query($coordinatorQuery);
        $coordinators = $stmt->fetchAll();
        
        foreach ($coordinators as $coordinator) {
            $docs = [];
            if ($coordinator['verification_documents']) {
                $docs = json_decode($coordinator['verification_documents'], true) ?? [];
            }
            
            $verifications[] = [
                'id' => (int)$coordinator['id'],
                'user_id' => (int)$coordinator['user_id'],
                'user_name' => $coordinator['user_name'],
                'user_email' => $coordinator['user_email'],
                'business_name' => $coordinator['business_name'],
                'type' => 'coordinator',
                'category' => null,
                'status' => mapStatus($coordinator['verification_status']),
                'documents' => $docs,
                'submitted_at' => $coordinator['updated_at'],
                'reviewed_at' => $coordinator['verified_at'],
                'notes' => $coordinator['verification_notes'],
            ];
        }
    }
    
    // Sort combined results by pending first
    usort($verifications, function($a, $b) {
        $statusOrder = ['pending' => 1, 'unverified' => 2, 'rejected' => 3, 'approved' => 4];
        $aOrder = $statusOrder[$a['status']] ?? 5;
        $bOrder = $statusOrder[$b['status']] ?? 5;
        if ($aOrder !== $bOrder) return $aOrder - $bOrder;
        return strtotime($b['submitted_at']) - strtotime($a['submitted_at']);
    });
    
    // Count by status
    $counts = [
        'all' => count($verifications),
        'pending' => count(array_filter($verifications, fn($v) => $v['status'] === 'pending')),
        'approved' => count(array_filter($verifications, fn($v) => $v['status'] === 'approved')),
        'rejected' => count(array_filter($verifications, fn($v) => $v['status'] === 'rejected')),
    ];
    
    sendResponse([
        'success' => true,
        'verifications' => $verifications,
        'counts' => $counts
    ]);
    
} catch (PDOException $e) {
    sendError('Database error: ' . $e->getMessage(), 500);
}

function mapStatus($dbStatus) {
    switch ($dbStatus) {
        case 'verified': return 'approved';
        case 'pending': return 'pending';
        case 'rejected': return 'rejected';
        default: return 'pending';
    }
}
?>
