# Basic Demo

A minimal example demonstrating `@syntropy-labs/react-web-speech`.

## Setup

```bash
# From the root of the repository
cd examples/basic-demo
yarn install
yarn dev
```

## Features Demonstrated

- `useSpeechInputWithCursor` hook
- Cursor-aware text insertion
- Silence timeout
- Permission state handling
- Start/Stop toggling

## Note

This example uses `link:../..` to reference the local package. The parent package must be built first:

```bash
# From root
yarn build

# Then run the example
cd examples/basic-demo
yarn dev
```
