import React, { useMemo } from 'react';
import { Box, BoxProps, Image } from '@chakra-ui/react';
import { useToast } from '@/packages/web/hooks/useToast';
import { getErrText } from '@/packages/global/common/error/utils';
import MyTooltip from '@/components/MyTooltip';
import { useTranslation } from 'next-i18next';
import { getFileAndOpen } from '@/web/core/dataset/utils';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { getSourceNameIcon } from '@/packages/global/core/dataset/utils';
import MyIcon from '@/packages/web/components/common/Icon';

type Props = BoxProps & {
  sourceName?: string;
  sourceId?: string;
  canView?: boolean;
};

const RawSourceBox = ({ sourceId, sourceName = '', canView = true, ...props }: Props) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { setLoading } = useSystemStore();

  const canPreview = useMemo(() => !!sourceId && canView, [canView, sourceId]);

  const icon = useMemo(() => getSourceNameIcon({ sourceId, sourceName }), [sourceId, sourceName]);

  return (
    <MyTooltip
      label={canPreview ? t('file.Click to view file') || '' : ''}
      shouldWrapChildren={false}
    >
      <Box
        color={'myGray.600'}
        display={'inline-flex'}
        whiteSpace={'nowrap'}
        {...(canPreview
          ? {
              cursor: 'pointer',
              textDecoration: 'underline',
              onClick: async () => {
                setLoading(true);
                try {
                  await getFileAndOpen(sourceId as string);
                } catch (error) {
                  toast({
                    title: t(getErrText(error, 'error.fileNotFound')),
                    status: 'error'
                  });
                }
                setLoading(false);
              }
            }
          : {})}
        {...props}
      >
        <MyIcon name={icon as any} w={['14px', '16px']} mr={2} />
        <Box
          maxW={['200px', '300px']}
          className={props.className ?? 'textEllipsis'}
          wordBreak={'break-all'}
        >
          {sourceName || t('common.UnKnow Source')}
        </Box>
      </Box>
    </MyTooltip>
  );
};

export default RawSourceBox;
