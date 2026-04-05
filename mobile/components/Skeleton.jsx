import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
} from 'react-native-reanimated';
import { useTheme } from '../constants/Theme';

export default function Skeleton({ width, height, borderRadius = 8, style }) {
    const { colors, theme } = useTheme();
    const isDark = theme === 'dark';
    const opacity = useSharedValue(0.3);

    useEffect(() => {
        opacity.value = withRepeat(
            withSequence(
                withTiming(0.7, { duration: 800 }),
                withTiming(0.3, { duration: 800 })
            ),
            -1,
            true
        );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const backgroundColor = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)';

    return (
        <Animated.View
            style={[
                { width, height, borderRadius, backgroundColor },
                style,
                animatedStyle,
            ]}
        />
    );
}
