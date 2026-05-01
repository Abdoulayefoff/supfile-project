import React from 'react';
import { AUTH_VERSION } from '../../constants/authConfig';
import LoginScreenV1 from './LoginScreenV1';
import LoginScreenV2 from './LoginScreenV2';

export default function LoginScreen(props: any) {
  if (AUTH_VERSION === 'v1') return <LoginScreenV1 {...props} />;
  return <LoginScreenV2 {...props} />;
}