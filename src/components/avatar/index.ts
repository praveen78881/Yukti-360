/* Public surface of the assistant avatar.

   Importing from here pulls in the behaviour layer only (a few kB). The 3D
   scene and its ~1MB of libraries arrive through the lazy import inside
   AssistantAvatar, and only once the avatar is near the viewport. */

export { AssistantAvatar, default } from './AssistantAvatar';
export type { AssistantAvatarProps } from './AssistantAvatar';
export { AvatarController } from './controller';
export { EXPRESSIONS, EXPRESSION_NAMES, DEFAULT_GLOW } from './expressions';
export { GESTURE_NAMES } from './gestures';
export type {
  AssistantAvatarHandle,
  AvatarFrame,
  ExpressionName,
  ExpressionPose,
  EyeShape,
  FaceFrame,
  GestureName,
  SpeakOptions,
} from './types';
