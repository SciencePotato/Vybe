import React, { useEffect, useState } from "react";
import Drawer from "expo-router/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { useRouter } from "expo-router";
import CustomDrawerContent from "@/components/customDrawer";

const RootLayout = () => {
  const [initializing, setInitializing] = useState(auth()?.currentUser === null);
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

    setTimeout(() => {
      if (user) {
        router.replace("/(home)/(homeTabs)");
      } else {
        router.replace("/(auth)/Auth");
      }
    }, 100);
  }, [user, initializing])

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Drawer 
        drawerContent={CustomDrawerContent}
        screenOptions={{
          headerShown: user !== null,
          drawerType: "front",
          drawerStyle: {
            backgroundColor: "#fff",
            width: 240,
          },
        }}
      >
        <Drawer.Screen 
          name="(home)" 
          options={{
            drawerLabel: "Home",
            title: "Home",
          }}/>
      </Drawer>
    </GestureHandlerRootView>
  );
};

export default RootLayout;