module.exports = (tfaCode) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GlobiPay Verification</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f6f9;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            box-sizing: border-box;
        }
        .email-container {
            max-width: 500px;
            width: 100%;
            background-color: white;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            padding: 30px;
            text-align: center;
            border: 1px solid #e0e6ed;
        }
        .verification-title {
            color: #007BFF;
            margin-bottom: 15px;
        }
        .verification-code {
            background-color: #f0f4ff;
            border: 2px dashed #007BFF;
            color: #007BFF;
            font-size: 28px;
            font-weight: 700;
            padding: 15px 25px;
            border-radius: 8px;
            display: inline-block;
            letter-spacing: 4px;
            margin: 20px 0;
        }
        .instruction {
            color: #555;
            margin-bottom: 20px;
            line-height: 1.6;
        }
        .warning {
            font-size: 12px;
            color: #888;
            margin-top: 20px;
        }
        .footer {
            margin-top: 30px;
            color: #999;
            font-size: 11px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <h2 class="verification-title">Verify Your Account</h2>
        
        <p class="instruction">
            <strong>Security Verification</strong><br>
            To protect your account, we've sent a verification code that will expire in 5 minutes.
        </p>
        
        <div class="verification-code">
            ${tfaCode}
        </div>
        
        <p class="instruction">
            Enter this code on the verification page to complete your account security process.
            Do not share this code with anyone.
        </p>
        
        <p class="warning">
            If you did not request this verification, please contact our support immediately.
        </p>
        
        <div class="footer">
            © 2024 GlobiPay | Secure Verification Service
        </div>
    </div>
</body>
</html>
`;