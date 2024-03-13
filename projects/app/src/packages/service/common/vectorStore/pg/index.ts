import sqlite3, { RunResult } from 'sqlite3';
import * as sqlite_vss from 'sqlite-vss';
import { PgDatasetTableName } from '../../../../../packages/global/common/vectorStore/constants';
import { EmbeddingRecallItemType } from '../type';
const db = new sqlite3.Database(':memory:');
const databaseWrapper = {
  loadExtension(file: string, entrypoint?: string | undefined) {
    db.loadExtension(file);
  }
};
sqlite_vss.load(databaseWrapper);

export const connectPg = async (): Promise<sqlite3.Database> => {
  if (global.pgClient) {
    return global.pgClient;
  }
  global.pgClient = db;

  await PgClient.run(`
  CREATE VIRTUAL TABLE IF NOT EXISTS vss_${PgDatasetTableName} using vss0(
      vector(1536),
  );
`);
  await PgClient.run(`
  CREATE TABLE IF NOT EXISTS ${PgDatasetTableName} (
      team_id VARCHAR(50) NOT NULL,
      dataset_id VARCHAR(50) NOT NULL,
      collection_id VARCHAR(50) NOT NULL,
      createtime INTEGER,
  );
`);

  // await PgClient.run(
  //   `CREATE INDEX CONCURRENTLY IF NOT EXISTS vector_index ON ${PgDatasetTableName} USING hnsw (vector vector_ip_ops) WITH (m = 32, ef_construction = 64);`
  // );
  await PgClient.run(
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS team_dataset_index ON ${PgDatasetTableName}(team_id, dataset_id);`
  );
  await PgClient.run(
    ` CREATE INDEX CONCURRENTLY IF NOT EXISTS team_collection_index ON ${PgDatasetTableName}(team_id, collection_id);`
  );
  await PgClient.run(
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS team_id_index ON ${PgDatasetTableName}(team_id, id);`
  );
  await PgClient.run(
    `CREATE INDEX CONCURRENTLY IF NOT EXISTS create_time_index ON ${PgDatasetTableName}(createtime);`
  );

  console.log('pg connected');
  return global.pgClient;
};
interface PGDataType {
  teamId: string;
  datasetId: string;
  collectionId: string;
  vectors: number[];
  createtime?: Date;
}

class PgClass {
  async run(sql: string) {
    console.log(`pg run: ${sql}`);
    return new Promise<RunResult>(function (resolve, reject) {
      db.run(sql, function (result: RunResult, error: Error | null) {
        if (error) {
          console.log(`error:pg run ${sql}, error: ${error}`);
          reject(error);
        } else resolve(result);
      });
    });
  }
  async all<T>(sql: string) {
    return new Promise<T[]>(function (resolve, reject) {
      db.all(sql, function (result: RunResult, error: Error | null, rows: T[]) {
        if (error) reject(error);
        else resolve(rows);
      });
    });
  }
  async insert(data: PGDataType) {
    const insertDataResult = await this.run(
      `insert into ${PgDatasetTableName}(team_id,dataset_id,collection_id,createtime) VALUES(${data.teamId},${data.datasetId},${data.collectionId},${data.createtime?.getTime() ?? Date.now()})`
    );
    const vectorResult = await this.run(
      `insert into vss_${PgDatasetTableName} VALUES(rowid,vectors) (${insertDataResult.lastID},${JSON.stringify(data.vectors)})`
    );
    return vectorResult;
  }
  async deleteWithId(id: string) {
    await this.run(`delete from ${PgDatasetTableName} where rowid=${id}`);
    const vectorResult = await this.run(`delete from vss_${PgDatasetTableName} where rowid=${id}`);
    return vectorResult;
  }
  async deleteWithDatasetIds(teamId: string, datasetIds: string[]) {
    const results = await this.all<{ rowid: number }>(
      `select rowid from ${PgDatasetTableName} where team_id=${teamId} AND dataset_id IN (${datasetIds
        .map((id) => `'${String(id)}'`)
        .join(',')})`
    );
    const rowidCondition = results.map((row) => String(row.rowid)).join(',');
    await this.run(`delete from ${PgDatasetTableName} where rowid IN (${rowidCondition})`);
    await this.run(`delete from vss_${PgDatasetTableName} where rowid IN (${rowidCondition})`);
  }
  async deleteWithCollectionIds(teamId: string, collectionIds: string[]) {
    const results = await this.all<{ rowid: number }>(
      `select rowid from ${PgDatasetTableName} where team_id=${teamId} AND collection_id IN (${collectionIds
        .map((id) => `'${String(id)}'`)
        .join(',')})`
    );
    const rowidCondition = results.map((row) => String(row.rowid)).join(',');
    await this.run(`delete from ${PgDatasetTableName} where rowid IN (${rowidCondition})`);
    await this.run(`delete from vss_${PgDatasetTableName} where rowid IN (${rowidCondition})`);
  }
  async deleteWithIds(ids: string[]) {
    const rowidCondition = ids.join(',');
    await this.run(`delete from ${PgDatasetTableName} where rowid IN (${rowidCondition})`);
    await this.run(`delete from vss_${PgDatasetTableName} where rowid IN (${rowidCondition})`);
  }
  async embeddingRecall(
    vectors: number[],
    datasetIds: string[],
    limit: number
  ): Promise<EmbeddingRecallItemType[]> {
    const rowIdResults = await this.all<{ rowid: number }>(
      `select rowid from ${PgDatasetTableName} where dataset_id IN (${datasetIds
        .map((id) => `'${String(id)}'`)
        .join(',')})`
    );
    const rowidCondition = rowIdResults.map((row) => String(row.rowid)).join(',');
    const results = await this.all<{ rowid: number; distance: number }>(
      `select rowid,distance from vss_${PgDatasetTableName} where rowid IN (${rowidCondition}) AND vss_search(vector, ${JSON.stringify(vectors)}) limit ${limit}`
    );
    return results.map((item) => {
      return {
        id: String(item.rowid),
        score: item.distance,
        collectionId: '0'
      };
    });
  }
  async teamCount(teamId: string) {
    const results = await this.all<{ count: number }>(
      `select count(*) as count from ${PgDatasetTableName} where team_id=${teamId}`
    );
    return results && results.length > 0 ? results[0].count : 0;
  }
  async queryBetweenTime(start: Date, end: Date) {
    const results = await this.all<{ rowid: number; team_id: string; dataset_id: string }>(
      `select rowid,team_id,dataset_id from ${PgDatasetTableName} where createtime between ${start.getTime()} AND ${end.getTime()}`
    );
    return results.map((row) => {
      return {
        id: String(row.rowid),
        teamId: row.team_id,
        datasetId: row.dataset_id
      };
    });
  }
}

export const PgClient = new PgClass();
export const Pg = db;
