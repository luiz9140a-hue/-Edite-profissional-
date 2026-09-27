export class TypographyResponsiveEngine {
  public static getClampTypography(): Record<string, string> {
    return {
      h1: 'clamp(1.75rem, 4vw + 1rem, 3rem)',
      h2: 'clamp(1.35rem, 3vw + 0.75rem, 2.25rem)',
      h3: 'clamp(1.15rem, 2vw + 0.5rem, 1.75rem)',
      body: 'clamp(0.875rem, 1vw + 0.5rem, 1rem)',
      caption: 'clamp(0.75rem, 0.5vw + 0.5rem, 0.875rem)'
    };
  }
}
