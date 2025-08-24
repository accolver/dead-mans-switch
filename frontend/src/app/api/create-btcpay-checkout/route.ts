import { NEXT_PUBLIC_SITE_URL } from "@/lib/env";
import { getCryptoPaymentProvider } from "@/lib/payment";
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const amount = Number(searchParams.get("amount"));
    const currency = (searchParams.get("currency") || "BTC").toUpperCase();
    const mode = (searchParams.get("mode") || "payment") as
        | "payment"
        | "subscription";
    const redirectAfterAuth = searchParams.get("redirect_after_auth");

    if (!amount || !redirectAfterAuth) {
        return NextResponse.redirect(`${NEXT_PUBLIC_SITE_URL}/pricing`);
    }

    return createBTCPayCheckoutSession({ amount, currency, mode });
}

export async function POST(request: NextRequest) {
    try {
        const { amount, currency = "BTC", mode = "payment" } = await request
            .json();
        return createBTCPayCheckoutSession({
            amount: Number(amount),
            currency,
            mode,
        });
    } catch (error) {
        console.error("Error parsing request body:", error);
        return NextResponse.json({ error: "Invalid request body" }, {
            status: 400,
        });
    }
}

async function createBTCPayCheckoutSession(
    params: {
        amount: number;
        currency: string;
        mode: "payment" | "subscription";
    },
) {
    try {
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth
            .getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, {
                status: 401,
            });
        }

        const cryptoPaymentProvider = getCryptoPaymentProvider();

        let btcAmount = params.amount;
        if (
            params.currency.toUpperCase() !== "BTC" &&
            cryptoPaymentProvider.convertToProviderCurrency
        ) {
            btcAmount = await cryptoPaymentProvider.convertToProviderCurrency(
                params.amount,
                params.currency.toUpperCase(),
            );
        }

        const customerId = await cryptoPaymentProvider.createCustomer(
            user.email || "",
            { user_id: user.id },
        );

        const session = await cryptoPaymentProvider.createCheckoutSession({
            customerId,
            amount: btcAmount,
            currency: "BTC",
            mode: params.mode,
            successUrl:
                `${NEXT_PUBLIC_SITE_URL}/dashboard?success=true&provider=btcpay&session_id={CHECKOUT_SESSION_ID}`,
            cancelUrl:
                `${NEXT_PUBLIC_SITE_URL}/pricing?canceled=true&provider=btcpay`,
            expiresInMinutes: 60,
            metadata: {
                user_id: user.id,
                original_amount: String(params.amount),
                original_currency: params.currency.toUpperCase(),
            },
        });

        return NextResponse.json({ url: session.url });
    } catch (error) {
        console.error("Error creating BTCPay checkout session:", error);
        return NextResponse.json({ error: "Internal server error" }, {
            status: 500,
        });
    }
}
