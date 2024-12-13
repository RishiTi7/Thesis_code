import React, { useEffect, useState } from 'react';
import { router, Stack } from 'expo-router';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';

// correct lon: -122.084, test lon: -93.6873684
const TRUSTED_LOCATIONS = [
  { name: 'Home', latitude: 37.4219983, longitude: -122.084, radiusKm: 2 },
  { name: 'Coover Hall', latitude: 42.02842, longitude: -93.65096, radiusKm: 2 }
];

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Returns distance in kilometers
};

export default function Home() {
  const [hasLocationPermission, setHasLocationPermission] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Request location permission and get the user's current location
  useEffect(() => {
    const requestLocationPermission = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setHasLocationPermission(true);
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
        setCurrentLocation(location);
      } else {
        setHasLocationPermission(false);
        console.log('Location permission denied');
      }
    };

    requestLocationPermission();
  }, []);

  // Function to check if the user is within the trusted location's radius
  const checkLocationProximity = () => {
    if (currentLocation) {
      const trustedLocation = TRUSTED_LOCATIONS[0]; // Assuming only one trusted location
      const distance = calculateDistance(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude,
        trustedLocation.latitude,
        trustedLocation.longitude
      );

      // Adding a tolerance of 0.1 km (100 meters)
      const distanceTolerance = 0.1;
      if (distance <= trustedLocation.radiusKm + distanceTolerance) {
        setIsAuthenticated(true);
        router.push('/modals/lock');
      } else {
        setIsAuthenticated(false);
        console.log(`You are not within the trusted location. Distance: ${distance.toFixed(2)} km`);
        console.log(currentLocation);

      }
    }
  };

  const handleLockScreenNavigation = () => {
    if (hasLocationPermission && currentLocation) {
      checkLocationProximity();
    } else {
      console.log('Location permission is required for this action');
    }
  };

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
        <TouchableOpacity style={styles.button} onPress={handleLockScreenNavigation}>
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
