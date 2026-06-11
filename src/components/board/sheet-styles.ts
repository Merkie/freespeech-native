import { StyleSheet } from 'react-native';
import { colors } from '@/lib/theme';

/** Styles shared by the board's modal sheets (edit tile, image search, pages). */
export const sheetStyles = StyleSheet.create({
	sheet: { flex: 1, backgroundColor: colors.background },
	content: { padding: 20, gap: 10 },
	input: {
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 10,
		paddingVertical: 10,
		paddingHorizontal: 14,
		fontSize: 16,
		color: colors.text
	},
	smallButton: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6,
		paddingVertical: 10,
		paddingHorizontal: 14,
		borderRadius: 10,
		backgroundColor: colors.surface,
		borderWidth: 1,
		borderColor: colors.border
	},
	smallButtonText: { color: colors.text, fontSize: 14, fontWeight: '600' },
	buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	error: { color: colors.danger, fontSize: 14, marginTop: 6 }
});
