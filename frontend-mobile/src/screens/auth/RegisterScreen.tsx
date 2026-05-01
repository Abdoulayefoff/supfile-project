import React from 'react';
import { AUTH_VERSION } from '../../constants/authConfig';
import RegisterScreenV1 from './RegisterScreenV1';
import RegisterScreenV2 from './RegisterScreenV2';

export default function RegisterScreen(props: any) {
  if (AUTH_VERSION === 'v1') return <RegisterScreenV1 {...props} />;
  return <RegisterScreenV2 {...props} />;
}