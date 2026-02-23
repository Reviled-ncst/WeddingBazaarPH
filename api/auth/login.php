<?php
// Login endpoint for Wedding Bazaar

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../config/jwt.php';

// Set headers
setJsonHeader();
setCorsHeaders();

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
    exit;
}

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
if (!isset($input['email']) || !isset($input['password'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Missing required fields: email, password'
    ]);
    exit;
}

$email = trim($input['email']);
$password = $input['password'];

// Get client info for logging
$ipAddress = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';

// Helper function to log login attempt
function logLoginAttempt($pdo, $userId, $email, $success, $ipAddress, $userAgent, $failureReason = null) {
    try {
        $stmt = $pdo->prepare('
            INSERT INTO login_attempts (user_id, email, ip_address, user_agent, success, failure_reason, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())
        ');
        $stmt->execute([$userId, $email, $ipAddress, $userAgent, $success ? 1 : 0, $failureReason]);
    } catch (Exception $e) {
        // Silently fail - don't break login if logging fails
        error_log("Failed to log login attempt: " . $e->getMessage());
    }
}

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid email format'
    ]);
    exit;
}

// Get database connection
$pdo = getDBConnection();

// Find user by email
$stmt = $pdo->prepare('SELECT id, email, password, name, role, phone, avatar, status FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    // Log failed attempt - user not found
    logLoginAttempt($pdo, null, $email, false, $ipAddress, $userAgent, 'User not found');
    
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid email or password'
    ]);
    exit;
}

// Check if user is suspended
if (isset($user['status']) && $user['status'] === 'suspended') {
    logLoginAttempt($pdo, $user['id'], $email, false, $ipAddress, $userAgent, 'Account suspended');
    
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Your account has been suspended. Please contact support.'
    ]);
    exit;
}

// Verify password
if (!password_verify($password, $user['password'])) {
    // Log failed attempt - wrong password
    logLoginAttempt($pdo, $user['id'], $email, false, $ipAddress, $userAgent, 'Invalid password');
    
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid email or password'
    ]);
    exit;
}

// Log successful login
logLoginAttempt($pdo, $user['id'], $email, true, $ipAddress, $userAgent);

// Generate JWT token
$token = generateJWT($user['id'], $user['email'], $user['role']);

// Return success response
echo json_encode([
    'success' => true,
    'message' => 'Login successful',
    'token' => $token,
    'user' => [
        'id' => (int)$user['id'],
        'email' => $user['email'],
        'name' => $user['name'],
        'role' => $user['role'],
        'phone' => $user['phone'],
        'avatar' => $user['avatar']
    ]
]);
