/**
 * Uses the shared WAAPI wrapper with the default tones.
 *
 * To customise sounds for this module, create a sounds.json
 * alongside this file and pass it to createAudio():
 *
 *   import sounds from '../sounds.json'
 *   export const audio = createAudio(sounds)
 */
import { createAudio } from '@vertex/shared';

export const audio = createAudio();