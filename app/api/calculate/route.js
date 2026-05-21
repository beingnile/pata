import { NextResponse } from 'next/server';
import { calculatePayslip } from '@/lib/tax';
import { rateLimit, getClientIp, schemas } from '@/lib/security';

export async function POST(request) {
  const ip = getClientIp(request);
  const limit = rateLimit(ip, 'calculate', 20); // 20 calculations per minute

  if (!limit.allowed) {
    return NextResponse.json(
      { error: 'Too many requests. Slow down.' },
      { status: 429, headers: { 'X-RateLimit-Reset': String(limit.resetAt) } }
    );
  }

  try {
    const body = await request.json();

    const parsed = schemas.payslipInput.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid input. Gross salary must be between 0 and 50,000,000 KSH.' },
        { status: 400 }
      );
    }

    const result = calculatePayslip(parsed.data);

    return NextResponse.json({ success: true, data: result });
  } catch (err) {
    console.error('Calculation error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
