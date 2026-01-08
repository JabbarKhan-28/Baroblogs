import { COLORS } from '@/constants/theme';
import { auth } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { DrawerContentScrollView, DrawerItem, DrawerItemList } from '@react-navigation/drawer';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function CustomDrawerContent(props: any) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => setUser(u));
    return () => unsub();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.primaryBg }}>
      <DrawerContentScrollView 
        {...props} 
        contentContainerStyle={{ paddingTop: 0 }}
        scrollEnabled={false}
      >
        {/* Header Section */}
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
            <View style={styles.avatarContainer}>
                <Image 
                    source={require('@/assets/images/guest.jpg')} 
                    style={styles.avatar} 
                    resizeMode="cover"
                />
            </View>
            <Text style={styles.name}>The Notebook</Text>
            <Text style={styles.slogan}>Code. Design. Create.</Text>
        </View>

        {/* Drawer Items */}
        <View style={styles.itemsContainer}>
            <DrawerItemList {...props} />
            
            {/* Custom Admin Item - Only show if logged in */}
            {user && (
                <View style={{ marginTop: 10, borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: 10 }}>
                    <DrawerItem
                        label="Admin Dashboard"
                        icon={({ color, size }) => (
                            <Ionicons name="settings-outline" size={size} color={color} />
                        )}
                        labelStyle={{ fontFamily: 'System', fontWeight: '600', marginLeft: -10 }}
                        onPress={() => router.push('/dashboard')}
                        inactiveTintColor={COLORS.textSec}
                        inactiveBackgroundColor='transparent'
                        activeTintColor={COLORS.textHighlight}
                    />
                </View>
            )}
        </View>

      </DrawerContentScrollView>

      {/* Footer / Copyright Section */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.divider} />
        <View style={styles.footerContent}>
            <Ionicons name="code-slash" size={16} color={COLORS.textSec} />
            <Text style={styles.copyrightText}>
                Copyright © {new Date().getFullYear()} Jabbar Khan
            </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 10,
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.cardBgHover,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.textHighlight,
    overflow: 'hidden',
  },
  avatar: {
      width: '100%',
      height: '100%'
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrim,
    marginBottom: 4,
  },
  slogan: {
    fontSize: 13,
    color: COLORS.textSec,
  },
  itemsContainer: {
    flex: 1,
    paddingTop: 10,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  divider: {
      height: 1,
      backgroundColor: COLORS.border,
      marginBottom: 15,
      opacity: 0.5
  },
  footerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8
  },
  copyrightText: {
    fontSize: 12,
    color: COLORS.textSec,
    fontWeight: '500',
    opacity: 0.8
  },
});
