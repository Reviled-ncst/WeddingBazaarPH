<?php
// Registration endpoint for Wedding Bazaar

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
if (!isset($input['email']) || !isset($input['password']) || !isset($input['name']) || !isset($input['role'])) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Missing required fields: email, password, name, role'
    ]);
    exit;
}

$email = trim($input['email']);
$password = $input['password'];
$name = trim($input['name']);
$role = $input['role'];
$phone = isset($input['phone']) ? trim($input['phone']) : null;

// Validate email format
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid email format'
    ]);
    exit;
}

// Validate password length
if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Password must be at least 6 characters'
    ]);
    exit;
}

// Validate role
$validRoles = ['individual', 'vendor', 'coordinator'];
if (!in_array($role, $validRoles)) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid role. Must be one of: individual, vendor, coordinator'
    ]);
    exit;
}

// Get database connection
$pdo = getDBConnection();

// Check if email already exists
$stmt = $pdo->prepare('SELECT id FROM users WHERE email = ?');
$stmt->execute([$email]);

if ($stmt->fetch()) {
    http_response_code(409);
    echo json_encode([
        'success' => false,
        'message' => 'Email already registered'
    ]);
    exit;
}

// Hash password
$hashedPassword = password_hash($password, PASSWORD_DEFAULT);

// Insert new user
try {
    $stmt = $pdo->prepare('
        INSERT INTO users (email, password, name, role, phone, created_at)
        VALUES (?, ?, ?, ?, ?, NOW())
    ');
    $stmt->execute([$email, $hashedPassword, $name, $role, $phone]);
    
    $userId = $pdo->lastInsertId();
    
    // Generate JWT token
    $token = generateJWT($userId, $email, $role);
    
    // Return success response
    http_response_code(201);
    echo json_encode([
        'success' => true,
        'message' => 'Registration successful',
        'token' => $token,
        'user' => [
            'id' => (int)$userId,
            'email' => $email,
            'name' => $name,
            'role' => $role,
            'phone' => $phone
        ]
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Registration failed. Please try again.'
    ]);
}
