import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

const HomeTabs = () => {
    const [user, setUser] = useState<FirebaseAuthTypes.User | null>(auth().currentUser);
    const router = useRouter();

    const onAuthStateChanged = (user: FirebaseAuthTypes.User | null) => {
		console.log('onAuthStateChanged', user);
		setUser(user);
	};

    useEffect(() => {
        setTimeout(() => {
            if (!user) {
                router.replace('/(auth)/Auth');
            }
        }, 100);
		const subscriber = auth().onAuthStateChanged(onAuthStateChanged);
		return subscriber;
	}, [user]);

    useEffect(() => {
        setUser(auth().currentUser);
        setTimeout(() => {
            if (!user) {
                router.replace('/(auth)/Auth');
            }
        }, 100);
        console.log("Initializing", user === null);
    }, [])

    return (
        <View style={styles.container}>
            <Text style={styles.text}>Welcome to Home Tabs!</Text>
            <Button 
                onPress={() => {
                    if (user) {
                        auth().signOut();
                    } else {
                        router.replace('/(auth)/Auth');
                    }
                }} 
		title={user ? "Sign Out" : "Sign In"} 
	  />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff',
    },
    text: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
});

export default HomeTabs;