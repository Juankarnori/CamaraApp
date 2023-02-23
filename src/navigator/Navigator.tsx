import React, { useEffect, useState } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { PermissionsPage } from '../pages/PermissionsPage';
import { CameraPage } from '../pages/CameraPage';
import { MediaPage } from '../pages/MediaPage';
import { Camera, CameraPermissionStatus } from 'react-native-vision-camera';

export type NavigateStackParams = {
  PermissionsPage: undefined;
  CameraPage: undefined;
  MediaPage: {
    path: string;
    type: 'video' | 'photo';
  };
}

const Stack = createStackNavigator<NavigateStackParams>();

export const Navigator = () => {

    const [cameraPermission, setCameraPermission] = useState<CameraPermissionStatus>();
    const [microphonePermission, setMicrophonePermission] = useState<CameraPermissionStatus>();

    useEffect(() => {
        Camera.getCameraPermissionStatus().then(setCameraPermission);
        Camera.getMicrophonePermissionStatus().then(setMicrophonePermission);
    }, []);

    console.log(`Re-rendering Navigator. Camera: ${cameraPermission} | Microphone: ${microphonePermission}`);

    if (cameraPermission == null || microphonePermission == null) {
        // still loading
        return null;
    }

    const showPermissionsPage = cameraPermission !== 'authorized' || microphonePermission === 'not-determined';

  return (
    <Stack.Navigator
        screenOptions={{
            headerShown: false,
            cardStyle: {
                backgroundColor: 'white'
            }
        }}
        initialRouteName={showPermissionsPage ? 'PermissionsPage' : 'CameraPage'}
    >
      <Stack.Screen name="PermissionsPage" component={PermissionsPage} />
      <Stack.Screen name="CameraPage" component={CameraPage} />
      <Stack.Screen name="MediaPage" component={MediaPage} />
    </Stack.Navigator>
  );
}