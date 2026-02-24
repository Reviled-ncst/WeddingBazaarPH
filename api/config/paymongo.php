<?php
/**
 * PayMongo Configuration
 * 
 * Get your API keys from: https://dashboard.paymongo.com/developers
 * Use TEST keys for sandbox, LIVE keys for production
 * 
 * REQUIRED ENVIRONMENT VARIABLES:
 * - PAYMONGO_SECRET_KEY: Your PayMongo secret key (sk_test_* or sk_live_*)
 * - PAYMONGO_PUBLIC_KEY: Your PayMongo public key (pk_test_* or pk_live_*)
 */

// PayMongo API Keys - MUST be set as environment variables
define('PAYMONGO_SECRET_KEY', getenv('PAYMONGO_SECRET_KEY') ?: '');
define('PAYMONGO_PUBLIC_KEY', getenv('PAYMONGO_PUBLIC_KEY') ?: '');

// Test Mode - Set PAYMONGO_TEST_MODE=true to simulate responses without real API
// When false (default), actual PayMongo API calls are made
// PayMongo sandbox test cards: 4120000000000007 (Visa), 5435930000000039 (MC)
define('PAYMONGO_TEST_MODE', getenv('PAYMONGO_TEST_MODE') === 'true');

// PayMongo API Base URL
define('PAYMONGO_API_URL', 'https://api.paymongo.com/v1');

// Application URLs (use environment variables in production)
define('APP_URL', getenv('FRONTEND_URL') ?: 'http://localhost:3000');
define('API_URL', getenv('API_URL') ?: 'http://localhost/wedding-bazaar-api');

// Payment success/failure redirect URLs
define('PAYMENT_SUCCESS_URL', APP_URL . '/payment/success');
define('PAYMENT_CANCEL_URL', APP_URL . '/payment/cancel');

/**
 * Make authenticated request to PayMongo API
 */
function paymongoRequest($endpoint, $method = 'GET', $data = null) {
    // If test mode, return simulated responses
    if (PAYMONGO_TEST_MODE) {
        return simulatePaymongoResponse($endpoint, $method, $data);
    }
    
    $url = PAYMONGO_API_URL . $endpoint;
    
    $headers = [
        'Authorization: Basic ' . base64_encode(PAYMONGO_SECRET_KEY . ':'),
        'Content-Type: application/json',
        'Accept: application/json',
    ];
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
    
    if ($method === 'POST') {
        curl_setopt($ch, CURLOPT_POST, true);
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
    }
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);
    
    if ($error) {
        return ['error' => true, 'message' => $error];
    }
    
    $decoded = json_decode($response, true);
    $decoded['http_code'] = $httpCode;
    
    return $decoded;
}

/**
 * Create a PayMongo Checkout Session
 * 
 * @param array $params
 *   - amount: Amount in centavos (PHP * 100)
 *   - description: Payment description
 *   - booking_id: Reference ID
 *   - customer_email: Customer email
 *   - customer_name: Customer name
 */
function createCheckoutSession($params) {
    $payload = [
        'data' => [
            'attributes' => [
                'billing' => [
                    'name' => $params['customer_name'] ?? 'Customer',
                    'email' => $params['customer_email'] ?? null,
                ],
                'send_email_receipt' => true,
                'show_description' => true,
                'show_line_items' => true,
                'line_items' => [
                    [
                        'currency' => 'PHP',
                        'amount' => (int)$params['amount'], // Amount in centavos
                        'description' => $params['description'] ?? 'Wedding Service Booking',
                        'name' => $params['service_name'] ?? 'Service Booking',
                        'quantity' => 1,
                    ]
                ],
                'payment_method_types' => [
                    'gcash',
                    'grab_pay',
                    'paymaya',
                    'card',
                    'dob', // Direct Online Banking
                    'dob_ubp', // UnionBank
                    'brankas_bdo',
                    'brankas_landbank',
                    'brankas_metrobank',
                ],
                'reference_number' => 'BOOKING-' . $params['booking_id'],
                'success_url' => PAYMENT_SUCCESS_URL . '?booking_id=' . $params['booking_id'],
                'cancel_url' => PAYMENT_CANCEL_URL . '?booking_id=' . $params['booking_id'],
                'description' => $params['description'] ?? 'Wedding Service Booking Payment',
            ]
        ]
    ];
    
    return paymongoRequest('/checkout_sessions', 'POST', $payload);
}

/**
 * Retrieve a Checkout Session
 */
function getCheckoutSession($sessionId) {
    return paymongoRequest('/checkout_sessions/' . $sessionId);
}

/**
 * Convert PHP amount to centavos
 */
function toCentavos($amount) {
    return (int)($amount * 100);
}

/**
 * Convert centavos to PHP amount
 */
function fromCentavos($centavos) {
    return $centavos / 100;
}

/**
 * Create a PayMongo Source (for GCash, GrabPay, etc.)
 * Sources are used for e-wallet payments
 * 
 * @param array $params
 *   - amount: Amount in centavos
 *   - type: 'gcash' | 'grab_pay'
 *   - booking_id: Reference ID
 *   - description: Payment description
 */
function createSource($params) {
    $payload = [
        'data' => [
            'attributes' => [
                'amount' => (int)$params['amount'],
                'currency' => 'PHP',
                'type' => $params['type'],
                'redirect' => [
                    'success' => APP_URL . '/payment/success?booking_id=' . $params['booking_id'],
                    'failed' => APP_URL . '/payment/failed?booking_id=' . $params['booking_id'],
                ],
                'billing' => [
                    'name' => $params['customer_name'] ?? 'Customer',
                    'email' => $params['customer_email'] ?? null,
                ],
            ]
        ]
    ];
    
    return paymongoRequest('/sources', 'POST', $payload);
}

/**
 * Get Source status
 */
function getSource($sourceId) {
    return paymongoRequest('/sources/' . $sourceId);
}

/**
 * Create a Payment from a Source (after source is chargeable)
 */
function createPaymentFromSource($params) {
    $payload = [
        'data' => [
            'attributes' => [
                'amount' => (int)$params['amount'],
                'currency' => 'PHP',
                'description' => $params['description'] ?? 'Wedding Bazaar Booking',
                'source' => [
                    'id' => $params['source_id'],
                    'type' => 'source'
                ],
            ]
        ]
    ];
    
    return paymongoRequest('/payments', 'POST', $payload);
}

/**
 * Create a Payment Intent (for card payments)
 */
function createPaymentIntent($params) {
    $payload = [
        'data' => [
            'attributes' => [
                'amount' => (int)$params['amount'],
                'currency' => 'PHP',
                'payment_method_allowed' => ['card', 'gcash', 'grab_pay', 'paymaya'],
                'payment_method_options' => [
                    'card' => ['request_three_d_secure' => 'any']
                ],
                'description' => $params['description'] ?? 'Wedding Bazaar Booking',
                'statement_descriptor' => 'WeddingBazaar',
                'metadata' => [
                    'booking_id' => $params['booking_id'] ?? null
                ]
            ]
        ]
    ];
    
    return paymongoRequest('/payment_intents', 'POST', $payload);
}

/**
 * Get Payment Intent status
 */
function getPaymentIntent($intentId) {
    return paymongoRequest('/payment_intents/' . $intentId);
}

/**
 * Get Payment details
 */
function getPayment($paymentId) {
    return paymongoRequest('/payments/' . $paymentId);
}

/**
 * Simulate PayMongo API responses for testing
 * This allows testing payment flow without real API keys
 */
function simulatePaymongoResponse($endpoint, $method, $data) {
    // Use file storage for test sources (more reliable than sessions)
    $storageFile = sys_get_temp_dir() . '/paymongo_test_sources.json';
    $testSources = [];
    if (file_exists($storageFile)) {
        $testSources = json_decode(file_get_contents($storageFile), true) ?: [];
    }
    
    // Generate unique IDs
    $uniqueId = 'src_test_' . bin2hex(random_bytes(12));
    
    // Create Source endpoint
    if (strpos($endpoint, '/sources') !== false && $method === 'POST') {
        $type = $data['data']['attributes']['type'] ?? 'gcash';
        $amount = $data['data']['attributes']['amount'] ?? 0;
        
        // Store source for later status checks
        $testSources[$uniqueId] = [
            'status' => 'pending', // Will become 'chargeable' after simulated auth
            'amount' => $amount,
            'type' => $type,
            'created_at' => time(),
        ];
        file_put_contents($storageFile, json_encode($testSources));
        
        return [
            'data' => [
                'id' => $uniqueId,
                'type' => 'source',
                'attributes' => [
                    'amount' => $amount,
                    'currency' => 'PHP',
                    'type' => $type,
                    'status' => 'pending',
                    'redirect' => [
                        'checkout_url' => API_URL . '/payments/test-checkout.php?source_id=' . $uniqueId,
                        'success' => $data['data']['attributes']['redirect']['success'] ?? '',
                        'failed' => $data['data']['attributes']['redirect']['failed'] ?? '',
                    ],
                ],
            ],
            'http_code' => 200,
        ];
    }
    
    // Get Source status endpoint
    if (preg_match('/\/sources\/(.+)/', $endpoint, $matches) && $method === 'GET') {
        $sourceId = $matches[1];
        
        // Reload storage
        if (file_exists($storageFile)) {
            $testSources = json_decode(file_get_contents($storageFile), true) ?: [];
        }
        
        $storedSource = $testSources[$sourceId] ?? null;
        
        if (!$storedSource) {
            return [
                'errors' => [['code' => 'resource_not_found', 'detail' => 'Source not found']],
                'http_code' => 404,
            ];
        }
        
        return [
            'data' => [
                'id' => $sourceId,
                'type' => 'source',
                'attributes' => [
                    'amount' => $storedSource['amount'],
                    'currency' => 'PHP',
                    'type' => $storedSource['type'],
                    'status' => $storedSource['status'],
                ],
            ],
            'http_code' => 200,
        ];
    }
    
    // Create Payment from Source endpoint
    if (strpos($endpoint, '/payments') !== false && $method === 'POST') {
        $sourceId = $data['data']['attributes']['source']['id'] ?? '';
        $amount = $data['data']['attributes']['amount'] ?? 0;
        
        // Mark source as paid
        if (file_exists($storageFile)) {
            $testSources = json_decode(file_get_contents($storageFile), true) ?: [];
        }
        if (isset($testSources[$sourceId])) {
            $testSources[$sourceId]['status'] = 'paid';
            file_put_contents($storageFile, json_encode($testSources));
        }
        
        $paymentId = 'pay_test_' . bin2hex(random_bytes(12));
        
        return [
            'data' => [
                'id' => $paymentId,
                'type' => 'payment',
                'attributes' => [
                    'amount' => $amount,
                    'currency' => 'PHP',
                    'status' => 'paid',
                    'source' => ['id' => $sourceId, 'type' => 'source'],
                ],
            ],
            'http_code' => 200,
        ];
    }
    
    // Default response
    return [
        'data' => null,
        'http_code' => 200,
    ];
}

/**
 * Mark a test source as chargeable (simulates user completing payment)
 */
function markTestSourceChargeable($sourceId) {
    $storageFile = sys_get_temp_dir() . '/paymongo_test_sources.json';
    $testSources = [];
    if (file_exists($storageFile)) {
        $testSources = json_decode(file_get_contents($storageFile), true) ?: [];
    }
    
    if (isset($testSources[$sourceId])) {
        $testSources[$sourceId]['status'] = 'chargeable';
        file_put_contents($storageFile, json_encode($testSources));
        return true;
    }
    return false;
}
