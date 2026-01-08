
import BackgroundGlows from '@/components/ui/BackgroundGlows';
import { COLORS } from '@/constants/theme';
import { auth, db } from '@/firebaseConfig';
import { DEFAULT_TABS, updateTabSettings, useTabSettings } from '@/services/settingsService';
import { Ionicons } from '@expo/vector-icons';
import { DrawerActions } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import { useFocusEffect, useNavigation, useRouter } from 'expo-router';
import { collection, getCountFromServer, getDocs, limit, orderBy, query } from 'firebase/firestore';
import React, { useCallback, useEffect, useState } from 'react';
import {
    ActivityIndicator,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useIsMobile } from '@/hooks/useIsMobile';

export default function AdminDashboard() {
  const { tabs: currentTabs, loading: tabsLoading } = useTabSettings();
  const [editTabs, setEditTabs] = useState(DEFAULT_TABS);
  const [saving, setSaving] = useState(false);
  const [tabModalVisible, setTabModalVisible] = useState(false);

  const [stats, setStats] = useState({ views: 0, subscribers: 0, articles: 0 });
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [topArticles, setTopArticles] = useState<any[]>([]);
  
  // Auth state
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  
  const { isMobileWeb, isWeb } = useIsMobile();

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
        setIsAuthChecked(true);
        setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Only redirect to login if we have finished checking auth AND no user is present
      if (isAuthChecked && !currentUser) {
          router.replace('/login');
      }
    }, [isAuthChecked, currentUser])
  );

  useEffect(() => {
      if (currentTabs) {
          setEditTabs(currentTabs);
      }
  }, [currentTabs]);

  const handleSaveTabs = async () => {
      setSaving(true);
      await updateTabSettings(editTabs);
      setSaving(false);
      alert('Tabs updated successfully!');
      setTabModalVisible(false); // Close modal on save
  };

  useEffect(() => {
    if (currentUser) {
        fetchStats();
    }
  }, [currentUser]);

  const fetchStats = async () => {
    try {
      // 1. Articles Count
      const blogsCol = collection(db, 'blogs');
      const articlesSnap = await getCountFromServer(blogsCol);
      const articleCount = articlesSnap.data().count;

      // 2. Views Count & Top Articles
      const blogsQuery = query(blogsCol, orderBy('views', 'desc'));
      const blogsSnap = await getDocs(blogsQuery);
      
      let totalViews = 0;
      const allBios: any[] = [];
      
      blogsSnap.forEach(doc => {
          const data = doc.data();
          totalViews += (data.views || 0);
          allBios.push({
              id: doc.id,
              ...data,
              date: data.date || (data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString() : 'Unknown')
          });
      });

      // Top 3 Articles
      const top3 = allBios.slice(0, 3);

      // 3. Subscribers
      const subsCol = collection(db, 'subscribers');
      const subsCountSnap = await getCountFromServer(subsCol);
      const subsCount = subsCountSnap.data().count;

      // 4. Recent Subscribers (Placeholder if collection empty)
      const recentSubsQuery = query(subsCol, orderBy('createdAt', 'desc'), limit(5));
      const recentSubsSnap = await getDocs(recentSubsQuery);
      const recentSubs = recentSubsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          date: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toLocaleDateString() : 'Recently'
      }));

      setStats({
          articles: articleCount,
          subscribers: subsCount,
          views: totalViews
      });
      setSubscribers(recentSubs);
      setTopArticles(top3);

    } catch (error) {
        console.error("Error fetching admin stats:", error);
    } finally {
        setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
        await auth.signOut();
        router.replace('/');
    } catch (e) {
        console.error("Logout failed", e);
    }
  };

  if (!isAuthChecked || !currentUser || loading) {
      return (
          <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator size="large" color={COLORS.textHighlight} />
          </View>
      );
  }

  return (
    <View style={styles.container}>
      <BackgroundGlows top bottom />
      
      <ScrollView 
        contentContainerStyle={[
            styles.content, 
            { paddingTop: (isWeb && !isMobileWeb) ? 80 : insets.top + 20, paddingBottom: 60 }
        ]}
      >
        {/* Header Section */}
        <View style={[
            styles.header,
            (isMobileWeb || Platform.OS !== 'web') && { flexDirection: 'column', alignItems: 'flex-start', gap: 20 }
        ]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15, width: 'auto' }}>
                {(Platform.OS === 'android' || isMobileWeb) && (
                     <TouchableOpacity 
                        onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                        style={{ padding: 5 }}
                     >
                         <Ionicons name="menu" size={32} color={COLORS.textPrim} />
                     </TouchableOpacity>
                )}
                <View>
                    <Text style={[styles.title, (isMobileWeb || Platform.OS === 'android') && { fontSize: 32 }]}>Dashboard</Text>
                    <Text style={styles.subtitle}>Welcome back, Admin</Text>
                </View>
            </View>
            <View style={[
                styles.headerActions,
                (isMobileWeb || Platform.OS !== 'web') && { width: '100%', justifyContent: 'space-between' }
            ]}>
                 <TouchableOpacity 
                    style={[
                        styles.iconButton, 
                        {borderColor: COLORS.textHighlight},
                        Platform.OS === 'web' && {
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                        } as any
                    ]}
                    onPress={() => setTabModalVisible(true)}
                 >
                     {Platform.OS === 'ios' && <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />}
                     <Ionicons name="build-outline" size={20} color={COLORS.textHighlight} />
                 </TouchableOpacity>

                 <TouchableOpacity 
                    style={[
                        styles.iconButton, 
                        {borderColor: COLORS.textHighlight},
                        Platform.OS === 'web' && {
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                        } as any
                    ]}
                 >
                     {Platform.OS === 'ios' && <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />}
                     <Ionicons name="person-outline" size={20} color={COLORS.textHighlight} />
                 </TouchableOpacity>

                 <TouchableOpacity 
                    onPress={handleLogout} 
                    style={[
                        styles.iconButton, 
                        {borderColor: COLORS.error},
                        Platform.OS === 'web' && {
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
                        } as any
                    ]}
                 >
                     {Platform.OS === 'ios' && <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />}
                     <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
                 </TouchableOpacity>
            </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
            <StatCard 
                icon="eye-outline" 
                label="Total Views" 
                value={stats.views} 
                color="#4D6EFF"
                isMobileWeb={isMobileWeb}
            />
            <StatCard 
                icon="people-outline" 
                label="Subscribers" 
                value={stats.subscribers} 
                color="#00C9A7"
                isMobileWeb={isMobileWeb}
            />
            <StatCard 
                icon="document-text-outline" 
                label="Total Articles" 
                value={stats.articles} 
                color="#3D9BFF"
                isMobileWeb={isMobileWeb}
            />
        </View>

        {/* Top Performing Articles */}
        <View style={styles.section}>
             <Text style={styles.sectionTitle}>Top Performing Articles</Text>
             <View style={styles.listContainer}>
                {topArticles.length === 0 ? (
                    <Text style={styles.emptyText}>No articles yet.</Text>
                ) : (
                    topArticles.map((article, index) => (
                        <View key={article.id} style={[
                            styles.articleRow,
                            Platform.OS === 'web' && {
                                backdropFilter: isMobileWeb ? 'none' : 'blur(12px)',
                                boxShadow: isMobileWeb ? 'none' : '0 4px 30px rgba(0, 0, 0, 0.1)',
                            } as any
                        ]}>
                            {Platform.OS === 'ios' && <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />}
                            <View style={styles.rankBadge}>
                                <Text style={styles.rankText}>#{index + 1}</Text>
                            </View>
                            <View style={{flex: 1, paddingHorizontal: 15}}>
                                <Text style={styles.articleTitle} numberOfLines={1}>{article.title}</Text>
                                <Text style={styles.articleDate}>{article.date}</Text>
                            </View>
                            <View style={styles.viewBadge}>
                                <Ionicons name="eye" size={14} color={COLORS.textSec} style={{marginRight: 6}} />
                                <Text style={styles.viewCount}>{article.views}</Text>
                            </View>
                        </View>
                    ))
                )}
             </View>
        </View>

        {/* Recent Subscribers List */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Subscribers</Text>
            <View style={styles.listContainer}>
                {subscribers.length === 0 ? (
                    <Text style={styles.emptyText}>No subscribers yet.</Text>
                ) : (
                    subscribers.map((sub) => (
                        <View key={sub.id} style={[
                            styles.listItem,
                            Platform.OS === 'web' && {
                                backdropFilter: isMobileWeb ? 'none' : 'blur(12px)',
                                boxShadow: isMobileWeb ? 'none' : '0 4px 30px rgba(0, 0, 0, 0.1)',
                            } as any
                        ]}>
                             {Platform.OS === 'ios' && <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />}
                             <View style={styles.listItemIcon}>
                                 <Ionicons name="mail" size={16} color={COLORS.textHighlight} />
                             </View>
                             <View style={{flex: 1}}>
                                 <Text style={styles.listItemTitle}>{sub.email}</Text>
                                 <Text style={styles.listItemDate}>{sub.date}</Text>
                             </View>
                        </View>
                    ))
                )}
            </View>
        </View>
      </ScrollView>

      {/* Tab Management Modal */}
      <Modal
          animationType="fade"
          transparent={true}
          visible={tabModalVisible}
          onRequestClose={() => setTabModalVisible(false)}
      >
          <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                  <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>Manage Tabs</Text>
                      <TouchableOpacity onPress={() => setTabModalVisible(false)}>
                          <Ionicons name="close" size={24} color={COLORS.textSec} />
                      </TouchableOpacity>
                  </View>
                  
                  <ScrollView showsVerticalScrollIndicator={false}>
                      {(['dsa', 'infosec', 'network', 'general'] as const).map((key) => {
                         const displayNames: Record<string, string> = {
                             dsa: 'DSA',
                             infosec: 'Security',
                             network: 'Network',
                             general: 'General'
                         };
                         
                         return (
                             <View key={key} style={styles.inputGroup}>
                                 <Text style={styles.inputLabel}>{displayNames[key] || key.toUpperCase()} Tab Name</Text>
                                 <View style={styles.inputContainer}>
                                     <TextInput
                                        style={styles.input}
                                        value={editTabs[key as keyof typeof editTabs]}
                                        onChangeText={(text) => setEditTabs(prev => ({...prev, [key]: text}))}
                                        placeholder={`Enter name for ${displayNames[key]}`}
                                        placeholderTextColor={COLORS.textMuted}
                                     />
                                 </View>
                             </View>
                         );
                      })}
                     
                     <TouchableOpacity 
                        style={[styles.saveBtn, saving && {opacity: 0.7}]}
                        onPress={handleSaveTabs}
                        disabled={saving}
                     >
                         {saving ? (
                             <ActivityIndicator color="#fff" size="small" />
                         ) : (
                             <>
                                <Ionicons name="save-outline" size={20} color="#fff" />
                                <Text style={styles.saveBtnText}>Save Changes</Text>
                             </>
                         )}
                     </TouchableOpacity>
                  </ScrollView>
              </View>
          </View>
      </Modal>
    </View>
  );
}



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBg,
  },
  content: {
    paddingHorizontal: 16,
    maxWidth: 1200,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 40,
  },
  title: {
      fontSize: 42,
      fontWeight: '900',
      color: COLORS.textPrim,
      letterSpacing: -1,
  },
  subtitle: {
      color: COLORS.textSec,
      fontSize: 16,
      marginTop: 8
  },
  headerActions: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 12
  },
  iconButton: {
      width: 44,
      height: 44,
      borderRadius: 14,
      borderWidth: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(17, 25, 40, 0.4)',
      overflow: 'hidden',
      ...Platform.select({
          web: {
              cursor: 'pointer',
              boxShadow: `0 4px 10px ${COLORS.textHighlight}1A`, // 0.1 opacity
              transition: 'all 0.2s ease',
          } as any,
          default: {
             shadowColor: COLORS.textHighlight,
             shadowOffset: { width: 0, height: 4 },
             shadowOpacity: 0.1,
             shadowRadius: 10,
          }
      })
  },
  statsGrid: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: 12, // Reduced gap for better mobile fit
      flexWrap: 'wrap',
      marginBottom: 30
  },
  statCard: {
      flex: 1,
      minWidth: 250,
      backgroundColor: 'rgba(17, 25, 40, 0.4)', // More transparent
      borderWidth: 1,
      borderColor: 'rgba(56, 189, 248, 0.2)', // Subtle blue tint on border
      padding: 16, // Reduced padding
      borderRadius: 24,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 20,
      overflow: 'hidden',
      ...Platform.select({
          default: {
               shadowColor: '#38bdf8', // Blue glow shadow
               shadowOffset: { width: 0, height: 4 },
               shadowOpacity: 0.15,
               shadowRadius: 10,
               elevation: 0 // Remove elevation on Android to avoid black artifacts
          }
      }),
  },
  statIcon: {
      width: 60,
      height: 60,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1
  },
  statValue: {
      fontSize: 32,
      fontWeight: 'bold',
      color: COLORS.textPrim,
      marginBottom: 4
  },
  statLabel: {
      color: COLORS.textSec,
      fontSize: 14,
      fontWeight: '500'
  },
  section: {
      marginBottom: 30
  },
  sectionTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: COLORS.textPrim,
      marginBottom: 15
  },
  listContainer: {
      gap: 10, // Add gap between items
      padding: 5,
  },
  listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: 'rgba(17, 25, 40, 0.4)',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.05)',
  },
  articleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      backgroundColor: 'rgba(17, 25, 40, 0.4)',
      borderRadius: 16,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.05)',
  },
  listItemIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: 'rgba(45, 212, 191, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16
  },
  listItemTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: COLORS.textPrim
  },
  listItemDate: {
      fontSize: 13,
      color: COLORS.textSec,
      marginTop: 2
  },
  rankBadge: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: 'rgba(45, 212, 191, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(45, 212, 191, 0.2)'
  },
  rankText: {
      color: COLORS.textHighlight,
      fontWeight: 'bold',
      fontSize: 14
  },
  articleTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: COLORS.textPrim,
      marginBottom: 4
  },
  articleDate: {
      fontSize: 12,
      color: COLORS.textSec
  },
  viewBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.05)',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 20
  },
  viewCount: {
      color: COLORS.textPrim,
      fontWeight: 'bold',
      fontSize: 14
  },
  emptyText: {
      color: COLORS.textSec,
      textAlign: 'center',
      padding: 20
  },
  card: {
      backgroundColor: 'rgba(17, 25, 40, 0.4)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
      padding: 16,
      borderRadius: 24,
  },
  inputGroup: {
      marginBottom: 20
  },
  inputLabel: {
      color: COLORS.textSec,
      marginBottom: 8,
      fontSize: 14,
      fontWeight: '600'
  },
  inputContainer: {
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
  },
  input: {
      padding: 16,
      color: COLORS.textPrim,
      fontSize: 16
  },
  saveBtn: {
      backgroundColor: COLORS.textHighlight,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 16,
      borderRadius: 16,
      marginTop: 10,
      gap: 10
  },
  saveBtnText: {
      color: '#fff',
      fontWeight: 'bold',
      fontSize: 16
  },
  modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.8)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 20
  },
  modalContent: {
      width: '100%',
      maxWidth: 500,
      backgroundColor: COLORS.cardBg,
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      ...Platform.select({
          web: {
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)'
          } as any
      })
  },
  modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 24
  },
  modalTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: COLORS.textPrim
  }
});

const StatCard = ({ icon, label, value, color, isMobileWeb }: { icon: any, label: string, value: number, color: string, isMobileWeb?: boolean }) => (
    <View style={[
        styles.statCard,
        Platform.OS === 'web' && {
            boxShadow: isMobileWeb ? 'none' : '0 4px 30px rgba(0, 0, 0, 0.1)',
            backdropFilter: isMobileWeb ? 'none' : 'blur(20px)',
            WebkitBackdropFilter: isMobileWeb ? 'none' : 'blur(20px)',
        } as any
    ]}>
        {Platform.OS === 'ios' && <BlurView intensity={40} style={StyleSheet.absoluteFill} tint="dark" />}
        <View style={[styles.statIcon, { backgroundColor: `${color}20`, borderColor: `${color}40` }]}>
            <Ionicons name={icon} size={24} color={color} />
        </View>
        <View>
            <Text style={[styles.statValue, (isMobileWeb || Platform.OS === 'android') && { fontSize: 26 }]}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    </View>
);
