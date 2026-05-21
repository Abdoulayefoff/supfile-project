process.env.RNTL_SKIP_DEPS_CHECK = 'true';

// Mock navigation
jest.mock('@react-navigation/native', () => {
  return {
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      replace: jest.fn(),
    }),
    useFocusEffect: jest.fn((callback) => callback()),
    useRoute: () => ({
      params: {},
    }),
  };
});

// Mock SecureStore
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: (props) => props.name,
}));

// Mock Reanimated completely to avoid Worklets initialization error
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      View: View,
      Text: View,
      ScrollView: View,
      Image: View,
      interpolate: jest.fn(),
    },
    useSharedValue: jest.fn((v) => ({ value: v })),
    useAnimatedStyle: jest.fn(() => ({})),
    useDerivedValue: jest.fn((fn) => ({ value: fn() })),
    useAnimatedScrollHandler: jest.fn(() => ({})),
    useAnimatedGestureHandler: jest.fn(() => ({})),
    withTiming: jest.fn((v) => v),
    withSpring: jest.fn((v) => v),
    withRepeat: jest.fn((v) => v),
    withSequence: jest.fn((v) => v),
    withDelay: jest.fn((d, v) => v),
    runOnJS: jest.fn((fn) => fn),
    runOnUI: jest.fn((fn) => fn),
    makeMutable: jest.fn((v) => ({ value: v })),
    cancelAnimation: jest.fn(),
    Extrapolation: {
      CLAMP: 'clamp',
    },
    FadeIn: { duration: jest.fn(() => ({ build: () => ({}) })) },
    FadeOut: { duration: jest.fn(() => ({ build: () => ({}) })) },
  };
});

// Mock worklets if needed
jest.mock('react-native-worklets-core', () => ({
  Worklets: {
    createRunInJsFn: jest.fn((fn) => fn),
    createRunInContextFn: jest.fn((fn) => fn),
  },
}), { virtual: true });

// Mock expo-file-system
jest.mock('expo-file-system', () => ({
  documentDirectory: 'file:///test/',
  cacheDirectory: 'file:///cache/',
  downloadAsync: jest.fn(),
  getInfoAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));

// Mock expo-sharing
jest.mock('expo-sharing', () => ({
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(),
}));

// Mock expo-clipboard
jest.mock('expo-clipboard', () => ({
  setStringAsync: jest.fn(),
  getStringAsync: jest.fn(),
}));

// Mock expo-av
jest.mock('expo-av', () => ({
  Video: 'Video',
  Audio: {
    Sound: jest.fn(),
  },
  ResizeMode: {
    CONTAIN: 'contain',
  },
}));

// Mock react-native-webview
jest.mock('react-native-webview', () => ({
  WebView: 'WebView',
}));
