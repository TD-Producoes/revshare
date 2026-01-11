import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

type MarketerPayoutEmailProps = {
  name?: string | null;
  amount: number;
  currency?: string | null;
  dashboardUrl: string;
};

export function MarketerPayoutEmail({
  name,
  amount,
  currency,
  dashboardUrl,
}: MarketerPayoutEmailProps) {
  const previewText = "Your payout is on the way.";
  const greetingName = name?.trim() ? ` ${name.trim()}` : "";
  const resolvedCurrency = (currency ?? "usd").toUpperCase();
  const formattedAmount = `${(amount / 100).toFixed(2)} ${resolvedCurrency}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={mainStyles}>
        <Container style={containerStyles}>
          <Section>
            <Heading style={headingStyles}>Payout sent{greetingName}</Heading>
            <Text style={textStyles}>
              We sent your payout of {formattedAmount}. It will arrive in your connected
              account shortly.
            </Text>
            <Text style={textStyles}>Track your payouts here:</Text>
            <Text style={linkStyles}>{dashboardUrl}</Text>
            <Hr style={dividerStyles} />
            <Text style={footerStyles}>Revshare</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const mainStyles = {
  backgroundColor: "#f6f5f2",
  fontFamily: "\"Helvetica Neue\", Helvetica, Arial, sans-serif",
  padding: "24px 0",
};

const containerStyles = {
  backgroundColor: "#ffffff",
  borderRadius: "12px",
  margin: "0 auto",
  padding: "32px",
  width: "100%",
  maxWidth: "520px",
};

const headingStyles = {
  fontSize: "24px",
  lineHeight: "1.2",
  margin: "0 0 16px",
};

const textStyles = {
  color: "#2d2c2a",
  fontSize: "16px",
  lineHeight: "1.5",
  margin: "0 0 16px",
};

const linkStyles = {
  color: "#b6401a",
  fontSize: "15px",
  lineHeight: "1.5",
  margin: "0",
};

const dividerStyles = {
  borderColor: "#efece7",
  margin: "24px 0 12px",
};

const footerStyles = {
  color: "#7a756f",
  fontSize: "13px",
  lineHeight: "1.4",
  margin: "0",
  textTransform: "uppercase" as const,
  letterSpacing: "0.08em",
};

export default MarketerPayoutEmail;
