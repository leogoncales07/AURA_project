"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

/**
 * AnoAI - An ethereal aurora-inspired shader background.
 * Adapted for the Aura project with smooth transitions between light and dark modes.
 * Designed to be elegant and non-intrusive.
 */
const AnoAI = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [theme, setTheme] = useState('dark');

    useEffect(() => {
        // Detect current theme and set up observer
        const updateTheme = () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            setTheme(currentTheme);
        };

        updateTheme();

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    updateTheme();
                }
            });
        });

        observer.observe(document.documentElement, { attributes: true });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!containerRef.current) return;

        const container = containerRef.current;
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        const renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            powerPreference: "high-performance" 
        });
        
        const updateSize = () => {
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        };
        
        updateSize();
        container.appendChild(renderer.domElement);

        const material = new THREE.ShaderMaterial({
            uniforms: {
                iTime: { value: 0 },
                iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
                uDarkMode: { value: theme === 'dark' ? 1.0 : 0.0 }
            },
            transparent: true,
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform float iTime;
                uniform vec2 iResolution;
                uniform float uDarkMode;

                #define NUM_OCTAVES 3

                float rand(vec2 n) {
                    return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453);
                }

                float noise(vec2 p) {
                    vec2 ip = floor(p);
                    vec2 u = fract(p);
                    u = u * u * (3.0 - 2.0 * u);
                    float res = mix(
                        mix(rand(ip), rand(ip + vec2(1.0, 0.0)), u.x),
                        mix(rand(ip + vec2(0.0, 1.0)), rand(ip + vec2(1.0, 1.0)), u.x), u.y);
                    return res * res;
                }

                float fbm(vec2 x) {
                    float v = 0.0;
                    float a = 0.3;
                    vec2 shift = vec2(100);
                    mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
                    for (int i = 0; i < NUM_OCTAVES; ++i) {
                        v += a * noise(x);
                        x = rot * x * 2.0 + shift;
                        a *= 0.4;
                    }
                    return v;
                }

                void main() {
                    // Removed erratic shake/wave effect for a calm atmosphere
                    vec2 p = (gl_FragCoord.xy - iResolution.xy * 0.5) / iResolution.y * mat2(5.0, -3.5, 3.5, 5.0);
                    vec4 o = vec4(0.0);

                    // Reduced f effect complexity for more subtle motion
                    float f = 1.5 + fbm(p + vec2(iTime * 1.2, 0.0)) * 0.4;

                    // Optimized loop for performance and visual clarity (non-overwhelming)
                    for (float i = 0.0; i < 24.0; i++) {
                        float t = iTime * 0.012;
                        vec2 v = p + cos(i * 1.5 + t + i * vec2(13.0, 11.0)) * 2.5; 
                        
                        float tailNoise = fbm(v + vec2(iTime * 0.25, i * 0.1)) * 0.25 * (1.0 - (i / 24.0));
                        
                        vec4 auroraColors;
                        if (uDarkMode > 0.5) {
                            // Dark Mode: Deep Purples and Ethereal Blues
                            auroraColors = vec4(
                                0.15 + 0.2 * sin(i * 0.25 + iTime * 0.3),
                                0.35 + 0.3 * cos(i * 0.35 + iTime * 0.4),
                                0.75 + 0.2 * sin(i * 0.45 + iTime * 0.25),
                                1.0
                            );
                        } else {
                            // Light Mode: Very subtle Lavender and Pale Blue
                            auroraColors = vec4(
                                0.75 + 0.1 * sin(i * 0.2 + iTime * 0.2),
                                0.85 + 0.1 * cos(i * 0.25 + iTime * 0.15),
                                0.98,
                                0.35
                            );
                        }
                        
                        float glow = exp(sin(i * 0.6 + iTime * 0.5)) / length(max(v, vec2(v.x * f * 0.015, v.y * 1.8)));
                        float intensity = smoothstep(0.0, 1.0, i / 24.0) * 0.45;
                        o += auroraColors * glow * (1.0 + tailNoise) * intensity;
                    }

                    // Soft tone mapping
                    o = tanh(pow(o / 75.0, vec4(uDarkMode > 0.5 ? 1.5 : 1.15)));
                    
                    if (uDarkMode > 0.5) {
                        gl_FragColor = vec4(o.rgb * 1.3, o.a);
                    } else {
                        // In light mode, fade towards the white background to be extremely subtle
                        float alpha = o.a * 0.25;
                        gl_FragColor = vec4(o.rgb, alpha);
                    }
                }
            `
        });

        const geometry = new THREE.PlaneGeometry(2, 2);
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        let frameId: number;
        const animate = () => {
            material.uniforms.iTime.value += 0.016;
            // Smoothly transition the dark mode uniform
            material.uniforms.uDarkMode.value = THREE.MathUtils.lerp(
                material.uniforms.uDarkMode.value, 
                theme === 'dark' ? 1.0 : 0.0, 
                0.04
            );
            renderer.render(scene, camera);
            frameId = requestAnimationFrame(animate);
        };
        animate();

        const handleResize = () => {
            updateSize();
            material.uniforms.iResolution.value.set(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', handleResize);

        return () => {
            cancelAnimationFrame(frameId);
            window.removeEventListener('resize', handleResize);
            if (container.contains(renderer.domElement)) {
                container.removeChild(renderer.domElement);
            }
            geometry.dispose();
            material.dispose();
            renderer.dispose();
        };
    }, [theme]);

    return (
        <div 
            ref={containerRef} 
            id="aura-background"
            className="fixed inset-0 -z-10 pointer-events-none overflow-hidden h-screen w-screen"
            aria-hidden="true"
        >
            {/* Gradient mask to blend bottom of screen */}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background opacity-50" />
        </div>
    );
};

export default AnoAI;
