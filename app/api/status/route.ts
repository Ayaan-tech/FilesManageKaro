import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    return NextResponse.json({
        status: "API is running",
        timestamp: new Date().toISOString(),
        env: {
            hasAwsKey: !!process.env.AWS_ACCESS_KEY,
            hasAwsSecret: !!process.env.AWS_SECRET_KEY,
            region: process.env.AWS_REGION
        }
    });
}