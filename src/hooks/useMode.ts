import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { useAtom, useAtomValue } from 'jotai';

export type Mode = 'simplified' | 'full';

const modeAtom = atomWithStorage<Mode>('mode', 'simplified');

export function useMode() {
  const [mode, setMode] = useAtom(modeAtom);
  const isSimplified = mode === 'simplified';
  const isFull = mode === 'full';

  return {
    mode,
    setMode,
    isSimplified,
    isFull,
  };
}
