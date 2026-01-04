
import BackgroundGlows from '@/components/ui/BackgroundGlows';
import { COLORS } from '@/constants/theme';
import { db } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { doc, getDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function BlogDeepLink() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchBlogAndOpen();
    }
  }, [id]);

  const fetchBlogAndOpen = async () => {
    try {
        if (typeof id !== 'string') return;
        const docRef = doc(db, 'blogs', id);
        const snapshot = await getDoc(docRef);
        
        if (snapshot.exists()) {
            const data = snapshot.data();
            if (data.pdfPath) {
                // Open PDF
                await WebBrowser.openBrowserAsync(data.pdfPath);
                setLoading(false);
            } else {
                setError("Blog content (PDF) missing.");
                setLoading(false);
            }
        } else {
            setError("Blog post not found or deleted.");
            setLoading(false);
        }
    } catch (e) {
        console.error(e);
        setError("Failed to load blog details.");
        setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
        <BackgroundGlows top />
        
        <View style={styles.content}>
            {loading ? (
                <>
                    <ActivityIndicator size="large" color={COLORS.textHighlight} />
                    <Text style={styles.loadingText}>Fetching Article...</Text>
                </>
            ) : error ? (
                <>
                    <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
                    <Text style={styles.errorText}>{error}</Text>
                    <TouchableOpacity onPress={() => router.replace('/')} style={styles.homeBtn}>
                        <Ionicons name="home-outline" size={20} color={COLORS.primaryBg} />
                        <Text style={styles.homeBtnText}>Return Home</Text>
                    </TouchableOpacity>
                </>
            ) : (
                <>
                    <Ionicons name="document-text-outline" size={64} color={COLORS.textHighlight} />
                    <Text style={styles.successText}>Article Opened</Text>
                    <Text style={styles.subText}>If the PDF didn't open, click below.</Text>
                    
                    <TouchableOpacity onPress={fetchBlogAndOpen} style={styles.retryBtn}>
                        <Text style={styles.retryBtnText}>Open PDF Again</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => router.replace('/')} style={styles.secondaryBtn}>
                        <Text style={styles.secondaryBtnText}>Go to Home</Text>
                    </TouchableOpacity>
                </>
            )}
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.primaryBg,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
    },
    loadingText: {
        marginTop: 20,
        color: COLORS.textSec,
        fontSize: 16
    },
    errorText: {
        color: COLORS.textPrim,
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 30,
        textAlign: 'center'
    },
    successText: {
        color: COLORS.textPrim,
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 20
    },
    subText: {
        color: COLORS.textSec,
        marginTop: 10,
        marginBottom: 30,
        textAlign: 'center'
    },
    homeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.textHighlight,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 12,
        gap: 8
    },
    homeBtnText: {
        color: COLORS.primaryBg,
        fontWeight: 'bold',
        fontSize: 16
    },
    retryBtn: {
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        borderWidth: 1,
        borderColor: COLORS.textHighlight,
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 12,
        marginBottom: 15
    },
    retryBtnText: {
        color: COLORS.textHighlight,
        fontWeight: 'bold',
        fontSize: 16
    },
    secondaryBtn: {
        padding: 10
    },
    secondaryBtnText: {
        color: COLORS.textSec,
        fontSize: 15,
        textDecorationLine: 'underline'
    }
});
