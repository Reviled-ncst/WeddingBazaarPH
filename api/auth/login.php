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
$stmt = $pdo->prepare('SELECT id, email, password, name, role, phone, avatar FROM users WHERE email = ?');
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid email or password'
    ]);
    exit;
}

// Verify password
if (!password_verify($password, $user['password'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid email or password'
    ]);
    exit;
}

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
