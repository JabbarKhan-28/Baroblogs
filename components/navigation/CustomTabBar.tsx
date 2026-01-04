
import { COLORS } from '@/constants/theme';
import { auth } from '@/firebaseConfig';
import { DEFAULT_TABS, useTabSettings } from '@/services/settingsService';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppNavbar from './AppNavbar';

export default function CustomTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { tabs } = useTabSettings();
  const currentTabs = tabs || DEFAULT_TABS;
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isWeb = Platform.OS === 'web';
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
      const unsub = onAuthStateChanged(auth, u => setUser(u));
      return () => unsub();
  },[]);

  if (isWeb) {
    // WEB: Top Navbar
    const routeName = state.routes[state.index].name;
    if (routeName === 'dashboard') return null;
    return <AppNavbar activeRouteName={routeName} />;
  }

  // MOBILE: Bottom Tab Bar with customized look
  return (
    <View style={[mobileStyles.container, { paddingBottom: insets.bottom }]}>
        {Platform.OS === 'ios' && (
             <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
        )}
      <View style={mobileStyles.content}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          // Icon handling
          let iconName: any = "circle";
          if (route.name === 'index') iconName = isFocused ? "home" : "home-outline";
          else if (route.name === 'dsa') iconName = isFocused ? "code-slash" : "code-slash-outline";
          else if (route.name === 'infosec') iconName = isFocused ? "shield-checkmark" : "shield-checkmark-outline";
          else if (route.name === 'network') iconName = isFocused ? "git-network" : "git-network-outline";
          else if (route.name === 'general') iconName = isFocused ? "newspaper" : "newspaper-outline";

          // Dynamic Label Handling
          let label = options.title;
          if (route.name === 'dsa') label = currentTabs.dsa;
          else if (route.name === 'infosec') label = currentTabs.infosec;
          else if (route.name === 'network') label = currentTabs.network;
          else if (route.name === 'general') label = currentTabs.general;

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={mobileStyles.tabButton}
            >
              <Ionicons 
                name={iconName} 
                size={24} 
                color={isFocused ? COLORS.textHighlight : COLORS.textSec} 
              />
              <Text style={[
                  mobileStyles.label, 
                  { color: isFocused ? COLORS.textHighlight : COLORS.textSec }
              ]}>
                  {label}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Mobile Dashboard Icon */}
        {user && (
             <TouchableOpacity
              onPress={() => router.push('/dashboard')}
              style={mobileStyles.tabButton}
            >
              <Ionicons 
                name="settings-outline" 
                size={24} 
                color={COLORS.textHighlight} 
              />
              <Text style={[
                  mobileStyles.label, 
                  { color: COLORS.textHighlight }
              ]}>
                  Admin
              </Text>
            </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const mobileStyles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Platform.OS === 'ios' ? 'transparent' : COLORS.tabBarBg,
        borderTopWidth: 0,
        elevation: 0,
    },
    content: {
        flexDirection: 'row',
        height: 60,
        alignItems: 'center',
        justifyContent: 'space-around'
    },
    tabButton: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4
    },
    label: {
        fontSize: 10,
        fontWeight: '600'
    }
});
