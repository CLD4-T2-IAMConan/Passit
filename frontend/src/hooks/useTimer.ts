import { useState, useEffect } from "react";

interface UseTimerReturn {
  timer: number;
  startTimer: (seconds: number) => void;
  resetTimer: () => void;
}

/**
 * 카운트다운 타이머 커스텀 훅
 * @returns 타이머 값과 제어 함수들
 */
export const useTimer = (): UseTimerReturn => {
  const [timer, setTimer] = useState<number>(0);

  useEffect(() => {
    if (timer > 0) {
      const countdown = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(countdown);
    }
    return undefined;
  }, [timer]);

  const startTimer = (seconds: number): void => {
    setTimer(seconds);
  };

  const resetTimer = (): void => {
    setTimer(0);
  };

  return { timer, startTimer, resetTimer };
};
