import React from 'react';
import { router, Stack } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function Home() {
  return (
    <>
      <Stack.Screen options={{ title: 'Home' }} />
      <SafeAreaView style={styles.container}>
        {/* Gradient Background */}
        <LinearGradient
          colors={['#3D38ED', '#8A2BE2']}
          style={styles.background}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to ML Authenticator</Text>
          <MaterialIcons name="lock" size={48} color="#FFD700" />
        </View>

        <Text style={styles.subtitle}>Your personal security APP</Text>

        {/* Button Section */}
        <TouchableOpacity style={styles.button} onPress={() => router.push('/modals/lock')}>
          <Text style={styles.buttonText}>Lock Screen</Text>
        </TouchableOpacity>

        <Text style={styles.footerText}>
          Need CSV file?{' '}
          <Text style={styles.link} onPress={() => console.log('CSV')}>
            CSV FILE
          </Text>
        </Text>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    padding: 20,
    position: 'relative',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1, // Ensure gradient stays in the background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginRight: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#FFFFFF',
    marginBottom: 40,
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#FFD700',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8, // For Android shadow
    alignItems: 'center',
    marginBottom: 15,
    width: '80%',
  },
  buttonText: {
    color: '#3D38ED',
    fontSize: 16,
    fontWeight: '700',
  },
  footerText: {
    marginTop: 20,
    fontSize: 14,
    color: '#FFFFFF',
  },
  link: {
    color: '#FFD700',
    textDecorationLine: 'underline',
  },
});
