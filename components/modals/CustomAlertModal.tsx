
import { COLORS } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as Animatable from "react-native-animatable";

export type AlertType = "success" | "error" | "confirm" | "info" | "destructive" | "warning";

interface CustomAlertModalProps {
  visible: boolean;
  type?: AlertType;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export default function CustomAlertModal({
  visible,
  type = "info",
  title,
  message,
  onClose,
  onConfirm,
  confirmText = "Confirm",
  cancelText = "Cancel",
}: CustomAlertModalProps) {
  
  const getIcon = () => {
    switch (type) {
      case "success": return "checkmark-circle";
      case "error": return "alert-circle";
      case "warning": return "warning";
      case "confirm": return "help-circle";
      case "destructive": return "trash";
      default: return "information-circle";
    }
  };

  const getColor = () => {
    switch (type) {
      case "success": return COLORS.success;
      case "error": return COLORS.error;
      case "warning": return COLORS.warning;
      case "confirm": return COLORS.success; // Green for confirmation
      case "destructive": return COLORS.error;
      default: return COLORS.textHighlight;
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Animatable.View 
            animation="zoomIn" 
            duration={300} 
            style={StyleSheet.flatten([styles.container, { borderColor: getColor() }])}
        >

          {/* Icon Circle */}
          <View style={StyleSheet.flatten([styles.iconContainer, { backgroundColor: `${getColor()}20` }])}>
            <Ionicons name={getIcon()} size={50} color={getColor()} />
          </View>


          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.buttonContainer}>
            {/* Show Cancel button only for 'confirm' or 'destructive' type */}
            {(type === "confirm" || type === "destructive") && (
                <TouchableOpacity style={StyleSheet.flatten([styles.button, styles.cancelButton])} onPress={onClose}>
                    <Text style={styles.cancelText}>{cancelText}</Text>
                </TouchableOpacity>
            )}


            <TouchableOpacity 
                style={StyleSheet.flatten([styles.button, { backgroundColor: getColor() }])} 
                onPress={onConfirm || onClose}
            >

                <Text style={styles.confirmText}>
                    {(type === 'confirm' || type === 'destructive') ? confirmText : 'Okay'}
                </Text>
            </TouchableOpacity>
          </View>
        </Animatable.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    width: "100%",
    maxWidth: 340,
    backgroundColor: COLORS.cardBg, // Glass effect base
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    borderWidth: 1,
    ...Platform.select({
      web: {
        boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.3)',
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
      }
    }),
    elevation: 10,
  },
  iconContainer: {
    padding: 15,
    borderRadius: 50,
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.textPrim,
    marginBottom: 10,
    textAlign: "center",
  },
  message: {
    fontSize: 16,
    color: COLORS.textSec,
    textAlign: "center",
    marginBottom: 25,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 15,
    width: "100%",
    justifyContent: "center",
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 12,
    minWidth: 100,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: COLORS.textSec,
  },
  confirmText: {
    color: "#fff", // Always white on filled buttons
    fontWeight: "bold",
    fontSize: 16,
  },
  cancelText: {
    color: COLORS.textSec,
    fontWeight: "bold",
    fontSize: 16,
  },
});
