
import BlogCard, { BlogPost } from "@/components/features/BlogCard";
import NewsletterSection from "@/components/features/NewsletterSection";
import AddBlogModal from "@/components/modals/AddBlogModal";
import CustomAlertModal from "@/components/modals/CustomAlertModal";
import BackgroundGlows from "@/components/ui/BackgroundGlows";
import { COLORS } from "@/constants/theme";
import { auth, db } from "@/firebaseConfig";
import { useIsMobile } from "@/hooks/useIsMobile";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawerActions } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as Linking from "expo-linking";
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import { onAuthStateChanged } from 'firebase/auth';
import { collection, deleteDoc, doc, increment, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import * as Animatable from "react-native-animatable";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/* 
 * Reusable Blog Feed Component
 * Used by Home (all tabs) and specific category tabs
 */

interface BlogFeedProps {
    categoryFilter?: string | 'all'; // 'all', 'dsa', 'infosec', 'network'
    showSearch?: boolean;
    headerTitle?: string;
}

export default function BlogFeed({ categoryFilter = 'all', showSearch = true, headerTitle }: BlogFeedProps) {

  const insets = useSafeAreaInsets();
  const router = useRouter();
  const navigation = useNavigation();
  const params = useLocalSearchParams();
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState<any>(null);

  // Auto-open Drawer if requested via params
  useEffect(() => {
      if (params.openDrawer === 'true') {
          // Small timeout to ensure drawer is ready/mounted
          setTimeout(() => {
            navigation.dispatch(DrawerActions.openDrawer());
            // Clear param to prevent reopening on generic re-renders? 
            // Router replace replaces history, so it mimics a fresh nav. 
            // Ideally we'd remove the param but for now this works as an entry trigger.
            router.setParams({ openDrawer: undefined });
          }, 100);
      }
  }, [params.openDrawer]);

  // Admin Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [editingBlog, setEditingBlog] = useState<BlogPost | null>(null);
  
  // Alert State
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: any;
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({ visible: false, type: "info", title: "", message: "" });

  const showAlert = (type: any, title: string, message: string, onConfirm?: () => void) =>
    setAlertConfig({ visible: true, type, title, message, onConfirm });

  const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

  // Auth Listener
  useEffect(() => {
      const unsub = onAuthStateChanged(auth, (u) => setUser(u));
      return () => unsub();
  }, []);

  // Secret Login Logic
  const [secretTaps, setSecretTaps] = useState(0);
  const handleSecretLogin = () => {
    if (user) return;
    const taps = secretTaps + 1;
    if (taps >= 5) {
        setSecretTaps(0);
        router.push('/login');
    } else {
        setSecretTaps(taps);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      const q = query(collection(db, "blogs"), orderBy("createdAt", "desc"));
      const unsubBlogs = onSnapshot(
        q,
        snap => {
          let list = snap.docs.map(d => ({ id: d.id, ...d.data() } as BlogPost));
          setBlogs(list);
          setLoading(false);
        },
        (error) => {
            console.error("Error fetching blogs:", error);
            setLoading(false);
        }
      );

      return () => unsubBlogs();
    }, [])
  );

  const incrementBlogView = async (id: string) => {
      try {
          const viewedKey = `viewed_blog_${id}`;
          const hasViewed = await AsyncStorage.getItem(viewedKey);

          if (!hasViewed) {
              const ref = doc(db, 'blogs', id);
              await updateDoc(ref, {
                  views: increment(1)
              });
              await AsyncStorage.setItem(viewedKey, 'true');
          }
      } catch (e) {
          console.error("View increment failed", e);
      }
  };

  const openPdfBlog = async (blog: BlogPost) => {
    incrementBlogView(blog.id);
    try {
        await WebBrowser.openBrowserAsync(blog.pdfPath);
    } catch (e) {
        console.error("Failed to open link", e);
        Linking.openURL(blog.pdfPath);
    }
  };

  const handleDelete = (id: string) => {
    if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    showAlert("confirm", "Delete Blog", "Delete this blog?", async () => {
      try {
        await deleteDoc(doc(db, "blogs", id));
        hideAlert();
      } catch (e: any) {
        hideAlert();
        showAlert("error", "Error", e.message);
      }
    });
  };

  const handleEdit = (blog: BlogPost) => {
      setEditingBlog(blog);
      setModalVisible(true);
  }

  // Keywords for auto-categorization if category field is missing
  const categoryKeywords: Record<string, string[]> = {
      dsa: ['dsa', 'algorithm', 'structure'],
      infosec: ['security', 'infosec', 'cyber', 'hack'],
      network: ['network', 'tcp', 'ip', 'protocol']
  };

  const getBlogCategory = (blog: BlogPost) => {
      if (blog.category) return blog.category.toLowerCase();
      const text = (blog.title + " " + blog.summary).toLowerCase();
      for (const [key, keywords] of Object.entries(categoryKeywords)) {
          if (keywords.some(k => text.includes(k))) return key;
      }
      return 'other';
  };

  const filteredBlogs = blogs.filter(blog => {
    // Private blogs only visible to admin
    if (blog.isPrivate && !user) return false;
    
    // Category Filter
    if (categoryFilter !== 'all') {
        const cat = getBlogCategory(blog);
        if (cat !== categoryFilter) return false;
    }

    const query = searchQuery.toLowerCase();
    return blog.title.toLowerCase().includes(query) || blog.summary.toLowerCase().includes(query);
  });


  const handleLogout = async () => {
      try {
          await auth.signOut();
          router.replace('/');
      } catch (e) {
          console.error("Logout failed", e);
      }
  };

  const { width, isMobileWeb, isWeb } = useIsMobile();
  const isDesktopWeb = isWeb && !isMobileWeb;

  const headerPaddingTop = (Platform.OS === 'web' && width >= 768) ? 140 : insets.top + 20;

  let cardStyle = {};
  if (Platform.OS === 'web') {
      if (width >= 1024) {
          cardStyle = { width: '31%', flex: 0, minWidth: 350 }; 
      } else if (width >= 768) {
          cardStyle = { width: '48%', flex: 0, minWidth: 300 };
      } else {
          cardStyle = { width: '100%', flex: 0 };
      }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={StyleSheet.flatten([styles.contentContainer, { paddingHorizontal: width < 400 ? 15 : 20, paddingTop: headerPaddingTop, paddingBottom: insets.bottom + 100 }])} showsVerticalScrollIndicator={false}>

        {/* Background Glows */}
        <BackgroundGlows top bottom />

        <View style={styles.headerContainer}>
          <View style={styles.headerRow}>
              {(Platform.OS === 'android' || isMobileWeb) && (
                  <TouchableOpacity 
                    onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
                    style={{ position: 'absolute', left: 0, padding: 10, zIndex: 10 }}
                  >
                      <Ionicons name="menu" size={30} color={COLORS.textPrim} />
                  </TouchableOpacity>
              )}
              <TouchableOpacity activeOpacity={1} onPress={handleSecretLogin} style={{ flex: 1, alignItems: 'center' }}>
                {headerTitle ? (
                    <Text style={[styles.headerText, isDesktopWeb && styles.webHeader]}>{headerTitle}</Text>
                ) : (
                    <Text style={[
                        styles.headerText,
                        isDesktopWeb && styles.webHeader,
                        (isMobileWeb || Platform.OS === 'android') && { fontSize: 32, lineHeight: 38 }
                    ]}>
                    The <Text style={styles.purpleText}>Notebook</Text>
                    </Text>
                )}
              </TouchableOpacity>
              
              {user && (
                 <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                    <Ionicons name="log-out-outline" size={24} color={COLORS.error} />
                 </TouchableOpacity>
              )}
          </View>
          
          {!headerTitle && <Text style={styles.subText}>Exploring the intersection of code, design, and creativity.</Text>}
          
          {showSearch && (
            <Animatable.View animation="fadeIn" delay={300} style={styles.searchContainer}>
                {Platform.OS !== 'web' && (
                    <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                )}
                <Ionicons name="search" size={22} color={COLORS.textHighlight} />
                <TextInput
                style={styles.searchInput}
                placeholder="Search articles..."
                placeholderTextColor={COLORS.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <Ionicons name="close-circle" size={20} color={COLORS.textSec} />
                </TouchableOpacity>
                )}
            </Animatable.View>
          )}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.textHighlight} style={{ marginTop: 50 }} />
        ) : (
          <View style={styles.grid}>
             {/* Admin Add Card */}
             {user && (
                  <Animatable.View animation="fadeInUp" duration={500} delay={100} style={[styles.cardWrapper, cardStyle]}>
                       <TouchableOpacity 
                          style={[styles.card, styles.addCard]}
                          onPress={() => {
                              setEditingBlog(null);
                              setModalVisible(true);
                          }}
                       >
                           <View style={styles.addIconContainer}>
                               <Ionicons name="add" size={40} color={COLORS.textHighlight} />
                           </View>
                           <Text style={styles.addText}>New Article</Text>
                       </TouchableOpacity>
                  </Animatable.View>
             )}

             {filteredBlogs.map((blog, index) => {
                return (
                <Animatable.View 
                    key={blog.id} 
                    animation="fadeInUp" 
                    duration={500} 
                    delay={index * 100}
                    style={[styles.cardWrapper, cardStyle]}
                >
                    <BlogCard 
                        blog={blog} 
                        user={user}
                        onPress={() => openPdfBlog(blog)}
                        onDelete={() => handleDelete(blog.id)}
                        onEdit={() => handleEdit(blog)}
                        isMobileWeb={isMobileWeb}
                    />
                </Animatable.View>
             )})}

             {filteredBlogs.length === 0 && !loading && (
                 <View style={styles.emptyContainer}>
                     <Ionicons name="document-text-outline" size={48} color={COLORS.textMuted} />
                     <Text style={styles.emptyText}>No articles found.</Text>
                 </View>
             )}
          </View>
        )}
        
        <NewsletterSection />
      </ScrollView>

      <AddBlogModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        blogToEdit={editingBlog}
      />

      <CustomAlertModal
        visible={alertConfig.visible}
        type={alertConfig.type}
        title={alertConfig.title}
        message={alertConfig.message}
        onClose={hideAlert}
        onConfirm={alertConfig.onConfirm}
      />

    </View>
  );

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryBg,
  },
  contentContainer: {
    paddingBottom: 40,
  },
  headerContainer: {
    marginBottom: 40,
    alignItems: "center",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
    marginBottom: 10,
    position: 'relative' 
  },
  headerText: {
    fontSize: 32,
    fontWeight: "900",
    color: COLORS.textPrim,
    textAlign: "center",
    letterSpacing: -1,
    ...Platform.select({
        web: {
            textShadow: '0 2px 10px rgba(56, 189, 248, 0.3)'
        } as any,
        default: {
            textShadowColor: 'rgba(56, 189, 248, 0.3)',
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 10,
        }
    })
  },
  webHeader: {
    fontSize: 36, // Slightly larger for desktop but consistent
    lineHeight: 44,
    letterSpacing: -1,
  },
  purpleText: {
    color: COLORS.textHighlight,
  },
  subText: {
    fontSize: 16,
    color: COLORS.textSec,
    marginTop: 8,
    textAlign: "center",
    maxWidth: 600,
    lineHeight: 24,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30, 30, 40, 0.4)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 30,
    width: "100%",
    maxWidth: 500,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    ...Platform.select({
        web: { 
            backdropFilter: 'blur(10px)',
            boxShadow: `0 0 30px ${COLORS.textHighlight}30`
        } as any,
        default: {
             shadowColor: COLORS.textHighlight,
             shadowOffset: { width: 0, height: 4 },
             shadowOpacity: 0.2,
             shadowRadius: 10,
        }
    })
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: COLORS.textPrim,
  },
  grid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'center' 
  },
  cardWrapper: {
      flexBasis: '100%', 
      // @ts-ignore
      ...Platform.select({
          web: {
              flexBasis: 'auto', 
              minWidth: 350,
              maxWidth: 600,
              flex: 1
          }
      })
  },
  card: {
      backgroundColor: 'rgba(17, 25, 40, 0.7)',
      borderRadius: 24,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
      padding: 24,
      marginBottom: 20,
      overflow: 'hidden', // Essential for blur
      ...Platform.select({
          web: {
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
          } as any
      })
  },
  addCard: {
      borderStyle: 'dashed',
      borderColor: COLORS.textHighlight,
      backgroundColor: 'rgba(45, 212, 191, 0.05)',
      alignItems: 'center',
      justifyContent: 'center',
      height: 380, // Fixed height to match BlogCard
  },
  addIconContainer: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: 'rgba(45, 212, 191, 0.1)',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16
  },
  addText: {
      fontSize: 18,
      fontWeight: 'bold',
      color: COLORS.textHighlight
  },
  logoutBtn: {
      padding: 10,
      borderRadius: 12,
      backgroundColor: 'rgba(255, 59, 48, 0.1)', // Error color with opacity
      marginLeft: 15
  },
  emptyContainer: {
      width: '100%',
      alignItems: 'center',
      padding: 40,
      opacity: 0.5
  },
  emptyText: {
      marginTop: 10,
      color: COLORS.textSec,
      fontSize: 16
  }
});
