import { CameraRoll } from '@react-native-camera-roll/camera-roll';
import { useIsFocused } from '@react-navigation/core';
import { StackScreenProps } from '@react-navigation/stack';
import React, { useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Image, ImageLoadEventData, NativeSyntheticEvent, PermissionsAndroid, Platform, StyleSheet, Text, View } from 'react-native';
import { PressableOpacity } from 'react-native-pressable-opacity';
import Video, { LoadError, OnLoadData } from 'react-native-video';
import { useIsForeground } from '../hooks/useIsForeground';
import { NavigateStackParams } from '../navigator/Navigator';
import IonIcon from 'react-native-vector-icons/Ionicons';
import { StatusBarBlurBackground } from '../components/StatusBarBlurBackground';

const requestSavePermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') return true;

  const permission = PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE;
  if (permission == null) return false;
  let hasPermission = await PermissionsAndroid.check(permission);
  if (!hasPermission) {
    const permissionRequestResult = await PermissionsAndroid.request(permission);
    hasPermission = permissionRequestResult === 'granted';
  }
  return hasPermission;
};

interface Props extends StackScreenProps<NavigateStackParams, 'MediaPage'>{};

const isVideoOnLoadEvent = (event: OnLoadData | NativeSyntheticEvent<ImageLoadEventData>): event is OnLoadData =>
  'duration' in event && 'naturalSize' in event;

export const MediaPage = ({ navigation, route }: Props) => {

  const { path, type } = route.params;
  const [hasMediaLoaded, setHasMediaLoaded] = useState(false);
  const isForeground = useIsForeground();
  const isScreenFocused = useIsFocused();
  const isVideoPaused = !isForeground || !isScreenFocused;
  const [savingState, setSavingState] = useState<'none' | 'saving' | 'saved'>('none');

  const onMediaLoad = (event: OnLoadData | NativeSyntheticEvent<ImageLoadEventData>) => {
    if (isVideoOnLoadEvent(event)) {
      console.log(
        `Video loaded. Size: ${event.naturalSize.width}x${event.naturalSize.height} (${event.naturalSize.orientation}, ${event.duration} seconds)`,
      );
    } else {
      console.log(`Image loaded. Size: ${event.nativeEvent.source.width}x${event.nativeEvent.source.height}`);
    }
  }
  // const onMediaLoad = useCallback((event: OnLoadData | NativeSyntheticEvent<ImageLoadEventData>) => {
  //   if (isVideoOnLoadEvent(event)) {
  //     console.log(
  //       `Video loaded. Size: ${event.naturalSize.width}x${event.naturalSize.height} (${event.naturalSize.orientation}, ${event.duration} seconds)`,
  //     );
  //   } else {
  //     console.log(`Image loaded. Size: ${event.nativeEvent.source.width}x${event.nativeEvent.source.height}`);
  //   }
  // }, []);
  const onMediaLoadEnd = () => {
    console.log('media has loaded.');
    setHasMediaLoaded(true);
  }
  // const onMediaLoadEnd = useCallback(() => {
  //   console.log('media has loaded.');
  //   setHasMediaLoaded(true);
  // }, []);
  const onMediaLoadError = (error: LoadError) => {
    console.log(`failed to load media: ${JSON.stringify(error)}`);
  }
  // const onMediaLoadError = useCallback((error: LoadError) => {
  //   console.log(`failed to load media: ${JSON.stringify(error)}`);
  // }, []);

  const onSavePressed = async() => {
    try {
      setSavingState('saving');

      const hasPermission = await requestSavePermission();
      if (!hasPermission) {
        Alert.alert('Permission denied!', 'Vision Camera does not have permission to save the media to your camera roll.');
        return;
      }
      await CameraRoll.save(`file://${path}`, {
        type: type,
      });
      setSavingState('saved');
    } catch (e) {
      const message = e instanceof Error ? e.message : JSON.stringify(e);
      setSavingState('none');
      Alert.alert('Failed to save!', `An unexpected error occured while trying to save your ${type}. ${message}`);
    }
  }
  // const onSavePressed = useCallback(async () => {
  //   try {
  //     setSavingState('saving');

  //     const hasPermission = await requestSavePermission();
  //     if (!hasPermission) {
  //       Alert.alert('Permission denied!', 'Vision Camera does not have permission to save the media to your camera roll.');
  //       return;
  //     }
  //     await CameraRoll.save(`file://${path}`, {
  //       type: type,
  //     });
  //     setSavingState('saved');
  //   } catch (e) {
  //     const message = e instanceof Error ? e.message : JSON.stringify(e);
  //     setSavingState('none');
  //     Alert.alert('Failed to save!', `An unexpected error occured while trying to save your ${type}. ${message}`);
  //   }
  // }, [path, type]);

  const source = useMemo(() => ({ uri: `file://${path}` }), [path]);

  const screenStyle = useMemo(() => ({ opacity: hasMediaLoaded ? 1 : 0 }), [hasMediaLoaded]);


  return (
    <View style={[styles.container, screenStyle]}>
      {type === 'photo' && (
        <Image source={source} style={StyleSheet.absoluteFill} resizeMode="cover" onLoadEnd={onMediaLoadEnd} onLoad={onMediaLoad} />
      )}
      {type === 'video' && (
        <Video
          source={source}
          style={StyleSheet.absoluteFill}
          paused={isVideoPaused}
          resizeMode="cover"
          posterResizeMode="cover"
          allowsExternalPlayback={false}
          automaticallyWaitsToMinimizeStalling={false}
          disableFocus={true}
          repeat={true}
          useTextureView={false}
          controls={false}
          playWhenInactive={true}
          ignoreSilentSwitch="ignore"
          onReadyForDisplay={onMediaLoadEnd}
          onLoad={onMediaLoad}
          onError={onMediaLoadError}
        />
      )}

      <PressableOpacity style={styles.closeButton} onPress={navigation.goBack}>
        <IonIcon name="close" size={35} color="white" style={styles.icon} />
      </PressableOpacity>

      <PressableOpacity style={styles.saveButton} onPress={onSavePressed} disabled={savingState !== 'none'}>
        {savingState === 'none' && <IonIcon name="download" size={35} color="white" style={styles.icon} />}
        {savingState === 'saved' && <IonIcon name="checkmark" size={35} color="white" style={styles.icon} />}
        {savingState === 'saving' && <ActivityIndicator color="white" />}
      </PressableOpacity>

      <StatusBarBlurBackground />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
  },
  closeButton: {
    position: 'absolute',
    // top: SAFE_AREA_PADDING.paddingTop,
    // left: SAFE_AREA_PADDING.paddingLeft,
    top: 5,
    left: 5,
    width: 40,
    height: 40,
  },
  saveButton: {
    position: 'absolute',
    // bottom: SAFE_AREA_PADDING.paddingBottom,
    // left: SAFE_AREA_PADDING.paddingLeft,
    bottom: 2,
    left: 2,
    width: 40,
    height: 40,
  },
  icon: {
    textShadowColor: 'black',
    textShadowOffset: {
      height: 0,
      width: 0,
    },
    textShadowRadius: 1,
  },
});
