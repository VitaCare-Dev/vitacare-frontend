import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { IconImage } from "@/components/IconImage";
import { ScreenContainer } from "@/components/ScreenContainer";
import { ScreenHeader } from "@/components/ScreenHeader";
import { messages } from "@/data/mockData";
import { VitaCareTheme } from "@/theme/theme";

export default function AssistantScreen() {
  const [text, setText] = useState("");

  return (
    <ScreenContainer scrollable>
      <ScreenHeader showBackButton title="VitaCare IA" />
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <IconImage name="chatbot" size={24} />
          <Text style={styles.brand}>Asistente</Text>
        </View>
        <Text style={styles.subtitle}>
          La información entregada es orientativa y no reemplaza atención
          médica.
        </Text>
      </View>

      <View style={styles.chatArea}>
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
            <Text style={styles.time}>{message.time}</Text>
          </View>
        ))}
      </View>

      <View style={styles.composer}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Escribe tu mensaje"
          placeholderTextColor="#9BAAA6"
          style={styles.input}
        />
        <Pressable style={styles.sendButton} onPress={() => setText("")}>
          <IconImage name="agregar" tone="white" size={18} />
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: VitaCareTheme.spacing.sm,
  },
  brandRow: {
    backgroundColor: VitaCareTheme.colors.secondary,
    borderRadius: VitaCareTheme.radius.lg,
    paddingHorizontal: VitaCareTheme.spacing.md,
    paddingVertical: VitaCareTheme.spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: VitaCareTheme.spacing.sm,
  },
  brand: {
    color: VitaCareTheme.colors.surface,
    fontSize: VitaCareTheme.typography.subheading,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "800",
  },
  subtitle: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: VitaCareTheme.typography.small,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
  chatArea: {
    gap: VitaCareTheme.spacing.sm,
    minHeight: 300,
  },
  assistantBubble: {
    alignSelf: "flex-start",
    maxWidth: "82%",
    backgroundColor: VitaCareTheme.colors.surfaceAlt,
    borderRadius: VitaCareTheme.radius.md,
    padding: VitaCareTheme.spacing.md,
    gap: 4,
    borderWidth: 1,
    borderColor: "#B6DDD2",
  },
  userBubble: {
    alignSelf: "flex-end",
    maxWidth: "82%",
    backgroundColor: VitaCareTheme.colors.surface,
    borderRadius: VitaCareTheme.radius.md,
    padding: VitaCareTheme.spacing.md,
    gap: 4,
    borderWidth: 1,
    borderColor: VitaCareTheme.colors.border,
  },
  bubbleText: {
    color: VitaCareTheme.colors.text,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
  time: {
    color: VitaCareTheme.colors.textMuted,
    fontSize: 11,
    fontFamily: VitaCareTheme.typography.fontFamily,
    alignSelf: "flex-end",
  },
  composer: {
    flexDirection: "row",
    alignItems: "center",
    gap: VitaCareTheme.spacing.sm,
    backgroundColor: VitaCareTheme.colors.surface,
    borderWidth: 1,
    borderColor: VitaCareTheme.colors.border,
    borderRadius: VitaCareTheme.radius.lg,
    padding: VitaCareTheme.spacing.sm,
    ...VitaCareTheme.shadow.card,
  },
  input: {
    flex: 1,
    minHeight: 48,
    paddingHorizontal: VitaCareTheme.spacing.sm,
    color: VitaCareTheme.colors.text,
    fontSize: VitaCareTheme.typography.body,
    fontFamily: VitaCareTheme.typography.fontFamily,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: VitaCareTheme.colors.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
});
