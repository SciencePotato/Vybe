import React, { useEffect, useState } from "react";
import Drawer from "expo-router/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { useRouter, useSegments } from "expo-router";

const RootLayout = () => {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<FirebaseAuthTypes.User | null>(null);
  const router = useRouter();

  const onAuthStateChanged = (user: FirebaseAuthTypes.User | null) => {
		console.log('onAuthStateChanged', user);
		setUser(user);
		if (initializing) setInitializing(false);
	};

  useEffect(() => {
		const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
		return subscriber;
	}, []);

  useEffect(() => {
    if (initializing) return;

    console.log("Initializing", user === null);
    if (user != null) {
      router.replace("/(home)/(homeTabs)");
    } else {
      router.replace("/(auth)/Auth");
    }
  }, [user, initializing])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer 
        screenOptions={{
          headerShown: user !== null,
          drawerType: "front",
          drawerStyle: {
            backgroundColor: "#fff",
            width: 240,
          },
        }}
      >
        <Drawer.Screen name="(home)" />
      </Drawer>
    </GestureHandlerRootView>
  );
};

export default RootLayout;

/*
import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
	const [initializing, setInitializing] = useState(true);
	const [user, setUser] = useState<FirebaseAuthTypes.User | null>();
	const router = useRouter();
	const segments = useSegments();

	const onAuthStateChanged = (user: FirebaseAuthTypes.User | null) => {
		console.log('onAuthStateChanged', user);
		setUser(user);
		if (initializing) setInitializing(false);
	};

	useEffect(() => {
		const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
		return subscriber;
	}, []);

	useEffect(() => {
		if (initializing) return;

		const inAuthGroup = segments[0] === '(auth)';

		if (user && !inAuthGroup) {
			router.replace('/(auth)/home');
		} else if (!user && inAuthGroup) {
			router.replace('/');
		}
	}, [user, initializing]);

	if (initializing)
		return (
			<View
				style={{
					alignItems: 'center',
					justifyContent: 'center',
					flex: 1
				}}
			>
				<ActivityIndicator size="large" />
			</View>
		);

	return (
		<Stack>
			<Stack.Screen name="index" options={{ title: 'Login' }} />
			<Stack.Screen name="(auth)" options={{ headerShown: false }} />
		</Stack>
	);
}
*/