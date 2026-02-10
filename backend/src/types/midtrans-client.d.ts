declare module 'midtrans-client' {
  interface Config {
    isProduction: boolean;
    serverKey: string;
    clientKey?: string;
  }

  interface TransactionResponse {
    token: string;
    redirect_url: string;
  }

  interface StatusResponse {
    transaction_status: string;
    fraud_status: string;
    order_id: string;
    gross_amount: string;
    status_code: string;
    signature_key: string;
    payment_type: string;
    transaction_time: string;
    [key: string]: unknown;
  }

  class Snap {
    constructor(config: Config);
    createTransaction(parameter: Record<string, unknown>): Promise<TransactionResponse>;
  }

  class CoreApi {
    constructor(config: Config);
    transaction: {
      status(orderId: string): Promise<StatusResponse>;
      notification(notification: Record<string, unknown>): Promise<StatusResponse>;
    };
  }
}
