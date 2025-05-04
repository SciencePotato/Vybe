import { Tabs } from "expo-router";

export default function HomeTabsLayout() {
    return (
        <Tabs>
            <Tabs.Screen
                name="index"
                options={{
                    headerShown: false,
                    title: "Home",
                }}
            />
        </Tabs>
    );
}