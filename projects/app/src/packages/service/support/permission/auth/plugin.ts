import { AuthResponseType } from '@/packages/global/support/permission/type';
import { AuthModeType } from '../type';
import { parseHeaderCert } from '../controller';
import { getTmbInfoByTmbId } from '../../user/team/controller';
import { TeamMemberRoleEnum } from '@/packages/global/support/user/team/constant';
import { MongoPlugin } from '../../../core/plugin/schema';
import { PluginErrEnum } from '@/packages/global/common/error/code/plugin';
import { PluginItemSchema } from '@/packages/global/core/plugin/type';
import { splitCombinePluginId } from '../../../core/plugin/controller';
import { PluginSourceEnum } from '@/packages/global/core/plugin/constants';

export async function authPluginCrud({
  id,
  per = 'owner',
  ...props
}: AuthModeType & {
  id: string;
}): Promise<
  AuthResponseType & {
    plugin: PluginItemSchema;
  }
> {
  const result = await parseHeaderCert(props);
  const { tmbId, teamId } = result;

  const { role } = await getTmbInfoByTmbId({ tmbId });

  const { plugin, isOwner, canWrite } = await (async () => {
    const plugin = await MongoPlugin.findOne({ _id: id, teamId });

    if (!plugin) {
      throw new Error(PluginErrEnum.unExist);
    }

    const isOwner = String(plugin.tmbId) === tmbId || role === TeamMemberRoleEnum.owner;
    const canWrite = isOwner;

    if (per === 'w' && !canWrite) {
      return Promise.reject(PluginErrEnum.unAuth);
    }
    if (per === 'owner' && !isOwner) {
      return Promise.reject(PluginErrEnum.unAuth);
    }

    return {
      plugin,
      isOwner,
      canWrite
    };
  })();

  return {
    ...result,
    plugin,
    isOwner,
    canWrite
  };
}

export async function authPluginCanUse({
  id,
  teamId,
  tmbId
}: {
  id: string;
  teamId: string;
  tmbId: string;
}) {
  const { source, pluginId } = await splitCombinePluginId(id);

  if (source === PluginSourceEnum.community) {
    return true;
  }

  if (source === PluginSourceEnum.personal) {
    const { role } = await getTmbInfoByTmbId({ tmbId });
    const plugin = await MongoPlugin.findOne({ _id: pluginId, teamId });
    if (!plugin) {
      return Promise.reject(PluginErrEnum.unExist);
    }
  }

  return true;
}
