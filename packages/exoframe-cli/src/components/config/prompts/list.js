import { Box, Text } from 'ink';
import inkSelectInput from 'ink-select-input-horizontal';
import get from 'lodash/get.js';
import React, { useCallback, useMemo } from 'react';

// get ink components (not use ESM yet)
const SelectInput = inkSelectInput.default;

export function PromptListInput({ prompt, width, isCurrent, useConfig }) {
  const { config, updateConfig } = useConfig;
  const val = useMemo(() => get(config, prompt.prop) ?? '', [prompt, config]);
  const handleSelect = useCallback(
    (val) => {
      updateConfig(prompt.prop, val.value);
    },
    [prompt, updateConfig]
  );

  return (
    <Box flexDirection="row" key={prompt.name}>
      <Box width={width}>
        {isCurrent ? <Text color="blue">&gt; </Text> : <Text>&nbsp;&nbsp;</Text>}
        <Text color={isCurrent ? 'blue' : 'white'}>{prompt.message}</Text>
      </Box>
      <Box>
        {!isCurrent && <Text>{String(val)}</Text>}
        {isCurrent && (
          <SelectInput
            items={prompt.list}
            initialIndex={prompt.list.findIndex((i) => i.value === val)}
            onSelect={handleSelect}
          />
        )}
      </Box>
    </Box>
  );
}
