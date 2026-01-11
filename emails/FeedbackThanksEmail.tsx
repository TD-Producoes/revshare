import {
  Body,
  Container,
  Hr,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

type FeedbackThanksEmailProps = {
  name?: string | null;
  message: string;
  dashboardUrl: string;
};

export function FeedbackThanksEmail({
  name,
  message,
  dashboardUrl,
}: FeedbackThanksEmailProps) {
  const previewText = "Thanks for your feedback.";
  const greetingName = name?.trim() ? ` ${name.trim()}` : "";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={mainStyles}>
        <Container style={containerStyles}>
          <Section>
            <Heading style={headingStyles}>Thanks{greetingName}!</Heading>
            <Text style={textStyles}>
              We received your feedback and will review it soon. Your note helps us improve
              the marketplace.
            </Text>
            <Text style={textStyles}>
              <strong>Your message:</strong>
            </Text>
            <Text style={messageStyles}>{message}</Text>
            <Text style={textStyles}>You can keep an eye on updates here:</Text>
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

const messageStyles = {
  backgroundColor: "#f5f2ee",
  borderRadius: "8px",
  color: "#2d2c2a",
  fontSize: "15px",
  lineHeight: "1.5",
  margin: "0 0 20px",
  padding: "12px 16px",
  whiteSpace: "pre-wrap" as const,
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

export default FeedbackThanksEmail;
