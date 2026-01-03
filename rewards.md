Perfect — I’ll design this as a **production-ready UX spec**, not just ideas.
I’ll cover **Creator UI**, **Marketer UI**, **states**, **copy**, and **guardrails** so it fits your existing product philosophy (finance-grade, transparent, no gimmicks).

---

# 🎁 Rewards (Milestones) — UX Design

## Core concept (anchor this everywhere)

> **Rewards are milestone-based bonuses, unlocked after real revenue is generated and cleared of refunds.**

They are:

* additive to commissions
* non-cash
* creator-funded
* transparent & auditable

---

# 1️⃣ Creator UI — Project → Rewards

### Location

**Project page tabs**

```
Overview | Metrics | Coupons | Marketers | Rewards | Activity | Settings
```

“Rewards” is **project-scoped**, not global.

---

## A. Rewards list (default view)

### Section header

**Rewards & Milestones**

Subtext:

> Incentivize long-term performance with milestone-based rewards.

---

### Rewards table (clean, compact)

| Reward              | Milestone           | Reward Type   | Availability       | Status |
| ------------------- | ------------------- | ------------- | ------------------ | ------ |
| Free Pro (1 month)  | $1,000 net revenue  | 100% discount | Unlimited          | Active |
| Free Pro (3 months) | $5,000 net revenue  | Coupon        | First 10 marketers | Active |
| Lifetime Plan       | $10,000 net revenue | Plan upgrade  | Once per marketer  | Draft  |

**Status states**

* Draft
* Active
* Paused
* Archived

---

### Primary CTA

**➕ Create reward**

Secondary (optional):

* “View how marketers see this”

---

## B. Create / Edit Reward (modal or page)

### Step 1 — Milestone

**Milestone type**

* ○ Net revenue generated (after refunds)
* ○ Number of completed sales
* ○ Active customers after X days (advanced)

**Threshold**

```
[ $1,000 ] net revenue
```

Helper text:

> Milestones are evaluated after the refund window ends.

---

### Step 2 — Reward

**Reward type**

* ○ Discount coupon
* ○ Free subscription period
* ○ Plan upgrade
* ○ Access / perk (custom label)

**Examples**

* 100% off for 1 month
* 100% off for 3 months
* Lifetime plan
* Private Slack access

**Fulfillment**

* Coupon auto-generated ✅
* Manual fulfillment ⚠️ (requires confirmation)

---

### Step 3 — Constraints

* Reward can be earned:

  * ○ Once per marketer
  * ○ Multiple times
* Availability:

  * ○ Unlimited
  * ○ First [ 10 ] marketers
* Visibility:

  * ○ Public
  * ○ Private (invite-only)

---

### Step 4 — Confirmation (important)

**Summary box**

```
Milestone: $1,000 net revenue
Reward: 100% discount (1 month)
Availability: Unlimited
Visibility: Public
```

Checkbox:

> I understand this reward becomes claimable once the milestone is reached and refunds clear.

CTA:
**Create reward**

---

## C. Reward lifecycle (creator-side visibility)

Each reward has:

* Created
* Updated
* Earned by marketer
* Fulfilled

All logged in **Audit Log**:

> Reward “Free Pro (1 month)” earned by Tg Mark 2

---

# 2️⃣ Marketer UI — Project → Rewards

### Location (multiple entry points)

* Project public page
* Applications → Project → Rewards (new tab)
* Dashboard → Rewards summary

---

## A. Rewards section (inside project)

### Header

**Performance Rewards**

Subtext:

> Earn additional rewards by hitting revenue milestones.

---

### Reward cards (very motivating)

**Card layout**

```
🎁 Free Pro (1 month)

Unlock at: $1,000 net revenue
Progress: $420 / $1,000

████████░░░░ 42%

Reward: 100% discount
Status: In progress
```

Other states:

* 🔓 **Unlocked**
* ⏳ **Pending (refund window)**
* ✅ **Claimed**
* ❌ **Expired / Unavailable**

---

### Visual rules

* Progress bars only for **current** reward
* Lock icons for future rewards
* Clear labels (no ambiguity)

---

## B. Earned rewards (separate section)

**Earned Rewards**

| Reward              | Project     | Earned on | Status  |
| ------------------- | ----------- | --------- | ------- |
| Free Pro (1 month)  | BuildPublic | Jan 12    | Claimed |
| Free Pro (3 months) | BuildPublic | Feb 2     | Pending |

Clicking opens reward details:

* how it was earned
* fulfillment info
* coupon code (if applicable)

---

## C. Reward details view

Shows:

* milestone definition
* revenue attributed
* refund window status
* fulfillment info

Example copy:

> This reward was unlocked after generating $1,032 in net revenue.
> Coupon becomes available once the refund window ends on Feb 15.

---

# 3️⃣ Dashboard-level summary (optional, very effective)

### Marketer Dashboard widget

**🎁 Next Reward**

```
Free Pro (1 month)
$420 / $1,000
```

This creates *ongoing motivation* without clutter.

---

# 4️⃣ States & rules (important)

### Reward states (marketer-side)

1. Locked
2. In progress
3. Pending (refund window)
4. Unlocked
5. Claimed
6. Expired (if capped)

Never skip states.

---

### Enforcement rules (non-negotiable)

* Rewards unlock **after refund window**
* Rewards cannot be revoked once unlocked
* Creator cannot edit milestones retroactively
* All transitions logged

This protects trust.

---

# 5️⃣ Public visibility (ties into your marketplace)

If creator enables **Public Rewards**:

Project public page shows:

> 🎁 Performance rewards available

Example:

```
• $1,000 revenue → Free Pro (1 month)
• $5,000 revenue → Free Pro (3 months)
```

This is a *huge* differentiator for discovery.

---

# 6️⃣ What NOT to allow (important)

❌ Cash bonuses
❌ “Extra commission” as a reward
❌ Manual, unverifiable rewards
❌ Retroactive changes

This keeps rewards:

* clean
* legal
* scalable

---

# 7️⃣ Copy principles (use everywhere)

* Say **“reward”**, not “bonus”
* Say **“unlock”**, not “earn cash”
* Always reference **net revenue**
* Always mention **refund window**

This keeps expectations aligned.

---

## Final takeaway

This Rewards system:

* fits perfectly with your existing model
* reinforces long-term partnerships
* differentiates RevShare from classic affiliate tools
* feels premium and fair

If you want next, I can:

* design the **public project rewards section**
* help you define **reward templates**
* write **landing-page copy** for this feature
* or spec **backend invariants** to make this bulletproof

Just tell me what to tackle next.
