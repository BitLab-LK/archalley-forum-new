'use server';

import crypto from 'crypto';

export interface Ga4PurchaseItem {
  item_id: string;
  item_name: string;
  item_category?: string;
  quantity?: number;
  price?: number;
  index?: number;
}

export interface Ga4PurchasePayload {
  transactionId: string;
  currency: string;
  value: number;
  items: Ga4PurchaseItem[];
  customerType?: 'new' | 'returning';
  paymentType?: string;
  customerEmail?: string | null;
  userId?: string | null;
  clientId?: string | null;
  additionalParams?: Record<string, unknown>;
  userProperties?: Record<
    string,
    {
      value: string | number | boolean | null;
    }
  >;
  debugMode?: boolean;
}

export interface Ga4MeasurementResult {
  success: boolean;
  status: number | null;
  requestBody: Record<string, unknown>;
  responseBody: unknown;
  error?: string;
}

const GA4_ENDPOINT = 'https://www.google-analytics.com/mp/collect';

export async function sendGa4PurchaseEvent(
  payload: Ga4PurchasePayload
): Promise<Ga4MeasurementResult> {
  if (typeof window !== 'undefined') {
    throw new Error('GA4 Measurement Protocol utility cannot run on the client side');
  }

  const measurementId = process.env.GA4_MEASUREMENT_ID;
  const apiSecret = process.env.GA4_API_SECRET;

  const requestBody = buildRequestBody(payload);

  if (!measurementId || !apiSecret) {
    const errorMessage = 'Missing GA4_MEASUREMENT_ID or GA4_API_SECRET environment variables';
    console.error(errorMessage);
    return {
      success: false,
      status: null,
      requestBody,
      responseBody: null,
      error: errorMessage,
    };
  }

  try {
    const url = `${GA4_ENDPOINT}?measurement_id=${measurementId}&api_secret=${apiSecret}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    const parsedResponse = responseText ? safeJsonParse(responseText) : null;

    if (!response.ok) {
      const errorMessage = `GA4 responded with status ${response.status}`;
      console.error(errorMessage, parsedResponse || responseText);
      return {
        success: false,
        status: response.status,
        requestBody,
        responseBody: parsedResponse ?? responseText,
        error: errorMessage,
      };
    }

    return {
      success: true,
      status: response.status,
      requestBody,
      responseBody: parsedResponse,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error while calling GA4 Measurement Protocol';
    console.error('GA4 Measurement Protocol request failed:', errorMessage);

    return {
      success: false,
      status: null,
      requestBody,
      responseBody: null,
      error: errorMessage,
    };
  }
}

function buildRequestBody(payload: Ga4PurchasePayload) {
  const items = (payload.items || []).map((item, index) => {
    const formatted: Record<string, unknown> = {
      item_id: item.item_id,
      item_name: item.item_name,
    };

    if (item.item_category) {
      formatted.item_category = item.item_category;
    }
    if (typeof item.quantity === 'number') {
      formatted.quantity = item.quantity;
    }
    if (typeof item.price === 'number') {
      formatted.price = Number(item.price.toFixed(2));
    }
    formatted.index = typeof item.index === 'number' ? item.index : index;

    return formatted;
  });

  const params: Record<string, unknown> = {
    transaction_id: payload.transactionId,
    currency: payload.currency,
    value: Number(payload.value.toFixed(2)),
    items,
  };

  if (payload.customerType) {
    params.customer_type = payload.customerType;
  }
  if (payload.paymentType) {
    params.payment_type = payload.paymentType;
  }
  if (payload.additionalParams) {
    Object.assign(params, payload.additionalParams);
  }

  const debugMode =
    typeof payload.debugMode === 'boolean'
      ? payload.debugMode
      : process.env.NODE_ENV !== 'production';
  if (debugMode) {
    params.debug_mode = true;
  }

  const userProperties =
    payload.userProperties && Object.keys(payload.userProperties).length > 0
      ? payload.userProperties
      : {};

  if (payload.customerEmail) {
    userProperties.email_hash = {
      value: hashForGa(payload.customerEmail),
    };
  }

  const requestBody: Record<string, unknown> = {
    client_id: payload.clientId ?? payload.transactionId,
    events: [
      {
        name: 'purchase',
        params,
      },
    ],
  };

  if (payload.userId) {
    requestBody.user_id = payload.userId;
  }

  if (Object.keys(userProperties).length > 0) {
    requestBody.user_properties = userProperties;
  }

  return requestBody;
}

function hashForGa(value: string) {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

function safeJsonParse(value: string) {
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

