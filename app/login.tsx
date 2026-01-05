import CustomAlertModal, { AlertType } from '@/components/modals/CustomAlertModal';
import { COLORS } from '@/constants/theme';
import { auth } from '@/firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Custom Alert State
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    type: AlertType;
    title: string;
    message: string;
    onConfirm?: () => void;
  }>({
    visible: false,
    type: 'info',
    title: "",
    message: "",
  });

  const showAlert = (
    type: AlertType,
    title: string,
    message: string,
    onConfirm?: () => void
  ) => {
    setAlertConfig({ visible: true, type, title, message, onConfirm });
  };

  const hideAlert = () => {
    setAlertConfig((prev) => ({ ...prev, visible: false }));
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert('error', 'Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Login successful, redirect to dashboard or home
      router.replace('/dashboard'); 
    } catch (error: any) {
      console.error(error.code);
      let errorMessage = "An unexpected error occurred.";
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
         errorMessage = "Invalid Email or Password. Please try again.";
      } else if (error.code === 'auth/invalid-email') {
          errorMessage = "The email address is badly formatted.";
      } else {
          errorMessage = error.message;
      }
      showAlert('error', 'Login Failed', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' && (
        <style type="text/css">{`
          input:-webkit-autofill,
          input:-webkit-autofill:hover, 
          input:-webkit-autofill:focus, 
          input:-webkit-autofill:active {
              -webkit-box-shadow: 0 0 0 30px ${COLORS.darkBg} inset !important;
              -webkit-text-fill-color: ${COLORS.textPrim} !important;
              caret-color: ${COLORS.textPrim};
          }
        `}</style>
      )}

      {/* Back Button */}
      <TouchableOpacity 
        onPress={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/');
          }
        }} 
        style={[styles.backButton, { top: Math.max(insets.top + 10, 20) }]}
      >
        <Ionicons name="arrow-back" size={24} color={COLORS.textPrim} />
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={[styles.scrollContent, { minHeight: height }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.contentContainer}>
             <Text style={StyleSheet.flatten([styles.title, width < 400 && { fontSize: 32 }])}>
              Admin <Text style={styles.highlight}>Area</Text>
            </Text>

            <View style={StyleSheet.flatten([styles.form, { padding: width < 400 ? 20 : 32 }])}>
              {Platform.OS !== 'web' && (
                  <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
              )}
              <View style={styles.inputContainer}>
                <Ionicons name="mail" size={20} color={COLORS.textHighlight} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed" size={20} color={COLORS.textHighlight} style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons 
                    name={showPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color={COLORS.textMuted} 
                  />
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={styles.loginButton} 
                onPress={handleLogin}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.primaryBg} />
                ) : (
                  <Text style={styles.loginButtonText}>Authenticate</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
    position: 'relative',
    overflow: 'hidden'
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingBottom: 20
  },
  contentContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 1
  },
  backButton: {
    position: 'absolute',
    left: 20,
    padding: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 10
  },
  title: {
    fontSize: Platform.OS === 'android' ? 40 : 42,
    fontWeight: "900",
    color: COLORS.textPrim,
    marginBottom: 40,
    textAlign: "center",
    letterSpacing: -1,
  },
  highlight: {
    color: COLORS.textHighlight,
  },
  form: {
    gap: 24,
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'rgba(30, 30, 40, 0.4)',
    padding: 32,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    overflow: 'hidden',
    ...Platform.select({
        web: {
          backdropFilter: 'blur(15px)',
          boxShadow: `0 0 40px ${COLORS.textHighlight}40`,
        } as any,
    default: {
            shadowColor: COLORS.textHighlight,
            shadowOffset: { width: 0, height: 10 },
            shadowOpacity: 0.2,
            shadowRadius: 20
        }
    })
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.darkBg,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: COLORS.textPrim,
    fontSize: 18,
    fontWeight: '500',
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) as any,
  },
  loginButton: {
    backgroundColor: COLORS.textHighlight,
    padding: 18,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
    elevation: 8,
    elevation: 8,
    ...Platform.select({
        web: {
            boxShadow: `0 0 20px ${COLORS.textHighlight}66`, // 0.4 opacity approx
        } as any,
        default: {
            shadowColor: COLORS.textHighlight,
            shadowOffset: { width: 0, height: 4 }, // Added offset which was missing/implicit? actually standard shadow usually has offset.
            shadowOpacity: 0.4,
            shadowRadius: 10,
        }
    })
  },
  loginButtonText: {
    color: COLORS.primaryBg,
    fontSize: 20,
    fontWeight: "900",
    letterSpacing: 0.5
  },
});
