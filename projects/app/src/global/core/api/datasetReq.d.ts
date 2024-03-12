import {
  TrainingModeEnum,
  DatasetCollectionTypeEnum,
  DatasetTypeEnum
} from '@/packages/global/core/dataset/constants';
import type { RequestPaging } from '@/types';
import { TrainingModeEnum } from '@/packages/global/core/dataset/constants';
import type { SearchTestItemType } from '@/types/core/dataset';
import { UploadChunkItemType } from '@/packages/global/core/dataset/type';
import { DatasetCollectionSchemaType } from '@/packages/global/core/dataset/type';
import { PermissionTypeEnum } from '@/packages/global/support/permission/constant';
import type { LLMModelItemType } from '@/packages/global/core/ai/model.d';

/* ===== dataset ===== */

/* ======= collections =========== */
export type GetDatasetCollectionsProps = RequestPaging & {
  datasetId: string;
  parentId?: string;
  searchText?: string;
  simple?: boolean;
  selectFolder?: boolean;
};

export type UpdateDatasetCollectionParams = {
  id: string;
  parentId?: string;
  name?: string;
};

/* ==== data ===== */
export type GetDatasetDataListProps = RequestPaging & {
  searchText?: string;
  collectionId: string;
};
