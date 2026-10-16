// Audio files imported by the generated narration modules resolve to their URL in the bundle.
declare module '*.wav' {
  const src: string;
  export default src;
}
