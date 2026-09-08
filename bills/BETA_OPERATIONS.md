# Diary Beta Operations

## Recruitment plan

Recruit 20-40 testers in four balanced groups:

| Group | Target | What to look for |
|---|---:|---|
| Shopkeepers | 5-10 | Daily sales, expenses, and end-of-day totals |
| Service workers | 5-10 | Jobs, advances, payments, and job expenses |
| Tutors | 5-10 | Students, expected fees, payments, and pending fees |
| Small business owners | 5-10 | Simple bills, customer history, and payment records |

Recruit people who can use Diary for at least seven days and can describe what they expected without being coached. Track only a tester code in the feedback sheet, not customer data.

## Google Sheet or Notion feedback tracker

Create a private table named `Diary Beta Feedback` with these columns:

| Column | Use |
|---|---|
| Date | Date the report was received |
| User | Tester code, such as `SHOP-03`; do not use customer names |
| Profession | Meri Dukaan / Mera Kaam / Meri Class / Hisab Kitab |
| Issue or feedback | Short description of what happened or what was requested |
| Severity | Critical / Medium / Low |
| Status | Open / Investigating / Fixed / Won't fix |
| Notes | Reproduction details, owner, version, and follow-up |

Recommended additional fields are `Fixed in version`, `Reproducible`, and `Source` such as feedback page, WhatsApp, or interview.

### Severity rules

- Critical: data loss, wrong money total, crash, blank screen, or blocked daily task.
- Medium: confusing flow, incorrect label, broken non-essential action, or repeated friction.
- Low: wording preference, visual polish, or future idea.

Never paste customer names, phone numbers, payment references, screenshots with private data, or amounts into the tracker.

## Metrics sheet

Create a second table named `Diary Beta Metrics` and update it once per week:

| Metric | Definition |
|---|---|
| Users onboarded | Testers who selected a profession and created or attempted a first record |
| Active users weekly | Testers who used Diary on at least one day during the week |
| Feedback submissions | Feedback forms or direct reports received |
| Bugs reported | Reports classified as bugs, excluding feature ideas |
| Critical bugs fixed | Critical bugs verified as fixed in the tested version |
| User satisfaction | Average 1-5 rating from the weekly check-in |

Use tester codes and weekly totals only. Do not add analytics to the app for this beta.

## Weekly operating rhythm

- Monday: review open critical and medium issues.
- Wednesday: check onboarding and active-user counts.
- Friday: send the weekly check-in and record ratings.
- Sunday: verify fixes with a small tester group and update the tracker.

## Post-beta analysis plan

At the end of Week 5:

1. Count onboarded and weekly active users by profession.
2. Compare first-record completion and return usage.
3. Group feedback into confusing UX, critical bugs, missing core features, loved features, and disliked features.
4. Review all critical bugs and confirm none remain unresolved.
5. Identify the three most-used actions for each profession.
6. Identify where testers needed help or abandoned a flow.
7. Review satisfaction ratings and representative comments.
8. Prioritize the next phase using this order: data safety, crashes, wrong totals, blocked daily work, confusing UX, then requested features.
9. Defer requests that do not serve the four current professions.
10. Publish a short beta report and decide whether to continue, fix and extend beta, or prepare a wider launch.

## Beta report template

# Diary Beta Report

## Summary

- Beta period:
- Total testers:
- Testers by profession:
- Version reviewed:

## Usage

- Users onboarded:
- Weekly active users:
- First-record completion rate:
- Testers returning for four or more days:
- Feedback submissions:
- Average satisfaction rating (1-5):

## Feedback themes

### Most useful features

- 

### Most confusing parts

- 

### Loved features

- 

### Hated or avoided features

- 

## Bugs

| Issue | Severity | Reports | Status | Fixed in version |
|---|---|---:|---|---|
|  |  |  |  |  |

## Recommendations

### Fix before the next release

- 

### Improve next

- 

### Defer

- 

## Decision

- Continue beta / extend beta / prepare wider launch:
- Reason:
- Owner and next review date:
