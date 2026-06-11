import {
	ActivityIndicator,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
	type StyleProp,
	type TextInputProps,
	type ViewStyle
} from 'react-native';
import { colors } from '@/lib/theme';

export function Button({
	title,
	onPress,
	variant = 'primary',
	loading = false,
	disabled = false,
	style
}: {
	title: string;
	onPress: () => void;
	variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
	loading?: boolean;
	disabled?: boolean;
	style?: StyleProp<ViewStyle>;
}) {
	const isDisabled = disabled || loading;
	return (
		<Pressable
			onPress={onPress}
			disabled={isDisabled}
			style={({ pressed }) => [
				styles.button,
				variant === 'primary' && { backgroundColor: colors.primary },
				variant === 'secondary' && {
					backgroundColor: colors.surface,
					borderWidth: 1,
					borderColor: colors.border
				},
				variant === 'danger' && { backgroundColor: colors.danger },
				variant === 'ghost' && { backgroundColor: 'transparent' },
				pressed && { opacity: 0.7 },
				isDisabled && { opacity: 0.5 },
				style
			]}
		>
			{loading ? (
				<ActivityIndicator color={variant === 'secondary' || variant === 'ghost' ? colors.text : '#fff'} />
			) : (
				<Text
					style={[
						styles.buttonText,
						(variant === 'secondary' || variant === 'ghost') && { color: colors.text }
					]}
				>
					{title}
				</Text>
			)}
		</Pressable>
	);
}

export function Field(props: TextInputProps & { label?: string }) {
	const { label, style, ...rest } = props;
	return (
		<View style={{ gap: 6 }}>
			{label ? <Text style={styles.label}>{label}</Text> : null}
			<TextInput
				placeholderTextColor={colors.textFaint}
				style={[styles.input, style]}
				{...rest}
			/>
		</View>
	);
}

export function ErrorText({ children }: { children: string | null }) {
	if (!children) return null;
	return <Text style={styles.error}>{children}</Text>;
}

const styles = StyleSheet.create({
	button: {
		alignItems: 'center',
		justifyContent: 'center',
		borderRadius: 10,
		paddingVertical: 14,
		paddingHorizontal: 18
	},
	buttonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: '600'
	},
	label: {
		fontSize: 14,
		fontWeight: '500',
		color: colors.textMuted
	},
	input: {
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 10,
		paddingVertical: 12,
		paddingHorizontal: 14,
		fontSize: 16,
		color: colors.text
	},
	error: {
		color: colors.danger,
		fontSize: 14
	}
});
