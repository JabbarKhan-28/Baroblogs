import CustomAlertModal, { AlertType } from '@/components/modals/CustomAlertModal';
import { URL_REGEX } from '@/constants/regex';
import { COLORS } from '@/constants/theme';
import { db } from '@/firebaseConfig';
import { pickAndUploadToCloudinary } from '@/services/cloudinary';
import { Ionicons } from '@expo/vector-icons';
import { addDoc, collection, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { sendNewsletterEmail } from '../../services/emailService';

export interface BlogPost {
    createdAt?: any;
    id: string;
    title: string;
    summary: string;
    pdfPath: string; // This is the URL
    date?: string;
    isPrivate?: boolean;
    views?: number;
    category?: string; // Added category
}

interface AddBlogModalProps {
    visible: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    blogToEdit?: BlogPost | null;
}

export default function AddBlogModal({ visible, onClose, onSuccess, blogToEdit }: AddBlogModalProps) {
    const [title, setTitle] = useState('');
    const [summary, setSummary] = useState('');
    const [pdfUrl, setPdfUrl] = useState('');
    const [category, setCategory] = useState('dsa'); // Default
    const [isPrivate, setIsPrivate] = useState(false);
    const [sendNewsletter, setSendNewsletter] = useState(false);
    const [loading, setLoading] = useState(false);

    // Alert State
    const [alertConfig, setAlertConfig] = useState<{
        visible: boolean;
        title: string;
        message: string;
        type: AlertType;
        onConfirm?: () => void;
    }>({
        visible: false,
        title: '',
        message: '',
        type: 'info',
        onConfirm: undefined,
    });

    useEffect(() => {
        if (visible) {
            if (blogToEdit) {
                setTitle(blogToEdit.title || '');
                setSummary(blogToEdit.summary || '');
                setPdfUrl(blogToEdit.pdfPath || '');
                setCategory(blogToEdit.category || 'dsa');
                setIsPrivate(blogToEdit.isPrivate || false);
                // Edit mode: default newsletter to false to avoid spamming on updates? Or keep manual.
                setSendNewsletter(false);
            } else {
                setTitle('');
                setSummary('');
                setPdfUrl('');
                setCategory('dsa');
                setIsPrivate(false);
                setSendNewsletter(false);
            }
        }
    }, [visible, blogToEdit]);

    const showAlert = (type: AlertType, title: string, message: string, onConfirm?: () => void) => {
        setAlertConfig({ visible: true, type, title, message, onConfirm });
    };

    const hideAlert = () => setAlertConfig(prev => ({ ...prev, visible: false }));

    const getFormattedDate = () => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const now = new Date();
        return `${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
    };

    const handleSubmit = async () => {
        if (!title.trim() || !summary.trim() || !pdfUrl.trim()) {
            showAlert('error', 'Missing Information', 'Please fill in all fields (Title, Summary, and PDF Link) to publish.');
            return;
        }

        if (!URL_REGEX.test(pdfUrl.trim())) {
            showAlert('error', 'Invalid URL', 'The PDF Link provided does not look like a valid URL.');
            return;
        }

        setLoading(true);

        try {
            if (!db) throw new Error("Database connection not initialized.");

            const blogData = {
                title: title.trim(),
                summary: summary.trim(),
                pdfPath: pdfUrl.trim(),
                isPrivate: isPrivate,
                category: category,
                updatedAt: serverTimestamp(),
            };

            let newBlogId = blogToEdit ? blogToEdit.id : '';

            if (blogToEdit) {
                const blogRef = doc(db, 'blogs', blogToEdit.id);
                await updateDoc(blogRef, blogData);
            } else {
                const docRef = await addDoc(collection(db, 'blogs'), {
                    ...blogData,
                    views: 0,
                    date: getFormattedDate(),
                    createdAt: serverTimestamp(),
                });
                newBlogId = docRef.id;
            }

            if (onSuccess) onSuccess();

            // Send Newsletter if enabled
            if (sendNewsletter && !isPrivate && newBlogId) {
               // Show sending alert/loading (optional: could just use local loading state)
               // setStatus('Sending newsletter...'); 
               
               const result = await sendNewsletterEmail({ title: title.trim(), summary: summary.trim(), pdfPath: pdfUrl, id: newBlogId });
               
               if (result && result.error) {
                   showAlert('error', 'Newsletter Error', `Blog saved, but newsletter failed: ${result.error}`);
               } else if (result) {
                   const { success, failed, total } = result;
                   if (failed === 0 && success > 0) {
                       showAlert('success', 'Published & Sent', `Blog published and newsletter sent to ${success} subscribers.`);
                   } else if (success > 0 && failed > 0) {
                       showAlert('warning', 'Partial Success', `Blog published. Newsletter sent to ${success} subscribers, but failed for ${failed}.`);
                   } else {
                       showAlert('info', 'Published', `Blog published. (No subscribers found or sent).`);
                   }
                   // Return early so we close *after* alert is acknowledged? 
                   // Current logic shows alert, then closes modal immediately below.
                   // To keep modal open for alert, we might need to delay onClose or let Alert onConfirm close it.
                   // For now, allow close. The alert modal is separate? 
                   // CustomAlertModal is inside this Modal. If we close this Modal, Alert disappears.
                   // Fix: Do NOT close modal immediately if showing an alert.
                   setLoading(false);
                   return; 
               }
            }

            onClose();

        } catch (error: any) {
            console.error("Blog Save Error:", error);
            showAlert('error', 'Publishing Failed', error.message || 'An unexpected error occurred.');
        } finally {
            setLoading(false);
        }
    };

    const categories = [
        { label: 'DSA', value: 'dsa' },
        { label: 'Security', value: 'infosec' },
        { label: 'Network', value: 'network' },
        { label: 'General', value: 'other' }
    ];

    return (
        <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>
                            {blogToEdit ? "Edit" : "New"} <Text style={styles.highlight}>Blog</Text>
                        </Text>
                        <TouchableOpacity onPress={onClose} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
                            <Ionicons name="close" size={24} color={COLORS.textSec} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.form} keyboardShouldPersistTaps="handled">
                        
                        {/* Title */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Title</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter blog title..."
                                placeholderTextColor={COLORS.textSec}
                                value={title}
                                onChangeText={setTitle}
                            />
                        </View>

                        {/* Category Selector */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Category</Text>
                            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                                {categories.map(cat => (
                                    <TouchableOpacity 
                                        key={cat.value}
                                        onPress={() => setCategory(cat.value)}
                                        style={[
                                            styles.categoryChip, 
                                            category === cat.value && styles.categoryChipActive
                                        ]}
                                    >
                                        <Text style={[
                                            styles.categoryText,
                                            category === cat.value && { color: COLORS.primaryBg }
                                        ]}>
                                            {cat.label}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Summary */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Summary</Text>
                            <TextInput
                                style={StyleSheet.flatten([styles.input, styles.textArea])}
                                placeholder="What is this blog about?"
                                placeholderTextColor={COLORS.textSec}
                                value={summary}
                                onChangeText={setSummary}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>

                        {/* PDF Link */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>PDF Document Link</Text>
                            <View style={styles.urlInputContainer}>
                                <TextInput
                                    style={[styles.input, { flex: 1 }]}
                                    placeholder="https://example.com/my-blog.pdf"
                                    placeholderTextColor={COLORS.textSec}
                                    value={pdfUrl}
                                    onChangeText={setPdfUrl}
                                    autoCapitalize="none"
                                    keyboardType="url"
                                    autoCorrect={false}
                                />
                                <TouchableOpacity 
                                    style={styles.uploadBtn}
                                    onPress={async () => {
                                        try {
                                            const result = await pickAndUploadToCloudinary();
                                            if (result) {
                                                setPdfUrl(result.url);
                                            }
                                        } catch (e: any) {
                                            showAlert('error', 'Upload Error', e.message);
                                        }
                                    }}
                                >
                                    <Ionicons name="cloud-upload-outline" size={20} color="#FFF" />
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Visibility */}
                        <View style={styles.inputGroup}>
                            <View style={[styles.header, { padding: 0, borderBottomWidth: 0 }]}>
                                <Text style={styles.label}>Visibility: {isPrivate ? "Private" : "Public"}</Text>
                                <Switch
                                    trackColor={{ false: COLORS.border, true: COLORS.textHighlight }}
                                    thumbColor={isPrivate ? "#FFF" : "#f4f3f4"}
                                    ios_backgroundColor="#3e3e3e"
                                    onValueChange={setIsPrivate}
                                    value={isPrivate}
                                />
                            </View>
                        </View>

                        {/* Newsletter Toggle */}
                        {!isPrivate && (
                            <View style={styles.inputGroup}>
                                <View style={[styles.header, { padding: 0, borderBottomWidth: 0 }]}>
                                    <View>
                                        <Text style={styles.label}>Send Newsletter</Text>
                                        <Text style={{color: COLORS.textSec, fontSize: 11, marginTop: 2, maxWidth: 250}}>
                                            Notify subscribers about this new post
                                        </Text>
                                    </View>
                                    <Switch
                                        trackColor={{ false: COLORS.border, true: COLORS.textHighlight }}
                                        thumbColor={sendNewsletter ? "#FFF" : "#f4f3f4"}
                                        ios_backgroundColor="#3e3e3e"
                                        onValueChange={setSendNewsletter}
                                        value={sendNewsletter}
                                    />
                                </View>
                            </View>
                        )}

                        <TouchableOpacity
                            style={StyleSheet.flatten([
                                styles.submitButton,
                                (loading || !title || !summary || !pdfUrl) && { opacity: 0.6 }
                            ])}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.submitButtonText}>
                                    {blogToEdit ? "Update Blog" : "Publish Blog"}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </ScrollView>

                    <CustomAlertModal
                        visible={alertConfig.visible}
                        type={alertConfig.type}
                        title={alertConfig.title}
                        message={alertConfig.message}
                        onClose={hideAlert}
                        onConfirm={alertConfig.onConfirm}
                    />
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.8)', 
        justifyContent: 'center', 
        padding: 20 
    },
    container: { 
        backgroundColor: COLORS.primaryBg, 
        borderRadius: 20, 
        maxHeight: '90%', 
        borderWidth: 1, 
        borderColor: COLORS.border,
        overflow: 'hidden',
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
        ...Platform.select({
            web: {
                boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.5)'
            } as any,
            android: {
                elevation: 10,
            },
            default: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.5,
                shadowRadius: 20,
            }
        })
    },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: 20, 
        borderBottomWidth: 1, 
        borderBottomColor: COLORS.border 
    },
    title: { fontSize: 22, fontWeight: 'bold', color: COLORS.textPrim },
    highlight: { color: COLORS.textHighlight },
    form: { padding: 20, gap: 16 },
    inputGroup: { gap: 8 },
    label: { color: COLORS.textSec, fontSize: 13, marginLeft: 4, fontWeight: '600' },
    input: { 
        backgroundColor: COLORS.cardBg, 
        borderRadius: 12, 
        padding: 14, 
        color: COLORS.textPrim, 
        fontSize: 15,
        borderWidth: 1,
        borderColor: 'transparent'
    },
    textArea: { height: 100 },
    submitButton: { 
        backgroundColor: COLORS.textHighlight, 
        paddingVertical: 14, 
        borderRadius: 12, 
        alignItems: 'center', 
        marginTop: 10,
        elevation: 2
    },
    submitButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
    urlInputContainer: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center'
    },
    uploadBtn: {
        backgroundColor: COLORS.textHighlight,
        width: 50,
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border
    },
    categoryChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: 'rgba(255,255,255,0.05)'
    },
    categoryChipActive: {
        backgroundColor: COLORS.textHighlight,
        borderColor: COLORS.textHighlight
    },
    categoryText: {
        color: COLORS.textSec,
        fontWeight: '600',
        fontSize: 13
    }
});
