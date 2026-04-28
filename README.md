# Gwangjang Demo

Nemonic World의 기존 데모 페이지를 참고해 분리한 광장 데모 레포입니다.

## Stack

- Next.js 16 App Router
- TypeScript
- React 19
- Tailwind CSS v4
- Three.js, React Three Fiber, Drei, Rapier
- Zustand
- Konva, React Konva

## Getting Started

```bash
corepack enable
pnpm install
pnpm dev
```

브라우저에서 `http://localhost:3000`으로 접속합니다.

## Scripts

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
```

## Archived Vite Demos

Two standalone Vite/Three.js demos are included under `demos/`.

```bash
pnpm demo:v1:install
pnpm demo:v1:dev
pnpm demo:v1:build

pnpm demo:v2:install
pnpm demo:v2:dev
pnpm demo:v2:build
```

- `demos/v1`: Nemonic World Demo V1, default preview port `4174`
- `demos/v2`: Nemonic World Demo V2, default preview port `4173`

Generated folders such as `node_modules`, `dist`, `output`, Playwright cache, and logs were intentionally excluded.

## Source Reference

이 레포는 `SSAFY14-S208/nemonic-prototype`의 `apps/prototype-next`를 출발점으로 만들었습니다.

초기 목표는 기존 Nemonic World 데모의 3D 인터랙션, 프린터 체험, 월드 전환 구조를 참고해 광장 중심의 독립 데모로 발전시키는 것입니다.
