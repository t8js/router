import type {LocationPattern} from './LocationPattern';
import type {MatchState} from './MatchState';

export type MatchHandler<P extends LocationPattern, T> = (
    payload: MatchState<P>,
) => T;
