import { NEXT_PUBLIC_SITE_URL } from "@/lib/env";
import { getFiatPaymentProvider } from "@/lib/payment";
import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Handle GET requests for post-authentication redirects
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const lookupKey = searchParams.get("lookup_key");
  const redirectAfterAuth = searchParams.get("redirect_after_auth");

  if (!lookupKey || !redirectAfterAuth) {
    return NextResponse.redirect(`${NEXT_PUBLIC_SITE_URL}/pricing`);
  }

  // This is a post-authentication redirect, create checkout session
  return createCheckoutSession(lookupKey);
}

export async function POST(request: NextRequest) {
  try {
    const { lookup_key } = await request.json();
    return createCheckoutSession(lookup_key);
  } catch (error) {
    console.error("Error parsing request body:", error);
    return NextResponse.json({ error: "Invalid request body" }, {
      status: 400,
    });
  }
}

async function createCheckoutSession(lookupKey: string) {
  try {
    // Get user from Supabase auth
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get payment provider
    const fiatPaymentProvider = getFiatPaymentProvider();

    // Get or create customer
    let customerId: string;

    // Try to get existing subscription with Stripe customer ID
    // Handle case where Stripe columns might not exist yet
    try {
      const { data: existingSubscription } = await supabase
        .from("user_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .single();

      // Check if stripe_customer_id column exists and has a value
      if (
        existingSubscription && "stripe_customer_id" in existingSubscription &&
        existingSubscription.stripe_customer_id
      ) {
        customerId = existingSubscription.stripe_customer_id as string;
      } else {
        // Create new customer
        customerId = await fiatPaymentProvider.createCustomer(user.email!, {
          user_id: user.id,
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (_error) {
      // If column doesn't exist or other error, create new customer
      console.log(
        "Creating new Stripe customer (Stripe columns may not exist yet)",
      );
      customerId = await fiatPaymentProvider.createCustomer(user.email!, {
        user_id: user.id,
      });
    }

    // Get price by lookup key
    const prices = await fiatPaymentProvider.listPrices();
    const price = prices.find((p) => p.lookupKey === lookupKey);

    if (!price) {
      return NextResponse.json({ error: "Price not found" }, { status: 404 });
    }

    // Create checkout session
    const session = await fiatPaymentProvider.createCheckoutSession({
      customerId,
      priceId: price.id,
      mode: "subscription",
      successUrl:
        `${NEXT_PUBLIC_SITE_URL}/pricing?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${NEXT_PUBLIC_SITE_URL}/pricing?canceled=true`,
      billingAddressCollection: "auto",
      metadata: {
        user_id: user.id,
      },
    });

    return NextResponse.redirect(session.url, 303);
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: "Internal server error" }, {
      status: 500,
    });
  }
}
