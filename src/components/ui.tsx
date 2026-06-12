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
import { Icon } from '@/components/icons/Icon';
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

/** Modal sheet header: title on the left, close button on the right. */
export function SheetHeader({ title, onClose }: { title: string; onClose: () => void }) {
	return (
		<View style={styles.sheetHeader}>
			<Text style={styles.sheetTitle}>{title}</Text>
			<Pressable onPress={onClose} hitSlop={8}>
				<Icon name="x-lg" size={18} color={colors.textMuted} />
			</Pressable>
		</View>
	);
}

export function Chip({
	label,
	active,
	onPress
}: {
	label: string;
	active: boolean;
	onPress: () => void;
}) {
	return (
		<Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
			<Text style={[styles.chipText, active && { color: '#fff' }]} numberOfLines={1}>
				{label}
			</Text>
		</Pressable>
	);
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
	},
	sheetHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 6
	},
	sheetTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
	chip: {
		paddingVertical: 8,
		paddingHorizontal: 14,
		borderRadius: 999,
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		maxWidth: 180
	},
	chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
	chipText: { color: colors.text, fontSize: 14, fontWeight: '500' }
});
