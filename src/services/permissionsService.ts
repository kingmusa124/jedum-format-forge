import {Platform} from 'react-native';
import {
  PERMISSIONS,
  RESULTS,
  checkMultiple,
  request,
  requestMultiple,
} from 'react-native-permissions';

export async function ensureFilePickerPermission() {
  if (Platform.OS === 'ios') {
    return true;
  }

  // SAF-backed document picking does not require storage permission on modern Android.
  return true;
}

export async function ensureCameraPermission() {
  if (Platform.OS === 'ios') {
    return true;
  }

  const permissions = [PERMISSIONS.ANDROID.CAMERA];
  const current = await checkMultiple(permissions);
  const alreadyGranted = permissions.every(
    permission => current[permission] === RESULTS.GRANTED,
  );

  if (alreadyGranted) {
    return true;
  }

  const requested = await requestMultiple(permissions);
  return permissions.every(permission => requested[permission] === RESULTS.GRANTED);
}

export async function ensureMediaReadPermission() {
  if (Platform.OS === 'ios') {
    return true;
  }

  const permission = PERMISSIONS.ANDROID.READ_MEDIA_IMAGES;
  const requested = await request(permission);
  return requested === RESULTS.GRANTED || requested === RESULTS.LIMITED;
}
