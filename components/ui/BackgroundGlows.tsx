import { COLORS } from "@/constants/theme";
import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";

interface BackgroundGlowsProps {
  top?: boolean;
  bottom?: boolean;
  topLeft?: boolean;
  bottomRight?: boolean;
  style?: ViewStyle;
}

export default function BackgroundGlows({ 
  top = false, 
  bottom = false, 
  topLeft = false, 
  bottomRight = false,
  style 
}: BackgroundGlowsProps) {
  
  return (
    <View style={[styles.container, style]} pointerEvents="none">
      {top && <View style={styles.glowTop} />}
      {bottom && <View style={styles.glowBottom} />}
      {topLeft && <View style={styles.glowTopLeft} />}
      {bottomRight && <View style={styles.glowBottomRight} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
    zIndex: -1,
  },
  glowTop: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.glowPurple,
    opacity: 0.5,
  },
  glowBottom: {
    position: 'absolute',
    bottom: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.glowCyan,
    opacity: 0.3,
  },
  glowTopLeft: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.glowCyan,
    opacity: 0.5,
  },
  glowBottomRight: {
    position: 'absolute',
    bottom: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: COLORS.glowPurple,
    opacity: 0.3,
  },
});
