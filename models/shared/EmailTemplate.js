const Verification_Email_Template = `
 <!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verify Your Email</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            color: #111;
        }
        .container {
            max-width: 600px;
            margin: 30px auto;
            background: #ffffff;
            border-radius: 8px;
            border: 1px solid #ccc;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
            overflow: hidden;
        }
        .header {
            background-color: #000;
            color: #fff;
            padding: 20px;
            text-align: center;
            font-size: 24px;
            font-weight: bold;
        }
        .content {
            padding: 25px;
            color: #222;
            line-height: 1.7;
        }
        .verification-code {
            display: block;
            margin: 20px 0;
            font-size: 40px;
            color: #000;

            padding: 12px;

             font-weight: bold;
            letter-spacing: 1.5px; 
        }
        .footer {
            background-color: #f1f1f1;
            padding: 15px;
            text-align: center;
            color: #666;
            font-size: 12px;
            border-top: 1px solid #ccc;
        }
        p {
            margin: 0 0 15px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">Verify Your Email</div>
        <div class="content">
            <p>Hello,</p>
            <p>Thank you for signing up! Please confirm your email address by entering the code below:</p>
            <span class="verification-code">{verificationCode}</span>
            <p>If you did not create an account, no further action is required. If you have any questions, feel free to contact our support team.</p>
        </div>
        <div class="footer">
            <p>&copy; 2025 Your Company. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;

const Welcome_Email_Template = `
 <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Welcome to Our Community</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      color: #111;
    }

    .container {
      max-width: 600px;
      margin: 30px auto;
      background: #ffffff;
      border-radius: 8px;
      border: 1px solid #ccc;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .header {
      background-color: #000;
      color: #fff;
      padding: 20px;
      text-align: center;
      font-size: 26px;
      font-weight: bold;
    }

    .content {
      padding: 25px 30px;
      line-height: 1.7;
      font-size: 16px;
    }

    .welcome-message {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
    }

    ul {
      padding-left: 20px;
      margin-bottom: 20px;
    }

    ul li {
      margin-bottom: 10px;
    }

    .button {
      display: inline-block;
      padding: 12px 25px;
      background-color: #000;
      color: white;
      text-decoration: none;
      border-radius: 5px;
      font-size: 16px;
      font-weight: bold;
      transition: background-color 0.3s ease;
    }

    .button:hover {
      background-color: #333;
    }

    .footer {
      background-color: #f7f7f7;
      padding: 15px;
      text-align: center;
      color: #777;
      font-size: 12px;
      border-top: 1px solid #ccc;
    }

    p {
      margin-bottom: 15px;
    }

    @media (max-width: 600px) {
      .content {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">Welcome to Our Community!</div>
    <div class="content">
      <p class="welcome-message">Hello {name},</p>
      <p>We’re excited to have you here. Your registration is complete, and you’re all set to explore everything we offer.</p>
      <p>To help you get started, here are a few suggestions:</p>
      <ul>
        <li>Explore features and tailor your experience.</li>
        <li>Read our blog for insights and updates.</li>
        <li>Contact support if you have questions or need help.</li>
      </ul>
      <p>We're here to support you every step of the way.</p>

    <p style="text-align: center;">
        <a href="https://www.devoutgrowth.com/" class="button">Get Started</a>
    </p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} Your Company. All rights reserved.</p>
    </div>
  </div>
</body>
</html>

`;

module.exports = {
  Verification_Email_Template,
  Welcome_Email_Template,
};
