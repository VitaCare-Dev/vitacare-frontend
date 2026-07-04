import { Picker } from "@react-native-picker/picker";
import { StyleSheet, Text, View } from "react-native";

import type { VitaCareThemeType } from "@/theme/theme";
import { useTheme } from "@/theme/ThemeContext";

export type AppPickerOption = { label: string; value: string };

type AppPickerFieldProps = Readonly<{
  label: string;
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
  options: AppPickerOption[];
  enabled?: boolean;
  errorMessage?: string;
}>;

export function AppPickerField({
  label,
  placeholder,
  value,
  onValueChange,
  options,
  enabled = true,
  errorMessage,
}: AppPickerFieldProps) {
  const theme = useTheme();
  const styles = createStyles(theme);
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.pickerContainer,
          !enabled && styles.pickerDisabled,
          errorMessage && styles.pickerContainerError,
        ]}
      >
        <Picker
          selectedValue={value}
          onValueChange={(itemValue) => onValueChange(String(itemValue))}
          enabled={enabled}
          dropdownIconColor={theme.colors.text}
        >
          <Picker.Item label={placeholder} value="" color={theme.colors.textMuted} />
          {options.map((option) => (
            <Picker.Item
              key={option.value}
              label={option.label}
              value={option.value}
              color={theme.colors.text}
            />
          ))}
        </Picker>
      </View>
      {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
    </View>
  );
}

function createStyles(theme: VitaCareThemeType) {
  return StyleSheet.create({
    wrapper: {
      gap: theme.spacing.xs,
    },
    label: {
      fontSize: theme.typography.small,
      color: theme.colors.textMuted,
      fontFamily: theme.typography.fontFamily,
      fontWeight: "600",
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
      justifyContent: "center",
    },
    pickerDisabled: {
      backgroundColor: theme.colors.background,
    },
    pickerContainerError: {
      borderColor: "#B54444",
    },
    errorText: {
      color: "#B54444",
      fontSize: theme.typography.small,
      fontFamily: theme.typography.fontFamily,
    },
  });
}
