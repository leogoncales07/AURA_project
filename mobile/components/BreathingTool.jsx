import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, cancelAnimation } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useTheme, Fonts, Radius, Spacing } from '../constants/Theme';

export default function BreathingTool() {
    const { colors } = useTheme();
    const [isActive, setIsActive] = useState(false);
    const [phase, setPhase] = useState('Pronto para começar');
    const scale = useSharedValue(1);
    
    const isActiveRef = useRef(isActive);
    useEffect(() => {
        isActiveRef.current = isActive;
    }, [isActive]);

    useEffect(() => {
        let timer1, timer2, timer3;

        const runBreathingCycle = () => {
            if (!isActiveRef.current) return;

            // Phase 1: Inhale (4s)
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setPhase('Inspire...');
            scale.value = withTiming(2.5, { duration: 4000, easing: Easing.inOut(Easing.ease) });
            
            timer1 = setTimeout(() => {
                if (!isActiveRef.current) return;
                
                // Phase 2: Hold (7s)
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                setPhase('Segure...');
                
                timer2 = setTimeout(() => {
                    if (!isActiveRef.current) return;
                    
                    // Phase 3: Exhale (8s)
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setPhase('Expire...');
                    scale.value = withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.ease) });
                    
                    timer3 = setTimeout(() => {
                        if (isActiveRef.current) {
                            runBreathingCycle();
                        }
                    }, 8000);
                }, 7000);
            }, 4000);
        };

        if (isActive) {
            runBreathingCycle();
        } else {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
            setPhase('Pronto para começar');
            cancelAnimation(scale);
            scale.value = withTiming(1, { duration: 500 });
        }

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [isActive]);

    return (
        <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.circleWrapper}>
                {/* The breathing animated circle */}
                <Animated.View 
                    style={[
                        styles.circle, 
                        { backgroundColor: 'rgba(16, 185, 129, 0.15)' }, 
                        useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))
                    ]} 
                />
                {/* Center text overlay */}
                <View style={styles.centerInfo}>
                    <Text style={[styles.phaseText, { color: colors.primary }]}>{phase}</Text>
                    {!isActive && <Text style={[styles.descText, { color: colors.textSecondary }]}>4-7-8 Técnica</Text>}
                </View>
            </View>

            <TouchableOpacity 
                style={[styles.button, { backgroundColor: isActive ? colors.card : colors.primary, borderColor: isActive ? colors.border : 'transparent', borderWidth: 1 }]}
                onPress={() => setIsActive(!isActive)}
                activeOpacity={0.8}
            >
               <Text style={[styles.buttonText, { color: isActive ? colors.textPrimary : '#fff' }]}>
                   {isActive ? 'Parar' : 'Iniciar'}
               </Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: Radius.lg,
        padding: Spacing.xl,
        borderWidth: 1,
        alignItems: 'center',
    },
    circleWrapper: {
        width: 140,
        height: 140,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: Spacing.xl,
    },
    circle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        position: 'absolute',
    },
    centerInfo: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    phaseText: {
        ...Fonts.bold,
        fontSize: 16,
        textAlign: 'center',
    },
    descText: {
        ...Fonts.medium,
        fontSize: 12,
        marginTop: 4,
    },
    button: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: Radius.full,
        alignItems: 'center',
        marginTop: Spacing.lg,
    },
    buttonText: {
        ...Fonts.semibold,
        fontSize: 15,
    }
});
