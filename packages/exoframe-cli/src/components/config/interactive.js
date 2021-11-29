import { Box, Text, useFocusManager, useInput } from 'ink';
import React, { useEffect, useMemo } from 'react';
import { PromptArrayInput } from './prompts/arrayInput.js';
import { PromptAuthInput } from './prompts/auth.js';
import { PromptButton } from './prompts/button.js';
import { PromptInput } from './prompts/input.js';
import { PromptKeyValInput } from './prompts/keyvalInput.js';
import { PromptListInput } from './prompts/list.js';
import { prompts } from './promptsList.js';
import { useConfig } from './useConfig.js';

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
  const { focusNext, focusPrevious, focus } = useFocusManager();
  const useConfigProps = useConfig();
  const { status } = useConfigProps;

  useInput((input, key) => {
    if (key.return) {
      focusNext();
    }
    if (key.upArrow) {
      focusPrevious();
    }
    if (key.downArrow) {
      focusNext();
    }
  });

  // focus name input on mount
  useEffect(() => {
    focus('name');
  }, []);

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
            case 'auth':
              return (
                <PromptAuthInput key={prompt.name} prompt={prompt} width={promptWidth} useConfig={useConfigProps} />
              );
            case 'list':
              return (
                <PromptListInput key={prompt.name} prompt={prompt} width={promptWidth} useConfig={useConfigProps} />
              );
            case 'array-input':
              return (
                <PromptArrayInput key={prompt.name} prompt={prompt} width={promptWidth} useConfig={useConfigProps} />
              );
            case 'keyval-input':
              return (
                <PromptKeyValInput key={prompt.name} prompt={prompt} width={promptWidth} useConfig={useConfigProps} />
              );
            case 'input':
              return <PromptInput key={prompt.name} prompt={prompt} width={promptWidth} useConfig={useConfigProps} />;
            case 'button':
              return <PromptButton key={prompt.name} prompt={prompt} width={promptWidth} useConfig={useConfigProps} />;
            default:
              return <Box />;
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
