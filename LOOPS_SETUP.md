# Loops.so Email Setup Guide

## ✅ What's Already Done (Code-wise)

1. ✅ Loops SDK installed
2. ✅ Helper functions created (`lib/loops.ts`)
3. ✅ API endpoint for sending welcome emails (`/api/loops/send-welcome`)
4. ✅ Payment confirmation email integrated into Whop webhook
5. ✅ Test page created at `/test-loops`

---

## 🚀 What YOU Need to Do

### Step 1: Sign Up for Loops.so (5 min)

1. Go to https://loops.so
2. Sign up with your email
3. Verify your email

---

### Step 2: Get API Key (2 min)

1. Go to Loops Dashboard → **Settings** → **API Keys**
2. Click **Create API Key**
3. Copy the key (starts with `loops_`)
4. Add to your `.env.local`:

```bash
LOOPS_API_KEY=loops_your_key_here
```

5. Restart your dev server

---

### Step 3: Create Transactional Emails in Loops (10 min)

You need to create 2 transactional emails:

#### Email 1: Welcome Email

1. In Loops Dashboard → Click **Transactional**
2. Click **Create Transactional Email**
3. **Template ID:** `welcome-email` (IMPORTANT - must match code)
4. **Subject:** `Welcome to Newton AI! 🎓`

**Email Content:**
```
Hi {{firstName}},

Welcome to Newton AI! We're excited to help you study smarter with AI-powered notes, flashcards, and quizzes.

Here's what you can do right now:

✅ Upload PDFs and get AI-generated notes instantly
✅ Turn YouTube videos into study guides
✅ Generate unlimited flashcards from your notes
✅ Create interactive quizzes to test yourself
✅ Join study rooms with friends

[Button: Start Creating Notes] → https://www.newtonstudy.app/home

Free Plan: You have 3 free AI-generated notes to get started. Need more? Upgrade to Pro for unlimited notes!

Happy studying! 📚

The Newton AI Team

---
Need help? Reply to this email or contact support@newtonstudy.app
```

5. Add **Data Variable**: `firstName` (click "Add data variable" in editor)
6. Click **Publish**

---

#### Email 2: Payment Confirmation

1. Click **Create Transactional Email**
2. **Template ID:** `payment-confirmation` (IMPORTANT - must match code)
3. **Subject:** `Welcome to Newton AI Pro! 🎉`

**Email Content:**
```
Hi there,

Thanks for upgrading to Newton AI {{planName}}! Your payment has been confirmed.

What you now have access to:

✅ Unlimited AI-generated notes
✅ Unlimited flashcards and quizzes
✅ Priority support
✅ Early access to new features

[Button: Go to Dashboard] → https://www.newtonstudy.app/home

Your subscription details:
Plan: {{planName}}
Billing: {{billingInterval}}

Questions about your subscription? Just reply to this email.

Happy studying! 📚

The Newton AI Team
```

4. Add **Data Variables**: `planName`, `billingInterval`
5. Click **Publish**

---

### Step 4: Configure Domain (10 min)

To send emails from `hello@newtonstudy.app` instead of `onboarding@loops.so`:

1. Loops Dashboard → **Settings** → **Sending**
2. Click **Add Domain**
3. Enter: `newtonstudy.app`
4. Add the DNS records they show you (go to your domain provider)
5. Wait 5-10 minutes for verification
6. Once verified, update `lib/loops.ts` to use your domain

---

### Step 5: Test Email Sending (5 min)

1. Make sure your dev server is running
2. Go to: http://localhost:3000/test-loops
3. Enter your email
4. Click "Send Test Welcome Email"
5. Check your inbox!

---

## 🎯 How It Works

### Welcome Email
When a user signs up, you can trigger the welcome email like this:

```typescript
import { sendWelcomeEmail } from "@/lib/loops";

// In your signup flow
await sendWelcomeEmail(user.email, user.full_name);
```

### Payment Confirmation Email
This is **automatic** - already integrated into the Whop webhook at `/api/whop/route.ts`.

When a user subscribes:
1. Whop sends webhook
2. Subscription created in database
3. Payment confirmation email sent automatically ✅
4. User contact updated in Loops with subscription info

---

## 📧 Email Functions Available

All in `lib/loops.ts`:

```typescript
// Send welcome email
await sendWelcomeEmail(email, firstName);

// Send payment confirmation
await sendPaymentConfirmationEmail(email, planName, billingInterval);

// Update contact info
await updateLoopsContact(email, {
  userId: "123",
  firstName: "John",
  planName: "Pro",
  status: "subscribed"
});

// Send custom event (for triggering loops)
await sendLoopsEvent(email, "completedOnboarding");
```

---

## 🔄 Future: Trigger Automated Loops

You can create automated email sequences in Loops and trigger them with events:

**Example: Day 3 Tips Email**
1. Create Loop in Loops Dashboard
2. Trigger: "Event Received" → `completedOnboarding`
3. Add emails with delays
4. Trigger from code:

```typescript
await sendLoopsEvent(user.email, "completedOnboarding");
```

---

## ✅ Checklist

Before going live:

- [ ] Loops.so account created
- [ ] API key added to `.env.local`
- [ ] Welcome email created with ID: `welcome-email`
- [ ] Payment confirmation email created with ID: `payment-confirmation`
- [ ] Both emails published in Loops
- [ ] Domain configured (optional but recommended)
- [ ] Test email sent successfully via `/test-loops`

---

## 💰 Cost

- **Free**: 0-2,000 contacts
- **$29/month**: Up to 10,000 contacts
- **No email send limits**

---

## 🆘 Troubleshooting

**Email not sending?**
1. Check API key is correct in `.env.local`
2. Verify template IDs match exactly (`welcome-email`, `payment-confirmation`)
3. Make sure emails are **Published** in Loops
4. Check dev server is restarted after adding API key

**Test page not working?**
1. Visit `/test-loops`
2. Enter your email
3. Check browser console for errors
4. Check server logs for Loops API errors

---

Need help? Check Loops documentation: https://loops.so/docs
