import * as sqlite3 from 'sqlite3';

declare global {
  var pgClient: sqlite3.Database | null;
}

export type EmbeddingRecallItemType = {
  id: string;
  collectionId: string;
  score: number;
};
