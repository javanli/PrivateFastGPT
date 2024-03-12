import {
  StandardSubLevelEnum,
  SubModeEnum,
  SubStatusEnum,
  SubTypeEnum
} from '@/packages/global/support/wallet/sub/constants';
import { FeTeamPlanStatusType } from '@/packages/global/support/wallet/sub/type.d';
import { getVectorCountByTeamId } from '../../../common/vectorStore/controller';
import dayjs from 'dayjs';
import { ClientSession } from '../../../common/mongo';
import { addMonths } from 'date-fns';

export const getStandardPlans = () => {
  return global?.subPlans?.standard;
};
export const getStandardPlan = (level: `${StandardSubLevelEnum}`) => {
  return global.subPlans?.standard?.[level];
};
export function getDefaultPlan() {
  return {
    _id: '0',
    teamId: '0',
    type: SubTypeEnum.standard,
    status: SubStatusEnum.active,
    startTime: new Date(0),
    expiredTime: new Date(Date.now() + 100000000),
    price: 0,

    currentMode: SubModeEnum.year,
    nextMode: SubModeEnum.year,
    currentSubLevel: StandardSubLevelEnum.experience,
    nextSubLevel: StandardSubLevelEnum.experience,

    pointPrice: 0,
    totalPoints: 99999999,
    surplusPoints: 99999999,

    currentExtraDatasetSize: 99999999
  };
}
export const getTeamStandPlan = async ({ teamId }: { teamId: string }) => {
  const standardPlans = global.subPlans?.standard;
  const standard = getDefaultPlan();

  return {
    [SubTypeEnum.standard]: standard,
    standardConstants:
      standard?.currentSubLevel && standardPlans
        ? standardPlans[standard.currentSubLevel]
        : undefined
  };
};

export const initTeamStandardPlan2Free = async ({
  teamId,
  session
}: {
  teamId: string;
  session?: ClientSession;
}) => {
  return getDefaultPlan();
};

export const getTeamPlanStatus = async ({
  teamId
}: {
  teamId: string;
}): Promise<FeTeamPlanStatusType> => {
  const standardPlans = global.subPlans?.standard;
  const plans = [getDefaultPlan()];
  const usedDatasetSize = await getVectorCountByTeamId(teamId);

  const standard = plans.find((plan) => plan.type === SubTypeEnum.standard);
  const extraDatasetSize = plans.filter((plan) => plan.type === SubTypeEnum.extraDatasetSize);
  const extraPoints = plans.filter((plan) => plan.type === SubTypeEnum.extraPoints);

  // Free user, first login after expiration. The free subscription plan will be reset
  if (
    standard &&
    standard.expiredTime &&
    standard.currentSubLevel === StandardSubLevelEnum.free &&
    dayjs(standard.expiredTime).isBefore(new Date())
  ) {
    console.log('Init free stand plan', { teamId });
    await initTeamStandardPlan2Free({ teamId });
    return getTeamPlanStatus({ teamId });
  }

  const totalPoints = standardPlans
    ? (standard?.totalPoints || 0) +
      extraPoints.reduce((acc, cur) => acc + (cur.totalPoints || 0), 0)
    : Infinity;
  const surplusPoints =
    (standard?.surplusPoints || 0) +
    extraPoints.reduce((acc, cur) => acc + (cur.surplusPoints || 0), 0);

  const standardMaxDatasetSize =
    standard?.currentSubLevel && standardPlans
      ? standardPlans[standard.currentSubLevel]?.maxDatasetSize || Infinity
      : Infinity;
  const totalDatasetSize =
    standardMaxDatasetSize +
    extraDatasetSize.reduce((acc, cur) => acc + (cur.currentExtraDatasetSize || 0), 0);

  return {
    [SubTypeEnum.standard]: standard,
    standardConstants:
      standard?.currentSubLevel && standardPlans
        ? standardPlans[standard.currentSubLevel]
        : undefined,

    totalPoints,
    usedPoints: totalPoints - surplusPoints,

    datasetMaxSize: totalDatasetSize,
    usedDatasetSize
  };
};
