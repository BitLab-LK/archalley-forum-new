'use server';

import { Prisma, Ga4PurchaseLogStatus, Ga4PurchaseStatus } from '@prisma/client';
import { prisma } from './prisma';
import {
  Ga4PurchaseItem,
  Ga4PurchasePayload,
  sendGa4PurchaseEvent,
} from './ga4-measurement';

type PurchaseEventResultStatus = 'SUCCESS' | 'FAILED' | 'SKIPPED' | 'NOT_FOUND';

export interface PurchaseEventResult {
  status: PurchaseEventResultStatus;
  reason?: string;
  error?: string;
  logId?: string;
}

export interface PurchaseEventOptions {
  source?: string;
}

export async function triggerGa4PurchaseForPayment(
  paymentId: string,
  options?: PurchaseEventOptions
): Promise<PurchaseEventResult> {
  const payment = await prisma.competitionPayment.findUnique({
    where: { id: paymentId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        },
      },
      registrations: {
        include: {
          competition: {
            select: {
              id: true,
              title: true,
            },
          },
          registrationType: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  if (!payment) {
    return {
      status: 'NOT_FOUND',
      reason: `Payment ${paymentId} not found`,
    };
  }

  if (payment.ga4PurchaseStatus === Ga4PurchaseStatus.SENT) {
    return {
      status: 'SKIPPED',
      reason: `GA4 purchase already sent for transaction ${payment.orderId}`,
    };
  }

  if (payment.ga4PurchaseStatus === Ga4PurchaseStatus.SENDING) {
    return {
      status: 'SKIPPED',
      reason: `GA4 purchase send already in progress for transaction ${payment.orderId}`,
    };
  }

  if (
    payment.ga4PurchaseStatus !== Ga4PurchaseStatus.NOT_SENT &&
    payment.ga4PurchaseStatus !== Ga4PurchaseStatus.FAILED
  ) {
    return {
      status: 'SKIPPED',
      reason: `GA4 purchase is in ${payment.ga4PurchaseStatus} state`,
    };
  }

  const lockResult = await prisma.competitionPayment.updateMany({
    where: {
      id: payment.id,
      ga4PurchaseStatus: payment.ga4PurchaseStatus,
    },
    data: {
      ga4PurchaseStatus: Ga4PurchaseStatus.SENDING,
      ga4PurchaseLastAttemptAt: new Date(),
    },
  });

  if (lockResult.count === 0) {
    return {
      status: 'SKIPPED',
      reason: 'Another process is handling this GA4 purchase event',
    };
  }

  const items = buildItems(payment.registrations, payment);
  const value = Number(payment.amount ?? 0);
  const currency = payment.currency || 'LKR';
  const customerDetails = (payment.customerDetails as Record<string, any>) || {};
  const customerEmail =
    customerDetails.email || payment.user?.email || customerDetails.contactEmail || null;
  const customerCountry = customerDetails.country || customerDetails.countryCode;
  const purchaseSource = options?.source;
  const additionalParams: Record<string, unknown> = {};

  if (customerCountry) {
    additionalParams.customer_country = customerCountry;
  }

  if (purchaseSource) {
    additionalParams.purchase_source = purchaseSource;
  }

  const customerType = await resolveCustomerType(payment.userId, payment.id);

  const ga4Payload: Ga4PurchasePayload = {
    transactionId: payment.orderId,
    currency,
    value,
    items,
    customerType,
    paymentType: payment.paymentMethod || undefined,
    customerEmail,
    userId: payment.userId,
    clientId: payment.orderId,
    additionalParams: Object.keys(additionalParams).length ? additionalParams : undefined,
  };

  const attempt =
    (await prisma.ga4PurchaseLog.count({
      where: { transactionId: payment.orderId },
    })) + 1;

  const serializedPayload: Prisma.InputJsonValue = JSON.parse(
    JSON.stringify(ga4Payload)
  );

  const logEntry = await prisma.ga4PurchaseLog.create({
    data: {
      transactionId: payment.orderId,
      paymentId: payment.id,
      paymentMethod: payment.paymentMethod,
      source: purchaseSource,
      status: Ga4PurchaseLogStatus.PENDING,
      attempt,
      payload: serializedPayload,
    },
  });

  try {
    const ga4Response = await sendGa4PurchaseEvent(ga4Payload);

    if (ga4Response.success) {
      await Promise.all([
        prisma.competitionPayment.update({
          where: { id: payment.id },
          data: {
            ga4PurchaseStatus: Ga4PurchaseStatus.SENT,
            ga4PurchaseSentAt: new Date(),
            ga4PurchaseResponse: {
              status: ga4Response.status,
              body: ga4Response.responseBody ?? null,
            },
            ga4PurchaseError: null,
          },
        }),
        prisma.ga4PurchaseLog.update({
          where: { id: logEntry.id },
          data: {
            status: Ga4PurchaseLogStatus.SUCCESS,
            response: {
              status: ga4Response.status,
              body: ga4Response.responseBody ?? null,
            },
            httpStatus: ga4Response.status ?? undefined,
            sentAt: new Date(),
          },
        }),
      ]);

      return {
        status: 'SUCCESS',
        logId: logEntry.id,
      };
    }

    const errorMessage =
      ga4Response.error || 'GA4 returned an unsuccessful status for purchase event';

    await handleGa4Failure(payment.id, logEntry.id, errorMessage, ga4Response);

    return {
      status: 'FAILED',
      error: errorMessage,
      logId: logEntry.id,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unexpected error while sending GA4 purchase';
    await handleGa4Failure(payment.id, logEntry.id, errorMessage, null);
    return {
      status: 'FAILED',
      error: errorMessage,
      logId: logEntry.id,
    };
  }
}

async function handleGa4Failure(
  paymentId: string,
  logId: string,
  errorMessage: string,
  ga4Response: { status: number | null; responseBody: unknown } | null
) {
  await Promise.all([
    prisma.competitionPayment.update({
      where: { id: paymentId },
      data: {
        ga4PurchaseStatus: Ga4PurchaseStatus.FAILED,
        ga4PurchaseError: errorMessage,
        ga4PurchaseResponse: ga4Response
          ? {
              status: ga4Response.status,
              body: ga4Response.responseBody ?? null,
            }
          : null,
      },
    }),
    prisma.ga4PurchaseLog.update({
      where: { id: logId },
      data: {
        status: Ga4PurchaseLogStatus.FAILED,
        errorMessage,
        response: ga4Response
          ? {
              status: ga4Response.status,
              body: ga4Response.responseBody ?? null,
            }
          : null,
        httpStatus: ga4Response?.status ?? undefined,
        sentAt: new Date(),
      },
    }),
  ]);
}

async function resolveCustomerType(userId: string, currentPaymentId: string) {
  const previousConfirmed = await prisma.competitionRegistration.count({
    where: {
      userId,
      status: 'CONFIRMED',
      paymentId: {
        not: currentPaymentId,
      },
    },
  });

  return previousConfirmed > 0 ? 'returning' : 'new';
}

function buildItems(
  registrations: Array<{
    competitionId: string;
    registrationTypeId: string;
    registrationType: { id: string; name: string };
    competition: { id: string; title: string };
    participantType: string;
    amountPaid: any;
  }>,
  payment: {
    items: any;
    orderId: string;
    paymentMethod: string | null;
    amount: number;
  }
): Ga4PurchaseItem[] {
  if (registrations.length > 0) {
    return registrations.map((registration, index) => ({
      item_id: `${registration.competitionId}_${registration.registrationTypeId}`,
      item_name: registration.registrationType.name,
      item_category:
        registration.participantType === 'KIDS' ? 'Kids' : 'Physical and Digital',
      quantity: 1,
      price: Number(registration.amountPaid ?? 0),
      index,
    }));
  }

  if (Array.isArray(payment.items) && payment.items.length > 0) {
    return payment.items.map((item: any, index: number) => ({
      item_id: item.id || `${payment.orderId}_${index}`,
      item_name: item.registrationType || item.competitionTitle || 'Competition Entry',
      item_category:
        item.participantType === 'KIDS' || item.registrationType?.includes('KID')
          ? 'Kids'
          : 'Physical and Digital',
      quantity: 1,
      price: Number(item.subtotal ?? item.unitPrice ?? 0),
      index,
    }));
  }

  return [
    {
      item_id: payment.orderId,
      item_name: payment.paymentMethod || 'Competition Registration',
      item_category: 'Physical and Digital',
      quantity: 1,
      price: Number(payment.amount ?? 0),
      index: 0,
    },
  ];
}

