import { NextResponse } from "next/server";
import twilio from "twilio";

const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;

export async function GET() {
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const apiKey = process.env.TWILIO_API_KEY;
    const apiSecret = process.env.TWILIO_API_SECRET;
    const twimlAppSid = process.env.TWILIO_TWIML_APP_SID;

    if (!accountSid || !apiKey || !apiSecret || !twimlAppSid) {
      console.error("Environment variables check failed:", {
        accountSid: accountSid ? `Present (len: ${accountSid.length})` : "MISSING",
        apiKey: apiKey ? `Present (len: ${apiKey.length})` : "MISSING",
        apiSecret: apiSecret ? `Present (len: ${apiSecret.length})` : "MISSING",
        twimlAppSid: twimlAppSid ? `Present (len: ${twimlAppSid.length})` : "MISSING",
      });
      return NextResponse.json(
        { error: "Missing Twilio credentials in environment variables" },
        { status: 500 }
      );
    }

    // Safety check for common mistakes
    if (apiSecret.startsWith("SK")) {
      console.error("ERROR: TWILIO_API_SECRET should not start with 'SK'. That is the API Key SID.");
    }
    if (apiKey.startsWith("AC")) {
      console.error("ERROR: TWILIO_API_KEY should start with 'SK', not 'AC'.");
    }

    const identity = `dialer-user-${Date.now()}`;

    const voiceGrant = new VoiceGrant({
      outgoingApplicationSid: twimlAppSid,
      incomingAllow: true,
    });

    const token = new AccessToken(accountSid, apiKey, apiSecret, {
      identity: identity,
      ttl: 3600,
    });

    token.addGrant(voiceGrant);
    console.log("Token generated successfully for identity:", identity);

    return NextResponse.json({
      token: token.toJwt(),
      identity: identity,
    });
  } catch (error: any) {
    console.error("Token generation error:", error.message || error);
    return NextResponse.json(
      { error: `Token generation failed: ${error.message || "Unknown error"}` },
      { status: 500 }
    );
  }
}
