import { Picker } from "@react-native-picker/picker";
import { StyleSheet, Text, View } from "react-native";

import { VitaCareTheme } from "@/theme/theme";

export type AppPickerOption = { label: string; value: string };

type AppPickerFieldProps = Readonly<{
  label: string;
  placeholder: string;
  value: string;
  onValueChange: (value: string) => void;
  options: AppPickerOption[];
  enabled?: boolean;
}>;

export function AppPickerField({
  label,
  placeholder,
  value,
  onValueChange,
  options,
  enabled = true,
}: AppPickerFieldProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.pickerContainer, !enabled && styles.pickerDisabled]}>
        <Picker
          selectedValue={value}
          onValueChange={(itemValue) => onValueChange(String(itemValue))}
          enabled={enabled}
        >
          <Picker.Item label={placeholder} value="" />
          {options.map((option) => (
            <Picker.Item key={option.value} label={option.label} value={option.value} />
          ))}
        </Picker>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: VitaCareTheme.spacing.xs,
  },
  label: {
    fontSize: VitaCareTheme.typography.small,
    color: VitaCareTheme.colors.textMuted,
    fontFamily: VitaCareTheme.typography.fontFamily,
    fontWeight: "600",
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: VitaCareTheme.colors.border,
    borderRadius: VitaCareTheme.radius.md,
    backgroundColor: VitaCareTheme.colors.surface,
    justifyContent: "center",
  },
  pickerDisabled: {
    backgroundColor: VitaCareTheme.colors.background,
  },
});
