import React from 'react';
import { AUTH_VERSION } from '../../constants/authConfig';
import ForgotPasswordScreenV1 from './ForgotPasswordScreenV1';
import ForgotPasswordScreenV2 from './ForgotPasswordScreenV2';

export default function ForgotPasswordScreen(props: any) {
  if (AUTH_VERSION === 'v1') return <ForgotPasswordScreenV1 {...props} />;
  return <ForgotPasswordScreenV2 {...props} />;
}