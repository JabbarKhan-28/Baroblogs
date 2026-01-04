import CustomDrawerContent from '@/components/navigation/CustomDrawerContent';
import { Tabs } from 'expo-router';
import { Drawer } from 'expo-router/drawer';
import React from 'react';

import CustomTabBar from '@/components/navigation/CustomTabBar';
import { COLORS } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { useIsMobile } from '@/hooks/useIsMobile';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { isMobile } = useIsMobile();

  if (isMobile) {
    return (
      <Drawer
        drawerContent={(props) => <CustomDrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerStyle: {
            backgroundColor: COLORS.primaryBg,
            width: 300,
            borderRightColor: COLORS.border,
            borderRightWidth: 1,
          },
          drawerLabelStyle: {
            color: COLORS.textPrim,
            fontWeight: '600',
          },
          drawerActiveBackgroundColor: COLORS.textHighlight,// Increased opacity
          drawerActiveTintColor: COLORS.primaryBg,
          drawerInactiveTintColor: COLORS.textSec,
          sceneStyle: {
              backgroundColor: COLORS.primaryBg,
          }
        }}
      >
        <Drawer.Screen
          name="index"
          options={{
            drawerLabel: 'Home',
            title: 'Home',
          }}
        />
        <Drawer.Screen
          name="dsa"
          options={{
            drawerLabel: 'DSA',
            title: 'DSA',
          }}
        />
        <Drawer.Screen
          name="infosec"
          options={{
            drawerLabel: 'Security',
            title: 'Security',
          }}
        />
        <Drawer.Screen
          name="network"
          options={{
            drawerLabel: 'Network',
            title: 'Network',
          }}
        />
        <Drawer.Screen
          name="general"
          options={{
            drawerLabel: 'General',
            title: 'General',
          }}
        />
        <Drawer.Screen
          name="dashboard"
          options={{
            drawerItemStyle: { display: 'none' }, // Hide from menu list
            title: 'Admin Dashboard',
            drawerLabel: 'Dashboard' 
          }}
        />
      </Drawer>
    );
  }

  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="dsa"
        options={{
          title: 'DSA',
        }}
      />
      <Tabs.Screen
        name="infosec"
        options={{
          title: 'Security',
        }}
      />
      <Tabs.Screen
        name="network"
        options={{
          title: 'Network',
        }}
      />
      <Tabs.Screen
        name="general"
        options={{
          title: 'General',
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          href: null, // Hide from tab bar
          title: 'Admin Dashboard',
        }}
      />
    </Tabs>
  );
}
