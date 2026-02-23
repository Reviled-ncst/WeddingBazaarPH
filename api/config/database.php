<?php
// Database configuration for Wedding Bazaar

// Support Railway's MYSQL_URL or individual environment variables
$mysqlUrl = getenv('MYSQL_URL');

if ($mysqlUrl) {
    // Parse the MySQL URL (format: mysql://user:pass@host:port/database)
    $dbParts = parse_url($mysqlUrl);
    define('DB_HOST', $dbParts['host'] ?? 'localhost');
    define('DB_PORT', $dbParts['port'] ?? '3306');
    define('DB_USER', $dbParts['user'] ?? 'root');
    define('DB_PASS', $dbParts['pass'] ?? '');
    define('DB_NAME', ltrim($dbParts['path'] ?? '/railway', '/'));
} else {
    // Fallback to individual environment variables for local development
    define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
    define('DB_NAME', getenv('DB_NAME') ?: 'wedding_bazaar');
    define('DB_USER', getenv('DB_USER') ?: 'root');
    define('DB_PASS', getenv('DB_PASS') ?: '');
    define('DB_PORT', getenv('DB_PORT') ?: '3306');
}

// JWT Secret Key (set via environment in production!)
define('JWT_SECRET', getenv('JWT_SECRET') ?: 'your-super-secret-jwt-key-change-in-production');

// Frontend URL for CORS (set via environment in production!)
define('FRONTEND_URL', getenv('FRONTEND_URL') ?: 'http://localhost:3000');

// Create database connection
function getDBConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $pdo = new PDO(
            $dsn,
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
            ]
        );
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Database connection failed: ' . $e->getMessage()
        ]);
        exit;
    }
}

// Set JSON content type header
function setJsonHeader() {
    header('Content-Type: application/json');
}

// Set CORS headers for local development and production
function setCorsHeaders() {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowedOrigins = [
        'http://localhost:3000', 
        'http://localhost:3001',
        FRONTEND_URL
    ];
    
    // Also allow any Vercel preview URLs
    $isVercelPreview = preg_match('/\.vercel\.app$/', $origin);
    
    if (in_array($origin, $allowedOrigins) || $isVercelPreview) {
        header('Access-Control-Allow-Origin: ' . $origin);
    } else {
        header('Access-Control-Allow-Origin: ' . FRONTEND_URL);
    }
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    header('Access-Control-Allow-Credentials: true');
    
    // Handle preflight requests
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

// Get JSON input data
function getJsonInput() {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?? [];
}

// Send JSON response
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit;
}

// Send error response
function sendError($message, $statusCode = 400) {
    sendResponse([
        'success' => false,
        'message' => $message
    ], $statusCode);
}

// Send success response
function sendSuccess($data, $message = 'Success') {
    sendResponse([
        'success' => true,
        'message' => $message,
        'data' => $data
    ]);
}
