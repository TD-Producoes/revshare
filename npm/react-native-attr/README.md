# Marketplace Attribution (React Native)

Minimal attribution helper for tracking marketer deep links in React Native.

## Install

```bash
npm install @marketplace/attribution @react-native-async-storage/async-storage
```

## Usage

```tsx
import { AttributionTracker } from "@marketplace/attribution";

export function App() {
  return (
    <>
      <AttributionTracker
        appKey="your-app-key"
        baseUrl="https://your-marketplace.com"
      />
      {/* rest of app */}
    </>
  );
}
```

The component listens for deep links like:

```
appstore.com/ex_app?marketerId=123
```

and posts a click to:

```
https://your-marketplace.com/api/attribution/click
```

## Options

- `marketerParam` (default `marketerId`)
- `endpoint` (default `/api/attribution/click`)
- `deviceStorageKey` (default `@marketplace/attribution/device-id`)
- `dedupe` (default `true`)
- `onTracked` callback for success/failure

## Build

```bash
npm run build
```
