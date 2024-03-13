import { insertData2Dataset } from '@/service/core/dataset/data/controller';
import { MongoDatasetTraining } from '@/packages/service/core/dataset/training/schema';
import { TrainingModeEnum } from '@/packages/global/core/dataset/constants';
import { checkInvalidChunkAndLock, checkTeamAiPointsAndLock } from './utils';
import { delay } from '@/packages/global/common/system/utils';
import { Op } from '@/packages/service/common/mongo';

const reduceQueue = () => {
  global.vectorQueueLen = global.vectorQueueLen > 0 ? global.vectorQueueLen - 1 : 0;

  return global.vectorQueueLen === 0;
};

/* 索引生成队列。每导入一次，就是一个单独的线程 */
export async function generateVector(): Promise<any> {
  if (global.vectorQueueLen >= global.systemEnv.vectorMaxProcess) return;
  global.vectorQueueLen++;
  const start = Date.now();

  // get training data
  const {
    data,
    dataItem,
    done = false,
    error = false
  } = await (async () => {
    try {
      const model = await MongoDatasetTraining.sqliteModel.findOne({
        where: {
          lockTime: { [Op.gt]: new Date(Date.now() - 1 * 60 * 1000) },
          mode: TrainingModeEnum.chunk
        },
        order: [['weight', 'DESC']]
      });
      if (model) {
        model.dataValues.lockTime = new Date();
        await model.save();
      }
      const data = model?.dataValues;
      // task preemption
      if (!data) {
        return {
          done: true
        };
      }
      return {
        data,
        dataItem: {
          q: data.q,
          a: data.a || '',
          indexes: data.indexes
        }
      };
    } catch (error) {
      console.log(`Get Training Data error`, error);
      return {
        error: true
      };
    }
  })();

  if (done || !data) {
    if (reduceQueue()) {
      console.log(`【index】Task done`);
    }
    return;
  }
  if (error) {
    reduceQueue();
    return generateVector();
  }

  // auth balance
  if (!(await checkTeamAiPointsAndLock(data.teamId, data.tmbId))) {
    reduceQueue();
    return generateVector();
  }

  // create vector and insert
  try {
    // invalid data
    if (!data.q.trim()) {
      await MongoDatasetTraining.findByIdAndDelete(data._id);
      reduceQueue();
      generateVector();
      return;
    }

    // insert to dataset
    const { charsLength } = await insertData2Dataset({
      teamId: data.teamId,
      tmbId: data.tmbId,
      datasetId: data.datasetId,
      collectionId: data.collectionId,
      q: dataItem.q,
      a: dataItem.a,
      chunkIndex: data.chunkIndex,
      indexes: dataItem.indexes,
      model: data.model
    });

    // delete data from training
    await MongoDatasetTraining.findByIdAndDelete(data._id);
    reduceQueue();
    generateVector();

    console.log(`embedding finished, time: ${Date.now() - start}ms`);
  } catch (err: any) {
    reduceQueue();

    if (await checkInvalidChunkAndLock({ err, data, errText: '向量模型调用失败' })) {
      return generateVector();
    }

    setTimeout(() => {
      generateVector();
    }, 1000);
  }
}
