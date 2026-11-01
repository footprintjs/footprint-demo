# FootPrint Demo

A React and TypeScript demo app for exploring FootPrint workflow execution. It presents a loan-application flow
and a customer-support troubleshooting flow, with recorded stages, state changes, narratives and flowchart views.
This repository is a demo application, not the FootPrint engine or an npm library.

[Demo site](https://footprintjs.github.io/footprint-demo/) ·
[Current FootPrint documentation](https://footprintjs.github.io/footPrint/) ·
[Interactive playground](https://footprintjs.github.io/footprint-playground/)

## What is here

- [Loan application](src/apps/loan-application/LoanApp.tsx): enter an application and inspect its workflow result.
- [Customer support](src/apps/customer-support/CustomerSupportApp.tsx): inspect a sample troubleshooting result
  and compare its recorded narrative with raw-log prompt text.
- [Behind the scenes](src/apps/loan-application/BehindTheScenes.tsx): time-travel controls, memory and scope
  differences, narrative rendering and the traced flowchart from `footprint-explainable-ui`.

The pipeline modules re-export `footprint-samples/demos/loan-application` and
`footprint-samples/demos/customer-support`; the workflow implementations live in that sibling package. The UI's
prompt-comparison text is a demonstration, not a measured guarantee about model accuracy, cost or financial decisions.

## Local development requires sibling packages

[package.json](package.json) declares three local `file:` dependencies. A standalone clone cannot resolve them:

```text
workspace/
  footPrint/
  explainable-ui/
  footprint-samples/
  footprint-demo/
```

Prepare those sibling packages using their own installation/build instructions so their declared package entry
points are available. The local links must resolve compatible versions; the current releases of the independent
libraries are not verified as a working combination by this demo README.

Once those dependencies are ready, these are the app's declared commands:

```bash
npm install
npm run dev
```

| Command | Declared behavior |
|---|---|
| `npm run dev` | Start Vite's development server. |
| `npm run build` | Run the TypeScript project build, then create the Vite bundle. |
| `npm run lint` | Run ESLint. |
| `npm run preview` | Preview an existing production bundle. |

The app uses React, React Router, Vite and Tailwind. [vite.config.ts](vite.config.ts) keeps linked packages on one
React instance and aliases the sample package's `footprint` import to `footprintjs`.

## Deployment and version boundary

The [Pages workflow](.github/workflows/deploy.yml) checks out `footprint-samples` as a sibling. In its build job it
replaces the engine and renderer links with the older `footprintjs ^3.0.0` and `footprint-explainable-ui ^0.12.0`
ranges, runs Vite without the TypeScript build, and sets `VITE_BASE=/footprint-demo/`. That deployment setup differs
from the local `npm run build` command and does not establish compatibility with current engine/renderer releases.

For a new integration, start with the current [FootPrint engine](https://github.com/footprintjs/footPrint),
[Flow Lens renderer](https://github.com/footprintjs/explainable-ui) and
[playground](https://footprintjs.github.io/footprint-playground/) rather than copying those legacy dependency ranges.
