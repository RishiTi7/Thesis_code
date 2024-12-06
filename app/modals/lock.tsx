import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, PanResponder } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { TouchableOpacity, GestureHandlerRootView } from 'react-native-gesture-handler';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as LocalAuthentication from 'expo-local-authentication';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Utility function to shuffle an array
const shuffleArray = (array: number[]) => {
  return array
    .map((value) => ({ value, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ value }) => value);
};

const Page = () => {
  const [startTime, setStartTime] = useState<number>(0);
  const [code, setCode] = useState<number[]>([]);
  const [shuffledNumbers, setShuffledNumbers] = useState<number[]>([]);
  const [keyPressData, setKeyPressData] = useState<{ key: number; timestamp: number }[]>([]);
  const [keyReleaseData, setKeyReleaseData] = useState<
    { key: number; timestamp: number; holdDuration: number }[]
  >([]);
  const [holdDurations, setHoldDurations] = useState<{ key: number; duration: number }[]>([]);
  const [honeypotPressed, setHoneypotPressed] = useState(false); // Honeypot flag
  const [touchCoordinates, setTouchCoordinates] = useState({ x: 0, y: 0 }); // Store touch coordinates
  const [hoverData, setHoverData] = useState<{ x: number; y: number }[]>([]);
  const [totalTimeSpent, setTotalTimeSpent] = useState<number>(0); // For total time spent
  const [touchSide, setTouchSide] = useState<string>(''); // For the touch side


  const codeLength = Array(6).fill(0);
  const router = useRouter();
  const offset = useSharedValue(0);
  const style = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: offset.value }],
    };
  });

  const OFFSET = 20;
  const TIME = 80;

  // Shuffle the numbers when the component mounts
  useEffect(() => {
    setStartTime(Date.now());
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
    setShuffledNumbers(shuffleArray(numbers));
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (event) => {
        const { locationX, locationY } = event.nativeEvent;
        setHoverData((prev) => [...prev, { x: locationX, y: locationY }]);
        console.log(`Cursor moved to: X=${locationX}, Y=${locationY}`);
      },
    })
  ).current;

  const navigateToNextPage = () => {
    const endTime = Date.now();
    const totalTime = endTime - startTime;
    setTotalTimeSpent(totalTime); // Update the total time state
    console.log(`Total time spent on lock page: ${totalTime} ms`);
    console.log('Hover data:', hoverData);
    router.replace('/modals/white');
  };

  // Authentication check logic
  useEffect(() => {
    if (code.length === 6) {
      if (code.join('') === '111111' && !honeypotPressed) {
        navigateToNextPage();
        setCode([]);
      } else {
        offset.value = withSequence(
          withTiming(-OFFSET, { duration: TIME / 2 }),
          withRepeat(withTiming(OFFSET, { duration: TIME }), 4, true),
          withTiming(0, { duration: TIME / 2 })
        );
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setCode([]);
      }

      const timeIntervals = calculateTimeIntervals();
      console.log('Key press data:', timeIntervals);
      console.log('Key release data:', keyReleaseData);
      console.log('Hold durations:', holdDurations);
      generateCSVFile(
        timeIntervals,
        keyReleaseData,
        holdDurations,
        touchCoordinates,
        totalTimeSpent,
        hoverData,
        touchSide
      );

      // Reset honeypot flag after each full code attempt
      setHoneypotPressed(false);
    }
  }, [code]);

  // Function to calculate time intervals between key presses
  const calculateTimeIntervals = () => {
    const intervals: { key: number; interval: number }[] = [];
    for (let i = 1; i < keyPressData.length; i++) {
      const key = keyPressData[i].key;
      const interval = keyPressData[i].timestamp - keyPressData[i - 1].timestamp;
      intervals.push({ key, interval });
    }
    return intervals;
  };

  interface TimeInterval {
    key: number;
    interval: number;
  }

  interface KeyRelease {
    key: number;
    timestamp: number;
    holdDuration: number;
  }

  interface HoldDuration {
    key: number;
    duration: number;
  }

  const generateCSVFile = async (
    timeIntervals: TimeInterval[],
    keyReleaseData: KeyRelease[],
    holdDurations: HoldDuration[],
    touchCoordinates: { x: number; y: number },
    totalTimeSpent: number,
    hoverData: { x: number; y: number }[],
    touchSide: string
  ) => {
    // Create CSV headers
    const headers = [
      'Data Type',
      'Key',
      'Time Interval (ms)',
      'Timestamp',
      'Hold Duration (ms)',
      'Touch Position X',
      'Touch Position Y',
      'Hover Data X',
      'Hover Data Y',
      'Touch Side',
      'Total Time Spent (ms)',
    ].join(',');
  
    // Format time intervals data
    const intervalRows = timeIntervals.map((item) =>
      [
        'Time Interval',
        item.key,
        item.interval,
        '',
        '',
        touchCoordinates.x,
        touchCoordinates.y,
        '',
        '',
        touchSide,
        totalTimeSpent,
      ].join(',')
    );
  
    // Format key release data
    const releaseRows = keyReleaseData.map((item) =>
      [
        'Key Release',
        item.key,
        '',
        item.timestamp,
        item.holdDuration,
        touchCoordinates.x,
        touchCoordinates.y,
        '',
        '',
        touchSide,
        totalTimeSpent,
      ].join(',')
    );
  
    // Format hold durations data
    const durationRows = holdDurations.map((item) =>
      [
        'Hold Duration',
        item.key,
        '',
        '',
        item.duration,
        touchCoordinates.x,
        touchCoordinates.y,
        '',
        '',
        touchSide,
        totalTimeSpent,
      ].join(',')
    );
  
    // Format hover data
    const hoverRows = hoverData.map((item) =>
      [
        'Hover Data',
        '',
        '',
        '',
        '',
        '',
        '',
        item.x,
        item.y,
        touchSide,
        totalTimeSpent,
      ].join(',')
    );
  
    // Combine all data
    const csvData = [
      headers,
      ...intervalRows,
      ...releaseRows,
      ...durationRows,
      ...hoverRows,
    ].join('\n');
  
    try {
      const fileUri = `${FileSystem.documentDirectory}finalUpdateMetrics.csv`;
  
      await FileSystem.writeAsStringAsync(fileUri, csvData, {
        encoding: FileSystem.EncodingType.UTF8,
      });
  
      const isSharingAvailable = await Sharing.isAvailableAsync();
  
      const timer = setTimeout(async () => {
        if (isSharingAvailable) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: 'Save Keystroke Analysis Data',
            UTI: 'public.comma-separated-values-text',
          });
          console.log('File saved and shared successfully');
        } else {
          console.log('Sharing is not available');
          console.log('File saved at:', fileUri);
        }
      }, 5000);
  
      // Verify file creation
      const fileInfo = await FileSystem.getInfoAsync(fileUri);
      if (fileInfo.exists) {
        console.log('File size:', fileInfo.size, 'bytes');
        console.log('File saved successfully with all metrics');
      }
    } catch (error) {
      console.error('Error handling file:', error);
    }
  };
  
  // Function to handle key press (when the user touches the key)
  const onNumberPressIn = (number: number) => {
    const timestamp = Date.now();
    setKeyPressData([...keyPressData, { key: number, timestamp }]);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Function to handle key release (when the user lifts the finger off the key)
  const onNumberPressOut = (number: number) => {
    const pressTimestamp = keyPressData.find((data) => data.key === number)?.timestamp || 0;
    const releaseTimestamp = Date.now();
    const holdDuration = releaseTimestamp - pressTimestamp;

    setKeyReleaseData([
      ...keyReleaseData,
      { key: number, timestamp: releaseTimestamp, holdDuration },
    ]);
    setHoldDurations([...holdDurations, { key: number, duration: holdDuration }]);
    setCode([...code, number]);
  };

  const numberBackSpace = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCode(code.slice(0, -1));
  };

  const onBiometricPress = async () => {
    const { success } = await LocalAuthentication.authenticateAsync();
    if (success) {
      router.replace('/');
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // Honeypot key handler
  const onHoneypotPress = () => {
    setHoneypotPressed(true); // Set honeypot flag to true
    console.log('Honeypot key pressed!');
  };

  // Handle touch event and log position
  const handleTouch = (e) => {
    const { locationX, locationY, target } = e.nativeEvent;
    const buttonWidth = 60;
    const buttonHeight = 60;
    const tolerance = 20; // Adjust tolerance as needed
  
    const buttonCenterX = buttonWidth / 2;
    const buttonCenterY = buttonHeight / 2;
  
    let side;
    if (Math.abs(locationX - buttonCenterX) < tolerance) {
      side = 'center';
    } else if (locationX < buttonCenterX - tolerance) {
      side = 'left';
    } else if (locationX > buttonCenterX + tolerance) {
      side = 'right';
    } else if (Math.abs(locationY - buttonCenterY) < tolerance) {
      side = 'center';
    } else if (locationY < buttonCenterY - tolerance) {
      side = 'top';
    } else {
      side = 'bottom';
    }
  
    setTouchCoordinates({ x: locationX, y: locationY });
    setTouchSide(side); // Update the state with the calculated touch side
    console.log(`Touch position: X: ${locationX}, Y: ${locationY}, Side: ${side}`);
  };
  

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView {...panResponder.panHandlers}>
        <Text style={styles.greetings}>ML Authenticator</Text>

        <Animated.View style={[styles.codeView, style]}>
          {codeLength.map((_, index) => (
            <View
              key={index}
              style={[
                styles.codeEmpty,
                {
                  backgroundColor: code[index] ? '#3D38ED' : '#D8DCE2',
                },
              ]}
            />
          ))}
        </Animated.View>

        <View
          style={styles.numbersView}
          onTouchStart={handleTouch} // Track touch start
        >
          {/* Render the shuffled numbers in a 3x4 grid */}
          <View style={styles.row}>
            {[shuffledNumbers[6], shuffledNumbers[7], shuffledNumbers[8]].map((number) => (
              <TouchableOpacity
                key={number}
                onPressIn={() => onNumberPressIn(number)}
                onPressOut={() => onNumberPressOut(number)}>
                <Text style={styles.number}>{number}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.row}>
            {[shuffledNumbers[3], shuffledNumbers[4], shuffledNumbers[5]].map((number) => (
              <TouchableOpacity
                key={number}
                onPressIn={() => onNumberPressIn(number)}
                onPressOut={() => onNumberPressOut(number)}>
                <Text style={styles.number}>{number}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.row}>
            {[shuffledNumbers[0], shuffledNumbers[1], shuffledNumbers[2]].map((number) => (
              <TouchableOpacity
                key={number}
                onPressIn={() => onNumberPressIn(number)}
                onPressOut={() => onNumberPressOut(number)}>
                <Text style={styles.number}>{number}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.row}>
            <TouchableOpacity onPress={onBiometricPress}>
              <MaterialCommunityIcons name="face-recognition" size={26} color="black" />
            </TouchableOpacity>

            <TouchableOpacity
              onPressIn={() => onNumberPressIn(shuffledNumbers[9])}
              onPressOut={() => onNumberPressOut(shuffledNumbers[9])}>
              <Text style={styles.number}>{shuffledNumbers[9]}</Text>
            </TouchableOpacity>

            <View style={{ minWidth: 30 }}>
              {code.length > 0 && (
                <TouchableOpacity onPress={numberBackSpace}>
                  <MaterialCommunityIcons name="backspace-outline" size={26} color="black" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Honeypot keys */}
        <View style={styles.honeypotRow}>
          {['%', '#', '@', '!', '$', '^'].map((symbol) => (
            <TouchableOpacity key={symbol} onPress={onHoneypotPress}>
              <Text style={styles.honeypot}>{symbol}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  greetings: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 80,
    alignSelf: 'center',
  },
  codeView: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
    marginVertical: 100,
  },
  codeEmpty: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  numbersView: {
    marginHorizontal: 80,
    gap: 40,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  number: {
    fontSize: 32,
  },
  honeypotRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16, // Reduce the spacing here
  },
  honeypot: {
    fontSize: 40,
    color: 'red', // Optional
    opacity: 0.2,
  },
});
export default Page;
