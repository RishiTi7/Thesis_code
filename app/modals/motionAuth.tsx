import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { DeviceMotion } from 'expo-sensors';
import * as FileSystem from 'expo-file-system';

interface MotionPattern {
  timestamp: number;
  rotation: {
    alpha: number;
    beta: number;
    gamma: number;
  };
  acceleration: {
    x: number;
    y: number;
    z: number;
  };
}

interface MotionAuthProps {
  onAuthenticationComplete: (success: boolean) => void;
}

const MotionAuth: React.FC<MotionAuthProps> = ({ onAuthenticationComplete }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [motionPattern, setMotionPattern] = useState<MotionPattern[]>([]);
  const [enrolledPattern, setEnrolledPattern] = useState<MotionPattern[]>([]);
  const [subscription, setSubscription] = useState<any>(null);
  
  const MOTION_STORAGE_KEY = 'enrolledMotionPattern';
  const RECORDING_DURATION = 3000; // 3 seconds for pattern recording

  // Default values for when sensors return null
  const DEFAULT_MOTION_VALUES = {
    acceleration: { x: 0, y: 0, z: 0 },
    rotation: { alpha: 0, beta: 0, gamma: 0 }
  };
  
  useEffect(() => {
    loadEnrolledPattern();
    return () => {
      unsubscribe();
    };
  }, []);

  const loadEnrolledPattern = async () => {
    try {
      // Clear the saved pattern on app restart
      const path = `${FileSystem.documentDirectory}${MOTION_STORAGE_KEY}`;
      const exists = await FileSystem.getInfoAsync(path);
  
      if (exists.exists) {
        await FileSystem.deleteAsync(path); // Clear the saved pattern
      }
  
      setEnrolledPattern([]); // Reset the state
    } catch (error) {
      console.error('Error during app restart cleanup:', error);
    }
  };
  

  const saveEnrolledPattern = async (pattern: MotionPattern[]) => {
    try {
      const path = `${FileSystem.documentDirectory}${MOTION_STORAGE_KEY}`;
      await FileSystem.writeAsStringAsync(path, JSON.stringify(pattern));
      setEnrolledPattern(pattern);
    } catch (error) {
      console.error('Error saving enrolled pattern:', error);
    }
  };

  const subscribe = () => {
    setMotionPattern([]);
    DeviceMotion.setUpdateInterval(100); // Update every 100ms
    
    const subscription = DeviceMotion.addListener(data => {
      const acceleration = data.acceleration ?? DEFAULT_MOTION_VALUES.acceleration;
      const rotation = data.rotation ?? DEFAULT_MOTION_VALUES.rotation;

      setMotionPattern(prev => [...prev, {
        timestamp: Date.now(),
        rotation: {
          alpha: rotation.alpha,
          beta: rotation.beta,
          gamma: rotation.gamma
        },
        acceleration: {
          x: acceleration.x,
          y: acceleration.y,
          z: acceleration.z
        }
      }]);
    });
    
    setSubscription(subscription);
  };

  const unsubscribe = () => {
    subscription?.remove();
    setSubscription(null);
  };

  const startRecording = async () => {
    try {
      const isAvailable = await DeviceMotion.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert(
          'Sensors Not Available',
          'Motion sensors are not available on this device or emulator.',
          [{ text: 'OK' }]
        );
        return;
      }

      setIsRecording(true);
      subscribe();
      
      // Stop recording after RECORDING_DURATION
      setTimeout(() => {
        stopRecording();
      }, RECORDING_DURATION);
    } catch (error) {
      console.error('Error starting motion recording:', error);
      Alert.alert('Error', 'Failed to start motion recording');
    }
  };

  const stopRecording = () => {
    setIsRecording(false);
    unsubscribe();
  };

  const comparePatterns = (pattern1: MotionPattern[], pattern2: MotionPattern[]): boolean => {
    if (pattern1.length < 5 || pattern2.length < 5) return false;
    
    // Normalize patterns to have the same number of samples
    const normalizedPattern1 = normalizePattern(pattern1);
    const normalizedPattern2 = normalizePattern(pattern2);
    
    // Calculate similarity score
    let similarityScore = 0;
    const tolerance = 0.3; // Adjust this value to make matching more/less strict
    
    for (let i = 0; i < normalizedPattern1.length; i++) {
      const p1 = normalizedPattern1[i];
      const p2 = normalizedPattern2[i];
      
      // Compare rotation values
      const rotationDiff = Math.abs(p1.rotation.alpha - p2.rotation.alpha) +
                          Math.abs(p1.rotation.beta - p2.rotation.beta) +
                          Math.abs(p1.rotation.gamma - p2.rotation.gamma);
      
      // Compare acceleration values
      const accelerationDiff = Math.abs(p1.acceleration.x - p2.acceleration.x) +
                              Math.abs(p1.acceleration.y - p2.acceleration.y) +
                              Math.abs(p1.acceleration.z - p2.acceleration.z);
      
      if (rotationDiff < tolerance * 3 && accelerationDiff < tolerance * 3) {
        similarityScore++;
      }
    }
    
    // Calculate match percentage
    const matchPercentage = similarityScore / normalizedPattern1.length;
    return matchPercentage > 0.7; // 70% similarity required for a match
  };

  const normalizePattern = (pattern: MotionPattern[]): MotionPattern[] => {
    const targetLength = 30; // Normalize to 30 samples
    const result: MotionPattern[] = [];
    
    for (let i = 0; i < targetLength; i++) {
      const index = Math.floor((i * pattern.length) / targetLength);
      result.push(pattern[index]);
    }
    
    return result;
  };


  const enrollPattern = async () => {
    Alert.alert(
      'Enroll Motion Pattern',
      'Get ready to perform your motion pattern. Recording will start in 3 seconds.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'OK',
          onPress: () => {
            setTimeout(() => {
              startRecording();
              setTimeout(async () => {
                if (motionPattern.length > 0) {
                  console.log('Recorded Motion Pattern:', motionPattern);
                  await saveEnrolledPattern([...motionPattern]);
                  Alert.alert('Success', 'Motion pattern enrolled successfully!');
                } else {
                  Alert.alert('Error', 'No motion data recorded. Try again.');
                }
              }, RECORDING_DURATION);
            }, 3000);
          },
        },
      ]
    );
  };

  const verifyPattern = () => {
    Alert.alert(
      'Verify Motion Pattern',
      'Get ready to perform your motion pattern. Recording will start in 3 seconds.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'OK',
          onPress: () => {
            setTimeout(() => {
              startRecording();
              setTimeout(() => {
                const isMatch = comparePatterns(motionPattern, enrolledPattern);
                onAuthenticationComplete(isMatch);
                Alert.alert(
                  isMatch ? 'Success' : 'Failed',
                  isMatch ? 'Motion pattern matched!' : 'Motion pattern did not match. Please try again.'
                );
              }, RECORDING_DURATION);
            }, 3000);
          }
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      {isRecording && (
        <View style={styles.recordingIndicator}>
          <Text style={styles.recordingText}>Recording Motion...</Text>
        </View>
      )}
      
      {!enrolledPattern.length ? (
        <TouchableOpacity 
          style={styles.button}
          onPress={enrollPattern}
          disabled={isRecording}
        >
          <Text style={styles.buttonText}>Enroll Motion Pattern</Text>
        </TouchableOpacity>
      ) : (
        <View>
          <TouchableOpacity 
            style={styles.button}
            onPress={verifyPattern}
            disabled={isRecording}
          >
            <Text style={styles.buttonText}>Verify Motion Pattern</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.secondaryButton]}
            onPress={enrollPattern}
            disabled={isRecording}
          >
            <Text style={styles.buttonText}>Re-enroll Pattern</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#3D38ED',
    padding: 15,
    borderRadius: 10,
    width: 250,
    alignItems: 'center',
    marginVertical: 10,
  },
  secondaryButton: {
    backgroundColor: '#8A2BE2',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  recordingIndicator: {
    backgroundColor: '#FF0000',
    padding: 10,
    borderRadius: 5,
    marginBottom: 20,
  },
  recordingText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default MotionAuth;