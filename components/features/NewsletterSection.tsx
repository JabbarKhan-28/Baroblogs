
import { COLORS } from '@/constants/theme';
import { db } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, getDocs, query, serverTimestamp, where } from 'firebase/firestore';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

import { useIsMobile } from '@/hooks/useIsMobile';

export default function NewsletterSection() {
    const { isMobile } = useIsMobile();
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubscribe = async () => {
        if (!email.trim() || !email.includes('@')) {
            if (Platform.OS === 'web') {
                alert('Please enter a valid email address.');
            } else {
                Alert.alert('Invalid Email', 'Please enter a valid email address.');
            }
            return;
        }

        setLoading(true);

        try {
            // Check if already subscribed
            const q = query(collection(db, 'subscribers'), where('email', '==', email.trim()));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                if (Platform.OS === 'web') {
                    alert('You are already subscribed!');
                } else {
                    Alert.alert('Already Subscribed', 'This email is already on our list.');
                }
                setLoading(false);
                return;
            }

            await addDoc(collection(db, 'subscribers'), {
                email: email.trim(),
                name: name.trim(),
                createdAt: serverTimestamp(),
                source: 'web_footer'
            });

            setSuccess(true);
            setEmail('');
            setName('');
            
            if (Platform.OS === 'web') {
                alert('Successfully subscribed! Welcome to the newsletter.');
            } else {
                Alert.alert('Success', 'You have been subscribed to the newsletter!');
            }
            
            // Reset success message after 3 seconds
            setTimeout(() => setSuccess(false), 3000);

        } catch (error) {
            console.error('Error subscribing:', error);
            if (Platform.OS === 'web') {
                alert('Failed to subscribe. Please try again.');
            } else {
                Alert.alert('Error', 'Failed to subscribe. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <View 
            style={[
                styles.container, 
                isMobile ? styles.mobileContainer : styles.rowContainer,
            ]}
        >
            <View style={[styles.textBlock, isMobile && styles.centerText]}>
                <View style={styles.iconBatch}>
                     <Ionicons name="mail-open-outline" size={24} color={COLORS.textHighlight} />
                     <Text style={styles.title}>Newsletter</Text>
                </View>
                <Text style={styles.description}>
                    Join our weekly digest. No spam, just code.
                </Text>
            </View>

            <View style={[
                styles.formBlock, 
                isMobile ? styles.mobileForm : styles.rowForm
            ]}>
                <TextInput
                    style={[styles.input, isMobile && styles.fullWidth]}
                    placeholder="Name"
                    placeholderTextColor={COLORS.textMuted}
                    value={name}
                    onChangeText={setName}
                />
                <TextInput
                    style={[styles.input, isMobile && styles.fullWidth]}
                    placeholder="Email Address"
                    placeholderTextColor={COLORS.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                
                <TouchableOpacity 
                    style={[styles.button, isMobile && styles.fullWidth]} 
                    onPress={handleSubscribe}
                    disabled={loading || success}
                >
                    {loading ? (
                        <ActivityIndicator color={COLORS.primaryBg} />
                    ) : success ? (
                         <View style={{flexDirection: 'row', alignItems: 'center', gap: 5}}>
                             <Ionicons name="checkmark-circle" size={20} color={COLORS.primaryBg} />
                             <Text style={styles.buttonText}>Joined!</Text>
                         </View>
                    ) : (
                        <Text style={styles.buttonText}>Subscribe</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: 'rgba(17, 25, 40, 0.7)',
        borderRadius: 24,
        paddingVertical: 30,
        paddingBottom: 80,
        paddingHorizontal: 20,
        marginVertical: 40,
        marginHorizontal: 10,
        borderWidth: 1,
        borderColor: COLORS.border,
        ...Platform.select({
            web: {
                backdropFilter: 'blur(10px)',
                width: '100%',
                maxWidth: 1000,
                alignSelf: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            } as any,
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8
            }
        })
    },
    mobileContainer: {
        flexDirection: 'column',
        
    },
    rowContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 40
    },
    textBlock: {
        flex: 1,
        minWidth: 200,
    },
    centerText: {
        alignItems: 'center',
        textAlign: 'center',
        marginBottom: 20
    },
    iconBatch: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 8
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrim,
    },
    description: {
        fontSize: 16,
        color: COLORS.textSec,
        lineHeight: 24,
    },
    formBlock: {
        flex: 1.5,
        gap: 12,
    },
    mobileForm: {
        flexDirection: 'column',
        width: '100%',
        gap: 15,
    },
    rowForm: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        backgroundColor: COLORS.inputBg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        borderRadius: 12,
        padding: 14,
        color: COLORS.textPrim,
        fontSize: 15,
        flex: 1,
        minWidth: 140
    },
    fullWidth: {
        width: '100%',
        marginBottom: 8
    },
    button: {
        backgroundColor: COLORS.textHighlight,
        borderRadius: 12,
        paddingVertical: 14,
        paddingHorizontal: 24,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 120,
        ...Platform.select({
            web: {
                cursor: 'pointer',
                transition: '0.2s'
            } as any
        })
    },
    buttonText: {
        color: COLORS.primaryBg,
        fontWeight: 'bold',
        fontSize: 16
    }
});
