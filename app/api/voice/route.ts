import { NextRequest, NextResponse } from "next/server";
import twilio from "twilio";

const VoiceResponse = twilio.twiml.VoiceResponse;

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    let to: string | null = null;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await req.text();
      const params = new URLSearchParams(formData);
      to = params.get("To");
    } else if (contentType.includes("application/json")) {
      const body = await req.json();
      to = body.To;
    } else {
      // Try form data as default (Twilio sends form-encoded)
      const formData = await req.text();
      const params = new URLSearchParams(formData);
      to = params.get("To");
    }

    const twiml = new VoiceResponse();
    const callerId = process.env.TWILIO_PHONE_NUMBER;

    if (to && to.length > 0) {
      // Clean the number — ensure E.164 format
      const cleanNumber = to.startsWith("+") ? to : `+1${to.replace(/\D/g, "")}`;

      const dial = twiml.dial({
        callerId: callerId,
        answerOnBridge: true,
        timeout: 30,
      });

      dial.number(cleanNumber);
    } else {
      twiml.say("No phone number was provided. Please try again.");
    }

    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
      },
    });
  } catch (error) {
    console.error("Voice TwiML error:", error);
    const twiml = new VoiceResponse();
    twiml.say("An application error has occurred. Please try again later.");

    return new NextResponse(twiml.toString(), {
      status: 200,
      headers: {
        "Content-Type": "text/xml",
      },
    });
  }
}

// Also handle GET for testing
export async function GET() {
  const twiml = new VoiceResponse();
  twiml.say("This endpoint is working. Use POST for voice calls.");

  return new NextResponse(twiml.toString(), {
    status: 200,
    headers: {
      "Content-Type": "text/xml",
    },
  });
}
