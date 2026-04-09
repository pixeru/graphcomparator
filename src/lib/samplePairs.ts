export interface SamplePair {
  id: string
  label: string
  blurb: string
  leftName: string
  rightName: string
  leftPath: string
  rightPath: string
}

export const samplePairs: SamplePair[] = [
  {
    id: 'close_pair',
    label: 'close pair',
    blurb: 'Two nearly overlapping curves with small noise and shifted x positions.',
    leftName: 'close_pair_a.csv',
    rightName: 'close_pair_b.csv',
    leftPath: '/samples/close_pair_a.csv',
    rightPath: '/samples/close_pair_b.csv',
  },
  {
    id: 'medium_pair',
    label: 'medium pair',
    blurb: 'Same general shape, but with visible offset and amplitude drift.',
    leftName: 'medium_pair_a.csv',
    rightName: 'medium_pair_b.csv',
    leftPath: '/samples/medium_pair_a.csv',
    rightPath: '/samples/medium_pair_b.csv',
  },
  {
    id: 'far_pair',
    label: 'far pair',
    blurb: 'A deliberately different curve that diverges strongly from the reference.',
    leftName: 'far_pair_a.csv',
    rightName: 'far_pair_b.csv',
    leftPath: '/samples/far_pair_a.csv',
    rightPath: '/samples/far_pair_b.csv',
  },
]
