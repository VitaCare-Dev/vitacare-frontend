import * as ImagePicker from "expo-image-picker";

import { apiPost, apiPut } from "@/services/apiClient";
import { pickProfilePhoto, takeProfilePhoto, uploadProfilePhoto } from "@/services/profilePhoto";

jest.mock("@/config/firebase");

jest.mock("expo-image-picker", () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  requestCameraPermissionsAsync: jest.fn(),
  launchCameraAsync: jest.fn(),
}));

const mockUpload = jest.fn();
jest.mock("expo-file-system", () => ({
  File: jest.fn().mockImplementation(() => ({ upload: mockUpload })),
  UploadType: { BINARY_CONTENT: 0, MULTIPART: 1 },
}));

jest.mock("@/services/apiClient", () => ({
  ...jest.requireActual("@/services/apiClient"),
  apiPost: jest.fn(),
  apiPut: jest.fn(),
}));

const mockRequestPermissions = ImagePicker.requestMediaLibraryPermissionsAsync as jest.Mock;
const mockLaunchLibrary = ImagePicker.launchImageLibraryAsync as jest.Mock;
const mockRequestCameraPermissions = ImagePicker.requestCameraPermissionsAsync as jest.Mock;
const mockLaunchCamera = ImagePicker.launchCameraAsync as jest.Mock;
const mockApiPost = apiPost as jest.Mock;
const mockApiPut = apiPut as jest.Mock;

describe("pickProfilePhoto", () => {
  beforeEach(() => {
    mockRequestPermissions.mockReset();
    mockLaunchLibrary.mockReset();
  });

  it("returns null when permission is denied", async () => {
    mockRequestPermissions.mockResolvedValue({ granted: false });

    const result = await pickProfilePhoto();

    expect(result).toBeNull();
    expect(mockLaunchLibrary).not.toHaveBeenCalled();
  });

  it("returns null when the user cancels the picker", async () => {
    mockRequestPermissions.mockResolvedValue({ granted: true });
    mockLaunchLibrary.mockResolvedValue({ canceled: true, assets: [] });

    const result = await pickProfilePhoto();

    expect(result).toBeNull();
  });

  it("returns the picked photo's URI", async () => {
    mockRequestPermissions.mockResolvedValue({ granted: true });
    mockLaunchLibrary.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///local/photo.jpg" }],
    });

    const result = await pickProfilePhoto();

    expect(result).toBe("file:///local/photo.jpg");
  });
});

describe("takeProfilePhoto", () => {
  beforeEach(() => {
    mockRequestCameraPermissions.mockReset();
    mockLaunchCamera.mockReset();
  });

  it("returns null when camera permission is denied", async () => {
    mockRequestCameraPermissions.mockResolvedValue({ granted: false });

    const result = await takeProfilePhoto();

    expect(result).toBeNull();
    expect(mockLaunchCamera).not.toHaveBeenCalled();
  });

  it("returns null when the user cancels the camera", async () => {
    mockRequestCameraPermissions.mockResolvedValue({ granted: true });
    mockLaunchCamera.mockResolvedValue({ canceled: true, assets: [] });

    const result = await takeProfilePhoto();

    expect(result).toBeNull();
  });

  it("returns the taken photo's URI", async () => {
    mockRequestCameraPermissions.mockResolvedValue({ granted: true });
    mockLaunchCamera.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///local/camera.jpg" }],
    });

    const result = await takeProfilePhoto();

    expect(result).toBe("file:///local/camera.jpg");
  });
});

describe("uploadProfilePhoto", () => {
  beforeEach(() => {
    mockApiPost.mockReset();
    mockApiPut.mockReset();
    mockUpload.mockReset();
  });

  it("uploads the photo to the SAS URL and confirms it with the backend", async () => {
    mockApiPost.mockResolvedValue({ uploadUrl: "https://example.blob/upload?sig=abc" });
    mockApiPut.mockResolvedValue(undefined);
    mockUpload.mockResolvedValue({ status: 201 });

    await uploadProfilePhoto("file:///local/photo.jpg");

    expect(mockApiPost).toHaveBeenCalledWith("/api/patients/me/photo/upload-url");
    expect(mockUpload).toHaveBeenCalledWith(
      "https://example.blob/upload?sig=abc",
      expect.objectContaining({
        httpMethod: "PUT",
        headers: expect.objectContaining({ "x-ms-blob-type": "BlockBlob" }),
      })
    );
    expect(mockApiPut).toHaveBeenCalledWith("/api/patients/me/photo");
  });

  it("throws and does not confirm when the upload to Azure fails", async () => {
    mockApiPost.mockResolvedValue({ uploadUrl: "https://example.blob/upload?sig=abc" });
    mockUpload.mockResolvedValue({ status: 403 });

    await expect(uploadProfilePhoto("file:///local/photo.jpg")).rejects.toThrow(
      "No se pudo subir la foto de perfil (status 403)."
    );
    expect(mockApiPut).not.toHaveBeenCalled();
  });
});
