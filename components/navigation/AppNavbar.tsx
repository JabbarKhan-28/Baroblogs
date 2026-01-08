import { COLORS } from '@/constants/theme';
import { auth } from '@/firebaseConfig';
import { DEFAULT_TABS, useTabSettings } from '@/services/settingsService';
import { usePathname, useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface AppNavbarProps {
    activeRouteName?: string;
    customTabs?: typeof DEFAULT_TABS;
}

export default function AppNavbar({ activeRouteName, customTabs }: AppNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const { tabs: fetchedTabs } = useTabSettings();
  const currentTabs = customTabs || fetchedTabs || DEFAULT_TABS;

  useEffect(() => {
      const unsub = onAuthStateChanged(auth, u => setUser(u));
      return () => unsub();
  },[]);

  const routes = [
      { name: 'index', label: 'Home', path: '/' },
      { name: 'dsa', label: currentTabs.dsa, path: '/dsa' },
      { name: 'infosec', label: currentTabs.infosec, path: '/infosec' },
      { name: 'network', label: currentTabs.network, path: '/network' },
      { name: 'general', label: currentTabs.general, path: '/general' },
  ];

  // Add Dashboard link only if logged in
  if (user) {
    routes.push({ name: 'dashboard', label: 'Dashboard', path: '/dashboard' });
  }

  const handleNavigate = (route: any) => {
      router.push(route.path);
  };

  const isActive = (route: any) => {
      // Simple matching.
      // If activeRouteName is provided (from CustomTabBar), use it.
      if (activeRouteName) return activeRouteName === route.name;
      
      // Fallback to pathname checking (for Admin Dashboard etc)
      if (route.path === '/' && pathname === '/') return true;
      if (route.path !== '/' && pathname.includes(route.path)) return true;
      return false;
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
         {/* Logo Area */}
         <View>
            <Text style={styles.logoText}>Baro<Text style={{color: COLORS.textHighlight}}>Blogs</Text><Text style={{fontSize:  30}}>.</Text></Text>
         </View>

         {/* Links */}
         <View style={styles.linksContainer}>
            {routes.map((route) => {
              const active = isActive(route);
              const isDashboard = route.name === 'dashboard';

              return (
                <TouchableOpacity
                  key={route.name}
                  onPress={() => handleNavigate(route)}
                  style={[styles.linkItem, active && styles.linkItemActive]}
                >
                  <Text style={[
                      styles.linkText, 
                      active && styles.linkTextActive,
                      isDashboard && !active && { color: COLORS.textHighlight } // Keep it highlighted even if not active
                  ]}>
                    {route.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
         </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 80,
        backgroundColor: 'rgba(5, 10, 20, 0.8)',
        zIndex: 100,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        // @ts-ignore
        backdropFilter: 'blur(20px)',
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: 1200,
        alignSelf: 'center',
        width: '100%',
        paddingHorizontal: 40
    },
    logoText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrim,
        letterSpacing: -1
    },
    linksContainer: {
        flexDirection: 'row',
        gap: 30
    },
    linkItem: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20
    },
    linkItemActive: {
        backgroundColor: 'rgba(56, 189, 248, 0.25)', // Increased opacity
        boxShadow: `0 0 15px ${COLORS.textHighlight}40`, // Add glow
    },
    linkText: {
        color: COLORS.textSec,
        fontSize: 16,
        fontWeight: '600'
    },
    linkTextActive: {
        color: COLORS.textHighlight,
        ...Platform.select({
            web: {
                textShadow: `0 0 10px ${COLORS.textHighlight}`
            } as any,
            default: {
                textShadowColor: COLORS.textHighlight,
                textShadowRadius: 10
            }
        })
    }
});
