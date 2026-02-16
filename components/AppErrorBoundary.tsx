import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Colors from "@/constants/colors";

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends React.Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Unhandled app error", error);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <LinearGradient
        colors={["#FFF7F4", "#F4F8FF", "#F5FFF8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <BlurView intensity={28} tint="light" style={styles.card}>
          <Text style={styles.title}>Une erreur est survenue</Text>
          <Text style={styles.description}>
            L&apos;application a rencontre un probleme inattendu. Tu peux relancer l&apos;interface sans
            perdre les donnees enregistrees.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={this.handleRetry}
            accessibilityRole="button"
            accessibilityLabel={"Relancer l'application"}
          >
            <Text style={styles.buttonText}>Relancer l&apos;application</Text>
          </Pressable>
        </BlurView>
      </LinearGradient>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  card: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.76)",
    backgroundColor: "rgba(255,255,255,0.34)",
    overflow: "hidden",
    maxWidth: 420,
    width: "100%",
  },
  title: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "800",
  },
  description: {
    marginTop: 8,
    color: Colors.textSecondary,
    lineHeight: 20,
    fontSize: 13,
  },
  button: {
    marginTop: 14,
    minHeight: 46,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: "700",
  },
});
