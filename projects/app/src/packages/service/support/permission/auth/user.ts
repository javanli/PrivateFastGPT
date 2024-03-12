import { AuthResponseType } from '@/packages/global/support/permission/type';
import { AuthModeType } from '../type';
import { TeamItemType } from '@/packages/global/support/user/team/type';
import { TeamMemberRoleEnum } from '@/packages/global/support/user/team/constant';
import { parseHeaderCert } from '../controller';
import { getDefaultTeamMember, getTmbInfoByTmbId } from '../../user/team/controller';
import { UserErrEnum } from '@/packages/global/common/error/code/user';

export async function authUserNotVisitor(props: AuthModeType): Promise<
  AuthResponseType & {
    team: TeamItemType;
    role: `${TeamMemberRoleEnum}`;
  }
> {
  const { teamId, tmbId } = await parseHeaderCert(props);
  const team = await getTmbInfoByTmbId({ tmbId });

  if (team.role === TeamMemberRoleEnum.visitor) {
    return Promise.reject(UserErrEnum.binVisitor);
  }

  return {
    teamId,
    tmbId,
    team,
    role: team.role,
    isOwner: team.role === TeamMemberRoleEnum.owner, // teamOwner
    canWrite: true
  };
}

/* auth user role  */
export async function authUserRole(props: AuthModeType): Promise<
  AuthResponseType & {
    role: `${TeamMemberRoleEnum}`;
    teamOwner: boolean;
  }
> {
  const result = await parseHeaderCert(props);
  const { role: userRole, canWrite } = getDefaultTeamMember();

  return {
    ...result,
    isOwner: true,
    role: TeamMemberRoleEnum.admin,
    teamOwner: true,
    canWrite: true
  };
}
