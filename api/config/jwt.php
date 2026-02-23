<?php
// JWT Helper functions for Wedding Bazaar

require_once __DIR__ . '/database.php';

// Generate JWT token
function generateJWT($userId, $email, $role) {
    $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
    
    $payload = json_encode([
        'user_id' => $userId,
        'email' => $email,
        'role' => $role,
        'iat' => time(),
        'exp' => time() + (60 * 60 * 24 * 7) // 7 days
    ]);
    
    $base64Header = base64UrlEncode($header);
    $base64Payload = base64UrlEncode($payload);
    
    $signature = hash_hmac('sha256', $base64Header . '.' . $base64Payload, JWT_SECRET, true);
    $base64Signature = base64UrlEncode($signature);
    
    return $base64Header . '.' . $base64Payload . '.' . $base64Signature;
}

// Verify JWT token
function verifyJWT($token) {
    $parts = explode('.', $token);
    
    if (count($parts) !== 3) {
        return false;
    }
    
    list($base64Header, $base64Payload, $base64Signature) = $parts;
    
    // Verify signature
    $signature = hash_hmac('sha256', $base64Header . '.' . $base64Payload, JWT_SECRET, true);
    $expectedSignature = base64UrlEncode($signature);
    
    if (!hash_equals($expectedSignature, $base64Signature)) {
        return false;
    }
    
    // Decode payload
    $payload = json_decode(base64UrlDecode($base64Payload), true);
    
    // Check expiration
    if (isset($payload['exp']) && $payload['exp'] < time()) {
        return false;
    }
    
    return $payload;
}

// Get authenticated user from request
function getAuthUser() {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    if (empty($authHeader) || !preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        return null;
    }
    
    $token = $matches[1];
    return verifyJWT($token);
}

// Require authentication
function requireAuth() {
    $user = getAuthUser();
    
    if (!$user) {
        sendError('Unauthorized', 401);
    }
    
    return $user;
}

// Require vendor role
function requireVendor() {
    $user = requireAuth();
    
    if ($user['role'] !== 'vendor' && $user['role'] !== 'admin') {
        sendError('Access denied. Vendor role required.', 403);
    }
    
    return $user;
}

// Require admin role
function requireAdmin() {
    $user = requireAuth();
    
    if ($user['role'] !== 'admin') {
        sendError('Access denied. Admin role required.', 403);
    }
    
    return $user;
}

// Base64 URL encode
function base64UrlEncode($data) {
    return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
}

// Base64 URL decode
function base64UrlDecode($data) {
    return base64_decode(strtr($data, '-_', '+/') . str_repeat('=', 3 - (3 + strlen($data)) % 4));
}
