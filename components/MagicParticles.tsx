import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import Colors from '@/constants/colors';

const { width, height } = Dimensions.get('window');

interface Particle {
  x: number;
  y: number;
  size: number;
  opacity: Animated.Value;
  translateY: Animated.Value;
  color: string;
}

export default function MagicParticles() {
  const particles = useRef<Particle[]>([]);

  useEffect(() => {
    const colors = [Colors.accent, Colors.glowLight, Colors.glow, '#ffffff'];
    
    particles.current = Array.from({ length: 20 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 4 + 2,
      opacity: new Animated.Value(Math.random()),
      translateY: new Animated.Value(0),
      color: colors[Math.floor(Math.random() * colors.length)],
    }));

    particles.current.forEach((particle, index) => {
      const duration = 3000 + Math.random() * 2000;
      const delay = index * 150;

      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.sequence([
              Animated.timing(particle.opacity, {
                toValue: 0.8,
                duration: duration / 2,
                useNativeDriver: true,
              }),
              Animated.timing(particle.opacity, {
                toValue: 0.1,
                duration: duration / 2,
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(particle.translateY, {
                toValue: -30,
                duration: duration,
                useNativeDriver: true,
              }),
              Animated.timing(particle.translateY, {
                toValue: 0,
                duration: 0,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ])
      ).start();
    });
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      {particles.current.map((particle, index) => (
        <Animated.View
          key={index}
          style={[
            styles.particle,
            {
              left: particle.x,
              top: particle.y,
              width: particle.size,
              height: particle.size,
              backgroundColor: particle.color,
              opacity: particle.opacity,
              transform: [{ translateY: particle.translateY }],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  particle: {
    position: 'absolute',
    borderRadius: 50,
  },
});
