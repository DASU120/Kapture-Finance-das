const express = require('express');
const cors = require('cors');
const app = express();
app.use(express.json());

app.use(cors());
require('dotenv').config();

// Main Webhook Endpoint for Vapi
app.post('/webhook', (req, res) => {
  const { message } = req.body;

  // Handle Tool Calls from Vapi
  if (message && message.type === 'tool-calls') {
    const results = [];
    
    for (const toolCall of message.toolCalls) {
      const { name, arguments: argsStr } = toolCall.function;
      // Vapi sometimes sends arguments as a string, sometimes as an object
      const args = typeof argsStr === 'string' ? JSON.parse(argsStr) : argsStr;
      const callId = toolCall.id;

      console.log(`[Tool Call Received]: ${name}`, args);
      let result = {};

      switch (name) {
        case 'verify_customer':
          // Mock verification check (accepts '1234' or '1995' as valid for demo)
          if (['1234', '1995', '85'].includes(args.verification_code)) {
            result = { verified: true, message: "Identity verified successfully.", customer_name: "Rahul Sharma" };
          } else {
            result = { verified: false, message: "Verification failed. Incorrect code." };
          }
          break;

        case 'log_promise_to_pay':
          result = {
            success: true,
            ptp_id: `PTP-${Math.floor(1000 + Math.random() * 9000)}`,
            confirmed_date: args.ptp_date,
            amount: args.amount
          };
          break;

        case 'send_payment_link':
          result = {
            success: true,
            message: `Payment link sent successfully via ${args.channel} to registered mobile number.`
          };
          break;

        case 'escalate_to_agent':
          result = {
            success: true,
            escalation_id: `ESC-${Math.floor(100 + Math.random() * 900)}`,
            reason: args.reason
          };
          break;

        case 'mark_disposition':
          result = {
            success: true,
            disposition_logged: args.status,
            timestamp: new Date().toISOString()
          };
          break;

        default:
          result = { success: false, message: "Unknown function call" };
      }

      results.push({
        toolCallId: callId,
        result: JSON.stringify(result)
      });
    }

    return res.status(200).json({ results });
  }

  // Fallback response for other Vapi event notifications
  return res.status(200).json({ status: "acknowledged" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Kapture Server running on port ${PORT}....`);
});