import { CollectionWithDatasetType, DatasetSchemaType } from '@fastgpt/global/core/dataset/type';
import { MongoDatasetCollection } from './collection/schema';
import { MongoDataset } from './schema';
import { delCollectionAndRelatedSources } from './collection/controller';
import { Model } from 'Sequelize';

/* ============= dataset ========== */
/* find all datasetId by top datasetId */
export async function findDatasetAndAllChildren({
  teamId,
  datasetId,
  fields
}: {
  teamId: string;
  datasetId: string;
  fields?: string;
}): Promise<DatasetSchemaType[]> {
  const find = async (id: string) => {
    const children = (
      await MongoDataset.findAll<Model<DatasetSchemaType>>({
        where: {
          parentId: id
        }
      })
    ).map((value) => value.dataValues);

    let datasets = children;

    for (const child of children) {
      const grandChildrenIds = await find(child._id);
      datasets = datasets.concat(grandChildrenIds);
    }

    return datasets;
  };
  const [dataset, childDatasets] = await Promise.all([
    MongoDataset.findOne({
      where: {
        _id: datasetId
      }
    }).then((value) => value?.dataValues),
    find(datasetId)
  ]);

  if (!dataset) {
    return Promise.reject('Dataset not found');
  }

  return [dataset, ...childDatasets];
}

export async function getCollectionWithDataset(collectionId: string) {
  const data = (
    await MongoDatasetCollection.findOne<Model<CollectionWithDatasetType>>({
      where: {
        _id: collectionId
      },
      include: MongoDataset
    })
  )?.dataValues;
  if (!data) {
    return Promise.reject('Collection is not exist');
  }
  return data;
}

/* delete all data by datasetIds */
export async function delDatasetRelevantData({ datasets }: { datasets: DatasetSchemaType[] }) {
  // if (!datasets.length) return;
  // const teamId = datasets[0].teamId;
  // if (!teamId) {
  //   return Promise.reject('teamId is required');
  // }
  // const datasetIds = datasets.map((item) => String(item._id));
  // // Get _id, teamId, fileId, metadata.relatedImgId for all collections
  // const collections = await MongoDatasetCollection.find(
  //   {
  //     teamId,
  //     datasetId: { $in: datasetIds }
  //   },
  // )
  // await delCollectionAndRelatedSources({ collections, session });
}
