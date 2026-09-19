# Tabwise

A Splitwise-style tab for friends who use each other’s cards. Log what was charged, which card or utility it hit, split the cost, mark each person paid, and catch repayments that slipped.

The demo household (Maya, Jordan, Alex, Priya) loads on first visit. Data stays in this browser via localStorage — no account required.

## What you can do

- **Log a charge** — who used it, who is owed, which card or bill, and (for utilities) which card actually paid the bill.
- **Mark paid** — settle one person’s share and record how they paid you back (Venmo, Zelle, cash, bank, or they paid the card).
- **Missed-payment reminders** — overdue shares sit on the home screen. Copy a nudge instead of hoping the group chat remembers.
- **Cards & utilities** — see spend and unpaid balances on Maya’s Chase, Jordan’s Amex, electric, Wi-Fi, and anything you add.
- **Switch “viewing as”** in the header to see the tab from a friend’s side.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:43123](http://localhost:43123).

```bash
npm run build
npm start
```

## Reset

People → **Reset demo** restores the sample group and overdue charges.
