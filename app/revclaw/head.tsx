export default function Head() {
  return (
    <>
      {/* Fonts (route-scoped): match openclaw.ai */}
      <link rel="preconnect" href="https://api.fontshare.com" />
      <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="" />
      <link
        href="https://api.fontshare.com/v2/css?f[]=clash-display@700,600,500&f[]=satoshi@400,500,700&display=swap"
        rel="stylesheet"
      />
    </>
  );
}
