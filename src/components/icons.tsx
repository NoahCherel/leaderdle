import type { SVGProps } from 'react';

type P = SVGProps<SVGSVGElement> & { size?: number; weight?: number };

const Svg = ({ size = 24, weight = 2.5, children, ...rest }: P) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={weight}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    focusable="false"
    {...rest}
  >
    {children}
  </svg>
);

export const IconCheck = (p: P) => <Svg weight={4} {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>;
export const IconWave = (p: P) => <Svg weight={4} {...p}><path d="M5 9c2.5-2.5 4.5-2.5 7 0s4.5 2.5 7 0M5 15c2.5-2.5 4.5-2.5 7 0s4.5 2.5 7 0" /></Svg>;
export const IconUp = (p: P) => <Svg weight={3.5} {...p}><path d="M12 19V5M6 11l6-6 6 6" /></Svg>;
export const IconDown = (p: P) => <Svg weight={3.5} {...p}><path d="M12 5v14M6 13l6 6 6-6" /></Svg>;
export const IconCross = (p: P) => <Svg weight={4} {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>;
export const IconHelp = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 1-1 1.7" />
    <path d="M12 17h.01" />
  </Svg>
);
export const IconStats = (p: P) => <Svg {...p}><path d="M5 20V11M12 20V4M19 20v-6" /></Svg>;
export const IconSettings = (p: P) => (
  <Svg {...p}>
    <path d="M4 7h10M18 7h2M4 17h2M10 17h10" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="8" cy="17" r="2" />
  </Svg>
);
export const IconBulb = (p: P) => (
  <Svg {...p}><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.6.5 1 1.2 1 2V16h5.2v-.2c0-.8.4-1.5 1-2A6 6 0 0 0 12 3z" /></Svg>
);
export const IconShare = (p: P) => <Svg {...p}><path d="M12 15V4M7.5 8.5L12 4l4.5 4.5M5 13v6h14v-6" /></Svg>;
export const IconBack = (p: P) => <Svg weight={3} {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></Svg>;
export const IconStar = (p: P) => (
  <Svg {...p}><path d="M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.9 6.6 19.8l1.1-6.1L3.2 9.4l6.1-.8z" /></Svg>
);
export const IconGrip = (p: P) => (
  <Svg weight={3} {...p}><path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" /></Svg>
);
export const IconFlame = ({ size = 18 }: { size?: number }) => (
  <svg aria-hidden="true" focusable="false" width={size} height={size} viewBox="0 0 24 24" fill="#FFD23F" stroke="#0A0912" strokeWidth={2.5} strokeLinejoin="round">
    <path d="M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3 0-6 1-9z" />
  </svg>
);
