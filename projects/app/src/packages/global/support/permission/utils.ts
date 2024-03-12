import { TeamMemberRoleEnum } from '../user/team/constant';
import { PermissionTypeEnum } from './constant';

/* team public source, or owner source in team */
export function mongoRPermission({
  teamId,
  tmbId,
  role
}: {
  teamId: string;
  tmbId: string;
  role: `${TeamMemberRoleEnum}`;
}) {
  return {
    teamId
  };
}
export function mongoOwnerPermission({ teamId, tmbId }: { teamId: string; tmbId: string }) {
  return {
    teamId,
    tmbId
  };
}
