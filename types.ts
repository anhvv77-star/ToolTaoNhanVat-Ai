
export interface Character {
  id: string;
  name: string;
  imageUrl: string;
  style: string;
  gender: string;
  age: string;
  outfit: string;
  expression: string;
}

export interface AspectRatio {
  label: string;
  value: string;
}

export type AppView = 'library' | 'createCharacter' | 'createScene' | 'results';
