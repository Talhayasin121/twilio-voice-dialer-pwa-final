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
      console.error("Missing Twilio credentials:", {
        accountSid: !!accountSid,
        apiKey: !!apiKey,
        apiSecret: !!apiSecret,
        twimlAppSid: !!twimlAppSid,
      });
      return NextResponse.json(
        { error: "Missing Twilio credentials in environment variables" },
        { status: 500 }
      );
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
