import {
  Body,
  Button,
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

type ConfirmEmailTemplateProps = {
  confirmationUrl: string;
  email?: string | null;
};

export function ConfirmEmailTemplate({
  confirmationUrl,
  email,
}: ConfirmEmailTemplateProps) {
  const previewText = "Confirm your email to activate your account.";

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={mainStyles}>
        <Container style={containerStyles}>
          <Section>
            <Heading style={headingStyles}>Confirm your email</Heading>
            <Text style={textStyles}>
              {email
                ? `We received a sign up request for ${email}. Confirm your email to activate your RevShare account.`
                : "We received a sign up request. Confirm your email to activate your RevShare account."}
            </Text>
            <Button href={confirmationUrl} style={buttonStyles}>
              Confirm email
            </Button>
            <Text style={noteStyles}>
              If you did not request this, you can ignore this email.
            </Text>
            <Text style={linkStyles}>{confirmationUrl}</Text>
            <Hr style={dividerStyles} />
            <Text style={footerStyles}>RevShare</Text>
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

const buttonStyles = {
  backgroundColor: "#f59e0b",
  borderRadius: "12px",
  color: "#ffffff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: 700,
  marginBottom: "16px",
  padding: "12px 24px",
  textDecoration: "none",
};

const linkStyles = {
  color: "#b6401a",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "0 0 16px",
  wordBreak: "break-all" as const,
};

const noteStyles = {
  color: "#7a756f",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "0 0 16px",
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

export default ConfirmEmailTemplate;
