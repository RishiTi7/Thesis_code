import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, BounceIn } from 'react-native-reanimated';
import { router } from 'expo-router';

const Page = () => {
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good Morning');
    } else if (hour < 18) {
      setGreeting('Good Afternoon');
    } else {
      setGreeting('Good Evening');
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Animated Greeting Section */}
      <Animated.View entering={FadeIn} exiting={FadeOut} style={styles.header}>
        <Text style={styles.greetingText}>{greeting},</Text>
        <Text style={styles.userText}>Welcome Back!</Text>
        <MaterialIcons name="emoji-emotions" size={32} color="#FFD700" />
      </Animated.View>

      {/* Main Body Section */}
      <Animated.View entering={BounceIn} style={styles.content}>
        <Text style={styles.welcomeMessage}>
          You’re authenticated! 
        </Text>

        {/* Some action buttons */}
        <TouchableOpacity style={styles.button} onPress={() => router.push('/')}>
          <Text style={styles.buttonText}>Go to Home</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.button, styles.secondaryButton]}>
          <Text style={styles.secondaryButtonText}>View Profile</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  greetingText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#4C4F6F',
    marginBottom: 5,
  },
  userText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3D38ED',
  },
  content: {
    alignItems: 'center',
  },
  welcomeMessage: {
    fontSize: 18,
    color: '#4C4F6F',
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#3D38ED',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    width: '80%',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderColor: '#3D38ED',
    borderWidth: 1,
  },
  secondaryButtonText: {
    color: '#3D38ED',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Page;
