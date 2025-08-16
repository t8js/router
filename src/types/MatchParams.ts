import type {UnpackedURLSchema, URLSchema} from 'unpack-schema';
import type {LocationPattern} from './LocationPattern';
import type {LocationShape} from './LocationShape';

export type MatchParams<P extends LocationPattern> = P extends {
    _schema: URLSchema;
}
    ? UnpackedURLSchema<P['_schema']>
    : LocationShape<string | undefined>;
