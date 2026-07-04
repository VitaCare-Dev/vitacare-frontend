import "@testing-library/jest-native/extend-expect";

process.env.EXPO_PUBLIC_API_BASE_URL ??= "http://test.local";

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);
