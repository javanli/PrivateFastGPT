import { UserGuideModule } from '@/packages/global/core/module/template/system/userGuide';
import { UserInputModule } from '@/packages/global/core/module/template/system/userInput';
import { AiChatModule } from '@/packages/global/core/module/template/system/aiChat';
import { DatasetSearchModule } from '@/packages/global/core/module/template/system/datasetSearch';
import { DatasetConcatModule } from '@/packages/global/core/module/template/system/datasetConcat';
import { AssignedAnswerModule } from '@/packages/global/core/module/template/system/assignedAnswer';
import { ClassifyQuestionModule } from '@/packages/global/core/module/template/system/classifyQuestion';
import { ContextExtractModule } from '@/packages/global/core/module/template/system/contextExtract';
import { HttpModule468 } from '@/packages/global/core/module/template/system/http468';
import { HttpModule } from '@/packages/global/core/module/template/system/abandon/http';

import { RunAppModule } from '@/packages/global/core/module/template/system/runApp';
import { PluginInputModule } from '@/packages/global/core/module/template/system/pluginInput';
import { PluginOutputModule } from '@/packages/global/core/module/template/system/pluginOutput';
import { RunPluginModule } from '@/packages/global/core/module/template/system/runPlugin';
import { AiQueryExtension } from '@/packages/global/core/module/template/system/queryExtension';

import type {
  FlowModuleTemplateType,
  moduleTemplateListType
} from '@/packages/global/core/module/type.d';
import { ModuleTemplateTypeEnum } from '@/packages/global/core/module/constants';

export const appSystemModuleTemplates: FlowModuleTemplateType[] = [
  UserGuideModule,
  UserInputModule,
  AiChatModule,
  AssignedAnswerModule,
  DatasetSearchModule,
  DatasetConcatModule,
  RunAppModule,
  ClassifyQuestionModule,
  ContextExtractModule,
  HttpModule468,
  AiQueryExtension
];
export const pluginSystemModuleTemplates: FlowModuleTemplateType[] = [
  PluginInputModule,
  PluginOutputModule,
  AiChatModule,
  AssignedAnswerModule,
  DatasetSearchModule,
  DatasetConcatModule,
  RunAppModule,
  ClassifyQuestionModule,
  ContextExtractModule,
  HttpModule468,
  AiQueryExtension
];

export const moduleTemplatesFlat: FlowModuleTemplateType[] = [
  UserGuideModule,
  UserInputModule,
  AiChatModule,
  DatasetSearchModule,
  DatasetConcatModule,
  AssignedAnswerModule,
  ClassifyQuestionModule,
  ContextExtractModule,
  HttpModule468,
  HttpModule,
  RunAppModule,
  PluginInputModule,
  PluginOutputModule,
  RunPluginModule,
  AiQueryExtension
];

export const moduleTemplatesList: moduleTemplateListType = [
  {
    type: ModuleTemplateTypeEnum.userGuide,
    label: 'core.module.template.Guide module',
    list: []
  },
  {
    type: ModuleTemplateTypeEnum.systemInput,
    label: 'core.module.template.System input module',
    list: []
  },
  {
    type: ModuleTemplateTypeEnum.textAnswer,
    label: 'core.module.template.Response module',
    list: []
  },
  {
    type: ModuleTemplateTypeEnum.functionCall,
    label: 'core.module.template.Function module',
    list: []
  },
  {
    type: ModuleTemplateTypeEnum.tools,
    label: 'core.module.template.Tool module',
    list: []
  },
  {
    type: ModuleTemplateTypeEnum.externalCall,
    label: 'core.module.template.External module',
    list: []
  },
  {
    type: ModuleTemplateTypeEnum.personalPlugin,
    label: 'core.module.template.My plugin module',
    list: []
  },
  {
    type: ModuleTemplateTypeEnum.other,
    label: '其他',
    list: []
  }
];
