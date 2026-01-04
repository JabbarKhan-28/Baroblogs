import { COLORS } from "@/constants/theme";
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import * as Linking from 'expo-linking';
import React from 'react';
import { Platform, Share, StyleSheet, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';

// Minimal interface needed for display if we aren't importing the full logical Modal yet
export interface BlogPost {
    id: string;
    title: string;
    summary: string;
    date: string;
    pdfPath: string; // URL to PDF
    coverImage?: string; // Optional cover
    views?: number;
    isPrivate?: boolean;
    category?: string;
    createdAt?: any;
}

export default function BlogCard({ blog, user, onPress, onDelete, onEdit, isMobileWeb }: { blog: BlogPost, user?: any, onPress: () => void, onDelete?: (id: string) => void, onEdit?: (blog: BlogPost) => void, isMobileWeb: boolean }) {
    const { width } = useWindowDimensions();

    const handleShare = async (blog: BlogPost) => {
        if (Platform.OS !== 'web') Haptics.selectionAsync();
        try {
          let url = "";
          if (Platform.OS === 'web') {
              url = `${window.location.origin}/blog/${blog.id}`;
          } else {
              url = Linking.createURL(`/blog/${blog.id}`);
          }
          
          const message = `Check out this blog: "${blog.title}"\n\n${blog.summary}`;
          
          await Share.share({
            message: `${message}\n\nRead here: ${url}`,
            url: url, 
            title: blog.title, 
          });
        } catch (error) {
          console.error("Share failed:", error);
          if (Platform.OS === 'web') {
              try {
                  let url = `${window.location.origin}/blog/${blog.id}`;
                  await navigator.clipboard.writeText(url);
                  alert('Link copied to clipboard'); 
              } catch (clipErr) {
                  console.error("Clipboard failed", clipErr);
              }
          }
        }
      };

    return (
        <TouchableOpacity activeOpacity={0.9} onPress={onPress}>
          <View style={[
              styles.blogCard,
              isMobileWeb && {
                 boxShadow: 'none',
                 backdropFilter: 'none',
                 transition: 'none',
                 shadowColor: COLORS.textHighlight,
                 shadowOffset: { width: 0, height: 10 },
                 shadowOpacity: 0.2,
                 shadowRadius: 20,
            } as any
          ]}>
              {Platform.OS !== 'web' && (
                  <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
              )}
              <View style={StyleSheet.flatten([styles.cardBody, { padding: width < 450 ? 20 : 30 }])}>
                  <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 8}}>
                  <Text style={[styles.blogDate, (isMobileWeb || Platform.OS === 'android') && { fontSize: 14, marginBottom: 0 }]}>{blog.date}</Text>
                  {blog.isPrivate && <Ionicons name="lock-closed" size={12} color={COLORS.textHighlight} />}
                      <View style={{ width: 1, height: 12, backgroundColor: COLORS.textSec, opacity: 0.5, marginHorizontal: 4 }} />
                      <Ionicons name="eye-outline" size={12} color={COLORS.textSec} />
                      <Text style={{ color: COLORS.textSec, fontSize: 12, fontWeight: '600' }}>{blog.views || 0}</Text>
                  </View>
                  <Text style={StyleSheet.flatten([
                      styles.blogTitle, 
                      { height: width < 450 ? 56 : 60 },
                      (isMobileWeb || Platform.OS === 'android') && { fontSize: 26 }
                   ])} numberOfLines={2}>{blog.title}</Text>
                  
                  <View style={styles.cardDivider} />
                  <View style={styles.summaryContainer}>
                    <Text style={[styles.blogSummary, (isMobileWeb || Platform.OS === 'android') && { fontSize: 18 }]} numberOfLines={3}>{blog.summary}</Text>
                  </View>
                  
                  <View style={styles.readMoreBtn}>
                      <Text style={styles.readMoreText}>Continue Reading</Text>
                      <Ionicons name="arrow-forward" size={18} color={COLORS.primaryBg} />
                  </View>
              </View>
              
              <View style={styles.topActions}>
                  <TouchableOpacity style={styles.actionBtnIcon} onPress={() => handleShare(blog)}>
                      <Ionicons name="share-social" size={16} color={COLORS.textPrim} />
                  </TouchableOpacity>

                  {user && onDelete && onEdit && (
                      <>
                           <TouchableOpacity style={StyleSheet.flatten([styles.actionBtnIcon, { backgroundColor: COLORS.textHighlight }])} onPress={() => onEdit(blog)}>
                               <Ionicons name="create" size={16} color={COLORS.primaryBg} />
                           </TouchableOpacity>
                           <TouchableOpacity style={StyleSheet.flatten([styles.actionBtnIcon, { backgroundColor: COLORS.error }])} onPress={() => onDelete(blog.id)}>
                               <Ionicons name="trash" size={16} color="#FFF" />
                           </TouchableOpacity>
                      </>
                  )}
              </View>
          </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
  blogCard: { 
      borderRadius: 32, 
      overflow: "hidden", 
      borderWidth: 1, 
      borderColor: 'rgba(255, 255, 255, 0.1)',
      backgroundColor: 'rgba(17, 25, 40, 0.7)',
      height: 380, // Fixed height for uniformity
      ...Platform.select({
          web: {
              boxShadow: `0 0 40px ${COLORS.textHighlight}40`,
              backdropFilter: 'blur(15px)',
              transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
              display: 'flex', 
              flexDirection: 'column'
          } as any,

          default: {
              shadowColor: COLORS.textHighlight,
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.2,
              shadowRadius: 20,
              elevation: 0 // Remove elevation to prevent black background artifact
          }
      })
  },
  cardBody: { 
    alignItems: 'center',
    width: '100%',
    flex: 1, // Fill the fixed height
    justifyContent: 'space-between',
    padding: 24
  },
  blogTitle: { 
    fontSize: (Platform.OS === 'android' || Platform.OS === 'web') ? 24 : 22, // Unifying size for consistency or using responsive logic below in render
    // Actually, let's use the style override in the component for dynamic handling or update this standard:
    // fontSize: 26, 
    color: COLORS.textPrim, 
    fontWeight: "900", 
    textAlign: "center", 
    marginBottom: 12,
    lineHeight: 28,
    letterSpacing: -0.5,
  },
  blogDate: { 
    color: COLORS.textHighlight, 
    fontSize: 12, 
    fontWeight: '800', 
    textAlign: "center", 
    marginBottom: 8, 
    textTransform: 'uppercase', 
    letterSpacing: 2 
  },
  cardDivider: {
    width: 30,
    height: 3,
    backgroundColor: COLORS.textHighlight,
    borderRadius: 2,
    marginBottom: 20
  },
  summaryContainer: {
    height: 72, 
    marginBottom: 25,
    justifyContent: 'center',
    width: '100%'
  },
  blogSummary: { 
    color: COLORS.textSec, 
    fontSize: 16, 
    lineHeight: 22, 
    textAlign: "center",
    opacity: 0.9
  },
  readMoreBtn: { 
      backgroundColor: COLORS.textHighlight, 
      flexDirection: "row", 
      alignItems: "center", 
      justifyContent: 'center',
      gap: 12, 
      paddingVertical: 14, 
      paddingHorizontal: 28, 
      borderRadius: 20,
      width: '100%',
      shadowColor: COLORS.textHighlight,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 0 // Remove elevation to prevent black background artifact 
  },
  readMoreText: { 
    color: COLORS.primaryBg, 
    fontWeight: "900",
    fontSize: 16,
    letterSpacing: 0.5
  },
  topActions: {
      position: "absolute",
      top: 15,
      right: 15,
      flexDirection: 'row',
      gap: 10,
      zIndex: 10
  },
  actionBtnIcon: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)'
  }
});
