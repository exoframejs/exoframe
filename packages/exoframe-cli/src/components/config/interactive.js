import { Box, Text, useInput } from 'ink';
import inkSelectInput from 'ink-select-input';
import React, { useMemo, useState } from 'react';
import { PromptArrayInput } from './prompts/arrayInput.js';
import { PromptButton } from './prompts/button.js';
import { PromptInput } from './prompts/input.js';
import { PromptKeyValInput } from './prompts/keyvalInput.js';
import { PromptListInput } from './prompts/list.js';
import { prompts } from './promptsList.js';
import { useConfig } from './useConfig.js';

// get ink components (not use ESM yet)
const SelectInput = inkSelectInput.default;

function Status({ status }) {
  if (status === 'loading') {
    return (
      <Box>
        <Text bold color="yellow">
          Loading config...
        </Text>
      </Box>
    );
  }

  if (status === 'exists') {
    return (
      <Box>
        <Text bold color="green">
          Config already exists! Editing..
        </Text>
      </Box>
    );
  }

  if (status === 'new') {
    return (
      <Box>
        <Text bold color="green">
          Creating new config..
        </Text>
      </Box>
    );
  }

  return <Box />;
}

/**
 * Interactive config manipulation component. Allows interactively editing current config.
 *
 */
export default function InteractiveConfigUpdate() {
  const [currentField, setCurrentField] = useState(0);
  const useConfigProps = useConfig();
  const { status } = useConfigProps;

  const promptsCount = useMemo(() => prompts.length - 1, [prompts]);

  const prevPrompt = () => setCurrentField((c) => (c > 1 ? c - 1 : 0));
  const nextPrompt = () => setCurrentField((c) => (c < promptsCount ? c + 1 : promptsCount));

  useInput((input, key) => {
    if (key.return) {
      nextPrompt();
    }
    if (key.upArrow) {
      prevPrompt();
    }
    if (key.downArrow) {
      nextPrompt();
    }
  });

  const promptWidth = useMemo(() => {
    const promptMargin = 6;
    const maxTextLength = Math.max(...prompts.map((p) => p.message.length));
    // return max text length with some margin
    return maxTextLength + promptMargin;
  }, [prompts]);

  return (
    <Box flexDirection="column">
      <Status status={status} />
      <Box flexDirection="column" paddingBottom={1}>
        {prompts.map((prompt, i) => {
          switch (prompt.type) {
            case 'list':
              return (
                <PromptListInput
                  key={prompt.name}
                  prompt={prompt}
                  isCurrent={currentField === i}
                  width={promptWidth}
                  useConfig={useConfigProps}
                />
              );
            case 'array-input':
              return (
                <PromptArrayInput
                  key={prompt.name}
                  prompt={prompt}
                  isCurrent={currentField === i}
                  width={promptWidth}
                  useConfig={useConfigProps}
                />
              );
            case 'keyval-input':
              return (
                <PromptKeyValInput
                  key={prompt.name}
                  prompt={prompt}
                  isCurrent={currentField === i}
                  width={promptWidth}
                  useConfig={useConfigProps}
                />
              );
            case 'input':
              return (
                <PromptInput
                  key={prompt.name}
                  prompt={prompt}
                  isCurrent={currentField === i}
                  width={promptWidth}
                  useConfig={useConfigProps}
                />
              );
            case 'button':
              return (
                <PromptButton
                  key={prompt.name}
                  prompt={prompt}
                  isCurrent={currentField === i}
                  width={promptWidth}
                  useConfig={useConfigProps}
                />
              );
          }
        })}
      </Box>
      {status === 'saved' && (
        <Box>
          <Text bold color="green">
            Config saved!
          </Text>
        </Box>
      )}
    </Box>
  );
}
