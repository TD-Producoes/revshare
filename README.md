# RevShare

A two-sided marketplace connecting SaaS founders with performance marketers through transparent revenue sharing.

## What is RevShare?

RevShare enables indie SaaS founders to create affiliate programs where marketers earn commissions based on actual revenue generated. The platform handles tracking, attribution, and automated payouts via Stripe Connect.

### For Founders
- Create revenue-share programs with custom commission rates
- Coupon-based and link-based attribution tracking
- Automated Stripe Connect payouts
- Refund-aware commission calculations
- Performance rewards and milestone incentives

### For Marketers
- Discover and apply to affiliate programs
- Real-time earnings dashboard
- Transparent payout schedules
- No platform fees - 100% of commissions go to you

## Tech Stack

- **Framework**: Next.js 16 with React 19
- **Database**: PostgreSQL via Supabase
- **ORM**: Prisma 7
- **Payments**: Stripe Connect
- **Email**: Resend
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS v4

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (or Supabase account)
- Stripe account with Connect enabled
- Resend account for transactional emails

### Installation

1. Clone the repository:
```bash
git clone https://github.com/TD-Producoes/revshare.git
cd revshare
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

4. Configure your `.env` file with your credentials (see Environment Variables section)

5. Run database migrations:
```bash
npm run db:migrate
```

6. Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

## Environment Variables

See `.env.example` for all required variables. Key configurations:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key |
| `PLATFORM_STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_CONNECT_CLIENT_ID` | Stripe Connect client ID |
| `RESEND_API_KEY` | Resend API key for emails |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:generate` | Generate Prisma client |
| `npm run email:dev` | Preview email templates |

## Project Structure

```
├── app/                  # Next.js App Router pages and API routes
│   ├── (auth)/          # Authentication pages
│   ├── (dashboard)/     # Dashboard pages (founder/marketer)
│   ├── api/             # API routes
│   └── ...
├── components/          # React components
├── lib/                 # Utilities and shared logic
├── prisma/              # Database schema and migrations
├── emails/              # React Email templates
└── public/              # Static assets
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security

For security concerns, please see [SECURITY.md](SECURITY.md).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Links

- [Documentation](https://docs.revshare.dev)
- [Report a Bug](https://github.com/TD-Producoes/revshare/issues)
- [Request a Feature](https://github.com/TD-Producoes/revshare/issues)
