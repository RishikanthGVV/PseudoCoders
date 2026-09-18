import { getReplayFrame, replayRuns, type ReplayFrame } from '../data/replayData'

export type ReplaySpeed = 1 | 5 | 10 | 20

export type ReplayState = {
  runId: string
  currentCycle: number
  totalCycles: number
  speed: ReplaySpeed
  playing: boolean
  frame: ReplayFrame
}

export const createReplayState = (runId = replayRuns[0].id): ReplayState => {
  const run = replayRuns.find((item) => item.id === runId) ?? replayRuns[0]
  return {
    runId: run.id,
    currentCycle: 0,
    totalCycles: run.totalCycles,
    speed: 20,
    playing: false,
    frame: getReplayFrame(0),
  }
}

export const advanceReplay = (state: ReplayState): ReplayState => {
  const nextCycle = Math.min(state.totalCycles, state.currentCycle + state.speed / 4)
  const cycle = Math.floor(nextCycle)
  return { ...state, currentCycle: nextCycle, frame: getReplayFrame(cycle), playing: nextCycle < state.totalCycles }
}

export const resetReplay = (state: ReplayState): ReplayState => ({
  ...state,
  currentCycle: 0,
  playing: false,
  frame: getReplayFrame(0),
})
