import { createHmac } from "crypto";
import {
    BillingPortalSession,
    CheckoutConfig,
    CheckoutSession,
    Customer,
    Payment,
    PaymentConfig,
    PaymentProvider,
    Price,
    Product,
    Subscription,
    SubscriptionConfig,
    SubscriptionUpdate,
    WebhookEvent,
} from "../interfaces/PaymentProvider";

export interface BTCPayConfig {
    serverUrl: string;
    apiKey: string;
    storeId: string;
}

export interface BTCPayInvoice {
    id: string;
    storeId: string;
    amount: string;
    currency: string;
    type: string;
    checkoutLink: string;
    status: string;
    additionalStatus?: string;
    createdTime: string;
    expirationTime: string;
    monitoringExpiration?: string;
    metadata?: Record<string, any>;
}

export interface BTCPayWebhookEventRaw {
    deliveryId: string;
    webhookId: string;
    originalDeliveryId?: string;
    isRedelivery: boolean;
    type: string;
    timestamp: string;
    storeId: string;
    invoiceId: string;
    data: Record<string, unknown>;
}

export class BTCPayProvider implements PaymentProvider {
    private config: BTCPayConfig;
    private baseUrl: string;

    constructor(config: BTCPayConfig) {
        this.config = config;
        this.baseUrl = `${config.serverUrl.replace(/\/$/, "")}/api/v1`;
    }

    getProviderType(): "fiat" | "crypto" {
        return "crypto";
    }

    getProviderName(): string {
        return "BTCPay Server";
    }

    getSupportedCurrencies(): string[] {
        return ["BTC", "SATS"]; // Use BTC-native amounts
    }

    // Customer Management - BTCPay has no native customers; simulate via metadata
    async createCustomer(
        email: string,
        metadata?: Record<string, string>,
    ): Promise<string> {
        const customerId = `btcpay_${Date.now()}_${
            Math.random().toString(36).slice(2, 10)
        }`;
        // Persist externally if needed by the app; here we just return the ID
        return customerId;
    }

    async getCustomer(customerId: string): Promise<Customer> {
        const [, timestamp] = customerId.split("_");
        return {
            id: customerId,
            email: "",
            created: new Date(Number(timestamp) || Date.now()),
        };
    }

    async updateCustomer(
        customerId: string,
        data: Partial<Customer>,
    ): Promise<Customer> {
        return {
            id: customerId,
            email: data.email || "",
            name: data.name,
            metadata: data.metadata,
            created: new Date(),
        };
    }

    // Subscription Management - emulate via recurring invoices (outside scope here)
    async createSubscription(
        customerId: string,
        config: SubscriptionConfig,
    ): Promise<Subscription> {
        if (!config.amount || !config.currency || !config.interval) {
            throw new Error(
                "BTCPay subscriptions require amount, currency, and interval",
            );
        }

        const subscriptionId = `sub_${Date.now()}_${
            Math.random().toString(36).slice(2, 10)
        }`;
        const now = new Date();
        return {
            id: subscriptionId,
            customerId,
            status: "active",
            amount: config.amount,
            currency: config.currency,
            interval: config.interval,
            currentPeriodStart: now,
            currentPeriodEnd: this.calculateNextPeriod(now, config.interval),
            cancelAtPeriodEnd: false,
            metadata: config.metadata,
        };
    }

    async getSubscription(_subscriptionId: string): Promise<Subscription> {
        throw new Error("Subscription retrieval not implemented for BTCPay");
    }

    async updateSubscription(
        _subscriptionId: string,
        _data: SubscriptionUpdate,
    ): Promise<Subscription> {
        throw new Error("Subscription update not implemented for BTCPay");
    }

    async cancelSubscription(_subscriptionId: string): Promise<Subscription> {
        throw new Error("Subscription cancellation not implemented for BTCPay");
    }

    // One-time Payments via invoice
    async createPayment(config: PaymentConfig): Promise<Payment> {
        const invoice = await this.createInvoice({
            amount: config.amount,
            currency: config.currency,
            description: config.description,
            expiresInMinutes: config.expiresInMinutes || 60,
            metadata: {
                ...config.metadata,
                customerId: config.customerId,
                paymentType: "one-time",
            },
        });
        return this.mapInvoiceToPayment(invoice);
    }

    async getPayment(paymentId: string): Promise<Payment> {
        const invoice = await this.getInvoice(paymentId);
        return this.mapInvoiceToPayment(invoice);
    }

    // Checkout Sessions
    async createCheckoutSession(
        config: CheckoutConfig,
    ): Promise<CheckoutSession> {
        if (!config.amount || !config.currency) {
            throw new Error(
                "BTCPay requires amount and currency for checkout sessions",
            );
        }

        const invoice = await this.createInvoice({
            amount: config.amount,
            currency: config.currency,
            description: config.mode === "subscription"
                ? "Subscription Payment"
                : "One-time Payment",
            expiresInMinutes: config.expiresInMinutes || 60,
            redirectUrl: config.successUrl,
            metadata: {
                ...config.metadata,
                customerId: config.customerId,
                mode: config.mode,
                cancelUrl: config.cancelUrl,
            },
        });

        return {
            id: invoice.id,
            url: invoice.checkoutLink,
            customerId: config.customerId,
        };
    }

    async createBillingPortalSession(
        _customerId: string,
        _returnUrl: string,
    ): Promise<BillingPortalSession> {
        throw new Error(
            "BTCPay Server does not support billing portal sessions",
        );
    }

    async verifyWebhookSignature(
        payload: string,
        signature: string,
        secret: string,
    ): Promise<WebhookEvent> {
        const expected = createHmac("sha256", secret).update(payload, "utf8")
            .digest("hex");
        if (signature !== expected) {
            throw new Error("Invalid webhook signature");
        }
        const raw: BTCPayWebhookEventRaw = JSON.parse(payload);
        return {
            id: raw.deliveryId,
            type: raw.type,
            data: { object: raw.data },
            created: new Date(raw.timestamp),
        };
    }

    async listProducts(): Promise<Product[]> {
        return [
            {
                id: "keyfate_pro",
                name: "KeyFate Pro",
                description: "Includes Pro features",
                metadata: { provider: "btcpay" },
            },
        ];
    }

    async listPrices(_productId?: string): Promise<Price[]> {
        return [
            {
                id: "pro_btc_monthly",
                productId: "keyfate_pro",
                currency: "BTC",
                unitAmount: 0.0002,
                interval: "month",
                lookupKey: "pro_btc_monthly",
                metadata: { provider: "btcpay" },
            },
            {
                id: "pro_btc_yearly",
                productId: "keyfate_pro",
                currency: "BTC",
                unitAmount: 0.002,
                interval: "year",
                lookupKey: "pro_btc_yearly",
                metadata: { provider: "btcpay" },
            },
        ];
    }

    async convertToProviderCurrency(
        amount: number,
        fromCurrency: string,
    ): Promise<number> {
        if (fromCurrency === "BTC") return amount;
        const response = await fetch(
            `${this.baseUrl}/stores/${this.config.storeId}/rates`,
            {
                headers: {
                    Authorization: `token ${this.config.apiKey}`,
                    "Content-Type": "application/json",
                },
            },
        );
        if (!response.ok) {
            throw new Error("Failed to fetch exchange rates");
        }
        const rates = (await response.json()) as Array<
            { code: string; rate: number }
        >;
        const btcRate = rates.find((r) => r.code === fromCurrency)?.rate;
        if (!btcRate) {
            throw new Error(`Exchange rate not found for ${fromCurrency}`);
        }
        return amount / btcRate;
    }

    // Private helpers
    private async createInvoice(params: {
        amount: number;
        currency: string;
        description?: string;
        expiresInMinutes?: number;
        redirectUrl?: string;
        metadata?: Record<string, unknown>;
    }): Promise<BTCPayInvoice> {
        const response = await fetch(
            `${this.baseUrl}/stores/${this.config.storeId}/invoices`,
            {
                method: "POST",
                headers: {
                    Authorization: `token ${this.config.apiKey}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    amount: params.amount.toString(),
                    currency: params.currency,
                    metadata: params.metadata || {},
                    checkout: {
                        expirationMinutes: params.expiresInMinutes || 60,
                        redirectURL: params.redirectUrl,
                    },
                }),
            },
        );
        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Failed to create BTCPay invoice: ${error}`);
        }
        return (await response.json()) as BTCPayInvoice;
    }

    private async getInvoice(invoiceId: string): Promise<BTCPayInvoice> {
        const response = await fetch(
            `${this.baseUrl}/stores/${this.config.storeId}/invoices/${invoiceId}`,
            {
                headers: {
                    Authorization: `token ${this.config.apiKey}`,
                    "Content-Type": "application/json",
                },
            },
        );
        if (!response.ok) {
            throw new Error("Failed to fetch BTCPay invoice");
        }
        return (await response.json()) as BTCPayInvoice;
    }

    private mapInvoiceToPayment(invoice: BTCPayInvoice): Payment {
        return {
            id: invoice.id,
            customerId: invoice.metadata?.customerId as string | undefined,
            amount: parseFloat(invoice.amount),
            currency: invoice.currency,
            status: this.mapInvoiceStatus(invoice.status),
            description:
                (invoice.metadata?.description as string | undefined) ||
                undefined,
            metadata:
                (invoice.metadata as Record<string, string> | undefined) ||
                undefined,
            createdAt: new Date(invoice.createdTime),
            completedAt: invoice.status === "Settled" ? new Date() : undefined,
            expiresAt: new Date(invoice.expirationTime),
        };
    }

    private mapInvoiceStatus(status: string): Payment["status"] {
        switch (status) {
            case "Settled":
                return "completed";
            case "Processing":
                return "processing";
            case "Expired":
                return "expired";
            case "Invalid":
                return "failed";
            case "New":
            default:
                return "pending";
        }
    }

    private calculateNextPeriod(
        start: Date,
        interval: "month" | "year" | "day",
    ): Date {
        const next = new Date(start);
        if (interval === "day") {
            next.setDate(next.getDate() + 1);
        } else if (interval === "month") {
            next.setMonth(next.getMonth() + 1);
        } else if (interval === "year") {
            next.setFullYear(next.getFullYear() + 1);
        }
        return next;
    }
}
