import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme, Fonts, Spacing, Radius } from '../constants/Theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing, cancelAnimation } from 'react-native-reanimated';
import { Audio } from 'expo-av';

export default function MeditationPlayerModal({ visible, session, onClose }) {
    const { colors, theme } = useTheme();
    const isDark = theme === 'dark';
    const insets = useSafeAreaInsets();
    // session object structure: { title, meta, durationMin, color, emoji, audioUrl }
    const [isPlaying, setIsPlaying] = useState(false);
    const [timeLeft, setTimeLeft] = useState(0);
    const [sound, setSound] = useState(null);

    useEffect(() => {
        if (visible && session) {
            setTimeLeft(session.durationMin * 60);
            setIsPlaying(false);
        } else if (!visible) {
            setIsPlaying(false);
            if (sound) {
                sound.unloadAsync();
                setSound(null);
            }
        }
    }, [visible, session]);

    useEffect(() => {
        const handleAudio = async () => {
            if (isPlaying && session?.audioUrl) {
                if (!sound) {
                    try {
                        const audioSource = typeof session.audioUrl === 'string'
                            ? { uri: session.audioUrl }
                            : session.audioUrl;
                        const { sound: newSound } = await Audio.Sound.createAsync(
                            audioSource,
                            { shouldPlay: true, isLooping: true }
                        );
                        setSound(newSound);
                    } catch (e) {
                        console.log('Audio load error:', e);
                    }
                } else {
                    await sound.playAsync();
                }
            } else if (!isPlaying && sound) {
                try { await sound.pauseAsync(); } catch (e) { /* already unloaded */ }
            }
        };
        handleAudio();
    }, [isPlaying]);

    useEffect(() => {
        return () => { if (sound) sound.unloadAsync(); };
    }, [sound]);

    useEffect(() => {
        let interval;
        if (isPlaying && timeLeft > 0) {
            interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
        } else if (timeLeft === 0) {
            setIsPlaying(false); // Stop when it hits 0
        }
        return () => clearInterval(interval);
    }, [isPlaying, timeLeft]);

    const scale = useSharedValue(1);

    useEffect(() => {
        if (isPlaying) {
            scale.value = withRepeat(
                withSequence(
                    withTiming(1.15, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                true
            );
        } else {
            cancelAnimation(scale);
            scale.value = withTiming(1, { duration: 500 });
        }
    }, [isPlaying]);

    const animatedScaleStyle = useAnimatedStyle(() => ({ 
        transform: [{ scale: scale.value }] 
    }));

    if (!session) return null;

    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    const timeStr = `${mins}:${secs < 10 ? '0' : ''}${secs}`;

    return (
        <Modal visible={visible} transparent animationType="slide">
            <BlurView intensity={isDark ? 90 : 60} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill}>
                <View style={[styles.container, { paddingTop: insets.top + Spacing.xl }]}>
                    
                    {/* Close Area */}
                    <TouchableOpacity style={styles.closeBtn} onPress={() => { setIsPlaying(false); onClose(); }}>
                        <View style={[styles.closeCircle, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={[styles.closeText, { color: colors.textPrimary }]}>✕</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Content Area */}
                    <View style={styles.content}>
                        <Animated.View style={[
                            styles.artwork, 
                            { backgroundColor: session.color + '15', borderColor: session.color + '30' },
                            animatedScaleStyle
                        ]}>
                            <Text style={styles.artworkEmoji}>{session.emoji}</Text>
                        </Animated.View>
                        
                        <Text style={[styles.title, { color: colors.textPrimary }]}>{session.title}</Text>
                        <Text style={[styles.meta, { color: colors.textSecondary }]}>{session.meta}</Text>

                        {/* Interactive Timer */}
                        <Text style={[styles.timer, { color: colors.textPrimary }]}>{timeStr}</Text>

                        {/* Player Controls */}
                        <TouchableOpacity 
                            style={[styles.playBtn, { backgroundColor: session.color }]} 
                            onPress={() => setIsPlaying(!isPlaying)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.playBtnText}>{isPlaying ? 'Pausar' : 'Iniciar Áudio'}</Text>
                        </TouchableOpacity>
                        
                        <Text style={[styles.note, { color: colors.textTertiary }]}>Encontre um local confortável e feche os olhos.</Text>
                    </View>
                </View>
            </BlurView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    closeBtn: {
        alignSelf: 'flex-end',
        marginRight: Spacing.xl,
        marginTop: Spacing.sm,
    },
    closeCircle: {
        width: 40, height: 40, borderRadius: 20,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: StyleSheet.hairlineWidth,
    },
    closeText: { ...Fonts.bold, fontSize: 16 },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
        paddingBottom: height => height * 0.1,
    },
    artwork: {
        width: 200, height: 200, borderRadius: 100,
        alignItems: 'center', justifyContent: 'center',
        borderWidth: 2,
        marginBottom: Spacing.xl,
    },
    artworkEmoji: { fontSize: 80 },
    title: { ...Fonts.heavy, fontSize: 28, textAlign: 'center', marginBottom: 8 },
    meta: { ...Fonts.medium, fontSize: 16, textAlign: 'center', marginBottom: Spacing.xxl },
    timer: { ...Fonts.serif, fontWeight: '600', fontSize: 64, marginBottom: Spacing.xxl, letterSpacing: -2 },
    playBtn: {
        paddingHorizontal: 40,
        paddingVertical: 18,
        borderRadius: Radius.full,
        width: '100%',
        alignItems: 'center',
    },
    playBtnText: { ...Fonts.bold, color: '#fff', fontSize: 18 },
    note: { ...Fonts.regular, fontSize: 14, marginTop: Spacing.xl, textAlign: 'center' },
});
