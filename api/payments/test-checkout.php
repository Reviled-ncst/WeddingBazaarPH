<?php
/**
 * Test Checkout Page
 * Simulates PayMongo e-wallet checkout for testing
 * 
 * Test Cards:
 * - 4343434343434345 = Success
 * - 4444444444444442 = Declined
 * - 4000000000000002 = Insufficient funds
 */

require_once '../config/paymongo.php';

$sourceId = $_GET['source_id'] ?? '';
$action = $_POST['action'] ?? '';

// Handle form submission
if ($action === 'pay') {
    $cardNumber = preg_replace('/\s+/', '', $_POST['card_number'] ?? '');
    
    // Simulate card validation
    if ($cardNumber === '4343434343434345') {
        // Success - mark source as chargeable
        markTestSourceChargeable($sourceId);
        $status = 'success';
        $message = 'Payment successful! You can close this window.';
    } elseif ($cardNumber === '4444444444444442') {
        // Declined
        $status = 'declined';
        $message = 'Card declined. Please try another card.';
    } elseif ($cardNumber === '4000000000000002') {
        // Insufficient funds
        $status = 'insufficient';
        $message = 'Insufficient funds. Please try another card.';
    } elseif (strlen($cardNumber) < 16) {
        // Invalid card number
        $status = 'invalid';
        $message = 'Invalid card number. Please enter 16 digits.';
    } else {
        // Unknown card - treat as declined
        $status = 'declined';
        $message = 'Card not recognized. Use test card: 4343 4343 4343 4345';
    }
}

// Get source info from file storage
$storageFile = sys_get_temp_dir() . '/paymongo_test_sources.json';
$testSources = [];
if (file_exists($storageFile)) {
    $testSources = json_decode(file_get_contents($storageFile), true) ?: [];
}
$storedSource = $testSources[$sourceId] ?? null;
$amount = $storedSource ? number_format($storedSource['amount'] / 100, 2) : '0.00';
$paymentType = $storedSource['type'] ?? 'gcash';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Test Payment - Wedding Bazaar</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: #0f0f23;
            border: 1px solid #2d2d44;
            border-radius: 16px;
            padding: 32px;
            max-width: 400px;
            width: 100%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }
        .logo {
            text-align: center;
            margin-bottom: 24px;
        }
        .logo h1 {
            color: #ec4899;
            font-size: 24px;
        }
        .logo p {
            color: #6b7280;
            font-size: 14px;
            margin-top: 4px;
        }
        .amount-box {
            background: #1a1a2e;
            border-radius: 12px;
            padding: 20px;
            text-align: center;
            margin-bottom: 24px;
        }
        .amount-label {
            color: #9ca3af;
            font-size: 14px;
            margin-bottom: 8px;
        }
        .amount-value {
            color: #ec4899;
            font-size: 32px;
            font-weight: bold;
        }
        .payment-method {
            display: flex;
            align-items: center;
            gap: 12px;
            background: #1a1a2e;
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 24px;
        }
        .payment-icon {
            width: 48px;
            height: 48px;
            background: #007dfe;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            font-size: 12px;
        }
        .payment-info h3 {
            color: white;
            font-size: 16px;
        }
        .payment-info p {
            color: #6b7280;
            font-size: 12px;
        }
        .form-group {
            margin-bottom: 16px;
        }
        .form-group label {
            display: block;
            color: #9ca3af;
            font-size: 14px;
            margin-bottom: 8px;
        }
        .form-group input {
            width: 100%;
            padding: 14px 16px;
            background: #1a1a2e;
            border: 1px solid #2d2d44;
            border-radius: 8px;
            color: white;
            font-size: 16px;
            letter-spacing: 2px;
        }
        .form-group input:focus {
            outline: none;
            border-color: #ec4899;
        }
        .form-row {
            display: flex;
            gap: 12px;
        }
        .form-row .form-group {
            flex: 1;
        }
        .btn {
            width: 100%;
            padding: 16px;
            border: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
        }
        .btn-primary {
            background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
            color: white;
        }
        .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 20px rgba(236, 72, 153, 0.4);
        }
        .test-info {
            background: #1e3a5f;
            border: 1px solid #3b82f6;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 24px;
        }
        .test-info h4 {
            color: #60a5fa;
            font-size: 14px;
            margin-bottom: 8px;
        }
        .test-info p {
            color: #93c5fd;
            font-size: 12px;
            line-height: 1.5;
        }
        .test-info code {
            background: #0f172a;
            padding: 2px 6px;
            border-radius: 4px;
            font-family: monospace;
        }
        .alert {
            padding: 16px;
            border-radius: 8px;
            margin-bottom: 24px;
            text-align: center;
        }
        .alert-success {
            background: #064e3b;
            border: 1px solid #10b981;
            color: #6ee7b7;
        }
        .alert-error {
            background: #450a0a;
            border: 1px solid #ef4444;
            color: #fca5a5;
        }
        .success-icon {
            font-size: 48px;
            margin-bottom: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">
            <h1>💒 Wedding Bazaar</h1>
            <p>Test Payment Gateway</p>
        </div>

        <?php if (isset($status) && $status === 'success'): ?>
            <div class="alert alert-success">
                <div class="success-icon">✓</div>
                <strong>Payment Successful!</strong>
                <p style="margin-top: 8px;">You can close this window and return to Wedding Bazaar.</p>
            </div>
            <script>
                // Auto-close after 3 seconds
                setTimeout(() => {
                    window.close();
                }, 3000);
            </script>
        <?php elseif (isset($status)): ?>
            <div class="alert alert-error">
                <strong><?php echo htmlspecialchars($message); ?></strong>
            </div>
        <?php endif; ?>

        <?php if (!isset($status) || $status !== 'success'): ?>
            <div class="amount-box">
                <div class="amount-label">Total Amount</div>
                <div class="amount-value">₱<?php echo $amount; ?></div>
            </div>

            <div class="payment-method">
                <div class="payment-icon">
                    <?php echo strtoupper(substr($paymentType, 0, 2)); ?>
                </div>
                <div class="payment-info">
                    <h3><?php echo $paymentType === 'gcash' ? 'GCash' : 'GrabPay'; ?></h3>
                    <p>E-Wallet Payment</p>
                </div>
            </div>

            <div class="test-info">
                <h4>🧪 Test Mode</h4>
                <p>
                    Use test card: <code>4343 4343 4343 4345</code><br>
                    For decline: <code>4444 4444 4444 4442</code>
                </p>
            </div>

            <form method="POST">
                <input type="hidden" name="action" value="pay">
                
                <div class="form-group">
                    <label>Card Number</label>
                    <input type="text" name="card_number" placeholder="4343 4343 4343 4345" maxlength="19" 
                           pattern="[\d\s]+" required autofocus
                           oninput="this.value = this.value.replace(/[^\d\s]/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').trim()">
                </div>

                <div class="form-row">
                    <div class="form-group">
                        <label>Expiry</label>
                        <input type="text" name="expiry" placeholder="12/28" maxlength="5" required
                               oninput="this.value = this.value.replace(/[^\d]/g, '').replace(/(\d{2})(\d)/, '$1/$2')">
                    </div>
                    <div class="form-group">
                        <label>CVV</label>
                        <input type="text" name="cvv" placeholder="123" maxlength="4" required
                               oninput="this.value = this.value.replace(/[^\d]/g, '')">
                    </div>
                </div>

                <button type="submit" class="btn btn-primary">
                    Pay ₱<?php echo $amount; ?>
                </button>
            </form>
        <?php endif; ?>
    </div>
</body>
</html>