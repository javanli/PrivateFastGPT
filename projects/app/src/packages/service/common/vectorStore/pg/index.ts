import sqlite3, { RunResult } from 'sqlite3';
import * as sqlite_vss from 'sqlite-vss';
import { PgDatasetTableName } from '../../../../../packages/global/common/vectorStore/constants';
import { EmbeddingRecallItemType } from '../type';
import path from 'path';
const sqlitePath =
  process.env.NODE_ENV === 'production'
    ? '/app/tmp/vector.sqlite'
    : path.join(process.cwd(), 'tmp/vector.sqlite');
// console.log(`sqlite path:${sqlitePath}`);
const db = new sqlite3.Database(sqlitePath);
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
      vector(1536)
  );
`);
  await PgClient.run(`
  CREATE TABLE IF NOT EXISTS ${PgDatasetTableName} (
      team_id VARCHAR(50) NOT NULL,
      data_id VARCHAR(50) NOT NULL,
      dataset_id VARCHAR(50) NOT NULL,
      collection_id VARCHAR(50) NOT NULL,
      createtime INTEGER,
      text TEXT NOT NULL,
      default_index INTEGER
  );
`);

  // await PgClient.run(
  //   `CREATE INDEX CONCURRENTLY IF NOT EXISTS vector_index ON ${PgDatasetTableName} USING hnsw (vector vector_ip_ops) WITH (m = 32, ef_construction = 64);`
  // );
  // await PgClient.run(
  //   `CREATE INDEX IF NOT EXISTS team_dataset_index ON ${PgDatasetTableName}(team_id, dataset_id);`
  // );
  // await PgClient.run(
  //   ` CREATE INDEX IF NOT EXISTS team_collection_index ON ${PgDatasetTableName}(team_id, collection_id);`
  // );
  // await PgClient.run(
  //   `CREATE INDEX IF NOT EXISTS team_id_index ON ${PgDatasetTableName}(team_id, id);`
  // );
  await PgClient.run(
    `CREATE INDEX IF NOT EXISTS create_time_index ON ${PgDatasetTableName}(createtime);`
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
  dataId: string;
  text: string;
  default_index: boolean;
}

class PgClass {
  async run(sql: string, params?: any[]) {
    return new Promise<RunResult>(function (resolve, reject) {
      const callback = function (this: any, error: Error | null) {
        if (error) {
          console.log(`pg run sql:${sql} error: ${error}`);
          reject(error);
        } else resolve(this);
      };
      if (params) {
        db.run(sql, params, callback);
      } else {
        db.run(sql, callback);
      }
    });
  }
  async all<T>(sql: string) {
    return new Promise<T[]>(function (resolve, reject) {
      db.all(sql, function (error: Error | null, rows: T[]) {
        if (error) {
          console.log(`pg all sql:${sql} error: ${error}`);
          reject(error);
        } else {
          resolve(rows);
        }
      });
    });
  }
  async insert(data: PGDataType) {
    const insertDataResult = await this.run(
      `insert into ${PgDatasetTableName}(team_id,data_id,dataset_id,collection_id,createtime,text,default_index) VALUES(?,?,?,?,?,?,?)`,
      [
        data.teamId,
        data.dataId,
        data.datasetId,
        data.collectionId,
        data.createtime?.getTime() ?? Date.now(),
        data.text,
        data.default_index ? 1 : 0
      ]
    );
    const vectorResult = await this.run(
      `insert into vss_${PgDatasetTableName}(rowid,vector) VALUES(${insertDataResult.lastID},'${JSON.stringify(data.vectors)}')`
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
    const rowIdResults = await this.all<{ rowid: number; collection_id: string }>(
      `select rowid,collection_id from ${PgDatasetTableName} where dataset_id IN (${datasetIds
        .map((id) => `'${String(id)}'`)
        .join(',')})`
    );
    const map = new Map();
    for (const row of rowIdResults) {
      map.set(row.rowid, row.collection_id);
    }
    const rowidCondition = rowIdResults.map((row) => String(row.rowid)).join(',');
    const results = await this.all<{ rowid: number; distance: number }>(
      `select rowid,distance from vss_${PgDatasetTableName} where rowid IN (${rowidCondition}) AND vss_search(vector, json('${JSON.stringify(vectors)}')) limit ${limit}`
    );
    return results.map((item) => {
      return {
        id: String(item.rowid),
        score: item.distance,
        collectionId: map.get(item.rowid) ?? ''
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
  async queryWithDataId(dataId: string) {
    const results = await this.all<{
      rowid: number;
      team_id: string;
      dataset_id: string;
      text: string;
      default_index?: number;
    }>(
      `select rowid,team_id,dataset_id,text,default_index from ${PgDatasetTableName} where data_id=${dataId}`
    );
    return results.map((row) => {
      return {
        id: String(row.rowid),
        teamId: row.team_id,
        datasetId: row.dataset_id,
        text: row.text,
        defaultIndex: row.default_index && row.default_index > 0 ? true : false,
        dataId
      };
    });
  }
}

export const PgClient = new PgClass();
export const Pg = db;
