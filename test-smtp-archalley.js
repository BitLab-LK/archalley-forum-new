// Test script to verify SMTP configuration
// Run with: node test-smtp-archalley.js

const nodemailer = require('nodemailer');

async function testSMTP() {
  console.log('🧪 Testing Archalley SMTP Configuration...\n');

  // Create transporter with Archalley settings
  const transporter = nodemailer.createTransporter({
    host: 'outlook.office365.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'alert@archalley.com',
      pass: 'rkwdhmhfmzgjvtjy'
    },
    tls: {
      ciphers: 'SSLv3'
    }
  });

  try {
    // Verify connection
    console.log('🔗 Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');

    // Send test email
    console.log('📧 Sending test email...');
    const testEmail = {
      from: '"Archalley Forum" <alert@archalley.com>',
      to: 'test@example.com', // Replace with your test email
      subject: 'Archalley Forum - SMTP Test Email',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; padding: 20px; border-bottom: 1px solid #eee;">
            <h1 style="color: #0066cc; margin: 0;">Archalley Forum</h1>
            <p style="color: #666; margin: 5px 0 0 0;">Professional Communication System</p>
          </div>
          
          <div style="padding: 30px 20px;">
            <h2 style="color: #333; margin-bottom: 20px;">SMTP Test Successful! ✅</h2>
            
            <p style="color: #555; line-height: 1.6; margin-bottom: 20px;">
              This test email confirms that your Archalley Forum SMTP configuration is working correctly.
            </p>
            
            <div style="background: #f8f9fa; border-left: 4px solid #0066cc; padding: 15px; margin: 20px 0;">
              <h3 style="margin: 0 0 10px 0; color: #333;">Configuration Details:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #666;">
                <li>SMTP Server: outlook.office365.com</li>
                <li>Port: 587 (STARTTLS)</li>
                <li>From Address: alert@archalley.com</li>
                <li>Authentication: App Password</li>
              </ul>
            </div>
            
            <p style="color: #555; line-height: 1.6;">
              Your forum is now ready to send professional email notifications for:
            </p>
            <ul style="color: #666; line-height: 1.8;">
              <li>Post like notifications</li>
              <li>Comment notifications</li>
              <li>Reply notifications</li>
              <li>Mention notifications</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="http://localhost:3000" style="background: #0066cc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                Visit Archalley Forum
              </a>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; border-top: 1px solid #eee; color: #999; font-size: 14px;">
            <p>This is an automated test email from Archalley Forum</p>
            <p>Timestamp: ${new Date().toISOString()}</p>
          </div>
        </div>
      `
    };

    const info = await transporter.sendMail(testEmail);
    console.log('✅ Test email sent successfully!');
    console.log('📨 Message ID:', info.messageId);
    console.log('📋 Response:', info.response);

  } catch (error) {
    console.error('❌ SMTP Test Failed:');
    console.error('Error:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('\n🔧 Authentication Error - Check:');
      console.log('   • App password is correct');
      console.log('   • 2FA is enabled on alert@archalley.com');
      console.log('   • Account is not locked');
    }
    
    if (error.code === 'ECONNECTION') {
      console.log('\n🔧 Connection Error - Check:');
      console.log('   • Internet connection');
      console.log('   • Firewall settings');
      console.log('   • SMTP server settings');
    }
  }
}

// Run the test
testSMTP().catch(console.error);
