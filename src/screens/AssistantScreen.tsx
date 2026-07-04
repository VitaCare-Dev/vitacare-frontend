import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { IconImage } from "@/components/IconImage";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { ApiError, apiPost } from "@/services/apiClient";
import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";

type ChatBubble = {
  id: string;
  sender: "user" | "assistant";
  text: string;
};

/** La llamada del BFF a Groq es sincrónica y con reintentos ante 429: puede tardar bastante más que una request normal. */
const CHAT_TIMEOUT_MS = 45000;

/**
 * GroqService (chatbot-service) le agrega al texto de la respuesta un bloque
 * con el conteo de tokens ("\n\n--- Información de uso ---\n..."), pensado
 * para quedar registrado en BD, no para mostrárselo al usuario. Es opcional
 * (solo aparece si Groq devolvió el objeto "usage").
 */
function stripUsageInfo(respuesta: string): string {
  return respuesta.replace(/\n\n---\s*Información de uso\s*---[\s\S]*$/i, "").trim();
}

export default function AssistantScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<ChatBubble[]>([
    {
      id: "welcome",
      sender: "assistant",
      text: "Hola, soy tu asistente de VitaCare. ¿En qué puedo ayudarte hoy?",
    },
  ]);
  const scrollRef = useRef<ScrollView>(null);
  const [androidKeyboardHeight, setAndroidKeyboardHeight] = useState(0);

  // En Android, KeyboardAvoidingView (behavior "height") no calcula bien el
  // espacio dentro de Expo Go (el windowSoftInputMode nativo no se puede
  // configurar sin un build propio), así que se ajusta a mano con la altura
  // real del teclado reportada por estos eventos.
  useEffect(() => {
    if (Platform.OS !== "android") return;

    const showSub = Keyboard.addListener("keyboardDidShow", (event) => {
      setAndroidKeyboardHeight(event.endCoordinates.height);
    });
    const hideSub = Keyboard.addListener("keyboardDidHide", () => {
      setAndroidKeyboardHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const sendMutation = useMutation({
    mutationFn: (mensaje: string) =>
      apiPost<{ respuesta: string }>("/api/chat", { mensaje }, CHAT_TIMEOUT_MS),
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { id: `assistant-${Date.now()}`, sender: "assistant", text: stripUsageInfo(data.respuesta) },
      ]);
    },
    onError: (error) => {
      const message =
        error instanceof ApiError ? error.message : "No se pudo contactar al asistente.";
      Alert.alert("Error", message);
    },
  });

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sendMutation.isPending) return;

    setMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, sender: "user", text: trimmed },
    ]);
    setText("");
    sendMutation.mutate(trimmed);
  }

  return (
    <ScreenContainer scrollable={false} contentStyle={styles.screenContent}>
      <ScreenHeader showBackButton title="VitaCare IA" />
      <View style={styles.header}>
        <Text style={styles.subtitle}>
          La información entregada es orientativa y no reemplaza atención
          médica.
        </Text>
      </View>

      <KeyboardAvoidingView
        style={[styles.flex, { paddingBottom: androidKeyboardHeight }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.chatArea}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((message) => (
            <View
              key={message.id}
              style={
                message.sender === "user"
                  ? styles.userBubble
                  : styles.assistantBubble
              }
            >
              <Text style={styles.bubbleText}>{message.text}</Text>
            </View>
          ))}
          {sendMutation.isPending ? (
            <View style={styles.assistantBubble}>
              <ActivityIndicator color={theme.colors.secondary} />
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Escribe tu mensaje"
            placeholderTextColor="#9BAAA6"
            style={styles.input}
            editable={!sendMutation.isPending}
            onSubmitEditing={handleSend}
          />
          <Pressable
            style={[styles.sendButton, sendMutation.isPending && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={sendMutation.isPending}
          >
            <IconImage name="agregar" tone="white" size={18} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

function createStyles(theme: VitaCareThemeType) {
  return StyleSheet.create({
  screenContent: {
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.md,
  },
  flex: {
    flex: 1,
  },
  header: {
    gap: theme.spacing.sm,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.small,
    fontFamily: theme.typography.fontFamily,
  },
  chatArea: {
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    maxWidth: "82%",
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: 4,
    borderWidth: 1,
    borderColor: "#B6DDD2",
  },
  userBubble: {
    alignSelf: "flex-end",
    maxWidth: "82%",
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    gap: 4,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  bubbleText: {
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontFamily: theme.typography.fontFamily,
  },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.sm,
    marginTop: theme.spacing.sm,
    ...theme.shadow.card,
  },
  input: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: theme.spacing.sm,
    color: theme.colors.text,
    fontSize: theme.typography.body,
    fontFamily: theme.typography.fontFamily,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});
}
