import { LoopsClient } from "loops";

// Initialize Loops client
const loops = new LoopsClient(process.env.LOOPS_API_KEY as string);

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(email: string, firstName?: string) {
  try {
    const resp = await loops.sendTransactionalEmail({
      transactionalId: "cmighgw3rkfsczq0i6fqz3tat", // Welcome email template ID from Loops
      email: email,
      dataVariables: {
        firstName: firstName || email.split('@')[0],
      },
    });

    if (!resp.success) {
      console.error('Failed to send welcome email:', resp);
      return { success: false, error: resp };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error };
  }
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmationEmail(
  email: string,
  planName: string,
  billingInterval: string
) {
  try {
    const resp = await loops.sendTransactionalEmail({
      transactionalId: "payment-confirmation", // You'll create this in Loops dashboard
      email: email,
      dataVariables: {
        planName: planName,
        billingInterval: billingInterval,
      },
    });

    if (!resp.success) {
      console.error('Failed to send payment confirmation:', resp);
      return { success: false, error: resp };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending payment confirmation:', error);
    return { success: false, error };
  }
}

/**
 * Update or create contact in Loops
 */
export async function updateLoopsContact(
  email: string,
  properties: {
    userId?: string;
    firstName?: string;
    planName?: string;
    status?: string;
    [key: string]: any;
  }
) {
  try {
    const resp = await loops.updateContact(email, properties);

    if (!resp.success) {
      console.error('Failed to update contact:', resp);
      return { success: false, error: resp };
    }

    return { success: true, id: resp.id };
  } catch (error) {
    console.error('Error updating contact:', error);
    return { success: false, error };
  }
}

/**
 * Send custom event to trigger loops
 */
export async function sendLoopsEvent(
  email: string,
  eventName: string,
  eventProperties?: Record<string, any>
) {
  try {
    const resp = await loops.sendEvent({
      email: email,
      eventName: eventName,
      eventProperties: eventProperties,
    });

    if (!resp.success) {
      console.error('Failed to send event:', resp);
      return { success: false, error: resp };
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending event:', error);
    return { success: false, error };
  }
}
